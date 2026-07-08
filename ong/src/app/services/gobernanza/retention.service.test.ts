import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getGovernanceRetentionData,
  restoreGovernanceSoftDeletedRecord,
} from "./retention.service";
import * as shared from "./shared";
import * as auditService from "./audit.service";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveGovernanceCapabilities: vi.fn(),
    resolveActorId: vi.fn(),
    publicSchema: vi.fn(),
    ongSchema: vi.fn(),
    rrhhSchema: vi.fn(),
  };
});

vi.mock("./audit.service", () => ({
  listGovernanceDeleteAuditEvents: vi.fn(),
}));

describe("Retention Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Capabilities", () => {
    it("TST-ERR-031: Debe prevenir restauracion si el usuario no es Tenant Admin (Escalada de Privilegios)", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadRetention: true,
        isTenantAdmin: false, // Falso
        warnings: [],
      } as any);

      await expect(
        restoreGovernanceSoftDeletedRecord("ong", "asistencias", "123")
      ).rejects.toThrow(
        "El restore real se limita a tenant admin hasta que el Core publique un permiso de mutacion dedicado."
      );
    });

    it("TST-ERR-032: Debe rechazar intento de restaurar tablas fuera de la whitelist", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadRetention: true,
        isTenantAdmin: true,
        warnings: [],
      } as any);

      await expect(
        restoreGovernanceSoftDeletedRecord("public", "users", "123")
      ).rejects.toThrow("La entidad solicitada no pertenece a la whitelist de restore real.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-033: El Dashboard de Retencion debe absorber caidas parciales de queries (Timeout 503)", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadRetention: true,
        isTenantAdmin: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      vi.mocked(auditService.listGovernanceDeleteAuditEvents).mockResolvedValueOnce({
        rows: [],
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
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: function (resolve: any, reject: any) {
          resolve({ data: null, error: { message: "503 DB Timeout" } });
        },
      };

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);
      
      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      vi.mocked(shared.rrhhSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      const data = await getGovernanceRetentionData();

      // Debe procesar gracefully a pesar de la caida de todas las fuentes:
      expect(data.retentionDays).toBeNull();
      expect(data.restoreCandidates).toEqual([]);
      expect(data.warnings.length).toBeGreaterThan(0);
      expect(data.warnings.some(w => w.includes("503 DB Timeout"))).toBe(true);
    });
  });
});
