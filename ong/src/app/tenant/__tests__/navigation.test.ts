import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTenantRouteById,
  listTenantRoutes,
  findTenantRouteByPath,
  normalizeTenantPath,
  canAccessTenantRoute,
  resolveTenantInitialPath,
  buildTenantSidebar,
  buildTenantCommandRoutes,
  resolveShortcutTargets,
  ONG_SHELL_BASE_PATH,
} from "../navigation";
import { storeLastTenantRoute } from "../bootstrap";

function mockStorage() {
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
    }),
  };
}

describe("navigation.ts — funciones puras de ruteo", () => {
  beforeEach(() => {
    const storage = mockStorage();
    Object.defineProperty(window, "localStorage", { value: storage, writable: true });
    Object.defineProperty(global, "localStorage", { value: storage, writable: true });
  });

  describe("getTenantRouteById / listTenantRoutes / findTenantRouteByPath / normalizeTenantPath", () => {
    it("TST-ERR-216: getTenantRouteById devuelve null para un id inexistente", () => {
      expect(getTenantRouteById("no-existe" as any)).toBeNull();
      expect(getTenantRouteById("home")?.id).toBe("home");
    });

    it("TST-ERR-217: listTenantRoutes devuelve todas las rutas registradas", () => {
      const routes = listTenantRoutes();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.some((r) => r.id === "finance")).toBe(true);
    });

    it("TST-ERR-218: findTenantRouteByPath resuelve por path nuevo o legacyPath", () => {
      expect(findTenantRouteByPath(`${ONG_SHELL_BASE_PATH}/home`)?.id).toBe("home");
      expect(findTenantRouteByPath("/admin")?.id).toBe("home");
      expect(findTenantRouteByPath("/ruta/inexistente")).toBeNull();
    });

    it("TST-ERR-219: normalizeTenantPath mapea legacyPath a la ruta nueva, y deja pasar paths desconocidos", () => {
      expect(normalizeTenantPath("/admin/finance")).toBe(`${ONG_SHELL_BASE_PATH}/resources/finance`);
      expect(normalizeTenantPath("/algo/que/no/existe")).toBe("/algo/que/no/existe");
    });
  });

  describe("canAccessTenantRoute", () => {
    it("TST-ERR-220: devuelve false si falta contexto o ruta", () => {
      expect(canAccessTenantRoute(null, getTenantRouteById("home"))).toBe(false);
      expect(canAccessTenantRoute({} as any, null)).toBe(false);
    });

    it("TST-ERR-221: bloquea si ningun moduleKey de la ruta esta habilitado", () => {
      const ctx = {
        isTenantAdmin: false,
        modules: { home: false, ong: false },
        permissionMap: {},
        tenant: { industryTypeId: "gym" },
      } as any;
      expect(canAccessTenantRoute(ctx, getTenantRouteById("home"))).toBe(false);
    });

    it("TST-ERR-222: permite acceso sin permisos adicionales si la ruta no los requiere", () => {
      const routeWithoutPermissions = { ...getTenantRouteById("home")!, anyPermissions: undefined };
      const ctx = {
        isTenantAdmin: false,
        modules: { home: true },
        permissionMap: {},
        tenant: { industryTypeId: "gym" },
      } as any;
      expect(canAccessTenantRoute(ctx, routeWithoutPermissions)).toBe(true);
    });

    it("TST-ERR-223: admin de tenant siempre pasa el chequeo de permisos", () => {
      const ctx = {
        isTenantAdmin: true,
        modules: { home: true },
        permissionMap: {},
        tenant: { industryTypeId: "gym" },
      } as any;
      expect(canAccessTenantRoute(ctx, getTenantRouteById("home"))).toBe(true);
    });
  });

  describe("resolveTenantInitialPath", () => {
    it("TST-ERR-224: usa la ultima ruta guardada si sigue siendo accesible", () => {
      const ctx = {
        user: { id: "u-priority" },
        tenant: { id: "t-priority", industryTypeId: "ong" },
        modules: { finanzas: true, resources: true, ong: true },
        permissionMap: { "resources.finance.read": true },
        isTenantAdmin: false,
      } as any;

      storeLastTenantRoute(
        ctx.user.id,
        ctx.tenant.id,
        ctx.tenant.industryTypeId,
        `${ONG_SHELL_BASE_PATH}/resources/finance`
      );

      expect(resolveTenantInitialPath(ctx)).toBe(`${ONG_SHELL_BASE_PATH}/resources/finance`);
    });

    it("TST-ERR-225: si ninguna ruta de la priority list es accesible, cae al primer elemento de ROUTES", () => {
      const ctx = {
        user: { id: "u-none" },
        tenant: { id: "t-none", industryTypeId: "gym" },
        modules: {},
        permissionMap: {},
        isTenantAdmin: false,
      } as any;

      const path = resolveTenantInitialPath(ctx);
      expect(path).toBe(listTenantRoutes()[0].path);
    });
  });

  describe("buildTenantSidebar", () => {
    it("TST-ERR-226: devuelve arreglo vacio sin contexto", () => {
      expect(buildTenantSidebar(null)).toEqual([]);
      expect(buildTenantSidebar(undefined)).toEqual([]);
    });

    it("TST-ERR-227: solo incluye grupos con al menos una ruta accesible", () => {
      const ctx = {
        isTenantAdmin: false,
        modules: { home: true, ong: true },
        permissionMap: { "home.read": true },
        tenant: { industryTypeId: "ong" },
      } as any;

      const sidebar = buildTenantSidebar(ctx);
      expect(sidebar.every((group) => group.items.length > 0)).toBe(true);
      expect(sidebar.some((group) => group.id === "home")).toBe(true);
      expect(sidebar.some((group) => group.id === "recursos")).toBe(false);
    });

    it("TST-ERR-228: admin de tenant ve todos los grupos con al menos una ruta", () => {
      const ctx = {
        isTenantAdmin: true,
        modules: { ong: true },
        permissionMap: {},
        tenant: { industryTypeId: "ong" },
      } as any;

      const sidebar = buildTenantSidebar(ctx);
      const totalItems = sidebar.reduce((acc, group) => acc + group.items.length, 0);
      expect(totalItems).toBe(listTenantRoutes().length);
    });
  });

  describe("buildTenantCommandRoutes", () => {
    it("TST-ERR-229: devuelve arreglo vacio sin contexto", () => {
      expect(buildTenantCommandRoutes(null)).toEqual([]);
    });

    it("TST-ERR-230: filtra solo las rutas accesibles para el contexto dado", () => {
      const ctx = {
        isTenantAdmin: false,
        modules: { home: true, ong: true },
        permissionMap: { "home.read": true },
        tenant: { industryTypeId: "ong" },
      } as any;

      const routes = buildTenantCommandRoutes(ctx);
      expect(routes.every((route) => canAccessTenantRoute(ctx, route))).toBe(true);
      expect(routes.length).toBeLessThan(listTenantRoutes().length);
    });
  });

  describe("resolveShortcutTargets", () => {
    it("TST-ERR-231: sin contexto, todos los atajos resuelven a null", () => {
      const targets = resolveShortcutTargets(null);
      expect(Object.values(targets).every((path) => path === null)).toBe(true);
    });

    it("TST-ERR-232: resuelve el primer candidato accesible por atajo, o null si ninguno aplica", () => {
      const ctx = {
        isTenantAdmin: false,
        modules: { ong: true, operation: true },
        permissionMap: { "operation.hours.approve": true },
        tenant: { industryTypeId: "ong" },
      } as any;

      const targets = resolveShortcutTargets(ctx);
      // "h" -> ["approvals-hours", "operation-hours"], el primero accesible gana.
      expect(targets.h).toBe(getTenantRouteById("approvals-hours")!.path);
      // "m" -> ["medical-records"], no accesible en este contexto.
      expect(targets.m).toBeNull();
    });
  });
});
