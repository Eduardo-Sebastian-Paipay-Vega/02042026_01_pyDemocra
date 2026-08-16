import crypto from "node:crypto";
import { processBatchOfflineSync, verifyRotativeHmacQrServer } from "./offline-sync.js";

describe("Modulo M13: Sincronizacion Offline y QR HMAC (server/services/offline-sync.js)", () => {
  const secretKey = "democra-qr-secret-key";

  test("procesa lote de sincronizacion offline SQLite de la app movil", () => {
    const batch = processBatchOfflineSync({
      deviceId: "dev_mob_991823",
      batchId: "batch_1001",
      records: [
        { id: "rec-1", type: "ASISTENCIA", timestamp: "2026-07-28T16:00:00Z" },
        { id: "rec-2", type: "FIRMA_CONSENTIMIENTO", timestamp: "2026-07-28T16:05:00Z" },
      ],
    });

    expect(batch.success).toBe(true);
    expect(batch.totalReceived).toBe(2);
    expect(batch.totalProcessed).toBe(2);
    expect(batch.totalRejected).toBe(0);
  });

  test("valida exitosamente un QR HMAC dinámico rotativo dentro del slot temporal", () => {
    const cardCode = "USR987654";
    const currentSlot = Math.floor(Math.floor(Date.now() / 1000) / 30);
    const message = `${cardCode}:${currentSlot}`;
    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("hex")
      .substring(0, 12);

    const qrString = `IDCARD:${cardCode}:ROT:${currentSlot}:${hmac}`;

    const res = verifyRotativeHmacQrServer({ qrString, secretKey, maxWindowSeconds: 60 });

    expect(res.valid).toBe(true);
    expect(res.cardCode).toBe(cardCode);
  });

  test("rechaza QR rotativo HMAC alterado o con firma invalida", () => {
    const qrString = "IDCARD:USR987654:ROT:100:badhmac123456";
    const res = verifyRotativeHmacQrServer({ qrString, secretKey, maxWindowSeconds: 60 });

    expect(res.valid).toBe(false);
    expect(res.reason).toContain("Firma HMAC invalida");
  });
});
