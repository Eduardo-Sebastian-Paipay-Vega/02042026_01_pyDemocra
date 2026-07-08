import { useCallback, useEffect, useState } from "react";
import { listAsignacionesByActividad } from "../../../services/operacion/asignacionesActividad.service";
import type { ActivityAssignmentRow } from "../types";

interface UseAsignacionesActividadState {
  rows: ActivityAssignmentRow[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: UseAsignacionesActividadState = {
  rows: [],
  loading: false,
  error: null,
};

export function useAsignacionesActividad(
  activityId: string | null,
  includeInactive = true
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<UseAsignacionesActividadState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!activityId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    listAsignacionesByActividad(activityId, includeInactive)
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
      .catch((error) => {
        if (!isActive) {
          return;
        }
        setState({
          rows: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las asignaciones de la actividad.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [activityId, includeInactive, reloadToken]);

  return {
    rows: state.rows,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
