import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listSensitiveMedicalRecords,
  getSensitiveMedicalDetail,
  saveBeneficiaryMedicalRecord,
  getTodayClinicalAgenda,
} from "./medicalRecords.service";
import { clinicoSchema, ongSchema } from "../personas/shared";
import * as sharedPersona from "../personas/shared";
import { supabase } from "../../../supabaseClient";

// Mock global y de dependencias compartidas
vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn(),
  },
}));

vi.mock("../personas/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../personas/shared")>();
  return {
    ...actual,
    ensureSensitiveAccess: vi.fn(),
    getRequiredTenantId: vi.fn(),
    resolveSensitiveAccessState: vi.fn(),
    resolveProfileLabels: vi.fn(),
    createTenantScopedQuery: vi.fn(),
    clinicoSchema: vi.fn(),
    ongSchema: vi.fn(),
  };
});

describe("Medical Records Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Injections", () => {
    it("TST-ERR-001: Debe rechazar el listado si no hay acceso sensible (Token Expirado/Manipulado)", async () => {
      // Simular fallo de auth
      vi.mocked(sharedPersona.ensureSensitiveAccess).mockRejectedValueOnce(
        new Error("JWT expired or missing scopes")
      );

      await expect(listSensitiveMedicalRecords("beneficiaries")).rejects.toThrow(
        "JWT expired or missing scopes"
      );
    });

    it("TST-ERR-002: Debe bloquear guardado si tenantId no se puede resolver", async () => {
      vi.mocked(sharedPersona.ensureSensitiveAccess).mockResolvedValueOnce({
        currentUserId: "user-123",
      // @ts-ignore
      // @ts-ignore
        mode: "actor",
        isAuthorized: true,
      });
      // Fallo de infraestructura (sin tenant)
      vi.mocked(sharedPersona.getRequiredTenantId).mockRejectedValueOnce(
        new Error("Tenant resolution failed")
      );

      await expect(
        saveBeneficiaryMedicalRecord({
      // @ts-ignore
          beneficiaryId: "b-123",
      // @ts-ignore
          input: { accessReason: "test" },
        })
      ).rejects.toThrow("Tenant resolution failed");
    });
  });

  describe("SAD PATHS: Corrupt Payloads & Missing Data", () => {
    it("TST-ERR-003: Debe manejar gracefully cuando el accessReason esta vacio o es nulo (Inyeccion)", async () => {
      // @ts-ignore
      vi.mocked(sharedPersona.ensureSensitiveAccess).mockResolvedValueOnce({
        currentUserId: "user-123",
      // @ts-ignore
        mode: "actor",
        isAuthorized: true,
      });
      vi.mocked(sharedPersona.getRequiredTenantId).mockResolvedValueOnce("tenant-xyz");

      // reason = vacio / undefined
      await expect(
        getSensitiveMedicalDetail({
          scope: "beneficiaries",
          personId: "p-1",
          accessReason: "   ",
        })
      ).rejects.toThrow("Debes indicar un motivo de acceso para abrir la ficha sensible.");
    });
    
      // @ts-ignore
    it("TST-ERR-004: Debe retornar null si el personId viene corrupto o indefinido", async () => {
      vi.mocked(sharedPersona.ensureSensitiveAccess).mockResolvedValueOnce({
        currentUserId: "user-123",
      // @ts-ignore
        mode: "actor",
        isAuthorized: true,
      });
      vi.mocked(sharedPersona.getRequiredTenantId).mockResolvedValueOnce("tenant-xyz");

      const res = await getSensitiveMedicalDetail({
        scope: "beneficiaries",
        personId: "",
        accessReason: "Motivo valido",
      });

      expect(res).toBeNull();
    });
  });

      // @ts-ignore
  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-005: Debe capturar y propagar error si la red falla (503) durante listado", async () => {
      vi.mocked(sharedPersona.ensureSensitiveAccess).mockResolvedValueOnce({
        currentUserId: "user-123",
      // @ts-ignore
        mode: "actor",
        isAuthorized: true,
      });
      vi.mocked(sharedPersona.getRequiredTenantId).mockResolvedValueOnce("tenant-xyz");

      const mockSchemaChain = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn((payload) => {
          if (payload && typeof payload === 'object' && Object.values(payload).some(v => v === null)) {
            return Promise.resolve({ data: null, error: { message: 'null value in column violates not-null constraint', code: '23502' } });
          }
          return Promise.resolve({ data: { id: 'mock-id' }, error: null });
        }),
        update: vi.fn((payload) => {
          if (payload && typeof payload === 'object' && Object.values(payload).some(v => v === null)) {
            return Promise.resolve({ data: null, error: { message: 'null value in column violates not-null constraint', code: '23502' } });
          }
          return Promise.resolve({ data: { id: 'mock-id' }, error: null });
        }),

      };
      vi.mocked(sharedPersona.ongSchema).mockReturnValue(mockSchemaChain as any);
      vi.mocked(sharedPersona.clinicoSchema).mockReturnValue(mockSchemaChain as any);

      // Mockear cadena fluida fallando con Timeout / 503
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn((payload) => {
          if (payload && typeof payload === 'object' && Object.values(payload).some(v => v === null)) {
            return Promise.resolve({ data: null, error: { message: 'null value in column violates not-null constraint', code: '23502' } });
          }
          return Promise.resolve({ data: { id: 'mock-id' }, error: null });
        }),
        update: vi.fn((payload) => {
          if (payload && typeof payload === 'object' && Object.values(payload).some(v => v === null)) {
            return Promise.resolve({ data: null, error: { message: 'null value in column violates not-null constraint', code: '23502' } });
          }
          return Promise.resolve({ data: { id: 'mock-id' }, error: null });
        }),

        order: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "Failed to fetch: Network Error 503" } });
        }
      };
      
      vi.mocked(sharedPersona.createTenantScopedQuery).mockReturnValue(mockQuery as any);

      await expect(listSensitiveMedicalRecords("beneficiaries")).rejects.toThrow(
        "Failed to fetch: Network Error 503"
      );
    });
  });

  describe("HAPPY PATHS: Agenda and Medical Records", () => {
    it("TST-OK-001: getTodayClinicalAgenda should fetch and map today's activities correctly", async () => {
      vi.mocked(sharedPersona.getRequiredTenantId).mockResolvedValueOnce("tenant-xyz");

      const mockData = [
        {
          id: "act-1",
          titulo: "Consulta Psicológica",
          fecha_inicio: "2026-08-27T10:00:00.000Z",
          fecha_fin: "2026-08-27T11:00:00.000Z",
          codigo_estado: "PROGRAMADA",
        }
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };
      vi.mocked(sharedPersona.ongSchema).mockReturnValue(mockQuery as any);

      const agenda = await getTodayClinicalAgenda();

      expect(agenda).toBeDefined();
      expect(agenda.length).toBe(1);
      expect(agenda[0].titulo).toBe("Consulta Psicológica");
      expect(mockQuery.gte).toHaveBeenCalledWith("fecha_inicio", expect.any(String));
      expect(mockQuery.lte).toHaveBeenCalledWith("fecha_inicio", expect.any(String));
      expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "tenant-xyz");
    });
  });
});
