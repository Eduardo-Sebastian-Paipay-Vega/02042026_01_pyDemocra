import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  PeopleRecordStatusKind,
  SensitiveAccessState,
} from "../../modules/people/types";
import type { StatusVariant } from "../../modules/operation/types";

type PublicProfileRow = AppDatabase["public"]["Tables"]["profiles"]["Row"];
type PublicRoleRow = AppDatabase["public"]["Tables"]["roles"]["Row"];
type PublicUserRoleSedeRow = AppDatabase["public"]["Tables"]["user_roles_sedes"]["Row"];
type PublicSedeRow = AppDatabase["public"]["Tables"]["sedes"]["Row"];

const TENANT_CACHE_TTL_MS = 30_000;
const DEFAULT_MAX_TEXT_LENGTH = 500;

let tenantCache: { value: string; at: number } | null = null;

export const peopleDb = supabase;

export function ongSchema() {
  return peopleDb.schema("ong");
}

export function rrhhSchema() {
  return peopleDb.schema("rrhh");
}

export function clinicoSchema() {
  return peopleDb.schema("clinico");
}

export function publicSchema() {
  return peopleDb.schema("public");
}

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function sanitizeText(
  value: string | null | undefined,
  maxLength = DEFAULT_MAX_TEXT_LENGTH
): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

export function sanitizeEmail(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 255).toLowerCase();
  return cleaned ? cleaned : null;
}

export function sanitizePhone(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 50);
  return cleaned ? cleaned : null;
}

export function normalizeDateValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
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

  if (rawMessage.trim()) {
    return `${fallbackMessage} (${rawMessage})`;
  }

  return fallbackMessage;
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

export function resolvePeopleStatusVariant(kind: PeopleRecordStatusKind): StatusVariant {
  if (kind === "active") {
    return "success";
  }
  if (kind === "inactive") {
    return "secondary";
  }
  if (kind === "pending") {
    return "warning";
  }
  return "info";
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

  const { data, error } = await peopleDb.rpc("fn_current_tenant_id");
  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string" || !(data as string).trim()) {
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
    const { data } = await peopleDb.auth.getUser();
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

export async function resolveRoleNamesByUserId(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const { data: assignmentRows, error: assignmentError } = await publicSchema()
    .from("user_roles_sedes")
    .select("role_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .limit(1000);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const roleIds = uniqueNonEmpty(
    ((assignmentRows ?? []) as PublicUserRoleSedeRow[]).map((row) => row.role_id)
  );
  if (!roleIds.length) {
    return [];
  }

  const { data: roleRows, error: roleError } = await publicSchema()
    .from("roles")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .in("id", roleIds);

  if (roleError) {
    throw new Error(roleError.message);
  }

  return uniqueNonEmpty(
    ((roleRows ?? []) as PublicRoleRow[]).map((row) => sanitizeText(row.name, 120)).filter(Boolean)
  );
}

async function hasPermission(permission: string): Promise<boolean> {
  const normalizedPermission = sanitizeText(permission, 160);
  if (!normalizedPermission) {
    return false;
  }

  try {
    const { data, error } = await peopleDb.rpc("fn_has_permission", {
      p_permission: normalizedPermission,
    } as any);
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function resolveInstitutionalRolesByUserIds(
  userIds: string[],
  tenantId: string
): Promise<Map<string, Array<{ roleId: string; roleName: string; sedeId: string; sedeName: string }>>> {
  const sanitizedUserIds = uniqueNonEmpty(
    userIds.map((value) => sanitizeOptionalId(value)).filter(Boolean)
  );
  if (!sanitizedUserIds.length) {
    return new Map();
  }

  const { data: assignmentRows, error: assignmentError } = await publicSchema()
    .from("user_roles_sedes")
    .select("user_id, role_id, sede_id")
    .eq("tenant_id", tenantId)
    .in("user_id", sanitizedUserIds)
    .limit(2000);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignments = (assignmentRows ?? []) as Array<
    Pick<PublicUserRoleSedeRow, "user_id" | "role_id" | "sede_id">
  >;
  if (!assignments.length) {
    return new Map();
  }

  const roleIds = uniqueNonEmpty(assignments.map((row) => row.role_id));
  const sedeIds = uniqueNonEmpty(assignments.map((row) => row.sede_id));

  const [roleResult, sedeResult] = await Promise.all([
    publicSchema()
      .from("roles")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .in("id", roleIds),
    publicSchema()
      .from("sedes")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .in("id", sedeIds),
  ]);

  if (roleResult.error) {
    throw new Error(roleResult.error.message);
  }
  if (sedeResult.error) {
    throw new Error(sedeResult.error.message);
  }

  const roleNameById = new Map(
    ((roleResult.data ?? []) as PublicRoleRow[]).map((row): [string, string] => [
      row.id,
      sanitizeText(row.name, 120) || row.id,
    ])
  );
  const sedeNameById = new Map(
    ((sedeResult.data ?? []) as PublicSedeRow[]).map((row): [string, string] => [
      row.id,
      sanitizeText(row.name, 120) || row.id,
    ])
  );

  const byUserId = new Map<
    string,
    Array<{ roleId: string; roleName: string; sedeId: string; sedeName: string }>
  >();

  for (const assignment of assignments) {
    const current = byUserId.get(assignment.user_id) ?? [];
    current.push({
      roleId: assignment.role_id,
      roleName: roleNameById.get(assignment.role_id) ?? assignment.role_id,
      sedeId: assignment.sede_id,
      sedeName: sedeNameById.get(assignment.sede_id) ?? assignment.sede_id,
    });
    byUserId.set(assignment.user_id, current);
  }

  return byUserId;
}

export async function resolveSensitiveAccessState(): Promise<SensitiveAccessState> {
  const [tenantId, currentUserId] = await Promise.all([
    getRequiredTenantId(),
    resolveCurrentUserId(),
  ]);

  if (!currentUserId) {
    return {
      currentUserId: null,
      canRead: false,
      canWrite: false,
      isTenantAdmin: false,
      roleNames: [],
      reason: "No se pudo resolver el usuario autenticado.",
    };
  }

  let isTenantAdmin = false;
  try {
    const { data, error } = await peopleDb.rpc("fn_is_tenant_admin");
    isTenantAdmin = !error && data === true;
  } catch {
    isTenantAdmin = false;
  }

  const [roleNames, canReadSensitive] = await Promise.all([
    resolveRoleNamesByUserId(currentUserId, tenantId).catch(() => [] as string[]),
    hasPermission("clinico.volunteer_sensitive.read"),
  ]);

  const canRead = isTenantAdmin || canReadSensitive;

  return {
    currentUserId,
    canRead,
    canWrite: canRead,
    isTenantAdmin,
    roleNames,
    reason: canRead
      ? null
      : "La ficha sensible requiere `clinico.volunteer_sensitive.read` o tenant admin.",
  };
}

export async function ensureSensitiveAccess(): Promise<SensitiveAccessState> {
  const accessState = await resolveSensitiveAccessState();
  if (!accessState.canRead) {
    throw new Error(
      accessState.reason ??
        "No tienes permisos para consultar datos sensibles."
    );
  }
  return accessState;
}
