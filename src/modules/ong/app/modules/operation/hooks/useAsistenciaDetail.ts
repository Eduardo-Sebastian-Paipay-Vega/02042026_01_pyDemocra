import { useCallback, useEffect, useState } from "react";
import { getAsistenciaById } from "../../../services/operacion/asistencias.service";
import type { OperationAttendanceRow } from "../types";

interface AttendanceDetailState {
  detail: OperationAttendanceRow | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AttendanceDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useAsistenciaDetail(attendanceId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AttendanceDetailState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!attendanceId) {
      setState(INITIAL_STATE);
      return;
    }

    let isActive = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    getAsistenciaById(attendanceId)
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
              : "No se pudo cargar el detalle de la asistencia.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [attendanceId, reloadToken]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

