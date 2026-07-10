import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createIdCardTemplate,
  createIdCard,
  listIdCardWorkspace,
} from "./idCards.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    resolveCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    createTenantScopedQuery: vi.fn().mockImplementation((query) => query),
    ongSchema: vi.fn(),
    publicSchema: vi.fn(),
    peopleDb: {
      rpc: vi.fn(),
    },
  };
});

describe("Personas IdCards Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock para que isTenantAdmin() o hasPermission() pasen (para idCardCapabilities)
    vi.mocked(shared.peopleDb.rpc).mockResolvedValue({ data: true, error: null } as any);
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-071: createIdCardTemplate falla si se envia foto sin ancho y alto validos", async () => {
      // Mock capabilities para pasar ensureIdCardManageAccess
      const rpcMock = vi.fn().mockResolvedValue({ data: true, error: null });
      shared.peopleDb.rpc = rpcMock as any;

      vi.mocked(shared.ongSchema).mockReturnValue({
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

        limit: vi.fn().mockResolvedValue({ data: [{ id: "tpl-1" }], error: null }),
      } as any);

      await expect(
        createIdCardTemplate({
          name: "Plantilla 1",
          baseImageUrl: "data:image/png;base64,...",
          templateWidth: 1000,
          templateHeight: 600,
          isActive: true,
          fields: [
            { fieldKey: "foto", posX: 0, posY: 0, width: null as any, height: null as any, zIndex: 1 },
          ],
          templateConfig: {},
        })
      ).rejects.toThrow(
        "No se pudo crear la plantilla de credencial. (El campo Foto requiere ancho y alto.)"
      );
    });

    it("TST-ERR-072: createIdCard falla con toFriendlyError si el voluntario ya tiene credencial", async () => {
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

      // Mocks para ongSchema
      // Necesitamos simular 4 consultas dentro de ensureCardInputValid:
      // 1. voluntarios (maybeSingle) -> existe
      // 2. id_card_templates (maybeSingle) -> existe
      // 3. id_cards (duplicateCode) -> no existe
      // 4. id_cards (duplicateVolunteer) -> EXISTE
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "voluntarios") {
          return {
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
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "vol-1", numero_documento: "12345678" },
              error: null,
            }),
          };
        }
        if (table === "id_card_templates") {
          return {
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
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "tpl-1", activa: true },
              error: null,
            }),
          };
        }
        if (table === "id_cards") {
          return {
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

            eq: vi.fn().mockImplementation(function(this: any, col: string) {
              this.currentEq = col;
              return this;
            }),
            limit: vi.fn().mockImplementation(function(this: any) {
              if (this.currentEq === "card_code") {
                return Promise.resolve({ data: [], error: null }); // No duplicate code
              }
              if (this.currentEq === "id_voluntario") {
                return Promise.resolve({ data: [{ id: "card-1" }], error: null }); // DUPLICATE VOLUNTEER
              }
              return Promise.resolve({ data: [], error: null });
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        createIdCard({
          volunteerId: "vol-1",
          templateId: "tpl-1",
          cardCode: "CODE123",
          stateCode: "activa",
        })
      ).rejects.toThrow(
        "No se pudo emitir la credencial. (El voluntario ya tiene una credencial emitida. Edita la existente o revocala.)"
      );
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-073: listIdCardWorkspace falla y propaga la excepcion si fetchVolunteerMaps devuelve error 503", async () => {
      // Mock para templates, fields y cards que pasen bien (sin error)
      // Y un mock para voluntarios que devuelva error
      const orderTemplateMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const orderCardMock = vi.fn().mockResolvedValue({ data: [], error: null });
      
      const orderVolunteerMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "503 Fetch Volunteer Catalog Offline" },
      });
      // El query_voluntarios tiene order('apellido').order('nombre')
      const orderVolMock1 = vi.fn().mockReturnValue({ order: orderVolunteerMock });

      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "id_card_templates") {
          return {
            select: vi.fn().mockReturnValue({ order: orderTemplateMock }),
          };
        }
        if (table === "id_card_template_fields") {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "id_cards") {
          return {
            select: vi.fn().mockReturnValue({ order: orderCardMock }),
          };
        }
        if (table === "voluntarios") {
          return {
            select: vi.fn().mockReturnValue({ order: orderVolMock1 }),
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      const publicFromMock = vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      vi.mocked(shared.publicSchema).mockReturnValue({ from: publicFromMock } as any);

      await expect(listIdCardWorkspace()).rejects.toThrow("503 Fetch Volunteer Catalog Offline");
    });
  });
});
