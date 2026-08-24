import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette, useCommandPalette } from "@/core/components/ui/command-palette";
import { HelpAssistant } from "@/core/components/ui/help-assistant";
import { ProjectHierarchySteps } from "@/core/components/shared/ProjectHierarchySteps";
import { RouteLoadingFallback } from "@/core/components/shared/RouteLoadingFallback";
import { useGlobalShortcuts } from "@ong/app/lib/useGlobalShortcuts";
import { ThemeProvider, useTheme } from "@ong/app/lib/theme-context";
import { useHomeNotifications } from "@ong/app/modules/home/useHomeNotifications";
import {  cn  } from "@/core/components/ui/utils";
import { useTenantBootstrap } from "@ong/app/tenant/TenantBootstrapProvider";
import { 
  buildTenantSidebar,
  canAccessTenantRoute,
  findTenantRouteByPath,
  getTenantRouteById,
  normalizeTenantPath,
  resolveShortcutTargets,
 } from "@ong/app/tenant/navigation";
import { storeLastTenantRoute } from "@ong/app/tenant/bootstrap";
import { TenantFinancialBanner } from "@ong/app/tenant/screens";
import { supabase } from "../../modules/ong/supabaseClient";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function AppShellInner() {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [desktopHoverExpanded, setDesktopHoverExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarResetSignal, setSidebarResetSignal] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const tenantBootstrap = useTenantBootstrap();
  const tenantContext = tenantBootstrap.context;
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const { vars } = useTheme();
  const {
    items: homeNotifications,
    loading: homeNotificationsLoading,
    error: homeNotificationsError,
    refresh: refreshHomeNotifications,
  } = useHomeNotifications();

  const desktopSidebarExpanded = !desktopCollapsed || desktopHoverExpanded;
  const sidebarCategories = useMemo(
    () => buildTenantSidebar(tenantContext),
    [tenantContext]
  );
  const shortcutTargets = useMemo(
    () => resolveShortcutTargets(tenantContext),
    [tenantContext]
  );
  const routeMeta = findTenantRouteByPath(location.pathname);
  const searchRoute = getTenantRouteById("search");
  const notificationsRoute = getTenantRouteById("notifications-history");

  useGlobalShortcuts({
    onNavigate: (path) => navigate(normalizeTenantPath(path)),
    onOpenCommandPalette: () => setCmdOpen(true),
    shortcutTargets,
  });

  useEffect(() => {
    if (!tenantContext) {
      return;
    }

    const matchedRoute = findTenantRouteByPath(location.pathname);
    if (!matchedRoute || !canAccessTenantRoute(tenantContext, matchedRoute)) {
      return;
    }

    storeLastTenantRoute(
      tenantContext.user.id,
      tenantContext.tenant.id,
      tenantContext.tenant.industryTypeId,
      matchedRoute.path
    );
  }, [location.pathname, tenantContext]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleMediaQueryChange);
    return () => mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopCollapsed((prev) => !prev);
    setDesktopHoverExpanded(false);
  }, []);

  const handleSidebarHoverStart = useCallback(() => {
    if (!isDesktopViewport() || !desktopCollapsed) {
      return;
    }
    setDesktopHoverExpanded(true);
  }, [desktopCollapsed]);

  const handleSidebarHoverEnd = useCallback(() => {
    if (!isDesktopViewport() || !desktopCollapsed) {
      return;
    }
    setDesktopHoverExpanded(false);
  }, [desktopCollapsed]);

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (sidebarRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest("[data-sidebar-toggle='true']")) {
        return;
      }

      if (isDesktopViewport()) {
        if (!desktopCollapsed || desktopHoverExpanded) {
          setDesktopCollapsed(true);
          setDesktopHoverExpanded(false);
        }
        setSidebarResetSignal((prev) => prev + 1);
        return;
      }

      if (mobileSidebarOpen) {
        setMobileSidebarOpen(false);
        setSidebarResetSignal((prev) => prev + 1);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [desktopCollapsed, desktopHoverExpanded, mobileSidebarOpen]);

  const pageInfo = routeMeta ?? {
    title: tenantContext?.tenant.name ?? "Admin",
  };

  useEffect(() => {
    const pageTitle = routeMeta?.title ?? tenantContext?.tenant.name ?? "Admin";
    document.title = `${pageTitle} · Democra ONG`;
  }, [routeMeta, tenantContext?.tenant.name]);

  return (
    <div
      className="relative min-h-screen overflow-x-clip transition-[background-color] duration-150 ease-out"
      style={{ ...(vars as CSSProperties), background: "var(--t-bg)" }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-300">
        <div
          className="absolute -left-[220px] -top-[280px] h-[560px] w-[560px] rounded-full blur-[200px]"
          style={{ background: "rgba(74,123,167,0.05)" }}
        />
        <div
          className="absolute -right-[180px] top-[16%] h-[420px] w-[420px] rounded-full blur-[180px]"
          style={{ background: "rgba(77,155,143,0.04)" }}
        />
        <div
          className="absolute bottom-[-220px] left-[52%] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[160px]"
          style={{ background: "rgba(212,167,106,0.03)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, var(--t-hover) 0%, transparent 22%, var(--t-hover) 100%)",
          }}
        />
      </div>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => {
            setMobileSidebarOpen(false);
            setSidebarResetSignal((prev) => prev + 1);
          }}
        />
      )}

      <Sidebar
        categories={sidebarCategories}
        expanded={desktopSidebarExpanded}
        desktopCollapsed={desktopCollapsed}
        mobileOpen={mobileSidebarOpen}
        sidebarRef={sidebarRef}
        resetSignal={sidebarResetSignal}
        onToggleDesktop={toggleDesktopSidebar}
        onCloseMobile={() => {
          setMobileSidebarOpen(false);
          setSidebarResetSignal((prev) => prev + 1);
        }}
        onHoverExpandStart={handleSidebarHoverStart}
        onHoverExpandEnd={handleSidebarHoverEnd}
      />

      <div
        className={cn(
          "relative z-10 min-h-screen transition-all duration-150 ease-out md:py-4 md:pr-4 lg:py-5 lg:pr-5",
          desktopSidebarExpanded ? "md:ml-[264px]" : "md:ml-[88px]"
        )}
      >
        <div
          className="flex min-h-screen flex-col md:min-h-[calc(100vh-2rem)] md:rounded-[28px]"
          style={{
            background: "var(--t-board)",
            border: "1px solid var(--t-border-strong)",
            boxShadow: "var(--t-shadow)",
          }}
        >
          <Topbar
            title={pageInfo.title}
            breadcrumb={(pageInfo as any).breadcrumb}
            tenantName={tenantContext?.tenant.name ?? null}
            userLabel={tenantContext?.profile.fullName ?? tenantContext?.user.email ?? null}
            userAvatarUrl={(tenantContext?.profile as any)?.avatarUrl ?? null}
            onProfileClick={() => navigate(normalizeTenantPath("/app/account/profile"))}
            onSettingsClick={() => navigate(normalizeTenantPath("/app/account/settings"))}
            onLogoutClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            onMenuClick={() => {
              if (isDesktopViewport()) {
                toggleDesktopSidebar();
                return;
              }
              setMobileSidebarOpen((prev) => !prev);
            }}
            onSearchClick={() => navigate(searchRoute?.path ?? location.pathname)}
            notifications={homeNotifications}
            notificationsLoading={homeNotificationsLoading}
            notificationsError={homeNotificationsError}
            onRetryNotifications={refreshHomeNotifications}
            notificationsViewAllPath={notificationsRoute?.path}
            onNotificationClick={(path) => navigate(normalizeTenantPath(path))}
            onMarkNotificationRead={(id) => console.log('mark read', id)}
          />

          <main className="mx-auto flex w-full max-w-[1240px] flex-1 px-5 py-6 sm:px-6 lg:px-8">
            <div className="w-full space-y-6">
              <TenantFinancialBanner context={tenantContext} />
              <ProjectHierarchySteps />
              {/* Boundary ajustado: solo el contenido se reemplaza por el
                  fallback mientras carga el chunk de la página — sidebar y
                  topbar (fuera de este Suspense) permanecen montados. */}
              <Suspense fallback={<RouteLoadingFallback fullScreen={false} />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={(path) => navigate(normalizeTenantPath(path))}
      />

      <HelpAssistant />
    </div>
  );
}

export function AppShell() {
  return (
    <ThemeProvider>
      <AppShellInner />
    </ThemeProvider>
  );
}
