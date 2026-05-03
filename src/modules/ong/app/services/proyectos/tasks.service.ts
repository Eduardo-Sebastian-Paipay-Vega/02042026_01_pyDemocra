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

type TaskDbRow = {
  id: string;
  tenant_id: string;
  id_proyecto: string;
  titulo: string;
  descripcion: string | null;
  estado: string | null;
  fecha_limite: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

type ProjectDbRow = {
  id: string;
  codigo: string;
  nombre_proyecto: string;
};

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

function mapTaskRow(
  row: TaskDbRow,
  projectLabel: string,
  activityCount: number,
  volunteerCount: number
): TaskRow {
  const statusCode = resolveTaskStatusCode(row.estado);

  return {
    id: row.id,
    projectId: row.id_proyecto,
    projectName: projectLabel,
    title: row.titulo,
    description: row.descripcion,
    statusCode,
    statusLabel: getTaskStatusLabel(statusCode),
    statusKind: getTaskStatusKind(statusCode),
    deadline: row.fecha_limite,
    activityCount,
    volunteerCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivityRow(
  row: ActivityDbRow,
  task: TaskDbRow,
  project: ProjectDbRow,
  location: LocationDbRow | undefined
): ActivityRow {
  const statusCode = resolveActivityStatusCode(row.codigo_estado);

  return {
    id: row.id,
    taskId: row.id_tarea,
    taskName: task.titulo,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

async function loadActivityMapByTask(
  tenantId: string,
  taskIds: string[]
): Promise<Map<string, ActivityDbRow[]>> {
  const ids = uniqueNonEmpty(taskIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("actividades")
    .select(
      "id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .in("id_tarea", ids)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, ActivityDbRow[]>();
  for (const row of (data ?? []) as ActivityDbRow[]) {
    const current = grouped.get(row.id_tarea) ?? [];
    current.push(row);
    grouped.set(row.id_tarea, current);
  }

  return grouped;
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

async function loadProjectAssignmentCounts(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, number>> {
  const ids = uniqueNonEmpty(projectIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("asignaciones_proyecto")
    .select("id, id_proyecto, activo")
    .eq("tenant_id", tenantId)
    .in("id_proyecto", ids);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as ProjectAssignmentDbRow[]) {
    if (row.activo === false) {
      continue;
    }
    counts.set(row.id_proyecto, (counts.get(row.id_proyecto) ?? 0) + 1);
  }

  return counts;
}

async function ensureProjectExists(tenantId: string, projectId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("proyectos")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", projectId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length === 0) {
    throw new Error("El proyecto seleccionado no existe o no pertenece al tenant actual.");
  }
}

function buildTaskPayload(input: TaskFormValues) {
  const projectId = sanitizeOptionalId(input.projectId);
  const title = sanitizeText(input.title, 200);
  const description = sanitizeText(input.description, 4000) || null;
  const statusCode = resolveTaskStatusCode(input.statusCode);
  const deadline = normalizeDateValue(input.deadline);

  if (!projectId) {
    throw new Error("El proyecto es obligatorio.");
  }
  if (!title) {
    throw new Error("El titulo de la tarea es obligatorio.");
  }

  return {
    id_proyecto: projectId,
    titulo: title,
    descripcion: description,
    estado: statusCode,
    fecha_limite: deadline,
  };
}

export async function listTasks(filters: TaskListFilters): Promise<TaskRow[]> {
  try {
    const tenantId = await getRequiredTenantId();
    const searchTerm = sanitizeSearchTerm(filters.searchTerm);

    let query = ongSchema()
      .from("tareas")
      .select("id, tenant_id, id_proyecto, titulo, descripcion, estado, fecha_limite, created_at, created_by, updated_at, updated_by")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.projectId !== "all") {
      query = query.eq("id_proyecto", filters.projectId);
    }
    if (filters.statusCode !== "all") {
      query = query.eq("estado", filters.statusCode);
    }
    if (searchTerm) {
      query = query.or(`titulo.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as TaskDbRow[];
    const projectMap = await loadProjectMap(
      tenantId,
      rows.map((row) => row.id_proyecto)
    );
    const activitiesByTask = await loadActivityMapByTask(
      tenantId,
      rows.map((row) => row.id)
    );
    const projectAssignmentCounts = await loadProjectAssignmentCounts(
      tenantId,
      rows.map((row) => row.id_proyecto)
    );

    return rows
      .map((row) => {
        const project = projectMap.get(row.id_proyecto);
        return mapTaskRow(
          row,
          project ? `${project.codigo} - ${project.nombre_proyecto}` : row.id_proyecto,
          activitiesByTask.get(row.id)?.length ?? 0,
          projectAssignmentCounts.get(row.id_proyecto) ?? 0
        );
      })
      .filter((row) => {
        if (!searchTerm) {
          return true;
        }

        return normalizeText(
          `${row.title} ${row.description ?? ""} ${row.projectName} ${row.statusLabel}`
        ).includes(normalizeText(searchTerm));
      });
  } catch (error) {
    throw toProjectsError(error, "No se pudieron cargar las tareas.");
  }
}

export async function getTaskDetail(taskId: string): Promise<TaskDetailData | null> {
  try {
    const id = sanitizeOptionalId(taskId);
    if (!id) {
      throw new Error("No se encontro la tarea solicitada.");
    }

    const tenantId = await getRequiredTenantId();
    const { data, error } = await ongSchema()
      .from("tareas")
      .select("id, tenant_id, id_proyecto, titulo, descripcion, estado, fecha_limite, created_at, created_by, updated_at, updated_by")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const task = data as TaskDbRow;
    const [projectMap, activitiesByTask, projectAssignmentCounts, profileLabels] =
      await Promise.all([
        loadProjectMap(tenantId, [task.id_proyecto]),
        loadActivityMapByTask(tenantId, [task.id]),
        loadProjectAssignmentCounts(tenantId, [task.id_proyecto]),
        resolveProfileLabels(
          [task.created_by, task.updated_by].filter(Boolean) as string[]
        ).catch(() => new Map<string, string>()),
      ]);

    const project = projectMap.get(task.id_proyecto);
    if (!project) {
      throw new Error("La tarea apunta a un proyecto que no existe en el tenant actual.");
    }

    const activityRows = activitiesByTask.get(task.id) ?? [];
    const locationMap = await loadLocationMap(
      tenantId,
      activityRows.map((row) => row.id_ubicacion).filter(Boolean) as string[]
    );

    const linkedActivities = activityRows.map((row) =>
      mapActivityRow(
        row,
        task,
        project,
        row.id_ubicacion ? locationMap.get(row.id_ubicacion) : undefined
      )
    );

    const volunteerCounts = projectAssignmentCounts.get(task.id_proyecto) ?? 0;

    return {
      task: mapTaskRow(
        task,
        `${project.codigo} - ${project.nombre_proyecto}`,
        linkedActivities.length,
        volunteerCounts
      ),
      createdBy: task.created_by ? profileLabels.get(task.created_by) ?? task.created_by : null,
      updatedBy: task.updated_by ? profileLabels.get(task.updated_by) ?? task.updated_by : null,
      linkedActivities,
      projectAssignments: [],
      warnings: [],
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

    await ensureProjectExists(tenantId, payload.id_proyecto);

    const { data, error } = await ongSchema()
      .from("tareas")
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

    const detail = await getTaskDetail(data.id);
    if (!detail) {
      throw new Error("La tarea fue creada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear la tarea.");
  }
}

export async function updateTask(taskId: string, input: TaskFormValues): Promise<TaskDetailData> {
  try {
    const id = sanitizeOptionalId(taskId);
    if (!id) {
      throw new Error("No se encontro la tarea a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildTaskPayload(input);

    await ensureProjectExists(tenantId, payload.id_proyecto);

    const { error } = await ongSchema()
      .from("tareas")
      .update({
        ...payload,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getTaskDetail(id);
    if (!detail) {
      throw new Error("La tarea fue actualizada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar la tarea.");
  }
}

export async function cancelTask(taskId: string): Promise<TaskDetailData> {
  try {
    const id = sanitizeOptionalId(taskId);
    if (!id) {
      throw new Error("No se encontro la tarea a cancelar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();

    const { error } = await ongSchema()
      .from("tareas")
      .update({
        estado: "cancelada",
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getTaskDetail(id);
    if (!detail) {
      throw new Error("La tarea fue cancelada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo cancelar la tarea.");
  }
}
