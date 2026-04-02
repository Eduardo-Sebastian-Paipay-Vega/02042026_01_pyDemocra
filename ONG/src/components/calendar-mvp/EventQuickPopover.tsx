import React, { useMemo } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { formatEventRange } from './date-utils';
import type { Activity } from './types';
import type { ActivitySummaryData } from '../../services/activities';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export type AnchorRect = { top: number; left: number; width: number; height: number } | null;

interface EventQuickPopoverProps {
  open: boolean;
  activityId: number | null;
  fallbackActivity?: Activity | null;
  anchorRect: AnchorRect;
  loading: boolean;
  error: string | null;
  summary: ActivitySummaryData | null;
  onClose: () => void;
  onRetry: () => void;
  onViewDetails: (activityId: number) => void;
}

const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

function buildStatusStyles(color: string) {
  const raw = String(color || '').trim();
  if (!raw) {
    return {
      borderColor: '#cbd5e1',
      backgroundColor: '#f8fafc',
      color: '#475569',
    };
  }
  if (isHexColor(raw)) {
    return {
      borderColor: `${raw}66`,
      backgroundColor: `${raw}22`,
      color: raw,
    };
  }
  return {
    borderColor: raw,
    backgroundColor: '#ffffff',
    color: raw,
  };
}

export function EventQuickPopover({
  open,
  activityId,
  fallbackActivity = null,
  anchorRect,
  loading,
  error,
  summary,
  onClose,
  onRetry,
  onViewDetails,
}: EventQuickPopoverProps) {
  const activity = summary?.actividad || fallbackActivity || null;
  const statusLabel = summary?.estado?.nombre || 'Sin estado';
  const statusColor = String(summary?.estado?.color || '').trim();
  const statusStyles = useMemo(() => buildStatusStyles(statusColor), [statusColor]);
  const timeRange = activity && activity.fecha_inicio && activity.fecha_fin ? formatEventRange(activity) : '--';

  const responsable =
    summary?.responsable?.nombre_completo?.trim()
    || String(fallbackActivity?.responsableName || '').trim()
    || 'Sin responsable';
  const tipo = summary?.tipo_actividad?.nombre?.trim() || 'Sin tipo';
  const ubicacion = activity?.ubicacion_direccion?.trim() || 'Sin ubicacion';
  const codigo = activity?.codigo?.trim() || (activityId ? `Actividad ${activityId}` : 'Actividad');
  const titulo = activity?.titulo?.trim() || 'Sin titulo';

  if (!open || !anchorRect) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <PopoverAnchor asChild>
        {/* Virtual anchor so the popover can position itself close to the clicked event. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed"
          style={{
            top: anchorRect.top,
            left: anchorRect.left,
            width: anchorRect.width,
            height: anchorRect.height,
          }}
        />
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={10}
        onCloseAutoFocus={(event) => {
          // Prevent Radix from restoring focus back to the (virtual) anchor.
          // When opening a Dialog from inside this Popover, focus restoration can
          // immediately dismiss the Dialog (focus moves outside).
          event.preventDefault();
        }}
        className="w-[420px] max-w-[calc(100vw-24px)] rounded-2xl p-0 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">{codigo}</p>
            <h3 className="truncate text-sm font-semibold text-slate-900">{titulo}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar popover">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="space-y-3 px-4 py-3">
          {loading && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando resumen...
              </div>
              <div className="space-y-2">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <p>{error}</p>
              <Button type="button" variant="destructive" size="sm" onClick={onRetry}>
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !error && activity && (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-700">{timeRange}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  Responsable: {responsable}
                </span>
                <span
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={statusStyles}
                  title={summary?.estado?.color ? `Color: ${summary.estado.color}` : undefined}
                >
                  {statusLabel}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  Tipo: {tipo}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <p className="inline-flex items-center gap-1 text-[11px] text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-semibold">{ubicacion}</span>
                </p>
              </div>

              {(summary?.warnings || []).length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Advertencias</p>
                  <ul className="mt-1 space-y-1">
                    {(summary?.warnings || []).slice(0, 2).map((warning, idx) => (
                      <li key={`${warning}-${idx}`} className="text-xs text-amber-800">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!loading && !error && !activity && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
              No hay datos para mostrar.
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              className="w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              disabled={!activityId}
              onClick={() => activityId && onViewDetails(activityId)}
            >
              Ver mas detalles
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
