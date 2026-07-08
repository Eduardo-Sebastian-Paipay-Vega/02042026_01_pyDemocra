import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createVolunteer,
  listVolunteers,
  deactivateVolunteer,
} from "./volunteers.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveActorId: vi.fn().mockResolvedValue("user-1"),
    createTenantScopedQuery: vi.fn().mockImplementation((query) => query),
    ongSchema: vi.fn(),
    publicSchema: vi.fn(),
    rrhhSchema: vi.fn(),
  };
});

describe("Personas Volunteers Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-074: createVolunteer falla con toFriendlyError si ensureVolunteerUniqueFields detecta duplicidad de DNI", async () => {
      // Mock fetchVolunteerCatalogs para que ensureVolunteerInputValid pase
      const publicSelectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [{ codigo: "DNI", nombre: "DNI" }], error: null }),
      });
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: publicSelectMock }),
      } as any);

      const rrhhSelectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(shared.rrhhSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: rrhhSelectMock }),
      } as any);

      // Mock ongSchema: ensureVolunteerUniqueFields primero y catalogs después o al revés?
      // ensureVolunteerInputValid se llama primero, lo que llama a fetchVolunteerCatalogs.
      // Luego ensureVolunteerUniqueFields llama a ongSchema().from("voluntarios")
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "estados_voluntario") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ codigo: "activo", nombre_estado: "Activo" }],
                error: null,
              }),
            }),
          };
        }
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
            neq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "existing-vol" }], // DUPLICADO ENCONTRADO
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(),
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
 eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        createVolunteer({
          firstName: "Juan",
          lastName: "Perez",
          documentType: "DNI",
          documentNumber: "12345678",
          stateCode: "activo",
          skills: [],
          operationalRoles: [],
          documents: [],
        } as any)
      ).rejects.toThrow(
        "No se pudo crear el voluntario. (Ya existe un voluntario con el mismo tipo y numero de documento.)"
      );
    });

    it("TST-ERR-075: createVolunteer falla con toFriendlyError si un rol operativo referenciado no existe en el catalogo real", async () => {
      // Mock catalogs
      const publicSelectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [{ codigo: "DNI", nombre: "DNI" }], error: null }),
      });
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: publicSelectMock }),
      } as any);

      const rrhhSelectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [{ id: "rol-valid", nombre_rol: "Rol Valido" }], // Solo hay un rol valido
          error: null,
        }),
      });
      vi.mocked(shared.rrhhSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: rrhhSelectMock }),
      } as any);

      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "estados_voluntario") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ codigo: "activo", nombre_estado: "Activo" }],
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(),
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
 limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        createVolunteer({
          firstName: "Juan",
          lastName: "Perez",
          documentType: "DNI",
          documentNumber: "12345678",
          stateCode: "activo",
          skills: [],
          operationalRoles: [
            { roleId: "rol-invalid" } // ROL INVALIDO
          ],
          documents: [],
        } as any)
      ).rejects.toThrow(
        "No se pudo crear el voluntario. (Se detecto un rol operativo inexistente.)"
      );
    });
  });

  describe("SAD PATHS: Network Failures", () => {
    it("TST-ERR-076: listVolunteers propaga error inmediatamente si fetchApprovedHoursByVolunteerId falla por caida de BD", async () => {
      // fetchApprovedHoursByVolunteerId llama a ongSchema().from('horas_actividad')...
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "horas_actividad") {
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

            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "503 DB offline en horas_actividad" },
            }),
          };
        }
        // Para los que usan order, deben devolver un mock que resuelva con exito (para no tapar el error q buscamos)
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      const publicSelectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: publicSelectMock }),
      } as any);

      const rrhhFromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      vi.mocked(shared.rrhhSchema).mockReturnValue({ from: rrhhFromMock } as any);

      await expect(listVolunteers()).rejects.toThrow("503 DB offline en horas_actividad");
    });
  });

  describe("SAD PATHS: Edge Cases Fallbacks", () => {
    it("TST-ERR-077: deactivateVolunteer falla sincronicamente si no se halla estado inactivo", async () => {
      // Mock fetchVolunteerCatalogs para que devuelva estados pero sin kind inactive ni other
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "estados_voluntario") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ codigo: "activo", nombre_estado: "Activo" }], // kind = 'active'
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(),
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
 eq: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      const publicSelectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(shared.publicSchema).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: publicSelectMock }),
      } as any);

      const rrhhFromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      vi.mocked(shared.rrhhSchema).mockReturnValue({ from: rrhhFromMock } as any);

      await expect(deactivateVolunteer("vol-123")).rejects.toThrow(
        "No existe un estado inactivo real en ong.estados_voluntario."
      );
    });
  });
});
