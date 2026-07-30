/**
 * Configuración del módulo de email. Carga perezosa (lazy): las variables de
 * entorno se leen y validan recién cuando algo intenta enviar un correo, no
 * al importar el módulo — así el servidor sigue arrancando en entornos donde
 * el email todavía no está configurado (igual que el resto de `server/config.js`).
 */

function readEnv(name) {
  return (process.env[name] ?? "").trim();
}

function readEnvInt(name, fallback) {
  const raw = readEnv(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

let cachedConfig = null;

/**
 * Construye y valida la configuración del módulo de email. Lanza un error
 * descriptivo si `RESEND_API_KEY` falta o está vacía — es la única variable
 * estrictamente obligatoria; el resto tiene defaults razonables.
 */
export function loadEmailConfig() {
  const apiKey = readEnv("RESEND_API_KEY");

  if (!apiKey) {
    throw new Error(
      "[email.config] Falta la variable de entorno RESEND_API_KEY. " +
        "Consigue una API key en https://resend.com/api-keys y agrégala a tu .env " +
        "(ver server/services/email/README.md, sección Configuración)."
    );
  }

  const appUrl = readEnv("APP_URL") || "https://www.democra.pro";

  return {
    apiKey,
    // OTP_FROM_NAME/OTP_FROM_EMAIL: variables ya usadas por el mailer legacy
    // (server/services/otp-mailer.js) — se reutilizan como fallback para que
    // instalaciones existentes no necesiten tocar su .env.
    fromName: readEnv("EMAIL_FROM_NAME") || readEnv("OTP_FROM_NAME") || "Democra",
    fromEmail:
      readEnv("EMAIL_FROM_ADDRESS") ||
      (readEnv("OTP_FROM_EMAIL") && !readEnv("OTP_FROM_EMAIL").includes("yourdomain.com")
        ? readEnv("OTP_FROM_EMAIL")
        : "onboarding@resend.dev"),

    replyTo: readEnv("EMAIL_REPLY_TO") || null,
    appName: readEnv("APP_NAME") || "Democra",
    appUrl,
    logoUrl: readEnv("APP_LOGO_URL") || `${appUrl}/brand/d-core-monogram.png`,
    maxRetries: readEnvInt("EMAIL_MAX_RETRIES", 3),
    retryBaseDelayMs: readEnvInt("EMAIL_RETRY_BASE_DELAY_MS", 300),
    defaultOtpTtlMinutes: readEnvInt("MFA_OTP_TTL_MINUTES", 10),
  };
}

/** Devuelve la configuración cacheada, cargándola (y validándola) la primera vez. */
export function getEmailConfig() {
  if (!cachedConfig) {
    cachedConfig = loadEmailConfig();
  }
  return cachedConfig;
}

/** Solo para tests: limpia la caché para forzar una relectura de `process.env`. */
export function resetEmailConfigCache() {
  cachedConfig = null;
}
