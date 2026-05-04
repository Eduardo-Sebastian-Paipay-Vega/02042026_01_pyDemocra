import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { IdCardFieldKey, IdCardRenderSubject, IdCardTemplateFieldRow } from "../types";
import { ID_CARD_FIELD_LABELS } from "../idCardShared";
import {
  formatUnit,
  snapToGrid,
  pxToMm,
  mmToPx,
  type Unit,
} from "../idCardUnits";
import { TEMPLATE_VARIABLES } from "../idCardTemplateSchema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldChange = Partial<
  Pick<IdCardTemplateFieldRow, "posX" | "posY" | "width" | "height">
>;

interface LivePos {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface IdCardCanvasEditorProps {
  baseImageUrl: string | null;
  templateWidth: number;
  templateHeight: number;
  fields: IdCardTemplateFieldRow[];
  subject: IdCardRenderSubject;
  activeFieldKey: IdCardFieldKey | null;
  onFieldChange: (fieldKey: IdCardFieldKey, changes: FieldChange) => void;
  onSelectField: (fieldKey: IdCardFieldKey) => void;
  displayWidth?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_FIELDS = new Set<IdCardFieldKey>(["foto", "qr"]);
const TEXT_FIELDS = new Set<IdCardFieldKey>(["nombre", "dni", "codigo"]);

/** Default snap grid size in pixels (≈ 1 mm at 300 DPI). */
const DEFAULT_SNAP_PX = Math.round(mmToPx(1));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBlock(k: IdCardFieldKey) {
  return BLOCK_FIELDS.has(k);
}

function isTextField(k: IdCardFieldKey) {
  return TEXT_FIELDS.has(k);
}

function fieldColor(key: IdCardFieldKey, active: boolean): string {
  if (active) return "rgba(99,102,241,0.85)";
  const map: Record<IdCardFieldKey, string> = {
    foto: "rgba(16,185,129,0.5)",
    nombre: "rgba(245,158,11,0.5)",
    dni: "rgba(59,130,246,0.5)",
    codigo: "rgba(139,92,246,0.5)",
    qr: "rgba(239,68,68,0.5)",
  };
  return map[key] ?? "rgba(100,100,100,0.4)";
}

/** Map a fixed field key to its data-binding token for display. */
const FIELD_TOKEN_MAP: Record<IdCardFieldKey, string> = {
  nombre: "{{voluntario.nombre_completo}}",
  dni: "{{voluntario.dni}}",
  codigo: "{{voluntario.codigo}}",
  foto: "{{voluntario.foto_url}}",
  qr: "{{voluntario.qr_acceso}}",
};

// ─── Field content preview ────────────────────────────────────────────────────

function FieldContent({
  fieldKey, subject, scale, width, height, fontSize, fontFamily, fontWeight, colorHex,
}: {
  fieldKey: IdCardFieldKey;
  subject: IdCardRenderSubject;
  scale: number;
  width: number | null;
  height: number | null;
  fontSize: number | null;
  fontFamily: string | null;
  fontWeight: string | null;
  colorHex: string | null;
}) {
  const scaledFont = fontSize ? Math.round(fontSize * scale) : Math.round(13 * scale);
  const color = colorHex ?? "#0F172A";

  if (fieldKey === "foto") {
    return subject.photoUrl ? (
      <img
        src={subject.photoUrl}
        alt="foto"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
        draggable={false}
      />
    ) : (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: scaledFont, color,
        background: "rgba(0,0,0,0.06)", fontFamily: "sans-serif", pointerEvents: "none",
      }}>📷</div>
    );
  }

  if (fieldKey === "qr") {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2, pointerEvents: "none",
      }}>
        <div style={{ fontSize: Math.round(22 * scale), lineHeight: 1 }}>▦</div>
        <div style={{
          fontSize: Math.round(8 * scale), fontFamily: "monospace", color,
          textAlign: "center", wordBreak: "break-all",
        }}>{subject.qrPayload}</div>
      </div>
    );
  }

  const text =
    fieldKey === "nombre" ? subject.fullName :
    fieldKey === "dni" ? subject.documentLabel :
    subject.cardCode;

  return (
    <div style={{
      width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
      fontSize: scaledFont, fontFamily: fontFamily ?? "sans-serif",
      fontWeight: fontWeight ?? "600", color, lineHeight: "1.15",
      userSelect: "none", pointerEvents: "none",
    }}>
      {text}
    </div>
  );
}

// ─── HUD: coordinate display bar ─────────────────────────────────────────────

function CoordinatesHud({
  live, unit, fieldKey,
}: {
  live: LivePos | null;
  unit: Unit;
  fieldKey: IdCardFieldKey | null;
}) {
  if (!fieldKey || !live) {
    return (
      <div style={hudStyle}>
        <span style={{ color: "var(--t-text-dim)", fontSize: 10 }}>
          Selecciona un campo para ver coordenadas
        </span>
      </div>
    );
  }

  return (
    <div style={hudStyle}>
      <HudChip label="X" value={formatUnit(live.x, unit)} />
      <HudChip label="Y" value={formatUnit(live.y, unit)} />
      <HudChip label="W" value={formatUnit(live.w, unit)} />
      {live.h > 0 && <HudChip label="H" value={formatUnit(live.h, unit)} />}
      <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>
        {FIELD_TOKEN_MAP[fieldKey]}
      </span>
    </div>
  );
}

function HudChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
      borderRadius: 4, padding: "1px 6px", fontSize: 10, fontFamily: "monospace",
      color: "var(--t-text)",
    }}>
      <span style={{ color: "var(--t-text-dim)", fontSize: 9 }}>{label}</span>
      {value}
    </span>
  );
}

const hudStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
  borderBottom: "1px solid var(--t-border)", background: "var(--t-surface)",
  minHeight: 28, flexWrap: "wrap",
};

// ─── Toolbar: unit toggle + snap controls ─────────────────────────────────────

function EditorToolbar({
  unit, onToggleUnit,
  snapEnabled, onToggleSnap,
  snapMm, onSnapMmChange,
}: {
  unit: Unit;
  onToggleUnit: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  snapMm: number;
  onSnapMmChange: (mm: number) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
      borderBottom: "1px solid var(--t-border)", background: "var(--t-surface)",
      fontSize: 11, flexWrap: "wrap",
    }}>
      {/* Unit toggle */}
      <button
        type="button"
        onClick={onToggleUnit}
        style={{
          padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11,
          fontFamily: "monospace", fontWeight: 600,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
          color: "var(--t-text)",
        }}
        title="Alternar entre px y mm"
      >
        {unit === "px" ? "px → mm" : "mm → px"}
      </button>

      <div style={{ width: 1, height: 16, background: "var(--t-border)" }} />

      {/* Snap toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
        <input
          type="checkbox"
          checked={snapEnabled}
          onChange={onToggleSnap}
          style={{ accentColor: "rgb(99,102,241)", width: 12, height: 12 }}
        />
        <span style={{ color: "var(--t-text)", fontSize: 11 }}>Snap</span>
      </label>

      {snapEnabled && (
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "var(--t-text-dim)", fontSize: 10 }}>Grid:</span>
          <select
            value={snapMm}
            onChange={(e) => onSnapMmChange(Number(e.target.value))}
            style={{
              fontSize: 10, fontFamily: "monospace",
              background: "var(--t-surface)", border: "1px solid var(--t-border)",
              borderRadius: 3, padding: "1px 4px", color: "var(--t-text)", cursor: "pointer",
            }}
          >
            {[0.5, 1, 2, 5].map((v) => (
              <option key={v} value={v}>{v} mm</option>
            ))}
          </select>
        </label>
      )}

      <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--t-text-dim)", fontFamily: "monospace" }}>
        300 DPI · {unit === "mm"
          ? `${pxToMm(0).toFixed(0)} — 1 mm ≈ 11.81 px`
          : "1 mm ≈ 11.81 px"}
      </span>
    </div>
  );
}

// ─── Data binding variables panel ────────────────────────────────────────────

function VariablesPanel({ activeKey }: { activeKey: IdCardFieldKey | null }) {
  const [open, setOpen] = useState(false);

  const handleCopy = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* clipboard blocked */
    }
  }, []);

  return (
    <div style={{
      borderTop: "1px solid var(--t-border)", background: "var(--t-surface)",
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "5px 10px", background: "none", border: "none", cursor: "pointer",
          fontSize: 11, color: "var(--t-text-dim)", userSelect: "none",
        }}
      >
        <span>⟨/⟩ Variables de datos</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          padding: "4px 8px 8px", display: "flex", flexWrap: "wrap", gap: 4,
          maxHeight: 130, overflowY: "auto",
        }}>
          {TEMPLATE_VARIABLES.map(({ token, label }) => {
            const isActive = activeKey != null && FIELD_TOKEN_MAP[activeKey] === token;
            return (
              <button
                key={token}
                type="button"
                onClick={() => handleCopy(token)}
                title={`Copiar: ${token}`}
                style={{
                  padding: "2px 7px", borderRadius: 4, fontSize: 10,
                  fontFamily: "monospace", cursor: "pointer",
                  background: isActive
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(99,102,241,0.07)",
                  border: `1px solid rgba(99,102,241,${isActive ? "0.5" : "0.2"})`,
                  color: "var(--t-text)",
                }}
              >
                {label}
                <span style={{ opacity: 0.5, marginLeft: 3 }}>·</span>
                <span style={{ opacity: 0.6, fontSize: 9 }}> {token}</span>
              </button>
            );
          })}
          <p style={{ width: "100%", fontSize: 9, color: "var(--t-text-dim)", margin: "4px 0 0" }}>
            Haz clic en un token para copiarlo al portapapeles.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Grid SVG overlay ─────────────────────────────────────────────────────────

function GridOverlay({ snapPx, scale }: { snapPx: number; scale: number }) {
  const cellPx = Math.round(snapPx * scale);
  if (cellPx < 3) return null;
  const id = `grid-pattern-${cellPx}`;
  return (
    <svg
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 1, opacity: 0.18,
      }}
    >
      <defs>
        <pattern id={id} width={cellPx} height={cellPx} patternUnits="userSpaceOnUse">
          <path
            d={`M ${cellPx} 0 L 0 0 0 ${cellPx}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ─── Bleed indicator overlay ──────────────────────────────────────────────────

function BleedOverlay({ bleedPx, scale }: { bleedPx: number; scale: number }) {
  const offset = Math.round(bleedPx * scale);
  return (
    <div
      style={{
        position: "absolute",
        inset: offset,
        border: "1px dashed rgba(239,68,68,0.4)",
        pointerEvents: "none",
        zIndex: 2,
      }}
      title={`Área segura (bleed: ${pxToMm(bleedPx).toFixed(1)} mm)`}
    />
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function IdCardCanvasEditor({
  baseImageUrl,
  templateWidth,
  templateHeight,
  fields,
  subject,
  activeFieldKey,
  onFieldChange,
  onSelectField,
  displayWidth = 420,
}: IdCardCanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // ── Editor state ──
  const [unit, setUnit] = useState<Unit>("px");
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapMm, setSnapMm] = useState(1);
  const [livePos, setLivePos] = useState<LivePos | null>(null);

  const safeW = Math.max(1, templateWidth);
  const safeH = Math.max(1, templateHeight);
  const scale = displayWidth / safeW;
  const displayHeight = Math.round(safeH * scale);
  const snapGridPx = snapEnabled ? Math.round(mmToPx(snapMm)) : 0;

  useEffect(() => { setImgError(false); }, [baseImageUrl]);

  // Sync live position to active field when selection changes
  useEffect(() => {
    if (!activeFieldKey) { setLivePos(null); return; }
    const field = fields.find((f) => f.fieldKey === activeFieldKey);
    if (!field) { setLivePos(null); return; }
    const w = field.width ?? 120;
    const h = isBlock(activeFieldKey) ? (field.height ?? 60) : 24;
    setLivePos({ x: field.posX, y: field.posY, w, h });
  }, [activeFieldKey, fields]);

  // ── Drag/resize callbacks ──

  const handleDrag = useCallback(
    (fieldKey: IdCardFieldKey, screenX: number, screenY: number) => {
      const rawX = screenX / scale;
      const rawY = screenY / scale;
      const x = snapGridPx > 0 ? snapToGrid(rawX, snapGridPx) : rawX;
      const y = snapGridPx > 0 ? snapToGrid(rawY, snapGridPx) : rawY;
      setLivePos((prev) => prev ? { ...prev, x, y } : null);
    },
    [scale, snapGridPx]
  );

  const handleDragStop = useCallback(
    (fieldKey: IdCardFieldKey, screenX: number, screenY: number) => {
      const rawX = screenX / scale;
      const rawY = screenY / scale;
      const x = snapGridPx > 0 ? snapToGrid(rawX, snapGridPx) : rawX;
      const y = snapGridPx > 0 ? snapToGrid(rawY, snapGridPx) : rawY;
      onFieldChange(fieldKey, {
        posX: Math.round(x * 10) / 10,
        posY: Math.round(y * 10) / 10,
      });
    },
    [onFieldChange, scale, snapGridPx]
  );

  const handleResize = useCallback(
    (
      fieldKey: IdCardFieldKey,
      screenX: number, screenY: number,
      refW: number, refH: number
    ) => {
      const x = screenX / scale;
      const y = screenY / scale;
      const w = refW / scale;
      const h = refH / scale;
      setLivePos({ x, y, w, h });
    },
    [scale]
  );

  const handleResizeStop = useCallback(
    (
      fieldKey: IdCardFieldKey,
      screenX: number, screenY: number,
      refW: number, refH: number,
      blockField: boolean
    ) => {
      onFieldChange(fieldKey, {
        posX: Math.round((screenX / scale) * 10) / 10,
        posY: Math.round((screenY / scale) * 10) / 10,
        width: Math.round((refW / scale) * 10) / 10,
        height: blockField ? Math.round((refH / scale) * 10) / 10 : null,
      });
    },
    [onFieldChange, scale]
  );

  // ── Derived snap grid in screen pixels for react-rnd ──
  const rndGrid: [number, number] | undefined = snapEnabled
    ? [Math.max(1, Math.round(snapGridPx * scale)), Math.max(1, Math.round(snapGridPx * scale))]
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: displayWidth }}>
      {/* ── Toolbar ── */}
      <EditorToolbar
        unit={unit}
        onToggleUnit={() => setUnit((u) => (u === "px" ? "mm" : "px"))}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled((v) => !v)}
        snapMm={snapMm}
        onSnapMmChange={setSnapMm}
      />

      {/* ── Coordinates HUD ── */}
      <CoordinatesHud live={livePos} unit={unit} fieldKey={activeFieldKey} />

      {/* ── Canvas area ── */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: displayWidth,
          height: displayHeight,
          overflow: "hidden",
          borderRadius: "0 0 0 0",
          border: "1px solid var(--t-border)",
          borderTop: "none",
          background: "var(--t-hover)",
          flexShrink: 0,
        }}
        onClick={(e) => {
          if (e.target === containerRef.current) {
            onSelectField(null as unknown as IdCardFieldKey);
          }
        }}
      >
        {/* Base image */}
        {baseImageUrl && !imgError ? (
          <img
            src={baseImageUrl}
            alt="plantilla"
            draggable={false}
            onError={() => setImgError(true)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", pointerEvents: "none", userSelect: "none",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, color: "var(--t-text-dim)",
            fontFamily: "sans-serif",
          }}>
            {imgError ? "Error cargando imagen base" : "Sin imagen base"}
          </div>
        )}

        {/* Grid overlay (z-index: 1) */}
        {snapEnabled && <GridOverlay snapPx={snapGridPx} scale={scale} />}

        {/* Bleed safety indicator */}
        <BleedOverlay bleedPx={mmToPx(3)} scale={scale} />

        {/* Draggable / resizable fields */}
        {fields.map((field) => {
          const blockField = isBlock(field.fieldKey);
          const active = field.fieldKey === activeFieldKey;

          const x = Math.round(field.posX * scale);
          const y = Math.round(field.posY * scale);
          const w = field.width != null
            ? Math.max(20, Math.round(field.width * scale))
            : Math.max(20, Math.round(120 * scale));
          const h = blockField && field.height != null
            ? Math.max(16, Math.round(field.height * scale))
            : blockField
            ? Math.max(16, Math.round(60 * scale))
            : Math.max(16, Math.round(24 * scale));

          const enableResize = blockField
            ? { top: false, right: true, bottom: true, left: false, topRight: false, bottomRight: true, bottomLeft: false, topLeft: false }
            : { top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false };

          return (
            <Rnd
              key={field.fieldKey}
              position={{ x, y }}
              size={{ width: w, height: h }}
              bounds="parent"
              enableResizing={enableResize}
              dragGrid={rndGrid}
              resizeGrid={rndGrid}
              onMouseDown={() => onSelectField(field.fieldKey)}
              onDrag={(_e, d) => handleDrag(field.fieldKey, d.x, d.y)}
              onDragStop={(_e, d) => handleDragStop(field.fieldKey, d.x, d.y)}
              onResize={(_e, _dir, ref, _delta, pos) =>
                handleResize(field.fieldKey, pos.x, pos.y, ref.offsetWidth, ref.offsetHeight)
              }
              onResizeStop={(_e, _dir, ref, _delta, pos) =>
                handleResizeStop(field.fieldKey, pos.x, pos.y, ref.offsetWidth, ref.offsetHeight, blockField)
              }
              style={{ zIndex: field.zIndex + 10, cursor: "move" }}
            >
              <div style={{
                width: "100%", height: "100%", boxSizing: "border-box",
                border: active ? "2px solid rgba(99,102,241,0.9)" : "1px dashed rgba(99,102,241,0.35)",
                borderRadius: blockField ? 4 : 2,
                background: active ? "rgba(99,102,241,0.08)" : "transparent",
                overflow: "hidden", position: "relative",
              }}>
                {/* Field label badge */}
                {active && (
                  <div style={{
                    position: "absolute", top: -18, left: 0,
                    background: "rgba(99,102,241,1)", color: "#fff",
                    fontSize: 9, fontFamily: "sans-serif", fontWeight: 700,
                    padding: "1px 5px", borderRadius: "3px 3px 0 0",
                    whiteSpace: "nowrap", zIndex: 999, userSelect: "none",
                  }}>
                    {ID_CARD_FIELD_LABELS[field.fieldKey]}
                  </div>
                )}

                <FieldContent
                  fieldKey={field.fieldKey}
                  subject={subject}
                  scale={scale}
                  width={field.width}
                  height={field.height}
                  fontSize={field.fontSize}
                  fontFamily={field.fontFamily}
                  fontWeight={field.fontWeight}
                  colorHex={field.colorHex}
                />

                {blockField && (
                  <div style={{
                    position: "absolute", bottom: 2, right: 2, width: 8, height: 8,
                    borderRadius: 2, background: fieldColor(field.fieldKey, active),
                    pointerEvents: "none",
                  }} />
                )}
              </div>
            </Rnd>
          );
        })}

        {/* Canvas size label */}
        <div style={{
          position: "absolute", bottom: 4, right: 6, fontSize: 9,
          fontFamily: "monospace", color: "rgba(255,255,255,0.6)",
          background: "rgba(0,0,0,0.35)", padding: "1px 4px", borderRadius: 3,
          pointerEvents: "none", userSelect: "none",
        }}>
          {unit === "mm"
            ? `${pxToMm(templateWidth).toFixed(1)} × ${pxToMm(templateHeight).toFixed(1)} mm`
            : `${templateWidth} × ${templateHeight} px`}
        </div>
      </div>

      {/* ── Variables panel ── */}
      <VariablesPanel activeKey={activeFieldKey} />
    </div>
  );
}
