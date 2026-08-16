import { config } from "../config.js";
import { serviceClient } from "../supabase.js";
import { sendStepUpOtp } from "../core/services/otp-mailer.js";
import { applyTenantScope, assertTenantScope } from "../utils/tenant-scope.js";
import {
  generateOtpCode,
  hashOtp,
  maskEmail,
  maskIp,
  nowIso,
  safeCompare,
} from "../utils/security.js";

const hasRequiredPermission = async ({
  userClient,
  tenantId,
  userId,
  requiredPermission,
  sedeId,
}) => {
  if (!requiredPermission) return true;
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.hasRequiredPermission");

  if (userClient?.rpc) {
    const { data, error } = await userClient.rpc("fn_has_permission", {
      p_permission: requiredPermission,
      p_sede_id: sedeId || null,
    });

    if (!error) {
      return Boolean(data);
    }
  }

  const ursQuery = applyTenantScope(
    serviceClient.from("user_roles_sedes").select("role_id").eq("user_id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.hasRequiredPermission.user_roles_sedes"
  );

  if (sedeId) {
    ursQuery.eq("sede_id", sedeId);
  }

  const { data: userRoles, error: rolesError } = await ursQuery;
  if (rolesError || !Array.isArray(userRoles) || userRoles.length === 0) {
    return false;
  }

  const roleIds = [...new Set(userRoles.map((row) => row.role_id).filter(Boolean))];
  if (!roleIds.length) return false;

  const { count, error: permissionError } = await serviceClient
    .from("role_permissions")
    .select("role_id", { count: "exact", head: true })
    .in("role_id", roleIds)
    .eq("permission", requiredPermission);

  if (permissionError) return false;
  return Number(count || 0) > 0;
};

const createSessionRecord = async ({
  tenantId,
  userId,
  terminalId,
  deviceId,
  sessionType,
  ip,
  userAgent,
}) => {
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.createSessionRecord");
  const expiresAt = new Date();
  expiresAt.setUTCHours(expiresAt.getUTCHours() + config.sessionTtlHours);

  const { data, error } = await serviceClient
    .from("sessions")
    .insert({
      tenant_id: scopedTenantId,
      user_id: userId,
      terminal_id: terminalId || null,
      device_id: deviceId || null,
      session_type: sessionType,
      ip: ip || null,
      user_agent: userAgent || null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) return null;
  return data;
};

const upsertDevice = async ({
  tenantId,
  userId,
  deviceFingerprint,
  ip,
  userAgent,
  trustDevice,
}) => {
  if (!deviceFingerprint) return null;
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.upsertDevice");

  const payload = {
    tenant_id: scopedTenantId,
    user_id: userId,
    device_fingerprint: deviceFingerprint,
    device_type: "web",
    is_trusted: Boolean(trustDevice),
    last_ip: ip || null,
    last_user_agent: userAgent || null,
    last_seen_at: nowIso(),
  };

  const { data, error } = await serviceClient
    .from("devices")
    .upsert(payload, { onConflict: "tenant_id,device_fingerprint" })
    .select("id")
    .single();

  if (error) return null;
  return data;
};

const loadDeviceContext = async ({ tenantId, userId, ip, deviceFingerprint }) => {
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.loadDeviceContext");
  const [knownDeviceRes, knownIpRes] = await Promise.all([
    deviceFingerprint
      ? applyTenantScope(
          serviceClient
            .from("devices")
            .select("id")
            .eq("user_id", userId)
            .eq("device_fingerprint", deviceFingerprint),
          scopedTenantId,
          "tenant_id",
          "risk-engine.loadDeviceContext.knownDevice"
        ).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    ip
      ? applyTenantScope(
          serviceClient.from("devices").select("id").eq("user_id", userId).eq("last_ip", ip),
          scopedTenantId,
          "tenant_id",
          "risk-engine.loadDeviceContext.knownIp"
        ).limit(1)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    knownDevice: Boolean(knownDeviceRes?.data?.id),
    knownIp: Array.isArray(knownIpRes?.data) ? knownIpRes.data.length > 0 : false,
  };
};

const createOtpChallenge = async ({
  tenantId,
  userId,
  context,
  email,
}) => {
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.createOtpChallenge");
  const otpCode = generateOtpCode();
  const codeHash = hashOtp({
    code: otpCode,
    userId,
    tenantId: scopedTenantId,
  });

  const expiresAt = new Date();
  expiresAt.setUTCMinutes(expiresAt.getUTCMinutes() + config.otpTtlMinutes);

  const { data, error } = await serviceClient
    .from("mfa_challenges")
    .insert({
      tenant_id: scopedTenantId,
      user_id: userId,
      channel: "email_otp",
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
      risk_level: "MEDIUM",
      context,
    })
    .select("id, expires_at")
    .single();

  if (error || !data) {
    return null;
  }

  const delivery = await sendStepUpOtp({
    toEmail: email,
    otpCode,
    ttlMinutes: config.otpTtlMinutes,
  });

  await applyTenantScope(
    serviceClient
      .from("mfa_challenges")
      .update({
        context: {
          ...(context || {}),
          delivery: {
            ok: Boolean(delivery?.ok),
            provider: delivery?.provider || "none",
            reason: delivery?.reason || null,
            status: delivery?.status || null,
            message_id: delivery?.messageId || null,
            attempted_at: nowIso(),
          },
        },
      })
      .eq("id", data.id)
      .eq("user_id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.createOtpChallenge.delivery-update"
  );

  return {
    challengeId: data.id,
    expiresAt: data.expires_at,
    deliveryHint: maskEmail(email),
    debugCode: config.exposeDebugOtp ? otpCode : null,
    deliveryStatus: delivery?.ok
      ? "sent"
      : config.exposeDebugOtp
        ? "debug"
        : "failed",
    deliveryReason: delivery?.reason || null,
  };
};

export const resendOtpChallenge = async ({
  challengeId,
  tenantId,
  userId,
  userEmail,
}) => {
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.resendOtpChallenge");
  const { data: challenge, error: challengeError } = await applyTenantScope(
    serviceClient
      .from("mfa_challenges")
      .select("id, context, verified_at")
      .eq("id", challengeId)
      .eq("user_id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.resendOtpChallenge.select"
  ).single();

  if (challengeError || !challenge) {
    return { ok: false, reason: "IAM-001" };
  }

  if (challenge.verified_at) {
    return { ok: false, reason: "IAM-001" };
  }

  const otpCode = generateOtpCode();
  const codeHash = hashOtp({
    code: otpCode,
    userId,
    tenantId: scopedTenantId,
  });

  const expiresAt = new Date();
  expiresAt.setUTCMinutes(expiresAt.getUTCMinutes() + config.otpTtlMinutes);

  const { data: updated, error: updateError } = await applyTenantScope(
    serviceClient
      .from("mfa_challenges")
      .update({
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        verified_at: null,
      })
      .eq("id", challengeId)
      .eq("user_id", userId)
      .select("id, expires_at"),
    scopedTenantId,
    "tenant_id",
    "risk-engine.resendOtpChallenge.update"
  ).single();

  if (updateError || !updated) {
    return { ok: false, reason: "IAM-004" };
  }

  const delivery = await sendStepUpOtp({
    toEmail: userEmail,
    otpCode,
    ttlMinutes: config.otpTtlMinutes,
  });

  await applyTenantScope(
    serviceClient
      .from("mfa_challenges")
      .update({
        context: {
          ...(challenge.context || {}),
          delivery: {
            ok: Boolean(delivery?.ok),
            provider: delivery?.provider || "none",
            reason: delivery?.reason || null,
            status: delivery?.status || null,
            message_id: delivery?.messageId || null,
            attempted_at: nowIso(),
            resent: true,
          },
        },
      })
      .eq("id", challengeId)
      .eq("user_id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.resendOtpChallenge.delivery-update"
  );

  return {
    ok: delivery?.ok || config.exposeDebugOtp,
    reason: delivery?.ok || config.exposeDebugOtp ? null : "IAM-004",
    challengeId: updated.id,
    expiresAt: updated.expires_at,
    deliveryHint: maskEmail(userEmail),
    debugCode: config.exposeDebugOtp ? otpCode : null,
    deliveryStatus: delivery?.ok
      ? "sent"
      : config.exposeDebugOtp
        ? "debug"
        : "failed",
  };
};

const buildTempBlockResult = ({ reasonCode, userMessage, blockedUntil, auditPayload }) => ({
  risk_level: "HIGH",
  decision: "TEMP_BLOCK",
  reason_codes: [reasonCode],
  user_message: userMessage,
  error_code: "IAM-002",
  blocked_until: blockedUntil || null,
  challenge: null,
  session_id: null,
  device_id: null,
  audit_payload: auditPayload || {},
});

const persistRiskBlock = async ({ tenantId, userId, untilIso }) => {
  if (!untilIso) return;
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.persistRiskBlock");

  await applyTenantScope(
    serviceClient
      .from("profiles")
      .update({
        risk_blocked_until: untilIso,
        pin_blocked_until: untilIso,
      })
      .eq("id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.persistRiskBlock.profiles"
  );
};

export const verifyOtpChallenge = async ({
  challengeId,
  tenantId,
  userId,
  otpCode,
}) => {
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.verifyOtpChallenge");
  const { data, error } = await applyTenantScope(
    serviceClient
      .from("mfa_challenges")
      .select("id, code_hash, expires_at, verified_at, context")
      .eq("id", challengeId)
      .eq("user_id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.verifyOtpChallenge.select"
  ).single();

  if (error || !data) {
    return { ok: false, reason: "IAM-001" };
  }

  if (data.verified_at) {
    return { ok: true, alreadyVerified: true, context: data.context || {} };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { ok: false, reason: "IAM-004", context: data.context || {} };
  }

  const inputHash = hashOtp({
    code: otpCode,
    userId,
    tenantId: scopedTenantId,
  });

  if (!safeCompare(inputHash, data.code_hash)) {
    return { ok: false, reason: "IAM-001", context: data.context || {} };
  }

  await applyTenantScope(
    serviceClient
      .from("mfa_challenges")
      .update({ verified_at: nowIso() })
      .eq("id", challengeId)
      .eq("user_id", userId),
    scopedTenantId,
    "tenant_id",
    "risk-engine.verifyOtpChallenge.update"
  );

  return { ok: true, context: data.context || {} };
};

export const evaluateRiskEngine = async ({
  tenantId,
  userId,
  userEmail,
  userClient,
  eventType,
  ip,
  userAgent,
  deviceFingerprint,
  timestamp,
  geoCountry,
  actionName,
  actionCriticality,
  requiredPermission,
  sedeId,
  profile,
}) => {
  const scopedTenantId = assertTenantScope(tenantId, "risk-engine.evaluateRiskEngine");
  const normalizedEventType = String(eventType || "LOGIN_WEB").toUpperCase();
  const utcTimestamp = timestamp || nowIso();
  const normalizedPermission = String(requiredPermission || "").trim();

  if (profile?.is_blocked) {
    return buildTempBlockResult({
      reasonCode: "ACCOUNT_BLOCKED",
      userMessage: "Tu cuenta se encuentra bloqueada por un administrador.",
      blockedUntil: profile?.risk_blocked_until || profile?.pin_blocked_until || null,
      auditPayload: {
        rule: "ACCOUNT_BLOCKED",
      },
    });
  }

  if (profile?.pin_blocked_until && new Date(profile.pin_blocked_until) > new Date()) {
    return buildTempBlockResult({
      reasonCode: "PIN_TEMP_BLOCK_ACTIVE",
      userMessage: "Tu acceso esta bloqueado temporalmente por intentos fallidos de PIN.",
      blockedUntil: profile.pin_blocked_until,
      auditPayload: {
        rule: "PIN_TEMP_BLOCK_ACTIVE",
      },
    });
  }

  if (profile?.risk_blocked_until && new Date(profile.risk_blocked_until) > new Date()) {
    return buildTempBlockResult({
      reasonCode: "RISK_TEMP_BLOCK_ACTIVE",
      userMessage: "Tu acceso sigue temporalmente bloqueado por seguridad.",
      blockedUntil: profile.risk_blocked_until,
      auditPayload: {
        rule: "RISK_TEMP_BLOCK_ACTIVE",
      },
    });
  }

  const pinFailedAttempts = Number(profile?.pin_failed_attempts || 0);
  if (pinFailedAttempts >= config.maxPinAttempts) {
    const blockedUntil = profile?.pin_blocked_until || new Date(Date.now() + config.pinBlockMinutes * 60 * 1000).toISOString();

    await persistRiskBlock({
      tenantId: scopedTenantId,
      userId,
      untilIso: blockedUntil,
    });

    return buildTempBlockResult({
      reasonCode: "PIN_ATTEMPTS_EXCEEDED",
      userMessage: "Demasiados intentos fallidos. Acceso bloqueado temporalmente.",
      blockedUntil,
      auditPayload: {
        rule: "PIN_ATTEMPTS_EXCEEDED",
        pin_failed_attempts: pinFailedAttempts,
      },
    });
  }

  if (normalizedPermission) {
    const allowedByPermission = await hasRequiredPermission({
      userClient,
      tenantId: scopedTenantId,
      userId,
      requiredPermission: normalizedPermission,
      sedeId: sedeId || null,
    });

    if (!allowedByPermission) {
      return {
        risk_level: "HIGH",
        decision: "DENY",
        reason_codes: ["MISSING_REQUIRED_PERMISSION"],
        user_message: "No tienes permisos suficientes para esta accion.",
        error_code: "IAM-003",
        blocked_until: null,
        challenge: null,
        session_id: null,
        device_id: null,
        audit_payload: {
          inputs: {
            tipo_evento: normalizedEventType,
            tenant_id: scopedTenantId,
            user_id: userId,
            timestamp: utcTimestamp,
            device_fingerprint: deviceFingerprint || null,
            ip_masked: maskIp(ip),
            geo_country: geoCountry || null,
            action_name: actionName || null,
            action_criticality: actionCriticality || null,
            required_permission: normalizedPermission,
            sede_id: sedeId || null,
          },
          signals: {
            has_required_permission: false,
          },
          output: {
            risk_level: "HIGH",
            decision: "DENY",
            reason_codes: ["MISSING_REQUIRED_PERMISSION"],
          },
        },
      };
    }
  }

  const deviceContext = await loadDeviceContext({
    tenantId: scopedTenantId,
    userId,
    ip,
    deviceFingerprint,
  });

  const isNewDevice = !deviceContext.knownDevice;
  const isNewIp = !deviceContext.knownIp;

  if (isNewDevice || isNewIp) {
    const device = await upsertDevice({
      tenantId: scopedTenantId,
      userId,
      deviceFingerprint,
      ip,
      userAgent,
      trustDevice: false,
    });

    const challenge = await createOtpChallenge({
      tenantId: scopedTenantId,
      userId,
      email: userEmail,
      context: {
        event_type: normalizedEventType,
        device_id: device?.id || null,
        device_fingerprint: deviceFingerprint || null,
        ip: ip || null,
        user_agent: userAgent || null,
        geo_country: geoCountry || null,
      },
    });

    const reasonCodes = [];
    if (isNewDevice) reasonCodes.push("NEW_DEVICE");
    if (isNewIp) reasonCodes.push("NEW_IP");

    if (!challenge) {
      return {
        risk_level: "HIGH",
        decision: "TEMP_BLOCK",
        reason_codes: ["MFA_CHALLENGE_CREATE_FAILED"],
        user_message:
          "No se pudo iniciar el desafio OTP. Intenta nuevamente en unos minutos.",
        error_code: "IAM-004",
        blocked_until: null,
        challenge: null,
        session_id: null,
        device_id: device?.id || null,
        audit_payload: {
          inputs: {
            tipo_evento: normalizedEventType,
            tenant_id: scopedTenantId,
            user_id: userId,
            timestamp: utcTimestamp,
            device_fingerprint: deviceFingerprint || null,
            ip_masked: maskIp(ip),
            geo_country: geoCountry || null,
          },
          signals: {
            new_device: isNewDevice,
            new_ip: isNewIp,
            pin_failed_attempts: pinFailedAttempts,
          },
          output: {
            risk_level: "HIGH",
            decision: "TEMP_BLOCK",
            reason_codes: ["MFA_CHALLENGE_CREATE_FAILED"],
          },
        },
      };
    }

    if (challenge.deliveryStatus === "failed") {
      return {
        risk_level: "HIGH",
        decision: "TEMP_BLOCK",
        reason_codes: ["MFA_DELIVERY_FAILED"],
        user_message:
          "No se pudo enviar el codigo OTP. Intenta nuevamente o contacta soporte.",
        error_code: "IAM-004",
        blocked_until: null,
        challenge: null,
        session_id: null,
        device_id: device?.id || null,
        audit_payload: {
          inputs: {
            tipo_evento: normalizedEventType,
            tenant_id: scopedTenantId,
            user_id: userId,
            timestamp: utcTimestamp,
            device_fingerprint: deviceFingerprint || null,
            ip_masked: maskIp(ip),
            geo_country: geoCountry || null,
          },
          signals: {
            new_device: isNewDevice,
            new_ip: isNewIp,
            pin_failed_attempts: pinFailedAttempts,
            mfa_delivery_failed: true,
            mfa_delivery_reason: challenge.deliveryReason || null,
          },
          output: {
            risk_level: "HIGH",
            decision: "TEMP_BLOCK",
            reason_codes: ["MFA_DELIVERY_FAILED"],
          },
        },
      };
    }

    return {
      risk_level: "MEDIUM",
      decision: "REQUIRE_OTP",
      reason_codes: reasonCodes,
      user_message: "Detectamos un acceso desde un entorno nuevo. Verifica con OTP para continuar.",
      error_code: "IAM-005",
      blocked_until: null,
      challenge,
      session_id: null,
      device_id: device?.id || null,
      audit_payload: {
        inputs: {
          tipo_evento: normalizedEventType,
          tenant_id: scopedTenantId,
          user_id: userId,
          timestamp: utcTimestamp,
          device_fingerprint: deviceFingerprint || null,
          ip_masked: maskIp(ip),
          geo_country: geoCountry || null,
        },
        signals: {
          new_device: isNewDevice,
          new_ip: isNewIp,
          pin_failed_attempts: pinFailedAttempts,
        },
        output: {
          risk_level: "MEDIUM",
          decision: "REQUIRE_OTP",
          reason_codes: reasonCodes,
        },
      },
    };
  }

  const trustedDevice = await upsertDevice({
    tenantId: scopedTenantId,
    userId,
    deviceFingerprint,
    ip,
    userAgent,
    trustDevice: true,
  });

  let session = null;
  if (["LOGIN_WEB", "LOGIN_TERMINAL"].includes(normalizedEventType)) {
    session = await createSessionRecord({
      tenantId: scopedTenantId,
      userId,
      terminalId: null,
      deviceId: trustedDevice?.id || null,
      sessionType: normalizedEventType === "LOGIN_TERMINAL" ? "terminal" : "web",
      ip,
      userAgent,
    });
  }

  return {
    risk_level: "LOW",
    decision: "ALLOW",
    reason_codes: ["KNOWN_DEVICE_AND_IP"],
    user_message: "Acceso validado correctamente.",
    error_code: null,
    blocked_until: null,
    challenge: null,
    session_id: session?.id || null,
    device_id: trustedDevice?.id || null,
    audit_payload: {
      inputs: {
        tipo_evento: normalizedEventType,
        tenant_id: scopedTenantId,
        user_id: userId,
        timestamp: utcTimestamp,
        device_fingerprint: deviceFingerprint || null,
        ip_masked: maskIp(ip),
        geo_country: geoCountry || null,
      },
      signals: {
        new_device: false,
        new_ip: false,
        pin_failed_attempts: pinFailedAttempts,
      },
      output: {
        risk_level: "LOW",
        decision: "ALLOW",
        reason_codes: ["KNOWN_DEVICE_AND_IP"],
      },
    },
  };
};

export const createSessionFromVerifiedChallenge = async ({
  tenantId,
  userId,
  challengeContext,
  ip,
  userAgent,
}) => {
  const deviceId = challengeContext?.device_id || null;
  return createSessionRecord({
    tenantId,
    userId,
    terminalId: challengeContext?.terminal_id || null,
    deviceId,
    sessionType:
      challengeContext?.event_type === "LOGIN_TERMINAL" ? "terminal" : "web",
    ip,
    userAgent,
  });
};
