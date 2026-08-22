import { useCallback, useEffect, useState } from "react";
import type { BeneficiaryDetailData } from "../types";
import { getBeneficiaryDetail } from "../../../services/personas/beneficiaries.service";

interface BeneficiaryDetailState {
  detail: BeneficiaryDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: BeneficiaryDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useBeneficiaryDetail(beneficiaryId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<BeneficiaryDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const replace = useCallback((detail: BeneficiaryDetailData | null) => {
    setState({
      detail,
      loading: false,
      error: detail ? null : "El beneficiario ya no esta disponible.",
    });
  }, []);

  useEffect(() => {
    if (!beneficiaryId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getBeneficiaryDetail(beneficiaryId)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setState({
          detail,
          loading: false,
          error: detail ? null : "El beneficiario ya no esta disponible.",
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
              : "No se pudo cargar el detalle del beneficiario.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [beneficiaryId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
    replace,
  };
}

