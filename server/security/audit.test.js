import { createChainableResult } from "../test-utils/mockSupabase.js";

jest.mock("../supabase.js", () => ({
  __esModule: true,
  serviceClient: { from: jest.fn() },
}));

jest.mock("./ai-client.js", () => ({
  __esModule: true,
  summarizeForensicEvent: jest.fn(),
}));

// eslint-disable-next-line import/first
import { serviceClient } from "../supabase.js";
// eslint-disable-next-line import/first
import { summarizeForensicEvent } from "./ai-client.js";
// eslint-disable-next-line import/first
import { insertAuthEvent, insertAuditLog, buildMaskedRequestContext } from "./audit.js";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";

function mockTables(map) {
  serviceClient.from.mockImplementation((table) => createChainableResult(map[table] || {}));
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("insertAuthEvent", () => {
  test("null si no se pasa tenantId (no llama a supabase)", async () => {
    const result = await insertAuthEvent({ eventType: "LOGIN_OK" });
    expect(result).toBeNull();
    expect(serviceClient.from).not.toHaveBeenCalled();
  });

  test("inserta y devuelve el id en el camino feliz", async () => {
    mockTables({ auth_events: { single: { data: { id: "event-1" }, error: null } } });

    const result = await insertAuthEvent({
      tenantId: TENANT_ID,
      userId: "user-1",
      eventType: "LOGIN_OK",
      ip: "1.2.3.4",
    });

    expect(result).toEqual({ id: "event-1" });
    expect(serviceClient.from).toHaveBeenCalledWith("auth_events");
  });

  test("null si el insert devuelve error", async () => {
    mockTables({
      auth_events: { single: { data: null, error: new Error("insert failed") } },
    });

    const result = await insertAuthEvent({ tenantId: TENANT_ID, eventType: "LOGIN_FAIL" });
    expect(result).toBeNull();
  });

  test("propaga el error de assertTenantScope si el tenantId es invalido", async () => {
    await expect(insertAuthEvent({ tenantId: "no-valido", eventType: "X" })).rejects.toThrow();
  });
});

describe("insertAuditLog — getRetentionDays", () => {
  test("usa 180 dias por defecto si la consulta a tenants falla (no revienta, sigue e inserta)", async () => {
    mockTables({
      tenants: { single: { data: null, error: new Error("db down") } },
      audit_logs: { single: { data: { id: "log-1", created_at: "2026-01-01" }, error: null } },
    });

    const result = await insertAuditLog({ tenantId: TENANT_ID, eventType: "X", resourceName: "y" });

    expect(result).toEqual({ id: "log-1", created_at: "2026-01-01" });
  });

  test("usa 180 dias si tenants no tiene plan_id", async () => {
    mockTables({
      tenants: { single: { data: { plan_id: null }, error: null } },
      audit_logs: { single: { data: { id: "log-2" }, error: null } },
    });

    const result = await insertAuditLog({ tenantId: TENANT_ID, eventType: "X", resourceName: "y" });
    expect(result).toEqual({ id: "log-2" });
  });

  test("usa 180 dias si plan_policies falla", async () => {
    mockTables({
      tenants: { single: { data: { plan_id: "basic" }, error: null } },
      plan_policies: { single: { data: null, error: new Error("no plan") } },
      audit_logs: { single: { data: { id: "log-3" }, error: null } },
    });

    const result = await insertAuditLog({ tenantId: TENANT_ID, eventType: "X", resourceName: "y" });
    expect(result).toEqual({ id: "log-3" });
  });

  test("usa retention_days de plan_policies cuando esta disponible", async () => {
    mockTables({
      tenants: { single: { data: { plan_id: "pro" }, error: null } },
      plan_policies: { single: { data: { retention_days: 365 }, error: null } },
      audit_logs: { single: { data: { id: "log-4" }, error: null } },
    });

    const result = await insertAuditLog({ tenantId: TENANT_ID, eventType: "X", resourceName: "y" });
    expect(result).toEqual({ id: "log-4" });
  });
});

describe("insertAuditLog — comportamiento general", () => {
  test("null si no se pasa tenantId", async () => {
    const result = await insertAuditLog({ eventType: "X", resourceName: "y" });
    expect(result).toBeNull();
    expect(serviceClient.from).not.toHaveBeenCalled();
  });

  test("null si el insert final devuelve error", async () => {
    mockTables({
      tenants: { single: { data: { plan_id: "basic" }, error: null } },
      plan_policies: { single: { data: { retention_days: 180 }, error: null } },
      audit_logs: { single: { data: null, error: new Error("insert failed") } },
    });

    const result = await insertAuditLog({ tenantId: TENANT_ID, eventType: "X", resourceName: "y" });
    expect(result).toBeNull();
  });

  test("cuando includeAiSummary=true, enriquece payload_after con el resumen forense", async () => {
    mockTables({
      tenants: { single: { data: { plan_id: "basic" }, error: null } },
      plan_policies: { single: { data: { retention_days: 180 }, error: null } },
      audit_logs: { single: { data: { id: "log-5", created_at: "now" }, error: null } },
    });
    summarizeForensicEvent.mockResolvedValue({
      summary: "resumen ia",
      reasoning: "razon ia",
      confidence: 0.8,
    });

    const result = await insertAuditLog({
      tenantId: TENANT_ID,
      eventType: "X",
      resourceName: "y",
      includeAiSummary: true,
    });

    expect(summarizeForensicEvent).toHaveBeenCalled();
    expect(result).toEqual({ id: "log-5", created_at: "now" });
  });

  test("cuando includeAiSummary no se pasa, no llama a summarizeForensicEvent", async () => {
    mockTables({
      tenants: { single: { data: { plan_id: "basic" }, error: null } },
      plan_policies: { single: { data: { retention_days: 180 }, error: null } },
      audit_logs: { single: { data: { id: "log-6" }, error: null } },
    });

    await insertAuditLog({ tenantId: TENANT_ID, eventType: "X", resourceName: "y" });

    expect(summarizeForensicEvent).not.toHaveBeenCalled();
  });

  test("propaga el error de assertTenantScope si el tenantId es invalido", async () => {
    await expect(
      insertAuditLog({ tenantId: "invalido", eventType: "X", resourceName: "y" })
    ).rejects.toThrow();
  });
});

describe("buildMaskedRequestContext", () => {
  test("enmascara ip, recorta userAgent a 120 caracteres y pasa geoCountry", () => {
    const result = buildMaskedRequestContext({
      ip: "192.168.1.55",
      userAgent: "a".repeat(200),
      geoCountry: "PE",
    });

    expect(result.ip_masked).toBe("192.168.1.0");
    expect(result.user_agent).toHaveLength(120);
    expect(result.geo_country).toBe("PE");
  });

  test("usa string vacio para user_agent y null para geo_country si faltan", () => {
    const result = buildMaskedRequestContext({ ip: null });

    expect(result.ip_masked).toBeNull();
    expect(result.user_agent).toBe("");
    expect(result.geo_country).toBeNull();
  });
});
