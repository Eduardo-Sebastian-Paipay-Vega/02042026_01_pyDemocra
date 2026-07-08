import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotificationHistoryData,
  getNotificationTopbarItems,
  getNotificationHistoryEntryById,
} from "./history.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveNotificationCapabilities: vi.fn(),
    resolveProfileLabels: vi.fn(),
    comunicacionesSchema: vi.fn(),
  };
});

describe("Notification History Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Capabilities", () => {
    it("TST-ERR-040: Debe retornar defaults si no hay permisos de lectura de historial", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValueOnce({
        canReadHistory: false,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      const data = await getNotificationHistoryData({} as any);
      expect(data.rows).toEqual([]);
      expect(data.total).toBe(0);
    });

    it("Debe bloquear lectura individual de historial sin acceso", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValueOnce({
        canReadHistory: false,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      await expect(getNotificationHistoryEntryById("123")).rejects.toThrow(
        "No tienes acceso para consultar el historial."
      );
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-041: Debe lanzar error amigable si fallan las metricas core o filas en getNotificationHistoryData", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canReadHistory: true,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      const mockFail = {
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
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "503 Network Error" } });
        },
      };

      vi.mocked(shared.comunicacionesSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      await expect(
        getNotificationHistoryData({
          page: 1,
          pageSize: 20,
        } as any)
      ).rejects.toThrow("No se pudo conectar con la base de datos");
    });

    it("TST-ERR-042: Debe absorber errores 503 en accesorias (canales, destinatarios, labels) agregando warnings sin colapsar", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canReadHistory: true,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      const mockSuccessCore = {
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
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({
            data: [
              {
                id: "1",
                id_usuario: "u1",
                codigo_canal: "email",
                titulo: "T",
                mensaje: "M",
                created_at: new Date().toISOString(),
                payload: {},
              },
            ],
            count: 1,
            error: null,
          });
        },
      };

      const mockFailAccessory = {
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
        limit: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "503 Channels Down" } });
        },
      };

      vi.mocked(shared.comunicacionesSchema).mockImplementation(() => {
        return {
          from: (table: string) => {
            if (table === "historial_notificaciones") {
              // Simular que el query core (limit, range, eq count) funciona
              // Pero el accesorio que carga opciones de destinatarios o canales falla.
              // En este test para simplificar hacemos que todas las consultas de la tabla pasen,
              // excepto "canales_notificacion"
              return mockSuccessCore;
            }
            if (table === "canales_notificacion") {
              return mockFailAccessory;
            }
            return mockSuccessCore;
          },
        } as any;
      });

      // Simular que la resolucion de labels explota
      vi.mocked(shared.resolveProfileLabels).mockRejectedValue(new Error("503 Profiles Down"));

      const data = await getNotificationHistoryData({
        page: 1,
        pageSize: 20,
      } as any);

      expect(data.rows.length).toBe(1);
      // El array de warnings crecio debido a las fallas en canales y labels
      expect(data.warnings.length).toBeGreaterThan(0);
      expect(data.channelOptions).toEqual([]);
    });
  });

  describe("SAD PATHS: Injections & Corrupt Payloads", () => {
    it("Debe manejar fechas cruzadas (From > To)", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canReadHistory: true,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      await expect(
        getNotificationHistoryData({
          dateFrom: "2026-12-01",
          dateTo: "2026-01-01",
        } as any)
      ).rejects.toThrow("La fecha inicial no puede ser mayor a la fecha final.");
    });
  });
});
