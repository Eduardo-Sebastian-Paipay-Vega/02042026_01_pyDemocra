import type {
  ActivityAssignmentCreateInput,
  ActivityAssignmentRow,
  ActivityAssignmentUpdateInput,
  ActivityCreateInput,
  ActivityDetailData,
  ActivityPeriodFilter,
  ActivityUpdateInput,
  OperationActivitiesData,
  OperationActivityFilters,
  OperationActivityRow,
} from "../../modules/operation/types";
import {
  buildActivityStateOptions,
  buildEvidenceTypeLabel,
  buildScheduleText,
  fetchLocationCatalog,
  fetchVolunteerCatalog,
  getActorId,
  getRequiredTenantId,
  mapActivityStatusKind,
  mapActivityStatusVariant,
  normalizeText,
  ongSchema,
  resolveActivityStateCode,
  resolveCurrentUserId,
  sanitizeOptionalId,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
  uniqueNonEmpty,
} from "./shared";

const ACTIVITY_LIMIT = 500;
const RELATION_LIMIT = 100;

type ActivityDbRow = {
  id: string;
  id_tarea: string;
  titulo: string;
  descripcion: string | null;
  codigo_estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  id_ubicacion: string | null;
  horas_estimadas: number | null;
  created_at: string;
  updated_at: string;
};

type TaskDbRow = {
  id: string;
  id_proyecto: string;
  titulo: string;
  estado: string | null;
};

type ProjectDbRow = {
  id: string;
  codigo: string;
  nombre_proyecto: string;
};

type LocationDbRow = {
  id: string;
  codigo: string;
  nombre_ubicacion: string;
};

type AssignmentDbRow = {
  id: string;
  id_actividad: string;
  id_voluntario: string;
  rol_en_actividad: string | null;
  created_at: string;
};

type HoursDbRow = {
  id: string;
  id_actividad: string;
  id_voluntario: string;
  horas_registradas: number;
  fecha: string;
  estado_aprobacion: string;
  created_at: string;
};

type EvidenceDbRow = {
  id: string;
  id_actividad: string;
  id_voluntario: string;
  url_archivo: string;
  tipo_evidencia: string | null;
  comentario: string | null;
  created_at: string;
};

function normalizeActivityStateCode(value: string | null | undefined): string {
  const cleaned = sanitizeText(value ?? "pendiente", 60) || "pendiente";
  if (
    cleaned === "pendiente" ||
    cleaned === "planificada" ||
    cleaned === "en_progreso" ||
    cleaned === "completada" ||
    cleaned === "cancelada"
  ) {
    return cleaned;
  }

  return "pendiente";
}

function getActivityStateId(code: string | null | undefined): number | null {
  const normalized = normalizeActivityStateCode(code);
  if (normalized === "pendiente") return 1;
  if (normalized === "planificada") return 2;
  if (normalized === "en_progreso") return 3;
  if (normalized === "completada") return 4;
  if (normalized === "cancelada") return 5;
  return null;
}

function activityPeriodMatches(
  row: Pick<OperationActivityRow, "startAt" | "endAt">,
  period: ActivityPeriodFilter
): boolean {
  if (period === "all") {
    return true;
  }

  const start = row.startAt ? new Date(row.startAt) : null;
  const end = row.endAt ? new Date(row.endAt) : start;
  if (!start || Number.isNaN(start.getTime())) {
    return false;
  }

  if (period === "today") {
    const today = new Date();
    const dateLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return row.startAt?.startsWith(dateLabel) || row.endAt?.startsWith(dateLabel) || false;
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return start <= weekEnd && (end ?? start) >= weekStart;
}

async function loadTaskMap(taskIds: string[]): Promise<Map<string, TaskDbRow>> {
  if (!taskIds.length) {
    return new Map();
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, id_proyecto, titulo, estado")
    .eq("tenant_id", tenantId)
    .in("id", taskIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, TaskDbRow>(
    (data ?? []).map((row: TaskDbRow): [string, TaskDbRow] => [row.id, row])
  );
}

async function loadProjectMap(projectIds: string[]): Promise<Map<string, ProjectDbRow>> {
  if (!projectIds.length) {
    return new Map();
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("proyectos")
    .select("id, codigo, nombre_proyecto")
    .eq("tenant_id", tenantId)
    .in("id", projectIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, ProjectDbRow>(
    (data ?? []).map((row: ProjectDbRow): [string, ProjectDbRow] => [row.id, row])
  );
}

async function loadLocationMap(
  locationIds: string[]
): Promise<Map<string, LocationDbRow>> {
  if (!locationIds.length) {
    return new Map();
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion")
    .eq("tenant_id", tenantId)
    .in("id", locationIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, LocationDbRow>(
    (data ?? []).map((row: LocationDbRow): [string, LocationDbRow] => [row.id, row])
  );
}

async function loadActivityRows(activityIds?: string[] | null): Promise<ActivityDbRow[]> {
  const tenantId = await getRequiredTenantId();
  let query = ongSchema()
    .from("actividades")
    .select(
      "id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_LIMIT);

  if (activityIds?.length) {
    query = query.in("id", activityIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ActivityDbRow[];
}

async function loadAssignments(activityIds: string[]): Promise<Map<string, AssignmentDbRow[]>> {
  if (!activityIds.length) {
    return new Map();
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("asignaciones_actividad")
    .select("id, id_actividad, id_voluntario, rol_en_actividad, created_at")
    .eq("tenant_id", tenantId)
    .in("id_actividad", activityIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, AssignmentDbRow[]>();
  for (const row of (data ?? []) as AssignmentDbRow[]) {
    const current = grouped.get(row.id_actividad) ?? [];
    current.push(row);
    grouped.set(row.id_actividad, current);
  }

  return grouped;
}

async function loadVolunteerLabels(volunteerIds: string[]): Promise<Map<string, string>> {
  if (!volunteerIds.length) {
    return new Map();
  }

  const options = await fetchVolunteerCatalog().catch(() => []);
  return new Map<string, string>(
    options
      .filter((item) => volunteerIds.includes(item.value))
      .map((item): [string, string] => [item.value, item.label])
  );
}

function mapActivityRow(
  activity: ActivityDbRow,
  task: TaskDbRow | undefined,
  project: ProjectDbRow | undefined,
  location: LocationDbRow | undefined,
  assignments: AssignmentDbRow[],
  volunteerLabels: Map<string, string>
): OperationActivityRow {
  const statusCode = normalizeActivityStateCode(activity.codigo_estado);
  const statusKind = mapActivityStatusKind(statusCode);
  const statusId = getActivityStateId(statusCode);
  const assignedIds = uniqueNonEmpty(assignments.map((row) => row.id_voluntario));
  const locationName = location ? `${location.codigo} - ${location.nombre_ubicacion}` : "Sin ubicacion";

  return {
    id: activity.id,
    taskId: activity.id_tarea,
    name: activity.titulo,
    description: activity.descripcion ?? "",
    taskName: task?.titulo ?? "Tarea no disponible",
    projectId: task?.id_proyecto ?? null,
    projectName: project ? `${project.codigo} - ${project.nombre_proyecto}` : "Proyecto no disponible",
    locationId: activity.id_ubicacion,
    statusId,
    statusName:
      buildActivityStateOptions().find((option) => option.value === statusId)?.label ??
      statusCode.replace(/_/g, " "),
    statusKind,
    statusVariant: mapActivityStatusVariant(statusKind),
    startAt: activity.fecha_inicio,
    endAt: activity.fecha_fin,
    scheduleText: buildScheduleText(activity.fecha_inicio, activity.fecha_fin),
    locationName,
    meta: activity.horas_estimadas !== null ? `${activity.horas_estimadas} horas estimadas` : "Sin horas estimadas",
    assignedVolunteers: assignedIds.length,
    assignedVolunteerIds: assignedIds,
    assignedVolunteerNames: assignedIds.map((id) => volunteerLabels.get(id) ?? id),
    createdAt: activity.created_at,
    updatedAt: activity.updated_at,
  };
}

function mapAssignmentRow(row: AssignmentDbRow, volunteerName: string | null): ActivityAssignmentRow {
  return {
    id: row.id,
    activityId: row.id_actividad,
    volunteerId: row.id_voluntario,
    volunteerName: volunteerName ?? row.id_voluntario,
    role: row.rol_en_actividad?.trim() || "Colaborador",
    assignedAt: toDateTimeLabel(row.created_at),
    active: true,
  };
}

async function resolveActivityContext(activityId: string): Promise<{
  activity: ActivityDbRow;
  task: TaskDbRow | undefined;
  project: ProjectDbRow | undefined;
  location: LocationDbRow | undefined;
}> {
  const activityRows = await loadActivityRows([activityId]);
  const activity = activityRows[0];
  if (!activity) {
    throw new Error("La actividad ya no existe o no pertenece al tenant actual.");
  }

  const taskMap = await loadTaskMap([activity.id_tarea]);
  const task = taskMap.get(activity.id_tarea);
  const projectMap = task?.id_proyecto ? await loadProjectMap([task.id_proyecto]) : new Map();
  const project = task?.id_proyecto ? projectMap.get(task.id_proyecto) : undefined;
  const locationMap = activity.id_ubicacion ? await loadLocationMap([activity.id_ubicacion]) : new Map();
  const location = activity.id_ubicacion ? locationMap.get(activity.id_ubicacion) : undefined;

  return { activity, task, project, location };
}

async function getVolunteerLabelById(volunteerId: string): Promise<string | null> {
  const labels = await loadVolunteerLabels([volunteerId]);
  return labels.get(volunteerId) ?? null;
}

async function ensureTaskExists(taskId: string): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, estado")
    .eq("tenant_id", tenantId)
    .eq("id", taskId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as Array<{ id: string; estado: string | null }>)[0];
  if (!row) {
    throw new Error("La tarea seleccionada no existe o no pertenece al tenant actual.");
  }
  if (row.estado === "cancelada") {
    throw new Error("No se puede vincular la actividad a una tarea cancelada.");
  }
}

async function ensureLocationExists(locationId: string | null): Promise<void> {
  if (!locationId) {
    return;
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", locationId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if (!(data ?? []).length) {
    throw new Error("La ubicacion seleccionada no existe o no pertenece al tenant actual.");
  }
}

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return value.slice(0, 10) || null;
}

export async function listActividades(
  filters: OperationActivityFilters
): Promise<OperationActivitiesData> {
  try {
    const warnings: string[] = [];
    const activities = await loadActivityRows();
    const taskIds = uniqueNonEmpty(activities.map((item) => item.id_tarea));
    const taskMap = await loadTaskMap(taskIds);
    const projectIds = uniqueNonEmpty(Array.from(taskMap.values()).map((task) => task.id_proyecto));
    const locationIds = uniqueNonEmpty(
      activities.map((item) => item.id_ubicacion).filter(Boolean)
    );
    const [projectMap, assignments, volunteerOptions, locationCatalog, locationMap] =
      await Promise.all([
        loadProjectMap(projectIds),
        loadAssignments(activities.map((item) => item.id)),
        fetchVolunteerCatalog().catch(() => {
          warnings.push("No se pudo cargar el catalogo de voluntarios.");
          return [] as Array<{ value: string; label: string }>;
        }),
        fetchLocationCatalog().catch(() => {
          warnings.push("No se pudo cargar el catalogo de ubicaciones.");
          return [] as Array<{ id: string; label: string }>;
        }),
        loadLocationMap(locationIds).catch(() => new Map<string, LocationDbRow>()),
      ]);
    const volunteerLabels = new Map<string, string>(
      volunteerOptions.map((item): [string, string] => [item.value, item.label])
    );
    const stateOptions = await buildActivityStateOptions();

    const rows = activities
      .map((activity) => {
        const task = taskMap.get(activity.id_tarea);
        const project = task?.id_proyecto ? projectMap.get(task.id_proyecto) : undefined;
        const location = activity.id_ubicacion ? locationMap.get(activity.id_ubicacion) : undefined;
        return mapActivityRow(activity, task, project, location, assignments.get(activity.id) ?? [], volunteerLabels);
      })
      .filter((row) => {
        if (filters.stateId !== "all" && row.statusId !== filters.stateId) {
          return false;
        }
        if (filters.projectId !== "all" && row.projectId !== filters.projectId) {
          return false;
        }
        if (filters.taskId !== "all" && row.taskId !== filters.taskId) {
          return false;
        }
        if (filters.locationId !== "all" && row.locationId !== filters.locationId) {
          return false;
        }
        if (filters.volunteerId !== "all" && !row.assignedVolunteerIds.includes(filters.volunteerId)) {
          return false;
        }
        if (!activityPeriodMatches(row, filters.period)) {
          return false;
        }

        const search = normalizeText(filters.searchTerm);
        if (!search) {
          return true;
        }

        return [
          row.name,
          row.description,
          row.taskName,
          row.projectName,
          row.locationName,
          row.meta,
          row.assignedVolunteerNames.join(" "),
          row.statusName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      });

    return {
      rows,
      stateOptions,
      projectOptions: Array.from(projectMap.values()).map((project) => ({
        value: project.id,
        label: `${project.codigo} - ${project.nombre_proyecto}`,
      })),
      taskOptions: Array.from(taskMap.values()).map((task) => ({
        value: task.id,
        label: `${task.titulo} (${task.id_proyecto})`,
      })),
      locationOptions: locationCatalog.map((location) => ({
        value: location.id,
        label: location.label,
      })),
      volunteerOptions,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las actividades.");
  }
}

export async function getActividadById(activityId: string): Promise<ActivityDetailData> {
  try {
    const { activity, task, project, location } = await resolveActivityContext(
      sanitizeOptionalId(activityId) ?? ""
    );
    const volunteerOptions = await fetchVolunteerCatalog().catch(() => []);
    const volunteerLabels = new Map<string, string>(
      volunteerOptions.map((item): [string, string] => [item.value, item.label])
    );
    const assignments = await listAsignacionesByActividad(activity.id, true);

    const tenantId = await getRequiredTenantId();
    const hoursResult = await ongSchema()
      .from("horas_actividad")
      .select("id, id_actividad, id_voluntario, horas_registradas, fecha, estado_aprobacion, created_at")
      .eq("tenant_id", tenantId)
      .eq("id_actividad", activity.id)
      .order("created_at", { ascending: false })
      .limit(RELATION_LIMIT);

    const evidenceResult = await ongSchema()
      .from("evidencias_actividad")
      .select("id, id_actividad, id_voluntario, url_archivo, tipo_evidencia, comentario, created_at")
      .eq("tenant_id", tenantId)
      .eq("id_actividad", activity.id)
      .order("created_at", { ascending: false })
      .limit(RELATION_LIMIT);

    const activityRow = mapActivityRow(
      activity,
      task,
      project,
      location,
      assignments.map((item) => ({
        id: item.id,
        id_actividad: item.activityId,
        id_voluntario: item.volunteerId,
        rol_en_actividad: item.role,
        created_at: new Date().toISOString(),
      })),
      volunteerLabels
    );

    const hours = ((hoursResult.data ?? []) as HoursDbRow[]).map((row) => ({
      id: row.id,
      volunteerName: volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario,
      date: row.fecha,
      startTime: "--:--",
      endTime: "--:--",
      minutes: Math.round(row.horas_registradas * 60),
      statusName: row.estado_aprobacion,
    }));

    const evidences = ((evidenceResult.data ?? []) as EvidenceDbRow[]).map((row) => ({
      id: row.id,
      typeName: row.tipo_evidencia ? buildEvidenceTypeLabel(row.tipo_evidencia) : "Sin tipo",
      volunteerName: row.id_voluntario ? volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario : "Sin autor",
      route: row.url_archivo,
      uploadedAt: toDateTimeLabel(row.created_at),
      validationStatusName: "Sin validacion documentada",
    }));

    return {
      activity: activityRow,
      assignments,
      hours,
      evidences,
      warnings: [],
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle de la actividad.");
  }
}

export async function getResumenRelacionActividad(activityId: string): Promise<{
  attendanceCount: number;
  evidenceCount: number;
  hoursCount: number;
}> {
  const tenantId = await getRequiredTenantId();
  const [hours, evidences, attendances] = await Promise.all([
    ongSchema().from("horas_actividad").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("id_actividad", activityId),
    ongSchema().from("evidencias_actividad").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("id_actividad", activityId),
    ongSchema().from("asistencias").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("id_actividad", activityId).eq("is_deleted", false),
  ]);

  if (hours.error) {
    throw new Error(hours.error.message);
  }
  if (evidences.error) {
    throw new Error(evidences.error.message);
  }
  if (attendances.error) {
    throw new Error(attendances.error.message);
  }

  return {
    attendanceCount: attendances.count ?? 0,
    evidenceCount: evidences.count ?? 0,
    hoursCount: hours.count ?? 0,
  };
}

export async function createActividad(input: ActivityCreateInput): Promise<ActivityDetailData> {
  try {
    const taskId = sanitizeOptionalId(input.taskId);
    const title = sanitizeText(input.name, 200);
    const description = sanitizeText(input.description ?? null, 4000) || null;
    const startAt = toDateOnly(input.startAt ?? null);
    const endAt = toDateOnly(input.endAt ?? null);
    const locationId = sanitizeOptionalId(input.locationId ?? null);
    const stateCode = normalizeActivityStateCode(resolveActivityStateCode(input.statusId ?? null));
    const actorId = await resolveCurrentUserId();

    if (!taskId) {
      throw new Error("La tarea es obligatoria.");
    }
    if (!title) {
      throw new Error("El titulo de la actividad es obligatorio.");
    }

    const hoursEstimated = input.meta ? Number(input.meta) : null;
    if (hoursEstimated !== null && (!Number.isFinite(hoursEstimated) || hoursEstimated < 0)) {
      throw new Error("Las horas estimadas deben ser mayores o iguales a cero.");
    }
    if (startAt && endAt && endAt < startAt) {
      throw new Error("La fecha fin no puede ser menor a la fecha inicio.");
    }

    const tenantId = await getRequiredTenantId();
    await Promise.all([ensureTaskExists(taskId), ensureLocationExists(locationId)]);

    const { data, error } = await ongSchema()
      .from("actividades")
      .insert({
        tenant_id: tenantId,
        id_tarea: taskId,
        titulo: title,
        descripcion: description,
        codigo_estado: stateCode,
        fecha_inicio: startAt,
        fecha_fin: endAt,
        id_ubicacion: locationId,
        horas_estimadas: Number.isFinite(hoursEstimated ?? NaN) ? hoursEstimated : null,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return getActividadById((data as { id: string }).id);
  } catch (error) {
    throw toOperationError(error, "No se pudo crear la actividad.");
  }
}

export async function updateActividad(
  activityId: string,
  input: ActivityUpdateInput
): Promise<ActivityDetailData> {
  try {
    const sanitizedId = sanitizeOptionalId(activityId);
    if (!sanitizedId) {
      throw new Error("No se encontro la actividad a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const { data: activityRows, error } = await ongSchema()
      .from("actividades")
      .select(
        "id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, updated_at"
      )
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedId)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const current = (activityRows ?? [])[0] as ActivityDbRow | undefined;
    if (!current) {
      throw new Error("La actividad ya no existe.");
    }

    const nextTaskId =
      input.taskId !== undefined ? sanitizeOptionalId(input.taskId) : current.id_tarea;
    const nextLocationId =
      input.locationId !== undefined
        ? sanitizeOptionalId(input.locationId)
        : current.id_ubicacion;
    const nextStartAt =
      input.startAt !== undefined ? toDateOnly(input.startAt) : toDateOnly(current.fecha_inicio);
    const nextEndAt =
      input.endAt !== undefined ? toDateOnly(input.endAt) : toDateOnly(current.fecha_fin);

    if (!nextTaskId) {
      throw new Error("La tarea es obligatoria.");
    }
    if (nextStartAt && nextEndAt && nextEndAt < nextStartAt) {
      throw new Error("La fecha fin no puede ser menor a la fecha inicio.");
    }

    const updates: Record<string, string | number | null> = {};

    if (input.taskId !== undefined) {
      updates.id_tarea = nextTaskId;
    }
    if (input.name !== undefined) {
      const title = sanitizeText(input.name, 200);
      if (!title) {
        throw new Error("El titulo de la actividad es obligatorio.");
      }
      updates.titulo = title;
    }
    if (input.description !== undefined) {
      updates.descripcion = sanitizeText(input.description, 4000) || null;
    }
    if (input.statusId !== undefined) {
      const stateCode = resolveActivityStateCode(input.statusId);
      if (!stateCode) {
        throw new Error("El estado seleccionado no es valido.");
      }
      updates.codigo_estado = stateCode;
    }
    if (input.startAt !== undefined) {
      updates.fecha_inicio = nextStartAt;
    }
    if (input.endAt !== undefined) {
      updates.fecha_fin = nextEndAt;
    }
    if (input.locationId !== undefined) {
      updates.id_ubicacion = nextLocationId;
    }
    if (input.meta !== undefined) {
      const hoursEstimated = Number(input.meta);
      if (Number.isNaN(hoursEstimated) || hoursEstimated < 0) {
        throw new Error("Las horas estimadas deben ser mayores o iguales a cero.");
      }
      updates.horas_estimadas = hoursEstimated;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No hay cambios para guardar.");
    }

    await Promise.all([ensureTaskExists(nextTaskId), ensureLocationExists(nextLocationId)]);

    const actorId = await resolveCurrentUserId();
    const { error: updateError } = await ongSchema()
      .from("actividades")
      .update({
        ...updates,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return getActividadById(sanitizedId);
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la actividad.");
  }
}

export async function changeEstadoActividad(
  activityId: string,
  stateId: number,
  actorId?: string | null
): Promise<void> {
  try {
    const sanitizedId = sanitizeOptionalId(activityId);
    if (!sanitizedId) {
      throw new Error("No se encontro la actividad a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const stateCode = resolveActivityStateCode(stateId);
    if (!stateCode) {
      throw new Error("El estado seleccionado no es valido.");
    }

    const { error: updateError } = await ongSchema()
      .from("actividades")
      .update({
        codigo_estado: stateCode,
        updated_by: getActorId(actorId),
      })
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo cambiar el estado de la actividad.");
  }
}

export async function softDeleteActividad(
  activityId: string,
  actorId?: string | null
): Promise<void> {
  try {
    const sanitizedId = sanitizeOptionalId(activityId);
    if (!sanitizedId) {
      throw new Error("No se encontro la actividad a eliminar.");
    }

    const tenantId = await getRequiredTenantId();
    const { error: updateError } = await ongSchema()
      .from("actividades")
      .update({
        codigo_estado: "cancelada",
        updated_by: getActorId(actorId),
      })
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo anular la actividad.");
  }
}

export async function listAsignacionesByActividad(
  activityId: string,
  includeInactive = true
): Promise<ActivityAssignmentRow[]> {
  try {
    void includeInactive;
    const sanitizedId = sanitizeOptionalId(activityId);
    if (!sanitizedId) {
      return [];
    }

    const tenantId = await getRequiredTenantId();
    const { data, error } = await ongSchema()
      .from("asignaciones_actividad")
      .select("id, id_actividad, id_voluntario, rol_en_actividad, created_at")
      .eq("tenant_id", tenantId)
      .eq("id_actividad", sanitizedId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const volunteerLabels = await fetchVolunteerCatalog().catch(() => []);
    const labelById = new Map<string, string>(
      volunteerLabels.map((item): [string, string] => [item.value, item.label])
    );

    return ((data ?? []) as AssignmentDbRow[]).map((row) =>
      mapAssignmentRow(row, labelById.get(row.id_voluntario) ?? null)
    );
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las asignaciones de la actividad.");
  }
}

export async function addAsignacionActividad(
  payload: ActivityAssignmentCreateInput
): Promise<ActivityAssignmentRow> {
  try {
    const activityId = sanitizeOptionalId(payload.activityId);
    const volunteerId = sanitizeOptionalId(payload.volunteerId);
    const role = sanitizeText(payload.role ?? null, 100) || null;

    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }

    const tenantId = await getRequiredTenantId();
    const { data: existingRows, error: existingError } = await ongSchema()
      .from("asignaciones_actividad")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id_actividad", activityId)
      .eq("id_voluntario", volunteerId)
      .limit(1);

    if (existingError) {
      throw new Error(existingError.message);
    }
    if ((existingRows ?? []).length > 0) {
      throw new Error("El voluntario ya esta asignado a esta actividad.");
    }

    const actorId = await resolveCurrentUserId();
    const { data, error } = await ongSchema()
      .from("asignaciones_actividad")
      .insert({
        tenant_id: tenantId,
        id_actividad: activityId,
        id_voluntario: volunteerId,
        rol_en_actividad: role,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id, id_actividad, id_voluntario, rol_en_actividad, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const volunteerLabel = await getVolunteerLabelById(volunteerId);
    return mapAssignmentRow(data as AssignmentDbRow, volunteerLabel);
  } catch (error) {
    throw toOperationError(error, "No se pudo agregar la asignacion de actividad.");
  }
}

export async function updateAsignacionActividad(
  input: ActivityAssignmentUpdateInput
): Promise<ActivityAssignmentRow> {
  try {
    const assignmentId = sanitizeOptionalId(input.assignmentId);
    if (!assignmentId) {
      throw new Error("No se encontro la asignacion a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const { data: currentRows, error: currentError } = await ongSchema()
      .from("asignaciones_actividad")
      .select("id, id_actividad, id_voluntario, rol_en_actividad, created_at")
      .eq("tenant_id", tenantId)
      .eq("id", assignmentId)
      .limit(1);

    if (currentError) {
      throw new Error(currentError.message);
    }

    const current = (currentRows ?? [])[0] as AssignmentDbRow | undefined;
    if (!current) {
      throw new Error("La asignacion ya no existe.");
    }

    if (input.active === false) {
      await removeAsignacionActividad(assignmentId);
      return mapAssignmentRow(current, null);
    }

    const updates: Record<string, string | null> = {};
    if (input.role !== undefined) {
      updates.rol_en_actividad = sanitizeText(input.role, 100) || null;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No hay cambios para guardar.");
    }

    const actorId = await resolveCurrentUserId();
    const { data, error } = await ongSchema()
      .from("asignaciones_actividad")
      .update({
        ...updates,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", assignmentId)
      .select("id, id_actividad, id_voluntario, rol_en_actividad, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const volunteerLabel = await getVolunteerLabelById((data as AssignmentDbRow).id_voluntario);
    return mapAssignmentRow(data as AssignmentDbRow, volunteerLabel);
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la asignacion de actividad.");
  }
}

export async function removeAsignacionActividad(idAsignacion: string): Promise<void> {
  try {
    const assignmentId = sanitizeOptionalId(idAsignacion);
    if (!assignmentId) {
      throw new Error("No se encontro la asignacion a eliminar.");
    }

    const tenantId = await getRequiredTenantId();
    const { error } = await ongSchema()
      .from("asignaciones_actividad")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", assignmentId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar la asignacion de actividad.");
  }
}

export async function assignVoluntarioActividad(
  input: ActivityAssignmentCreateInput
): Promise<ActivityAssignmentRow> {
  return addAsignacionActividad(input);
}
