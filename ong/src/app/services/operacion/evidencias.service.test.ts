import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listEvidencias,
  createEvidencia,
  validateEvidencia,
} from "./evidencias.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    fetchVolunteerCatalog: vi.fn().mockResolvedValue([]),
    fetchEvidenceTypeOptions: vi.fn().mockResolvedValue([]),
    resolveEvidenceTypeId: vi.fn().mockResolvedValue(1),
    buildApprovalStateOptions: vi.fn().mockReturnValue([]),
    ongSchema: vi.fn(),
  };
});

describe("Operacion Evidencias Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Network Failures & Graceful Degradation", () => {
    it("TST-ERR-059: listEvidencias debe absorber fallos asincronos en catálogos", async () => {
      const fromMock = vi.fn().mockImplementation((table) => {
        if (table === "evidencias_actividad") {
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
    range: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "evid-1",
                  id_actividad: "act-1",
                  id_voluntario: "vol-1",
                  url_archivo: "http://foto.jpg",
                  tipo_evidencia: "foto",
                  created_at: new Date().toISOString(),
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

      vi.mocked(shared.fetchVolunteerCatalog).mockRejectedValue(new Error("503 Volunteers"));
      vi.mocked(shared.fetchEvidenceTypeOptions).mockRejectedValue(new Error("503 Types"));

      const data = await listEvidencias({
        activityId: "all",
        volunteerId: "all",
        typeId: "all",
        validation: "all",
        searchTerm: "",
        dateFrom: null,
        dateTo: null,
      });

      expect(data.rows.length).toBe(1);
      expect(data.warnings).toContain("No se pudo cargar el catalogo de voluntarios.");
      expect(data.warnings).toContain("No se pudo cargar el catalogo de tipos de evidencia.");
    });

    it("TST-ERR-061: createEvidencia debe alertar (warning) si la evidencia se guarda pero la insercion de aprobacion falla", async () => {
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

        single: vi.fn(),
      };

      // Primer mock: Inserción de evidencia es exitosa
      mockQuery.single.mockResolvedValueOnce({
        data: { id: "new-ev-1" },
        error: null,
      });

      // Segundo mock: Inserción de aprobación falla
      // @ts-ignore
      // @ts-ignore
      mockQuery.insert.mockReturnValueOnce(mockQuery);
      (mockQuery.insert as any).mockResolvedValueOnce({
        error: { message: "503 Approval Create Failed" },
      });

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await createEvidencia({
        activityId: "act-1",
        routeInput: "http://example.com/foto.jpg",
      });

      expect(result.id).toBe("new-ev-1");
      expect(result.approvalSynced).toBe(false);
      expect(result.warning).toContain("Evidencia registrada, pero no se pudo crear la aprobacion");
      expect(result.warning).toContain("503 Approval Create Failed");
    });
  });

  describe("SAD PATHS: Injections & Blocked Features", () => {
    it("TST-ERR-060: createEvidencia debe rechazar si no hay routeInput ni file", async () => {
      await expect(
        createEvidencia({
          activityId: "act-1",
        } as any)
      ).rejects.toThrow("Debes adjuntar un archivo o ingresar una ruta.");
    });

    it("TST-ERR-062: validateEvidencia debe lanzar error informando que esta bloqueada por SQL maestro", async () => {
      // @ts-ignore
      await expect(
      // @ts-ignore
        validateEvidencia({ evidenceId: "ev-1", validationStatusId: 2 })
      ).rejects.toThrow(
        "La validacion de evidencias no esta documentada en los scripts SQL actuales para ong.evidencias_actividad."
      );
    });
  });
});
