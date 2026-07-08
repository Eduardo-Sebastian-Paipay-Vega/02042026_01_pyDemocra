/**
 * Batch ID-card generation.
 *
 * Client-side threshold: ≤ BATCH_CLIENT_LIMIT cards are rendered entirely in
 * the browser (no server round-trip).  Above the threshold the function
 * dispatches a backend job and returns a job reference instead of a PDF.
 *
 * Preflight:
 *   Before rendering, preflightCheck() validates that all {{token}} occurrences
 *   in text layers have non-empty bindings.  Missing tokens are surfaced to the
 *   caller so the user can fix them before committing to a long render.
 */

import type { IdCardTemplateConfig } from "./idCardTemplateSchema";
import type { IdCardRenderSubject } from "./types";
import { preflightCheck } from "./idCardTemplateSchema";
import type { PdfExportOptions } from "./idCardPdfExport";
import type { IdCardCanvasInput } from "./idCardCanvas";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Cards at or below this number are rendered client-side. */
export const BATCH_CLIENT_LIMIT = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

/** One card's data for batch generation. */
export interface BatchCardInput {
  /** Token bindings for this specific card (e.g. { "voluntario.nombre": "Ana" }). */
  bindings: Record<string, string>;
  /** Render subject for dynamic images (photo URL, QR payload). */
  subject: IdCardRenderSubject;
  /** Filename suffix used when autoDownload is true (e.g. "ana_lopez"). */
  filenameSuffix?: string;
}

/** Result for a successful client-side batch run. */
export interface BatchClientResult {
  kind: "client";
  /** Combined multi-page PDF instance. */
  pdf: import("jspdf").jsPDF;
  /** Number of cards rendered. */
  count: number;
  /** Per-card preflight warnings (token: missingLabels[]). Populated but non-blocking. */
  warnings: Array<{ index: number; missing: string[] }>;
}

/** Result when the batch is dispatched to the backend job queue. */
export interface BatchServerResult {
  kind: "server";
  /** Opaque job ID returned by the backend endpoint. */
  jobId: string;
  /** Number of cards queued. */
  count: number;
}

export type BatchResult = BatchClientResult | BatchServerResult;

/** Preflight report before running the batch. */
export interface PreflightReport {
  /** Cards that passed preflight. */
  passed: number;
  /** Cards that have at least one missing token. */
  failed: number;
  /** Detailed issues per card index. */
  issues: Array<{ index: number; missing: string[] }>;
}

// ─── Preflight ────────────────────────────────────────────────────────────────

/**
 * Run preflight checks for all cards in the batch without rendering anything.
 *
 * Use this to show a warning dialog before committing to a long batch render.
 */
export function batchPreflightCheck(
  config: IdCardTemplateConfig,
  cards: BatchCardInput[]
): PreflightReport {
  const issues: Array<{ index: number; missing: string[] }> = [];

  for (let i = 0; i < cards.length; i++) {
    const missing = preflightCheck(config, cards[i].bindings);
    if (missing.length > 0) {
      issues.push({ index: i, missing });
    }
  }

  return {
    passed: cards.length - issues.length,
    failed: issues.length,
    issues,
  };
}

// ─── Client-side batch ────────────────────────────────────────────────────────

/**
 * Render ≤ BATCH_CLIENT_LIMIT cards into a single multi-page PDF.
 *
 * Each page is sized to the card's physical dimensions plus bleed and crop marks.
 * Progress is reported via the optional `onProgress` callback.
 */
async function renderBatchClient(
  config: IdCardTemplateConfig,
  cards: BatchCardInput[],
  options: PdfExportOptions,
  onProgress?: (done: number, total: number) => void
): Promise<BatchClientResult> {
  const {
    bleedMm = config.template_metadata.bleed_mm ?? 3,
    cropMarkLengthMm = 5,
    cropMarkGapMm = 2,
    filename = "credenciales",
    autoDownload = true,
  } = options;

  const { jsPDF } = await import("jspdf");
  const { exportIdCardPdfFromConfig } = await import("./idCardPdfExport");

  const widthMm = config.template_metadata.canvas_size.width_mm;
  const heightMm = config.template_metadata.canvas_size.height_mm;
  const pageW =
    widthMm + 2 * bleedMm + 2 * (cropMarkGapMm + cropMarkLengthMm);
  const pageH =
    heightMm + 2 * bleedMm + 2 * (cropMarkGapMm + cropMarkLengthMm);

  const batchPdf = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [pageW, pageH],
  });

  const warnings: Array<{ index: number; missing: string[] }> = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    // Soft preflight — collect warnings but continue
    const missing = preflightCheck(config, card.bindings);
    if (missing.length > 0) {
      warnings.push({ index: i, missing });
    }

    // Render to a temporary PDF (single-page, no auto-download)
    const { pdf: singlePdf } = await exportIdCardPdfFromConfig(
      config,
      card.bindings,
      card.subject,
      { ...options, autoDownload: false }
    );

    // Import page into batch PDF (jsPDF page-by-page merge)
    if (i > 0) {
      batchPdf.addPage([pageW, pageH], widthMm >= heightMm ? "landscape" : "portrait");
    }

    // Extract image from single-page pdf via output("datauristring") and re-embed
    const singleDataUri = singlePdf.output("datauristring");
    // Re-render as PNG from the single PDF data isn't possible client-side;
    // instead call the canvas directly and add image to batchPdf.
    const { mmToPx } = await import("./idCardUnits");
    const { renderIdCardCanvas } = await import("./idCardCanvas");
    const { resolveTemplateTokens, ptToPx } = await import("./idCardTemplateSchema");
    const { buildIdCardRenderSubject } = await import("./idCardShared");

    const wPx = Math.round(mmToPx(widthMm));
    const hPx = Math.round(mmToPx(heightMm));
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = wPx;
    tmpCanvas.height = hPx;

    // Build a legacy-compatible fields array from config layers (text → texto fields omitted;
    // photo/QR are what the legacy renderer needs for dynamic images)
    const legacyInput: Parameters<typeof renderIdCardCanvas>[1] = {
      baseImageUrl: null,
      templateWidth: wPx,
      templateHeight: hPx,
      fields: [],
      subject: card.subject,
    };

    // Find photo & qr layers to map to legacy fields
    for (const layer of config.layers) {
      if (layer.type === "dynamic_image") {
        const x = mmToPx(layer.position.x_mm);
        const y = mmToPx(layer.position.y_mm);
        const w = mmToPx(layer.dimensions.w_mm);
        const h = mmToPx(layer.dimensions.h_mm);

        if (layer.source === "profile_picture") {
          legacyInput.fields.push({
            id: null,
            fieldKey: "foto",
            label: "Foto",
            posX: x,
            posY: y,
            width: w,
            height: h,
            fontSize: null,
            fontFamily: null,
            fontWeight: null,
            colorHex: null,
            zIndex: layer.z_index ?? 1,
          });
        } else if (layer.source === "qr_code") {
          legacyInput.fields.push({
            id: null,
            fieldKey: "qr",
            label: "QR",
            posX: x,
            posY: y,
            width: w,
            height: h,
            fontSize: null,
            fontFamily: null,
            fontWeight: null,
            colorHex: null,
            zIndex: layer.z_index ?? 2,
          });
        }
      }
    }

    await renderIdCardCanvas(tmpCanvas, legacyInput);

    // Then draw text layers on top
    const ctx = tmpCanvas.getContext("2d")!;
    const textLayers = config.layers
      .filter((l) => l.type === "text")
      .sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0));

    for (const layer of textLayers) {
      if (layer.type !== "text") continue;
      const resolved = resolveTemplateTokens(layer.content, card.bindings);
      const sizePx = ptToPx(layer.style.size_pt);
      const weight = layer.style.bold ? "bold" : "normal";
      const style = layer.style.italic ? "italic" : "normal";
      ctx.save();
      ctx.font = `${style} ${weight} ${sizePx}px ${layer.style.font}`;
      ctx.fillStyle = layer.style.color;
      ctx.textBaseline = "top";
      ctx.textAlign = layer.style.align ?? "left";
      const x = mmToPx(layer.position.x_mm);
      const y = mmToPx(layer.position.y_mm);
      const maxW = layer.dimensions?.w_mm ? mmToPx(layer.dimensions.w_mm) : undefined;
      if (maxW) {
        ctx.fillText(resolved, x, y, maxW);
      } else {
        ctx.fillText(resolved, x, y);
      }
      ctx.restore();
    }

    const pngDataUrl = tmpCanvas.toDataURL("image/png");
    const cardOffsetX = cropMarkGapMm + cropMarkLengthMm + bleedMm;
    const cardOffsetY = cropMarkGapMm + cropMarkLengthMm + bleedMm;

    batchPdf.addImage(pngDataUrl, "PNG", cardOffsetX, cardOffsetY, widthMm, heightMm);

    // Crop marks
    drawBatchCropMarks(
      batchPdf,
      cardOffsetX,
      cardOffsetY,
      widthMm,
      heightMm,
      bleedMm,
      cropMarkGapMm,
      cropMarkLengthMm
    );

    onProgress?.(i + 1, cards.length);

    // Avoid blocking the main thread between heavy renders
    await new Promise<void>((r) => setTimeout(r, 0));

    // Suppress unused import warning
    void singleDataUri;
  }

  if (autoDownload) {
    batchPdf.save(`${filename}.pdf`);
  }

  return { kind: "client", pdf: batchPdf, count: cards.length, warnings };
}

// ─── Server-side batch ────────────────────────────────────────────────────────

/**
 * Dispatch a batch job to the backend.
 * The backend processes cards asynchronously and stores the output PDF.
 *
 * Returns the job ID which the caller can poll to track completion.
 */
async function dispatchBatchServer(
  config: IdCardTemplateConfig,
  cards: BatchCardInput[],
  tenantId: string
): Promise<BatchServerResult> {
  const response = await fetch("/api/id-cards/batch-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, cards: cards.map((c) => ({ bindings: c.bindings, subjectId: c.subject.cardCode })), tenantId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Batch job dispatch failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { jobId: string };
  return { kind: "server", jobId: data.jobId, count: cards.length };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate ID cards for a list of subjects.
 *
 * - If `cards.length ≤ BATCH_CLIENT_LIMIT`, renders entirely in the browser.
 * - Otherwise, dispatches a backend job and returns immediately with a job ID.
 *
 * @param config    Template configuration (JSON schema).
 * @param cards     Array of per-card data (bindings + render subject).
 * @param tenantId  Required for server-side dispatch.
 * @param options   PDF options (bleed, crop marks, filename, autoDownload).
 * @param onProgress  Optional callback called after each client-side card (done, total).
 */
export async function generateIdCardBatch(
  config: IdCardTemplateConfig,
  cards: BatchCardInput[],
  tenantId: string,
  options: PdfExportOptions = {},
  onProgress?: (done: number, total: number) => void
): Promise<BatchResult> {
  if (cards.length === 0) {
    throw new Error("La lista de credenciales a generar está vacía.");
  }

  if (cards.length <= BATCH_CLIENT_LIMIT) {
    return renderBatchClient(config, cards, options, onProgress);
  }

  return dispatchBatchServer(config, cards, tenantId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawBatchCropMarks(
  pdf: import("jspdf").jsPDF,
  xCard: number,
  yCard: number,
  cardW: number,
  cardH: number,
  bleed: number,
  gapMm: number,
  lengthMm: number
) {
  const x0 = xCard - bleed;
  const y0 = yCard - bleed;
  const x1 = xCard + cardW + bleed;
  const y1 = yCard + cardH + bleed;
  const s = gapMm;
  const e = gapMm + lengthMm;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.25);
  pdf.line(x0 - e, y0, x0 - s, y0);
  pdf.line(x0, y0 - e, x0, y0 - s);
  pdf.line(x1 + s, y0, x1 + e, y0);
  pdf.line(x1, y0 - e, x1, y0 - s);
  pdf.line(x0 - e, y1, x0 - s, y1);
  pdf.line(x0, y1 + s, x0, y1 + e);
  pdf.line(x1 + s, y1, x1 + e, y1);
  pdf.line(x1, y1 + s, x1, y1 + e);
}
