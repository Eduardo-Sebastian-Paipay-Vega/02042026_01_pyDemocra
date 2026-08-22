import type {
  TenantContextValue,
  TenantModulesState,
} from "../../modules/ong/app/tenant/bootstrap";
import type {
  IndustryId,
  RegisteredModuleDefinition,
  TenantRouteDefinition,
} from "./registry-types";

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

export function canAccessIndustry(
  context: TenantContextValue | null | undefined,
  industryId: IndustryId
) {
  return context?.tenant.industryTypeId === industryId;
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

export function canAccessRegisteredModule(
  context: TenantContextValue | null | undefined,
  moduleDefinition: RegisteredModuleDefinition | null | undefined
) {
  if (!context || !moduleDefinition) {
    return false;
  }

  if (!moduleDefinition.industryIds.includes(context.tenant.industryTypeId as IndustryId)) {
    return false;
  }

  const moduleKeyAllowed =
    !moduleDefinition.moduleKeys ||
    moduleDefinition.moduleKeys.some((moduleKey) => canAccessModule(context, moduleKey));

  if (!moduleKeyAllowed) {
    return false;
  }

  const permissionAllowed =
    !moduleDefinition.requiredPermissions ||
    moduleDefinition.requiredPermissions.length === 0 ||
    hasAnyPermission(context, moduleDefinition.requiredPermissions);

  if (!permissionAllowed) {
    return false;
  }

  if (moduleDefinition.enabledWhen) {
    return moduleDefinition.enabledWhen(context);
  }

  return true;
}

export function canAccessRegisteredRoute(
  context: TenantContextValue | null | undefined,
  route: TenantRouteDefinition | null | undefined,
  moduleDefinition?: RegisteredModuleDefinition | null
) {
  if (!context || !route) {
    return false;
  }

  if (!route.industryIds.includes(context.tenant.industryTypeId as IndustryId)) {
    return false;
  }

  if (moduleDefinition && !canAccessRegisteredModule(context, moduleDefinition)) {
    return false;
  }

  const moduleAllowed =
    !route.moduleKeys || route.moduleKeys.some((moduleKey) => canAccessModule(context, moduleKey));

  if (!moduleAllowed) {
    return false;
  }

  if (!route.anyPermissions || route.anyPermissions.length === 0) {
    return true;
  }

  return hasAnyPermission(context, route.anyPermissions);
}

export function isFinanciallySuspended(context: TenantContextValue | null | undefined) {
  return context?.financialPolicy.isSuspended === true;
}

export function isFinanciallyReadOnly(context: TenantContextValue | null | undefined) {
  return context?.financialPolicy.isReadOnly === true;
}

