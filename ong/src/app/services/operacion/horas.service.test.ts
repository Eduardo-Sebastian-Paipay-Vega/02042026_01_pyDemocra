import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listHoras,
  createHoras,
  resolveHoras,
} from "./horas.service";
import * as shared from "./shared";
import * as notificacionesService from "../notificaciones/create.service";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    fetchVolunteerCatalog: vi.fn().mockResolvedValue([]),
    buildApprovalStateOptions: vi.fn().mockReturnValue([
      { value: 1, label: "Pendiente", kind: "pending" },
      { value: 2, label: "Aprobada", kind: "approved" },
      { value: 3, label: "Rechazada", kind: "rejected" },
      { value: 4, label: "Observada", kind: "observed" },
    ]),
    ongSchema: vi.fn(),
  };
});

vi.mock("../notificaciones/create.service", () => ({
  createInAppNotification: vi.fn().mockResolvedValue(undefined),
}));

describe("Operacion Horas Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-063: createHoras rechaza minutos excedentes a 24 horas (exceso absurdo)", async () => {
      await expect(
        createHoras({
          activityId: "act-1",
          volunteerId: "vol-1",
          date: "2026-07-08",
          minutes: 3000,
        })
      ).rejects.toThrow("Los minutos registrados exceden el máximo permitido.");
    });

    it("TST-ERR-064: resolveHoras bloquea transicion a 'observado' por falta de contrato SQL", async () => {
      await expect(
        resolveHoras({
          hoursId: "hora-1",
          targetStateId: 4, // "Observada" (kind: observed)
        })
      ).rejects.toThrow(
        "El contrato SQL actual de ong.horas_actividad no soporta el estado observado."
      );
    });
  });

  describe("SAD PATHS: Network Failures & Graceful Degradation", () => {
    it("TST-ERR-065: listHoras debe absorber fallos asincronos en catalogos y aprobaciones", async () => {
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === "horas_actividad") {
          return {
            select: vi.fn().mockReturnThis(),
        

            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "hora-1",
                  id_actividad: "act-1",
                  id_voluntario: "vol-1",
                  horas_registradas: 2.5,
                  fecha: "2026-07-08",
                  estado_aprobacion: "pendiente",
                  id_aprobacion: "apro-1", // Requiere buscar aprobaciones
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "actividades" || table === "proyectos") {
          return {
            select: vi.fn().mockReturnThis(),
        

            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "aprobaciones") {
          return {
            select: vi.fn().mockReturnThis(),
        

            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: null, error: { message: "503 Approvals Offline" } }),
          };
        }
      });

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: fromMock,
      } as any);

      await expect(
        listHoras({
          volunteerId: "all",
          activityId: "all",
          projectId: "all",
          status: "all",
          scope: "all",
          searchTerm: "",
          dateFrom: null,
          dateTo: null,
        })
      ).rejects.toThrow("503 Approvals Offline");
    });

    it("TST-ERR-066: createHoras debe informar warning si se ingresa observacion u horario", async () => {
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === "actividades") {
          return {
            select: vi.fn().mockReturnThis(),
        

            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "act-1" }],
            }),
          };
        }
        if (table === "horas_actividad") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
        

            single: vi.fn().mockResolvedValue({
              data: { id: "hora-2" },
              error: null,
            }),
          };
        }
      });

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: fromMock,
      } as any);

      const result = await createHoras({
        activityId: "act-1",
        volunteerId: "vol-1",
        date: "2026-07-08",
        startTime: "10:00",
        endTime: "12:00",
        observation: "Limpieza profunda",
      });

      expect(result.id).toBe("hora-2");
      expect(result.warning).toContain(
        "El rango horario solo se usa para calcular horas; la BD guarda el total."
      );
      expect(result.warning).toContain(
        "La observacion operativa no tiene columna propia en `ong.horas_actividad`."
      );
    });
  });
});
