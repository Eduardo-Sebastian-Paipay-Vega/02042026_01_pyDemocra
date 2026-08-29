import type {
  AdmissionDocumentRow,
  AdmissionOnboardingStepRow,
} from "./types";

export interface AdmissionDocumentFormValues {
  type: string;
  existingFileUrl: string;
  file: File | null;
  estadoValidacion: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  comentariosRechazo: string;
}

export interface AdmissionDocumentFormErrors {
  type?: string;
  file?: string;
  estadoValidacion?: string;
  comentariosRechazo?: string;
  general?: string;
}

export interface AdmissionOnboardingFormValues {
  completed: boolean;
  existingEvidenceUrl: string;
  evidenceFile: File | null;
  removeEvidence: boolean;
}

export interface AdmissionOnboardingFormErrors {
  evidenceFile?: string;
  general?: string;
}

export function buildEmptyAdmissionDocumentForm(): AdmissionDocumentFormValues {
  return {
    type: "",
    existingFileUrl: "",
    file: null,
    estadoValidacion: "PENDIENTE",
    comentariosRechazo: "",
  };
}

export function mapAdmissionDocumentToForm(
  row: AdmissionDocumentRow,
  documentTypeOptions: Array<{ value: string; label: string }>
): AdmissionDocumentFormValues {
  return {
    type:
      documentTypeOptions.find((option) => option.value === row.typeCode)?.value ??
      documentTypeOptions.find((option) => option.label === row.type)?.value ??
      row.typeCode,
    existingFileUrl: row.fileUrl,
    file: null,
    estadoValidacion: row.estadoValidacion,
    comentariosRechazo: row.comentariosRechazo ?? "",
  };
}

export function validateAdmissionDocumentForm(
  values: AdmissionDocumentFormValues
): AdmissionDocumentFormErrors {
  const errors: AdmissionDocumentFormErrors = {};

  if (!values.type.trim()) {
    errors.type = "El tipo de documento es obligatorio.";
  }
  if (!values.file && !values.existingFileUrl.trim()) {
    errors.file = "Debes seleccionar un archivo o conservar uno existente.";
  }
  if (values.estadoValidacion === "RECHAZADO" && !values.comentariosRechazo.trim()) {
    errors.comentariosRechazo = "Debes ingresar un motivo de rechazo.";
  }

  return errors;
}

export function buildEmptyAdmissionOnboardingForm(): AdmissionOnboardingFormValues {
  return {
    completed: false,
    existingEvidenceUrl: "",
    evidenceFile: null,
    removeEvidence: false,
  };
}

export function mapAdmissionOnboardingStepToForm(
  row: AdmissionOnboardingStepRow
): AdmissionOnboardingFormValues {
  return {
    completed: row.completed,
    existingEvidenceUrl: row.evidenceUrl ?? "",
    evidenceFile: null,
    removeEvidence: false,
  };
}

export function validateAdmissionOnboardingForm(
  values: AdmissionOnboardingFormValues
): AdmissionOnboardingFormErrors {
  const errors: AdmissionOnboardingFormErrors = {};

  if (values.removeEvidence && values.evidenceFile) {
    errors.evidenceFile = "No puedes quitar y reemplazar la evidencia al mismo tiempo.";
  }

  return errors;
}

