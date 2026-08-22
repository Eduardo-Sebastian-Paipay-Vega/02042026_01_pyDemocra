import { useCallback, useEffect, useState } from "react";
import { getNotificationTopbarItems } from "../../services/notificaciones/history.service";
import { useNotificationsRealtime } from "../notifications/hooks/useNotificationsRealtime";
import { toFriendlyError } from "./homeService";
import type { HomeNotificationItem } from "./types";

interface UseHomeNotificationsResult {
  items: HomeNotificationItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useHomeNotifications(): UseHomeNotificationsResult {
  const [items, setItems] = useState<HomeNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useNotificationsRealtime(refresh);

  useEffect(() => {
    let isActive = true;

    async function loadNotifications() {
      setLoading(true);
      setError(null);

      try {
        const notifications = await getNotificationTopbarItems();
        if (!isActive) {
          return;
        }

        setItems(notifications);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setItems([]);
        setError(
          toFriendlyError(
            loadError,
            "No se pudieron cargar las notificaciones reales."
          )
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  return {
    items,
    loading,
    error,
    refresh,
  };
}

