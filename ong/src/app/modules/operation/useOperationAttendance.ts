import { useAsistencias } from "./hooks/useAsistencias";
import type {
  AttendanceExitInput,
  AttendanceFilters,
  AttendanceRegisterInput,
  AttendanceScanInput,
  AttendanceScanResult,
  AttendanceUpdateInput,
} from "./types";

export function useOperationAttendance(filters: AttendanceFilters) {
  const hook = useAsistencias(filters);

  return {
    loading: hook.loading,
    error: hook.error,
    warnings: hook.warnings,
    rows: hook.rows,
    stats: hook.stats,
    volunteerOptions: hook.volunteerOptions,
    projectOptions: hook.projectOptions,
    activityOptions: hook.activityOptions,
    isRegisteringEntry: hook.isRegistering,
    isRegisteringExit: hook.isClosing,
    isUpdating: hook.isUpdating,
    isRemoving: hook.isRemoving,
    isScanning: hook.isScanning,
    registerEntry: (input: AttendanceRegisterInput) => hook.register(input),
    registerExit: (input: AttendanceExitInput) => hook.close(input),
    updateAttendance: (input: AttendanceUpdateInput) => hook.update(input),
    markIncidence: hook.markIncidence,
    removeAttendance: hook.remove,
    scanByQr: (input: AttendanceScanInput): Promise<AttendanceScanResult | null> =>
      hook.scan(input),
    refresh: hook.refresh,
  };
}
