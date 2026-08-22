// @ts-nocheck
import type {
  ActivityRow,
  ProjectDetailData,
  ProjectFormValues,
  ProjectRow,
  ProjectVolunteerAssignmentRow,
  ProjectResourceAssignmentRow,
  ProjectStatusOption,
  TaskRow,
  ProjectListFilters,
} from "../../modules/projects/types";
import {
  ensureDateOrder,
  getActivityStatusKind,
  getActivityStatusLabel,
  fetchProjectStateOptions,
  getProjectStatusKind,
  getRequiredTenantId,
  getTaskStatusKind,
  getTaskStatusLabel,
  normalizeText,
  normalizeDateValue,
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

type ProjectDbRow = {
  id: string;
  tenant_id: string;
  codigo: string;
  nombre_proyecto: string;
  descripcion: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  id_area: string;
  codigo_estado: string;
  presupuesto: number;
  imagen_url: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

type AreaDbRow = {
  id: string;
  nombre_area: string;
};

type ProjectStateDbRow = {
  codigo: string;
  nombre_estado: string;
};

type TaskDbRow = {
  id: string;
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
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

type LocationDbRow = {
  id: string;
  codigo: string;
  nombre_ubicacion: string;
};

type ProjectVolunteerAssignmentDbRow = {
  id: string;
  id_proyecto: string;
  id_voluntario: string;
  rol_en_proyecto: string | null;
  fecha_ingreso: string | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
};

type ProjectResourceAssignmentDbRow = {
  id: string;
  id_proyecto: string;
  id_item: string;
  cantidad_requerida: number;
  cantidad_asignada: number | null;
  created_at: string;
  updated_at: string;
};

type VolunteerDbRow = {
  id: string;
  nombre: string;
  apellido: string;
};

type ItemDbRow = {
  id: string;
  codigo: string;
  nombre_item: string;
};

function mapProjectStateOptions(rows: ProjectStateDbRow[]): ProjectStatusOption[] {
  return rows.map((row) => ({
    value: row.codigo,
    label: row.nombre_estado,
    kind: getProjectStatusKind(`${row.codigo} ${row.nombre_estado}`),
  }));
}

function resolveProjectState(
  stateCode: string,
  states: ProjectStatusOption[]
): ProjectStatusOption {
  return (
    states.find((item) => item.value === stateCode) ?? {
      value: stateCode,
      label: stateCode || "Sin estado",
      kind: getProjectStatusKind(stateCode),
    }
  );
}

async function loadStateAndAreaMaps(tenantId: string) {
  const [statesResult, areasResult] = await Promise.all([
    ongSchema()
      .from("estados_proyecto")
      .select("codigo, nombre_estado, orden_visual")
      .order("orden_visual", { ascending: true }),
    ongSchema()
      .from("areas")
      .select("id, nombre_area")
      .eq("tenant_id", tenantId)
      .order("nombre_area", { ascending: true }),
  ]);

  if (statesResult.error) {
    throw new Error(statesResult.error.message);
  }
  if (areasResult.error) {
    throw new Error(areasResult.error.message);
  }

  const states = mapProjectStateOptions((statesResult.data ?? []) as ProjectStateDbRow[]);
  const areaById = new Map<string, string>(
    ((areasResult.data ?? []) as AreaDbRow[]).map((row): [string, string] => [
      row.id,
      row.nombre_area,
    ])
  );

  return { states, areaById };
}

async function loadTasksByProject(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, TaskDbRow[]>> {
  if (!projectIds.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, id_proyecto, titulo, descripcion, estado, fecha_limite, created_at, created_by, updated_at, updated_by")
    .eq("tenant_id", tenantId)
    .in("id_proyecto", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, TaskDbRow[]>();
  for (const row of (data ?? []) as TaskDbRow[]) {
    const current = grouped.get(row.id_proyecto) ?? [];
    current.push(row);
    grouped.set(row.id_proyecto, current);
  }

  return grouped;
}

async function loadActivitiesByTask(
  tenantId: string,
  taskIds: string[]
): Promise<Map<string, ActivityDbRow[]>> {
  if (!taskIds.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("actividades")
    .select(
      "id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at, created_by, updated_at, updated_by"
    )
    .eq("tenant_id", tenantId)
    .in("id_tarea", taskIds)
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

async function loadProjectVolunteerAssignments(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, ProjectVolunteerAssignmentDbRow[]>> {
  if (!projectIds.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("asignaciones_proyecto")
    .select("id, id_proyecto, id_voluntario, rol_en_proyecto, fecha_ingreso, activo, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .in("id_proyecto", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, ProjectVolunteerAssignmentDbRow[]>();
  for (const row of (data ?? []) as ProjectVolunteerAssignmentDbRow[]) {
    const current = grouped.get(row.id_proyecto) ?? [];
    current.push(row);
    grouped.set(row.id_proyecto, current);
  }

  return grouped;
}

async function loadProjectResourceAssignments(
  tenantId: string,
  projectIds: string[]
): Promise<Map<string, ProjectResourceAssignmentDbRow[]>> {
  if (!projectIds.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("recursos_proyecto")
    .select("id, id_proyecto, id_item, cantidad_requerida, cantidad_asignada, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .in("id_proyecto", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, ProjectResourceAssignmentDbRow[]>();
  for (const row of (data ?? []) as ProjectResourceAssignmentDbRow[]) {
    const current = grouped.get(row.id_proyecto) ?? [];
    current.push(row);
    grouped.set(row.id_proyecto, current);
  }

  return grouped;
}

async function loadVolunteerLabelMap(volunteerIds: string[]): Promise<Map<string, string>> {
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

async function loadItemLabelMap(itemIds: string[]): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(itemIds);
  if (!ids.length) {
    return new Map();
  }

  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("items")
    .select("id, codigo, nombre_item")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as ItemDbRow[]).map((row): [string, string] => [
      row.id,
      `${row.codigo} - ${row.nombre_item}`,
    ])
  );
}

function mapTaskRow(
  row: TaskDbRow,
  projectName: string,
  activityCount: number,
  volunteerCount: number
): TaskRow {
  const normalizedState = (sanitizeText(row.estado ?? "pendiente", 40) ||
    "pendiente") as TaskRow["statusCode"];

  return {
    id: row.id,
    projectId: row.id_proyecto,
    projectName,
    title: row.titulo,
    description: row.descripcion,
    statusCode: normalizedState,
    statusLabel: getTaskStatusLabel(normalizedState),
    statusKind: getTaskStatusKind(normalizedState),
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
  location: LocationDbRow | undefined,
  assignedVolunteers: number,
  evidenceCount: number,
  registeredHours: number
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
    assignedVolunteers,
    registeredHours,
    evidenceCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectRow(
  row: ProjectDbRow,
  states: ProjectStatusOption[],
  areaById: Map<string, string>,
  taskCount: number,
  activityCount: number,
  volunteerCount: number,
  resourceCount: number
): ProjectRow {
  const state = resolveProjectState(row.codigo_estado, states);

  return {
    id: row.id,
    code: row.codigo,
    name: row.nombre_proyecto,
    description: row.descripcion,
    areaId: row.id_area,
    areaName: areaById.get(row.id_area) ?? "Area no disponible",
    stateCode: row.codigo_estado,
    stateLabel: state.label,
    stateKind: state.kind,
    startDate: row.fecha_inicio,
    endDate: row.fecha_fin,
    budget: Number(row.presupuesto ?? 0),
    imageUrl: row.imagen_url,
    taskCount,
    activityCount,
    volunteerCount,
    resourceCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(
  filters: ProjectListFilters
): Promise<ProjectRow[]> {
  try {
    const tenantId = await getRequiredTenantId();
    const searchTerm = sanitizeSearchTerm(filters.searchTerm);

    let query = ongSchema()
      .from("proyectos")
      .select("id, tenant_id, codigo, nombre_proyecto, descripcion, fecha_inicio, fecha_fin, id_area, codigo_estado, presupuesto, imagen_url, created_at, created_by, updated_at, updated_by")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.areaId !== "all") {
      query = query.eq("id_area", filters.areaId);
    }
    if (filters.stateCode !== "all") {
      query = query.eq("codigo_estado", filters.stateCode);
    }
    if (searchTerm) {
      query = query.or(
        `codigo.ilike.%${searchTerm}%,nombre_proyecto.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ProjectDbRow[];
    const projectIds = rows.map((row) => row.id);
    const { states, areaById } = await loadStateAndAreaMaps(tenantId);
    const [tasksByProject, assignmentsByProject, resourcesByProject] = await Promise.all([
      loadTasksByProject(tenantId, projectIds),
      loadProjectVolunteerAssignments(tenantId, projectIds),
      loadProjectResourceAssignments(tenantId, projectIds),
    ]);

    const taskIds = uniqueNonEmpty(
      Array.from(tasksByProject.values()).flat().map((row) => row.id)
    );
    const activitiesByTask = await loadActivitiesByTask(tenantId, taskIds);

    return rows
      .map((row) =>
        mapProjectRow(
          row,
          states,
          areaById,
          tasksByProject.get(row.id)?.length ?? 0,
          Array.from(tasksByProject.get(row.id) ?? []).reduce(
            (total, task) => total + (activitiesByTask.get(task.id)?.length ?? 0),
            0
          ),
          (assignmentsByProject.get(row.id) ?? []).filter((item) => item.activo !== false).length,
          resourcesByProject.get(row.id)?.length ?? 0
        )
      )
      .filter((row) => {
        if (!searchTerm) {
          return true;
        }

        const haystack = normalizeText(
          `${row.code} ${row.name} ${row.description} ${row.areaName} ${row.stateLabel}`
        );
        return haystack.includes(normalizeText(searchTerm));
      });
  } catch (error) {
    throw toProjectsError(error, "No se pudieron cargar los proyectos.");
  }
}

export async function getProjectDetail(projectId: string): Promise<ProjectDetailData | null> {
  try {
    const id = sanitizeOptionalId(projectId);
    if (!id) {
      throw new Error("No se encontro el proyecto solicitado.");
    }

    const tenantId = await getRequiredTenantId();
    const { data, error } = await ongSchema()
      .from("proyectos")
      .select("id, tenant_id, codigo, nombre_proyecto, descripcion, fecha_inicio, fecha_fin, id_area, codigo_estado, presupuesto, imagen_url, created_at, created_by, updated_at, updated_by")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const project = data as ProjectDbRow;
    const { states, areaById } = await loadStateAndAreaMaps(tenantId);
    const [tasksByProject, assignmentsByProject, resourcesByProject] = await Promise.all([
      loadTasksByProject(tenantId, [project.id]),
      loadProjectVolunteerAssignments(tenantId, [project.id]),
      loadProjectResourceAssignments(tenantId, [project.id]),
    ]);

    const projectTasks = tasksByProject.get(project.id) ?? [];
    const taskIds = projectTasks.map((row) => row.id);
    const activitiesByTask = await loadActivitiesByTask(tenantId, taskIds);
    const allActivities = Array.from(activitiesByTask.values()).flat();
    const locationMap = await loadLocationMap(
      tenantId,
      allActivities.map((row) => row.id_ubicacion).filter(Boolean) as string[]
    );

    const volunteerAssignments = assignmentsByProject.get(project.id) ?? [];
    const volunteerLabelMap = await loadVolunteerLabelMap(
      volunteerAssignments.map((row) => row.id_voluntario)
    );
    const itemLabelMap = await loadItemLabelMap(
      (resourcesByProject.get(project.id) ?? []).map((row) => row.id_item)
    );
    const profileLabels = await resolveProfileLabels(
      [project.created_by, project.updated_by].filter(Boolean) as string[]
    ).catch(() => new Map<string, string>());

    const activityCountByTask = new Map<string, number>();
    for (const activity of allActivities) {
      activityCountByTask.set(
        activity.id_tarea,
        (activityCountByTask.get(activity.id_tarea) ?? 0) + 1
      );
    }

    const projectAssignmentsRows: ProjectVolunteerAssignmentRow[] = volunteerAssignments.map((row) => ({
      id: row.id,
      projectId: row.id_proyecto,
      projectName: `${project.codigo} - ${project.nombre_proyecto}`,
      volunteerId: row.id_voluntario,
      volunteerName: volunteerLabelMap.get(row.id_voluntario) ?? row.id_voluntario,
      role: row.rol_en_proyecto,
      joinedAt: row.fecha_ingreso,
      active: row.activo !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const resourceRows: ProjectResourceAssignmentRow[] = (resourcesByProject.get(project.id) ?? []).map(
      (row) => ({
        id: row.id,
        projectId: row.id_proyecto,
        projectName: `${project.codigo} - ${project.nombre_proyecto}`,
        itemId: row.id_item,
        itemName: itemLabelMap.get(row.id_item) ?? row.id_item,
        quantityRequired: Number(row.cantidad_requerida ?? 0),
        quantityAssigned: Number(row.cantidad_asignada ?? 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );

    const linkedTasks: TaskRow[] = projectTasks.map((row) =>
      mapTaskRow(
        row,
        `${project.codigo} - ${project.nombre_proyecto}`,
        activityCountByTask.get(row.id) ?? 0,
        projectAssignmentsRows.filter((item) => item.active).length
      )
    );

    const linkedActivities: ActivityRow[] = allActivities.map((row) => {
      const parentTask = projectTasks.find((task) => task.id === row.id_tarea);
      if (!parentTask) {
        throw new Error("Se detecto una actividad sin tarea valida dentro del proyecto.");
      }

      return mapActivityRow(
        row,
        parentTask,
        project,
        row.id_ubicacion ? locationMap.get(row.id_ubicacion) : undefined,
        0,
        0,
        0
      );
    });

    return {
      project: mapProjectRow(
        project,
        states,
        areaById,
        linkedTasks.length,
        linkedActivities.length,
        projectAssignmentsRows.filter((item) => item.active).length,
        resourceRows.length
      ),
      createdBy: project.created_by ? profileLabels.get(project.created_by) ?? project.created_by : null,
      updatedBy: project.updated_by ? profileLabels.get(project.updated_by) ?? project.updated_by : null,
      linkedTasks,
      linkedActivities,
      volunteerAssignments: projectAssignmentsRows,
      resourceAssignments: resourceRows,
      warnings: [],
    };
  } catch (error) {
    throw toProjectsError(error, "No se pudo cargar el detalle del proyecto.");
  }
}

async function ensureProjectCodeAvailable(
  tenantId: string,
  code: string,
  currentId?: string | null
): Promise<void> {
  let query = ongSchema()
    .from("proyectos")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("codigo", code)
    .limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length > 0) {
    throw new Error("Ya existe un proyecto con ese codigo dentro del tenant.");
  }
}

async function ensureAreaAndStateExist(
  tenantId: string,
  areaId: string,
  stateCode: string
): Promise<void> {
  const [areaResult, stateResult] = await Promise.all([
    ongSchema().from("areas").select("id").eq("tenant_id", tenantId).eq("id", areaId).limit(1),
    ongSchema().from("estados_proyecto").select("codigo").eq("codigo", stateCode).limit(1),
  ]);

  if (areaResult.error) {
    throw new Error(areaResult.error.message);
  }
  if (stateResult.error) {
    throw new Error(stateResult.error.message);
  }
  if ((areaResult.data ?? []).length === 0) {
    throw new Error("El area seleccionada no existe o no pertenece al tenant actual.");
  }
  if ((stateResult.data ?? []).length === 0) {
    throw new Error("El estado de proyecto seleccionado no existe.");
  }
}

function buildProjectPayload(
  input: ProjectFormValues,
  actorId: string | null,
  tenantId?: string
) {
  const code = sanitizeText(input.code, 50).toUpperCase();
  const name = sanitizeText(input.name, 255);
  const description = sanitizeText(input.description, 4000);
  const areaId = sanitizeOptionalId(input.areaId);
  const stateCode = sanitizeText(input.stateCode, 50);
  const startDate = normalizeDateValue(input.startDate);
  const endDate = normalizeDateValue(input.endDate);
  const budget = parseNumericInput(input.budget);
  const imageUrl = sanitizeText(input.imageUrl, 500);

  if (!code) {
    throw new Error("El codigo del proyecto es obligatorio.");
  }
  if (!name) {
    throw new Error("El nombre del proyecto es obligatorio.");
  }
  if (!description) {
    throw new Error("La descripcion del proyecto es obligatoria.");
  }
  if (!areaId) {
    throw new Error("El area es obligatoria.");
  }
  if (!stateCode) {
    throw new Error("El estado del proyecto es obligatorio.");
  }

  ensureDateOrder(startDate, endDate);
  if (budget === null || budget < 0) {
    throw new Error("El presupuesto debe ser un numero mayor o igual a cero.");
  }

  return {
    tenant_id: tenantId,
    codigo: code,
    nombre_proyecto: name,
    descripcion: description,
    fecha_inicio: startDate,
    fecha_fin: endDate,
    id_area: areaId,
    codigo_estado: stateCode,
    presupuesto: budget,
    imagen_url: imageUrl || null,
    created_by: actorId,
    updated_by: actorId,
  };
}

export async function createProject(input: ProjectFormValues): Promise<ProjectDetailData> {
  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildProjectPayload(input, actorId, tenantId);

    await ensureAreaAndStateExist(tenantId, payload.id_area, payload.codigo_estado);
    await ensureProjectCodeAvailable(tenantId, payload.codigo);

    const { data, error } = await ongSchema()
      .from("proyectos")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getProjectDetail(data.id);
    if (!detail) {
      throw new Error("El proyecto fue creado, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear el proyecto.");
  }
}

export async function updateProject(
  projectId: string,
  input: ProjectFormValues
): Promise<ProjectDetailData> {
  try {
    const id = sanitizeOptionalId(projectId);
    if (!id) {
      throw new Error("No se encontro el proyecto a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const payload = buildProjectPayload(input, actorId);

    await ensureAreaAndStateExist(tenantId, payload.id_area, payload.codigo_estado);
    await ensureProjectCodeAvailable(tenantId, payload.codigo, id);

    const { error } = await ongSchema()
      .from("proyectos")
      .update({
        codigo: payload.codigo,
        nombre_proyecto: payload.nombre_proyecto,
        descripcion: payload.descripcion,
        fecha_inicio: payload.fecha_inicio,
        fecha_fin: payload.fecha_fin,
        id_area: payload.id_area,
        codigo_estado: payload.codigo_estado,
        presupuesto: payload.presupuesto,
        imagen_url: payload.imagen_url,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getProjectDetail(id);
    if (!detail) {
      throw new Error("El proyecto fue actualizado, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar el proyecto.");
  }
}

export async function archiveProject(projectId: string): Promise<ProjectDetailData> {
  try {
    const id = sanitizeOptionalId(projectId);
    if (!id) {
      throw new Error("No se encontro el proyecto a archivar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const states = await fetchProjectStateOptions();
    const archivedState =
      states.find((item) => item.kind === "cancelled") ??
      states.find((item) => item.kind === "completed") ??
      states[0];

    if (!archivedState) {
      throw new Error("No existe un estado catalogado para archivar proyectos.");
    }

    const { error } = await ongSchema()
      .from("proyectos")
      .update({
        codigo_estado: archivedState.value,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getProjectDetail(id);
    if (!detail) {
      throw new Error("El proyecto fue archivado, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo archivar el proyecto.");
  }
}

