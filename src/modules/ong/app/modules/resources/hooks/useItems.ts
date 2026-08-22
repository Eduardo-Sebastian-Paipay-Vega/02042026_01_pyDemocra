import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createItem,
  listItems,
  removeOrArchiveItem,
  updateItem,
} from "../../../services/recursos/items.service";
import type {
  InventoryItemCreateInput,
  InventoryItemsData,
  InventoryItemsFilters,
  InventoryItemUpdateInput,
} from "../types";

const EMPTY_DATA: InventoryItemsData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  unitOptions: [],
  stateOptions: [],
};

export function useItems(filters: InventoryItemsFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InventoryItemsData>(EMPTY_DATA);
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
        const response = await listItems({
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
          loadError instanceof Error ? loadError.message : "No se pudieron cargar los items."
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
    async (input: InventoryItemCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createItem(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: InventoryItemUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateItem(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (itemId: string) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        const result = await removeOrArchiveItem(itemId);
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
    unitOptions: data.unitOptions,
    stateOptions: data.stateOptions,
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    refresh,
  };
}

