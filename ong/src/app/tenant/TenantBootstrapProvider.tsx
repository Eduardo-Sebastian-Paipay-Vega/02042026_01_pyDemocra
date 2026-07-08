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
  invalidateTenantBootstrapCache,
  readBootstrapCacheSync,
  BOOTSTRAP_CACHE_KEY,
  type BootstrapCacheEntry,
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
  status: TenantBootstrapStatus;
  message: string | null;
  warnings: string[];
  context: TenantContextValue | null;
  isReady: boolean;
  reload: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccessModule: ReturnType<typeof canAccessModuleWithContext>;
  canAccessRoute: (routeId: TenantRouteId) => boolean;
  resolveInitialPath: () => string | null;
}

const TenantBootstrapContext = createContext<TenantBootstrapContextShape | null>(null);

const UNAUTHENTICATED_RESULT: TenantBootstrapResult = {
  status: "unauthenticated",
  context: null,
  message: null,
  warnings: [],
};

// Lee localStorage sincrónicamente — se ejecuta una sola vez antes del primer render.
// Si hay caché válido, el componente monta con loading=false y contexto listo → sin flicker.
function resolveInitialState(): { result: TenantBootstrapResult; loading: boolean } {
  const cached = readBootstrapCacheSync();
  if (cached?.status === "ready" && cached.context) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[Tenant] Hidratación sincrónica desde localStorage — sin loader.");
    }
    return { result: cached, loading: false };
  }
  return { result: UNAUTHENTICATED_RESULT, loading: true };
}

export function TenantBootstrapProvider({ children }: { children: ReactNode }) {
  // Lazy initializers: se ejecutan síncronamente antes del primer render de React.
  // Si localStorage tiene caché válido, loading arranca en false y no hay flicker.
  const [loading, setLoading] = useState(() => resolveInitialState().loading);
  const [result, setResult] = useState<TenantBootstrapResult>(() => resolveInitialState().result);

  // Ref para acceder al result actual dentro de reload sin hacerlo dependencia del callback.
  // Esto mantiene reload con referencia estable (no se recrea en cada render).
  const resultRef = useRef(result);
  resultRef.current = result;

  const reload = useCallback(async (soft = false) => {
    // Solo bloquea la UI si no hay contexto todavía.
    // Con caché, resultRef.current.context ya existe → el loader nunca aparece.
    if (!soft && !resultRef.current.context) {
      setLoading(true);
    }
    const nextResult = await bootstrapTenantContext();
    setResult(nextResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload(); // Carga inicial: si hay caché → retorna en <1ms sin mostrar loader

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        // JWT rotado por Supabase (~10 min, al volver de otra pestaña).
        // Soft reload: no bloquea UI, usa caché si está vigente.
        void reload(true);
      } else if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Cambio real de identidad → invalida caché y muestra loader si es necesario
        invalidateTenantBootstrapCache();
        void reload(false);
      } else {
        // SIGNED_IN, INITIAL_SESSION: la doble-llamada con useEffect es inofensiva (cache hit)
        void reload(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [reload]);

  // Cross-tab sync: si otra pestaña escribe en localStorage (login/logout/cambio de tenant),
  // esta pestaña recibe el evento "storage" y actualiza su estado sin hacer bootstrap completo.
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== BOOTSTRAP_CACHE_KEY) return;

      if (!event.newValue) {
        // La otra pestaña invalidó el caché (logout) → limpiar estado local
        invalidateTenantBootstrapCache();
        void reload(false);
        return;
      }

      try {
        const entry = JSON.parse(event.newValue) as BootstrapCacheEntry;
        if (entry.result.status === "ready" && entry.result.context) {
          // La otra pestaña completó un bootstrap exitoso → adoptar su resultado
          if (process.env.NODE_ENV === "development") {
            console.debug("[Tenant] Contexto sincronizado desde otra pestaña.");
          }
          setResult(entry.result);
          setLoading(false);
        }
      } catch {
        // JSON inválido — ignorar
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [reload]);

  const value = useMemo<TenantBootstrapContextShape>(
    () => ({
      loading,
      status: result.status,
      message: result.message,
      warnings: result.warnings,
      context: result.context,
      isReady: result.status === "ready" && Boolean(result.context),
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
    [loading, reload, result]
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
