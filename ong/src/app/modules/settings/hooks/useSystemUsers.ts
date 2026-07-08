import { useCallback, useEffect, useState } from "react";
import type { SystemUsersData } from "../types";
import { getSystemUsersData } from "../../../services/configuracion/systemUsers.service";

const EMPTY_DATA: SystemUsersData = {
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
  rows: [],
  profileOptions: [],
  roleOptions: [],
  sedeOptions: [],
  volunteerOptions: [],
  warnings: [],
  unsupportedFlows: [],
};

export function useSystemUsers() {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SystemUsersData>(EMPTY_DATA);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getSystemUsersData()
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
            : "No se pudieron cargar los usuarios del sistema."
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
