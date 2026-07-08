import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listGovernanceAuditEvents,
  listGovernanceDeleteAuditEvents,
} from "./audit.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveGovernanceCapabilities: vi.fn(),
    resolveProfileLabels: vi.fn(),
    publicSchema: vi.fn(),
    auditoriaSchema: vi.fn(),
  };
});

describe("Audit Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Injections", () => {
    it("TST-ERR-025: Debe rechazar gracefully si tenantId no se resuelve (Token Expirado)", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadAudit: true,
        warnings: [],
      } as any);

      vi.mocked(shared.getRequiredTenantId).mockRejectedValueOnce(
        new Error("Tenant Id Missing")
      );

      // Cuando publicResult o legacyResult no tengan length y warnings se dispare:
      await expect(
        listGovernanceAuditEvents({
          searchTerm: "",
          schemaName: "all",
          tableName: "all",
          operation: "all",
          actorId: "all",
          dateFrom: null,
          dateTo: null,
        })
      ).rejects.toThrow("No se pudieron cargar los eventos reales de auditoria.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-026: Debe capturar y mapear error de red si falla la query en public (Timeout 503)", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadAudit: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");
      vi.mocked(shared.resolveProfileLabels).mockResolvedValue(new Map());

      const mockQueryChainFail = {
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
          resolve({ data: null, error: { message: "503 Network Error Public" } });
        },
      };

      const mockQueryChainSuccess = {
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
          resolve({ data: [{ id_audit: "1", event_at: "2026-07-08T00:00:00Z" }], error: null });
        },
      };

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChainFail),
      } as any);

      vi.mocked(shared.auditoriaSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChainSuccess),
      } as any);

      const result = await listGovernanceAuditEvents({
        searchTerm: "",
        schemaName: "all",
        tableName: "all",
        operation: "all",
        actorId: "all",
        dateFrom: null,
        dateTo: null,
      });

      // El error publico se captura como warning pero el servicio sigue funcionando
      expect(result.warnings.some(w => w.includes("No se pudo conectar con la base de datos") || w.includes("503 Network Error Public"))).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("TST-ERR-027: Debe arrojar error si ambas promesas fallan y no hay fuentes de auditoria disponibles", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadAudit: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      const mockQueryChainFail = {
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
          resolve({ data: null, error: { message: "503 Database Offline" } });
        },
      };

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChainFail),
      } as any);

      vi.mocked(shared.auditoriaSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChainFail),
      } as any);

      // Como los dos fallan, entra al bloque if (!publicResult.rows.length && !legacyResult.rows.length)
      // y hace throw. El catch superior atrapa ese throw y lanza "No se pudieron cargar los eventos reales de auditoria."
      await expect(
        listGovernanceAuditEvents({
          searchTerm: "",
          schemaName: "all",
          tableName: "all",
          operation: "all",
          actorId: "all",
          dateFrom: null,
          dateTo: null,
        })
      ).rejects.toThrow("No se pudieron cargar los eventos reales de auditoria.");
    });
  });
});
