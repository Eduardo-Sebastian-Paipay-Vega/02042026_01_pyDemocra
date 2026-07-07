import request from "supertest";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

let mockAuthMode;
let mockPermissions;
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
      const builder = mockCreateQueryBuilder(mockTableResults?.[table] || {});
      mockLastBuilders[table] = builder;
      return builder;
    }),
  },
  resolveAuthContext: jest.fn(async (token) => {
    if (!token || token === "bad-token" || mockAuthMode === "invalid") {
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
      user: { id: "user-1" },
      profile: { tenant_id: TENANT_ID },
      userClient: {
        rpc: jest.fn(async (fnName, args = {}) => {
          if (fnName === "fn_is_tenant_admin") return { data: mockPermissions.admin, error: null };
          if (args.p_permission === "settings.roles.read") {
            return { data: mockPermissions.readRoles, error: null };
          }
          if (args.p_permission === "settings.roles.manage") {
            return { data: mockPermissions.manageRoles, error: null };
          }
          if (args.p_permission === "settings.users.manage") {
            return { data: mockPermissions.manageUsers, error: null };
          }
          return { data: false, error: null };
        }),
      },
    };
  }),
}));

// eslint-disable-next-line import/first
import app from "../index.js";
// eslint-disable-next-line import/first
import { serviceClient } from "../supabase.js";

beforeEach(() => {
  mockAuthMode = "valid";
  mockPermissions = {
    admin: true,
    readRoles: false,
    manageRoles: false,
    manageUsers: false,
  };
  mockLastBuilders = {};
  mockTableResults = {
    tenants: { single: { data: { status_financial_id: "FIN-ACTIVE" }, error: null } },
    roles: {
      list: {
        data: [{ id: "role-1", name: "Owner", hierarchy_level: 0, is_system_role: true }],
        error: null,
      },
      single: { data: { id: "role-1", name: "Admin", hierarchy_level: 10 }, error: null },
    },
    role_permissions: {
      list: { data: [{ id: "perm-1", role_id: "role-1", permission: "settings.roles.read" }], error: null },
      single: {
        data: { id: "perm-1", role_id: "role-1", permission: "settings.roles.manage" },
        error: null,
      },
    },
    user_roles_sedes: {
      list: {
        data: [{ id: "asig-1", user_id: "user-2", role_id: "role-1", sede_id: "sede-1" }],
        error: null,
      },
      single: {
        data: { id: "asig-1", user_id: "user-2", role_id: "role-1", sede_id: "sede-1" },
        error: null,
      },
    },
  };
  jest.clearAllMocks();
});

describe("resolveIamContext compartido", () => {
  test("401 sin token o con token expirado", async () => {
    const noToken = await request(app).get("/api/iam/roles");
    const badToken = await request(app).get("/api/iam/roles").set("Authorization", "Bearer bad-token");

    expect(noToken.status).toBe(401);
    expect(badToken.status).toBe(401);
  });

  test("409 si no hay tenant o el tenant es invalido", async () => {
    mockAuthMode = "no-tenant";
    const noTenant = await request(app).get("/api/iam/roles").set("Authorization", "Bearer valid");

    mockAuthMode = "invalid-tenant";
    const invalidTenant = await request(app).get("/api/iam/roles").set("Authorization", "Bearer valid");

    expect(noTenant.status).toBe(409);
    expect(invalidTenant.status).toBe(409);
  });

  test("403 si estado financiero bloquea escrituras", async () => {
    mockTableResults.tenants.single.data.status_financial_id = "FIN-SUSPENDED";

    const res = await request(app)
      .post("/api/iam/roles")
      .set("Authorization", "Bearer valid")
      .send({ name: "Nuevo rol" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("FIN-001");
  });
});

describe("roles", () => {
  test("GET /roles 403 sin permiso de lectura", async () => {
    mockPermissions = { admin: false, readRoles: false, manageRoles: false, manageUsers: false };

    const res = await request(app).get("/api/iam/roles").set("Authorization", "Bearer valid");

    expect(res.status).toBe(403);
  });

  test("GET /roles 200 con permiso read y devuelve [] si data es null", async () => {
    mockPermissions = { admin: false, readRoles: true, manageRoles: false, manageUsers: false };
    mockTableResults.roles = { list: { data: null, error: null } };

    const res = await request(app).get("/api/iam/roles").set("Authorization", "Bearer valid");

    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual([]);
    expect(mockLastBuilders.roles.order).toHaveBeenCalledWith("hierarchy_level", { ascending: true });
  });

  test("GET /roles 500 si Supabase falla", async () => {
    mockTableResults.roles.list = { data: null, error: new Error("db down") };

    const res = await request(app).get("/api/iam/roles").set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
  });

  test("POST /roles 400 payload invalido y 403 sin manage", async () => {
    const invalid = await request(app).post("/api/iam/roles").set("Authorization", "Bearer valid").send({});

    mockPermissions = { admin: false, readRoles: true, manageRoles: false, manageUsers: false };
    const forbidden = await request(app)
      .post("/api/iam/roles")
      .set("Authorization", "Bearer valid")
      .send({ name: "Operador" });

    expect(invalid.status).toBe(400);
    expect(forbidden.status).toBe(403);
  });

  test("POST /roles 201 recorta nombre y usa hierarchy default", async () => {
    const res = await request(app)
      .post("/api/iam/roles")
      .set("Authorization", "Bearer valid")
      .send({ name: ` ${"A".repeat(130)} `, hierarchy_level: "no-int" });

    expect(res.status).toBe(201);
    expect(mockLastBuilders.roles.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "A".repeat(120), hierarchy_level: 100 })
    );
  });

  test("POST /roles 500 si insert falla", async () => {
    mockTableResults.roles.single = { data: null, error: new Error("insert failed") };

    const res = await request(app)
      .post("/api/iam/roles")
      .set("Authorization", "Bearer valid")
      .send({ name: "Operador" });

    expect(res.status).toBe(500);
  });

  test("PUT /roles 400 payload invalido, 404 sin data, 200 actualizado", async () => {
    const invalid = await request(app)
      .put("/api/iam/roles/role-1")
      .set("Authorization", "Bearer valid")
      .send({ name: "" });

    mockTableResults.roles.single = { data: null, error: null };
    const notFound = await request(app)
      .put("/api/iam/roles/role-1")
      .set("Authorization", "Bearer valid")
      .send({ name: "Editor" });

    mockTableResults.roles.single = { data: { id: "role-1", name: "Editor", hierarchy_level: 5 }, error: null };
    const ok = await request(app)
      .put("/api/iam/roles/role-1")
      .set("Authorization", "Bearer valid")
      .send({ name: " Editor ", hierarchy_level: 5 });

    expect(invalid.status).toBe(400);
    expect(notFound.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(mockLastBuilders.roles.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Editor", hierarchy_level: 5 })
    );
  });

  test("PUT /roles 500 si update falla", async () => {
    mockTableResults.roles.single = { data: null, error: new Error("update failed") };

    const res = await request(app)
      .put("/api/iam/roles/role-1")
      .set("Authorization", "Bearer valid")
      .send({ name: "Editor" });

    expect(res.status).toBe(500);
  });

  test("DELETE /roles 204 y 500 si delete falla", async () => {
    const ok = await request(app).delete("/api/iam/roles/role-1").set("Authorization", "Bearer valid");

    mockTableResults.roles = { list: { data: null, error: new Error("delete failed") } };
    const fail = await request(app).delete("/api/iam/roles/role-1").set("Authorization", "Bearer valid");

    expect(ok.status).toBe(204);
    expect(fail.status).toBe(500);
  });
});

describe("role permissions", () => {
  test("GET /roles/:roleId/permissions 200, 403 y 500", async () => {
    const ok = await request(app)
      .get("/api/iam/roles/role-1/permissions")
      .set("Authorization", "Bearer valid");

    mockPermissions = { admin: false, readRoles: false, manageRoles: false, manageUsers: false };
    const forbidden = await request(app)
      .get("/api/iam/roles/role-1/permissions")
      .set("Authorization", "Bearer valid");

    mockPermissions = { admin: true, readRoles: false, manageRoles: false, manageUsers: false };
    mockTableResults.role_permissions.list = { data: null, error: new Error("db down") };
    const fail = await request(app)
      .get("/api/iam/roles/role-1/permissions")
      .set("Authorization", "Bearer valid");

    expect(ok.status).toBe(200);
    expect(ok.body.permissions).toHaveLength(1);
    expect(forbidden.status).toBe(403);
    expect(fail.status).toBe(500);
  });

  test("POST /permissions 400, 201 y 500", async () => {
    const invalid = await request(app)
      .post("/api/iam/roles/role-1/permissions")
      .set("Authorization", "Bearer valid")
      .send({});

    const ok = await request(app)
      .post("/api/iam/roles/role-1/permissions")
      .set("Authorization", "Bearer valid")
      .send({ permission: ` ${"p".repeat(130)} ` });

    mockTableResults.role_permissions.single = { data: null, error: new Error("insert failed") };
    const fail = await request(app)
      .post("/api/iam/roles/role-1/permissions")
      .set("Authorization", "Bearer valid")
      .send({ permission: "settings.roles.read" });

    expect(invalid.status).toBe(400);
    expect(ok.status).toBe(201);
    expect(mockLastBuilders.role_permissions.insert).toHaveBeenCalledWith(
      expect.objectContaining({ permission: "settings.roles.read" })
    );
    expect(fail.status).toBe(500);
  });

  test("DELETE /permissions decodifica permission y maneja errores", async () => {
    const ok = await request(app)
      .delete("/api/iam/roles/role-1/permissions/settings.roles.read")
      .set("Authorization", "Bearer valid");

    mockTableResults.role_permissions = { list: { data: null, error: new Error("delete failed") } };
    const fail = await request(app)
      .delete("/api/iam/roles/role-1/permissions/settings.roles.read")
      .set("Authorization", "Bearer valid");

    expect(ok.status).toBe(204);
    expect(mockLastBuilders.role_permissions.eq).toHaveBeenCalledWith(
      "permission",
      "settings.roles.read"
    );
    expect(fail.status).toBe(500);
  });

  it("DELETE /permissions 403 sin permiso de gestion", async () => {
    mockPermissions = { admin: false, readRoles: true, manageRoles: false, manageUsers: false };

    const res = await request(app)
      .delete("/api/iam/roles/role-1/permissions/settings.roles.read")
      .set("Authorization", "Bearer valid");

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("IAM-003");
  });

  it("POST /permissions 500 si Supabase lanza antes de insertar", async () => {
    const originalFrom = serviceClient.from.getMockImplementation();
    serviceClient.from.mockImplementation((table) => {
      if (table === "role_permissions") {
        throw new Error("role permissions unavailable");
      }
      return originalFrom(table);
    });

    try {
      const res = await request(app)
        .post("/api/iam/roles/role-1/permissions")
        .set("Authorization", "Bearer valid")
        .send({ permission: "settings.roles.read" });

      expect(res.status).toBe(500);
      expect(res.body.error_code).toBe("IAM-004");
    } finally {
      serviceClient.from.mockImplementation(originalFrom);
    }
  });

  it("DELETE /permissions 500 si Supabase lanza antes de borrar", async () => {
    const originalFrom = serviceClient.from.getMockImplementation();
    serviceClient.from.mockImplementation((table) => {
      if (table === "role_permissions") {
        throw new Error("role permissions delete unavailable");
      }
      return originalFrom(table);
    });

    try {
      const res = await request(app)
        .delete("/api/iam/roles/role-1/permissions/settings.roles.read")
        .set("Authorization", "Bearer valid");

      expect(res.status).toBe(500);
      expect(res.body.error_code).toBe("IAM-004");
    } finally {
      serviceClient.from.mockImplementation(originalFrom);
    }
  });
});

describe("user role assignments", () => {
  test("GET /user-roles 403 sin permisos, 200 con filtro, 500 en error DB", async () => {
    mockPermissions = { admin: false, readRoles: false, manageRoles: false, manageUsers: false };
    const forbidden = await request(app).get("/api/iam/user-roles").set("Authorization", "Bearer valid");

    mockPermissions = { admin: false, readRoles: false, manageRoles: false, manageUsers: true };
    const ok = await request(app)
      .get("/api/iam/user-roles?user_id= user-2 ")
      .set("Authorization", "Bearer valid");

    mockTableResults.user_roles_sedes.list = { data: null, error: new Error("db down") };
    const fail = await request(app).get("/api/iam/user-roles").set("Authorization", "Bearer valid");

    expect(forbidden.status).toBe(403);
    expect(ok.status).toBe(200);
    expect(ok.body.assignments).toHaveLength(1);
    expect(mockLastBuilders.user_roles_sedes.eq).toHaveBeenCalledWith(
      "tenant_id",
      expect.any(String)
    );
    expect(fail.status).toBe(500);
  });

  test("POST /user-roles 403, 400, 201 y 500", async () => {
    mockPermissions = { admin: false, readRoles: true, manageRoles: false, manageUsers: false };
    const forbidden = await request(app)
      .post("/api/iam/user-roles")
      .set("Authorization", "Bearer valid")
      .send({ user_id: "user-2", role_id: "role-1", sede_id: "sede-1" });

    mockPermissions = { admin: true, readRoles: false, manageRoles: false, manageUsers: false };
    const invalid = await request(app)
      .post("/api/iam/user-roles")
      .set("Authorization", "Bearer valid")
      .send({ user_id: "user-2" });

    const ok = await request(app)
      .post("/api/iam/user-roles")
      .set("Authorization", "Bearer valid")
      .send({ user_id: "user-2", role_id: "role-1", sede_id: "sede-1" });

    mockTableResults.user_roles_sedes.single = { data: null, error: new Error("insert failed") };
    const fail = await request(app)
      .post("/api/iam/user-roles")
      .set("Authorization", "Bearer valid")
      .send({ user_id: "user-2", role_id: "role-1", sede_id: "sede-1" });

    expect(forbidden.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(ok.status).toBe(201);
    expect(fail.status).toBe(500);
  });

  test("DELETE /user-roles 403, 204 y 500", async () => {
    mockPermissions = { admin: false, readRoles: true, manageRoles: false, manageUsers: false };
    const forbidden = await request(app)
      .delete("/api/iam/user-roles/asig-1")
      .set("Authorization", "Bearer valid");

    mockPermissions = { admin: false, readRoles: false, manageRoles: true, manageUsers: false };
    const ok = await request(app)
      .delete("/api/iam/user-roles/asig-1")
      .set("Authorization", "Bearer valid");

    mockTableResults.user_roles_sedes = { list: { data: null, error: new Error("delete failed") } };
    const fail = await request(app)
      .delete("/api/iam/user-roles/asig-1")
      .set("Authorization", "Bearer valid");

    expect(forbidden.status).toBe(403);
    expect(ok.status).toBe(204);
    expect(fail.status).toBe(500);
  });

  test("500 si serviceClient.from lanza dentro de una ruta IAM", async () => {
    serviceClient.from.mockImplementationOnce(() => {
      throw new Error("db unavailable");
    });

    const res = await request(app).get("/api/iam/roles").set("Authorization", "Bearer valid");

    expect(res.status).toBe(500);
    expect(res.body.error_type).toBe("unexpected");
  });

  it("GET /user-roles 500 si Supabase lanza al listar asignaciones", async () => {
    mockPermissions = { admin: false, readRoles: true, manageRoles: false, manageUsers: false };
    const originalFrom = serviceClient.from.getMockImplementation();
    serviceClient.from.mockImplementation((table) => {
      if (table === "user_roles_sedes") {
        throw new Error("user roles list unavailable");
      }
      return originalFrom(table);
    });

    try {
      const res = await request(app)
        .get("/api/iam/user-roles")
        .set("Authorization", "Bearer valid");

      expect(res.status).toBe(500);
      expect(res.body.error_code).toBe("IAM-004");
    } finally {
      serviceClient.from.mockImplementation(originalFrom);
    }
  });

  it("POST /user-roles 500 si Supabase lanza antes de insertar asignacion", async () => {
    const originalFrom = serviceClient.from.getMockImplementation();
    serviceClient.from.mockImplementation((table) => {
      if (table === "user_roles_sedes") {
        throw new Error("user roles insert unavailable");
      }
      return originalFrom(table);
    });

    try {
      const res = await request(app)
        .post("/api/iam/user-roles")
        .set("Authorization", "Bearer valid")
        .send({ user_id: "user-2", role_id: "role-1", sede_id: "sede-1" });

      expect(res.status).toBe(500);
      expect(res.body.error_code).toBe("IAM-004");
    } finally {
      serviceClient.from.mockImplementation(originalFrom);
    }
  });

  it("DELETE /user-roles 500 si Supabase lanza antes de borrar asignacion", async () => {
    const originalFrom = serviceClient.from.getMockImplementation();
    serviceClient.from.mockImplementation((table) => {
      if (table === "user_roles_sedes") {
        throw new Error("user roles delete unavailable");
      }
      return originalFrom(table);
    });

    try {
      const res = await request(app)
        .delete("/api/iam/user-roles/asig-1")
        .set("Authorization", "Bearer valid");

      expect(res.status).toBe(500);
      expect(res.body.error_code).toBe("IAM-004");
    } finally {
      serviceClient.from.mockImplementation(originalFrom);
    }
  });
});
