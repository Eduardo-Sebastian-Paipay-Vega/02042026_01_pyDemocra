import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSystemUsersData,
  upsertSystemUserAssignments,
  revokeSystemUserAccess,
  provisionSystemUser,
  revokeSystemUserSessions,
} from "./systemUsers.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveSettingsCapabilities: vi.fn(),
    invokeSettingsFunction: vi.fn(),
    publicSchema: vi.fn(),
    ongSchema: vi.fn(),
  };
});

describe("System Users Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Injections", () => {
    it("TST-ERR-016: Debe rechazar provisionamiento de usuario si falta el permiso de gestion", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canManageUsers: false,
        warnings: [],
      } as any);

      await expect(
        provisionSystemUser({ email: "test@test.com", mode: "invite" })
      ).rejects.toThrow("No tienes permisos para provisionar credenciales.");
    });

    it("TST-ERR-017: Debe evitar revocacion de accesos al usuario actual (Self-Revoke Prevencion)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValue({
        canManageUserAssignments: true,
        currentUserId: "my-user-id",
        warnings: [],
      } as any);

      await expect(revokeSystemUserAccess("my-user-id")).rejects.toThrow(
        "No se permite modificar o revocar tus propios accesos desde esta vista."
      );
    });

    it("TST-ERR-018: Debe rechazar contrasenas muy cortas en modo creacion (Inyeccion/Validacion)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canManageUsers: true,
        warnings: [],
      } as any);

      await expect(
        provisionSystemUser({ email: "test@test.com", mode: "create", temporaryPassword: "123" })
      ).rejects.toThrow("La contrasena temporal debe tener al menos 8 caracteres en modo create.");
    });
  });

  describe("SAD PATHS: Corrupt Payloads & Missing Data", () => {
    it("TST-ERR-019: Debe rechazar asignaciones sin datos institucionales", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canManageUserAssignments: true,
        currentUserId: "other-user",
        warnings: [],
      } as any);

      // Envia assignments vacio
      await expect(
        upsertSystemUserAssignments({ userId: "target-user", assignments: [] })
      ).rejects.toThrow("Debes registrar al menos una asignacion institucional.");
    });

    it("TST-ERR-020: Debe detectar y rechazar duplicidad en roles y sedes", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canManageUserAssignments: true,
        currentUserId: "other-user",
        warnings: [],
      } as any);

      await expect(
        upsertSystemUserAssignments({
          userId: "target-user",
          assignments: [
            { roleId: "role-1", sedeId: "sede-1" },
            { roleId: "role-1", sedeId: "sede-1" },
          ],
        })
      ).rejects.toThrow("No repitas el mismo rol en la misma sede.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-021: Debe capturar y propagar error si la red falla en Promise.all (Timeout 503)", async () => {
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadUsers: true,
        canReadRoles: true,
        canReadSessions: true,
        canManageUsers: true,
        warnings: [],
      } as any);
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      const mockQueryChain = {
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
          resolve({ data: null, error: { message: "503 Network Error" } });
        },
      };

      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChain),
      } as any);

      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQueryChain),
      } as any);

      await expect(getSystemUsersData()).rejects.toThrow("No se pudo conectar con la base de datos");
    });
  });
});
