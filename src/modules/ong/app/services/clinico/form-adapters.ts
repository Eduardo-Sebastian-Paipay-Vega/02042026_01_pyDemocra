import type {
  BeneficiaryMedicalRecordInput,
  SensitiveMedicalDetail,
  VolunteerSensitiveRecordInput,
} from "../../modules/people/types";
import type { SensitiveMedicalFormValues } from "../../modules/people/forms";

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function adaptSensitiveMedicalFormToInput(
  detail: SensitiveMedicalDetail,
  values: SensitiveMedicalFormValues
): BeneficiaryMedicalRecordInput | VolunteerSensitiveRecordInput {
  if (detail.scope === "beneficiaries") {
    return {
      bloodType: trimOrNull(values.bloodType),
      allergies: trimOrNull(values.allergies),
      preexistingConditions: trimOrNull(values.preexistingConditions),
      currentMedication: trimOrNull(values.currentMedication),
      accessReason: values.accessReason.trim(),
    };
  }

  return {
    medicalConditions: trimOrNull(values.medicalConditions),
    emergencyContact: trimOrNull(values.emergencyContact),
    emergencyPhone: trimOrNull(values.emergencyPhone),
    accessReason: values.accessReason.trim(),
  };
}


