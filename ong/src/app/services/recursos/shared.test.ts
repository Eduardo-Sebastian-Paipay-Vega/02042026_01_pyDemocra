import { describe, it, expect } from "vitest";
import {
  normalizeText,
  sanitizeText,
  sanitizeSearchTerm,
  sanitizeOptionalId,
  sanitizePath,
  normalizeDateTimeValue,
  toDateTimeLabel,
  toDateLabel,
  formatNumber,
  formatMoney,
  isRouteValueValid,
  sanitizeFileName,
  toFriendlyError,
  toOperationError,
} from "./shared";

describe("recursos/shared.ts — utilidades puras compartidas", () => {
  describe("normalizeText", () => {
    it("TST-ERR-249: quita acentos, colapsa espacios y pasa a minusculas", () => {
      expect(normalizeText("  Categoría   Fínanciera  ")).toBe("categoria financiera");
    });

    it("TST-ERR-250: devuelve cadena vacia para null/undefined/vacio", () => {
      expect(normalizeText(null)).toBe("");
      expect(normalizeText(undefined)).toBe("");
      expect(normalizeText("")).toBe("");
    });
  });

  describe("sanitizeText", () => {
    it("TST-ERR-251: colapsa espacios, hace trim, y trunca al maxLength", () => {
      expect(sanitizeText("  hola   mundo  ")).toBe("hola mundo");
      expect(sanitizeText("a".repeat(600))).toHaveLength(500);
      expect(sanitizeText("abcdef", 3)).toBe("abc");
    });

    it("TST-ERR-252: devuelve cadena vacia para valores falsy", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText("")).toBe("");
    });
  });

  describe("sanitizeSearchTerm", () => {
    it("TST-ERR-253: remueve caracteres usados para SQL LIKE/injection (%, _, comillas)", () => {
      expect(sanitizeSearchTerm(`100%_o'r"1`)).toBe("100  o r 1");
    });

    it("TST-ERR-254: trunca al limite de busqueda (120)", () => {
      expect(sanitizeSearchTerm("a".repeat(200))).toHaveLength(120);
    });
  });

  describe("sanitizeOptionalId", () => {
    it("TST-ERR-255: devuelve null si el id queda vacio tras sanitizar", () => {
      expect(sanitizeOptionalId("   ")).toBeNull();
      expect(sanitizeOptionalId(null)).toBeNull();
      expect(sanitizeOptionalId(undefined)).toBeNull();
    });

    it("TST-ERR-256: devuelve el id sanitizado si tiene contenido", () => {
      expect(sanitizeOptionalId("  acc-123  ")).toBe("acc-123");
    });
  });

  describe("sanitizePath", () => {
    it("TST-ERR-257: sanitiza y trunca a 250 caracteres", () => {
      expect(sanitizePath("a".repeat(300))).toHaveLength(250);
    });
  });

  describe("normalizeDateTimeValue", () => {
    it("TST-ERR-258: devuelve null para valores vacios o fechas invalidas", () => {
      expect(normalizeDateTimeValue(null)).toBeNull();
      expect(normalizeDateTimeValue("")).toBeNull();
      expect(normalizeDateTimeValue("no-es-una-fecha")).toBeNull();
    });

    it("TST-ERR-259: normaliza una fecha valida a ISO", () => {
      expect(normalizeDateTimeValue("2026-01-15T10:00:00Z")).toBe("2026-01-15T10:00:00.000Z");
    });
  });

  describe("toDateTimeLabel / toDateLabel", () => {
    it("TST-ERR-260: devuelve '-' para valores vacios o invalidos", () => {
      expect(toDateTimeLabel(null)).toBe("-");
      expect(toDateTimeLabel("fecha-invalida")).toBe("-");
      expect(toDateLabel(null)).toBe("-");
      expect(toDateLabel("fecha-invalida")).toBe("-");
    });

    it("TST-ERR-261: formatea una fecha valida en es-PE", () => {
      // Mediodia UTC para evitar flakiness por timezone del runner (evita el rollover de dia).
      expect(toDateLabel("2026-03-05T12:00:00Z")).toBe("05/03/2026");
      expect(toDateTimeLabel("2026-03-05T12:00:00Z")).toMatch(/05\/03\/2026/);
    });
  });

  describe("formatNumber / formatMoney", () => {
    it("TST-ERR-262: devuelve '-' para null/undefined/NaN", () => {
      expect(formatNumber(null)).toBe("-");
      expect(formatNumber(undefined)).toBe("-");
      expect(formatNumber(NaN)).toBe("-");
      expect(formatMoney(null)).toBe("-");
      expect(formatMoney(NaN)).toBe("-");
    });

    it("TST-ERR-263: formatea numeros y montos en formato es-PE", () => {
      expect(formatNumber(1234.5)).toBe("1,234.5");
      expect(formatMoney(1234.5)).toContain("1,234.50");
    });
  });

  describe("isRouteValueValid", () => {
    it("TST-ERR-264: rechaza cadena vacia", () => {
      expect(isRouteValueValid("")).toBe(false);
    });

    it("TST-ERR-265: acepta URLs http(s) y rutas/slugs con caracteres seguros", () => {
      expect(isRouteValueValid("https://example.com/a")).toBe(true);
      expect(isRouteValueValid("http://example.com")).toBe(true);
      expect(isRouteValueValid("area/sub-area_1.2:3@x")).toBe(true);
    });

    it("TST-ERR-266: rechaza valores con caracteres peligrosos (ej. espacios, '<', '>')", () => {
      expect(isRouteValueValid("<script>alert(1)</script>")).toBe(false);
      expect(isRouteValueValid("valor con espacio")).toBe(false);
    });
  });

  describe("sanitizeFileName", () => {
    it("TST-ERR-267: reemplaza caracteres no seguros y trunca a 80", () => {
      expect(sanitizeFileName("mi archivo (final) v2.pdf")).toBe("mi_archivo__final__v2.pdf");
      expect(sanitizeFileName("a".repeat(200))).toHaveLength(80);
    });

    it("TST-ERR-268: devuelve 'archivo' si el resultado queda vacio", () => {
      expect(sanitizeFileName("")).toBe("archivo");
    });
  });

  describe("toFriendlyError / toOperationError", () => {
    it("TST-ERR-269: toFriendlyError usa el mensaje del Error, o el string crudo, o el fallback", () => {
      expect(toFriendlyError(new Error("boom"), "fallback")).toBe("boom");
      expect(toFriendlyError(new Error(""), "fallback")).toBe("fallback");
      expect(toFriendlyError("mensaje crudo", "fallback")).toBe("mensaje crudo");
      expect(toFriendlyError({ weird: true }, "fallback")).toBe("fallback");
    });

    it("TST-ERR-270: toOperationError siempre devuelve una instancia de Error con el mensaje amigable", () => {
      const err = toOperationError(new Error("fallo real"), "fallback");
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("fallo real");
    });
  });
});
