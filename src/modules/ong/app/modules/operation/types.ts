export type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "default";

export interface SelectOption {
  value: string;
  label: string;
}

export interface NumericSelectOption {
  value: number;
  label: string;
}

export type ActivityPeriodFilter = "all" | "today" | "week";
export type ActivityStatusKind =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "other";

export interface OperationActivityRow {
  id: string;
  taskId: string;
  name: string;
  description: string;
  taskName: string;
  projectId: string | null;
  projectName: string;
  locationId: string | null;
  statusId: number | null;
  statusName: string;
  statusKind: ActivityStatusKind;
  statusVariant: StatusVariant;
  startAt: string | null;
  endAt: string | null;
  scheduleText: string;
  locationName: string;
  meta: string;
  assignedVolunteers: number;
  assignedVolunteerIds: string[];
  assignedVolunteerNames: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface OperationActivitySummary {
  key: string;
  label: string;
  count: number;
  variant: StatusVariant;
}

export interface OperationActivityFilters {
  searchTerm: string;
  period: ActivityPeriodFilter;
  stateId: number | "all";
  projectId: string | "all";
  taskId: string | "all";
  locationId: string | "all";
  volunteerId: string | "all";
}

export interface OperationActivitiesData {
  rows: OperationActivityRow[];
  stateOptions: NumericSelectOption[];
  projectOptions: SelectOption[];
  taskOptions: SelectOption[];
  locationOptions: SelectOption[];
  volunteerOptions: SelectOption[];
  warnings: string[];
}

export interface ActivityCreateInput {
  taskId: string;
  name: string;
  description?: string;
  statusId: number;
  startAt?: string | null;
  endAt?: string | null;
  locationId?: string | null;
  meta?: string | null;
  actorId?: string | null;
}

export interface ActivityUpdateInput {
  taskId?: string;
  name?: string;
  description?: string | null;
  statusId?: number;
  startAt?: string | null;
  endAt?: string | null;
  locationId?: string | null;
  meta?: string | null;
  actorId?: string | null;
}

export interface ActivityAssignmentRow {
  id: string;
  activityId: string;
  volunteerId: string;
  volunteerName: string;
  role: string;
  assignedAt: string;
  active: boolean;
}

export interface ActivityAssignmentCreateInput {
  activityId: string;
  volunteerId: string;
  role?: string;
}

export interface ActivityAssignmentUpdateInput {
  assignmentId: string;
  role?: string;
  active?: boolean;
}

export interface ActivityRelatedHourRow {
  id: string;
  volunteerName: string;
  date: string;
  startTime: string;
  endTime: string;
  minutes: number;
  statusName: string;
}

export interface ActivityRelatedEvidenceRow {
  id: string;
  typeName: string;
  volunteerName: string;
  route: string;
  uploadedAt: string;
  validationStatusName: string;
}

export interface ActivityDetailData {
  activity: OperationActivityRow;
  assignments: ActivityAssignmentRow[];
  hours: ActivityRelatedHourRow[];
  evidences: ActivityRelatedEvidenceRow[];
  warnings?: string[];
}

export type AttendanceStatusKind = "open" | "closed" | "incidence";

export interface OperationAttendanceRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  projectId: string | null;
  projectName: string;
  activityId: string | null;
  activityName: string;
  dateLabel: string;
  entryLabel: string;
  exitLabel: string;
  contextLabel: string;
  status: AttendanceStatusKind;
  statusVariant: StatusVariant;
  stateCode: string;
  stateLabel: string;
  source: "scan" | "manual" | "import";
  sourceLabel: string;
  incidenceReason: string | null;
  observation: string;
  rawDate: string;
  rawEntry: string | null;
  rawExit: string | null;
  durationMinutes: number | null;
  isCorrected: boolean;
  canEdit: boolean;
  canClose: boolean;
}

export interface AttendanceRegisterInput {
  volunteerId: string;
  projectId?: string | null;
  activityId?: string | null;
  date?: string;
  entryTime?: string;
  exitTime?: string;
  observation?: string;
}

export interface AttendanceExitInput {
  attendanceId?: string;
  volunteerId?: string;
  projectId?: string | null;
  activityId?: string | null;
  exitTime?: string;
  observation?: string;
}

export interface AttendanceUpdateInput {
  attendanceId: string;
  projectId?: string | null;
  activityId?: string | null;
  date?: string;
  entryTime?: string | null;
  exitTime?: string | null;
  observation?: string;
  correctionReason?: string;
}

export interface AttendanceIncidenceInput {
  attendanceId: string;
  reason: string;
}

export interface AttendanceScanInput {
  qrPayload: string;
  activityId: string;
  scanTime?: string | null;
}

export type AttendanceScanOutcome = "check-in" | "check-out";

export interface AttendanceScanResult {
  attendance: OperationAttendanceRow;
  outcome: AttendanceScanOutcome;
  outcomeLabel: string;
  confirmationTitle: string;
  confirmationMessage: string;
  cardCode: string;
  scannedAt: string | null;
  scannedAtLabel: string;
}

export interface OperationAttendanceData {
  rows: OperationAttendanceRow[];
  volunteerOptions: SelectOption[];
  projectOptions: SelectOption[];
  activityOptions: SelectOption[];
  warnings: string[];
}

export interface AttendanceFilters {
  searchTerm: string;
  status: "all" | AttendanceStatusKind;
  volunteerId: string | "all";
  projectId: string | "all";
  activityId: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
}

export type ApprovalStatusKind =
  | "pending"
  | "approved"
  | "rejected"
  | "observed"
  | "other";

export interface ApprovalStateOption {
  value: number;
  label: string;
  kind: ApprovalStatusKind;
}

export interface OperationHoursRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  activityId: string;
  activityName: string;
  projectId: string | null;
  projectName: string;
  date: string;
  startTime: string;
  endTime: string;
  minutes: number;
  hours: number;
  statusId: number;
  statusName: string;
  statusKind: ApprovalStatusKind;
  statusVariant: StatusVariant;
  observation: string;
  requestedAt: string;
  approvedAt: string;
  requestedBy: string;
  approvedBy: string;
  isCorrected: boolean;
  canReview: boolean;
}

export interface HoursRegisterInput {
  activityId: string;
  volunteerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  minutes?: number | null;
  observation?: string;
  actorId?: string | null;
}

export interface HoursUpdateInput {
  hoursId: string;
  activityId?: string;
  volunteerId?: string;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  minutes?: number | null;
  observation?: string;
  correctionReason?: string;
  actorId?: string | null;
  allowResolvedEdit?: boolean;
}

export interface HoursResolutionInput {
  hoursId: string;
  targetStateId: number;
  comment?: string;
  reviewerId?: string;
  reviewerRole?: string | null;
}

export interface HoursApprovalRequestInput {
  hoursId: string;
  requesterId?: string;
  comment?: string;
}

export interface OperationHoursData {
  rows: OperationHoursRow[];
  volunteerOptions: SelectOption[];
  activityOptions: SelectOption[];
  projectOptions: SelectOption[];
  approvalStates: ApprovalStateOption[];
  warnings: string[];
}

export interface HoursFilters {
  searchTerm: string;
  status: "all" | ApprovalStatusKind;
  scope: "all" | "mine" | "review";
  volunteerId: string | "all";
  projectId: string | "all";
  activityId: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
}

export interface OperationEvidenceRow {
  id: string;
  activityId: string;
  activityName: string;
  projectId: string | null;
  projectName: string;
  volunteerId: string | null;
  volunteerName: string;
  typeId: number | null;
  typeName: string;
  route: string;
  description: string;
  uploadedAt: string;
  rawUploadedAt: string;
  hash: string;
  validationStatusId: number | null;
  validationStatusName: string;
  validationStatusKind: ApprovalStatusKind;
  validationVariant: StatusVariant;
}

export interface EvidenceRegisterInput {
  activityId: string;
  volunteerId?: string | null;
  typeId?: number | null;
  routeInput?: string;
  description?: string;
  file?: File | null;
}

export interface EvidenceUpdateInput {
  evidenceId: string;
  typeId?: number | null;
  routeInput?: string;
  description?: string | null;
}

export interface EvidenceValidationInput {
  evidenceId: string;
  targetStateId: number;
  reviewerId?: string;
  comment?: string;
}

export interface OperationEvidenceData {
  rows: OperationEvidenceRow[];
  volunteerOptions: SelectOption[];
  activityOptions: SelectOption[];
  evidenceTypeOptions: NumericSelectOption[];
  approvalStates: ApprovalStateOption[];
  warnings: string[];
}

export interface EvidenceFilters {
  searchTerm: string;
  activityId: string | "all";
  volunteerId: string | "all";
  typeId: number | "all";
  validation: "all" | ApprovalStatusKind;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface OperationApprovalRow {
  id: string;
  module: string;
  entitySchema: string;
  entityTable: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  entitySubtitle: string;
  subjectId: string | null;
  subjectName: string;
  contextDate: string;
  contextMeta: string;
  statusId: number;
  statusName: string;
  statusKind: ApprovalStatusKind;
  statusVariant: StatusVariant;
  requestedById: string | null;
  requestedBy: string;
  requestedAt: string;
  approvedById: string | null;
  approvedBy: string;
  approvedAt: string;
  comment: string;
}

export interface ApprovalContextField {
  label: string;
  value: string;
}

export type ApprovalEntityContextKind = "hours" | "evidence" | "generic";

export interface OperationApprovalEntityContext {
  kind: ApprovalEntityContextKind;
  title: string;
  summary: string;
  missing: boolean;
  fields: ApprovalContextField[];
}

export interface OperationApprovalDetail {
  approval: OperationApprovalRow;
  context: OperationApprovalEntityContext;
}

export interface OperationApprovalsData {
  rows: OperationApprovalRow[];
  total: number;
  page: number;
  pageSize: number;
  volunteerOptions: SelectOption[];
  approvalStates: ApprovalStateOption[];
  warnings: string[];
}

export interface ApprovalFilters {
  searchTerm: string;
  entityType: string | "all";
  entityId: string;
  status: "all" | ApprovalStatusKind;
  requestedById: string | "all";
  approvedById: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

export interface ApprovalCreateInput {
  entityType: string;
  entityId: string;
  stateId?: number;
  requestedBy?: string | null;
  comment?: string;
}

export interface ApprovalResolveInput {
  approvalId: string;
  targetStateId: number;
  reviewerId?: string | null;
  reviewerRole?: string | null;
  comment?: string;
}

