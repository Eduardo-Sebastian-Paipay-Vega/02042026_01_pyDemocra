import { createChainableResult } from "../test-utils/mockSupabase.js";

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: { from: jest.fn() },
  resolveAuthContext: jest.fn(),
}));

// eslint-disable-next-line import/first
import { getBearerToken, sendError } from "../../../utils/http.js";
import { assertTenantScope } from "../../../utils/tenant-scope.js";
import { financialWriteGuard } from "./financial-state.js";
// eslint-disable-next-line import/first
import { serviceClient, resolveAuthContext } from "../supabase.js";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

function createReq({ method = "POST", token = "valid-token" } = {}) {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

function createRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function mockFinancialStatus(statusFinancialId) {
  serviceClient.from.mockImplementation(() =>
    createChainableResult({
      single:
        statusFinancialId === undefined
          ? { data: null, error: new Error("db down") }
          : { data: { status_financial_id: statusFinancialId }, error: null },
    })
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("requireFinancialWriteAccess", () => {
  test("llama next() de inmediato para metodos de lectura (GET), sin tocar supabase", async () => {
    const middleware = requireFinancialWriteAccess();
    const req = createReq({ method: "GET" });
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(resolveAuthContext).not.toHaveBeenCalled();
  });

  test("401 si falta el token en un metodo de escritura", async () => {
    const middleware = requireFinancialWriteAccess();
    const req = createReq({ method: "POST", token: null });
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("401 si resolveAuthContext devuelve error", async () => {
    resolveAuthContext.mockResolvedValue({ error: new Error("invalid") });
    const middleware = requireFinancialWriteAccess();
    const req = createReq();
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("next() si el perfil autenticado no tiene tenant_id (pre-onboarding)", async () => {
    resolveAuthContext.mockResolvedValue({ user: { id: "u1" }, profile: {} });
    const middleware = requireFinancialWriteAccess();
    const req = createReq();
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(serviceClient.from).not.toHaveBeenCalled();
  });

  test("409 si el tenant_id del perfil no es un UUID valido", async () => {
    resolveAuthContext.mockResolvedValue({
      user: { id: "u1" },
      profile: { tenant_id: "no-es-uuid" },
    });
    const middleware = requireFinancialWriteAccess();
    const req = createReq();
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(next).not.toHaveBeenCalled();
  });

  test("403 FIN-001 si el tenant esta FIN-SUSPENDED", async () => {
    resolveAuthContext.mockResolvedValue({
      user: { id: "u1" },
      profile: { tenant_id: TENANT_ID },
    });
    mockFinancialStatus("FIN-SUSPENDED");
    const middleware = requireFinancialWriteAccess();
    const req = createReq();
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].error_code).toBe("FIN-001");
    expect(next).not.toHaveBeenCalled();
  });

  test.each(["FIN-READONLY", "FIN-INCONSISTENT", "FIN-PENDING"])(
    "403 FIN-002 si el tenant esta en estado %s",
    async (status) => {
      resolveAuthContext.mockResolvedValue({
        user: { id: "u1" },
        profile: { tenant_id: TENANT_ID },
      });
      mockFinancialStatus(status);
      const middleware = requireFinancialWriteAccess();
      const req = createReq();
      const res = createRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json.mock.calls[0][0].error_code).toBe("FIN-002");
    }
  );

  test("next() si el tenant esta FIN-ACTIVE", async () => {
    resolveAuthContext.mockResolvedValue({
      user: { id: "u1" },
      profile: { tenant_id: TENANT_ID },
    });
    mockFinancialStatus("FIN-ACTIVE");
    const middleware = requireFinancialWriteAccess();
    const req = createReq();
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("next() si la consulta de estado financiero falla (resolveTenantFinancialStatus -> null)", async () => {
    resolveAuthContext.mockResolvedValue({
      user: { id: "u1" },
      profile: { tenant_id: TENANT_ID },
    });
    mockFinancialStatus(undefined);
    const middleware = requireFinancialWriteAccess();
    const req = createReq();
    const res = createRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test.each(["PUT", "PATCH", "DELETE"])(
    "trata %s tambien como metodo de escritura",
    async (method) => {
      const middleware = requireFinancialWriteAccess();
      const req = createReq({ method, token: null });
      const res = createRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    }
  );
});
