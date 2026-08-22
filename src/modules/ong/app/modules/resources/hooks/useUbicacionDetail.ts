import { useCallback, useEffect, useState } from "react";
import { getUbicacionById } from "../../../services/recursos/ubicaciones.service";
import type { InventoryLocationDetailData } from "../types";

interface LocationDetailState {
  detail: InventoryLocationDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: LocationDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useUbicacionDetail(locationId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<LocationDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!locationId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getUbicacionById(locationId)
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
              : "No se pudo cargar el detalle de la ubicacion.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [locationId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

