import type {
  ActivityVolunteerAssignmentFormValues,
  AssignmentDetailData,
  AssignmentListFilters,
  AssignmentRow,
  ProjectResourceAssignmentFormValues,
  ProjectVolunteerAssignmentFormValues,
} from "../../modules/projects/types";
import {
  getRequiredTenantId,
  normalizeDateValue,
  normalizeText,
  ongSchema,
  parseNumericInput,
  resolveCurrentUserId,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toProjectsError,
  uniqueNonEmpty,
} from "./shared";

type ProjectDbRow = {
  id: string;
  codigo: string;
  nombre_proyecto: string;
};

type TaskDbRow = {
  id: string;
  id_proyecto: string;
  titulo: string;
};

type ActivityDbRow = {
  id: string;
  id_tarea: string;
  titulo: string;
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

type ProjectVolunteerAssignmentDbRow = {
  id: string;
  tenant_id: string;
  id_proyecto: string;
  id_voluntario: string;
  rol_en_proyecto: string | null;
  fecha_ingreso: string | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
};

type ActivityVolunteerAssignmentDbRow = {
  id: string;
  tenant_id: string;
  id_actividad: string;
  id_voluntario: string;
  rol_en_actividad: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectResourceAssignmentDbRow = {
  id: string;
  tenant_id: string;
  id_proyecto: string;
  id_item: string;
  cantidad_requerida: number;
  cantidad_asignada: number | null;
  created_at: string;
  updated_at: string;
};

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

async function loadTaskMap(tenantId: string, taskIds: string[]): Promise<Map<string, TaskDbRow>> {
  const ids = uniqueNonEmpty(taskIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, id_proyecto, titulo")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as TaskDbRow[]).map((row): [string, TaskDbRow] => [row.id, row])
  );
}

async function loadActivityMap(
  tenantId: string,
  activityIds: string[]
): Promise<Map<string, ActivityDbRow>> {
  const ids = uniqueNonEmpty(activityIds);
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id, id_tarea, titulo")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as ActivityDbRow[]).map((row): [string, ActivityDbRow] => [row.id, row])
  );
}

async function loadVolunteerMap(
  tenantId: string,
  volunteerIds: string[]
): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(volunteerIds);
  if (!ids.length) {
    return new Map();
  }

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

async function loadItemMap(tenantId: string, itemIds: string[]): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(itemIds);
  if (!ids.length) {
    return new Map();
  }

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

function mapProjectVolunteerAssignmentRow(
  row: ProjectVolunteerAssignmentDbRow,
  projectLabel: string,
  volunteerLabel: string
): AssignmentRow {
  const active = row.activo !== false;

  return {
    id: row.id,
    kind: "project-volunteer",
    projectId: row.id_proyecto,
    projectName: projectLabel,
    taskId: null,
    taskName: null,
    activityId: null,
    activityName: null,
    volunteerId: row.id_voluntario,
    volunteerName: volunteerLabel,
    itemId: null,
    itemName: null,
    role: row.rol_en_proyecto,
    joinedAt: row.fecha_ingreso,
    quantityRequired: null,
    quantityAssigned: null,
    active,
    statusLabel: active ? "Activo" : "Inactivo",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivityVolunteerAssignmentRow(
  row: ActivityVolunteerAssignmentDbRow,
  projectId: string,
  taskId: string,
  projectLabel: string,
  taskLabel: string,
  activityLabel: string,
  volunteerLabel: string
): AssignmentRow {
  return {
    id: row.id,
    kind: "activity-volunteer",
    projectId,
    projectName: projectLabel,
    taskId,
    taskName: taskLabel,
    activityId: row.id_actividad,
    activityName: activityLabel,
    volunteerId: row.id_voluntario,
    volunteerName: volunteerLabel,
    itemId: null,
    itemName: null,
    role: row.rol_en_actividad,
    joinedAt: null,
    quantityRequired: null,
    quantityAssigned: null,
    active: true,
    statusLabel: "Vigente",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectResourceAssignmentRow(
  row: ProjectResourceAssignmentDbRow,
  projectLabel: string,
  itemLabel: string
): AssignmentRow {
  const required = Number(row.cantidad_requerida ?? 0);
  const assigned = Number(row.cantidad_asignada ?? 0);

  return {
    id: row.id,
    kind: "project-resource",
    projectId: row.id_proyecto,
    projectName: projectLabel,
    taskId: null,
    taskName: null,
    activityId: null,
    activityName: null,
    volunteerId: null,
    volunteerName: null,
    itemId: row.id_item,
    itemName: itemLabel,
    role: null,
    joinedAt: null,
    quantityRequired: required,
    quantityAssigned: assigned,
    active: true,
    statusLabel: `${assigned}/${required} asignado`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadRawAssignments(tenantId: string) {
  const [projectVolunteerResult, activityVolunteerResult, resourceResult] =
    await Promise.all([
      ongSchema()
        .from("asignaciones_proyecto")
        .select("id, tenant_id, id_proyecto, id_voluntario, rol_en_proyecto, fecha_ingreso, activo, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      ongSchema()
        .from("asignaciones_actividad")
        .select("id, tenant_id, id_actividad, id_voluntario, rol_en_actividad, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false }),
      ongSchema()
        .from("recursos_proyecto")
        .select("id, tenant_id, id_proyecto, id_item, cantidad_requerida, cantidad_asignada, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false }),
    ]);

  if (projectVolunteerResult.error) {
    throw new Error(projectVolunteerResult.error.message);
  }
  if (activityVolunteerResult.error) {
    throw new Error(activityVolunteerResult.error.message);
  }
  if (resourceResult.error) {
    throw new Error(resourceResult.error.message);
  }

  return {
    projectVolunteerRows: (projectVolunteerResult.data ?? []) as ProjectVolunteerAssignmentDbRow[],
    activityVolunteerRows: (activityVolunteerResult.data ?? []) as ActivityVolunteerAssignmentDbRow[],
    resourceRows: (resourceResult.data ?? []) as ProjectResourceAssignmentDbRow[],
  };
}

export async function listAssignments(
  filters: AssignmentListFilters
): Promise<AssignmentRow[]> {
  try {
    const tenantId = await getRequiredTenantId();
    const searchTerm = sanitizeSearchTerm(filters.searchTerm);
    const raw = await loadRawAssignments(tenantId);

    const activityMap = await loadActivityMap(
      tenantId,
      raw.activityVolunteerRows.map((row) => row.id_actividad)
    );
    const taskMap = await loadTaskMap(
      tenantId,
      Array.from(activityMap.values()).map((row) => row.id_tarea)
    );
    const projectMap = await loadProjectMap(tenantId, [
      ...raw.projectVolunteerRows.map((row) => row.id_proyecto),
      ...raw.resourceRows.map((row) => row.id_proyecto),
      ...Array.from(taskMap.values()).map((row) => row.id_proyecto),
    ]);
    const volunteerMap = await loadVolunteerMap(tenantId, [
      ...raw.projectVolunteerRows.map((row) => row.id_voluntario),
      ...raw.activityVolunteerRows.map((row) => row.id_voluntario),
    ]);
    const itemMap = await loadItemMap(
      tenantId,
      raw.resourceRows.map((row) => row.id_item)
    );

    const projectVolunteerRows = raw.projectVolunteerRows.map((row) =>
      mapProjectVolunteerAssignmentRow(
        row,
        projectMap.has(row.id_proyecto)
          ? `${projectMap.get(row.id_proyecto)!.codigo} - ${projectMap.get(row.id_proyecto)!.nombre_proyecto}`
          : row.id_proyecto,
        volunteerMap.get(row.id_voluntario) ?? row.id_voluntario
      )
    );

    const activityVolunteerRows = raw.activityVolunteerRows
      .map((row) => {
        const activity = activityMap.get(row.id_actividad);
        if (!activity) {
          return null;
        }
        const task = taskMap.get(activity.id_tarea);
        if (!task) {
          return null;
        }
        const project = projectMap.get(task.id_proyecto);
        if (!project) {
          return null;
        }

        return mapActivityVolunteerAssignmentRow(
          row,
          project.id,
          task.id,
          `${project.codigo} - ${project.nombre_proyecto}`,
          task.titulo,
          activity.titulo,
          volunteerMap.get(row.id_voluntario) ?? row.id_voluntario
        );
      })
      .filter((row): row is AssignmentRow => Boolean(row));

    const resourceRows = raw.resourceRows.map((row) =>
      mapProjectResourceAssignmentRow(
        row,
        projectMap.has(row.id_proyecto)
          ? `${projectMap.get(row.id_proyecto)!.codigo} - ${projectMap.get(row.id_proyecto)!.nombre_proyecto}`
          : row.id_proyecto,
        itemMap.get(row.id_item) ?? row.id_item
      )
    );

    return [...projectVolunteerRows, ...activityVolunteerRows, ...resourceRows].filter((row) => {
      if (filters.kind !== "all" && row.kind !== filters.kind) {
        return false;
      }
      if (filters.projectId !== "all" && row.projectId !== filters.projectId) {
        return false;
      }
      if (filters.taskId !== "all" && row.taskId !== filters.taskId) {
        return false;
      }
      if (filters.activityId !== "all" && row.activityId !== filters.activityId) {
        return false;
      }
      if (filters.volunteerId !== "all" && row.volunteerId !== filters.volunteerId) {
        return false;
      }
      if (filters.itemId !== "all" && row.itemId !== filters.itemId) {
        return false;
      }
      if (filters.activeState === "active" && row.active === false) {
        return false;
      }
      if (
        filters.activeState === "inactive" &&
        !(row.kind === "project-volunteer" && row.active === false)
      ) {
        return false;
      }
      if (!searchTerm) {
        return true;
      }

      return normalizeText(
        `${row.projectName} ${row.taskName ?? ""} ${row.activityName ?? ""} ${row.volunteerName ?? ""} ${row.itemName ?? ""} ${row.role ?? ""} ${row.statusLabel}`
      ).includes(normalizeText(searchTerm));
    });
  } catch (error) {
    throw toProjectsError(error, "No se pudieron cargar las asignaciones.");
  }
}

export async function getAssignmentDetail(
  assignmentKind: AssignmentRow["kind"],
  assignmentId: string
): Promise<AssignmentDetailData | null> {
  try {
    const rows = await listAssignments({
      searchTerm: "",
      kind: assignmentKind,
      projectId: "all",
      taskId: "all",
      activityId: "all",
      volunteerId: "all",
      itemId: "all",
      activeState: "all",
    });

    const detail = rows.find((row) => row.id === assignmentId) ?? null;
    if (!detail) {
      return null;
    }

    const warnings: string[] = [];

    return {
      assignment: detail,
      warnings,
    };
  } catch (error) {
    throw toProjectsError(error, "No se pudo cargar el detalle de la asignacion.");
  }
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

async function ensureVolunteerExists(tenantId: string, volunteerId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", volunteerId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length === 0) {
    throw new Error("El voluntario seleccionado no existe o no pertenece al tenant actual.");
  }
}

async function ensureActivityExists(tenantId: string, activityId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", activityId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length === 0) {
    throw new Error("La actividad seleccionada no existe o no pertenece al tenant actual.");
  }
}

async function ensureItemExists(tenantId: string, itemId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("items")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", itemId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length === 0) {
    throw new Error("El item seleccionado no existe o no pertenece al tenant actual.");
  }
}

async function ensureProjectVolunteerNotDuplicated(
  tenantId: string,
  projectId: string,
  volunteerId: string,
  currentId?: string | null
): Promise<void> {
  let query = ongSchema()
    .from("asignaciones_proyecto")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id_proyecto", projectId)
    .eq("id_voluntario", volunteerId)
    .limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length > 0) {
    throw new Error("El voluntario ya esta asignado a este proyecto.");
  }
}

async function ensureActivityVolunteerNotDuplicated(
  tenantId: string,
  activityId: string,
  volunteerId: string,
  currentId?: string | null
): Promise<void> {
  let query = ongSchema()
    .from("asignaciones_actividad")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id_actividad", activityId)
    .eq("id_voluntario", volunteerId)
    .eq("is_deleted", false)
    .limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length > 0) {
    throw new Error("El voluntario ya esta asignado a esta actividad.");
  }
}

async function ensureResourceNotDuplicated(
  tenantId: string,
  projectId: string,
  itemId: string,
  currentId?: string | null
): Promise<void> {
  let query = ongSchema()
    .from("recursos_proyecto")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id_proyecto", projectId)
    .eq("id_item", itemId)
    .eq("is_deleted", false)
    .limit(1);

  if (currentId) {
    query = query.neq("id", currentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length > 0) {
    throw new Error("El recurso ya esta vinculado a este proyecto.");
  }
}

export async function createProjectVolunteerAssignment(
  input: ProjectVolunteerAssignmentFormValues
): Promise<AssignmentDetailData> {
  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const projectId = sanitizeOptionalId(input.projectId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const role = sanitizeText(input.role, 100) || null;
    const joinedAt = normalizeDateValue(input.joinedAt);

    if (!projectId) {
      throw new Error("El proyecto es obligatorio.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }

    await Promise.all([
      ensureProjectExists(tenantId, projectId),
      ensureVolunteerExists(tenantId, volunteerId),
      ensureProjectVolunteerNotDuplicated(tenantId, projectId, volunteerId),
    ]);

    const { data, error } = await ongSchema()
      .from("asignaciones_proyecto")
      .insert({
        tenant_id: tenantId,
        id_proyecto: projectId,
        id_voluntario: volunteerId,
        rol_en_proyecto: role,
        fecha_ingreso: joinedAt,
        activo: input.active,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("project-volunteer", data.id);
    if (!detail) {
      throw new Error("La asignacion fue creada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear la asignacion a proyecto.");
  }
}

export async function updateProjectVolunteerAssignment(
  assignmentId: string,
  input: ProjectVolunteerAssignmentFormValues
): Promise<AssignmentDetailData> {
  try {
    const id = sanitizeOptionalId(assignmentId);
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const projectId = sanitizeOptionalId(input.projectId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const role = sanitizeText(input.role, 100) || null;
    const joinedAt = normalizeDateValue(input.joinedAt);

    if (!id) {
      throw new Error("No se encontro la asignacion a proyecto.");
    }
    if (!projectId) {
      throw new Error("El proyecto es obligatorio.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }

    await Promise.all([
      ensureProjectExists(tenantId, projectId),
      ensureVolunteerExists(tenantId, volunteerId),
      ensureProjectVolunteerNotDuplicated(tenantId, projectId, volunteerId, id),
    ]);

    const { error } = await ongSchema()
      .from("asignaciones_proyecto")
      .update({
        id_proyecto: projectId,
        id_voluntario: volunteerId,
        rol_en_proyecto: role,
        fecha_ingreso: joinedAt,
        activo: input.active,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("project-volunteer", id);
    if (!detail) {
      throw new Error("La asignacion fue actualizada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar la asignacion a proyecto.");
  }
}

export async function deactivateProjectVolunteerAssignment(
  assignmentId: string
): Promise<AssignmentDetailData> {
  try {
    const id = sanitizeOptionalId(assignmentId);
    if (!id) {
      throw new Error("No se encontro la asignacion a desactivar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();

    const { error } = await ongSchema()
      .from("asignaciones_proyecto")
      .update({
        activo: false,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("project-volunteer", id);
    if (!detail) {
      throw new Error("La asignacion fue desactivada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo desactivar la asignacion a proyecto.");
  }
}

export async function createActivityVolunteerAssignment(
  input: ActivityVolunteerAssignmentFormValues
): Promise<AssignmentDetailData> {
  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const activityId = sanitizeOptionalId(input.activityId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const role = sanitizeText(input.role, 100) || null;

    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }

    await Promise.all([
      ensureActivityExists(tenantId, activityId),
      ensureVolunteerExists(tenantId, volunteerId),
      ensureActivityVolunteerNotDuplicated(tenantId, activityId, volunteerId),
    ]);

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
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("activity-volunteer", data.id);
    if (!detail) {
      throw new Error("La asignacion fue creada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear la asignacion a actividad.");
  }
}

export async function updateActivityVolunteerAssignment(
  assignmentId: string,
  input: ActivityVolunteerAssignmentFormValues
): Promise<AssignmentDetailData> {
  try {
    const id = sanitizeOptionalId(assignmentId);
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const activityId = sanitizeOptionalId(input.activityId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const role = sanitizeText(input.role, 100) || null;

    if (!id) {
      throw new Error("No se encontro la asignacion a actividad.");
    }
    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }

    await Promise.all([
      ensureActivityExists(tenantId, activityId),
      ensureVolunteerExists(tenantId, volunteerId),
      ensureActivityVolunteerNotDuplicated(tenantId, activityId, volunteerId, id),
    ]);

    const { error } = await ongSchema()
      .from("asignaciones_actividad")
      .update({
        id_actividad: activityId,
        id_voluntario: volunteerId,
        rol_en_actividad: role,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("activity-volunteer", id);
    if (!detail) {
      throw new Error("La asignacion fue actualizada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar la asignacion a actividad.");
  }
}

export async function removeActivityVolunteerAssignment(
  assignmentId: string
): Promise<void> {
  try {
    const id = sanitizeOptionalId(assignmentId);
    if (!id) {
      throw new Error("No se encontro la asignacion a eliminar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const { error } = await ongSchema()
      .from("asignaciones_actividad")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toProjectsError(error, "No se pudo eliminar la asignacion a actividad.");
  }
}

export async function createProjectResourceAssignment(
  input: ProjectResourceAssignmentFormValues
): Promise<AssignmentDetailData> {
  try {
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const projectId = sanitizeOptionalId(input.projectId);
    const itemId = sanitizeOptionalId(input.itemId);
    const quantityRequired = parseNumericInput(input.quantityRequired);
    const quantityAssigned = parseNumericInput(input.quantityAssigned) ?? 0;

    if (!projectId) {
      throw new Error("El proyecto es obligatorio.");
    }
    if (!itemId) {
      throw new Error("El item es obligatorio.");
    }
    if (quantityRequired === null || quantityRequired <= 0) {
      throw new Error("La cantidad requerida debe ser mayor a cero.");
    }
    if (quantityAssigned < 0 || quantityAssigned > quantityRequired) {
      throw new Error("La cantidad asignada debe estar entre cero y la requerida.");
    }

    await Promise.all([
      ensureProjectExists(tenantId, projectId),
      ensureItemExists(tenantId, itemId),
      ensureResourceNotDuplicated(tenantId, projectId, itemId),
    ]);

    const { data, error } = await ongSchema()
      .from("recursos_proyecto")
      .insert({
        tenant_id: tenantId,
        id_proyecto: projectId,
        id_item: itemId,
        cantidad_requerida: quantityRequired,
        cantidad_asignada: quantityAssigned,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("project-resource", data.id);
    if (!detail) {
      throw new Error("La asignacion fue creada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo crear la asignacion de recurso.");
  }
}

export async function updateProjectResourceAssignment(
  assignmentId: string,
  input: ProjectResourceAssignmentFormValues
): Promise<AssignmentDetailData> {
  try {
    const id = sanitizeOptionalId(assignmentId);
    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const projectId = sanitizeOptionalId(input.projectId);
    const itemId = sanitizeOptionalId(input.itemId);
    const quantityRequired = parseNumericInput(input.quantityRequired);
    const quantityAssigned = parseNumericInput(input.quantityAssigned) ?? 0;

    if (!id) {
      throw new Error("No se encontro la asignacion de recurso.");
    }
    if (!projectId) {
      throw new Error("El proyecto es obligatorio.");
    }
    if (!itemId) {
      throw new Error("El item es obligatorio.");
    }
    if (quantityRequired === null || quantityRequired <= 0) {
      throw new Error("La cantidad requerida debe ser mayor a cero.");
    }
    if (quantityAssigned < 0 || quantityAssigned > quantityRequired) {
      throw new Error("La cantidad asignada debe estar entre cero y la requerida.");
    }

    await Promise.all([
      ensureProjectExists(tenantId, projectId),
      ensureItemExists(tenantId, itemId),
      ensureResourceNotDuplicated(tenantId, projectId, itemId, id),
    ]);

    const { error } = await ongSchema()
      .from("recursos_proyecto")
      .update({
        id_proyecto: projectId,
        id_item: itemId,
        cantidad_requerida: quantityRequired,
        cantidad_asignada: quantityAssigned,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    const detail = await getAssignmentDetail("project-resource", id);
    if (!detail) {
      throw new Error("La asignacion fue actualizada, pero no se pudo recuperar su detalle.");
    }

    return detail;
  } catch (error) {
    throw toProjectsError(error, "No se pudo actualizar la asignacion de recurso.");
  }
}

export async function removeProjectResourceAssignment(
  assignmentId: string
): Promise<void> {
  try {
    const id = sanitizeOptionalId(assignmentId);
    if (!id) {
      throw new Error("No se encontro la asignacion de recurso.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    const { error } = await ongSchema()
      .from("recursos_proyecto")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toProjectsError(error, "No se pudo eliminar la asignacion de recurso.");
  }
}

