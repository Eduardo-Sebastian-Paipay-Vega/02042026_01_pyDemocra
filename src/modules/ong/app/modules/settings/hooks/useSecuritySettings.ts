import { useCallback, useEffect, useState } from "react";
import type { SecuritySettingsData } from "../types";
import { getSecuritySettingsData } from "../../../services/configuracion/security.service";

const EMPTY_DATA: SecuritySettingsData = {
  access: {
    currentUserId: null,
    isTenantAdmin: false,
    canReadUsers: false,
    canManageUsers: false,
    canReadRoles: false,
    canManageRoles: false,
    canManageUserAssignments: false,
    canReadPermissions: false,
    canReadAudit: false,
    canReadSessions: false,
    canManageSessions: false,
    canReadDevices: false,
    canManageDevices: false,
    canReadTerminals: false,
    canManageTerminals: false,
    canReadAuthEvents: false,
    warnings: [],
  },
  sessions: [],
  devices: [],
  terminals: [],
  authEvents: [],
  warnings: [],
  unsupportedFlows: [],
};

export function useSecuritySettings() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SecuritySettingsData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getSecuritySettingsData()
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
            : "No se pudo cargar la seguridad de sesion."
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
