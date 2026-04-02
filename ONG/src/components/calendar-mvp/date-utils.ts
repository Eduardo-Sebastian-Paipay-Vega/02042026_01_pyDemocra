import type { Activity } from './types';
import { adaptActivityToSchedule, toHHmm, toLocalDayKey, toMinutesOfDay } from './adapters/activityAdapter';

const pad2 = (value: number) => String(value).padStart(2, '0');

export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(input: string): Date {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDateKeyFromIsoDateTime(value: string): string {
  return toLocalDayKey(value);
}

export function getTimeFromIsoDateTime(value: string): string {
  return toHHmm(value);
}

export function getMinutesFromIsoDateTime(value: string): number {
  return toMinutesOfDay(value);
}

export function formatDateLong(value: string): string {
  return parseISODate(value).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTimeLong(value: string): string {
  return new Date(value).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function buildMonthGrid(monthDate: Date): Array<{ date: Date; inCurrentMonth: boolean }> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, idx) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + idx);
    return {
      date,
      inCurrentMonth: date.getMonth() === month,
    };
  });
}

export function getActivityDateKey(activity: Activity): string {
  return adaptActivityToSchedule(activity).dayKey;
}

export function getActivityStartTime(activity: Activity): string {
  return adaptActivityToSchedule(activity).startHHmm;
}

export function getActivityEndTime(activity: Activity): string {
  return adaptActivityToSchedule(activity).endHHmm;
}

export function getActivityDurationMinutes(activity: Activity): number {
  return adaptActivityToSchedule(activity).durationMin;
}

export function formatEventRange(activity: Activity): string {
  return `${getActivityStartTime(activity)} - ${getActivityEndTime(activity)}`;
}

export function checkOverlap(candidate: Activity, activities: Activity[]): boolean {
  const candidateStart = new Date(candidate.fecha_inicio).getTime();
  const candidateEnd = new Date(candidate.fecha_fin).getTime();
  const candidateDay = getActivityDateKey(candidate);

  return activities.some((activity) => {
    if (activity.id_actividad === candidate.id_actividad) return false;
    if (getActivityDateKey(activity) !== candidateDay) return false;
    const start = new Date(activity.fecha_inicio).getTime();
    const end = new Date(activity.fecha_fin).getTime();
    return candidateStart < end && start < candidateEnd;
  });
}
