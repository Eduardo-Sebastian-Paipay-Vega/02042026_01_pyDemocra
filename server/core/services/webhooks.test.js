import {
  calculateExponentialBackoffDelay,
  signOutgoingPayload,
  dispatchOutgoingWebhook,
} from "./outgoing-webhooks.js";

describe("Modulo M12: Webhooks Salientes y Reintentos Exponenciales (server/services/outgoing-webhooks.js)", () => {
  const secretKey = "secret-cliente-webhook-abc";

  test("calcula demoras exponenciales (Exponential Backoff) incrementales", () => {
    const delay1 = calculateExponentialBackoffDelay(1, 1000, 30000);
    const delay2 = calculateExponentialBackoffDelay(2, 1000, 30000);
    const delay3 = calculateExponentialBackoffDelay(3, 1000, 30000);

    expect(delay1).toBeGreaterThanOrEqual(1000);
    expect(delay2).toBeGreaterThan(delay1);
    expect(delay3).toBeGreaterThan(delay2);
  });

  test("firma correctamente el payload saliente con HMAC-SHA256", () => {
    const payloadStr = '{"event":"voluntario.registrado","id":"v123"}';
    const sig = signOutgoingPayload(payloadStr, secretKey);

    expect(sig).toBeDefined();
    expect(sig.length).toBe(64); // Hex SHA-256 es 64 caracteres
  });

  test("despacha webhook saliente exitoso al primer intento", async () => {
    const mockFetch = async () => ({ ok: true, status: 200 });

    const res = await dispatchOutgoingWebhook({
      targetUrl: "https://api.cliente-tercero.com/webhook",
      clientSecretKey: secretKey,
      eventType: "voluntario.creado",
      payloadData: { id: "vol-1" },
      configOverride: { mockFetch, skipDelay: true },
    });

    expect(res.success).toBe(true);
    expect(res.attempts).toBe(1);
    expect(res.signature).toBeDefined();
  });

  test("reintenta con Exponential Backoff ante fallos HTTP y logra exito", async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      if (callCount < 3) {
        return { ok: false, status: 503, error: "Service Unavailable" };
      }
      return { ok: true, status: 200 };
    };

    const res = await dispatchOutgoingWebhook({
      targetUrl: "https://api.cliente-tercero.com/webhook",
      clientSecretKey: secretKey,
      eventType: "donacion.recibida",
      payloadData: { amount: 100 },
      maxRetries: 3,
      configOverride: { mockFetch, skipDelay: true },
    });

    expect(res.success).toBe(true);
    expect(res.attempts).toBe(3);
    expect(res.attemptsLog.length).toBe(3);
    expect(res.attemptsLog[0].status).toBe(503);
    expect(res.attemptsLog[2].status).toBe(200);
  });

  test("retorna fallo controlado si se agotan todos los reintentos", async () => {
    const mockFetch = async () => ({ ok: false, status: 500, error: "Internal Server Error" });

    const res = await dispatchOutgoingWebhook({
      targetUrl: "https://api.cliente-tercero.com/webhook",
      clientSecretKey: secretKey,
      eventType: "evento.cancelado",
      payloadData: { id: "ev-99" },
      maxRetries: 2,
      configOverride: { mockFetch, skipDelay: true },
    });

    expect(res.success).toBe(false);
    expect(res.attempts).toBe(2);
    expect(res.error).toContain("Fallo tras 2 intentos");
  });
});
