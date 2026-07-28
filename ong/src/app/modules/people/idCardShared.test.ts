import { describe, expect, it } from "vitest";
import {
  buildIdCardQrPayload,
  computeHmacSha256Token,
  verifyRotativeQrToken,
} from "./idCardShared";

describe("Rotative HMAC-SHA256 QR Payload (idCardShared)", () => {
  const cardCode = "VC-0001-A1B2C3";
  const fixedTimestamp = 1753736400000; // Timestamp fijo de prueba

  it("mantiene la retrocompatibilidad del formato estatico IDCARD:", () => {
    const payload = buildIdCardQrPayload(cardCode);
    expect(payload).toBe(`IDCARD:${cardCode}`);

    const result = verifyRotativeQrToken(payload);
    expect(result.valid).toBe(true);
    expect(result.cardCode).toBe(cardCode);
  });

  it("genera tokens rotativos basados en ventana de tiempo de 30s", () => {
    const payload = buildIdCardQrPayload(cardCode, {
      enableRotativeHmac: true,
      timestampMs: fixedTimestamp,
    });

    expect(payload).toContain(`IDCARD:${cardCode}:ROT:`);

    const result = verifyRotativeQrToken(payload, {
      timestampMs: fixedTimestamp,
    });
    expect(result.valid).toBe(true);
    expect(result.cardCode).toBe(cardCode);
  });

  it("acepta tokens dentro de la ventana de tolerancia de ±30s (slot offset)", () => {
    const windowSeconds = 30;
    const initialMs = fixedTimestamp;
    const payload = buildIdCardQrPayload(cardCode, {
      enableRotativeHmac: true,
      windowSeconds,
      timestampMs: initialMs,
    });

    // Probar 15 segundos mas tarde (dentro de la misma ventana de tolerancia)
    const slightlyLaterMs = initialMs + 15 * 1000;
    const verification = verifyRotativeQrToken(payload, {
      windowSeconds,
      timestampMs: slightlyLaterMs,
    });

    expect(verification.valid).toBe(true);
    expect(verification.cardCode).toBe(cardCode);
  });

  it("rechaza tokens fuera del rango de tolerancia temporal (> 60s de diferencia)", () => {
    const windowSeconds = 30;
    const initialMs = fixedTimestamp;
    const payload = buildIdCardQrPayload(cardCode, {
      enableRotativeHmac: true,
      windowSeconds,
      timestampMs: initialMs,
    });

    // Probar 120 segundos despues (4 ventanas de 30s desfasadas)
    const muchLaterMs = initialMs + 120 * 1000;
    const verification = verifyRotativeQrToken(payload, {
      windowSeconds,
      timestampMs: muchLaterMs,
    });

    expect(verification.valid).toBe(false);
  });
});
