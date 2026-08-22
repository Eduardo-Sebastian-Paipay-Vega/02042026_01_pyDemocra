import type { FinancialExportResult, FinancialReportData, FinancialReportSummaryRow, FinancialReportsFilters, FinancialTransactionRow } from "../../modules/resources/types";
import { sanitizeText, toOperationError } from "./shared";
import { listTransaccionesFinancieras } from "./transaccionesFinancieras.service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_REPORT_DATASET = 2000;

function resolvePage(value: number | null | undefined) { return !value || Number.isNaN(value) || value < 1 ? 1 : Math.floor(value); }
function resolvePageSize(value: number | null | undefined) { return !value || Number.isNaN(value) || value < 1 ? DEFAULT_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, Math.floor(value)); }

function buildSummary(rows: FinancialTransactionRow[], keyFn: (row: FinancialTransactionRow) => string, labelFn: (row: FinancialTransactionRow) => string): FinancialReportSummaryRow[] {
  const grouped = new Map<string, { label: string; amount: number; count: number }>();
  for (const row of rows) {
    const key = keyFn(row);
    const current = grouped.get(key) ?? { label: labelFn(row), amount: 0, count: 0 };
    current.amount += row.amount;
    current.count += 1;
    grouped.set(key, current);
  }
  return Array.from(grouped.entries()).map(([key, value]) => ({ key, label: value.label, amount: Math.round(value.amount * 100) / 100, count: value.count })).sort((a, b) => b.amount - a.amount);
}

function csvValue(value: string) { return `"${value.replace(/"/g, '""')}"`; }
function buildCsv(rows: FinancialTransactionRow[]) {
  const headers = [
    "id_transaccion",
    "fecha",
    "cuenta",
    "categoria",
    "tipo",
    "monto",
    "proyecto",
    "registrado_por",
    "estado_aprobacion",
    "comentario_aprobacion",
    "descripcion",
    "comprobante_url",
  ];
  return [
    headers.join(","),
    ...rows.map((row) =>
      [
        csvValue(row.id),
        csvValue(row.rawDate),
        csvValue(row.accountName),
        csvValue(row.categoryName),
        csvValue(row.typeName),
        row.amount.toFixed(2),
        csvValue(row.projectName),
        csvValue(row.registeredBy),
        csvValue(row.approvalStateName),
        csvValue(row.approvalComment || ""),
        csvValue(row.description || ""),
        csvValue("-"),
      ].join(",")
    ),
  ].join("\n");
}

export async function getReporteFinanciero(filters: Partial<FinancialReportsFilters> = {}): Promise<FinancialReportData> {
  try {
    const page = resolvePage(filters.page);
    const pageSize = resolvePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const warnings: string[] = [];
    const dataset = await listTransaccionesFinancieras({ searchTerm: sanitizeText(filters.searchTerm, 120), accountId: filters.accountId ?? "all", categoryId: filters.categoryId ?? "all", typeCode: filters.typeCode ?? "all", projectId: filters.projectId ?? "all", approvalKind: filters.approvalKind ?? "all", dateFrom: filters.dateFrom ?? null, dateTo: filters.dateTo ?? null, page: 1, pageSize: MAX_REPORT_DATASET });
    warnings.push(...dataset.warnings);
    if (dataset.total > MAX_REPORT_DATASET) warnings.push(`El reporte supera ${MAX_REPORT_DATASET} registros y se muestra una muestra.`);
    const allRows = dataset.rows;
    const totalIncome = allRows.filter((row) => row.typeKind === "ingreso").reduce((acc, row) => acc + row.amount, 0);
    const totalExpense = allRows.filter((row) => row.typeKind === "egreso").reduce((acc, row) => acc + row.amount, 0);
    return { rows: allRows.slice(from, to), allRows, total: allRows.length, page, pageSize, warnings, totals: { totalIncome: Math.round(totalIncome * 100) / 100, totalExpense: Math.round(totalExpense * 100) / 100, net: Math.round((totalIncome - totalExpense) * 100) / 100, transactionCount: allRows.length }, byCategory: buildSummary(allRows, (row) => row.categoryId, (row) => row.categoryName), byAccount: buildSummary(allRows, (row) => row.accountId, (row) => row.accountName), byType: buildSummary(allRows, (row) => row.typeCode, (row) => row.typeName), byProject: buildSummary(allRows, (row) => row.projectId ?? "sin-proyecto", (row) => row.projectName) };
  } catch (error) {
    throw toOperationError(error, "No se pudo generar el reporte financiero.");
  }
}

export async function exportReporteFinanciero(filters: Partial<FinancialReportsFilters> = {}): Promise<FinancialExportResult> {
  try {
    const report = await getReporteFinanciero({ ...filters, page: 1, pageSize: MAX_REPORT_DATASET });
    const timestamp = new Date().toISOString().slice(0, 10);
    return { fileName: `reporte-financiero-${timestamp}.csv`, mimeType: "text/csv;charset=utf-8", content: buildCsv(report.allRows) };
  } catch (error) {
    throw toOperationError(error, "No se pudo exportar el reporte financiero.");
  }
}

