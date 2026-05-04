import { createBrowserRouter, Navigate } from "react-router";
import type { ReactNode } from "react";
import { AppShell } from "./components/layout/AppShell";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { AuditLog } from "./pages/AuditLog";
import { AdmissionDocuments } from "./pages/AdmissionDocuments";
import { AdmissionInterviews } from "./pages/AdmissionInterviews";
import { AdmissionOnboarding } from "./pages/AdmissionOnboarding";
import { Attendance } from "./pages/Attendance";
import { AdmissionRequests } from "./pages/AdmissionRequests";
import { Approvals } from "./pages/Approvals";
import { Beneficiaries } from "./pages/Beneficiaries";
import { Areas } from "./pages/Areas";
import { Catalogs } from "./pages/Catalogs";
import { Dashboard } from "./pages/Dashboard";
import { Evidence } from "./pages/Evidence";
import { Courses } from "./pages/Courses";
import { Finance } from "./pages/Finance";
import { GlobalSearch } from "./pages/GlobalSearch";
import { Hours } from "./pages/Hours";
import { HoursApproval } from "./pages/HoursApproval";
import { IdCards } from "./pages/IdCards";
import { Inventory } from "./pages/Inventory";
import { MedicalRecords } from "./pages/MedicalRecords";
import { NotificationHistory } from "./pages/NotificationHistory";
import { NotificationTemplates } from "./pages/NotificationTemplates";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProjectActivities } from "./pages/ProjectActivities";
import { ProjectAssignments } from "./pages/ProjectAssignments";
import { Projects } from "./pages/Projects";
import { Roles } from "./pages/Roles";
import { Security } from "./pages/Security";
import { SensitiveAccess } from "./pages/SensitiveAccess";
import { SoftDelete } from "./pages/SoftDelete";
import { SystemUsers } from "./pages/SystemUsers";
import { Tasks } from "./pages/Tasks";
import { Volunteers } from "./pages/Volunteers";
import { LandingPage } from "./pages/landing/LandingPage";
import { VolunteerRegistrationPage } from "./pages/landing/VolunteerRegistrationPage";
import { useTenantBootstrap } from "./tenant/TenantBootstrapProvider";
import {
  canAccessTenantRoute,
  listTenantRoutes,
  resolveTenantInitialPath,
} from "./tenant/navigation";
import { TenantBootstrapLoadingScreen, TenantInlineAccessDenied, TenantStatusScreen } from "./tenant/screens";
import type { TenantRouteId } from "./tenant/navigation";

function resolveRouterBasename() {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname === "/ONG" || window.location.pathname.startsWith("/ONG/")
    ? "/ONG"
    : "/";
}

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
      // Receives cross-port token relay from localhost:5173/login
      // Supabase picks up #access_token from the URL hash automatically (detectSessionInUrl: true)
      path: "/auth/callback",
      Component: AuthCallback,
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
      ],
    },
    ...legacyRouteRedirects,
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ],
  {
    basename: resolveRouterBasename(),
  }
);
