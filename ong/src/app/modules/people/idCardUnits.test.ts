import { describe, it, expect } from "vitest";
import {
  PRINT_DPI,
  PX_PER_MM,
  mmToPx,
  pxToMm,
  convertUnit,
  snapToGrid,
  snapPoint,
  formatUnit,
  computeScale,
  screenToTemplate,
  CR80_PX,
  CR79_PX,
  DEFAULT_BLEED_MM,
  DEFAULT_BLEED_PX,
} from "./idCardUnits";

describe("idCardUnits — constantes de impresión", () => {
  it("PRINT_DPI es el estándar de 300 DPI", () => {
    expect(PRINT_DPI).toBe(300);
  });

  it("PX_PER_MM deriva de 300 DPI / 25.4 mm", () => {
    expect(PX_PER_MM).toBeCloseTo(300 / 25.4, 10);
    expect(PX_PER_MM).toBeCloseTo(11.811, 3);
  });
});

describe("idCardUnits — conversores núcleo", () => {
  it("mmToPx convierte mm a px redondeado a 2 decimales", () => {
    expect(mmToPx(10)).toBe(118.11);
    expect(mmToPx(0)).toBe(0);
  });

  it("pxToMm convierte px a mm redondeado a 2 decimales", () => {
    expect(pxToMm(118.11)).toBe(10);
    expect(pxToMm(0)).toBe(0);
  });

  it("mmToPx y pxToMm son inversos aproximados (ida y vuelta)", () => {
    const original = 53.98;
    const roundtrip = pxToMm(mmToPx(original));
    expect(roundtrip).toBeCloseTo(original, 1);
  });

  it("maneja valores negativos de forma simétrica", () => {
    expect(mmToPx(-10)).toBe(-118.11);
    expect(pxToMm(-118.11)).toBe(-10);
  });
});

describe("idCardUnits — convertUnit", () => {
  it("devuelve el valor sin cambios cuando from === to", () => {
    expect(convertUnit(42.5, "px", "px")).toBe(42.5);
    expect(convertUnit(42.5, "mm", "mm")).toBe(42.5);
  });

  it("px → mm usa pxToMm", () => {
    expect(convertUnit(118.11, "px", "mm")).toBe(pxToMm(118.11));
  });

  it("mm → px usa mmToPx", () => {
    expect(convertUnit(10, "mm", "px")).toBe(mmToPx(10));
  });
});

describe("idCardUnits — snapToGrid / snapPoint", () => {
  it("ajusta al múltiplo de grid más cercano", () => {
    expect(snapToGrid(23, 10)).toBe(20);
    expect(snapToGrid(27, 10)).toBe(30);
    expect(snapToGrid(25, 10)).toBe(30); // Math.round(.5) redondea hacia arriba
  });

  it("devuelve el valor original si gridSize <= 0", () => {
    expect(snapToGrid(7, 0)).toBe(7);
    expect(snapToGrid(7, -5)).toBe(7);
  });

  it("snapPoint ajusta x e y de forma independiente", () => {
    expect(snapPoint(23, 27, 10)).toEqual({ x: 20, y: 30 });
  });

  it("snapPoint respeta gridPx <= 0 en ambos ejes", () => {
    expect(snapPoint(23, 27, 0)).toEqual({ x: 23, y: 27 });
  });
});

describe("idCardUnits — formatUnit", () => {
  it("formatea mm con 1 decimal por defecto", () => {
    expect(formatUnit(118.11, "mm")).toBe("10.0 mm");
  });

  it("respeta el número de decimales solicitado en mm", () => {
    expect(formatUnit(118.11, "mm", 2)).toBe("10.00 mm");
  });

  it("formatea px como entero redondeado sin decimales", () => {
    expect(formatUnit(118.11, "px")).toBe("118 px");
    expect(formatUnit(117.6, "px")).toBe("118 px");
  });
});

describe("idCardUnits — helpers de escala del canvas", () => {
  it("computeScale = displayWidth / templateWidth", () => {
    expect(computeScale(1000, 500)).toBe(0.5);
    expect(computeScale(500, 1000)).toBe(2);
  });

  it("computeScale evita división por cero con Math.max(1, ...)", () => {
    expect(computeScale(0, 500)).toBe(500);
  });

  it("screenToTemplate revierte la escala redondeando a 1 decimal", () => {
    expect(screenToTemplate(250, 0.5)).toBe(500);
    expect(screenToTemplate(100, 3)).toBe(33.3);
  });
});

describe("idCardUnits — formatos de tarjeta estándar", () => {
  it("CR80 corresponde a 85.6 × 53.98 mm en px", () => {
    expect(CR80_PX.width).toBe(mmToPx(85.6));
    expect(CR80_PX.height).toBe(mmToPx(53.98));
  });

  it("CR79 corresponde a 84.0 × 53.0 mm en px", () => {
    expect(CR79_PX.width).toBe(mmToPx(84.0));
    expect(CR79_PX.height).toBe(mmToPx(53.0));
  });

  it("CR80 es mayor que CR79 en ambas dimensiones", () => {
    expect(CR80_PX.width).toBeGreaterThan(CR79_PX.width);
    expect(CR80_PX.height).toBeGreaterThan(CR79_PX.height);
  });

  it("el bleed por defecto es 3 mm y su equivalente en px", () => {
    expect(DEFAULT_BLEED_MM).toBe(3.0);
    expect(DEFAULT_BLEED_PX).toBe(mmToPx(3.0));
  });
});
