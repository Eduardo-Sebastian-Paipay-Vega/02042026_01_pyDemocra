import { describe, it, expect, vi, beforeEach } from "vitest";
import { ongClient, fetchOngVolunteersPreview, fetchOngVolunteerStates } from "./client";

// Mock core supabase manager to avoid env vars requirements
vi.mock("../core", () => ({
  createSupabaseModuleManager: vi.fn(() => ({
    getPublicClient: vi.fn(() => ({
      schema: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(),
    })),
    getServiceClient: vi.fn(),
  })),
}));

// Since the mock applies globally, ongClient now has these vi.fn() properties

describe("ONG Supabase Client & Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchOngVolunteersPreview", () => {
    it("debe retornar datos correctamente", async () => {
      const mockData = [{ id: 1, nombre: "Juan" }];
      // Setup mock chain resolving to data
      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      // Permitir encadenamiento de multiples order
      ((ongClient as any).order as any).mockReturnValue({
        order: vi.fn().mockReturnValue({ limit: mockLimit }),
        limit: mockLimit,
      });

      const result = await fetchOngVolunteersPreview(10);
      expect(ongClient.schema).toHaveBeenCalledWith("ong");
      expect(ongClient.from).toHaveBeenCalledWith("voluntarios");
      expect((ongClient as any).select).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockData);
    });

    it("debe lanzar error si la query falla", async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: "Error DB" } });
      ((ongClient as any).order as any).mockReturnValue({
        order: vi.fn().mockReturnValue({ limit: mockLimit }),
        limit: mockLimit,
      });

      await expect(fetchOngVolunteersPreview()).rejects.toThrow("ONG query failed: Error DB");
    });
  });

  describe("fetchOngVolunteerStates", () => {
    it("debe retornar estados correctamente", async () => {
      const mockData = [{ codigo: "ACTIVO", nombre_estado: "Activo" }];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      ((ongClient as any).select as any).mockReturnValue({ order: mockOrder });

      const result = await fetchOngVolunteerStates();
      expect(ongClient.from).toHaveBeenCalledWith("estados_voluntario");
      expect(result).toEqual(mockData);
    });

    it("debe lanzar error si la query falla", async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: "Error DB" } });
      ((ongClient as any).select as any).mockReturnValue({ order: mockOrder });

      await expect(fetchOngVolunteerStates()).rejects.toThrow("ONG volunteer states query failed: Error DB");
    });
  });
});

