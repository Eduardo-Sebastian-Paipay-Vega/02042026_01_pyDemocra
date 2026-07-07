import request from "supertest";

// jest.mock se hoistea sobre los imports — todo lo que referencia debe
// definirse DENTRO de la factory (no se puede cerrar sobre variables de
// afuera declaradas con let/const antes del mock).
jest.mock("../supabase.js", () => {
  function createQueryBuilder(result) {
    const builder = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      order: jest.fn(() => builder),
      single: jest.fn(() => builder),
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return builder;
  }

  return {
    __esModule: true,
    serviceClient: {
      from: jest.fn(() =>
        createQueryBuilder({
          data: [{ id: "role-1", name: "Owner", hierarchy_level: 0, is_system_role: true }],
          error: null,
        })
      ),
    },
    resolveAuthContext: jest.fn(async (token) => {
      if (token !== "valid-token") {
        return { error: new Error("invalid token") };
      }
      return {
        user: { id: "user-1" },
        profile: { tenant_id: "11111111-1111-4111-8111-111111111111" },
        userClient: {
          rpc: jest.fn(async () => ({ data: true, error: null })),
        },
      };
    }),
  };
});

// eslint-disable-next-line import/first
import app from "../index.js";

describe("GET /api/iam/roles", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).get("/api/iam/roles");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });

  test("200 con token valido devuelve la lista de roles", async () => {
    const res = await request(app)
      .get("/api/iam/roles")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body.roles).toHaveLength(1);
    expect(res.body.roles[0].name).toBe("Owner");
  });
});

describe("POST /api/iam/roles", () => {
  test("401 sin token de autorizacion (bloqueado por requireFinancialWriteAccess)", async () => {
    const res = await request(app).post("/api/iam/roles").send({ name: "Nuevo rol" });

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});
