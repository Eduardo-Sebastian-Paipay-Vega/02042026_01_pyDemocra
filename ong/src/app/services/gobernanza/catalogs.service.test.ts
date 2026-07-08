import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listGovernanceCatalogSummaries,
  listGovernanceCatalogEntries,
} from "./catalogs.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveGovernanceCapabilities: vi.fn(),
    publicSchema: vi.fn(),
    ongSchema: vi.fn(),
    rrhhSchema: vi.fn(),
    comunicacionesSchema: vi.fn(),
  };
});

describe("Catalogs Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Capabilities", () => {
    it("TST-ERR-028: Debe rechazar si no tiene permisos canReadCatalogs (Prevencion de Fuga de Info)", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadCatalogs: false,
        warnings: [],
      } as any);

      await expect(listGovernanceCatalogSummaries()).rejects.toThrow(
        "La vista de catalogos requiere `governance.catalogs.read` o tenant admin."
      );
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-029: Promise.all debe absorber la caida de queries de conteo y retornar null en vez de tumbar la UI", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValue({
        canReadCatalogs: true,
        warnings: [],
      } as any);

      // Simulamos que publicSchema y ongSchema arrojan error o devuelven error en Supabase client
      const mockFail = {
        select: vi.fn().mockResolvedValue({ count: null, error: new Error("503") }),
      };
      
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      vi.mocked(shared.rrhhSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      vi.mocked(shared.comunicacionesSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      const summaries = await listGovernanceCatalogSummaries();
      expect(summaries.length).toBe(13); // Todos los catalogos definidos
      expect(summaries[0].rowCount).toBeNull(); // El catch absorbe el error
    });

    it("TST-ERR-030: listGovernanceCatalogEntries debe manejar gracefully las caidas 503", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValue({
        canReadCatalogs: true,
        warnings: [],
      } as any);

      const mockQueryChainFail = {
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

        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "Network Offline" } });
        },
      };

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChainFail),
      } as any);

      await expect(
        listGovernanceCatalogEntries("public.cat_generos", "")
      ).rejects.toThrow("No se pudo conectar con la base de datos");
    });
  });
});
