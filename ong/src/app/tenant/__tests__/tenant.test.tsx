/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, render, screen } from "@testing-library/react";
import React, { useEffect } from "react";
import { supabase } from "../../../supabaseClient";

// Import modules under test
import {
  hasPermission,
  hasAnyPermission,
  canAccessModule,
  isFinanciallySuspended,
  isFinanciallyReadOnly
} from "../permissions";

import {
  bootstrapTenantContext,
  invalidateTenantBootstrapCache,
  readBootstrapCacheSync,
  BOOTSTRAP_CACHE_KEY,
  getStoredLastTenantRoute,
  storeLastTenantRoute
} from "../bootstrap";

import {
  TenantBootstrapProvider,
  useTenantBootstrap
} from "../TenantBootstrapProvider";

import {
  resolveTenantInitialPath,
  canAccessTenantRoute,
  getTenantRouteById,
  ONG_SHELL_BASE_PATH
} from "../navigation";

// Mock Supabase
vi.mock("../../../supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    schema: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        limit: vi.fn().mockReturnThis()
      }))
    })),
    rpc: vi.fn()
  }
}));

describe("Tenant & Bootstrapping (Zero-Fail Tolerance)", () => {
  const mockStorage = () => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocked storage
    Object.defineProperty(window, 'localStorage', { value: mockStorage(), writable: true });
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage(), writable: true });
    // Also mock global for Node env if window is not used directly in some cases
    Object.defineProperty(global, 'localStorage', { value: mockStorage(), writable: true });
    Object.defineProperty(global, 'sessionStorage', { value: mockStorage(), writable: true });
    
    invalidateTenantBootstrapCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. RBAC (permissions.ts)", () => {
    const mockContext = {
      isTenantAdmin: false,
      permissionMap: {
        "projects.read": true,
        "operation.hours.manage": false
      },
      modules: {
        ong: true,
        projects: true,
        finanzas: false
      },
      tenant: {
        industryTypeId: "ong"
      },
      financialPolicy: {
        isSuspended: true,
        isReadOnly: true
      }
    } as any;

    it("TST-ERR-200: hasPermission maneja null/undefined de forma segura", () => {
      expect(hasPermission(null, "projects.read")).toBe(false);
      expect(hasPermission(undefined, "projects.read")).toBe(false);
      expect(hasPermission(mockContext, "")).toBe(false);
    });

    it("TST-ERR-201: hasPermission evalúa admin universalmente", () => {
      expect(hasPermission({ ...mockContext, isTenantAdmin: true }, "non.existent")).toBe(true);
    });

    it("TST-ERR-202: hasPermission valida mapa estricto", () => {
      expect(hasPermission(mockContext, "projects.read")).toBe(true);
      expect(hasPermission(mockContext, "operation.hours.manage")).toBe(false);
    });

    it("TST-ERR-203: hasAnyPermission maneja arrays vacíos y fallbacks", () => {
      expect(hasAnyPermission(null, ["projects.read"])).toBe(false);
      expect(hasAnyPermission(mockContext, [])).toBe(false);
      expect(hasAnyPermission(mockContext, ["operation.hours.manage", "projects.read"])).toBe(true);
    });

    it("TST-ERR-204: canAccessModule resuelve dependencias implícitas (ONG)", () => {
      expect(canAccessModule(null, "projects")).toBe(false);
      // Explícito true
      expect(canAccessModule(mockContext, "projects")).toBe(true);
      // Implícito false -> fallback ONG
      expect(canAccessModule(mockContext, "home")).toBe(true);
    });

    it("TST-ERR-205: Políticas financieras de solo lectura y suspensión", () => {
      expect(isFinanciallySuspended(mockContext)).toBe(true);
      expect(isFinanciallyReadOnly(mockContext)).toBe(true);
      expect(isFinanciallySuspended(null)).toBe(false);
    });
  });

  describe("2. Cache Hydration v2 & LocalStorage (bootstrap.ts)", () => {
    it("TST-ERR-206: Resiste localStorage corrupto sin lanzar excepciones (Hydration Crash)", () => {
      localStorage.setItem(BOOTSTRAP_CACHE_KEY, "{ bad json");
      const cache = readBootstrapCacheSync();
      expect(cache).toBeNull();
    });

    it("TST-ERR-207: Invalida caché antigua (TTL > 5 min)", () => {
      const past = Date.now() - 6 * 60 * 1000;
      localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify({ userId: "123", result: { status: "ready" }, at: past }));
      const cache = readBootstrapCacheSync();
      expect(cache).toBeNull();
      expect(localStorage.getItem(BOOTSTRAP_CACHE_KEY)).toBeNull();
    });

    it("TST-ERR-208: LastRoute manipulación segura", () => {
      storeLastTenantRoute("u1", "t1", "ong", "/app/ong/projects");
      expect(getStoredLastTenantRoute("u1", "t1", "ong")).toBe("/app/ong/projects");
      
      // Simula modo privado / quota exceeded
      const setItemMock = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error("Quota Exceeded");
      });
      expect(() => storeLastTenantRoute("u2", "t2", "gym", "/test")).not.toThrow();
      setItemMock.mockRestore();
    });
  });

  describe("3. Tenant Resolution (bootstrap.ts)", () => {
    const mockAuthUser = { id: "u1", email: "test@test.com" };
    const mockProfile = { id: "p1", tenant_id: "t1", full_name: "Test" };
    const mockTenant = { id: "t1", name: "Org", industry_type_id: "ong", status_financial_id: "FIN-ACTIVE" };

    it("TST-ERR-209: Rechaza gracefully cuando no hay perfil (missing_profile)", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
      const schemaMock = supabase.schema as any;
      schemaMock.mockImplementationOnce(() => ({
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) })
      }));

      const res = await bootstrapTenantContext();
      expect(res.status).toBe("missing_profile");
    });

    it("TST-ERR-210: Soporta caídas de red en fetch de tenant (503 Timeout)", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
      const schemaMock = supabase.schema as any;
      
      schemaMock.mockImplementationOnce(() => ({
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile }) }) }) })
      }));
      schemaMock.mockImplementationOnce(() => ({
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ error: new Error("Network Error") }) }) }) })
      }));

      const res = await bootstrapTenantContext();
      expect(res.status).toBe("error");
      expect(res.message).toBe("Network Error");
    });

    it("TST-ERR-211: Tenant inexistente o inaccesible (invalid_tenant)", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
      const schemaMock = supabase.schema as any;
      
      schemaMock.mockImplementationOnce(() => ({
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile }) }) }) })
      }));
      schemaMock.mockImplementationOnce(() => ({
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) })
      }));

      const res = await bootstrapTenantContext();
      expect(res.status).toBe("invalid_tenant");
    });

    it("TST-ERR-212: Fallo en rpc permissions no aborta bootstrap entero (Graceful Degradation)", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
      
      const selectChain = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockTenant }),
        limit: vi.fn().mockResolvedValue({ data: [] })
      };
      const fromMock = vi.fn((table) => {
        if (table === "profiles") return { select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile }) }) }) };
        if (table === "tenants") return { select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: mockTenant }) }) }) };
        return { select: () => selectChain };
      });

      (supabase.schema as any).mockImplementation(() => ({ from: fromMock }));
      
      // Simula fallo del RPC
      (supabase.rpc as any).mockResolvedValue({ error: new Error("RPC timeout") });

      const res = await bootstrapTenantContext();
      expect(res.status).toBe("ready");
      expect(res.warnings.length).toBeGreaterThan(0);
      expect(res.warnings.some(w => w.includes("No se pudo validar"))).toBe(true);
    });
  });

  describe("4. Routing Inicial & Provider (navigation.tsx / Provider)", () => {
    it("TST-ERR-213: canAccessTenantRoute bloquea rutas sin permisos/módulos", () => {
      const ctx = {
        modules: { projects: false },
        permissionMap: { "projects.read": false },
        tenant: { industryTypeId: "gym" }
      } as any;
      const route = getTenantRouteById("projects");
      expect(canAccessTenantRoute(ctx, route)).toBe(false);
    });

    it("TST-ERR-214: resolveTenantInitialPath usa priority list ante LastRoute ausente o sin permisos", () => {
      const ctx = {
        user: { id: "u1" },
        tenant: { id: "t1", industryTypeId: "ong" },
        modules: { home: false, projects: true }, // Home deshabilitado (forzado), projects ok
        permissionMap: { "projects.read": true },
        isTenantAdmin: false
      } as any;

      // Al no poder acceder a home, debe saltar a projects
      const path = resolveTenantInitialPath(ctx);
      expect(path).toBe(`${ONG_SHELL_BASE_PATH}/projects`);
    });

    it("TST-ERR-215: Provider maneja el storage event sync sin crash (Cross-tab)", () => {
      // Configuramos caché válida para que el Provider no se quede pillado en unauth
      const cacheData = {
        userId: "u1",
        at: Date.now(),
        result: { status: "ready", context: { test: 1 } }
      };
      localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(cacheData));

      function TestComponent() {
        const { isReady, context } = useTenantBootstrap();
        return <div data-testid="ready">{isReady ? "YES" : "NO"}</div>;
      }

      render(
        <TenantBootstrapProvider>
          <TestComponent />
        </TenantBootstrapProvider>
      );

      expect(screen.getByTestId("ready").textContent).toBe("YES");

      // Simulamos evento storage con json corrupto
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", {
          key: BOOTSTRAP_CACHE_KEY,
          newValue: "{ bad json }"
        }));
      });

      // Debe ignorar el error y mantener el estado
      expect(screen.getByTestId("ready").textContent).toBe("YES");

      // Simula logout en otra pestaña
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", {
          key: BOOTSTRAP_CACHE_KEY,
          newValue: null
        }));
      });
      
      // Limpia todo
      expect(localStorage.getItem(BOOTSTRAP_CACHE_KEY)).toBeNull();
    });
  });
});
