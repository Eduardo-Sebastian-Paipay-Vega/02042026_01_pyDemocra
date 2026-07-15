import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

import { supabase } from "../../../supabaseClient";
import {
  normalizeText,
  sanitizeText,
  sanitizeOptionalId,
  toFriendlyError,
  toDateTimeLabel,
  uniqueNonEmpty,
  getRequiredTenantId,
  resolveCurrentUserId,
  resolveProfileLabels,
  invokeSettingsFunction,
  resolveSettingsCapabilities,
} from "./shared";

describe("configuracion/shared.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Funciones puras de texto", () => {
    it("normalizeText elimina acentos y pasa a minusculas", () => {
      expect(normalizeText("Árbol")).toBe("arbol");
      expect(normalizeText(null)).toBe("");
    });

    it("sanitizeText recorta espacios", () => {
      expect(sanitizeText("  hola  ")).toBe("hola");
      expect(sanitizeText(null)).toBe("");
    });

    it("sanitizeOptionalId devuelve null si queda vacio", () => {
      expect(sanitizeOptionalId("   ")).toBeNull();
      expect(sanitizeOptionalId("id-123")).toBe("id-123");
    });
  });

  describe("toFriendlyError", () => {
    it("mapea errores de network a mensaje amigable", () => {
      expect(toFriendlyError(new Error("failed to fetch"), "fallback")).toMatch(/No se pudo conectar/);
    });
    it("mapea errores de permisos (RLS/JWT)", () => {
      expect(toFriendlyError(new Error("new row violates row-level security"), "fallback")).toContain("fallback (new row violates row-level security)");
    });
    it("usa el mensaje crudo para errores especificos que el usuario debe leer directo", () => {
      expect(toFriendlyError(new Error("inicia sesion nuevamente"), "fallback")).toBe("inicia sesion nuevamente");
    });
    it("usa fallback para errores desconocidos", () => {
      expect(toFriendlyError(new Error("error random"), "fallback")).toBe("fallback (error random)");
    });
  });

  describe("toDateTimeLabel", () => {
    it("devuelve guion para nulos", () => {
      expect(toDateTimeLabel(null)).toBe("-");
    });
    it("formatea correctamente una fecha valida", () => {
      expect(toDateTimeLabel("2026-03-05T12:00:00Z")).toMatch(/05\/03\/2026/);
    });
  });

  describe("uniqueNonEmpty", () => {
    it("elimina nulos y duplicados", () => {
      expect(uniqueNonEmpty([1, null, 2, undefined, 1, 3])).toEqual([1, 2, 3]);
    });
  });

  describe("Funciones Supabase", () => {
    it("getRequiredTenantId devuelve el tenant de RPC", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: "tenant-xyz", error: null });
      const id = await getRequiredTenantId();
      expect(id).toBe("tenant-xyz");
      expect(supabase.rpc).toHaveBeenCalledWith("fn_current_tenant_id");
    });

    it("resolveCurrentUserId devuelve el ID del usuario autenticado", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: "user-123" } } } as any);
      const id = await resolveCurrentUserId();
      expect(id).toBe("user-123");
    });

    it("resolveProfileLabels recupera nombres por ID", async () => {
      const mockData = [
        { id: "u1", full_name: "Juan" },
        { id: "u2", full_name: null },
      ];
      vi.mocked(supabase.in).mockResolvedValueOnce({ data: mockData, error: null } as any);
      
      const labels = await resolveProfileLabels(["u1", "u2", "u3"]);
      expect(labels.get("u1")).toBe("Juan");
      expect(labels.get("u2")).toBe("u2"); // Fallback al id
    });

    it("invokeSettingsFunction llama a supabase.functions.invoke", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { success: true }, error: null });
      const res = await invokeSettingsFunction("mi-func", { a: 1 });
      expect(res).toEqual({ success: true });
      expect(supabase.functions.invoke).toHaveBeenCalledWith("mi-func", { body: { a: 1 } });
    });

    it("resolveSettingsCapabilities devuelve el estado de permisos para un usuario sin permisos", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: "u1" } } } as any);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null }); // Sin admin ni permisos
      
      const caps = await resolveSettingsCapabilities();
      expect(caps.currentUserId).toBe("u1");
      expect(caps.isTenantAdmin).toBe(false);
      expect(caps.canReadUsers).toBe(false);
    });
  });
});
