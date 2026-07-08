import { useCallback, useEffect, useState } from "react";
import type { RolesSettingsData } from "../types";
import { getRolesSettingsData } from "../../../services/configuracion/roles.service";

const EMPTY_DATA: RolesSettingsData = {
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
  roles: [],
  permissionCatalog: [],
  warnings: [],
  unsupportedFlows: [],
};

export function useRoleSettings() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RolesSettingsData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getRolesSettingsData()
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
            : "No se pudieron cargar los roles y permisos."
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
