/**
 * JSON schema for ID card templates stored in ong.id_card_templates.template_config.
 *
 * All spatial values are in millimeters so they remain resolution-independent.
 * The rendering engine converts to pixels using idCardUnits.mmToPx().
 */

import { mmToPx, CR80_PX, DEFAULT_BLEED_MM, PX_PER_MM } from "./idCardUnits";

// ─── Template metadata ────────────────────────────────────────────────────────

export interface TemplateCanvasSize {
  width_mm: number;
  height_mm: number;
}

export interface TemplateMetadata {
  name: string;
  canvas_size: TemplateCanvasSize;
  /** Bleed margin in mm added on all four sides for print safety. */
  bleed_mm: number;
  /** Optional DPI override — defaults to 300. */
  dpi?: number;
}

// ─── Layer definitions ────────────────────────────────────────────────────────

export type LayerType = "text" | "dynamic_image" | "static_image" | "qr";

export interface LayerPosition {
  x_mm: number;
  y_mm: number;
}

export interface LayerDimensions {
  w_mm: number;
  h_mm: number;
}

export interface TextStyle {
  font: string;
  /** Font size in points (1 pt ≈ 0.353 mm). */
  size_pt: number;
  /** CSS hex color. */
  color: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
}

/**
 * Text layer — supports static strings and {{variable}} tokens.
 * @example content: "{{voluntario.nombre}} {{voluntario.apellido}}"
 */
export interface TextLayer {
  id: string;
  type: "text";
  /**
   * Content string. May contain template variable tokens in the form
   * {{namespace.field}} — e.g. {{voluntario.nombre}}, {{voluntario.qr_acceso}}.
   */
  content: string;
  position: LayerPosition;
  dimensions?: Pick<LayerDimensions, "w_mm"> & { h_mm?: number };
  style: TextStyle;
  z_index?: number;
}

/**
 * Dynamic image layer — its source is resolved at render time from volunteer data.
 * "profile_picture" → volunteer.foto_url
 * "qr_code"         → generated QR from card_code
 */
export interface DynamicImageLayer {
  id: string;
  type: "dynamic_image";
  source: "profile_picture" | "qr_code" | string;
  position: LayerPosition;
  dimensions: LayerDimensions;
  object_fit?: "cover" | "contain" | "fill";
  z_index?: number;
}

/** Static image layer — a fixed URL embedded in the template (logo, watermark…). */
export interface StaticImageLayer {
  id: string;
  type: "static_image";
  url: string;
  position: LayerPosition;
  dimensions: LayerDimensions;
  object_fit?: "cover" | "contain" | "fill";
  z_index?: number;
}

export type Layer = TextLayer | DynamicImageLayer | StaticImageLayer;

// ─── Root schema ──────────────────────────────────────────────────────────────

export interface IdCardTemplateConfig {
  template_metadata: TemplateMetadata;
  layers: Layer[];
}

// ─── Template variable tokens ─────────────────────────────────────────────────

/**
 * All supported data-binding tokens.
 * Insert these into TextLayer.content to bind live volunteer data at render time.
 */
export const TEMPLATE_VARIABLES = [
  { token: "{{voluntario.nombre}}", label: "Nombre", field: "nombre" },
  { token: "{{voluntario.apellido}}", label: "Apellido", field: "apellido" },
  { token: "{{voluntario.nombre_completo}}", label: "Nombre completo", field: "fullName" },
  { token: "{{voluntario.dni}}", label: "DNI / Documento", field: "documentLabel" },
  { token: "{{voluntario.codigo}}", label: "Código de credencial", field: "cardCode" },
  { token: "{{voluntario.qr_acceso}}", label: "QR de acceso", field: "qrPayload" },
  { token: "{{voluntario.cargo}}", label: "Cargo / Rol", field: "cargo" },
  { token: "{{voluntario.tipo_sangre}}", label: "Tipo de sangre", field: "tipoSangre" },
  { token: "{{voluntario.telefono}}", label: "Teléfono", field: "telefono" },
  { token: "{{voluntario.email}}", label: "Correo electrónico", field: "email" },
  { token: "{{organizacion.nombre}}", label: "Nombre de la organización", field: "orgName" },
  { token: "{{credencial.vigencia}}", label: "Vigencia (fecha expiración)", field: "expiresAt" },
] as const;

export type TemplateVariableToken = (typeof TEMPLATE_VARIABLES)[number]["token"];

/**
 * Replace all {{token}} occurrences in a content string with live values.
 */
export function resolveTemplateTokens(
  content: string,
  bindings: Record<string, string>
): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (_match, token: string) => {
    return bindings[token.trim()] ?? `{{${token}}}`;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a default CR80 template config skeleton. */
export function createDefaultTemplateConfig(name: string): IdCardTemplateConfig {
  return {
    template_metadata: {
      name,
      canvas_size: { width_mm: 85.6, height_mm: 53.98 },
      bleed_mm: DEFAULT_BLEED_MM,
      dpi: 300,
    },
    layers: [
      {
        id: "layer_nombre",
        type: "text",
        content: "{{voluntario.nombre_completo}}",
        position: { x_mm: 30, y_mm: 12 },
        dimensions: { w_mm: 50 },
        style: {
          font: "Inter, sans-serif",
          size_pt: 12,
          color: "#111827",
          bold: true,
        },
        z_index: 3,
      },
      {
        id: "layer_dni",
        type: "text",
        content: "{{voluntario.dni}}",
        position: { x_mm: 30, y_mm: 24 },
        dimensions: { w_mm: 50 },
        style: {
          font: "Inter, sans-serif",
          size_pt: 9,
          color: "#374151",
          bold: false,
        },
        z_index: 3,
      },
      {
        id: "layer_foto",
        type: "dynamic_image",
        source: "profile_picture",
        position: { x_mm: 4, y_mm: 8 },
        dimensions: { w_mm: 22, h_mm: 28 },
        object_fit: "cover",
        z_index: 2,
      },
      {
        id: "layer_qr",
        type: "dynamic_image",
        source: "qr_code",
        position: { x_mm: 62, y_mm: 8 },
        dimensions: { w_mm: 20, h_mm: 20 },
        z_index: 2,
      },
    ],
  };
}

/**
 * Convert template config canvas dimensions to pixel sizes
 * for use with the existing canvas render engine.
 */
export function configToPixelDimensions(config: IdCardTemplateConfig): {
  widthPx: number;
  heightPx: number;
  bleedPx: number;
} {
  return {
    widthPx: mmToPx(config.template_metadata.canvas_size.width_mm),
    heightPx: mmToPx(config.template_metadata.canvas_size.height_mm),
    bleedPx: mmToPx(config.template_metadata.bleed_mm),
  };
}

/**
 * Validate that all required dynamic fields are bound in the provided bindings map.
 * Returns an array of missing token descriptions (empty array = preflight passed).
 */
export function preflightCheck(
  config: IdCardTemplateConfig,
  bindings: Record<string, string>
): string[] {
  const missing: string[] = [];

  for (const layer of config.layers) {
    if (layer.type !== "text") continue;

    const tokens = [...(layer as TextLayer).content.matchAll(/\{\{([^}]+)\}\}/g)].map(
      (m) => m[1].trim()
    );

    for (const token of tokens) {
      const value = bindings[token];
      if (!value || value.trim() === "" || value === `{{${token}}}`) {
        const varDef = TEMPLATE_VARIABLES.find((v) => v.token === `{{${token}}}`);
        missing.push(varDef?.label ?? token);
      }
    }

    if ((layer as TextLayer).content.includes("{{voluntario.tipo_sangre}")) {
      if (!bindings["voluntario.tipo_sangre"]) {
        missing.push("Tipo de sangre (requerido para credencial médica)");
      }
    }
  }

  // Check dynamic images
  for (const layer of config.layers) {
    if (layer.type !== "dynamic_image") continue;
    const dyn = layer as DynamicImageLayer;
    if (dyn.source === "profile_picture" && !bindings["voluntario.foto_url"]) {
      missing.push("Foto de perfil del voluntario");
    }
  }

  return [...new Set(missing)];
}

// ─── Point size to px conversion ─────────────────────────────────────────────

/** Convert font size in points to pixels at 300 DPI. */
export function ptToPx(pt: number): number {
  // 1 pt = 1/72 inch; at 300 DPI → 300/72 ≈ 4.167 px
  return Math.round((pt * 300) / 72);
}

/** Convert px back to points. */
export function pxToPt(px: number): number {
  return Math.round((px * 72) / 300);
}

// Re-export PX_PER_MM for callers that import from here
export { PX_PER_MM };
