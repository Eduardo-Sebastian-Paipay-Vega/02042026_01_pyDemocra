import request from "supertest";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

let mockAuthMode;
let mockTableResults;
let mockLastBuilders;

function mockCreateQueryBuilder(result = {}) {
  let calledSingle = false;
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
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
      const builder = mockCreateQueryBuilder(mockTableResults?.[table] || {});
      mockLastBuilders[table] = builder;
      return builder;
    }),
  },
  resolveAuthContext: jest.fn(async (token) => {
    if (token === "bad-token" || mockAuthMode === "invalid") {
      return { error: new Error("invalid token") };
    }
    if (mockAuthMode === "no-tenant") {
      return {
        user: { id: "user-1" },
        profile: {},
        userClient: { rpc: jest.fn(async () => ({ data: true, error: null })) },
      };
    }
    if (mockAuthMode === "invalid-tenant") {
      return {
        user: { id: "user-1" },
        profile: { tenant_id: "tenant-invalido" },
        userClient: { rpc: jest.fn(async () => ({ data: true, error: null })) },
      };
    }
    return {
      user: { id: mockAuthMode === "member" ? "user-2" : "user-1" },
      profile: { tenant_id: TENANT_ID },
      userClient: { rpc: jest.fn(async () => ({ data: mockAuthMode !== "member", error: null })) },
    };
  }),
}));

// eslint-disable-next-line import/first
import app from "../index.js";
// eslint-disable-next-line import/first
import { serviceClient } from "../supabase.js";

beforeEach(() => {
  mockAuthMode = "admin";
  mockLastBuilders = {};
  mockTableResults = {
    tenants: { single: { data: { status_financial_id: "FIN-ACTIVE" }, error: null } },
    sedes: {
      list: {
        data: [{ id: "sede-1", name: "Sede Norte", is_active: true }],
        error: null,
      },
      single: {
        data: { id: "sede-1", name: "Sede Norte", is_active: true },
        error: null,
      },
    },
  };
  jest.clearAllMocks();
});

describe("GET /api/sedes", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).get("/api/sedes");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("401 si el token no resuelve usuario", async () => {
    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer bad-token");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("409 si el usuario no tiene tenant", async () => {
    mockAuthMode = "no-tenant";

    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer valid");

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe("TEN-003");
  });

  test("409 si el tenant no es UUID valido", async () => {
    mockAuthMode = "invalid-tenant";

    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer valid");

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe("TEN-003");
  });

  test("200 para un miembro autenticado y ordena por nombre", async () => {
    mockAuthMode = "member";

    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.sedes).toEqual([{ id: "sede-1", name: "Sede Norte", is_active: true }]);
    expect(mockLastBuilders.sedes.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  test("200 devuelve [] cuando Supabase retorna data null sin error", async () => {
    mockTableResults.sedes = { list: { data: null, error: null } };

    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.sedes).toEqual([]);
  });

  test("500 si Supabase falla al listar sedes", async () => {
    mockTableResults.sedes = { list: { data: null, error: new Error("db down") } };

    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("POST /api/sedes", () => {
  test("403 si el middleware financiero bloquea escrituras", async () => {
    mockTableResults.tenants.single.data.status_financial_id = "FIN-READONLY";

    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid")
      .send({ name: "Sede Sur" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("FIN-002");
  });

  test("403 si el usuario autenticado no es admin del tenant", async () => {
    mockAuthMode = "member";

    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid")
      .send({ name: "Sede Sur" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("IAM-003");
  });

  test("400 cuando falta name", async () => {
    const res = await request(app).post("/api/sedes").set("Authorization", "Bearer valid").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("name es requerido.");
  });

  test("201 cuando un admin crea una sede valida y recorta el nombre", async () => {
    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid")
      .send({ name: "  Sede Norte  " });

    expect(res.status).toBe(201);
    expect(res.body.sede.name).toBe("Sede Norte");
    expect(mockLastBuilders.sedes.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID, name: "Sede Norte", is_active: true })
    );
  });

  test("201 permite respuesta null de Supabase si no hay error", async () => {
    mockTableResults.sedes.single = { data: null, error: null };

    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid")
      .send({ name: "Sede Fantasma" });

    expect(res.status).toBe(201);
    expect(res.body.sede).toBeNull();
  });

  test("500 si Supabase falla al crear", async () => {
    mockTableResults.sedes.single = { data: null, error: new Error("insert failed") };

    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid")
      .send({ name: "Sede Sur" });

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("PUT /api/sedes/:sedeId", () => {
  test("403 si el usuario autenticado no es admin del tenant", async () => {
    mockAuthMode = "member";

    const res = await request(app)
      .put("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid")
      .send({ name: "Sede Centro" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("IAM-003");
  });

  test("400 si no hay campos actualizables", async () => {
    const res = await request(app)
      .put("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid")
      .send({ ignored: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No hay campos para actualizar.");
  });

  test("400 si name queda vacio", async () => {
    const res = await request(app)
      .put("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid")
      .send({ name: "   " });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("name no puede quedar vacio.");
  });

  test("200 actualiza name e is_active", async () => {
    mockTableResults.sedes.single.data = { id: "sede-1", name: "Sede Centro", is_active: false };

    const res = await request(app)
      .put("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid")
      .send({ name: " Sede Centro ", is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.sede).toEqual({ id: "sede-1", name: "Sede Centro", is_active: false });
    expect(mockLastBuilders.sedes.update).toHaveBeenCalledWith({
      name: "Sede Centro",
      is_active: false,
    });
  });

  test("200 actualiza solo is_active", async () => {
    mockTableResults.sedes.single.data = { id: "sede-1", name: "Sede Norte", is_active: false };

    const res = await request(app)
      .put("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid")
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(mockLastBuilders.sedes.update).toHaveBeenCalledWith({ is_active: false });
  });

  test("404 si no existe la sede", async () => {
    mockTableResults.sedes.single = { data: null, error: null };

    const res = await request(app)
      .put("/api/sedes/sede-404")
      .set("Authorization", "Bearer valid")
      .send({ is_active: false });

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe("TEN-001");
  });

  test("500 si Supabase falla al actualizar", async () => {
    mockTableResults.sedes.single = { data: null, error: new Error("update failed") };

    const res = await request(app)
      .put("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid")
      .send({ name: "Sede Centro" });

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});

describe("DELETE /api/sedes/:sedeId", () => {
  test("403 si el usuario autenticado no es admin del tenant", async () => {
    mockAuthMode = "member";

    const res = await request(app).delete("/api/sedes/sede-1").set("Authorization", "Bearer valid");

    expect(res.status).toBe(403);
  });

  test("204 cuando un admin desactiva una sede", async () => {
    const res = await request(app).delete("/api/sedes/sede-1").set("Authorization", "Bearer valid");

    expect(res.status).toBe(204);
    expect(mockLastBuilders.sedes.update).toHaveBeenCalledWith({ is_active: false });
  });

  test("404 si la sede no existe", async () => {
    mockTableResults.sedes.single = { data: null, error: null };

    const res = await request(app).delete("/api/sedes/sede-404").set("Authorization", "Bearer valid");

    expect(res.status).toBe(404);
  });

  test("500 si Supabase falla al desactivar", async () => {
    mockTableResults.sedes.single = { data: null, error: new Error("delete failed") };

    const res = await request(app).delete("/api/sedes/sede-1").set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });
});
