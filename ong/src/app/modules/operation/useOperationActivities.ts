import { useActividades } from "./hooks/useActividades";
import type { OperationActivityFilters } from "./types";

export function useOperationActivities(filters: OperationActivityFilters) {
  return useActividades(filters);
}
