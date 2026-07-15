import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
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
  ensureDateOrder,
  parseNumericInput,
  toDateLabel,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
  getTaskStatusOptions,
  getTaskStatusKind,
  getTaskStatusLabel,
  getActivityStatusOptions,
  getActivityStatusKind,
  getActivityStatusLabel,
  resolveActivityStatusCode,
  getProjectStatusKind,
  getRequiredTenantId,
  resolveProfileLabels,
  fetchProjectStateOptions,
} from "./shared";

describe("proyectos/shared.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Funciones puras", () => {
    it("normalizeText elimina acentos y pasa a minusculas", () => {
      expect(normalizeText("Árbol")).toBe("arbol");
    });

    it("sanitizeSearchTerm quita comillas y porcentajes", () => {
      expect(sanitizeSearchTerm("hola%'_\"")).toBe("hola    ");
    });

    it("normalizeDateValue valida YYYY-MM-DD", () => {
      expect(normalizeDateValue("2026-01-01")).toBe("2026-01-01");
      expect(normalizeDateValue("2026/01/01")).toBeNull();
    });

    it("ensureDateOrder valida rangos", () => {
      expect(() => ensureDateOrder("2026-02-01", "2026-01-01")).toThrow();
      expect(() => ensureDateOrder("2026-01-01", "2026-02-01")).not.toThrow();
    });
    
    it("parseNumericInput extrae numeros", () => {
      expect(parseNumericInput(123)).toBe(123);
      expect(parseNumericInput("123,45")).toBe(123.45);
      expect(parseNumericInput("invalido")).toBeNull();
    });

    it("toDateLabel formatea fecha", () => {
      expect(toDateLabel(null)).toBe("-");
      expect(toDateLabel("2026-03-05T12:00:00Z")).toMatch(/05\/03\/2026/);
    });

    it("toFriendlyError mapea", () => {
      expect(toFriendlyError(new Error("msg"), "fall")).toBe("msg");
      expect(toFriendlyError("msg", "fall")).toBe("msg");
      expect(toFriendlyError(null, "fall")).toBe("fall");
    });
  });

  describe("Mapeo de estados", () => {
    it("getTaskStatusKind clasifica estado de tarea", () => {
      expect(getTaskStatusKind("en progreso")).toBe("in-progress");
      expect(getTaskStatusKind("completada")).toBe("completed");
    });

    it("getTaskStatusLabel obtiene label", () => {
      expect(getTaskStatusLabel("pendiente")).toBe("Pendiente");
      expect(getTaskStatusLabel("algo_raro")).toBe("algo raro");
    });

    it("getActivityStatusKind clasifica estado de actividad", () => {
      expect(getActivityStatusKind("planificada")).toBe("planned");
    });
    
    it("resolveActivityStatusCode fallback a pendiente", () => {
      expect(resolveActivityStatusCode("completada")).toBe("completada");
      expect(resolveActivityStatusCode("inventado")).toBe("pendiente");
    });

    it("getProjectStatusKind clasifica estado de proyecto", () => {
      expect(getProjectStatusKind("planificacion")).toBe("planning");
      expect(getProjectStatusKind("ejecucion")).toBe("active");
    });
  });

  describe("Funciones asíncronas", () => {
    it("getRequiredTenantId devuelve el tenant", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: "tenant-xyz", error: null });
      const id = await getRequiredTenantId();
      expect(id).toBe("tenant-xyz");
    });

    it("resolveProfileLabels recupera nombres por ID", async () => {
      vi.mocked(supabase.in).mockResolvedValueOnce({ data: [{ id: "u1", full_name: "Juan" }], error: null } as any);
      const labels = await resolveProfileLabels(["u1"]);
      expect(labels.get("u1")).toBe("Juan");
    });

    it("fetchProjectStateOptions recupera estados visuales", async () => {
      vi.mocked(supabase.order).mockResolvedValueOnce({
        data: [{ codigo: "planificacion", nombre_estado: "Planificación" }],
        error: null
      } as any);
      
      const states = await fetchProjectStateOptions();
      expect(states).toHaveLength(1);
      expect(states[0].value).toBe("planificacion");
      expect(states[0].kind).toBe("planning");
    });
  });
});
