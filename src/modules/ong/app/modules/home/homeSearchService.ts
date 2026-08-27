import type {
  GlobalSearchDetailData,
  GlobalSearchGroupedResults,
  GlobalSearchItem,
} from "./types";
import {
  db,
  EMPTY_GLOBAL_SEARCH_RESULTS,
  SEARCH_MIN_LENGTH,
  getRequiredTenantId,
  getProjectNameMap,
  getTaskMap,
  safeOrPatternValue,
  toFriendlyError,
  uniqueNonEmpty,
} from "./homeShared";
import { sanitizeSearchTerm } from "./validators";

export interface SearchGlobalOptions {
  limitPerGroup?: number;
  signal?: AbortSignal;
}

export function getEmptySearchResults(): GlobalSearchGroupedResults {
  return {
    ...EMPTY_GLOBAL_SEARCH_RESULTS,
    volunteers: [],
    projects: [],
    activities: [],
    admissions: [],
  };
}

export function getSearchMinLength(): number {
  return SEARCH_MIN_LENGTH;
}

function buildEntityTargetPath(
  type: GlobalSearchItem["type"],
  entityId: string
): string {
  const params = new URLSearchParams();

  if (type === "volunteer") {
    params.set("volunteerId", entityId);
    return `/app/ong/people/volunteers?${params.toString()}`;
  }

  if (type === "project") {
    params.set("projectId", entityId);
    return `/app/ong/projects?${params.toString()}`;
  }

  if (type === "activity") {
    params.set("activityId", entityId);
    return `/app/ong/projects/activities?${params.toString()}`;
  }

  params.set("requestId", entityId);
  return `/app/ong/admission/requests?${params.toString()}`;
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-PE");
}

function formatActivityStatusLabel(value: string | null | undefined): string {
  const normalized = sanitizeSearchTerm(value ?? "").toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("plan")) {
    return "Planificada";
  }
  if (normalized.includes("progreso")) {
    return "En progreso";
  }
  if (normalized.includes("complet")) {
    return "Completada";
  }
  if (normalized.includes("cancel")) {
    return "Cancelada";
  }
  return "Pendiente";
}

async function resolveVolunteerStateLabel(code: string): Promise<string> {
  const { data, error } = await db
    .schema("ong")
    .from("estados_voluntario")
    .select("nombre_estado")
    .eq("codigo", code)
    .limit(1);

  if (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo resolver el estado del voluntario.")
    );
  }

  return data?.[0]?.nombre_estado ?? code;
}

async function resolveProjectStateLabel(code: string): Promise<string> {
  const { data, error } = await db
    .schema("ong")
    .from("estados_proyecto")
    .select("nombre_estado")
    .eq("codigo", code)
    .limit(1);

  if (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo resolver el estado del proyecto.")
    );
  }

  return data?.[0]?.nombre_estado ?? code;
}

export async function searchVolunteers(rawTerm: string, limit: number = 6): Promise<GlobalSearchItem[]> {
  const sanitized = sanitizeSearchTerm(rawTerm);
  if (sanitized.length < SEARCH_MIN_LENGTH) return [];
  const searchPattern = `%${safeOrPatternValue(sanitized)}%`;
  const tenantId = await getRequiredTenantId();

  const { data, error } = await db
    .schema("ong")
    .from("voluntarios")
    .select("id, nombre, apellido, email, numero_documento, tipo_documento, codigo_estado, ruta_foto")
    .eq("tenant_id", tenantId)
    .or(`nombre.ilike.${searchPattern},apellido.ilike.${searchPattern},email.ilike.${searchPattern},numero_documento.ilike.${searchPattern}`)
    .limit(limit);

  if (error) throw new Error(toFriendlyError(error, "Error buscando voluntarios."));

  return (data ?? []).map((row) => ({
    id: row.id,
    type: "volunteer",
    title: `${row.nombre} ${row.apellido}`.trim(),
    subtitle: row.email ?? `${row.tipo_documento ?? "DOC"} ${row.numero_documento ?? "sin documento"}`,
    targetPath: buildEntityTargetPath("volunteer", row.id),
    metadata: {
      codigo_estado: row.codigo_estado,
      ruta_foto: row.ruta_foto,
    }
  }));
}

export async function searchProjects(rawTerm: string, limit: number = 6): Promise<GlobalSearchItem[]> {
  const sanitized = sanitizeSearchTerm(rawTerm);
  if (sanitized.length < SEARCH_MIN_LENGTH) return [];
  const searchPattern = `%${safeOrPatternValue(sanitized)}%`;
  const tenantId = await getRequiredTenantId();

  const { data, error } = await db
    .schema("ong")
    .from("proyectos")
    .select("id, codigo, nombre_proyecto, descripcion")
    .eq("tenant_id", tenantId)
    .or(`codigo.ilike.${searchPattern},nombre_proyecto.ilike.${searchPattern},descripcion.ilike.${searchPattern}`)
    .limit(limit);

  if (error) throw new Error(toFriendlyError(error, "Error buscando proyectos."));

  return (data ?? []).map((row) => ({
    id: row.id,
    type: "project",
    title: row.nombre_proyecto,
    subtitle: row.descripcion || `Código ${row.codigo}`,
    targetPath: buildEntityTargetPath("project", row.id),
    metadata: {
      codigo: row.codigo
    }
  }));
}

export async function searchActivities(rawTerm: string, limit: number = 6): Promise<GlobalSearchItem[]> {
  const sanitized = sanitizeSearchTerm(rawTerm);
  if (sanitized.length < SEARCH_MIN_LENGTH) return [];
  const searchPattern = `%${safeOrPatternValue(sanitized)}%`;
  const tenantId = await getRequiredTenantId();

  const { data, error } = await db
    .schema("ong")
    .from("actividades")
    .select("id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion")
    .eq("tenant_id", tenantId)
    .or(`titulo.ilike.${searchPattern},descripcion.ilike.${searchPattern}`)
    .limit(limit);

  if (error) throw new Error(toFriendlyError(error, "Error buscando actividades."));

  const activityRows = data ?? [];
  const taskIds = uniqueNonEmpty(activityRows.map((item) => item.id_tarea));
  const taskMap = await getTaskMap(taskIds, tenantId);
  const projectNameMap = await getProjectNameMap(
    uniqueNonEmpty(Array.from(taskMap.values()).map((task) => task.projectId)),
    tenantId
  );

  return activityRows.map((row) => {
    const task = taskMap.get(row.id_tarea);
    const projectName = task ? projectNameMap.get(task.projectId) ?? "Proyecto" : "Proyecto";
    return {
      id: row.id,
      type: "activity",
      title: row.titulo,
      subtitle: `${task?.title ?? "Tarea"} - ${projectName} - ${formatActivityStatusLabel(row.codigo_estado)}`,
      targetPath: buildEntityTargetPath("activity", row.id),
      metadata: {
        fecha_inicio: row.fecha_inicio,
        fecha_fin: row.fecha_fin,
        codigo_estado: row.codigo_estado
      }
    };
  });
}

export async function searchAdmissions(rawTerm: string, limit: number = 6): Promise<GlobalSearchItem[]> {
  const sanitized = sanitizeSearchTerm(rawTerm);
  if (sanitized.length < SEARCH_MIN_LENGTH) return [];
  const searchPattern = `%${safeOrPatternValue(sanitized)}%`;
  const tenantId = await getRequiredTenantId();

  const { data, error } = await db
    .schema("rrhh")
    .from("solicitudes_admision")
    .select("id, nombres, apellidos, email, estado")
    .eq("tenant_id", tenantId)
    .or(`nombres.ilike.${searchPattern},apellidos.ilike.${searchPattern},email.ilike.${searchPattern},estado.ilike.${searchPattern}`)
    .limit(limit);

  if (error) throw new Error(toFriendlyError(error, "Error buscando solicitudes de admisión."));

  return (data ?? []).map((row) => ({
    id: row.id,
    type: "admission",
    title: `${row.nombres} ${row.apellidos}`.trim(),
    subtitle: row.email ?? row.estado,
    targetPath: buildEntityTargetPath("admission", row.id),
    metadata: {
      estado: row.estado
    }
  }));
}

export async function fetchGlobalSearchDetail(
  item: GlobalSearchItem
): Promise<GlobalSearchDetailData> {
  const tenantId = await getRequiredTenantId();

  if (item.type === "volunteer") {
    const { data, error } = await db
      .schema("ong")
      .from("voluntarios")
      .select(
        "id, nombre, apellido, tipo_documento, numero_documento, email, telefono, codigo_estado, fecha_nacimiento, observaciones, created_at"
      )
      .eq("tenant_id", tenantId)
      .eq("id", item.id)
      .limit(1);

    if (error) {
      throw new Error(
        toFriendlyError(error, "No se pudo cargar el detalle del voluntario.")
      );
    }

    const row = data?.[0];
    if (!row) {
      throw new Error("El voluntario ya no existe o no pertenece al tenant.");
    }

    const stateLabel = await resolveVolunteerStateLabel(row.codigo_estado);

    return {
      id: row.id,
      type: item.type,
      title: `${row.nombre} ${row.apellido}`.trim(),
      subtitle:
        row.email ??
        `${row.tipo_documento ?? "DOC"} ${row.numero_documento ?? "sin documento"}`,
      targetPath: item.targetPath,
      fields: [
        {
          label: "Documento",
          value: `${row.tipo_documento ?? "DOC"} ${row.numero_documento ?? "-"}`,
        },
        { label: "Correo", value: row.email ?? "-" },
        { label: "Telefono", value: row.telefono ?? "-" },
        { label: "Estado", value: stateLabel || "-" },
        { label: "Nacimiento", value: formatDateLabel(row.fecha_nacimiento) },
        { label: "Registro", value: formatDateLabel(row.created_at) },
        { label: "Observaciones", value: row.observaciones ?? "-" },
      ],
    };
  }

  if (item.type === "project") {
    const { data, error } = await db
      .schema("ong")
      .from("proyectos")
      .select(
        "id, codigo, nombre_proyecto, descripcion, fecha_inicio, fecha_fin, codigo_estado, presupuesto, created_at"
      )
      .eq("tenant_id", tenantId)
      .eq("id", item.id)
      .limit(1);

    if (error) {
      throw new Error(
        toFriendlyError(error, "No se pudo cargar el detalle del proyecto.")
      );
    }

    const row = data?.[0];
    if (!row) {
      throw new Error("El proyecto ya no existe o no pertenece al tenant.");
    }

    const stateLabel = await resolveProjectStateLabel(row.codigo_estado);

    return {
      id: row.id,
      type: item.type,
      title: row.nombre_proyecto,
      subtitle: row.descripcion || `Codigo ${row.codigo}`,
      targetPath: item.targetPath,
      fields: [
        { label: "Codigo", value: row.codigo ?? "-" },
        { label: "Estado", value: stateLabel || "-" },
        { label: "Fecha inicio", value: formatDateLabel(row.fecha_inicio) },
        { label: "Fecha fin", value: formatDateLabel(row.fecha_fin) },
        {
          label: "Presupuesto",
          value: Number(row.presupuesto ?? 0).toLocaleString("es-PE"),
        },
        { label: "Registro", value: formatDateLabel(row.created_at) },
        { label: "Descripcion", value: row.descripcion || "-" },
      ],
    };
  }

  if (item.type === "activity") {
    const { data, error } = await db
      .schema("ong")
      .from("actividades")
      .select("id, id_tarea, titulo, descripcion, codigo_estado, fecha_inicio, fecha_fin, id_ubicacion, horas_estimadas, created_at")
      .eq("tenant_id", tenantId)
      .eq("id", item.id)
      .limit(1);

    if (error) {
      throw new Error(
        toFriendlyError(error, "No se pudo cargar el detalle de la actividad.")
      );
    }

    const row = data?.[0];
    if (!row) {
      throw new Error("La actividad ya no existe o no pertenece al tenant.");
    }

    const [taskMap, locationResult] = await Promise.all([
      getTaskMap([row.id_tarea], tenantId),
      row.id_ubicacion
        ? db
            .schema("ong")
            .from("ubicaciones")
            .select("id, codigo, nombre_ubicacion")
            .eq("tenant_id", tenantId)
            .eq("id", row.id_ubicacion)
            .limit(1)
        : Promise.resolve({
            data: [] as Array<{
              id: string;
              codigo: string;
              nombre_ubicacion: string;
            }>,
            error: null,
          }),
    ]);
    if (locationResult.error) {
      throw new Error(
        toFriendlyError(locationResult.error, "No se pudo resolver la ubicacion de la actividad.")
      );
    }
    const task = taskMap.get(row.id_tarea);
    const projectMap = await getProjectNameMap(task ? [task.projectId] : [], tenantId);
    const projectName = task ? projectMap.get(task.projectId) ?? "Proyecto" : "Proyecto";
    const location = locationResult.data?.[0];

    return {
      id: row.id,
      type: item.type,
      title: row.titulo,
      subtitle: `${task?.title ?? "Tarea"} - ${projectName}`,
      targetPath: item.targetPath,
      fields: [
        { label: "Proyecto", value: projectName },
        { label: "Tarea", value: task?.title ?? "-" },
        { label: "Estado actividad", value: formatActivityStatusLabel(row.codigo_estado) },
        { label: "Fecha inicio", value: formatDateLabel(row.fecha_inicio) },
        { label: "Fecha fin", value: formatDateLabel(row.fecha_fin) },
        {
          label: "Ubicacion",
          value: location ? `${location.codigo} - ${location.nombre_ubicacion}` : "-",
        },
        {
          label: "Horas estimadas",
          value:
            row.horas_estimadas === null
              ? "-"
              : Number(row.horas_estimadas).toLocaleString("es-PE", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                }),
        },
        { label: "Estado tarea", value: task?.status ?? "-" },
        { label: "Vencimiento tarea", value: formatDateLabel(task?.dueDate) },
        { label: "Registro", value: formatDateLabel(row.created_at) },
        { label: "Descripcion", value: row.descripcion ?? "-" },
      ],
    };
  }

  const { data, error } = await db
    .schema("rrhh")
    .from("solicitudes_admision")
    .select("id, nombres, apellidos, email, estado, fecha_solicitud, notas")
    .eq("tenant_id", tenantId)
    .eq("id", item.id)
    .limit(1);

  if (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo cargar el detalle de la solicitud.")
    );
  }

  const row = data?.[0];
  if (!row) {
    throw new Error("La solicitud ya no existe o no pertenece al tenant.");
  }

  return {
    id: row.id,
    type: item.type,
    title: `${row.nombres} ${row.apellidos}`.trim(),
    subtitle: `${row.email} - ${row.estado}`,
    targetPath: item.targetPath,
    fields: [
      { label: "Correo", value: row.email ?? "-" },
      { label: "Estado", value: row.estado ?? "-" },
      { label: "Fecha solicitud", value: formatDateLabel(row.fecha_solicitud) },
      { label: "Notas", value: row.notas ?? "-" },
    ],
  };
}

