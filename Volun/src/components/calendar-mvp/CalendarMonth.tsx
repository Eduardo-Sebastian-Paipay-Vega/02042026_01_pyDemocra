import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity, ActivityStatus } from './types';
import { buildMonthGrid, getActivityDateKey, toDayKey } from './date-utils';
import { DayCell } from './DayCell';

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface CalendarMonthProps {
  monthDate: Date;
  activities: Activity[];
  estadosActividad: ActivityStatus[];
  selectedDate: string | null;
  selectedActivityId: number | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (dateKey: string, anchorRect: DOMRect, activityCount: number) => void;
  onChipClick: (activity: Activity, anchorRect: DOMRect) => void;
}

export function CalendarMonth({
  monthDate,
  activities,
  estadosActividad,
  selectedDate,
  selectedActivityId,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onChipClick,
}: CalendarMonthProps) {
  const grid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  const estadoById = useMemo(
    () => new Map(estadosActividad.map((estado) => [estado.id_estado, estado])),
    [estadosActividad],
  );

  const activitiesByDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    activities.forEach((activity) => {
      const key = getActivityDateKey(activity);
      const list = map.get(key) || [];
      list.push(activity);
      map.set(key, list);
    });

    map.forEach((list) => {
      list.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
    });

    return map;
  }, [activities]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
        </h2>
      </header>

      <div className="p-2">
        <div className="grid grid-cols-7 gap-2 border-b border-slate-200 bg-slate-50/80 px-1 py-2">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {day}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {grid.map((cell) => {
            const key = toDayKey(cell.date);
            return (
              <DayCell
                key={key}
                date={cell.date}
                inCurrentMonth={cell.inCurrentMonth}
                activities={activitiesByDay.get(key) || []}
                estadoById={estadoById}
                selectedDateKey={selectedDate}
                selectedActivityId={selectedActivityId}
                onClickDay={onDayClick}
                onClickChip={onChipClick}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
