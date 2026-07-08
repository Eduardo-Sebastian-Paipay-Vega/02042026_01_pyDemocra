import type {
  BeneficiaryCatalogData,
  BeneficiaryDetailData,
  BeneficiaryProfileKind,
  SensitiveMedicalDetail,
  VolunteerCatalogData,
  VolunteerDetailData,
} from "./types";
import type { PeopleStatusOption } from "./types";

export interface VolunteerDocumentFormValue {
  id?: string;
  type: string;
  existingUrl: string;
  file: File | null;
  expirationDate: string;
  isCurrent: boolean;
}

export interface VolunteerFormValues {
  iamUserId: string;
  documentNumber: string;
  documentType: string;
  genderCode: string;
  countryCode: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  existingPhotoUrl: string;
  photoFile: File | null;
  removePhoto: boolean;
  stateCode: string;
  notes: string;
  hasCoordinatorProfile: boolean;
  coordinatorYearsExperience: number;
  coordinatorDepartment: string;
  skills: Array<{ id?: string; code: string; level: string }>;
  operationalRoles: Array<{ id?: string; roleId: string; assignedAt: string; active: boolean }>;
  documents: VolunteerDocumentFormValue[];
}

export type VolunteerFieldErrors = Partial<
  Record<
    | "documentNumber"
    | "firstName"
    | "lastName"
    | "stateCode"
    | "skills"
    | "operationalRoles"
    | "documents"
    | "coordinator",
    string
  >
>;

export interface BeneficiaryFormValues {
  documentNumber: string;
  documentType: string;
  countryCode: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  genderCode: string;
  phone: string;
  address: string;
  existingPhotoUrl: string;
  photoFile: File | null;
  removePhoto: boolean;
  notes: string;
  profileKind: BeneficiaryProfileKind;
  tutorName: string;
  tutorPhone: string;
  school: string;
  schoolGrade: string;
  limitedMobility: boolean;
  livesAlone: boolean;
  emergencyContact: string;
}

export type BeneficiaryFieldErrors = Partial<
  Record<"firstName" | "lastName" | "childProfile", string>
>;

export interface SensitiveMedicalFormValues {
  accessReason: string;
  bloodType: string;
  allergies: string;
  preexistingConditions: string;
  currentMedication: string;
  medicalConditions: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface SensitiveMedicalFieldErrors {
  accessReason?: string;
}

export function buildEmptyVolunteerForm(
  stateOptions: PeopleStatusOption[],
  countryOptions: VolunteerCatalogData["countryOptions"]
): VolunteerFormValues {
  const defaultState =
    stateOptions.find((option) => option.kind === "active")?.value ??
    stateOptions[0]?.value ??
    "";
  const defaultCountry =
    countryOptions.find((option) => option.value === "PE")?.value ??
    countryOptions[0]?.value ??
    "";

  return {
    iamUserId: "",
    documentNumber: "",
    documentType: "",
    genderCode: "",
    countryCode: defaultCountry,
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    phone: "",
    existingPhotoUrl: "",
    photoFile: null,
    removePhoto: false,
    stateCode: defaultState,
    notes: "",
    hasCoordinatorProfile: false,
    coordinatorYearsExperience: 0,
    coordinatorDepartment: "",
    skills: [],
    operationalRoles: [],
    documents: [],
  };
}

export function mapVolunteerDetailToForm(detail: VolunteerDetailData): VolunteerFormValues {
  return {
    iamUserId: detail.volunteer.iamUserId ?? "",
    documentNumber: detail.volunteer.documentNumber,
    documentType: detail.volunteer.documentType ?? "",
    genderCode: detail.volunteer.genderCode ?? "",
    countryCode: detail.volunteer.countryCode ?? "PE",
    firstName: detail.volunteer.firstName,
    lastName: detail.volunteer.lastName,
    birthDate: detail.volunteer.birthDate ?? "",
    email: detail.volunteer.email,
    phone: detail.volunteer.phone,
    existingPhotoUrl: detail.volunteer.photoUrl ?? "",
    photoFile: null,
    removePhoto: false,
    stateCode: detail.volunteer.stateCode,
    notes: detail.volunteer.notes,
    hasCoordinatorProfile: Boolean(detail.coordinatorProfile),
    coordinatorYearsExperience: detail.coordinatorProfile?.yearsExperience ?? 0,
    coordinatorDepartment: detail.coordinatorProfile?.department ?? "",
    skills: detail.skills.map((skill) => ({
      id: skill.id,
      code: skill.code,
      level: skill.level ?? "",
    })),
    operationalRoles: detail.operationalRoles.map((role) => ({
      id: role.id,
      roleId: role.roleId,
      assignedAt: role.assignedAt ?? "",
      active: role.active,
    })),
    documents: detail.documents.map((document) => ({
      id: document.id,
      type: document.type,
      existingUrl: document.url,
      file: null,
      expirationDate: document.expirationDate ?? "",
      isCurrent: document.isCurrent,
    })),
  };
}

export function validateVolunteerForm(values: VolunteerFormValues): VolunteerFieldErrors {
  const errors: VolunteerFieldErrors = {};

  if (!values.documentNumber.trim()) {
    errors.documentNumber = "El numero de documento es obligatorio.";
  }
  if (!values.firstName.trim()) {
    errors.firstName = "El nombre es obligatorio.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "El apellido es obligatorio.";
  }
  if (!values.stateCode.trim()) {
    errors.stateCode = "Debes seleccionar un estado real.";
  }

  const skillCodes = new Set<string>();
  for (const skill of values.skills) {
    if (!skill.code && !skill.level) {
      continue;
    }
    if (!skill.code) {
      errors.skills = "Cada habilidad debe tener una opción seleccionada.";
      break;
    }
    if (skillCodes.has(skill.code)) {
      errors.skills = "No repitas habilidades en el mismo voluntario.";
      break;
    }
    skillCodes.add(skill.code);
  }

  const roleIds = new Set<string>();
  for (const role of values.operationalRoles) {
    if (!role.roleId && !role.assignedAt) {
      continue;
    }
    if (!role.roleId) {
      errors.operationalRoles = "Cada rol operativo debe tener una opción seleccionada.";
      break;
    }
    if (roleIds.has(role.roleId)) {
      errors.operationalRoles = "No repitas roles operativos en el mismo voluntario.";
      break;
    }
    roleIds.add(role.roleId);
  }

  const documentKeys = new Set<string>();
  for (const document of values.documents) {
    if (!document.type && !document.existingUrl && !document.file && !document.expirationDate) {
      continue;
    }
    if (!document.type.trim()) {
      errors.documents = "Cada documento debe indicar un tipo.";
      break;
    }
    if (!document.existingUrl.trim() && !document.file) {
      errors.documents = "Cada documento debe adjuntar un archivo o conservar uno existente.";
      break;
    }
    const duplicateKey = `${document.type.trim().toLowerCase()}::${document.existingUrl.trim().toLowerCase()}::${
      document.file?.name.toLowerCase() ?? ""
    }`;
    if (documentKeys.has(duplicateKey)) {
      errors.documents = "No repitas documentos con el mismo tipo y archivo.";
      break;
    }
    documentKeys.add(duplicateKey);
  }

  if (values.hasCoordinatorProfile && values.coordinatorYearsExperience < 0) {
    errors.coordinator = "Los anios de experiencia no pueden ser negativos.";
  }

  return errors;
}

export function buildEmptyBeneficiaryForm(
  catalogs: BeneficiaryCatalogData
): BeneficiaryFormValues {
  const defaultCountry =
    catalogs.countryOptions.find((option) => option.value === "PE")?.value ??
    catalogs.countryOptions[0]?.value ??
    "";

  return {
    documentNumber: "",
    documentType: "",
    countryCode: defaultCountry,
    firstName: "",
    lastName: "",
    birthDate: "",
    genderCode: "",
    phone: "",
    address: "",
    existingPhotoUrl: "",
    photoFile: null,
    removePhoto: false,
    notes: "",
    profileKind: "general",
    tutorName: "",
    tutorPhone: "",
    school: "",
    schoolGrade: "",
    limitedMobility: false,
    livesAlone: false,
    emergencyContact: "",
  };
}

export function mapBeneficiaryDetailToForm(
  detail: BeneficiaryDetailData
): BeneficiaryFormValues {
  return {
    documentNumber: detail.beneficiary.documentNumber,
    documentType: detail.beneficiary.documentType ?? "",
    countryCode: detail.beneficiary.countryCode ?? "PE",
    firstName: detail.beneficiary.firstName,
    lastName: detail.beneficiary.lastName,
    birthDate: detail.beneficiary.birthDate ?? "",
    genderCode: detail.beneficiary.genderCode ?? "",
    phone: detail.beneficiary.phone,
    address: detail.beneficiary.address,
    existingPhotoUrl: detail.beneficiary.photoUrl ?? "",
    photoFile: null,
    removePhoto: false,
    notes: detail.beneficiary.notes,
    profileKind: detail.beneficiary.profileKind,
    tutorName: detail.childProfile?.tutorName ?? "",
    tutorPhone: detail.childProfile?.tutorPhone ?? "",
    school: detail.childProfile?.school ?? "",
    schoolGrade: detail.childProfile?.schoolGrade ?? "",
    limitedMobility: detail.seniorProfile?.limitedMobility ?? false,
    livesAlone: detail.seniorProfile?.livesAlone ?? false,
    emergencyContact: detail.seniorProfile?.emergencyContact ?? "",
  };
}

export function validateBeneficiaryForm(
  values: BeneficiaryFormValues
): BeneficiaryFieldErrors {
  const errors: BeneficiaryFieldErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "El nombre es obligatorio.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "El apellido es obligatorio.";
  }
  if (values.profileKind === "child" && !values.tutorName.trim()) {
    errors.childProfile = "El perfil de nino requiere nombre del tutor.";
  }

  return errors;
}

export function buildEmptySensitiveForm(): SensitiveMedicalFormValues {
  return {
    accessReason: "",
    bloodType: "",
    allergies: "",
    preexistingConditions: "",
    currentMedication: "",
    medicalConditions: "",
    emergencyContact: "",
    emergencyPhone: "",
  };
}

export function mapSensitiveDetailToForm(
  detail: SensitiveMedicalDetail
): SensitiveMedicalFormValues {
  if (detail.scope === "beneficiaries") {
    return {
      accessReason: "",
      bloodType: detail.bloodType,
      allergies: detail.allergies,
      preexistingConditions: detail.preexistingConditions,
      currentMedication: detail.currentMedication,
      medicalConditions: "",
      emergencyContact: "",
      emergencyPhone: "",
    };
  }

  return {
    accessReason: "",
    bloodType: "",
    allergies: "",
    preexistingConditions: "",
    currentMedication: "",
    medicalConditions: detail.medicalConditions,
    emergencyContact: detail.emergencyContact,
    emergencyPhone: detail.emergencyPhone,
  };
}

export function validateSensitiveMedicalForm(
  values: SensitiveMedicalFormValues
): SensitiveMedicalFieldErrors {
  const errors: SensitiveMedicalFieldErrors = {};

  if (!values.accessReason.trim()) {
    errors.accessReason = "Debes indicar un motivo de acceso.";
  }

  return errors;
}

