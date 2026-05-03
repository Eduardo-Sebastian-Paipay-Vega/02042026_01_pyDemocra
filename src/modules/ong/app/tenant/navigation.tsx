export {
  APP_BASE_PATH,
  APP_SETTINGS_BASE_PATH,
  buildTenantCommandRoutes,
  buildTenantSidebar,
  canAccessTenantRoute,
  findTenantRouteByPath,
  getTenantRouteById,
  listTenantRedirects,
  listTenantRoutes,
  normalizeTenantPath,
  resolveShortcutTargets,
  resolveTenantInitialPath,
} from "../../../../core/tenant/navigation";

export type {
  TenantRouteDefinition,
  TenantRouteId,
  TenantSidebarCategory,
  TenantSidebarItem,
} from "../../../../core/tenant/registry-types";
