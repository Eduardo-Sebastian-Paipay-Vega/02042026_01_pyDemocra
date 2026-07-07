import request from "supertest";

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: {},
  resolveAuthContext: jest.fn(async (token) => {
    if (token !== "valid-token") {
      return { error: new Error("invalid token") };
    }
    return {
      user: { id: "user-1" },
      profile: { tenant_id: "11111111-1111-4111-8111-111111111111" },
      userClient: {
        rpc: jest.fn(async (fnName, args) => {
          if (fnName !== "fn_bootstrap_tenant") return { data: null, error: null };
          if (args.p_tax_id === "00000000000") {
            return { data: null, error: new Error("tax_id must be an 11-digit RUC") };
          }
          return { data: "33333333-3333-4333-8333-333333333333", error: null };
        }),
      },
    };
  }),
}));

// eslint-disable-next-line import/first
import app from "../index.js";
// eslint-disable-next-line import/first
import { config } from "../config.js";

describe("GET /api/onboarding/validate-ruc/:ruc", () => {
  test("400 cuando el RUC no tiene 11 digitos", async () => {
    const res = await request(app).get("/api/onboarding/validate-ruc/123");

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("TEN-001");
  });

  test("400 cuando el RUC contiene letras", async () => {
    const res = await request(app).get("/api/onboarding/validate-ruc/1234567890a");

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("TEN-001");
  });

  test("503 cuando el servicio de validacion fiscal no esta configurado", async () => {
    const originalUrl = config.rucApiUrl;
    const originalToken = config.rucApiToken;
    config.rucApiUrl = "";
    config.rucApiToken = "";

    try {
      const res = await request(app).get("/api/onboarding/validate-ruc/20123456789");

      expect(res.status).toBe(503);
      expect(res.body.error_code).toBe("TEN-001");
    } finally {
      config.rucApiUrl = originalUrl;
      config.rucApiToken = originalToken;
    }
  });
});

describe("POST /api/onboarding/bootstrap-tenant", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).post("/api/onboarding/bootstrap-tenant").send({});

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("400 cuando falta tenant_name", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tax_id: "20123456789", industry_type_id: "ong" });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("TEN-001");
  });

  test("400 cuando tax_id no es un RUC de 11 digitos", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "123", industry_type_id: "ong" });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("TEN-001");
  });

  test("400 cuando la RPC rechaza el tax_id (propagando el mensaje de fn_bootstrap_tenant)", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "00000000000", industry_type_id: "ong" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/11-digit RUC/);
  });

  test("201 con datos validos devuelve el tenant_id", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "20123456789", industry_type_id: "ong" });

    expect(res.status).toBe(201);
    expect(res.body.tenant_id).toBe("33333333-3333-4333-8333-333333333333");
  });
});
