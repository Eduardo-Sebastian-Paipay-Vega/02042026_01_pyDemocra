import { supabase } from "../../supabaseClient";
import type { AppDatabase } from "../../lib/db/ong/app-database";

type PublicProfileRow = Pick<
  AppDatabase["public"]["Tables"]["profiles"]["Row"],
  "id" | "tenant_id" | "full_name"
>;
type PublicTenantRow = Pick<
  AppDatabase["public"]["Tables"]["tenants"]["Row"],
  "id" | "name" | "industry_type_id" | "plan_id" | "status_financial_id"
>;
type PublicTenantModuleRow = Pick<
  AppDatabase["public"]["Tables"]["tenant_modules"]["Row"],
  "module_code" | "status_code"
>;
type PublicRoleRow = Pick<
  AppDatabase["public"]["Tables"]["roles"]["Row"],
  "id" | "name"
>;
type PublicSedeRow = Pick<
  AppDatabase["public"]["Tables"]["sedes"]["Row"],
  "id" | "name"
>;
type PublicUserRoleSedeRow = Pick<
  AppDatabase["public"]["Tables"]["user_roles_sedes"]["Row"],
  "role_id" | "sede_id"
>;

export type TenantBootstrapStatus =
  | "ready"
  | "unauthenticated"
  | "missing_profile"
  | "missing_tenant"
  | "invalid_tenant"
  | "unsupported_industry"
  | "error";

export interface TenantModulesState {
  home: boolean;
  ong: boolean;
  projects: boolean;
  operation: boolean;
  admission: boolean;
  rrhh: boolean;
  resources: boolean;
  inventory: boolean;
  finanzas: boolean;
  clinico: boolean;
  comunicaciones: boolean;
  notifications: boolean;
  governance: boolean;
  auditoria: boolean;
  settings: boolean;
  idcards: boolean;
  people: boolean;
}

export interface TenantFinancialPolicy {
  statusFinancialId: string;
  isReadOnly: boolean;
  isSuspended: boolean;
  label: string;
  message: string | null;
}

export interface TenantRoleAssignment {
  roleId: string;
  roleName: string;
  sedeId: string;
  sedeName: string;
}

export interface TenantContextValue {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    tenantId: string;
    fullName: string | null;
  };
  tenant: {
    id: string;
    name: string;
    industryTypeId: string;
    planId: string;
    statusFinancialId: string;
  };
  modules: TenantModulesState;
  modulePolicy: "fallback" | "explicit";
  rawModuleStatusByCode: Record<string, string>;
  permissions: string[];
  permissionMap: Record<string, boolean>;
  roleAssignments: TenantRoleAssignment[];
  isTenantAdmin: boolean;
  financialPolicy: TenantFinancialPolicy;
  warnings: string[];
}

export interface TenantBootstrapResult {
  status: TenantBootstrapStatus;
  context: TenantContextValue | null;
  message: string | null;
  warnings: string[];
}

const ONG_CHILD_MODULE_KEYS = new Set<keyof TenantModulesState>([
  "home",
  "projects",
  "operation",
  "admission",
  "rrhh",
  "resources",
  "inventory",
  "finanzas",
  "clinico",
  "comunicaciones",
  "notifications",
  "governance",
  "auditoria",
  "settings",
  "idcards",
  "people",
]);

const MODULE_ALIASES: Record<keyof TenantModulesState, string[]> = {
  home: ["home", "dashboard", "inicio"],
  ong: ["ong", "ngo"],
  projects: ["projects", "project", "proyectos"],
  operation: ["operation", "operacion"],
  admission: ["admission", "admision"],
  rrhh: ["rrhh", "rrhhh", "hr", "humanresources", "recursoshumanos"],
  resources: ["resources", "resource", "recursos"],
  inventory: ["inventory", "inventario"],
  finanzas: ["finanzas", "finance", "finances"],
  clinico: ["clinico", "clinical", "clinica", "health"],
  comunicaciones: ["comunicaciones", "communication", "communications"],
  notifications: ["notifications", "notification", "notificaciones"],
  governance: ["governance", "gobernanza"],
  auditoria: ["auditoria", "audit", "audits"],
  settings: ["settings", "configuracion", "iam"],
  idcards: ["idcards", "idcard", "idcardsmodule", "credenciales", "credentials"],
  people: ["people", "personas", "volunteers", "beneficiaries"],
};

const EMPTY_MODULES: TenantModulesState = {
  home: false,
  ong: false,
  projects: false,
  operation: false,
  admission: false,
  rrhh: false,
  resources: false,
  inventory: false,
  finanzas: false,
  clinico: false,
  comunicaciones: false,
  notifications: false,
  governance: false,
  auditoria: false,
  settings: false,
  idcards: false,
  people: false,
};

const INDUSTRY_DEFAULT_MODULES: Record<string, Partial<TenantModulesState>> = {
  ong: {
    home: true,
    ong: true,
    projects: true,
    operation: true,
    admission: true,
    rrhh: true,
    resources: true,
    inventory: true,
    finanzas: true,
    clinico: true,
    comunicaciones: true,
    notifications: true,
    governance: true,
    auditoria: true,
    settings: true,
    idcards: true,
    people: true,
  },
  gym: {
    home: true,
    settings: true,
  },
  health: {
    home: true,
    clinico: true,
    notifications: true,
    settings: true,
  },
  retail: {
    home: true,
    inventory: true,
    resources: true,
    settings: true,
  },
};

const FINANCIAL_LABELS: Record<string, string> = {
  "FIN-ACTIVE": "Activo",
  "FIN-GRACE": "En gracia",
  "FIN-READONLY": "Solo lectura",
  "FIN-SUSPENDED": "Suspendido",
  "FIN-INCONSISTENT": "Inconsistente",
  "FIN-PENDING": "Pendiente",
};

export const LAST_TENANT_ROUTE_STORAGE_KEY_PREFIX = "democra.tenant.last-route";

export const TENANT_PERMISSION_CANDIDATES = [
  "home.read",
  "projects.read",
  "projects.manage",
  "operation.activities.read",
  "operation.activities.manage",
  "operation.hours.read",
  "operation.hours.manage",
  "operation.hours.approve",
  "operation.attendance.read",
  "operation.attendance.manage",
  "operation.evidence.read",
  "operation.evidence.manage",
  "operation.evidence.approve",
  "admission.read",
  "admission.manage",
  "admission.approve",
  "resources.inventory.read",
  "resources.inventory.manage",
  "resources.finance.read",
  "resources.finance.manage",
  "resources.finance.approve",
  "notifications.read",
  "notifications.manage",
  "governance.catalogs.read",
  "governance.audit.read",
  "governance.sensitive.read",
  "governance.retention.read",
  "settings.users.read",
  "settings.users.manage",
  "settings.roles.read",
  "settings.roles.manage",
  "settings.sessions.read",
  "settings.sessions.terminate",
  "clinico.volunteer_sensitive.read",
  "idcards.read",
  "idcards.manage",
  "volunteers.invite",
  "volunteers.register",
  "attendance.scan",
  "devices.read",
  "devices.manage",
  "terminals.read",
  "terminals.manage",
  "iam.users.read",
  "iam.users.manage",
  "iam.roles.read",
  "iam.roles.manage",
  "iam.sessions.terminate",
  "iam.audit.read",
  "iam.user_roles.manage",
] as const;

// ─── Bootstrap cache (3 capas) ───────────────────────────────────────────────
//
//  Capa 1 – Memoria        : variable de módulo JS, 0 ms, vive mientras el JS vive
//  Capa 2 – localStorage   : persiste entre pestañas y entre recargas (TTL 5 min)
//  Capa 3 – Hidratación    : readBootstrapCacheSync() se llama en useState()
//                            ANTES del primer render para evitar flicker
//
// Decisión localStorage vs sessionStorage:
//   sessionStorage es por-pestaña → al abrir link en nueva pestaña vuelve a cargar.
//   localStorage persiste → v2 del esquema para no colisionar con la v1 anterior.

const BOOTSTRAP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
export const BOOTSTRAP_CACHE_KEY = "democra.tenant.ctx.v2";

export type BootstrapCacheEntry = {
  userId: string;
  result: TenantBootstrapResult;
  at: number;
};

let memBootstrapCache: BootstrapCacheEntry | null = null;

// Limpia todas las capas. Llamar en SIGNED_OUT y USER_UPDATED.
export function invalidateTenantBootstrapCache(): void {
  memBootstrapCache = null;
  try {
    localStorage.removeItem(BOOTSTRAP_CACHE_KEY);
    // También limpia la v1 (sessionStorage) si aún existe de versiones anteriores
    sessionStorage.removeItem("democra.tenant.ctx.v1");
  } catch {
    // noop
  }
}

// Lectura síncrona para useState lazy initializer — se ejecuta antes del primer render.
export function readBootstrapCacheSync(): TenantBootstrapResult | null {
  // Capa 1: memoria (navegación interna, misma pestaña)
  if (memBootstrapCache && Date.now() - memBootstrapCache.at < BOOTSTRAP_CACHE_TTL_MS) {
    return memBootstrapCache.result;
  }
  // Capa 2: localStorage (nueva pestaña, F5, reapertura del navegador)
  try {
    const raw = localStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as BootstrapCacheEntry;
    if (Date.now() - entry.at > BOOTSTRAP_CACHE_TTL_MS) {
      localStorage.removeItem(BOOTSTRAP_CACHE_KEY);
      return null;
    }
    // Promueve a memoria para lecturas posteriores sin parse
    memBootstrapCache = entry;
    return entry.result;
  } catch {
    return null;
  }
}

// Lectura por userId usada dentro de bootstrapTenantContext()
function readBootstrapCacheForUser(userId: string): TenantBootstrapResult | null {
  const cached = readBootstrapCacheSync();
  if (!cached) return null;
  // Valida que el userId coincida (evita servir caché de otro usuario)
  const entry = memBootstrapCache;
  if (!entry || entry.userId !== userId) return null;
  return cached;
}

function writeBootstrapCache(userId: string, result: TenantBootstrapResult): void {
  const entry: BootstrapCacheEntry = { userId, result, at: Date.now() };
  memBootstrapCache = entry;
  try {
    localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(entry));
    if (process.env.NODE_ENV === "development") {
      console.debug("[Tenant] Contexto guardado en caché localStorage.");
    }
  } catch {
    // noop — quota exceeded o modo privado
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function publicSchema() {
  return supabase.schema("public");
}

function normalizeKey(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function resolveIndustryTypeId(value: string | null | undefined): string {
  return normalizeKey(value);
}

function createLastRouteStorageKey(userId: string, tenantId: string, industryTypeId: string) {
  return `${LAST_TENANT_ROUTE_STORAGE_KEY_PREFIX}:${industryTypeId}:${tenantId}:${userId}`;
}

export function getStoredLastTenantRoute(
  userId: string,
  tenantId: string,
  industryTypeId: string
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(createLastRouteStorageKey(userId, tenantId, industryTypeId));
  } catch {
    return null;
  }
}

export function storeLastTenantRoute(
  userId: string,
  tenantId: string,
  industryTypeId: string,
  path: string
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      createLastRouteStorageKey(userId, tenantId, industryTypeId),
      path
    );
  } catch {
    // noop
  }
}

function createDefaultModules(industryTypeId: string): TenantModulesState {
  return {
    ...EMPTY_MODULES,
    ...(INDUSTRY_DEFAULT_MODULES[industryTypeId] ?? {}),
  };
}

function matchModuleAlias(moduleCode: string, aliases: string[]) {
  const normalized = normalizeKey(moduleCode);
  return aliases.some((alias) => normalized === normalizeKey(alias));
}

function resolveFinancialPolicy(statusFinancialId: string): TenantFinancialPolicy {
  const normalizedStatus = String(statusFinancialId || "").trim().toUpperCase();
  const label = FINANCIAL_LABELS[normalizedStatus] ?? statusFinancialId ?? "Sin estado";

  if (normalizedStatus === "FIN-SUSPENDED") {
    return {
      statusFinancialId,
      isReadOnly: true,
      isSuspended: true,
      label,
      message:
        "El tenant esta suspendido financieramente. El acceso queda bloqueado hasta regularizar el estado.",
    };
  }

  if (
    normalizedStatus === "FIN-READONLY" ||
    normalizedStatus === "FIN-INCONSISTENT" ||
    normalizedStatus === "FIN-PENDING"
  ) {
    return {
      statusFinancialId,
      isReadOnly: true,
      isSuspended: false,
      label,
      message:
        "El tenant se encuentra en modo controlado por estado financiero. La UI debe operar con cautela y priorizar lectura.",
    };
  }

  if (normalizedStatus === "FIN-GRACE") {
    return {
      statusFinancialId,
      isReadOnly: false,
      isSuspended: false,
      label,
      message:
        "El tenant esta en periodo de gracia. Se mantiene acceso, pero conviene advertir el estado financiero.",
    };
  }

  return {
    statusFinancialId,
    isReadOnly: false,
    isSuspended: false,
    label,
    message: null,
  };
}

function resolveModuleFlag(
  moduleKey: keyof TenantModulesState,
  industryTypeId: string,
  rawModuleStatusByCode: Record<string, string>,
  modulePolicy: "fallback" | "explicit"
): boolean {
  if (modulePolicy === "fallback") {
    return createDefaultModules(industryTypeId)[moduleKey];
  }

  const aliases = MODULE_ALIASES[moduleKey];
  for (const [rawCode, status] of Object.entries(rawModuleStatusByCode)) {
    if (matchModuleAlias(rawCode, aliases)) {
      return String(status).toLowerCase() === "enabled";
    }
  }

  const ongIsExplicitlyEnabled = Object.entries(rawModuleStatusByCode).some(
    ([rawCode, status]) =>
      matchModuleAlias(rawCode, MODULE_ALIASES.ong) &&
      String(status).toLowerCase() === "enabled"
  );

  if (resolveIndustryTypeId(industryTypeId) === "ong" && ongIsExplicitlyEnabled) {
    return ONG_CHILD_MODULE_KEYS.has(moduleKey);
  }

  return false;
}

function resolveModuleState(
  moduleRows: PublicTenantModuleRow[] | null | undefined,
  industryTypeId: string
): {
  modules: TenantModulesState;
  modulePolicy: "fallback" | "explicit";
  rawModuleStatusByCode: Record<string, string>;
} {
  const rows = moduleRows ?? [];
  if (!rows.length) {
    return {
      modules: createDefaultModules(industryTypeId),
      modulePolicy: "fallback",
      rawModuleStatusByCode: {},
    };
  }

  const rawModuleStatusByCode = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.module_code] = row.status_code;
    return acc;
  }, {});

  const modules = (Object.keys(EMPTY_MODULES) as Array<keyof TenantModulesState>).reduce(
    (acc, moduleKey) => {
      acc[moduleKey] = resolveModuleFlag(
        moduleKey,
        industryTypeId,
        rawModuleStatusByCode,
        "explicit"
      );
      return acc;
    },
    { ...EMPTY_MODULES }
  );

  return {
    modules,
    modulePolicy: "explicit",
    rawModuleStatusByCode,
  };
}

async function resolveTenantAdmin(warnings: string[]) {
  try {
    const { data, error } = await supabase.rpc("fn_is_tenant_admin");
    if (error) {
      warnings.push(
        "No se pudo validar tenant admin con public.fn_is_tenant_admin()."
      );
      return false;
    }

    return data === true;
  } catch {
    warnings.push("No se pudo validar tenant admin por RPC.");
    return false;
  }
}

async function resolvePermissionMap(warnings: string[]) {
  const entries = await Promise.all(
    TENANT_PERMISSION_CANDIDATES.map(async (permission) => {
      try {
        const { data, error } = await supabase.rpc("fn_has_permission", {
          p_permission: permission,
        });

        if (error) {
          warnings.push(`No se pudo validar el permiso ${permission}.`);
          return [permission, false] as const;
        }

        return [permission, data === true] as const;
      } catch {
        warnings.push(`No se pudo validar el permiso ${permission} por RPC.`);
        return [permission, false] as const;
      }
    })
  );

  return Object.fromEntries(entries) as Record<string, boolean>;
}

async function resolveRoleAssignments(userId: string, tenantId: string) {
  const { data: assignmentRows, error: assignmentError } = await publicSchema()
    .from("user_roles_sedes")
    .select("role_id, sede_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .limit(1000);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignments = (assignmentRows ?? []) as PublicUserRoleSedeRow[];
  if (!assignments.length) {
    return [];
  }

  const roleIds = Array.from(new Set(assignments.map((row) => row.role_id)));
  const sedeIds = Array.from(new Set(assignments.map((row) => row.sede_id)));

  const [rolesResult, sedesResult] = await Promise.all([
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

  if (rolesResult.error) {
    throw new Error(rolesResult.error.message);
  }
  if (sedesResult.error) {
    throw new Error(sedesResult.error.message);
  }

  const roleNameById = new Map(
    ((rolesResult.data ?? []) as PublicRoleRow[]).map((row) => [row.id, row.name])
  );
  const sedeNameById = new Map(
    ((sedesResult.data ?? []) as PublicSedeRow[]).map((row) => [row.id, row.name])
  );

  return assignments.map<TenantRoleAssignment>((assignment) => ({
    roleId: assignment.role_id,
    roleName: roleNameById.get(assignment.role_id) ?? assignment.role_id,
    sedeId: assignment.sede_id,
    sedeName: sedeNameById.get(assignment.sede_id) ?? assignment.sede_id,
  }));
}

export async function bootstrapTenantContext(): Promise<TenantBootstrapResult> {
  const warnings: string[] = [];

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        status: "unauthenticated",
        context: null,
        message: "No hay una sesion autenticada disponible.",
        warnings,
      };
    }

    // Cache hit: retorno inmediato, 0 llamadas a Supabase
    const cachedResult = readBootstrapCacheForUser(user.id);
    if (cachedResult) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Tenant] Bootstrap resuelto desde caché (0 llamadas).");
      }
      return cachedResult;
    }

    const { data: profile, error: profileError } = await publicSchema()
      .from("profiles")
      .select("id, tenant_id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return {
        status: "error",
        context: null,
        message: profileError.message,
        warnings,
      };
    }

    if (!profile) {
      return {
        status: "missing_profile",
        context: null,
        message: "El usuario autenticado no tiene perfil en public.profiles.",
        warnings,
      };
    }

    const typedProfile = profile as PublicProfileRow;
    if (!typedProfile.tenant_id) {
      return {
        status: "missing_tenant",
        context: null,
        message: "El perfil autenticado no tiene tenant asignado.",
        warnings,
      };
    }

    const { data: tenant, error: tenantError } = await publicSchema()
      .from("tenants")
      .select("id, name, industry_type_id, plan_id, status_financial_id")
      .eq("id", typedProfile.tenant_id)
      .maybeSingle();

    if (tenantError) {
      return {
        status: "error",
        context: null,
        message: tenantError.message,
        warnings,
      };
    }

    if (!tenant) {
      return {
        status: "invalid_tenant",
        context: null,
        message: "El tenant asociado al perfil ya no existe o no es visible.",
        warnings,
      };
    }

    const typedTenant = tenant as PublicTenantRow;
    const industryTypeId = resolveIndustryTypeId(typedTenant.industry_type_id);

    const [roleAssignments, permissionMap, isTenantAdmin, modulesResult] = await Promise.all([
      resolveRoleAssignments(user.id, typedTenant.id).catch((error) => {
        warnings.push(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las asignaciones de rol del tenant."
        );
        return [] as TenantRoleAssignment[];
      }),
      resolvePermissionMap(warnings),
      resolveTenantAdmin(warnings),
      publicSchema()
        .from("tenant_modules")
        .select("module_code, status_code")
        .eq("tenant_id", typedTenant.id)
        .limit(200),
    ]);

    if (modulesResult.error) {
      warnings.push(
        "No se pudo leer public.tenant_modules; se aplicara fallback por industry_type_id."
      );
    }

    const { modules, modulePolicy, rawModuleStatusByCode } = resolveModuleState(
      (modulesResult.data ?? null) as PublicTenantModuleRow[] | null,
      industryTypeId
    );

    const permissions = Object.entries(permissionMap)
      .filter(([, allowed]) => allowed)
      .map(([permission]) => permission)
      .sort();

    const context: TenantContextValue = {
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      profile: {
        id: typedProfile.id,
        tenantId: typedTenant.id,
        fullName: typedProfile.full_name ?? null,
      },
      tenant: {
        id: typedTenant.id,
        name: typedTenant.name,
        industryTypeId,
        planId: typedTenant.plan_id,
        statusFinancialId: typedTenant.status_financial_id,
      },
      modules,
      modulePolicy,
      rawModuleStatusByCode,
      permissions,
      permissionMap,
      roleAssignments,
      isTenantAdmin,
      financialPolicy: resolveFinancialPolicy(typedTenant.status_financial_id),
      warnings,
    };

    if (industryTypeId !== "ong") {
      return {
        status: "unsupported_industry",
        context,
        message: `La industria ${typedTenant.industry_type_id} aun no tiene shell dedicado en esta app.`,
        warnings,
      };
    }

    const readyResult: TenantBootstrapResult = {
      status: "ready",
      context,
      message: null,
      warnings,
    };

    // Guardar en caché: las siguientes llamadas (TOKEN_REFRESHED, doble-mount) retornan al instante
    writeBootstrapCache(user.id, readyResult);

    return readyResult;
  } catch (error) {
    return {
      status: "error",
      context: null,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo completar el bootstrap del tenant.",
      warnings,
    };
  }
}
