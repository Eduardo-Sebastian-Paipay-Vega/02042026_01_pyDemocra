/**
 * PDF export engine for ID cards.
 *
 * Produces a print-ready PDF at 300 DPI using jsPDF.
 * Each page holds one card at its exact physical mm dimensions plus a 3 mm
 * bleed margin on all four sides.  Thin crop marks are drawn 2 mm outside the
 * bleed corners so a print shop can trim the cards precisely.
 *
 * Flow:
 *   1. Render the card to an off-screen <canvas> via renderIdCardCanvas().
 *   2. Export to PNG data-URL.
 *   3. Add a jsPDF page sized to (card + 2×bleed) mm.
 *   4. Embed the PNG image scaled to card-only area (bleed not included in image).
 *   5. Draw crop marks outside the bleed zone.
 *   6. Return the jsPDF instance (caller can call .save() or .output()).
 */

import type { IdCardTemplateConfig } from "./idCardTemplateSchema";
import type { IdCardRenderSubject } from "./types";
import { mmToPx } from "./idCardUnits";
import { renderIdCardCanvas } from "./idCardCanvas";
import type { IdCardCanvasInput } from "./idCardCanvas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PdfExportOptions {
  /** mm to add on all four sides for print bleed (default 3). */
  bleedMm?: number;
  /** Length of each crop mark line in mm (default 5). */
  cropMarkLengthMm?: number;
  /** Gap between card edge and start of crop mark in mm (default 2). */
  cropMarkGapMm?: number;
  /** Whether to open a save-as dialog in the browser (default true). */
  autoDownload?: boolean;
  /** Filename without extension (default "credencial"). */
  filename?: string;
}

export interface PdfExportResult {
  /** jsPDF instance with all pages rendered. */
  pdf: import("jspdf").jsPDF;
  /** Total pages written. */
  pages: number;
}

// ─── Crop marks ───────────────────────────────────────────────────────────────

/**
 * Draw four L-shaped crop marks at card corners.
 * The marks are drawn 2 mm outside the bleed boundary.
 *
 * @param pdf       jsPDF instance
 * @param xCard     x-offset of the card image in the page (= bleedMm)
 * @param yCard     y-offset of the card image in the page (= bleedMm)
 * @param cardW     card width in mm
 * @param cardH     card height in mm
 * @param bleed     bleed in mm
 * @param gapMm     gap between card boundary and mark start (mm)
 * @param lengthMm  length of each mark arm (mm)
 */
function drawCropMarks(
  pdf: import("jspdf").jsPDF,
  xCard: number,
  yCard: number,
  cardW: number,
  cardH: number,
  bleed: number,
  gapMm: number,
  lengthMm: number
): void {
  // Bleed boundary (marks start gapMm outside this)
  const x0 = xCard - bleed;
  const y0 = yCard - bleed;
  const x1 = xCard + cardW + bleed;
  const y1 = yCard + cardH + bleed;

  const markStart = gapMm;
  const markEnd = gapMm + lengthMm;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.25);

  // Top-left
  pdf.line(x0 - markEnd, y0, x0 - markStart, y0);
  pdf.line(x0, y0 - markEnd, x0, y0 - markStart);
  // Top-right
  pdf.line(x1 + markStart, y0, x1 + markEnd, y0);
  pdf.line(x1, y0 - markEnd, x1, y0 - markStart);
  // Bottom-left
  pdf.line(x0 - markEnd, y1, x0 - markStart, y1);
  pdf.line(x0, y1 + markStart, x0, y1 + markEnd);
  // Bottom-right
  pdf.line(x1 + markStart, y1, x1 + markEnd, y1);
  pdf.line(x1, y1 + markStart, x1, y1 + markEnd);
}

// ─── Single card PNG render ───────────────────────────────────────────────────

/**
 * Render one card to a PNG data-URL using the canvas engine.
 * Uses the legacy field-based canvas renderer (IdCardCanvasInput) so the
 * existing render pipeline is unchanged.
 */
async function renderCardToPng(input: IdCardCanvasInput): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(input.templateWidth));
  canvas.height = Math.max(1, Math.round(input.templateHeight));
  await renderIdCardCanvas(canvas, input);
  return canvas.toDataURL("image/png");
}

// ─── Single-card PDF export ───────────────────────────────────────────────────

/**
 * Export a single ID card as a PDF.
 *
 * @param input   Legacy canvas render input (fields-based system).
 * @param widthMm Card physical width in mm (e.g. 85.6 for CR80).
 * @param heightMm Card physical height in mm (e.g. 53.98 for CR80).
 * @param options PDF options including bleed, crop marks, filename.
 */
export async function exportIdCardPdf(
  input: IdCardCanvasInput,
  widthMm: number,
  heightMm: number,
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  const {
    bleedMm = 3,
    cropMarkLengthMm = 5,
    cropMarkGapMm = 2,
    autoDownload = true,
    filename = "credencial",
  } = options;

  const { jsPDF } = await import("jspdf");

  const pageW = widthMm + 2 * bleedMm + 2 * (cropMarkGapMm + cropMarkLengthMm);
  const pageH = heightMm + 2 * bleedMm + 2 * (cropMarkGapMm + cropMarkLengthMm);
  const cardOffsetX = cropMarkGapMm + cropMarkLengthMm + bleedMm;
  const cardOffsetY = cropMarkGapMm + cropMarkLengthMm + bleedMm;

  const pdf = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [pageW, pageH],
  });

  const pngDataUrl = await renderCardToPng(input);

  pdf.addImage(pngDataUrl, "PNG", cardOffsetX, cardOffsetY, widthMm, heightMm);

  drawCropMarks(
    pdf,
    cardOffsetX,
    cardOffsetY,
    widthMm,
    heightMm,
    bleedMm,
    cropMarkGapMm,
    cropMarkLengthMm
  );

  if (autoDownload) {
    pdf.save(`${filename}.pdf`);
  }

  return { pdf, pages: 1 };
}

// ─── Template-config based export (new JSON schema system) ───────────────────

/**
 * Export a single card using the new template_config JSON schema system.
 *
 * The template defines layer positions in mm; this function:
 * 1. Resolves all {{token}} bindings from `bindings`.
 * 2. Renders the card layers onto an off-screen canvas at 300 DPI.
 * 3. Exports to PDF with bleed and crop marks.
 *
 * @param config    Template config (from id_card_templates.template_config).
 * @param bindings  Token → value map (e.g. { "voluntario.nombre": "Ana López" }).
 * @param subject   Render subject for dynamic images (photo, QR).
 * @param options   PDF options.
 */
export async function exportIdCardPdfFromConfig(
  config: IdCardTemplateConfig,
  bindings: Record<string, string>,
  subject: IdCardRenderSubject,
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  const {
    bleedMm = config.template_metadata.bleed_mm ?? 3,
    cropMarkLengthMm = 5,
    cropMarkGapMm = 2,
    autoDownload = true,
    filename = "credencial",
  } = options;

  const { resolveTemplateTokens } = await import("./idCardTemplateSchema");
  const { jsPDF } = await import("jspdf");

  const widthMm = config.template_metadata.canvas_size.width_mm;
  const heightMm = config.template_metadata.canvas_size.height_mm;
  const widthPx = mmToPx(widthMm);
  const heightPx = mmToPx(heightMm);

  // Render to off-screen canvas
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(widthPx));
  canvas.height = Math.max(1, Math.round(heightPx));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D canvas context");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paint each layer sorted by z_index
  const layers = [...config.layers].sort(
    (a, b) => (a.z_index ?? 0) - (b.z_index ?? 0)
  );

  for (const layer of layers) {
    const x = mmToPx(layer.position.x_mm);
    const y = mmToPx(layer.position.y_mm);

    if (layer.type === "text") {
      const resolved = resolveTemplateTokens(layer.content, bindings);
      const { ptToPx } = await import("./idCardTemplateSchema");
      const sizePx = ptToPx(layer.style.size_pt);
      const weight = layer.style.bold ? "bold" : "normal";
      const style = layer.style.italic ? "italic" : "normal";
      ctx.save();
      ctx.font = `${style} ${weight} ${sizePx}px ${layer.style.font}`;
      ctx.fillStyle = layer.style.color;
      ctx.textBaseline = "top";
      ctx.textAlign = layer.style.align ?? "left";
      const maxW = layer.dimensions?.w_mm ? mmToPx(layer.dimensions.w_mm) : undefined;
      if (maxW) {
        ctx.fillText(resolved, x, y, maxW);
      } else {
        ctx.fillText(resolved, x, y);
      }
      ctx.restore();
    } else if (layer.type === "static_image") {
      await drawImageLayer(ctx, layer.url, x, y, mmToPx(layer.dimensions.w_mm), mmToPx(layer.dimensions.h_mm), layer.object_fit);
    } else if (layer.type === "dynamic_image") {
      const imgUrl =
        layer.source === "profile_picture"
          ? subject.photoUrl
          : layer.source === "qr_code"
          ? null
          : null;

      if (layer.source === "qr_code") {
        // QR is rendered via the existing canvas engine; delegate to a helper
        await drawQrOnCtx(ctx, bindings["voluntario.qr_acceso"] ?? subject.qrPayload, x, y, mmToPx(layer.dimensions.w_mm));
      } else if (imgUrl) {
        await drawImageLayer(ctx, imgUrl, x, y, mmToPx(layer.dimensions.w_mm), mmToPx(layer.dimensions.h_mm), layer.object_fit);
      } else {
        // Placeholder
        drawPhotoPlaceholder(ctx, x, y, mmToPx(layer.dimensions.w_mm), mmToPx(layer.dimensions.h_mm), bindings["voluntario.nombre_completo"] ?? "");
      }
    }
  }

  const pngDataUrl = canvas.toDataURL("image/png");

  // Build PDF
  const pageW = widthMm + 2 * bleedMm + 2 * (cropMarkGapMm + cropMarkLengthMm);
  const pageH = heightMm + 2 * bleedMm + 2 * (cropMarkGapMm + cropMarkLengthMm);
  const cardOffsetX = cropMarkGapMm + cropMarkLengthMm + bleedMm;
  const cardOffsetY = cropMarkGapMm + cropMarkLengthMm + bleedMm;

  const pdf = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [pageW, pageH],
  });

  pdf.addImage(pngDataUrl, "PNG", cardOffsetX, cardOffsetY, widthMm, heightMm);

  drawCropMarks(pdf, cardOffsetX, cardOffsetY, widthMm, heightMm, bleedMm, cropMarkGapMm, cropMarkLengthMm);

  if (autoDownload) {
    pdf.save(`${filename}.pdf`);
  }

  return { pdf, pages: 1 };
}

// ─── Private canvas helpers ───────────────────────────────────────────────────

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url?.trim()) return null;
  try {
    let src = url.trim();
    let objectUrl: string | null = null;
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      const res = await fetch(src);
      if (!res.ok) return null;
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      src = objectUrl;
    }
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("load failed"));
      i.src = src;
    });
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return img;
  } catch {
    return null;
  }
}

async function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fit?: "cover" | "contain" | "fill"
) {
  const img = await loadImage(url);
  if (!img) return;

  ctx.save();
  if (fit === "cover") {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
  } else if (fit === "contain") {
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  ctx.restore();
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string
) {
  ctx.save();
  ctx.fillStyle = "#E2E8F0";
  ctx.fillRect(x, y, w, h);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("")
    .slice(0, 2) || "ID";
  const fontSize = Math.max(18, Math.floor(Math.min(w, h) * 0.24));
  ctx.font = `700 ${fontSize}px sans-serif`;
  ctx.fillStyle = "#64748B";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, x + w / 2, y + h / 2);
  ctx.restore();
}

async function drawQrOnCtx(
  ctx: CanvasRenderingContext2D,
  payload: string,
  x: number,
  y: number,
  size: number
) {
  // Delegate to existing QR build logic via an off-screen canvas
  const { renderIdCardCanvas } = await import("./idCardCanvas");
  const { buildIdCardRenderSubject, generateIdCardCode } = await import("./idCardShared");

  const code = payload.startsWith("IDCARD:") ? payload.slice(7) : (generateIdCardCode() ?? "QR");
  const subject = buildIdCardRenderSubject({ cardCode: code, qrPayload: payload });

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = Math.round(size);
  tmpCanvas.height = Math.round(size);

  await renderIdCardCanvas(tmpCanvas, {
    baseImageUrl: null,
    templateWidth: Math.round(size),
    templateHeight: Math.round(size),
    fields: [
      {
        id: null,
        fieldKey: "qr",
        label: "QR",
        posX: 0,
        posY: 0,
        width: Math.round(size),
        height: Math.round(size),
        fontSize: null,
        fontFamily: null,
        fontWeight: null,
        colorHex: null,
        zIndex: 1,
      },
    ],
    subject,
  });

  ctx.drawImage(tmpCanvas, x, y, size, size);
}
