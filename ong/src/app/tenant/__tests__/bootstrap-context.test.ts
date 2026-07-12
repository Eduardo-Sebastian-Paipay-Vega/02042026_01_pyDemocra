/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "../../../supabaseClient";
import {
  bootstrapTenantContext,
  invalidateTenantBootstrapCache,
} from "../bootstrap";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    schema: vi.fn(),
    rpc: vi.fn(),
  },
}));

const mockAuthUser = { id: "u1", email: "test@test.com" };
const mockProfile = { id: "p1", tenant_id: "t1", full_name: "Test", avatar_url: null };

/** Construye el mock de `publicSchema().from(table)` para un set de tablas dado. */
function buildFromMock(overrides: Record<string, any>) {
  return vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: overrides.profile ?? mockProfile }) }) }) };
    }
    if (table === "tenants") {
      return { select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: overrides.tenant }) }) }) };
    }
    if (table === "user_roles_sedes") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ limit: vi.fn().mockResolvedValue(overrides.roleAssignments ?? { data: [] }) }),
          }),
        }),
      };
    }
    if (table === "roles") {
      return { select: () => ({ eq: () => ({ in: vi.fn().mockResolvedValue(overrides.roles ?? { data: [] }) }) }) };
    }
    if (table === "sedes") {
      return { select: () => ({ eq: () => ({ in: vi.fn().mockResolvedValue(overrides.sedes ?? { data: [] }) }) }) };
    }
    if (table === "tenant_modules") {
      return { select: () => ({ eq: () => ({ limit: vi.fn().mockResolvedValue(overrides.tenantModules ?? { data: [] }) }) }) };
    }
    throw new Error(`Tabla no mockeada en el test: ${table}`);
  });
}

function mockStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

describe("bootstrapTenantContext — casos no cubiertos por la suite existente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = mockStorage();
    Object.defineProperty(window, "localStorage", { value: storage, writable: true });
    Object.defineProperty(global, "localStorage", { value: storage, writable: true });
    invalidateTenantBootstrapCache();
    (supabase.rpc as any).mockResolvedValue({ data: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TST-ERR-233: status 'missing_tenant' cuando el perfil no tiene tenant_id", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({ profile: { ...mockProfile, tenant_id: null } }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("missing_tenant");
  });

  it("TST-ERR-234: status 'unsupported_industry' si el tenant no es de industria 'ong'", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({
        tenant: { id: "t1", name: "Gym Co", industry_type_id: "gym", plan_id: "p", status_financial_id: "FIN-ACTIVE" },
      }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("unsupported_industry");
    expect(res.context?.tenant.industryTypeId).toBe("gym");
  });

  it("TST-ERR-235: resuelve modulos explicitos via tenant_modules, incluyendo el fallback implicito de ONG", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({
        tenant: { id: "t1", name: "ONG Test", industry_type_id: "ong", plan_id: "p", status_financial_id: "FIN-ACTIVE" },
        tenantModules: { data: [{ module_code: "ong", status_code: "enabled" }] },
      }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("ready");
    expect(res.context?.modulePolicy).toBe("explicit");
    // "ong" habilitado explicitamente -> los child modules (ej. "projects") heredan acceso implicito.
    expect(res.context?.modules.ong).toBe(true);
    expect(res.context?.modules.projects).toBe(true);
  });

  it("TST-ERR-236: resuelve asignaciones de rol con nombres, y usa el id crudo si no encuentra el nombre", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({
        tenant: { id: "t1", name: "ONG Test", industry_type_id: "ong", plan_id: "p", status_financial_id: "FIN-ACTIVE" },
        roleAssignments: { data: [{ role_id: "r1", sede_id: "s1" }, { role_id: "r2", sede_id: "s2" }] },
        roles: { data: [{ id: "r1", name: "Coordinador" }] }, // r2 sin nombre resuelto
        sedes: { data: [{ id: "s1", name: "Sede Central" }] }, // s2 sin nombre resuelto
      }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("ready");
    expect(res.context?.roleAssignments).toEqual([
      { roleId: "r1", roleName: "Coordinador", sedeId: "s1", sedeName: "Sede Central" },
      { roleId: "r2", roleName: "r2", sedeId: "s2", sedeName: "s2" },
    ]);
  });

  it("TST-ERR-237: propaga como warning (sin abortar) el fallo al resolver roles/sedes", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({
        tenant: { id: "t1", name: "ONG Test", industry_type_id: "ong", plan_id: "p", status_financial_id: "FIN-ACTIVE" },
        roleAssignments: { data: [{ role_id: "r1", sede_id: "s1" }] },
        roles: { data: null, error: new Error("roles unreachable") },
      }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("ready");
    expect(res.context?.roleAssignments).toEqual([]);
    expect(res.warnings.some((w) => w.includes("roles unreachable"))).toBe(true);
  });

  it("TST-ERR-238: resuelve la politica financiera de suspension (FIN-SUSPENDED)", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({
        tenant: { id: "t1", name: "ONG Test", industry_type_id: "ong", plan_id: "p", status_financial_id: "FIN-SUSPENDED" },
      }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("ready");
    expect(res.context?.financialPolicy.isSuspended).toBe(true);
    expect(res.context?.financialPolicy.isReadOnly).toBe(true);
  });

  it("TST-ERR-239: resuelve la politica financiera de periodo de gracia (FIN-GRACE)", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({
      from: buildFromMock({
        tenant: { id: "t1", name: "ONG Test", industry_type_id: "ong", plan_id: "p", status_financial_id: "FIN-GRACE" },
      }),
    });

    const res = await bootstrapTenantContext();
    expect(res.status).toBe("ready");
    expect(res.context?.financialPolicy.isSuspended).toBe(false);
    expect(res.context?.financialPolicy.isReadOnly).toBe(false);
    expect(res.context?.financialPolicy.message).toMatch(/periodo de gracia/i);
  });

  it("TST-ERR-240: la segunda llamada usa la cache en memoria sin volver a llamar a Supabase", async () => {
    const fromMock = buildFromMock({
      tenant: { id: "t1", name: "ONG Test", industry_type_id: "ong", plan_id: "p", status_financial_id: "FIN-ACTIVE" },
    });
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockAuthUser } });
    (supabase.schema as any).mockReturnValue({ from: fromMock });

    const first = await bootstrapTenantContext();
    expect(first.status).toBe("ready");
    const callsAfterFirst = fromMock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    const second = await bootstrapTenantContext();
    expect(second).toBe(first);
    expect(fromMock.mock.calls.length).toBe(callsAfterFirst); // 0 llamadas nuevas
  });
});
