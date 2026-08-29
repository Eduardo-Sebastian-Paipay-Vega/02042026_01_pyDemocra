import { useState, useEffect, useCallback } from "react";
import { AreaWithProjects, listAreas, createArea, updateArea, toggleAreaStatus } from "../../../services/gobernanza/areas.service";
import { toast } from "sonner";

export function useAreas(searchTerm: string) {
  const [areas, setAreas] = useState<AreaWithProjects[]>([]);
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

    listAreas(searchTerm)
      .then((data) => {
        if (!active) return;
        setAreas(data);
      })
      .catch((err) => {
        if (!active) return;
        setAreas([]);
        setError(err instanceof Error ? err.message : "Error desconocido al cargar áreas");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchTerm, reloadToken]);

  const handleCreate = async (payload: { codigo: string; nombre_area: string; descripcion?: string; activo: boolean }) => {
    try {
      await createArea(payload);
      toast.success("Área creada exitosamente");
      refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear área");
      return false;
    }
  };

  const handleUpdate = async (id: string, payload: { codigo: string; nombre_area: string; descripcion?: string; activo: boolean }) => {
    try {
      await updateArea(id, payload);
      toast.success("Área actualizada exitosamente");
      refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar área");
      return false;
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAreaStatus(id, !currentStatus);
      toast.success(`Área ${!currentStatus ? 'activada' : 'desactivada'}`);
      refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
      return false;
    }
  };

  return {
    areas,
    loading,
    error,
    refresh,
    handleCreate,
    handleUpdate,
    handleToggleStatus
  };
}
