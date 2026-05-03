import { useEvidenciasActividad } from "./hooks/useEvidenciasActividad";
import type {
  EvidenceFilters,
  EvidenceRegisterInput,
  EvidenceUpdateInput,
  EvidenceValidationInput,
} from "./types";

export function useOperationEvidence(filters: EvidenceFilters) {
  const hook = useEvidenciasActividad(filters);

  return {
    loading: hook.loading,
    error: hook.error,
    warnings: hook.warnings,
    rows: hook.rows,
    stats: hook.stats,
    volunteerOptions: hook.volunteerOptions,
    activityOptions: hook.activityOptions,
    evidenceTypeOptions: hook.evidenceTypeOptions,
    approvalStates: hook.approvalStates,
    isRegistering: hook.isRegistering,
    isUpdating: hook.isUpdating,
    isRemoving: hook.isRemoving,
    isValidating: hook.isValidating,
    createEvidence: (input: EvidenceRegisterInput) => hook.create(input),
    updateEvidence: (input: EvidenceUpdateInput) => hook.update(input),
    removeEvidence: hook.remove,
    resolveEvidenceValidation: (input: EvidenceValidationInput) => hook.validate(input),
    refresh: hook.refresh,
  };
}
