import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCategoria,
  updateCategoria,
  removeOrArchiveCategoria,
  listCategorias,
} from "./categoriasFinancieras.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveCurrentTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    finanzasSchema: vi.fn(),
  };
});

describe("Recursos Categorias Financieras Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-090: createCategoria propaga error si el nombre esta vacio", async () => {
      await expect(
        createCategoria({
          name: "   ",
          type: "ingreso",
        })
      ).rejects.toThrow("El nombre de la categoria es obligatorio.");
    });

    it("TST-ERR-091: updateCategoria propaga error si el tipo es invalido", async () => {
      await expect(
        updateCategoria({
          categoryId: "cat-1",
          type: "invalido",
        })
      ).rejects.toThrow("El tipo de categoria debe ser ingreso o egreso.");
    });
  });

  describe("SAD PATHS: Edge Cases Fallbacks", () => {
    it("TST-ERR-092: removeOrArchiveCategoria propaga toOperationError si falla la eliminacion (foreign key constraint)", async () => {
      const finanzasFromMock = vi.fn().mockImplementation((table) => {
        if (table === "categorias") {
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Violates foreign key constraint" },
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.finanzasSchema).mockReturnValue({ from: finanzasFromMock } as any);

      await expect(removeOrArchiveCategoria("cat-1")).rejects.toThrow(
        "Violates foreign key constraint"
      );
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-093: listCategorias propaga error si falla obtener categorias por caida de BD", async () => {
      const finanzasFromMock = vi.fn().mockImplementation((table) => {
        if (table === "categorias") {
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

            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              count: 0,
              error: { message: "503 DB Offline" },
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.finanzasSchema).mockReturnValue({ from: finanzasFromMock } as any);

      await expect(
        listCategorias({})
      ).rejects.toThrow("503 DB Offline");
    });
  });
});
