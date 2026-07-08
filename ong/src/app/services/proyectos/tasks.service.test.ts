import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTask,
  cancelTask,
} from "./tasks.service";
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

describe("Proyectos Tasks Service - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SAD PATHS: Injections & Blocked Logic", () => {
    it("TST-ERR-088: createTask propaga error si la actividad no existe", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "actividades") {
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
              data: [], // No se encontro
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
        createTask({
          activityId: "act-1",
          title: "Tarea Test",
          description: "Desc",
          statusCode: "pendiente",
          deadline: "2026-01-01",
        })
      ).rejects.toThrow(
        "La actividad seleccionada no existe o no pertenece al tenant actual."
      );
    });
  });

  describe("SAD PATHS: Edge Cases Fallbacks", () => {
    it("TST-ERR-089: cancelTask propaga toProjectsError si falla el update", async () => {
      const ongFromMock = vi.fn().mockImplementation((table) => {
        if (table === "tareas") {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Error al actualizar (timeout)" },
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });
      vi.mocked(shared.ongSchema).mockReturnValue({ from: ongFromMock } as any);

      await expect(cancelTask("task-1")).rejects.toThrow(
        "Error al actualizar (timeout)"
      );
    });
  });
});
