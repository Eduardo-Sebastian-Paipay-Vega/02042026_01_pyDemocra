import type { StatusVariant } from "../operation/types";
import type { SelectOption } from "../operation/types";

export type AdmissionStateKind =
  | "received"
  | "review"
  | "interview"
  | "approved"
  | "rejected"
  | "onboarding"
  | "other";

export type AdmissionStateCode = "nueva" | "en_entrevista" | "aprobada" | "rechazada";

export interface AdmissionStateOption {
  value: AdmissionStateCode;
  label: string;
  kind: AdmissionStateKind;
  variant: StatusVariant;
}

export interface AdmissionVolunteerSummary {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  documentNumber: string;
  documentType: string | null;
  stateCode: string | null;
}

export type AdmissionVolunteerLinkSource = "direct" | "email" | "none";

export interface AdmissionRequestRow {
  id: string;
  nombres: string;
  apellidos: string;
  fullName: string;
  email: string;
  stateCode: AdmissionStateCode;
  stateName: string;
  stateKind: AdmissionStateKind;
  stateVariant: StatusVariant;
  notes: string;
  submittedAt: string;
  rawSubmittedAt: string;
  createdAt: string;
  updatedAt: string;
  linkedVolunteerId: string | null;
  linkedVolunteerName: string | null;
  resolvedVolunteerId: string | null;
  resolvedVolunteerName: string | null;
  resolvedVolunteerSource: AdmissionVolunteerLinkSource;
}

export interface AdmissionKpis {
  total: number;
  pending: number;
  review: number;
  interview: number;
  onboarding: number;
  approved: number;
  rejected: number;
  converted: number;
  pendingConversion: number;
}

export interface AdmissionFilters {
  searchTerm: string;
  status: "all" | AdmissionStateKind;
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

export interface AdmissionListData {
  rows: AdmissionRequestRow[];
  total: number;
  page: number;
  pageSize: number;
  stateOptions: AdmissionStateOption[];
  kpis: AdmissionKpis;
  warnings: string[];
}

export interface AdmissionDocumentRow {
  id: string;
  requestId: string;
  requestName: string;
  type: string;
  fileUrl: string;
  estadoValidacion: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  comentariosRechazo: string | null;
  verifiedById: string | null;
  verifiedByLabel: string | null;
  verifiedAt: string | null;
  verifiedAtLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionInterviewRow {
  id: string;
  requestId: string;
  requestName: string;
  scheduledAt: string;
  scheduledAtRaw: string;
  interviewerId: string;
  interviewerLabel: string;
  result: string;
  comment: string;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionOnboardingStepRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  stepId: string;
  stepName: string;
  order: number;
  mandatory: boolean;
  completed: boolean;
  completedAt: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  blockReason?: string;
}

export interface AdmissionHistoryItem {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  variant?: StatusVariant;
}

export interface AdmissionDetailCapabilities {
  documents: boolean;
  interviews: boolean;
  onboarding: boolean;
  history: boolean;
  conversion: boolean;
}

export interface AdmissionRequestDetailData {
  request: AdmissionRequestRow;
  relatedVolunteer: AdmissionVolunteerSummary | null;
  documents: AdmissionDocumentRow[];
  interviews: AdmissionInterviewRow[];
  onboardingSteps: AdmissionOnboardingStepRow[];
  history: AdmissionHistoryItem[];
  capabilities: AdmissionDetailCapabilities;
  warnings: string[];
}

export interface AdmissionCreateInput {
  nombres: string;
  apellidos: string;
  email: string;
  notes?: string | null;
  stateCode?: AdmissionStateCode | null;
  actorId?: string | null;
}

export interface AdmissionUpdateInput {
  requestId: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  notes?: string | null;
  actorId?: string | null;
}

export interface AdmissionStateChangeInput {
  requestId: string;
  stateCode: AdmissionStateCode;
  comment?: string | null;
  actorId?: string | null;
}

export interface AdmissionConvertInput {
  requestId: string;
  numeroDocumento: string;
  tipoDocumento?: string | null;
  genero?: string | null;
  codigoPais?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  observaciones?: string | null;
  codigoEstado?: string | null;
  actorId?: string | null;
}

export interface AdmissionConvertResult {
  requestId: string;
  volunteerId: string;
  created: boolean;
}

export interface AdmissionRegistrationCodeRow {
  id: string;
  tenantId: string;
  code: string;
  targetEmail: string | null;
  targetDocumentNumber: string | null;
  targetFullName: string;
  requestId: string | null;
  volunteerId: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  usesLabel: string;
}

export interface AdmissionPublicRegistrationCatalogs {
  documentTypes: SelectOption[];
  genders: SelectOption[];
  countries: SelectOption[];
}

export interface AdmissionPublicRegistrationCodePreview {
  tenantId: string;
  codeId: string;
  code: string;
  status: string;
  expiresAt: string;
  expiresAtLabel: string;
  usesLabel: string;
  requestId: string | null;
  volunteerId: string | null;
  linkedVolunteerName: string | null;
  targetEmail: string | null;
  targetDocumentNumber: string | null;
  targetFullName: string;
  email: string | null;
  documentNumber: string | null;
  documentType: string | null;
  firstName: string;
  lastName: string;
  genderCode: string | null;
  countryCode: string | null;
  birthDate: string | null;
  phone: string | null;
  notes: string | null;
  emailLocked: boolean;
  documentLocked: boolean;
  canConsume: boolean;
  warning: string | null;
}

export interface AdmissionPublicRegistrationDocumentInput {
  type: string;
  manualUrl?: string | null;
  file?: File | null;
}

export interface AdmissionPublicVolunteerRegistrationInput {
  tenantId?: string | null;
  code: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType: string | null;
  genderCode: string | null;
  countryCode: string | null;
  birthDate: string | null;
  phone: string | null;
  notes: string | null;
  documents: AdmissionPublicRegistrationDocumentInput[];
}

export interface AdmissionPublicVolunteerRegistrationResult {
  tenantId: string;
  codeId: string;
  code: string;
  email: string;
  userId: string;
  volunteerId: string;
  requestId: string | null;
  existingUser: boolean;
  profileSynced: boolean;
  volunteerLinked: boolean;
  requestLinked: boolean;
  documentsRegistered: number;
  codeStatus: string;
  usesLabel: string;
}

export interface AdmissionGenerateRegistrationCodeInput {
  requestId: string;
  email?: string | null;
  numeroDocumento?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  expiresInMinutes?: number | null;
}

export interface AdmissionReferenceCatalogs {
  documentTypes: SelectOption[];
  genders: SelectOption[];
  countries: SelectOption[];
  volunteerStates: SelectOption[];
}

export interface AdmissionDocumentCreateInput {
  requestId: string;
  type: string;
  fileUrl: string;
  estadoValidacion?: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  comentariosRechazo?: string | null;
  actorId?: string | null;
}

export interface AdmissionDocumentUpdateInput {
  documentId: string;
  type?: string;
  fileUrl?: string;
  estadoValidacion?: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  comentariosRechazo?: string | null;
  actorId?: string | null;
}

export interface AdmissionInterviewCreateInput {
  requestId: string;
  scheduledAt: string;
  result?: string | null;
  comment?: string | null;
  score?: number | null;
  interviewerId?: string | null;
  actorId?: string | null;
}

export interface AdmissionInterviewUpdateInput {
  interviewId: string;
  scheduledAt?: string;
  result?: string | null;
  comment?: string | null;
  score?: number | null;
  interviewerId?: string | null;
  actorId?: string | null;
}

export interface AdmissionOnboardingStartInput {
  volunteerId: string;
  stepIds?: string[];
  actorId?: string | null;
}

export interface AdmissionOnboardingStepUpdateInput {
  volunteerId: string;
  stepId: string;
  completed: boolean;
  evidenceUrl?: string | null;
  actorId?: string | null;
}

export interface AdmissionOnboardingCloseInput {
  volunteerId: string;
  actorId?: string | null;
}
