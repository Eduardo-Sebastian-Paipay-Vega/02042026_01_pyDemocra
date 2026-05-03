import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Sidebar } from "../../modules/ong/app/components/layout/Sidebar";
import { Topbar } from "../../modules/ong/app/components/layout/Topbar";
import {
  CommandPalette,
  useCommandPalette,
} from "../../modules/ong/app/components/ui/command-palette";
import { HelpAssistant } from "../../modules/ong/app/components/ui/help-assistant";
import { useGlobalShortcuts } from "../../modules/ong/app/lib/useGlobalShortcuts";
import { cn } from "../../modules/ong/app/lib/utils";
import { useTenantBootstrap } from "../tenant";
import {
  buildTenantSidebar,
  canAccessTenantRoute,
  findTenantRouteByPath,
  getTenantRouteById,
  normalizeTenantPath,
  resolveShortcutTargets,
} from "../tenant/navigation";
import type { TenantRouteDefinition } from "../tenant/registry-types";
import { storeLastTenantRoute } from "../../modules/ong/app/tenant/bootstrap";
import { supabase } from "../../modules/ong/supabaseClient";
import {
  TenantBootstrapLoadingScreen,
  TenantFinancialBanner,
} from "../../modules/ong/app/tenant/screens";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

interface BaseTenantShellProps {
  themeVars: CSSProperties;
  notifications?: Array<{
    id: string;
    title: string;
    description: string;
    targetPath: string;
  }>;
  notificationsLoading?: boolean;
  notificationsError?: string | null;
  onRetryNotifications?: () => void;
}

export function BaseTenantShell({
  themeVars,
  notifications = [],
  notificationsLoading = false,
  notificationsError = null,
  onRetryNotifications,
}: BaseTenantShellProps) {
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
    breadcrumb: undefined as TenantRouteDefinition["breadcrumb"] | undefined,
  };

  return (
    <div
      className="relative min-h-screen overflow-x-clip transition-[background-color] duration-150 ease-out"
      style={{ ...themeVars, background: "var(--t-bg)" }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-300">
        <div
          className="absolute -left-[220px] -top-[280px] h-[560px] w-[560px] rounded-full blur-[200px]"
          style={{ background: "rgba(117,69,226,var(--t-glow-purple))" }}
        />
        <div
          className="absolute -right-[180px] top-[16%] h-[420px] w-[420px] rounded-full blur-[180px]"
          style={{ background: "rgba(219,112,82,var(--t-glow-orange))" }}
        />
        <div
          className="absolute bottom-[-220px] left-[52%] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[160px]"
          style={{ background: "rgba(85,27,179,var(--t-glow-purple))" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6, 6, 8, 0.12) 0%, rgba(6, 6, 8, 0) 22%, rgba(6, 6, 8, 0.18) 100%)",
          }}
        />
      </div>

      {mobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => {
            setMobileSidebarOpen(false);
            setSidebarResetSignal((prev) => prev + 1);
          }}
        />
      ) : null}

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
            breadcrumb={pageInfo.breadcrumb}
            tenantName={tenantContext?.tenant.name ?? null}
            userLabel={tenantContext?.profile.fullName ?? tenantContext?.user.email ?? null}
            onMenuClick={() => {
              if (isDesktopViewport()) {
                toggleDesktopSidebar();
                return;
              }
              setMobileSidebarOpen((prev) => !prev);
            }}
            onSearchClick={() => navigate(searchRoute?.path ?? location.pathname)}
            onSignOut={async () => {
              await supabase.auth.signOut();
              navigate("/app/login");
            }}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            notificationsError={notificationsError}
            onRetryNotifications={onRetryNotifications}
            notificationsViewAllPath={notificationsRoute?.path}
            onNotificationClick={(path) => navigate(normalizeTenantPath(path))}
          />

          <main className="mx-auto flex w-full max-w-[1240px] flex-1 px-5 py-6 sm:px-6 lg:px-8">
            <div className="w-full space-y-6">
              {tenantBootstrap.refreshing ? (
                <TenantBootstrapLoadingScreen
                  mode="inline"
                  showSkeletons={false}
                  title="Actualizando contexto del tenant"
                  subtitle="Seguimos usando tu sesion actual mientras refrescamos modulos y permisos."
                />
              ) : null}
              <TenantFinancialBanner context={tenantContext} />
              <Outlet />
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
