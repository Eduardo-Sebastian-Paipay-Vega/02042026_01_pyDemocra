import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTransaccionFinanciera,
  updateTransaccionFinanciera,
  rejectEgreso,
  observeEgreso,
} from "./transaccionesFinancieras.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveCurrentTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    finanzasSchema: vi.fn(),
    ongSchema: vi.fn(),
    loadCatalogRows: vi.fn().mockResolvedValue([]),
    resolveFinancialAccountTypeCatalog: vi.fn().mockResolvedValue({ labels: new Map() }),
  };
});

describe("Recursos Transacciones Financieras Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-113: createTransaccionFinanciera propaga error si falta cuenta", async () => {
      await expect(
        createTransaccionFinanciera({
          accountId: "  ",
          categoryId: "cat-1",
          typeCode: "ingreso",
          amount: 100,
        })
      ).rejects.toThrow("La cuenta es obligatoria.");
    });

    it("TST-ERR-114: createTransaccionFinanciera propaga error si falta categoria", async () => {
      await expect(
        createTransaccionFinanciera({
          accountId: "acc-1",
          categoryId: "  ",
          typeCode: "ingreso",
          amount: 100,
        })
      ).rejects.toThrow("La categoria es obligatoria.");
    });

    it("TST-ERR-115: createTransaccionFinanciera propaga error si el tipo es invalido", async () => {
      await expect(
        createTransaccionFinanciera({
          accountId: "acc-1",
          categoryId: "cat-1",
          typeCode: "invalido",
          amount: 100,
        })
      ).rejects.toThrow("Debes seleccionar un tipo valido.");
    });

    it("TST-ERR-116: createTransaccionFinanciera propaga error si el monto es <= 0", async () => {
      await expect(
        createTransaccionFinanciera({
          accountId: "acc-1",
          categoryId: "cat-1",
          typeCode: "ingreso",
          amount: 0,
        })
      ).rejects.toThrow("El monto debe ser mayor a cero.");
    });

    it("TST-ERR-117: updateTransaccionFinanciera propaga error si falta transactionId", async () => {
      await expect(
        updateTransaccionFinanciera({
          transactionId: "  ",
        })
      ).rejects.toThrow("No se encontro la transaccion a editar.");
    });

    it("TST-ERR-118: rejectEgreso propaga error si no hay comentario", async () => {
      const chainMock = {
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

        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({
          data: [{ tipo: "egreso", created_by: "user-1", id_cuenta: "acc-1", id_categoria: "cat-1", monto: 100 }],
          error: null,
        }),
      };
      
      vi.mocked(shared.finanzasSchema).mockReturnValue({ from: vi.fn().mockReturnValue(chainMock) } as any);
      vi.mocked(shared.ongSchema).mockReturnValue({ from: vi.fn().mockReturnValue(chainMock) } as any);

      await expect(
        rejectEgreso({
          transactionId: "trx-1",
          comment: "   ",
        })
      ).rejects.toThrow("El rechazo requiere un comentario.");
    });

    it("TST-ERR-119: observeEgreso lanza error directamente", async () => {
      await expect(
        observeEgreso({
          transactionId: "trx-1",
          comment: "obs",
        })
      ).rejects.toThrow(
        "finanzas.aprobaciones_transaccion no define un estado observado; usa aprobar o rechazar."
      );
    });
  });
});
