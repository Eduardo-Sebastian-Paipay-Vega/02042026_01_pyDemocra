import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTransaccionInventario,
  updateTransaccionInventario,
  removeOrVoidTransaccionInventario,
} from "./inventarioMovimientos.service";
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

describe("Recursos Inventario Movimientos Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-102: createTransaccionInventario propaga error si falta item", async () => {
      await expect(
        createTransaccionInventario({
          itemId: "  ",
          typeCode: "entrada",
          quantity: 10,
        })
      ).rejects.toThrow("El item es obligatorio.");
    });

    it("TST-ERR-103: createTransaccionInventario propaga error si cantidad es menor o igual a cero", async () => {
      await expect(
        createTransaccionInventario({
          itemId: "item-1",
          typeCode: "entrada",
          quantity: -5,
        })
      ).rejects.toThrow("La cantidad debe ser mayor a cero.");
    });

    it("TST-ERR-104: createTransaccionInventario propaga error si el item esta inactivo", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "items") {
          const chain = {
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
            limit: vi.fn().mockReturnThis(),
            then: (resolve: any) => resolve({
              data: [{ id: "item-1", activo: false }],
              error: null,
            }),
          };
          return chain;
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        createTransaccionInventario({
          itemId: "item-1",
          typeCode: "entrada",
          quantity: 10,
        })
      ).rejects.toThrow("El item seleccionado esta inactivo.");
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-105: removeOrVoidTransaccionInventario propaga error si falla la bd al eliminar", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "transacciones_inventario") {
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "503 DB Offline" },
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        removeOrVoidTransaccionInventario({ movementId: "mov-1" })
      ).rejects.toThrow("503 DB Offline");
    });
  });
});
