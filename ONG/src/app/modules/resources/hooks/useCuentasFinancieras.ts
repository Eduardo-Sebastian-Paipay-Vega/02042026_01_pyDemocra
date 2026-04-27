import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createCuenta,
  listCuentas,
  removeOrArchiveCuenta,
  updateCuenta,
} from "../../../services/recursos/cuentasFinancieras.service";
import type {
  FinancialAccountCreateInput,
  FinancialAccountsData,
  FinancialAccountsFilters,
  FinancialAccountUpdateInput,
} from "../types";

const EMPTY_DATA: FinancialAccountsData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  currencyOptions: [],
  accountTypeOptions: [],
};

export function useCuentasFinancieras(filters: FinancialAccountsFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialAccountsData>(EMPTY_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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
        const response = await listCuentas({
          searchTerm: debouncedSearchTerm,
          state: filters.state,
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
            : "No se pudieron cargar las cuentas."
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
  }, [debouncedSearchTerm, filters.page, filters.pageSize, filters.state, reloadToken]);

  const create = useCallback(
    async (input: FinancialAccountCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createCuenta(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: FinancialAccountUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateCuenta(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (accountId: string) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        const result = await removeOrArchiveCuenta(accountId);
        refresh();
        return result;
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, refresh]
  );

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    currencyOptions: data.currencyOptions,
    accountTypeOptions: data.accountTypeOptions,
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    refresh,
  };
}
