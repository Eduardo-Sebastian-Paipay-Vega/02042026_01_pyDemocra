import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Save, AlertCircle, CheckCircle, Upload, FileImage } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import MapPicker from './MapPicker';
import { Dialog, DialogContent } from './ui/dialog';

interface ActivityFormProps {
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
  /** Logged-in user id (id_usuario). When set, Responsable is pre-filled and read-only unless isAdmin. */
  id_usuario?: string;
  /** Logged-in user role. Admin can change responsable; others see it read-only. */
  rol?: string;
  mode?: 'create' | 'edit';
  initialData?: ActivityFormInitialData;
  /** Optional day to prefill fecha_inicio/fecha_fin when creating from Calendar. */
  initialDate?: string | Date | null;
  /**
   * When true, renders only the form content (for embedding inside a shadcn Dialog).
   * Default false keeps the standalone full-screen overlay used elsewhere in the app.
   */
  embedded?: boolean;
}

interface TipoActividad {
  id_tipo_actividad: string;
  nombre: string;
}

interface Responsable {
  id_usuario: string;
  nombre_completo: string;
}

interface ActivityFormInitialData {
  id_actividad?: number;
  codigo?: string;
  titulo?: string;
  descripcion?: string | null;
  objetivo?: string | null;
  estado?: string | null;
  id_tipo_actividad?: number | string | null;
  id_responsable?: number | string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  ubicacion_direccion?: string | null;
  ubicacion_lat?: number | string | null;
  ubicacion_lng?: number | string | null;
}

const PERU_LOCATIONS = {
  Ayacucho: {
    Huamanga: ['Ayacucho', 'Carmen Alto', 'Jesús Nazareno', 'San Juan Bautista'],
  },
} as const;

const splitDateTime = (value?: string | null) => {
  if (!value) return { date: '', time: '' };
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return { date: '', time: '' };
  const pad = (num: number) => String(num).padStart(2, '0');
  const date = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  const time = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  return { date, time };
};

const parseCoordValue = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const DEFAULT_CREATE_START_TIME = '09:00';
const DEFAULT_CREATE_END_TIME = '10:00';

const toDateKey = (value: string | Date): string => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

export default function ActivityForm({
  onClose,
  onSuccess,
  accessToken,
  id_usuario: userId,
  rol,
  mode = 'create',
  initialData,
  initialDate = null,
  embedded = false,
}: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState<string>('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Catálogos
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    id_tipo_actividad: '',
    id_responsable: '',
    fecha_inicio: '',
    hora_inicio: '',
    fecha_fin: '',
    hora_fin: '',
    ubicacion_direccion: '',
    ubicacion_lat: '',
    ubicacion_lng: '',
    objetivo: ''
  });

  const isAdmin = rol === 'admin';
  const isEdit = mode === 'edit';
  const [locationTouched, setLocationTouched] = useState(false);
  const [locationFields, setLocationFields] = useState({
    departamento: 'Ayacucho',
    provincia: 'Huamanga',
    distrito: '',
    calle: '',
    referencia: '',
  });

  const departamentos = Object.keys(PERU_LOCATIONS);
  const provincias = locationFields.departamento
    ? Object.keys(PERU_LOCATIONS[locationFields.departamento as keyof typeof PERU_LOCATIONS] || {})
    : [];
  const distritos = locationFields.departamento && locationFields.provincia
    ? (PERU_LOCATIONS as Record<string, Record<string, string[]>>)[locationFields.departamento]?.[locationFields.provincia] || []
    : [];

  const buildDireccion = () => {
    const distrito = locationFields.distrito.trim();
    const provincia = locationFields.provincia.trim();
    const departamento = locationFields.departamento.trim();
    const locationText = [distrito, provincia, departamento].filter(Boolean).join(', ');
    const calle = locationFields.calle.trim();
    const referencia = locationFields.referencia.trim();
    let direccion = calle;
    if (referencia) {
      direccion = direccion ? `${direccion} (${referencia})` : referencia;
    }
    return [locationText, direccion].filter(Boolean).join(' - ');
  };

  const handleLocationFieldChange = (field: keyof typeof locationFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setLocationTouched(true);
    setLocationFields((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'departamento') {
        next.provincia = '';
        next.distrito = '';
      }
      if (field === 'provincia') {
        next.distrito = '';
      }
      return next;
    });
  };

  const latForMap = parseCoordValue(formData.ubicacion_lat);
  const lngForMap = parseCoordValue(formData.ubicacion_lng);
  const mapLat = latForMap !== null && lngForMap !== null ? latForMap : null;
  const mapLng = latForMap !== null && lngForMap !== null ? lngForMap : null;

  const handleMapChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      ubicacion_lat: lat.toFixed(6),
      ubicacion_lng: lng.toFixed(6),
    }));
  };

  useEffect(() => {
    cargarCatalogos();
    if (!isEdit) {
      generarCodigoActividad();
    }
  }, [isEdit]);

  useEffect(() => {
    if (isEdit) return;
    if (!initialDate) return;

    const dateKey = toDateKey(initialDate);
    if (!dateKey) return;

    setFormData((prev) => ({
      ...prev,
      fecha_inicio: dateKey,
      fecha_fin: dateKey,
      hora_inicio: prev.hora_inicio || DEFAULT_CREATE_START_TIME,
      hora_fin: prev.hora_fin || DEFAULT_CREATE_END_TIME,
    }));
  }, [initialDate, isEdit]);

  useEffect(() => {
    if (!isEdit || !initialData) return;
    const inicio = splitDateTime(initialData.fecha_inicio);
    const fin = splitDateTime(initialData.fecha_fin);
    setCodigoGenerado(initialData.codigo || '');
    setFormData({
      titulo: initialData.titulo || '',
      descripcion: initialData.descripcion || '',
      id_tipo_actividad: initialData.id_tipo_actividad ? String(initialData.id_tipo_actividad) : '',
      id_responsable: initialData.id_responsable ? String(initialData.id_responsable) : '',
      fecha_inicio: inicio.date,
      hora_inicio: inicio.time,
      fecha_fin: fin.date,
      hora_fin: fin.time,
      ubicacion_direccion: initialData.ubicacion_direccion || '',
      ubicacion_lat: initialData.ubicacion_lat !== null && initialData.ubicacion_lat !== undefined
        ? String(initialData.ubicacion_lat)
        : '',
      ubicacion_lng: initialData.ubicacion_lng !== null && initialData.ubicacion_lng !== undefined
        ? String(initialData.ubicacion_lng)
        : '',
      objetivo: initialData.objetivo || '',
    });
  }, [isEdit, initialData]);

  useEffect(() => {
    if (!isEdit) {
      setLocationTouched(true);
    }
  }, [isEdit]);

  useEffect(() => {
    if (!locationTouched) return;
    const direccion = buildDireccion();
    setFormData((prev) => ({
      ...prev,
      ubicacion_direccion: direccion,
    }));
  }, [locationFields, locationTouched]);

  useEffect(() => {
    if (userId && !isAdmin) {
      setFormData(prev => ({ ...prev, id_responsable: userId }));
    }
  }, [userId, isAdmin]);

  const cargarCatalogos = async () => {
    try {
      setLoadingCatalogos(true);

      // Cargar tipos de actividad
      const resTipos = await fetch(`${API_BASE_URL}/tipos-actividad`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        }
      });
      if (resTipos.ok) {
        const dataTipos = await resTipos.json();
        setTiposActividad(dataTipos.tipos || []);
      }

      // Cargar responsables (trabajadores y responsables)
      const resResponsables = await fetch(`${API_BASE_URL}/responsables`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        }
      });
      if (resResponsables.ok) {
        const dataResp = await resResponsables.json();
        setResponsables(dataResp.responsables || []);
        if (userId && !isAdmin) {
          setFormData(prev => ({ ...prev, id_responsable: userId }));
        }
      }

    } catch (err) {
      console.error('Error cargando catálogos:', err);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const generarCodigoActividad = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/actividades/generar-codigo`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCodigoGenerado(data.codigo);
      }
    } catch (err) {
      console.error('Error generando código:', err);
      // Fallback: generar código local
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setCodigoGenerado(`ACT-${year}-${random}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    setArchivos(prev => [...prev, ...Array.from(files)]);
  }, []);

  const removeArchivo = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    let createdSuccessfully = false;

    try {
      const responsableId = !isAdmin && userId ? userId : formData.id_responsable;
      const estadoSource = isEdit ? initialData?.estado : 'planificada';
      const estadoNormalized = typeof estadoSource === 'string' ? estadoSource.toLowerCase() : '';
      const estadoFinal = ['planificada', 'en_ejecucion', 'cerrada'].includes(estadoNormalized)
        ? estadoNormalized
        : 'planificada';

      if (isEdit && !initialData?.id_actividad) {
        throw new Error('No se pudo identificar la actividad a editar');
      }

      // Validaciones
      if (!formData.titulo.trim()) {
        throw new Error('El título es obligatorio');
      }
      if (!formData.id_tipo_actividad) {
        throw new Error('Debe seleccionar un tipo de actividad');
      }
      if (!responsableId) {
        throw new Error('Debe asignar un responsable');
      }
      if (!formData.fecha_inicio || !formData.hora_inicio) {
        throw new Error('Debe especificar fecha y hora de inicio');
      }
      if (!formData.fecha_fin || !formData.hora_fin) {
        throw new Error('Debe especificar fecha y hora de fin');
      }
      const fechaInicioISO = `${formData.fecha_inicio}T${formData.hora_inicio}`;
      const fechaFinISO = `${formData.fecha_fin}T${formData.hora_fin}`;
      const fechaInicioDate = new Date(fechaInicioISO);
      const fechaFinDate = new Date(fechaFinISO);

      if (fechaFinDate.getTime() < fechaInicioDate.getTime()) {
        throw new Error('La fecha fin no puede ser menor que la fecha inicio');
      }

      const latRaw = formData.ubicacion_lat.trim();
      const lngRaw = formData.ubicacion_lng.trim();
      const latParsed = latRaw ? Number(latRaw) : null;
      const lngParsed = lngRaw ? Number(lngRaw) : null;

      if (latParsed !== null && !Number.isFinite(latParsed)) {
        throw new Error('Latitud inválida');
      }
      if (lngParsed !== null && !Number.isFinite(lngParsed)) {
        throw new Error('Longitud inválida');
      }

      const latValue = latParsed !== null && lngParsed !== null ? latParsed : null;
      const lngValue = latParsed !== null && lngParsed !== null ? lngParsed : null;
      const direccionFinal = locationTouched ? buildDireccion() : formData.ubicacion_direccion;

      const endpoint = isEdit
        ? `${API_BASE_URL}/actividades/${initialData?.id_actividad}`
        : `${API_BASE_URL}/actividades`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        },
        body: JSON.stringify({
          codigo: codigoGenerado,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          objetivo: formData.objetivo,
          id_tipo_actividad: formData.id_tipo_actividad,
          id_responsable: responsableId,
          estado: estadoFinal,
          fecha_inicio: fechaInicioISO,
          fecha_fin: fechaFinISO,
          ubicacion_direccion: direccionFinal || null,
          ubicacion_lat: latValue,
          ubicacion_lng: lngValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isEdit ? 'Error al actualizar actividad' : 'Error al crear actividad'));
      }

      const idActividad = isEdit ? initialData?.id_actividad : data.actividad?.id_actividad;
      if (idActividad && archivos.length > 0) {
        setUploadingFiles(true);
        try {
          const uploadFormData = new FormData();
          archivos.forEach(f => uploadFormData.append('file', f));
          const uploadRes = await fetch(`${API_BASE_URL}/actividades/${idActividad}/evidencias`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': accessToken
            },
            body: uploadFormData
          });
          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => null);
            const backendWhere = errData && typeof errData.where === 'string' ? errData.where : null;
            const backendError = errData && typeof errData.error === 'string'
              ? errData.error
              : `HTTP ${uploadRes.status}`;
            const fullMessage = backendWhere ? `[${backendWhere}] ${backendError}` : backendError;
            console.warn('Algunos archivos no se subieron:', errData ?? fullMessage);
            setError(`La actividad se guardó, pero falló la subida de evidencias: ${fullMessage}`);
            window.alert(`La actividad se guardó, pero falló la subida de evidencias.\n${fullMessage}`);
          }
        } finally {
          setUploadingFiles(false);
        }
      }

      setSuccess(true);
      createdSuccessfully = true;

    } catch (err: any) {
      console.error('Error al guardar actividad:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }

    if (createdSuccessfully) {
      onSuccess();
      onClose();
    }
  };

  const modalBody = (
    <div
      className={
        embedded
          ? "w-full bg-white"
          : "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      }
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
            <p className="text-sm text-gray-600">
              Código: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{codigoGenerado || '—'}</code>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all hover:scale-105 active:scale-95"
          disabled={loading}
          aria-label="Cerrar"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensaje de éxito */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">
                  {isEdit ? 'Actividad actualizada exitosamente!' : 'Actividad creada exitosamente!'}
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {isEdit ? 'Los cambios se guardaron correctamente.' : 'La actividad ahora está disponible en el sistema.'}
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📋 Información Básica
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Actividad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Taller de Capacitación en Educación"
                disabled={loading || success || loadingCatalogos}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe brevemente la actividad..."
                disabled={loading || success || loadingCatalogos}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objetivo
              </label>
              <textarea
                name="objetivo"
                value={formData.objetivo}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="¿Qué se espera lograr?"
                disabled={loading || success || loadingCatalogos}
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              🏷️ Clasificación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Actividad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Actividad <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_tipo_actividad"
                  value={formData.id_tipo_actividad}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success || loadingCatalogos}
                >
                  <option value="">Seleccione un tipo</option>
                  {tiposActividad.map(tipo => (
                    <option key={tipo.id_tipo_actividad} value={tipo.id_tipo_actividad}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                {loadingCatalogos && (
                  <p className="text-xs text-gray-500 mt-1">Cargando tipos...</p>
                )}
              </div>

              {/* Responsable */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_responsable"
                  value={formData.id_responsable}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success || loadingCatalogos || (!isAdmin && !!userId)}
                >
                  <option value="">Seleccione un responsable</option>
                  {responsables.map(resp => (
                    <option key={resp.id_usuario} value={resp.id_usuario}>
                      {resp.nombre_completo}
                    </option>
                  ))}
                </select>
                {!isAdmin && userId && (
                  <p className="text-xs text-gray-500 mt-1">Asignado a ti (sesión actual)</p>
                )}
                {loadingCatalogos && (
                  <p className="text-xs text-gray-500 mt-1">Cargando responsables...</p>
                )}
              </div>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📅 Programación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success}
                />
              </div>

              {/* Hora Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success}
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success}
                />
              </div>

              {/* Hora Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success}
                />
              </div>
            </div>

          </div>

          {/* Archivos / Imágenes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📎 Archivos o imágenes
            </h3>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Imágenes y documentos (se guardan en Supabase Storage)
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                id="actividad-archivos"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <label
                htmlFor="actividad-archivos"
                className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer transition-colors"
              >
                Seleccionar archivos
              </label>
            </div>
            {archivos.length > 0 && (
              <ul className="space-y-2">
                {archivos.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileImage className="w-4 h-4 text-gray-500 shrink-0" />
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeArchivo(i)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      disabled={loading || success}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ubicación y Cupos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📍 Logística
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  value={locationFields.departamento}
                  onChange={handleLocationFieldChange('departamento')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success}
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <select
                  value={locationFields.provincia}
                  onChange={handleLocationFieldChange('provincia')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success || !locationFields.departamento}
                >
                  <option value="">Seleccione una provincia</option>
                  {provincias.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distrito
                </label>
                <select
                  value={locationFields.distrito}
                  onChange={handleLocationFieldChange('distrito')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success || !locationFields.provincia}
                >
                  <option value="">Seleccione un distrito</option>
                  {distritos.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ubicación en el mapa (opcional)
                </label>
                <MapPicker valueLat={mapLat} valueLng={mapLng} onChange={handleMapChange} />
                <p className="text-xs text-gray-500">
                  Haz clic en el mapa para guardar latitud y longitud. Si no lo usas, se guardará solo la dirección.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle
                </label>
                <input
                  type="text"
                  value={locationFields.calle}
                  onChange={handleLocationFieldChange('calle')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Av. Los Libertadores"
                  disabled={loading || success}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  value={locationFields.referencia}
                  onChange={handleLocationFieldChange('referencia')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Frente a la plaza"
                  disabled={loading || success}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección generada
                </label>
                <textarea
                  name="ubicacion_direccion"
                  value={formData.ubicacion_direccion}
                  readOnly
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Se generará automáticamente con los campos anteriores"
                />
              </div>

              <div className="md:col-span-2">
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Coordenadas (opcional)
                  </summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitud
                      </label>
                      <input
                        type="number"
                        name="ubicacion_lat"
                        value={formData.ubicacion_lat}
                        onChange={handleChange}
                        step="0.00000001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="-12.046374"
                        disabled={loading || success}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitud
                      </label>
                      <input
                        type="number"
                        name="ubicacion_lng"
                        value={formData.ubicacion_lng}
                        onChange={handleChange}
                        step="0.00000001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="-77.042793"
                        disabled={loading || success}
                      />
                    </div>
                    <p className="md:col-span-2 text-xs text-gray-500">
                      Si no completas las coordenadas, se enviarán como null.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Información Importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">ℹ️ Información Importante</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>El código de actividad se genera automáticamente</li>
              <li>Este código es lo que los trabajadores usarán en Kobo</li>
              <li>La actividad estará en estado "planificada" inicialmente</li>
              <li>Los catálogos (tipos) se cargan desde Supabase</li>
            </ul>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={loading || success}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success || loadingCatalogos || uploadingFiles}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingFiles ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Subiendo archivos...
                </>
              ) : loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Guardar cambios' : 'Crear Actividad'}
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );

  if (embedded) {
    return <div className="relative">{modalBody}</div>;
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-full max-w-4xl p-0 gap-0 border-0 bg-transparent shadow-none rounded-none"
      >
        {modalBody}
      </DialogContent>
    </Dialog>
  );
}
