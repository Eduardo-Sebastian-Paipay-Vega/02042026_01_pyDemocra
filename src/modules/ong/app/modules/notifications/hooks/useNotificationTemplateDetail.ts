import { useCallback, useEffect, useState } from "react";
import type { NotificationTemplateRow } from "../types";
import { getNotificationTemplateById } from "../../../services/notificaciones/templates.service";

export function useNotificationTemplateDetail(templateId: string | null) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationTemplateRow | null>(null);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!templateId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getNotificationTemplateById(templateId)
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
            : "No se pudo cargar la plantilla."
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
  }, [reloadToken, templateId]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}

