import React from 'react';
import type { Activity, ActivityStatus } from './types';
import { formatEventRange } from './date-utils';

interface EventChipProps {
  activity: Activity;
  estado: ActivityStatus | null;
  selected?: boolean;
  onClick: (activity: Activity, anchorRect: DOMRect) => void;
}

const normalize = (value: string) => value.trim().toLowerCase();

export function EventChip({ activity, estado, selected = false, onClick }: EventChipProps) {
  const timeRange = formatEventRange(activity);
  const statusLabel = estado?.nombre || 'Sin estado';
  const statusColor = String(estado?.color || '').trim();
  const isCanceled = normalize(statusLabel) === 'cancelada';
  const responsable = String(activity.responsableName || '').trim();
  const tooltip = [
    activity.titulo,
    activity.codigo ? `Codigo: ${activity.codigo}` : null,
    `Hora: ${timeRange}`,
    `Estado: ${statusLabel}`,
    responsable ? `Responsable: ${responsable}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <button
      type="button"
      onClick={(event) => onClick(activity, (event.currentTarget as HTMLButtonElement).getBoundingClientRect())}
      className={`w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] leading-tight shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        selected ? 'ring-2 ring-indigo-500 ring-inset border-indigo-200 bg-indigo-50/40' : ''
      } ${isCanceled ? 'text-slate-500' : 'text-slate-700'}`}
      style={
        statusColor
          ? { borderLeftWidth: 3, borderLeftColor: statusColor }
          : { borderLeftWidth: 3 }
      }
      title={tooltip}
      aria-label={`Abrir actividad ${activity.titulo}. Estado ${statusLabel}`}
      aria-current={selected ? 'true' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {statusColor ? (
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} aria-hidden="true" />
          ) : (
            <span className="inline-block h-2 w-2 rounded-full border border-slate-300" aria-hidden="true" />
          )}
          <span className="truncate font-semibold">{timeRange}</span>
        </div>
        <span className="truncate text-[10px] font-semibold text-slate-600">{statusLabel}</span>
      </div>
      <div className={`truncate ${isCanceled ? 'line-through decoration-slate-400' : ''}`}>{activity.titulo}</div>
      <div className="truncate text-[10px] text-slate-500">{responsable || 'Sin responsable'}</div>
    </button>
  );
}
