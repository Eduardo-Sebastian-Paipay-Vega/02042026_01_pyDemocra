import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent } from './ui/dialog';
import { downloadCertificatePdf } from '../utils/certificatePdf';
import logoUrl from '../assets/voluntariado-logo.svg';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  RefreshCw,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';

interface Volunteer {
  id: string;
  dni: string;
  name: string;
  email: string;
  phone: string;
  areaId: string;
  availability: string[];
  status: 'active' | 'inactive';
  id_estado?: number | null;
  estado?: string | null;
  estadoLabel?: string | null;
  estadoDescripcion?: string | null;
  estadoColor?: string | null;
  totalHours: number;
  totalActivities: number;
  createdAt: string;
}

interface VolunteerDbRecord {
  id_usuario: string | number;
  dni?: string | null;
  nombre_completo?: string | null;
  correo?: string | null;
  telefono?: string | null;
  id_area?: string | number | null;
  disponibilidad?: string[] | string | null;
  estado?: string | null;
  id_estado?: number | null;
  estado_color?: string | null;
  estado_descripcion?: string | null;
  horas_totales?: number | null;
  actividades_totales?: number | null;
}

interface EstadoOption {
  id_estado: number;
  nombre: string;
  ambito: string;
  color?: string | null;
  descripcion?: string | null;
}

interface Activity {
  id: string;
  title: string;
  startDate: string;
  duration: number;
  responsibleName: string;
}

interface EvidenceItem {
  id_evidencia: number;
  url_archivo: string | null;
  // Compat: algunos payloads pueden traer nombres KoBo directos.
  download_url?: string | null;
  download_large_url?: string | null;
  tipo_archivo: string | null;
  nombre_original: string | null;
  fecha_subida: string | null;
}

interface HoursHistoryItem {
  id_actividad: number;
  id_usuario: number;
  horas_total: number;
  kobo_submission_id: string | null;
  fecha_ultima_actualizacion: string | null;
  // Compat: algunos payloads pueden enviar la descripcion en el item (no anidada).
  descripcion?: string | null;
  actividad: {
    id_actividad: number | null;
    codigo: string | null;
    titulo: string | null;
    descripcion?: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    evidencias?: EvidenceItem[];
  } | null;
}

function AuthorizedImage({
  url,
  alt,
  accessToken,
  className,
  loadingClassName,
  errorClassName,
  spinnerClassName,
  errorTextClassName,
  errorMessage,
}: {
  url: string;
  alt: string;
  accessToken?: string | null;
  className?: string;
  loadingClassName?: string;
  errorClassName?: string;
  spinnerClassName?: string;
  errorTextClassName?: string;
  errorMessage?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !accessToken) {
      setLoading(false);
      setError(null);
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const controller = new AbortController();
    let localObjectUrl: string | null = null;

    setLoading(true);
    setError(null);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    (async () => {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: 'Bearer ' + publicAnonKey,
            'X-Access-Token': accessToken,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(body ? `${res.status} ${res.statusText}: ${body}` : `${res.status} ${res.statusText}`);
        }

        const blob = await res.blob();
        localObjectUrl = URL.createObjectURL(blob);
        if (controller.signal.aborted) return;
        setObjectUrl(localObjectUrl);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.message || 'No se pudo cargar la imagen');
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    };
  }, [url, accessToken]);

  if (loading) {
    return (
      <div className={loadingClassName || ''} aria-label="Cargando evidencia">
        <div
          className={
            spinnerClassName || 'h-5 w-5 border-2 border-gray-300 border-t-gray-700 animate-spin rounded-full'
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={errorClassName || ''} title={error}>
        <span className={errorTextClassName || 'text-xs text-gray-400'}>
          {errorMessage || 'No se pudo cargar la evidencia'}
        </span>
      </div>
    );
  }

  if (!objectUrl) {
    return <div className={loadingClassName || ''} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}

interface Area {
  id: string;
  name: string;
  color: string;
  estado?: string;
}

interface VolunteerManagementProps {
  readOnly?: boolean;
}

const normalizeEstadoKey = (value?: string | null): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const mapDbVolunteerStatus = (status?: string | null): Volunteer['status'] => {
  const normalized = normalizeEstadoKey(status);
  if (normalized === 'activo' || normalized === 'active') return 'active';
  return 'inactive';
};

const AVAILABILITY_DAYS = [
  { key: 'L', label: 'Lunes' },
  { key: 'M', label: 'Martes' },
  { key: 'X', label: 'Miercoles' },
  { key: 'J', label: 'Jueves' },
  { key: 'V', label: 'Viernes' },
  { key: 'S', label: 'Sabado' },
  { key: 'D', label: 'Domingo' },
] as const;

const AVAILABILITY_DAY_SET = new Set(AVAILABILITY_DAYS.map((day) => day.key));

const normalizeAvailability = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .replace(/[{}"]/g, '')
          .split(/[,\s]+/)
          .filter(Boolean)
      : [];

  const requestedDays = new Set(
    rawValues
      .map((day) => String(day).trim().toUpperCase())
      .filter((day) => AVAILABILITY_DAY_SET.has(day)),
  );

  return AVAILABILITY_DAYS.map((day) => day.key).filter((key) => requestedDays.has(key));
};

export default function VolunteerManagement({ readOnly = false }: VolunteerManagementProps) {
  const { accessToken } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [estadosGeneral, setEstadosGeneral] = useState<EstadoOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [volunteerActivities, setVolunteerActivities] = useState<Activity[]>([]);
  const [hoursHistory, setHoursHistory] = useState<HoursHistoryItem[]>([]);
  const [loadingHoursHistory, setLoadingHoursHistory] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState<{ url: string; name?: string | null } | null>(null);

  const [syncingVolunteerId, setSyncingVolunteerId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAnyModalOpen = showModal || showDetailModal || evidenceOpen;

  const closeEvidence = () => {
    setEvidenceOpen(false);
    setEvidence(null);
  };

  const [formData, setFormData] = useState({
    dni: '',
    name: '',
    email: '',
    phone: '',
    areaId: '',
    availability: [] as string[],
    status: 'active' as 'active' | 'inactive',
    statusId: '',
  });

  const estadoGeneralById = new Map<number, EstadoOption>(
    estadosGeneral.map((estado) => [Number(estado.id_estado), estado]),
  );
  const estadoGeneralByKey = new Map<string, EstadoOption>(
    estadosGeneral.map((estado) => [normalizeEstadoKey(estado.nombre), estado]),
  );

  const estadosGeneralOrdenados = [...estadosGeneral].sort((a, b) => {
    const aKey = normalizeEstadoKey(a.nombre);
    const bKey = normalizeEstadoKey(b.nombre);
    if (aKey === bKey) return 0;
    if (aKey === 'activo') return -1;
    if (bKey === 'activo') return 1;
    if (aKey === 'inactivo') return -1;
    if (bKey === 'inactivo') return 1;
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  });

  const getStatusFromEstado = (estadoNombre?: string | null): Volunteer['status'] => {
    return mapDbVolunteerStatus(estadoNombre);
  };

  const getStatusFromEstadoId = (estadoId?: number | null): Volunteer['status'] => {
    if (!estadoId) return 'inactive';
    const option = estadoGeneralById.get(Number(estadoId));
    return getStatusFromEstado(option?.nombre || null);
  };

  const getEstadoIdFromStatus = (status: Volunteer['status']): number | null => {
    const targetName = status === 'active' ? 'activo' : 'inactivo';
    const found = estadosGeneral.find((estado) => normalizeEstadoKey(estado.nombre) === targetName);
    return found ? Number(found.id_estado) : null;
  };

  const resolveEstadoOption = (idEstado?: number | null, estadoNombre?: string | null): EstadoOption | null => {
    if (idEstado && estadoGeneralById.has(Number(idEstado))) {
      return estadoGeneralById.get(Number(idEstado)) || null;
    }
    const key = normalizeEstadoKey(estadoNombre);
    if (!key) return null;
    return estadoGeneralByKey.get(key) || null;
  };

  const getVolunteerStatusMeta = (volunteer: Volunteer) => {
    const estadoOption = resolveEstadoOption(volunteer.id_estado, volunteer.estadoLabel || volunteer.estado || null);
    const status = estadoOption
      ? getStatusFromEstado(estadoOption.nombre)
      : volunteer.status;
    const label = estadoOption?.nombre || volunteer.estadoLabel || (status === 'active' ? 'Activo' : 'Inactivo');
    const description = estadoOption?.descripcion || volunteer.estadoDescripcion || null;
    const color = estadoOption?.color || volunteer.estadoColor || (status === 'active' ? '#16a34a' : '#6b7280');
    const idEstado = estadoOption?.id_estado || volunteer.id_estado || getEstadoIdFromStatus(status);
    return { status, label, description, color, idEstado };
  };

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAnyModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (!showModal || selectedVolunteer) return;
    if (formData.statusId) return;
    const activeEstado = estadosGeneral.find((estado) => normalizeEstadoKey(estado.nombre) === 'activo');
    const activeStatusId = activeEstado ? Number(activeEstado.id_estado) : null;
    if (!activeStatusId) return;

    setFormData((prev) => ({
      ...prev,
      status: 'active',
      statusId: String(activeStatusId),
    }));
  }, [showModal, selectedVolunteer, estadosGeneral, formData.statusId]);

  const loadData = async () => {
    if (!accessToken) {
      console.log('No hay accessToken disponible, saltando carga de datos');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Cargando voluntarios y áreas...');
      const [volunteersRes, areasRes, estadosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/voluntarios`, {
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken 
          }
        }),
        fetch(`${API_BASE_URL}/areas`, {
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken 
          }
        }),
        fetch(`${API_BASE_URL}/estados?ambito=general`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken,
          }
        })
      ]);

      if (!volunteersRes.ok || !areasRes.ok || !estadosRes.ok) {
        const [volunteersErrorBody, areasErrorBody, estadosErrorBody] = await Promise.all([
          volunteersRes.ok ? Promise.resolve(null) : volunteersRes.json().catch(() => null),
          areasRes.ok ? Promise.resolve(null) : areasRes.json().catch(() => null),
          estadosRes.ok ? Promise.resolve(null) : estadosRes.json().catch(() => null),
        ]);

        console.error('Error en respuesta:', {
          volunteersStatus: volunteersRes.status,
          areasStatus: areasRes.status,
          estadosStatus: estadosRes.status,
          volunteersError: volunteersErrorBody?.error || volunteersErrorBody,
          areasError: areasErrorBody?.error || areasErrorBody,
          estadosError: estadosErrorBody?.error || estadosErrorBody,
        });

        throw new Error(
          `voluntarios(${volunteersRes.status}${volunteersErrorBody?.error ? ` - ${volunteersErrorBody.error}` : ''}), areas(${areasRes.status}${areasErrorBody?.error ? ` - ${areasErrorBody.error}` : ''}), estados(${estadosRes.status}${estadosErrorBody?.error ? ` - ${estadosErrorBody.error}` : ''})`,
        );
      }

      const volunteersData = await volunteersRes.json();
      const areasData = await areasRes.json();
      const estadosData = await estadosRes.json();

      const normalizedEstados = ((estadosData.estados || []) as EstadoOption[])
        .map((estado) => ({ ...estado, id_estado: Number(estado.id_estado) }))
        .filter((estado) => Number.isInteger(estado.id_estado) && estado.id_estado > 0);

      const estadosById = new Map<number, EstadoOption>(
        normalizedEstados.map((estado) => [estado.id_estado, estado]),
      );
      const estadosByName = new Map<string, EstadoOption>(
        normalizedEstados.map((estado) => [normalizeEstadoKey(estado.nombre), estado]),
      );

      const normalizedVolunteers = ((volunteersData.voluntarios || []) as VolunteerDbRecord[]).map((volunteer) => {
        const estadoInfoById = volunteer.id_estado ? estadosById.get(Number(volunteer.id_estado)) : undefined;
        const estadoInfoByName = volunteer.estado
          ? estadosByName.get(normalizeEstadoKey(volunteer.estado))
          : undefined;
        const estadoInfo = estadoInfoById || estadoInfoByName;
        const estadoNombre = estadoInfo?.nombre || volunteer.estado || '';

        return {
          id: String(volunteer.id_usuario),
          dni: volunteer.dni || '',
          name: volunteer.nombre_completo || '',
          email: volunteer.correo || '',
          phone: volunteer.telefono || '',
          areaId: volunteer.id_area ? String(volunteer.id_area) : '',
          availability: normalizeAvailability(volunteer.disponibilidad),
          status: getStatusFromEstado(estadoNombre),
          id_estado: estadoInfo?.id_estado || (volunteer.id_estado ? Number(volunteer.id_estado) : null),
          estado: estadoNombre || null,
          estadoLabel: estadoInfo?.nombre || estadoNombre || null,
          estadoDescripcion: estadoInfo?.descripcion || volunteer.estado_descripcion || null,
          estadoColor: estadoInfo?.color || volunteer.estado_color || null,
          totalHours: Number(volunteer.horas_totales || 0),
          totalActivities: Number(volunteer.actividades_totales || 0),
          createdAt: new Date().toISOString(),
        };
      });

      const normalizedAreas = (areasData.areas || [])
        .map((area: any) => ({
          id: String(area.id_area),
          name: area.nombre,
          color: area.color || '#3b82f6',
          estado: area.estado || null,
        }));

      console.log('Datos cargados:', {
        volunteers: normalizedVolunteers.length,
        areas: normalizedAreas.length
      });

      setVolunteers(normalizedVolunteers);
      setAreas(normalizedAreas);
      setEstadosGeneral(normalizedEstados);
    } catch (error) {
      console.error('Error al cargar voluntarios:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al cargar datos: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadVolunteerDetails = async (volunteerId: string) => {
    if (!accessToken) {
      alert('No hay sesión activa');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/volunteers/${volunteerId}`, {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken 
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();

      const volunteerData = data.volunteer as Partial<Volunteer> | undefined;
      if (!volunteerData) {
        throw new Error('No se recibieron datos del voluntario');
      }

      const resolvedEstadoOption = resolveEstadoOption(
        volunteerData.id_estado ? Number(volunteerData.id_estado) : null,
        volunteerData.estadoLabel || volunteerData.estado || null,
      );
      const resolvedStatus = resolvedEstadoOption
        ? getStatusFromEstado(resolvedEstadoOption.nombre)
        : getStatusFromEstado(volunteerData.estadoLabel || volunteerData.estado || '');

      setSelectedVolunteer({
        ...volunteerData,
        id: String(volunteerData.id || ''),
        dni: volunteerData.dni || '',
        name: volunteerData.name || '',
        email: volunteerData.email || '',
        phone: volunteerData.phone || '',
        areaId: volunteerData.areaId || '',
        availability: normalizeAvailability(volunteerData?.availability),
        status: resolvedStatus,
        id_estado: resolvedEstadoOption?.id_estado || (volunteerData.id_estado ? Number(volunteerData.id_estado) : null),
        estado: resolvedEstadoOption?.nombre || volunteerData.estado || null,
        estadoLabel: resolvedEstadoOption?.nombre || volunteerData.estadoLabel || volunteerData.estado || null,
        estadoDescripcion: resolvedEstadoOption?.descripcion || volunteerData.estadoDescripcion || null,
        estadoColor: resolvedEstadoOption?.color || volunteerData.estadoColor || null,
        totalHours: Number(volunteerData.totalHours || 0),
        totalActivities: Number(volunteerData.totalActivities || 0),
        createdAt: volunteerData.createdAt || new Date().toISOString(),
      });
      setVolunteerActivities(data.activities || []);
      setShowDetailModal(true);
      void fetchVolunteerHoursHistory(volunteerId);
    } catch (error) {
      console.error('Error al cargar detalles del voluntario:', error);
      alert('Error al cargar detalles del voluntario');
    }
  };

  const fetchVolunteerHoursHistory = async (volunteerId: string) => {
    if (!accessToken) return;

    setLoadingHoursHistory(true);
    setHoursHistory([]);
    try {
      const url = `${API_BASE_URL}/voluntarios/${volunteerId}/historial-horas`;
      console.log('historial url', url);
      const res = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + publicAnonKey,
          'X-Access-Token': accessToken,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Error ' + res.status + ' al cargar historial');
      }

      setHoursHistory((data.items || []) as HoursHistoryItem[]);
    } catch (error: any) {
      console.error('Error cargando historial de horas:', error);
      setHoursHistory([]);
    } finally {
      setLoadingHoursHistory(false);
    }
  };

  const syncKoboForVolunteer = async (volunteer: Volunteer) => {
    if (!accessToken) {
      toast.error('No hay sesion activa');
      return;
    }

    const idUsuario = Number(volunteer.id);
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      toast.error('ID de voluntario invalido');
      return;
    }

    setSyncingVolunteerId(volunteer.id);
    try {
      const url = `${API_BASE_URL}/kobo/sync/voluntario`;
      console.log('sync url', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + publicAnonKey,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_usuario: idUsuario }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error || data?.result?.errorMessage || 'Error ' + res.status + ' en sync KoBo',
        );
      }

      const result = data.result || {};
      toast.success(
        'KoBo: ' +
          (result.nuevos ?? 0) +
          ' nuevos / ' +
          (result.total_kobo ?? 0) +
          ' en KoBo, +' +
          (result.horas_nuevas ?? 0) +
          'h. Total BD: ' +
          (result.horas_total_bd ?? '-') +
          'h',
      );

      await loadData();

      if (showDetailModal && selectedVolunteer?.id === volunteer.id) {
        void loadVolunteerDetails(volunteer.id);
      }
    } catch (error: any) {
      console.error('Error en sync KoBo:', error);
      toast.error(error?.message || 'Error en sincronizacion KoBo');
    } finally {
      setSyncingVolunteerId(null);
    }
  };

  const createOrUpdateVolunteer = async () => {
    if (!accessToken) {
      alert('No hay sesión activa');
      return;
    }
    
    try {
      const isEditing = Boolean(selectedVolunteer);
      const parsedAreaId = formData.areaId.trim() ? Number(formData.areaId) : null;
      const parsedStatusId = formData.statusId.trim() ? Number(formData.statusId) : null;

      const url = isEditing
        ? `${API_BASE_URL}/volunteers/${selectedVolunteer!.id}`
        : `${API_BASE_URL}/voluntarios`;

      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? {
            name: formData.name.trim(),
            dni: formData.dni.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            areaId: parsedAreaId !== null && Number.isFinite(parsedAreaId) ? parsedAreaId : null,
            availability: normalizeAvailability(formData.availability),
            id_estado: parsedStatusId !== null && Number.isFinite(parsedStatusId) ? parsedStatusId : null,
            status: formData.status,
          }
        : {
            nombre_completo: formData.name.trim(),
            dni: formData.dni.trim(),
            correo: formData.email.trim() || null,
            telefono: formData.phone.trim() || null,
            id_area: parsedAreaId !== null && Number.isFinite(parsedAreaId) ? parsedAreaId : null,
            disponibilidad: normalizeAvailability(formData.availability),
            id_estado: parsedStatusId !== null && Number.isFinite(parsedStatusId) ? parsedStatusId : null,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error || 'No se pudo guardar el voluntario');
      }

      alert(isEditing ? 'Voluntario actualizado' : 'Voluntario creado en usuarios');
      setShowModal(false);
      setSelectedVolunteer(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error al guardar voluntario:', error);
      alert(`Error al guardar voluntario: ${error.message || 'Error desconocido'}`);
    }
  };

  const resetForm = () => {
    const activeStatusId = getEstadoIdFromStatus('active');
    setFormData({
      dni: '',
      name: '',
      email: '',
      phone: '',
      areaId: '',
      availability: [],
      status: 'active',
      statusId: activeStatusId ? String(activeStatusId) : '',
    });
  };

  const openEditModal = (volunteer: Volunteer) => {
    const resolvedStatus = volunteer.id_estado ? getStatusFromEstadoId(volunteer.id_estado) : volunteer.status;
    const fallbackStatusId = getEstadoIdFromStatus(resolvedStatus);
    const resolvedStatusId = volunteer.id_estado
      ? String(volunteer.id_estado)
      : (fallbackStatusId ? String(fallbackStatusId) : '');

    setSelectedVolunteer(volunteer);
    setFormData({
      dni: volunteer.dni,
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      areaId: volunteer.areaId,
      availability: normalizeAvailability(volunteer.availability),
      status: resolvedStatus,
      statusId: resolvedStatusId,
    });
    setShowModal(true);
  };

  const toggleAvailabilityDay = (day: string) => {
    setFormData((prev) => {
      const nextDays = prev.availability.includes(day)
        ? prev.availability.filter((value) => value !== day)
        : [...prev.availability, day];

      return {
        ...prev,
        availability: AVAILABILITY_DAYS.map((item) => item.key).filter((key) => nextDays.includes(key)),
      };
    });
  };

  const downloadCertificate = async (volunteerId: string) => {
    if (!accessToken) {
      alert('No hay sesión activa');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/reports/certificate/${volunteerId}`, {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken 
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Generar contenido del certificado
      const volunteer = data.volunteer;
      const activities = data.activities;
      
      let certContent = `CERTIFICADO DE VOLUNTARIADO\n\n`;
      certContent += `Nombre: ${volunteer.name}\n`;
      certContent += `DNI: ${volunteer.dni}\n`;
      certContent += `Email: ${volunteer.email}\n\n`;
      certContent += `RESUMEN DE ACTIVIDADES\n`;
      certContent += `Total de Horas: ${volunteer.totalHours}h\n`;
      certContent += `Total de Actividades: ${volunteer.totalActivities}\n\n`;
      certContent += `DETALLE DE ACTIVIDADES VALIDADAS:\n\n`;
      
      activities.forEach((act: Activity, index: number) => {
        certContent += `${index + 1}. ${act.title}\n`;
        certContent += `   Fecha: ${new Date(act.startDate).toLocaleDateString('es')}\n`;
        certContent += `   Duración: ${act.duration}h\n`;
        certContent += `   Responsable: ${act.responsibleName}\n\n`;
      });

      // Descargar como archivo de texto
      const blob = new Blob([certContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${volunteer.name.replace(/\s/g, '_')}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert('Certificado descargado correctamente');
    } catch (error) {
      console.error('Error al generar certificado:', error);
      alert('Error al generar certificado');
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.dni.includes(searchTerm) ||
                         volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = filterArea === 'all' || volunteer.areaId === filterArea;
    const statusMeta = getVolunteerStatusMeta(volunteer);
    const matchesStatus = filterStatus === 'all' || statusMeta.status === filterStatus;
    
    return matchesSearch && matchesArea && matchesStatus;
  });

  const getStatusBadge = (volunteer: Volunteer) => {
    const meta = getVolunteerStatusMeta(volunteer);
    const textColor = meta.color || (meta.status === 'active' ? '#166534' : '#374151');
    const bgColor = `${meta.color || (meta.status === 'active' ? '#22c55e' : '#6b7280')}22`;

    return (
      <span
        className="px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1"
        style={{ backgroundColor: bgColor, color: textColor }}
        title={meta.description || undefined}
      >
        {meta.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
        {meta.label}
      </span>
    );
  };

  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'Sin área';
  };

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Base de Datos de Voluntarios</h2>
        {!readOnly && (
          <button
            onClick={() => {
              setSelectedVolunteer(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            type="button"
          >
            <Plus className="w-5 h-5" />
            Nuevo Voluntario
          </button>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las áreas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        {estadosGeneralOrdenados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
            {estadosGeneralOrdenados.map((estado) => (
              <span key={estado.id_estado} className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: estado.color || '#6b7280' }}
                />
                <span className="font-semibold text-gray-800">{estado.nombre}:</span>
                <span>{estado.descripcion || 'Sin descripción'}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Voluntarios</p>
          <p className="text-2xl font-bold text-gray-900">{volunteers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {volunteers.filter((v) => getVolunteerStatusMeta(v).status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Horas Totales</p>
          <p className="text-2xl font-bold text-blue-600">
            {volunteers.reduce((sum, v) => sum + v.totalHours, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Actividades Totales</p>
          <p className="text-2xl font-bold text-purple-600">
            {volunteers.reduce((sum, v) => sum + v.totalActivities, 0)}
          </p>
        </div>
      </div>

      {/* Lista de Voluntarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actividades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                    <div className="text-sm text-gray-500">{volunteer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{volunteer.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getAreaName(volunteer.areaId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(volunteer)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {volunteer.totalHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {volunteer.totalActivities}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => loadVolunteerDetails(volunteer.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Ver detalle"
                      type="button"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => openEditModal(volunteer)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Editar"
                        type="button"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadCertificate(volunteer.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Descargar certificado"
                      type="button"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVolunteers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron voluntarios con los filtros seleccionados
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      <Dialog
        open={showModal}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return;
          setShowModal(false);
          setSelectedVolunteer(null);
          resetForm();
        }}
      >
        <DialogContent showClose={false} className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-4">{selectedVolunteer ? 'Editar Voluntario' : 'Nuevo Voluntario'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="DNI"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={formData.areaId}
              onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Seleccionar área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Disponibilidad semanal</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {AVAILABILITY_DAYS.map((day) => {
                  const isSelected = formData.availability.includes(day.key);
                  return (
                    <button
                      type="button"
                      key={day.key}
                      onClick={() => toggleAvailabilityDay(day.key)}
                      className={`px-2 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {day.key}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.availability.length === 0
                  ? 'Sin disponibilidad definida'
                  : `Seleccionado: ${formData.availability.join(', ')}`}
              </p>
            </div>
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium text-gray-700">Estado</p>
              <select
                value={formData.statusId}
                onChange={(e) => {
                  const nextStatusId = e.target.value;
                  const selectedEstado = nextStatusId ? estadoGeneralById.get(Number(nextStatusId)) : null;
                  setFormData({
                    ...formData,
                    statusId: nextStatusId,
                    status: selectedEstado ? getStatusFromEstado(selectedEstado.nombre) : formData.status,
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {estadosGeneralOrdenados.length === 0 && (
                  <option value="">{selectedVolunteer ? 'Estado actual' : 'Activo por defecto'}</option>
                )}
                {estadosGeneralOrdenados.map((estado) => (
                  <option key={estado.id_estado} value={estado.id_estado}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
              <div className="space-y-1 text-xs text-gray-600">
                {estadosGeneralOrdenados.map((estado) => (
                  <div key={`help-${estado.id_estado}`}>
                    <span className="font-semibold text-gray-800">{estado.nombre}:</span> {estado.descripcion || 'Sin descripción'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={createOrUpdateVolunteer}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              type="button"
            >
              {selectedVolunteer ? 'Actualizar' : 'Crear'}
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedVolunteer(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              type="button"
            >
              Cancelar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalle */}
      {showDetailModal && selectedVolunteer && (
        <Dialog
          open={showDetailModal}
          onOpenChange={(nextOpen) => {
            if (nextOpen) return;
            closeEvidence();
            setShowDetailModal(false);
          }}
        >
          <DialogContent
            showClose={false}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedVolunteer.name}</h3>
                <p className="text-gray-600">DNI: {selectedVolunteer.dni}</p>
              </div>
              <button
                onClick={() => {
                  closeEvidence();
                  setShowDetailModal(false);
                }}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition"
                type="button"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedVolunteer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{selectedVolunteer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Área</p>
                <p className="font-medium">{getAreaName(selectedVolunteer.areaId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <div className="mt-1">{getStatusBadge(selectedVolunteer)}</div>
                {getVolunteerStatusMeta(selectedVolunteer).description && (
                  <p className="text-xs text-gray-500 mt-1">{getVolunteerStatusMeta(selectedVolunteer).description}</p>
                )}
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Disponibilidad</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVAILABILITY_DAYS.map((day) => {
                    const isSelected = selectedVolunteer.availability.includes(day.key);
                    return (
                      <span
                        key={day.key}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isSelected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {day.key}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Horas</p>
                <p className="text-2xl font-bold text-blue-600">{selectedVolunteer.totalHours}h</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Actividades</p>
                <p className="text-2xl font-bold text-purple-600">{selectedVolunteer.totalActivities}</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-3">Historial de Actividades Validadas</h4>
              <div className="space-y-2">
                {volunteerActivities.length === 0 ? (
                  <p className="text-gray-500">Sin actividades validadas aún</p>
                ) : (
                  volunteerActivities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.startDate).toLocaleDateString('es')} | {activity.duration}h
                          </p>
                          <p className="text-sm text-gray-500">Responsable: {activity.responsibleName}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-lg font-bold">Historial de horas (KoBo)</h4>
                {!readOnly && (
                  <button
                    onClick={() => syncKoboForVolunteer(selectedVolunteer)}
                    disabled={syncingVolunteerId === selectedVolunteer.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    type="button"
                    title="Calcular horas (KoBo Sync)"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${syncingVolunteerId === selectedVolunteer.id ? 'animate-spin' : ''}`}
                    />
                    <span className="hidden sm:inline">Calcular horas</span>
                  </button>
                )}
              </div>

              {loadingHoursHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                      <div className="mt-2 h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : hoursHistory.length === 0 ? (
                <div className="border rounded-lg p-4 text-center text-sm text-gray-500">
                  Sin registros KoBo para este voluntario.
                </div>
              ) : (
                <div className="space-y-2">
                  {hoursHistory.map((item) => {
                    const codigo = item.actividad?.codigo || `Actividad #${item.id_actividad}`;
                    const titulo = item.actividad?.titulo || 'Sin titulo';
                    const descripcionRaw = item.actividad?.descripcion ?? item.descripcion ?? null;
                    const descripcion = descripcionRaw ? String(descripcionRaw).trim() : '';
                    const inicio = item.actividad?.fecha_inicio ? new Date(item.actividad.fecha_inicio) : null;
                    const fin = item.actividad?.fecha_fin ? new Date(item.actividad.fecha_fin) : null;
                    const evidencias = Array.isArray(item.actividad?.evidencias) ? item.actividad!.evidencias! : [];
                    const fechaText = inicio
                      ? inicio.toLocaleDateString('es')
                      : item.fecha_ultima_actualizacion
                        ? new Date(item.fecha_ultima_actualizacion).toLocaleDateString('es')
                        : '-';

                    return (
                      <div
                        key={`${item.id_actividad}-${item.kobo_submission_id || ''}`}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate" title={titulo}>
                              {codigo} - {titulo}
                            </p>
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                              <span className="font-medium text-gray-700">Actividad realizada:</span>{' '}
                              {descripcion ? (
                                descripcion
                              ) : (
                                <span className="text-gray-400">Sin mensaje</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {fechaText}
                              {inicio && fin ? (
                                <>
                                  {' '}
                                  | {inicio.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} -{' '}
                                  {fin.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                </>
                              ) : null}
                            </p>
                            {item.kobo_submission_id ? (
                              <p className="text-xs text-gray-500 truncate" title={item.kobo_submission_id}>
                                KoBo submission: {item.kobo_submission_id}
                              </p>
                            ) : null}

                            {evidencias.length > 0 ? (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  Evidencias ({evidencias.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {evidencias.slice(0, 6).map((ev) => {
                                    const url = ev?.url_archivo ? String(ev.url_archivo) : '';
                                    if (!url) return null;

                                    const proxyUrl = `${API_BASE_URL}/kobo/attachments/proxy?url=${encodeURIComponent(url)}`;
                                    const tipo = String(ev?.tipo_archivo || '').toLowerCase();
                                    const isImage =
                                      tipo === 'foto' ||
                                      tipo.startsWith('image/') ||
                                      /\.(png|jpe?g|gif|webp|bmp)$/i.test(url);

                                    if (isImage) {
                                      const rawLargeUrl = String(ev.download_large_url || ev.download_url || ev.url_archivo || '');
                                      if (!rawLargeUrl) return null;
                                      const proxyLargeUrl = `${API_BASE_URL}/kobo/attachments/proxy?url=${encodeURIComponent(rawLargeUrl)}`;

                                      return (
                                        <button
                                          key={String(ev.id_evidencia)}
                                          type="button"
                                          onClick={() => {
                                            setEvidence({ url: proxyLargeUrl, name: ev.nombre_original });
                                            setEvidenceOpen(true);
                                          }}
                                          className="block"
                                          title={ev.nombre_original || undefined}
                                        >
                                          <AuthorizedImage
                                            url={proxyUrl}
                                            alt={ev.nombre_original || 'Evidencia'}
                                            accessToken={accessToken}
                                            className="h-16 w-16 rounded-md object-cover border border-gray-200 hover:opacity-90 transition cursor-zoom-in"
                                            loadingClassName="h-16 w-16 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center"
                                            errorClassName="h-16 w-16 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center"
                                            errorMessage="Sin imagen"
                                            spinnerClassName="h-4 w-4 border-2 border-gray-300 border-t-gray-700 animate-spin rounded-full"
                                          />
                                        </button>
                                      );
                                    }

                                    return (
                                      <a
                                        key={String(ev.id_evidencia)}
                                        href={proxyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition"
                                        title={ev.nombre_original || undefined}
                                      >
                                        {ev.nombre_original || 'Archivo'}
                                      </a>
                                    );
                                  })}
                                  {evidencias.length > 6 ? (
                                    <span className="text-xs text-gray-500 self-center">
                                      +{evidencias.length - 6} mas
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold text-gray-900">{Number(item.horas_total || 0)}h</div>
                            {item.fecha_ultima_actualizacion ? (
                              <div className="text-xs text-gray-500">
                                {new Date(item.fecha_ultima_actualizacion).toLocaleString('es')}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => downloadCertificate(selectedVolunteer.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                type="button"
              >
                <Download className="w-5 h-5" />
                Descargar Certificado
              </button>
              <button
                  onClick={() => {
                    closeEvidence();
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  type="button"
                >
                Cerrar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal evidencias (imagen grande) */}
      <Dialog
        open={evidenceOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeEvidence();
        }}
      >
        <DialogContent
          showClose={false}
          className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden p-0 gap-0 border-0"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium">Evidencia</div>
            <button
              type="button"
              onClick={closeEvidence}
              className="rounded-md p-2 hover:bg-gray-100"
              aria-label="Cerrar evidencia"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="bg-black flex items-center justify-center p-2">
            <AuthorizedImage
              url={evidence?.url || ''}
              alt={evidence?.name ?? 'Evidencia'}
              accessToken={accessToken}
              className="w-full max-h-[80vh] object-contain"
              loadingClassName="w-full max-h-[80vh] flex items-center justify-center"
              errorClassName="w-full max-h-[80vh] flex items-center justify-center"
              errorTextClassName="text-sm text-white/80"
              spinnerClassName="h-7 w-7 border-2 border-white/30 border-t-white animate-spin rounded-full"
              errorMessage="No se pudo cargar la evidencia"
            />
          </div>

          {evidence?.name ? (
            <div className="px-4 py-2 text-xs text-gray-600 border-t">{evidence.name}</div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

