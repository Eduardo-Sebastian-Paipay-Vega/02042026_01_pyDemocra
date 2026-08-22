import { useCallback, useEffect, useState } from "react";
import type { IdCardDetailData } from "../types";
import { getIdCardDetail } from "../../../services/personas/idCards.service";

interface IdCardDetailState {
  detail: IdCardDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: IdCardDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useIdCardDetail(cardId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<IdCardDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!cardId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getIdCardDetail(cardId)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setState({
          detail,
          loading: false,
          error: detail ? null : "La credencial ya no esta disponible.",
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
              : "No se pudo cargar el detalle de la credencial.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [reloadToken, cardId]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

