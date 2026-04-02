import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import ActivityForm from './ActivityForm';
import imageCompression from 'browser-image-compression';
import { Dialog, DialogContent } from './ui/dialog';

interface ActivityListProps {
  accessToken: string;
  refreshKey?: number;
  id_usuario?: string;
  rol?: string;
}

interface Activity {
  id_actividad?: number;
  codigo?: string;
  titulo?: string;
  descripcion?: string | null;
  objetivo?: string | null;
  estado?: string;
  id_estado?: number | null;
  estadoColor?: string | null;
  estadoDescripcion?: string | null;
  id_tipo_actividad?: number | string | null;
  id_responsable?: number | string | null;
  id_creador?: number | string | null;
  responsableName?: string;
  creadorName?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  ubicacion_direccion?: string | null;
  ubicacion_lat?: number | string | null;
  ubicacion_lng?: number | string | null;
  fecha_creacion?: string | null;
}

interface EstadoOption {
  id_estado: number;
  nombre: string;
  ambito: string;
  color?: string | null;
  descripcion?: string | null;
}

interface Evidencia {
  id_evidencia: number;
  id_actividad: number;
  url_archivo: string;
  tipo_archivo: string;
  nombre_original: string;
  fecha_subida?: string | null;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  error?: string;
}

function formatFecha(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function normalizeEstado(estado?: string | null): string {
  if (!estado) return '';
  return String(estado)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function formatEstado(estado?: string): string {
  const e = normalizeEstado(estado);
  if (!e) return '';
  if (e === 'planificada') return 'Planificada';
  if (e === 'en_ejecucion') return 'En ejecución';
  if (e === 'cerrada') return 'Cerrada';
  if (e === 'cancelada') return 'Cancelada';
  return estado || '';
}

function getEstadoFallbackColor(estado?: string): string {
  const normalized = normalizeEstado(estado);
  if (normalized === 'cerrada') return '#28a745';
  if (normalized === 'en_ejecucion') return '#ffc107';
  if (normalized === 'cancelada') return '#6c757d';
  return '#17a2b8';
}

function truncateText(text: string | null | undefined, maxLength: number): string {
  const value = (text || '').trim();
  if (!value) return '—';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

const parseCoord = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatValue = (value: string | null | undefined) => {
  const normalized = (value || '').trim();
  return normalized ? normalized : '—';
};

export default function ActivityList({ accessToken, refreshKey, id_usuario: userId, rol }: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'view' | 'evidencias' | 'edit' | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [evidenciasLoading, setEvidenciasLoading] = useState(false);
  const [evidenciasError, setEvidenciasError] = useState<string | null>(null);
  const [uploadingEvidencias, setUploadingEvidencias] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [estadosActividad, setEstadosActividad] = useState<EstadoOption[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const roleNormalized = (rol || '').trim().toLowerCase();
  const canManageStatus = roleNormalized === 'admin' || roleNormalized === 'principal';

  const estadosById = useMemo(() => {
    const map = new Map<number, EstadoOption>();
    estadosActividad.forEach((estado) => map.set(Number(estado.id_estado), estado));
    return map;
  }, [estadosActividad]);

  const estadosByKey = useMemo(() => {
    const map = new Map<string, EstadoOption>();
    estadosActividad.forEach((estado) => map.set(normalizeEstado(estado.nombre), estado));
    return map;
  }, [estadosActividad]);

  const semaforoEstados = useMemo(() => ({
    enEjecucion: estadosByKey.get('en_ejecucion') || null,
    cerrada: estadosByKey.get('cerrada') || null,
    cancelada: estadosByKey.get('cancelada') || null,
  }), [estadosByKey]);
  const showSemaforoRapido = canManageStatus && Boolean(
    semaforoEstados.enEjecucion || semaforoEstados.cerrada || semaforoEstados.cancelada,
  );

  const getEstadoMeta = (activity?: Activity | null) => {
    if (!activity) return { label: '—', description: null as string | null, color: '#17a2b8', id_estado: null as number | null };
    const fromId = activity.id_estado ? estadosById.get(Number(activity.id_estado)) : undefined;
    const fromKey = estadosByKey.get(normalizeEstado(activity.estado));
    const fallbackLabel = formatEstado(activity.estado) || 'Planificada';
    const label = fromId?.nombre || fromKey?.nombre || fallbackLabel;
    const description = fromId?.descripcion || fromKey?.descripcion || activity.estadoDescripcion || null;
    const color = fromId?.color || fromKey?.color || activity.estadoColor || getEstadoFallbackColor(activity.estado);
    const estadoId = fromId?.id_estado || fromKey?.id_estado || activity.id_estado || null;
    return {
      label,
      description,
      color,
      id_estado: estadoId,
    };
  };

  const loadEstadosActividad = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/estados?ambito=actividad`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
        },
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));
      setEstadosActividad((data.estados || []) as EstadoOption[]);
    } catch {
      setEstadosActividad([]);
    }
  };

  const loadActivities = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const endpoint = roleNormalized === 'trabajador' ? `${API_BASE_URL}/activities?mine=1` : `${API_BASE_URL}/activities`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar actividades';
      setError(message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstadosActividad();
    loadActivities();
  }, [accessToken, refreshKey]);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedActivity(null);
    setEvidencias([]);
    setEvidenciasError(null);
    setUploadingEvidencias(false);
    setUploadQueue([]);
    setUploadSummary(null);
  };

  const loadEvidencias = async (actividadId: number) => {
    if (!accessToken) return;
    setEvidenciasLoading(true);
    setEvidenciasError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/actividades/${actividadId}/evidencias`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const data = await response.json();
      setEvidencias(data.evidencias || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar evidencias';
      setEvidenciasError(message);
      setEvidencias([]);
    } finally {
      setEvidenciasLoading(false);
    }
  };

  const openModal = (type: 'view' | 'evidencias' | 'edit', activity: Activity) => {
    setSelectedActivity(activity);
    setActiveModal(type);
    if (type === 'evidencias' && activity.id_actividad) {
      loadEvidencias(activity.id_actividad);
    }
  };

  const updateUploadItem = (id: string, updates: Partial<UploadItem>) => {
    setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const compressIfImage = async (file: File): Promise<File> => {
    const type = file.type.toLowerCase();
    if (type !== 'image/jpeg' && type !== 'image/jpg' && type !== 'image/png') {
      return file;
    }

    const options = {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: type === 'image/png' ? 'image/png' : 'image/jpeg',
    };

    try {
      const compressed = await imageCompression(file, options);
      if (compressed instanceof File) {
        return compressed;
      }
      return new File([compressed], file.name, { type: options.fileType, lastModified: Date.now() });
    } catch (error) {
      console.warn('No se pudo comprimir la imagen, se sube original', error);
      return file;
    }
  };

  const uploadFileWithProgress = (file: File, actividadId: number, onProgress: (value: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/actividades/${actividadId}/evidencias`);
      xhr.setRequestHeader('Authorization', `Bearer ${publicAnonKey}`);
      xhr.setRequestHeader('X-Access-Token', accessToken);
      xhr.responseType = 'json';

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        const parseErrorMessage = (payload: unknown, fallback: string) => {
          if (payload && typeof payload === 'object') {
            const maybe = payload as { where?: string; error?: string };
            if (typeof maybe.error === 'string' && maybe.error.trim().length > 0) {
              return maybe.where ? `[${maybe.where}] ${maybe.error}` : maybe.error;
            }
            try {
              return JSON.stringify(payload);
            } catch {
              return fallback;
            }
          }
          return fallback;
        };

        let message = parseErrorMessage(xhr.response, `Error ${xhr.status}`);
        if (message === `Error ${xhr.status}` && typeof xhr.responseText === 'string' && xhr.responseText.trim()) {
          try {
            const parsed = JSON.parse(xhr.responseText);
            message = parseErrorMessage(parsed, message);
          } catch {
            message = xhr.responseText;
          }
        }
        reject(new Error(message));
      };

      xhr.onerror = () => reject(new Error('Error de red al subir evidencia'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

  const handleEvidenceUpload = async (files: FileList | null) => {
    if (!files?.length || !selectedActivity?.id_actividad) return;
    const list = Array.from(files);
    const queue = list.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadQueue(queue);
    setUploadSummary(null);
    setUploadingEvidencias(true);
    setEvidenciasError(null);

    let hasError = false;
    const failedMessages: string[] = [];
    for (const item of queue) {
      updateUploadItem(item.id, { status: 'compressing', progress: 0 });
      try {
        const fileToUpload = await compressIfImage(item.file);
        updateUploadItem(item.id, { status: 'uploading', progress: 0 });
        await uploadFileWithProgress(fileToUpload, selectedActivity.id_actividad, (value) => {
          updateUploadItem(item.id, { progress: value });
        });
        updateUploadItem(item.id, { status: 'success', progress: 100 });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al subir evidencia';
        updateUploadItem(item.id, { status: 'error', error: message });
        failedMessages.push(`${item.file.name}: ${message}`);
        hasError = true;
      }
    }

    await loadEvidencias(selectedActivity.id_actividad);
    setUploadingEvidencias(false);
    if (hasError) {
      const firstError = failedMessages[0] || 'Error al subir evidencias';
      const suffix = failedMessages.length > 1 ? ` (+${failedMessages.length - 1} más)` : '';
      const finalMessage = `${firstError}${suffix}`;
      setEvidenciasError(finalMessage);
      setUploadSummary('Algunos archivos no se pudieron subir.');
      window.alert(`Error al subir evidencias:\n${finalMessage}`);
    } else {
      setUploadSummary('Evidencias subidas correctamente.');
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!activity.id_actividad) return;
    const confirmed = window.confirm('¿Seguro que deseas eliminar esta actividad?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/actividades/${activity.id_actividad}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      await loadActivities();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar actividad';
      setError(message);
    }
  };

  const updateActivityStatus = async (activity: Activity, estadoId: number) => {
    if (!activity.id_actividad) return;
    try {
      setUpdatingStatusId(activity.id_actividad);
      const response = await fetch(`${API_BASE_URL}/activities/${activity.id_actividad}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_estado: estadoId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      const updated = data?.activity || {};
      const selectedEstado = estadosById.get(estadoId);
      const estadoNombre = selectedEstado?.nombre || formatEstado(updated.estado) || formatEstado(activity.estado);

      setActivities((prev) =>
        prev.map((item) =>
          item.id_actividad === activity.id_actividad
            ? {
                ...item,
                id_estado: estadoId,
                estado: normalizeEstado(estadoNombre),
                estadoColor: selectedEstado?.color || null,
                estadoDescripcion: selectedEstado?.descripcion || null,
              }
            : item,
        ),
      );

      setSelectedActivity((prev) =>
        prev && prev.id_actividad === activity.id_actividad
          ? {
              ...prev,
              id_estado: estadoId,
              estado: normalizeEstado(estadoNombre),
              estadoColor: selectedEstado?.color || null,
              estadoDescripcion: selectedEstado?.descripcion || null,
            }
          : prev,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      window.alert(message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const downloadActivitiesReport = () => {
    const reportDate = new Date().toLocaleString('es-PE');
    const lines: string[] = [];
    lines.push('REPORTE COMPLETO DE ACTIVIDADES');
    lines.push(`Generado: ${reportDate}`);
    lines.push(`Total: ${activities.length}`);
    lines.push('');

    activities.forEach((activity, index) => {
      const estadoMeta = getEstadoMeta(activity);
      lines.push(`${index + 1}. ${formatValue(activity.titulo)}`);
      lines.push(`Código: ${formatValue(activity.codigo)}`);
      lines.push(`Estado: ${estadoMeta.label}`);
      lines.push(`Descripción de estado: ${formatValue(estadoMeta.description || '')}`);
      lines.push(`Responsable: ${formatValue(activity.responsableName || '')}`);
      lines.push(`Creador: ${formatValue(activity.creadorName || '')}`);
      lines.push(`Inicio: ${formatFecha(activity.fecha_inicio || undefined)}`);
      lines.push(`Fin: ${formatFecha(activity.fecha_fin || undefined)}`);
      lines.push(`Ubicación: ${formatValue(activity.ubicacion_direccion || '')}`);
      lines.push(`Objetivo: ${formatValue(activity.objetivo || '')}`);
      lines.push(`Descripción: ${formatValue(activity.descripcion || '')}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_actividades_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const detailLat = selectedActivity ? parseCoord(selectedActivity.ubicacion_lat) : null;
  const detailLng = selectedActivity ? parseCoord(selectedActivity.ubicacion_lng) : null;
  const hasCoords = detailLat !== null && detailLng !== null;
  const mapQuery = hasCoords ? `${detailLat},${detailLng}` : '';
  const evidenceInputId = selectedActivity?.id_actividad
    ? `evidencia-upload-${selectedActivity.id_actividad}`
    : 'evidencia-upload';
  const selectedEstadoMeta = getEstadoMeta(selectedActivity);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Listado de actividades</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadActivitiesReport}
              disabled={activities.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Descargar reporte
            </button>
            <button
              type="button"
              onClick={loadActivities}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {showSemaforoRapido && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Semaforo rapido de aprobacion</p>
            <p className="text-xs text-gray-600 mt-1">
              Amarillo: {semaforoEstados.enEjecucion?.nombre || 'En ejecucion'} | Verde: {semaforoEstados.cerrada?.nombre || 'Cerrada (Aprobada)'} | Rojo: {semaforoEstados.cancelada?.nombre || 'Cancelada (No aprobada)'}
            </p>
          </div>
        )}

        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Cargando actividades...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
            No hay actividades. Crea una con el botón &quot;+ Crear actividad&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha inicio
                  </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha fin
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((act, index) => {
                  const rowId = act.id_actividad ?? `${act.codigo || 'act'}-${index}`;
                  const titulo = act.titulo || '—';
                  const descripcion = act.descripcion || '';
                  const descripcionCorta = truncateText(descripcion, 80);
                  const estadoMeta = getEstadoMeta(act);
                  const fechaInicio = formatFecha(act.fecha_inicio || undefined);
                  const fechaFin = formatFecha(act.fecha_fin || undefined);
                  const ubicacion = truncateText(act.ubicacion_direccion || '', 60);

                  return (
                    <tr key={rowId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono">
                          {act.codigo || '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{titulo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{descripcionCorta}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${estadoMeta.color}22`,
                            color: estadoMeta.color,
                          }}
                          title={estadoMeta.description || undefined}
                        >
                          {estadoMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatValue(act.responsableName || '')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fechaInicio}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fechaFin}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ubicacion}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center gap-2">
                          {showSemaforoRapido && (
                            <div
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1"
                              role="group"
                              aria-label={`Semaforo de estado para actividad ${act.codigo || rowId}`}
                            >
                              {semaforoEstados.enEjecucion && (
                                <button
                                  type="button"
                                  onClick={() => updateActivityStatus(act, semaforoEstados.enEjecucion!.id_estado)}
                                  disabled={!act.id_actividad || updatingStatusId === act.id_actividad || estadoMeta.id_estado === semaforoEstados.enEjecucion.id_estado}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                                    estadoMeta.id_estado === semaforoEstados.enEjecucion.id_estado
                                      ? 'bg-amber-500 text-gray-900 border-amber-500'
                                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                                  }`}
                                  title={`${semaforoEstados.enEjecucion.nombre}: ${semaforoEstados.enEjecucion.descripcion || 'Actividad en curso'}`}
                                  aria-label={`Marcar en ejecucion la actividad ${act.codigo || rowId}`}
                                >
                                  <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                                  En curso
                                </button>
                              )}
                              {semaforoEstados.cerrada && (
                                <button
                                  type="button"
                                  onClick={() => updateActivityStatus(act, semaforoEstados.cerrada!.id_estado)}
                                  disabled={!act.id_actividad || updatingStatusId === act.id_actividad || estadoMeta.id_estado === semaforoEstados.cerrada.id_estado}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                                    estadoMeta.id_estado === semaforoEstados.cerrada.id_estado
                                      ? 'bg-green-600 text-white border-green-600'
                                      : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                                  }`}
                                  title={`${semaforoEstados.cerrada.nombre}: ${semaforoEstados.cerrada.descripcion || 'Actividad aprobada/cerrada'}`}
                                  aria-label={`Aprobar actividad ${act.codigo || rowId}`}
                                >
                                  <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                                  Aprobar
                                </button>
                              )}
                              {semaforoEstados.cancelada && (
                                <button
                                  type="button"
                                  onClick={() => updateActivityStatus(act, semaforoEstados.cancelada!.id_estado)}
                                  disabled={!act.id_actividad || updatingStatusId === act.id_actividad || estadoMeta.id_estado === semaforoEstados.cancelada.id_estado}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                                    estadoMeta.id_estado === semaforoEstados.cancelada.id_estado
                                      ? 'bg-red-600 text-white border-red-600'
                                      : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                                  }`}
                                  title={`${semaforoEstados.cancelada.nombre}: ${semaforoEstados.cancelada.descripcion || 'Actividad no aprobada/cancelada'}`}
                                  aria-label={`No aprobar actividad ${act.codigo || rowId}`}
                                >
                                  <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                                  No aprobar
                                </button>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => openModal('view', act)}
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal('evidencias', act)}
                            className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded"
                          >
                            Evidencias
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal('edit', act)}
                            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(act)}
                            className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeModal === 'view' && selectedActivity && (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) closeModal();
          }}
        >
          <DialogContent
            showClose={false}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-white rounded-lg shadow-xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalle de actividad</h3>
                <p className="text-sm text-gray-600">{formatValue(selectedActivity.titulo)}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Código</p>
                  <p className="text-sm text-gray-900">{formatValue(selectedActivity.codigo)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Estado</p>
                  <span
                    className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${selectedEstadoMeta.color}22`,
                      color: selectedEstadoMeta.color,
                    }}
                  >
                    {selectedEstadoMeta.label}
                  </span>
                  {selectedEstadoMeta.description && (
                    <p className="text-xs text-gray-600 mt-1">{selectedEstadoMeta.description}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Fecha inicio</p>
                  <p className="text-sm text-gray-900">{formatFecha(selectedActivity.fecha_inicio || undefined)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Fecha fin</p>
                  <p className="text-sm text-gray-900">{formatFecha(selectedActivity.fecha_fin || undefined)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Descripción</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{formatValue(selectedActivity.descripcion || '')}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Objetivo</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{formatValue(selectedActivity.objetivo || '')}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Ubicación</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{formatValue(selectedActivity.ubicacion_direccion || '')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Latitud</p>
                  <p className="text-sm text-gray-900">{detailLat !== null ? detailLat : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Longitud</p>
                  <p className="text-sm text-gray-900">{detailLng !== null ? detailLng : '—'}</p>
                </div>
              </div>

              {canManageStatus && estadosActividad.length > 0 && selectedActivity.id_actividad && (
                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Gestión de estado</p>
                  <select
                    value={selectedEstadoMeta.id_estado || ''}
                    disabled={updatingStatusId === selectedActivity.id_actividad}
                    onChange={(event) => {
                      const nextEstadoId = Number(event.target.value);
                      if (!Number.isInteger(nextEstadoId) || nextEstadoId <= 0) return;
                      if (nextEstadoId === selectedEstadoMeta.id_estado) return;
                      updateActivityStatus(selectedActivity, nextEstadoId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {estadosActividad.map((estado) => (
                      <option key={estado.id_estado} value={estado.id_estado}>
                        {estado.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    {estadosActividad.map((estado) => (
                      <div key={estado.id_estado} className="text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">{estado.nombre}:</span>{' '}
                        {estado.descripcion || 'Sin descripción'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasCoords && (
                <div className="space-y-3">
                  <a
                    href={`https://www.google.com/maps?q=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Ver en Google Maps
                  </a>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <iframe
                      title="Mapa de actividad"
                      src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                      width="100%"
                      height="220"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {activeModal === 'evidencias' && selectedActivity && (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) closeModal();
          }}
        >
          <DialogContent
            showClose={false}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-white rounded-lg shadow-xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Evidencias</h3>
                <p className="text-sm text-gray-600">{formatValue(selectedActivity.titulo)}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Adjunta archivos para respaldar esta actividad.
                </p>
                <div>
                  <input
                    id={evidenceInputId}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleEvidenceUpload(e.target.files);
                      e.currentTarget.value = '';
                    }}
                  />
                  <label
                    htmlFor={evidenceInputId}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${uploadingEvidencias ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {uploadingEvidencias ? 'Subiendo...' : 'Subir evidencia'}
                  </label>
                </div>
              </div>

              {uploadSummary && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  {uploadSummary}
                </div>
              )}

              {evidenciasError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                  {evidenciasError}
                </div>
              )}

              {uploadQueue.length > 0 && (
                <div className="space-y-2">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 px-3 py-2">
                      <div className="flex items-center justify-between text-sm text-gray-700">
                        <span className="truncate">{item.file.name}</span>
                        <span>
                          {item.status === 'compressing' && 'Comprimiendo...'}
                          {item.status === 'uploading' && `${item.progress}%`}
                          {item.status === 'success' && 'Completado'}
                          {item.status === 'error' && 'Error'}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      {item.status === 'error' && item.error && (
                        <p className="mt-1 text-xs text-red-600">{item.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {evidenciasLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  Cargando evidencias...
                </div>
              ) : evidencias.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
                  No hay evidencias cargadas.
                </div>
              ) : (
                <ul className="space-y-3">
                  {evidencias.map((ev) => {
                    const isImage = (ev.tipo_archivo || '').startsWith('image/');
                    const fechaSubida = ev.fecha_subida ? formatFecha(ev.fecha_subida) : '—';
                    return (
                      <li key={ev.id_evidencia} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {isImage && (
                            <img
                              src={ev.url_archivo}
                              alt={ev.nombre_original}
                              className="h-12 w-12 rounded object-cover border border-gray-200"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{ev.nombre_original}</p>
                            <p className="text-xs text-gray-500">
                              {ev.tipo_archivo || 'Archivo'} · {fechaSubida}
                            </p>
                          </div>
                        </div>
                        <a
                          href={ev.url_archivo}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                        >
                          Abrir
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {activeModal === 'edit' && selectedActivity && (
        <ActivityForm
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            loadActivities();
          }}
          accessToken={accessToken}
          id_usuario={userId}
          rol={rol}
          mode="edit"
          initialData={selectedActivity}
        />
      )}
    </>
  );
}
