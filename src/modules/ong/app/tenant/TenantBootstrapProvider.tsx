import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../supabaseClient";
import {
  bootstrapTenantContext,
  type TenantBootstrapResult,
  type TenantBootstrapStatus,
  type TenantContextValue,
} from "./bootstrap";
import {
  canAccessModule as canAccessModuleWithContext,
  hasAnyPermission as hasAnyPermissionWithContext,
  hasPermission as hasPermissionWithContext,
} from "./permissions";
import {
  canAccessTenantRoute,
  getTenantRouteById,
  resolveTenantInitialPath,
  type TenantRouteId,
} from "./navigation";

interface TenantBootstrapContextShape {
  loading: boolean;
  refreshing: boolean;
  status: TenantBootstrapStatus;
  message: string | null;
  warnings: string[];
  context: TenantContextValue | null;
  isReady: boolean;
  hasCachedContext: boolean;
  reload: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccessModule: (moduleKey: Parameters<typeof canAccessModuleWithContext>[1]) => boolean;
  canAccessRoute: (routeId: TenantRouteId) => boolean;
  resolveInitialPath: () => string | null;
}

const TenantBootstrapContext = createContext<TenantBootstrapContextShape | null>(null);

const INITIAL_RESULT: TenantBootstrapResult = {
  status: "unauthenticated",
  context: null,
  message: null,
  warnings: [],
};

const TENANT_BOOTSTRAP_CACHE_KEY = "democra.tenant.bootstrap.v1";

interface TenantBootstrapCacheRecord {
  storedAt: number;
  result: TenantBootstrapResult;
}

let tenantBootstrapMemoryCache: TenantBootstrapCacheRecord | null = null;
let tenantBootstrapInFlightRequest: Promise<TenantBootstrapResult> | null = null;

function canPersistTenantBootstrapResult(
  result: TenantBootstrapResult
): result is TenantBootstrapResult & { status: "ready"; context: TenantContextValue } {
  return result.status === "ready" && Boolean(result.context);
}

function readTenantBootstrapCache(): TenantBootstrapCacheRecord | null {
  if (tenantBootstrapMemoryCache) {
    return tenantBootstrapMemoryCache;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(TENANT_BOOTSTRAP_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TenantBootstrapCacheRecord>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.storedAt !== "number" ||
      !parsed.result ||
      !canPersistTenantBootstrapResult(parsed.result as TenantBootstrapResult)
    ) {
      return null;
    }

    tenantBootstrapMemoryCache = {
      storedAt: parsed.storedAt,
      result: parsed.result,
    };

    return tenantBootstrapMemoryCache;
  } catch {
    return null;
  }
}

function persistTenantBootstrapCache(result: TenantBootstrapResult) {
  if (!canPersistTenantBootstrapResult(result)) {
    return;
  }

  const nextCache: TenantBootstrapCacheRecord = {
    storedAt: Date.now(),
    result,
  };

  tenantBootstrapMemoryCache = nextCache;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(TENANT_BOOTSTRAP_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // noop
  }
}

function clearTenantBootstrapCache() {
  tenantBootstrapMemoryCache = null;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(TENANT_BOOTSTRAP_CACHE_KEY);
  } catch {
    // noop
  }
}

function requestTenantBootstrapContext() {
  if (!tenantBootstrapInFlightRequest) {
    tenantBootstrapInFlightRequest = bootstrapTenantContext().finally(() => {
      tenantBootstrapInFlightRequest = null;
    });
  }

  return tenantBootstrapInFlightRequest;
}

function buildBackgroundRefreshWarning(message: string | null) {
  return message
    ? `No se pudo refrescar el contexto del tenant. Conservamos la sesion cargada. Detalle: ${message}`
    : "No se pudo refrescar el contexto del tenant. Conservamos la sesion cargada.";
}

export function TenantBootstrapProvider({ children }: { children: ReactNode }) {
  const initialCacheRef = useRef<TenantBootstrapCacheRecord | null>(readTenantBootstrapCache());
  const [result, setResult] = useState<TenantBootstrapResult>(
    () => initialCacheRef.current?.result ?? INITIAL_RESULT
  );
  const [loading, setLoading] = useState(() => !initialCacheRef.current?.result.context);
  const [refreshing, setRefreshing] = useState(false);
  const latestReadyContextRef = useRef<TenantContextValue | null>(
    initialCacheRef.current?.result.context ?? null
  );
  const activeUserIdRef = useRef<string | null>(
    initialCacheRef.current?.result.context?.user.id ?? null
  );

  const applyBootstrapResult = useCallback(
    (nextResult: TenantBootstrapResult, strategy: "blocking" | "background") => {
      if (canPersistTenantBootstrapResult(nextResult)) {
        latestReadyContextRef.current = nextResult.context;
        activeUserIdRef.current = nextResult.context.user.id;
        persistTenantBootstrapCache(nextResult);
        setResult(nextResult);
        return;
      }

      if (strategy === "background" && latestReadyContextRef.current && nextResult.status === "error") {
        setResult((currentResult) => {
          if (!currentResult.context) {
            return nextResult;
          }

          const mergedWarnings = Array.from(
            new Set([
              ...currentResult.warnings,
              ...nextResult.warnings,
              buildBackgroundRefreshWarning(nextResult.message),
            ])
          );

          return {
            ...currentResult,
            warnings: mergedWarnings,
          };
        });
        return;
      }

      latestReadyContextRef.current = null;
      activeUserIdRef.current = null;
      clearTenantBootstrapCache();
      setResult(nextResult);
    },
    []
  );

  const performReload = useCallback(
    async ({ background }: { background: boolean }) => {
      const shouldRefreshInBackground =
        background && Boolean(latestReadyContextRef.current);

      if (shouldRefreshInBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setRefreshing(false);
      }

      const nextResult = await requestTenantBootstrapContext();
      applyBootstrapResult(
        nextResult,
        shouldRefreshInBackground ? "background" : "blocking"
      );

      if (shouldRefreshInBackground) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    },
    [applyBootstrapResult]
  );

  const reload = useCallback(async () => {
    await performReload({ background: true });
  }, [performReload]);

  useEffect(() => {
    void performReload({
      background: Boolean(initialCacheRef.current?.result.context),
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_OUT" || !session?.user) {
        latestReadyContextRef.current = null;
        activeUserIdRef.current = null;
        clearTenantBootstrapCache();
        setRefreshing(false);
        setLoading(false);
        setResult(INITIAL_RESULT);
        return;
      }

      const shouldReloadInBackground =
        Boolean(latestReadyContextRef.current) &&
        (!activeUserIdRef.current || activeUserIdRef.current === session.user.id);

      void performReload({ background: shouldReloadInBackground });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [performReload]);

  const value = useMemo<TenantBootstrapContextShape>(
    () => ({
      loading,
      refreshing,
      status: result.status,
      message: result.message,
      warnings: result.warnings,
      context: result.context,
      isReady: result.status === "ready" && Boolean(result.context),
      hasCachedContext: Boolean(result.context),
      reload,
      hasPermission: (permission) => hasPermissionWithContext(result.context, permission),
      hasAnyPermission: (permissions) =>
        hasAnyPermissionWithContext(result.context, permissions),
      canAccessModule: (moduleKey) => canAccessModuleWithContext(result.context, moduleKey),
      canAccessRoute: (routeId) =>
        canAccessTenantRoute(result.context, getTenantRouteById(routeId)),
      resolveInitialPath: () =>
        result.context ? resolveTenantInitialPath(result.context) : null,
    }),
    [loading, refreshing, reload, result]
  );

  return (
    <TenantBootstrapContext.Provider value={value}>
      {children}
    </TenantBootstrapContext.Provider>
  );
}

export function useTenantBootstrap() {
  const context = useContext(TenantBootstrapContext);
  if (!context) {
    throw new Error("useTenantBootstrap debe usarse dentro de TenantBootstrapProvider.");
  }

  return context;
}

