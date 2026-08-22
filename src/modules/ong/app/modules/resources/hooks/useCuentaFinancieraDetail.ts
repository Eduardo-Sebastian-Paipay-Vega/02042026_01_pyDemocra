import { useCallback, useEffect, useState } from "react";
import { getCuentaById } from "../../../services/recursos/cuentasFinancieras.service";
import type { FinancialAccountDetailData } from "../types";

interface AccountDetailState {
  detail: FinancialAccountDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AccountDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useCuentaFinancieraDetail(accountId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AccountDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!accountId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getCuentaById(accountId)
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
              : "No se pudo cargar el detalle de la cuenta.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [accountId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

