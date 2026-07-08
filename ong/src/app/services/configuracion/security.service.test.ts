import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSecuritySettingsData,
  terminateSession,
  setDeviceTrust,
  createTerminal,
  updateTerminal,
  deleteTerminal,
} from "./security.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveSettingsCapabilities: vi.fn(),
    resolveProfileLabels: vi.fn(),
    createTenantScopedQuery: vi.fn(),
    publicSchema: vi.fn(),
  };
});

describe("Security Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Injections", () => {
    it("TST-ERR-011: Debe rechazar terminateSession si falta el tenantId (Token invalido)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadSessions: true,
        canReadDevices: true,
        canReadTerminals: true,
        canReadAuthEvents: true,
        canManageSessions: true,
        canManageDevices: true,
        canManageTerminals: true,
        warnings: [],
      });
      vi.mocked(shared.getRequiredTenantId).mockRejectedValueOnce(
        new Error("Tenant id is missing")
      );

      await expect(terminateSession({ sessionId: "123", reason: "test" })).rejects.toThrow(
        "No se pudo cerrar la sesion."
      );
    });

    it("TST-ERR-012: Debe bloquear la edicion de terminales si no hay permisos de gestion", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadSessions: true,
        canReadDevices: true,
        canReadTerminals: true,
        canReadAuthEvents: true,
        canManageSessions: true,
        canManageDevices: true,
        canManageTerminals: false, // Sin permiso
        warnings: [],
      });

      await expect(updateTerminal({ terminalId: "t-1", name: "Inyectado" })).rejects.toThrow(
        "No tienes permisos para editar terminales."
      );
    });
  });

  describe("SAD PATHS: Corrupt Payloads & Missing Data", () => {
    it("TST-ERR-013: Debe manejar gracefully inputs vacios en terminateSession (Inyeccion)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadSessions: true,
        canReadDevices: true,
        canReadTerminals: true,
        canReadAuthEvents: true,
        canManageSessions: true,
        canManageDevices: true,
        canManageTerminals: true,
        warnings: [],
      });

      // sessionId y reason vacios
      await expect(terminateSession({ sessionId: "", reason: "   " })).rejects.toThrow(
        "No se encontro la sesion a cerrar."
      );
    });

    it("TST-ERR-014: Debe arrojar error controlado si la sesion ya esta revocada (Race Condition)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadSessions: true,
        canReadDevices: true,
        canReadTerminals: true,
        canReadAuthEvents: true,
        canManageSessions: true,
        canManageDevices: true,
        canManageTerminals: true,
        warnings: [],
      });
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      vi.mocked(shared.createTenantScopedQuery).mockResolvedValueOnce({
        data: [{ id: "123", revoked_at: "2026-07-08T00:00:00Z" }], // Ya revocada
        error: null,
      });
      const mockQueryChain = { from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
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
 eq: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() };
      vi.mocked(shared.publicSchema).mockReturnValue(mockQueryChain as any);

      await expect(terminateSession({ sessionId: "123", reason: "test" })).rejects.toThrow(
        "La sesion ya fue revocada previamente."
      );
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-015: Debe capturar y propagar error si la red falla en Promise.all de settings (Timeout 503)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadSessions: true,
        canReadDevices: true,
        canReadTerminals: true,
        canReadAuthEvents: true,
        canManageSessions: true,
        canManageDevices: true,
        canManageTerminals: true,
        warnings: [],
      });
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      // Simulamos que el query builder the createTenantScopedQuery devuelve un reject or Promise con error
      const mockQuery = Promise.resolve({ data: null, error: { message: "503 Network Error" } });
      vi.mocked(shared.createTenantScopedQuery).mockReturnValue(mockQuery as any);
      const mockQueryChain = { from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
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
 order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() };
      vi.mocked(shared.publicSchema).mockReturnValue(mockQueryChain as any);

      await expect(getSecuritySettingsData()).rejects.toThrow("No se pudo conectar con la base de datos");
    });
  });
});
