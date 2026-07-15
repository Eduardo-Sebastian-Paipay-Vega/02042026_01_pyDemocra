import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
  },
}));

import { supabase } from "../../../supabaseClient";
import {
  listAccessLinks,
  createAccessLink,
  revokeAccessLink,
  updateAccessLink,
  listMemberships,
  deactivateMembership,
  listAssignableRoles,
  listAssignableSedes,
  validateAccessCode,
  completeAccessOnboarding,
} from "./ace.service";

describe("ace/ace.service.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Access Links", () => {
    it("listAccessLinks llama a supabase con filtros", async () => {
            vi.mocked(supabase.limit).mockResolvedValueOnce({ data: [], error: null } as any);
      
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: "tenant-xyz", error: null });
      const res = await listAccessLinks({ type: "onboarding", isActive: true });
      expect(res).toEqual([]);
      expect(supabase.eq).toHaveBeenCalledWith("type", "onboarding");
      expect(supabase.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("createAccessLink inserta y retorna data", async () => {
            vi.mocked(supabase.single).mockResolvedValueOnce({ data: { id: "new-link" }, error: null } as any);

      const res = await createAccessLink({ type: "onboarding", targetType: "volunteer" });
      expect(res).toEqual({ id: "new-link" });
      expect(supabase.insert).toHaveBeenCalled();
    });

    it("revokeAccessLink desactiva el link", async () => {
            vi.mocked(supabase.eq).mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) } as any);

      await revokeAccessLink("link-1");
      expect(supabase.update).toHaveBeenCalledWith({ is_active: false });
    });

    it("updateAccessLink actualiza campos", async () => {
            vi.mocked(supabase.single).mockResolvedValueOnce({ data: { id: "link-1" }, error: null } as any);

      await updateAccessLink("link-1", { maxUses: 5 });
      expect(supabase.update).toHaveBeenCalledWith({ max_uses: 5 });
    });
  });

  describe("Memberships", () => {
    it("listMemberships filtra correctamente", async () => {
            vi.mocked(supabase.limit).mockResolvedValueOnce({ data: [], error: null } as any);
      
      await listMemberships({ status: "active" });
      expect(supabase.eq).toHaveBeenCalledWith("status", "active");
    });

    it("deactivateMembership actualiza estado a inactive", async () => {
            vi.mocked(supabase.eq).mockReturnValueOnce({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) } as any);

      await deactivateMembership("m-1");
      expect(supabase.update).toHaveBeenCalledWith({ status: "inactive" });
    });
  });

  describe("Roles y Sedes", () => {
    it("listAssignableRoles devuelve datos", async () => {
            vi.mocked(supabase.order).mockResolvedValueOnce({ data: [{ name: "Rol" }], error: null } as any);

      const res = await listAssignableRoles();
      expect(res).toEqual([{ name: "Rol" }]);
    });

    it("listAssignableSedes devuelve datos", async () => {
            vi.mocked(supabase.order).mockResolvedValueOnce({ data: [{ name: "Sede" }], error: null } as any);

      const res = await listAssignableSedes();
      expect(res).toEqual([{ name: "Sede" }]);
    });
  });

  describe("Validación y Consumo (RPC)", () => {
    it("validateAccessCode llama a rpc", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { valid: true, reason: null, type: null, target_type: null, onboarding_flow: null, expires_at: null },
        error: null,
      });

      const res = await validateAccessCode("code123");
      expect(res.valid).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith("fn_validate_access_code", { p_code: "code123" });
    });

    it("completeAccessOnboarding llama a rpc", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { success: true, membership_id: "m-1", entity_id: null, tenant_id: null, link_type: null },
        error: null,
      });

      const res = await completeAccessOnboarding("code123", { m: 1 });
      expect(res.success).toBe(true);
      expect(res.membershipId).toBe("m-1");
      expect(supabase.rpc).toHaveBeenCalledWith("fn_complete_access_onboarding", { p_access_code: "code123", p_metadata: { m: 1 } });
    });
  });
});
