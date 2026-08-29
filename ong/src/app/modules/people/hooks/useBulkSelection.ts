import { useState, useCallback } from "react";

export function useBulkSelection<T extends string>(initial: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<T[]>(initial);

  const toggleSelection = useCallback((id: T) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    count: selectedIds.length,
    hasSelection: selectedIds.length > 0,
  };
}
