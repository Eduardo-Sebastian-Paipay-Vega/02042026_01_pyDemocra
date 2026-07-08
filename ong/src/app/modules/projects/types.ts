export type ProjectModuleSection =
  | "projects"
  | "tasks"
  | "activities"
  | "assignments";

export type ProjectStatusKind =
  | "planning"
  | "active"
  | "completed"
  | "cancelled"
  | "other";

export type TaskStatusCode =
  | "pendiente"
  | "en_progreso"
  | "completada"
  | "cancelada";

export type ActivityStatusCode =
  | "pendiente"
  | "planificada"
  | "en_progreso"
  | "completada"
  | "cancelada";

export type TaskStatusKind =
  | "pending"
  | "in-progress"
  | "completed"
  | "cancelled";

export type ActivityStatusKind =
  | "pending"
  | "planned"
  | "in-progress"
  | "completed"
  | "cancelled";

export type AssignmentKind =
  | "project-volunteer"
  | "activity-volunteer"
  | "project-resource";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional FK metadata — used for cascading selectors (e.g. filter activities by project). */
  projectId?: string;
}

export interface ProjectStatusOption extends SelectOption {
  kind: ProjectStatusKind;
}

export interface TaskStatusOption extends SelectOption {
  code: TaskStatusCode;
  kind: TaskStatusKind;
}

export interface ActivityStatusOption extends SelectOption {
  code: ActivityStatusCode;
  kind: ActivityStatusKind;
}

export interface ProjectCatalogs {
  projectStates: ProjectStatusOption[];
  taskStates: TaskStatusOption[];
  activityStates: ActivityStatusOption[];
  areas: SelectOption[];
  projects: SelectOption[];
  tasks: SelectOption[];
  activities: SelectOption[];
  locations: SelectOption[];
  volunteers: SelectOption[];
  items: SelectOption[];
  canManage: boolean | null;
  permissionWarning: string | null;
}

export interface ProjectListFilters {
  searchTerm: string;
  stateCode: string | "all";
  areaId: string | "all";
}

export interface TaskListFilters {
  searchTerm: string;
  activityId: string | "all";
  statusCode: TaskStatusCode | "all";
}

export interface ActivityListFilters {
  searchTerm: string;
  projectId: string | "all";
  statusCode: ActivityStatusCode | "all";
  locationId: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
}

export interface AssignmentListFilters {
  searchTerm: string;
  kind: AssignmentKind | "all";
  projectId: string | "all";
  taskId: string | "all";
  activityId: string | "all";
  volunteerId: string | "all";
  itemId: string | "all";
  activeState: "all" | "active" | "inactive";
}

export interface ProjectRow {
  id: string;
  code: string;
  name: string;
  description: string;
  areaId: string;
  areaName: string;
  stateCode: string;
  stateLabel: string;
  stateKind: ProjectStatusKind;
  startDate: string | null;
  endDate: string | null;
  budget: number;
  imageUrl: string | null;
  taskCount: number;
  activityCount: number;
  volunteerCount: number;
  resourceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVolunteerAssignmentRow {
  id: string;
  projectId: string;
  projectName: string;
  volunteerId: string;
  volunteerName: string;
  role: string | null;
  joinedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResourceAssignmentRow {
  id: string;
  projectId: string;
  projectName: string;
  itemId: string;
  itemName: string;
  quantityRequired: number;
  quantityAssigned: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailData {
  project: ProjectRow;
  createdBy: string | null;
  updatedBy: string | null;
  linkedActivities: ActivityRow[];
  linkedTasks: TaskRow[];
  volunteerAssignments: ProjectVolunteerAssignmentRow[];
  resourceAssignments: ProjectResourceAssignmentRow[];
  warnings: string[];
}

/**
 * Hierarchy: Proyecto → Actividad → Tarea
 * Tasks are children of Activities. activityId may be null for tasks created
 * before the hierarchy migration (they must be re-assigned via UI).
 */
export interface TaskRow {
  id: string;
  activityId: string | null;
  activityName: string | null;
  title: string;
  description: string | null;
  statusCode: TaskStatusCode;
  statusLabel: string;
  statusKind: TaskStatusKind;
  deadline: string | null;
  volunteerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetailData {
  task: TaskRow;
  createdBy: string | null;
  updatedBy: string | null;
  warnings: string[];
}

/**
 * Hierarchy: Proyecto → Actividad → Tarea
 * Activities are direct children of Projects.
 */
export interface ActivityRow {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  statusCode: ActivityStatusCode;
  statusLabel: string;
  statusKind: ActivityStatusKind;
  startAt: string | null;
  endAt: string | null;
  locationId: string | null;
  locationName: string | null;
  assignedVolunteers: number;
  registeredHours: number;
  evidenceCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityVolunteerAssignmentRow {
  id: string;
  activityId: string;
  activityName: string;
  volunteerId: string;
  volunteerName: string;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityHourRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  date: string;
  hours: number;
  approvalState: string | null;
}

export interface ActivityEvidenceRow {
  id: string;
  volunteerId: string;
  volunteerName: string;
  route: string;
  evidenceType: string | null;
  comment: string | null;
  createdAt: string;
}

export interface ActivityDetailData {
  activity: ActivityRow;
  createdBy: string | null;
  updatedBy: string | null;
  assignments: ActivityVolunteerAssignmentRow[];
  hours: ActivityHourRow[];
  evidences: ActivityEvidenceRow[];
  linkedTasks: TaskRow[];
  warnings: string[];
}

export interface AssignmentRow {
  id: string;
  kind: AssignmentKind;
  projectId: string;
  projectName: string;
  taskId: string | null;
  taskName: string | null;
  activityId: string | null;
  activityName: string | null;
  volunteerId: string | null;
  volunteerName: string | null;
  itemId: string | null;
  itemName: string | null;
  role: string | null;
  joinedAt: string | null;
  quantityRequired: number | null;
  quantityAssigned: number | null;
  active: boolean | null;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentDetailData {
  assignment: AssignmentRow;
  warnings: string[];
}

export interface ProjectFormValues {
  code: string;
  name: string;
  description: string;
  areaId: string;
  stateCode: string;
  startDate: string;
  endDate: string;
  budget: string;
  imageUrl: string;
  imageFile: File | null;
}

export interface TaskFormValues {
  activityId: string;
  title: string;
  description: string;
  statusCode: TaskStatusCode;
  deadline: string;
}

export interface ActivityFormValues {
  projectId: string;
  title: string;
  description: string;
  statusCode: ActivityStatusCode;
  startAt: string;
  endAt: string;
  locationId: string;
  estimatedHours: string;
}

export interface ProjectVolunteerAssignmentFormValues {
  projectId: string;
  volunteerId: string;
  role: string;
  joinedAt: string;
  active: boolean;
}

export interface ActivityVolunteerAssignmentFormValues {
  activityId: string;
  volunteerId: string;
  role: string;
}

export interface ProjectResourceAssignmentFormValues {
  projectId: string;
  itemId: string;
  quantityRequired: string;
  quantityAssigned: string;
}
