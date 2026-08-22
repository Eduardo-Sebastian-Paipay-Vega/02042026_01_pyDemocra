import type {
  IdCardFieldKey,
  IdCardRenderSubject,
  IdCardStatusCode,
  IdCardTemplateFieldRow,
} from "./types";

export const ID_CARD_FIELD_KEYS: IdCardFieldKey[] = [
  "foto",
  "nombre",
  "dni",
  "codigo",
  "qr",
];

export const ID_CARD_FIELD_LABELS: Record<IdCardFieldKey, string> = {
  foto: "Foto",
  nombre: "Nombre",
  dni: "DNI",
  codigo: "Codigo",
  qr: "QR",
};

export const ID_CARD_STATUS_LABELS: Record<IdCardStatusCode, string> = {
  activa: "Activa",
  revocada: "Revocada",
  expirada: "Expirada",
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createDefaultIdCardFields(
  templateWidth: number,
  templateHeight: number
): IdCardTemplateFieldRow[] {
  const safeWidth = Math.max(320, Math.round(templateWidth || 720));
  const safeHeight = Math.max(200, Math.round(templateHeight || 420));
  const padding = Math.max(16, round2(safeWidth * 0.04));
  const photoWidth = round2(safeWidth * 0.24);
  const photoHeight = round2(safeHeight * 0.5);
  const qrSize = round2(safeWidth * 0.2);
  const textStartX = round2(padding + photoWidth + padding);
  const textWidth = round2(safeWidth - textStartX - qrSize - padding * 2);
  const qrX = round2(safeWidth - padding - qrSize);

  return [
    {
      id: null,
      fieldKey: "foto",
      label: ID_CARD_FIELD_LABELS.foto,
      posX: padding,
      posY: padding,
      width: photoWidth,
      height: photoHeight,
      fontSize: null,
      fontFamily: null,
      fontWeight: null,
      colorHex: null,
      zIndex: 1,
    },
    {
      id: null,
      fieldKey: "nombre",
      label: ID_CARD_FIELD_LABELS.nombre,
      posX: textStartX,
      posY: padding + 10,
      width: textWidth,
      height: null,
      fontSize: round2(Math.max(22, safeHeight * 0.07)),
      fontFamily: "sans-serif",
      fontWeight: "700",
      colorHex: "#0F172A",
      zIndex: 3,
    },
    {
      id: null,
      fieldKey: "dni",
      label: ID_CARD_FIELD_LABELS.dni,
      posX: textStartX,
      posY: padding + photoHeight * 0.46,
      width: textWidth,
      height: null,
      fontSize: round2(Math.max(16, safeHeight * 0.05)),
      fontFamily: "sans-serif",
      fontWeight: "600",
      colorHex: "#1F2937",
      zIndex: 3,
    },
    {
      id: null,
      fieldKey: "codigo",
      label: ID_CARD_FIELD_LABELS.codigo,
      posX: textStartX,
      posY: padding + photoHeight * 0.68,
      width: textWidth,
      height: null,
      fontSize: round2(Math.max(14, safeHeight * 0.045)),
      fontFamily: "monospace",
      fontWeight: "600",
      colorHex: "#334155",
      zIndex: 3,
    },
    {
      id: null,
      fieldKey: "qr",
      label: ID_CARD_FIELD_LABELS.qr,
      posX: qrX,
      posY: padding,
      width: qrSize,
      height: qrSize,
      fontSize: null,
      fontFamily: null,
      fontWeight: null,
      colorHex: null,
      zIndex: 2,
    },
  ];
}

export function mergeIdCardFieldsWithDefaults(
  fields: IdCardTemplateFieldRow[],
  templateWidth: number,
  templateHeight: number
): IdCardTemplateFieldRow[] {
  const defaults = createDefaultIdCardFields(templateWidth, templateHeight);
  const byKey = new Map(fields.map((field) => [field.fieldKey, field]));

  return ID_CARD_FIELD_KEYS.map((fieldKey) => {
    const base = defaults.find((field) => field.fieldKey === fieldKey)!;
    const current = byKey.get(fieldKey);
    return current
      ? {
          ...base,
          ...current,
          label: ID_CARD_FIELD_LABELS[fieldKey],
        }
      : base;
  });
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.max(4, Math.ceil(length / 2)));
  globalThis.crypto?.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length)
    .toUpperCase();
}

export function generateIdCardCode(documentNumber?: string | null): string {
  const suffix = randomHex(6);
  const documentTail =
    (documentNumber ?? "")
      .replace(/\D/g, "")
      .slice(-4)
      .padStart(4, "0") || "0000";

  return `VC-${documentTail}-${suffix}`;
}

export function buildIdCardQrPayload(cardCode: string): string {
  return `IDCARD:${cardCode.trim().toUpperCase()}`;
}

export function buildIdCardRenderSubject(options: {
  fullName?: string | null;
  documentLabel?: string | null;
  photoUrl?: string | null;
  cardCode?: string | null;
  qrPayload?: string | null;
}): IdCardRenderSubject {
  return {
    fullName: options.fullName?.trim() || "[nombre]",
    documentLabel: options.documentLabel?.trim() || "[dni]",
    photoUrl: options.photoUrl?.trim() || null,
    cardCode: options.cardCode?.trim() || "[codigo]",
    qrPayload: options.qrPayload?.trim() || buildIdCardQrPayload("[codigo]"),
  };
}

