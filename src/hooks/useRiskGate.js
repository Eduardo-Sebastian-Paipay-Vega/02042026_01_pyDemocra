import { requestJson } from "../services/api.js";
import { explainErrorCode } from "../shared/error-explainer.js";

const DEVICE_KEY = "solaris.device.fp";
const OTP_CHALLENGE_KEY = "solaris.otp.challenge";

const generateFingerprint = () => {
  const seed = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    crypto.randomUUID(),
  ].join("|");

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `fp_${Math.abs(hash)}_${Date.now()}`;
};

export const getDeviceFingerprint = () => {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const fingerprint = generateFingerprint();
  localStorage.setItem(DEVICE_KEY, fingerprint);
  return fingerprint;
};

export const saveOtpChallenge = (payload) => {
  sessionStorage.setItem(OTP_CHALLENGE_KEY, JSON.stringify(payload || {}));
};

export const readOtpChallenge = () => {
  const raw = sessionStorage.getItem(OTP_CHALLENGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearOtpChallenge = () => {
  sessionStorage.removeItem(OTP_CHALLENGE_KEY);
};

const withAuthHeaders = (session, headers = {}) => {
  const token = session?.access_token;
  if (!token) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};

export const useRiskGate = () => {
  const evaluateRisk = async ({
    session,
    tenantId,
    eventType,
    actionName,
    actionCriticality,
    requiredPermission,
    sedeId,
    overrideAuthorized,
  }) => {
    const body = {
      tipo_evento: eventType || "LOGIN_WEB",
      tenant_id: tenantId || null,
      timestamp: new Date().toISOString(),
      device_fingerprint: getDeviceFingerprint(),
      user_agent: navigator.userAgent,
      action_name: actionName || null,
      action_criticality: actionCriticality || "LOW",
      required_permission: requiredPermission || null,
      sede_id: sedeId || null,
      override_authorized: Boolean(overrideAuthorized),
      geo_country: null,
    };

    const payload = await requestJson("/api/auth/risk-evaluate", {
      method: "POST",
      headers: withAuthHeaders(session, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });

    if (payload?.decision === "REQUIRE_OTP" && payload?.challenge_id) {
      saveOtpChallenge({
        challenge_id: payload.challenge_id,
        tenant_id: tenantId,
        risk_level: payload.risk_level,
        user_message: payload.user_message,
        delivery_hint: payload.challenge_delivery_hint || null,
        delivery_status: payload.challenge_delivery_status || null,
        expires_at: payload.challenge_expires_at || null,
        debug_otp: payload.debug_otp || null,
      });
    }

    return payload;
  };

  const verifyStepUpOtp = async ({ session, challengeId, code }) => {
    return requestJson("/api/auth/step-up/verify-otp", {
      method: "POST",
      headers: withAuthHeaders(session, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        challenge_id: challengeId,
        code,
      }),
    });
  };

  const resendStepUpOtp = async ({ session, challengeId, tenantId = null }) => {
    const payload = await requestJson("/api/auth/step-up/resend-otp", {
      method: "POST",
      headers: withAuthHeaders(session, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        challenge_id: challengeId,
        tenant_id: tenantId,
      }),
    });

    if (payload?.challenge_id) {
      const current = readOtpChallenge() || {};
      saveOtpChallenge({
        ...current,
        challenge_id: payload.challenge_id,
        delivery_hint: payload.challenge_delivery_hint || current.delivery_hint || null,
        delivery_status: payload.challenge_delivery_status || current.delivery_status || null,
        expires_at: payload.challenge_expires_at || current.expires_at || null,
        debug_otp: payload.debug_otp || current.debug_otp || null,
      });
    }

    return payload;
  };

  const guardCriticalAction = async ({
    session,
    tenantId,
    actionName,
    permission,
    sedeId,
    criticality = "HIGH",
  }) => {
    const result = await evaluateRisk({
      session,
      tenantId,
      eventType: "ACTION_CRITICAL",
      actionName,
      actionCriticality: criticality,
      requiredPermission: permission,
      sedeId,
      overrideAuthorized: false,
    });

    if (result?.error_code) {
      return {
        allowed: false,
        ...explainErrorCode(result.error_code),
        raw: result,
      };
    }

    if (result?.decision === "ALLOW") {
      return { allowed: true, raw: result };
    }

    if (result?.decision === "REQUIRE_OTP") {
      return {
        allowed: false,
        requires_step_up: true,
        raw: result,
      };
    }

    return {
      allowed: false,
      requires_step_up: false,
      raw: result,
    };
  };

  return {
    evaluateRisk,
    verifyStepUpOtp,
    resendStepUpOtp,
    guardCriticalAction,
    saveOtpChallenge,
    readOtpChallenge,
    clearOtpChallenge,
  };
};
