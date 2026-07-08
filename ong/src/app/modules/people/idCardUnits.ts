/**
 * Centralized unit conversion for ID card dimensions.
 *
 * Basis: 300 DPI print standard.
 *   1 inch  = 25.4 mm
 *   300 DPI = 300 px / inch
 *   → 1 mm  = 300 / 25.4 ≈ 11.811 px
 *
 * All conversion goes through mmToPx / pxToMm to avoid ad-hoc math
 * that accumulates rounding errors across callers.
 */

export const PRINT_DPI = 300;

/** Pixels per millimeter at PRINT_DPI. */
export const PX_PER_MM: number = PRINT_DPI / 25.4; // 11.8110...

export type Unit = "px" | "mm";

// ─── Core converters ─────────────────────────────────────────────────────────

/** Round to at most `decimals` significant decimal places. */
function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Convert millimeters to pixels at PRINT_DPI.
 * Result is rounded to 2 decimal places.
 */
export function mmToPx(mm: number): number {
  return round(mm * PX_PER_MM, 2);
}

/**
 * Convert pixels (at PRINT_DPI) to millimeters.
 * Result is rounded to 2 decimal places.
 */
export function pxToMm(px: number): number {
  return round(px / PX_PER_MM, 2);
}

/**
 * Convert a value to the target unit.
 * Treats the input as pixels when `from` is "px",
 * or as millimeters when `from` is "mm".
 */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return from === "px" ? pxToMm(value) : mmToPx(value);
}

// ─── Snap-to-grid ─────────────────────────────────────────────────────────────

/**
 * Snap `value` to the nearest `gridSize` increment.
 * Returns the original value unchanged if gridSize <= 0.
 */
export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap both x and y to a grid.
 * Convenience wrapper used by the canvas editor drag handler.
 */
export function snapPoint(
  x: number,
  y: number,
  gridPx: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridPx),
    y: snapToGrid(y, gridPx),
  };
}

// ─── Display formatting ───────────────────────────────────────────────────────

/**
 * Format a pixel value for display in the given unit.
 *
 * @example
 * formatUnit(118.11, "mm") // "10.00 mm"
 * formatUnit(118.11, "px") // "118 px"
 */
export function formatUnit(px: number, unit: Unit, decimals = 1): string {
  if (unit === "mm") {
    return `${pxToMm(px).toFixed(decimals)} mm`;
  }
  return `${Math.round(px)} px`;
}

// ─── Canvas scaling helpers ───────────────────────────────────────────────────

/**
 * Compute the display scale factor given a logical template width (px)
 * and the desired on-screen display width (px).
 */
export function computeScale(templateWidthPx: number, displayWidthPx: number): number {
  return displayWidthPx / Math.max(1, templateWidthPx);
}

/**
 * Convert a screen coordinate back to template-space pixels.
 * `screenPx / scale = templatePx`
 */
export function screenToTemplate(screenPx: number, scale: number): number {
  return Math.round((screenPx / scale) * 10) / 10;
}

// ─── Standard card formats ────────────────────────────────────────────────────

/** CR80 — ISO/IEC 7810 standard (credit card size, 85.6 × 53.98 mm). */
export const CR80_PX = {
  width: mmToPx(85.6),
  height: mmToPx(53.98),
} as const;

/** CR79 — Slightly smaller than CR80 (84.0 × 53.0 mm). */
export const CR79_PX = {
  width: mmToPx(84.0),
  height: mmToPx(53.0),
} as const;

/** Default bleed in mm and px. */
export const DEFAULT_BLEED_MM = 3.0;
export const DEFAULT_BLEED_PX = mmToPx(DEFAULT_BLEED_MM);
