import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCuenta,
  updateCuenta,
  listCuentas,
} from "./cuentasFinancieras.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveCurrentTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    finanzasSchema: vi.fn(),
    publicSchema: vi.fn(),
    resolveFinancialAccountTypeCatalog: vi.fn().mockResolvedValue({
      labels: new Map([["efectivo", "Efectivo"]]),
      options: [],
    }),
  };
});

describe("Recursos Cuentas Financieras Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-094: createCuenta propaga error si el tipo de cuenta no esta en el catalogo", async () => {
      await expect(
        createCuenta({
          name: "Caja",
          typeCode: "invalido",
          currency: "PEN",
          balance: 0,
        })
      ).rejects.toThrow("El tipo de cuenta debe seleccionarse desde el catalogo real.");
    });

    it("TST-ERR-095: updateCuenta propaga error si no hay cambios (payload vacio)", async () => {
      await expect(
        updateCuenta({
          accountId: "acc-1",
        })
      ).rejects.toThrow("No hay cambios para actualizar.");
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-096: listCuentas propaga error si falla obtener cuentas por caida de BD", async () => {
      const publicSchemaMock = vi.fn().mockImplementation((table) => {
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
      });

      const finanzasSchemaMock = vi.fn().mockImplementation((table) => {
        if (table === "cuentas") {
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

      vi.mocked(shared.publicSchema).mockReturnValue({ from: publicSchemaMock } as any);
      vi.mocked(shared.finanzasSchema).mockReturnValue({ from: finanzasSchemaMock } as any);

      await expect(
        listCuentas({})
      ).rejects.toThrow("503 DB Offline");
    });
  });
});
