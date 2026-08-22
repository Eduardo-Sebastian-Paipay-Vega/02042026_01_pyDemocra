import { useCallback, useEffect, useState } from "react";
import type { NotificationHistoryRow } from "../types";
import { getNotificationHistoryEntryById } from "../../../services/notificaciones/history.service";

export function useNotificationHistoryDetail(notificationId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationHistoryRow | null>(null);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!notificationId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getNotificationHistoryEntryById(notificationId)
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

        setData(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el detalle."
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
  }, [notificationId, reloadToken]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}

