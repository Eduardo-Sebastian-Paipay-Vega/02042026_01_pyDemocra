import { useCallback, useEffect, useState } from "react";
import type {
  SensitiveAccessState,
  SensitiveMedicalListRow,
  SensitiveRecordScope,
} from "../types";
import {
  getSensitiveAccessContext,
  listSensitiveMedicalRecords,
} from "../../../services/clinico/medicalRecords.service";

const EMPTY_ACCESS: SensitiveAccessState = {
  currentUserId: null,
  canRead: false,
  canWrite: false,
  isTenantAdmin: false,
  roleNames: [],
  reason: null,
};

export function useMedicalRecords(scope: SensitiveRecordScope) {
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SensitiveMedicalListRow[]>([]);
  const [access, setAccess] = useState<SensitiveAccessState>(EMPTY_ACCESS);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const upsertRow = useCallback((row: SensitiveMedicalListRow) => {
    setRows((current) => {
      const nextRows = [...current];
      const currentIndex = nextRows.findIndex(
        (item) => item.scope === row.scope && item.personId === row.personId
      );

      if (currentIndex >= 0) {
        nextRows[currentIndex] = row;
      } else {
        nextRows.unshift(row);
      }

      nextRows.sort((left, right) =>
        left.personName.localeCompare(right.personName, "es", { sensitivity: "base" })
      );

      return nextRows;
    });
    setError(null);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const accessState = await getSensitiveAccessContext();
        if (!isActive) {
          return;
        }

        setAccess(accessState);

        if (!accessState.canRead) {
          setRows([]);
          return;
        }

        const listRows = await listSensitiveMedicalRecords(scope);
        if (!isActive) {
          return;
        }

        setRows(listRows);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las fichas sensibles."
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
  }, [reloadToken, scope]);

  return {
    loading,
    error,
    rows,
    access,
    refresh,
    upsertRow,
  };
}

