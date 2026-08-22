import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createTransaccionInventario,
  listTransaccionesInventario,
  removeOrVoidTransaccionInventario,
  updateTransaccionInventario,
} from "../../../services/recursos/inventarioMovimientos.service";
import type {
  InventoryMovementCreateInput,
  InventoryMovementsData,
  InventoryMovementsFilters,
  InventoryMovementRemoveInput,
  InventoryMovementUpdateInput,
} from "../types";

const EMPTY_DATA: InventoryMovementsData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  itemOptions: [],
  locationOptions: [],
  typeOptions: [],
};

export function useInventarioMovimientos(filters: InventoryMovementsFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InventoryMovementsData>(EMPTY_DATA);
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
        const response = await listTransaccionesInventario({
          searchTerm: debouncedSearchTerm,
          itemId: filters.itemId,
          typeCode: filters.typeCode ?? (typeof filters.typeId === "string" ? filters.typeId : "all"),
          typeId: filters.typeId,
          originId: filters.originId,
          destinationId: filters.destinationId,
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
            : "No se pudieron cargar los movimientos."
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
    filters.dateFrom,
    filters.dateTo,
    filters.destinationId,
    filters.includeDeleted,
    filters.itemId,
    filters.originId,
    filters.page,
    filters.pageSize,
    filters.typeCode,
    filters.typeId,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: InventoryMovementCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createTransaccionInventario(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: InventoryMovementUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateTransaccionInventario(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (input: InventoryMovementRemoveInput) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        await removeOrVoidTransaccionInventario(input);
        refresh();
        return true;
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
    itemOptions: data.itemOptions,
    locationOptions: data.locationOptions,
    typeOptions: data.typeOptions,
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    refresh,
  };
}

