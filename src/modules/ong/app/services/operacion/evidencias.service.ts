import { supabase } from "../../../supabaseClient";
import type {
  EvidenceFilters,
  EvidenceRegisterInput,
  EvidenceUpdateInput,
  EvidenceValidationInput,
  OperationEvidenceData,
  OperationEvidenceRow,
} from "../../modules/operation/types";
import {
  buildEvidenceTypeLabel,
  buildApprovalStateOptions,
  computeFileHash,
  fetchEvidenceTypeOptions,
  fetchVolunteerCatalog,
  getRequiredTenantId,
  mapApprovalStatusKind,
  mapApprovalVariant,
  normalizeText,
  ongSchema,
  resolveCurrentUserId,
  resolveEvidenceTypeCode,
  resolveEvidenceTypeId,
  sanitizeFileName,
  sanitizeOptionalId,
  sanitizePath,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
  uniqueNonEmpty,
  isRouteValueValid,
} from "./shared";

const EVIDENCE_LIMIT = 500;
const EVIDENCE_BUCKET = (
  (import.meta as { env?: { VITE_ONG_EVIDENCE_BUCKET?: string } }).env?.VITE_ONG_EVIDENCE_BUCKET ??
  ""
).trim();
const EVIDENCE_VALIDATION_BLOCKED_MESSAGE =
  "La validacion de evidencias no esta documentada en los scripts SQL actuales para ong.evidencias_actividad.";

type ActivityLookup = {
  id: string;
  id_tarea: string;
  titulo: string;
};

type TaskLookup = {
  id: string;
  id_proyecto: string;
  titulo: string;
};

type ProjectLookup = {
  id: string;
  codigo: string;
  nombre_proyecto: string;
};

type EvidenceDbRow = {
  id: string;
  id_actividad: string;
  id_voluntario: string | null;
  url_archivo: string;
  tipo_evidencia: string | null;
  comentario: string | null;
  created_at: string;
  updated_at: string;
};

async function loadActivityLookups(activityIds: string[]): Promise<{
  activities: Map<string, ActivityLookup>;
  tasks: Map<string, TaskLookup>;
  projects: Map<string, ProjectLookup>;
}> {
  if (!activityIds.length) {
    return { activities: new Map(), tasks: new Map(), projects: new Map() };
  }

  const tenantId = await getRequiredTenantId();
  const { data: activityRows, error: activityError } = await ongSchema()
    .from("actividades")
    .select("id, id_tarea, titulo")
    .eq("tenant_id", tenantId)
    .in("id", activityIds);

  if (activityError) {
    throw new Error(activityError.message);
  }

  const activities = new Map<string, ActivityLookup>(
    ((activityRows ?? []) as ActivityLookup[]).map((row): [string, ActivityLookup] => [
      row.id,
      row,
    ])
  );
  const taskIds = uniqueNonEmpty((activityRows ?? []).map((row) => row.id_tarea));

  const { data: taskRows, error: taskError } = await ongSchema()
    .from("tareas")
    .select("id, id_proyecto, titulo")
    .eq("tenant_id", tenantId)
    .in("id", taskIds);

  if (taskError) {
    throw new Error(taskError.message);
  }

  const tasks = new Map<string, TaskLookup>(
    ((taskRows ?? []) as TaskLookup[]).map((row): [string, TaskLookup] => [row.id, row])
  );
  const projectIds = uniqueNonEmpty((taskRows ?? []).map((row) => row.id_proyecto));

  const { data: projectRows, error: projectError } = await ongSchema()
    .from("proyectos")
    .select("id, codigo, nombre_proyecto")
    .eq("tenant_id", tenantId)
    .in("id", projectIds);

  if (projectError) {
    throw new Error(projectError.message);
  }

  const projects = new Map<string, ProjectLookup>(
    ((projectRows ?? []) as ProjectLookup[]).map((row): [string, ProjectLookup] => [row.id, row])
  );
  return { activities, tasks, projects };
}

async function loadVolunteerLabels(volunteerIds: string[]): Promise<Map<string, string>> {
  if (!volunteerIds.length) {
    return new Map();
  }

  const volunteers = await fetchVolunteerCatalog().catch((): { value: string; label: string }[] => []);
  return new Map<string, string>(
    volunteers
      .filter((item) => volunteerIds.includes(item.value))
      .map((item): [string, string] => [item.value, item.label])
  );
}

function mapRow(
  row: EvidenceDbRow,
  lookups: Awaited<ReturnType<typeof loadActivityLookups>>,
  volunteerLabels: Map<string, string>
): OperationEvidenceRow {
  const activity = lookups.activities.get(row.id_actividad);
  const task = activity ? lookups.tasks.get(activity.id_tarea) : undefined;
  const project = task ? lookups.projects.get(task.id_proyecto) : undefined;
  const validationKind = mapApprovalStatusKind("otro");

  return {
    id: row.id,
    activityId: row.id_actividad,
    activityName: activity?.titulo ?? "Actividad no disponible",
    projectId: task?.id_proyecto ?? null,
    projectName: project ? `${project.codigo} - ${project.nombre_proyecto}` : "Proyecto no disponible",
    volunteerId: row.id_voluntario,
    volunteerName: row.id_voluntario ? volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario : "Sin autor",
    typeId: null,
    typeName: row.tipo_evidencia ? buildEvidenceTypeLabel(row.tipo_evidencia) : "Sin tipo",
    route: row.url_archivo,
    description: row.comentario ?? "",
    uploadedAt: toDateTimeLabel(row.created_at),
    rawUploadedAt: row.created_at,
    hash: "-",
    validationStatusId: null,
    validationStatusName: "Sin validacion documentada",
    validationStatusKind: validationKind,
    validationVariant: mapApprovalVariant(validationKind),
  };
}

export async function listEvidencias(
  filters: EvidenceFilters
): Promise<OperationEvidenceData> {
  try {
    const tenantId = await getRequiredTenantId();
    const warnings: string[] = [EVIDENCE_VALIDATION_BLOCKED_MESSAGE];

    const [volunteerOptions, evidenceTypeOptions, approvalStates, evidenceRowsResult] = await Promise.all([
      fetchVolunteerCatalog().catch(() => {
        warnings.push("No se pudo cargar el catalogo de voluntarios.");
        return [];
      }),
      fetchEvidenceTypeOptions().catch(() => {
        warnings.push("No se pudo cargar el catalogo de tipos de evidencia.");
        return [];
      }),
      buildApprovalStateOptions(),
      ongSchema()
        .from("evidencias_actividad")
        .select("id, id_actividad, id_voluntario, url_archivo, tipo_evidencia, comentario, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(EVIDENCE_LIMIT),
    ]);

    if (evidenceRowsResult.error) {
      throw new Error(evidenceRowsResult.error.message);
    }

    const evidenceRows = (evidenceRowsResult.data ?? []) as EvidenceDbRow[];
    const activityIds = uniqueNonEmpty(evidenceRows.map((row) => row.id_actividad));
    const volunteerIds = uniqueNonEmpty(evidenceRows.map((row) => row.id_voluntario));
    const lookups = await loadActivityLookups(activityIds);
    const volunteerLabels = await loadVolunteerLabels(volunteerIds);
    const rows = await Promise.all(
      evidenceRows.map(async (row) => {
        const filterTypeId = row.tipo_evidencia ? await resolveEvidenceTypeId(row.tipo_evidencia) : null;
        const mapped = mapRow(row, lookups, volunteerLabels);
        return {
          ...mapped,
          typeId: filterTypeId,
        };
      })
    ).then((items) =>
      items.filter((item) => {
        if (filters.activityId !== "all" && item.activityId !== filters.activityId) {
          return false;
        }
        if (filters.volunteerId !== "all" && item.volunteerId !== filters.volunteerId) {
          return false;
        }
        if (filters.typeId !== "all" && item.typeId !== filters.typeId) {
          return false;
        }
        if (filters.validation !== "all" && item.validationStatusKind !== filters.validation) {
          return false;
        }
        if (filters.dateFrom && item.rawUploadedAt < `${filters.dateFrom}T00:00:00.000Z`) {
          return false;
        }
        if (filters.dateTo && item.rawUploadedAt > `${filters.dateTo}T23:59:59.999Z`) {
          return false;
        }

        const search = normalizeText(filters.searchTerm);
        if (!search) {
          return true;
        }

        return [
          item.activityName,
          item.projectName,
          item.volunteerName,
          item.typeName,
          item.route,
          item.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
    );

    return {
      rows,
      volunteerOptions,
      activityOptions: Array.from(
        new Map<string, string>(
          rows.map((row): [string, string] => [row.activityId, row.activityName])
        ).entries()
      ).map(([value, label]) => ({ value, label })),
      evidenceTypeOptions,
      approvalStates,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las evidencias.");
  }
}

export async function getEvidenciaById(evidenceId: string): Promise<OperationEvidenceRow> {
  const data = await listEvidencias({
    searchTerm: "",
    activityId: "all",
    volunteerId: "all",
    typeId: "all",
    validation: "all",
    dateFrom: null,
    dateTo: null,
  });

  const row = data.rows.find((item) => item.id === evidenceId);
  if (!row) {
    throw new Error("La evidencia no existe.");
  }
  return row;
}

export interface MutationFeedback {
  id: string;
  approvalSynced: boolean;
  warning?: string;
}

export async function createEvidencia(
  input: EvidenceRegisterInput
): Promise<MutationFeedback> {
  try {
    const activityId = sanitizeOptionalId(input.activityId);
    const volunteerId = sanitizeOptionalId(input.volunteerId ?? null);
    const routeInput = sanitizePath(input.routeInput);
    const description = sanitizeText(input.description, 500);
    const file = input.file ?? null;

    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }
    if (!routeInput && !file) {
      throw new Error("Debes adjuntar un archivo o ingresar una ruta.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();
    let resolvedRoute = routeInput;
    let hashArchivo: string | null = null;

    if (file) {
      hashArchivo = await computeFileHash(file);
      if (EVIDENCE_BUCKET) {
        const fileName = sanitizeFileName(file.name);
        const storagePath = `actividades/${activityId}/${Date.now()}-${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .upload(storagePath, file, { upsert: false });
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        resolvedRoute = `${EVIDENCE_BUCKET}/${storagePath}`;
      }
    }

    if (!resolvedRoute || !isRouteValueValid(resolvedRoute)) {
      throw new Error("La ruta o enlace de evidencia no es valido.");
    }

    const typeCode = input.typeId !== undefined && input.typeId !== null
      ? await resolveEvidenceTypeCode(Number(input.typeId))
      : null;

    const { data, error } = await ongSchema()
      .from("evidencias_actividad")
      .insert({
        tenant_id: tenantId,
        id_actividad: activityId,
        id_voluntario: volunteerId ?? "",
        url_archivo: resolvedRoute,
        tipo_evidencia: typeCode ?? "foto",
        comentario: description || null,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: (data as { id: string }).id,
      approvalSynced: true,
      warning: hashArchivo ? undefined : undefined,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la evidencia.");
  }
}

export async function updateEvidencia(
  input: EvidenceUpdateInput
): Promise<OperationEvidenceRow> {
  try {
    const evidenceId = sanitizeOptionalId(input.evidenceId);
    if (!evidenceId) {
      throw new Error("No se encontro la evidencia a editar.");
    }

    const tenantId = await getRequiredTenantId();
    const updates: Record<string, string | null> = {};

    if (input.typeId !== undefined) {
      updates.tipo_evidencia =
        input.typeId === null ? "foto" : (await resolveEvidenceTypeCode(Number(input.typeId))) ?? "foto";
    }
    if (input.description !== undefined) {
      updates.comentario = sanitizeText(input.description, 500) || null;
    }
    if (input.routeInput !== undefined) {
      const route = sanitizePath(input.routeInput);
      if (!route || !isRouteValueValid(route)) {
        throw new Error("La ruta de evidencia no es valida.");
      }
      updates.url_archivo = route;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No hay cambios para guardar.");
    }

    const actorId = await resolveCurrentUserId();
    const { error } = await ongSchema()
      .from("evidencias_actividad")
      .update({
        ...updates,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", evidenceId);

    if (error) {
      throw new Error(error.message);
    }

    return getEvidenciaById(evidenceId);
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la evidencia.");
  }
}

export async function removeEvidencia(
  evidenceId: string
): Promise<void> {
  try {
    const sanitizedId = sanitizeOptionalId(evidenceId);
    if (!sanitizedId) {
      throw new Error("No se encontro la evidencia a eliminar.");
    }

    const tenantId = await getRequiredTenantId();
    const { error } = await ongSchema()
      .from("evidencias_actividad")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar la evidencia.");
  }
}

export async function validateEvidencia(
  input: EvidenceValidationInput
): Promise<MutationFeedback> {
  void input;
  throw toOperationError(
    new Error(EVIDENCE_VALIDATION_BLOCKED_MESSAGE),
    EVIDENCE_VALIDATION_BLOCKED_MESSAGE
  );
}
