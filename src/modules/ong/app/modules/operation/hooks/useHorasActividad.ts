import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createHoras,
  listHoras,
  removeHoras,
  requestHorasApproval,
  resolveHoras,
  updateHoras,
  type MutationFeedback,
} from "../../../services/operacion/horas.service";
import type {
  HoursApprovalRequestInput,
  HoursFilters,
  HoursRegisterInput,
  HoursResolutionInput,
  HoursUpdateInput,
  OperationHoursData,
} from "../types";

const EMPTY_DATA: OperationHoursData = {
  rows: [],
  volunteerOptions: [],
  activityOptions: [],
  projectOptions: [],
  approvalStates: [],
  warnings: [],
};

export function useHorasActividad(
  filters: HoursFilters,
  ownerVolunteerId?: string | null
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OperationHoursData>(EMPTY_DATA);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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
        const response = await listHoras(
          {
            ...filters,
            searchTerm: debouncedSearchTerm,
          },
          ownerVolunteerId
        );
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
          loadError instanceof Error ? loadError.message : "No se pudieron cargar las horas."
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
    filters.scope,
    filters.status,
    filters.volunteerId,
    ownerVolunteerId,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: HoursRegisterInput): Promise<MutationFeedback | null> => {
      if (isRegistering) {
        return null;
      }
      setIsRegistering(true);
      try {
        const response = await createHoras(input);
        refresh();
        return response;
      } finally {
        setIsRegistering(false);
      }
    },
    [isRegistering, refresh]
  );

  const update = useCallback(
    async (input: HoursUpdateInput) => {
      if (isUpdating) {
        return null;
      }
      setIsUpdating(true);
      try {
        const response = await updateHoras(input);
        refresh();
        return response;
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, refresh]
  );

  const resolve = useCallback(
    async (input: HoursResolutionInput): Promise<MutationFeedback | null> => {
      if (isResolving) {
        return null;
      }
      setIsResolving(true);
      try {
        const response = await resolveHoras(input);
        refresh();
        return response;
      } finally {
        setIsResolving(false);
      }
    },
    [isResolving, refresh]
  );

  const requestApproval = useCallback(
    async (input: HoursApprovalRequestInput): Promise<MutationFeedback | null> => {
      if (isRequesting) {
        return null;
      }
      setIsRequesting(true);
      try {
        const response = await requestHorasApproval(input);
        refresh();
        return response;
      } finally {
        setIsRequesting(false);
      }
    },
    [isRequesting, refresh]
  );

  const remove = useCallback(
    async (hoursId: string, actorId?: string | null) => {
      if (isRemoving) {
        return;
      }
      setIsRemoving(true);
      try {
        await removeHoras(hoursId, actorId);
        refresh();
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, refresh]
  );

  const stats = useMemo(() => {
    return data.rows.reduce(
      (acc, row) => {
        if (row.statusKind === "approved") {
          acc.approved += 1;
        } else if (row.statusKind === "rejected") {
          acc.rejected += 1;
        } else if (row.statusKind === "observed") {
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
    projectOptions: data.projectOptions,
    approvalStates: data.approvalStates,
    isRegistering,
    isUpdating,
    isResolving,
    isRequesting,
    isRemoving,
    create,
    update,
    resolve,
    requestApproval,
    remove,
    refresh,
  };
}

