import { useCallback, useEffect, useState } from "react";
import { getHorasById } from "../../../services/operacion/horas.service";
import type { OperationHoursRow } from "../types";

interface HourDetailState {
  detail: OperationHoursRow | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: HourDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useHoraDetail(hoursId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<HourDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!hoursId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getHorasById(hoursId)
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
              : "No se pudo cargar el detalle de horas.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [hoursId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
