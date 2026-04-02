const defaultState = {
  route: "home",
  authState: {
    user: null,
    session: null,
  },
  uiState: {
    modals: {},
    toasts: [],
  },
  dataState: {
    activities: [],
    filters: {},
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeState = (base, patch = {}) => ({
  ...base,
  ...patch,
  authState: {
    ...base.authState,
    ...(patch.authState || {}),
  },
  uiState: {
    ...base.uiState,
    ...(patch.uiState || {}),
    modals: {
      ...base.uiState.modals,
      ...((patch.uiState || {}).modals || {}),
    },
    toasts:
      (patch.uiState && Array.isArray(patch.uiState.toasts)
        ? patch.uiState.toasts
        : base.uiState.toasts) || [],
  },
  dataState: {
    ...base.dataState,
    ...(patch.dataState || {}),
    filters: {
      ...base.dataState.filters,
      ...((patch.dataState || {}).filters || {}),
    },
    pagination: {
      ...base.dataState.pagination,
      ...((patch.dataState || {}).pagination || {}),
    },
    activities:
      (patch.dataState && Array.isArray(patch.dataState.activities)
        ? patch.dataState.activities
        : base.dataState.activities) || [],
  },
});

export const createStore = (seedState = {}) => {
  let state = mergeState(clone(defaultState), seedState);
  const listeners = new Set();

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Listener isolation to prevent one subscriber from breaking others.
      }
    });
  };

  const getState = () => state;

  const setState = (updater) => {
    state =
      typeof updater === "function"
        ? mergeState(state, updater(state))
        : mergeState(state, updater);
    notify();
    return state;
  };

  const patchState = (patch) => setState(patch);

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const setRoute = (route) => patchState({ route });

  const setAuth = ({ user = null, session = null } = {}) =>
    patchState({ authState: { user, session } });

  const setModalOpen = (modalId, isOpen) =>
    patchState({
      uiState: {
        modals: {
          [modalId]: Boolean(isOpen),
        },
      },
    });

  const pushToast = (toast) =>
    patchState({
      uiState: {
        toasts: [...state.uiState.toasts, toast],
      },
    });

  const clearToasts = () =>
    patchState({
      uiState: {
        toasts: [],
      },
    });

  const setActivities = (activities = []) =>
    patchState({
      dataState: {
        activities,
      },
    });

  const setFilters = (filters = {}) =>
    patchState({
      dataState: {
        filters,
      },
    });

  const setPagination = (pagination = {}) =>
    patchState({
      dataState: {
        pagination,
      },
    });

  return {
    getState,
    setState,
    patchState,
    subscribe,
    setRoute,
    setAuth,
    setModalOpen,
    pushToast,
    clearToasts,
    setActivities,
    setFilters,
    setPagination,
  };
};
