import type { Status } from './types';

export const STATUS_META: Record<
  Status,
  { label: string; dot: string; chipClass: string; pillClass: string; description: string; color: string }
> = {
  PLANIFICADA: {
    label: 'Planificada',
    dot: 'bg-sky-500',
    chipClass: 'border-slate-200 bg-white text-slate-700',
    pillClass: 'bg-sky-100 text-sky-700',
    description: 'Actividad creada pero no iniciada',
    color: '#0ea5e9',
  },
  EJECUCION: {
    label: 'Ejecucion',
    dot: 'bg-amber-500',
    chipClass: 'border-slate-200 bg-white text-slate-700',
    pillClass: 'bg-amber-100 text-amber-700',
    description: 'Actividad ocurriendo ahora',
    color: '#f59e0b',
  },
  CERRADA: {
    label: 'Cerrada',
    dot: 'bg-emerald-500',
    chipClass: 'border-slate-200 bg-white text-slate-700',
    pillClass: 'bg-emerald-100 text-emerald-700',
    description: 'Actividad finalizada correctamente',
    color: '#10b981',
  },
  CANCELADA: {
    label: 'Cancelada',
    dot: 'bg-slate-500',
    chipClass: 'border-slate-200 bg-white text-slate-500',
    pillClass: 'bg-slate-200 text-slate-700',
    description: 'Actividad suspendida definitivamente',
    color: '#64748b',
  },
};
