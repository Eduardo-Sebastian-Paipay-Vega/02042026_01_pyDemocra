import { useCallback, useEffect, useState } from "react";
import { getSolicitudAdmisionDetail } from "../../../services/admision/solicitudesAdmision.service";
import type { AdmissionRequestDetailData } from "../types";

interface AdmissionDetailState {
  detail: AdmissionRequestDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AdmissionDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useSolicitudAdmisionDetail(requestId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AdmissionDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!requestId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getSolicitudAdmisionDetail(requestId)
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
              : "No se pudo cargar el expediente de admision.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [requestId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

