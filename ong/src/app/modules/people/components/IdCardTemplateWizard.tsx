import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { ChevronRight, PenLine, RefreshCcw, Upload } from "lucide-react";
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { buildIdCardQrPayload, buildIdCardRenderSubject, createDefaultIdCardFields } from "../idCardShared";
import { mmToPx } from "../idCardUnits";
import type {
  IdCardFieldKey,
  IdCardTemplateDetailData,
  IdCardTemplateFieldRow,
  IdCardTemplateUpsertInput,
  IdCardVolunteerOption,
} from "../types";
import {
  PeopleBoolean,
  PeopleErrorBlock,
  PeopleField,
  PeopleSection,
  PeopleSelectInput,
  PeopleTextInput,
} from "./people-shared";
import { IdCardCanvasEditor, type FieldChange } from "./IdCardCanvasEditor";
import { uploadTemplateBackground } from "../../../services/personas/idCards.service";

// ─── Units ────────────────────────────────────────────────────────────────────

const PX_PER_CM = mmToPx(10); // 118.11 px/cm at 300 DPI

function toCm(px: number): string {
  return (px / PX_PER_CM).toFixed(2);
}

function fromCm(cmStr: string): number {
  return Math.round(Number(cmStr) * PX_PER_CM);
}

// ─── Phase 1 types / helpers ──────────────────────────────────────────────────

interface Phase1State {
  name: string;
  widthPx: string;
  heightPx: string;
  showAsCm: boolean;
  bgFile: File | null;
  bgPreviewUrl: string | null;
  isActive: boolean;
}

const INIT_PHASE1: Phase1State = {
  name: "",
  widthPx: String(Math.round(mmToPx(85.6))),  // CR80 default
  heightPx: String(Math.round(mmToPx(53.98))),
  showAsCm: false,
  bgFile: null,
  bgPreviewUrl: null,
  isActive: true,
};

const PRESETS_PX = {
  CR80: {
    label: "CR80 (tarjeta)",
    w: String(Math.round(mmToPx(85.6))),
    h: String(Math.round(mmToPx(53.98))),
  },
  A4: {
    label: "A4",
    w: String(Math.round(mmToPx(210))),
    h: String(Math.round(mmToPx(297))),
  },
} as const;

function phase1Valid(s: Phase1State): boolean {
  const nameOk = s.name.trim().length > 0;
  const w = parseFloat(s.widthPx);
  const h = parseFloat(s.heightPx);
  const wOk = Number.isFinite(w) && w > 0;
  const hOk = Number.isFinite(h) && h > 0;
  const imgOk = Boolean(s.bgPreviewUrl) || s.bgFile instanceof File;
  // eslint-disable-next-line no-console
  console.log("[phase1Valid]", { name: s.name, widthPx: s.widthPx, heightPx: s.heightPx, bgPreviewUrl: s.bgPreviewUrl?.slice(0, 50) ?? null, bgFile: s.bgFile?.name ?? null, nameOk, w, h, wOk, hOk, imgOk });
  return nameOk && wOk && hOk && imgOk;
}

function fromInitialData(d: IdCardTemplateDetailData): Phase1State {
  return {
    name: d.template.name,
    widthPx: String(d.template.templateWidth),
    heightPx: String(d.template.templateHeight),
    showAsCm: false,
    bgFile: null,
    bgPreviewUrl: d.template.baseImageUrl || null,
    isActive: d.template.isActive,
  };
}

// ─── V2 config builder ────────────────────────────────────────────────────────

const LAYER_CONTENT: Record<string, string> = {
  nombre: "{{voluntario.nombre_completo}}",
  dni: "{{voluntario.dni}}",
  codigo: "{{voluntario.codigo}}",
};

interface LayerV2 {
  id: string;
  type: "text" | "dynamic_image";
  x_px: number;
  y_px: number;
  w_px?: number;
  h_px?: number;
  content?: string;
  source?: string;
  font_family?: string;
  font_size_px?: number;
  font_weight?: string;
  color?: string;
  z_index: number;
}

interface TemplateConfigV2 {
  version: 2;
  metadata: { name: string; w_px: number; h_px: number };
  layers: LayerV2[];
}

function buildConfigV2(
  name: string,
  widthPx: number,
  heightPx: number,
  fields: IdCardTemplateFieldRow[]
): TemplateConfigV2 {
  const layers: LayerV2[] = fields.map((field): LayerV2 => {
    const base: LayerV2 = {
      id: `layer_${field.fieldKey}`,
      type: field.fieldKey === "foto" || field.fieldKey === "qr" ? "dynamic_image" : "text",
      x_px: Math.round(field.posX),
      y_px: Math.round(field.posY),
      z_index: field.zIndex,
    };

    if (field.width != null) base.w_px = Math.round(field.width);
    if (field.height != null) base.h_px = Math.round(field.height);

    if (field.fieldKey === "foto") {
      base.source = "profile_picture";
    } else if (field.fieldKey === "qr") {
      base.source = "qr_code";
    } else {
      base.content = LAYER_CONTENT[field.fieldKey] ?? `{{voluntario.${field.fieldKey}}}`;
      if (field.fontFamily) base.font_family = field.fontFamily;
      if (field.fontSize != null) base.font_size_px = Math.round(field.fontSize);
      if (field.fontWeight) base.font_weight = field.fontWeight;
      if (field.colorHex) base.color = field.colorHex;
    }

    return base;
  });

  return {
    version: 2,
    metadata: { name, w_px: Math.round(widthPx), h_px: Math.round(heightPx) },
    layers,
  };
}

// ─── Stepper tab ──────────────────────────────────────────────────────────────

function StepTab({
  num, label, active, done, disabled, onClick,
}: {
  num: number; label: string; active: boolean; done: boolean;
  disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", border: "none", cursor: disabled ? "default" : "pointer",
        background: "transparent",
        borderBottom: active ? "2px solid rgba(99,102,241,0.9)" : "2px solid transparent",
        opacity: disabled ? 0.35 : 1, transition: "opacity 0.15s, border-color 0.15s",
      }}
    >
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 700,
          background: active ? "rgba(99,102,241,0.9)" : done ? "rgba(16,185,129,0.8)" : "var(--t-border)",
          color: active || done ? "#fff" : "var(--t-text-dim)",
        }}
      >
        {num}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? "var(--t-text)" : "var(--t-text-dim)" }}>
        {label}
      </span>
      {num < 2 && (
        <ChevronRight style={{ width: 12, height: 12, color: "var(--t-text-dim)", marginLeft: 2 }} />
      )}
    </button>
  );
}

// ─── Drag & Drop zone ─────────────────────────────────────────────────────────

function DragDropZone({
  isDragging,
  previewUrl,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  isDragging: boolean;
  previewUrl: string | null;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      style={{
        border: `2px dashed ${isDragging ? "rgba(99,102,241,0.8)" : "var(--t-border)"}`,
        borderRadius: 10, cursor: "pointer",
        background: isDragging ? "rgba(99,102,241,0.06)" : "var(--t-hover)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: 110, position: "relative",
        overflow: "hidden", transition: "all 0.15s",
        outline: "none",
      }}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Imagen de fondo preview"
          style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 12 }}>
          <Upload style={{ width: 24, height: 24, color: "var(--t-text-dim)" }} />
          <p style={{ fontSize: 12, color: "var(--t-text)", margin: 0 }}>
            Arrastra una imagen o haz clic para cargar
          </p>
          <p style={{ fontSize: 10, color: "var(--t-text-dim)", margin: 0 }}>PNG, JPG, SVG, WEBP</p>
        </div>
      )}
      {isDragging && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(99,102,241,0.15)",
          borderRadius: 10,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(99,102,241,1)" }}>
            Suelta la imagen aquí
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Px Inspector ─────────────────────────────────────────────────────────────

function PxInspector({
  field,
  fieldIndex,
  canvasWidthPx,
  canvasHeightPx,
  onUpdate,
  onResetCoords,
}: {
  field: IdCardTemplateFieldRow | null;
  fieldIndex: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  onUpdate: (index: number, changes: Partial<IdCardTemplateFieldRow>) => void;
  onResetCoords: () => void;
}) {
  const [googleFontUrl, setGoogleFontUrl] = useState("");
  const [fontStatus, setFontStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    setGoogleFontUrl("");
    setFontStatus("idle");
  }, [fieldIndex]);

  function injectGoogleFont(rawUrl: string) {
    const match = rawUrl.match(/family=([^:&\n]+)/);
    if (!match) { setFontStatus("error"); return; }
    const fontName = decodeURIComponent(match[1]).replace(/\+/g, " ").split(":")[0].trim();
    const linkId = `gfont-wiz2-${fontName.replace(/\s/g, "-").toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId; link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`;
      link.onload = () => setFontStatus("ok");
      link.onerror = () => setFontStatus("error");
      document.head.appendChild(link);
    } else {
      setFontStatus("ok");
    }
    if (field) onUpdate(fieldIndex, { fontFamily: fontName });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Inspector header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--t-border)", background: "var(--t-surface)" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>
          Inspector{field ? ` — ${field.label}` : ""}
        </p>
        <p style={{ fontSize: 10, color: "var(--t-text-dim)", margin: "2px 0 0", fontFamily: "monospace" }}>
          px
        </p>
      </div>

      {/* Inspector content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px" }}>
        {!field ? (
          <p style={{ fontSize: 11, color: "var(--t-text-dim)" }}>
            Haz clic en un campo del canvas para inspeccionar.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Position */}
            <div>
              <p style={{ fontSize: 9, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Posición
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <InspField label="X (px)" value={field.posX}
                  onChange={(v) => onUpdate(fieldIndex, { posX: v })} min={0} max={canvasWidthPx} />
                <InspField label="Y (px)" value={field.posY}
                  onChange={(v) => onUpdate(fieldIndex, { posY: v })} min={0} max={canvasHeightPx} />
                <InspField label="W (px)" value={field.width ?? 0}
                  onChange={(v) => onUpdate(fieldIndex, { width: v > 0 ? v : null })} min={0} max={canvasWidthPx} />
                <InspField label="H (px)" value={field.height ?? 0}
                  onChange={(v) => onUpdate(fieldIndex, { height: v > 0 ? v : null })} min={0} max={canvasHeightPx} />
              </div>
            </div>

            {/* Typography */}
            <div>
              <p style={{ fontSize: 9, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Tipografía
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <InspField label="Tamaño (px)" value={field.fontSize ?? 0}
                  onChange={(v) => onUpdate(fieldIndex, { fontSize: v > 0 ? v : null })} min={0} max={300} />
                <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>Peso</span>
                  <select
                    value={field.fontWeight ?? "600"}
                    onChange={(e) => onUpdate(fieldIndex, { fontWeight: e.target.value })}
                    style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--t-border)", background: "var(--t-surface)", color: "var(--t-text)" }}
                  >
                    <option value="300">300 — Light</option>
                    <option value="400">400 — Regular</option>
                    <option value="600">600 — Semibold</option>
                    <option value="700">700 — Bold</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>Color</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input type="color" value={field.colorHex ?? "#0F172A"}
                      onChange={(e) => onUpdate(fieldIndex, { colorHex: e.target.value.toUpperCase() })}
                      style={{ width: 28, height: 26, borderRadius: 3, border: "1px solid var(--t-border)", cursor: "pointer", padding: 1 }} />
                    <input type="text" value={field.colorHex ?? "#0F172A"} maxLength={9}
                      onChange={(e) => onUpdate(fieldIndex, { colorHex: e.target.value })}
                      style={{ fontSize: 10, fontFamily: "monospace", flex: 1, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--t-border)", background: "var(--t-surface)", color: "var(--t-text)" }} />
                  </div>
                </label>
              </div>
            </div>

            {/* Google Fonts */}
            <div>
              <p style={{ fontSize: 9, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Fuente
              </p>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>
                  Familia tipográfica
                  {fontStatus === "ok" && <span style={{ color: "#10b981", marginLeft: 4 }}>✓ cargada</span>}
                  {fontStatus === "error" && <span style={{ color: "#ef4444", marginLeft: 4 }}>! inválida</span>}
                </span>
                
                <select
                  value={
                    !field.fontFamily
                      ? ""
                      : ["Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Oswald"].includes(field.fontFamily)
                      ? field.fontFamily
                      : "custom"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      // Se mantiene la opción personalizada abierta
                    } else if (val) {
                      const url = `https://fonts.googleapis.com/css2?family=${val.replace(/\s+/g, "+")}&display=swap`;
                      setGoogleFontUrl(url);
                      injectGoogleFont(url);
                      onUpdate(fieldIndex, { fontFamily: val });
                      setFontStatus("ok");
                    } else {
                      onUpdate(fieldIndex, { fontFamily: null });
                      setFontStatus("idle");
                    }
                  }}
                  style={{
                    fontSize: 11, padding: "4px 6px", borderRadius: 4,
                    border: "1px solid var(--t-border)", background: "var(--t-surface)", color: "var(--t-text)",
                  }}
                >
                  <option value="">(Por defecto)</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Oswald">Oswald</option>
                  <option value="custom">Personalizada...</option>
                </select>

                {(!["", "Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Oswald"].includes(field.fontFamily || "") || field.fontFamily === "custom") && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <input
                      type="url"
                      placeholder="URL de Google Fonts"
                      value={googleFontUrl}
                      onChange={(e) => setGoogleFontUrl(e.target.value)}
                      onBlur={(e) => { if (e.target.value.includes("fonts.google")) injectGoogleFont(e.target.value); }}
                      style={{
                        fontSize: 10, flex: 1, padding: "3px 6px", borderRadius: 4,
                        border: `1px solid ${fontStatus === "ok" ? "#10b981" : fontStatus === "error" ? "#ef4444" : "var(--t-border)"}`,
                        background: "var(--t-surface)", color: "var(--t-text)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { if (googleFontUrl) injectGoogleFont(googleFontUrl); }}
                      style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--t-text)" }}
                    >
                      Importar
                    </button>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Inspector footer actions */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--t-border)", display: "flex", flexDirection: "column", gap: 8 }}>
        <OutlineButton size="sm" type="button" onClick={onResetCoords} style={{ width: "100%", justifyContent: "center" }}>
          <RefreshCcw className="h-3.5 w-3.5" />
          Limpiar coordenadas
        </OutlineButton>
      </div>
    </div>
  );
}

function InspField({
  label, value, onChange, min, max,
}: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>{label}</span>
      <input
        type="number"
        value={value === 0 ? "" : Math.round(value)}
        step={1}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        style={{
          fontSize: 11, fontFamily: "monospace", width: "100%", padding: "3px 6px",
          borderRadius: 4, border: "1px solid var(--t-border)",
          background: "var(--t-surface)", color: "var(--t-text)", outline: "none",
        }}
      />
    </label>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export interface IdCardTemplateWizardProps {
  mode: "create" | "edit";
  initialData: IdCardTemplateDetailData | null;
  volunteerOptions: IdCardVolunteerOption[];
  isSaving: boolean;
  isLoading: boolean;
  loadError: string | null;
  onRetryLoad: () => void;
  onSubmit: (input: IdCardTemplateUpsertInput) => Promise<void>;
  onClose: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

export function IdCardTemplateWizard({
  mode,
  initialData,
  volunteerOptions,
  isLoading,
  loadError,
  onRetryLoad,
  onSubmit,
  onClose,
  onExpandChange,
}: IdCardTemplateWizardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isReentering = useRef(false);
  const createdUrls = useRef<string[]>([]);

  const [activePhase, setActivePhase] = useState<1 | 2>(1);
  const [phase1, setPhase1] = useState<Phase1State>(() =>
    initialData ? fromInitialData(initialData) : INIT_PHASE1
  );
  const [phase2Fields, setPhase2Fields] = useState<IdCardTemplateFieldRow[]>([]);
  const [activeFieldKey, setActiveFieldKey] = useState<IdCardFieldKey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewVolunteerId, setPreviewVolunteerId] = useState(
    () => volunteerOptions[0]?.value ?? ""
  );

  // Revoke all created object URLs on unmount
  useEffect(() => {
    const urls = createdUrls.current;
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  // Sync phase1 when initialData first arrives (edit mode async load)
  useEffect(() => {
    if (initialData && activePhase === 1) {
      setPhase1(fromInitialData(initialData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.template.id]);

  // ── Drag & drop ──

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    applyImageFile(file);
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
    e.target.value = "";
  }

  function applyImageFile(file: File | undefined) {
    if (!file) return;
    // Don't gate on file.type — Windows drag & drop often returns "" even for valid images
    const url = URL.createObjectURL(file);
    createdUrls.current.push(url);
    setPhase1((prev) => ({ ...prev, bgFile: file, bgPreviewUrl: url }));
  }

  // ── Phase transitions ──

  const widthPx = Math.max(1, Math.round(Number(phase1.widthPx) || 1));
  const heightPx = Math.max(1, Math.round(Number(phase1.heightPx) || 1));

  function enterPhase2() {
    const initFields =
      !isReentering.current && initialData
        ? initialData.fields
        : createDefaultIdCardFields(widthPx, heightPx);
    setPhase2Fields(initFields);
    setActiveFieldKey(null);
    setSaveError(null);
    setActivePhase(2);
    onExpandChange?.(true);
  }

  function handleEditMeasures() {
    const confirmed = window.confirm(
      "¿Regresar a Fase 1? Las coordenadas del diseño se restablecerán al avanzar nuevamente."
    );
    if (!confirmed) return;
    isReentering.current = true;
    setActivePhase(1);
    setActiveFieldKey(null);
    setSaveError(null);
    onExpandChange?.(false);
  }

  // ── Phase 2 field management ──

  const handleFieldChange = useCallback(
    (fieldKey: IdCardFieldKey, changes: FieldChange) => {
      setPhase2Fields((prev) =>
        prev.map((f) =>
          f.fieldKey === fieldKey
            ? {
                ...f,
                ...(changes.posX !== undefined && { posX: changes.posX }),
                ...(changes.posY !== undefined && { posY: changes.posY }),
                ...(changes.width !== undefined && { width: changes.width }),
                ...(changes.height !== undefined && { height: changes.height }),
              }
            : f
        )
      );
    },
    []
  );

  function updateField(index: number, changes: Partial<IdCardTemplateFieldRow>) {
    setPhase2Fields((prev) => prev.map((f, i) => (i === index ? { ...f, ...changes } : f)));
  }

  function handleResetCoords() {
    setPhase2Fields(createDefaultIdCardFields(widthPx, heightPx));
    setActiveFieldKey(null);
  }

  // ── Grand submit ──

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);
    try {
      // 1. Upload image (if new file was selected, otherwise reuse existing URL)
      const baseImageUrl = phase1.bgFile
        ? await uploadTemplateBackground(phase1.bgFile)
        : phase1.bgPreviewUrl ?? "";

      if (!baseImageUrl) {
        throw new Error("La imagen de fondo es obligatoria.");
      }

      // 2. Build V2 config (px-based)
      // @ts-ignore
      // @ts-ignore
      const templateConfig: Record<string, unknown> = buildConfigV2(
        phase1.name.trim(),
        widthPx,
        heightPx,
        phase2Fields
      );

      // 3. Persist
      await onSubmit({
        name: phase1.name.trim(),
        baseImageUrl,
        templateWidth: widthPx,
        templateHeight: heightPx,
        isActive: phase1.isActive,
        fields: phase2Fields,
        templateConfig,
      });

      // 4. Feedback + close
      toast.success(
        mode === "edit" ? "Plantilla actualizada exitosamente." : "¡Plantilla creada exitosamente!"
      );
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar la plantilla.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Derived ──

  const activeFieldIndex = phase2Fields.findIndex((f) => f.fieldKey === activeFieldKey);
  const activeField = activeFieldIndex >= 0 ? phase2Fields[activeFieldIndex] : null;
  const previewVolunteer = volunteerOptions.find((o) => o.value === previewVolunteerId) ?? null;
  const previewSubject = useMemo(
    () =>
      buildIdCardRenderSubject({
        fullName: previewVolunteer?.fullName,
        documentLabel: previewVolunteer?.documentLabel,
        photoUrl: previewVolunteer?.photoUrl,
        cardCode: "VC-0000-DEMO",
        qrPayload: buildIdCardQrPayload("VC-0000-DEMO"),
      }),
    [previewVolunteer]
  );

  // Canvas display width: 62% of viewport, capped at 1050px
  const canvasDisplayWidth = useMemo(
    () => Math.max(380, Math.min(Math.round(window.innerWidth * 0.62), 1050)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePhase]
  );

  // Dimension display helpers (px ↔ cm toggle in Phase 1)
  function displayPx(pxStr: string): string {
    const v = Number(pxStr);
    return phase1.showAsCm ? toCm(v) : pxStr;
  }

  function handleDimInput(field: "widthPx" | "heightPx", raw: string) {
    // Always update state to allow free typing; phase1Valid handles the gate.
    // In cm mode, convert non-empty values to px before storing.
    const px = phase1.showAsCm && raw !== "" ? String(Math.round(fromCm(raw))) : raw;
    setPhase1((p) => ({ ...p, [field]: px }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Stepper header */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--t-border)", padding: "0 16px", flexShrink: 0 }}>
        <StepTab
          num={1} label="Medidas" active={activePhase === 1} done={activePhase === 2}
          onClick={() => { if (activePhase === 2) handleEditMeasures(); }}
        />
        <StepTab
          num={2} label="Diseño" active={activePhase === 2} done={false}
          disabled={activePhase === 1} onClick={() => {}}
        />
      </div>

      {/* ── PHASE 1 ──────────────────────────────────────────────────────── */}
      {activePhase === 1 && (
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Scrollable content */}
          <div style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {isLoading && mode === "edit" && <PeopleErrorBlock message="Cargando plantilla..." />}
            {loadError && mode === "edit" && <PeopleErrorBlock message={loadError} onRetry={onRetryLoad} />}

            {/* Name + Dimensions */}
            <div
              className="rounded-xl"
              style={{ padding: "12px 14px", border: "1px solid var(--t-border)", background: "var(--t-surface)", display: "flex", flexDirection: "column", gap: 10 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Paso 1 — Medidas y fondo
              </p>

              {/* Name */}
              <PeopleField label="Nombre de la plantilla">
                <PeopleTextInput
                  placeholder="Credencial Voluntario 2025"
                  value={phase1.name}
                  onChange={(e) => setPhase1((p) => ({ ...p, name: e.target.value }))}
                />
              </PeopleField>

              {/* Width & Height */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <PeopleField label={`Ancho (${phase1.showAsCm ? "cm" : "px"})`}>
                  <PeopleTextInput
                    type="number" min={1} step={phase1.showAsCm ? 0.01 : 1}
                    value={displayPx(phase1.widthPx)}
                    onChange={(e) => handleDimInput("widthPx", e.target.value)}
                  />
                </PeopleField>
                <PeopleField label={`Alto (${phase1.showAsCm ? "cm" : "px"})`}>
                  <PeopleTextInput
                    type="number" min={1} step={phase1.showAsCm ? 0.01 : 1}
                    value={displayPx(phase1.heightPx)}
                    onChange={(e) => handleDimInput("heightPx", e.target.value)}
                  />
                </PeopleField>
              </div>

              {/* Dimension info + cm toggle + presets */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "var(--t-text-dim)", fontFamily: "monospace" }}>
                  {phase1.widthPx} × {phase1.heightPx} px
                </span>
                <button
                  type="button"
                  onClick={() => setPhase1((p) => ({ ...p, showAsCm: !p.showAsCm }))}
                  style={{
                    fontSize: 10, padding: "1px 7px", borderRadius: 4, cursor: "pointer",
                    background: phase1.showAsCm ? "rgba(99,102,241,0.15)" : "var(--t-hover)",
                    border: "1px solid var(--t-border)", color: "var(--t-text)",
                    fontFamily: "monospace", fontWeight: 600,
                  }}
                >
                  {phase1.showAsCm ? "→ px" : "→ cm"}
                </button>
                <div style={{ width: 1, height: 12, background: "var(--t-border)" }} />
                {Object.entries(PRESETS_PX).map(([key, preset]) => (
                  <button
                    key={key} type="button"
                    onClick={() => setPhase1((p) => ({ ...p, widthPx: preset.w, heightPx: preset.h }))}
                    title={`${preset.w} × ${preset.h} px`}
                    style={{
                      padding: "1px 8px", fontSize: 10, borderRadius: 4, cursor: "pointer",
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
                      color: "var(--t-text)",
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop image */}
            <div
              className="rounded-xl"
              style={{ padding: "12px 14px", border: "1px solid var(--t-border)", background: "var(--t-surface)", display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                  Imagen de fondo
                </p>
                {phase1.bgPreviewUrl && (
                  <span style={{ fontSize: 10, color: "#10b981" }}>✓ lista</span>
                )}
              </div>
              <DragDropZone
                isDragging={isDragging}
                previewUrl={phase1.bgPreviewUrl}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              />
              {phase1.bgPreviewUrl && (
                <button
                  type="button"
                  style={{ alignSelf: "flex-start", fontSize: 10, color: "var(--t-text-dim)", cursor: "pointer", background: "none", border: "none", padding: 0, textDecoration: "underline" }}
                  onClick={() => setPhase1((p) => ({ ...p, bgFile: null, bgPreviewUrl: null }))}
                >
                  Eliminar imagen
                </button>
              )}
              <input
                ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Active toggle */}
            <div style={{ paddingLeft: 2 }}>
              <PeopleBoolean
                label="Plantilla activa"
                checked={phase1.isActive}
                onChange={(checked) => setPhase1((p) => ({ ...p, isActive: checked }))}
              />
            </div>
          </div>

          {/* Sticky footer — always visible */}
          <div
            style={{
              flexShrink: 0,
              padding: "10px 16px",
              borderTop: "1px solid var(--t-border)",
              background: "var(--t-bg)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <OutlineButton size="sm" type="button" onClick={onClose}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm" type="button"
              disabled={!phase1Valid(phase1)}
              onClick={enterPhase2}
            >
              Siguiente — Ir al Editor →
            </GradientButton>
          </div>
        </div>
      )}

      {/* ── PHASE 2 ──────────────────────────────────────────────────────── */}
      {activePhase === 2 && (
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Phase 2 info bar */}
          <div
            style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: 8,
              padding: "8px 16px", flexShrink: 0,
              background: "rgba(99,102,241,0.05)",
              borderBottom: "1px solid var(--t-border)",
            }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>
                {phase1.name || "Sin nombre"}
              </span>
              <span style={{ fontSize: 11, color: "var(--t-text-dim)", marginLeft: 10, fontFamily: "monospace" }}>
                {widthPx} × {heightPx} px
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Volunteer demo selector */}
              <div style={{ maxWidth: 200 }}>
                <PeopleSelectInput
                  value={previewVolunteerId}
                  onChange={(e) => setPreviewVolunteerId(e.target.value)}
                >
                  <option value="">Demo voluntario</option>
                  {volunteerOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </PeopleSelectInput>
              </div>
              <OutlineButton size="sm" type="button" onClick={handleEditMeasures}>
                <PenLine className="h-3.5 w-3.5" />
                Editar Medidas
              </OutlineButton>
            </div>
          </div>

          {/* Error */}
          {saveError && (
            <div style={{ padding: "6px 16px", flexShrink: 0 }}>
              <PeopleErrorBlock message={saveError} />
            </div>
          )}

          {/* Side-by-side canvas + inspector */}
          <div style={{ maxHeight: "calc(100vh - 250px)", display: "flex", overflow: "hidden" }}>

            {/* Canvas — 75% */}
            <div style={{ flex: "1 1 0%", overflow: "auto", padding: 16, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              <IdCardCanvasEditor
                baseImageUrl={phase1.bgPreviewUrl || null}
                templateWidth={widthPx}
                templateHeight={heightPx}
                fields={phase2Fields}
                subject={previewSubject}
                activeFieldKey={activeFieldKey}
                onFieldChange={handleFieldChange}
                onSelectField={setActiveFieldKey}
                displayWidth={canvasDisplayWidth}
              />
            </div>

            {/* Inspector — 25% fixed */}
            <div
              style={{
                flexShrink: 0, width: 280,
                borderLeft: "1px solid var(--t-border)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}
            >
              <PxInspector
                field={activeField}
                fieldIndex={activeFieldIndex}
                canvasWidthPx={widthPx}
                canvasHeightPx={heightPx}
                onUpdate={updateField}
                onResetCoords={handleResetCoords}
              />
            </div>
          </div>

          {/* Action bar */}
          <div
            style={{
              flexShrink: 0, padding: "10px 16px",
              borderTop: "1px solid var(--t-border)",
              display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center",
              background: "var(--t-surface)",
            }}
          >
            <OutlineButton size="sm" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm" type="button"
              disabled={isSaving || (isLoading && mode === "edit")}
              onClick={() => void handleSave()}
            >
              {isSaving
                ? "Guardando…"
                : mode === "edit"
                ? "Guardar plantilla"
                : "Crear plantilla"}
            </GradientButton>
          </div>
        </div>
      )}
    </div>
  );
}
