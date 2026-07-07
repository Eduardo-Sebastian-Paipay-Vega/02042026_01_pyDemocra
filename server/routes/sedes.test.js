import request from "supertest";

jest.mock("../supabase.js", () => {
  // .single() cambia la forma del resultado resuelto (fila unica vs lista) —
  // igual que el comportamiento real de supabase-js, donde .single() colapsa
  // el array a un solo objeto.
  function createQueryBuilder() {
    let calledSingle = false;
    const row = { id: "sede-1", name: "Sede Norte", is_active: true };
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
          calledSingle ? { data: row, error: null } : { data: [row], error: null }
        ).then(resolve, reject),
    };
    return builder;
  }

  return {
    __esModule: true,
    serviceClient: {
      from: jest.fn(() => createQueryBuilder()),
    },
    resolveAuthContext: jest.fn(async (token) => {
      if (token === "valid-token-admin") {
        return {
          user: { id: "user-1" },
          profile: { tenant_id: "11111111-1111-4111-8111-111111111111" },
          userClient: { rpc: jest.fn(async () => ({ data: true, error: null })) },
        };
      }
      if (token === "valid-token-member") {
        return {
          user: { id: "user-2" },
          profile: { tenant_id: "11111111-1111-4111-8111-111111111111" },
          userClient: { rpc: jest.fn(async () => ({ data: false, error: null })) },
        };
      }
      return { error: new Error("invalid token") };
    }),
  };
});

// eslint-disable-next-line import/first
import app from "../index.js";

describe("GET /api/sedes", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).get("/api/sedes");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("200 para un miembro autenticado (lectura no requiere ser admin)", async () => {
    const res = await request(app).get("/api/sedes").set("Authorization", "Bearer valid-token-member");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sedes)).toBe(true);
  });
});

describe("POST /api/sedes", () => {
  test("403 si el usuario autenticado no es admin del tenant", async () => {
    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid-token-member")
      .send({ name: "Sede Sur" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("IAM-003");
  });

  test("400 cuando falta name", async () => {
    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid-token-admin")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("TEN-001");
  });

  test("201 cuando un admin crea una sede valida", async () => {
    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid-token-admin")
      .send({ name: "Sede Norte" });

    expect(res.status).toBe(201);
    expect(res.body.sede.name).toBe("Sede Norte");
  });
});

describe("DELETE /api/sedes/:sedeId", () => {
  test("403 si el usuario autenticado no es admin del tenant", async () => {
    const res = await request(app)
      .delete("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid-token-member");

    expect(res.status).toBe(403);
  });

  test("204 cuando un admin desactiva una sede (soft-delete)", async () => {
    const res = await request(app)
      .delete("/api/sedes/sede-1")
      .set("Authorization", "Bearer valid-token-admin");

    expect(res.status).toBe(204);
  });
});
