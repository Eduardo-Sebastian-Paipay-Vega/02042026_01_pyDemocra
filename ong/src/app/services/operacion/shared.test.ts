import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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
  sanitizePath,
  sanitizeOptionalId,
  normalizeDateValue,
  normalizeDateTimeValue,
  toLocalDateKey,
  toDateLabel,
  toDateTimeLabel,
  normalizeTimeValue,
  timeToMinutes,
  resolveMinutes,
  minutesToHours,
  ensureDateOrder,
  ensureHoursRange,
  ensurePositiveMinutes,
  uniqueNonEmpty,
  getTodayRange,
  getWeekRange,
  buildScheduleText,
  isRouteValueValid,
  sanitizeFileName,
  toFriendlyError,
  toOperationError,
  getRequiredTenantId,
  resolveCurrentUserId,
  resolveActorId,
  getActorId,
  mapActivityStatusKind,
  mapApprovalStatusKind,
  mapApprovalVariant,
  mapActivityStatusVariant,
  resolveActivityStateCode,
  buildActivityStateOptions,
  buildApprovalStateOptions,
  buildEvidenceTypeLabel,
  computeFileHash,
  resolveProfileLabels,
} from "./shared";

describe("operacion/shared.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Funciones puras de texto y validacion", () => {
    it("normalizeText elimina acentos y pasa a minusculas", () => {
      expect(normalizeText("Árbol")).toBe("arbol");
      expect(normalizeText(null)).toBe("");
    });

    it("sanitizeSearchTerm quita comillas", () => {
      expect(sanitizeSearchTerm("hola%'_\"")).toBe("hola    ");
    });
    
    it("sanitizePath limita longitud", () => {
      expect(sanitizePath("a".repeat(300))).toHaveLength(255);
    });

    it("toLocalDateKey extrae YYYY-MM-DD local", () => {
      const d = new Date(2026, 0, 15); // Ene 15 2026 local
      expect(toLocalDateKey(d)).toBe("2026-01-15");
    });
    
    it("normalizeTimeValue extrae HH:MM", () => {
      expect(normalizeTimeValue("08:30:00")).toBe("08:30");
      expect(normalizeTimeValue("invalid")).toBeNull();
    });

    it("timeToMinutes convierte HH:MM a minutos", () => {
      expect(timeToMinutes("01:30")).toBe(90);
      expect(timeToMinutes("invalid")).toBeNull();
    });

    it("resolveMinutes calcula diferencia", () => {
      expect(resolveMinutes(null, "08:00", "10:30")).toBe(150);
      expect(resolveMinutes(120, "08:00", "10:30")).toBe(120); // respeta override
    });
    
    it("minutesToHours redondea", () => {
      expect(minutesToHours(90)).toBe(1.5);
    });

    it("ensureDateOrder lanza error si fin < inicio", () => {
      expect(() => ensureDateOrder("2026-02-01", "2026-01-01")).toThrow(/no puede ser anterior/);
      expect(() => ensureDateOrder("2026-01-01", "2026-02-01")).not.toThrow();
    });
    
    it("ensureHoursRange valida rangos", () => {
      expect(() => ensureHoursRange("10:00", "08:00")).toThrow(/no puede ser anterior/);
      expect(() => ensureHoursRange("08:00", "10:00")).not.toThrow();
    });

    it("isRouteValueValid valida rutas y urls", () => {
      expect(isRouteValueValid("https://example.com")).toBe(true);
      expect(isRouteValueValid("/ruta/valida")).toBe(true);
      expect(isRouteValueValid("invalido <")).toBe(false);
    });

    it("buildScheduleText junta fechas", () => {
      expect(buildScheduleText("2026-01-01T10:00Z", "2026-01-02T10:00Z")).toMatch(/01\/01\/2026.*02\/01\/2026/);
    });
  });

  describe("Funciones de mapeo de estados", () => {
    it("mapActivityStatusKind mapea texto a enum", () => {
      expect(mapActivityStatusKind("Completado")).toBe("completed");
      expect(mapActivityStatusKind("Cancelado")).toBe("cancelled");
      expect(mapActivityStatusKind("Desconocido")).toBe("other");
    });
    
    it("mapApprovalStatusKind mapea texto a enum", () => {
      expect(mapApprovalStatusKind("Aprobado")).toBe("approved");
      expect(mapApprovalStatusKind("Rechazado")).toBe("rejected");
    });

    it("mapApprovalVariant y mapActivityStatusVariant devuelven colores", () => {
      expect(mapApprovalVariant("approved")).toBe("success");
      expect(mapActivityStatusVariant("completed")).toBe("success");
    });

    it("resolveActivityStateCode devuelve codigo", () => {
      expect(resolveActivityStateCode(1)).toBe("pendiente");
      expect(resolveActivityStateCode(99)).toBeNull();
    });
    
    it("buildEvidenceTypeLabel limpia el codigo", () => {
      expect(buildEvidenceTypeLabel("foto_dni")).toBe("Foto dni");
    });
  });

  describe("Funciones asíncronas", () => {
    it("getRequiredTenantId devuelve el tenant", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: "tenant-xyz", error: null });
      const id = await getRequiredTenantId();
      expect(id).toBe("tenant-xyz");
    });

    it("resolveActorId prefiere explicitId", async () => {
      const id = await resolveActorId("actor-123");
      expect(id).toBe("actor-123");
    });

    it("resolveProfileLabels recupera nombres por ID", async () => {
      vi.mocked(supabase.in).mockResolvedValueOnce({ data: [{ id: "u1", full_name: "Juan" }], error: null } as any);
      const labels = await resolveProfileLabels(["u1"]);
      expect(labels.get("u1")).toBe("Juan");
    });
  });
});
