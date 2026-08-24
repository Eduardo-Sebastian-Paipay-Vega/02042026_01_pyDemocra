import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVolunteerRegistrationCatalogs,
  previewVolunteerRegistrationCode,
  consumeVolunteerRegistrationCode,
  getVolunteerRegistrationDocumentsBucket,
} from "./volunteerRegistration.service";
import { supabase } from "../../../supabaseClient";

vi.mock("../../../supabaseClient", () => {
  const chainable = {
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

    order: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      ...chainable,
      functions: {
        invoke: vi.fn(),
      },
    },
  };
});

describe("Volunteer Registration Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.order as any).mockResolvedValue({ data: [], error: null });
  });

  describe("getVolunteerRegistrationCatalogs", () => {
    it("debe retornar los catalogos cargados", async () => {
      (supabase.order as any).mockResolvedValueOnce({ data: [{ codigo: "DNI", nombre: "DNI" }], error: null });
      (supabase.order as any).mockResolvedValueOnce({ data: [{ codigo: "M", nombre: "Masculino" }], error: null });
      (supabase.order as any).mockResolvedValueOnce({ data: [{ codigo: "PE", nombre: "Peru" }], error: null });

      const res = await getVolunteerRegistrationCatalogs();
      expect(res.documentTypes).toHaveLength(1);
      expect(res.genders).toHaveLength(1);
      expect(res.countries).toHaveLength(1);
    });

    it("debe lanzar error si falla alguna consulta", async () => {
      (supabase.order as any).mockResolvedValueOnce({ data: null, error: { message: "Error catalogs" } });
      await expect(getVolunteerRegistrationCatalogs()).rejects.toThrow("Error catalogs");
    });
  });

  describe("previewVolunteerRegistrationCode", () => {
    it("debe invocar la funcion edge correctamente", async () => {
      const mockResponse = {
        tenantId: "t1",
        codeId: "c1",
        code: "123",
        status: "activo",
        expiresAt: "2026",
        expiresAtLabel: "2026",
        usesLabel: "1",
        requestId: null,
        volunteerId: null,
        linkedVolunteerName: null,
        targetEmail: null,
        targetDocumentNumber: null,
        targetFullName: "Juan Perez",
        email: null,
        documentNumber: null,
        documentType: null,
        firstName: "Juan",
        lastName: "Perez",
        genderCode: null,
        countryCode: null,
        birthDate: null,
        phone: null,
        notes: null,
        emailLocked: false,
        documentLocked: false,
        canConsume: true,
        warning: null
      };

      (supabase.functions.invoke as any).mockResolvedValue({ data: mockResponse, error: null });

      const res = await previewVolunteerRegistrationCode({ code: "123" });
      expect(supabase.functions.invoke).toHaveBeenCalledWith("consume-volunteer-registration-code", {
        body: { mode: "preview", code: "123", tenantId: null }
      });
      expect(res.code).toBe("123");
    });
  });

  describe("consumeVolunteerRegistrationCode", () => {
    it("debe validar los datos basicos y rechazar si faltan", async () => {
      // @ts-ignore
      // @ts-ignore
      await expect(consumeVolunteerRegistrationCode({
        code: "",
        email: "a@a.com",
        password: "123",
        firstName: "A",
        lastName: "B",
        documentNumber: "1",
        documents: []
      })).rejects.toThrow("Debes ingresar un codigo valido.");
    });

    it("debe invocar la funcion edge si todo es valido", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({ data: { codeId: "x" }, error: null });

      const mockFile = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
      // @ts-ignore

      // @ts-ignore
      const res = await consumeVolunteerRegistrationCode({
        code: "123",
        email: "test@gmail.com",
        password: "password123",
        firstName: "Juan",
        lastName: "Perez",
        documentNumber: "87654321",
        documents: [
          { type: "DNI", file: mockFile }
        ]
      });

      expect(supabase.functions.invoke).toHaveBeenCalled();
      expect(res.codeId).toBe("x");
    });
  });

  describe("getVolunteerRegistrationDocumentsBucket", () => {
    it("debe retornar el nombre del bucket", () => {
      const bucket = getVolunteerRegistrationDocumentsBucket();
      expect(typeof bucket).toBe("string");
    });
  });
});
