import { useCallback, useEffect, useState } from "react";
import type { GovernanceRetentionData } from "../types";
import { getGovernanceRetentionData } from "../../../services/gobernanza/retention.service";

const EMPTY_DATA: GovernanceRetentionData = {
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
  retentionDays: null,
  retentionPolicyLabel: "Politica de retencion no disponible",
  canRestoreRecords: false,
  restoreCandidates: [],
  recentDeleteEvents: [],
  warnings: [],
  supportNotes: [],
};

export function useGovernanceRetention() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GovernanceRetentionData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getGovernanceRetentionData()
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
            : "No se pudo cargar el estado de retencion."
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
