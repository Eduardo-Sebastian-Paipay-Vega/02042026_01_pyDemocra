import { describe, it, expect } from "vitest";
import { adaptSensitiveMedicalFormToInput } from "./form-adapters";
import type { SensitiveMedicalDetail } from "../../modules/people/types";
import type { SensitiveMedicalFormValues } from "../../modules/people/forms";

function buildValues(
  overrides: Partial<SensitiveMedicalFormValues> = {}
): SensitiveMedicalFormValues {
  return {
    accessReason: "  Revision de rutina  ",
    bloodType: "  O+  ",
    allergies: "  Penicilina  ",
    preexistingConditions: "  Hipertension  ",
    currentMedication: "  Losartan  ",
    medicalConditions: "  Asma  ",
    emergencyContact: "  Maria Perez  ",
    emergencyPhone: "  987654321  ",
    ...overrides,
  };
}

describe("adaptSensitiveMedicalFormToInput", () => {
  describe("scope: beneficiaries", () => {
    const detail = { scope: "beneficiaries" } as SensitiveMedicalDetail;

    it("recorta (trim) y mapea los campos medicos del beneficiario", () => {
      const result = adaptSensitiveMedicalFormToInput(detail, buildValues());

      expect(result).toEqual({
        bloodType: "O+",
        allergies: "Penicilina",
        preexistingConditions: "Hipertension",
        currentMedication: "Losartan",
        accessReason: "Revision de rutina",
      });
    });

    it("convierte campos opcionales vacios o solo con espacios a null", () => {
      const result = adaptSensitiveMedicalFormToInput(
        detail,
        buildValues({
          bloodType: "   ",
          allergies: "",
          preexistingConditions: "   ",
          currentMedication: "",
        })
      );

      expect(result).toEqual({
        bloodType: null,
        allergies: null,
        preexistingConditions: null,
        currentMedication: null,
        accessReason: "Revision de rutina",
      });
    });

    it("no incluye campos de voluntario en el resultado", () => {
      const result = adaptSensitiveMedicalFormToInput(detail, buildValues());

      expect(result).not.toHaveProperty("medicalConditions");
      expect(result).not.toHaveProperty("emergencyContact");
      expect(result).not.toHaveProperty("emergencyPhone");
    });
  });

  describe("scope: volunteers (cualquier scope distinto de beneficiaries)", () => {
    const detail = { scope: "volunteers" } as SensitiveMedicalDetail;

    it("recorta (trim) y mapea los campos medicos del voluntario", () => {
      const result = adaptSensitiveMedicalFormToInput(detail, buildValues());

      expect(result).toEqual({
        medicalConditions: "Asma",
        emergencyContact: "Maria Perez",
        emergencyPhone: "987654321",
        accessReason: "Revision de rutina",
      });
    });

    it("convierte campos opcionales vacios o solo con espacios a null", () => {
      const result = adaptSensitiveMedicalFormToInput(
        detail,
        buildValues({
          medicalConditions: "",
          emergencyContact: "   ",
          emergencyPhone: "",
        })
      );

      expect(result).toEqual({
        medicalConditions: null,
        emergencyContact: null,
        emergencyPhone: null,
        accessReason: "Revision de rutina",
      });
    });

    it("no incluye campos de beneficiario en el resultado", () => {
      const result = adaptSensitiveMedicalFormToInput(detail, buildValues());

      expect(result).not.toHaveProperty("bloodType");
      expect(result).not.toHaveProperty("allergies");
      expect(result).not.toHaveProperty("preexistingConditions");
      expect(result).not.toHaveProperty("currentMedication");
    });
  });
});
