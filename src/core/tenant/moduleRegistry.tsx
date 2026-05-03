import { ongModuleDefinitions } from "../../industries/ong/registry";
import type {
  IndustryId,
  RegisteredModuleDefinition,
  TenantRouteDefinition,
  TenantRouteId,
} from "./registry-types";

const MODULE_REGISTRY: RegisteredModuleDefinition[] = [...ongModuleDefinitions];

function toTenantRouteDefinition(
  moduleDefinition: RegisteredModuleDefinition
): TenantRouteDefinition[] {
  return moduleDefinition.routes.map((route) => ({
    ...route,
    moduleId: moduleDefinition.moduleId,
    industryIds: moduleDefinition.industryIds,
    groupId: moduleDefinition.menuGroup.id,
    groupLabel: moduleDefinition.menuGroup.label,
    groupIcon: moduleDefinition.menuGroup.icon,
    requiredPermissions: moduleDefinition.requiredPermissions,
    enabledWhen: moduleDefinition.enabledWhen,
  }));
}

export function listRegisteredModules(industryId?: IndustryId | null) {
  if (!industryId) {
    return MODULE_REGISTRY;
  }

  return MODULE_REGISTRY.filter((moduleDefinition) =>
    moduleDefinition.industryIds.includes(industryId)
  );
}

export function getRegisteredModuleById(moduleId: string) {
  return MODULE_REGISTRY.find((moduleDefinition) => moduleDefinition.moduleId === moduleId) ?? null;
}

export function listTenantRoutes(industryId?: IndustryId | null) {
  return listRegisteredModules(industryId).flatMap(toTenantRouteDefinition);
}

export function getTenantRouteById(routeId: TenantRouteId) {
  return listTenantRoutes().find((route) => route.id === routeId) ?? null;
}

export function findTenantRouteByPath(pathname: string) {
  return (
    listTenantRoutes().find(
      (route) =>
        route.path === pathname ||
        route.legacyPath === pathname ||
        route.aliases?.includes(pathname)
    ) ?? null
  );
}
