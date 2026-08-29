import type {
  AdmissionDocumentCreateInput,
  AdmissionDocumentUpdateInput,
  AdmissionOnboardingStepUpdateInput,
} from "../../modules/admission/types";
import type {
  AdmissionDocumentFormValues,
  AdmissionOnboardingFormValues,
} from "../../modules/admission/forms";
import {
  getAdmissionDocumentsUploadBucket,
  getAdmissionOnboardingEvidenceBucket,
  uploadFileToStorage,
} from "../shared/storage";

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

async function resolveAdmissionDocumentUrl(
  requestId: string,
  values: AdmissionDocumentFormValues
): Promise<string> {
  if (values.file) {
    const upload = await uploadFileToStorage({
      ...getAdmissionDocumentsUploadBucket(),
      file: values.file,
      pathSegments: ["admision", requestId, "documentos", values.type || "documento"],
    });
    return upload.route;
  }

  return trimOrNull(values.existingFileUrl) ?? "";
}

export async function adaptAdmissionDocumentFormToCreateInput(options: {
  requestId: string;
  values: AdmissionDocumentFormValues;
}): Promise<AdmissionDocumentCreateInput> {
  return {
    requestId: options.requestId,
    type: options.values.type.trim(),
    fileUrl: await resolveAdmissionDocumentUrl(options.requestId, options.values),
    estadoValidacion: options.values.estadoValidacion,
    comentariosRechazo: options.values.comentariosRechazo,
  };
}

export async function adaptAdmissionDocumentFormToUpdateInput(options: {
  documentId: string;
  requestId: string;
  values: AdmissionDocumentFormValues;
}): Promise<AdmissionDocumentUpdateInput> {
  return {
    documentId: options.documentId,
    type: options.values.type.trim(),
    fileUrl: await resolveAdmissionDocumentUrl(options.requestId, options.values),
    estadoValidacion: options.values.estadoValidacion,
    comentariosRechazo: options.values.comentariosRechazo,
  };
}

export async function adaptAdmissionOnboardingFormToUpdateInput(options: {
  volunteerId: string;
  stepId: string;
  values: AdmissionOnboardingFormValues;
}): Promise<AdmissionOnboardingStepUpdateInput> {
  const upload = options.values.evidenceFile
    ? await uploadFileToStorage({
        ...getAdmissionOnboardingEvidenceBucket(),
        file: options.values.evidenceFile,
        pathSegments: [
          "admision",
          "onboarding",
          options.volunteerId,
          options.stepId,
          "evidencia",
        ],
      })
    : null;

  return {
    volunteerId: options.volunteerId,
    stepId: options.stepId,
    completed: options.values.completed,
    evidenceUrl: options.values.removeEvidence
      ? null
      : upload?.route ?? trimOrNull(options.values.existingEvidenceUrl),
  };
}


