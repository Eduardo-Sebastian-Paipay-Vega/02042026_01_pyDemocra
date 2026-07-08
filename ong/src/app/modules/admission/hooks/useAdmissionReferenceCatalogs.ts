import { useCallback, useEffect, useState } from "react";
import { getAdmissionReferenceCatalogs } from "../../../services/admision/solicitudesAdmision.service";
import type { AdmissionReferenceCatalogs } from "../types";

const EMPTY_CATALOGS: AdmissionReferenceCatalogs = {
  documentTypes: [],
  genders: [],
  countries: [],
  volunteerStates: [],
};

export function useAdmissionReferenceCatalogs() {
  const [reloadToken, setReloadToken] = useState(0);
  const [catalogs, setCatalogs] = useState<AdmissionReferenceCatalogs>(EMPTY_CATALOGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await getAdmissionReferenceCatalogs();
        if (!isActive) {
          return;
        }

        setCatalogs(response);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setCatalogs(EMPTY_CATALOGS);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los catalogos de admision."
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
    catalogs,
    refresh,
  };
}
