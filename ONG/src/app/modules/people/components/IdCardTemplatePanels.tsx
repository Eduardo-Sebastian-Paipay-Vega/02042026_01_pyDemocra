import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm, type UseFormSetValue } from "react-hook-form";
import { CreditCard, Download, ImagePlus, Lock, Maximize2, Minimize2, RefreshCcw, Unlock } from "lucide-react";
import { ModalShell } from "../../../components/ui/modal-shell";
import { GradientButton } from "../../../components/ui/gradient-button";
import { OutlineButton } from "../../../components/ui/outline-button";
import { StatusDot } from "../../../components/ui/status-dot";
import { useIdCardTemplateDetail } from "../hooks/useIdCardTemplateDetail";
import {
  buildIdCardQrPayload,
  buildIdCardRenderSubject,
  createDefaultIdCardFields,
} from "../idCardShared";
import { mmToPx, pxToMm, type Unit } from "../idCardUnits";
import type {
  IdCardFieldKey,
  IdCardTemplateDetailData,
  IdCardTemplateFieldRow,
  IdCardTemplateUpsertInput,
  IdCardVolunteerOption,
} from "../types";
import {
  PeopleBoolean,
  PeopleDetailField,
  PeopleErrorBlock,
  PeopleField,
  PeopleModalHeader,
  PeopleSection,
  PeopleSelectInput,
  PeopleTextInput,
  formatPeopleText,
} from "./people-shared";
import {
  IdCardCanvasPreview,
  type IdCardCanvasPreviewHandle,
} from "./IdCardCanvasPreview";
import { IdCardCanvasEditor, type FieldChange } from "./IdCardCanvasEditor";
import { uploadTemplateBackground } from "../../../services/personas/idCards.service";

type TemplateFormValues = {
  name: string;
  baseImageUrl: string;
  templateWidth: number;
  templateHeight: number;
  isActive: boolean;
  fields: IdCardTemplateFieldRow[];
};

// ─── Dimension presets ────────────────────────────────────────────────────────

const PRESETS = {
  CR80: { label: "CR80 (tarjeta)", widthPx: Math.round(mmToPx(85.6)), heightPx: Math.round(mmToPx(53.98)) },
  A4:   { label: "A4",            widthPx: Math.round(mmToPx(210)),   heightPx: Math.round(mmToPx(297)) },
} as const;

// ─── Tooltip wrapper ─────────────────────────────────────────────────────────

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return <span title={text}>{children}</span>;
}

// ─── Inspector panel ──────────────────────────────────────────────────────────

function InspectorInput({
  label, value, onChange, min, max, step = 0.1,
}: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>{label}</span>
      <input
        type="number"
        value={typeof value === "number" ? (Math.round(value * 100) / 100) : value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          fontSize: 11, fontFamily: "monospace", width: "100%",
          padding: "2px 5px", borderRadius: 4,
          border: "1px solid var(--t-border)", background: "var(--t-surface)",
          color: "var(--t-text)", outline: "none",
        }}
      />
    </label>
  );
}

function InspectorPanel({
  field,
  fieldIndex,
  setValue,
  unit,
  canvasWidth,
  canvasHeight,
}: {
  field: IdCardTemplateFieldRow | null;
  fieldIndex: number;
  setValue: UseFormSetValue<TemplateFormValues>;
  unit: Unit;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const [googleFontUrl, setGoogleFontUrl] = useState("");
  const [fontStatus, setFontStatus] = useState<"idle" | "ok" | "error">("idle");

  // Reset state when field changes
  useEffect(() => { setGoogleFontUrl(""); setFontStatus("idle"); }, [fieldIndex]);

  function injectGoogleFont(rawUrl: string) {
    setGoogleFontUrl(rawUrl);
    const familyMatch = rawUrl.match(/family=([^:&\n]+)/);
    if (!familyMatch) { setFontStatus("error"); return; }
    const fontName = decodeURIComponent(familyMatch[1]).replace(/\+/g, " ").split(":")[0].trim();
    const linkId = `gfont-inject-${fontName.replace(/\s/g, "-").toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      const embedUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`;
      link.href = embedUrl;
      link.onload = () => setFontStatus("ok");
      link.onerror = () => setFontStatus("error");
      document.head.appendChild(link);
    } else {
      setFontStatus("ok");
    }
    if (field) {
      setValue(`fields.${fieldIndex}.fontFamily`, fontName, { shouldDirty: true });
    }
  }

  if (!field) {
    return (
      <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--t-text-dim)", borderTop: "1px solid var(--t-border)" }}>
        Selecciona un campo en el canvas para ver el inspector.
      </div>
    );
  }

  const toDisplay = (px: number) => unit === "mm" ? pxToMm(px) : px;
  const fromDisplay = (v: number) => unit === "mm" ? mmToPx(v) : v;
  const maxX = unit === "mm" ? pxToMm(canvasWidth) : canvasWidth;
  const maxY = unit === "mm" ? pxToMm(canvasHeight) : canvasHeight;

  return (
    <div style={{ padding: "10px 12px", borderTop: "1px solid var(--t-border)", background: "var(--t-surface)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text)", marginBottom: 8 }}>
        Inspector — {field.label}
      </p>

      {/* Position & Dimensions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
        <Tip text="Posición horizontal exacta desde el borde izquierdo del canvas">
          <InspectorInput
            label={`X (${unit})`}
            value={toDisplay(field.posX)}
            min={0} max={maxX}
            onChange={(v) => setValue(`fields.${fieldIndex}.posX`, Math.round(fromDisplay(v) * 10) / 10, { shouldDirty: true })}
          />
        </Tip>
        <Tip text="Posición vertical exacta desde el borde superior del canvas">
          <InspectorInput
            label={`Y (${unit})`}
            value={toDisplay(field.posY)}
            min={0} max={maxY}
            onChange={(v) => setValue(`fields.${fieldIndex}.posY`, Math.round(fromDisplay(v) * 10) / 10, { shouldDirty: true })}
          />
        </Tip>
        <Tip text="Ancho del elemento. Para texto define el ancho máximo antes de truncar">
          <InspectorInput
            label={`W (${unit})`}
            value={field.width != null ? toDisplay(field.width) : ""}
            min={1} max={maxX}
            onChange={(v) => setValue(`fields.${fieldIndex}.width`, v > 0 ? Math.round(fromDisplay(v) * 10) / 10 : null, { shouldDirty: true })}
          />
        </Tip>
        <Tip text="Alto del elemento. Obligatorio para foto y QR">
          <InspectorInput
            label={`H (${unit})`}
            value={field.height != null ? toDisplay(field.height) : ""}
            min={1} max={maxY}
            onChange={(v) => setValue(`fields.${fieldIndex}.height`, v > 0 ? Math.round(fromDisplay(v) * 10) / 10 : null, { shouldDirty: true })}
          />
        </Tip>
      </div>

      {/* Typography */}
      <p style={{ fontSize: 9, color: "var(--t-text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Tipografía
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
        <Tip text="Tamaño de la fuente en puntos tipográficos (1 pt ≈ 0.35 mm)">
          <InspectorInput
            label="Tamaño (pt)"
            value={field.fontSize ?? ""}
            min={6} max={200} step={1}
            onChange={(v) => setValue(`fields.${fieldIndex}.fontSize`, v > 0 ? v : null, { shouldDirty: true })}
          />
        </Tip>
        <Tip text="Peso de la fuente: 400 (normal), 600 (semibold), 700 (bold)">
          <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>Peso</span>
            <select
              value={field.fontWeight ?? "600"}
              onChange={(e) => setValue(`fields.${fieldIndex}.fontWeight`, e.target.value, { shouldDirty: true })}
              style={{
                fontSize: 11, padding: "2px 5px", borderRadius: 4,
                border: "1px solid var(--t-border)", background: "var(--t-surface)",
                color: "var(--t-text)",
              }}
            >
              <option value="300">300 — Light</option>
              <option value="400">400 — Regular</option>
              <option value="600">600 — Semibold</option>
              <option value="700">700 — Bold</option>
            </select>
          </label>
        </Tip>
        <Tip text="Color del texto en formato hexadecimal. Ej: #1A2B3C">
          <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>Color hex</span>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <input
                type="color"
                value={field.colorHex ?? "#0F172A"}
                onChange={(e) => setValue(`fields.${fieldIndex}.colorHex`, e.target.value.toUpperCase(), { shouldDirty: true })}
                style={{ width: 26, height: 24, borderRadius: 3, border: "1px solid var(--t-border)", cursor: "pointer", padding: 1 }}
              />
              <input
                type="text"
                value={field.colorHex ?? "#0F172A"}
                maxLength={9}
                onChange={(e) => setValue(`fields.${fieldIndex}.colorHex`, e.target.value, { shouldDirty: true })}
                style={{
                  fontSize: 10, fontFamily: "monospace", flex: 1,
                  padding: "2px 4px", borderRadius: 4,
                  border: "1px solid var(--t-border)", background: "var(--t-surface)",
                  color: "var(--t-text)",
                }}
              />
            </div>
          </label>
        </Tip>
      </div>

      {/* Google Fonts */}
      <Tip text="Pega el enlace de Google Fonts (ej: https://fonts.googleapis.com/css2?family=Inter). La fuente se inyecta automáticamente en el documento">
        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>
            Link Google Fonts
            {fontStatus === "ok" && <span style={{ color: "#10b981", marginLeft: 4 }}>✓ inyectada</span>}
            {fontStatus === "error" && <span style={{ color: "#ef4444", marginLeft: 4 }}>! URL inválida</span>}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              type="url"
              placeholder="https://fonts.googleapis.com/css2?family=..."
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
              style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer",
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                color: "var(--t-text)",
              }}
            >
              Aplicar
            </button>
          </div>
        </label>
      </Tip>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

function buildTemplateDefaults(detail: IdCardTemplateDetailData | null): TemplateFormValues {
  if (detail) {
    return {
      name: detail.template.name,
      baseImageUrl: detail.template.baseImageUrl,
      templateWidth: detail.template.templateWidth,
      templateHeight: detail.template.templateHeight,
      isActive: detail.template.isActive,
      fields: detail.fields,
    };
  }

  return {
    name: "",
    baseImageUrl: "",
    templateWidth: 720,
    templateHeight: 420,
    isActive: true,
    fields: createDefaultIdCardFields(720, 420),
  };
}

function normalizeTemplateInput(values: TemplateFormValues): IdCardTemplateUpsertInput {
  return {
    name: values.name,
    baseImageUrl: values.baseImageUrl,
    templateWidth: Number(values.templateWidth),
    templateHeight: Number(values.templateHeight),
    isActive: values.isActive,
    fields: values.fields.map((field) => ({
      ...field,
      posX: Number(field.posX),
      posY: Number(field.posY),
      width: field.width === null ? null : Number(field.width),
      height: field.height === null ? null : Number(field.height),
      fontSize: field.fontSize === null ? null : Number(field.fontSize),
      zIndex: Number(field.zIndex),
    })),
  };
}

function buildTemplatePreviewSubject(volunteer: IdCardVolunteerOption | null) {
  return buildIdCardRenderSubject({
    fullName: volunteer?.fullName,
    documentLabel: volunteer?.documentLabel,
    photoUrl: volunteer?.photoUrl,
    cardCode: "VC-0000-DEMO",
    qrPayload: buildIdCardQrPayload("VC-0000-DEMO"),
  });
}

function TemplateFieldEditor({
  field,
  index,
  register,
  isActive,
}: {
  field: IdCardTemplateFieldRow;
  index: number;
  register: ReturnType<typeof useForm<TemplateFormValues>>["register"];
  isActive?: boolean;
}) {
  return (
    <div
      id={`field-card-${field.fieldKey}`}
      className="rounded-2xl p-3 transition-all"
      style={{
        background: isActive ? "rgba(99,102,241,0.06)" : "var(--t-hover)",
        border: isActive ? "1.5px solid rgba(99,102,241,0.7)" : "1px solid var(--t-border)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
            {field.label}
          </p>
          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            field_key = {field.fieldKey}
          </p>
        </div>
        <StatusDot variant={field.fieldKey === "foto" || field.fieldKey === "qr" ? "info" : "secondary"}>
          {field.fieldKey === "foto" || field.fieldKey === "qr" ? "Bloque" : "Texto"}
        </StatusDot>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <PeopleField label="Pos X">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.posX`, { valueAsNumber: true })}
          />
        </PeopleField>
        <PeopleField label="Pos Y">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.posY`, { valueAsNumber: true })}
          />
        </PeopleField>
        <PeopleField label="Ancho">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.width`, {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </PeopleField>
        <PeopleField label="Alto">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.height`, {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </PeopleField>
        <PeopleField label="Fuente">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.fontSize`, {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </PeopleField>
        <PeopleField label="Familia">
          <PeopleTextInput {...register(`fields.${index}.fontFamily`)} />
        </PeopleField>
        <PeopleField label="Peso">
          <PeopleTextInput {...register(`fields.${index}.fontWeight`)} />
        </PeopleField>
        <PeopleField label="Color">
          <PeopleTextInput placeholder="#0F172A" {...register(`fields.${index}.colorHex`)} />
        </PeopleField>
        <PeopleField label="Z-index">
          <PeopleTextInput
            type="number"
            min={1}
            step="1"
            {...register(`fields.${index}.zIndex`, { valueAsNumber: true })}
          />
        </PeopleField>
      </div>
    </div>
  );
}

export function IdCardTemplateFormModal({
  open,
  onClose,
  mode,
  templateId,
  volunteerOptions,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  templateId: string | null;
  volunteerOptions: IdCardVolunteerOption[];
  isSaving: boolean;
  onSubmit: (input: IdCardTemplateUpsertInput) => Promise<void>;
}) {
  const previewRef = useRef<IdCardCanvasPreviewHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabaseFileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewVolunteerId, setPreviewVolunteerId] = useState("");
  const [activeFieldKey, setActiveFieldKey] = useState<IdCardFieldKey | null>(null);

  // ── Phase 1: dimension lock ──
  const [dimensionsLocked, setDimensionsLocked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ── Phase 2: expanded editor (80% screen) ──
  const [editorExpanded, setEditorExpanded] = useState(false);

  // ── Inspector panel unit state ──
  const [inspectorUnit, setInspectorUnit] = useState<Unit>("px");

  const detailState = useIdCardTemplateDetail(open && mode === "edit" ? templateId : null);
  const { register, watch, reset, setValue, handleSubmit } = useForm<TemplateFormValues>({
    defaultValues: buildTemplateDefaults(null),
  });

  useEffect(() => {
    if (!open) return;
    reset(buildTemplateDefaults(detailState.detail));
    setSubmitError(null);
    setActiveFieldKey(null);
    setDimensionsLocked(false);
    setEditorExpanded(false);
    setPreviewVolunteerId((c) => c || volunteerOptions[0]?.value || "");
  }, [detailState.detail, open, reset, volunteerOptions]);

  useEffect(() => {
    if (!activeFieldKey) return;
    const el = document.getElementById(`field-card-${activeFieldKey}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeFieldKey]);

  const values = watch();
  const canvasWidth = Number(values.templateWidth) || 720;
  const canvasHeight = Number(values.templateHeight) || 420;
  const previewVolunteer = volunteerOptions.find((o) => o.value === previewVolunteerId) ?? null;
  const previewSubject = useMemo(() => buildTemplatePreviewSubject(previewVolunteer), [previewVolunteer]);
  const activeFieldIndex = values.fields.findIndex((f) => f.fieldKey === activeFieldKey);
  const activeField = activeFieldIndex >= 0 ? values.fields[activeFieldIndex] : null;

  // ── Preset buttons ──
  function applyPreset(widthPx: number, heightPx: number) {
    if (dimensionsLocked) return;
    setValue("templateWidth", widthPx, { shouldDirty: true });
    setValue("templateHeight", heightPx, { shouldDirty: true });
    setValue("fields", createDefaultIdCardFields(widthPx, heightPx), { shouldDirty: true });
  }

  // ── Phase 1: image upload to local data URL (preview) ──
  async function handleLocalImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setValue("baseImageUrl", dataUrl, { shouldDirty: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo cargar la imagen.");
    } finally {
      event.target.value = "";
    }
  }

  // ── Phase 1: upload to Supabase Storage ──
  async function handleSupabaseUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setSubmitError(null);
    try {
      const publicUrl = await uploadTemplateBackground(file);
      setValue("baseImageUrl", publicUrl, { shouldDirty: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo subir la imagen a Supabase.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  // ── Phase 2: reset all field coords to defaults ──
  function handleResetCoords() {
    setValue("fields", createDefaultIdCardFields(canvasWidth, canvasHeight), { shouldDirty: true });
    setActiveFieldKey(null);
  }

  // ── Canvas drag/resize sync ──
  const handleFieldChange = useCallback(
    (fieldKey: IdCardFieldKey, changes: FieldChange) => {
      const index = values.fields.findIndex((f) => f.fieldKey === fieldKey);
      if (index === -1) return;
      if (changes.posX !== undefined) setValue(`fields.${index}.posX`, changes.posX, { shouldDirty: true });
      if (changes.posY !== undefined) setValue(`fields.${index}.posY`, changes.posY, { shouldDirty: true });
      if (changes.width !== undefined) setValue(`fields.${index}.width`, changes.width, { shouldDirty: true });
      if (changes.height !== undefined) setValue(`fields.${index}.height`, changes.height, { shouldDirty: true });
    },
    [values.fields, setValue]
  );

  const submit = handleSubmit(async (formValues) => {
    setSubmitError(null);
    if (mode === "edit" && detailState.loading) {
      setSubmitError("Espera a que cargue la plantilla antes de guardar.");
      return;
    }
    try {
      await onSubmit(normalizeTemplateInput(formValues));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar la plantilla de credencial.");
    }
  });

  // Canvas display width: 80% of viewport when expanded, otherwise 420
  const editorDisplayWidth = editorExpanded
    ? Math.min(Math.round(window.innerWidth * 0.72), 1100)
    : 420;

  return (
    <ModalShell open={open} onClose={onClose} width={editorExpanded ? "max-w-[98vw]" : "max-w-[1240px]"}>
      <PeopleModalHeader
        title={mode === "edit" ? "Editar plantilla ID" : "Nueva plantilla ID"}
        description="Gestiona ong.id_card_templates y ong.id_card_template_fields con coordenadas reales para foto, nombre, DNI, código y QR."
        onClose={onClose}
      />

      <form
        className="overflow-y-auto p-4"
        style={{ maxHeight: "85vh" }}
        onSubmit={(e) => void submit(e)}
      >
        <div className={`grid gap-4 ${editorExpanded ? "grid-cols-1" : "xl:grid-cols-[1.3fr_auto]"}`}>

          {/* ── LEFT PANEL: form fields ── */}
          {!editorExpanded && (
            <div className="space-y-4">
              {detailState.loading && mode === "edit" && <PeopleErrorBlock message="Cargando plantilla real..." />}
              {detailState.error && mode === "edit" && (
                <PeopleErrorBlock message={detailState.error} onRetry={detailState.refresh} />
              )}
              {submitError && <PeopleErrorBlock message={submitError} />}

              {/* ── FASE 1: Cimientos de la plantilla ── */}
              <PeopleSection
                title="Fase 1 — Cimientos de la plantilla"
                description="Define el tamaño del canvas y sube el fondo. Confirma las medidas para bloquear y pasar al editor."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PeopleField label="Nombre">
                    <PeopleTextInput {...register("name")} />
                  </PeopleField>
                  <PeopleField label="URL imagen de fondo">
                    <PeopleTextInput placeholder="https://... (o sube abajo)" {...register("baseImageUrl")} />
                  </PeopleField>

                  {/* Ancho y Alto con bloqueo */}
                  <Tip text="Ancho del canvas en píxeles a 300 DPI. Se redimensiona el editor en tiempo real">
                    <PeopleField label={`Ancho (px) ${dimensionsLocked ? "🔒" : ""}`}>
                      <PeopleTextInput
                        type="number" min={1}
                        disabled={dimensionsLocked}
                        {...register("templateWidth", { valueAsNumber: true })}
                      />
                    </PeopleField>
                  </Tip>
                  <Tip text="Alto del canvas en píxeles a 300 DPI. Se redimensiona el editor en tiempo real">
                    <PeopleField label={`Alto (px) ${dimensionsLocked ? "🔒" : ""}`}>
                      <PeopleTextInput
                        type="number" min={1}
                        disabled={dimensionsLocked}
                        {...register("templateHeight", { valueAsNumber: true })}
                      />
                    </PeopleField>
                  </Tip>
                </div>

                {/* Presets */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Preset:</span>
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={dimensionsLocked}
                      onClick={() => applyPreset(preset.widthPx, preset.heightPx)}
                      title={`${preset.widthPx} × ${preset.heightPx} px`}
                      style={{
                        padding: "2px 10px", fontSize: 11, borderRadius: 5, cursor: dimensionsLocked ? "not-allowed" : "pointer",
                        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                        color: "var(--t-text)", opacity: dimensionsLocked ? 0.4 : 1,
                      }}
                    >
                      {key} — {preset.label}
                    </button>
                  ))}
                </div>

                {/* Upload buttons + lock */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tip text="Sube la imagen de fondo a tu almacenamiento local (vista previa inmediata)">
                    <OutlineButton size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus className="h-4 w-4" />
                      Cargar local
                    </OutlineButton>
                  </Tip>
                  <Tip text="Sube la imagen al bucket 'id_templates' de Supabase Storage y guarda la URL pública">
                    <OutlineButton size="sm" type="button" disabled={isUploading} onClick={() => supabaseFileInputRef.current?.click()}>
                      <ImagePlus className="h-4 w-4" />
                      {isUploading ? "Subiendo…" : "Subir a Supabase"}
                    </OutlineButton>
                  </Tip>

                  <div style={{ width: 1, height: 20, background: "var(--t-border)" }} />

                  <Tip text={dimensionsLocked ? "Las medidas están bloqueadas. Desbloquea para editarlas" : "Confirmar medidas bloquea Ancho/Alto para evitar errores de proporción al componer"}>
                    <OutlineButton
                      size="sm"
                      type="button"
                      onClick={() => setDimensionsLocked((v) => !v)}
                    >
                      {dimensionsLocked
                        ? <><Unlock className="h-4 w-4" /> Desbloquear medidas</>
                        : <><Lock className="h-4 w-4" /> Confirmar medidas</>}
                    </OutlineButton>
                  </Tip>

                  <PeopleBoolean
                    label="Plantilla activa"
                    checked={Boolean(values.isActive)}
                    onChange={(checked) => setValue("isActive", checked, { shouldDirty: true })}
                  />

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => void handleLocalImageUpload(e)} />
                  <input ref={supabaseFileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => void handleSupabaseUpload(e)} />
                </div>
              </PeopleSection>

              {/* ── Coordenadas (formulario de campos) ── */}
              <PeopleSection
                title="Coordenadas de campos"
                description="Arrastra en el editor de la derecha, o edita manualmente aquí."
              >
                <div className="space-y-3">
                  {values.fields.map((field, index) => (
                    <TemplateFieldEditor
                      key={field.fieldKey}
                      field={field}
                      index={index}
                      register={register}
                      isActive={activeFieldKey === field.fieldKey}
                    />
                  ))}
                </div>
              </PeopleSection>

              <div className="flex flex-wrap gap-2">
                <GradientButton size="sm" type="submit" disabled={isSaving || detailState.loading}>
                  {isSaving ? "Guardando…" : mode === "edit" ? "Guardar plantilla" : "Crear plantilla"}
                </GradientButton>
                <OutlineButton size="sm" type="button" onClick={onClose} disabled={isSaving}>
                  Cancelar
                </OutlineButton>
              </div>
            </div>
          )}

          {/* ── RIGHT PANEL / EXPANDED: Editor visual ── */}
          <div className={editorExpanded ? "space-y-3" : "space-y-4"} style={{ minWidth: editorExpanded ? "100%" : undefined }}>
            {editorExpanded && submitError && <PeopleErrorBlock message={submitError} />}

            <PeopleSection
              title="Fase 2 — Editor visual"
              description="Arrastra y redimensiona los campos. Los elementos no pueden salir del canvas."
            >
              <div className="space-y-3">
                {/* Header tools row */}
                <div className="flex flex-wrap items-center gap-2">
                  <PeopleField label="Voluntario demo" style={{ flex: 1, minWidth: 160 }}>
                    <PeopleSelectInput
                      value={previewVolunteerId}
                      onChange={(e) => setPreviewVolunteerId(e.target.value)}
                    >
                      <option value="">Selecciona voluntario</option>
                      {volunteerOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </PeopleSelectInput>
                  </PeopleField>

                  <Tip text="Unidad de medida usada en el Inspector">
                    <button
                      type="button"
                      onClick={() => setInspectorUnit((u) => (u === "px" ? "mm" : "px"))}
                      style={{
                        padding: "3px 8px", fontSize: 11, borderRadius: 4, cursor: "pointer",
                        fontFamily: "monospace", fontWeight: 600,
                        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                        color: "var(--t-text)",
                      }}
                    >
                      Inspector: {inspectorUnit}
                    </button>
                  </Tip>

                  <Tip text="Resetea todos los campos a sus posiciones y tamaños por defecto">
                    <OutlineButton size="sm" type="button" onClick={handleResetCoords}>
                      <RefreshCcw className="h-4 w-4" />
                      Limpiar coordenadas
                    </OutlineButton>
                  </Tip>

                  <Tip text={editorExpanded ? "Reducir el editor al tamaño normal" : "Maximizar el editor al 80% de la pantalla para ajustes milimétricos"}>
                    <OutlineButton size="sm" type="button" onClick={() => setEditorExpanded((v) => !v)}>
                      {editorExpanded
                        ? <><Minimize2 className="h-4 w-4" /> Reducir</>
                        : <><Maximize2 className="h-4 w-4" /> Maximizar editor</>}
                    </OutlineButton>
                  </Tip>
                </div>

                {/* Canvas editor */}
                <IdCardCanvasEditor
                  baseImageUrl={values.baseImageUrl || null}
                  templateWidth={canvasWidth}
                  templateHeight={canvasHeight}
                  fields={values.fields}
                  subject={previewSubject}
                  activeFieldKey={activeFieldKey}
                  onFieldChange={handleFieldChange}
                  onSelectField={setActiveFieldKey}
                  displayWidth={editorDisplayWidth}
                />

                {/* Inspector Panel */}
                <div style={{ border: "1px solid var(--t-border)", borderRadius: 8, overflow: "hidden" }}>
                  <button
                    type="button"
                    style={{
                      width: "100%", padding: "6px 12px", textAlign: "left",
                      background: "var(--t-surface)", border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 700, color: "var(--t-text)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <span>Ver Detalles {activeField ? `— ${activeField.label}` : ""}</span>
                    <span style={{ fontSize: 9, color: "var(--t-text-dim)" }}>Inspector</span>
                  </button>
                  <InspectorPanel
                    field={activeField}
                    fieldIndex={activeFieldIndex}
                    setValue={setValue}
                    unit={inspectorUnit}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                  />
                </div>

                {/* Hidden canvas + export */}
                <div style={{ display: "none" }}>
                  <IdCardCanvasPreview
                    ref={previewRef}
                    baseImageUrl={values.baseImageUrl || null}
                    templateWidth={canvasWidth}
                    templateHeight={canvasHeight}
                    fields={values.fields}
                    subject={previewSubject}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm" type="button"
                    onClick={() => void previewRef.current?.downloadPng(
                      `${(values.name || "plantilla-id").trim().replace(/\s+/g, "-").toLowerCase()}.png`
                    )}
                  >
                    <Download className="h-4 w-4" />
                    Exportar PNG
                  </OutlineButton>

                  {editorExpanded && (
                    <>
                      <GradientButton size="sm" type="submit" disabled={isSaving || detailState.loading}>
                        {isSaving ? "Guardando…" : mode === "edit" ? "Guardar plantilla" : "Crear plantilla"}
                      </GradientButton>
                      <OutlineButton size="sm" type="button" onClick={onClose} disabled={isSaving}>
                        Cancelar
                      </OutlineButton>
                    </>
                  )}
                </div>
              </div>
            </PeopleSection>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export function IdCardTemplateDetailModal({
  open,
  onClose,
  templateId,
  volunteerOptions,
  isToggling,
  onEdit,
  onToggleActive,
}: {
  open: boolean;
  onClose: () => void;
  templateId: string | null;
  volunteerOptions: IdCardVolunteerOption[];
  isToggling: boolean;
  onEdit: (templateId: string) => void;
  onToggleActive: (templateId: string, nextActive: boolean) => Promise<void>;
}) {
  const previewRef = useRef<IdCardCanvasPreviewHandle | null>(null);
  const [previewVolunteerId, setPreviewVolunteerId] = useState("");
  const detailState = useIdCardTemplateDetail(open ? templateId : null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPreviewVolunteerId((current) => current || volunteerOptions[0]?.value || "");
  }, [open, volunteerOptions]);

  const previewVolunteer =
    volunteerOptions.find((option) => option.value === previewVolunteerId) ?? null;
  const detail = detailState.detail;
  const previewSubject = useMemo(
    () => buildTemplatePreviewSubject(previewVolunteer),
    [previewVolunteer]
  );

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1180px]">
      <PeopleModalHeader
        title="Detalle de plantilla ID"
        description="Detalle real desde ong.id_card_templates y ong.id_card_template_fields."
        onClose={onClose}
        actions={
          detail ? (
            <>
              <OutlineButton size="sm" onClick={() => onEdit(detail.template.id)}>
                Editar
              </OutlineButton>
              <OutlineButton
                size="sm"
                disabled={isToggling}
                onClick={() => void onToggleActive(detail.template.id, !detail.template.isActive)}
              >
                {detail.template.isActive ? "Desactivar" : "Activar"}
              </OutlineButton>
            </>
          ) : null
        }
      />

      <div className="max-h-[80vh] overflow-y-auto p-4">
        {detailState.loading && <PeopleErrorBlock message="Cargando plantilla..." />}
        {!detailState.loading && detailState.error && (
          <PeopleErrorBlock message={detailState.error} onRetry={detailState.refresh} />
        )}
        {!detailState.loading && !detailState.error && detail && (
          <div className="grid gap-4 xl:grid-cols-[1.25fr_420px]">
            <div className="space-y-4">
              <div
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl px-4 py-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[16px]" style={{ color: "var(--t-text)" }}>
                      {detail.template.name}
                    </h4>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                    {detail.fields.length} campos configurados
                  </p>
                </div>
                <StatusDot variant={detail.template.isActive ? "success" : "secondary"}>
                  {detail.template.isActive ? "Activa" : "Inactiva"}
                </StatusDot>
              </div>

              <PeopleSection title="Metadatos" description="Dimensiones, trazabilidad y visibilidad.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <PeopleDetailField label="Ancho" value={String(detail.template.templateWidth)} />
                  <PeopleDetailField label="Alto" value={String(detail.template.templateHeight)} />
                  <PeopleDetailField label="Creado por" value={formatPeopleText(detail.createdBy)} />
                  <PeopleDetailField label="Actualizado por" value={formatPeopleText(detail.updatedBy)} />
                </div>
              </PeopleSection>

              <PeopleSection
                title="Coordenadas"
                description="Configuracion persistida en ong.id_card_template_fields."
              >
                <div className="space-y-3">
                  {detail.fields.map((field) => (
                    <div
                      key={field.fieldKey}
                      className="grid grid-cols-2 gap-3 rounded-2xl p-3 md:grid-cols-5"
                      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                    >
                      <PeopleDetailField label="Campo" value={field.label} />
                      <PeopleDetailField label="Posicion" value={`${field.posX}, ${field.posY}`} />
                      <PeopleDetailField
                        label="Caja"
                        value={`${field.width ?? "-"} x ${field.height ?? "-"}`}
                      />
                      <PeopleDetailField
                        label="Fuente"
                        value={`${field.fontSize ?? "-"} / ${field.fontFamily ?? "-"}`}
                      />
                      <PeopleDetailField
                        label="Color / Z"
                        value={`${field.colorHex ?? "-"} / ${field.zIndex}`}
                      />
                    </div>
                  ))}
                </div>
              </PeopleSection>
            </div>

            <div className="space-y-4">
              <PeopleSection
                title="Preview"
                description="Canvas real con sujeto de ejemplo y exportacion PNG."
              >
                <PeopleField label="Voluntario demo">
                  <PeopleSelectInput
                    value={previewVolunteerId}
                    onChange={(event) => setPreviewVolunteerId(event.target.value)}
                  >
                    <option value="">Selecciona un voluntario</option>
                    {volunteerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </PeopleSelectInput>
                </PeopleField>

                <div className="mt-3">
                  <IdCardCanvasPreview
                    ref={previewRef}
                    baseImageUrl={detail.template.baseImageUrl}
                    templateWidth={detail.template.templateWidth}
                    templateHeight={detail.template.templateHeight}
                    fields={detail.fields}
                    subject={previewSubject}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm"
                    onClick={() =>
                      void previewRef.current?.downloadPng(
                        `${detail.template.name.trim().replace(/\s+/g, "-").toLowerCase()}.png`
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Exportar PNG
                  </OutlineButton>
                </div>
              </PeopleSection>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
