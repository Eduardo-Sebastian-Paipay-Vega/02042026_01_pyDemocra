import { useEffect, useRef } from "react";
import { supabase } from "../../../../supabaseClient";
import { resolveCurrentUserId } from "../../../services/notificaciones/shared";

export function useNotificationsRealtime(onNewNotification: () => void) {
  const callbackRef = useRef(onNewNotification);

  useEffect(() => {
    callbackRef.current = onNewNotification;
  });

  useEffect(() => {
    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribe() {
      const userId = await resolveCurrentUserId();
      if (cancelled || !userId) {
        return;
      }

      channelRef = supabase
        .channel(`notifications-rt:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "comunicaciones",
            table: "historial_notificaciones",
            filter: `id_usuario=eq.${userId}`,
          },
          () => {
            callbackRef.current();
          }
        )
        .subscribe();
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (channelRef) {
        void supabase.removeChannel(channelRef);
      }
    };
  }, []);
}

