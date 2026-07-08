import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listAreas,
  createArea,
  updateArea,
  toggleAreaActive,
} from "./areas.service";
import * as shared from "../proyectos/shared";

vi.mock("../proyectos/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../proyectos/shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveCurrentUserId: vi.fn(),
    ongSchema: vi.fn(),
  };
});

describe("Areas Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Injections", () => {
    it("TST-ERR-022: Debe rechazar peticion si el tenantId no se resuelve (Token invalido)", async () => {
      vi.mocked(shared.getRequiredTenantId).mockRejectedValueOnce(
        new Error("JWT expired")
      );

      await expect(listAreas()).rejects.toThrow("JWT expired");
    });

    it("TST-ERR-023: Debe rechazar inputs corruptos en createArea (Codigo invalido / Inyeccion)", async () => {
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");
      vi.mocked(shared.resolveCurrentUserId).mockResolvedValueOnce("user-1");

      // Codigo con inyeccion o caracteres no permitidos
      await expect(
        createArea({ code: "DROP TABLE areas", name: "Hack", description: "" })
      ).rejects.toThrow("El código solo puede contener letras, números, guiones y guiones bajos.");

      // Codigo vacio
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");
      vi.mocked(shared.resolveCurrentUserId).mockResolvedValueOnce("user-1");
      await expect(
        createArea({ code: "   ", name: "Hack", description: "" })
      ).rejects.toThrow("El código del área es obligatorio.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-024: Debe capturar y propagar error si la red falla en query (Timeout 503)", async () => {
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn((payload) => {
          if (payload && typeof payload === 'object' && Object.values(payload).some(v => v === null)) {
            return Promise.resolve({ data: null, error: { message: 'null value in column violates not-null constraint', code: '23502' } });
          }
          return Promise.resolve({ data: { id: 'mock-id' }, error: null });
        }),
        update: vi.fn((payload) => {
          if (payload && typeof payload === 'object' && Object.values(payload).some(v => v === null)) {
            return Promise.resolve({ data: null, error: { message: 'null value in column violates not-null constraint', code: '23502' } });
          }
          return Promise.resolve({ data: { id: 'mock-id' }, error: null });
        }),

        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "503 Network Error" } });
        },
      };

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChain),
      } as any);

      // As toFriendlyError will convert it:
      await expect(listAreas()).rejects.toThrow("No se pudo cargar las áreas.");
    });
  });
});
