import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  GovernanceAuditData,
  GovernanceAuditEvent,
  GovernanceAuditFilters,
  GovernanceSelectOption,
} from "../../modules/governance/types";
import {
  auditoriaSchema,
  getRequiredTenantId,
  normalizeDateValue,
  publicSchema,
  resolveGovernanceCapabilities,
  resolveProfileLabels,
  sanitizeSearchTerm,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type PublicAuditRow = AppDatabase["public"]["Tables"]["audit_logs"]["Row"];
type LegacyAuditRow = AppDatabase["auditoria"]["Tables"]["audit_log"]["Row"];

const DEFAULT_LIMIT = 150;
const MAX_LIMIT = 300;

function resolveLimit(limit: number | undefined): number {
  if (!limit || Number.isNaN(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.floor(limit));
}

function matchesSearch(row: GovernanceAuditEvent, searchTerm: string): boolean {
  if (!searchTerm) {
    return true;
  }

  const normalized = searchTerm.toLowerCase();
  return [
    row.schemaName,
    row.tableName,
    row.operation,
    row.actorLabel,
    row.recordPk ?? "",
    row.sourceLabel,
    row.summary,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function toPublicAuditEvent(row: any): GovernanceAuditEvent {
  return {
    id: row.id,
    source: "public.audit_logs",
    schemaName: "public",
    tableName: row.resource_name || "unknown",
    operation: row.event_type || "UNKNOWN",
    recordPk: null,
    actorId: row.actor_id,
    actorLabel: row.actor_id ?? "Sistema",
    occurredAt: row.created_at,
    occurredAtLabel: toDateTimeLabel(row.created_at),
    summary: `${row.resource_name} ${row.event_type}`,
    sourceLabel: "public.audit_logs",
    ip: row.ip || null,
    userAgent: row.user_agent || null,
    correlationId: null,
    oldData: row.payload_before,
    newData: row.payload_after,
  };
}

function toLegacyAuditEvent(row: LegacyAuditRow): GovernanceAuditEvent {
  return {
    id: row.id_audit,
    source: "auditoria.audit_log",
    schemaName: "auditoria",
    tableName: row.table_name,
    operation: row.action,
    recordPk: row.record_pk,
    actorId: row.auth_user_id,
    actorLabel: row.auth_user_id ?? "Sistema",
    occurredAt: row.event_at,
    occurredAtLabel: toDateTimeLabel(row.event_at),
    summary: `${row.table_name} ${row.action}`,
    sourceLabel: "auditoria.audit_log",
    ip: row.ip,
    userAgent: row.user_agent,
    correlationId: row.correlation_id,
    oldData: row.before_json,
    newData: row.after_json,
  };
}

async function fetchPublicAuditRows(filters: GovernanceAuditFilters): Promise<GovernanceAuditEvent[]> {
  const tenantId = await getRequiredTenantId();
  const limit = resolveLimit(filters.limit);
  const dateFrom = normalizeDateValue(filters.dateFrom);
  const dateTo = normalizeDateValue(filters.dateTo);

  let query = publicSchema()
    .from("audit_logs")
    .select(
      "id, tenant_id, actor_id, event_type, resource_name, payload_before, payload_after, ip, user_agent, retention_until, created_at"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.schemaName !== "all" && filters.schemaName !== "public") {
    return [];
  }
  if (filters.tableName !== "all") {
    query = query.ilike("resource_name", `%${filters.tableName}%`);
  }
  if (filters.operation !== "all") {
    query = query.eq("event_type", filters.operation);
  }
  if (filters.actorId !== "all") {
    query = query.eq("actor_id", filters.actorId);
  }
  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as any[]).map(toPublicAuditEvent);
}

async function fetchLegacyAuditRows(filters: GovernanceAuditFilters): Promise<GovernanceAuditEvent[]> {
  if (filters.schemaName !== "all" && filters.schemaName !== "auditoria") {
    return [];
  }

  const tenantId = await getRequiredTenantId();
  const limit = resolveLimit(filters.limit);
  const dateFrom = normalizeDateValue(filters.dateFrom);
  const dateTo = normalizeDateValue(filters.dateTo);

  let query = auditoriaSchema()
    .from("audit_log")
    .select(
      "id_audit, tenant_id, table_name, action, record_pk, before_json, after_json, auth_user_id, event_at, ip, user_agent, correlation_id, source"
    )
    .eq("tenant_id", tenantId)
    .order("event_at", { ascending: false })
    .limit(limit);

  if (filters.tableName !== "all") {
    query = query.eq("table_name", filters.tableName);
  }
  if (filters.operation !== "all") {
    query = query.eq("action", filters.operation as "INSERT" | "UPDATE" | "DELETE");
  }
  if (filters.actorId !== "all") {
    query = query.eq("auth_user_id", filters.actorId);
  }
  if (dateFrom) {
    query = query.gte("event_at", `${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    query = query.lte("event_at", `${dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LegacyAuditRow[]).map(toLegacyAuditEvent);
}

function buildSelectOptions(values: string[], allLabel: string): GovernanceSelectOption[] {
  return [{ value: "all", label: allLabel }].concat(
    values.map((value) => ({
      value,
      label: value,
    }))
  );
}

export async function listGovernanceAuditEvents(
  filters: GovernanceAuditFilters
): Promise<GovernanceAuditData> {
  const access = await resolveGovernanceCapabilities();
  if (!access.canReadAudit) {
    return {
      access,
      rows: [],
      schemaOptions: [{ value: "all", label: "Esquema: Todos" }],
      tableOptions: [{ value: "all", label: "Tabla: Todas" }],
      actorOptions: [{ value: "all", label: "Actor: Todos" }],
      warnings: access.warnings,
    };
  }

  const searchTerm = sanitizeSearchTerm(filters.searchTerm).toLowerCase();

  try {
    const warnings = access.warnings.slice();
    const [publicResult, legacyResult, tenantId] = await Promise.all([
      fetchPublicAuditRows(filters).then(
        (rows) => ({ rows, error: null as string | null })
      ).catch((error) => ({
        rows: [] as GovernanceAuditEvent[],
        error: toFriendlyError(error, "No se pudo consultar public.audit_logs."),
      })),
      fetchLegacyAuditRows(filters).then(
        (rows) => ({ rows, error: null as string | null })
      ).catch((error) => ({
        rows: [] as GovernanceAuditEvent[],
        error: toFriendlyError(error, "No se pudo consultar auditoria.audit_log."),
      })),
      getRequiredTenantId(),
    ]);

    if (publicResult.error) {
      warnings.push(publicResult.error);
    }
    if (legacyResult.error) {
      warnings.push(legacyResult.error);
    }

    if (!publicResult.rows.length && !legacyResult.rows.length) {
      throw new Error(
        warnings[warnings.length - 1] ??
          "No se encontraron fuentes de auditoria disponibles."
      );
    }

    const mergedRows = publicResult.rows
      .concat(legacyResult.rows)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

    const actorLabels = await resolveProfileLabels(
      uniqueNonEmpty(mergedRows.map((row) => row.actorId).filter(Boolean)),
      tenantId
    ).catch(() => new Map<string, string>());

    const hydratedRows = mergedRows
      .map((row) => ({
        ...row,
        actorLabel: row.actorId
          ? actorLabels.get(row.actorId) ?? row.actorId
          : "Sistema",
      }))
      .filter((row) => matchesSearch(row, searchTerm));

    const schemaOptions = buildSelectOptions(
      uniqueNonEmpty(hydratedRows.map((row) => row.schemaName)),
      "Esquema: Todos"
    );
    const tableOptions = buildSelectOptions(
      uniqueNonEmpty(hydratedRows.map((row) => row.tableName)),
      "Tabla: Todas"
    );
    const actorOptions = [{ value: "all", label: "Actor: Todos" }].concat(
      uniqueNonEmpty(
        hydratedRows
          .filter((row) => Boolean(row.actorId))
          .map((row) => `${row.actorId}::${row.actorLabel}`)
      ).map((value) => {
        const [actorId, actorLabel] = value.split("::");
        return {
          value: actorId,
          label: actorLabel,
        };
      })
    );

    return {
      access,
      rows: hydratedRows,
      schemaOptions,
      tableOptions,
      actorOptions,
      warnings,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron cargar los eventos reales de auditoria.")
    );
  }
}

export async function listGovernanceDeleteAuditEvents(
  limit = 50
): Promise<GovernanceAuditData> {
  return listGovernanceAuditEvents({
    searchTerm: "",
    schemaName: "all",
    tableName: "all",
    operation: "DELETE",
    actorId: "all",
    dateFrom: null,
    dateTo: null,
    limit,
  });
}

