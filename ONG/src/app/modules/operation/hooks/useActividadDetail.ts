import { useCallback, useEffect, useState } from "react";
import {
  getActividadById,
  getResumenRelacionActividad,
} from "../../../services/operacion/actividades.service";
import type { ActivityDetailData } from "../types";

interface ActivityDetailState {
  detail: ActivityDetailData | null;
  relations: {
    attendanceCount: number;
    evidenceCount: number;
    hoursCount: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ActivityDetailState = {
  detail: null,
  relations: null,
  loading: false,
  error: null,
};

export function useActividadDetail(activityId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<ActivityDetailState>(INITIAL_STATE);

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

    Promise.allSettled([
      getActividadById(activityId),
      getResumenRelacionActividad(activityId),
    ]).then(([detailResult, relationsResult]) => {
      if (!isActive) {
        return;
      }

      if (detailResult.status !== "fulfilled") {
        setState({
          detail: null,
          relations: null,
          loading: false,
          error:
            detailResult.reason instanceof Error
              ? detailResult.reason.message
              : "No se pudo cargar el detalle de la actividad.",
        });
        return;
      }

      setState({
        detail: detailResult.value,
        relations:
          relationsResult.status === "fulfilled" ? relationsResult.value : null,
        loading: false,
        error: null,
      });
    });

    return () => {
      isActive = false;
    };
  }, [activityId, reloadToken]);

  return {
    detail: state.detail,
    relations: state.relations,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
