import React, { useMemo, useState } from 'react';
import { EventChip } from './EventChip';
import type { Activity, ActivityStatus } from './types';
import { toDayKey } from './date-utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface DayCellProps {
  date: Date;
  inCurrentMonth: boolean;
  activities: Activity[];
  estadoById: Map<number, ActivityStatus>;
  selectedDateKey: string | null;
  selectedActivityId: number | null;
  onClickDay: (dateKey: string, anchorRect: DOMRect, activityCount: number) => void;
  onClickChip: (activity: Activity, anchorRect: DOMRect) => void;
}

export function DayCell({
  date,
  inCurrentMonth,
  activities,
  estadoById,
  selectedDateKey,
  selectedActivityId,
  onClickDay,
  onClickChip,
}: DayCellProps) {
  const key = toDayKey(date);
  const isToday = key === toDayKey(new Date());
  const isSelected = selectedDateKey === key;
  const openPopover = (anchorRect: DOMRect) => onClickDay(key, anchorRect, activities.length);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const MAX_EVENTS = 3;
  const visibleActivities = useMemo(() => {
    return activities.slice(0, MAX_EVENTS);
  }, [activities]);
  const hiddenCount = Math.max(0, activities.length - MAX_EVENTS);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => openPopover((event.currentTarget as HTMLDivElement).getBoundingClientRect())}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openPopover((event.currentTarget as HTMLDivElement).getBoundingClientRect());
      }}
      className={`flex min-h-[168px] flex-col rounded-xl border p-3 text-left align-top transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        inCurrentMonth ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'
      } ${isToday ? 'bg-blue-50/60' : ''} ${isSelected ? 'bg-indigo-50/40 ring-2 ring-indigo-500 ring-inset' : ''} hover:border-indigo-300 hover:bg-slate-50`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${inCurrentMonth ? 'text-slate-800' : 'text-slate-400'} ${isToday ? 'text-indigo-700' : ''}`}>
          {date.getDate()}
        </span>
        {activities.length > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {activities.length}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        {visibleActivities.map((activity) => (
          <div key={activity.id_actividad} onClick={(event) => event.stopPropagation()}>
            <EventChip
              activity={activity}
              estado={estadoById.get(activity.id_estado) || null}
              selected={selectedActivityId === activity.id_actividad}
              onClick={onClickChip}
            />
          </div>
        ))}

        {hiddenCount > 0 && (
          <div onClick={(event) => event.stopPropagation()}>
            <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={(event) => event.stopPropagation()}
                  className="w-full rounded-md border border-dashed border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={`Ver ${hiddenCount} actividades mas del dia ${key}`}
                  title={`Ver ${hiddenCount} mas`}
                >
                  +{hiddenCount} mas
                </button>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-[360px] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">Actividades {key}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {activities.length}
                  </span>
                </div>
                <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
                  {activities.map((activity) => (
                    <EventChip
                      key={`overflow-${activity.id_actividad}`}
                      activity={activity}
                      estado={estadoById.get(activity.id_estado) || null}
                      selected={selectedActivityId === activity.id_actividad}
                      onClick={(row, rect) => {
                        setOverflowOpen(false);
                        onClickChip(row, rect);
                      }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
