import type {
  HoursApprovalRequestInput,
  HoursFilters,
  HoursRegisterInput,
  HoursResolutionInput,
  HoursUpdateInput,
  OperationHoursData,
  OperationHoursRow,
} from "../../modules/operation/types";
import {
  buildApprovalStateOptions,
  ensureHoursRange,
  ensurePositiveMinutes,
  fetchVolunteerCatalog,
  getRequiredTenantId,
  mapApprovalStatusKind,
  mapApprovalVariant,
  minutesToHours,
  normalizeDateValue,
  normalizeText,
  normalizeTimeValue,
  ongSchema,
  resolveCurrentUserId,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeText,
  timeToMinutes,
  toDateTimeLabel,
  toOperationError,
  uniqueNonEmpty,
} from "./shared";

const HOURS_LIMIT = 500;
const HOURS_SCHEMA_WARNING =
  "Segun `guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt`, `ong.horas_actividad` ya persiste `id_aprobacion` y `comentario_resolucion`; el rango horario sigue sin almacenarse y solo se usa para calcular horas.";
const HOURS_REMOVE_BLOCKED_MESSAGE =
  "La anulación lógica de horas no está soportada por el contrato SQL actual de ong.horas_actividad.";

type ActivityLookup = {
  id: string;
  titulo: string;
  id_tarea: string;
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

type HoursDbRow = {
  id: string;
  id_actividad: string;
  id_voluntario: string;
  horas_registradas: number;
  fecha: string;
  estado_aprobacion: string;
  aprobado_por: string | null;
  id_aprobacion: string | null;
  comentario_resolucion: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type ApprovalDbRow = {
  id: string;
  entidad_id: string;
  estado: string;
  comentario: string | null;
  solicitado_por: string | null;
  resuelto_por: string | null;
  requested_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface MutationFeedback {
  id: string;
  approvalSynced: boolean;
  warning?: string;
}

function resolveHoursFromInput(
  minutesInput: number | null,
  startTime: string | null,
  endTime: string | null
): number {
  if (typeof minutesInput === "number" && Number.isFinite(minutesInput) && minutesInput > 0) {
    return minutesInput;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null || endMinutes < startMinutes) {
    return 0;
  }

  return endMinutes - startMinutes;
}

function buildMutationWarning(options: {
  usedTimeRange?: boolean;
  observationProvided?: boolean;
  commentProvided?: boolean;
  correctionReasonProvided?: boolean;
}): string | undefined {
  const messages: string[] = [];

  if (options.usedTimeRange) {
    messages.push("El rango horario solo se usa para calcular horas; la BD guarda el total.");
  }
  if (options.observationProvided) {
    messages.push("La observacion operativa no tiene columna propia en `ong.horas_actividad`.");
  }
  if (options.correctionReasonProvided) {
    messages.push("El motivo de correccion se agrega sobre `comentario_resolucion` para no perder trazabilidad.");
  }
  if (options.commentProvided) {
    messages.push("El comentario se sincroniza en `ong.aprobaciones.comentario` y `ong.horas_actividad.comentario_resolucion`.");
  }

  return messages.length ? messages.join(" ") : undefined;
}

async function ensureActivityExists(activityId: string, tenantId: string): Promise<void> {
  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", activityId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }
  if (!(data ?? []).length) {
    throw new Error("La actividad seleccionada no existe o no pertenece al tenant actual.");
  }
}

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
  if (!taskIds.length) {
    return { activities, tasks: new Map(), projects: new Map() };
  }

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
  if (!projectIds.length) {
    return { activities, tasks, projects: new Map() };
  }

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

function mapApprovalStateId(kind: ReturnType<typeof mapApprovalStatusKind>): number {
  if (kind === "approved") {
    return 2;
  }
  if (kind === "rejected") {
    return 3;
  }
  return 1;
}

async function loadApprovalLookups(
  tenantId: string,
  rows: HoursDbRow[]
): Promise<{
  byApprovalId: Map<string, ApprovalDbRow>;
  latestByHoursId: Map<string, ApprovalDbRow>;
}> {
  const approvalIds = uniqueNonEmpty(rows.map((row) => row.id_aprobacion));
  const hoursIdsWithoutApproval = uniqueNonEmpty(
    rows.filter((row) => !row.id_aprobacion).map((row) => row.id)
  );
  const byApprovalId = new Map<string, ApprovalDbRow>();
  const latestByHoursId = new Map<string, ApprovalDbRow>();

  if (approvalIds.length) {
    const { data, error } = await ongSchema()
      .from("aprobaciones")
      .select(
        "id, entidad_id, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
      )
      .eq("tenant_id", tenantId)
      .in("id", approvalIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as ApprovalDbRow[]) {
      byApprovalId.set(row.id, row);
      if (!latestByHoursId.has(row.entidad_id)) {
        latestByHoursId.set(row.entidad_id, row);
      }
    }
  }

  if (hoursIdsWithoutApproval.length) {
    const { data, error } = await ongSchema()
      .from("aprobaciones")
      .select(
        "id, entidad_id, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
      )
      .eq("tenant_id", tenantId)
      .eq("entidad_schema", "ong")
      .eq("entidad_tabla", "horas_actividad")
      .in("entidad_id", hoursIdsWithoutApproval)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as ApprovalDbRow[]) {
      if (!latestByHoursId.has(row.entidad_id)) {
        latestByHoursId.set(row.entidad_id, row);
      }
    }
  }

  return { byApprovalId, latestByHoursId };
}

async function resolveApprovalLinkId(
  tenantId: string,
  hoursId: string,
  currentApprovalId: string | null
): Promise<string | null> {
  if (currentApprovalId) {
    return currentApprovalId;
  }

  const { data, error } = await ongSchema()
    .from("aprobaciones")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("entidad_schema", "ong")
    .eq("entidad_tabla", "horas_actividad")
    .eq("entidad_id", hoursId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
}

async function syncHoursApproval(options: {
  tenantId: string;
  hoursId: string;
  currentApprovalId: string | null;
  requestedBy: string | null;
  actorId: string | null;
  targetState: "pendiente" | "aprobada" | "rechazada";
  comment: string | null;
}): Promise<string> {
  const approvalId = await resolveApprovalLinkId(
    options.tenantId,
    options.hoursId,
    options.currentApprovalId
  );
  const nowIso = new Date().toISOString();
  const requestedBy = options.requestedBy ?? options.actorId ?? null;

  if (approvalId) {
    const updatePayload: Record<string, string | null> = {
      estado: options.targetState,
      comentario: options.comment,
      solicitado_por: requestedBy,
      resuelto_por:
        options.targetState === "pendiente" ? null : options.actorId ?? null,
      resolved_at: options.targetState === "pendiente" ? null : nowIso,
      updated_by: options.actorId ?? requestedBy,
      updated_at: nowIso,
    };

    if (options.targetState === "pendiente") {
      updatePayload.requested_at = nowIso;
    }

    const { error } = await ongSchema()
      .from("aprobaciones")
      .update(updatePayload)
      .eq("tenant_id", options.tenantId)
      .eq("id", approvalId);

    if (error) {
      throw new Error(error.message);
    }

    return approvalId;
  }

  const { data, error } = await ongSchema()
    .from("aprobaciones")
    .insert({
      tenant_id: options.tenantId,
      modulo: "operation",
      entidad_schema: "ong",
      entidad_tabla: "horas_actividad",
      entidad_id: options.hoursId,
      tipo_aprobacion: "hora",
      estado: options.targetState,
      comentario: options.comment,
      solicitado_por: requestedBy,
      resuelto_por:
        options.targetState === "pendiente" ? null : options.actorId ?? null,
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

function mapRow(
  row: HoursDbRow,
  lookups: Awaited<ReturnType<typeof loadActivityLookups>>,
  volunteerLabels: Map<string, string>,
  profileLabels: Map<string, string>,
  approvals: Awaited<ReturnType<typeof loadApprovalLookups>>
): OperationHoursRow {
  const activity = lookups.activities.get(row.id_actividad);
  const task = activity ? lookups.tasks.get(activity.id_tarea) : undefined;
  const project = task ? lookups.projects.get(task.id_proyecto) : undefined;
  const approval =
    (row.id_aprobacion ? approvals.byApprovalId.get(row.id_aprobacion) : undefined) ??
    approvals.latestByHoursId.get(row.id);
  const approvalState = approval?.estado ?? row.estado_aprobacion;
  const approvalKind = mapApprovalStatusKind(approvalState);
  const minutes = Math.round(row.horas_registradas * 60);
  const requestedById = approval?.solicitado_por ?? row.created_by;
  const approvedById = approval?.resuelto_por ?? row.aprobado_por;
  const requestedBy =
    (requestedById ? profileLabels.get(requestedById) : null) ??
    volunteerLabels.get(row.id_voluntario) ??
    row.id_voluntario;
  const approvedBy =
    (approvedById ? profileLabels.get(approvedById) : null) ?? (approvedById || "-");

  return {
    id: row.id,
    volunteerId: row.id_voluntario,
    volunteerName: volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario,
    activityId: row.id_actividad,
    activityName: activity?.titulo ?? "Actividad no disponible",
    projectId: task?.id_proyecto ?? null,
    projectName: project
      ? `${project.codigo} - ${project.nombre_proyecto}`
      : "Proyecto no disponible",
    date: row.fecha,
    startTime: "--:--",
    endTime: "--:--",
    minutes,
    hours: minutesToHours(minutes),
    statusId: mapApprovalStateId(approvalKind),
    statusName: approvalState.replace(/_/g, " "),
    statusKind: approvalKind,
    statusVariant: mapApprovalVariant(approvalKind),
    observation: sanitizeText(approval?.comentario ?? row.comentario_resolucion, 500),
    requestedAt: toDateTimeLabel(approval?.requested_at ?? row.created_at),
    approvedAt: approvedById
      ? toDateTimeLabel(approval?.resolved_at ?? approval?.updated_at ?? row.updated_at)
      : "-",
    requestedBy,
    approvedBy,
    isCorrected: false,
    canReview: approvalKind === "pending",
  };
}

export async function listHoras(
  filters: HoursFilters,
  ownerVolunteerId?: string | null
): Promise<OperationHoursData> {
  try {
    const tenantId = await getRequiredTenantId();
    const warnings = [HOURS_SCHEMA_WARNING];
    const [volunteerOptions, approvalStates] = await Promise.all([
      fetchVolunteerCatalog().catch(() => {
        warnings.push("No se pudo cargar el catálogo de voluntarios.");
        return [];
      }),
      buildApprovalStateOptions(),
    ]);

    let query = ongSchema()
      .from("horas_actividad")
      .select(
        "id, id_actividad, id_voluntario, horas_registradas, fecha, estado_aprobacion, aprobado_por, id_aprobacion, comentario_resolucion, created_at, updated_at, created_by, updated_by"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(HOURS_LIMIT);

    if (filters.volunteerId !== "all") {
      query = query.eq("id_voluntario", filters.volunteerId);
    }
    if (filters.activityId !== "all") {
      query = query.eq("id_actividad", filters.activityId);
    }
    if (filters.dateFrom) {
      query = query.gte("fecha", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("fecha", filters.dateTo);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rowsDb = (data ?? []) as HoursDbRow[];
    const activityIds = uniqueNonEmpty(rowsDb.map((row) => row.id_actividad));
    const volunteerIds = uniqueNonEmpty(rowsDb.map((row) => row.id_voluntario));
    const profileIds = uniqueNonEmpty(
      rowsDb.flatMap((row) => [row.created_by, row.aprobado_por])
    );

    const [lookups, volunteerLabels, approvals] = await Promise.all([
      loadActivityLookups(activityIds),
      loadVolunteerLabels(volunteerIds),
      loadApprovalLookups(tenantId, rowsDb),
    ]);
    const approvalProfileIds = uniqueNonEmpty(
      Array.from(approvals.byApprovalId.values()).flatMap((row) => [
        row.solicitado_por,
        row.resuelto_por,
      ])
    );
    const profileLabels = await resolveProfileLabels([
      ...profileIds,
      ...approvalProfileIds,
    ]).catch(() => new Map<string, string>());

    const rows = rowsDb
      .map((row) => mapRow(row, lookups, volunteerLabels, profileLabels, approvals))
      .filter((row) => {
        if (filters.status !== "all" && row.statusKind !== filters.status) {
          return false;
        }
        if (filters.projectId !== "all" && row.projectId !== filters.projectId) {
          return false;
        }
        if (filters.scope === "mine") {
          return ownerVolunteerId ? row.volunteerId === ownerVolunteerId : false;
        }
        if (filters.scope === "review" && row.statusKind !== "pending") {
          return false;
        }

        const search = normalizeText(filters.searchTerm);
        if (!search) {
          return true;
        }

        return [
          row.volunteerName,
          row.activityName,
          row.projectName,
          row.date,
          row.statusName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      });

    const projectOptions = Array.from(
      new Map<string, string>(
        rows
          .filter((row) => Boolean(row.projectId))
          .map((row): [string, string] => [row.projectId as string, row.projectName])
      ).entries()
    ).map(([value, label]) => ({ value, label }));

    const activityOptions = Array.from(
      new Map<string, string>(
        rows.map((row): [string, string] => [row.activityId, row.activityName])
      ).entries()
    ).map(([value, label]) => ({ value, label }));

    return {
      rows,
      volunteerOptions,
      activityOptions,
      projectOptions,
      approvalStates,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las horas.");
  }
}

export async function getHorasById(hoursId: string): Promise<OperationHoursRow> {
  const data = await listHoras(
    {
      searchTerm: "",
      status: "all",
      scope: "all",
      volunteerId: "all",
      projectId: "all",
      activityId: "all",
      dateFrom: null,
      dateTo: null,
    },
    null
  );

  const row = data.rows.find((item) => item.id === hoursId);
  if (!row) {
    throw new Error("El registro de horas ya no existe.");
  }
  return row;
}

export async function createHoras(input: HoursRegisterInput): Promise<MutationFeedback> {
  try {
    const activityId = sanitizeOptionalId(input.activityId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const date = normalizeDateValue(input.date);
    const startTime = normalizeTimeValue(input.startTime ?? null);
    const endTime = normalizeTimeValue(input.endTime ?? null);
    const minutesInput =
      input.minutes === null || input.minutes === undefined ? null : Number(input.minutes);
    const observation = sanitizeText(input.observation, 500);

    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }
    if (!date) {
      throw new Error("La fecha es obligatoria.");
    }

    if ((input.startTime && !startTime) || (input.endTime && !endTime)) {
      throw new Error("El rango horario no es válido.");
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
      throw new Error("Debes completar hora de inicio y hora de fin.");
    }
    if (startTime && endTime) {
      ensureHoursRange(startTime, endTime);
    }

    const resolvedMinutes = resolveHoursFromInput(minutesInput, startTime, endTime);
    if (!resolvedMinutes || resolvedMinutes <= 0) {
      throw new Error("Debes ingresar minutos positivos o un rango horario válido.");
    }
    ensurePositiveMinutes(resolvedMinutes);
    if (!Number.isFinite(resolvedMinutes) || resolvedMinutes > 24 * 60) {
      throw new Error("Los minutos registrados exceden el máximo permitido.");
    }

    const tenantId = await getRequiredTenantId();
    await ensureActivityExists(activityId, tenantId);

    const actorId = await resolveCurrentUserId();
    const { data, error } = await ongSchema()
      .from("horas_actividad")
      .insert({
        tenant_id: tenantId,
        id_actividad: activityId,
        id_voluntario: volunteerId,
        horas_registradas: resolvedMinutes / 60,
        fecha: date,
        estado_aprobacion: "pendiente",
        aprobado_por: null,
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
      warning: buildMutationWarning({
        usedTimeRange: Boolean(startTime && endTime),
        observationProvided: Boolean(observation),
      }),
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar las horas.");
  }
}

export async function updateHoras(input: HoursUpdateInput): Promise<MutationFeedback> {
  try {
    const hoursId = sanitizeOptionalId(input.hoursId);
    if (!hoursId) {
      throw new Error("No se encontró el registro de horas a editar.");
    }

    const tenantId = await getRequiredTenantId();
    const { data: currentRows, error } = await ongSchema()
      .from("horas_actividad")
      .select(
        "id, id_actividad, id_voluntario, horas_registradas, fecha, estado_aprobacion, id_aprobacion, comentario_resolucion, created_by"
      )
      .eq("tenant_id", tenantId)
      .eq("id", hoursId)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const current = (currentRows ?? [])[0] as HoursDbRow | undefined;
    if (!current) {
      throw new Error("El registro de horas ya no existe.");
    }

    const activityId =
      input.activityId !== undefined ? sanitizeOptionalId(input.activityId) : current.id_actividad;
    const volunteerId =
      input.volunteerId !== undefined
        ? sanitizeOptionalId(input.volunteerId)
        : current.id_voluntario;
    const date = input.date !== undefined ? normalizeDateValue(input.date) : current.fecha;
    const startTime =
      input.startTime !== undefined ? normalizeTimeValue(input.startTime) : null;
    const endTime = input.endTime !== undefined ? normalizeTimeValue(input.endTime) : null;
    const minutesInput =
      input.minutes === null || input.minutes === undefined ? null : Number(input.minutes);
    const observation = sanitizeText(input.observation, 500);
    const correctionReason = sanitizeText(input.correctionReason, 300);

    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio.");
    }
    if (!date) {
      throw new Error("La fecha es obligatoria.");
    }
    if ((input.startTime && !startTime) || (input.endTime && !endTime)) {
      throw new Error("El rango horario no es válido.");
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
      throw new Error("Debes completar hora de inicio y hora de fin.");
    }
    if (startTime && endTime) {
      ensureHoursRange(startTime, endTime);
    }

    await ensureActivityExists(activityId, tenantId);

    const resolvedMinutes =
      resolveHoursFromInput(minutesInput, startTime, endTime) ||
      Math.round(current.horas_registradas * 60);

    if (!resolvedMinutes || resolvedMinutes <= 0) {
      throw new Error("Debes ingresar minutos positivos o un rango horario válido.");
    }
    ensurePositiveMinutes(resolvedMinutes);
    if (!Number.isFinite(resolvedMinutes) || resolvedMinutes > 24 * 60) {
      throw new Error("Los minutos registrados exceden el máximo permitido.");
    }

    const { error: updateError } = await ongSchema()
      .from("horas_actividad")
      .update({
        id_actividad: activityId,
        id_voluntario: volunteerId,
        fecha: date,
        horas_registradas: resolvedMinutes / 60,
        comentario_resolucion:
          correctionReason || current.comentario_resolucion || null,
        updated_by: await resolveCurrentUserId(),
      })
      .eq("tenant_id", tenantId)
      .eq("id", hoursId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      id: hoursId,
      approvalSynced: true,
      warning: buildMutationWarning({
        usedTimeRange: Boolean(startTime && endTime),
        observationProvided: Boolean(observation),
        correctionReasonProvided: Boolean(correctionReason),
      }),
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar el registro de horas.");
  }
}

export async function resolveHoras(input: HoursResolutionInput): Promise<MutationFeedback> {
  try {
    const hoursId = sanitizeOptionalId(input.hoursId);
    if (!hoursId) {
      throw new Error("No se encontró el registro de horas a resolver.");
    }

    const tenantId = await getRequiredTenantId();
    const targetState = buildApprovalStateOptions().find(
      (item) => item.value === input.targetStateId
    );
    if (!targetState) {
      throw new Error("El estado de aprobación seleccionado no es válido.");
    }
    if (targetState.kind === "observed") {
      throw new Error(
        "El contrato SQL actual de ong.horas_actividad no soporta el estado observado."
      );
    }

    const { data: currentRows, error: currentError } = await ongSchema()
      .from("horas_actividad")
      .select("id, created_by, id_aprobacion, comentario_resolucion")
      .eq("tenant_id", tenantId)
      .eq("id", hoursId)
      .limit(1);

    if (currentError) {
      throw new Error(currentError.message);
    }

    const current = ((currentRows ?? []) as Array<{
      id: string;
      created_by: string | null;
      id_aprobacion: string | null;
      comentario_resolucion: string | null;
    }>)[0];

    if (!current) {
      throw new Error("El registro de horas ya no existe.");
    }

    const actorId =
      sanitizeOptionalId(input.reviewerId ?? null) ?? (await resolveCurrentUserId());
    const comment = sanitizeText(input.comment, 500) || null;
    const databaseState =
      targetState.kind === "approved"
        ? "aprobada"
        : targetState.kind === "rejected"
          ? "rechazada"
          : "pendiente";
    const approvalId = await syncHoursApproval({
      tenantId,
      hoursId,
      currentApprovalId: current.id_aprobacion,
      requestedBy: current.created_by,
      actorId,
      targetState: databaseState,
      comment,
    });

    const payload: Record<string, string | null> = {
      estado_aprobacion: databaseState,
      aprobado_por:
        targetState.kind === "approved" || targetState.kind === "rejected"
          ? actorId
          : null,
      id_aprobacion: approvalId,
      comentario_resolucion: comment ?? current.comentario_resolucion ?? null,
      updated_by: actorId,
    };

    const { error: updateError } = await ongSchema()
      .from("horas_actividad")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", hoursId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      id: hoursId,
      approvalSynced: true,
      warning: buildMutationWarning({
        commentProvided: Boolean(comment),
      }),
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo resolver el registro de horas.");
  }
}

export async function requestHoursApproval(
  input: HoursApprovalRequestInput
): Promise<MutationFeedback> {
  return resolveHoras({
    hoursId: input.hoursId,
    targetStateId: 1,
    reviewerId: input.requesterId,
    comment: input.comment,
  });
}

export const requestHorasApproval = requestHoursApproval;

export async function removeHoras(hoursId: string, actorId?: string | null): Promise<void> {
  void hoursId;
  void actorId;
  throw toOperationError(
    new Error(HOURS_REMOVE_BLOCKED_MESSAGE),
    HOURS_REMOVE_BLOCKED_MESSAGE
  );
}
