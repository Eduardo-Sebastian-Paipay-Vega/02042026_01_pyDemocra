import { useCallback, useEffect, useState } from "react";
import { getCategoriaById } from "../../../services/recursos/categoriasFinancieras.service";
import type { FinancialCategoryDetailData } from "../types";

interface CategoryDetailState {
  detail: FinancialCategoryDetailData | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: CategoryDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useCategoriaFinancieraDetail(categoryId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<CategoryDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getCategoriaById(categoryId)
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
              : "No se pudo cargar el detalle de la categoria.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [categoryId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
