import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type { GovernanceCapabilityState } from "../../modules/governance/types";

type PublicProfileRow = AppDatabase["public"]["Tables"]["profiles"]["Row"];

const TENANT_CACHE_TTL_MS = 30_000;
const DEFAULT_TEXT_MAX_LENGTH = 500;
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

let tenantCache: { value: string; at: number } | null = null;

export const governanceDb = supabase;

export function publicSchema() {
  return governanceDb.schema("public" as any) as any;
}

export function ongSchema() {
  return governanceDb.schema("ong" as any) as any;
}

export function rrhhSchema() {
  return governanceDb.schema("rrhh" as any) as any;
}

export function clinicoSchema() {
  return governanceDb.schema("clinico" as any) as any;
}

export function comunicacionesSchema() {
  return governanceDb.schema("comunicaciones" as any) as any;
}

export function auditoriaSchema() {
  return governanceDb.schema("auditoria" as any) as any;
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeText(
  value: string | null | undefined,
  maxLength = DEFAULT_TEXT_MAX_LENGTH
): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeSearchTerm(value: string | null | undefined): string {
  return sanitizeText(value, 120).replace(/[%_,'"]/g, " ");
}

export function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

export function normalizeDateValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export function normalizeTimeValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

export function toFriendlyError(error: unknown, fallbackMessage: string): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("fetch")
  ) {
    return "No se pudo conectar con la base de datos. Revisa la conexion e intenta de nuevo.";
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("auth") ||
    normalized.includes("permission") ||
    normalized.includes("rls")
  ) {
    return "No tienes permisos suficientes para completar esta accion.";
  }

  return rawMessage.trim() ? `${fallbackMessage} (${rawMessage})` : fallbackMessage;
}

export function toDateTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return DATE_TIME_FORMAT.format(parsed);
}

export function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "-";
  }
  if (typeof value === "string") {
    return value.trim() ? value : "-";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function uniqueNonEmpty<TValue>(
  values: Array<TValue | null | undefined>
): TValue[] {
  const seen = new Set<TValue>();
  const rows: TValue[] = [];

  for (const value of values) {
    if (value === null || value === undefined || seen.has(value)) {
      continue;
    }

    seen.add(value);
    rows.push(value);
  }

  return rows;
}

export function createTenantScopedQuery<
  TQuery extends { eq(column: string, value: string): TQuery }
>(query: TQuery, tenantId: string): TQuery {
  return query.eq("tenant_id", tenantId);
}

export async function getRequiredTenantId(): Promise<string> {
  if (tenantCache && Date.now() - tenantCache.at < TENANT_CACHE_TTL_MS) {
    return tenantCache.value;
  }

  const { data, error } = await governanceDb.rpc("fn_current_tenant_id");
  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string" || !data.trim()) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  tenantCache = {
    value: data,
    at: Date.now(),
  };

  return data;
}

export async function resolveCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await governanceDb.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    tenantCache = null;
    return null;
  }
}

export async function resolveActorId(explicitId?: string | null): Promise<string | null> {
  const sanitized = sanitizeOptionalId(explicitId ?? null);
  if (sanitized) {
    return sanitized;
  }

  return resolveCurrentUserId();
}

export async function resolveProfileLabels(
  userIds: string[],
  tenantId?: string
): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(userIds.map((value) => sanitizeOptionalId(value)).filter(Boolean));
  if (!ids.length) {
    return new Map();
  }

  let query = publicSchema().from("profiles").select("id, full_name").in("id", ids);
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as PublicProfileRow[]).map((row): [string, string] => [
      row.id,
      sanitizeText(row.full_name ?? null, 180) || row.id,
    ])
  );
}

async function hasPermission(permission: string, warnings: string[]): Promise<boolean> {
  try {
    const { data, error } = await governanceDb.rpc("fn_has_permission", {
      p_permission: permission,
    });

    if (error) {
      warnings.push(
        `No se pudo validar el permiso ${permission} con public.fn_has_permission().`
      );
      return false;
    }

    return data === true;
  } catch {
    warnings.push(`No se pudo validar el permiso ${permission} por RPC.`);
    return false;
  }
}

async function isTenantAdmin(warnings: string[]): Promise<boolean> {
  try {
    const { data, error } = await governanceDb.rpc("fn_is_tenant_admin");
    if (error) {
      warnings.push("No se pudo validar tenant admin con public.fn_is_tenant_admin() (permiso core iam.admin).");
      return false;
    }
    return data === true;
  } catch {
    warnings.push("No se pudo validar tenant admin por RPC.");
    return false;
  }
}

export async function resolveGovernanceCapabilities(): Promise<GovernanceCapabilityState> {
  const warnings: string[] = [];
  const currentUserId = await resolveCurrentUserId();

  if (!currentUserId) {
    return {
      currentUserId: null,
      isTenantAdmin: false,
      canReadCatalogs: false,
      canReadAudit: false,
      canReadSensitiveAccess: false,
      canReadRetention: false,
      canReadConstraints: false,
      canManageConstraints: false,
      warnings: ["No se pudo resolver el usuario autenticado."],
    };
  }

  const admin = await isTenantAdmin(warnings);
  const [
    canCatalogsRead,
    canAuditRead,
    canSensitiveRead,
    canRetentionRead,
    canRolesRead,
    canRolesManage,
  ] = await Promise.all([
    hasPermission("governance.catalogs.read", warnings),
    hasPermission("governance.audit.read", warnings),
    hasPermission("governance.sensitive.read", warnings),
    hasPermission("governance.retention.read", warnings),
    hasPermission("settings.roles.read", warnings),
    hasPermission("settings.roles.manage", warnings),
  ]);

  const canReadAudit = admin || canAuditRead;
  const canReadSensitiveAccess = admin || canSensitiveRead;
  const canReadRetention = admin || canRetentionRead;
  const canReadConstraints = admin || canRolesRead || canRolesManage;
  const canManageConstraints = admin || canRolesManage;

  return {
    currentUserId,
    isTenantAdmin: admin,
    canReadCatalogs: admin || canCatalogsRead,
    canReadAudit,
    canReadSensitiveAccess,
    canReadRetention,
    canReadConstraints,
    canManageConstraints,
    warnings,
  };
}
