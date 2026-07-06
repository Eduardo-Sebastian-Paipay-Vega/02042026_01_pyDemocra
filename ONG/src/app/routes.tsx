import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import type { ReactNode } from "react";
import { AppShell } from "./components/layout/AppShell";
import { useTenantBootstrap } from "./tenant/TenantBootstrapProvider";
import {
  canAccessTenantRoute,
  listTenantRoutes,
  resolveTenantInitialPath,
} from "./tenant/navigation";
import { TenantBootstrapLoadingScreen, TenantInlineAccessDenied, TenantStatusScreen } from "./tenant/screens";
import type { TenantRouteId } from "./tenant/navigation";

// Code splitting: cada página se resuelve en su propio chunk, descargado
// solo cuando se navega a esa ruta (en vez de ir todo en el bundle "ong"
// único). AppShell NO se lazifica: es el layout persistente de casi toda
// navegación protegida, cargarlo diferido solo retrasaría el primer render
// sin ahorrar nada.
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const AuditLog = lazy(() => import("./pages/AuditLog").then((m) => ({ default: m.AuditLog })));
const AdmissionDocuments = lazy(() =>
  import("./pages/AdmissionDocuments").then((m) => ({ default: m.AdmissionDocuments }))
);
const AdmissionInterviews = lazy(() =>
  import("./pages/AdmissionInterviews").then((m) => ({ default: m.AdmissionInterviews }))
);
const AdmissionOnboarding = lazy(() =>
  import("./pages/AdmissionOnboarding").then((m) => ({ default: m.AdmissionOnboarding }))
);
const AccessControl = lazy(() =>
  import("./pages/AccessControl").then((m) => ({ default: m.AccessControl }))
);
const Attendance = lazy(() => import("./pages/Attendance").then((m) => ({ default: m.Attendance })));
const AdmissionRequests = lazy(() =>
  import("./pages/AdmissionRequests").then((m) => ({ default: m.AdmissionRequests }))
);
const Approvals = lazy(() => import("./pages/Approvals").then((m) => ({ default: m.Approvals })));
const Beneficiaries = lazy(() =>
  import("./pages/Beneficiaries").then((m) => ({ default: m.Beneficiaries }))
);
const Areas = lazy(() => import("./pages/Areas").then((m) => ({ default: m.Areas })));
const Catalogs = lazy(() => import("./pages/Catalogs").then((m) => ({ default: m.Catalogs })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Evidence = lazy(() => import("./pages/Evidence").then((m) => ({ default: m.Evidence })));
const Courses = lazy(() => import("./pages/Courses").then((m) => ({ default: m.Courses })));
const Finance = lazy(() => import("./pages/Finance").then((m) => ({ default: m.Finance })));
const GlobalSearch = lazy(() =>
  import("./pages/GlobalSearch").then((m) => ({ default: m.GlobalSearch }))
);
const Hours = lazy(() => import("./pages/Hours").then((m) => ({ default: m.Hours })));
const HoursApproval = lazy(() =>
  import("./pages/HoursApproval").then((m) => ({ default: m.HoursApproval }))
);
const IdCards = lazy(() => import("./pages/IdCards").then((m) => ({ default: m.IdCards })));
const Inventory = lazy(() => import("./pages/Inventory").then((m) => ({ default: m.Inventory })));
const MedicalRecords = lazy(() =>
  import("./pages/MedicalRecords").then((m) => ({ default: m.MedicalRecords }))
);
const NotificationHistory = lazy(() =>
  import("./pages/NotificationHistory").then((m) => ({ default: m.NotificationHistory }))
);
const NotificationTemplates = lazy(() =>
  import("./pages/NotificationTemplates").then((m) => ({ default: m.NotificationTemplates }))
);
// Sin uso en el árbol de rutas hoy (ya estaba así antes de este cambio) —
// se deja lazy por consistencia; no afecta el peso del bundle de todos modos.
const PlaceholderPage = lazy(() =>
  import("./pages/PlaceholderPage").then((m) => ({ default: m.PlaceholderPage }))
);
const ProjectActivities = lazy(() =>
  import("./pages/ProjectActivities").then((m) => ({ default: m.ProjectActivities }))
);
const ProjectAssignments = lazy(() =>
  import("./pages/ProjectAssignments").then((m) => ({ default: m.ProjectAssignments }))
);
const Projects = lazy(() => import("./pages/Projects").then((m) => ({ default: m.Projects })));
const Roles = lazy(() => import("./pages/Roles").then((m) => ({ default: m.Roles })));
const Security = lazy(() => import("./pages/Security").then((m) => ({ default: m.Security })));
const SensitiveAccess = lazy(() =>
  import("./pages/SensitiveAccess").then((m) => ({ default: m.SensitiveAccess }))
);
const SoftDelete = lazy(() => import("./pages/SoftDelete").then((m) => ({ default: m.SoftDelete })));
const SystemUsers = lazy(() =>
  import("./pages/SystemUsers").then((m) => ({ default: m.SystemUsers }))
);
const Tasks = lazy(() => import("./pages/Tasks").then((m) => ({ default: m.Tasks })));
const Volunteers = lazy(() => import("./pages/Volunteers").then((m) => ({ default: m.Volunteers })));
const LandingPage = lazy(() =>
  import("./pages/landing/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const VolunteerRegistrationPage = lazy(() =>
  import("./pages/landing/VolunteerRegistrationPage").then((m) => ({
    default: m.VolunteerRegistrationPage,
  }))
);
const AccessCodeRedeemPage = lazy(() =>
  import("./pages/landing/AccessCodeRedeemPage").then((m) => ({
    default: m.AccessCodeRedeemPage,
  }))
);

// URL pública fija: /ong (minúsculas). Debe coincidir con el mapeo de
// vite.config.js (dev) y vercel.json (prod) — el folder físico "ONG/"
// (mayúsculas) es solo una ruta de archivo, no afecta la URL del navegador.
const ROUTER_BASENAME = "/ong";

function RootEntryRedirect() {
  const { loading, status, message, context, resolveInitialPath } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!context || status !== "ready") {
    return <TenantStatusScreen status={status} message={message} context={context} />;
  }

  if (context.financialPolicy.isSuspended) {
    return (
      <TenantStatusScreen
        status="error"
        message={context.financialPolicy.message}
        context={context}
      />
    );
  }

  return <Navigate to={resolveInitialPath() ?? resolveTenantInitialPath(context)} replace />;
}

function ShellIndexRedirect() {
  const { loading, status, message, context, resolveInitialPath } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!context || status !== "ready") {
    return <TenantStatusScreen status={status} message={message} context={context} />;
  }

  if (context.financialPolicy.isSuspended) {
    return (
      <TenantStatusScreen
        status="error"
        message={context.financialPolicy.message}
        context={context}
      />
    );
  }

  return <Navigate to={resolveInitialPath() ?? resolveTenantInitialPath(context)} replace />;
}

function ProtectedTenantShell() {
  const { loading, status, message, context } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!context || status !== "ready") {
    return <TenantStatusScreen status={status} message={message} context={context} />;
  }

  if (context.financialPolicy.isSuspended) {
    return (
      <TenantStatusScreen
        status="error"
        message={context.financialPolicy.message}
        context={context}
      />
    );
  }

  return <AppShell />;
}

function ProtectedTenantRoute({
  routeId,
  children,
}: {
  routeId: TenantRouteId;
  children: ReactNode;
}) {
  const { loading, status, message, context } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
  }

  if (!context || status !== "ready") {
    return <TenantStatusScreen status={status} message={message} context={context} />;
  }

  const route = listTenantRoutes().find((item) => item.id === routeId) ?? null;
  if (!canAccessTenantRoute(context, route)) {
    return <TenantInlineAccessDenied />;
  }

  return <>{children}</>;
}

function LegacyAdminRedirect() {
  const { loading, status, message, context, resolveInitialPath } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!context || status !== "ready") {
    return <TenantStatusScreen status={status} message={message} context={context} />;
  }

  if (context.financialPolicy.isSuspended) {
    return (
      <TenantStatusScreen
        status="error"
        message={context.financialPolicy.message}
        context={context}
      />
    );
  }

  return <Navigate to={resolveInitialPath() ?? resolveTenantInitialPath(context)} replace />;
}

function LegacyPathRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace />;
}

const protectedPage = (routeId: TenantRouteId, element: ReactNode) => ({
  element: <ProtectedTenantRoute routeId={routeId}>{element}</ProtectedTenantRoute>,
});

const legacyRouteRedirects = listTenantRoutes().map((route) => ({
  path: route.legacyPath,
  element:
    route.legacyPath === "/admin" ? (
      <LegacyAdminRedirect />
    ) : (
      <LegacyPathRedirect to={route.path} />
    ),
}));

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootEntryRedirect />,
    },
    {
      path: "/login",
      Component: Login,
    },
    {
      path: "/landing",
      Component: LandingPage,
    },
    {
      path: "/landing/register",
      Component: VolunteerRegistrationPage,
    },
    {
      // Alias público con URL corta para enlaces de invitación: /ong/signup?code=XYZ
      // Mismo componente y misma Edge Function que /landing/register — no duplica lógica.
      path: "/signup",
      Component: VolunteerRegistrationPage,
    },
    {
      // Códigos ACE (STAFF_JOIN / BENEFICIARY_JOIN / GENERIC), generados desde
      // /app/ong/settings/access-control. Distinto del flujo de voluntarios
      // por solicitud de admisión (/signup), que usa su propia Edge Function.
      path: "/join",
      Component: AccessCodeRedeemPage,
    },
    {
      path: "/app/ong",
      element: <ProtectedTenantShell />,
      children: [
        {
          index: true,
          element: <ShellIndexRedirect />,
        },
        {
          path: "home",
          ...protectedPage("home", <Dashboard />),
        },
        {
          path: "search",
          ...protectedPage("search", <GlobalSearch />),
        },
        {
          path: "operation/attendance",
          ...protectedPage("operation-attendance", <Attendance />),
        },
        {
          path: "operation/hours",
          ...protectedPage("operation-hours", <Hours />),
        },
        {
          path: "operation/evidence",
          ...protectedPage("operation-evidence", <Evidence />),
        },
        {
          path: "projects",
          ...protectedPage("projects", <Projects />),
        },
        {
          path: "projects/tasks",
          ...protectedPage("tasks", <Tasks />),
        },
        {
          path: "projects/activities",
          ...protectedPage("project-activities", <ProjectActivities />),
        },
        {
          path: "projects/assignments",
          ...protectedPage("project-assignments", <ProjectAssignments />),
        },
        {
          path: "people/volunteers",
          ...protectedPage("volunteers", <Volunteers />),
        },
        {
          path: "people/id-cards",
          ...protectedPage("id-cards", <IdCards />),
        },
        {
          path: "people/beneficiaries",
          ...protectedPage("beneficiaries", <Beneficiaries />),
        },
        {
          path: "clinico/medical-records",
          ...protectedPage("medical-records", <MedicalRecords />),
        },
        {
          path: "approvals",
          ...protectedPage("approvals", <Approvals />),
        },
        {
          path: "approvals/hours",
          ...protectedPage("approvals-hours", <HoursApproval />),
        },
        {
          path: "admission/requests",
          ...protectedPage("admission-requests", <AdmissionRequests />),
        },
        {
          path: "admission/documents",
          ...protectedPage("admission-documents", <AdmissionDocuments />),
        },
        {
          path: "admission/interviews",
          ...protectedPage("admission-interviews", <AdmissionInterviews />),
        },
        {
          path: "admission/onboarding",
          ...protectedPage("admission-onboarding", <AdmissionOnboarding />),
        },
        {
          path: "resources/inventory",
          ...protectedPage("inventory", <Inventory />),
        },
        {
          path: "resources/finance",
          ...protectedPage("finance", <Finance />),
        },
        {
          path: "resources/courses",
          ...protectedPage("courses", <Courses />),
        },
        {
          path: "notifications/templates",
          ...protectedPage("notifications-templates", <NotificationTemplates />),
        },
        {
          path: "notifications/history",
          ...protectedPage("notifications-history", <NotificationHistory />),
        },
        {
          path: "governance/areas",
          ...protectedPage("areas", <Areas />),
        },
        {
          path: "governance/catalogs",
          ...protectedPage("catalogs", <Catalogs />),
        },
        {
          path: "governance/audit-log",
          ...protectedPage("audit-log", <AuditLog />),
        },
        {
          path: "governance/sensitive-access",
          ...protectedPage("sensitive-access", <SensitiveAccess />),
        },
        {
          path: "governance/soft-delete",
          ...protectedPage("soft-delete", <SoftDelete />),
        },
        {
          path: "settings/users",
          ...protectedPage("system-users", <SystemUsers />),
        },
        {
          path: "settings/roles",
          ...protectedPage("roles", <Roles />),
        },
        {
          path: "settings/security",
          ...protectedPage("security", <Security />),
        },
        {
          path: "settings/access-control",
          ...protectedPage("access-control", <AccessControl />),
        },
      ],
    },
    ...legacyRouteRedirects,
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ],
  {
    basename: ROUTER_BASENAME,
  }
);
