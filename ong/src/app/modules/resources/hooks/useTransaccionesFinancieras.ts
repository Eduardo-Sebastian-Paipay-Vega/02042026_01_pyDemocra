import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  approveEgreso,
  createTransaccionFinanciera,
  listTransaccionesFinancieras,
  observeEgreso,
  rejectEgreso,
  removeOrVoidTransaccionFinanciera,
  updateTransaccionFinanciera,
} from "../../../services/recursos/transaccionesFinancieras.service";
import type {
  FinancialEgresoResolutionInput,
  FinancialTransactionCreateInput,
  FinancialTransactionsData,
  FinancialTransactionsFilters,
  FinancialTransactionRemoveInput,
  FinancialTransactionUpdateInput,
} from "../types";

const EMPTY_DATA: FinancialTransactionsData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  accountOptions: [],
  categoryOptions: [],
  typeOptions: [],
  projectOptions: [],
  approvalOptions: [],
  support: {
    projectLink: false,
    approvalWorkflow: true,
  },
};

export function useTransaccionesFinancieras(filters: FinancialTransactionsFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialTransactionsData>(EMPTY_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

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
        const response = await listTransaccionesFinancieras({
          searchTerm: debouncedSearchTerm,
          accountId: filters.accountId,
          categoryId: filters.categoryId,
          typeCode: filters.typeCode ?? (typeof filters.typeId === "string" ? filters.typeId : "all"),
          typeId: filters.typeId,
          projectId: filters.projectId,
          approvalKind: filters.approvalKind,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          includeDeleted: filters.includeDeleted,
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
            : "No se pudieron cargar las transacciones."
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
    filters.includeDeleted,
    filters.page,
    filters.pageSize,
    filters.projectId,
    filters.typeCode,
    filters.typeId,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: FinancialTransactionCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createTransaccionFinanciera(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: FinancialTransactionUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateTransaccionFinanciera(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (input: FinancialTransactionRemoveInput) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        await removeOrVoidTransaccionFinanciera(input);
        refresh();
        return true;
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, refresh]
  );

  const approve = useCallback(
    async (input: FinancialEgresoResolutionInput) => {
      if (isResolving) {
        return null;
      }

      setIsResolving(true);
      try {
        const result = await approveEgreso(input);
        refresh();
        return result;
      } finally {
        setIsResolving(false);
      }
    },
    [isResolving, refresh]
  );

  const reject = useCallback(
    async (input: FinancialEgresoResolutionInput) => {
      if (isResolving) {
        return null;
      }

      setIsResolving(true);
      try {
        const result = await rejectEgreso(input);
        refresh();
        return result;
      } finally {
        setIsResolving(false);
      }
    },
    [isResolving, refresh]
  );

  const observe = useCallback(
    async (input: FinancialEgresoResolutionInput) => {
      if (isResolving) {
        return null;
      }

      setIsResolving(true);
      try {
        const result = await observeEgreso(input);
        refresh();
        return result;
      } finally {
        setIsResolving(false);
      }
    },
    [isResolving, refresh]
  );

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    accountOptions: data.accountOptions,
    categoryOptions: data.categoryOptions,
    typeOptions: data.typeOptions,
    projectOptions: data.projectOptions,
    approvalOptions: data.approvalOptions,
    support: data.support,
    isCreating,
    isUpdating,
    isRemoving,
    isResolving,
    create,
    update,
    remove,
    approve,
    reject,
    observe,
    refresh,
  };
}
