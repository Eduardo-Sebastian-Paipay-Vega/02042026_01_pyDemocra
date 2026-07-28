import { createStripePayment, createStripeSubscription } from "./payments/stripe.js";
import { createCulqiCharge } from "./payments/culqi.js";
import { createMercadoPagoPreference } from "./payments/mercadopago.js";
import { verifyHmacSignature, processIncomingPaymentWebhook } from "../routes/webhooks-payments.js";

describe("Modulo M14: Donaciones y Pasarelas de Pago (server/services/payments/)", () => {
  describe("Adaptador Stripe", () => {
    test("procesa cobro de donacion simulada en desarrollo", async () => {
      const res = await createStripePayment({
        amount: 50,
        currency: "USD",
        customerEmail: "donante@example.com",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("stripe-mock");
      expect(res.amount).toBe(50);
      expect(res.status).toBe("succeeded");
    });

    test("crea suscripcion de apadrinamiento recurrente", async () => {
      const res = await createStripeSubscription({
        customerEmail: "padrino@example.com",
        monthlyAmount: 30,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("active");
      expect(res.monthlyAmount).toBe(30);
    });

    test("lanza error si el monto es invalido", async () => {
      await expect(
        createStripePayment({ amount: 0, customerEmail: "a@b.com" })
      ).rejects.toThrow("El monto de la donacion debe ser mayor a cero.");
    });
  });

  describe("Adaptadores Locales (Culqi & MercadoPago)", () => {
    test("procesa cargo simulado Culqi / Yape", async () => {
      const res = await createCulqiCharge({
        amount: 100,
        currency: "PEN",
        email: "donante@peru.com",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("culqi-mock");
      expect(res.currency).toBe("PEN");
    });

    test("crea preferencia de pago MercadoPago", async () => {
      const res = await createMercadoPagoPreference({
        amount: 75,
        payerEmail: "donante@latam.com",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("mercadopago-mock");
      expect(res.initPoint).toBeDefined();
    });
  });

  describe("Verificacion de Webhooks de Pago (webhooks-payments.js)", () => {
    const secret = "mi-webhook-secret-key-123";
    const rawBody = '{"id":"evt_123","type":"payment.succeeded"}';

    test("verifica firma HMAC-SHA256 valida de webhook entrante", () => {
      const crypto = require("node:crypto");
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const isValid = verifyHmacSignature(rawBody, validSignature, secret);
      expect(isValid).toBe(true);
    });

    test("rechaza webhooks con firma alterada o invalida", () => {
      const isValid = verifyHmacSignature(rawBody, "firma-invalida-manipulada", secret);
      expect(isValid).toBe(false);
    });

    test("procesa webhook valido y retorna estado HTTP 200", () => {
      const crypto = require("node:crypto");
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const res = processIncomingPaymentWebhook({
        rawBody,
        signature: validSignature,
        secretKey: secret,
        eventData: { id: "evt_123", type: "payment.succeeded" },
      });

      expect(res.status).toBe(200);
      expect(res.success).toBe(true);
      expect(res.paymentId).toBe("evt_123");
    });
  });
});
