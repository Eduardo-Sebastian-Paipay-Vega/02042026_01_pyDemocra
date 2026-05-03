import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import type { NotificationHistoryData, NotificationHistoryFilters } from "../types";
import { getNotificationHistoryData } from "../../../services/notificaciones/history.service";

const EMPTY_DATA: NotificationHistoryData = {
  access: {
    currentUserId: null,
    tenantId: null,
    canReadTemplates: false,
    canManageTemplates: false,
    canReadHistory: false,
    isTenantAdmin: false,
    hasReadPermission: false,
    hasManagePermission: false,
    warnings: [],
  },
  rows: [],
  recipientOptions: [],
  channelOptions: [],
  deliveryStateOptions: [],
  summary: {
    total: 0,
    unread: 0,
    withErrors: 0,
    linkedTemplates: 0,
  },
  total: 0,
  page: 1,
  pageSize: 20,
  warnings: [],
  unsupportedFlows: [],
};

export function useNotificationHistory(filters: NotificationHistoryFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationHistoryData>(EMPTY_DATA);

  const debouncedSearchTerm = useDebouncedValue(filters.searchTerm, 350);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    getNotificationHistoryData({
      ...filters,
      searchTerm: debouncedSearchTerm,
    })
      .then((response) => {
        if (!active) {
          return;
        }

        setData(response);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        setData({
          ...EMPTY_DATA,
          page: filters.page,
          pageSize: filters.pageSize,
        });
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el historial."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    filters.channelCode,
    filters.deliveryState,
    debouncedSearchTerm,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.pageSize,
    filters.readState,
    filters.recipientId,
    reloadToken,
  ]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}
