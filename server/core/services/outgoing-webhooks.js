import crypto from "node:crypto";

/**
 * Motor de despacho de Webhooks Salientes (Módulo M12 / API Gateway).
 * Firma payloads con HMAC-SHA256 e implementa reintentos exponenciales (Exponential Backoff).
 */

/**
 * Calcula la demora de reintento exponencial con aleatorización de dispersión (jitter).
 *
 * @param {number} attempt - Número de intento (1, 2, 3...).
 * @param {number} [baseDelayMs=1000] - Tiempo base en ms (1s).
 * @param {number} [maxDelayMs=30000] - Tiempo máximo de espera en ms (30s).
 * @returns {number} Tiempo de espera en milisegundos.
 */
export function calculateExponentialBackoffDelay(attempt, baseDelayMs = 1000, maxDelayMs = 30000) {
  const exponentialFactor = 2 ** (attempt - 1);
  const calculatedMs = baseDelayMs * exponentialFactor;
  const jitter = Math.floor(Math.random() * 200); // 0-200ms de dispersión
  return Math.min(calculatedMs + jitter, maxDelayMs);
}

/**
 * Genera la firma HMAC-SHA256 para una cabecera de webhook saliente.
 *
 * @param {string} payloadString - Payload del evento serializado en JSON string.
 * @param {string} clientSecretKey - Clave secreta compartida con el cliente.
 * @returns {string} Firma hexadecimal HMAC-SHA256.
 */
export function signOutgoingPayload(payloadString, clientSecretKey) {
  return crypto
    .createHmac("sha256", clientSecretKey || "democra-default-webhook-secret")
    .update(payloadString)
    .digest("hex");
}

/**
 * Despacha un evento webhook saliente a un endpoint de cliente externo
 * realizando reintentos exponenciales si ocurren fallos HTTP 5xx o de red.
 *
 * @param {Object} options
 * @param {string} options.targetUrl - URL del webhook de destino.
 * @param {string} options.clientSecretKey - Clave secreta de firma HMAC.
 * @param {string} options.eventType - Tipo de evento (ej. 'voluntario.creado', 'donacion.recibida').
 * @param {Object} options.payloadData - Datos del evento.
 * @param {number} [options.maxRetries=3] - Intentos máximos de despacho.
 * @param {Object} [options.configOverride] - Opciones de prueba.
 * @returns {Promise<Object>} Resultado del despacho con historial de intentos.
 */
export async function dispatchOutgoingWebhook({
  targetUrl,
  clientSecretKey,
  eventType,
  payloadData,
  maxRetries = 3,
  configOverride = {},
}) {
  if (!targetUrl) {
    throw new Error("La URL de destino (targetUrl) es obligatoria para despachar webhooks salientes.");
  }
  if (!eventType) {
    throw new Error("El tipo de evento (eventType) es obligatorio.");
  }

  const timestamp = new Date().toISOString();
  const payloadObject = {
    event: eventType,
    timestamp,
    data: payloadData || {},
  };
  const payloadString = JSON.stringify(payloadObject);
  const signature = signOutgoingPayload(payloadString, clientSecretKey);

  const mockFailCount = configOverride.simulateFailAttempts || 0;
  const attemptsLog = [];

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptTime = new Date().toISOString();

    // Si es una simulación de pruebas y se solicitó fallar en este intento
    if (configOverride.mockFetch) {
      const mockResult = await configOverride.mockFetch(attempt);
      attemptsLog.push({
        attempt,
        time: attemptTime,
        status: mockResult.status,
        success: mockResult.ok,
      });

      if (mockResult.ok) {
        return {
          success: true,
          targetUrl,
          eventType,
          signature,
          attempts: attempt,
          attemptsLog,
        };
      }

      lastError = mockResult.error || `HTTP ${mockResult.status}`;
    } else {
      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Democra-Signature": signature,
            "X-Democra-Event": eventType,
            "X-Democra-Timestamp": timestamp,
          },
          body: payloadString,
        });

        attemptsLog.push({
          attempt,
          time: attemptTime,
          status: response.status,
          success: response.ok,
        });

        if (response.ok) {
          return {
            success: true,
            targetUrl,
            eventType,
            signature,
            attempts: attempt,
            attemptsLog,
          };
        }

        lastError = `HTTP Status ${response.status}`;
      } catch (err) {
        attemptsLog.push({
          attempt,
          time: attemptTime,
          status: 0,
          success: false,
          error: err.message,
        });
        lastError = err.message;
      }
    }

    // Si aún quedan reintentos, aguardar delay de Exponential Backoff
    if (attempt < maxRetries) {
      const delayMs = calculateExponentialBackoffDelay(attempt, 50, 500); // Tiempos cortos para pruebas
      if (!configOverride.skipDelay) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return {
    success: false,
    targetUrl,
    eventType,
    signature,
    attempts: maxRetries,
    attemptsLog,
    error: `Fallo tras ${maxRetries} intentos. Ultimo error: ${lastError}`,
  };
}
