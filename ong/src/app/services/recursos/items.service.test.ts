import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createItem,
  updateItem,
  getItemById,
} from "./items.service";
import * as shared from "./shared";
import * as inventarioMovimientosService from "./inventarioMovimientos.service";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveCurrentTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    ongSchema: vi.fn(),
  };
});

vi.mock("./inventarioMovimientos.service", () => ({
  getStockByLocationForItem: vi.fn().mockResolvedValue([]),
  getStockMetricsByItemIds: vi.fn().mockResolvedValue(new Map()),
  listTransaccionesInventario: vi.fn().mockResolvedValue({
    rows: [],
    total: 0,
    page: 1,
    pageSize: 10,
    warnings: [],
  }),
}));

describe("Recursos Items Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-106: createItem propaga error si el nombre esta vacio", async () => {
      await expect(
        createItem({
          code: "IT-1",
          name: "  ",
          unitCode: "unit-1",
          stateCode: "state-1",
        })
      ).rejects.toThrow("El nombre del item es obligatorio.");
    });

    it("TST-ERR-107: createItem propaga error si la unidad de medida falta", async () => {
      await expect(
        createItem({
          code: "IT-1",
          name: "Item 1",
          unitCode: "  ",
          stateCode: "state-1",
        })
      ).rejects.toThrow("La unidad de medida es obligatoria.");
    });

    it("TST-ERR-108: updateItem propaga error si el codigo proporcionado esta vacio", async () => {
      await expect(
        updateItem({
          itemId: "item-1",
          code: "   ",
        })
      ).rejects.toThrow("El codigo del item es obligatorio.");
    });

    it("TST-ERR-109: updateItem propaga error si no hay cambios", async () => {
      await expect(
        updateItem({
          itemId: "item-1",
        })
      ).rejects.toThrow("No hay cambios para actualizar.");
    });
  });

  describe("SAD PATHS: Edge Cases Fallbacks", () => {
    it("TST-ERR-110: getItemById propaga error si el item ya no existe (null return)", async () => {
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
              data: [], // No existe
              error: null,
            }),
          };
          return chain;
        }
        if (table === "unidades_medida" || table === "estados_objeto") {
          return {
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

            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(getItemById("item-1")).rejects.toThrow(
        "El item ya no existe."
      );
    });
  });
});
