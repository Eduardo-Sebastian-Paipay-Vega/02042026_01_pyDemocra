import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createCategoria,
  listCategorias,
  removeOrArchiveCategoria,
  updateCategoria,
} from "../../../services/recursos/categoriasFinancieras.service";
import type {
  FinancialCategoriesData,
  FinancialCategoriesFilters,
  FinancialCategoryCreateInput,
  FinancialCategoryUpdateInput,
} from "../types";

const EMPTY_DATA: FinancialCategoriesData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
};

export function useCategoriasFinancieras(filters: FinancialCategoriesFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialCategoriesData>(EMPTY_DATA);
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
        const response = await listCategorias({
          searchTerm: debouncedSearchTerm,
          state: filters.state,
          type: filters.type,
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
            : "No se pudieron cargar las categorias."
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
    filters.page,
    filters.pageSize,
    filters.state,
    filters.type,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: FinancialCategoryCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createCategoria(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: FinancialCategoryUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateCategoria(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (categoryId: string) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        const result = await removeOrArchiveCategoria(categoryId);
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
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    refresh,
  };
}
