import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createUbicacion,
  listUbicaciones,
  removeOrArchiveUbicacion,
  updateUbicacion,
} from "../../../services/recursos/ubicaciones.service";
import type {
  InventoryLocationCreateInput,
  InventoryLocationsData,
  InventoryLocationsFilters,
  InventoryLocationUpdateInput,
} from "../types";

const EMPTY_DATA: InventoryLocationsData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  countryOptions: [],
};

export function useUbicaciones(filters: InventoryLocationsFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InventoryLocationsData>(EMPTY_DATA);
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
        const response = await listUbicaciones({
          searchTerm: debouncedSearchTerm,
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
            : "No se pudieron cargar las ubicaciones."
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
  }, [debouncedSearchTerm, filters.page, filters.pageSize, reloadToken]);

  const create = useCallback(
    async (input: InventoryLocationCreateInput) => {
      if (isCreating) {
        return null;
      }

      setIsCreating(true);
      try {
        const result = await createUbicacion(input);
        refresh();
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const update = useCallback(
    async (input: InventoryLocationUpdateInput) => {
      if (isUpdating) {
        return null;
      }

      setIsUpdating(true);
      try {
        const result = await updateUbicacion(input);
        refresh();
        return result;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (locationId: string) => {
      if (isRemoving) {
        return null;
      }

      setIsRemoving(true);
      try {
        const result = await removeOrArchiveUbicacion(locationId);
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
    countryOptions: data.countryOptions,
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    refresh,
  };
}
