import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type {
  TenantContextValue,
  TenantModulesState,
} from "../../modules/ong/app/tenant/bootstrap";

export const KNOWN_INDUSTRY_IDS = ["ong", "gym", "health", "retail"] as const;
export type IndustryId = (typeof KNOWN_INDUSTRY_IDS)[number];

export const TENANT_ROUTE_IDS = [
  "home",
  "search",
  "operation-activities",
  "operation-attendance",
  "operation-hours",
  "operation-evidence",
  "projects",
  "tasks",
  "project-activities",
  "project-assignments",
  "volunteers",
  "id-cards",
  "beneficiaries",
  "medical-records",
  "approvals",
  "approvals-hours",
  "admission-requests",
  "admission-documents",
  "admission-interviews",
  "admission-onboarding",
  "inventory",
  "finance",
  "courses",
  "notifications-templates",
  "notifications-history",
  "catalogs",
  "audit-log",
  "sensitive-access",
  "soft-delete",
  "system-users",
  "roles",
  "security",
  "access-control",
] as const;

export type TenantRouteId = (typeof TENANT_ROUTE_IDS)[number];

export interface ModuleMenuGroupDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface RegisteredRouteDefinition {
  id: TenantRouteId;
  label: string;
  title: string;
  breadcrumb?: string;
  path: string;
  legacyPath: string;
  aliases?: string[];
  icon: LucideIcon;
  shortcutKeys?: string[];
  moduleKeys?: Array<keyof TenantModulesState>;
  anyPermissions?: string[];
  element: ReactNode;
}

export interface RegisteredModuleDefinition {
  moduleId: string;
  industryIds: IndustryId[];
  basePath: string;
  menuGroup: ModuleMenuGroupDefinition;
  menuLabel: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
  moduleKeys?: Array<keyof TenantModulesState>;
  defaultRouteId: TenantRouteId;
  routes: RegisteredRouteDefinition[];
  enabledWhen?: (context: TenantContextValue) => boolean;
}

export interface TenantRouteDefinition extends RegisteredRouteDefinition {
  moduleId: string;
  industryIds: IndustryId[];
  groupId: string;
  groupLabel: string;
  groupIcon: LucideIcon;
  requiredPermissions?: string[];
  enabledWhen?: (context: TenantContextValue) => boolean;
}

export interface TenantSidebarItem {
  id: TenantRouteId;
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface TenantSidebarCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  items: TenantSidebarItem[];
}

export interface IndustryDefinition {
  id: IndustryId;
  name: string;
  description: string;
  status: "active" | "planned";
  basePath: string;
  shell?: ComponentType;
  supportedModuleIds: string[];
  fallbackRouteId: TenantRouteId | null;
  landingPriorityRouteIds: TenantRouteId[];
}

export interface TenantRouteRedirectDefinition {
  from: string;
  to: string;
  kind: "legacy" | "alias";
}
