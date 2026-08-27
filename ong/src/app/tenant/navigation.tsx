import {
  Bell,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  FolderKanban,
  Heart,
  Home,
  Layers,
  Link2,
  ListTodo,
  Package,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Trash2,
  Upload,
  UserCog,
  UserPlus,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { TenantContextValue, TenantModulesState } from "./bootstrap";
import { getStoredLastTenantRoute } from "./bootstrap";
import { canAccessModule, hasAnyPermission } from "./permissions";

export const ONG_SHELL_BASE_PATH = "/app";

export type TenantRouteId =
  | "home"
  | "search"
  | "operation-attendance"
  | "operation-hours"
  | "operation-evidence"
  | "projects"
  | "tasks"
  | "project-activities"
  | "project-assignments"
  | "volunteers"
  | "id-cards"
  | "beneficiaries"
  | "medical-records"
  | "approvals"
  | "approvals-hours"
  | "admission-requests"
  | "admission-documents"
  | "admission-interviews"
  | "admission-onboarding"
  | "inventory"
  | "finance"
  | "courses"
  | "notifications-templates"
  | "notifications-history"
  | "areas"
  | "catalogs"
  | "audit-log"
  | "sensitive-access"
  | "soft-delete"
  | "system-users"
  | "roles"
  | "security"
  | "access-control";

export interface TenantRouteDefinition {
  id: TenantRouteId;
  label: string;
  title: string;
  breadcrumb?: string;
  path: string;
  legacyPath: string;
  icon: LucideIcon;
  groupId: string;
  moduleKeys?: Array<keyof TenantModulesState>;
  anyPermissions?: string[];
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

interface TenantNavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: TenantNavGroup[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban },
  { id: "operacion", label: "Operacion", icon: Calendar },
  { id: "aprobaciones", label: "Aprobaciones", icon: CheckSquare },
  { id: "personas", label: "Personas", icon: Users },
  { id: "admision", label: "Admision", icon: UserPlus },
  { id: "recursos", label: "Recursos", icon: Package },
  { id: "clinico", label: "Clinico", icon: ShieldAlert },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "gobernanza", label: "Gobernanza", icon: Database },
  { id: "configuracion", label: "Configuracion", icon: Settings },
];

const ROUTES: TenantRouteDefinition[] = [
  {
    id: "home",
    label: "Panel principal",
    title: "Panel principal",
    path: `${ONG_SHELL_BASE_PATH}/home`,
    legacyPath: "/admin",
    icon: Home,
    groupId: "home",
    moduleKeys: ["home", "ong"],
    anyPermissions: ["home.read"],
  },
  {
    id: "search",
    label: "Búsqueda global",
    title: "Búsqueda global",
    breadcrumb: "Home",
    path: `${ONG_SHELL_BASE_PATH}/search`,
    legacyPath: "/admin/search",
    icon: Search,
    groupId: "home",
    moduleKeys: ["home", "ong"],
    anyPermissions: ["home.read"],
  },
  {
    id: "projects",
    label: "Proyectos",
    title: "Proyectos",
    breadcrumb: "Proyectos",
    path: `${ONG_SHELL_BASE_PATH}/projects`,
    legacyPath: "/admin/projects",
    icon: FolderKanban,
    groupId: "proyectos",
    moduleKeys: ["projects", "ong"],
    anyPermissions: ["projects.read"],
  },
  {
    id: "project-activities",
    label: "Actividades",
    title: "Actividades del proyecto",
    breadcrumb: "Proyectos",
    path: `${ONG_SHELL_BASE_PATH}/projects/activities`,
    legacyPath: "/admin/project-activities",
    icon: Calendar,
    groupId: "proyectos",
    moduleKeys: ["projects", "ong"],
    anyPermissions: ["projects.read"],
  },
  {
    id: "tasks",
    label: "Tareas",
    title: "Tareas",
    breadcrumb: "Proyectos",
    path: `${ONG_SHELL_BASE_PATH}/projects/tasks`,
    legacyPath: "/admin/tasks",
    icon: ListTodo,
    groupId: "proyectos",
    moduleKeys: ["projects", "ong"],
    anyPermissions: ["projects.read"],
  },
  {
    id: "project-assignments",
    label: "Asignaciones",
    title: "Asignaciones",
    breadcrumb: "Proyectos",
    path: `${ONG_SHELL_BASE_PATH}/projects/assignments`,
    legacyPath: "/admin/project-assignments",
    icon: Users,
    groupId: "proyectos",
    moduleKeys: ["projects", "ong"],
    anyPermissions: ["projects.read"],
  },
  {
    id: "operation-attendance",
    label: "Asistencias",
    title: "Asistencias",
    breadcrumb: "Operacion",
    path: `${ONG_SHELL_BASE_PATH}/operation/attendance`,
    legacyPath: "/admin/attendance",
    icon: CheckSquare,
    groupId: "operacion",
    moduleKeys: ["operation", "ong"],
    anyPermissions: ["operation.attendance.read", "attendance.scan"],
  },
  {
    id: "operation-hours",
    label: "Horas",
    title: "Horas",
    breadcrumb: "Operacion",
    path: `${ONG_SHELL_BASE_PATH}/operation/hours`,
    legacyPath: "/admin/hours",
    icon: Clock,
    groupId: "operacion",
    moduleKeys: ["operation", "ong"],
    anyPermissions: ["operation.hours.read"],
  },
  {
    id: "operation-evidence",
    label: "Evidencias",
    title: "Evidencias",
    breadcrumb: "Operacion",
    path: `${ONG_SHELL_BASE_PATH}/operation/evidence`,
    legacyPath: "/admin/evidence",
    icon: Upload,
    groupId: "operacion",
    moduleKeys: ["operation", "ong"],
    anyPermissions: ["operation.evidence.read"],
  },
  {
    id: "approvals",
    label: "Bandeja",
    title: "Bandeja de aprobaciones",
    breadcrumb: "Aprobaciones",
    path: `${ONG_SHELL_BASE_PATH}/approvals`,
    legacyPath: "/admin/approvals",
    icon: CheckSquare,
    groupId: "aprobaciones",
    moduleKeys: ["operation", "resources", "admission", "ong"],
    anyPermissions: [
      "operation.hours.approve",
      "operation.evidence.approve",
      "admission.approve",
      "resources.finance.approve",
    ],
  },
  {
    id: "approvals-hours",
    label: "Aprobacion de horas",
    title: "Aprobacion de horas",
    breadcrumb: "Aprobaciones",
    path: `${ONG_SHELL_BASE_PATH}/approvals/hours`,
    legacyPath: "/admin/approvals/hours",
    icon: Clock,
    groupId: "aprobaciones",
    moduleKeys: ["operation", "ong"],
    anyPermissions: ["operation.hours.approve"],
  },
  {
    id: "volunteers",
    label: "Voluntarios",
    title: "Voluntarios",
    breadcrumb: "Personas",
    path: `${ONG_SHELL_BASE_PATH}/people/volunteers`,
    legacyPath: "/admin/volunteers",
    icon: Users,
    groupId: "personas",
    moduleKeys: ["people", "ong"],
    anyPermissions: ["volunteers.register", "volunteers.invite", "admission.read", "projects.read"],
  },
  {
    id: "id-cards",
    label: "Credenciales ID",
    title: "Credenciales ID",
    breadcrumb: "Personas",
    path: `${ONG_SHELL_BASE_PATH}/people/id-cards`,
    legacyPath: "/admin/id-cards",
    icon: CreditCard,
    groupId: "personas",
    moduleKeys: ["idcards", "people", "ong"],
    anyPermissions: ["idcards.read"],
  },
  {
    id: "beneficiaries",
    label: "Beneficiarios",
    title: "Beneficiarios",
    breadcrumb: "Personas",
    path: `${ONG_SHELL_BASE_PATH}/people/beneficiaries`,
    legacyPath: "/admin/beneficiaries",
    icon: Heart,
    groupId: "personas",
    moduleKeys: ["people", "ong"],
    anyPermissions: ["admission.read", "projects.read", "home.read"],
  },
  {
    id: "medical-records",
    label: "Ficha medica",
    title: "Ficha medica",
    breadcrumb: "Clinico",
    path: `${ONG_SHELL_BASE_PATH}/clinico/medical-records`,
    legacyPath: "/admin/medical-records",
    icon: ShieldAlert,
    groupId: "clinico",
    moduleKeys: ["clinico", "ong"],
    anyPermissions: ["clinico.volunteer_sensitive.read"],
  },
  {
    id: "admission-requests",
    label: "Solicitudes",
    title: "Solicitudes de admision",
    breadcrumb: "Admision",
    path: `${ONG_SHELL_BASE_PATH}/admission/requests`,
    legacyPath: "/admin/admission/requests",
    icon: UserPlus,
    groupId: "admision",
    moduleKeys: ["admission", "rrhh", "ong"],
    anyPermissions: ["admission.read"],
  },
  {
    id: "admission-documents",
    label: "Documentos",
    title: "Documentos de admision",
    breadcrumb: "Admision",
    path: `${ONG_SHELL_BASE_PATH}/admission/documents`,
    legacyPath: "/admin/admission/documents",
    icon: FileText,
    groupId: "admision",
    moduleKeys: ["admission", "rrhh", "ong"],
    anyPermissions: ["admission.read"],
  },
  {
    id: "admission-interviews",
    label: "Entrevistas",
    title: "Entrevistas",
    breadcrumb: "Admision",
    path: `${ONG_SHELL_BASE_PATH}/admission/interviews`,
    legacyPath: "/admin/admission/interviews",
    icon: Video,
    groupId: "admision",
    moduleKeys: ["admission", "rrhh", "ong"],
    anyPermissions: ["admission.read"],
  },
  {
    id: "admission-onboarding",
    label: "Onboarding",
    title: "Onboarding",
    breadcrumb: "Admision",
    path: `${ONG_SHELL_BASE_PATH}/admission/onboarding`,
    legacyPath: "/admin/admission/onboarding",
    icon: CheckSquare,
    groupId: "admision",
    moduleKeys: ["admission", "rrhh", "ong"],
    anyPermissions: ["admission.read"],
  },
  {
    id: "inventory",
    label: "Inventario",
    title: "Inventario",
    breadcrumb: "Recursos",
    path: `${ONG_SHELL_BASE_PATH}/resources/inventory`,
    legacyPath: "/admin/inventory",
    icon: Package,
    groupId: "recursos",
    moduleKeys: ["resources", "inventory", "ong"],
    anyPermissions: ["resources.inventory.read"],
  },
  {
    id: "finance",
    label: "Finanzas",
    title: "Finanzas",
    breadcrumb: "Recursos",
    path: `${ONG_SHELL_BASE_PATH}/resources/finance`,
    legacyPath: "/admin/finance",
    icon: DollarSign,
    groupId: "recursos",
    moduleKeys: ["resources", "finanzas", "ong"],
    anyPermissions: ["resources.finance.read"],
  },
  {
    id: "courses",
    label: "Cursos y certificados",
    title: "Cursos y certificados",
    breadcrumb: "Recursos",
    path: `${ONG_SHELL_BASE_PATH}/resources/courses`,
    legacyPath: "/admin/courses",
    icon: CheckSquare,
    groupId: "recursos",
    moduleKeys: ["resources", "ong"],
    anyPermissions: ["resources.inventory.read", "resources.finance.read"],
  },
  {
    id: "notifications-templates",
    label: "Plantillas",
    title: "Plantillas",
    breadcrumb: "Notificaciones",
    path: `${ONG_SHELL_BASE_PATH}/notifications/templates`,
    legacyPath: "/admin/notifications/templates",
    icon: Bell,
    groupId: "notificaciones",
    moduleKeys: ["notifications", "comunicaciones", "ong"],
    anyPermissions: ["notifications.read"],
  },
  {
    id: "notifications-history",
    label: "Historial",
    title: "Historial",
    breadcrumb: "Notificaciones",
    path: `${ONG_SHELL_BASE_PATH}/notifications/history`,
    legacyPath: "/admin/notifications/history",
    icon: FileText,
    groupId: "notificaciones",
    moduleKeys: ["notifications", "comunicaciones", "ong"],
    anyPermissions: ["notifications.read"],
  },
  {
    id: "areas",
    label: "Áreas",
    title: "Áreas organizacionales",
    breadcrumb: "Gobernanza",
    path: `${ONG_SHELL_BASE_PATH}/governance/areas`,
    legacyPath: "/admin/areas",
    icon: Layers,
    groupId: "gobernanza",
    moduleKeys: ["governance", "ong"],
    anyPermissions: ["governance.catalogs.read"],
  },
  {
    id: "catalogs",
    label: "Catalogos",
    title: "Catalogos",
    breadcrumb: "Gobernanza",
    path: `${ONG_SHELL_BASE_PATH}/governance/catalogs`,
    legacyPath: "/admin/catalogs",
    icon: Database,
    groupId: "gobernanza",
    moduleKeys: ["governance", "auditoria", "ong"],
    anyPermissions: ["governance.catalogs.read"],
  },
  {
    id: "audit-log",
    label: "Auditoria",
    title: "Auditoria",
    breadcrumb: "Gobernanza",
    path: `${ONG_SHELL_BASE_PATH}/governance/audit-log`,
    legacyPath: "/admin/audit-log",
    icon: FileText,
    groupId: "gobernanza",
    moduleKeys: ["governance", "auditoria", "ong"],
    anyPermissions: ["governance.audit.read"],
  },
  {
    id: "sensitive-access",
    label: "Accesos sensibles",
    title: "Accesos sensibles",
    breadcrumb: "Gobernanza",
    path: `${ONG_SHELL_BASE_PATH}/governance/sensitive-access`,
    legacyPath: "/admin/sensitive-access",
    icon: ShieldAlert,
    groupId: "gobernanza",
    moduleKeys: ["governance", "auditoria", "clinico", "ong"],
    anyPermissions: ["governance.sensitive.read"],
  },
  {
    id: "soft-delete",
    label: "Retencion",
    title: "Retencion y borrado",
    breadcrumb: "Gobernanza",
    path: `${ONG_SHELL_BASE_PATH}/governance/soft-delete`,
    legacyPath: "/admin/soft-delete",
    icon: Trash2,
    groupId: "gobernanza",
    moduleKeys: ["governance", "auditoria", "ong"],
    anyPermissions: ["governance.retention.read", "governance.audit.read"],
  },
  {
    id: "system-users",
    label: "Usuarios del sistema",
    title: "Usuarios del sistema",
    breadcrumb: "Configuracion",
    path: `${ONG_SHELL_BASE_PATH}/settings/users`,
    legacyPath: "/admin/system-users",
    icon: UserCog,
    groupId: "configuracion",
    moduleKeys: ["settings", "ong"],
    anyPermissions: ["settings.users.read"],
  },
  {
    id: "roles",
    label: "Roles y permisos",
    title: "Roles y permisos",
    breadcrumb: "Configuracion",
    path: `${ONG_SHELL_BASE_PATH}/settings/roles`,
    legacyPath: "/admin/roles",
    icon: Shield,
    groupId: "configuracion",
    moduleKeys: ["settings", "ong"],
    anyPermissions: ["settings.roles.read"],
  },
  {
    id: "security",
    label: "Seguridad de sesion",
    title: "Seguridad de sesion",
    breadcrumb: "Configuracion",
    path: `${ONG_SHELL_BASE_PATH}/settings/security`,
    legacyPath: "/admin/security",
    icon: Settings,
    groupId: "configuracion",
    moduleKeys: ["settings", "ong"],
    anyPermissions: ["settings.sessions.read"],
  },
  {
    id: "access-control",
    label: "Control de acceso",
    title: "Control de acceso",
    breadcrumb: "Configuracion",
    path: `${ONG_SHELL_BASE_PATH}/settings/access-control`,
    legacyPath: "/admin/access-control",
    icon: Link2,
    groupId: "configuracion",
    moduleKeys: ["settings", "ong"],
    anyPermissions: ["ace.access_links.manage"],
  },
];

const ROUTE_BY_ID = new Map(ROUTES.map((route) => [route.id, route]));

export function getTenantRouteById(routeId: TenantRouteId) {
  return ROUTE_BY_ID.get(routeId) ?? null;
}

export function listTenantRoutes() {
  return ROUTES;
}

export function findTenantRouteByPath(pathname: string) {
  return (
    ROUTES.find((route) => route.path === pathname || route.legacyPath === pathname) ?? null
  );
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

  const priorityOrder: TenantRouteId[] = [
    "home",
    "projects",
    "operation-attendance",
    "operation-hours",
    "volunteers",
    "admission-requests",
    "inventory",
    "finance",
    "notifications-history",
    "system-users",
    "roles",
    "security",
  ];

  for (const routeId of priorityOrder) {
    const route = getTenantRouteById(routeId);
    if (route && canAccessTenantRoute(context, route)) {
      return route.path;
    }
  }

  return ROUTES[0].path;
}

export function buildTenantSidebar(context: TenantContextValue | null | undefined) {
  if (!context) {
    return [] as TenantSidebarCategory[];
  }

  return NAV_GROUPS.map<TenantSidebarCategory>((group) => ({
    id: group.id,
    label: group.label,
    icon: group.icon,
    items: ROUTES.filter(
      (route) => route.groupId === group.id && canAccessTenantRoute(context, route)
    ).map((route) => ({
      id: route.id,
      label: route.label,
      path: route.path,
      icon: route.icon,
    })),
  })).filter((group) => group.items.length > 0);
}

export function buildTenantCommandRoutes(context: TenantContextValue | null | undefined) {
  if (!context) {
    return [] as TenantRouteDefinition[];
  }

  return ROUTES.filter((route) => canAccessTenantRoute(context, route));
}

export function resolveShortcutTargets(context: TenantContextValue | null | undefined) {
  const candidates: Record<string, TenantRouteId[]> = {
    a: ["operation-attendance"],
    d: ["home"],
    h: ["approvals-hours", "operation-hours"],
    m: ["medical-records"],
    p: ["projects"],
    r: ["admission-requests"],
    v: ["volunteers"],
  };

  return Object.fromEntries(
    Object.entries(candidates).map(([shortcutKey, routeIds]) => {
      const route = routeIds
        .map((routeId) => getTenantRouteById(routeId))
        .find((candidate) => canAccessTenantRoute(context, candidate));
      return [shortcutKey, route?.path ?? null];
    })
  ) as Record<string, string | null>;
}
