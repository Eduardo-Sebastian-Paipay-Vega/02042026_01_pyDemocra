import { useCallback, useState } from "react";
import { markNotificationAsRead } from "../../../services/notificaciones/history.service";

export function useNotificationHistoryMutations(onCompleted?: () => void) {
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (isMarkingRead) {
        return;
      }
      setIsMarkingRead(true);
      try {
        await markNotificationAsRead(notificationId);
        onCompleted?.();
      } finally {
        setIsMarkingRead(false);
      }
    },
    [isMarkingRead, onCompleted]
  );

  return { isMarkingRead, markAsRead };
}

