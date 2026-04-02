import { config } from "../config.js";

const toSafeText = (value) => String(value || "").trim();

const formatFromField = () => {
  const fromEmail = toSafeText(config.otpFromEmail);
  const fromName = toSafeText(config.otpFromName) || "Solaris Security";
  if (!fromEmail) return "";
  return `${fromName} <${fromEmail}>`;
};

const buildOtpText = ({ otpCode, ttlMinutes }) => {
  return [
    "Codigo OTP de seguridad - Solaris",
    "",
    `Tu codigo de verificacion es: ${otpCode}`,
    `Este codigo vence en ${ttlMinutes} minutos.`,
    "",
    "Si no reconoces este acceso, ignora este correo y contacta a tu administrador.",
  ].join("\n");
};

const buildOtpHtml = ({ otpCode, ttlMinutes }) => {
  const safeCode = toSafeText(otpCode);
  const safeTtl = Number(ttlMinutes) || 10;

  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111827;">
      <h2 style="margin:0 0 16px;font-size:20px;">Codigo OTP de seguridad</h2>
      <p style="margin:0 0 12px;">Usa este codigo para completar tu ingreso:</p>
      <div style="font-size:28px;letter-spacing:4px;font-weight:700;padding:12px 16px;background:#f3f4f6;border-radius:8px;display:inline-block;">
        ${safeCode}
      </div>
      <p style="margin:16px 0 0;">Este codigo vence en ${safeTtl} minutos.</p>
      <p style="margin:16px 0 0;color:#6b7280;">
        Si no reconoces este acceso, ignora este mensaje y reportalo a tu administrador.
      </p>
    </div>
  `;
};

const sendWithResend = async ({ toEmail, otpCode, ttlMinutes }) => {
  const apiKey = toSafeText(config.otpResendApiKey);
  const from = formatFromField();

  if (!apiKey || !from) {
    return {
      ok: false,
      provider: "resend",
      reason: "provider_not_configured",
    };
  }

  const response = await fetch(config.otpResendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: "Tu codigo OTP de seguridad",
      text: buildOtpText({ otpCode, ttlMinutes }),
      html: buildOtpHtml({ otpCode, ttlMinutes }),
    }),
  });

  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      provider: "resend",
      reason: "provider_error",
      status: response.status,
      detail:
        toSafeText(payload?.message) || toSafeText(payload?.error?.message) || null,
    };
  }

  return {
    ok: true,
    provider: "resend",
    messageId: payload?.id || null,
  };
};

export const sendStepUpOtp = async ({ toEmail, otpCode, ttlMinutes }) => {
  const email = toSafeText(toEmail);
  if (!email.includes("@")) {
    return {
      ok: false,
      provider: config.otpEmailProvider || "none",
      reason: "missing_recipient",
    };
  }

  if (config.otpEmailProvider === "resend") {
    return sendWithResend({
      toEmail: email,
      otpCode,
      ttlMinutes,
    });
  }

  return {
    ok: false,
    provider: config.otpEmailProvider || "none",
    reason: "provider_not_configured",
  };
};
