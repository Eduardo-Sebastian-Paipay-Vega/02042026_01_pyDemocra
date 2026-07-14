import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  adaptVolunteerFormToUpsertInput,
  adaptBeneficiaryFormToUpsertInput,
} from "./form-adapters";
import * as storage from "../shared/storage";
import type {
  BeneficiaryFormValues,
  VolunteerDocumentFormValue,
  VolunteerFormValues,
} from "../../modules/people/forms";

vi.mock("../shared/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../shared/storage")>();
  return {
    ...actual,
    uploadFileToStorage: vi.fn(),
  };
});

function buildDocument(
  overrides: Partial<VolunteerDocumentFormValue> = {}
): VolunteerDocumentFormValue {
  return {
    id: undefined,
    type: "",
    existingUrl: "",
    file: null,
    expirationDate: "",
    isCurrent: false,
    ...overrides,
  };
}

function buildVolunteerValues(
  overrides: Partial<VolunteerFormValues> = {}
): VolunteerFormValues {
  return {
    iamUserId: "  user-1  ",
    documentNumber: "  12345678  ",
    documentType: "  DNI  ",
    genderCode: "  M  ",
    countryCode: "  PE  ",
    firstName: "  Ana  ",
    lastName: "  Torres  ",
    birthDate: "  1990-01-01  ",
    email: "  ana@example.com  ",
    phone: "  999888777  ",
    existingPhotoUrl: "",
    photoFile: null,
    removePhoto: false,
    stateCode: "  activo  ",
    notes: "  ninguna  ",
    hasCoordinatorProfile: false,
    coordinatorYearsExperience: 0,
    coordinatorDepartment: "",
    skills: [],
    operationalRoles: [],
    documents: [],
    ...overrides,
  };
}

function buildBeneficiaryValues(
  overrides: Partial<BeneficiaryFormValues> = {}
): BeneficiaryFormValues {
  return {
    documentNumber: "  87654321  ",
    documentType: "  DNI  ",
    countryCode: "  PE  ",
    firstName: "  Luis  ",
    lastName: "  Ramos  ",
    birthDate: "  2015-05-05  ",
    genderCode: "  M  ",
    phone: "  111222333  ",
    address: "  Av. Siempre Viva 123  ",
    existingPhotoUrl: "",
    photoFile: null,
    removePhoto: false,
    notes: "",
    profileKind: "child",
    tutorName: "  Carla Ramos  ",
    tutorPhone: "  444555666  ",
    school: "  Colegio Central  ",
    schoolGrade: "  5to  ",
    limitedMobility: false,
    livesAlone: false,
    emergencyContact: "",
    ...overrides,
  };
}

describe("adaptVolunteerFormToUpsertInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recorta campos de texto y arma el payload base sin foto ni documentos", async () => {
    const result = await adaptVolunteerFormToUpsertInput(buildVolunteerValues());

    expect(result).toMatchObject({
      iamUserId: "user-1",
      documentNumber: "12345678",
      documentType: "DNI",
      genderCode: "M",
      countryCode: "PE",
      firstName: "Ana",
      lastName: "Torres",
      birthDate: "1990-01-01",
      email: "ana@example.com",
      phone: "999888777",
      stateCode: "activo",
      notes: "ninguna",
      photoUrl: null,
      coordinatorProfile: null,
      documents: [],
      skills: [],
      operationalRoles: [],
    });
    expect(storage.uploadFileToStorage).not.toHaveBeenCalled();
  });

  it("sube la foto de perfil y usa la ruta devuelta cuando hay photoFile", async () => {
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "avatars",
      path: "tenant/voluntarios/12345678/perfil/foto.png",
      route: "https://cdn.example.com/foto.png",
      publicUrl: "https://cdn.example.com/foto.png",
      fileName: "foto.png",
    });

    const photoFile = new File(["data"], "foto.png", { type: "image/png" });
    const result = await adaptVolunteerFormToUpsertInput(
      buildVolunteerValues({ photoFile })
    );

    expect(storage.uploadFileToStorage).toHaveBeenCalledTimes(1);
    expect(result.photoUrl).toBe("https://cdn.example.com/foto.png");
  });

  it("ignora la foto subida y devuelve null cuando removePhoto es true", async () => {
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "avatars",
      path: "path",
      route: "https://cdn.example.com/foto.png",
      publicUrl: "https://cdn.example.com/foto.png",
      fileName: "foto.png",
    });
    const photoFile = new File(["data"], "foto.png", { type: "image/png" });

    const result = await adaptVolunteerFormToUpsertInput(
      buildVolunteerValues({ photoFile, removePhoto: true })
    );

    expect(result.photoUrl).toBeNull();
  });

  it("arma coordinatorProfile con anios redondeados y departamento recortado cuando hasCoordinatorProfile es true", async () => {
    const result = await adaptVolunteerFormToUpsertInput(
      buildVolunteerValues({
        hasCoordinatorProfile: true,
        coordinatorYearsExperience: 3.6,
        coordinatorDepartment: "  Logistica  ",
      })
    );

    expect(result.coordinatorProfile).toEqual({
      yearsExperience: 4,
      department: "Logistica",
    });
  });

  it("evita anios de experiencia negativos en coordinatorProfile", async () => {
    const result = await adaptVolunteerFormToUpsertInput(
      buildVolunteerValues({
        hasCoordinatorProfile: true,
        coordinatorYearsExperience: -5,
        coordinatorDepartment: "Logistica",
      })
    );

    expect(result.coordinatorProfile?.yearsExperience).toBe(0);
  });

  it("filtra skills y operationalRoles vacios", async () => {
    const result = await adaptVolunteerFormToUpsertInput(
      buildVolunteerValues({
        skills: [
          { code: "", level: "" },
          { code: "primeros-auxilios", level: "" },
        ],
        operationalRoles: [
          { roleId: "", assignedAt: "", active: false },
          { roleId: "role-1", assignedAt: "", active: true },
        ],
      })
    );

    expect(result.skills).toEqual([
      { id: undefined, code: "primeros-auxilios", level: null },
    ]);
    expect(result.operationalRoles).toEqual([
      { id: undefined, roleId: "role-1", assignedAt: null, active: true },
    ]);
  });

  it("filtra documentos vacios y sube archivos nuevos usando el numero de documento en la ruta", async () => {
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "docs",
      path: "path",
      route: "https://cdn.example.com/doc.pdf",
      publicUrl: null,
      fileName: "doc.pdf",
    });
    const docFile = new File(["data"], "doc.pdf", { type: "application/pdf" });

    const result = await adaptVolunteerFormToUpsertInput(
      buildVolunteerValues({
        documents: [
          buildDocument(),
          buildDocument({ type: "cv", file: docFile }),
          buildDocument({ existingUrl: "https://cdn.example.com/existing.pdf" }),
        ],
      })
    );

    expect(result.documents).toHaveLength(2);
    expect(result.documents[0]).toMatchObject({
      type: "cv",
      url: "https://cdn.example.com/doc.pdf",
    });
    expect(result.documents[1]).toMatchObject({
      type: "",
      url: "https://cdn.example.com/existing.pdf",
    });
  });
});

describe("adaptBeneficiaryFormToUpsertInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recorta campos de texto y arma childProfile cuando profileKind es child", async () => {
    const result = await adaptBeneficiaryFormToUpsertInput(buildBeneficiaryValues());

    expect(result).toMatchObject({
      documentNumber: "87654321",
      firstName: "Luis",
      lastName: "Ramos",
      photoUrl: null,
      profileKind: "child",
      childProfile: {
        tutorName: "Carla Ramos",
        tutorPhone: "444555666",
        school: "Colegio Central",
        schoolGrade: "5to",
      },
      seniorProfile: null,
    });
  });

  it("arma seniorProfile y childProfile null cuando profileKind es senior", async () => {
    const result = await adaptBeneficiaryFormToUpsertInput(
      buildBeneficiaryValues({
        profileKind: "senior",
        limitedMobility: true,
        livesAlone: true,
        emergencyContact: "  Contacto Emergencia  ",
      })
    );

    expect(result.childProfile).toBeNull();
    expect(result.seniorProfile).toEqual({
      limitedMobility: true,
      livesAlone: true,
      emergencyContact: "Contacto Emergencia",
    });
  });

  it("usa existingPhotoUrl recortado cuando no hay photoFile ni removePhoto", async () => {
    const result = await adaptBeneficiaryFormToUpsertInput(
      buildBeneficiaryValues({ existingPhotoUrl: "  https://cdn.example.com/old.png  " })
    );

    expect(result.photoUrl).toBe("https://cdn.example.com/old.png");
    expect(storage.uploadFileToStorage).not.toHaveBeenCalled();
  });

  it("sube la foto nueva y usa su ruta cuando hay photoFile", async () => {
    vi.mocked(storage.uploadFileToStorage).mockResolvedValue({
      bucket: "avatars",
      path: "path",
      route: "https://cdn.example.com/new.png",
      publicUrl: "https://cdn.example.com/new.png",
      fileName: "new.png",
    });
    const photoFile = new File(["data"], "new.png", { type: "image/png" });

    const result = await adaptBeneficiaryFormToUpsertInput(
      buildBeneficiaryValues({ photoFile, existingPhotoUrl: "https://cdn.example.com/old.png" })
    );

    expect(result.photoUrl).toBe("https://cdn.example.com/new.png");
  });

  it("devuelve photoUrl null cuando removePhoto es true, incluso con existingPhotoUrl", async () => {
    const result = await adaptBeneficiaryFormToUpsertInput(
      buildBeneficiaryValues({
        removePhoto: true,
        existingPhotoUrl: "https://cdn.example.com/old.png",
      })
    );

    expect(result.photoUrl).toBeNull();
  });
});
