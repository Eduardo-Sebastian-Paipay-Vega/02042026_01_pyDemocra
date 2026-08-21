import request from "supertest";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

let mockAuthMode;
let mockUserTenantId;
let mockIsAdmin;
let mockLastBuilders;

function mockCreateQueryBuilder() {
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn((col, val) => {
      builder._eqs = builder._eqs || {};
      builder._eqs[col] = val;
      return builder;
    }),
    order: jest.fn(() => builder),
    single: jest.fn(() => builder),
    then: (resolve) => resolve({ data: { id: "res-123", name: "Sede A" }, error: null }),
  };
  return builder;
}

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: {
    from: jest.fn((table) => {
      const builder = mockCreateQueryBuilder();
      mockLastBuilders[table] = builder;
      return builder;
    }),
  },
  resolveAuthContext: jest.fn(async (token) => {
    if (!token || token === "unauthenticated") {
      return { error: new Error("invalid token") };
    }
    return {
      user: { id: "user-tenant-a" },
      profile: { tenant_id: mockUserTenantId },
      userClient: {
        rpc: jest.fn(async (fnName) => {
          if (fnName === "fn_is_tenant_admin") return { data: mockIsAdmin, error: null };
          return { data: false, error: null };
        }),
      },
    };
  }),
}));

import app from "../index.js";

describe("Multi-Tenant & Authorization Security Suite (P1 / P8 Validation)", () => {
  beforeEach(() => {
    mockAuthMode = "valid";
    mockUserTenantId = TENANT_A;
    mockIsAdmin = true;
    mockLastBuilders = {};
  });

  test("TEST 1 & 2: User from Tenant A cannot modify resource in Tenant B via forged ID", async () => {
    const res = await request(app)
      .put("/api/sedes/sede-tenant-b")
      .set("Authorization", "Bearer valid-token-tenant-a")
      .send({ name: "Renamed Sede" });

    // The backend uses applyTenantScope, forcing .eq("tenant_id", TENANT_A)
    const sedesBuilder = mockLastBuilders["sedes"];
    expect(sedesBuilder).toBeDefined();
    expect(sedesBuilder.eq).toHaveBeenCalledWith("tenant_id", TENANT_A);
    expect(sedesBuilder._eqs["tenant_id"]).toBe(TENANT_A);
  });

  test("TEST 3: User from Tenant A cannot delete resource in Tenant B", async () => {
    await request(app)
      .delete("/api/sedes/sede-tenant-b")
      .set("Authorization", "Bearer valid-token-tenant-a");

    const sedesBuilder = mockLastBuilders["sedes"];
    expect(sedesBuilder).toBeDefined();
    expect(sedesBuilder.eq).toHaveBeenCalledWith("tenant_id", TENANT_A);
  });

  test("TEST 4: Non-admin user cannot perform administrative action (create Sede)", async () => {
    mockIsAdmin = false;

    const res = await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid-token-tenant-a")
      .send({ name: "Nueva Sede" });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("IAM-003");
  });

  test("TEST 5: Server ignores client-supplied tenant_id in body/params and forces authenticated tenant_id", async () => {
    await request(app)
      .post("/api/sedes")
      .set("Authorization", "Bearer valid-token-tenant-a")
      .send({ name: "Sede Test", tenant_id: TENANT_B });

    const sedesBuilder = mockLastBuilders["sedes"];
    expect(sedesBuilder).toBeDefined();
    // The insert data must be scoped to TENANT_A (user's real tenant)
    expect(sedesBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_A,
      })
    );
  });

  test("TEST 6: Unauthenticated API call bypasses UI and gets rejected at backend boundary", async () => {
    const res = await request(app)
      .get("/api/sedes")
      .set("Authorization", "Bearer unauthenticated");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});
