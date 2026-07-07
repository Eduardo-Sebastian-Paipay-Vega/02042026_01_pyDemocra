import request from "supertest";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

let mockAuthContext;
let mockTableResults;

function mockCreateQueryBuilder(result = {}) {
  const builder = {
    select: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    gt: jest.fn(() => builder),
    is: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    then: (resolve, reject) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: {
    from: jest.fn((table) =>
      mockCreateQueryBuilder(mockTableResults?.[table] || { data: [], error: null, count: 0 })
    ),
  },
  resolveAuthContext: jest.fn(async () => mockAuthContext),
}));

jest.mock("../security/ai-client.js", () => ({
  __esModule: true,
  summarizeForensicEvent: jest.fn(async () => ({
    summary: "resumen forense",
    reasoning: "razonamiento forense",
    confidence: 0.88,
  })),
}));

jest.mock("../security/audit.js", () => ({
  __esModule: true,
  insertAuditLog: jest.fn(async () => ({ id: "audit-1" })),
}));

// eslint-disable-next-line import/first
import app from "../index.js";
// eslint-disable-next-line import/first
import { resolveAuthContext, serviceClient } from "../supabase.js";
// eslint-disable-next-line import/first
import { summarizeForensicEvent } from "../security/ai-client.js";
// eslint-disable-next-line import/first
import { insertAuditLog } from "../security/audit.js";

beforeEach(() => {
  mockAuthContext = {
    user: { id: "user-1" },
    profile: { tenant_id: TENANT_ID },
  };
  mockTableResults = {
    auth_events: {
      data: [
        { event_type: "LOGIN_OK", result: "success" },
        { event_type: "LOGIN_BLOCKED", result: "blocked" },
        { event_type: "PIN_FAIL", result: "fail" },
        { event_type: "ADMIN_OVERRIDE", result: "success" },
      ],
      error: null,
    },
    payment_transactions: {
      data: [{ status_id: "FAILED" }, { status_id: "PAID" }],
      error: null,
    },
    sessions: { data: [], error: null, count: 3 },
  };
  jest.clearAllMocks();
});

describe("POST /api/audit/summary", () => {
  test("401 sin token de autorizacion", async () => {
    mockAuthContext = { error: new Error("invalid") };

    const res = await request(app).post("/api/audit/summary").send({});

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("409 si el tenant del body no coincide con el perfil", async () => {
    const res = await request(app)
      .post("/api/audit/summary")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_id: "22222222-2222-4222-8222-222222222222" });

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe("TEN-003");
    expect(summarizeForensicEvent).not.toHaveBeenCalled();
  });

  test("409 si el tenant del perfil no tiene formato valido", async () => {
    mockAuthContext.profile.tenant_id = "tenant-invalido";

    const res = await request(app)
      .post("/api/audit/summary")
      .set("Authorization", "Bearer valid-token")
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe("TEN-003");
  });

  test("200 genera resumen, inserta audit log y sanitiza contexto", async () => {
    const res = await request(app)
      .post("/api/audit/summary")
      .set("Authorization", "Bearer valid-token")
      .set("User-Agent", "a".repeat(300))
      .set("X-Forwarded-For", "10.20.30.40, 1.1.1.1")
      .send({
        event_type: "LOGIN_BLOCKED",
        resource_name: "auth.login",
        result: "blocked",
        criticality: "high",
        payload_after: { reason: "risk" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      summary: "resumen forense",
      reasoning: "razonamiento forense",
      confidence: 0.88,
      audit_log_id: "audit-1",
    });
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        actorId: "user-1",
        ip: "10.20.30.40",
        userAgent: "a".repeat(240),
      })
    );
  });

  test("500 si summarizeForensicEvent lanza", async () => {
    summarizeForensicEvent.mockRejectedValueOnce(new Error("ai down"));

    const res = await request(app)
      .post("/api/audit/summary")
      .set("Authorization", "Bearer valid-token")
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("GET /api/audit/metrics", () => {
  test("401 cuando resolveAuthContext no devuelve usuario", async () => {
    mockAuthContext = { error: null, user: null };

    const res = await request(app).get("/api/audit/metrics").set("Authorization", "Bearer bad");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("409 si el perfil no tiene tenant", async () => {
    mockAuthContext.profile = {};

    const res = await request(app).get("/api/audit/metrics").set("Authorization", "Bearer valid");

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe("TEN-003");
  });

  test("200 calcula metricas con defaults cuando la base devuelve arrays vacios", async () => {
    mockTableResults = {
      auth_events: { data: [], error: null },
      payment_transactions: { data: [], error: null },
      sessions: { data: [], error: null, count: 0 },
    };

    const res = await request(app).get("/api/audit/metrics").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      login_success_rate: 0,
      PIN_failure_rate: 0,
      override_frequency: 0,
      concurrent_sessions_usage: 0,
      payment_failure_rate: 0,
      suspicious_activity_flags: 0,
      window_days: 7,
    });
  });

  test("200 calcula tasas de login, pagos, overrides y sesiones", async () => {
    const res = await request(app).get("/api/audit/metrics").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.login_success_rate).toBe(0.5);
    expect(res.body.PIN_failure_rate).toBe(1);
    expect(res.body.override_frequency).toBe(1);
    expect(res.body.concurrent_sessions_usage).toBe(3);
    expect(res.body.payment_failure_rate).toBe(0.5);
    expect(res.body.suspicious_activity_flags).toBe(1);
    expect(serviceClient.from).toHaveBeenCalledWith("auth_events");
    expect(serviceClient.from).toHaveBeenCalledWith("payment_transactions");
    expect(serviceClient.from).toHaveBeenCalledWith("sessions");
  });

  test("500 si una consulta de metricas lanza durante la cadena", async () => {
    serviceClient.from.mockImplementationOnce(() => {
      throw new Error("db down");
    });

    const res = await request(app).get("/api/audit/metrics").set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("GET /api/security/metrics", () => {
  test("el router tambien funciona montado en /api/security", async () => {
    const res = await request(app).get("/api/security/metrics").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(resolveAuthContext).toHaveBeenCalled();
  });
});
