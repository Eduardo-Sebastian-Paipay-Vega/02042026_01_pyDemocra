import { useCallback, useState } from "react";
import type { SensitiveMedicalDetail, SensitiveRecordScope } from "../types";
import { getSensitiveMedicalDetail } from "../../../services/clinico/medicalRecords.service";

interface OpenDetailInput {
  scope: SensitiveRecordScope;
  personId: string;
  accessReason: string;
}

interface SensitiveDetailState {
  detail: SensitiveMedicalDetail | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: SensitiveDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useMedicalRecordDetail() {
  const [state, setState] = useState<SensitiveDetailState>(INITIAL_STATE);

  const open = useCallback(async (input: OpenDetailInput) => {
    setState({
      detail: null,
      loading: true,
      error: null,
    });

    try {
      const detail = await getSensitiveMedicalDetail(input);
      setState({
        detail,
        loading: false,
        error: detail ? null : "La ficha sensible ya no esta disponible.",
      });
      return detail;
    } catch (loadError) {
      const errorMessage =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la ficha sensible.";

      setState({
        detail: null,
        loading: false,
        error: errorMessage,
      });
      throw loadError;
    }
  }, []);

  const clear = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const replace = useCallback((detail: SensitiveMedicalDetail | null) => {
    setState({
      detail,
      loading: false,
      error: detail ? null : "La ficha sensible ya no esta disponible.",
    });
  }, []);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    open,
    clear,
    replace,
  };
}

