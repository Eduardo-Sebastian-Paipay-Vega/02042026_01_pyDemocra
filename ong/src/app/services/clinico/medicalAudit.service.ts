/**
 * Medical audit trail service.
 *
 * Responsibilities:
 *   1. Log VIEW / EDIT / DELETE events on sensitive medical records.
 *   2. Enforce data masking — logs field NAMES that changed, never field VALUES
 *      (diagnoses, medications, etc. must not appear in the audit trail).
 *   3. Gate read access to audit history behind the RBAC permission
 *      "medical_audit_viewer".
 *
 * Storage:
 *   - VIEW events → clinico.accesos_sensibles_log (already exists)
 *   - EDIT / DELETE events → auditoria.audit_log (schema-level table)
 *     The `before_json` / `after_json` columns are set to NULL here;
 *     we store only a masked `source` string listing changed field names.
 *
 * RBAC:
 *   checkMedicalAuditViewerPermission() must succeed before any history
 *   query is returned to the caller.
 */

import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import { clinicoSchema, getRequiredTenantId, toFriendlyError } from "../personas/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MedicalAuditAction = "VIEW" | "EDIT" | "DELETE";

/** Which type of record was accessed. */
export type MedicalRecordKind =
  | "ficha_medica"           // beneficiary medical record
  | "ficha_sensible_voluntario"; // volunteer sensitive record

export interface LogMedicalAccessParams {
  /** UUID of the medical record being accessed. */
  recordId: string;
  kind: MedicalRecordKind;
  action: MedicalAuditAction;
  /** Human reason provided by the user (required for sensitive access flows). */
  reason?: string;
  /** IP address of the requester, if available (e.g. from request headers). */
  ipAddress?: string;
  /** User-Agent of the requester's browser. */
  userAgent?: string;
  /**
   * For EDIT events: names of the top-level object fields that changed.
   * Values must NOT be included — only field name strings.
   * @example ["diagnostico", "medicamentos"]
   */
  changedFields?: string[];
}

export interface MedicalAuditEventRow {
  id: string;
  tenantId: string;
  recordId: string;
  kind: MedicalRecordKind;
  action: MedicalAuditAction;
  actorId: string | null;
  reason: string | null;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  eventAt: string;
}

export interface MedicalAuditHistoryResult {
  events: MedicalAuditEventRow[];
  totalCount: number;
}

export interface MedicalAuditFilters {
  recordId?: string;
  kind?: MedicalRecordKind;
  action?: MedicalAuditAction;
  actorId?: string;
  /** ISO date strings for range filtering. */
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Columns whose values are considered sensitive — strip from any logged data. */
const SENSITIVE_COLUMNS = new Set([
  "diagnostico",
  "tratamiento",
  "medicamentos",
  "observaciones",
  "alergias",
  "antecedentes",
  "grupo_sanguineo",
  "tipo_sangre",
  "discapacidad",
  "condicion_especial",
  "nota_medica",
  "historial",
]);

/**
 * Filter a list of field names to remove any that appear in SENSITIVE_COLUMNS.
 * This ensures that even if a caller accidentally passes sensitive field names,
 * they are stripped before being written to the audit log.
 */
function maskFieldNames(fields: string[]): string[] {
  return fields.filter((f) => !SENSITIVE_COLUMNS.has(f.toLowerCase()));
}

/**
 * Build the `source` string used in auditoria.audit_log to carry masked metadata.
 * Format: "medical_audit:EDIT:ficha_medica:[campo1,campo2]"
 */
function buildAuditSource(
  action: MedicalAuditAction,
  kind: MedicalRecordKind,
  maskedFields: string[]
): string {
  const fields = maskedFields.length > 0 ? `[${maskedFields.join(",")}]` : "[]";
  return `medical_audit:${action}:${kind}:${fields}`;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── RBAC gate ────────────────────────────────────────────────────────────────

/**
 * Check whether the current user has the "medical_audit_viewer" permission.
 *
 * Uses the public.fn_has_permission RPC which checks ong.permisos_usuario
 * for the current authenticated user.
 *
 * Throws a user-friendly error if the permission is absent or the call fails.
 */
export async function checkMedicalAuditViewerPermission(): Promise<void> {
  const { data, error } = await supabase.rpc("fn_has_permission", {
    p_permission: "medical_audit_viewer",
  });

  if (error) {
    throw new Error(
      toFriendlyError(error, "Error al verificar permisos de auditoría médica.")
    );
  }

  if (!data) {
    throw new Error(
      "Acceso denegado: se requiere el permiso 'medical_audit_viewer' para ver el historial de auditoría médica."
    );
  }
}

// ─── Log access ───────────────────────────────────────────────────────────────

/**
 * Log a medical record access event.
 *
 * - VIEW events are written to clinico.accesos_sensibles_log (or
 *   clinico.accesos_sensibles_voluntario_log for volunteer records).
 * - EDIT / DELETE events are written to auditoria.audit_log with masked
 *   field names in the `source` column; before_json / after_json are null.
 *
 * This function is fire-and-forget safe — it swallows errors to avoid
 * blocking the primary user operation.  The caller can await it if auditability
 * is strictly required.
 */
export async function logMedicalAccess(params: LogMedicalAccessParams): Promise<void> {
  try {
    const [tenantId, userId] = await Promise.all([
      getRequiredTenantId(),
      getCurrentUserId(),
    ]);

    if (!userId) return; // Unauthenticated — nothing to log

    if (params.action === "VIEW") {
      await logViewEvent(tenantId, userId, params);
    } else {
      await logMutationEvent(tenantId, userId, params);
    }
  } catch {
    // Audit failure must not surface to the user
  }
}

async function logViewEvent(
  tenantId: string,
  userId: string,
  params: LogMedicalAccessParams
): Promise<void> {
  if (params.kind === "ficha_sensible_voluntario") {
    await clinicoSchema()
      .from("accesos_sensibles_voluntario_log")
      .insert({
        tenant_id: tenantId,
        id_ficha_voluntario: params.recordId,
        usuario_id: userId,
        motivo: params.reason ?? "Consulta",
        ip: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null,
        fecha_acceso: new Date().toISOString(),
      });
  } else {
    await clinicoSchema()
      .from("accesos_sensibles_log")
      .insert({
        tenant_id: tenantId,
        id_ficha: params.recordId,
        usuario_id: userId,
        motivo: params.reason ?? "Consulta",
        fecha_acceso: new Date().toISOString(),
      });
  }
}

async function logMutationEvent(
  tenantId: string,
  userId: string,
  params: LogMedicalAccessParams
): Promise<void> {
  const maskedFields = maskFieldNames(params.changedFields ?? []);
  const source = buildAuditSource(params.action, params.kind, maskedFields);
  const tableName =
    params.kind === "ficha_sensible_voluntario"
      ? "clinico.ficha_sensible_voluntario"
      : "clinico.fichas_medicas";

  await supabase.schema("auditoria").from("audit_log").insert({
    tenant_id: tenantId,
    table_name: tableName,
    record_pk: params.recordId,
    action: params.action as "INSERT" | "UPDATE" | "DELETE",
    before_json: null,
    after_json: null,
    auth_user_id: userId,
    event_at: new Date().toISOString(),
    ip: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
    correlation_id: null,
    source,
  });
}

// ─── Read history (RBAC gated) ────────────────────────────────────────────────

/**
 * Fetch the medical audit history for a specific record or actor.
 *
 * Access is gated by checkMedicalAuditViewerPermission() — this function
 * will throw if the current user lacks the permission.
 *
 * Results merge VIEW events from clinico.accesos_sensibles_log and
 * EDIT/DELETE events from auditoria.audit_log.
 */
export async function getMedicalAuditHistory(
  filters: MedicalAuditFilters
): Promise<MedicalAuditHistoryResult> {
  await checkMedicalAuditViewerPermission();

  const [tenantId, viewEvents, mutationEvents] = await Promise.all([
    getRequiredTenantId(),
    fetchViewEvents(filters),
    fetchMutationEvents(filters),
  ]);

  // Merge and sort by eventAt descending
  const allEvents: MedicalAuditEventRow[] = [...viewEvents, ...mutationEvents].sort(
    (a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()
  );

  const limit = Math.min(filters.limit ?? 100, 300);
  const offset = filters.offset ?? 0;
  const paginated = allEvents.slice(offset, offset + limit);

  void tenantId; // Used for scope — actual filtering is done by RLS + queries below

  return {
    events: paginated,
    totalCount: allEvents.length,
  };
}

type ViewLogRow = AppDatabase["clinico"]["Tables"]["accesos_sensibles_log"]["Row"];
type VolunteerViewLogRow =
  AppDatabase["clinico"]["Tables"]["accesos_sensibles_voluntario_log"]["Row"];
type AuditLogRow = AppDatabase["auditoria"]["Tables"]["audit_log"]["Row"];

async function fetchViewEvents(
  filters: MedicalAuditFilters
): Promise<MedicalAuditEventRow[]> {
  // Skip if filtering by action=EDIT or action=DELETE
  if (filters.action && filters.action !== "VIEW") return [];

  const rows: MedicalAuditEventRow[] = [];

  // Beneficiary medical record views
  if (!filters.kind || filters.kind === "ficha_medica") {
    let query = clinicoSchema()
      .from("accesos_sensibles_log")
      .select("*")
      .order("fecha_acceso", { ascending: false })
      .limit(300);

    if (filters.recordId) query = query.eq("id_ficha", filters.recordId);
    if (filters.actorId) query = query.eq("usuario_id", filters.actorId);
    if (filters.from) query = query.gte("fecha_acceso", filters.from);
    if (filters.to) query = query.lte("fecha_acceso", filters.to);

    const { data } = await query;
    for (const row of (data ?? []) as ViewLogRow[]) {
      rows.push({
        id: row.id,
        tenantId: row.tenant_id,
        recordId: row.id_ficha,
        kind: "ficha_medica",
        action: "VIEW",
        actorId: row.usuario_id,
        reason: row.motivo ?? null,
        changedFields: null,
        ipAddress: null,
        userAgent: null,
        eventAt: row.fecha_acceso ?? row.created_at,
      });
    }
  }

  // Volunteer sensitive record views
  if (!filters.kind || filters.kind === "ficha_sensible_voluntario") {
    let query = clinicoSchema()
      .from("accesos_sensibles_voluntario_log")
      .select("*")
      .order("fecha_acceso", { ascending: false })
      .limit(300);

    if (filters.recordId) query = query.eq("id_ficha_voluntario", filters.recordId);
    if (filters.actorId) query = query.eq("usuario_id", filters.actorId);
    if (filters.from) query = query.gte("fecha_acceso", filters.from);
    if (filters.to) query = query.lte("fecha_acceso", filters.to);

    const { data } = await query;
    for (const row of (data ?? []) as VolunteerViewLogRow[]) {
      rows.push({
        id: row.id,
        tenantId: row.tenant_id,
        recordId: row.id_ficha_voluntario,
        kind: "ficha_sensible_voluntario",
        action: "VIEW",
        actorId: row.usuario_id,
        reason: row.motivo ?? null,
        changedFields: null,
        ipAddress: row.ip ?? null,
        userAgent: row.user_agent ?? null,
        eventAt: row.fecha_acceso,
      });
    }
  }

  return rows;
}

async function fetchMutationEvents(
  filters: MedicalAuditFilters
): Promise<MedicalAuditEventRow[]> {
  // Skip if filtering by action=VIEW
  if (filters.action === "VIEW") return [];

  const medicalTables = new Set([
    "clinico.fichas_medicas",
    "clinico.ficha_sensible_voluntario",
  ]);

  let query = supabase
    .schema("auditoria")
    .from("audit_log")
    .select("*")
    .in("table_name", [...medicalTables])
    .like("source", "medical_audit:%")
    .order("event_at", { ascending: false })
    .limit(300);

  if (filters.recordId) query = query.eq("record_pk", filters.recordId);
  if (filters.actorId) query = query.eq("auth_user_id", filters.actorId);
  if (filters.action) {
    query = query.like("source", `medical_audit:${filters.action}:%`);
  }
  if (filters.from) query = query.gte("event_at", filters.from);
  if (filters.to) query = query.lte("event_at", filters.to);

  const { data } = await query;
  const rows: MedicalAuditEventRow[] = [];

  for (const row of (data ?? []) as AuditLogRow[]) {
    // Parse source: "medical_audit:EDIT:ficha_medica:[campo1,campo2]"
    const parts = row.source.split(":");
    const action = (parts[1] ?? "EDIT") as MedicalAuditAction;
    const kind = (parts[2] ?? "ficha_medica") as MedicalRecordKind;
    const fieldsStr = parts[3] ?? "[]";
    const changedFields = fieldsStr
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    // Apply kind filter
    if (filters.kind && kind !== filters.kind) continue;

    rows.push({
      id: row.id_audit,
      tenantId: row.tenant_id,
      recordId: row.record_pk ?? "",
      kind,
      action,
      actorId: row.auth_user_id ?? null,
      reason: null,
      changedFields: changedFields.length > 0 ? changedFields : null,
      ipAddress: row.ip ?? null,
      userAgent: row.user_agent ?? null,
      eventAt: row.event_at,
    });
  }

  return rows;
}
