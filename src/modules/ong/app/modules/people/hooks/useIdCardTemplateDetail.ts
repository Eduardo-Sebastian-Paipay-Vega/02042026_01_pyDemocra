import { useCallback, useEffect, useState } from "react";
import type { IdCardTemplateDetailData } from "../types";
import { getIdCardTemplateDetail } from "../../../services/personas/idCards.service";

interface IdCardTemplateDetailState {
  detail: IdCardTemplateDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: IdCardTemplateDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useIdCardTemplateDetail(templateId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<IdCardTemplateDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!templateId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getIdCardTemplateDetail(templateId)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setState({
          detail,
          loading: false,
          error: detail ? null : "La plantilla ya no esta disponible.",
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
              : "No se pudo cargar el detalle de la plantilla.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [reloadToken, templateId]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

