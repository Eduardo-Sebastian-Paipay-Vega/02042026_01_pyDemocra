import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { IdCardFieldKey, IdCardRenderSubject, IdCardTemplateFieldRow } from "../types";
import { ID_CARD_FIELD_LABELS } from "../idCardShared";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldChange = Partial<
  Pick<IdCardTemplateFieldRow, "posX" | "posY" | "width" | "height">
>;

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

// ─── Field type helpers ───────────────────────────────────────────────────────

const BLOCK_FIELDS = new Set<IdCardFieldKey>(["foto", "qr"]);

function isBlock(fieldKey: IdCardFieldKey) {
  return BLOCK_FIELDS.has(fieldKey);
}

function fieldColor(fieldKey: IdCardFieldKey, active: boolean): string {
  if (active) return "rgba(99,102,241,0.85)";
  const map: Record<IdCardFieldKey, string> = {
    foto: "rgba(16,185,129,0.5)",
    nombre: "rgba(245,158,11,0.5)",
    dni: "rgba(59,130,246,0.5)",
    codigo: "rgba(139,92,246,0.5)",
    qr: "rgba(239,68,68,0.5)",
  };
  return map[fieldKey] ?? "rgba(100,100,100,0.4)";
}

// ─── Subject content renderer ─────────────────────────────────────────────────

function FieldContent({
  fieldKey,
  subject,
  scale,
  width,
  height,
  fontSize,
  fontFamily,
  fontWeight,
  colorHex,
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
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: scaledFont,
          color,
          background: "rgba(0,0,0,0.06)",
          fontFamily: "sans-serif",
          pointerEvents: "none",
        }}
      >
        📷
      </div>
    );
  }

  if (fieldKey === "qr") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: Math.round(22 * scale), lineHeight: 1 }}>▦</div>
        <div
          style={{
            fontSize: Math.round(8 * scale),
            fontFamily: "monospace",
            color,
            textAlign: "center",
            wordBreak: "break-all",
          }}
        >
          {subject.qrPayload}
        </div>
      </div>
    );
  }

  const text =
    fieldKey === "nombre"
      ? subject.fullName
      : fieldKey === "dni"
      ? subject.documentLabel
      : subject.cardCode;

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        fontSize: scaledFont,
        fontFamily: fontFamily ?? "sans-serif",
        fontWeight: fontWeight ?? "600",
        color,
        lineHeight: "1.15",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
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

  const safeW = Math.max(1, templateWidth);
  const safeH = Math.max(1, templateHeight);
  const scale = displayWidth / safeW;
  const displayHeight = Math.round(safeH * scale);

  useEffect(() => {
    setImgError(false);
  }, [baseImageUrl]);

  const handleDragStop = useCallback(
    (fieldKey: IdCardFieldKey, x: number, y: number) => {
      onFieldChange(fieldKey, {
        posX: Math.round((x / scale) * 10) / 10,
        posY: Math.round((y / scale) * 10) / 10,
      });
    },
    [onFieldChange, scale]
  );

  const handleResizeStop = useCallback(
    (
      fieldKey: IdCardFieldKey,
      x: number,
      y: number,
      refW: number,
      refH: number,
      isBlock: boolean
    ) => {
      onFieldChange(fieldKey, {
        posX: Math.round((x / scale) * 10) / 10,
        posY: Math.round((y / scale) * 10) / 10,
        width: Math.round((refW / scale) * 10) / 10,
        height: isBlock ? Math.round((refH / scale) * 10) / 10 : null,
      });
    },
    [onFieldChange, scale]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: displayWidth,
        height: displayHeight,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid var(--t-border)",
        background: "var(--t-hover)",
        flexShrink: 0,
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) onSelectField(null as unknown as IdCardFieldKey);
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
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--t-text-dim)",
            fontFamily: "sans-serif",
          }}
        >
          {imgError ? "Error cargando imagen base" : "Sin imagen base"}
        </div>
      )}

      {/* Draggable / resizable fields */}
      {fields.map((field) => {
        const isBlockField = isBlock(field.fieldKey);
        const active = field.fieldKey === activeFieldKey;

        const x = Math.round(field.posX * scale);
        const y = Math.round(field.posY * scale);
        const w = field.width != null ? Math.max(20, Math.round(field.width * scale)) : Math.max(20, Math.round(120 * scale));
        const h = isBlockField && field.height != null ? Math.max(16, Math.round(field.height * scale)) : isBlockField ? Math.max(16, Math.round(60 * scale)) : Math.max(16, Math.round(24 * scale));

        const enableResize = isBlockField
          ? { top: false, right: true, bottom: true, left: false, topRight: false, bottomRight: true, bottomLeft: false, topLeft: false }
          : { top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false };

        return (
          <Rnd
            key={field.fieldKey}
            position={{ x, y }}
            size={{ width: w, height: h }}
            bounds="parent"
            enableResizing={enableResize}
            onMouseDown={() => onSelectField(field.fieldKey)}
            onDragStop={(_e, d) => handleDragStop(field.fieldKey, d.x, d.y)}
            onResizeStop={(_e, _dir, ref, _delta, pos) =>
              handleResizeStop(field.fieldKey, pos.x, pos.y, ref.offsetWidth, ref.offsetHeight, isBlockField)
            }
            style={{
              zIndex: field.zIndex + 10,
              cursor: "move",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                border: active ? "2px solid rgba(99,102,241,0.9)" : "1px dashed rgba(99,102,241,0.35)",
                borderRadius: isBlockField ? 4 : 2,
                background: active ? "rgba(99,102,241,0.08)" : "transparent",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Field label badge */}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    top: -18,
                    left: 0,
                    background: "rgba(99,102,241,1)",
                    color: "#fff",
                    fontSize: 9,
                    fontFamily: "sans-serif",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "3px 3px 0 0",
                    whiteSpace: "nowrap",
                    zIndex: 999,
                    userSelect: "none",
                  }}
                >
                  {ID_CARD_FIELD_LABELS[field.fieldKey]}
                </div>
              )}

              {/* Content preview */}
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

              {/* Resize handle indicator (bottom-right) */}
              {isBlockField && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: fieldColor(field.fieldKey, active),
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </Rnd>
        );
      })}

      {/* Overlay: template dimensions label */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 6,
          fontSize: 9,
          fontFamily: "monospace",
          color: "rgba(255,255,255,0.6)",
          background: "rgba(0,0,0,0.35)",
          padding: "1px 4px",
          borderRadius: 3,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {templateWidth} × {templateHeight}
      </div>
    </div>
  );
}
