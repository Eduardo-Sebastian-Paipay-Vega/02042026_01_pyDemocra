// @ts-nocheck
import type {
  ActivityDetailData,
  ActivityEvidenceRow,
  ActivityFormValues,
  ActivityHourRow,
  ActivityListFilters,
  ActivityRow,
  ActivityVolunteerAssignmentRow,
} from "../../modules/projects/types";
import {
  ensureDateOrder,
  getActivityStatusKind,
  getActivityStatusLabel,
  getRequiredTenantId,
  normalizeDateValue,
  normalizeText,
  ongSchema,
  parseNumericInput,
  resolveActivityStatusCode,
  resolveCurrentUserId,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toProjectsError,
  uniqueNonEmpty,
} from "./shared";

type ActivityDbRow = {
  id: string;
  tenant_id: string;
  id_tarea: string;
  titulo: string;
  descripcion: string | null;
  codigo_estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  id_ubicacion: string | null;
  horas_estimadas: number | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

type TaskDbRow = {
  id: string;
  id_proyecto: string;
  titulo: string;
  descripcion: string | null;
  estado: string | null;
  fecha_limite: string | null;
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
  updated_at: string;
};

type HourDbRow = {
  id: string;
  id_actividad: string;
  id_voluntario: string;
  horas_registradas: number;
  fecha: string;
  estado_aprobacion: string | null;
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

type VolunteerDbRow = {
  id: string;
  nombre: string;
  apellido: string;
};

function buildLocationLabel(location: LocationDbRow | undefined): string | null {
  if (!location) {
    return null;
  }

  return `${location.codigo} - ${location.nombre_ubicacion}`;
}

function mapActivityRow(
  activity: ActivityDbRow,
  task: TaskDbRow,
  project: ProjectDbRow,
  location: LocationDbRow | undefined,
  assignedVolunteers: number,
  evidenceCount: number,
  registeredHours: number
): ActivityRow {
  const statusCode = resolveActivityStatusCode(activity.codigo_estado);

  return {
    id: activity.id,
    taskId: activity.id_tarea,
    taskName: task.titulo,
    projectId: task.id_proyecto,
    projectName: `${project.codigo} - ${project.nombre_proyecto}`,
    title: activity.titulo,
    description: activity.descripcion,
    estimatedHours: activity.horas_estimadas,
    statusCode,
    statusLabel: getActivityStatusLabel(statusCode),
    statusKind: getActivityStatusKind(statusCode),
    startAt: activity.fecha_inicio,
    endAt: activity.fecha_fin,
    locationId: activity.id_ubicacion,
    locationName: buildLocationLabel(location),
    assignedVolunteers,
    registeredHours,
    evidenceCount,
    createdAt: activity.created_at,
    updatedAt: activity.updated_at,
  };
}

async function loadTaskMap(tenantId: string, taskIds: string[]): Promise<Map<string, TaskDbRow>> {
  const ids = uniqueNonEmpty(taskIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, id_proyecto, titulo, descripcion, estado, fecha_limite")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as TaskDbRow[]).map((row): [string, TaskDbRow] => [row.id, row])
  );
}

async function loadProjectMap(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, ProjectDbRow>> {
  const ids = uniqueNonEmpty(projectIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("proyectos")
    .select("id, codigo, nombre_proyecto")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as ProjectDbRow[]).map((row): [string, ProjectDbRow] => [row.id, row])
  );
}

async function loadLocationMap(
  tenantId: string,
  locationIds: string[]
): Promise<Map<string, LocationDbRow>> {
  const ids = uniqueNonEmpty(locationIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as LocationDbRow[]).map((row): [string, LocationDbRow] => [row.id, row])
  );
}

async function loadAssignmentMapByActivity(
  tenantId: string,
  activityIds: string[]
): Promise<Map<string, AssignmentDbRow[]>> {
  const ids = uniqueNonEmpty(activityIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("asignaciones_actividad")
    .select("id, id_actividad, id_voluntario, rol_en_actividad, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("is_deleted", false)
    .in("id_actividad", ids)
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

async function loadHoursMapByActivity(
  tenantId: string,
  activityIds: string[]
): Promise<Map<string, HourDbRow[]>> {
  const ids = uniqueNonEmpty(activityIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("horas_actividad")
    .select("id, id_actividad, id_voluntario, horas_registradas, fecha, estado_aprobacion")
    .eq("tenant_id", tenantId)
    .in("id_actividad", ids);

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, HourDbRow[]>();
  for (const row of (data ?? []) as HourDbRow[]) {
    const current = grouped.get(row.id_actividad) ?? [];
    current.push(row);
    grouped.set(row.id_actividad, current);
  }

  return grouped;
}

async function loadEvidenceMapByActivity(
  tenantId: string,
  activityIds: string[]
): Promise<Map<string, EvidenceDbRow[]>> {
  const ids = uniqueNonEmpty(activityIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("evidencias_actividad")
    .select("id, id_actividad, id_voluntario, url_archivo, tipo_evidencia, comentario, created_at")
    .eq("tenant_id", tenantId)
    .in("id_actividad", ids);

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, EvidenceDbRow[]>();
  for (const row of (data ?? []) as EvidenceDbRow[]) {
    const current = grouped.get(row.id_actividad) ?? [];
    current.push(row);
    grouped.set(row.id_actividad, current);
  }

  return grouped;
}

async function countAttendancesByActivity(
  tenantId: string,
  activityId: string
): Promise<number> {
  const { count, error } = await ongSchema()
    .from("asistencias")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("id_actividad", activityId)
    .eq("is_deleted", false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function loadVolunteerLabels(volunteerIds: string[]): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(volunteerIds);
  if (!ids.length) {
    return new Map();
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select("id, nombre, apellido")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as VolunteerDbRow[]).map((row): [string, string] => [
      row.id,
      `${row.nombre} ${row.apellido}`.trim(),
    ])
  );
}

function buildActivityPayload(input: ActivityFormValues) {
  const taskId = sanitizeOptionalId(input.taskId);
  const title = sanitizeText(input.title, 200);
  const description = sanitizeText(input.description, 4000) || null;
  const statusCode = resolveActivityStatusCode(input.statusCode);
  const startAt = normalizeDateValue(input.startAt);
  const endAt = normalizeDateValue(input.endAt);
  const locationId = sanitizeOptionalId(input.locationId);
  const estimatedHours = parseNumericInput(input.estimatedHours);

  if (!taskId) {
    throw new Error("La tarea asociada es obligatoria.");
  }
  if (!title) {
    throw new Error("El titulo de la actividad es obligatorio.");
  }
  if (estimatedHours !== null && estimatedHours < 0) {
    throw new Error("Las horas estimadas deben ser mayores o iguales a cero.");
  }

  ensureDateOrder(startAt, endAt);

  return {
    id_tarea: taskId,
    titulo: title,
    descripcion: description,
    codigo_estado: statusCode,
    fecha_inicio: startAt,
    fecha_fin: endAt,
    id_ubicacion: locationId,
    horas_estimadas: estimatedHours,
  };
}

async function ensureTaskExists(tenantId: string, taskId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", taskId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length === 0) {
    throw new Error("La tarea seleccionada no existe o no pertenece al tenant actual.");
  }
}

async function ensureLocationExists(tenantId: string, locationId: string | null): Promise<void> {
  if (!locationId) {
    return;
  }

  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", locationId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length === 0) {
    throw new Error("La ubicacion seleccionada no existe o no pertenece al tenant actual.");
  }
}

function getDateKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10) || null;
  }

  return parsed.toISOString().slice(0, 10);
}

function matchesActivityDateRange(
  row: ActivityRow,
  dateFrom: string | null,
  dateTo: string | null
): boolean {
  if (!dateFrom && !dateTo) {
    return true;
  }

  const startDate = getDateKey(row.startAt);
  const endDate = getDateKey(row.endAt) ?? startDate;

  if (!startDate && !endDate) {
    return false;
  }

  if (dateFrom && endDate && endDate < dateFrom) {
    return false;
  }

  if (dateTo && startDate && startDate > dateTo) {
    return false;
  }

  return true;
}

export async function listActivities(
  filters: ActivityListFilters
): Promise<ActivityRow[]> {
  try {
    const tenantId = await getRequiredTenantId();
    const searchTerm = sanitizeSearchTerm(filters.searchTerm);
    const dateFrom = normalizeDateValue(filters.dateFrom);
    const dateTo = normalizeDateValue(filters.dateTo);

    let query = ongSchema()
      .from("actividades")
      .select(
        "id, tenant_id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, created_by, updated_at, updated_by"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.taskId !== "all") {
      query = query.eq("id_tarea", filters.taskId);
    }
    if (filters.statusCode !== "all") {
      query = query.eq("codigo_estado", filters.statusCode);
    }
    if (filters.locationId !== "all") {
      query = query.eq("id_ubicacion", filters.locationId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ActivityDbRow[];
    const taskMap = await loadTaskMap(
      tenantId,
      rows.map((row) => row.id_tarea)
    );
    const projectMap = await loadProjectMap(
      tenantId,
      Array.from(taskMap.values()).map((row) => row.id_proyecto)
    );
    const locationMap = await loadLocationMap(
      tenantId,
      rows.map((row) => row.id_ubicacion).filter(Boolean) as string[]
    );
    const [assignmentMap, hoursMap, evidenceMap] = await Promise.all([
      loadAssignmentMapByActivity(tenantId, rows.map((row) => row.id)),
      loadHoursMapByActivity(tenantId, rows.map((row) => row.id)),
      loadEvidenceMapByActivity(tenantId, rows.map((row) => row.id)),
    ]);

    return rows
      .map((row) => {
        const task = taskMap.get(row.id_tarea);
        if (!task) {
          return null;
        }
        const project = projectMap.get(task.id_proyecto);
        if (!project) {
          return null;
        }

        const activityHours = hoursMap.get(row.id) ?? [];
        return mapActivityRow(
          row,
          task,
          project,
          row.id_ubicacion ? locationMap.get(row.id_ubicacion) : undefined,
          assignmentMap.get(row.id)?.length ?? 0,
          evidenceMap.get(row.id)?.length ?? 0,
          activityHours.reduce(
            (sum, item) => sum + Number(item.horas_registradas ?? 0),
            0
          )
        );
      })
      .filter((row): row is ActivityRow => Boolean(row))
      .filter((row) => {
        if (filters.projectId !== "all" && row.projectId !== filters.projectId) {
          return false;
        }
        if (filters.statusCode !== "all" && row.statusCode !== filters.statusCode) {
          return false;
        }
        if (filters.locationId !== "all" && row.locationId !== filters.locationId) {
          return false;
        }
        if (!matchesActivityDateRange(row, dateFrom, dateTo)) {
          return false;
        }
        if (!searchTerm) {
          return true;
        }

        return normalizeText(
          [
            row.title,
            row.description ?? "",
            row.taskName,
            row.projectName,
            row.statusLabel,
            row.locationName ?? "",
          ].join(" ")
        ).includes(normalizeText(searchTerm));
      });
  } catch (error) {
    throw toProjectsError(error, "No se pudieron cargar las actividades.");
  }
}

export async function getActivityDetail(
  activityId: string
): Promise<ActivityDetailData | null> {
  try {
    const id = sanitizeOptionalId(activityId);
    if (!id) {
      throw new Error("No se encontro la actividad solicitada.");
    }

    const tenantId = await getRequiredTenantId();
    const { data, error } = await ongSchema()
      .from("actividades")
      .select(
        "id, tenant_id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, created_by, updated_at, updated_by"
      )
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const activity = data as ActivityDbRow;
    const taskMap = await loadTaskMap(tenantId, [activity.id_tarea]);
    const task = taskMap.get(activity.id_tarea);
    if (!task) {
      throw new Error("La actividad apunta a una tarea inexistente dentro del tenant actual.");
    }

    const [projectMap, locationMap, assignmentMap, hoursMap, evidenceMap, profileLabels] =
      await Promise.all([
        loadProjectMap(tenantId, [task.id_proyecto]),
        loadLocationMap(
          tenantId,
          activity.id_ubicacion ? [activity.id_ubicacion] : []
        ),
        loadAssignmentMapByActivity(tenantId, [activity.id]),
        loadHoursMapByActivity(tenantId, [activity.id]),
        loadEvidenceMapByActivity(tenantId, [activity.id]),
        resolveProfileLabels(
          [activity.created_by, activity.updated_by].filter(Boolean) as string[]
        ).catch(() => new Map<string, string>()),
      ]);

    const project = projectMap.get(task.id_proyecto);
    if (!project) {
      throw new Error("La actividad apunta a un proyecto inexistente dentro del tenant actual.");
    }

    const assignments = assignmentMap.get(activity.id) ?? [];
    const hours = hoursMap.get(activity.id) ?? [];
    const evidences = evidenceMap.get(activity.id) ?? [];
    const volunteerLabels = await loadVolunteerLabels([
      ...assignments.map((row) => row.id_voluntario),
      ...hours.map((row) => row.id_voluntario),
      ...evidences.map((row) => row.id_voluntario),
    ]);

    const mappedAssignments: ActivityVolunteerAssignmentRow[] = assignments.map((row) => ({
      id: row.id,
      activityId: row.id_actividad,
      activityName: activity.titulo,
      volunteerId: row.id_voluntario,
      volunteerName: volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario,
      role: row.rol_en_actividad,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const mappedHours: ActivityHourRow[] = hours.map((row) => ({
      id: row.id,
      volunteerId: row.id_voluntario,
      volunteerName: volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario,
      date: row.fecha,
      hours: Number(row.horas_registradas ?? 0),
      approvalState: row.estado_aprobacion,
    }));

    const mappedEvidences: ActivityEvidenceRow[] = evidences.map((row) => ({
      id: row.id,
      volunteerId: row.id_voluntario,
      volunteerName: volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario,
      route: row.url_archivo,
      evidenceType: row.tipo_evidencia,
      comment: row.comentario,
      createdAt: row.created_at,
    }));

    const warnings: string[] = [];
    if (activity.id_ubicacion && !locationMap.has(activity.id_ubicacion)) {
      warnings.push(
        "La ubicacion vinculada ya no esta disponible en el tenant actual."
      );
    }

    return {
      activity: mapActivityRow(
        activity,
        task,
        project,
        activity.id_ubicacion ? locationMap.get(activity.id_ubicacion) : undefined,
        mappedAssignments.length,
        mappedEvidences.length,
        mappedHours.reduce((sum, row) => sum + row.hours, 0)
      ),
      createdBy: activity.created_by
        ? profileLabels.get(activity.created_by) ?? activity.created_by
        : null,
      updatedBy: activity.updated_by
        ? profileLabels.get(activity.updated_by) ?? activity.updated_by
        : null,
      assignments: mappedAssignments,
      hours: mappedHours,
      evidences: mappedEvidences,
      warnings,
    };
  } catch (error) {
    throw toProjectsError(error, "No se pudo cargar el detalle de la actividad.");
  }
}

export async function createActivity(
  input: ActivityFormValues
): Promise<ActivityDetailData> {
  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildActivityPayload(input);

    await Promise.all([
      ensureTaskExists(tenantId, payload.id_tarea),
      ensureLocationExists(tenantId, payload.id_ubicacion),
    ]);

    const { data, error } = await ongSchema()
      .from("actividades")
      .insert({
        tenant_id: tenantId,
        ...payload,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getActivityDetail(data.id);
    if (!detail) {
      throw new Error("La actividad fue creada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear la actividad.");
  }
}

export async function updateActivity(
  activityId: string,
  input: ActivityFormValues
): Promise<ActivityDetailData> {
  try {
    const id = sanitizeOptionalId(activityId);
    if (!id) {
      throw new Error("No se encontro la actividad a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildActivityPayload(input);

    await Promise.all([
      ensureTaskExists(tenantId, payload.id_tarea),
      ensureLocationExists(tenantId, payload.id_ubicacion),
    ]);

    const { error } = await ongSchema()
      .from("actividades")
      .update({
        ...payload,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getActivityDetail(id);
    if (!detail) {
      throw new Error("La actividad fue actualizada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar la actividad.");
  }
}

export async function deleteActivity(activityId: string): Promise<void> {
  try {
    const id = sanitizeOptionalId(activityId);
    if (!id) {
      throw new Error("No se encontro la actividad a eliminar.");
    }

    const tenantId = await getRequiredTenantId();
    const [assignmentMap, hoursMap, evidenceMap, attendanceCount] = await Promise.all([
      loadAssignmentMapByActivity(tenantId, [id]),
      loadHoursMapByActivity(tenantId, [id]),
      loadEvidenceMapByActivity(tenantId, [id]),
      countAttendancesByActivity(tenantId, id),
    ]);

    const relationCount =
      (assignmentMap.get(id)?.length ?? 0) +
      (hoursMap.get(id)?.length ?? 0) +
      (evidenceMap.get(id)?.length ?? 0) +
      attendanceCount;

    if (relationCount > 0) {
      throw new Error(
        "La actividad tiene asistencias, asignaciones, horas o evidencias vinculadas. El esquema actual no soporta soft delete y se bloquea el borrado fisico para no romper trazabilidad."
      );
    }

    const { error } = await ongSchema()
      .from("actividades")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toProjectsError(error, "No se pudo eliminar la actividad.");
  }
}

