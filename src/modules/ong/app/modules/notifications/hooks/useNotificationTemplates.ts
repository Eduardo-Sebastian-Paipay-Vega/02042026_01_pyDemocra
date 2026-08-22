import { useCallback, useEffect, useState } from "react";
import type { NotificationTemplatesData } from "../types";
import { getNotificationTemplatesData } from "../../../services/notificaciones/templates.service";

const EMPTY_DATA: NotificationTemplatesData = {
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
  channelOptions: [],
  summary: {
    total: 0,
    active: 0,
    inactive: 0,
    channels: 0,
    withEventCode: 0,
  },
  warnings: [],
  unsupportedFlows: [],
};

export function useNotificationTemplates() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationTemplatesData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    getNotificationTemplatesData()
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

        setData(EMPTY_DATA);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las plantillas."
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
  }, [reloadToken]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}

