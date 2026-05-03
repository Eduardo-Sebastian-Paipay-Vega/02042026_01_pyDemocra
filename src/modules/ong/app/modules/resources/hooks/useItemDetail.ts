import { useCallback, useEffect, useState } from "react";
import { getItemById } from "../../../services/recursos/items.service";
import type { InventoryItemDetailData } from "../types";

interface ItemDetailState {
  detail: InventoryItemDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ItemDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useItemDetail(itemId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<ItemDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!itemId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getItemById(itemId)
      .then((detail) => {
        if (!isActive) {
          return;
        }
        setState({
          detail,
          loading: false,
          error: null,
        });
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }
        setState({
          detail: null,
          loading: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el detalle del item.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [itemId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
