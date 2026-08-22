import { useHorasActividad } from "./hooks/useHorasActividad";
import type {
  HoursApprovalRequestInput,
  HoursFilters,
  HoursRegisterInput,
  HoursResolutionInput,
  HoursUpdateInput,
} from "./types";

export function useOperationHours(
  filters: HoursFilters,
  ownerVolunteerId?: string | null
) {
  const hook = useHorasActividad(filters, ownerVolunteerId);

  return {
    loading: hook.loading,
    error: hook.error,
    warnings: hook.warnings,
    rows: hook.rows,
    stats: hook.stats,
    volunteerOptions: hook.volunteerOptions,
    activityOptions: hook.activityOptions,
    projectOptions: hook.projectOptions,
    approvalStates: hook.approvalStates,
    isRegistering: hook.isRegistering,
    isUpdating: hook.isUpdating,
    isResolving: hook.isResolving,
    isRequesting: hook.isRequesting,
    isRemoving: hook.isRemoving,
    createHours: (input: HoursRegisterInput) => hook.create(input),
    updateHours: (input: HoursUpdateInput) => hook.update(input),
    resolveHoursRecord: (input: HoursResolutionInput) => hook.resolve(input),
    requestApproval: (input: HoursApprovalRequestInput) => hook.requestApproval(input),
    removeHours: hook.remove,
    refresh: hook.refresh,
  };
}

