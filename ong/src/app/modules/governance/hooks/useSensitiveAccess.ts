import { useCallback, useEffect, useState } from "react";
import type {
  GovernanceSensitiveAccessData,
  SensitiveAccessLogFilters,
} from "../types";
import { getGovernanceSensitiveAccessData } from "../../../services/gobernanza/sensitiveAccess.service";

const EMPTY_DATA: GovernanceSensitiveAccessData = {
  access: {
    currentUserId: null,
    isTenantAdmin: false,
    canReadCatalogs: false,
    canReadAudit: false,
    canReadSensitiveAccess: false,
    canReadRetention: false,
    canReadConstraints: false,
    canManageConstraints: false,
    warnings: [],
  },
  logRows: [],
  actorOptions: [{ value: "all", label: "Actor: Todos" }],
  constraints: [],
  roleOptions: [],
  sedeOptions: [{ value: "all", label: "Todas las sedes" }],
  warnings: [],
  unsupportedFlows: [],
};

export function useSensitiveAccess(filters: SensitiveAccessLogFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GovernanceSensitiveAccessData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getGovernanceSensitiveAccessData(filters)
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
            : "No se pudieron cargar los accesos sensibles."
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
  }, [filters, reloadToken]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}
