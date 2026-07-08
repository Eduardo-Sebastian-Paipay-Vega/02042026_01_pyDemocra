import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createComprobanteFinanciero,
  updateComprobanteFinanciero,
  listComprobantesByTransaccion,
} from "./comprobantesFinancieros.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    finanzasSchema: vi.fn(),
  };
});

describe("Recursos Comprobantes Financieros Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-097: createComprobanteFinanciero propaga error si falta transaccion", async () => {
      await expect(
        createComprobanteFinanciero({
          transactionId: "  ",
        })
      ).rejects.toThrow("La transaccion es obligatoria para adjuntar comprobante.");
    });

    it("TST-ERR-098: createComprobanteFinanciero propaga error si no hay archivo ni ruta", async () => {
      await expect(
        createComprobanteFinanciero({
          transactionId: "trx-1",
        })
      ).rejects.toThrow("Debes adjuntar archivo o indicar ruta del comprobante.");
    });

    it("TST-ERR-099: createComprobanteFinanciero propaga error si la transaccion no existe", async () => {
      const finanzasFromMock = vi.fn().mockImplementation((table) => {
        if (table === "transacciones") {
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

            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.finanzasSchema).mockReturnValue({ from: finanzasFromMock } as any);

      await expect(
        createComprobanteFinanciero({
          transactionId: "trx-1",
          routeInput: "http://ruta.com/file.jpg",
        })
      ).rejects.toThrow("La transaccion no existe.");
    });

    it("TST-ERR-100: updateComprobanteFinanciero propaga error si el payload esta vacio", async () => {
      await expect(
        updateComprobanteFinanciero({
          receiptId: "rec-1",
        })
      ).rejects.toThrow("No hay cambios para actualizar.");
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-101: listComprobantesByTransaccion propaga error si falla la bd", async () => {
      const finanzasFromMock = vi.fn().mockImplementation((table) => {
        if (table === "comprobantes_financieros") {
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

            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "503 DB Offline" },
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.finanzasSchema).mockReturnValue({ from: finanzasFromMock } as any);

      await expect(
        listComprobantesByTransaccion("trx-1")
      ).rejects.toThrow("503 DB Offline");
    });
  });
});
