import { useCallback, useEffect, useState } from "react";
import {
  createEntrevistaAdmision,
  listEntrevistasBySolicitud,
  removeEntrevistaAdmision,
  updateEntrevistaAdmision,
} from "../../../services/admision/solicitudesAdmision.service";
import type {
  AdmissionInterviewCreateInput,
  AdmissionInterviewRow,
  AdmissionInterviewUpdateInput,
} from "../types";

interface AdmissionInterviewsState {
  rows: AdmissionInterviewRow[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AdmissionInterviewsState = {
  rows: [],
  loading: false,
  error: null,
};

export function useEntrevistasAdmision(requestId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AdmissionInterviewsState>(INITIAL_STATE);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

    listEntrevistasBySolicitud(requestId)
      .then((rows) => {
        if (!isActive) {
          return;
        }

        setState({
          rows,
          loading: false,
          error: null,
        });
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          rows: [],
          loading: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar las entrevistas de admision.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [requestId, reloadToken]);

  return {
    rows: state.rows,
    loading: state.loading,
    error: state.error,
    isCreating,
    isUpdating,
    isRemoving,
    create: async (input: AdmissionInterviewCreateInput) => {
      if (isCreating) {
        return null;
      }
      setIsCreating(true);
      try {
        const response = await createEntrevistaAdmision(input);
        refresh();
        return response;
      } finally {
        setIsCreating(false);
      }
    },
    update: async (input: AdmissionInterviewUpdateInput) => {
      if (isUpdating) {
        return null;
      }
      setIsUpdating(true);
      try {
        const response = await updateEntrevistaAdmision(input);
        refresh();
        return response;
      } finally {
        setIsUpdating(false);
      }
    },
    remove: async (interviewId: string) => {
      if (isRemoving) {
        return null;
      }
      setIsRemoving(true);
      try {
        const response = await removeEntrevistaAdmision(interviewId);
        refresh();
        return response;
      } finally {
        setIsRemoving(false);
      }
    },
    refresh,
  };
}

