import { useCallback, useEffect, useState } from "react";
import {
  listOnboardingBySolicitud,
  startOnboardingForVolunteer,
  toggleOnboardingStep,
} from "../../../services/admision/solicitudesAdmision.service";
import type {
  AdmissionOnboardingStartInput,
  AdmissionOnboardingStepRow,
  AdmissionOnboardingStepUpdateInput,
} from "../types";

interface AdmissionOnboardingState {
  rows: AdmissionOnboardingStepRow[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AdmissionOnboardingState = {
  rows: [],
  loading: false,
  error: null,
};

function sortOnboardingRows(rows: AdmissionOnboardingStepRow[]) {
  return [...rows].sort(
    (left, right) =>
      left.order - right.order ||
      left.stepName.localeCompare(right.stepName, "es", { sensitivity: "base" })
  );
}

export function useOnboardingAdmision(requestId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AdmissionOnboardingState>(INITIAL_STATE);
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

    listOnboardingBySolicitud(requestId)
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
              : "No se pudo cargar el onboarding de admision.",
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
    isStarting,
    isUpdating,
    start: async (input: AdmissionOnboardingStartInput) => {
      if (isStarting) {
        return null;
      }
      setIsStarting(true);
      try {
        const response = await startOnboardingForVolunteer(input);
        setState({
          rows: sortOnboardingRows(response),
          loading: false,
          error: null,
        });
        return response;
      } finally {
        setIsStarting(false);
      }
    },
    updateStep: async (input: AdmissionOnboardingStepUpdateInput) => {
      if (isUpdating) {
        return null;
      }
      setIsUpdating(true);
      try {
        const response = await toggleOnboardingStep(input);
        setState((current) => {
          const hasCurrentRow = current.rows.some((row) => row.stepId === response.stepId);
          return {
            rows: sortOnboardingRows(
              hasCurrentRow
                ? current.rows.map((row) => (row.stepId === response.stepId ? response : row))
                : [...current.rows, response]
            ),
            loading: false,
            error: null,
          };
        });
        return response;
      } finally {
        setIsUpdating(false);
      }
    },
    refresh,
  };
}
