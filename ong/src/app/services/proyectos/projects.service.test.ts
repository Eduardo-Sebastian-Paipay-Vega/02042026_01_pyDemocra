import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProject,
  archiveProject,
} from "./projects.service";
import * as shared from "./shared";

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return {
    ...actual,
    getRequiredTenantId: vi.fn().mockResolvedValue("tenant-1"),
    resolveCurrentUserId: vi.fn().mockResolvedValue("user-1"),
    ongSchema: vi.fn(),
  };
});

describe("Proyectos Projects Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-085: createProject propaga error si el area seleccionada no existe", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "areas") {
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
            limit: vi.fn().mockResolvedValue({
              data: [], // Area no encontrada
              error: null,
            }),
          };
        }
        if (table === "estados_proyecto") {
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
            limit: vi.fn().mockResolvedValue({
              data: [{ codigo: "estado-1" }],
              error: null,
            }),
          };
        }
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
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        createProject({
          code: "PROJ-1",
          name: "Proyecto Test",
          description: "Desc",
          areaId: "area-1",
          stateCode: "estado-1",
          startDate: "2026-01-01",
          endDate: "2026-02-01",
      // @ts-ignore
      // @ts-ignore
          budget: 1000,
          imageUrl: "",
        })
      ).rejects.toThrow(
        "El area seleccionada no existe o no pertenece al tenant actual."
      );
    });

    it("TST-ERR-086: createProject propaga error si hay duplicidad de codigo de proyecto", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "areas") {
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
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "area-1" }],
              error: null,
            }),
          };
        }
        if (table === "estados_proyecto") {
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
            limit: vi.fn().mockResolvedValue({
              data: [{ codigo: "estado-1" }],
              error: null,
            }),
          };
        }
        if (table === "proyectos") {
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
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "proj-existente" }], // DUPLICADO ENCONTRADO
              error: null,
            }),
          };
        }
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
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(
        createProject({
          code: "PROJ-1",
          name: "Proyecto Test",
          description: "Desc",
          areaId: "area-1",
          stateCode: "estado-1",
          startDate: "2026-01-01",
      // @ts-ignore
          endDate: "2026-02-01",
      // @ts-ignore
          budget: 1000,
          imageUrl: "",
        })
      ).rejects.toThrow(
        "Ya existe un proyecto con ese codigo dentro del tenant."
      );
    });
  });

  describe("SAD PATHS: Edge Cases Fallbacks", () => {
    it("TST-ERR-087: archiveProject propaga error si no existen estados catalogados para archivar (estados vacio)", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "estados_proyecto") {
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

            order: vi.fn().mockResolvedValue({
              data: [], // Sin estados
              error: null,
            }),
          };
        }
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

        };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(archiveProject("proj-1")).rejects.toThrow(
        "No existe un estado catalogado para archivar proyectos."
      );
    });
  });
});
