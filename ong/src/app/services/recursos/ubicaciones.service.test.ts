import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUbicacion,
  updateUbicacion,
  removeOrArchiveUbicacion,
} from "./ubicaciones.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveCurrentTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    ongSchema: vi.fn(),
  };
});

describe("Recursos Ubicaciones Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-120: createUbicacion propaga error si el codigo esta vacio", async () => {
      await expect(
        createUbicacion({
          code: "  ",
          name: "Ubicacion 1",
        })
      ).rejects.toThrow("El codigo de la ubicacion es obligatorio.");
    });

    it("TST-ERR-121: createUbicacion propaga error si el nombre esta vacio", async () => {
      await expect(
        createUbicacion({
          code: "UB-1",
          name: "   ",
        })
      ).rejects.toThrow("El nombre de la ubicacion es obligatorio.");
    });

    it("TST-ERR-122: updateUbicacion propaga error si falta locationId", async () => {
      await expect(
        updateUbicacion({
          locationId: "  ",
        })
      ).rejects.toThrow("No se encontro la ubicacion a editar.");
    });

    it("TST-ERR-123: updateUbicacion propaga error si no hay cambios", async () => {
      await expect(
        updateUbicacion({
          locationId: "loc-1",
        })
      ).rejects.toThrow("No hay cambios para actualizar.");
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-124: removeOrArchiveUbicacion propaga error si falla update en BD", async () => {
      const chainMock = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "503 DB Offline" },
        }),
      };
      
      vi.mocked(shared.ongSchema).mockReturnValue({ from: vi.fn().mockReturnValue(chainMock) } as any);

      await expect(
        removeOrArchiveUbicacion("loc-1")
      ).rejects.toThrow("503 DB Offline");
    });
  });
});
