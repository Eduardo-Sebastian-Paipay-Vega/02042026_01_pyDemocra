import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import type { Activity, ActivityStatus, ActivityType, User } from '../components/calendar-mvp/types';

interface ApiActivity {
  id_actividad: number;
  codigo?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  objetivo?: string | null;
  estado?: string | null;
  id_estado?: number | null;
  id_tipo_actividad?: number | null;
  id_responsable?: number | null;
  id_creador?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  ubicacion_direccion?: string | null;
  ubicacion_lat?: number | string | null;
  ubicacion_lng?: number | string | null;
  responsableName?: string | null;
  creadorName?: string | null;
}

export interface DbEvidencia {
  id_evidencia: number;
  id_actividad: number;
  url_archivo: string;
  tipo_archivo: string;
  nombre_original: string;
  fecha_subida: string;
}

export interface ActivityVolunteerDetail {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  horas_total: number;
  fecha_ultima_actualizacion: string | null;
}

export interface ActivityRangeFilters {
  estadoIds?: number[];
  responsableIds?: number[];
  searchText?: string;
}

export interface ListRangeInput {
  accessToken: string;
  from: string;
  to: string;
  filters?: ActivityRangeFilters;
}

export interface ListMonthInput {
  accessToken: string;
  year: number;
  month: number; // 1-12
  filters?: ActivityRangeFilters;
}

export interface ActivityDetailData {
  actividad: Activity | null;
  estado: ActivityStatus | null;
  tipo_actividad: ActivityType | null;
  responsable: User | null;
  creador: User | null;
  voluntarios: ActivityVolunteerDetail[];
  evidencias: DbEvidencia[];
  horas_voluntariado: number;
  estados_actividad: ActivityStatus[];
  warnings: string[];
}

export interface ActivitySummaryPerson {
  id_usuario: number;
  nombre_completo: string;
}

export interface ActivitySummaryData {
  actividad: Activity | null;
  estado: ActivityStatus | null;
  tipo_actividad: ActivityType | null;
  responsable: ActivitySummaryPerson | null;
  warnings: string[];
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const parseCoord = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIsoStartOfDay = (dateKey: string) => `${dateKey}T00:00:00`;
const toIsoEndOfDay = (dateKey: string) => `${dateKey}T23:59:59`;

const pad2 = (value: number) => String(value).padStart(2, '0');
// Postgres columns are `timestamp without time zone`, so we send timestamps without timezone offset.
const toPgTimestamp = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

const assertAccessToken = (accessToken: string) => {
  if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
    throw new Error('No hay sesión activa para consultar actividades');
  }
};

async function fetchApi<T>(accessToken: string, endpoint: string, options: RequestInit = {}): Promise<T> {
  assertAccessToken(accessToken);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      'X-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || `Error ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

function mapActivity(item: ApiActivity): Activity {
  return {
    id_actividad: Number(item.id_actividad),
    codigo: String(item.codigo || ''),
    titulo: String(item.titulo || ''),
    descripcion: item.descripcion || '',
    objetivo: item.objetivo || '',
    fecha_inicio: String(item.fecha_inicio || ''),
    fecha_fin: String(item.fecha_fin || ''),
    ubicacion_direccion: item.ubicacion_direccion || null,
    ubicacion_lat: parseCoord(item.ubicacion_lat),
    ubicacion_lng: parseCoord(item.ubicacion_lng),
    id_tipo_actividad: Number(item.id_tipo_actividad || 0),
    id_creador: Number(item.id_creador || 0),
    id_responsable: Number(item.id_responsable || 0),
    id_estado: Number(item.id_estado || 0),
    responsableName: item.responsableName ?? null,
    creadorName: item.creadorName ?? null,
  };
}

function inRange(activity: Activity, from: Date, to: Date): boolean {
  const start = new Date(activity.fecha_inicio);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() >= from.getTime() && start.getTime() <= to.getTime();
}

function applyFilters(activities: Activity[], filters?: ActivityRangeFilters): Activity[] {
  let rows = [...activities];
  if (filters?.estadoIds && filters.estadoIds.length > 0) {
    rows = rows.filter((activity) => filters.estadoIds?.includes(activity.id_estado));
  }
  if (filters?.responsableIds && filters.responsableIds.length > 0) {
    rows = rows.filter((activity) => filters.responsableIds?.includes(activity.id_responsable));
  }
  if (filters?.searchText?.trim()) {
    const q = normalize(filters.searchText);
    rows = rows.filter((activity) => normalize(`${activity.codigo} ${activity.titulo} ${activity.descripcion || ''}`).includes(q));
  }
  return rows;
}

async function fetchActivities(
  accessToken: string,
  params?: {
    from?: string;
    to?: string;
    filters?: ActivityRangeFilters;
  },
): Promise<ApiActivity[]> {
  const qs = new URLSearchParams();

  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);

  const estadoIds = params?.filters?.estadoIds?.filter((id) => Number.isInteger(id) && id > 0) || [];
  const responsableIds = params?.filters?.responsableIds?.filter((id) => Number.isInteger(id) && id > 0) || [];
  const searchText = params?.filters?.searchText?.trim() || '';

  if (estadoIds.length > 0) qs.set('estadoIds', estadoIds.join(','));
  if (responsableIds.length > 0) qs.set('responsableIds', responsableIds.join(','));
  if (searchText) qs.set('search', searchText);

  const endpoint = qs.toString() ? `/activities?${qs.toString()}` : '/activities';
  const data = await fetchApi<{ activities?: ApiActivity[] }>(accessToken, endpoint);
  return data.activities || [];
}

export async function listActivityStatuses(accessToken: string): Promise<ActivityStatus[]> {
  const data = await fetchApi<{ estados?: Array<{ id_estado: number; nombre: string; ambito: string; color?: string | null }> }>(
    accessToken,
    '/estados?ambito=actividad',
  );

  return (data.estados || []).map((item) => ({
    id_estado: Number(item.id_estado),
    nombre: String(item.nombre || ''),
    ambito: String(item.ambito || 'actividad'),
    color: String(item.color || '').trim(),
  }));
}

export async function listActivityTypes(accessToken: string): Promise<ActivityType[]> {
  const data = await fetchApi<{ tipos?: Array<{ id_tipo_actividad: number; nombre: string }> }>(accessToken, '/tipos-actividad');
  return (data.tipos || []).map((item) => ({
    id_tipo_actividad: Number(item.id_tipo_actividad),
    nombre: String(item.nombre || ''),
  }));
}

export async function listResponsibleUsers(accessToken: string): Promise<User[]> {
  const data = await fetchApi<{ responsables?: Array<{ id_usuario: number; nombre_completo: string; correo?: string | null; id_rol: number }> }>(
    accessToken,
    '/responsables',
  );
  return (data.responsables || []).map((item) => ({
    id_usuario: Number(item.id_usuario),
    nombre_completo: String(item.nombre_completo || ''),
    correo: String(item.correo || ''),
    id_rol: Number(item.id_rol || 0),
    id_estado: 0,
    id_area: null,
    id_organizacion: null,
  }));
}

export async function generateActivityCode(accessToken: string): Promise<string> {
  const payload = await fetchApi<{ codigo?: string | null }>(accessToken, '/actividades/generar-codigo');
  const codigo = String(payload?.codigo || '').trim();
  if (!codigo) {
    throw new Error('No se pudo generar codigo de actividad');
  }
  return codigo;
}

export async function listActivitiesByRange({ accessToken, from, to, filters }: ListRangeInput): Promise<Activity[]> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Rango de fechas inválido');
  }

  const rows = (await fetchActivities(accessToken, { from: toPgTimestamp(fromDate), to: toPgTimestamp(toDate), filters }))
    .map(mapActivity)
    .filter((activity) => inRange(activity, fromDate, toDate));

  const filtered = applyFilters(rows, filters);
  filtered.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
  return filtered;
}

export async function listActivitiesByMonth({ accessToken, year, month, filters }: ListMonthInput): Promise<Activity[]> {
  const monthIndex = Math.max(0, Math.min(11, month - 1));
  const fromDate = new Date(year, monthIndex, 1, 0, 0, 0);
  const toDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

  return listActivitiesByRange({
    accessToken,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    filters,
  });
}

export async function listActivitiesByDay(accessToken: string, dateKey: string, filters?: ActivityRangeFilters): Promise<Activity[]> {
  return listActivitiesByRange({
    accessToken,
    from: toIsoStartOfDay(dateKey),
    to: toIsoEndOfDay(dateKey),
    filters,
  });
}

export async function getActivitySummary(accessToken: string, id_actividad: number): Promise<ActivitySummaryData> {
  const payload = await fetchApi<{
    resumen?: {
      actividad?: ApiActivity | null;
      estado?: ActivityStatus | null;
      tipo_actividad?: ActivityType | null;
      responsable?: { id_usuario: number; nombre_completo?: string | null } | null;
    };
    warnings?: string[];
  }>(accessToken, `/actividades/${id_actividad}/resumen`);

  const resumen = payload?.resumen;
  if (!resumen) {
    throw new Error('El endpoint de resumen no devolvió datos');
  }

  const actividad = resumen.actividad ? mapActivity(resumen.actividad) : null;
  const estado = resumen.estado
    ? {
        id_estado: Number(resumen.estado.id_estado || 0),
        nombre: String(resumen.estado.nombre || ''),
        ambito: String(resumen.estado.ambito || 'actividad'),
        color: String(resumen.estado.color || '').trim(),
      }
    : null;

  const tipo_actividad = resumen.tipo_actividad
    ? {
        id_tipo_actividad: Number(resumen.tipo_actividad.id_tipo_actividad || 0),
        nombre: String(resumen.tipo_actividad.nombre || ''),
      }
    : null;

  const responsable = resumen.responsable
    ? {
        id_usuario: Number(resumen.responsable.id_usuario || 0),
        nombre_completo: String(resumen.responsable.nombre_completo || ''),
      }
    : null;

  return {
    actividad,
    estado,
    tipo_actividad,
    responsable,
    warnings: (payload.warnings || []).map((message) => String(message || '')).filter(Boolean),
  };
}

export async function getActivityDetail(accessToken: string, id_actividad: number): Promise<ActivityDetailData> {
  try {
    const payload = await fetchApi<{
      detalle?: {
        actividad?: ApiActivity | null;
        estado?: ActivityStatus | null;
        tipo_actividad?: ActivityType | null;
        responsable?: User | null;
        creador?: User | null;
        voluntarios?: Array<{
          id_usuario: number;
          nombre_completo?: string | null;
          correo?: string | null;
          horas_total?: number | string | null;
          fecha_ultima_actualizacion?: string | null;
        }>;
        evidencias?: DbEvidencia[];
        horas_voluntariado?: number | string | null;
        estados_actividad?: ActivityStatus[];
      };
      warnings?: string[];
    }>(accessToken, `/actividades/${id_actividad}/detalle`);

    const detail = payload?.detalle;
    if (!detail) {
      throw new Error('El endpoint de detalle no devolvió datos');
    }

    const actividad = detail.actividad ? mapActivity(detail.actividad) : null;
    const estado = detail.estado
      ? {
          id_estado: Number(detail.estado.id_estado || 0),
          nombre: String(detail.estado.nombre || ''),
          ambito: String(detail.estado.ambito || 'actividad'),
          color: String(detail.estado.color || '').trim(),
        }
      : null;

    const tipo_actividad = detail.tipo_actividad
      ? {
          id_tipo_actividad: Number(detail.tipo_actividad.id_tipo_actividad || 0),
          nombre: String(detail.tipo_actividad.nombre || ''),
        }
      : null;

    const mapUser = (user: User | null | undefined): User | null => {
      if (!user) return null;
      return {
        id_usuario: Number(user.id_usuario || 0),
        nombre_completo: String(user.nombre_completo || ''),
        correo: String(user.correo || ''),
        id_rol: Number(user.id_rol || 0),
        id_estado: Number(user.id_estado || 0),
        id_area: user.id_area ?? null,
        id_organizacion: user.id_organizacion ?? null,
      };
    };

    const voluntarios = (detail.voluntarios || []).map((row) => ({
      id_usuario: Number(row.id_usuario || 0),
      nombre_completo: String(row.nombre_completo || `Usuario ${row.id_usuario}`),
      correo: String(row.correo || ''),
      horas_total: Number(row.horas_total || 0),
      fecha_ultima_actualizacion: row.fecha_ultima_actualizacion || null,
    }));

    const evidencias = (detail.evidencias || []).map((item) => ({
      id_evidencia: Number(item.id_evidencia),
      id_actividad: Number(item.id_actividad),
      url_archivo: String(item.url_archivo || ''),
      tipo_archivo: String(item.tipo_archivo || ''),
      nombre_original: String(item.nombre_original || ''),
      fecha_subida: String(item.fecha_subida || ''),
    }));

    const estados_actividad = (detail.estados_actividad || []).map((item) => ({
      id_estado: Number(item.id_estado || 0),
      nombre: String(item.nombre || ''),
      ambito: String(item.ambito || 'actividad'),
      color: String(item.color || '').trim(),
    }));

    return {
      actividad,
      estado,
      tipo_actividad,
      responsable: mapUser(detail.responsable),
      creador: mapUser(detail.creador),
      voluntarios,
      evidencias,
      horas_voluntariado: Number(detail.horas_voluntariado || voluntarios.reduce((sum, row) => sum + row.horas_total, 0)),
      estados_actividad,
      warnings: (payload.warnings || []).map((message) => String(message || '')).filter(Boolean),
    };
  } catch (error) {
    console.warn('Fallo endpoint consolidado de detalle, aplicando fallback legacy:', error);
  }

  const [activitiesRaw, estadosActividad, tiposActividad, responsables, evidenciasResp, relacionesResp] = await Promise.all([
    fetchActivities(accessToken),
    listActivityStatuses(accessToken),
    listActivityTypes(accessToken),
    listResponsibleUsers(accessToken),
    fetchApi<{ evidencias?: DbEvidencia[] }>(accessToken, `/actividades/${id_actividad}/evidencias`),
    fetchApi<{
      relaciones?: Array<{
        id_actividad: number;
        id_usuario?: number | null;
        nombre_voluntario?: string | null;
        correo?: string | null;
        horas_total: number;
        fecha_ultima_actualizacion?: string | null;
      }>;
    }>(accessToken, '/actividad-voluntarios'),
  ]);

  const activityRaw = (activitiesRaw || []).find((item) => Number(item.id_actividad) === Number(id_actividad));
  if (!activityRaw) {
    return {
      actividad: null,
      estado: null,
      tipo_actividad: null,
      responsable: null,
      creador: null,
      voluntarios: [],
      evidencias: [],
      horas_voluntariado: 0,
      estados_actividad: estadosActividad,
      warnings: [],
    };
  }

  const actividad = mapActivity(activityRaw);
  const estado = estadosActividad.find((item) => item.id_estado === actividad.id_estado) || null;
  const tipo_actividad = tiposActividad.find((item) => item.id_tipo_actividad === actividad.id_tipo_actividad) || null;

  const responsableName = String(activityRaw.responsableName || '').trim();
  const creadorName = String(activityRaw.creadorName || '').trim();

  const responsable = responsables.find((item) => item.id_usuario === actividad.id_responsable)
    || (responsableName
      ? {
          id_usuario: actividad.id_responsable,
          nombre_completo: responsableName,
          correo: '',
          id_rol: 0,
          id_estado: 0,
          id_area: null,
          id_organizacion: null,
        }
      : null);

  const creador = responsables.find((item) => item.id_usuario === actividad.id_creador)
    || (creadorName
      ? {
          id_usuario: actividad.id_creador,
          nombre_completo: creadorName,
          correo: '',
          id_rol: 0,
          id_estado: 0,
          id_area: null,
          id_organizacion: null,
        }
      : null);

  const evidencias = (evidenciasResp.evidencias || []).map((item) => ({
    id_evidencia: Number(item.id_evidencia),
    id_actividad: Number(item.id_actividad),
    url_archivo: String(item.url_archivo || ''),
    tipo_archivo: String(item.tipo_archivo || ''),
    nombre_original: String(item.nombre_original || ''),
    fecha_subida: String(item.fecha_subida || ''),
  }));

  const voluntarios = (relacionesResp.relaciones || [])
    .filter((row) => Number(row.id_actividad) === Number(id_actividad))
    .map((row) => ({
      id_usuario: Number(row.id_usuario || 0),
      nombre_completo: String(row.nombre_voluntario || `Usuario ${row.id_usuario || ''}`),
      correo: String(row.correo || ''),
      horas_total: Number(row.horas_total || 0),
      fecha_ultima_actualizacion: row.fecha_ultima_actualizacion || null,
    }));

  const horas_voluntariado = (relacionesResp.relaciones || [])
    .filter((row) => Number(row.id_actividad) === Number(id_actividad))
    .reduce((sum, row) => sum + Number(row.horas_total || 0), 0);

  return {
    actividad,
    estado,
    tipo_actividad,
    responsable,
    creador,
    voluntarios,
    evidencias,
    horas_voluntariado,
    estados_actividad: estadosActividad,
    warnings: [],
  };
}

export async function updateActivityStatus(accessToken: string, id_actividad: number, id_estado: number): Promise<void> {
  await fetchApi(accessToken, `/activities/${id_actividad}/status`, {
    method: 'PUT',
    body: JSON.stringify({ id_estado }),
  });
}

export async function saveActivity(accessToken: string, activity: Activity): Promise<void> {
  const payload = {
    codigo: activity.codigo,
    titulo: activity.titulo,
    descripcion: activity.descripcion,
    objetivo: activity.objetivo,
    fecha_inicio: activity.fecha_inicio,
    fecha_fin: activity.fecha_fin,
    ubicacion_direccion: activity.ubicacion_direccion,
    ubicacion_lat: activity.ubicacion_lat,
    ubicacion_lng: activity.ubicacion_lng,
    id_tipo_actividad: activity.id_tipo_actividad,
    id_creador: activity.id_creador,
    id_responsable: activity.id_responsable,
    id_estado: activity.id_estado,
  };

  const activityId = Number(activity.id_actividad);
  const isEdit = Number.isInteger(activityId) && activityId > 0;

  if (isEdit) {
    await fetchApi(accessToken, `/actividades/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return;
  }

  await fetchApi(accessToken, '/actividades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
