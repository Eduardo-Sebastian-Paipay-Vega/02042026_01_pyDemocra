import { useCallback, useEffect, useState } from "react";
import type { VolunteerDetailData } from "../types";
import { getVolunteerDetail } from "../../../services/personas/volunteers.service";

interface VolunteerDetailState {
  detail: VolunteerDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: VolunteerDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useVolunteerDetail(volunteerId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<VolunteerDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const replace = useCallback((detail: VolunteerDetailData | null) => {
    setState({
      detail,
      loading: false,
      error: detail ? null : "El voluntario ya no esta disponible.",
    });
  }, []);

  useEffect(() => {
    if (!volunteerId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getVolunteerDetail(volunteerId)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setState({
          detail,
          loading: false,
          error: detail ? null : "El voluntario ya no esta disponible.",
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
              : "No se pudo cargar el detalle del voluntario.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [reloadToken, volunteerId]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
    replace,
  };
}
