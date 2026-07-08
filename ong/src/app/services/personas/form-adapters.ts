import type {
  BeneficiaryUpsertInput,
  VolunteerUpsertInput,
} from "../../modules/people/types";
import type {
  BeneficiaryFormValues,
  VolunteerDocumentFormValue,
  VolunteerFormValues,
} from "../../modules/people/forms";
import {
  getPeoplePhotoUploadBucket,
  getVolunteerDocumentsUploadBucket,
  uploadFileToStorage,
} from "../shared/storage";

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

async function resolveVolunteerDocumentUrl(
  values: VolunteerFormValues,
  document: VolunteerDocumentFormValue
): Promise<string | null> {
  if (document.file) {
    const bucket = getVolunteerDocumentsUploadBucket();
    const upload = await uploadFileToStorage({
      ...bucket,
      file: document.file,
      pathSegments: [
        "voluntarios",
        values.documentNumber || "sin-documento",
        "documentos",
        document.type || "documento",
      ],
    });
    return upload.route;
  }

  return trimOrNull(document.existingUrl);
}

export async function adaptVolunteerFormToUpsertInput(
  values: VolunteerFormValues
): Promise<VolunteerUpsertInput> {
  const photoUpload = values.photoFile
    ? await uploadFileToStorage({
        ...getPeoplePhotoUploadBucket(),
        file: values.photoFile,
        pathSegments: [
          "voluntarios",
          values.documentNumber || "sin-documento",
          "perfil",
        ],
      })
    : null;

  const documents = await Promise.all(
    values.documents
      .filter(
        (document) =>
          document.type.trim() ||
          document.existingUrl.trim() ||
          document.file ||
          document.expirationDate
      )
      .map(async (document) => ({
        id: document.id,
        type: document.type.trim(),
        url: (await resolveVolunteerDocumentUrl(values, document)) ?? "",
        expirationDate: trimOrNull(document.expirationDate),
        isCurrent: document.isCurrent,
      }))
  );

  return {
    iamUserId: trimOrNull(values.iamUserId),
    documentNumber: values.documentNumber.trim(),
    documentType: trimOrNull(values.documentType),
    genderCode: trimOrNull(values.genderCode),
    countryCode: trimOrNull(values.countryCode),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthDate: trimOrNull(values.birthDate),
    email: trimOrNull(values.email),
    phone: trimOrNull(values.phone),
    photoUrl: values.removePhoto
      ? null
      : photoUpload?.route ?? trimOrNull(values.existingPhotoUrl),
    stateCode: values.stateCode.trim(),
    notes: trimOrNull(values.notes),
    skills: values.skills
      .filter((skill) => skill.code || skill.level)
      .map((skill) => ({
        id: skill.id,
        code: skill.code,
        level: trimOrNull(skill.level),
      })),
    operationalRoles: values.operationalRoles
      .filter((role) => role.roleId || role.assignedAt)
      .map((role) => ({
        id: role.id,
        roleId: role.roleId,
        assignedAt: trimOrNull(role.assignedAt),
        active: role.active,
      })),
    documents,
    coordinatorProfile: values.hasCoordinatorProfile
      ? {
          yearsExperience: Math.max(
            0,
            Math.round(Number(values.coordinatorYearsExperience || 0))
          ),
          department: values.coordinatorDepartment.trim(),
        }
      : null,
  };
}

export async function adaptBeneficiaryFormToUpsertInput(
  values: BeneficiaryFormValues
): Promise<BeneficiaryUpsertInput> {
  const photoUpload = values.photoFile
    ? await uploadFileToStorage({
        ...getPeoplePhotoUploadBucket(),
        file: values.photoFile,
        pathSegments: [
          "beneficiarios",
          values.documentNumber || "sin-documento",
          "perfil",
        ],
      })
    : null;

  return {
    documentNumber: trimOrNull(values.documentNumber),
    documentType: trimOrNull(values.documentType),
    countryCode: trimOrNull(values.countryCode),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthDate: trimOrNull(values.birthDate),
    genderCode: trimOrNull(values.genderCode),
    phone: trimOrNull(values.phone),
    address: trimOrNull(values.address),
    photoUrl: values.removePhoto
      ? null
      : photoUpload?.route ?? trimOrNull(values.existingPhotoUrl),
    notes: trimOrNull(values.notes),
    profileKind: values.profileKind,
    childProfile:
      values.profileKind === "child"
        ? {
            tutorName: values.tutorName.trim(),
            tutorPhone: values.tutorPhone.trim(),
            school: values.school.trim(),
            schoolGrade: values.schoolGrade.trim(),
          }
        : null,
    seniorProfile:
      values.profileKind === "senior"
        ? {
            limitedMobility: values.limitedMobility,
            livesAlone: values.livesAlone,
            emergencyContact: values.emergencyContact.trim(),
          }
        : null,
  };
}
