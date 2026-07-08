import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  exportReporteFinanciero,
  getReporteFinanciero,
} from "../../../services/recursos/reportesFinancieros.service";
import type { FinancialReportData, FinancialReportsFilters } from "../types";

const EMPTY_DATA: FinancialReportData = {
  rows: [],
  allRows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  totals: {
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    transactionCount: 0,
  },
  byCategory: [],
  byAccount: [],
  byType: [],
  byProject: [],
};

export function useReportesFinancieros(filters: FinancialReportsFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialReportData>(EMPTY_DATA);
  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 350);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await getReporteFinanciero({
          searchTerm: debouncedSearchTerm,
          accountId: filters.accountId,
          categoryId: filters.categoryId,
          typeCode: filters.typeCode ?? (typeof filters.typeId === "string" ? filters.typeId : "all"),
          typeId: filters.typeId,
          projectId: filters.projectId,
          approvalKind: filters.approvalKind,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: filters.page,
          pageSize: filters.pageSize,
        });

        if (!isActive) {
          return;
        }

        setData(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setData(EMPTY_DATA);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo generar el reporte financiero."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [
    debouncedSearchTerm,
    filters.accountId,
    filters.approvalKind,
    filters.categoryId,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.pageSize,
    filters.projectId,
    filters.typeCode,
    filters.typeId,
    reloadToken,
  ]);

  const exportCsv = useCallback(async () => {
    if (isExporting) {
      return null;
    }

    setIsExporting(true);
    try {
      return await exportReporteFinanciero({
        searchTerm: debouncedSearchTerm,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        typeCode: filters.typeCode ?? (typeof filters.typeId === "string" ? filters.typeId : "all"),
        typeId: filters.typeId,
        projectId: filters.projectId,
        approvalKind: filters.approvalKind,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    debouncedSearchTerm,
    filters.accountId,
    filters.approvalKind,
    filters.categoryId,
    filters.dateFrom,
    filters.dateTo,
    filters.projectId,
    filters.typeCode,
    filters.typeId,
    isExporting,
  ]);

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    allRows: data.allRows,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totals: data.totals,
    byCategory: data.byCategory,
    byAccount: data.byAccount,
    byType: data.byType,
    byProject: data.byProject,
    isExporting,
    exportCsv,
    refresh,
  };
}
