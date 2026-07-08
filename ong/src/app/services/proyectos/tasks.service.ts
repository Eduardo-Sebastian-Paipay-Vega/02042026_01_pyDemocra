import type {
  ActivityRow,
  TaskDetailData,
  TaskFormValues,
  TaskListFilters,
  TaskRow,
} from "../../modules/projects/types";
import {
  getActivityStatusKind,
  getActivityStatusLabel,
  getRequiredTenantId,
  getTaskStatusKind,
  getTaskStatusLabel,
  normalizeDateValue,
  normalizeText,
  ongSchema,
  resolveActivityStatusCode,
  resolveCurrentUserId,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toProjectsError,
  uniqueNonEmpty,
} from "./shared";

// ─── DB row types ─────────────────────────────────────────────────────────────

type TaskDbRow = {
  id: string;
  tenant_id: string;
  id_actividad: string | null;
  titulo: string;
  descripcion: string | null;
  estado: string | null;
  fecha_limite: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

type ActivityDbRow = {
  id: string;
  id_proyecto: string;
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

type ProjectAssignmentDbRow = {
  id: string;
  id_proyecto: string;
  activo: boolean | null;
};

// ─── Status helpers ───────────────────────────────────────────────────────────

function resolveTaskStatusCode(value: string | null | undefined): TaskRow["statusCode"] {
  const cleaned = sanitizeText(value ?? "pendiente", 40) || "pendiente";
  if (
    cleaned === "pendiente" ||
    cleaned === "en_progreso" ||
    cleaned === "completada" ||
    cleaned === "cancelada"
  ) {
    return cleaned;
  }
  return "pendiente";
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapTaskRow(
  row: TaskDbRow,
  activityLabel: string | null,
  volunteerCount: number
): TaskRow {
  const statusCode = resolveTaskStatusCode(row.estado);
  return {
    id: row.id,
    activityId: row.id_actividad,
    activityName: activityLabel,
    title: row.titulo,
    description: row.descripcion,
    statusCode,
    statusLabel: getTaskStatusLabel(statusCode),
    statusKind: getTaskStatusKind(statusCode),
    deadline: row.fecha_limite,
    volunteerCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivityRow(
  row: ActivityDbRow,
  project: ProjectDbRow,
  location: LocationDbRow | undefined
): ActivityRow {
  const statusCode = resolveActivityStatusCode(row.codigo_estado);
  return {
    id: row.id,
    projectId: project.id,
    projectName: `${project.codigo} - ${project.nombre_proyecto}`,
    title: row.titulo,
    description: row.descripcion,
    estimatedHours: row.horas_estimadas,
    statusCode,
    statusLabel: getActivityStatusLabel(statusCode),
    statusKind: getActivityStatusKind(statusCode),
    startAt: row.fecha_inicio,
    endAt: row.fecha_fin,
    locationId: row.id_ubicacion,
    locationName: location ? `${location.codigo} - ${location.nombre_ubicacion}` : null,
    assignedVolunteers: 0,
    registeredHours: 0,
    evidenceCount: 0,
    taskCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Loader helpers ───────────────────────────────────────────────────────────

async function loadActivityMap(
  tenantId: string,
  activityIds: string[]
): Promise<Map<string, ActivityDbRow>> {
  const ids = uniqueNonEmpty(activityIds);
  if (!ids.length) return new Map();

  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id, id_proyecto, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) throw new Error(error.message);

  return new Map(
    ((data ?? []) as ActivityDbRow[]).map((row): [string, ActivityDbRow] => [row.id, row])
  );
}

async function loadProjectMap(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, ProjectDbRow>> {
  const ids = uniqueNonEmpty(projectIds);
  if (!ids.length) return new Map();

  const { data, error } = await ongSchema()
    .from("proyectos")
    .select("id, codigo, nombre_proyecto")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) throw new Error(error.message);

  return new Map(
    ((data ?? []) as ProjectDbRow[]).map((row): [string, ProjectDbRow] => [row.id, row])
  );
}

async function loadLocationMap(
  tenantId: string,
  locationIds: string[]
): Promise<Map<string, LocationDbRow>> {
  const ids = uniqueNonEmpty(locationIds);
  if (!ids.length) return new Map();

  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) throw new Error(error.message);

  return new Map(
    ((data ?? []) as LocationDbRow[]).map((row): [string, LocationDbRow] => [row.id, row])
  );
}

async function loadProjectAssignmentCounts(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, number>> {
  const ids = uniqueNonEmpty(projectIds);
  if (!ids.length) return new Map();

  const { data, error } = await ongSchema()
    .from("asignaciones_proyecto")
    .select("id, id_proyecto, activo")
    .eq("tenant_id", tenantId)
    .in("id_proyecto", ids);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as ProjectAssignmentDbRow[]) {
    if (row.activo === false) continue;
    counts.set(row.id_proyecto, (counts.get(row.id_proyecto) ?? 0) + 1);
  }
  return counts;
}

// ─── Validation ───────────────────────────────────────────────────────────────

async function ensureActivityExists(tenantId: string, activityId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", activityId)
    .limit(1);

  if (error) throw new Error(error.message);
  if ((data ?? []).length === 0) {
    throw new Error("La actividad seleccionada no existe o no pertenece al tenant actual.");
  }
}

// ─── Payload builder ──────────────────────────────────────────────────────────

function buildTaskPayload(input: TaskFormValues) {
  const activityId = sanitizeOptionalId(input.activityId);
  const title = sanitizeText(input.title, 200);
  const description = sanitizeText(input.description, 4000) || null;
  const statusCode = resolveTaskStatusCode(input.statusCode);
  const deadline = normalizeDateValue(input.deadline);

  if (!activityId) {
    throw new Error("La actividad es obligatoria.");
  }
  if (!title) {
    throw new Error("El titulo de la tarea es obligatorio.");
  }

  return {
    id_actividad: activityId,
    titulo: title,
    descripcion: description,
    estado: statusCode,
    fecha_limite: deadline,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listTasks(filters: TaskListFilters): Promise<TaskRow[]> {
  try {
    const tenantId = await getRequiredTenantId();
    const searchTerm = sanitizeSearchTerm(filters.searchTerm);

    let query = ongSchema()
      .from("tareas")
      .select("id, tenant_id, id_actividad, titulo, descripcion, estado, fecha_limite, created_at, created_by, updated_at, updated_by")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.activityId !== "all") {
      query = query.eq("id_actividad", filters.activityId);
    }
    if (filters.statusCode !== "all") {
      query = query.eq("estado", filters.statusCode);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as TaskDbRow[];
    const activityIds = uniqueNonEmpty(rows.map((row) => row.id_actividad).filter(Boolean) as string[]);
    const activityMap = await loadActivityMap(tenantId, activityIds);
    const projectIds = uniqueNonEmpty(Array.from(activityMap.values()).map((row) => row.id_proyecto));
    const projectMap = await loadProjectMap(tenantId, projectIds);
    const volunteerCounts = await loadProjectAssignmentCounts(tenantId, projectIds);

    return rows
      .map((row) => {
        const activity = row.id_actividad ? activityMap.get(row.id_actividad) : undefined;
        const activityLabel = activity ? activity.titulo : null;
        const projectId = activity ? activity.id_proyecto : null;
        const volunteerCount = projectId ? (volunteerCounts.get(projectId) ?? 0) : 0;
        return mapTaskRow(row, activityLabel, volunteerCount);
      })
      .filter((row) => {
        if (!searchTerm) return true;
        return normalizeText(
          `${row.title} ${row.description ?? ""} ${row.activityName ?? ""} ${row.statusLabel}`
        ).includes(normalizeText(searchTerm));
      });
  } catch (error) {
    throw toProjectsError(error, "No se pudieron cargar las tareas.");
  }
}

export async function getTaskDetail(taskId: string): Promise<TaskDetailData | null> {
  try {
    const id = sanitizeOptionalId(taskId);
    if (!id) throw new Error("No se encontro la tarea solicitada.");

    const tenantId = await getRequiredTenantId();
    const { data, error } = await ongSchema()
      .from("tareas")
      .select("id, tenant_id, id_actividad, titulo, descripcion, estado, fecha_limite, created_at, created_by, updated_at, updated_by")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const task = data as TaskDbRow;
    const activityIds = task.id_actividad ? [task.id_actividad] : [];
    const [activityMap, profileLabels] = await Promise.all([
      loadActivityMap(tenantId, activityIds),
      resolveProfileLabels(
        [task.created_by, task.updated_by].filter(Boolean) as string[]
      ).catch(() => new Map<string, string>()),
    ]);

    const activity = task.id_actividad ? activityMap.get(task.id_actividad) : undefined;
    const projectId = activity?.id_proyecto;
    let volunteerCount = 0;
    if (projectId) {
      const counts = await loadProjectAssignmentCounts(tenantId, [projectId]);
      volunteerCount = counts.get(projectId) ?? 0;
    }

    const warnings: string[] = [];
    if (task.id_actividad && !activity) {
      warnings.push("La actividad vinculada ya no esta disponible en el tenant actual.");
    }

    return {
      task: mapTaskRow(task, activity?.titulo ?? null, volunteerCount),
      createdBy: task.created_by ? profileLabels.get(task.created_by) ?? task.created_by : null,
      updatedBy: task.updated_by ? profileLabels.get(task.updated_by) ?? task.updated_by : null,
      warnings,
    };
  } catch (error) {
    throw toProjectsError(error, "No se pudo cargar el detalle de la tarea.");
  }
}

export async function createTask(input: TaskFormValues): Promise<TaskDetailData> {
  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildTaskPayload(input);

    await ensureActivityExists(tenantId, payload.id_actividad);

    const { data, error } = await ongSchema()
      .from("tareas")
      .insert({ tenant_id: tenantId, ...payload, created_by: actorId, updated_by: actorId })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    const detail = await getTaskDetail(data.id);
    if (!detail) throw new Error("La tarea fue creada, pero no se pudo recuperar su detalle.");
    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear la tarea.");
  }
}

export async function updateTask(taskId: string, input: TaskFormValues): Promise<TaskDetailData> {
  try {
    const id = sanitizeOptionalId(taskId);
    if (!id) throw new Error("No se encontro la tarea a actualizar.");

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildTaskPayload(input);

    await ensureActivityExists(tenantId, payload.id_actividad);

    const { error } = await ongSchema()
      .from("tareas")
      .update({ ...payload, updated_by: actorId })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) throw new Error(error.message);

    const detail = await getTaskDetail(id);
    if (!detail) throw new Error("La tarea fue actualizada, pero no se pudo recuperar su detalle.");
    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar la tarea.");
  }
}

export async function cancelTask(taskId: string): Promise<TaskDetailData> {
  try {
    const id = sanitizeOptionalId(taskId);
    if (!id) throw new Error("No se encontro la tarea a cancelar.");

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();

    const { error } = await ongSchema()
      .from("tareas")
      .update({ estado: "cancelada", updated_by: actorId })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) throw new Error(error.message);

    const detail = await getTaskDetail(id);
    if (!detail) throw new Error("La tarea fue cancelada, pero no se pudo recuperar su detalle.");
    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo cancelar la tarea.");
  }
}
