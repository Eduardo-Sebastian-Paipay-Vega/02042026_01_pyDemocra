export interface GovernanceSelectOption {
  value: string;
  label: string;
}

export interface GovernanceCapabilityState {
  currentUserId: string | null;
  isTenantAdmin: boolean;
  canReadCatalogs: boolean;
  canReadAudit: boolean;
  canReadSensitiveAccess: boolean;
  canReadRetention: boolean;
  canReadConstraints: boolean;
  canManageConstraints: boolean;
  warnings: string[];
}

export type GovernanceCatalogKey =
  | "public.cat_permissions"
  | "public.cat_tipos_documento"
  | "public.cat_generos"
  | "public.cat_paises"
  | "public.cat_monedas"
  | "public.cat_module_statuses"
  | "ong.estados_voluntario"
  | "ong.unidades_medida"
  | "ong.estados_objeto"
  | "ong.estados_proyecto"
  | "ong.tipo_transaccion_inventario"
  | "rrhh.habilidades"
  | "comunicaciones.canales_notificacion";

export interface GovernanceCatalogSummaryRow {
  id: GovernanceCatalogKey;
  key: GovernanceCatalogKey;
  schemaName: string;
  tableName: string;
  label: string;
  description: string;
  statusLabel: string;
  canWrite: boolean;
  rowCount: number | null;
  primaryColumn: string;
  sourceReference: string;
}

export interface GovernanceCatalogEntryField {
  label: string;
  value: string;
}

export interface GovernanceCatalogEntryRow {
  id: string;
  catalogKey: GovernanceCatalogKey;
  primaryValue: string;
  secondaryValue: string;
  tertiaryValue: string;
  supportLabel: string;
  fields: GovernanceCatalogEntryField[];
  raw: Record<string, unknown>;
}

export interface GovernanceCatalogData {
  catalogs: GovernanceCatalogSummaryRow[];
  rows: GovernanceCatalogEntryRow[];
  selectedCatalog: GovernanceCatalogSummaryRow | null;
  warnings: string[];
}

export interface GovernanceAuditFilters {
  searchTerm: string;
  schemaName: string | "all";
  tableName: string | "all";
  operation: string | "all";
  actorId: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
  limit?: number;
}

export interface GovernanceAuditEvent {
  id: string;
  source: "public.audit_logs" | "auditoria.audit_log";
  schemaName: string;
  tableName: string;
  operation: string;
  recordPk: string | null;
  actorId: string | null;
  actorLabel: string;
  occurredAt: string;
  occurredAtLabel: string;
  summary: string;
  sourceLabel: string;
  ip: string | null;
  userAgent: string | null;
  correlationId: string | null;
  oldData: unknown;
  newData: unknown;
}

export interface GovernanceAuditData {
  access: GovernanceCapabilityState;
  rows: GovernanceAuditEvent[];
  schemaOptions: GovernanceSelectOption[];
  tableOptions: GovernanceSelectOption[];
  actorOptions: GovernanceSelectOption[];
  warnings: string[];
}

export interface SensitiveAccessLogFilters {
  searchTerm: string;
  actorId: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
  limit?: number;
}

export interface SensitiveAccessLogRow {
  id: string;
  recordId: string;
  sourceTable: "clinico.accesos_sensibles_log" | "clinico.accesos_sensibles_voluntario_log";
  resourceType: "beneficiario" | "voluntario";
  resourceTypeLabel: string;
  subjectId: string;
  subjectName: string;
  subjectDocument: string;
  actorId: string;
  actorLabel: string;
  reason: string;
  ip: string;
  userAgent: string;
  accessedAt: string;
  accessedAtLabel: string;
}

export interface RoleAccessConstraintRow {
  id: string;
  roleId: string;
  roleName: string;
  sedeId: string | null;
  sedeName: string;
  ipCidr: string;
  timeStart: string;
  timeEnd: string;
  requireTrustedDevice: boolean;
  createdAt: string;
  createdAtLabel: string;
}

export interface RoleAccessConstraintFormInput {
  roleId: string;
  sedeId: string | "all";
  ipCidr: string;
  timeStart: string;
  timeEnd: string;
  requireTrustedDevice: boolean;
}

export interface RoleAccessConstraintMutationInput
  extends RoleAccessConstraintFormInput {
  constraintId?: string;
}

export interface GovernanceSensitiveAccessData {
  access: GovernanceCapabilityState;
  logRows: SensitiveAccessLogRow[];
  actorOptions: GovernanceSelectOption[];
  constraints: RoleAccessConstraintRow[];
  roleOptions: GovernanceSelectOption[];
  sedeOptions: GovernanceSelectOption[];
  warnings: string[];
  unsupportedFlows: string[];
}

export interface GovernanceRestoreCandidateRow {
  id: string;
  schemaName: "ong" | "rrhh";
  tableName:
    | "asistencias"
    | "asignaciones_actividad"
    | "recursos_proyecto"
    | "onboarding_voluntario";
  entityLabel: string;
  scopeLabel: string;
  deletedAt: string;
  deletedAtLabel: string;
  deletedBy: string | null;
  deletedByLabel: string;
  sourceReference: string;
}

export interface GovernanceRetentionData {
  access: GovernanceCapabilityState;
  retentionDays: number | null;
  retentionPolicyLabel: string;
  canRestoreRecords: boolean;
  restoreCandidates: GovernanceRestoreCandidateRow[];
  recentDeleteEvents: GovernanceAuditEvent[];
  warnings: string[];
  supportNotes: string[];
}

