import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotificationTopbarItems,
  markNotificationAsRead,
} from "../../services/notificaciones/history.service";
import {
  notificationsDb,
  resolveNotificationCapabilities,
} from "../../services/notificaciones/shared";
import { toFriendlyError } from "./homeService";
import type { HomeNotificationItem } from "./types";

type RealtimeChannel = ReturnType<typeof notificationsDb.channel>;

interface UseHomeNotificationsResult {
  items: HomeNotificationItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  markAsRead: (id: string) => Promise<void>;
}

export function useHomeNotifications(): UseHomeNotificationsResult {
  const [items, setItems] = useState<HomeNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic: remove immediately from UI
    setItems((current) => current.filter((item) => item.id !== id));
    await markNotificationAsRead(id).catch(() => undefined);
  }, []);

  // Initial load and refresh
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
          toFriendlyError(loadError, "No se pudieron cargar las notificaciones reales.")
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();
    return () => { isActive = false; };
  }, [reloadToken]);

  // Realtime subscription — prepend new notifications without full refresh
  useEffect(() => {
    let isActive = true;

    async function setupRealtime() {
      const caps = await resolveNotificationCapabilities();
      if (!isActive || !caps.tenantId || !caps.currentUserId) {
        return;
      }

      const userId = caps.currentUserId;
      const tenantId = caps.tenantId;

      const channel = notificationsDb
        .channel(`notif-inbox-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "comunicaciones",
            table: "historial_notificaciones",
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              id_usuario: string;
              titulo: string;
              mensaje: string;
            };
            if (row.id_usuario !== userId) return;

            const preview =
              row.mensaje.length > 96 ? `${row.mensaje.slice(0, 93)}...` : row.mensaje;

            setItems((current) => {
              if (current.some((item) => item.id === row.id)) return current;
              return [
                {
                  id: row.id,
                  title: row.titulo,
                  description: preview,
                  targetPath: `/admin/notifications/history?notificationId=${encodeURIComponent(row.id)}`,
                },
                ...current,
              ].slice(0, 5);
            });
          }
        )
        .subscribe();

      if (isActive) {
        channelRef.current = channel;
      } else {
        notificationsDb.removeChannel(channel).catch(() => undefined);
      }
    }

    void setupRealtime();

    return () => {
      isActive = false;
      if (channelRef.current) {
        notificationsDb.removeChannel(channelRef.current).catch(() => undefined);
        channelRef.current = null;
      }
    };
  }, []);

  return { items, loading, error, refresh, markAsRead };
}
