import type { TenantContextValue, TenantModulesState } from "./bootstrap";

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

export function hasPermission(
  context: TenantContextValue | null | undefined,
  permission: string
): boolean {
  if (!context || !permission) {
    return false;
  }

  if (context.isTenantAdmin) {
    return true;
  }

  return context.permissionMap[permission] === true;
}

export function hasAnyPermission(
  context: TenantContextValue | null | undefined,
  permissions: string[]
): boolean {
  if (!context || permissions.length === 0) {
    return false;
  }

  if (context.isTenantAdmin) {
    return true;
  }

  return permissions.some((permission) => context.permissionMap[permission] === true);
}

export function canAccessModule(
  context: TenantContextValue | null | undefined,
  moduleKey: keyof TenantModulesState
): boolean {
  if (!context) {
    return false;
  }

  if (context.modules[moduleKey]) {
    return true;
  }

  if (
    context.tenant.industryTypeId === "ong" &&
    context.modules.ong &&
    ONG_CHILD_MODULE_KEYS.has(moduleKey) &&
    !context.modules[moduleKey]
  ) {
    return true;
  }

  return false;
}

export function isFinanciallySuspended(context: TenantContextValue | null | undefined) {
  return context?.financialPolicy.isSuspended === true;
}

export function isFinanciallyReadOnly(context: TenantContextValue | null | undefined) {
  return context?.financialPolicy.isReadOnly === true;
}
