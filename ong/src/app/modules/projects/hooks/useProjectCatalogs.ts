import { useCallback, useEffect, useState } from "react";
import type { ProjectCatalogs } from "../types";
import { fetchProjectCatalogs } from "../../../services/proyectos/shared";

const EMPTY_CATALOGS: ProjectCatalogs = {
  projectStates: [],
  taskStates: [],
  activityStates: [],
  areas: [],
  projects: [],
  tasks: [],
  activities: [],
  locations: [],
  volunteers: [],
  items: [],
  canManage: null,
  permissionWarning: null,
};

export function useProjectCatalogs() {
  const [catalogs, setCatalogs] = useState<ProjectCatalogs>(EMPTY_CATALOGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchProjectCatalogs()
      .then((response) => {
        if (!active) {
          return;
        }
        setCatalogs(response);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setCatalogs(EMPTY_CATALOGS);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los catalogos del modulo Proyectos."
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
    catalogs,
    loading,
    error,
    refresh,
  };
}
