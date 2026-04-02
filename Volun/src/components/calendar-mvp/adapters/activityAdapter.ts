import type { Activity } from '../types';

const pad2 = (value: number) => String(value).padStart(2, '0');

export interface ActivityScheduleAdapter {
  id_actividad: number;
  dayKey: string;
  startMin: number;
  endMin: number;
  startHHmm: string;
  endHHmm: string;
  durationMin: number;
}

export function toLocalDayKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toMinutesOfDay(value: Date | string): number {
  const date = value instanceof Date ? value : new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function toHHmm(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function adaptActivityToSchedule(activity: Activity): ActivityScheduleAdapter {
  const startDate = new Date(activity.fecha_inicio);
  const endDate = new Date(activity.fecha_fin);
  const startMin = toMinutesOfDay(startDate);
  const rawEndMin = toMinutesOfDay(endDate);
  const endMin = rawEndMin > startMin ? rawEndMin : startMin + 15;

  return {
    id_actividad: activity.id_actividad,
    dayKey: toLocalDayKey(startDate),
    startMin,
    endMin,
    startHHmm: toHHmm(startDate),
    endHHmm: toHHmm(endDate),
    durationMin: Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))),
  };
}
