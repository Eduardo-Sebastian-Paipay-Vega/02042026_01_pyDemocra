import { useCallback, useEffect, useState } from "react";
import type { GovernanceAuditData, GovernanceAuditFilters } from "../types";
import { listGovernanceAuditEvents } from "../../../services/gobernanza/audit.service";

const EMPTY_DATA: GovernanceAuditData = {
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
  rows: [],
  schemaOptions: [{ value: "all", label: "Esquema: Todos" }],
  tableOptions: [{ value: "all", label: "Tabla: Todas" }],
  actorOptions: [{ value: "all", label: "Actor: Todos" }],
  warnings: [],
};

export function useGovernanceAuditLog(filters: GovernanceAuditFilters) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GovernanceAuditData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listGovernanceAuditEvents(filters)
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
            : "No se pudo cargar la auditoria."
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

