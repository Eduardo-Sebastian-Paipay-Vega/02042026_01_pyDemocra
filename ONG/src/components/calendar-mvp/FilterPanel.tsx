import React from 'react';
import { Search, X } from 'lucide-react';
import type { DateRangeFilter } from './state';
import type { ActivityStatus, User } from './types';

export interface DateRangeOption {
  value: DateRangeFilter;
  label: string;
}

export interface ActiveFilterChip {
  id: string;
  label: string;
  type: 'status' | 'responsable' | 'range' | 'search' | 'mine';
  value: string;
}

interface FilterPanelProps {
  dateRange: DateRangeFilter;
  dateRangeOptions: DateRangeOption[];
  responsables: User[];
  responsibleFilters: number[];
  searchText: string;
  estadosActividad: ActivityStatus[];
  statusFilters: number[];
  showOnlyMine: boolean;
  activeFilterChips: ActiveFilterChip[];
  onSetDateRange: (range: DateRangeFilter) => void;
  onToggleResponsible: (userId: number) => void;
  onSetSearch: (value: string) => void;
  onToggleStatus: (statusId: number) => void;
  onToggleShowOnlyMine: (value: boolean) => void;
  onRemoveFilterChip: (type: ActiveFilterChip['type'], value: string) => void;
  onClearAllFilters: () => void;
}

export function FilterPanel({
  dateRange,
  dateRangeOptions,
  responsables,
  responsibleFilters,
  searchText,
  estadosActividad,
  statusFilters,
  showOnlyMine,
  activeFilterChips,
  onSetDateRange,
  onToggleResponsible,
  onSetSearch,
  onToggleStatus,
  onToggleShowOnlyMine,
  onRemoveFilterChip,
  onClearAllFilters,
}: FilterPanelProps) {
  const hasAnyFilters = activeFilterChips.length > 0;
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const statusByKey = new Map<string, ActivityStatus>();
  estadosActividad.forEach((estado) => {
    const key = normalize(estado.nombre);
    if (!statusByKey.has(key)) statusByKey.set(key, estado);
  });

  const preferredStatusOrder = ['planificada', 'en ejecucion', 'cerrada', 'cancelada'];
  const preferredStatuses = preferredStatusOrder
    .map((key) => statusByKey.get(key))
    .filter((estado): estado is ActivityStatus => Boolean(estado));
  const preferredIds = new Set(preferredStatuses.map((item) => item.id_estado));
  const fallbackStatuses = estadosActividad.filter((item) => !preferredIds.has(item.id_estado));
  const statusTabs = [...preferredStatuses, ...fallbackStatuses];

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-12">
        <label className="space-y-1 min-w-0 lg:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Rango</span>
          <select
            value={dateRange}
            onChange={(event) => onSetDateRange(event.target.value as DateRangeFilter)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 min-w-0 lg:col-span-5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Buscador</span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={searchText}
              onChange={(event) => onSetSearch(event.target.value)}
              placeholder="Codigo, titulo o descripcion"
              className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </label>

        <div className="space-y-1 lg:col-span-5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Responsables</span>
          <div className="max-h-[92px] overflow-y-auto rounded-lg border border-slate-200 p-2">
            {responsables.length === 0 ? (
              <p className="text-xs text-slate-500">Sin responsables disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {responsables.map((user) => {
                  const active = responsibleFilters.includes(user.id_usuario);
                  return (
                    <button
                      key={user.id_usuario}
                      type="button"
                      onClick={() => onToggleResponsible(user.id_usuario)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        active
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {user.nombre_completo}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 p-1.5">
          {statusTabs.length === 0 && (
            <span className="px-2 py-1 text-xs text-slate-500">Sin estados disponibles</span>
          )}
          {statusTabs.map((estado) => {
            const active = statusFilters.includes(estado.id_estado);
            const rawColor = String(estado.color || '').trim();
            const isHex = /^#[0-9a-fA-F]{6}$/.test(rawColor);
            const borderTint = isHex ? `${rawColor}66` : rawColor;
            const bgTint = isHex ? `${rawColor}20` : '';
            return (
              <button
                key={estado.id_estado}
                type="button"
                onClick={() => onToggleStatus(estado.id_estado)}
                className="rounded-md border px-3 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                style={{
                  borderColor: active && borderTint ? borderTint : '#cbd5e1',
                  backgroundColor: active && bgTint ? bgTint : '#ffffff',
                  color: active && rawColor ? rawColor : '#475569',
                }}
              >
                {estado.nombre}
              </button>
            );
          })}
        </div>

        <label className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-700 lg:ml-3">
          <input
            type="checkbox"
            checked={showOnlyMine}
            onChange={(event) => onToggleShowOnlyMine(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Solo mis actividades
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {activeFilterChips.map((chip) => (
          <span key={chip.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {chip.label}
            <button
              type="button"
              onClick={() => onRemoveFilterChip(chip.type, chip.value)}
              className="rounded-full p-0.5 hover:bg-slate-200"
              aria-label={`Quitar ${chip.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={onClearAllFilters}
          disabled={!hasAnyFilters}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 sm:ml-auto"
        >
          Limpiar
        </button>
      </div>
    </section>
  );
}
