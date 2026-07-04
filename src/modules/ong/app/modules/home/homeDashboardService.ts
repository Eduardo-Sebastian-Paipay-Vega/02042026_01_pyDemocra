import type {
  DashboardActivityDetail,
  DashboardActivityFormInput,
  DashboardActivityRow,
  DashboardAdmissionDetail,
  DashboardAdmissionRow,
  DashboardAlertItem,
  DashboardHoursDetail,
  DashboardHoursRow,
  DashboardMetricValues,
  DashboardTaskOption,
  DashboardTimelineItem,
  DashboardUserContext,
  WeeklyImpactPoint,
} from "./types";
import {
  db,
  formatDateISO,
  formatWeekDayLabel,
  getProjectNameMap,
  getRequiredTenantId,
  getTaskMap,
  getVolunteerNameMap,
  hasCorePermission,
  mapAdmissionStatus,
  mapHourStatusLabel,
  mapHoursStatus,
  mapTaskStatusLabel,
  safeGetCurrentUser,
  sumHours,
  toFriendlyError,
  uniqueNonEmpty,
} from "./homeShared";
import { normalizeText, sanitizeText } from "./validators";

type MetricKey = keyof DashboardMetricValues;

type DashboardActivityStatusCode =
  | "pendiente"
  | "planificada"
  | "en_progreso"
  | "completada"
  | "cancelada";

interface DashboardLocationRow {
  id: string;
  codigo: string;
  nombre_ubicacion: string;
}

function normalizeActivityStatusCode(
  value: string | null | undefined
): DashboardActivityStatusCode {
  const normalized = normalizeText(value);
  if (normalized.includes("cancel")) {
    return "cancelada";
  }
  if (normalized.includes("complet")) {
    return "completada";
  }
  if (normalized.includes("progreso")) {
    return "en_progreso";
  }
  if (normalized.includes("plan")) {
    return "planificada";
  }
  return "pendiente";
}

function mapActivityStatus(
  value: string | null | undefined
): DashboardActivityRow["status"] {
  const statusCode = normalizeActivityStatusCode(value);
  if (statusCode === "en_progreso") {
    return "in-progress";
  }
  if (statusCode === "completada") {
    return "completed";
  }
  if (statusCode === "cancelada") {
    return "cancelled";
  }
  return "scheduled";
}

function mapActivityStatusLabel(value: string | null | undefined): string {
  const statusCode = normalizeActivityStatusCode(value);
  if (statusCode === "planificada") {
    return "Planificada";
  }
  if (statusCode === "en_progreso") {
    return "En progreso";
  }
  if (statusCode === "completada") {
    return "Completada";
  }
  if (statusCode === "cancelada") {
    return "Cancelada";
  }
  return "Pendiente";
}

function getActivityPrimaryDate(row: {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
}): string {
  return row.fecha_inicio ?? row.fecha_fin ?? row.created_at;
}

function activityIncludesDate(
  row: { fecha_inicio: string | null; fecha_fin: string | null },
  dateKey: string
): boolean {
  const start = row.fecha_inicio ? row.fecha_inicio.slice(0, 10) : null;
  const end = row.fecha_fin ? row.fecha_fin.slice(0, 10) : start;

  if (!start && !end) {
    return false;
  }
  if (start && end) {
    return start <= dateKey && end >= dateKey;
  }
  return (start ?? end) === dateKey;
}

async function getLocationNameMap(
  locationIds: string[],
  tenantId: string
): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(locationIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await db
    .schema("ong")
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as DashboardLocationRow[]).map((row) => [
      row.id,
      `${row.codigo} - ${row.nombre_ubicacion}`,
    ])
  );
}

interface DashboardApprovalRow {
  id: string;
  comentario: string | null;
}

export interface MetricFetchResult {
  value: number;
  error: string | null;
}

export type DashboardMetricsByKey = Record<MetricKey, MetricFetchResult>;

function mapMetricResult(value: number): MetricFetchResult {
  return { value, error: null };
}

function mapMetricError(error: unknown, fallback: string): MetricFetchResult {
  return { value: 0, error: toFriendlyError(error, fallback) };
}

async function resolveHourApprovalRecord(
  tenantId: string,
  hourId: string,
  currentApprovalId: string | null
): Promise<DashboardApprovalRow | null> {
  let query = db
    .schema("ong")
    .from("aprobaciones")
    .select("id, comentario")
    .eq("tenant_id", tenantId);

  if (currentApprovalId) {
    query = query.eq("id", currentApprovalId);
  } else {
    query = query
      .eq("entidad_schema", "ong")
      .eq("entidad_tabla", "horas_actividad")
      .eq("entidad_id", hourId)
      .eq("tipo_aprobacion", "hora")
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(1);
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DashboardApprovalRow[])[0] ?? null;
}

async function syncDashboardHourApproval(options: {
  tenantId: string;
  hourId: string;
  currentApprovalId: string | null;
  requestedBy: string | null;
  actorId: string | null;
  targetState: "pendiente" | "aprobada" | "rechazada";
  comment: string | null;
}): Promise<string> {
  const approval = await resolveHourApprovalRecord(
    options.tenantId,
    options.hourId,
    options.currentApprovalId
  );
  const nowIso = new Date().toISOString();
  const requestedBy = options.requestedBy ?? options.actorId ?? null;

  if (approval?.id) {
    const updatePayload: Record<string, string | null> = {
      estado: options.targetState,
      comentario: options.comment,
      solicitado_por: requestedBy,
      resuelto_por: options.targetState === "pendiente" ? null : options.actorId ?? null,
      resolved_at: options.targetState === "pendiente" ? null : nowIso,
      updated_by: options.actorId ?? requestedBy,
      updated_at: nowIso,
    };

    if (options.targetState === "pendiente") {
      updatePayload.requested_at = nowIso;
    }

    const { error } = await db
      .schema("ong")
      .from("aprobaciones")
      .update(updatePayload)
      .eq("tenant_id", options.tenantId)
      .eq("id", approval.id);

    if (error) {
      throw new Error(error.message);
    }

    return approval.id;
  }

  const { data, error } = await db
    .schema("ong")
    .from("aprobaciones")
    .insert({
      tenant_id: options.tenantId,
      modulo: "operation",
      entidad_schema: "ong",
      entidad_tabla: "horas_actividad",
      entidad_id: options.hourId,
      tipo_aprobacion: "hora",
      estado: options.targetState,
      comentario: options.comment,
      solicitado_por: requestedBy,
      resuelto_por: options.targetState === "pendiente" ? null : options.actorId ?? null,
      requested_at: nowIso,
      resolved_at: options.targetState === "pendiente" ? null : nowIso,
      created_by: options.actorId ?? requestedBy,
      updated_by: options.actorId ?? requestedBy,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as { id: string }).id;
}

async function fetchRoleNamesByUser(userId: string, tenantId: string): Promise<string[]> {
  const { data: assignments, error: assignmentError } = await db
    .schema("public")
    .from("user_roles_sedes")
    .select("role_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .limit(1000);

  if (assignmentError) throw new Error(assignmentError.message);

  const roleIds = uniqueNonEmpty((assignments ?? []).map((item) => item.role_id));
  if (!roleIds.length) return [];

  const { data: roles, error: rolesError } = await db
    .schema("public")
    .from("roles")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .in("id", roleIds);

  if (rolesError) throw new Error(rolesError.message);
  return (roles ?? []).map((row) => row.name).filter((value) => value.trim().length > 0);
}

async function isTenantAdminByRpc(): Promise<boolean> {
  try {
    const { data, error } = await db.rpc("fn_is_tenant_admin");
    return !error && data === true;
  } catch {
    return false;
  }
}

async function resolveActiveVolunteerCodes(): Promise<string[]> {
  const { data, error } = await db.schema("ong").from("estados_voluntario").select("codigo, nombre_estado").order("orden_visual", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const explicit = rows.filter((row) => normalizeText(row.nombre_estado) === "activo").map((row) => row.codigo);
  if (explicit.length > 0) return explicit;
  return rows
    .filter((row) => {
      const normalized = normalizeText(row.nombre_estado);
      return normalized.includes("activo") && !normalized.includes("inactivo") && !normalized.includes("suspend");
    })
    .map((row) => row.codigo);
}

async function resolveActiveProjectCodes(): Promise<string[]> {
  const { data, error } = await db.schema("ong").from("estados_proyecto").select("codigo, nombre_estado").order("orden_visual", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const explicit = rows
    .filter((row) => {
      const normalized = normalizeText(row.nombre_estado);
      return normalized.includes("ejec") || normalized.includes("activo") || normalized.includes("curso");
    })
    .map((row) => row.codigo);
  if (explicit.length > 0) return explicit;
  return rows
    .filter((row) => !normalizeText(row.nombre_estado).includes("complet") && !normalizeText(row.nombre_estado).includes("cancel"))
    .map((row) => row.codigo);
}

async function countActiveActivities(tenantId: string): Promise<number> {
  const { count, error } = await db
    .schema("ong")
    .from("actividades")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("codigo_estado", ["pendiente", "planificada", "en_progreso"]);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchDashboardUserContext(): Promise<DashboardUserContext> {
  const user = await safeGetCurrentUser();
  if (!user) {
    return { userId: null, userName: "Invitado", roleNames: [], isTenantAdmin: false, canManageActivities: false, canResolveHours: false, canResolveAdmissions: false };
  }

  const tenantId = await getRequiredTenantId().catch(() => null);
  const roleNamesPromise = tenantId ? fetchRoleNamesByUser(user.id, tenantId).catch(() => [] as string[]) : Promise.resolve([] as string[]);
  const capabilitiesPromise = Promise.all([
    hasCorePermission("operation.activities.manage"),
    hasCorePermission("operation.hours.approve"),
    hasCorePermission("admission.approve"),
  ]);

  let profileQuery = db.schema("public").from("profiles").select("id, full_name").eq("id", user.id).limit(1);
  if (tenantId) profileQuery = profileQuery.eq("tenant_id", tenantId);

  const [isTenantAdmin, roleNames, profileResult, capabilities] = await Promise.all([
    isTenantAdminByRpc(),
    roleNamesPromise,
    profileQuery,
    capabilitiesPromise,
  ]);
  const profile = profileResult.data?.[0] ?? null;
  const [canManageActivities, canResolveHours, canResolveAdmissions] = capabilities;

  return {
    userId: user.id,
    userName: profile?.full_name?.trim() || user.email || "Usuario",
    roleNames,
    isTenantAdmin,
    canManageActivities: isTenantAdmin || canManageActivities,
    canResolveHours: isTenantAdmin || canResolveHours,
    canResolveAdmissions: isTenantAdmin || canResolveAdmissions,
  };
}

export async function fetchDashboardMetrics(): Promise<DashboardMetricsByKey> {
  const tenantId = await getRequiredTenantId();
  const [volunteerCodes, projectCodes] = await Promise.all([resolveActiveVolunteerCodes().catch(() => []), resolveActiveProjectCodes().catch(() => [])]);

  const tasks: Record<MetricKey, () => Promise<number>> = {
    volunteersActive: async () => {
      let query = db.schema("ong").from("voluntarios").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
      if (volunteerCodes.length > 0) query = query.in("codigo_estado", volunteerCodes);
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    projectsActive: async () => {
      let query = db.schema("ong").from("proyectos").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
      if (projectCodes.length > 0) query = query.in("codigo_estado", projectCodes);
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    activitiesActive: () => countActiveActivities(tenantId),
    hoursRegistered: () => sumHours({ tenantId }),
    hoursApproved: () => sumHours({ onlyApproved: true, tenantId }),
    evidencesUploaded: async () => {
      const { count, error } = await db.schema("ong").from("evidencias_actividad").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    admissionPending: async () => {
      const { count, error } = await db.schema("rrhh").from("solicitudes_admision").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).in("estado", ["nueva", "en_entrevista"]);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    approvalsPending: async () => {
      const { count, error } = await db
        .schema("ong")
        .from("aprobaciones")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("entidad_schema", "ong")
        .eq("entidad_tabla", "horas_actividad")
        .eq("tipo_aprobacion", "hora")
        .eq("estado", "pendiente");
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  };

  const keys = Object.keys(tasks) as MetricKey[];
  const settled = await Promise.allSettled(keys.map((key) => tasks[key]()));
  const base: DashboardMetricsByKey = {
    volunteersActive: { value: 0, error: null },
    projectsActive: { value: 0, error: null },
    activitiesActive: { value: 0, error: null },
    hoursRegistered: { value: 0, error: null },
    hoursApproved: { value: 0, error: null },
    evidencesUploaded: { value: 0, error: null },
    admissionPending: { value: 0, error: null },
    approvalsPending: { value: 0, error: null },
  };

  return keys.reduce<DashboardMetricsByKey>((acc, key, index) => {
    const result = settled[index];
    acc[key] = result.status === "fulfilled" ? mapMetricResult(result.value) : mapMetricError(result.reason, `No se pudo cargar la metrica ${key}.`);
    return acc;
  }, base);
}

export async function fetchDashboardRecentHours(limit = 5): Promise<DashboardHoursRow[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await db
    .schema("ong")
    .from("horas_actividad")
    .select("id, id_voluntario, id_actividad, horas_registradas, fecha, estado_aprobacion, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(toFriendlyError(error, "No se pudieron cargar las horas recientes."));

  const rows = data ?? [];
  if (!rows.length) return [];

  const [volunteerMap, activitiesResult] = await Promise.all([
    getVolunteerNameMap(uniqueNonEmpty(rows.map((row) => row.id_voluntario)), tenantId),
    db.schema("ong").from("actividades").select("id, id_tarea, titulo").eq("tenant_id", tenantId).in("id", uniqueNonEmpty(rows.map((row) => row.id_actividad))),
  ]);
  if (activitiesResult.error) throw new Error("No se pudo resolver el nombre de las actividades.");
  const activityRows = activitiesResult.data ?? [];
  const taskMap = await getTaskMap(uniqueNonEmpty(activityRows.map((row) => row.id_tarea)), tenantId);
  const projectMap = await getProjectNameMap(uniqueNonEmpty(Array.from(taskMap.values()).map((task) => task.projectId)), tenantId);
  const activityById = new Map(activityRows.map((row) => [row.id, row]));

  return rows.map((row) => {
    const activity = activityById.get(row.id_actividad);
    const task = activity ? taskMap.get(activity.id_tarea) : null;
    return {
      id: row.id,
      volunteerName: volunteerMap.get(row.id_voluntario) ?? "Voluntario",
      activityName: activity?.titulo ?? "Actividad",
      hours: Math.round(Number(row.horas_registradas ?? 0) * 10) / 10,
      date: row.fecha,
      status: mapHoursStatus(row.estado_aprobacion),
      statusLabel: mapHourStatusLabel(row.estado_aprobacion),
      volunteerId: row.id_voluntario,
      activityId: row.id_actividad,
      projectName: task ? projectMap.get(task.projectId) ?? "Proyecto" : "Proyecto",
    };
  });
}

export async function fetchDashboardRecentActivities(limit = 5): Promise<DashboardActivityRow[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await db
    .schema("ong")
    .from("actividades")
    .select(
      "id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(toFriendlyError(error, "No se pudieron cargar las actividades recientes."));

  const rows = data ?? [];
  if (!rows.length) return [];

  const [taskMap, locationMap, assignmentResult] = await Promise.all([
    getTaskMap(uniqueNonEmpty(rows.map((row) => row.id_tarea)), tenantId),
    getLocationNameMap(
      uniqueNonEmpty(rows.map((row) => row.id_ubicacion)),
      tenantId
    ),
    db
      .schema("ong")
      .from("asignaciones_actividad")
      .select("id, id_actividad")
      .eq("tenant_id", tenantId)
      .eq("is_deleted", false)
      .in("id_actividad", rows.map((row) => row.id)),
  ]);
  const projectMap = await getProjectNameMap(
    uniqueNonEmpty(Array.from(taskMap.values()).map((task) => task.projectId)),
    tenantId
  );
  const { data: assignmentRows, error: assignmentError } = assignmentResult;
  if (assignmentError) throw new Error(assignmentError.message);

  const assignmentCountByActivity = new Map<string, number>();
  for (const assignment of assignmentRows ?? []) {
    assignmentCountByActivity.set(assignment.id_actividad, (assignmentCountByActivity.get(assignment.id_actividad) ?? 0) + 1);
  }

  return rows.map((row) => {
    const task = taskMap.get(row.id_tarea);
    const projectName = task ? projectMap.get(task.projectId) ?? "Proyecto" : "Proyecto";
    const statusCode = normalizeActivityStatusCode(row.codigo_estado);
    return {
      id: row.id,
      name: row.titulo,
      description: row.descripcion ?? "",
      projectName,
      date: getActivityPrimaryDate(row).slice(0, 10),
      assignedVolunteers: assignmentCountByActivity.get(row.id) ?? 0,
      status: mapActivityStatus(row.codigo_estado),
      statusLabel: mapActivityStatusLabel(row.codigo_estado),
      statusCode,
      startAt: row.fecha_inicio,
      endAt: row.fecha_fin,
      locationId: row.id_ubicacion,
      locationName: row.id_ubicacion ? locationMap.get(row.id_ubicacion) ?? null : null,
      taskId: row.id_tarea,
      taskName: task?.title ?? "Tarea",
      taskStatus: mapTaskStatusLabel(task?.status),
      estimatedHours: row.horas_estimadas === null ? null : Math.round(Number(row.horas_estimadas) * 10) / 10,
    };
  });
}

export async function fetchDashboardRecentAdmissionRequests(limit = 5): Promise<DashboardAdmissionRow[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await db
    .schema("rrhh")
    .from("solicitudes_admision")
    .select("id, nombres, apellidos, email, estado, fecha_solicitud, notas")
    .eq("tenant_id", tenantId)
    .order("fecha_solicitud", { ascending: false })
    .limit(limit);
  if (error) throw new Error(toFriendlyError(error, "No se pudieron cargar las solicitudes recientes."));
  return (data ?? []).map((row) => ({
    id: row.id,
    name: `${row.nombres} ${row.apellidos}`.trim(),
    email: row.email,
    submittedAt: row.fecha_solicitud ?? "",
    status: mapAdmissionStatus(row.estado),
    statusRaw: row.estado ?? undefined,
    notes: row.notas ?? undefined,
  }));
}

export async function fetchWeeklyImpact(): Promise<WeeklyImpactPoint[]> {
  const tenantId = await getRequiredTenantId();
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  const { data, error } = await db
    .schema("ong")
    .from("horas_actividad")
    .select("id, fecha, horas_registradas")
    .eq("tenant_id", tenantId)
    .gte("fecha", formatDateISO(startDate))
    .lte("fecha", formatDateISO(endDate))
    .eq("estado_aprobacion", "aprobada");
  if (error) throw new Error(toFriendlyError(error, "No se pudo cargar el impacto semanal."));

  const hoursByDate = new Map<string, number>();
  for (const row of data ?? []) {
    hoursByDate.set(row.fecha, (hoursByDate.get(row.fecha) ?? 0) + Number(row.horas_registradas ?? 0));
  }

  const points: WeeklyImpactPoint[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);
    const key = formatDateISO(date);
    points.push({ label: formatWeekDayLabel(date), value: Math.round((hoursByDate.get(key) ?? 0) * 10) / 10 });
  }
  return points;
}

export async function fetchTodayTimeline(limit = 6): Promise<DashboardTimelineItem[]> {
  const tenantId = await getRequiredTenantId();
  const today = formatDateISO(new Date());
  const { data: activities, error: activityError } = await db
    .schema("ong")
    .from("actividades")
    .select("id, id_tarea, titulo, codigo_estado, fecha_inicio, fecha_fin, created_at")
    .eq("tenant_id", tenantId)
    .order("fecha_inicio", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(240);
  if (activityError) throw new Error(toFriendlyError(activityError, "No se pudo cargar la agenda de hoy."));

  const dotColorByStatus: Record<DashboardActivityRow["status"], string> = {
    scheduled: "bg-[#3D6BFF]",
    "in-progress": "bg-amber-400",
    completed: "bg-emerald-400",
    cancelled: "bg-red-400",
  };

  const rows = (activities ?? []).filter((activity) => activityIncludesDate(activity, today));
  if (!rows.length) {
    return [];
  }

  const taskMap = await getTaskMap(uniqueNonEmpty(rows.map((activity) => activity.id_tarea)), tenantId);
  const projectMap = await getProjectNameMap(
    uniqueNonEmpty(Array.from(taskMap.values()).map((task) => task.projectId)),
    tenantId
  );

  return rows.slice(0, limit).map((activity) => {
    const task = taskMap.get(activity.id_tarea);
    const status = mapActivityStatus(activity.codigo_estado);
    return {
      id: activity.id,
      title: activity.titulo,
      subtitle: `${task?.title ?? "Tarea"} - ${task ? projectMap.get(task.projectId) ?? "Proyecto" : "Proyecto"}`,
      time: activity.fecha_inicio ?? activity.fecha_fin ?? "Hoy",
      dotColor: dotColorByStatus[status],
    };
  });
}

export function buildDashboardAlerts(metrics: DashboardMetricValues): DashboardAlertItem[] {
  const alerts: DashboardAlertItem[] = [];
  if (metrics.approvalsPending > 0) {
    alerts.push({ id: "alerts-hours-pending", text: `${metrics.approvalsPending} horas pendientes de aprobacion`, type: "warning" });
  }
  if (metrics.admissionPending > 0) {
    alerts.push({ id: "alerts-admission-pending", text: `${metrics.admissionPending} solicitudes de admision por revisar`, type: "info" });
  }
  if (metrics.hoursApproved > 0) {
    alerts.push({ id: "alerts-hours-approved", text: `${metrics.hoursApproved} horas ya aprobadas`, type: "secondary" });
  }
  if (!alerts.length) {
    alerts.push({ id: "alerts-clear", text: "No hay pendientes criticos en este momento", type: "secondary" });
  }
  return alerts.slice(0, 3);
}

export function formatMetricValue(metricKey: MetricKey, value: number): string | number {
  if (metricKey === "hoursRegistered" || metricKey === "hoursApproved") {
    return `${value.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}h`;
  }
  return value.toLocaleString("es-PE");
}

export async function fetchActivityTaskOptions(limit = 300): Promise<DashboardTaskOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await db
    .schema("ong")
    .from("tareas")
    .select("id, id_proyecto, titulo, estado, fecha_limite, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(toFriendlyError(error, "No se pudo cargar el catalogo de tareas."));
  const tasks = data ?? [];
  const projectMap = await getProjectNameMap(uniqueNonEmpty(tasks.map((task) => task.id_proyecto)), tenantId);
  return tasks.map((task) => {
    const projectName = projectMap.get(task.id_proyecto) ?? "Proyecto";
    return {
      value: task.id,
      label: `${task.titulo} (${projectName})`,
      taskTitle: task.titulo,
      projectName,
      taskStatus: mapTaskStatusLabel(task.estado),
      dueDate: task.fecha_limite,
    };
  });
}

export async function fetchActivityLocationOptions(): Promise<
  Array<{ value: string; label: string }>
> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await db
    .schema("ong")
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion")
    .eq("tenant_id", tenantId)
    .order("codigo", { ascending: true })
    .limit(300);
  if (error) {
    throw new Error(toFriendlyError(error, "No se pudo cargar el catalogo de ubicaciones."));
  }

  return ((data ?? []) as DashboardLocationRow[]).map((row) => ({
    value: row.id,
    label: `${row.codigo} - ${row.nombre_ubicacion}`,
  }));
}

async function ensureActivityLocationExists(
  tenantId: string,
  locationId: string | null
): Promise<void> {
  if (!locationId) {
    return;
  }

  const { data, error } = await db
    .schema("ong")
    .from("ubicaciones")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", locationId)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("La ubicacion seleccionada ya no existe.");
  }
}

export async function createDashboardActivity(
  input: DashboardActivityFormInput
): Promise<DashboardActivityDetail> {
  const tenantId = await getRequiredTenantId();
  const currentUser = await safeGetCurrentUser();
  const taskId = sanitizeText(input.taskId, 80);
  const title = sanitizeText(input.title, 200);
  const description = sanitizeText(input.description, 4000) || "";
  const statusCode = normalizeActivityStatusCode(input.statusCode);
  const startAt = sanitizeText(input.startAt ?? "", 40) || null;
  const endAt = sanitizeText(input.endAt ?? "", 40) || null;
  const locationId = sanitizeText(input.locationId ?? "", 80) || null;

  if (!taskId) throw new Error("Selecciona una tarea para crear la actividad.");
  if (!title) throw new Error("El titulo de la actividad es obligatorio.");
  if (input.estimatedHours !== null && (!Number.isFinite(input.estimatedHours) || input.estimatedHours <= 0)) {
    throw new Error("Las horas estimadas deben ser mayores a cero.");
  }
  if (startAt && endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
    throw new Error("La fecha fin no puede ser menor a la fecha inicio.");
  }

  const { data: taskRows, error: taskError } = await db
    .schema("ong")
    .from("tareas")
    .select("id, estado")
    .eq("tenant_id", tenantId)
    .eq("id", taskId)
    .limit(1);
  if (taskError) throw new Error(taskError.message);
  if (!taskRows?.length) throw new Error("La tarea seleccionada ya no existe.");
  if (taskRows[0].estado === "cancelada") throw new Error("No se puede crear actividad sobre una tarea cancelada.");
  await ensureActivityLocationExists(tenantId, locationId);

  const { data: insertedRows, error: insertError } = await db
    .schema("ong")
    .from("actividades")
    .insert({
      tenant_id: tenantId,
      id_tarea: taskId,
      titulo: title,
      descripcion: description || null,
      codigo_estado: statusCode,
      fecha_inicio: startAt,
      fecha_fin: endAt,
      id_ubicacion: locationId,
      horas_estimadas: input.estimatedHours === null ? null : Math.round(input.estimatedHours * 100) / 100,
      created_by: currentUser?.id ?? null,
      updated_by: currentUser?.id ?? null,
    })
    .select("id")
    .limit(1);
  if (insertError) throw new Error(insertError.message);

  const activityId = insertedRows?.[0]?.id;
  if (!activityId) throw new Error("No se pudo recuperar la actividad creada.");
  return fetchDashboardActivityDetail(activityId);
}

export async function updateDashboardActivity(
  activityId: string,
  input: DashboardActivityFormInput
): Promise<DashboardActivityDetail> {
  const tenantId = await getRequiredTenantId();
  const currentUser = await safeGetCurrentUser();
  const sanitizedActivityId = sanitizeText(activityId, 80);
  const taskId = sanitizeText(input.taskId, 80);
  const title = sanitizeText(input.title, 200);
  const description = sanitizeText(input.description, 4000) || "";
  const statusCode = normalizeActivityStatusCode(input.statusCode);
  const startAt = sanitizeText(input.startAt ?? "", 40) || null;
  const endAt = sanitizeText(input.endAt ?? "", 40) || null;
  const locationId = sanitizeText(input.locationId ?? "", 80) || null;

  if (!sanitizedActivityId) throw new Error("No se encontro la actividad a actualizar.");
  if (!taskId) throw new Error("Selecciona una tarea valida.");
  if (!title) throw new Error("El titulo de la actividad es obligatorio.");
  if (startAt && endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
    throw new Error("La fecha fin no puede ser menor a la fecha inicio.");
  }

  const { data: taskRows, error: taskError } = await db
    .schema("ong")
    .from("tareas")
    .select("id, estado")
    .eq("tenant_id", tenantId)
    .eq("id", taskId)
    .limit(1);
  if (taskError) throw new Error(taskError.message);
  if (!taskRows?.length) throw new Error("La tarea seleccionada ya no existe.");
  if (taskRows[0].estado === "cancelada") throw new Error("No se puede mover una actividad a una tarea cancelada.");
  await ensureActivityLocationExists(tenantId, locationId);

  const { data: existsRows, error: existsError } = await db
    .schema("ong")
    .from("actividades")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", sanitizedActivityId)
    .limit(1);
  if (existsError) throw new Error(existsError.message);
  if (!existsRows?.length) throw new Error("La actividad ya no existe.");

  const { error: updateError } = await db
    .schema("ong")
    .from("actividades")
    .update({
      id_tarea: taskId,
      titulo: title,
      descripcion: description || null,
      codigo_estado: statusCode,
      fecha_inicio: startAt,
      fecha_fin: endAt,
      id_ubicacion: locationId,
      horas_estimadas: input.estimatedHours === null ? null : Math.round(input.estimatedHours * 100) / 100,
      updated_by: currentUser?.id ?? null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", sanitizedActivityId);
  if (updateError) throw new Error(updateError.message);

  return fetchDashboardActivityDetail(sanitizedActivityId);
}

export async function cancelDashboardActivity(activityId: string): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const currentUser = await safeGetCurrentUser();
  const sanitizedActivityId = sanitizeText(activityId, 80);
  if (!sanitizedActivityId) throw new Error("No se encontro la actividad para cancelar.");

  const { error: updateError } = await db
    .schema("ong")
    .from("actividades")
    .update({
      codigo_estado: "cancelada",
      updated_by: currentUser?.id ?? null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", sanitizedActivityId);
  if (updateError) throw new Error(updateError.message);
}

export async function fetchDashboardActivityDetail(
  activityId: string
): Promise<DashboardActivityDetail> {
  const tenantId = await getRequiredTenantId();
  const sanitizedActivityId = sanitizeText(activityId, 80);
  if (!sanitizedActivityId) throw new Error("No se encontro la actividad solicitada.");

  const { data: activityRows, error: activityError } = await db
    .schema("ong")
    .from("actividades")
    .select(
      "id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", sanitizedActivityId)
    .limit(1);
  if (activityError) throw new Error(activityError.message);

  const activity = activityRows?.[0] ?? null;
  if (!activity) throw new Error("La actividad ya no existe.");

  const [taskMap, locationMap, assignmentsResult, evidenceResult, registeredHours] = await Promise.all([
    getTaskMap([activity.id_tarea], tenantId),
    getLocationNameMap(activity.id_ubicacion ? [activity.id_ubicacion] : [], tenantId),
    db.schema("ong").from("asignaciones_actividad").select("id, id_voluntario, rol_en_actividad").eq("tenant_id", tenantId).eq("id_actividad", activity.id).eq("is_deleted", false),
    db.schema("ong").from("evidencias_actividad").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("id_actividad", activity.id),
    sumHours({ activityId: activity.id, tenantId }),
  ]);

  if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
  if (evidenceResult.error) throw new Error(evidenceResult.error.message);

  const task = taskMap.get(activity.id_tarea);
  if (!task) throw new Error("No se pudo resolver la tarea relacionada.");
  const projectMap = await getProjectNameMap([task.projectId], tenantId);
  const volunteerMap = await getVolunteerNameMap(uniqueNonEmpty((assignmentsResult.data ?? []).map((row) => row.id_voluntario)), tenantId);

  return {
    id: activity.id,
    title: activity.titulo,
    description: activity.descripcion ?? "",
    estimatedHours: activity.horas_estimadas === null ? null : Math.round(Number(activity.horas_estimadas) * 10) / 10,
    createdAt: activity.created_at,
    status: mapActivityStatus(activity.codigo_estado),
    statusCode: normalizeActivityStatusCode(activity.codigo_estado),
    statusLabel: mapActivityStatusLabel(activity.codigo_estado),
    startAt: activity.fecha_inicio,
    endAt: activity.fecha_fin,
    locationId: activity.id_ubicacion,
    locationName: activity.id_ubicacion ? locationMap.get(activity.id_ubicacion) ?? null : null,
    taskId: task.id,
    taskTitle: task.title,
    taskStatus: mapTaskStatusLabel(task.status),
    taskDueDate: task.dueDate,
    projectName: projectMap.get(task.projectId) ?? "Proyecto",
    assignments: (assignmentsResult.data ?? []).map((assignment) => ({
      id: assignment.id,
      volunteerName: volunteerMap.get(assignment.id_voluntario) ?? assignment.id_voluntario,
      role: assignment.rol_en_actividad ?? "Sin rol",
    })),
    registeredHours,
    evidenceCount: evidenceResult.count ?? 0,
  };
}

export async function fetchDashboardHourDetail(hourId: string): Promise<DashboardHoursDetail> {
  const tenantId = await getRequiredTenantId();
  const sanitizedHourId = sanitizeText(hourId, 80);
  if (!sanitizedHourId) throw new Error("No se encontro el registro de horas.");

  const { data: hourRows, error: hourError } = await db
    .schema("ong")
    .from("horas_actividad")
    .select("id, id_actividad, id_voluntario, horas_registradas, fecha, estado_aprobacion, aprobado_por, id_aprobacion, comentario_resolucion, created_at")
    .eq("tenant_id", tenantId)
    .eq("id", sanitizedHourId)
    .limit(1);
  if (hourError) throw new Error(hourError.message);

  const row = hourRows?.[0] ?? null;
  if (!row) throw new Error("El registro de horas ya no existe.");

  const [volunteerMap, activityResult, profileResult] = await Promise.all([
    getVolunteerNameMap([row.id_voluntario], tenantId),
    db.schema("ong").from("actividades").select("id, id_tarea, titulo").eq("tenant_id", tenantId).eq("id", row.id_actividad).limit(1),
    row.aprobado_por
      ? db.schema("public").from("profiles").select("id, full_name").eq("tenant_id", tenantId).eq("id", row.aprobado_por).limit(1)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }>, error: null }),
  ]);

  if (activityResult.error) throw new Error(activityResult.error.message);
  if (profileResult.error) throw new Error(profileResult.error.message);

  const activity = activityResult.data?.[0] ?? null;
  if (!activity) throw new Error("No se pudo resolver la actividad asociada.");

  const taskMap = await getTaskMap([activity.id_tarea], tenantId);
  const task = taskMap.get(activity.id_tarea);
  const projectMap = await getProjectNameMap(task ? [task.projectId] : [], tenantId);
  const approvedBy = row.aprobado_por && profileResult.data?.[0] ? profileResult.data[0].full_name || row.aprobado_por : row.aprobado_por;
  const approvalRecord = await resolveHourApprovalRecord(tenantId, row.id, row.id_aprobacion);

  return {
    id: row.id,
    activityName: activity.titulo,
    projectName: task ? projectMap.get(task.projectId) ?? "Proyecto" : "Proyecto",
    volunteerName: volunteerMap.get(row.id_voluntario) ?? row.id_voluntario,
    date: row.fecha,
    hoursRegistered: Math.round(Number(row.horas_registradas ?? 0) * 10) / 10,
    status: mapHoursStatus(row.estado_aprobacion),
    statusLabel: mapHourStatusLabel(row.estado_aprobacion),
    approvedBy: approvedBy ?? null,
    approvalComment: approvalRecord?.comentario ?? row.comentario_resolucion ?? null,
    createdAt: row.created_at,
  };
}

export async function resolveDashboardHour(options: {
  hourId: string;
  targetStatus: "approved" | "rejected";
  reviewerId?: string | null;
  comment?: string;
}): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const currentUser = await safeGetCurrentUser();
  const hourId = sanitizeText(options.hourId, 80);
  const reviewerId = sanitizeText(options.reviewerId ?? "", 80) || currentUser?.id || null;
  const comment = sanitizeText(options.comment ?? "", 500) || null;
  if (!hourId) throw new Error("No se encontro el registro de horas.");

  const targetDbStatus = options.targetStatus === "approved" ? "aprobada" : "rechazada";
  const { data: currentRows, error: currentError } = await db
    .schema("ong")
    .from("horas_actividad")
    .select("id, created_by, id_aprobacion, comentario_resolucion")
    .eq("tenant_id", tenantId)
    .eq("id", hourId)
    .limit(1);
  if (currentError) throw new Error(currentError.message);
  const current = currentRows?.[0] ?? null;
  if (!current) throw new Error("El registro de horas ya no existe.");

  const approvalId = await syncDashboardHourApproval({
    tenantId,
    hourId,
    currentApprovalId: current.id_aprobacion,
    requestedBy: current.created_by,
    actorId: reviewerId,
    targetState: targetDbStatus,
    comment,
  });

  const { error: updateError } = await db
    .schema("ong")
    .from("horas_actividad")
    .update({
      estado_aprobacion: targetDbStatus,
      aprobado_por: reviewerId,
      id_aprobacion: approvalId,
      comentario_resolucion: comment ?? current.comentario_resolucion ?? null,
      updated_by: reviewerId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", hourId);
  if (updateError) throw new Error(updateError.message);
}

export async function fetchDashboardAdmissionDetail(requestId: string): Promise<DashboardAdmissionDetail> {
  const tenantId = await getRequiredTenantId();
  const sanitizedRequestId = sanitizeText(requestId, 80);
  if (!sanitizedRequestId) throw new Error("No se encontro la solicitud de admision.");

  const { data: requestRows, error: requestError } = await db
    .schema("rrhh")
    .from("solicitudes_admision")
    .select("id, nombres, apellidos, email, estado, fecha_solicitud, notas")
    .eq("tenant_id", tenantId)
    .eq("id", sanitizedRequestId)
    .limit(1);
  if (requestError) throw new Error(requestError.message);

  const request = requestRows?.[0] ?? null;
  if (!request) throw new Error("La solicitud ya no existe.");

  const { data: historyRows, error: historyError } = await db
    .schema("rrhh")
    .from("admision_estado_historial")
    .select("id, id_solicitud, estado_anterior, estado_nuevo, comentario, cambiado_por, fecha_cambio")
    .eq("tenant_id", tenantId)
    .eq("id_solicitud", request.id)
    .order("fecha_cambio", { ascending: false })
    .limit(30);
  if (historyError) throw new Error(historyError.message);

  const changedByIds = uniqueNonEmpty((historyRows ?? []).map((row) => row.cambiado_por));
  const profileNameById = new Map<string, string>();
  if (changedByIds.length > 0) {
    const { data: profileRows, error: profileError } = await db
      .schema("public")
      .from("profiles")
      .select("id, full_name")
      .eq("tenant_id", tenantId)
      .in("id", changedByIds);
    if (profileError) throw new Error(profileError.message);
    for (const profile of profileRows ?? []) {
      profileNameById.set(profile.id, profile.full_name || profile.id);
    }
  }

  return {
    id: request.id,
    fullName: `${request.nombres} ${request.apellidos}`.trim(),
    email: request.email,
    submittedAt: request.fecha_solicitud ?? "",
    status: mapAdmissionStatus(request.estado),
    statusRaw: request.estado ?? "",
    notes: request.notas,
    history: (historyRows ?? []).map((row) => ({
      id: row.id,
      oldState: row.estado_anterior,
      newState: row.estado_nuevo,
      comment: row.comentario,
      changedAt: row.fecha_cambio ?? request.fecha_solicitud ?? new Date().toISOString(),
      changedBy: profileNameById.get(row.cambiado_por) ?? row.cambiado_por,
    })),
  };
}

function appendResolutionNote(existing: string | null | undefined, comment: string): string {
  const base = existing?.trim() ?? "";
  return base ? `${base}\n---\n${comment.trim()}` : comment.trim();
}

export async function resolveDashboardAdmission(options: {
  requestId: string;
  targetStatus: "approved" | "rejected";
  reviewerId?: string | null;
  comment?: string;
}): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const currentUser = await safeGetCurrentUser();
  const requestId = sanitizeText(options.requestId, 80);
  const reviewerId = sanitizeText(options.reviewerId ?? "", 80) || currentUser?.id || null;
  const comment = sanitizeText(options.comment ?? "", 500) || null;
  if (!requestId) throw new Error("No se encontro la solicitud de admision.");
  if (!reviewerId) throw new Error("No se pudo resolver el usuario que aprueba la solicitud.");

  const targetDbState = options.targetStatus === "approved" ? "aprobada" : "rechazada";
  const { data: currentRows, error: currentError } = await db
    .schema("rrhh")
    .from("solicitudes_admision")
    .select("id, estado, notas")
    .eq("tenant_id", tenantId)
    .eq("id", requestId)
    .limit(1);
  if (currentError) throw new Error(currentError.message);
  const current = currentRows?.[0] ?? null;
  if (!current) throw new Error("La solicitud ya no existe.");

  const nextNotes = comment ? appendResolutionNote(current.notas, comment) : current.notas;
  const { error: updateError } = await db
    .schema("rrhh")
    .from("solicitudes_admision")
    .update({ estado: targetDbState, notas: nextNotes, updated_by: reviewerId })
    .eq("tenant_id", tenantId)
    .eq("id", requestId);
  if (updateError) throw new Error(updateError.message);

  const { error: historyInsertError } = await db.schema("rrhh").from("admision_estado_historial").insert({
    tenant_id: tenantId,
    id_solicitud: requestId,
    estado_anterior: current.estado,
    estado_nuevo: targetDbState,
    comentario: comment,
    cambiado_por: reviewerId,
  });
  if (historyInsertError) throw new Error(historyInsertError.message);
}
