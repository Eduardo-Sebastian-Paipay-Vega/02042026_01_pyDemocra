import type {
  AttendanceExitInput,
  AttendanceFilters,
  AttendanceIncidenceInput,
  AttendanceRegisterInput,
  AttendanceScanInput,
  AttendanceScanResult,
  AttendanceUpdateInput,
  OperationAttendanceData,
  OperationAttendanceRow,
  SelectOption,
  StatusVariant,
} from "../../modules/operation/types";
import {
  fetchActivityCatalog,
  fetchProjectCatalog,
  fetchVolunteerCatalog,
  getRequiredTenantId,
  normalizeDateTimeValue,
  normalizeDateValue,
  normalizeText,
  normalizeTimeValue,
  ongSchema,
  resolveCurrentUserId,
  sanitizeOptionalId,
  sanitizeText,
  timeToMinutes,
  toDateLabel,
  toDateTimeLabel,
  toOperationError,
  uniqueNonEmpty,
} from "./shared";

const ATTENDANCE_LIMIT = 500;
const ATTENDANCE_SCHEMA_WARNING =
  "Se sincronizo el submodulo contra `ong.asistencias` y `ong.id_cards` segun `guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt`.";
const PROJECT_DERIVED_WARNING =
  "La tabla `ong.asistencias` no guarda `id_proyecto`; el proyecto se deriva desde `ong.actividades -> ong.tareas -> ong.proyectos`.";

type AttendanceStatus = OperationAttendanceRow["status"];

type AttendanceDbRow = {
  id: string;
  tenant_id: string;
  id_actividad: string;
  id_voluntario: string;
  fecha_operacion: string;
  check_in_at: string | null;
  check_out_at: string | null;
  origen_registro: "scan" | "manual" | "import";
  estado: "presente" | "tardanza" | "ausente" | "justificado" | "pendiente";
  observacion: string | null;
  qr_payload: string | null;
  id_card_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  is_deleted: boolean;
};

type IdCardScanRow = {
  id: string;
  id_voluntario: string;
  card_code: string;
  qr_payload: string;
  estado: "activa" | "revocada" | "expirada";
  expires_at: string | null;
};

type ActivityLookup = {
  id: string;
  titulo: string;
  id_proyecto: string | null;
};

type ProjectLookup = {
  id: string;
  codigo: string;
  nombre_proyecto: string;
};

function getTodayDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveAttendanceStatus(row: AttendanceDbRow): AttendanceStatus {
  if (row.estado === "ausente" || row.estado === "justificado") {
    return "incidence";
  }

  if (row.check_out_at) {
    return "closed";
  }

  return "open";
}

function resolveStatusVariant(status: AttendanceStatus): StatusVariant {
  if (status === "closed") {
    return "success";
  }
  if (status === "incidence") {
    return "destructive";
  }
  return "warning";
}

function resolveDurationMinutes(
  checkInAt: string | null,
  checkOutAt: string | null
): number | null {
  if (!checkInAt || !checkOutAt) {
    return null;
  }

  const start = new Date(checkInAt).getTime();
  const end = new Date(checkOutAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 60000);
}

function isExpiredAt(
  expiresAt: string | null | undefined,
  scanTimeIso: string | null
): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  const scanTime = new Date(scanTimeIso ?? new Date().toISOString()).getTime();
  return Number.isFinite(expiresAtTime) && Number.isFinite(scanTime) && expiresAtTime <= scanTime;
}

function appendObservation(
  currentObservation: string | null | undefined,
  extraNote: string | null | undefined
): string | null {
  const current = sanitizeText(currentObservation, 500);
  const note = sanitizeText(extraNote, 300);

  if (!current && !note) {
    return null;
  }
  if (!current) {
    return note;
  }
  if (!note) {
    return current;
  }

  return `${current} | ${note}`.slice(0, 500);
}

function combineDateAndTime(date: string, time: string | null, fallback: Date): string {
  if (time) {
    const candidate = new Date(`${date}T${time}:00`);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate.toISOString();
    }
  }

  return fallback.toISOString();
}

async function resolveScanCredential(
  qrPayload: string,
  tenantId: string,
  scanTimeIso: string | null
): Promise<IdCardScanRow> {
  const { data, error } = await ongSchema()
    .from("id_cards")
    .select("id, id_voluntario, card_code, qr_payload, estado, expires_at")
    .eq("tenant_id", tenantId)
    .eq("qr_payload", qrPayload)
    .limit(2);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as IdCardScanRow[];
  const card = rows[0] ?? null;

  if (!card) {
    throw new Error("La credencial QR no existe para el tenant actual.");
  }

  if (card.estado === "revocada") {
    throw new Error("La credencial fue revocada y no puede registrar asistencias.");
  }

  if (card.estado === "expirada" || isExpiredAt(card.expires_at, scanTimeIso)) {
    throw new Error("La credencial esta expirada y no puede registrar asistencias.");
  }

  return card;
}

async function resolveScanOutcome(
  tenantId: string,
  volunteerId: string,
  activityId: string,
  scanDate: string
): Promise<"check-in" | "check-out"> {
  const { data, error } = await ongSchema()
    .from("asistencias")
    .select("id, check_out_at")
    .eq("tenant_id", tenantId)
    .eq("id_voluntario", volunteerId)
    .eq("id_actividad", activityId)
    .eq("fecha_operacion", scanDate)
    .eq("is_deleted", false)
    .order("check_in_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const latest = (data ?? [])[0] as { check_out_at: string | null } | undefined;
  if (!latest) {
    return "check-in";
  }

  return latest.check_out_at ? "check-out" : "check-out";
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
  projects: Map<string, ProjectLookup>;
}> {
  if (!activityIds.length) {
    return {
      activities: new Map(),
      projects: new Map(),
    };
  }

  const tenantId = await getRequiredTenantId();
  const { data: activityRows, error: activityError } = await ongSchema()
    .from("actividades")
    .select("id, id_proyecto, titulo")
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

  const projectIds = uniqueNonEmpty((activityRows ?? []).map((row) => row.id_proyecto));
  if (!projectIds.length) {
    return {
      activities,
      projects: new Map(),
    };
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

  return {
    activities,
    projects,
  };
}

async function loadVolunteerLabels(volunteerIds: string[]): Promise<Map<string, string>> {
  if (!volunteerIds.length) {
    return new Map();
  }

  const volunteers = await fetchVolunteerCatalog().catch(() => []);
  return new Map<string, string>(
    volunteers
      .filter((item) => volunteerIds.includes(item.value))
      .map((item): [string, string] => [item.value, item.label])
  );
}

function mapRow(
  row: AttendanceDbRow,
  lookups: Awaited<ReturnType<typeof loadActivityLookups>>,
  volunteerLabels: Map<string, string>
): OperationAttendanceRow {
  const activity = lookups.activities.get(row.id_actividad);
  const project = activity?.id_proyecto ? lookups.projects.get(activity.id_proyecto) : undefined;
  const status = resolveAttendanceStatus(row);
  const projectName = project
    ? `${project.codigo} - ${project.nombre_proyecto}`
    : "Proyecto no disponible";
  const activityName = activity?.titulo ?? "Actividad no disponible";
  const volunteerName = volunteerLabels.get(row.id_voluntario) ?? row.id_voluntario;
  const observation = sanitizeText(row.observacion, 500);

  return {
    id: row.id,
    volunteerId: row.id_voluntario,
    volunteerName,
    projectId: activity?.id_proyecto ?? null,
    projectName,
    activityId: row.id_actividad,
    activityName,
    dateLabel: toDateLabel(row.fecha_operacion),
    entryLabel: toDateTimeLabel(row.check_in_at),
    exitLabel: toDateTimeLabel(row.check_out_at),
    contextLabel: `${activityName} · ${projectName}`,
    status,
    statusVariant: resolveStatusVariant(status),
    stateCode: row.estado,
    stateLabel: row.estado.replace(/_/g, " "),
    source: row.origen_registro,
    sourceLabel:
      row.origen_registro === "scan"
        ? "QR"
        : row.origen_registro === "manual"
          ? "Manual"
          : "Importado",
    incidenceReason:
      status === "incidence"
        ? row.estado === "justificado"
          ? "Justificado"
          : row.estado === "ausente"
            ? "Ausente"
            : "Incidencia"
        : null,
    observation: observation || "Sin observacion",
    rawDate: row.fecha_operacion,
    rawEntry: row.check_in_at,
    rawExit: row.check_out_at,
    durationMinutes: resolveDurationMinutes(row.check_in_at, row.check_out_at),
    isCorrected: row.origen_registro === "manual",
    canEdit: !row.is_deleted,
    canClose: !row.check_out_at && status === "open",
  };
}

async function listAttendanceRows(
  filters: AttendanceFilters,
  tenantId: string
): Promise<AttendanceDbRow[]> {
  let query = ongSchema()
    .from("asistencias")
    .select(
      "id, tenant_id, id_actividad, id_voluntario, fecha_operacion, check_in_at, check_out_at, origen_registro, estado, observacion, qr_payload, id_card_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, is_deleted"
    )
    .eq("tenant_id", tenantId)
    .eq("is_deleted", false)
    .order("fecha_operacion", { ascending: false })
    .order("check_in_at", { ascending: false })
    .limit(ATTENDANCE_LIMIT);

  if (filters.volunteerId !== "all") {
    query = query.eq("id_voluntario", filters.volunteerId);
  }
  if (filters.activityId !== "all") {
    query = query.eq("id_actividad", filters.activityId);
  }
  if (filters.dateFrom) {
    query = query.gte("fecha_operacion", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("fecha_operacion", filters.dateTo);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AttendanceDbRow[];
}

async function fetchAttendanceRowById(
  attendanceId: string,
  tenantId: string
): Promise<AttendanceDbRow> {
  const { data, error } = await ongSchema()
    .from("asistencias")
    .select(
      "id, tenant_id, id_actividad, id_voluntario, fecha_operacion, check_in_at, check_out_at, origen_registro, estado, observacion, qr_payload, id_card_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, is_deleted"
    )
    .eq("tenant_id", tenantId)
    .eq("id", attendanceId)
    .eq("is_deleted", false)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as AttendanceDbRow[])[0];
  if (!row) {
    throw new Error("La asistencia ya no existe.");
  }

  return row;
}

async function resolveOpenAttendance(
  input: AttendanceExitInput,
  tenantId: string
): Promise<AttendanceDbRow> {
  const attendanceId = sanitizeOptionalId(input.attendanceId);
  if (attendanceId) {
    return fetchAttendanceRowById(attendanceId, tenantId);
  }

  const volunteerId = sanitizeOptionalId(input.volunteerId);
  const activityId = sanitizeOptionalId(input.activityId);
  if (!volunteerId || !activityId) {
    throw new Error("Debes indicar la asistencia, el voluntario y la actividad para registrar la salida.");
  }

  const today = getTodayDateKey();
  const { data, error } = await ongSchema()
    .from("asistencias")
    .select(
      "id, tenant_id, id_actividad, id_voluntario, fecha_operacion, check_in_at, check_out_at, origen_registro, estado, observacion, qr_payload, id_card_id, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by, is_deleted"
    )
    .eq("tenant_id", tenantId)
    .eq("id_voluntario", volunteerId)
    .eq("id_actividad", activityId)
    .eq("fecha_operacion", today)
    .eq("is_deleted", false)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as AttendanceDbRow[])[0];
  if (!row) {
    throw new Error("No se encontro una asistencia abierta para cerrar.");
  }

  return row;
}

export async function listAsistencias(
  filters: AttendanceFilters
): Promise<OperationAttendanceData> {
  try {
    const tenantId = await getRequiredTenantId();
    const warnings = [ATTENDANCE_SCHEMA_WARNING, PROJECT_DERIVED_WARNING];

    const [rowsDb, volunteerOptions, projectOptions, activityCatalog] = await Promise.all([
      listAttendanceRows(filters, tenantId),
      fetchVolunteerCatalog().catch(() => {
        warnings.push("No se pudo cargar el catalogo de voluntarios.");
        return [] as SelectOption[];
      }),
      fetchProjectCatalog().catch(() => {
        warnings.push("No se pudo cargar el catalogo de proyectos.");
        return [] as SelectOption[];
      }),
      fetchActivityCatalog().catch(() => {
        warnings.push("No se pudo cargar el catalogo de actividades.");
        return [] as Array<{ id: string; label: string }>;
      }),
    ]);

    const activityIds = uniqueNonEmpty(rowsDb.map((row) => row.id_actividad));
    const volunteerIds = uniqueNonEmpty(rowsDb.map((row) => row.id_voluntario));

    const [lookups, volunteerLabels] = await Promise.all([
      loadActivityLookups(activityIds),
      loadVolunteerLabels(volunteerIds),
    ]);

    const searchTerm = normalizeText(filters.searchTerm);
    const mappedRows = rowsDb
      .map((row) => mapRow(row, lookups, volunteerLabels))
      .filter((row) => {
        if (filters.projectId !== "all" && row.projectId !== filters.projectId) {
          return false;
        }
        if (filters.status !== "all" && row.status !== filters.status) {
          return false;
        }
        if (!searchTerm) {
          return true;
        }

        return normalizeText(
          [
            row.volunteerName,
            row.projectName,
            row.activityName,
            row.dateLabel,
            row.observation,
            row.incidenceReason,
          ].join(" ")
        ).includes(searchTerm);
      });

    const activityOptions =
      activityCatalog.length > 0
        ? activityCatalog.map((item) => ({ value: item.id, label: item.label }))
        : Array.from(
            new Map<string, string>(
              mappedRows.map((row): [string, string] => [row.activityId ?? "", row.activityName])
            ).entries()
          )
            .filter(([value]) => Boolean(value))
            .map(([value, label]) => ({ value, label }));

    return {
      rows: mappedRows,
      volunteerOptions,
      projectOptions,
      activityOptions,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las asistencias.");
  }
}

export async function getAsistenciaById(attendanceId: string): Promise<OperationAttendanceRow> {
  try {
    const tenantId = await getRequiredTenantId();
    const row = await fetchAttendanceRowById(attendanceId, tenantId);
    const [lookups, volunteerLabels] = await Promise.all([
      loadActivityLookups([row.id_actividad]),
      loadVolunteerLabels([row.id_voluntario]),
    ]);

    return mapRow(row, lookups, volunteerLabels);
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle de la asistencia.");
  }
}

export async function createAsistencia(input: AttendanceRegisterInput): Promise<void> {
  try {
    const tenantId = await getRequiredTenantId();
    const activityId = sanitizeOptionalId(input.activityId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const date = normalizeDateValue(input.date) ?? getTodayDateKey();
    const entryTime = normalizeTimeValue(input.entryTime ?? null);
    const exitTime = normalizeTimeValue(input.exitTime ?? null);

    if (!activityId) {
      throw new Error("La actividad es obligatoria para registrar asistencia.");
    }
    if (!volunteerId) {
      throw new Error("El voluntario es obligatorio para registrar asistencia.");
    }
    if (input.entryTime && !entryTime) {
      throw new Error("La hora de entrada no es valida.");
    }
    if (input.exitTime && !exitTime) {
      throw new Error("La hora de salida no es valida.");
    }

    const entryMinutes = timeToMinutes(entryTime);
    const exitMinutes = timeToMinutes(exitTime);
    if (entryMinutes !== null && exitMinutes !== null && exitMinutes < entryMinutes) {
      throw new Error("La hora de salida no puede ser anterior a la hora de entrada.");
    }

    await ensureActivityExists(activityId, tenantId);

    const now = new Date();
    const actorId = await resolveCurrentUserId();
    const payload = {
      tenant_id: tenantId,
      id_actividad: activityId,
      id_voluntario: volunteerId,
      fecha_operacion: date,
      check_in_at: combineDateAndTime(date, entryTime, now),
      check_out_at: exitTime ? combineDateAndTime(date, exitTime, now) : null,
      origen_registro: "manual" as const,
      estado: "presente" as const,
      observacion: sanitizeText(input.observation, 500),
      created_by: actorId,
      updated_by: actorId,
    };

    const { error } = await ongSchema().from("asistencias").insert(payload);
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la asistencia.");
  }
}

export async function scanAsistenciaByQr(
  input: AttendanceScanInput
): Promise<AttendanceScanResult> {
  try {
    const tenantId = await getRequiredTenantId();
    const activityId = sanitizeOptionalId(input.activityId);
    const qrPayload = sanitizeText(input.qrPayload, 500);
    const scanTime = normalizeDateTimeValue(input.scanTime ?? null);

    if (!activityId) {
      throw new Error("La actividad es obligatoria para registrar asistencia por QR.");
    }
    if (!qrPayload) {
      throw new Error("Debes registrar el payload QR.");
    }

    await ensureActivityExists(activityId, tenantId);
    const card = await resolveScanCredential(qrPayload, tenantId, scanTime);
    const scanDateKey = (scanTime ?? new Date().toISOString()).slice(0, 10);
    const outcome = await resolveScanOutcome(
      tenantId,
      card.id_voluntario,
      activityId,
      scanDateKey
    );

    const { data, error } = await ongSchema().rpc("fn_register_attendance_scan", {
      p_qr_payload: qrPayload,
      p_id_actividad: activityId,
      p_scan_time: scanTime,
    });

    if (error) {
      if (normalizeText(error.message).includes("no autorizado")) {
        throw new Error(
          "No tienes permisos para escanear asistencias. Requiere `attendance.scan` o tenant admin."
        );
      }

      throw new Error(error.message);
    }

    const row = data as AttendanceDbRow | null;
    if (!row) {
      throw new Error("La RPC no devolvio la asistencia registrada.");
    }

    const [lookups, volunteerLabels] = await Promise.all([
      loadActivityLookups([row.id_actividad]),
      loadVolunteerLabels([row.id_voluntario]),
    ]);

    const attendance = mapRow(row, lookups, volunteerLabels);

    return {
      attendance,
      outcome,
      outcomeLabel: outcome === "check-in" ? "Check-in" : "Check-out",
      confirmationTitle:
        outcome === "check-in" ? "Entrada registrada por QR" : "Salida registrada por QR",
      confirmationMessage:
        outcome === "check-in"
          ? `Se registro la entrada de ${attendance.volunteerName} en ${attendance.activityName}.`
          : `Se registro la salida de ${attendance.volunteerName} en ${attendance.activityName}.`,
      cardCode: card.card_code,
      scannedAt: outcome === "check-in" ? attendance.rawEntry : attendance.rawExit,
      scannedAtLabel:
        outcome === "check-in" ? attendance.entryLabel : attendance.exitLabel,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la asistencia por QR.");
  }
}

export async function closeAsistencia(input: AttendanceExitInput): Promise<void> {
  try {
    const tenantId = await getRequiredTenantId();
    const current = await resolveOpenAttendance(input, tenantId);
    const exitTime = normalizeTimeValue(input.exitTime ?? null);
    if (input.exitTime && !exitTime) {
      throw new Error("La hora de salida no es valida.");
    }

    const actorId = await resolveCurrentUserId();
    const exitAt = combineDateAndTime(current.fecha_operacion, exitTime, new Date());
    const observation = appendObservation(current.observacion, input.observation);

    const { error } = await ongSchema()
      .from("asistencias")
      .update({
        check_out_at: exitAt,
        observacion: observation,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("id", current.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la salida de asistencia.");
  }
}

export async function updateAsistencia(input: AttendanceUpdateInput): Promise<void> {
  try {
    const attendanceId = sanitizeOptionalId(input.attendanceId);
    if (!attendanceId) {
      throw new Error("No se encontro la asistencia a actualizar.");
    }

    const tenantId = await getRequiredTenantId();
    const current = await fetchAttendanceRowById(attendanceId, tenantId);
    const activityId =
      input.activityId !== undefined ? sanitizeOptionalId(input.activityId) : current.id_actividad;
    const date =
      input.date !== undefined
        ? normalizeDateValue(input.date) ?? current.fecha_operacion
        : current.fecha_operacion;
    const entryTime =
      input.entryTime !== undefined ? normalizeTimeValue(input.entryTime) : null;
    const exitTime =
      input.exitTime !== undefined ? normalizeTimeValue(input.exitTime) : null;

    if (!activityId) {
      throw new Error("La actividad es obligatoria.");
    }

    await ensureActivityExists(activityId, tenantId);

    const actorId = await resolveCurrentUserId();
    const observation = appendObservation(current.observacion, input.observation);
    const correctionReason = sanitizeText(input.correctionReason, 300);

    const { error } = await ongSchema()
      .from("asistencias")
      .update({
        id_actividad: activityId,
        fecha_operacion: date,
        check_in_at:
          input.entryTime !== undefined
            ? entryTime
              ? combineDateAndTime(date, entryTime, new Date(current.check_in_at ?? current.created_at))
              : null
            : current.check_in_at,
        check_out_at:
          input.exitTime !== undefined
            ? exitTime
              ? combineDateAndTime(date, exitTime, new Date(current.check_out_at ?? current.updated_at))
              : null
            : current.check_out_at,
        observacion: appendObservation(observation, correctionReason),
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("id", attendanceId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la asistencia.");
  }
}

export async function markAsistenciaIncidencia(input: AttendanceIncidenceInput): Promise<void> {
  try {
    const attendanceId = sanitizeOptionalId(input.attendanceId);
    const reason = sanitizeText(input.reason, 300);
    if (!attendanceId) {
      throw new Error("No se encontro la asistencia a marcar.");
    }
    if (!reason) {
      throw new Error("Debes indicar el motivo de la incidencia.");
    }

    const tenantId = await getRequiredTenantId();
    const current = await fetchAttendanceRowById(attendanceId, tenantId);
    const actorId = await resolveCurrentUserId();

    const { error } = await ongSchema()
      .from("asistencias")
      .update({
        estado: "justificado",
        observacion: appendObservation(current.observacion, `Incidencia: ${reason}`),
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("id", attendanceId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la incidencia.");
  }
}

export async function removeAsistencia(
  attendanceId: string
): Promise<void> {
  try {
    const id = sanitizeOptionalId(attendanceId);
    if (!id) {
      throw new Error("No se encontro la asistencia a eliminar.");
    }

    const tenantId = await getRequiredTenantId();
    const actorId = await resolveCurrentUserId();

    const { error } = await ongSchema()
      .from("asistencias")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: actorId,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar logicamente la asistencia.");
  }
}
