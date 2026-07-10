import { describe, it, expect, vi, beforeEach } from "vitest";
import { listCursos, createCurso, enrollVolunteer, listInscripcionesByCurso, updateInscripcion, listCertificadosByCurso } from "./cursos.service";
import { getRequiredTenantId, resolveCurrentUserId } from "../operacion/shared";

// Mocks
vi.mock("../operacion/shared", () => ({
  getRequiredTenantId: vi.fn().mockResolvedValue("tenant-123"),
  resolveCurrentUserId: vi.fn().mockResolvedValue("user-123"),
  toFriendlyError: vi.fn((err, msg) => msg),
  normalizeText: vi.fn((str) => str?.toLowerCase().trim() ?? ""),
}));

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    schema: vi.fn().mockReturnThis(),
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
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  },
}));

import { supabase } from "../../../supabaseClient";

describe("Cursos Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCursos", () => {
    it("debe listar cursos correctamente y aplicar busqueda", async () => {
      const mockData = [
        { id: "1", nombre_curso: "Curso A", descripcion: "Desc A", horas_certificacion: 10, imagen_url: null, activo: true },
        { id: "2", nombre_curso: "Curso B", descripcion: "Desc B", horas_certificacion: 20, imagen_url: null, activo: true },
      ];
      (supabase.order as any).mockResolvedValue({ data: mockData, error: null });

      const result = await listCursos("Curso A");
      expect(getRequiredTenantId).toHaveBeenCalled();
      expect(supabase.schema).toHaveBeenCalledWith("academico");
      expect(supabase.from).toHaveBeenCalledWith("cursos");
      // Mapeo esperado
      expect(result).toHaveLength(1); // Filtro manual
      expect(result[0].nombre).toBe("Curso A");
      expect(result[0].displayCode).toBe("CUR-001");
    });
  });

  describe("createCurso", () => {
    it("debe crear un curso correctamente", async () => {
      const mockData = { id: "new-id", nombre_curso: "Nuevo Curso", descripcion: null, horas_certificacion: null, imagen_url: null, activo: true };
      (supabase.single as any).mockResolvedValue({ data: mockData, error: null });

      const result = await createCurso({ nombre: "Nuevo Curso", descripcion: null, horasCertificacion: null });
      expect(resolveCurrentUserId).toHaveBeenCalled();
      expect(supabase.insert).toHaveBeenCalled();
      expect(result.id).toBe("new-id");
      expect(result.displayCode).toBe("CUR-NEW");
    });
  });

  describe("enrollVolunteer", () => {
    it("debe inscribir voluntario si no existe inscripción", async () => {
      // maybeSingle -> no data
      (supabase.maybeSingle as any).mockResolvedValueOnce({ data: null, error: null });
      // insert -> single -> data
      (supabase.single as any).mockResolvedValueOnce({ data: { id: "ins-1" }, error: null });

      const id = await enrollVolunteer({ cursoId: "c1", voluntarioId: "v1" });
      expect(id).toBe("ins-1");
      expect(supabase.insert).toHaveBeenCalled();
    });

    it("debe rechazar inscripcion si ya existe", async () => {
      (supabase.maybeSingle as any).mockResolvedValueOnce({ data: { id: "exist-1" }, error: null });

      await expect(enrollVolunteer({ cursoId: "c1", voluntarioId: "v1" })).rejects.toThrow("Este voluntario ya está inscrito en el curso.");
    });
  });
});
