import { useCallback, useEffect, useState } from "react";
import { getTransaccionInventarioById } from "../../../services/recursos/inventarioMovimientos.service";
import type { InventoryMovementDetailData } from "../types";

interface MovementDetailState {
  detail: InventoryMovementDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: MovementDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useTransaccionInventarioDetail(movementId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<MovementDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!movementId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getTransaccionInventarioById(movementId)
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
              : "No se pudo cargar el detalle del movimiento.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [movementId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

