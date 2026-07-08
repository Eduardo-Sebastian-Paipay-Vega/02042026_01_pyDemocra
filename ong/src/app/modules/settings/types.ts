export interface SettingsSelectOption {
  value: string;
  label: string;
}

export interface SettingsCapabilityState {
  currentUserId: string | null;
  isTenantAdmin: boolean;
  canReadUsers: boolean;
  canManageUsers: boolean;
  canReadRoles: boolean;
  canManageRoles: boolean;
  canManageUserAssignments: boolean;
  canReadPermissions: boolean;
  canReadAudit: boolean;
  canReadSessions: boolean;
  canManageSessions: boolean;
  canReadDevices: boolean;
  canManageDevices: boolean;
  canReadTerminals: boolean;
  canManageTerminals: boolean;
  canReadAuthEvents: boolean;
  warnings: string[];
}

export interface SystemUserAssignmentRow {
  id: string;
  roleId: string;
  roleName: string;
  sedeId: string;
  sedeName: string;
  createdAt: string;
  createdAtLabel: string;
}

export interface SystemUserRow {
  id: string;
  fullName: string;
  documentLabel: string;
  tipoDocumento: string;
  numeroDocumento: string;
  genero: string;
  isBlocked: boolean;
  blockedReason: string;
  pinStatusLabel: string;
  pinFailedAttempts: number;
  pinBlockedUntilLabel: string;
  riskBlockedUntilLabel: string;
  createdAt: string;
  createdAtLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  isSystemUser: boolean;
  accessStatusLabel: string;
  roleAssignments: SystemUserAssignmentRow[];
  roleSummary: string;
  sedeSummary: string;
  totalSessionCount: number | null;
  activeSessionCount: number | null;
  lastSessionAt: string | null;
  lastSessionAtLabel: string;
  searchValue: string;
}

export interface SystemUserAssignmentDraft {
  roleId: string;
  sedeId: string;
}

export interface SystemUserAssignmentInput {
  userId: string;
  assignments: SystemUserAssignmentDraft[];
}

export interface SystemUsersData {
  access: SettingsCapabilityState;
  rows: SystemUserRow[];
  profileOptions: SettingsSelectOption[];
  roleOptions: SettingsSelectOption[];
  sedeOptions: SettingsSelectOption[];
  volunteerOptions: SettingsSelectOption[];
  warnings: string[];
  unsupportedFlows: string[];
}

export type SystemUserProvisionMode = "invite" | "create";

export interface SystemUserProvisionInput {
  email: string;
  fullName?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  genero?: string | null;
  volunteerId?: string | null;
  mode: SystemUserProvisionMode;
  temporaryPassword?: string | null;
}

export interface SystemUserProvisionResult {
  userId: string;
  email: string;
  mode: SystemUserProvisionMode;
  created: boolean;
  invited: boolean;
  existingUser: boolean;
  profileSynced: boolean;
  volunteerLinked: boolean;
  tenantId: string;
}

export interface SystemUserSessionsRevokeInput {
  userId: string;
  reason: string;
  sessionIds?: string[];
  targetAccessToken?: string | null;
}

export interface SystemUserSessionsRevokeResult {
  userId: string;
  revokedSessionIds: string[];
  revokedCount: number;
  authRevocationApplied: boolean;
  authRevocationWarning: string | null;
}

export interface RolePermissionAssignmentRow {
  id: string;
  description: string;
  module: string;
  createdAt: string | null;
  createdAtLabel: string;
}

export interface RoleUserAssignmentRow {
  id: string;
  userId: string;
  userLabel: string;
  sedeId: string;
  sedeName: string;
  createdAt: string;
  createdAtLabel: string;
}

export interface RoleRow {
  id: string;
  name: string;
  hierarchyLevel: number;
  isSystemRole: boolean;
  createdAt: string;
  createdAtLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  permissionCount: number;
  permissionSummary: string;
  permissions: RolePermissionAssignmentRow[];
  assignmentCount: number;
  userCount: number;
  assignments: RoleUserAssignmentRow[];
  searchValue: string;
}

export interface PermissionCatalogRow {
  id: string;
  description: string;
  module: string;
  createdAt: string;
  createdAtLabel: string;
  assignedRoleCount: number;
  searchValue: string;
}

export interface RoleMutationInput {
  roleId?: string;
  name: string;
  hierarchyLevel: number;
  permissionIds: string[];
}

export interface RolesSettingsData {
  access: SettingsCapabilityState;
  roles: RoleRow[];
  permissionCatalog: PermissionCatalogRow[];
  warnings: string[];
  unsupportedFlows: string[];
}

export interface SessionRow {
  id: string;
  userId: string | null;
  userLabel: string;
  terminalId: string | null;
  terminalName: string;
  deviceId: string | null;
  deviceLabel: string;
  sessionType: "web" | "terminal" | "api";
  statusKind: "active" | "revoked" | "expired";
  statusLabel: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  createdAtLabel: string;
  expiresAt: string;
  expiresAtLabel: string;
  revokedAt: string | null;
  revokedAtLabel: string;
  revokeReason: string;
  searchValue: string;
}

export interface DeviceRow {
  id: string;
  userId: string;
  userLabel: string;
  deviceFingerprint: string;
  isTrusted: boolean;
  lastIp: string;
  lastUserAgent: string;
  lastSeenAt: string | null;
  lastSeenAtLabel: string;
  createdAt: string;
  createdAtLabel: string;
  activeSessionCount: number;
  searchValue: string;
}

export interface TerminalRow {
  id: string;
  name: string;
  createdAt: string;
  createdAtLabel: string;
  sessionCount: number;
  activeSessionCount: number;
  searchValue: string;
}

export interface AuthEventRow {
  id: string;
  userId: string | null;
  userLabel: string;
  sessionId: string | null;
  sessionLabel: string;
  terminalId: string | null;
  terminalName: string;
  deviceId: string | null;
  deviceLabel: string;
  eventType: string;
  result: "success" | "error";
  resultLabel: string;
  ip: string;
  userAgent: string;
  errorCode: string;
  createdAt: string;
  createdAtLabel: string;
  searchValue: string;
}

export interface TerminalFormInput {
  name: string;
}

export interface TerminalMutationInput extends TerminalFormInput {
  terminalId?: string;
}

export interface SessionTerminationInput {
  sessionId: string;
  reason: string;
}

export interface DeviceTrustInput {
  deviceId: string;
  isTrusted: boolean;
}

export interface SecuritySettingsData {
  access: SettingsCapabilityState;
  sessions: SessionRow[];
  devices: DeviceRow[];
  terminals: TerminalRow[];
  authEvents: AuthEventRow[];
  warnings: string[];
  unsupportedFlows: string[];
}
