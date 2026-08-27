import { useMemo } from "react";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  buildDashboardAlerts,
  fetchActivityLocationOptions,
  fetchActivityTaskOptions,
  fetchDashboardMetrics,
  fetchDashboardRecentActivities,
  fetchDashboardRecentAdmissionRequests,
  fetchDashboardRecentHours,
  fetchDashboardUserContext,
  fetchWeeklyImpact,
  fetchTodayTimeline,
  toFriendlyError,
} from "./homeService";
import type {
  DashboardFilters,
  DashboardMetricValues,
  DashboardUserContext,
  DashboardAlertItem,
} from "./types";

type MetricErrorMap = Record<keyof DashboardMetricValues, string | null>;

const DEFAULT_METRICS: DashboardMetricValues = {
  volunteersActive: 0,
  projectsActive: 0,
  activitiesActive: 0,
  hoursRegistered: 0,
  hoursApproved: 0,
  evidencesUploaded: 0,
  admissionPending: 0,
  approvalsPending: 0,
};

const DEFAULT_METRIC_ERRORS: MetricErrorMap = {
  volunteersActive: null,
  projectsActive: null,
  activitiesActive: null,
  hoursRegistered: null,
  hoursApproved: null,
  evidencesUploaded: null,
  admissionPending: null,
  approvalsPending: null,
};

const DEFAULT_USER_CONTEXT: DashboardUserContext = {
  userId: null,
  userName: "Invitado",
  roleNames: [],
  isTenantAdmin: false,
  canManageActivities: false,
  canResolveHours: false,
  canResolveAdmissions: false,
};

function toAsyncBlock(queryResult: any, defaultErrorMsg: string) {
  return {
    data: queryResult.data ?? [],
    loading: queryResult.isLoading,
    error: queryResult.isError ? (queryResult.error?.message || defaultErrorMsg) : null,
  };
}

export function useDashboardData(filters?: DashboardFilters) {
  const queryClient = useQueryClient();
  
  // 1. Catalogs
  const { data: taskOptions = [], error: taskError } = useQuery({
    queryKey: ['dashboard', 'catalogs', 'tasks'],
    queryFn: async () => {
      try {
        return await fetchActivityTaskOptions();
      } catch (err) {
        throw new Error(toFriendlyError(err, "No se pudo cargar el catalogo de tareas para crear/editar actividades."));
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: locationOptions = [], error: locationError } = useQuery({
    queryKey: ['dashboard', 'catalogs', 'locations'],
    queryFn: async () => {
      try {
        return await fetchActivityLocationOptions();
      } catch (err) {
        throw new Error(toFriendlyError(err, "No se pudo cargar el catalogo de ubicaciones para actividades."));
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const catalogError = taskError?.message || locationError?.message || null;

  // 2. Core Metrics
  const { data: metricsData, isLoading: metricsLoading, isFetching: metricsFetching } = useQuery({
    queryKey: ['dashboard', 'metrics', filters],
    queryFn: () => fetchDashboardMetrics(filters),
  });

  const metrics = useMemo(() => {
    if (!metricsData) return DEFAULT_METRICS;
    return {
      volunteersActive: metricsData.volunteersActive.value,
      projectsActive: metricsData.projectsActive.value,
      activitiesActive: metricsData.activitiesActive.value,
      hoursRegistered: metricsData.hoursRegistered.value,
      hoursApproved: metricsData.hoursApproved.value,
      evidencesUploaded: metricsData.evidencesUploaded.value,
      admissionPending: metricsData.admissionPending.value,
      approvalsPending: metricsData.approvalsPending.value,
    };
  }, [metricsData]);

  const metricErrors = useMemo(() => {
    if (!metricsData) return DEFAULT_METRIC_ERRORS;
    return {
      volunteersActive: metricsData.volunteersActive.error,
      projectsActive: metricsData.projectsActive.error,
      activitiesActive: metricsData.activitiesActive.error,
      hoursRegistered: metricsData.hoursRegistered.error,
      hoursApproved: metricsData.hoursApproved.error,
      evidencesUploaded: metricsData.evidencesUploaded.error,
      admissionPending: metricsData.admissionPending.error,
      approvalsPending: metricsData.approvalsPending.error,
    };
  }, [metricsData]);

  // 3. User Context
  const { data: userContext = DEFAULT_USER_CONTEXT } = useQuery({
    queryKey: ['dashboard', 'userContext'],
    queryFn: async () => {
      try {
        return await fetchDashboardUserContext();
      } catch {
        return DEFAULT_USER_CONTEXT;
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  // 4. Data Blocks
  const recentHoursQuery = useQuery({
    queryKey: ['dashboard', 'recentHours', filters],
    queryFn: () => fetchDashboardRecentHours(5),
  });
  
  const recentActivitiesQuery = useQuery({
    queryKey: ['dashboard', 'recentActivities', filters],
    queryFn: () => fetchDashboardRecentActivities(5),
  });
  
  const recentRequestsQuery = useQuery({
    queryKey: ['dashboard', 'recentRequests', filters],
    queryFn: () => fetchDashboardRecentAdmissionRequests(5),
  });
  
  const weeklyImpactQuery = useQuery({
    queryKey: ['dashboard', 'weeklyImpact', filters],
    queryFn: () => fetchWeeklyImpact(filters),
  });
  
  const todayTimelineQuery = useQuery({
    queryKey: ['dashboard', 'todayTimeline', filters],
    queryFn: () => fetchTodayTimeline(6, filters),
  });

  const alerts = useMemo<DashboardAlertItem[]>(
    () => buildDashboardAlerts(metrics),
    [metrics]
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const isRefreshing = metricsFetching || 
    recentHoursQuery.isFetching || 
    recentActivitiesQuery.isFetching || 
    recentRequestsQuery.isFetching || 
    weeklyImpactQuery.isFetching || 
    todayTimelineQuery.isFetching;

  return {
    metrics,
    metricErrors,
    metricsLoading,
    recentHours: toAsyncBlock(recentHoursQuery, "No se pudo cargar la tabla de horas recientes."),
    recentActivities: toAsyncBlock(recentActivitiesQuery, "No se pudo cargar la tabla de actividades recientes."),
    recentRequests: toAsyncBlock(recentRequestsQuery, "No se pudo cargar la tabla de solicitudes recientes."),
    weeklyImpact: toAsyncBlock(weeklyImpactQuery, "No se pudo cargar la grafica de impacto semanal."),
    todayTimeline: toAsyncBlock(todayTimelineQuery, "No se pudo cargar la agenda de hoy."),
    alerts,
    userContext,
    taskOptions,
    locationOptions,
    catalogError,
    isRefreshing,
    refresh,
  };
}
