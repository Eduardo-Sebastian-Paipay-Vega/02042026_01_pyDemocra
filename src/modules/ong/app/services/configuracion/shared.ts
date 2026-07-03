import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type { SettingsCapabilityState } from "../../modules/settings/types";

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

export const settingsDb = supabase;

export function publicSchema() {
  return settingsDb.schema("public");
}

export function ongSchema() {
  return settingsDb.schema("ong");
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

export function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

export function toFriendlyError(error: unknown, fallbackMessage: string): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("edge function") ||
    normalized.includes("backend seguro") ||
    normalized.includes("inicia sesion nuevamente") ||
    normalized.includes("no tienes permisos para ejecutar") ||
    normalized.includes("debes registrar") ||
    normalized.includes("debes seleccionar")
  ) {
    return rawMessage;
  }

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

  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "Ya existe un registro con esos datos dentro del tenant.";
  }

  return rawMessage.trim() ? `${fallbackMessage} (${rawMessage})` : fallbackMessage;
}

function getFunctionPermissionLabel(functionName: string): string | null {
  if (functionName === "admin-provision-user") {
    return "`settings.users.manage`";
  }

  if (functionName === "admin-revoke-user-sessions") {
    return "`settings.sessions.terminate`";
  }

  return null;
}

async function readFunctionErrorPayload(
  context: Response
): Promise<{ message: string | null; status: number }> {
  const status = context.status;

  try {
    const payload = (await context.clone().json()) as {
      error?: string;
      message?: string;
      code?: string;
    };

    return {
      status,
      message:
        sanitizeText(payload?.error ?? payload?.message ?? payload?.code ?? null, 500) || null,
    };
  } catch {
    try {
      const payloadText = sanitizeText(await context.clone().text(), 500);
      return {
        status,
        message: payloadText || null,
      };
    } catch {
      return {
        status,
        message: null,
      };
    }
  }
}

async function resolveFunctionErrorMessage(
  functionName: string,
  error: unknown
): Promise<string> {
  const baseMessage =
    error instanceof Error && error.message.trim()
      ? error.message
      : "No se pudo ejecutar la Edge Function.";

  const context =
    typeof error === "object" && error !== null && "context" in error
      ? (error as { context?: Response }).context
      : undefined;

  const functionLabel = `La Edge Function \`${functionName}\``;
  const normalizedBase = baseMessage.toLowerCase();

  if (!context) {
    if (
      normalizedBase.includes("failed to fetch") ||
      normalizedBase.includes("network") ||
      normalizedBase.includes("fetch")
    ) {
      return `${functionLabel} no respondio. Verifica despliegue, conectividad y la URL de Supabase del entorno actual.`;
    }

    return baseMessage;
  }

  const { message: payloadMessage, status } = await readFunctionErrorPayload(context);
  const normalizedPayload = (payloadMessage ?? "").toLowerCase();
  const requiredPermission = getFunctionPermissionLabel(functionName);

  if (
    status === 404 ||
    normalizedBase.includes("function not found") ||
    normalizedPayload.includes("function not found")
  ) {
    return `${functionLabel} no esta desplegada en Supabase para este entorno.`;
  }

  if (
    normalizedBase.includes("missing environment variable") ||
    normalizedPayload.includes("missing environment variable") ||
    normalizedBase.includes("service_role") ||
    normalizedPayload.includes("service_role") ||
    normalizedBase.includes("supabase_url") ||
    normalizedPayload.includes("supabase_url") ||
    normalizedBase.includes("supabase_anon_key") ||
    normalizedPayload.includes("supabase_anon_key")
  ) {
    return `El backend seguro de \`${functionName}\` no esta configurado correctamente. Revisa SUPABASE_URL u ONG_DB_SUPABASE_URL, SUPABASE_ANON_KEY u ONG_DB_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY u ONG_DB_SUPABASE_SERVICE_ROLE_KEY.`;
  }

  if (
    status === 401 ||
    normalizedBase.includes("jwt") ||
    normalizedPayload.includes("jwt") ||
    normalizedBase.includes("unauthorized") ||
    normalizedPayload.includes("unauthorized")
  ) {
    return `${functionLabel} requiere una sesion valida. Inicia sesion nuevamente y reintenta.`;
  }

  if (
    status === 403 ||
    normalizedBase.includes("permission") ||
    normalizedPayload.includes("permission") ||
    normalizedBase.includes("forbidden") ||
    normalizedPayload.includes("forbidden")
  ) {
    if (requiredPermission) {
      return `No tienes permisos para ejecutar \`${functionName}\`. El Core exige ${requiredPermission} o tenant admin.`;
    }

    return `No tienes permisos para ejecutar \`${functionName}\`.`;
  }

  if (payloadMessage) {
    return payloadMessage;
  }

  return baseMessage;
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

  const { data, error } = await settingsDb.rpc("fn_current_tenant_id");
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
    const { data } = await settingsDb.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    tenantCache = null;
    return null;
  }
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

export async function invokeSettingsFunction<TResult>(
  functionName: string,
  body: Record<string, unknown>
): Promise<TResult> {
  const { data, error } = await settingsDb.functions.invoke(functionName, {
    body,
  });

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(functionName, error));
  }

  return data as TResult;
}

async function hasPermission(permission: string, warnings: string[]): Promise<boolean> {
  try {
    const { data, error } = await settingsDb.rpc("fn_has_permission", {
      p_permission: permission,
    } as any);

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

async function hasAnyPermission(
  permissions: string[],
  warnings: string[]
): Promise<boolean> {
  const candidates = uniqueNonEmpty(
    permissions.map((permission) => sanitizeText(permission, 160)).filter(Boolean)
  );
  if (!candidates.length) {
    return false;
  }

  const results = await Promise.all(
    candidates.map((permission) => hasPermission(permission, warnings))
  );

  return results.some((value) => value);
}

async function isTenantAdmin(warnings: string[]): Promise<boolean> {
  try {
    const { data, error } = await settingsDb.rpc("fn_is_tenant_admin");
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

export async function resolveSettingsCapabilities(): Promise<SettingsCapabilityState> {
  const warnings: string[] = [];
  const currentUserId = await resolveCurrentUserId();

  if (!currentUserId) {
    return {
      currentUserId: null,
      isTenantAdmin: false,
      canReadUsers: false,
      canManageUsers: false,
      canReadRoles: false,
      canManageRoles: false,
      canManageUserAssignments: false,
      canReadPermissions: false,
      canReadAudit: false,
      canReadSessions: false,
      canManageSessions: false,
      canReadDevices: false,
      canManageDevices: false,
      canReadTerminals: false,
      canManageTerminals: false,
      canReadAuthEvents: false,
      warnings: ["No se pudo resolver el usuario autenticado."],
    };
  }

  const admin = await isTenantAdmin(warnings);
  const [
    canUsersRead,
    canUsersManage,
    canRolesRead,
    canRolesManage,
    canUserRolesManageLegacy,
    canAuditRead,
    canSessionsRead,
    canSessionsTerminate,
    canDevicesReadLegacy,
    canDevicesManageLegacy,
    canTerminalsReadLegacy,
    canTerminalsManageLegacy,
  ] = await Promise.all([
    hasAnyPermission(["settings.users.read", "iam.users.read"], warnings),
    hasAnyPermission(["settings.users.manage", "iam.users.manage"], warnings),
    hasAnyPermission(["settings.roles.read", "iam.roles.read"], warnings),
    hasAnyPermission(["settings.roles.manage", "iam.roles.manage"], warnings),
    hasPermission("iam.user_roles.manage", warnings),
    hasAnyPermission(["governance.audit.read", "iam.audit.read"], warnings),
    hasPermission("settings.sessions.read", warnings),
    hasAnyPermission(["settings.sessions.terminate", "iam.sessions.terminate"], warnings),
    hasPermission("devices.read", warnings),
    hasPermission("devices.manage", warnings),
    hasPermission("terminals.read", warnings),
    hasPermission("terminals.manage", warnings),
  ]);

  if (canUserRolesManageLegacy && !canUsersManage) {
    warnings.push(
      "Se mantiene compatibilidad con `iam.user_roles.manage` para `public.user_roles_sedes` mientras el Core no publique un permiso `settings.user_roles.manage`."
    );
  }

  if (
    (canDevicesReadLegacy ||
      canDevicesManageLegacy ||
      canTerminalsReadLegacy ||
      canTerminalsManageLegacy) &&
    !canSessionsRead &&
    !canSessionsTerminate
  ) {
    warnings.push(
      "La seguridad de `public.devices` y `public.terminals` sigue admitiendo permisos legacy `devices.*` / `terminals.*`; Parte 4 solo publica `settings.sessions.*` como permiso nuevo de seguridad."
    );
  }

  return {
    currentUserId,
    isTenantAdmin: admin,
    canReadUsers: admin || canUsersRead || canUsersManage || canUserRolesManageLegacy,
    canManageUsers: admin || canUsersManage || canUserRolesManageLegacy,
    canReadRoles: admin || canRolesRead || canRolesManage || canUserRolesManageLegacy,
    canManageRoles: admin || canRolesManage,
    canManageUserAssignments: admin || canUsersManage || canUserRolesManageLegacy,
    canReadPermissions: admin || canRolesRead || canRolesManage || canUserRolesManageLegacy,
    canReadAudit: admin || canAuditRead,
    canReadSessions: admin || canSessionsRead || canSessionsTerminate,
    canManageSessions: admin || canSessionsTerminate,
    canReadDevices:
      admin || canSessionsRead || canSessionsTerminate || canDevicesReadLegacy || canDevicesManageLegacy,
    canManageDevices: admin || canSessionsTerminate || canDevicesManageLegacy,
    canReadTerminals:
      admin || canSessionsRead || canSessionsTerminate || canTerminalsReadLegacy || canTerminalsManageLegacy,
    canManageTerminals: admin || canSessionsTerminate || canTerminalsManageLegacy,
    canReadAuthEvents: admin || canAuditRead || canSessionsRead || canSessionsTerminate,
    warnings,
  };
}
