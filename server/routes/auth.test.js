jest.mock("../config.js", () => {
  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_ANON_KEY = "fake-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
  process.env.JWT_SECRET = "fake-jwt-secret-para-tests";

  return jest.requireActual("../config.js");
});

jest.mock("express-rate-limit", () => ({
  __esModule: true,
  default: jest.fn(() => (_req, _res, next) => next()),
}));

import request from "supertest";
import { config } from "../config.js";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_TENANT_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";

let mockAuthContext;
let mockTableResults;
let mockLastBuilders;

function mockCreateQueryBuilder(result = {}) {
  let calledSingle = false;
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(() => {
      calledSingle = true;
      return builder;
    }),
    then: (resolve, reject) =>
      Promise.resolve(
        calledSingle
          ? result.single ?? { data: null, error: null }
          : result.list ?? { data: [], error: null }
      ).then(resolve, reject),
  };
  return builder;
}

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: {
    from: jest.fn((table) => {
      const configForTable =
        typeof mockTableResults?.[table] === "function"
          ? mockTableResults[table]()
          : mockTableResults?.[table];
      const builder = mockCreateQueryBuilder(configForTable || {});
      mockLastBuilders[table] = builder;
      return builder;
    }),
  },
  resolveAuthContext: jest.fn(async () => mockAuthContext),
}));

jest.mock("../security/risk-engine.js", () => ({
  __esModule: true,
  createSessionFromVerifiedChallenge: jest.fn(async () => ({ id: "session-from-otp" })),
  evaluateRiskEngine: jest.fn(async () => ({
    risk_level: "LOW",
    decision: "ALLOW",
    reason_codes: ["KNOWN_DEVICE_AND_IP"],
    user_message: "ok",
    error_code: null,
    blocked_until: null,
    challenge: null,
    session_id: "session-1",
    device_id: "device-1",
    audit_payload: { signals: { active_sessions: 2 } },
  })),
  resendOtpChallenge: jest.fn(async () => ({
    ok: true,
    challengeId: "challenge-1",
    expiresAt: "2026-01-01T00:00:00.000Z",
    deliveryHint: "u***@example.com",
    deliveryStatus: "sent",
    debugCode: null,
  })),
  verifyOtpChallenge: jest.fn(async () => ({
    ok: true,
    context: { event_type: "LOGIN_WEB", device_id: "device-1" },
  })),
}));

jest.mock("../security/audit.js", () => ({
  __esModule: true,
  buildMaskedRequestContext: jest.fn(({ ip, userAgent, geoCountry }) => ({
    ip_masked: ip ? "masked-ip" : null,
    user_agent: userAgent || "",
    geo_country: geoCountry || null,
  })),
  insertAuditLog: jest.fn(async () => ({ id: "audit-1" })),
  insertAuthEvent: jest.fn(async () => ({ id: "auth-event-1" })),
}));

jest.mock("../utils/security.js", () => {
  const actual = jest.requireActual("../utils/security.js");
  return {
    __esModule: true,
    ...actual,
    verifyPinHash: jest.fn(async () => true),
  };
});

// eslint-disable-next-line import/first
import app from "../index.js";
// eslint-disable-next-line import/first
import { serviceClient } from "../supabase.js";
// eslint-disable-next-line import/first
import {
  createSessionFromVerifiedChallenge,
  evaluateRiskEngine,
  resendOtpChallenge,
  verifyOtpChallenge,
} from "../security/risk-engine.js";
// eslint-disable-next-line import/first
import { insertAuditLog, insertAuthEvent } from "../security/audit.js";
// eslint-disable-next-line import/first
import { verifyPinHash } from "../utils/security.js";

const originalMaxPinAttempts = config.maxPinAttempts;
const originalPinBlockMinutes = config.pinBlockMinutes;

function resetAuthContext(profileOverrides = {}) {
  mockAuthContext = {
    user: { id: USER_ID, email: "user@example.com" },
    profile: { tenant_id: TENANT_ID, ...profileOverrides },
    userClient: { rpc: jest.fn(async () => ({ data: true, error: null })) },
  };
}

function resetTables() {
  mockLastBuilders = {};
  mockTableResults = {
    terminals: {
      single: { data: { id: "terminal-1", tenant_id: TENANT_ID, is_active: true }, error: null },
    },
    profiles: {
      single: {
        data: {
          id: USER_ID,
          tenant_id: TENANT_ID,
          pin_hash: "pin-hash",
          pin_failed_attempts: 0,
          pin_blocked_until: null,
          risk_blocked_until: null,
          is_blocked: false,
        },
        error: null,
      },
    },
    sessions: { single: { data: { id: "session-1" }, error: null }, list: { data: [], error: null } },
  };
}

beforeEach(() => {
  resetAuthContext();
  resetTables();
  config.maxPinAttempts = 3;
  config.pinBlockMinutes = 15;
  verifyPinHash.mockResolvedValue(true);
  evaluateRiskEngine.mockResolvedValue({
    risk_level: "LOW",
    decision: "ALLOW",
    reason_codes: ["KNOWN_DEVICE_AND_IP"],
    user_message: "Acceso validado.",
    error_code: null,
    blocked_until: null,
    challenge: null,
    session_id: "session-1",
    device_id: "device-1",
    audit_payload: { signals: { active_sessions: 2 } },
  });
  verifyOtpChallenge.mockResolvedValue({
    ok: true,
    context: { event_type: "LOGIN_WEB", device_id: "device-1" },
  });
  createSessionFromVerifiedChallenge.mockResolvedValue({ id: "session-from-otp" });
  resendOtpChallenge.mockResolvedValue({
    ok: true,
    challengeId: "challenge-1",
    expiresAt: "2026-01-01T00:00:00.000Z",
    deliveryHint: "u***@example.com",
    deliveryStatus: "sent",
    debugCode: null,
  });
  jest.clearAllMocks();
});

afterAll(() => {
  config.maxPinAttempts = originalMaxPinAttempts;
  config.pinBlockMinutes = originalPinBlockMinutes;
});

describe("POST /api/auth/risk-evaluate", () => {
  test("401 con token ausente, invalido o expirado", async () => {
    mockAuthContext = { error: new Error("jwt expired"), user: null };

    const res = await request(app).post("/api/auth/risk-evaluate").send({});

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("409 si no hay tenant o el tenant solicitado no coincide", async () => {
    resetAuthContext({ tenant_id: undefined });
    const missingTenant = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .send({});

    resetAuthContext();
    const mismatch = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .send({ tenant_id: OTHER_TENANT_ID });

    expect(missingTenant.status).toBe(409);
    expect(mismatch.status).toBe(409);
  });

  test("409 si el tenant no tiene formato valido", async () => {
    resetAuthContext({ tenant_id: "tenant-invalido" });

    const res = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe("TEN-003");
  });

  test("200 para ALLOW registra auth/audit y devuelve session_id", async () => {
    const res = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .set("X-Forwarded-For", "10.0.0.1")
      .set("X-Country-Code", "PE")
      .send({
        tipo_evento: "LOGIN_WEB",
        user_agent: "Custom UA",
        device_fingerprint: "fp-1",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ decision: "ALLOW", session_id: "session-1" });
    expect(evaluateRiskEngine).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        userId: USER_ID,
        ip: "10.0.0.1",
        geoCountry: "PE",
      })
    );
    expect(insertAuthEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "LOGIN_OK" }));
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ criticality: "low", result: "success" })
    );
  });

  test("200 para ACTION_CRITICAL REQUIRE_OTP devuelve challenge y debug_otp", async () => {
    evaluateRiskEngine.mockResolvedValueOnce({
      risk_level: "MEDIUM",
      decision: "REQUIRE_OTP",
      reason_codes: ["NEW_DEVICE"],
      user_message: "otp",
      error_code: "IAM-005",
      blocked_until: null,
      challenge: {
        challengeId: "challenge-1",
        expiresAt: "2026-01-01T00:00:00.000Z",
        deliveryHint: "u***@example.com",
        deliveryStatus: "debug",
        debugCode: "123456",
      },
      session_id: null,
      device_id: "device-1",
      audit_payload: {},
    });

    const res = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .send({ tipo_evento: "ACTION_CRITICAL", action_name: "pay" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      decision: "REQUIRE_OTP",
      challenge_id: "challenge-1",
      debug_otp: "123456",
    });
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ACTION_CRITICAL_STEP_UP_REQUIRED", result: "success" })
    );
  });

  test("200 para decision bloqueada registra error y criticality high", async () => {
    evaluateRiskEngine.mockResolvedValueOnce({
      risk_level: "HIGH",
      decision: "TEMP_BLOCK",
      reason_codes: ["RISK"],
      user_message: "blocked",
      error_code: "IAM-002",
      blocked_until: "2026-01-01T00:00:00.000Z",
      challenge: null,
      session_id: null,
      device_id: null,
      audit_payload: {},
    });

    const res = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .send({ tipo_evento: "ACTION_CRITICAL" });

    expect(res.status).toBe(200);
    expect(res.body.decision).toBe("TEMP_BLOCK");
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ACTION_CRITICAL_BLOCKED", result: "error" })
    );
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ criticality: "high", result: "error" })
    );
  });

  test("500 si evaluateRiskEngine lanza", async () => {
    evaluateRiskEngine.mockRejectedValueOnce(new Error("risk down"));

    const res = await request(app)
      .post("/api/auth/risk-evaluate")
      .set("Authorization", "Bearer valid")
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("POST /api/auth/step-up/verify-otp", () => {
  test("401, 409 y 400 para auth/tenant/payload invalidos", async () => {
    mockAuthContext = { error: new Error("expired"), user: null };
    const unauthorized = await request(app).post("/api/auth/step-up/verify-otp").send({});

    resetAuthContext();
    const tenantMismatch = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .set("Authorization", "Bearer valid")
      .send({ tenant_id: OTHER_TENANT_ID, challenge_id: "c1", code: "123456" });

    const missingFields = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "c1" });

    expect(unauthorized.status).toBe(401);
    expect(tenantMismatch.status).toBe(409);
    expect(missingFields.status).toBe(400);
  });

  test("403 si OTP no verifica, audita con resumen IA", async () => {
    verifyOtpChallenge.mockResolvedValueOnce({
      ok: false,
      reason: "IAM-001",
      context: { event_type: "LOGIN_WEB" },
    });

    const res = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1", code: "000000" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("IAM-001");
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "MFA_STEP_UP_FAIL", result: "error" })
    );
    expect(insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ includeAiSummary: true }));
  });

  test("200 verifica OTP de login y crea session", async () => {
    const res = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      verified: true,
      next_url: "/studio.html",
      session_id: "session-from-otp",
    });
    expect(createSessionFromVerifiedChallenge).toHaveBeenCalled();
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "MFA_STEP_UP_OK", result: "success" })
    );
  });

  test("200 verifica OTP de accion critica sin crear session", async () => {
    verifyOtpChallenge.mockResolvedValueOnce({
      ok: true,
      alreadyVerified: true,
      context: { event_type: "ACTION_CRITICAL", action_name: "approve" },
    });

    const res = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.session_id).toBeNull();
    expect(createSessionFromVerifiedChallenge).not.toHaveBeenCalled();
  });

  test("500 si verifyOtpChallenge lanza", async () => {
    verifyOtpChallenge.mockRejectedValueOnce(new Error("otp db down"));

    const res = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1", code: "123456" });

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("POST /api/auth/step-up/resend-otp", () => {
  test("401/409/400 para auth, tenant y challenge invalidos", async () => {
    mockAuthContext = { error: new Error("expired"), user: null };
    const unauthorized = await request(app).post("/api/auth/step-up/resend-otp").send({});

    resetAuthContext({ tenant_id: undefined });
    const missingTenant = await request(app)
      .post("/api/auth/step-up/resend-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1" });

    resetAuthContext();
    const missingChallenge = await request(app)
      .post("/api/auth/step-up/resend-otp")
      .set("Authorization", "Bearer valid")
      .send({});

    expect(unauthorized.status).toBe(401);
    expect(missingTenant.status).toBe(409);
    expect(missingChallenge.status).toBe(400);
  });

  test("503 si resendOtpChallenge falla", async () => {
    resendOtpChallenge.mockResolvedValueOnce({ ok: false, reason: "IAM-004" });

    const res = await request(app)
      .post("/api/auth/step-up/resend-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1" });

    expect(res.status).toBe(503);
    expect(res.body.error_code).toBe("IAM-004");
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "MFA_STEP_UP_RESEND_FAIL" })
    );
  });

  test("200 reenvia OTP con debug_otp opcional", async () => {
    resendOtpChallenge.mockResolvedValueOnce({
      ok: true,
      challengeId: "challenge-1",
      expiresAt: "2026-01-01T00:00:00.000Z",
      deliveryHint: "u***@example.com",
      deliveryStatus: "debug",
      debugCode: "654321",
    });

    const res = await request(app)
      .post("/api/auth/step-up/resend-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      resent: true,
      challenge_id: "challenge-1",
      debug_otp: "654321",
    });
  });

  test("500 si resendOtpChallenge lanza", async () => {
    resendOtpChallenge.mockRejectedValueOnce(new Error("mailer down"));

    const res = await request(app)
      .post("/api/auth/step-up/resend-otp")
      .set("Authorization", "Bearer valid")
      .send({ challenge_id: "challenge-1" });

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("POST /api/auth/terminal-login", () => {
  const validPayload = {
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    pin: "1234",
    terminal_id: "terminal-1",
  };

  test("400 para payload malformado y 409 para tenant invalido", async () => {
    const missing = await request(app).post("/api/auth/terminal-login").send({});
    const invalidTenant = await request(app)
      .post("/api/auth/terminal-login")
      .send({ ...validPayload, tenant_id: "tenant-invalido" });

    expect(missing.status).toBe(400);
    expect(invalidTenant.status).toBe(409);
  });

  test("403 si terminal no existe, falla o esta inactivo", async () => {
    mockTableResults.terminals.single = { data: null, error: null };
    const missingTerminal = await request(app).post("/api/auth/terminal-login").send(validPayload);

    resetTables();
    mockTableResults.terminals.single = {
      data: { id: "terminal-1", is_active: false },
      error: null,
    };
    const inactiveTerminal = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(missingTerminal.status).toBe(403);
    expect(inactiveTerminal.status).toBe(403);
    expect(missingTerminal.body.error_code).toBe("IAM-005");
  });

  test("403 si perfil no existe o usuario esta bloqueado", async () => {
    mockTableResults.profiles.single = { data: null, error: null };
    const missingProfile = await request(app).post("/api/auth/terminal-login").send(validPayload);

    resetTables();
    mockTableResults.profiles.single.data.is_blocked = true;
    const blockedProfile = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(missingProfile.status).toBe(403);
    expect(missingProfile.body.error_code).toBe("IAM-001");
    expect(blockedProfile.status).toBe(403);
    expect(blockedProfile.body.error_code).toBe("IAM-002");
  });

  test("423 si el PIN ya esta temporalmente bloqueado", async () => {
    mockTableResults.profiles.single.data.pin_blocked_until = new Date(Date.now() + 60_000).toISOString();

    const res = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(res.status).toBe(423);
    expect(res.body.error_code).toBe("IAM-002");
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PIN_BLOCKED", result: "error" })
    );
  });

  test("401 si PIN es incorrecto sin llegar al bloqueo", async () => {
    verifyPinHash.mockResolvedValueOnce(false);
    mockTableResults.profiles.single.data.pin_failed_attempts = 1;

    const res = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(res.status).toBe(401);
    expect(mockLastBuilders.profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({ pin_failed_attempts: 2, pin_blocked_until: null })
    );
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PIN_FAIL", includeAiSummary: false })
    );
  });

  test("423 si PIN incorrecto supera maxPinAttempts", async () => {
    verifyPinHash.mockResolvedValueOnce(false);
    mockTableResults.profiles.single.data.pin_failed_attempts = 2;

    const res = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(res.status).toBe(423);
    expect(res.body.error_code).toBe("IAM-002");
    expect(mockLastBuilders.profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({ pin_failed_attempts: 0 })
    );
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PIN_BLOCKED", includeAiSummary: true })
    );
  });

  test("403 si PIN es correcto pero motor de riesgo no permite login", async () => {
    evaluateRiskEngine.mockResolvedValueOnce({
      risk_level: "HIGH",
      decision: "TEMP_BLOCK",
      reason_codes: ["RISK"],
      error_code: "IAM-002",
      blocked_until: "2026-01-01T00:00:00.000Z",
    });

    const res = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(res.status).toBe(403);
    expect(res.body.risk_level).toBe("HIGH");
    expect(insertAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "TERMINAL_LOGIN_BLOCKED" })
    );
  });

  test("200 si PIN es correcto y riesgo permite login", async () => {
    const res = await request(app)
      .post("/api/auth/terminal-login")
      .set("CF-IPCountry", "PE")
      .send({ ...validPayload, user_agent: "Terminal UA" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      login: "ok",
      session_id: "session-1",
      decision: "ALLOW",
    });
    expect(verifyPinHash).toHaveBeenCalledWith({ pin: "1234", pinHash: "pin-hash" });
    expect(mockLastBuilders.sessions.update).toHaveBeenCalledWith({ terminal_id: "terminal-1" });
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "TERMINAL_LOGIN_OK", result: "success" })
    );
  });

  test("200 si riesgo permite login sin session_id no actualiza sessions", async () => {
    evaluateRiskEngine.mockResolvedValueOnce({
      risk_level: "LOW",
      decision: "ALLOW",
      reason_codes: ["KNOWN_DEVICE_AND_IP"],
      session_id: null,
      device_id: null,
    });

    const res = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.session_id).toBeNull();
    expect(serviceClient.from).not.toHaveBeenCalledWith("sessions");
  });

  test("500 si Supabase lanza durante terminal-login", async () => {
    serviceClient.from.mockImplementationOnce(() => {
      throw new Error("db down");
    });

    const res = await request(app).post("/api/auth/terminal-login").send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});
