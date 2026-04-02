import type { Activity, ActivityStatus, ActivityType, User } from './types';

export type DateRangeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export interface FormModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  date: string;
  activityId: number | null;
}

export interface CalendarState {
  users: User[];
  estadosActividad: ActivityStatus[];
  tiposActividad: ActivityType[];
  activities: Activity[];
  currentUserId: number;
  currentMonth: Date;
  selectedDate: string | null;
  selectedActivityId: number | null;
  dateRange: DateRangeFilter;
  statusFilters: number[];
  responsibleFilters: number[];
  searchText: string;
  showOnlyMine: boolean;
  formModal: FormModalState;
}

export type CalendarAction =
  | { type: 'setMonth'; date: Date }
  | { type: 'prevMonth' }
  | { type: 'nextMonth' }
  | { type: 'setDateRange'; range: DateRangeFilter }
  | { type: 'toggleStatusFilter'; statusId: number }
  | { type: 'toggleResponsibleFilter'; userId: number }
  | { type: 'removeFilterChip'; filterType: 'status' | 'responsable' | 'range' | 'search' | 'mine'; value: string }
  | { type: 'clearAllFilters' }
  | { type: 'setSearch'; value: string }
  | { type: 'setShowOnlyMine'; value: boolean }
  | { type: 'selectDate'; date: string | null }
  | { type: 'selectActivity'; activityId: number | null }
  | { type: 'openCreateForm'; date: string }
  | { type: 'openEditForm'; activityId: number }
  | { type: 'closeForm' }
  | { type: 'saveActivity'; activity: Activity }
  | { type: 'changeStatus'; activityId: number; estadoId: number }
  | { type: 'setActivities'; activities: Activity[] }
  | { type: 'setCatalogs'; users: User[]; estadosActividad: ActivityStatus[]; tiposActividad: ActivityType[] }
  | { type: 'setCurrentUser'; userId: number };

function toggleInArray<T extends string | number>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const normalize = (value: string) => value.trim().toLowerCase();

export function createInitialState(): CalendarState {
  const now = new Date();
  return {
    users: [],
    estadosActividad: [],
    tiposActividad: [],
    activities: [],
    currentUserId: 0,
    currentMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    selectedDate: null,
    selectedActivityId: null,
    dateRange: 'ALL',
    statusFilters: [],
    responsibleFilters: [],
    searchText: '',
    showOnlyMine: false,
    formModal: {
      isOpen: false,
      mode: 'create',
      date: '',
      activityId: null,
    },
  };
}

export function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'setMonth':
      return { ...state, currentMonth: action.date };
    case 'prevMonth':
      return {
        ...state,
        currentMonth: new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1),
      };
    case 'nextMonth':
      return {
        ...state,
        currentMonth: new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1),
      };
    case 'setDateRange':
      return { ...state, dateRange: action.range };
    case 'toggleStatusFilter':
      return { ...state, statusFilters: toggleInArray(state.statusFilters, action.statusId) };
    case 'toggleResponsibleFilter':
      return { ...state, responsibleFilters: toggleInArray(state.responsibleFilters, action.userId) };
    case 'removeFilterChip': {
      if (action.filterType === 'status') {
        const statusId = Number(action.value);
        return { ...state, statusFilters: state.statusFilters.filter((id) => id !== statusId) };
      }
      if (action.filterType === 'responsable') {
        const userId = Number(action.value);
        return { ...state, responsibleFilters: state.responsibleFilters.filter((id) => id !== userId) };
      }
      if (action.filterType === 'search') {
        return { ...state, searchText: '' };
      }
      if (action.filterType === 'mine') {
        return { ...state, showOnlyMine: false };
      }
      return { ...state, dateRange: 'ALL' };
    }
    case 'clearAllFilters':
      return {
        ...state,
        dateRange: 'ALL',
        statusFilters: [],
        responsibleFilters: [],
        searchText: '',
        showOnlyMine: false,
      };
    case 'setSearch':
      return { ...state, searchText: action.value };
    case 'setShowOnlyMine':
      return { ...state, showOnlyMine: action.value };
    case 'selectDate':
      return {
        ...state,
        selectedDate: action.date,
        selectedActivityId: action.date ? state.selectedActivityId : null,
      };
    case 'selectActivity':
      return { ...state, selectedActivityId: action.activityId };
    case 'openCreateForm':
      return {
        ...state,
        formModal: {
          isOpen: true,
          mode: 'create',
          date: action.date,
          activityId: null,
        },
      };
    case 'openEditForm': {
      const activity = state.activities.find((item) => item.id_actividad === action.activityId);
      const date = activity ? activity.fecha_inicio.slice(0, 10) : state.formModal.date;
      return {
        ...state,
        formModal: {
          isOpen: true,
          mode: 'edit',
          date,
          activityId: action.activityId,
        },
      };
    }
    case 'closeForm':
      return {
        ...state,
        formModal: { ...state.formModal, isOpen: false, activityId: null },
      };
    case 'saveActivity': {
      const exists = state.activities.some((item) => item.id_actividad === action.activity.id_actividad);
      const activities = exists
        ? state.activities.map((item) => (item.id_actividad === action.activity.id_actividad ? action.activity : item))
        : [...state.activities, action.activity];
      return {
        ...state,
        activities,
        selectedDate: action.activity.fecha_inicio.slice(0, 10),
        selectedActivityId: action.activity.id_actividad,
        formModal: { ...state.formModal, isOpen: false, activityId: null },
      };
    }
    case 'changeStatus':
      return {
        ...state,
        activities: state.activities.map((item) =>
          item.id_actividad === action.activityId ? { ...item, id_estado: action.estadoId } : item,
        ),
      };
    case 'setActivities':
      return {
        ...state,
        activities: action.activities,
      };
    case 'setCatalogs':
      return {
        ...state,
        users: action.users,
        estadosActividad: action.estadosActividad,
        tiposActividad: action.tiposActividad,
      };
    case 'setCurrentUser':
      return {
        ...state,
        currentUserId: action.userId,
      };
    default:
      return state;
  }
}

export function getCurrentUser(state: CalendarState): User | null {
  return state.users.find((user) => user.id_usuario === state.currentUserId) || null;
}

export function canChangeStatus(user: User | null): boolean {
  if (!user) return false;
  return user.id_rol === 1 || user.id_rol === 2;
}

export function canEditActivity(
  user: User | null,
  activity: Activity,
  estadosActividad: ActivityStatus[],
): boolean {
  if (!user) return false;
  if (user.id_rol === 1 || user.id_rol === 2) return true;
  if (activity.id_creador !== user.id_usuario) return false;
  const estado = estadosActividad.find((item) => item.id_estado === activity.id_estado);
  return normalize(estado?.nombre || '') === 'planificada';
}

export function getAllowedEstadoIdsForRole(
  user: User | null,
  estadosActividad: ActivityStatus[],
): number[] {
  if (!user) return [];
  if (user.id_rol === 1 || user.id_rol === 2) {
    return estadosActividad.map((estado) => estado.id_estado);
  }

  const planificada = estadosActividad.find((estado) => normalize(estado.nombre) === 'planificada');
  return planificada ? [planificada.id_estado] : [];
}

export function getVisibleActivities(state: CalendarState, user: User | null): Activity[] {
  const now = new Date();
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const inDateRange = (value: string): boolean => {
    const activityDate = new Date(value);
    if (Number.isNaN(activityDate.getTime())) return false;
    const activityStart = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

    if (state.dateRange === 'ALL') return true;
    if (state.dateRange === 'TODAY') return activityStart.getTime() === nowStart.getTime();
    if (state.dateRange === 'MONTH') {
      return activityStart.getMonth() === nowStart.getMonth() && activityStart.getFullYear() === nowStart.getFullYear();
    }

    const mondayOffset = (nowStart.getDay() + 6) % 7;
    const weekStart = new Date(nowStart);
    weekStart.setDate(nowStart.getDate() - mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return activityStart.getTime() >= weekStart.getTime() && activityStart.getTime() <= weekEnd.getTime();
  };

  return state.activities.filter((activity) => {
    if (!inDateRange(activity.fecha_inicio)) return false;
    if (state.statusFilters.length > 0 && !state.statusFilters.includes(activity.id_estado)) return false;
    if (state.responsibleFilters.length > 0 && !state.responsibleFilters.includes(activity.id_responsable)) return false;
    if (state.showOnlyMine && user && activity.id_responsable !== user.id_usuario && activity.id_creador !== user.id_usuario) return false;
    if (state.searchText.trim()) {
      const q = normalize(state.searchText);
      const bag = normalize(`${activity.codigo} ${activity.titulo} ${activity.descripcion || ''}`);
      if (!bag.includes(q)) return false;
    }
    return true;
  });
}
