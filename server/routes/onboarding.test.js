import request from "supertest";

let mockAuthMode;
let mockLastRpcArgs;

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: {},
  resolveAuthContext: jest.fn(async (token) => {
    if (!token || token === "bad-token" || mockAuthMode === "invalid") {
      return { error: new Error("invalid token") };
    }
    return {
      user: { id: "user-1" },
      profile: { tenant_id: "11111111-1111-4111-8111-111111111111" },
      userClient: {
        rpc: jest.fn(async (fnName, args) => {
          mockLastRpcArgs = { fnName, args };
          if (fnName !== "fn_bootstrap_tenant") return { data: null, error: null };
          if (args.p_tax_id === "00000000000") {
            return { data: null, error: new Error("tax_id must be an 11-digit RUC") };
          }
          if (mockAuthMode === "rpc-error") {
            return { data: null, error: new Error("billing_day fuera de rango") };
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

const originalFetch = global.fetch;
const originalRucApiUrl = config.rucApiUrl;
const originalRucApiToken = config.rucApiToken;

function mockRucConfig(url = "https://ruc.test/:ruc?token=:token") {
  config.rucApiUrl = url;
  config.rucApiToken = "token test";
}

function mockFetchResponse({ ok = true, status = 200, payload = null, raw }) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    text: async () => (raw === undefined ? JSON.stringify(payload) : raw),
  });
}

beforeEach(() => {
  mockAuthMode = "valid";
  mockLastRpcArgs = null;
  mockRucConfig();
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
  config.rucApiUrl = originalRucApiUrl;
  config.rucApiToken = originalRucApiToken;
});

describe("GET /api/onboarding/validate-ruc/:ruc", () => {
  test("400 cuando el RUC no tiene 11 digitos o contiene letras", async () => {
    const shortRes = await request(app).get("/api/onboarding/validate-ruc/123");
    const lettersRes = await request(app).get("/api/onboarding/validate-ruc/1234567890a");

    expect(shortRes.status).toBe(400);
    expect(lettersRes.status).toBe(400);
    expect(shortRes.body.error_code).toBe("TEN-001");
  });

  test("503 cuando el servicio fiscal no esta configurado", async () => {
    config.rucApiUrl = "";
    config.rucApiToken = "";

    const res = await request(app).get("/api/onboarding/validate-ruc/20123456789");

    expect(res.status).toBe(503);
    expect(res.body.error_type).toBe("configuration");
  });

  test("200 normaliza respuesta data object y construye URL con placeholders", async () => {
    mockFetchResponse({
      payload: {
        data: {
          ruc: "20123456789",
          razonSocial: "Fundacion Demo",
          estado: "Activo",
          condicion: "Habido",
        },
      },
    });

    const res = await request(app).get("/api/onboarding/validate-ruc/20123456789");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tax_id: "20123456789", tenant_name: "Fundacion Demo" });
    expect(global.fetch.mock.calls[0][0]).toBe("https://ruc.test/20123456789?token=token%20test");
    expect(global.fetch.mock.calls[0][1].headers).toMatchObject({
      Authorization: "Bearer token test",
      "x-api-key": "token test",
      "x-api-token": "token test",
    });
  });

  test("200 soporta arrays y baseUrl sin placeholders", async () => {
    mockRucConfig("https://ruc.test/api/");
    mockFetchResponse({
      payload: [
        {
          numeroDocumento: "20123456789",
          nombre_o_razon_social: "Asociacion Demo",
          estadoContribuyente: "ACTIVO",
          condicionDomicilio: "HABIDO",
        },
      ],
    });

    const res = await request(app).get("/api/onboarding/validate-ruc/20123456789");

    expect(res.status).toBe(200);
    expect(res.body.tenant_name).toBe("Asociacion Demo");
    expect(global.fetch.mock.calls[0][0]).toBe("https://ruc.test/api/20123456789");
  });

  test("200 soporta payload result y resultado", async () => {
    mockFetchResponse({
      payload: {
        result: {
          id: "20123456789",
          nombre: "Resultado Demo",
          status: "ACTIVO",
          condition: "HABIDO",
        },
      },
    });

    const resultRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.tenant_name).toBe("Resultado Demo");

    mockFetchResponse({
      payload: {
        resultado: {
          tax_id: "20123456789",
          tenant_name: "Resultado Alterno",
          estado: "ACTIVO",
          condicion: "HABIDO",
        },
      },
    });

    const resultadoRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(resultadoRes.status).toBe(200);
    expect(resultadoRes.body.tenant_name).toBe("Resultado Alterno");
  });

  test("404 cuando el proveedor responde 404 o payload sin registro", async () => {
    mockFetchResponse({ ok: false, status: 404, payload: { message: "not found" } });

    const notFoundRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(notFoundRes.status).toBe(404);

    mockFetchResponse({ payload: null, raw: "" });
    const emptyRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(emptyRes.status).toBe(404);

    mockFetchResponse({ payload: { data: [] } });
    const emptyDataRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(emptyDataRes.status).toBe(404);

    mockFetchResponse({ payload: "texto plano" });
    const primitiveRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(primitiveRes.status).toBe(404);
  });

  test("502 cuando el proveedor falla con mensaje parseable o JSON invalido", async () => {
    mockFetchResponse({ ok: false, status: 500, payload: { mensaje: "SUNAT caido" } });

    const providerRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(providerRes.status).toBe(502);
    expect(providerRes.body.message).toBe("SUNAT caido");

    mockFetchResponse({ ok: false, status: 502, raw: "{no-json}" });
    const invalidJsonRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(invalidJsonRes.status).toBe(502);
    expect(invalidJsonRes.body.message).toBe("No se pudo validar el RUC con SUNAT.");
  });

  test("422 o 404 cuando payload trae estado=false y mensaje de validacion", async () => {
    mockFetchResponse({ payload: { estado: false, mensaje: "RUC suspendido" } });

    const invalidRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(invalidRes.status).toBe(422);
    expect(invalidRes.body.message).toBe("RUC suspendido");

    mockFetchResponse({ payload: { estado: false, mensaje: "no encontrado" } });
    const missingRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(missingRes.status).toBe(404);
    expect(missingRes.body.message).toBe("RUC no existe.");
  });

  test("403 si empresa no esta activa o no esta habida", async () => {
    mockFetchResponse({
      payload: {
        ruc: "20123456789",
        razon_social: "Fundacion Demo",
        estado: "BAJA",
        condicion: "HABIDO",
      },
    });

    const inactiveRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(inactiveRes.status).toBe(403);
    expect(inactiveRes.body.message).toBe("Empresa inactiva.");

    mockFetchResponse({
      payload: {
        ruc: "20123456789",
        razon_social: "Fundacion Demo",
        estado: "ACTIVO",
        condicion: "NO HABIDO",
      },
    });

    const notHabidoRes = await request(app).get("/api/onboarding/validate-ruc/20123456789");
    expect(notHabidoRes.status).toBe(403);
    expect(notHabidoRes.body.message).toBe("Empresa no habida.");
  });

  test("502 si fetch rechaza por fallo de red", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    const res = await request(app).get("/api/onboarding/validate-ruc/20123456789");

    expect(res.status).toBe(502);
    expect(res.body.error_type).toBe("external_service");
    consoleSpy.mockRestore();
  });
});

describe("POST /api/onboarding/bootstrap-tenant", () => {
  test("401 sin token de autorizacion o con token invalido", async () => {
    const noTokenRes = await request(app).post("/api/onboarding/bootstrap-tenant").send({});
    const badTokenRes = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer bad-token")
      .send({});

    expect(noTokenRes.status).toBe(401);
    expect(badTokenRes.status).toBe(401);
  });

  test("400 para tenant_name, tax_id o industry_type_id invalidos", async () => {
    const missingName = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tax_id: "20123456789", industry_type_id: "ong" });
    const badTaxId = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "123", industry_type_id: "ong" });
    const missingIndustry = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "20123456789" });

    expect(missingName.status).toBe(400);
    expect(badTaxId.status).toBe(400);
    expect(missingIndustry.status).toBe(400);
  });

  test("400 cuando la RPC devuelve error de validacion", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "00000000000", industry_type_id: "ong" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/11-digit RUC/);
  });

  test("201 con datos validos, plan opcional y billing_day entero", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({
        tenant_name: " Fundacion Demo ",
        tax_id: "20123456789",
        industry_type_id: " ong ",
        plan_id: " pro ",
        billing_day: 15,
      });

    expect(res.status).toBe(201);
    expect(res.body.tenant_id).toBe("33333333-3333-4333-8333-333333333333");
    expect(mockLastRpcArgs).toEqual({
      fnName: "fn_bootstrap_tenant",
      args: {
        p_tenant_name: "Fundacion Demo",
        p_tax_id: "20123456789",
        p_industry_type_id: "ong",
        p_plan_id: "pro",
        p_billing_day: 15,
      },
    });
  });

  test("omite plan vacio y billing_day no entero", async () => {
    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({
        tenant_name: "Fundacion Demo",
        tax_id: "20123456789",
        industry_type_id: "ong",
        plan_id: "",
        billing_day: 15.5,
      });

    expect(res.status).toBe(201);
    expect(mockLastRpcArgs.args).not.toHaveProperty("p_plan_id");
    expect(mockLastRpcArgs.args).not.toHaveProperty("p_billing_day");
  });

  test("500 si ocurre una excepcion inesperada en auth", async () => {
    mockAuthMode = "throw";
    const { resolveAuthContext } = await import("../supabase.js");
    resolveAuthContext.mockRejectedValueOnce(new Error("auth service down"));

    const res = await request(app)
      .post("/api/onboarding/bootstrap-tenant")
      .set("Authorization", "Bearer valid-token")
      .send({ tenant_name: "Fundacion Demo", tax_id: "20123456789", industry_type_id: "ong" });

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});
