import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createEvidencia,
  listEvidencias,
  removeEvidencia,
  updateEvidencia,
  validateEvidencia,
  type MutationFeedback,
} from "../../../services/operacion/evidencias.service";
import type {
  EvidenceFilters,
  EvidenceRegisterInput,
  EvidenceUpdateInput,
  EvidenceValidationInput,
  OperationEvidenceData,
} from "../types";

const EMPTY_DATA: OperationEvidenceData = {
  rows: [],
  volunteerOptions: [],
  activityOptions: [],
  evidenceTypeOptions: [],
  approvalStates: [],
  warnings: [],
};

export function useEvidenciasActividad(
  filters: EvidenceFilters
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OperationEvidenceData>(EMPTY_DATA);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

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
        const response = await listEvidencias({
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
            : "No se pudieron cargar las evidencias."
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
    filters.typeId,
    filters.validation,
    filters.volunteerId,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: EvidenceRegisterInput): Promise<MutationFeedback | null> => {
      if (isRegistering) {
        return null;
      }
      setIsRegistering(true);
      try {
        const response = await createEvidencia(input);
        refresh();
        return response;
      } finally {
        setIsRegistering(false);
      }
    },
    [isRegistering, refresh]
  );

  const update = useCallback(
    async (input: EvidenceUpdateInput) => {
      if (isUpdating) {
        return null;
      }
      setIsUpdating(true);
      try {
        const response = await updateEvidencia(input);
        refresh();
        return response;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const remove = useCallback(
    async (evidenceId: string) => {
      if (isRemoving) {
        return;
      }
      setIsRemoving(true);
      try {
        await removeEvidencia(evidenceId);
        refresh();
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, refresh]
  );

  const validate = useCallback(
    async (input: EvidenceValidationInput): Promise<MutationFeedback | null> => {
      if (isValidating) {
        return null;
      }
      setIsValidating(true);
      try {
        const response = await validateEvidencia(input);
        refresh();
        return response;
      } finally {
        setIsValidating(false);
      }
    },
    [isValidating, refresh]
  );

  const stats = useMemo(() => {
    return data.rows.reduce(
      (acc, row) => {
        if (row.validationStatusKind === "approved") {
          acc.approved += 1;
        } else if (row.validationStatusKind === "rejected") {
          acc.rejected += 1;
        } else if (row.validationStatusKind === "observed") {
          acc.observed += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, observed: 0 }
    );
  }, [data.rows]);

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    stats,
    volunteerOptions: data.volunteerOptions,
    activityOptions: data.activityOptions,
    evidenceTypeOptions: data.evidenceTypeOptions,
    approvalStates: data.approvalStates,
    isRegistering,
    isUpdating,
    isRemoving,
    isValidating,
    create,
    update,
    remove,
    validate,
    refresh,
  };
}

