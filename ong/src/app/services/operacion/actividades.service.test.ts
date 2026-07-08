import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listActividades,
  getActividadById,
  createActividad,
  updateActividad,
  addAsignacionActividad,
  getResumenRelacionActividad,
} from "./actividades.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    fetchVolunteerCatalog: vi.fn(),
    fetchLocationCatalog: vi.fn(),
    ongSchema: vi.fn(),
  };
});

describe("Operacion Actividades Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-047: listActividades debe absorber errores de catalogos asincronos sin colapsar", async () => {
      // Mock db returns valid activities
      const mockQuery = {
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
        in: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({
            data: [
              {
                id: "act-1",
                titulo: "Limpieza",
                codigo_estado: "pendiente",
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          });
        },
      };

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQuery),
      } as any);

      // Catalogo de voluntarios y ubicaciones explotan (503)
      vi.mocked(shared.fetchVolunteerCatalog).mockRejectedValue(new Error("503 Volunteers"));
      vi.mocked(shared.fetchLocationCatalog).mockRejectedValue(new Error("503 Locations"));

      const data = await listActividades({
        stateId: "all",
        projectId: "all",
        taskId: "all",
        locationId: "all",
        volunteerId: "all",
        period: "all",
        searchTerm: "",
        page: 1,
        pageSize: 20,
      });

      expect(data.rows.length).toBe(1);
      expect(data.warnings.length).toBeGreaterThan(0);
      expect(data.warnings).toContain("No se pudo cargar el catalogo de voluntarios.");
      expect(data.warnings).toContain("No se pudo cargar el catalogo de ubicaciones.");
    });

    it("TST-ERR-048: getResumenRelacionActividad debe rechazar si fallan conteos (Promise.all)", async () => {
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
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "503 Counts Offline" } });
        },
      };

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      await expect(getResumenRelacionActividad("act-1")).rejects.toThrow("503 Counts Offline");
    });
  });

  describe("SAD PATHS: Injections & Corrupt Payloads", () => {
    it("TST-ERR-049: Debe rechazar fechas invertidas y horas negativas", async () => {
      await expect(
        createActividad({
          projectId: "p1",
          name: "Test",
          startAt: "2026-12-01",
          endAt: "2026-01-01",
        } as any)
      ).rejects.toThrow("La fecha fin no puede ser menor a la fecha inicio.");

      await expect(
        createActividad({
          projectId: "p1",
          name: "Test",
          meta: "-5",
        } as any)
      ).rejects.toThrow("Las horas estimadas deben ser mayores o iguales a cero.");
    });

    it("TST-ERR-050: Debe prevenir asignacion duplicada de voluntario", async () => {
      const mockQuery = {
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
        limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
      };

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await expect(
        addAsignacionActividad({
          activityId: "act-1",
          volunteerId: "vol-1",
        })
      ).rejects.toThrow("El voluntario ya esta asignado a esta actividad.");
    });
  });
});
