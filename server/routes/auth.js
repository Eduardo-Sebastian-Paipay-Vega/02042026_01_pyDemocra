import express from "express";
import { config } from "../config.js";
import { resolveAuthContext, serviceClient } from "../supabase.js";
import {
  createSessionFromVerifiedChallenge,
  evaluateRiskEngine,
  resendOtpChallenge,
  verifyOtpChallenge,
} from "../security/risk-engine.js";
import { insertAuditLog, insertAuthEvent, buildMaskedRequestContext } from "../security/audit.js";
import { explainErrorCode } from "../../src/shared/error-explainer.js";
import { applyTenantScope, assertTenantScope } from "../utils/tenant-scope.js";
import {
  getClientCountry,
  getClientIp,
  sanitizeUserAgent,
  verifyPinHash,
} from "../utils/security.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";
import { emailService } from "../core/services/email/index.js";

const router = express.Router();

const toAuditCriticality = (riskLevel) => {
  if (riskLevel === "HIGH") return "high";
  if (riskLevel === "MEDIUM") return "medium";
  return "low";
};

const isBlockedDecision = (decision) => {
  const normalized = String(decision || "").toUpperCase();
  return normalized !== "ALLOW" && normalized !== "REQUIRE_OTP";
};

const resolveTenantOrError = (profile, requestedTenantId) => {
  const tenantId = requestedTenantId || profile?.tenant_id;
  if (!tenantId) return { errorCode: "TEN-003" };

  if (requestedTenantId && profile?.tenant_id && requestedTenantId !== profile.tenant_id) {
    return { errorCode: "TEN-003" };
  }

  return { tenantId };
};

const ensureTenantScopeOrReply = (res, tenantId, context) => {
  try {
    assertTenantScope(tenantId, context);
    return true;
  } catch {
    sendError(res, 409, "TEN-003", {
      error_type: "tenant",
    });
    return false;
  }
};

router.post("/risk-evaluate", async (req, res) => {
  try {
    const accessToken = getBearerToken(req);
    const authContext = await resolveAuthContext(accessToken);

    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", {
        error_type: "auth",
      });
    }

    const body = req.body || {};
    const { tenantId, errorCode: tenantError } = resolveTenantOrError(
      authContext.profile,
      body.tenant_id
    );

    if (tenantError) {
      return sendError(res, 409, tenantError, {
        error_type: "tenant",
      });
    }
    if (!ensureTenantScopeOrReply(res, tenantId, "auth.risk-evaluate")) return;

    const ip = getClientIp(req);
    const userAgent = sanitizeUserAgent(body.user_agent || req.headers["user-agent"]);
    const geoCountry = body.geo_country || getClientCountry(req);

    const result = await evaluateRiskEngine({
      tenantId,
      userId: authContext.user.id,
      userEmail: authContext.user.email,
      userClient: authContext.userClient,
      eventType: body.tipo_evento,
      ip,
      userAgent,
      deviceFingerprint: body.device_fingerprint,
      timestamp: body.timestamp,
      geoCountry,
      actionName: body.action_name,
      actionCriticality: body.action_criticality,
      requiredPermission: body.required_permission,
      sedeId: body.sede_id,
      profile: authContext.profile,
    });

    const isCriticalAction =
      String(body.tipo_evento || "").toUpperCase() === "ACTION_CRITICAL";

    const authEventType = isCriticalAction
      ? result.decision === "ALLOW"
        ? "ACTION_CRITICAL_ALLOWED"
        : result.decision === "REQUIRE_OTP"
          ? "ACTION_CRITICAL_STEP_UP_REQUIRED"
          : "ACTION_CRITICAL_BLOCKED"
      : result.decision === "ALLOW"
        ? "LOGIN_OK"
        : result.decision === "REQUIRE_OTP"
          ? "LOGIN_STEP_UP_REQUIRED"
          : "LOGIN_BLOCKED";
    const blockedDecision = isBlockedDecision(result.decision);

    await insertAuthEvent({
      tenantId,
      userId: authContext.user.id,
      sessionId: result.session_id,
      terminalId: null,
      deviceId: result.device_id,
      eventType: authEventType,
      result: blockedDecision ? "error" : "success",
      ip,
      userAgent,
      errorCode: result.error_code || null,
    });

    const auditPayloadAfter = {
      context: buildMaskedRequestContext({ ip, userAgent, geoCountry }),
      decision: {
        risk_level: result.risk_level,
        decision: result.decision,
        reason_codes: result.reason_codes,
        error_code: result.error_code,
        blocked_until: result.blocked_until,
      },
      audit_payload: result.audit_payload,
      metrics: {
        login_success_rate_event: result.decision === "ALLOW" ? 1 : 0,
        suspicious_activity_flags:
          blockedDecision || result.risk_level === "HIGH" ? 1 : 0,
        concurrent_sessions_usage:
          result.audit_payload?.signals?.active_sessions || null,
      },
    };

    await insertAuditLog({
      tenantId,
      actorId: authContext.user.id,
      sessionId: result.session_id,
      deviceId: result.device_id,
      eventType: "RISK_EVALUATE",
      resourceName: "auth.risk",
      result: blockedDecision ? "error" : "success",
      errorCode: result.error_code || null,
      criticality: toAuditCriticality(result.risk_level),
      ip,
      userAgent,
      payloadBefore: null,
      payloadAfter: auditPayloadAfter,
      includeAiSummary: false,
    });

    const responsePayload = {
      risk_level: result.risk_level,
      decision: result.decision,
      reason_codes: result.reason_codes,
      user_message: result.user_message,
      error_code: result.error_code,
      blocked_until: result.blocked_until,
      challenge_id: result.challenge?.challengeId || null,
      challenge_expires_at: result.challenge?.expiresAt || null,
      challenge_delivery_hint: result.challenge?.deliveryHint || null,
      challenge_delivery_status: result.challenge?.deliveryStatus || null,
      debug_otp: result.challenge?.debugCode || undefined,
      session_id: result.session_id,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.post("/step-up/verify-otp", async (req, res) => {
  try {
    const accessToken = getBearerToken(req);
    const authContext = await resolveAuthContext(accessToken);

    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", {
        error_type: "auth",
      });
    }

    const { tenantId, errorCode: tenantError } = resolveTenantOrError(
      authContext.profile,
      req.body?.tenant_id
    );

    if (tenantError) {
      return sendError(res, 409, tenantError, {
        error_type: "tenant",
      });
    }
    if (!ensureTenantScopeOrReply(res, tenantId, "auth.step-up.verify")) return;

    const challengeId = String(req.body?.challenge_id || "").trim();
    const otpCode = String(req.body?.code || "").trim();

    if (!challengeId || !otpCode) {
      return sendError(res, 400, "IAM-001", {
        error_type: "validation",
      });
    }

    const ip = getClientIp(req);
    const userAgent = sanitizeUserAgent(req.headers["user-agent"]);

    const verified = await verifyOtpChallenge({
      challengeId,
      tenantId,
      userId: authContext.user.id,
      otpCode,
    });

    if (!verified.ok) {
      await insertAuthEvent({
        tenantId,
        userId: authContext.user.id,
        eventType: "MFA_STEP_UP_FAIL",
        result: "error",
        ip,
        userAgent,
        errorCode: verified.reason,
      });

      await insertAuditLog({
        tenantId,
        actorId: authContext.user.id,
        eventType: "MFA_STEP_UP_FAIL",
        resourceName: "auth.mfa",
        result: "error",
        errorCode: verified.reason,
        criticality: "high",
        ip,
        userAgent,
        payloadBefore: null,
        payloadAfter: {
          challenge_id: challengeId,
          context: verified.context || null,
        },
        includeAiSummary: true,
      });

      const explained = explainErrorCode(verified.reason);
      return res.status(403).json({
        ...explained,
      });
    }

    let session = null;
    const context = verified.context || {};
    if (["LOGIN_WEB", "LOGIN_TERMINAL"].includes(context.event_type)) {
      session = await createSessionFromVerifiedChallenge({
        tenantId,
        userId: authContext.user.id,
        challengeContext: context,
        ip,
        userAgent,
      });

      if (session && authContext.user.email) {
        emailService
          .sendAlert({
            to: authContext.user.email,
            title: "Nuevo inicio de sesion detectado",
            message: `Se detecto un inicio de sesion desde un dispositivo o ubicacion no reconocidos.\nFecha: ${new Date().toISOString()}\nIP: ${ip}\nNavegador: ${userAgent}\n\nSi no fuiste tu, cambia tu contrasena de inmediato.`,
            severity: "warning",
          })
          .catch((err) => console.error("[auth.step-up] fallo notificacion de nuevo login", { message: err?.message }));
      }
    }

    await insertAuthEvent({
      tenantId,
      userId: authContext.user.id,
      sessionId: session?.id || null,
      deviceId: context.device_id || null,
      eventType: "MFA_STEP_UP_OK",
      result: "success",
      ip,
      userAgent,
      errorCode: null,
    });

    await insertAuditLog({
      tenantId,
      actorId: authContext.user.id,
      sessionId: session?.id || null,
      deviceId: context.device_id || null,
      eventType: "MFA_STEP_UP_OK",
      resourceName: "auth.mfa",
      result: "success",
      errorCode: null,
      criticality: "medium",
      ip,
      userAgent,
      payloadBefore: null,
      payloadAfter: {
        challenge_id: challengeId,
        already_verified: Boolean(verified.alreadyVerified),
        event_type: context.event_type || null,
        action_name: context.action_name || null,
      },
      includeAiSummary: false,
    });

    return res.status(200).json({
      verified: true,
      next_url: "/studio.html",
      session_id: session?.id || null,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-001");
  }
});

router.post("/step-up/resend-otp", async (req, res) => {
  try {
    const accessToken = getBearerToken(req);
    const authContext = await resolveAuthContext(accessToken);

    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", {
        error_type: "auth",
      });
    }

    const { tenantId, errorCode: tenantError } = resolveTenantOrError(
      authContext.profile,
      req.body?.tenant_id
    );

    if (tenantError) {
      return sendError(res, 409, tenantError, {
        error_type: "tenant",
      });
    }
    if (!ensureTenantScopeOrReply(res, tenantId, "auth.step-up.resend")) return;

    const challengeId = String(req.body?.challenge_id || "").trim();
    if (!challengeId) {
      return sendError(res, 400, "IAM-001", {
        error_type: "validation",
      });
    }

    const ip = getClientIp(req);
    const userAgent = sanitizeUserAgent(req.headers["user-agent"]);

    const resent = await resendOtpChallenge({
      challengeId,
      tenantId,
      userId: authContext.user.id,
      userEmail: authContext.user.email,
    });

    if (!resent.ok) {
      await insertAuthEvent({
        tenantId,
        userId: authContext.user.id,
        eventType: "MFA_STEP_UP_RESEND_FAIL",
        result: "error",
        ip,
        userAgent,
        errorCode: resent.reason || "IAM-004",
      });

      return sendError(res, 503, resent.reason || "IAM-004", {
        error_type: "security",
        message:
          "No se pudo reenviar el codigo OTP. Revisa configuracion de correo o intenta mas tarde.",
      });
    }

    await insertAuthEvent({
      tenantId,
      userId: authContext.user.id,
      eventType: "MFA_STEP_UP_RESEND_OK",
      result: "success",
      ip,
      userAgent,
      errorCode: null,
    });

    return res.status(200).json({
      resent: true,
      challenge_id: resent.challengeId,
      challenge_expires_at: resent.expiresAt,
      challenge_delivery_hint: resent.deliveryHint || null,
      challenge_delivery_status: resent.deliveryStatus || null,
      debug_otp: resent.debugCode || undefined,
      user_message: "Te enviamos un nuevo codigo OTP.",
    });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.post("/terminal-login", async (req, res) => {
  try {
    const body = req.body || {};
    const tenantId = String(body.tenant_id || "").trim();
    const userId = String(body.user_id || "").trim();
    const pin = String(body.pin || "").trim();
    const terminalId = String(body.terminal_id || "").trim();

    if (!tenantId || !userId || !pin || !terminalId) {
      return sendError(res, 400, "IAM-001", {
        error_type: "validation",
      });
    }
    if (!ensureTenantScopeOrReply(res, tenantId, "auth.terminal-login")) return;

    const ip = getClientIp(req);
    const userAgent = sanitizeUserAgent(body.user_agent || req.headers["user-agent"]);

    const { data: terminal, error: terminalError } = await serviceClient
      .from("terminals")
      .select("id, tenant_id, is_active")
      .eq("id", terminalId)
      .eq("tenant_id", assertTenantScope(tenantId, "auth.terminal-login.terminals"))
      .single();

    if (terminalError || !terminal || !terminal.is_active) {
      return sendError(res, 403, "IAM-005", {
        error_type: "security",
      });
    }

    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select(
        "id, tenant_id, pin_hash, pin_failed_attempts, pin_blocked_until, risk_blocked_until, is_blocked"
      )
      .eq("id", userId)
      .eq("tenant_id", assertTenantScope(tenantId, "auth.terminal-login.profiles"))
      .single();

    if (profileError || !profile) {
      return sendError(res, 403, "IAM-001", {
        error_type: "auth",
      });
    }

    if (profile.is_blocked) {
      return sendError(res, 403, "IAM-002", {
        error_type: "auth",
      });
    }

    const now = new Date();
    if (profile.pin_blocked_until && new Date(profile.pin_blocked_until) > now) {
      await insertAuthEvent({
        tenantId,
        userId,
        terminalId,
        eventType: "PIN_BLOCKED",
        result: "error",
        ip,
        userAgent,
        errorCode: "IAM-002",
      });

      return sendError(res, 423, "IAM-002", {
        error_type: "security",
        blocked_until: profile.pin_blocked_until,
      });
    }

    const pinOk = await verifyPinHash({
      pin,
      pinHash: profile.pin_hash,
    });

    if (!pinOk) {
      const nextAttempts = Number(profile.pin_failed_attempts || 0) + 1;
      const mustBlock = nextAttempts >= config.maxPinAttempts;
      const blockedUntil = mustBlock
        ? new Date(now.getTime() + config.pinBlockMinutes * 60 * 1000).toISOString()
        : null;

      await serviceClient
        .from("profiles")
        .update({
          pin_failed_attempts: mustBlock ? 0 : nextAttempts,
          pin_last_failed_at: now.toISOString(),
          pin_blocked_until: blockedUntil,
        })
        .eq("id", userId)
        .eq("tenant_id", assertTenantScope(tenantId, "auth.terminal-login.pin-fail-update"));

      await insertAuthEvent({
        tenantId,
        userId,
        terminalId,
        eventType: mustBlock ? "PIN_BLOCKED" : "PIN_FAIL",
        result: "error",
        ip,
        userAgent,
        errorCode: mustBlock ? "IAM-002" : "IAM-001",
      });

      await insertAuditLog({
        tenantId,
        actorId: userId,
        terminalId,
        eventType: mustBlock ? "PIN_BLOCKED" : "PIN_FAIL",
        resourceName: "auth.terminal",
        result: "error",
        errorCode: mustBlock ? "IAM-002" : "IAM-001",
        criticality: "high",
        ip,
        userAgent,
        payloadBefore: null,
        payloadAfter: {
          pin_failure_rate: 1,
          attempts: nextAttempts,
          blocked_until: blockedUntil,
        },
        includeAiSummary: mustBlock,
      });

      return sendError(res, mustBlock ? 423 : 401, mustBlock ? "IAM-002" : "IAM-001", {
        error_type: "auth",
        blocked_until: blockedUntil,
      });
    }

    await serviceClient
      .from("profiles")
      .update({
        pin_failed_attempts: 0,
        pin_last_failed_at: null,
        pin_blocked_until: null,
      })
      .eq("id", userId)
      .eq("tenant_id", assertTenantScope(tenantId, "auth.terminal-login.pin-reset"));

    const riskResult = await evaluateRiskEngine({
      tenantId,
      userId,
      userEmail: null,
      userClient: {
        rpc: async () => ({ data: true, error: null }),
      },
      eventType: "LOGIN_TERMINAL",
      ip,
      userAgent,
      deviceFingerprint: body.device_fingerprint || `terminal-${terminalId}`,
      timestamp: new Date().toISOString(),
      geoCountry: getClientCountry(req),
      actionName: null,
      actionCriticality: "LOW",
      requiredPermission: null,
      sedeId: null,
      overrideAuthorized: false,
      profile,
    });

    if (riskResult.decision !== "ALLOW") {
      await insertAuthEvent({
        tenantId,
        userId,
        terminalId,
        eventType: "TERMINAL_LOGIN_BLOCKED",
        result: "error",
        ip,
        userAgent,
        errorCode: riskResult.error_code || "IAM-002",
      });

      return res.status(403).json({
        ...explainErrorCode(riskResult.error_code || "IAM-002"),
        risk_level: riskResult.risk_level,
        reason_codes: riskResult.reason_codes,
        blocked_until: riskResult.blocked_until,
      });
    }

    if (riskResult.session_id) {
      await applyTenantScope(
        serviceClient
          .from("sessions")
          .update({
            terminal_id: terminalId,
          })
          .eq("id", riskResult.session_id),
        tenantId,
        "tenant_id",
        "auth.terminal-login.sessions"
      );
    }

    await insertAuthEvent({
      tenantId,
      userId,
      sessionId: riskResult.session_id,
      terminalId,
      deviceId: riskResult.device_id,
      eventType: "PIN_OK",
      result: "success",
      ip,
      userAgent,
      errorCode: null,
    });

    await insertAuditLog({
      tenantId,
      actorId: userId,
      sessionId: riskResult.session_id,
      terminalId,
      deviceId: riskResult.device_id,
      eventType: "TERMINAL_LOGIN_OK",
      resourceName: "auth.terminal",
      result: "success",
      errorCode: null,
      criticality: "medium",
      ip,
      userAgent,
      payloadBefore: null,
      payloadAfter: {
        session_id: riskResult.session_id,
        metrics: {
          PIN_failure_rate: 0,
        },
      },
      includeAiSummary: false,
    });

    return res.status(200).json({
      login: "ok",
      session_id: riskResult.session_id,
      risk_level: riskResult.risk_level,
      decision: riskResult.decision,
      user_message: "Sesion terminal iniciada correctamente.",
    });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-001");
  }
});

export default router;
