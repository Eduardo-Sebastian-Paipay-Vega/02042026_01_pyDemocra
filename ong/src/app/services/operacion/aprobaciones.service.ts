import type {
  ApprovalCreateInput,
  ApprovalResolveInput,
  ApprovalStatusKind,
  OperationApprovalDetail,
  OperationApprovalRow,
  OperationApprovalsData,
  OperationHoursRow,
} from "../../modules/operation/types";
import {
  getHorasById,
  listHoras,
  requestHoursApproval,
  resolveHoras,
} from "./horas.service";
import {
  getRequiredTenantId,
  mapApprovalStatusKind,
  mapApprovalVariant,
  normalizeText,
  ongSchema,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
} from "./shared";
import { createInAppNotification } from "../notificaciones/create.service";

export const HOURS_APPROVAL_ENTITY = "horas_actividad";
export const EVIDENCE_APPROVAL_ENTITY = "evidencias_actividad";

const APPROVALS_LIMIT = 500;
const APPROVALS_SCOPE_WARNING =
  "La bandeja lee `ong.aprobaciones` como fuente unica. Las entidades `horas_actividad` y `evidencias_actividad` enriquecen el contexto cuando estan disponibles.";

interface ApprovalListFilters {
  entityType?: string | null;
  entityId?: string | null;
  statusKind?: "all" | ApprovalStatusKind;
  requestedById?: string | null;
  approvedById?: string | null;
  searchTerm?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page?: number;
  pageSize?: number;
}

type ApprovalDbRow = {
  id: string;
  modulo: string;
  entidad_schema: string;
  entidad_tabla: string;
  entidad_id: string;
  tipo_aprobacion: string;
  estado: string;
  comentario: string | null;
  solicitado_por: string | null;
  resuelto_por: string | null;
  requested_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

function normalizePage(value: number | null | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function normalizePageSize(value: number | null | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return 20;
  }

  return Math.min(100, Math.floor(value));
}

function mapApprovalStateId(kind: ApprovalStatusKind): number {
  if (kind === "approved") {
    return 2;
  }
  if (kind === "rejected") {
    return 3;
  }
  return 1;
}

function buildApprovalDateStart(date: string | null | undefined): string | null {
  const safeDate = sanitizeText(date, 20);
  return safeDate ? `${safeDate}T00:00:00` : null;
}

function buildApprovalDateEnd(date: string | null | undefined): string | null {
  const safeDate = sanitizeText(date, 20);
  return safeDate ? `${safeDate}T23:59:59.999` : null;
}

function mapApprovalStatusFilter(kind: ApprovalStatusKind | "all" | undefined): string | null {
  if (!kind || kind === "all") {
    return null;
  }
  if (kind === "approved") {
    return "aprobada";
  }
  if (kind === "rejected") {
    return "rechazada";
  }
  if (kind === "pending") {
    return "pendiente";
  }

  return "__unsupported__";
}

async function listApprovalRows(
  tenantId: string,
  filters: ApprovalListFilters
): Promise<ApprovalDbRow[]> {
  const entityId = sanitizeOptionalId(filters.entityId ?? null);
  const approvedById = sanitizeOptionalId(filters.approvedById ?? null);
  const stateFilter = mapApprovalStatusFilter(filters.statusKind);

  if (stateFilter === "__unsupported__") {
    return [];
  }

  const entityTableFilter = sanitizeText(filters.entityType ?? null, 80);

  let query = ongSchema()
    .from("aprobaciones")
    .select(
      "id, modulo, entidad_schema, entidad_tabla, entidad_id, tipo_aprobacion, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("entidad_schema", "ong")
    .order("requested_at", { ascending: false })
    .limit(APPROVALS_LIMIT);

  if (entityTableFilter && entityTableFilter !== "all") {
    query = query.eq("entidad_tabla", entityTableFilter);
  }

  if (entityId) {
    query = query.eq("entidad_id", entityId);
  }
  if (stateFilter) {
    query = query.eq("estado", stateFilter);
  }
  if (approvedById) {
    query = query.eq("resuelto_por", approvedById);
  }

  const dateFrom = buildApprovalDateStart(filters.dateFrom);
  const dateTo = buildApprovalDateEnd(filters.dateTo);
  if (dateFrom) {
    query = query.gte("requested_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("requested_at", dateTo);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ApprovalDbRow[];
}

async function getApprovalById(
  tenantId: string,
  approvalId: string
): Promise<ApprovalDbRow> {
  const { data, error } = await ongSchema()
    .from("aprobaciones")
    .select(
      "id, modulo, entidad_schema, entidad_tabla, entidad_id, tipo_aprobacion, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", approvalId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? []) as ApprovalDbRow[])[0];
  if (!row) {
    throw new Error("La aprobacion ya no existe.");
  }

  return row;
}

async function getLatestApprovalForEntity(
  tenantId: string,
  entityId: string,
  entityTable: string = HOURS_APPROVAL_ENTITY
): Promise<ApprovalDbRow | null> {
  const { data, error } = await ongSchema()
    .from("aprobaciones")
    .select(
      "id, modulo, entidad_schema, entidad_tabla, entidad_id, tipo_aprobacion, estado, comentario, solicitado_por, resuelto_por, requested_at, resolved_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("entidad_schema", "ong")
    .eq("entidad_tabla", entityTable)
    .eq("entidad_id", entityId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ApprovalDbRow[])[0] ?? null;
}

async function loadHoursContext(): Promise<{
  byHoursId: Map<string, OperationHoursRow>;
  volunteerOptions: OperationApprovalsData["volunteerOptions"];
  approvalStates: OperationApprovalsData["approvalStates"];
  warnings: string[];
}> {
  const hours = await listHoras(
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

  return {
    byHoursId: new Map<string, OperationHoursRow>(
      hours.rows.map((row): [string, OperationHoursRow] => [row.id, row])
    ),
    volunteerOptions: hours.volunteerOptions,
    approvalStates: hours.approvalStates,
    warnings: hours.warnings,
  };
}

function mapApprovalRow(
  approval: ApprovalDbRow,
  linkedHours: OperationHoursRow | null,
  profileLabels: Map<string, string>
): OperationApprovalRow {
  const statusKind = mapApprovalStatusKind(approval.estado);
  const requestedBy =
    (approval.solicitado_por ? profileLabels.get(approval.solicitado_por) : null) ??
    linkedHours?.requestedBy ??
    (approval.solicitado_por || "-");
  const approvedBy =
    (approval.resuelto_por ? profileLabels.get(approval.resuelto_por) : null) ??
    linkedHours?.approvedBy ??
    (approval.resuelto_por || "-");

  return {
    id: approval.id,
    module: approval.modulo,
    entitySchema: approval.entidad_schema,
    entityTable: approval.entidad_tabla,
    entityType: approval.entidad_tabla,
    entityId: approval.entidad_id,
    entityTitle: linkedHours?.activityName ?? buildEntityTitle(approval),
    entitySubtitle: linkedHours?.projectName ?? approval.entidad_id,
    subjectId: linkedHours?.volunteerId ?? null,
    subjectName: linkedHours?.volunteerName ?? "-",
    contextDate: linkedHours?.date ?? "-",
    contextMeta: linkedHours
      ? `${linkedHours.hours}h (${linkedHours.minutes} min)`
      : approval.tipo_aprobacion,
    statusId: mapApprovalStateId(statusKind),
    statusName: approval.estado.replace(/_/g, " "),
    statusKind,
    statusVariant: mapApprovalVariant(statusKind),
    requestedById: approval.solicitado_por,
    requestedBy,
    requestedAt:
      linkedHours?.requestedAt ??
      toDateTimeLabel(approval.requested_at ?? approval.created_at),
    approvedById: approval.resuelto_por,
    approvedBy,
    approvedAt:
      linkedHours?.approvedAt ??
      (approval.resuelto_por
        ? toDateTimeLabel(approval.resolved_at ?? approval.updated_at)
        : "-"),
    comment: sanitizeText(approval.comentario, 500),
  };
}

function buildEntityTitle(approval: ApprovalDbRow): string {
  if (approval.tipo_aprobacion === "evidencia") return "Evidencia de actividad";
  if (approval.tipo_aprobacion === "hora") return "Registro de horas";
  if (approval.tipo_aprobacion === "admision") return "Solicitud de admision";
  if (approval.tipo_aprobacion === "finanza") return "Transaccion financiera";
  return "Solicitud de aprobacion";
}

function buildMissingContext(approval: ApprovalDbRow) {
  return {
    kind: "generic" as const,
    title: "Contexto de horas no disponible",
    summary:
      "La aprobacion existe en `ong.aprobaciones`, pero no se encontro el registro vinculado en `ong.horas_actividad` para enriquecer el detalle.",
    missing: true,
    fields: [
      { label: "Modulo", value: approval.modulo || "-" },
      { label: "Schema", value: approval.entidad_schema || "-" },
      { label: "Tabla", value: approval.entidad_tabla || "-" },
      { label: "Entidad", value: approval.entidad_id || "-" },
      { label: "Estado", value: approval.estado || "-" },
      { label: "Comentario", value: sanitizeText(approval.comentario, 500) || "-" },
    ],
  };
}

function mapHoursRowToContext(row: OperationHoursRow) {
  return {
    kind: "hours" as const,
    title: `${row.activityName} · ${row.volunteerName}`,
    summary: `Registro de ${row.hours}h para ${row.projectName}.`,
    missing: false,
    fields: [
      { label: "Voluntario", value: row.volunteerName },
      { label: "Actividad", value: row.activityName },
      { label: "Proyecto", value: row.projectName },
      { label: "Fecha", value: row.date },
      { label: "Duracion", value: `${row.hours}h (${row.minutes} min)` },
      { label: "Estado", value: row.statusName },
      { label: "Solicitado por", value: row.requestedBy },
      { label: "Resuelto por", value: row.approvedBy },
      { label: "Comentario resolucion", value: row.observation || "-" },
    ],
  };
}

export async function listAprobaciones(
  filters: ApprovalListFilters = {}
): Promise<OperationApprovalsData> {
  try {
    const warnings = [APPROVALS_SCOPE_WARNING];
    const tenantId = await getRequiredTenantId();
    const approvalRows = await listApprovalRows(tenantId, filters);
    const hoursContext = await loadHoursContext();
    warnings.push(...hoursContext.warnings);

    const profileIds = Array.from(
      new Set(
        approvalRows
          .flatMap((row) => [row.solicitado_por, row.resuelto_por])
          .filter((value): value is string => Boolean(value))
      )
    );
    const profileLabels = await resolveProfileLabels(profileIds).catch(
      () => new Map<string, string>()
    );
    const volunteerFilter = sanitizeOptionalId(filters.requestedById ?? null);
    const searchTerm = normalizeText(filters.searchTerm ?? "");
    const mappedRows = approvalRows
      .map((approval) =>
        mapApprovalRow(approval, hoursContext.byHoursId.get(approval.entidad_id) ?? null, profileLabels)
      )
      .filter((row) => {
        if (volunteerFilter && row.subjectId !== volunteerFilter) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        return normalizeText(
          [
            row.subjectName,
            row.entityTitle,
            row.entitySubtitle,
            row.entityId,
            row.statusName,
            row.comment,
            row.requestedBy,
            row.approvedBy,
            row.contextDate,
            row.contextMeta,
          ].join(" ")
        ).includes(searchTerm);
      });

    const page = normalizePage(filters.page);
    const pageSize = normalizePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;

    return {
      rows: mappedRows.slice(from, from + pageSize),
      total: mappedRows.length,
      page,
      pageSize,
      volunteerOptions: hoursContext.volunteerOptions,
      approvalStates: hoursContext.approvalStates,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar la bandeja de aprobaciones.");
  }
}

export async function getAprobacionDetail(
  approvalId: string
): Promise<OperationApprovalDetail> {
  try {
    const tenantId = await getRequiredTenantId();
    const approval = await getApprovalById(tenantId, approvalId);
    const linkedHours =
      approval.entidad_schema === "ong" && approval.entidad_tabla === HOURS_APPROVAL_ENTITY
        ? await getHorasById(approval.entidad_id).catch(() => null)
        : null;
    const profileIds = [approval.solicitado_por, approval.resuelto_por].filter(
      (value): value is string => Boolean(value)
    );
    const profileLabels = await resolveProfileLabels(profileIds).catch(
      () => new Map<string, string>()
    );

    return {
      approval: mapApprovalRow(approval, linkedHours, profileLabels),
      context: linkedHours ? mapHoursRowToContext(linkedHours) : buildMissingContext(approval),
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle de la aprobacion.");
  }
}

export async function createAprobacion(
  input: ApprovalCreateInput
): Promise<OperationApprovalRow> {
  try {
    if (input.entityType !== HOURS_APPROVAL_ENTITY) {
      throw new Error(
        `Solo se pueden solicitar aprobaciones para ${HOURS_APPROVAL_ENTITY} con la integracion actual.`
      );
    }

    const tenantId = await getRequiredTenantId();
    const hoursId = sanitizeOptionalId(input.entityId);
    if (!hoursId) {
      throw new Error("Debes indicar un registro real de horas.");
    }

    const target = await getHorasById(hoursId);
    const currentApproval = await getLatestApprovalForEntity(tenantId, target.id);
    if (currentApproval?.estado === "pendiente") {
      const profileIds = [currentApproval.solicitado_por, currentApproval.resuelto_por].filter(
        (value): value is string => Boolean(value)
      );
      const profileLabels = await resolveProfileLabels(profileIds).catch(
        () => new Map<string, string>()
      );
      return mapApprovalRow(currentApproval, target, profileLabels);
    }

    await requestHoursApproval({
      hoursId: target.id,
      requesterId: input.requestedBy ?? null,
      comment: input.comment,
    });

    const refreshedApproval = await getLatestApprovalForEntity(tenantId, target.id);
    if (!refreshedApproval) {
      throw new Error("No se pudo sincronizar la aprobacion en ong.aprobaciones.");
    }

    const refreshedHours = await getHorasById(target.id).catch(() => target);
    const profileIds = [refreshedApproval.solicitado_por, refreshedApproval.resuelto_por].filter(
      (value): value is string => Boolean(value)
    );
    const profileLabels = await resolveProfileLabels(profileIds).catch(
      () => new Map<string, string>()
    );

    return mapApprovalRow(refreshedApproval, refreshedHours, profileLabels);
  } catch (error) {
    throw toOperationError(error, "No se pudo solicitar la aprobacion.");
  }
}

function mapTargetStateIdToEstado(
  targetStateId: number
): "aprobada" | "rechazada" | "pendiente" {
  if (targetStateId === 2) return "aprobada";
  if (targetStateId === 3) return "rechazada";
  return "pendiente";
}

export async function resolveAprobacion(
  input: ApprovalResolveInput
): Promise<OperationApprovalRow> {
  try {
    const tenantId = await getRequiredTenantId();
    const approvalId = sanitizeOptionalId(input.approvalId);
    if (!approvalId) {
      throw new Error("No se encontro la aprobacion a resolver.");
    }

    const currentApproval = await getApprovalById(tenantId, approvalId);

    if (
      currentApproval.entidad_schema !== "ong" ||
      (currentApproval.entidad_tabla !== HOURS_APPROVAL_ENTITY &&
        currentApproval.entidad_tabla !== EVIDENCE_APPROVAL_ENTITY)
    ) {
      throw new Error(
        `Tipo de entidad '${currentApproval.entidad_tabla}' no tiene flujo de resolucion implementado.`
      );
    }

    if (currentApproval.entidad_tabla === HOURS_APPROVAL_ENTITY) {
      await resolveHoras({
        hoursId: currentApproval.entidad_id,
        targetStateId: input.targetStateId,
        reviewerId: input.reviewerId,
        comment: input.comment,
      });
    } else {
      const estado = mapTargetStateIdToEstado(input.targetStateId);
      const actorId = sanitizeOptionalId(input.reviewerId ?? null);
      const nowIso = new Date().toISOString();
      const comment = sanitizeText(input.comment, 500);
      const { error: updateError } = await ongSchema()
        .from("aprobaciones")
        .update({
          estado,
          resuelto_por: actorId,
          resolved_at: nowIso,
          comentario: comment,
          updated_at: nowIso,
        })
        .eq("tenant_id", tenantId)
        .eq("id", approvalId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      if ((estado === "aprobada" || estado === "rechazada") && currentApproval.solicitado_por) {
        const estadoLabel = estado === "aprobada" ? "aprobada" : "rechazada";
        await createInAppNotification({
          tenantId,
          recipientId: currentApproval.solicitado_por,
          titulo: `Evidencia ${estadoLabel}`,
          mensaje: comment
            ? `Tu evidencia fue ${estadoLabel}. Comentario: ${comment}`
            : `Tu evidencia fue ${estadoLabel}.`,
          actorId,
        }).catch(() => undefined);
      }
    }

    const refreshedApproval =
      (await getApprovalById(tenantId, approvalId).catch(() => null)) ??
      (await getLatestApprovalForEntity(tenantId, currentApproval.entidad_id, currentApproval.entidad_tabla));
    if (!refreshedApproval) {
      throw new Error("No se pudo recargar la aprobacion luego de resolverla.");
    }

    const linkedHours =
      currentApproval.entidad_tabla === HOURS_APPROVAL_ENTITY
        ? await getHorasById(currentApproval.entidad_id).catch(() => null)
        : null;
    const profileIds = [refreshedApproval.solicitado_por, refreshedApproval.resuelto_por].filter(
      (value): value is string => Boolean(value)
    );
    const profileLabels = await resolveProfileLabels(profileIds).catch(
      () => new Map<string, string>()
    );

    return mapApprovalRow(refreshedApproval, linkedHours, profileLabels);
  } catch (error) {
    throw toOperationError(error, "No se pudo resolver la aprobacion.");
  }
}

export async function trySyncApprovalForEntity(): Promise<boolean> {
  return true;
}
