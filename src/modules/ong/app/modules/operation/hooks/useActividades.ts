import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { listActividades } from "../../../services/operacion/actividades.service";
import type {
  OperationActivitiesData,
  OperationActivityFilters,
  OperationActivitySummary,
} from "../types";

const EMPTY_DATA: OperationActivitiesData = {
  rows: [],
  stateOptions: [],
  projectOptions: [],
  taskOptions: [],
  locationOptions: [],
  volunteerOptions: [],
  warnings: [],
};

function buildSummary(rows: OperationActivitiesData["rows"]): OperationActivitySummary[] {
  const counters = new Map<
    string,
    { label: string; count: number; variant: OperationActivitySummary["variant"] }
  >();

  for (const row of rows) {
    const key = row.statusId !== null ? String(row.statusId) : `status:${row.statusName}`;
    const current = counters.get(key) ?? {
      label: row.statusName,
      count: 0,
      variant: row.statusVariant,
    };
    current.count += 1;
    counters.set(key, current);
  }

  return Array.from(counters.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      variant: value.variant,
    }))
    .sort((a, b) => b.count - a.count);
}

export function useActividades(filters: OperationActivityFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OperationActivitiesData>(EMPTY_DATA);

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
        const response = await listActividades({
          ...filters,
          searchTerm: debouncedSearchTerm,
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
            : "No se pudieron cargar las actividades."
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
    filters.locationId,
    filters.period,
    filters.projectId,
    filters.stateId,
    filters.taskId,
    filters.volunteerId,
    reloadToken,
  ]);

  const summary = useMemo(() => buildSummary(data.rows), [data.rows]);

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    summary,
    stateOptions: data.stateOptions,
    projectOptions: data.projectOptions,
    taskOptions: data.taskOptions,
    locationOptions: data.locationOptions,
    volunteerOptions: data.volunteerOptions,
    refresh,
  };
}

