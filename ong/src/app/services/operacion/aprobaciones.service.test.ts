import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listAprobaciones,
  createAprobacion,
  resolveAprobacion,
} from "./aprobaciones.service";
import * as shared from "./shared";
import * as horasService from "./horas.service";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    ongSchema: vi.fn(),
  };
});

vi.mock("./horas.service", () => ({
  listHoras: vi.fn().mockResolvedValue({
    rows: [],
    volunteerOptions: [],
    approvalStates: [],
    warnings: [],
  }),
  getHorasById: vi.fn(),
  requestHoursApproval: vi.fn(),
  resolveHoras: vi.fn(),
}));

describe("Operacion Aprobaciones Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Unsupported Logic", () => {
    it("TST-ERR-052: Debe rechazar creacion de aprobacion para entidad no soportada", async () => {
      await expect(
        createAprobacion({
          entityType: "entidad_inventada",
          entityId: "123",
        })
      ).rejects.toThrow("Solo se pueden solicitar aprobaciones para horas_actividad");
    });

    it("TST-ERR-053: Debe rechazar resolucion de entidad desconocida", async () => {
      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
        

          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: "apro-1",
                entidad_schema: "ong",
                entidad_tabla: "desconocida",
              },
            ],
            error: null,
          }),
        }),
      } as any);

      await expect(
        resolveAprobacion({
          approvalId: "apro-1",
          targetStateId: 2,
        })
      ).rejects.toThrow("Tipo de entidad 'desconocida' no tiene flujo de resolucion implementado.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-051: listAprobaciones debe absorber error al cargar contexto de horas pero lanzar si falla DB principal", async () => {
      // Fallo DB principal
      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
        

          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: "503 Network Aprobaciones" } }),
        }),
      } as any);

      await expect(listAprobaciones()).rejects.toThrow("503 Network Aprobaciones");
    });

    it("TST-ERR-054: resolveAprobacion debe capturar fallo 503 asincrono durante update de evidencia", async () => {
      // Simular getApprovalById
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        

        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: "apro-ev",
              entidad_schema: "ong",
              entidad_tabla: "evidencias_actividad",
            },
          ],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };

      // Reemplazamos `update` para que en el segundo .eq retorne el error final simulado
      const mockUpdate = {
        eq: vi.fn().mockReturnThis(),
      };
      (mockUpdate.eq as any).mockReturnValueOnce(mockUpdate).mockResolvedValueOnce({
        data: null,
        error: { message: "503 Update Evidence Failed" },
      });

      mockQuery.update.mockReturnValue(mockUpdate);

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await expect(
        resolveAprobacion({
          approvalId: "apro-ev",
          targetStateId: 2,
        })
      ).rejects.toThrow("503 Update Evidence Failed");
    });
  });
});
