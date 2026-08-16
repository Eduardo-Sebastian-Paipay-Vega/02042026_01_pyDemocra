/** Falla de validación local (nunca se reintenta — el request nunca llega a Resend). */
export class EmailValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailValidationError";
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

/** Escapa HTML para interpolar valores dinámicos (nombres, códigos) en plantillas sin abrir paso a inyección. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function normalizeRecipients(value) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Valida un `EmailOptions` antes de tocar red. Lanza `EmailValidationError`
 * con un mensaje puntual sobre qué campo falló.
 */
export function validateEmailOptions(options) {
  const recipients = normalizeRecipients(options.to);

  if (recipients.length === 0) {
    throw new EmailValidationError("El correo necesita al menos un destinatario (to).");
  }

  for (const recipient of recipients) {
    if (!isValidEmail(recipient)) {
      throw new EmailValidationError(`Destinatario inválido: "${recipient}".`);
    }
  }

  for (const [field, value] of [
    ["cc", options.cc],
    ["bcc", options.bcc],
  ]) {
    if (!value) continue;
    for (const recipient of normalizeRecipients(value)) {
      if (!isValidEmail(recipient)) {
        throw new EmailValidationError(`Destinatario inválido en ${field}: "${recipient}".`);
      }
    }
  }

  if (!options.subject || !options.subject.trim()) {
    throw new EmailValidationError("El correo necesita un asunto (subject).");
  }

  if (!options.html || !options.html.trim()) {
    throw new EmailValidationError("El correo necesita contenido HTML (html).");
  }
}

/** Códigos HTTP que justifican reintento: rate limit y errores transitorios del servidor. */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Distingue errores transitorios (reintentar puede funcionar) de permanentes
 * (reintentar es inútil: API key inválida, email malformado, dominio no
 * verificado, payload rechazado, etc.).
 */
export function isRetryableError(error) {
  if (error instanceof EmailValidationError) return false;

  const status = error?.statusCode ?? error?.status;

  if (typeof status === "number") {
    return RETRYABLE_STATUS_CODES.has(status);
  }

  // Sin status HTTP: probablemente un fallo de red (fetch failed, timeout, DNS).
  const name = error?.name ?? "";
  const message = error?.message ?? "";
  return /network|timeout|fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(`${name} ${message}`);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ejecuta `fn` con reintentos y backoff exponencial (baseDelayMs, *2, *4, ...).
 * Se detiene de inmediato ante un error no reintentable. Devuelve `{ result, attempts }`
 * si tiene éxito, o relanza el último error si se agotan los intentos.
 */
export async function withRetry(fn, { maxRetries, baseDelayMs }) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt || !isRetryableError(error)) {
        throw error;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  // Inalcanzable (maxRetries >= 1 siempre entra al loop).
  throw lastError;
}

/**
 * Logger por defecto: consola estructurada. Nunca recibe ni imprime la API key
 * (no forma parte de `ILogEntry`) — ver server/services/email/README.md, sección Seguridad.
 */
export const consoleEmailLogger = {
  logSend(entry) {
    const line = {
      at: new Date().toISOString(),
      scope: "email",
      ...entry,
    };
    if (entry.ok) {
      console.log(JSON.stringify(line));
    } else {
      console.error(JSON.stringify(line));
    }
  },
};
