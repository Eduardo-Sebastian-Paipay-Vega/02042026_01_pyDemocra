import React, { useEffect, useMemo, useState } from 'react';
import { ModalShell } from './ModalShell';
import { useFocusTrap } from './hooks';
import { formatDateLong, getActivityEndTime, getActivityStartTime } from './date-utils';
import { listActivitiesByDay } from '../../services/activities';
import type { Activity, ActivityStatus } from './types';

interface DayActivitiesModalProps {
  open: boolean;
  dateKey: string | null;
  accessToken: string;
  estadosActividad: ActivityStatus[];
  onClose: () => void;
  onOpenDetail: (activity: Activity) => void;
}

export function DayActivitiesModal({
  open,
  dateKey,
  accessToken,
  estadosActividad,
  onClose,
  onOpenDetail,
}: DayActivitiesModalProps) {
  const dialogRef = useFocusTrap(open, onClose);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDay = async () => {
    if (!dateKey || !accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const rows = await listActivitiesByDay(accessToken, dateKey);
      setActivities(rows);
    } catch (err) {
      setActivities([]);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar actividades del día');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadDay();
  }, [open, dateKey, accessToken]);

  const subtitle = useMemo(() => {
    if (!dateKey) return 'Sin fecha';
    return formatDateLong(dateKey);
  }, [dateKey]);

  if (!open || !dateKey) return null;

  return (
    <ModalShell
      open={open}
      title="Actividades del día"
      subtitle={subtitle}
      onClose={onClose}
      dialogRef={dialogRef}
      maxWidthClassName="max-w-[760px]"
      maxHeightClassName="max-h-[90vh]"
      zIndexClassName="z-[125]"
      centered
    >
      <div className="space-y-3">
        {loading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Cargando actividades...
          </div>
        )}

        {error && (
          <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-800">{error}</p>
            <button
              type="button"
              onClick={() => void loadDay()}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No hay actividades para este día.
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <ul className="space-y-2">
            {activities.map((activity) => {
              const estado = estadosActividad.find((item) => item.id_estado === activity.id_estado) || null;
              const statusColor = estado?.color || '#64748b';
              return (
                <li key={activity.id_actividad} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">{activity.codigo}</p>
                      <p className="truncate text-sm font-semibold text-slate-900">{activity.titulo}</p>
                      <p className="text-xs text-slate-600">
                        {getActivityStartTime(activity)}-{getActivityEndTime(activity)}
                      </p>
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        borderColor: `${statusColor}66`,
                        backgroundColor: `${statusColor}22`,
                        color: statusColor,
                      }}
                    >
                      {estado?.nombre || 'Sin estado'}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(activity)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Ver detalles
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
