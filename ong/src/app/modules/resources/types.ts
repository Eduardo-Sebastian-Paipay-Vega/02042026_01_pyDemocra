import type { SelectOption, StatusVariant } from "../operation/types";

export type InventoryTransactionKind =
  | "entrada"
  | "salida"
  | "transferencia"
  | "ajuste"
  | "other";

export type InventoryRecordState = "active" | "inactive" | "all";

export interface InventoryItemRow {
  id: string;
  code: string;
  name: string;
  description: string;
  unitCode: string;
  unitLabel: string;
  stateCode: string;
  stateLabel: string;
  sku: string;
  imageUrl: string | null;
  active: boolean;
  activeLabel: string;
  statusVariant: StatusVariant;
  derivedStock: number | null;
  movementCount: number;
  lastMovementAt: string;
}

export interface InventoryLocationRow {
  id: string;
  code: string;
  name: string;
  address: string;
  countryCode: string;
  countryLabel: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  active: boolean;
  activeLabel: string;
  statusVariant: StatusVariant;
}

export interface InventoryTransactionTypeOption {
  value: string;
  label: string;
  sign: -1 | 0 | 1;
  kind: InventoryTransactionKind;
}

export interface InventoryMovementRow {
  id: string;
  itemId: string;
  itemName: string;
  typeCode: string;
  typeName: string;
  typeSign: -1 | 0 | 1;
  typeKind: InventoryTransactionKind;
  quantity: number;
  signedQuantity: number;
  date: string;
  rawDate: string;
  originId: string | null;
  originName: string;
  destinationId: string | null;
  destinationName: string;
  registeredBy: string;
  registeredById: string;
  statusVariant: StatusVariant;
  isReversal: boolean;
  observation: string;
  isDeleted: boolean;
}

export interface InventoryKardexRow extends InventoryMovementRow {
  runningBalance: number | null;
}

export interface InventoryStockRow {
  itemId: string;
  itemName: string;
  totalStock: number;
}

export interface InventoryStockByLocationRow {
  locationId: string;
  locationName: string;
  stock: number;
}

export interface InventoryStockByItemRow {
  itemId: string;
  itemName: string;
  stock: number;
}

export interface InventoryItemsFilters {
  searchTerm: string;
  state: InventoryRecordState;
  page: number;
  pageSize: number;
}

export interface InventoryLocationsFilters {
  searchTerm: string;
  page: number;
  pageSize: number;
}

export interface InventoryMovementsFilters {
  searchTerm: string;
  itemId: string | "all";
  typeCode: string | "all";
  typeId?: string | "all";
  originId: string | "all";
  destinationId: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
  includeDeleted: boolean;
  page: number;
  pageSize: number;
}

export interface InventoryKardexFilters {
  searchTerm: string;
  itemId: string | "all";
  locationId: string | "all";
  typeCode: string | "all";
  typeId?: string | "all";
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

export interface InventoryItemsData {
  rows: InventoryItemRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  unitOptions: SelectOption[];
  stateOptions: SelectOption[];
}

export interface InventoryLocationsData {
  rows: InventoryLocationRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  countryOptions: SelectOption[];
}

export interface InventoryMovementsData {
  rows: InventoryMovementRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  itemOptions: SelectOption[];
  locationOptions: SelectOption[];
  typeOptions: InventoryTransactionTypeOption[];
}

export interface InventoryKardexData {
  rows: InventoryKardexRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  itemOptions: SelectOption[];
  locationOptions: SelectOption[];
  typeOptions: InventoryTransactionTypeOption[];
}

export interface InventoryItemDetailData {
  item: InventoryItemRow;
  stockByLocation: InventoryStockByLocationRow[];
  latestMovements: InventoryMovementRow[];
  warnings: string[];
}

export interface InventoryLocationDetailData {
  location: InventoryLocationRow;
  stockByItem: InventoryStockByItemRow[];
  latestMovements: InventoryMovementRow[];
  warnings: string[];
}

export interface InventoryMovementDetailData {
  movement: InventoryMovementRow;
  warnings: string[];
}

export interface InventoryItemCreateInput {
  code: string;
  name: string;
  description?: string | null;
  unitCode: string;
  stateCode: string;
  sku?: string | null;
  imageUrl?: string | null;
  active?: boolean;
}

export interface InventoryItemUpdateInput {
  itemId: string;
  code?: string;
  name?: string;
  description?: string | null;
  unitCode?: string;
  stateCode?: string;
  sku?: string | null;
  imageUrl?: string | null;
  active?: boolean;
}

export interface InventoryLocationCreateInput {
  code: string;
  name: string;
  address?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  active?: boolean;
}

export interface InventoryLocationUpdateInput {
  locationId: string;
  code?: string;
  name?: string;
  address?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  active?: boolean;
}

export interface InventoryMovementCreateInput {
  itemId: string;
  typeCode: string;
  typeId?: string;
  quantity: number;
  originId?: string | null;
  destinationId?: string | null;
  transactionDate?: string | null;
  actorId?: string | null;
  observation?: string | null;
}

export interface InventoryMovementUpdateInput {
  movementId: string;
  quantity?: number;
  originId?: string | null;
  destinationId?: string | null;
  transactionDate?: string | null;
  actorId?: string | null;
  observation?: string | null;
  typeCode?: string;
  typeId?: string;
}

export interface InventoryMovementRemoveInput {
  movementId: string;
  actorId?: string | null;
  reason?: string | null;
}

export interface InventoryMutationFeedback {
  id: string;
  message: string;
}

export type FinancialRecordState = "active" | "inactive" | "all";

export type FinancialCategoryKind = "ingreso" | "egreso" | "other";

export type FinancialTransactionKind = "ingreso" | "egreso" | "other";

export type FinancialApprovalKind = "not-required" | "pending" | "approved" | "rejected" | "observed";

export interface FinancialAccountRow {
  id: string;
  name: string;
  typeCode: string;
  typeLabel: string;
  currency: string;
  balance: number;
  bank: string;
  accountNumber: string;
  active: boolean;
  activeLabel: string;
  statusVariant: StatusVariant;
  transactionCount: number;
  lastTransactionAt: string;
}

export interface FinancialCategoryRow {
  id: string;
  name: string;
  typeLabel: string;
  typeKind: FinancialCategoryKind;
  active: boolean;
  activeLabel: string;
  statusVariant: StatusVariant;
  transactionCount: number;
  lastTransactionAt: string;
}

export interface FinancialTransactionTypeOption {
  value: string;
  label: string;
  kind: FinancialTransactionKind;
}

export interface FinancialProjectOption {
  value: string;
  label: string;
}

export interface FinancialTransactionRow {
  id: string;
  accountId: string;
  accountName: string;
  accountTypeLabel: string;
  categoryId: string;
  categoryName: string;
  categoryTypeLabel: string;
  categoryTypeKind: FinancialCategoryKind;
  typeCode: string;
  typeName: string;
  typeKind: FinancialTransactionKind;
  amount: number;
  date: string;
  rawDate: string;
  description: string;
  registeredBy: string;
  registeredById: string;
  projectId: string | null;
  projectName: string;
  receiptCount: number;
  approvalStateId: string | null;
  approvalStateName: string;
  approvalKind: FinancialApprovalKind;
  approvalVariant: StatusVariant;
  approvalComment: string;
  approvalRequestedAt: string;
  approvalRequestedAtRaw: string | null;
  approvalRequestedBy: string;
  approvalRequestedById: string | null;
  approvalResolvedAt: string;
  approvalResolvedAtRaw: string | null;
  approvalResolvedBy: string;
  approvalResolvedById: string | null;
  statusVariant: StatusVariant;
  isDeleted: boolean;
}

export interface FinancialReceiptRow {
  id: string;
  transactionId: string;
  route: string;
  fileType: string;
  receiptNumber: string;
  issuerDocument: string;
  issuerName: string;
  uploadedAt: string;
  rawUploadedAt: string;
}

export interface FinancialReportSummaryRow {
  key: string;
  label: string;
  amount: number;
  count: number;
}

export interface FinancialReportTotals {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
}

export interface FinancialAccountsFilters {
  searchTerm: string;
  state: FinancialRecordState;
  page: number;
  pageSize: number;
}

export interface FinancialCategoriesFilters {
  searchTerm: string;
  state: FinancialRecordState;
  type: FinancialCategoryKind | "all";
  page: number;
  pageSize: number;
}

export interface FinancialTransactionsFilters {
  searchTerm: string;
  accountId: string | "all";
  categoryId: string | "all";
  typeCode: string | "all";
  typeId?: string | number | "all";
  projectId: string | "all";
  approvalKind: FinancialApprovalKind | "all";
  dateFrom: string | null;
  dateTo: string | null;
  includeDeleted: boolean;
  page: number;
  pageSize: number;
}

export interface FinancialReportsFilters {
  searchTerm: string;
  accountId: string | "all";
  categoryId: string | "all";
  typeCode: string | "all";
  typeId?: string | number | "all";
  projectId: string | "all";
  approvalKind: FinancialApprovalKind | "all";
  dateFrom: string | null;
  dateTo: string | null;
  page: number;
  pageSize: number;
}

export interface FinancialAccountsData {
  rows: FinancialAccountRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  currencyOptions: SelectOption[];
  accountTypeOptions: SelectOption[];
}

export interface FinancialCategoriesData {
  rows: FinancialCategoryRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
}

export interface FinancialTransactionsData {
  rows: FinancialTransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  accountOptions: SelectOption[];
  categoryOptions: SelectOption[];
  typeOptions: FinancialTransactionTypeOption[];
  projectOptions: SelectOption[];
  approvalOptions: Array<{ value: FinancialApprovalKind; label: string }>;
  support: {
    projectLink: boolean;
    approvalWorkflow: boolean;
  };
}

export interface FinancialTransactionDetailData {
  transaction: FinancialTransactionRow;
  receipts: FinancialReceiptRow[];
  warnings: string[];
}

export interface FinancialAccountDetailData {
  account: FinancialAccountRow;
  latestTransactions: FinancialTransactionRow[];
  warnings: string[];
}

export interface FinancialCategoryDetailData {
  category: FinancialCategoryRow;
  latestTransactions: FinancialTransactionRow[];
  warnings: string[];
}

export interface FinancialReportData {
  rows: FinancialTransactionRow[];
  allRows: FinancialTransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  warnings: string[];
  totals: FinancialReportTotals;
  byCategory: FinancialReportSummaryRow[];
  byAccount: FinancialReportSummaryRow[];
  byType: FinancialReportSummaryRow[];
  byProject: FinancialReportSummaryRow[];
}

export interface FinancialAccountCreateInput {
  name: string;
  typeCode: string;
  bank?: string | null;
  accountNumber?: string | null;
  currency?: string | null;
  balance?: number | null;
  active?: boolean;
}

export interface FinancialAccountUpdateInput {
  accountId: string;
  name?: string;
  typeCode?: string;
  bank?: string | null;
  accountNumber?: string | null;
  currency?: string | null;
  balance?: number | null;
  active?: boolean;
}

export interface FinancialCategoryCreateInput {
  name: string;
  type: string;
  active?: boolean;
}

export interface FinancialCategoryUpdateInput {
  categoryId: string;
  name?: string;
  type?: string;
  active?: boolean;
}

export interface FinancialTransactionCreateInput {
  accountId: string;
  categoryId: string;
  typeCode: string;
  typeId?: string | number;
  amount: number;
  transactionDate?: string | null;
  description?: string | null;
  receiptUrl?: string | null;
  projectId?: string | null;
  actorId?: string | null;
}

export interface FinancialTransactionUpdateInput {
  transactionId: string;
  accountId?: string;
  categoryId?: string;
  typeCode?: string;
  typeId?: string | number;
  amount?: number;
  transactionDate?: string | null;
  description?: string | null;
  receiptUrl?: string | null;
  projectId?: string | null;
  actorId?: string | null;
}

export interface FinancialTransactionRemoveInput {
  transactionId: string;
  actorId?: string | null;
  reason?: string | null;
}

export interface FinancialReceiptCreateInput {
  transactionId: string;
  routeInput?: string;
  fileType?: string | null;
  receiptNumber?: string | null;
  issuerDocument?: string | null;
  issuerName?: string | null;
  file?: File | null;
}

export interface FinancialReceiptUpdateInput {
  receiptId: string;
  routeInput?: string;
  fileType?: string | null;
  receiptNumber?: string | null;
  issuerDocument?: string | null;
  issuerName?: string | null;
}

export interface FinancialEgresoResolutionInput {
  transactionId: string;
  reviewerId?: string | null;
  reviewerRole?: string | null;
  comment?: string | null;
}

export interface FinancialMutationFeedback {
  id: string;
  message: string;
}

export interface FinancialExportResult {
  fileName: string;
  mimeType: string;
  content: string;
}
