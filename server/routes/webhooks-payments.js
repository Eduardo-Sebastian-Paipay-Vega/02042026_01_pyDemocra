import crypto from "node:crypto";

/**
 * Utilidad de verificación criptográfica de firma HMAC-SHA256 para webhooks de pago.
 *
 * @param {string} rawBody - Cuerpo plano sin alterar del webhook.
 * @param {string} signature - Firma recibida en la cabecera HTTP.
 * @param {string} secretKey - Clave secreta del webhook.
 * @returns {boolean} Verdadero si la firma es auténtica y no ha sido alterada.
 */
export function verifyHmacSignature(rawBody, signature, secretKey) {
  if (!rawBody || !signature || !secretKey) {
    return false;
  }

  try {
    const computedHmac = crypto
      .createHmac("sha256", secretKey)
      .update(String(rawBody))
      .digest("hex");

    const cleanSig = signature.replace(/^(sha256=)/i, "").trim();

    const bufferComputed = Buffer.from(computedHmac, "utf8");
    const bufferReceived = Buffer.from(cleanSig, "utf8");

    if (bufferComputed.length !== bufferReceived.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferComputed, bufferReceived);
  } catch {
    return false;
  }
}

/**
 * Procesa un evento de webhook de pago entrante (Stripe/Culqi/MercadoPago).
 *
 * @param {Object} options
 * @param {string} options.rawBody - Cuerpo del webhook en string.
 * @param {string} options.signature - Cabecera de firma (X-Signature / Stripe-Signature).
 * @param {string} options.secretKey - Secreto configurado.
 * @param {Object} options.eventData - Objeto parseado del evento.
 * @returns {Object} Resultado del procesamiento de webhook.
 */
export function processIncomingPaymentWebhook({
  rawBody,
  signature,
  secretKey,
  eventData,
}) {
  const isValid = verifyHmacSignature(rawBody, signature, secretKey);

  if (!isValid) {
    return {
      status: 401,
      success: false,
      error: "Firma criptografica de webhook invalida o manipulada.",
    };
  }

  const eventType = eventData?.type || eventData?.event || "payment.succeeded";
  const paymentId = eventData?.data?.object?.id || eventData?.id || `evt_${Date.now()}`;

  return {
    status: 200,
    success: true,
    message: `Webhook de pago '${eventType}' verificado y procesado exitosamente.`,
    paymentId,
    eventType,
    processedAt: new Date().toISOString(),
  };
}
