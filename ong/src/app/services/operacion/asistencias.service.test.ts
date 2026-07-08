import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listAsistencias,
  createAsistencia,
  scanAsistenciaByQr,
} from "./asistencias.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    fetchVolunteerCatalog: vi.fn().mockResolvedValue([]),
    fetchProjectCatalog: vi.fn().mockResolvedValue([]),
    fetchActivityCatalog: vi.fn().mockResolvedValue([]),
    ongSchema: vi.fn(),
  };
});

describe("Operacion Asistencias Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Network Failures & Graceful Degradation", () => {
    it("TST-ERR-055: listAsistencias debe absorber fallos en catálogos y advertir", async () => {
      // Supabase rows
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === "asistencias") {
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
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "asist-1",
                  id_actividad: "act-1",
                  id_voluntario: "vol-1",
                  fecha_operacion: "2026-07-08",
                  estado: "presente",
                },
              ],
              error: null,
            }),
          };
        }
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
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: fromMock,
      } as any);

      vi.mocked(shared.fetchVolunteerCatalog).mockRejectedValue(new Error("503 Vol"));
      vi.mocked(shared.fetchProjectCatalog).mockRejectedValue(new Error("503 Proj"));

      const data = await listAsistencias({
        projectId: "all",
        activityId: "all",
        volunteerId: "all",
        status: "all",
        searchTerm: "",
        dateFrom: null,
        dateTo: null,
      });

      expect(data.rows.length).toBe(1);
      expect(data.warnings).toContain("No se pudo cargar el catalogo de voluntarios.");
      expect(data.warnings).toContain("No se pudo cargar el catalogo de proyectos.");
    });
  });

  describe("SAD PATHS: Injections & Logic Errors", () => {
    it("TST-ERR-056: createAsistencia rechaza hora de salida menor a la de entrada", async () => {
      await expect(
        createAsistencia({
          activityId: "act-1",
          volunteerId: "vol-1",
          date: "2026-07-08",
          entryTime: "10:00",
          exitTime: "08:00",
        })
      ).rejects.toThrow("La hora de salida no puede ser anterior a la hora de entrada.");
    });

    it("TST-ERR-057: scanAsistenciaByQr propaga error RPC si es por autorización", async () => {
      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({
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
            data: [{ id: "act-1" }], // Actividad existe
          }),
        }),
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "usuario no autorizado" },
        }),
      } as any);

      // Simular que resolveScanCredential (id_cards) responde bien, y resolveScanOutcome (asistencias) responde bien.
      // Modificamos el mock general solo para el RPC. Espera, get credential and outcome usan `from`.
      // Vamos a mockear individualmente:
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === "actividades") {
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
            limit: vi.fn().mockResolvedValue({ data: [{ id: "act-1" }] }),
          };
        }
        if (table === "id_cards") {
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
              data: [
                {
                  id: "card-1",
                  id_voluntario: "vol-1",
                  estado: "activa",
                  expires_at: null,
                },
              ],
            }),
          };
        }
        if (table === "asistencias") {
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
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "asist-prev", check_out_at: null }],
            }),
          };
        }
      });

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: fromMock,
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "usuario no autorizado" },
        }),
      } as any);

      await expect(
        scanAsistenciaByQr({
          activityId: "act-1",
          qrPayload: "SECRET-QR",
          scanTime: "2026-07-08T10:00:00Z",
        })
      ).rejects.toThrow("No tienes permisos para escanear asistencias. Requiere `attendance.scan` o tenant admin.");
    });

    it("TST-ERR-058: scanAsistenciaByQr rechaza si la credencial está revocada", async () => {
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === "actividades") {
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
            limit: vi.fn().mockResolvedValue({ data: [{ id: "act-1" }] }),
          };
        }
        if (table === "id_cards") {
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
              data: [
                {
                  id: "card-1",
                  id_voluntario: "vol-1",
                  estado: "revocada",
                  expires_at: null,
                },
              ],
            }),
          };
        }
      });

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: fromMock,
      } as any);

      await expect(
        scanAsistenciaByQr({
          activityId: "act-1",
          qrPayload: "SECRET-QR",
        })
      ).rejects.toThrow("La credencial fue revocada y no puede registrar asistencias.");
    });
  });
});
