import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  adaptAdmissionDocumentFormToCreateInput,
  adaptAdmissionDocumentFormToUpdateInput,
  adaptAdmissionOnboardingFormToUpdateInput,
} from "./form-adapters";
import * as storage from "../shared/storage";
import type {
  AdmissionDocumentFormValues,
  AdmissionOnboardingFormValues,
} from "../../modules/admission/forms";

vi.mock("../shared/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../shared/storage")>();
  return {
    ...actual,
    uploadFileToStorage: vi.fn(),
  };
});

function buildDocumentValues(
  overrides: Partial<AdmissionDocumentFormValues> = {}
): AdmissionDocumentFormValues {
  return {
    type: "  DNI  ",
    existingFileUrl: "",
    file: null,
    verified: false,
    ...overrides,
  };
}

function buildOnboardingValues(
  overrides: Partial<AdmissionOnboardingFormValues> = {}
): AdmissionOnboardingFormValues {
  return {
    completed: false,
    existingEvidenceUrl: "",
    evidenceFile: null,
    removeEvidence: false,
    ...overrides,
  };
}

describe("adaptAdmissionDocumentFormToCreateInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa la existingFileUrl recortada cuando no hay archivo nuevo", async () => {
    const result = await adaptAdmissionDocumentFormToCreateInput({
      requestId: "req-1",
      values: buildDocumentValues({ existingFileUrl: "  https://cdn.example.com/a.pdf  " }),
    });

    expect(result).toEqual({
      requestId: "req-1",
      type: "DNI",
      fileUrl: "https://cdn.example.com/a.pdf",
      verified: false,
    });
    expect(storage.uploadFileToStorage).not.toHaveBeenCalled();
  });

  it("devuelve cadena vacia cuando no hay archivo ni url existente", async () => {
    const result = await adaptAdmissionDocumentFormToCreateInput({
      requestId: "req-1",
      values: buildDocumentValues(),
    });

    expect(result.fileUrl).toBe("");
  });

  it("sube el archivo nuevo y usa la ruta devuelta", async () => {
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "docs",
      path: "path",
      route: "https://cdn.example.com/nuevo.pdf",
      publicUrl: null,
      fileName: "nuevo.pdf",
    });
    const file = new File(["data"], "nuevo.pdf", { type: "application/pdf" });

    const result = await adaptAdmissionDocumentFormToCreateInput({
      requestId: "req-1",
      values: buildDocumentValues({ file, verified: true }),
    });

    expect(storage.uploadFileToStorage).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      requestId: "req-1",
      type: "DNI",
      fileUrl: "https://cdn.example.com/nuevo.pdf",
      verified: true,
    });
  });
});

describe("adaptAdmissionDocumentFormToUpdateInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("arma el input de actualizacion con documentId y requestId", async () => {
    const result = await adaptAdmissionDocumentFormToUpdateInput({
      documentId: "doc-1",
      requestId: "req-1",
      values: buildDocumentValues({ existingFileUrl: "https://cdn.example.com/a.pdf" }),
    });

    expect(result).toEqual({
      documentId: "doc-1",
      type: "DNI",
      fileUrl: "https://cdn.example.com/a.pdf",
      verified: false,
    });
  });
});

describe("adaptAdmissionOnboardingFormToUpdateInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa existingEvidenceUrl recortada cuando no hay archivo nuevo ni removeEvidence", async () => {
    const result = await adaptAdmissionOnboardingFormToUpdateInput({
      volunteerId: "vol-1",
      stepId: "step-1",
      values: buildOnboardingValues({
        completed: true,
        existingEvidenceUrl: "  https://cdn.example.com/evidencia.pdf  ",
      }),
    });

    expect(result).toEqual({
      volunteerId: "vol-1",
      stepId: "step-1",
      completed: true,
      evidenceUrl: "https://cdn.example.com/evidencia.pdf",
    });
    expect(storage.uploadFileToStorage).not.toHaveBeenCalled();
  });

  it("sube la evidencia nueva y usa su ruta", async () => {
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "evidence",
      path: "path",
      route: "https://cdn.example.com/nueva-evidencia.pdf",
      publicUrl: null,
      fileName: "nueva-evidencia.pdf",
    });
    const evidenceFile = new File(["data"], "evidencia.pdf", { type: "application/pdf" });

    const result = await adaptAdmissionOnboardingFormToUpdateInput({
      volunteerId: "vol-1",
      stepId: "step-1",
      values: buildOnboardingValues({ evidenceFile }),
    });

    expect(result.evidenceUrl).toBe("https://cdn.example.com/nueva-evidencia.pdf");
  });

  it("devuelve evidenceUrl null cuando removeEvidence es true, incluso con evidencia existente o nueva", async () => {
    const result = await adaptAdmissionOnboardingFormToUpdateInput({
      volunteerId: "vol-1",
      stepId: "step-1",
      values: buildOnboardingValues({
        removeEvidence: true,
        existingEvidenceUrl: "https://cdn.example.com/evidencia.pdf",
      }),
    });

    expect(result.evidenceUrl).toBeNull();
  });
});
