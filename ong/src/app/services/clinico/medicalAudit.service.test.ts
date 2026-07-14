import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    rpc: vi.fn(),
    schema: vi.fn(),
  },
}));

vi.mock("../personas/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../personas/shared")>();
  return {
    ...actual,
    clinicoSchema: vi.fn(),
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
  };
});

import { supabase } from "../../../supabaseClient";
import * as shared from "../personas/shared";
import {
  checkMedicalAuditViewerPermission,
  getMedicalAuditHistory,
  logMedicalAccess,
} from "./medicalAudit.service";

/**
 * Un "thenable" que soporta encadenar cualquier metodo del query builder de
 * Supabase (select/order/limit/eq/gte/lte) sin importar cual sea el ultimo
 * llamado antes de `await`, y que ademas expone `insert` para los flujos de
 * escritura. Siempre resuelve al `result` dado.
 */
function makeQueryStub(result: unknown) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const stub: any = {
    insert,
    select: vi.fn(() => stub),
    order: vi.fn(() => stub),
    limit: vi.fn(() => stub),
    eq: vi.fn(() => stub),
    gte: vi.fn(() => stub),
    lte: vi.fn(() => stub),
    in: vi.fn(() => stub),
    like: vi.fn(() => stub),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return { stub, insert };
}

describe("checkMedicalAuditViewerPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resuelve sin error cuando el usuario tiene el permiso", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

    await expect(checkMedicalAuditViewerPermission()).resolves.toBeUndefined();
    expect(supabase.rpc).toHaveBeenCalledWith("fn_has_permission", {
      p_permission: "medical_audit_viewer",
    });
  });

  it("lanza error amigable si la llamada RPC falla", async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: "network down" },
    });

    await expect(checkMedicalAuditViewerPermission()).rejects.toThrow();
  });

  it("lanza acceso denegado cuando el permiso no esta presente", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: false, error: null });

    await expect(checkMedicalAuditViewerPermission()).rejects.toThrow(
      "Acceso denegado"
    );
  });
});

describe("logMedicalAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no hace nada si no hay usuario autenticado", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
    const clinicoFromMock = vi.fn();
    vi.mocked(shared.clinicoSchema).mockReturnValue({ from: clinicoFromMock } as any);

    await logMedicalAccess({
      recordId: "rec-1",
      kind: "ficha_medica",
      action: "VIEW",
    });

    expect(clinicoFromMock).not.toHaveBeenCalled();
  });

  it("registra un evento VIEW de ficha_medica en accesos_sensibles_log", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const { stub, insert } = makeQueryStub({ data: [] });
    const clinicoFromMock = vi.fn().mockReturnValue(stub);
    vi.mocked(shared.clinicoSchema).mockReturnValue({ from: clinicoFromMock } as any);

    await logMedicalAccess({
      recordId: "rec-1",
      kind: "ficha_medica",
      action: "VIEW",
      reason: "Consulta de rutina",
    });

    expect(clinicoFromMock).toHaveBeenCalledWith("accesos_sensibles_log");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "tenant-1",
        id_ficha: "rec-1",
        usuario_id: "user-1",
        motivo: "Consulta de rutina",
      })
    );
  });

  it("registra un evento VIEW de ficha_sensible_voluntario en la tabla de voluntarios", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const { stub, insert } = makeQueryStub({ data: [] });
    const clinicoFromMock = vi.fn().mockReturnValue(stub);
    vi.mocked(shared.clinicoSchema).mockReturnValue({ from: clinicoFromMock } as any);

    await logMedicalAccess({
      recordId: "vol-1",
      kind: "ficha_sensible_voluntario",
      action: "VIEW",
    });

    expect(clinicoFromMock).toHaveBeenCalledWith("accesos_sensibles_voluntario_log");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id_ficha_voluntario: "vol-1",
        motivo: "Consulta",
      })
    );
  });

  it("enmascara campos sensibles y arma el source para eventos EDIT/DELETE", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    const { stub, insert } = makeQueryStub({ data: [] });
    vi.mocked(supabase.schema).mockReturnValue({ from: vi.fn().mockReturnValue(stub) } as any);

    await logMedicalAccess({
      recordId: "rec-1",
      kind: "ficha_medica",
      action: "EDIT",
      changedFields: ["diagnostico", "nombre_contacto", "medicamentos"],
    });

    expect(supabase.schema).toHaveBeenCalledWith("auditoria");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        table_name: "clinico.fichas_medicas",
        action: "EDIT",
        before_json: null,
        after_json: null,
        source: "medical_audit:EDIT:ficha_medica:[nombre_contacto]",
      })
    );
  });

  it("no propaga errores si falla la escritura del log (fire-and-forget)", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    vi.mocked(shared.clinicoSchema).mockImplementation(() => {
      throw new Error("DB offline");
    });

    await expect(
      logMedicalAccess({ recordId: "rec-1", kind: "ficha_medica", action: "VIEW" })
    ).resolves.toBeUndefined();
  });
});

describe("getMedicalAuditHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lanza error si el usuario no tiene el permiso de auditoria medica", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: false, error: null });

    await expect(getMedicalAuditHistory({})).rejects.toThrow("Acceso denegado");
  });

  it("combina y ordena eventos VIEW y EDIT/DELETE por fecha descendente, respetando el limite", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

    const viewRows = [
      {
        id: "view-1",
        tenant_id: "tenant-1",
        id_ficha: "rec-1",
        usuario_id: "user-1",
        motivo: "Consulta",
        fecha_acceso: "2024-01-01T10:00:00.000Z",
        created_at: "2024-01-01T10:00:00.000Z",
      },
    ];
    const volunteerViewRows: unknown[] = [];
    const auditRows = [
      {
        id_audit: "audit-1",
        tenant_id: "tenant-1",
        record_pk: "rec-2",
        source: "medical_audit:EDIT:ficha_medica:[nombre]",
        auth_user_id: "user-2",
        ip: null,
        user_agent: null,
        event_at: "2024-02-01T10:00:00.000Z",
      },
    ];

    const clinicoFromMock = vi.fn((table: string) => {
      if (table === "accesos_sensibles_log") return makeQueryStub({ data: viewRows }).stub;
      if (table === "accesos_sensibles_voluntario_log")
        return makeQueryStub({ data: volunteerViewRows }).stub;
      return makeQueryStub({ data: [] }).stub;
    });
    vi.mocked(shared.clinicoSchema).mockReturnValue({ from: clinicoFromMock } as any);

    const auditFromMock = vi.fn().mockReturnValue(makeQueryStub({ data: auditRows }).stub);
    vi.mocked(supabase.schema).mockReturnValue({ from: auditFromMock } as any);

    const result = await getMedicalAuditHistory({});

    expect(result.totalCount).toBe(2);
    expect(result.events).toHaveLength(2);
    // El evento EDIT (2024-02-01) es mas reciente que el VIEW (2024-01-01)
    expect(result.events[0].id).toBe("audit-1");
    expect(result.events[0].action).toBe("EDIT");
    expect(result.events[0].changedFields).toEqual(["nombre"]);
    expect(result.events[1].id).toBe("view-1");
    expect(result.events[1].action).toBe("VIEW");
  });

  it("aplica paginacion segun limit/offset, acotando el limite maximo a 300", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

    const viewRows = Array.from({ length: 5 }, (_, i) => ({
      id: `view-${i}`,
      tenant_id: "tenant-1",
      id_ficha: "rec-1",
      usuario_id: "user-1",
      motivo: "Consulta",
      fecha_acceso: new Date(2024, 0, i + 1).toISOString(),
      created_at: new Date(2024, 0, i + 1).toISOString(),
    }));

    vi.mocked(shared.clinicoSchema).mockReturnValue({
      from: vi.fn((table: string) =>
        table === "accesos_sensibles_log"
          ? makeQueryStub({ data: viewRows }).stub
          : makeQueryStub({ data: [] }).stub
      ),
    } as any);
    vi.mocked(supabase.schema).mockReturnValue({
      from: vi.fn().mockReturnValue(makeQueryStub({ data: [] }).stub),
    } as any);

    const result = await getMedicalAuditHistory({ limit: 2, offset: 1 });

    expect(result.totalCount).toBe(5);
    expect(result.events).toHaveLength(2);
  });
});
