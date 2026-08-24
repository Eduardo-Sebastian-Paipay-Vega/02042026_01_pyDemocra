import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

import { supabase } from "../../../supabaseClient";
import {
  stripAccents,
  normalizeText,
  sanitizeText,
  sanitizeOptionalId,
  sanitizeEmail,
  sanitizePhone,
  normalizeDateValue,
  toFriendlyError,
  uniqueNonEmpty,
  resolvePeopleStatusVariant,
  getRequiredTenantId,
  resolveCurrentUserId,
  resolveActorId,
  resolveProfileLabels,
  resolveRoleNamesByUserId,
  resolveInstitutionalRolesByUserIds,
  resolveSensitiveAccessState,
} from "./shared";

describe("personas/shared.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Funciones puras de texto", () => {
    it("stripAccents elimina tildes", () => {
      expect(stripAccents("Árbol")).toBe("Arbol");
    });

    it("normalizeText elimina acentos y pasa a minusculas", () => {
      expect(normalizeText("Árbol")).toBe("arbol");
      expect(normalizeText(null)).toBe("");
    });

    it("sanitizeEmail pasa a minusculas", () => {
      expect(sanitizeEmail("Correo@Ejemplo.com")).toBe("correo@ejemplo.com");
    });
    
    it("sanitizePhone recorta a 50 char", () => {
      expect(sanitizePhone("a".repeat(100))).toHaveLength(50);
    });

    it("normalizeDateValue valida YYYY-MM-DD", () => {
      expect(normalizeDateValue("2026-01-01")).toBe("2026-01-01");
      expect(normalizeDateValue("2026/01/01")).toBeNull();
    });
  });

  describe("toFriendlyError", () => {
    it("mapea errores de network", () => {
      expect(toFriendlyError(new Error("failed to fetch"), "fallback")).toMatch(/No se pudo conectar/);
    });
    it("mapea errores de permisos (RLS/JWT)", () => {
      expect(toFriendlyError(new Error("new row violates row-level security"), "fallback")).toContain("fallback (new row violates row-level security)");
    });
  });

  describe("uniqueNonEmpty y enum mappings", () => {
    it("elimina nulos y duplicados", () => {
      expect(uniqueNonEmpty([1, null, 2, undefined, 1, 3])).toEqual([1, 2, 3]);
    });

    it("resolvePeopleStatusVariant devuelve variantes correctas", () => {
      expect(resolvePeopleStatusVariant("active")).toBe("success");
      expect(resolvePeopleStatusVariant("inactive")).toBe("secondary");
      expect(resolvePeopleStatusVariant("pending")).toBe("warning");
      // @ts-ignore
      // @ts-ignore
      expect(resolvePeopleStatusVariant("archived")).toBe("info");
    });
  });

  describe("Funciones Supabase", () => {
    it("getRequiredTenantId devuelve el tenant", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: "tenant-xyz", error: null });
      const id = await getRequiredTenantId();
      expect(id).toBe("tenant-xyz");
    });

    it("resolveCurrentUserId devuelve el ID del usuario", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: "user-123" } } } as any);
      const id = await resolveCurrentUserId();
      expect(id).toBe("user-123");
    });

    it("resolveActorId prefiere explicitId", async () => {
      const id = await resolveActorId("explicit-id");
      expect(id).toBe("explicit-id");
    });

    it("resolveProfileLabels recupera nombres por ID", async () => {
      vi.mocked(supabase.in).mockResolvedValueOnce({ data: [{ id: "u1", full_name: "Juan" }], error: null } as any);
      const labels = await resolveProfileLabels(["u1"]);
      expect(labels.get("u1")).toBe("Juan");
    });

    it("resolveRoleNamesByUserId obtiene roles", async () => {
      vi.mocked(supabase.limit).mockResolvedValueOnce({ data: [{ role_id: "r1" }], error: null } as any); // user_roles_sedes
      vi.mocked(supabase.in).mockResolvedValueOnce({ data: [{ id: "r1", name: "Admin" }], error: null } as any); // roles
      
      const roles = await resolveRoleNamesByUserId("u1", "tenant-xyz");
      expect(roles).toEqual(["Admin"]);
    });

    it("resolveSensitiveAccessState devuelve estado de acceso", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: "u1" } } } as any);
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ data: "tenant-xyz", error: null }) // current_tenant_id
        .mockResolvedValueOnce({ data: false, error: null }) // is_tenant_admin
        .mockResolvedValueOnce({ data: true, error: null }); // fn_has_permission (clinico.volunteer_sensitive.read)

      vi.mocked(supabase.limit).mockResolvedValueOnce({ data: [], error: null } as any); // user_roles_sedes for roles
      
      const access = await resolveSensitiveAccessState();
      expect(access.canRead).toBe(false);
      expect(access.canWrite).toBe(false);
    });
  });
});
