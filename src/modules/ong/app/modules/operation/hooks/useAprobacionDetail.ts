import { useCallback, useEffect, useState } from "react";
import { getAprobacionDetail } from "../../../services/operacion/aprobaciones.service";
import type { OperationApprovalDetail } from "../types";

interface ApprovalDetailState {
  detail: OperationApprovalDetail | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ApprovalDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useAprobacionDetail(approvalId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<ApprovalDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!approvalId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getAprobacionDetail(approvalId)
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
              : "No se pudo cargar el detalle de la aprobacion.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [approvalId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

