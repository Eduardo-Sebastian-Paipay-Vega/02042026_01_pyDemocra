import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBeneficiary,
  updateBeneficiary,
  listBeneficiaries,
} from "./beneficiaries.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    createTenantScopedQuery: vi.fn().mockImplementation((query) => query),
    ongSchema: vi.fn(),
    clinicoSchema: vi.fn(),
    publicSchema: vi.fn(),
  };
});

describe("Personas Beneficiaries Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-067: createBeneficiary propaga toFriendlyError si hay duplicidad de documento", async () => {
      // Mock para document options y demás para que fetchBeneficiaryCatalogs() pase
      const publicQueryMock = {
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

        order: vi.fn().mockResolvedValue({
          data: [{ codigo: "DNI", nombre: "DNI" }],
          error: null,
        }),
      };
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(publicQueryMock),
      } as any);

      // Mock para duplicidad en ensureBeneficiaryUniqueFields
      const ongQueryMock = {
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

        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "existing-ben" }], // Existe uno
          error: null,
        }),
      };
      vi.mocked(shared.ongSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(ongQueryMock),
      } as any);

      await expect(
        createBeneficiary({
          firstName: "Juan",
          lastName: "Perez",
          documentType: "DNI",
          documentNumber: "12345678",
          profileKind: "general",
        })
      ).rejects.toThrow(
        "No se pudo crear el beneficiario. (Ya existe un beneficiario con el mismo tipo y numero de documento.)"
      );
    });

    it("TST-ERR-068: updateBeneficiary falla si se ingresa tipo de perfil child pero no se adjunta nombre del tutor", async () => {
      // Mock catalogs
      const publicQueryMock = {
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

        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(publicQueryMock),
      } as any);

      await expect(
        updateBeneficiary("ben-1", {
          firstName: "Pedrito",
          lastName: "Gomez",
          profileKind: "child",
          childProfile: { tutorName: "" }, // Faltante intencional
        })
      ).rejects.toThrow(
        "No se pudo actualizar el beneficiario. (El perfil de nino requiere nombre del tutor.)"
      );
    });

    it("TST-ERR-069: createBeneficiary falla si no se envia firstName o lastName", async () => {
      // Mock catalogs
      const publicQueryMock = {
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

        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(publicQueryMock),
      } as any);

      await expect(
        createBeneficiary({
          firstName: "   ", // Espacios en blanco
          lastName: "Perez",
          profileKind: "general",
        })
      ).rejects.toThrow(
        "No se pudo crear el beneficiario. (El nombre del beneficiario es obligatorio.)"
      );
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-070: listBeneficiaries propaga el error inmediatamente si falla la consulta base a la BD", async () => {
      // Mock publicSchema
      const publicQueryMock = {
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

        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(publicQueryMock),
      } as any);

      const order2Mock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "503 DB Offline" },
      });
      const order1Mock = vi.fn().mockReturnValue({
        order: order2Mock,
      });

      const ongQueryMock = {
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

        order: order1Mock,
      };
      // Pero 'participaciones_proyecto' sí funcionaría
      ongQueryMock.select.mockReturnValueOnce(ongQueryMock); // beneficiarios
      const participacionesMock = {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "beneficiarios") return ongQueryMock;
        if (table === "participaciones_proyecto") return participacionesMock;
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      const clinicoQueryMock = {
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

        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      // Para queries que no tienen order (como perfil_nino)
      clinicoQueryMock.select.mockResolvedValue({ data: [], error: null });
      // Para el que sí tiene order (fichas_medicas)
      clinicoQueryMock.select.mockReturnValueOnce(clinicoQueryMock);
      clinicoQueryMock.select.mockReturnValueOnce(clinicoQueryMock);
      // Wait, there are 3 clinico queries:
      // 1: perfil_nino (no order) -> resolved
      // 2: perfil_adulto_mayor (no order) -> resolved
      // 3: fichas_medicas (order) -> return mock object with order
      const clinicoFromMock = vi.fn().mockImplementation((table) => {
        if (table === "fichas_medicas") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      vi.mocked(shared.clinicoSchema).mockReturnValue({
        from: clinicoFromMock,
      } as any);

      await expect(listBeneficiaries()).rejects.toThrow("503 DB Offline");
    });
  });
});
