export interface DashboardMetricValues {
  volunteersActive: number;
  projectsActive: number;
  activitiesActive: number;
  hoursRegistered: number;
  hoursApproved: number;
  evidencesUploaded: number;
  admissionPending: number;
  approvalsPending: number;
}

export interface DashboardHoursRow {
  id: string;
  volunteerName: string;
  activityName: string;
  hours: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  statusLabel?: string;
  volunteerId?: string;
  activityId?: string;
  projectName?: string;
}

export interface DashboardActivityRow {
  id: string;
  name: string;
  description: string;
  projectName: string;
  date: string;
  assignedVolunteers: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  statusLabel: string;
  statusCode: string;
  startAt: string | null;
  endAt: string | null;
  locationId: string | null;
  locationName: string | null;
  taskId?: string;
  taskName?: string;
  taskStatus?: string;
  estimatedHours?: number | null;
}

export interface DashboardAdmissionRow {
  id: string;
  name: string;
  email: string;
  submittedAt: string;
  status: "pending" | "interviewing" | "approved" | "rejected";
  statusRaw?: string;
  notes?: string;
}

export interface WeeklyImpactPoint {
  label: string;
  value: number;
}

export interface DashboardTimelineItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  dotColor: string;
}

export interface DashboardAlertItem {
  id: string;
  text: string;
  type: "warning" | "info" | "secondary";
}

export interface HomeNotificationItem {
  id: string;
  title: string;
  description: string;
  targetPath: string;
}

export interface DashboardUserContext {
  userId: string | null;
  userName: string;
  roleNames: string[];
  isTenantAdmin: boolean;
  canManageActivities: boolean;
  canResolveHours: boolean;
  canResolveAdmissions: boolean;
}

export interface DashboardTaskOption {
  value: string;
  label: string;
  taskTitle: string;
  projectName: string;
  taskStatus: string;
  dueDate: string | null;
}

export interface DashboardLocationOption {
  value: string;
  label: string;
}

export interface DashboardActivityFormInput {
  taskId: string;
  title: string;
  description: string;
  statusCode: string;
  startAt: string | null;
  endAt: string | null;
  locationId: string | null;
  estimatedHours: number | null;
}

export interface DashboardActivityFormErrors {
  taskId?: string;
  title?: string;
  statusCode?: string;
  dateOrder?: string;
  estimatedHours?: string;
}

export interface DashboardActivityDetail {
  id: string;
  title: string;
  description: string;
  estimatedHours: number | null;
  createdAt: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  statusCode: string;
  statusLabel: string;
  startAt: string | null;
  endAt: string | null;
  locationId: string | null;
  locationName: string | null;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskDueDate: string | null;
  projectName: string;
  assignments: Array<{
    id: string;
    volunteerName: string;
    role: string;
  }>;
  registeredHours: number;
  evidenceCount: number;
}

export interface DashboardHoursDetail {
  id: string;
  activityName: string;
  projectName: string;
  volunteerName: string;
  date: string;
  hoursRegistered: number;
  status: "pending" | "approved" | "rejected";
  statusLabel: string;
  approvedBy: string | null;
  approvalComment: string | null;
  createdAt: string;
}

export interface DashboardAdmissionDetail {
  id: string;
  fullName: string;
  email: string;
  submittedAt: string;
  status: "pending" | "interviewing" | "approved" | "rejected";
  statusRaw: string;
  notes: string | null;
  history: Array<{
    id: string;
    oldState: string | null;
    newState: string;
    comment: string | null;
    changedAt: string;
    changedBy: string;
  }>;
}

export type GlobalSearchEntityType = "volunteer" | "project" | "activity" | "admission";

export interface GlobalSearchItem {
  id: string;
  type: GlobalSearchEntityType;
  title: string;
  subtitle: string;
  targetPath: string;
}

export interface GlobalSearchDetailField {
  label: string;
  value: string;
}

export interface GlobalSearchDetailData {
  id: string;
  type: GlobalSearchEntityType;
  title: string;
  subtitle: string;
  targetPath: string;
  fields: GlobalSearchDetailField[];
}

export interface GlobalSearchGroupedResults {
  volunteers: GlobalSearchItem[];
  projects: GlobalSearchItem[];
  activities: GlobalSearchItem[];
  admissions: GlobalSearchItem[];
}

