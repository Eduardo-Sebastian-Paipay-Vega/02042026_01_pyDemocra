import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../App';
import { getUserRoleName } from '../../types/user';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import { getActivityDetail, type ActivityDetailData, updateActivityStatus } from '../../services/activities';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

interface DrawerDetalleActividadProps {
  open: boolean;
  selectedActivityId: number | null;
  accessToken: string;
  onClose: () => void;
  onStatusUpdated?: (activityId: number, estadoId: number) => void;
}

export function DrawerDetalleActividad({
  open,
  selectedActivityId,
  accessToken,
  onClose,
  onStatusUpdated,
}: DrawerDetalleActividadProps) {
  const { user } = useAuth();
  const canManageStatus = ['admin', 'principal'].includes(getUserRoleName(user || null));
  const [detail, setDetail] = useState<ActivityDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!selectedActivityId) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getActivityDetail(accessToken, selectedActivityId);
      if ((data.warnings || []).length > 0) {
        console.warn('Detalle de actividad con advertencias', { selectedActivityId, warnings: data.warnings });
      }
      setDetail(data);
    } catch (err) {
      console.error('Error cargando detalle de actividad', { selectedActivityId, err });
      setDetail(null);
      const message = err instanceof Error ? err.message : 'No se pudo cargar el detalle de actividad';
      setError(`No se pudo cargar el detalle de actividad (${message}).`);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedActivityId]);

  useEffect(() => {
    if (!open) return;
    loadDetail();
  }, [open, loadDetail]);

  const subtitle = useMemo(() => {
    if (!selectedActivityId) return 'Sin actividad seleccionada';
    if (detail?.actividad?.codigo) return detail.actividad.codigo;
    return `Actividad ID ${selectedActivityId}`;
  }, [detail?.actividad?.codigo, selectedActivityId]);

  const handleChangeStatus = useCallback(async (estadoId: number) => {
    if (!selectedActivityId) return;

    const previousEstadoId = detail?.actividad?.id_estado ?? null;
    const previousDetailSnapshot = detail;

    // Optimistic UI update.
    setDetail((prev) => {
      if (!prev?.actividad) return prev;
      const nextEstado = (prev.estados_actividad || []).find((estado) => estado.id_estado === estadoId) || null;
      return {
        ...prev,
        actividad: { ...prev.actividad, id_estado: estadoId },
        estado: nextEstado ? { ...nextEstado } : prev.estado,
      };
    });
    onStatusUpdated?.(selectedActivityId, estadoId);

    try {
      setUpdatingStatus(true);
      setError(null);
      await updateActivityStatus(accessToken, selectedActivityId, estadoId);
      toast.success('Estado actualizado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      console.error('Error actualizando estado', { selectedActivityId, estadoId, err });
      toast.error(`No se pudo actualizar el estado (${message})`);

      // Revert optimistic state.
      setDetail(previousDetailSnapshot);
      if (previousEstadoId !== null) onStatusUpdated?.(selectedActivityId, previousEstadoId);
      setError(message);
    } finally {
      setUpdatingStatus(false);
    }
  }, [accessToken, detail, onStatusUpdated, selectedActivityId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      {/* NOTE: DialogContent is the scroll container to avoid flex(1) collapsing issues. */}
      <DialogContent className="w-full max-w-5xl mx-auto max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
        <header className="sticky top-0 z-10 mb-4 border-b border-slate-200 bg-background pb-4">
          <div className="flex items-center justify-between gap-4 pr-10">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold">Detalle de actividad</DialogTitle>
              <DialogDescription className="truncate text-sm text-muted-foreground">{subtitle}</DialogDescription>
            </div>
          </div>
        </header>

        <ActivityDetailPanel
          detail={detail}
          selectedActivityId={selectedActivityId}
          loading={loading}
          error={error}
          onRetry={loadDetail}
          onChangeStatus={canManageStatus ? handleChangeStatus : undefined}
          updatingStatus={updatingStatus}
        />
      </DialogContent>
    </Dialog>
  );
}
