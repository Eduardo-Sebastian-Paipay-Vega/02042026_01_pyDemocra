import type { SelectOption, StatusVariant } from "../operation/types";

export type PeopleRecordStatusKind = "active" | "inactive" | "pending" | "other";
export type BeneficiaryProfileKind = "general" | "child" | "senior";
export type SensitiveRecordScope = "beneficiaries" | "volunteers";

export interface PeopleStatusOption {
  value: string;
  label: string;
  kind: PeopleRecordStatusKind;
}

export interface VolunteerSkillRow {
  id: string;
  code: string;
  label: string;
  level: string | null;
}

export interface VolunteerOperationalRoleRow {
  id: string;
  roleId: string;
  roleName: string;
  assignedAt: string;
  active: boolean;
}

export interface VolunteerInstitutionalRoleRow {
  roleId: string;
  roleName: string;
  sedeId: string;
  sedeName: string;
}

export interface VolunteerDocumentRow {
  id: string;
  type: string;
  url: string;
  expirationDate: string | null;
  isCurrent: boolean;
}

export interface VolunteerCoordinatorProfile {
  id: string | null;
  yearsExperience: number;
  department: string;
}

export interface VolunteerListRow {
  id: string;
  iamUserId: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType: string | null;
  documentLabel: string;
  genderCode: string | null;
  genderLabel: string;
  countryCode: string | null;
  countryLabel: string;
  birthDate: string | null;
  email: string;
  phone: string;
  photoUrl: string | null;
  stateCode: string;
  stateLabel: string;
  stateKind: PeopleRecordStatusKind;
  stateVariant: StatusVariant;
  notes: string;
  approvedHours: number;
  skillCount: number;
  roleCount: number;
  documentCount: number;
  projectCount: number;
  activityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerDetailData {
  volunteer: VolunteerListRow;
  createdBy: string;
  updatedBy: string;
  skills: VolunteerSkillRow[];
  operationalRoles: VolunteerOperationalRoleRow[];
  institutionalRoles: VolunteerInstitutionalRoleRow[];
  documents: VolunteerDocumentRow[];
  coordinatorProfile: VolunteerCoordinatorProfile | null;
}

export interface VolunteerSkillInput {
  id?: string;
  code: string;
  level: string | null;
}

export interface VolunteerRoleInput {
  id?: string;
  roleId: string;
  assignedAt: string | null;
  active: boolean;
}

export interface VolunteerDocumentInput {
  id?: string;
  type: string;
  url: string;
  expirationDate: string | null;
  isCurrent: boolean;
}

export interface VolunteerCoordinatorProfileInput {
  yearsExperience: number;
  department: string;
}

export interface VolunteerUpsertInput {
  iamUserId?: string | null;
  documentNumber: string;
  documentType: string | null;
  genderCode: string | null;
  countryCode: string | null;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  stateCode: string;
  notes: string | null;
  skills: VolunteerSkillInput[];
  operationalRoles: VolunteerRoleInput[];
  documents: VolunteerDocumentInput[];
  coordinatorProfile: VolunteerCoordinatorProfileInput | null;
}

export interface VolunteerCatalogData {
  stateOptions: PeopleStatusOption[];
  documentTypeOptions: SelectOption[];
  genderOptions: SelectOption[];
  countryOptions: SelectOption[];
  skillOptions: SelectOption[];
  operationalRoleOptions: SelectOption[];
}

export interface VolunteerListData {
  rows: VolunteerListRow[];
  stateOptions: PeopleStatusOption[];
}

export interface BeneficiaryListRow {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType: string | null;
  documentLabel: string;
  countryCode: string | null;
  countryLabel: string;
  genderCode: string | null;
  genderLabel: string;
  birthDate: string | null;
  phone: string;
  address: string;
  photoUrl: string | null;
  notes: string;
  profileKind: BeneficiaryProfileKind;
  profileLabel: string;
  hasMedicalRecord: boolean;
  medicalRecordCount: number;
  projectCount: number;
  latestMedicalUpdateAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryChildProfile {
  id: string;
  tutorName: string;
  tutorPhone: string;
  school: string;
  schoolGrade: string;
}

export interface BeneficiarySeniorProfile {
  id: string;
  limitedMobility: boolean;
  livesAlone: boolean;
  emergencyContact: string;
}

export interface BeneficiaryProjectLinkRow {
  id: string;
  projectId: string;
  projectName: string;
  linkedAt: string;
  notes: string;
}

export interface BeneficiaryDetailData {
  beneficiary: BeneficiaryListRow;
  createdBy: string;
  updatedBy: string;
  childProfile: BeneficiaryChildProfile | null;
  seniorProfile: BeneficiarySeniorProfile | null;
  projectLinks: BeneficiaryProjectLinkRow[];
}

export interface BeneficiaryChildProfileInput {
  tutorName: string;
  tutorPhone: string;
  school: string;
  schoolGrade: string;
}

export interface BeneficiarySeniorProfileInput {
  limitedMobility: boolean;
  livesAlone: boolean;
  emergencyContact: string;
}

export interface BeneficiaryUpsertInput {
  documentNumber: string | null;
  documentType: string | null;
  countryCode: string | null;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  genderCode: string | null;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  notes: string | null;
  profileKind: BeneficiaryProfileKind;
  childProfile: BeneficiaryChildProfileInput | null;
  seniorProfile: BeneficiarySeniorProfileInput | null;
}

export interface BeneficiaryCatalogData {
  documentTypeOptions: SelectOption[];
  genderOptions: SelectOption[];
  countryOptions: SelectOption[];
}

export interface BeneficiaryListData {
  rows: BeneficiaryListRow[];
}

export interface SensitiveAccessState {
  currentUserId: string | null;
  canRead: boolean;
  canWrite: boolean;
  isTenantAdmin: boolean;
  roleNames: string[];
  reason: string | null;
}

export interface BeneficiaryMedicalRecordRow {
  scope: "beneficiaries";
  personId: string;
  recordId: string | null;
  personName: string;
  documentLabel: string;
  profileKind: BeneficiaryProfileKind;
  profileLabel: string;
  hasRecord: boolean;
  summary: string;
  updatedAt: string | null;
  loggable: boolean;
}

export interface VolunteerSensitiveRecordRow {
  scope: "volunteers";
  personId: string;
  recordId: string | null;
  personName: string;
  documentLabel: string;
  stateLabel: string;
  hasRecord: boolean;
  summary: string;
  updatedAt: string | null;
  loggable: boolean;
}

export type SensitiveMedicalListRow =
  | BeneficiaryMedicalRecordRow
  | VolunteerSensitiveRecordRow;

export interface BeneficiaryMedicalRecordInput {
  bloodType: string | null;
  allergies: string | null;
  preexistingConditions: string | null;
  currentMedication: string | null;
  accessReason: string;
}

export interface VolunteerSensitiveRecordInput {
  medicalConditions: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  accessReason: string;
}

export interface BeneficiaryMedicalDetail {
  scope: "beneficiaries";
  personId: string;
  recordId: string | null;
  personName: string;
  documentLabel: string;
  profileKind: BeneficiaryProfileKind;
  profileLabel: string;
  hasRecord: boolean;
  bloodType: string;
  allergies: string;
  preexistingConditions: string;
  currentMedication: string;
  childProfile: BeneficiaryChildProfile | null;
  seniorProfile: BeneficiarySeniorProfile | null;
  createdBy: string;
  updatedBy: string;
  updatedAt: string | null;
  accessLogged: boolean;
  accessWarning: string | null;
}

export interface VolunteerSensitiveDetail {
  scope: "volunteers";
  personId: string;
  recordId: string | null;
  personName: string;
  documentLabel: string;
  hasRecord: boolean;
  stateLabel: string;
  medicalConditions: string;
  emergencyContact: string;
  emergencyPhone: string;
  createdBy: string;
  updatedBy: string;
  updatedAt: string | null;
  accessLogged: boolean;
  accessWarning: string | null;
}

export type SensitiveMedicalDetail =
  | BeneficiaryMedicalDetail
  | VolunteerSensitiveDetail;

export type IdCardFieldKey = "foto" | "nombre" | "dni" | "codigo" | "qr";
export type IdCardStatusCode = "activa" | "revocada" | "expirada";

export interface IdCardCapabilityState {
  currentUserId: string | null;
  tenantId: string | null;
  isTenantAdmin: boolean;
  canRead: boolean;
  canManage: boolean;
  warnings: string[];
}

export interface IdCardTemplateFieldRow {
  id: string | null;
  fieldKey: IdCardFieldKey;
  label: string;
  posX: number;
  posY: number;
  width: number | null;
  height: number | null;
  fontSize: number | null;
  fontFamily: string | null;
  fontWeight: string | null;
  colorHex: string | null;
  zIndex: number;
}

export interface IdCardTemplateSummaryRow {
  id: string;
  name: string;
  baseImageUrl: string;
  templateWidth: number;
  templateHeight: number;
  isActive: boolean;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
  updatedAtLabel: string;
}

export interface IdCardTemplateDetailData {
  template: IdCardTemplateSummaryRow;
  fields: IdCardTemplateFieldRow[];
  createdBy: string;
  updatedBy: string;
}

export interface IdCardVolunteerOption {
  value: string;
  label: string;
  fullName: string;
  documentLabel: string;
  photoUrl: string | null;
  stateLabel: string;
}

export interface IdCardTemplateOption {
  value: string;
  label: string;
  isActive: boolean;
}

export interface IdCardListRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  documentLabel: string;
  volunteerPhotoUrl: string | null;
  templateId: string;
  templateName: string;
  cardCode: string;
  qrPayload: string;
  issuedAt: string;
  issuedAtLabel: string;
  expiresAt: string | null;
  expiresAtLabel: string;
  stateCode: IdCardStatusCode;
  stateLabel: string;
  statusVariant: StatusVariant;
  imageRenderUrl: string | null;
}

export interface IdCardDetailData {
  card: IdCardListRow;
  template: IdCardTemplateSummaryRow;
  fields: IdCardTemplateFieldRow[];
  createdBy: string;
  updatedBy: string;
}

export interface IdCardWorkspaceData {
  access: IdCardCapabilityState;
  templates: IdCardTemplateSummaryRow[];
  cards: IdCardListRow[];
  volunteerOptions: IdCardVolunteerOption[];
  templateOptions: IdCardTemplateOption[];
  warnings: string[];
}

export interface IdCardTemplateUpsertInput {
  name: string;
  baseImageUrl: string;
  templateWidth: number;
  templateHeight: number;
  isActive: boolean;
  fields: IdCardTemplateFieldRow[];
  /** Template config JSONB (any JSON schema). Persisted to template_config. */
  templateConfig?: Record<string, unknown> | null;
}

export interface IdCardUpsertInput {
  volunteerId: string;
  templateId: string;
  cardCode: string | null;
  expiresAt: string | null;
  stateCode: IdCardStatusCode;
  imageRenderUrl: string | null;
}

export interface IdCardRenderSubject {
  fullName: string;
  documentLabel: string;
  photoUrl: string | null;
  cardCode: string;
  qrPayload: string;
}
