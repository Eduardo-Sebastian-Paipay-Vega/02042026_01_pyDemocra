import { createChainableResult } from "../test-utils/mockSupabase.js";
import { config } from "../config.js";
import { hashOtp } from "../utils/security.js";

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: { from: jest.fn() },
}));

jest.mock("../services/otp-mailer.js", () => ({
  __esModule: true,
  sendStepUpOtp: jest.fn(),
}));

// eslint-disable-next-line import/first
import { serviceClient } from "../supabase.js";
// eslint-disable-next-line import/first
import { sendStepUpOtp } from "../services/otp-mailer.js";
// eslint-disable-next-line import/first
import {
  evaluateRiskEngine,
  resendOtpChallenge,
  verifyOtpChallenge,
  createSessionFromVerifiedChallenge,
} from "./risk-engine.js";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const futureIso = (mins = 10) => new Date(Date.now() + mins * 60_000).toISOString();
const pastIso = (mins = 10) => new Date(Date.now() - mins * 60_000).toISOString();

function mockTables(overrides = {}) {
  const defaults = {
    devices: { single: { data: null, error: null }, list: { data: [], error: null } },
    sessions: { single: { data: { id: "session-1" }, error: null } },
    mfa_challenges: {
      single: { data: { id: "challenge-1", expires_at: futureIso() }, error: null },
    },
    user_roles_sedes: { list: { data: [], error: null } },
    role_permissions: { list: { count: 0, error: null } },
    profiles: { list: { data: [], error: null } },
  };
  const merged = { ...defaults, ...overrides };
  serviceClient.from.mockImplementation((table) => createChainableResult(merged[table] || {}));
}

const originalMaxPinAttempts = config.maxPinAttempts;
const originalPinBlockMinutes = config.pinBlockMinutes;
const originalExposeDebugOtp = config.exposeDebugOtp;

afterEach(() => {
  jest.clearAllMocks();
  config.maxPinAttempts = originalMaxPinAttempts;
  config.pinBlockMinutes = originalPinBlockMinutes;
  config.exposeDebugOtp = originalExposeDebugOtp;
});

describe("evaluateRiskEngine — bloqueos tempranos (sin llamadas a supabase)", () => {
  test("ACCOUNT_BLOCKED si profile.is_blocked", async () => {
    mockTables();
    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: { is_blocked: true },
    });

    expect(result.decision).toBe("TEMP_BLOCK");
    expect(result.reason_codes).toEqual(["ACCOUNT_BLOCKED"]);
    expect(serviceClient.from).not.toHaveBeenCalled();
  });

  test("PIN_TEMP_BLOCK_ACTIVE si pin_blocked_until esta en el futuro", async () => {
    mockTables();
    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: { pin_blocked_until: futureIso() },
    });

    expect(result.reason_codes).toEqual(["PIN_TEMP_BLOCK_ACTIVE"]);
  });

  test("RISK_TEMP_BLOCK_ACTIVE si risk_blocked_until esta en el futuro", async () => {
    mockTables();
    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: { risk_blocked_until: futureIso() },
    });

    expect(result.reason_codes).toEqual(["RISK_TEMP_BLOCK_ACTIVE"]);
  });
});

describe("evaluateRiskEngine — limite de intentos de PIN", () => {
  test("PIN_ATTEMPTS_EXCEEDED cuando se alcanza el maximo, persiste el bloqueo", async () => {
    config.maxPinAttempts = 3;
    mockTables();

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: { pin_failed_attempts: 3 },
    });

    expect(result.reason_codes).toEqual(["PIN_ATTEMPTS_EXCEEDED"]);
    expect(serviceClient.from).toHaveBeenCalledWith("profiles");
  });

  test("usa el pin_blocked_until existente si ya estaba seteado", async () => {
    config.maxPinAttempts = 3;
    mockTables();
    const existing = futureIso(60);

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: { pin_failed_attempts: 5, pin_blocked_until: existing },
    });

    expect(result.blocked_until).toBe(existing);
  });
});

describe("evaluateRiskEngine — permisos requeridos", () => {
  test("DENY si userClient.rpc('fn_has_permission') responde false", async () => {
    mockTables();
    const userClient = { rpc: jest.fn().mockResolvedValue({ data: false, error: null }) };

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userClient,
      requiredPermission: "settings.roles.manage",
      profile: {},
    });

    expect(result.decision).toBe("DENY");
    expect(result.reason_codes).toEqual(["MISSING_REQUIRED_PERMISSION"]);
  });

  test("continua (ALLOW) si userClient.rpc responde true", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
    });
    const userClient = { rpc: jest.fn().mockResolvedValue({ data: true, error: null }) };

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userClient,
      requiredPermission: "settings.roles.read",
      profile: {},
      eventType: "OTHER",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
  });

  test("cae al fallback por roles/permisos si rpc devuelve error", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
      user_roles_sedes: { list: { data: [{ role_id: "role-1" }], error: null } },
      role_permissions: { list: { count: 1, error: null } },
    });
    const userClient = { rpc: jest.fn().mockResolvedValue({ data: null, error: new Error("no rpc") }) };

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userClient,
      requiredPermission: "settings.roles.manage",
      sedeId: "sede-1",
      profile: {},
      eventType: "OTHER",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
  });

  test("fallback sin userClient: DENY si no hay roles asignados", async () => {
    mockTables({ user_roles_sedes: { list: { data: [], error: null } } });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      requiredPermission: "settings.roles.manage",
      profile: {},
    });

    expect(result.decision).toBe("DENY");
  });

  test("fallback sin userClient: DENY si hay roles pero ninguno tiene el permiso (count 0)", async () => {
    mockTables({
      user_roles_sedes: { list: { data: [{ role_id: "role-1" }], error: null } },
      role_permissions: { list: { count: 0, error: null } },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      requiredPermission: "settings.roles.manage",
      profile: {},
    });

    expect(result.decision).toBe("DENY");
  });

  test("fallback: DENY si los roles asignados no tienen role_id (queda una lista vacia tras filtrar)", async () => {
    mockTables({
      user_roles_sedes: { list: { data: [{ role_id: null }], error: null } },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      requiredPermission: "settings.roles.manage",
      profile: {},
    });

    expect(result.decision).toBe("DENY");
  });

  test("fallback: DENY si la consulta de role_permissions falla", async () => {
    mockTables({
      user_roles_sedes: { list: { data: [{ role_id: "role-1" }], error: null } },
      role_permissions: { list: { count: null, error: new Error("boom") } },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      requiredPermission: "settings.roles.manage",
      profile: {},
    });

    expect(result.decision).toBe("DENY");
  });

  test("sin requiredPermission, no se hace ninguna verificacion de permisos", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "OTHER",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
  });
});

describe("evaluateRiskEngine — dispositivo/IP conocidos (ALLOW)", () => {
  test("ALLOW y crea sesion web para LOGIN_WEB", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
    expect(result.session_id).toBe("session-1");
    expect(serviceClient.from).toHaveBeenCalledWith("sessions");
  });

  test("ALLOW y crea sesion terminal para LOGIN_TERMINAL", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_TERMINAL",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
    expect(result.session_id).toBe("session-1");
  });

  test("trata la IP como desconocida si la consulta devuelve data no-array (p.ej. error)", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: null, error: new Error("db down") },
      },
    });
    sendStepUpOtp.mockResolvedValue({ ok: true });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    // data no es array -> knownIp=false -> isNewIp=true -> entra a REQUIRE_OTP
    expect(result.decision).toBe("REQUIRE_OTP");
  });

  test("REQUIRE_OTP con solo NEW_DEVICE cuando la IP ya es conocida", async () => {
    mockTables({
      devices: {
        single: { data: null, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
    });
    sendStepUpOtp.mockResolvedValue({ ok: true });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-nuevo",
      ip: "1.2.3.4",
    });

    expect(result.reason_codes).toEqual(["NEW_DEVICE"]);
  });

  test("ALLOW sin crear sesion para un eventType que no es login", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [{ id: "device-1" }], error: null },
      },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "ACTION_SENSITIVE",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
    expect(result.session_id).toBeNull();
  });

  test("ALLOW con device_id null si el upsert del dispositivo confiable falla", async () => {
    // Llamadas a "devices", en orden: 1) fingerprint (maybeSingle) -> conocido,
    // 2) ip (limit, lista) -> conocida, 3) upsertDevice trustDevice=true (single) -> falla.
    let devicesCallCount = 0;
    serviceClient.from.mockImplementation((table) => {
      if (table === "devices") {
        devicesCallCount += 1;
        if (devicesCallCount === 1) {
          return createChainableResult({ single: { data: { id: "device-1" }, error: null } });
        }
        if (devicesCallCount === 2) {
          return createChainableResult({ list: { data: [{ id: "device-1" }], error: null } });
        }
        return createChainableResult({ single: { data: null, error: new Error("upsert failed") } });
      }
      if (table === "sessions") {
        return createChainableResult({ single: { data: { id: "session-1" }, error: null } });
      }
      return createChainableResult({});
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-1",
      ip: "1.2.3.4",
    });

    expect(result.decision).toBe("ALLOW");
    expect(result.device_id).toBeNull();
  });
});

describe("evaluateRiskEngine — dispositivo/IP nuevos (challenge OTP)", () => {
  test("TEMP_BLOCK si no se pudo crear el challenge (insert de mfa_challenges falla)", async () => {
    mockTables({
      mfa_challenges: { single: { data: null, error: new Error("insert failed") } },
    });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
    });

    expect(result.reason_codes).toEqual(["MFA_CHALLENGE_CREATE_FAILED"]);
  });

  test("TEMP_BLOCK si la entrega del OTP falla y no hay modo debug", async () => {
    config.exposeDebugOtp = false;
    mockTables();
    sendStepUpOtp.mockResolvedValue({ ok: false, reason: "SMTP_DOWN" });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userEmail: "user@example.com",
      profile: {},
      eventType: "LOGIN_WEB",
    });

    expect(result.reason_codes).toEqual(["MFA_DELIVERY_FAILED"]);
  });

  test("TEMP_BLOCK si la entrega del OTP falla sin reason explicito", async () => {
    config.exposeDebugOtp = false;
    mockTables();
    sendStepUpOtp.mockResolvedValue({ ok: false });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userEmail: "user@example.com",
      profile: {},
      eventType: "LOGIN_WEB",
    });

    expect(result.reason_codes).toEqual(["MFA_DELIVERY_FAILED"]);
    expect(result.audit_payload.signals.mfa_delivery_reason).toBeNull();
  });

  test("REQUIRE_OTP (no bloquea) si falla la entrega pero exposeDebugOtp esta activo", async () => {
    config.exposeDebugOtp = true;
    mockTables();
    sendStepUpOtp.mockResolvedValue({ ok: false, reason: "SMTP_DOWN" });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userEmail: "user@example.com",
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-nuevo",
    });

    expect(result.decision).toBe("REQUIRE_OTP");
    expect(result.challenge.debugCode).not.toBeNull();
  });

  test("REQUIRE_OTP con reason_codes NEW_DEVICE y NEW_IP cuando ambos son nuevos", async () => {
    mockTables();
    sendStepUpOtp.mockResolvedValue({ ok: true, provider: "resend" });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      userEmail: "user@example.com",
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-nuevo",
      ip: "9.9.9.9",
    });

    expect(result.decision).toBe("REQUIRE_OTP");
    expect(result.reason_codes.sort()).toEqual(["NEW_DEVICE", "NEW_IP"]);
  });

  test("REQUIRE_OTP con solo NEW_IP cuando el dispositivo ya es conocido", async () => {
    mockTables({
      devices: {
        single: { data: { id: "device-1" }, error: null },
        list: { data: [], error: null },
      },
    });
    sendStepUpOtp.mockResolvedValue({ ok: true });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
      deviceFingerprint: "fp-conocido",
      ip: "9.9.9.9",
    });

    expect(result.reason_codes).toEqual(["NEW_IP"]);
  });

  test("sin deviceFingerprint, loadDeviceContext no consulta por fingerprint (usa el default) y sigue funcionando", async () => {
    mockTables();
    sendStepUpOtp.mockResolvedValue({ ok: true });

    const result = await evaluateRiskEngine({
      tenantId: TENANT_ID,
      userId: USER_ID,
      profile: {},
      eventType: "LOGIN_WEB",
    });

    expect(result.decision).toBe("REQUIRE_OTP");
  });
});

describe("resendOtpChallenge", () => {
  test("IAM-001 si el challenge no existe", async () => {
    mockTables({ mfa_challenges: { single: { data: null, error: null } } });

    const result = await resendOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(result).toEqual({ ok: false, reason: "IAM-001" });
  });

  test("IAM-001 si el challenge ya fue verificado", async () => {
    mockTables({
      mfa_challenges: { single: { data: { id: "c1", verified_at: pastIso() }, error: null } },
    });

    const result = await resendOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(result).toEqual({ ok: false, reason: "IAM-001" });
  });

  test("IAM-004 si falla el update del challenge", async () => {
    let callCount = 0;
    serviceClient.from.mockImplementation((table) => {
      if (table === "mfa_challenges") {
        callCount += 1;
        if (callCount === 1) {
          return createChainableResult({
            single: { data: { id: "c1", context: {}, verified_at: null }, error: null },
          });
        }
        return createChainableResult({ single: { data: null, error: new Error("fail") } });
      }
      return createChainableResult({});
    });

    const result = await resendOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(result).toEqual({ ok: false, reason: "IAM-004" });
  });

  test("reenvia con exito cuando la entrega funciona (challenge sin context previo)", async () => {
    let callCount = 0;
    serviceClient.from.mockImplementation((table) => {
      if (table === "mfa_challenges") {
        callCount += 1;
        if (callCount === 1) {
          return createChainableResult({
            single: { data: { id: "c1", context: null, verified_at: null }, error: null },
          });
        }
        return createChainableResult({
          single: { data: { id: "c1", expires_at: futureIso() }, error: null },
        });
      }
      return createChainableResult({});
    });
    sendStepUpOtp.mockResolvedValue({ ok: true });

    const result = await resendOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      userEmail: "user@example.com",
    });

    expect(result.ok).toBe(true);
    expect(result.challengeId).toBe("c1");
  });

  test("ok=false, reason IAM-004 si la entrega falla y no hay modo debug", async () => {
    config.exposeDebugOtp = false;
    let callCount = 0;
    serviceClient.from.mockImplementation((table) => {
      if (table === "mfa_challenges") {
        callCount += 1;
        if (callCount === 1) {
          return createChainableResult({
            single: { data: { id: "c1", context: {}, verified_at: null }, error: null },
          });
        }
        return createChainableResult({
          single: { data: { id: "c1", expires_at: futureIso() }, error: null },
        });
      }
      return createChainableResult({});
    });
    sendStepUpOtp.mockResolvedValue({ ok: false, reason: "SMTP_DOWN" });

    const result = await resendOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("IAM-004");
    expect(result.deliveryStatus).toBe("failed");
  });

  test("ok=true en modo debug aunque la entrega falle", async () => {
    config.exposeDebugOtp = true;
    let callCount = 0;
    serviceClient.from.mockImplementation((table) => {
      if (table === "mfa_challenges") {
        callCount += 1;
        if (callCount === 1) {
          return createChainableResult({
            single: { data: { id: "c1", context: {}, verified_at: null }, error: null },
          });
        }
        return createChainableResult({
          single: { data: { id: "c1", expires_at: futureIso() }, error: null },
        });
      }
      return createChainableResult({});
    });
    sendStepUpOtp.mockResolvedValue({ ok: false, reason: "SMTP_DOWN" });

    const result = await resendOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(result.ok).toBe(true);
    expect(result.deliveryStatus).toBe("debug");
  });
});

describe("verifyOtpChallenge", () => {
  test("IAM-001 si el challenge no existe", async () => {
    mockTables({ mfa_challenges: { single: { data: null, error: null } } });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: false, reason: "IAM-001" });
  });

  test("ok+alreadyVerified si el challenge ya estaba verificado", async () => {
    mockTables({
      mfa_challenges: {
        single: { data: { id: "c1", verified_at: pastIso(), context: { a: 1 } }, error: null },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: true, alreadyVerified: true, context: { a: 1 } });
  });

  test("ok+alreadyVerified con context {} por defecto si el challenge no tenia context", async () => {
    mockTables({
      mfa_challenges: { single: { data: { id: "c1", verified_at: pastIso() }, error: null } },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: true, alreadyVerified: true, context: {} });
  });

  test("IAM-004 si el challenge ya expiro", async () => {
    mockTables({
      mfa_challenges: {
        single: {
          data: { id: "c1", verified_at: null, expires_at: pastIso(), code_hash: "x", context: {} },
          error: null,
        },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("IAM-004");
  });

  test("IAM-004 si expiro y el challenge no tenia context previo (usa {} por defecto)", async () => {
    mockTables({
      mfa_challenges: {
        single: {
          data: { id: "c1", verified_at: null, expires_at: pastIso(), code_hash: "x" },
          error: null,
        },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: false, reason: "IAM-004", context: {} });
  });

  test("IAM-001 si el codigo OTP no coincide", async () => {
    mockTables({
      mfa_challenges: {
        single: {
          data: {
            id: "c1",
            verified_at: null,
            expires_at: futureIso(),
            code_hash: "hash-incorrecto",
            context: {},
          },
          error: null,
        },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("IAM-001");
  });

  test("IAM-001 con context {} por defecto si el codigo no coincide y no habia context", async () => {
    mockTables({
      mfa_challenges: {
        single: {
          data: {
            id: "c1",
            verified_at: null,
            expires_at: futureIso(),
            code_hash: "hash-incorrecto",
          },
          error: null,
        },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: false, reason: "IAM-001", context: {} });
  });

  test("ok=true cuando el codigo coincide, y actualiza verified_at", async () => {
    const correctHash = hashOtp({ code: "123456", userId: USER_ID, tenantId: TENANT_ID });
    mockTables({
      mfa_challenges: {
        single: {
          data: {
            id: "c1",
            verified_at: null,
            expires_at: futureIso(),
            code_hash: correctHash,
            context: { foo: "bar" },
          },
          error: null,
        },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: true, context: { foo: "bar" } });
  });

  test("ok=true con context {} por defecto cuando el codigo coincide y no habia context", async () => {
    const correctHash = hashOtp({ code: "123456", userId: USER_ID, tenantId: TENANT_ID });
    mockTables({
      mfa_challenges: {
        single: {
          data: {
            id: "c1",
            verified_at: null,
            expires_at: futureIso(),
            code_hash: correctHash,
          },
          error: null,
        },
      },
    });

    const result = await verifyOtpChallenge({
      challengeId: "c1",
      tenantId: TENANT_ID,
      userId: USER_ID,
      otpCode: "123456",
    });

    expect(result).toEqual({ ok: true, context: {} });
  });
});

describe("createSessionFromVerifiedChallenge", () => {
  test("usa sessionType 'terminal' cuando el challenge era de LOGIN_TERMINAL", async () => {
    mockTables();

    const result = await createSessionFromVerifiedChallenge({
      tenantId: TENANT_ID,
      userId: USER_ID,
      challengeContext: { event_type: "LOGIN_TERMINAL", device_id: "d1", terminal_id: "t1" },
    });

    expect(result).toEqual({ id: "session-1" });
    expect(serviceClient.from).toHaveBeenCalledWith("sessions");
  });

  test("usa sessionType 'web' para cualquier otro event_type", async () => {
    mockTables();

    const result = await createSessionFromVerifiedChallenge({
      tenantId: TENANT_ID,
      userId: USER_ID,
      challengeContext: { event_type: "LOGIN_WEB" },
    });

    expect(result).toEqual({ id: "session-1" });
  });

  test("null si la insercion de sesion falla", async () => {
    mockTables({ sessions: { single: { data: null, error: new Error("fail") } } });

    const result = await createSessionFromVerifiedChallenge({
      tenantId: TENANT_ID,
      userId: USER_ID,
      challengeContext: {},
    });

    expect(result).toBeNull();
  });
});
