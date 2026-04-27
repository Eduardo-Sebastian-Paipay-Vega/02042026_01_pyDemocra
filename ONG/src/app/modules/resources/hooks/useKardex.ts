import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { listKardex } from "../../../services/recursos/inventarioMovimientos.service";
import type { InventoryKardexData, InventoryKardexFilters } from "../types";

const EMPTY_DATA: InventoryKardexData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  itemOptions: [],
  locationOptions: [],
  typeOptions: [],
};

export function useKardex(filters: InventoryKardexFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InventoryKardexData>(EMPTY_DATA);

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
        const response = await listKardex({
          searchTerm: debouncedSearchTerm,
          itemId: filters.itemId,
          locationId: filters.locationId,
          typeCode: filters.typeCode ?? (typeof filters.typeId === "string" ? filters.typeId : "all"),
          typeId: filters.typeId,
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
          loadError instanceof Error ? loadError.message : "No se pudo cargar el kardex."
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
    filters.itemId,
    filters.locationId,
    filters.page,
    filters.pageSize,
    filters.typeCode,
    filters.typeId,
    reloadToken,
  ]);

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
    refresh,
  };
}
