export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.API_PORT || 8787),
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  rucApiUrl: process.env.VITE_RUC_API_URL || process.env.RUC_API_URL || "",
  rucApiToken: process.env.RUC_API_TOKEN || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  otpPepper: process.env.MFA_OTP_PEPPER || "dev-local-pepper",
  otpTtlMinutes: Number(process.env.MFA_OTP_TTL_MINUTES || 10),
  otpEmailProvider: (process.env.OTP_EMAIL_PROVIDER || "none").toLowerCase(),
  otpFromEmail: process.env.OTP_FROM_EMAIL || "",
  otpFromName: process.env.OTP_FROM_NAME || "Solaris Security",
  otpResendApiKey: process.env.RESEND_API_KEY || "",
  otpResendApiUrl: process.env.OTP_RESEND_API_URL || "https://api.resend.com/emails",
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 8),
  maxPinAttempts: Number(process.env.MAX_PIN_ATTEMPTS || 5),
  pinBlockMinutes: Number(process.env.PIN_BLOCK_MINUTES || 15),
  riskTempBlockMinutes: Number(process.env.RISK_TEMP_BLOCK_MINUTES || 15),
  exposeDebugOtp: String(process.env.EXPOSE_DEBUG_OTP || "false") === "true",
};

export const assertServerConfig = () => {
  const missing = [];

  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno requeridas para API: ${missing.join(", ")}`
    );
  }
};
