import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  closeAsistencia,
  createAsistencia,
  listAsistencias,
  markAsistenciaIncidencia,
  removeAsistencia,
  scanAsistenciaByQr,
  updateAsistencia,
} from "../../../services/operacion/asistencias.service";
import type {
  AttendanceExitInput,
  AttendanceFilters,
  AttendanceIncidenceInput,
  AttendanceRegisterInput,
  AttendanceScanInput,
  AttendanceScanResult,
  AttendanceUpdateInput,
  OperationAttendanceData,
} from "../types";

const EMPTY_DATA: OperationAttendanceData = {
  rows: [],
  volunteerOptions: [],
  projectOptions: [],
  activityOptions: [],
  warnings: [],
};

export function useAsistencias(filters: AttendanceFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OperationAttendanceData>(EMPTY_DATA);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 350);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await listAsistencias({
          ...filters,
          searchTerm: debouncedSearchTerm,
        });
        if (!isActive) {
          return;
        }
        setData(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        setData(EMPTY_DATA);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las asistencias."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [
    debouncedSearchTerm,
    filters.activityId,
    filters.dateFrom,
    filters.dateTo,
    filters.projectId,
    filters.status,
    filters.volunteerId,
    reloadToken,
  ]);

  const register = useCallback(
    async (input: AttendanceRegisterInput) => {
      if (isRegistering) {
        return;
      }
      setIsRegistering(true);
      try {
        await createAsistencia(input);
        refresh();
      } finally {
        setIsRegistering(false);
      }
    },
    [isRegistering, refresh]
  );

  const close = useCallback(
    async (input: AttendanceExitInput) => {
      if (isClosing) {
        return;
      }
      setIsClosing(true);
      try {
        await closeAsistencia(input);
        refresh();
      } finally {
        setIsClosing(false);
      }
    },
    [isClosing, refresh]
  );

  const update = useCallback(
    async (input: AttendanceUpdateInput) => {
      if (isUpdating) {
        return;
      }
      setIsUpdating(true);
      try {
        await updateAsistencia(input);
        refresh();
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const markIncidence = useCallback(
    async (input: AttendanceIncidenceInput) => {
      if (isUpdating) {
        return;
      }
      setIsUpdating(true);
      try {
        await markAsistenciaIncidencia(input);
        refresh();
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (attendanceId: string) => {
      if (isRemoving) {
        return;
      }
      setIsRemoving(true);
      try {
        await removeAsistencia(attendanceId);
        refresh();
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, refresh]
  );

  const scan = useCallback(
    async (input: AttendanceScanInput): Promise<AttendanceScanResult | null> => {
      if (isScanning) {
        return null;
      }

      setIsScanning(true);
      try {
        const response = await scanAsistenciaByQr(input);
        refresh();
        return response;
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, refresh]
  );

  const stats = useMemo(() => {
    return data.rows.reduce(
      (acc, row) => {
        if (row.status === "open") {
          acc.open += 1;
        } else if (row.status === "closed") {
          acc.closed += 1;
        } else {
          acc.incidence += 1;
        }
        return acc;
      },
      { open: 0, closed: 0, incidence: 0 }
    );
  }, [data.rows]);

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    stats,
    volunteerOptions: data.volunteerOptions,
    projectOptions: data.projectOptions,
    activityOptions: data.activityOptions,
    isRegistering,
    isClosing,
    isUpdating,
    isRemoving,
    isScanning,
    register,
    close,
    update,
    markIncidence,
    remove,
    scan,
    refresh,
  };
}

