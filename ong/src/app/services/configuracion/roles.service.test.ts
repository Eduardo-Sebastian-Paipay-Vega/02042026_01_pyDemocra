import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRolesSettingsData,
  createRole,
  updateRole,
  deleteRole,
} from "./roles.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn(),
    resolveCurrentUserId: vi.fn(),
    resolveProfileLabels: vi.fn(),
    resolveSettingsCapabilities: vi.fn(),
    publicSchema: vi.fn(),
  };
});

describe("Roles Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Injections", () => {
    it("TST-ERR-006: Debe rechazar obtencion de datos si tenantId no se resuelve (Token invalido)", async () => {
      // @ts-ignore
      // @ts-ignore
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadRoles: true,
        canReadPermissions: true,
        canManageRoles: true,
        warnings: [],
      });
      vi.mocked(shared.getRequiredTenantId).mockRejectedValueOnce(
        new Error("Tenant id is missing")
      );

      await expect(getRolesSettingsData()).rejects.toThrow(
        "No se pudieron cargar los roles y permisos reales."
      );
    });

      // @ts-ignore
    it("TST-ERR-007: Debe bloquear createRole si no hay permisos de gestion", async () => {
      // @ts-ignore
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadRoles: true,
        canReadPermissions: true,
        canManageRoles: false,
        warnings: [],
      });

      await expect(createRole({ name: "Rol Inyectado", hierarchyLevel: 10, permissionIds: [] })).rejects.toThrow(
        "No tienes permisos para crear roles."
      );
    });
      // @ts-ignore
    
    it("TST-ERR-008: Debe rechazar inputs corruptos en updateRole (Inyeccion/Validacion)", async () => {
      // @ts-ignore
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadRoles: true,
        canReadPermissions: true,
        canManageRoles: true,
        warnings: [],
      });

      await expect(updateRole({ roleId: "123", name: "", hierarchyLevel: -1, permissionIds: [] })).rejects.toThrow(
        "El nombre del rol es obligatorio."
      );
    });
  });
      // @ts-ignore

  describe("SAD PATHS: Corrupt Payloads & Missing Data", () => {
    it("TST-ERR-009: Debe manejar el caso de eliminar un rol propio (Self-Delete Prevencion)", async () => {
      // @ts-ignore
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadRoles: true,
        canReadPermissions: true,
        canManageRoles: true,
        warnings: [],
      });
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");
      vi.mocked(shared.resolveCurrentUserId).mockResolvedValueOnce("user-1");

      const mockSchema = vi.fn((...args: any[]) => {
        return {
          from: (table: string) => {
            if (table === "roles") {
               return {
                 select: () => ({ eq: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: [{ id: "role-1", is_system_role: false }], error: null }) }) }) }),
                 delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) })
               }
            }
            if (table === "user_roles_sedes") {
               return {
                 select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: [{ role_id: "role-1" }], error: null }) }) }) }) })
               }
            }
            return {};
          }
        }
      });
      
      vi.mocked(shared.publicSchema).mockImplementation(mockSchema as any);

      await expect(deleteRole("role-1")).rejects.toThrow(
        "No se permite eliminar un rol actualmente asignado a tu usuario"
      );
    });
      // @ts-ignore
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-010: Debe capturar y propagar error si la base de datos falla en Promise.all (Timeout 503)", async () => {
      // @ts-ignore
      vi.mocked(shared.resolveSettingsCapabilities).mockResolvedValueOnce({
        canReadRoles: true,
        canReadPermissions: true,
        canManageRoles: true,
        warnings: [],
      });
      vi.mocked(shared.getRequiredTenantId).mockResolvedValueOnce("tenant-123");

      const mockSchema = vi.fn(() => ({
        from: (table: string) => {
          if (table === "roles") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    order: () => Promise.resolve({ data: null, error: { message: "503 Network Error" } })
                  })
                })
              })
            }
          }
          if (table === "role_permissions") {
             return { select: () => Promise.resolve({ data: [], error: null }) }
          }
          if (table === "user_roles_sedes") {
             return { select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }
          }
          if (table === "cat_permissions") {
             return { select: () => ({ order: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
          }
          if (table === "sedes") {
             return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }
          }
          return {};
        }
      }));

      vi.mocked(shared.publicSchema).mockImplementation(mockSchema as any);

      await expect(getRolesSettingsData()).rejects.toThrow("No se pudo conectar con la base de datos");
    });
  });
});
