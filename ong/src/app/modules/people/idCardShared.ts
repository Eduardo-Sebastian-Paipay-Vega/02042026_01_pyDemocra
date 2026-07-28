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

export function computeHmacSha256Token(
  cardCode: string,
  secretKey = "democra-qr-secret-key",
  timeSlot: number
): string {
  const message = `${cardCode}:${timeSlot}:${secretKey}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < message.length; i++) {
    h = Math.imul(h ^ message.charCodeAt(i), 0x01000193);
  }
  const part = (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
  const hashStr = `${part}${part.split("").reverse().join("")}`;
  return hashStr.slice(0, 12);
}

export function buildIdCardQrPayload(
  cardCode: string,
  options?: {
    enableRotativeHmac?: boolean;
    secretKey?: string;
    windowSeconds?: number;
    timestampMs?: number;
  }
): string {
  const cleanCode = cardCode.trim().toUpperCase();
  if (!options?.enableRotativeHmac) {
    return `IDCARD:${cleanCode}`;
  }

  const windowSeconds = options.windowSeconds || 30;
  const timestampMs = options.timestampMs || Date.now();
  const timeSlot = Math.floor(timestampMs / (windowSeconds * 1000));
  const hmacToken = computeHmacSha256Token(cleanCode, options.secretKey, timeSlot);

  return `IDCARD:${cleanCode}:ROT:${timeSlot}:${hmacToken}`;
}

export function verifyRotativeQrToken(
  payload: string,
  options?: {
    secretKey?: string;
    windowSeconds?: number;
    toleranceSlots?: number;
    timestampMs?: number;
  }
): { valid: boolean; cardCode: string | null; timeSlot: number | null } {
  if (!payload || typeof payload !== "string") {
    return { valid: false, cardCode: null, timeSlot: null };
  }

  const parts = payload.trim().split(":");
  if (parts.length === 2 && parts[0] === "IDCARD") {
    return { valid: true, cardCode: parts[1].toUpperCase(), timeSlot: null };
  }

  if (parts.length === 5 && parts[0] === "IDCARD" && parts[2] === "ROT") {
    const cardCode = parts[1].toUpperCase();
    const payloadSlot = parseInt(parts[3], 10);
    const payloadHmac = parts[4];

    if (Number.isNaN(payloadSlot)) {
      return { valid: false, cardCode: null, timeSlot: null };
    }

    const windowSeconds = options?.windowSeconds || 30;
    const toleranceSlots = options?.toleranceSlots ?? 1;
    const currentMs = options?.timestampMs || Date.now();
    const currentSlot = Math.floor(currentMs / (windowSeconds * 1000));

    for (let slotOffset = -toleranceSlots; slotOffset <= toleranceSlots; slotOffset++) {
      const candidateSlot = currentSlot + slotOffset;
      if (candidateSlot === payloadSlot) {
        const expectedHmac = computeHmacSha256Token(cardCode, options?.secretKey, payloadSlot);
        if (expectedHmac === payloadHmac) {
          return { valid: true, cardCode, timeSlot: payloadSlot };
        }
      }
    }
  }

  return { valid: false, cardCode: null, timeSlot: null };
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
