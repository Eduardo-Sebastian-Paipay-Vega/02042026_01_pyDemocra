import type { TenantContextValue } from "@ong/app/tenant/bootstrap";
import {
  canAccessRegisteredModule,
  canAccessRegisteredRoute,
} from "./access";
import { getIndustryDefinition } from "./industryRegistry";
import {
  findTenantRouteByPath as findRouteByPathInRegistry,
  getRegisteredModuleById,
  getTenantRouteById as getRouteByIdFromRegistry,
  listRegisteredModules,
  listTenantRoutes as listRouteDefinitions,
} from "./moduleRegistry";
import type {
  IndustryId,
  TenantRouteDefinition,
  TenantRouteId,
  TenantRouteRedirectDefinition,
  TenantSidebarCategory,
} from "./registry-types";
import { getStoredLastTenantRoute } from "@ong/app/tenant/bootstrap";

export const APP_BASE_PATH = "/app";
export const APP_SETTINGS_BASE_PATH = `${APP_BASE_PATH}/settings`;

export function getTenantRouteById(routeId: TenantRouteId) {
  return getRouteByIdFromRegistry(routeId);
}

export function listTenantRoutes(industryId?: IndustryId | null) {
  return listRouteDefinitions(industryId);
}

export function findTenantRouteByPath(pathname: string) {
  return findRouteByPathInRegistry(pathname);
}

export function normalizeTenantPath(pathname: string) {
  return findTenantRouteByPath(pathname)?.path ?? pathname;
}

export function canAccessTenantRoute(
  context: TenantContextValue | null | undefined,
  route: TenantRouteDefinition | null | undefined
) {
  if (!context || !route) {
    return false;
  }

  const moduleDefinition = getRegisteredModuleById(route.moduleId);
  return canAccessRegisteredRoute(context, route, moduleDefinition);
}

export function resolveTenantInitialPath(context: TenantContextValue) {
  const storedPath = getStoredLastTenantRoute(
    context.user.id,
    context.tenant.id,
    context.tenant.industryTypeId
  );

  if (storedPath) {
    const storedRoute = findTenantRouteByPath(storedPath);
    if (storedRoute && canAccessTenantRoute(context, storedRoute)) {
      return storedRoute.path;
    }
  }

  const industryDefinition = getIndustryDefinition(context.tenant.industryTypeId);
  const priorityRouteIds = industryDefinition?.landingPriorityRouteIds ?? [];

  for (const routeId of priorityRouteIds) {
    const route = getTenantRouteById(routeId);
    if (route && canAccessTenantRoute(context, route)) {
      return route.path;
    }
  }

  const firstAccessibleRoute = listTenantRoutes(
    context.tenant.industryTypeId as IndustryId
  ).find((route) => canAccessTenantRoute(context, route));

  if (firstAccessibleRoute) {
    return firstAccessibleRoute.path;
  }

  return industryDefinition?.basePath ?? APP_BASE_PATH;
}

export function buildTenantSidebar(context: TenantContextValue | null | undefined) {
  if (!context) {
    return [] as TenantSidebarCategory[];
  }

  const grouped = new Map<string, TenantSidebarCategory>();

  for (const moduleDefinition of listRegisteredModules(
    context.tenant.industryTypeId as IndustryId
  )) {
    if (!canAccessRegisteredModule(context, moduleDefinition)) {
      continue;
    }

    for (const route of listTenantRoutes().filter(
      (candidate) =>
        candidate.moduleId === moduleDefinition.moduleId &&
        canAccessTenantRoute(context, candidate)
    )) {
      const existingGroup = grouped.get(route.groupId);
      if (existingGroup) {
        existingGroup.items.push({
          id: route.id,
          label: route.label,
          path: route.path,
          icon: route.icon,
        });
        continue;
      }

      grouped.set(route.groupId, {
        id: route.groupId,
        label: route.groupLabel,
        icon: route.groupIcon,
        items: [
          {
            id: route.id,
            label: route.label,
            path: route.path,
            icon: route.icon,
          },
        ],
      });
    }
  }

  return Array.from(grouped.values());
}

export function buildTenantCommandRoutes(context: TenantContextValue | null | undefined) {
  if (!context) {
    return [] as TenantRouteDefinition[];
  }

  return listTenantRoutes(context.tenant.industryTypeId as IndustryId).filter((route) =>
    canAccessTenantRoute(context, route)
  );
}

export function resolveShortcutTargets(context: TenantContextValue | null | undefined) {
  const shortcuts = new Map<string, string | null>();

  for (const route of buildTenantCommandRoutes(context)) {
    for (const shortcutKey of route.shortcutKeys ?? []) {
      if (!shortcuts.has(shortcutKey)) {
        shortcuts.set(shortcutKey, route.path);
      }
    }
  }

  return Object.fromEntries(shortcuts) as Record<string, string | null>;
}

export function listTenantRedirects() {
  return listTenantRoutes().flatMap<TenantRouteRedirectDefinition>((route) => {
    const redirects: TenantRouteRedirectDefinition[] = [
      {
        from: route.legacyPath,
        to: route.path,
        kind: "legacy",
      },
    ];

    for (const alias of route.aliases ?? []) {
      redirects.push({
        from: alias,
        to: route.path,
        kind: "alias",
      });
    }

    return redirects;
  });
}

