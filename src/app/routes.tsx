import * as React from "react";
import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import {
  getIndustryDefinition,
  listActiveIndustryDefinitions,
} from "../core/tenant/industryRegistry";
import { useTenantBootstrap } from "../core/tenant";
import {
  canAccessTenantRoute,
  getTenantRouteById,
  listTenantRedirects,
  listTenantRoutes,
  resolveTenantInitialPath,
} from "../core/tenant/navigation";
import type { TenantRouteId } from "../core/tenant/registry-types";
import { LandingPage } from "../modules/ong/app/pages/landing/LandingPage";
import { LoginPage } from "../modules/ong/app/pages/landing/LoginPage";
import { VolunteerRegistrationPage } from "../modules/ong/app/pages/landing/VolunteerRegistrationPage";
import {
  TenantBootstrapLoadingScreen,
  TenantInlineAccessDenied,
  TenantStatusScreen,
} from "../modules/ong/app/tenant/screens";

function toAppChildPath(absolutePath: string) {
  if (absolutePath.startsWith("/app/")) {
    return absolutePath.slice("/app/".length);
  }

  if (absolutePath === "/app") {
    return "";
  }

  return absolutePath.replace(/^\/+/, "");
}

function RootEntryRedirect() {
  const { loading, status, message, context, resolveInitialPath } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
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

  const industryDefinition = getIndustryDefinition(context.tenant.industryTypeId);
  if (!industryDefinition?.shell || industryDefinition.status !== "active") {
    return (
      <TenantStatusScreen
        status="unsupported_industry"
        message={message}
        context={context}
      />
    );
  }

  const IndustryShell = industryDefinition.shell;
  return <IndustryShell />;
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

  const route = getTenantRouteById(routeId);
  if (!canAccessTenantRoute(context, route)) {
    return <TenantInlineAccessDenied />;
  }

  return <React.Fragment>{children}</React.Fragment>;
}

function LegacyAdminRedirect() {
  const { loading, status, message, context, resolveInitialPath } = useTenantBootstrap();

  if (loading) {
    return <TenantBootstrapLoadingScreen />;
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

const protectedTenantRoutes = listTenantRoutes().map((route) => ({
  path: toAppChildPath(route.path),
  element: (
    <ProtectedTenantRoute routeId={route.id}>{route.element}</ProtectedTenantRoute>
  ),
}));

const industryEntryRoutes = listActiveIndustryDefinitions().map((industryDefinition) => ({
  path: toAppChildPath(industryDefinition.basePath),
  element: <RootEntryRedirect />,
}));

const tenantRedirects = listTenantRedirects().map((redirect) => ({
  path: redirect.from,
  element:
    redirect.from === "/admin" ? (
      <LegacyAdminRedirect />
    ) : (
      <LegacyPathRedirect to={redirect.to} />
    ),
}));

export const router = createBrowserRouter([
  {
    path: "/app/index.html",
    element: <Navigate to="/app" replace />,
  },
  {
    path: "/app",
    element: <RootEntryRedirect />,
  },
  {
    path: "/app/landing",
    Component: LandingPage,
  },
  {
    path: "/app/login",
    Component: LoginPage,
  },
  {
    path: "/app/landing/register",
    Component: VolunteerRegistrationPage,
  },
  {
    path: "/app",
    element: <ProtectedTenantShell />,
    children: [...industryEntryRoutes, ...protectedTenantRoutes],
  },
  ...tenantRedirects,
  {
    path: "*",
    element: <Navigate to="/app" replace />,
  },
]);
