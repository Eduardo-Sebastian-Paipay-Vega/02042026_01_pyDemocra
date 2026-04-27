import { useCallback, useEffect, useState } from "react";
import { getTransaccionFinancieraById } from "../../../services/recursos/transaccionesFinancieras.service";
import type { FinancialTransactionDetailData } from "../types";

interface TransactionDetailState {
  detail: FinancialTransactionDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: TransactionDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useTransaccionFinancieraDetail(transactionId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<TransactionDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!transactionId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getTransaccionFinancieraById(transactionId)
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
              : "No se pudo cargar el detalle de la transaccion.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [transactionId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
