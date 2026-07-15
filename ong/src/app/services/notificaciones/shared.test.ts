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
  },
}));

import { supabase } from "../../../supabaseClient";
import {
  normalizeText,
  sanitizeText,
  sanitizeSearchTerm,
  sanitizeOptionalId,
  normalizeDateValue,
  toFriendlyError,
  toDateTimeLabel,
  uniqueNonEmpty,
  toDayStartIso,
  toDayEndIso,
  getRequiredTenantId,
  resolveCurrentUserId,
  resolveProfileLabels,
  resolveNotificationCapabilities,
} from "./shared";

describe("notificaciones/shared.ts", () => {
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

    it("sanitizeSearchTerm quita comillas y porcentajes", () => {
      expect(sanitizeSearchTerm("hola%'_\"")).toBe("hola    ");
    });

    it("sanitizeOptionalId devuelve null si queda vacio", () => {
      expect(sanitizeOptionalId("   ")).toBeNull();
      expect(sanitizeOptionalId("id-123")).toBe("id-123");
    });

    it("normalizeDateValue valida YYYY-MM-DD", () => {
      expect(normalizeDateValue("2026-01-01")).toBe("2026-01-01");
      expect(normalizeDateValue("2026/01/01")).toBeNull();
      expect(normalizeDateValue(null)).toBeNull();
    });
  });

  describe("toFriendlyError", () => {
    it("mapea errores de network", () => {
      expect(toFriendlyError(new Error("failed to fetch"), "fallback")).toMatch(/No se pudo conectar/);
    });
    it("mapea errores de permisos (RLS/JWT)", () => {
      expect(toFriendlyError(new Error("new row violates row-level security"), "fallback")).toContain("fallback (new row violates row-level security)");
    });
    it("mapea errores de duplicidad", () => {
      expect(toFriendlyError(new Error("duplicate key"), "fallback")).toMatch(/Ya existe un registro/);
    });
    it("usa fallback para errores desconocidos", () => {
      expect(toFriendlyError(new Error("error random"), "fallback")).toBe("fallback (error random)");
    });
  });

  describe("toDateTimeLabel, toDayStartIso, toDayEndIso", () => {
    it("toDateTimeLabel formatea correctamente", () => {
      expect(toDateTimeLabel(null)).toBe("-");
      expect(toDateTimeLabel("2026-03-05T12:00:00Z")).toMatch(/05\/03\/2026/);
    });

    it("toDayStartIso agrega T00:00:00", () => {
      expect(toDayStartIso("2026-01-01")).toBe("2026-01-01T00:00:00");
    });

    it("toDayEndIso agrega T23:59:59.999", () => {
      expect(toDayEndIso("2026-01-01")).toBe("2026-01-01T23:59:59.999");
    });
  });

  describe("uniqueNonEmpty", () => {
    it("elimina nulos y duplicados", () => {
      expect(uniqueNonEmpty([1, null, 2, undefined, 1, 3])).toEqual([1, 2, 3]);
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

    it("resolveProfileLabels recupera nombres por ID", async () => {
      vi.mocked(supabase.in).mockResolvedValueOnce({ data: [{ id: "u1", full_name: "Juan" }], error: null } as any);
      const labels = await resolveProfileLabels(["u1"]);
      expect(labels.get("u1")).toBe("Juan");
    });

    it("resolveNotificationCapabilities devuelve estado para usuario sin permisos", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: { id: "u1" } } } as any);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null });
      
      const caps = await resolveNotificationCapabilities();
      expect(caps.currentUserId).toBe("u1");
      expect(caps.isTenantAdmin).toBe(false);
      expect(caps.canReadTemplates).toBe(false);
    });
  });
});
