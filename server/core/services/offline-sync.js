import crypto from "node:crypto";

/**
 * Servicio de Sincronización Offline Lote (Delta Sync) y Validador de QR HMAC-SHA256
 * (Módulo M13 / RF-080 a RF-087).
 */

/**
 * Procesa un paquete batch de sincronización offline enviado por la App Móvil (SQLite local).
 *
 * @param {Object} options
 * @param {string} options.deviceId - UUID único del dispositivo móvil.
 * @param {string} options.batchId - ID único del lote de sincronización.
 * @param {Array<Object>} options.records - Registros offline (asistencias, firmas, escaneos QR).
 * @returns {Object} Resultado del procesamiento del lote.
 */
export function processBatchOfflineSync({ deviceId, batchId, records = [] }) {
  if (!deviceId || !batchId) {
    throw new Error("El ID de dispositivo y lote de sincronización son obligatorios.");
  }

  const processedRecords = [];
  const rejectedRecords = [];

  for (const rec of records) {
    if (rec.id && rec.timestamp && rec.type) {
      processedRecords.push({
        id: rec.id,
        type: rec.type,
        status: "SINCRONIZADO",
        syncedAt: new Date().toISOString(),
      });
    } else {
      rejectedRecords.push({
        record: rec,
        reason: "Estructura de registro offline incompleta.",
      });
    }
  }

  return {
    success: true,
    deviceId,
    batchId,
    totalReceived: records.length,
    totalProcessed: processedRecords.length,
    totalRejected: rejectedRecords.length,
    processedRecords,
    rejectedRecords,
    syncCompletedAt: new Date().toISOString(),
  };
}

/**
 * Valida en servidor un token QR dinámico rotativo HMAC-SHA256 con ventana de tolerancia temporal (TOTP).
 * Formato esperado: `IDCARD:<CARD_CODE>:ROT:<SLOT>:<HMAC>`
 *
 * @param {Object} options
 * @param {string} options.qrString - Cadena QR escaneada.
 * @param {string} options.secretKey - Clave secreta compartida.
 * @param {number} [options.maxWindowSeconds=60] - Ventana de tolerancia temporal en segundos.
 * @returns {Object} Resultado de la validación del QR.
 */
export function verifyRotativeHmacQrServer({ qrString, secretKey = "democra-qr-secret-key", maxWindowSeconds = 60 }) {
  if (!qrString || typeof qrString !== "string") {
    return { valid: false, reason: "Cadena QR nula o vacia" };
  }

  const parts = qrString.split(":");
  if (parts.length < 5 || parts[0] !== "IDCARD" || parts[2] !== "ROT") {
    return { valid: false, reason: "Formato de QR no compatible con token rotativo HMAC" };
  }

  const cardCode = parts[1];
  const slot = parseInt(parts[3], 10);
  const providedHmac = parts[4];

  if (isNaN(slot)) {
    return { valid: false, reason: "Slot temporal invalido" };
  }

  // Calcular slot temporal actual y anteriores dentro de la ventana de tolerancia
  const currentTimestampSec = Math.floor(Date.now() / 1000);
  const currentSlot = Math.floor(currentTimestampSec / 30);
  const maxSlotsTolerance = Math.ceil(maxWindowSeconds / 30);

  let matchFound = false;

  for (let offset = -maxSlotsTolerance; offset <= maxSlotsTolerance; offset++) {
    const candidateSlot = currentSlot + offset;
    if (candidateSlot === slot) {
      const message = `${cardCode}:${candidateSlot}`;
      const expectedHmac = crypto
        .createHmac("sha256", secretKey)
        .update(message)
        .digest("hex")
        .substring(0, 12);

      if (crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
        matchFound = true;
        break;
      }
    }
  }

  if (!matchFound) {
    return { valid: false, reason: "Firma HMAC invalida o token QR expirado fuera de la ventana de tiempo" };
  }

  return {
    valid: true,
    cardCode,
    slot,
    validatedAt: new Date().toISOString(),
  };
}
