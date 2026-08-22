import { useCallback, useEffect, useState } from "react";
import type { IdCardWorkspaceData } from "../types";
import { listIdCardWorkspace } from "../../../services/personas/idCards.service";

const EMPTY_DATA: IdCardWorkspaceData = {
  access: {
    currentUserId: null,
    tenantId: null,
    isTenantAdmin: false,
    canRead: false,
    canManage: false,
    warnings: [],
  },
  templates: [],
  cards: [],
  volunteerOptions: [],
  templateOptions: [],
  warnings: [],
};

export function useIdCards() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IdCardWorkspaceData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextData = await listIdCardWorkspace();
        if (!isActive) {
          return;
        }

        setData(nextData);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setData(EMPTY_DATA);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el modulo de credenciales ID."
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
  }, [reloadToken]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}

