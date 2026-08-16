import { config } from "../../config.js";
import { emailService } from "./email/index.js";

// Adaptador delgado sobre server/services/email/ (Resend oficial + SOLID).
// Mantiene el contrato histórico de sendStepUpOtp({ toEmail, otpCode, ttlMinutes })
// -> { ok, provider, reason?, status?, detail?, messageId? } para no romper a
// server/security/risk-engine.js (createOtpChallenge/resendOtpChallenge), que
// llama esta función sin try/catch y lee esos campos con `?.` y `||`.

const toSafeText = (value) => String(value || "").trim();

export const sendStepUpOtp = async ({ toEmail, otpCode, ttlMinutes }) => {
  const email = toSafeText(toEmail);

  if (!email.includes("@")) {
    return {
      ok: false,
      provider: config.otpEmailProvider || "none",
      reason: "missing_recipient",
    };
  }

  if (config.otpEmailProvider !== "resend") {
    return {
      ok: false,
      provider: config.otpEmailProvider || "none",
      reason: "provider_not_configured",
    };
  }

  try {
    const result = await emailService.sendOTP({
      to: email,
      code: toSafeText(otpCode),
      ttlMinutes: Number(ttlMinutes) || undefined,
    });

    if (result.ok) {
      return { ok: true, provider: "resend", messageId: result.id || null };
    }

    return {
      ok: false,
      provider: "resend",
      reason: "provider_error",
      status: result.error.status ?? null,
      detail: result.error.message || null,
    };
  } catch (error) {
    // RESEND_API_KEY ausente (u otro fallo de configuración): el módulo de
    // email lanza al validar config, no al enviar — se traduce al mismo
    // "provider_not_configured" que ya devolvía esta función.
    return {
      ok: false,
      provider: "resend",
      reason: "provider_not_configured",
      detail: error?.message || null,
    };
  }
};
