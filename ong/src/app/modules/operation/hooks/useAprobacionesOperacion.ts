import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  createAprobacion,
  listAprobaciones,
  resolveAprobacion,
} from "../../../services/operacion/aprobaciones.service";
import type {
  ApprovalCreateInput,
  ApprovalFilters,
  ApprovalResolveInput,
  OperationApprovalsData,
} from "../types";

const EMPTY_DATA: OperationApprovalsData = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  volunteerOptions: [],
  approvalStates: [],
  warnings: [],
};

export function useAprobacionesOperacion(filters: ApprovalFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OperationApprovalsData>(EMPTY_DATA);
  const [isCreating, setIsCreating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

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
        const response = await listAprobaciones({
          entityType: filters.entityType === "all" ? null : filters.entityType,
          entityId: filters.entityId,
          statusKind: filters.status,
          requestedById:
            filters.requestedById === "all" ? null : filters.requestedById,
          approvedById:
            filters.approvedById === "all" ? null : filters.approvedById,
          searchTerm: debouncedSearchTerm,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: filters.page,
          pageSize: filters.pageSize,
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
            : "No se pudieron cargar las aprobaciones."
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
    filters.approvedById,
    filters.dateFrom,
    filters.dateTo,
    filters.entityId,
    filters.entityType,
    filters.page,
    filters.pageSize,
    filters.requestedById,
    filters.status,
    reloadToken,
  ]);

  const create = useCallback(
    async (input: ApprovalCreateInput) => {
      if (isCreating) {
        return null;
      }
      setIsCreating(true);
      try {
        const response = await createAprobacion(input);
        refresh();
        return response;
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, refresh]
  );

  const resolve = useCallback(
    async (input: ApprovalResolveInput) => {
      if (isResolving) {
        return null;
      }
      setIsResolving(true);
      try {
        const response = await resolveAprobacion(input);
        refresh();
        return response;
      } finally {
        setIsResolving(false);
      }
    },
    [isResolving, refresh]
  );

  return {
    loading,
    error,
    warnings: data.warnings,
    rows: data.rows,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    volunteerOptions: data.volunteerOptions,
    approvalStates: data.approvalStates,
    isCreating,
    isResolving,
    create,
    resolve,
    refresh,
  };
}
