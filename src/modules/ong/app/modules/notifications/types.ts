export interface NotificationSelectOption {
  value: string;
  label: string;
}

export interface NotificationsCapabilityState {
  currentUserId: string | null;
  tenantId: string | null;
  isTenantAdmin: boolean;
  hasReadPermission: boolean;
  hasManagePermission: boolean;
  canReadTemplates: boolean;
  canManageTemplates: boolean;
  canReadHistory: boolean;
  warnings: string[];
}

export interface NotificationTemplateSummary {
  total: number;
  active: number;
  inactive: number;
  channels: number;
  withEventCode: number;
}

export interface NotificationTemplateRow {
  id: string;
  channelCode: string;
  channelLabel: string;
  name: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  eventCode: string;
  variablesJson: string;
  variablesPreview: string;
  variablesSummary: string;
  active: boolean;
  activeLabel: string;
  statusVariant: "success" | "secondary";
  contentSummary: string;
  createdAt: string;
  createdAtLabel: string;
  createdBy: string | null;
  createdByLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  updatedBy: string | null;
  updatedByLabel: string;
  searchValue: string;
}

export interface NotificationTemplateMutationInput {
  templateId?: string;
  channelCode: string;
  name: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  eventCode: string;
  variablesJson: string;
  active: boolean;
}

export interface NotificationTemplatesData {
  access: NotificationsCapabilityState;
  rows: NotificationTemplateRow[];
  channelOptions: NotificationSelectOption[];
  summary: NotificationTemplateSummary;
  warnings: string[];
  unsupportedFlows: string[];
}

export interface NotificationHistorySummary {
  total: number;
  unread: number;
  withErrors: number;
  linkedTemplates: number;
}

export type NotificationHistoryReadState = "all" | "read" | "unread";

export interface NotificationHistoryFilters {
  searchTerm: string;
  recipientId: string | "all";
  channelCode: string | "all";
  deliveryState: string | "all";
  readState: NotificationHistoryReadState;
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

export interface NotificationHistoryRow {
  id: string;
  recipientId: string;
  recipientLabel: string;
  title: string;
  message: string;
  messagePreview: string;
  isRead: boolean;
  readLabel: string;
  statusVariant: "success" | "warning";
  channelCode: string;
  channelLabel: string;
  deliveryStatusCode: string;
  deliveryStatusLabel: string;
  deliveryStatusVariant: "success" | "warning" | "destructive" | "info" | "secondary";
  errorMessage: string;
  templateId: string | null;
  templateLabel: string;
  payloadJson: string;
  payloadPreview: string;
  createdAt: string;
  createdAtLabel: string;
  createdBy: string | null;
  createdByLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  updatedBy: string | null;
  updatedByLabel: string;
  searchValue: string;
}

export interface NotificationTopbarItem {
  id: string;
  title: string;
  description: string;
  targetPath: string;
}

export interface NotificationHistoryData {
  access: NotificationsCapabilityState;
  rows: NotificationHistoryRow[];
  recipientOptions: NotificationSelectOption[];
  channelOptions: NotificationSelectOption[];
  deliveryStateOptions: NotificationSelectOption[];
  summary: NotificationHistorySummary;
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  unsupportedFlows: string[];
}
