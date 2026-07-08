import { useCallback, useState } from "react";
import { fetchGlobalSearchDetail, toFriendlyError } from "./homeService";
import type { GlobalSearchDetailData, GlobalSearchItem } from "./types";

export function useGlobalSearchDetail() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GlobalSearchItem | null>(null);
  const [detail, setDetail] = useState<GlobalSearchDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDetail = useCallback(async (item: GlobalSearchItem) => {
    setIsOpen(true);
    setSelectedItem(item);
    setDetail(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetchGlobalSearchDetail(item);
      setDetail(response);
    } catch (detailError) {
      setError(
        toFriendlyError(
          detailError,
          "No se pudo cargar el detalle del resultado seleccionado."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    if (!selectedItem) {
      return;
    }
    await openDetail(selectedItem);
  }, [openDetail, selectedItem]);

  const closeDetail = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
    setDetail(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    isOpen,
    selectedItem,
    detail,
    loading,
    error,
    openDetail,
    closeDetail,
    retry,
  };
}
