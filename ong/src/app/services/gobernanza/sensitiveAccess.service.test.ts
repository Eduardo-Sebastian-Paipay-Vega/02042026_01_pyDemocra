import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getGovernanceSensitiveAccessData,
  createRoleAccessConstraint,
  updateRoleAccessConstraint,
  deleteRoleAccessConstraint,
} from "./sensitiveAccess.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveGovernanceCapabilities: vi.fn(),
    resolveProfileLabels: vi.fn(),
    createTenantScopedQuery: vi.fn(),
    publicSchema: vi.fn(),
    ongSchema: vi.fn(),
    clinicoSchema: vi.fn(),
  };
});

describe("Sensitive Access Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Capabilities", () => {
    it("TST-ERR-034: Debe prevenir mutacion de restricciones si no hay permisos", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canManageConstraints: false,
        warnings: [],
      } as any);

      await expect(
        createRoleAccessConstraint({ roleId: "123" } as any)
      ).rejects.toThrow("No tienes permisos para registrar restricciones de acceso.");
    });
  });

  describe("SAD PATHS: Injections & Corrupt Payloads", () => {
    it("TST-ERR-035: Debe rechazar inputs corruptos en createRoleAccessConstraint", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValue({
        canManageConstraints: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValue("tenant-123");

      // Falta roleId
      await expect(
        createRoleAccessConstraint({ roleId: "" } as any)
      ).rejects.toThrow("No se pudo registrar la restriccion de acceso.");

      // Hora inicio sin hora fin
      await expect(
        createRoleAccessConstraint({ roleId: "1", timeStart: "10:00" } as any)
      ).rejects.toThrow("Debes completar tanto la hora de inicio como la de fin.");

      // CIDR Invalido (Inyeccion SQL / String raro)
      await expect(
        createRoleAccessConstraint({ roleId: "1", ipCidr: "DROP TABLE users;" } as any)
      ).rejects.toThrow("El CIDR/IP contiene caracteres no validos.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-036: Promise.all de logs debe absorber caidas parciales 503", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValueOnce({
        canReadSensitiveAccess: true,
        canReadConstraints: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

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
          resolve({ data: null, error: { message: "503 Log Timeout" } });
        },
      };

      vi.mocked(shared.createTenantScopedQuery).mockReturnValue({
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(mockFail),
      } as any);

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockFail),
      } as any);

      const data = await getGovernanceSensitiveAccessData({
        searchTerm: "",
        actorId: "all",
        dateFrom: null,
        dateTo: null,
        limit: 50,
      });

      // No explota globalmente, los logs vienen vacios y hay warnings:
      expect(data.logRows).toEqual([]);
      expect(data.warnings.length).toBeGreaterThan(0);
    });

    it("TST-ERR-037: Debe mapear fallo de DB asincrono en insert a un error UI friendly", async () => {
      vi.mocked(shared.resolveGovernanceCapabilities).mockResolvedValue({
        canManageConstraints: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValue("tenant-123");

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ data: null, error: { message: "503 Insert Offline" } }),
        }),
      } as any);

      await expect(
        createRoleAccessConstraint({ roleId: "1" } as any)
      ).rejects.toThrow("No se pudo registrar la restriccion de acceso.");
    });
  });
});
