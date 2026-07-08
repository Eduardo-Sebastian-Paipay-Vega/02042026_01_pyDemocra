import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotificationTemplatesData,
  createNotificationTemplate,
  updateNotificationTemplate,
} from "./templates.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    resolveNotificationCapabilities: vi.fn(),
    comunicacionesSchema: vi.fn(),
  };
});

describe("Notification Templates Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Auth Breaches & Capabilities", () => {
    it("TST-ERR-046: Debe bloquear creacion o actualizacion si no hay permisos de admin", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canManageTemplates: false,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      await expect(
        createNotificationTemplate({} as any)
      ).rejects.toThrow("No tienes acceso para crear plantillas.");

      await expect(
        updateNotificationTemplate({} as any)
      ).rejects.toThrow("No tienes acceso para editar plantillas.");
    });
  });

  describe("SAD PATHS: Injections & Corrupt Payloads", () => {
    it("TST-ERR-043: Debe rechazar variablesJson con sintaxis corrupta (evita cuelgues de JSON.parse)", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canManageTemplates: true,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      await expect(
        createNotificationTemplate({
          channelCode: "email",
          name: "Test",
          variablesJson: "{ corrupt: true", // JSON Invalido
        } as any)
      ).rejects.toThrow("`variables` debe contener JSON valido.");
    });

    it("TST-ERR-045: Debe rechazar creacion si el channelCode proveido no existe", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canManageTemplates: true,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

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

        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(shared.comunicacionesSchema).mockReturnValue({
        from: vi.fn().mockReturnValue(mockQuery),
      } as any);

      await expect(
        createNotificationTemplate({
          channelCode: "INEXISTENTE",
          name: "Test",
          variablesJson: "{}",
        } as any)
      ).rejects.toThrow("El canal seleccionado no existe en comunicaciones.canales_notificacion.");
    });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-044: Debe lanzar error controlado si la consulta maestra de plantillas cae", async () => {
      vi.mocked(shared.resolveNotificationCapabilities).mockResolvedValue({
        canReadTemplates: true,
        tenantId: "tenant-1",
        warnings: [],
      } as any);

      const mockFail = {
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
        order: vi.fn().mockReturnThis(),
        then: function (resolve: any) {
          resolve({ data: null, error: { message: "503 Network Timeout" } });
        },
      };

      vi.mocked(shared.comunicacionesSchema).mockImplementation(() => {
        return {
          from: (table: string) => {
            if (table === "plantillas_notificacion") return mockFail;
            // canals_notificacion
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

              order: vi.fn().mockReturnThis(),
              then: function (resolve: any) { resolve({ data: [], error: null }); },
            };
          },
        } as any;
      });

      await expect(
        getNotificationTemplatesData()
      ).rejects.toThrow("No se pudo conectar con la base de datos");
    });
  });
});
