import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { getUserRoleName, type User as SessionUser } from '../../types/user';
import { ActivityFormModal } from './ActivityFormModal';
import ActivityForm from '../ActivityForm';
import { CalendarMonth } from './CalendarMonth';
import { DrawerDetalleActividad } from './DrawerDetalleActividad';
import { EventQuickPopover, type AnchorRect } from './EventQuickPopover';
import { FilterPanel, type ActiveFilterChip } from './FilterPanel';
import { Dialog, DialogContent } from '../ui/dialog';
import {
  calendarReducer,
  createInitialState,
  type DateRangeFilter,
  getCurrentUser,
  getVisibleActivities,
} from './state';
import { getActivityDateKey } from './date-utils';
import {
  getActivitySummary,
  listActivitiesByMonth,
  listActivityStatuses,
  listActivityTypes,
  listResponsibleUsers,
  saveActivity,
  type ActivitySummaryData,
} from '../../services/activities';
import type { Activity, User } from './types';

const DATE_RANGE_OPTIONS: Array<{ value: DateRangeFilter; label: string }> = [
  { value: 'ALL', label: 'Todo' },
  { value: 'TODAY', label: 'Hoy' },
  { value: 'WEEK', label: 'Esta semana' },
  { value: 'MONTH', label: 'Este mes' },
];

const ROLE_NAME_TO_ID: Record<string, number> = {
  admin: 1,
  principal: 2,
  trabajador: 3,
  voluntario: 4,
};

function mapAuthUser(user: SessionUser | null): User | null {
  if (!user) return null;
  const id = Number(user.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const roleName = getUserRoleName(user);
  const idRol = Number(user.id_rol || ROLE_NAME_TO_ID[roleName] || 0);

  return {
    id_usuario: id,
    nombre_completo: user.name || user.email || `Usuario ${id}`,
    correo: user.email || '',
    id_rol: idRol,
    id_estado: Number(user.id_estado || 0),
    id_area: user.areaId ? Number(user.areaId) : null,
    id_organizacion: user.organizationId ? Number(user.organizationId) : null,
  };
}

export function CalendarMvpApp() {
  const { user: authUser, accessToken } = useAuth();
  const authCalendarUser = useMemo(() => mapAuthUser(authUser || null), [authUser]);

  const [state, dispatch] = useReducer(calendarReducer, undefined, createInitialState);
  const [activityDetailOpen, setActivityDetailOpen] = useState(false);
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [eventPopoverAnchor, setEventPopoverAnchor] = useState<AnchorRect>(null);
  const [eventPopoverFallbackActivity, setEventPopoverFallbackActivity] = useState<Activity | null>(null);
  const [eventPopoverLoading, setEventPopoverLoading] = useState(false);
  const [eventPopoverError, setEventPopoverError] = useState<string | null>(null);
  const [eventPopoverSummary, setEventPopoverSummary] = useState<ActivitySummaryData | null>(null);
  const summaryRequestRef = useRef(0);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [debouncedSearchText, setDebouncedSearchText] = useState(state.searchText);

  const currentUser = useMemo(() => getCurrentUser(state) || authCalendarUser, [state, authCalendarUser]);
  const visibleActivities = getVisibleActivities({ ...state, searchText: debouncedSearchText }, currentUser);

  const editingActivity = useMemo(
    () => (state.formModal.activityId ? state.activities.find((activity) => activity.id_actividad === state.formModal.activityId) || null : null),
    [state.formModal.activityId, state.activities],
  );

  const statusNameById = useMemo(() => {
    const map = new Map<number, string>();
    state.estadosActividad.forEach((estado) => map.set(estado.id_estado, estado.nombre));
    return map;
  }, [state.estadosActividad]);

  const activeFilterChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    if (state.dateRange !== 'ALL') {
      const rangeLabel = DATE_RANGE_OPTIONS.find((item) => item.value === state.dateRange)?.label || state.dateRange;
      chips.push({ id: `range-${state.dateRange}`, label: `Rango: ${rangeLabel}`, type: 'range', value: state.dateRange });
    }
    state.statusFilters.forEach((statusId) => {
      chips.push({
        id: `status-${statusId}`,
        label: `Estado: ${statusNameById.get(statusId) || statusId}`,
        type: 'status',
        value: String(statusId),
      });
    });
    state.responsibleFilters.forEach((userId) => {
      const name = state.users.find((user) => user.id_usuario === userId)?.nombre_completo || userId;
      chips.push({ id: `responsable-${userId}`, label: `Responsable: ${name}`, type: 'responsable', value: String(userId) });
    });
    if (state.showOnlyMine) {
      chips.push({ id: 'mine-true', label: 'Solo mis actividades', type: 'mine', value: 'true' });
    }
    if (state.searchText.trim()) {
      chips.push({ id: `search-${state.searchText}`, label: `Buscar: ${state.searchText.trim()}`, type: 'search', value: state.searchText });
    }
    return chips;
  }, [state.dateRange, state.statusFilters, state.responsibleFilters, state.users, statusNameById, state.searchText, state.showOnlyMine]);
  
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchText(state.searchText), 250);
    return () => window.clearTimeout(timer);
  }, [state.searchText]);

  const loadCatalogs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [estadosActividad, tiposActividad, responsables] = await Promise.all([
        listActivityStatuses(accessToken),
        listActivityTypes(accessToken),
        listResponsibleUsers(accessToken),
      ]);

      const users = [...responsables];
      if (authCalendarUser && !users.some((item) => item.id_usuario === authCalendarUser.id_usuario)) {
        users.push(authCalendarUser);
      }

      dispatch({ type: 'setCatalogs', users, estadosActividad, tiposActividad });
    } catch {
      // Si falla catálogos remotos, se mantiene estado vacío y se mostrará fallback visual.
    }
  }, [accessToken, authCalendarUser]);

  const loadEventSummary = useCallback(
    async (activityId: number) => {
      if (!accessToken) return;
      const requestId = summaryRequestRef.current + 1;
      summaryRequestRef.current = requestId;

      try {
        setEventPopoverLoading(true);
        setEventPopoverError(null);
        setEventPopoverSummary(null);
        const data = await getActivitySummary(accessToken, activityId);
        if (summaryRequestRef.current !== requestId) return;
        if ((data.warnings || []).length > 0) {
          console.warn('Resumen de actividad con advertencias', { activityId, warnings: data.warnings });
        }
        setEventPopoverSummary(data);
      } catch (err) {
        if (summaryRequestRef.current !== requestId) return;
        console.error('Error cargando resumen de actividad', { activityId, err });
        const message = err instanceof Error ? err.message : 'No se pudo cargar el resumen de actividad';
        setEventPopoverError(`No se pudo cargar el resumen (${message}).`);
        setEventPopoverSummary(null);
      } finally {
        if (summaryRequestRef.current === requestId) setEventPopoverLoading(false);
      }
    },
    [accessToken],
  );

  const loadMonthActivities = useCallback(async () => {
    if (!accessToken) return;
    try {
      setMonthLoading(true);
      setMonthError(null);
      const activities = await listActivitiesByMonth({
        accessToken,
        year: state.currentMonth.getFullYear(),
        month: state.currentMonth.getMonth() + 1,
        filters: {
          estadoIds: state.statusFilters,
          responsableIds: state.responsibleFilters,
          searchText: debouncedSearchText,
        },
      });
      dispatch({ type: 'setActivities', activities });
    } catch (err) {
      dispatch({ type: 'setActivities', activities: [] });
      setMonthError(err instanceof Error ? err.message : 'No se pudieron cargar actividades del calendario');
    } finally {
      setMonthLoading(false);
    }
  }, [accessToken, state.currentMonth, state.statusFilters, state.responsibleFilters, debouncedSearchText]);

  useEffect(() => {
    if (!accessToken) return;
    void loadCatalogs();
  }, [accessToken, loadCatalogs]);

  useEffect(() => {
    if (!accessToken) return;
    void loadMonthActivities();
  }, [accessToken, loadMonthActivities]);

  useEffect(() => {
    if (!authCalendarUser) return;
    dispatch({ type: 'setCurrentUser', userId: authCalendarUser.id_usuario });
  }, [authCalendarUser]);

  const openSummaryPopover = (activity: Activity, anchorRect: DOMRect) => {
    dispatch({ type: 'selectDate', date: getActivityDateKey(activity) });
    dispatch({ type: 'selectActivity', activityId: activity.id_actividad });
    setActivityDetailOpen(false);
    setEventPopoverOpen(true);
    setEventPopoverFallbackActivity(activity);
    setEventPopoverAnchor({
      top: anchorRect.top,
      left: anchorRect.left,
      width: anchorRect.width,
      height: anchorRect.height,
    });
    void loadEventSummary(activity.id_actividad);
  };

  return (
    <div className="flex min-h-[70vh] flex-col gap-3">
      <FilterPanel
        dateRange={state.dateRange}
        dateRangeOptions={DATE_RANGE_OPTIONS}
        responsables={state.users}
        responsibleFilters={state.responsibleFilters}
        searchText={state.searchText}
        estadosActividad={state.estadosActividad}
        statusFilters={state.statusFilters}
        showOnlyMine={state.showOnlyMine}
        activeFilterChips={activeFilterChips}
        onSetDateRange={(range) => dispatch({ type: 'setDateRange', range })}
        onToggleResponsible={(userId) => dispatch({ type: 'toggleResponsibleFilter', userId })}
        onSetSearch={(value) => dispatch({ type: 'setSearch', value })}
        onToggleStatus={(statusId) => dispatch({ type: 'toggleStatusFilter', statusId })}
        onToggleShowOnlyMine={(value) => dispatch({ type: 'setShowOnlyMine', value })}
        onRemoveFilterChip={(type, value) =>
          dispatch({
            type: 'removeFilterChip',
            filterType: type,
            value,
          })
        }
        onClearAllFilters={() => dispatch({ type: 'clearAllFilters' })}
      />

      {monthError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-800">{monthError}</p>
          <button
            type="button"
            onClick={() => void loadMonthActivities()}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <CalendarMonth
          monthDate={state.currentMonth}
          activities={visibleActivities}
          estadosActividad={state.estadosActividad}
          selectedDate={state.selectedDate}
          selectedActivityId={state.selectedActivityId}
          onPrevMonth={() => {
            setEventPopoverOpen(false);
            setEventPopoverFallbackActivity(null);
            setActivityDetailOpen(false);
            dispatch({ type: 'prevMonth' });
          }}
          onNextMonth={() => {
            setEventPopoverOpen(false);
            setEventPopoverFallbackActivity(null);
            setActivityDetailOpen(false);
            dispatch({ type: 'nextMonth' });
          }}
          onDayClick={(date) => {
            dispatch({ type: 'selectDate', date });
            dispatch({ type: 'selectActivity', activityId: null });
            setActivityDetailOpen(false);
            setEventPopoverOpen(false);
            setEventPopoverFallbackActivity(null);
            dispatch({ type: 'openCreateForm', date });
          }}
          onChipClick={(activity, anchorRect) => openSummaryPopover(activity, anchorRect)}
        />

        {monthLoading && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/50 backdrop-blur-[1px]" />
        )}
      </div>

      <EventQuickPopover
        open={eventPopoverOpen}
        activityId={state.selectedActivityId}
        fallbackActivity={eventPopoverFallbackActivity}
        anchorRect={eventPopoverAnchor}
        loading={eventPopoverLoading}
        error={eventPopoverError}
        summary={eventPopoverSummary}
        onClose={() => setEventPopoverOpen(false)}
        onRetry={() => {
          if (!state.selectedActivityId) return;
          void loadEventSummary(state.selectedActivityId);
        }}
        onViewDetails={(activityId) => {
          dispatch({ type: 'selectActivity', activityId });
          setEventPopoverOpen(false);
          setActivityDetailOpen(true);
        }}
      />

      <DrawerDetalleActividad
        open={activityDetailOpen}
        selectedActivityId={state.selectedActivityId}
        accessToken={accessToken || ''}
        onClose={() => setActivityDetailOpen(false)}
        onStatusUpdated={(activityId, estadoId) => dispatch({ type: 'changeStatus', activityId, estadoId })}
      />

      {state.formModal.mode === 'edit' && (
        <ActivityFormModal
          open={state.formModal.isOpen && state.formModal.mode === 'edit'}
          mode={state.formModal.mode}
          date={state.formModal.date}
          initialActivity={editingActivity}
          accessToken={accessToken || ''}
          currentUser={currentUser}
          users={state.users}
          estadosActividad={state.estadosActividad}
          tiposActividad={state.tiposActividad}
          existingActivities={state.activities}
          onClose={() => dispatch({ type: 'closeForm' })}
          onSave={async (activity) => {
            if (!accessToken) throw new Error('No hay sesion activa');
            await saveActivity(accessToken, activity);
            dispatch({ type: 'closeForm' });
            await loadMonthActivities();
          }}
        />
      )}

      <Dialog
        open={state.formModal.isOpen && state.formModal.mode === 'create'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) dispatch({ type: 'closeForm' });
        }}
      >
        <DialogContent
          showClose={false}
          className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl p-0 shadow-2xl gap-0"
        >
          {state.formModal.isOpen && state.formModal.mode === 'create' && (
            <ActivityForm
              mode="create"
              initialDate={state.formModal.date || null}
              embedded
              onClose={() => dispatch({ type: 'closeForm' })}
              onSuccess={() => void loadMonthActivities()}
              accessToken={accessToken || ''}
              id_usuario={authUser?.id}
              rol={getUserRoleName(authUser || null) || undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
