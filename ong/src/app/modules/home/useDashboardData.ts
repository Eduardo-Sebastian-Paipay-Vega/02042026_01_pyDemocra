import { useCallback, useEffect, useMemo, useState } from "react";
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
  fetchMonthlyHours,
  fetchImpactKpis,
  fetchTodayTimeline,
  toFriendlyError,
} from "./homeService";
import type {
  DashboardActivityRow,
  DashboardAdmissionRow,
  DashboardAlertItem,
  DashboardHoursRow,
  DashboardLocationOption,
  DashboardMetricValues,
  DashboardTaskOption,
  DashboardUserContext,
  DashboardTimelineItem,
  ImpactKpis,
  MonthlyHoursPoint,
  WeeklyImpactPoint,
} from "./types";

interface AsyncBlockState<TData> {
  data: TData;
  loading: boolean;
  error: string | null;
}

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

const DEFAULT_IMPACT_KPIS: ImpactKpis = { beneficiaries: 0, totalApprovedHours: 0, completedProjects: 0 };

const DEFAULT_USER_CONTEXT: DashboardUserContext = {
  userId: null,
  userName: "Invitado",
  roleNames: [],
  isTenantAdmin: false,
  canManageActivities: false,
  canResolveHours: false,
  canResolveAdmissions: false,
};

function toLoadingBlock<TData>(data: TData): AsyncBlockState<TData> {
  return { data, loading: true, error: null };
}

function toReadyBlock<TData>(data: TData): AsyncBlockState<TData> {
  return { data, loading: false, error: null };
}

function toErrorBlock<TData>(data: TData, error: string): AsyncBlockState<TData> {
  return { data, loading: false, error };
}

export function useDashboardData(periodFilter: string = "month", projectFilter: string = "all") {
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const [metrics, setMetrics] = useState<DashboardMetricValues>(DEFAULT_METRICS);
  const [metricErrors, setMetricErrors] = useState<MetricErrorMap>(DEFAULT_METRIC_ERRORS);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [recentHours, setRecentHours] = useState<AsyncBlockState<DashboardHoursRow[]>>(
    toLoadingBlock([])
  );
  const [recentActivities, setRecentActivities] = useState<
    AsyncBlockState<DashboardActivityRow[]>
  >(toLoadingBlock([]));
  const [recentRequests, setRecentRequests] = useState<
    AsyncBlockState<DashboardAdmissionRow[]>
  >(toLoadingBlock([]));
  const [weeklyImpact, setWeeklyImpact] = useState<AsyncBlockState<WeeklyImpactPoint[]>>(
    toLoadingBlock([])
  );
  const [monthlyHours, setMonthlyHours] = useState<AsyncBlockState<MonthlyHoursPoint[]>>(
    toLoadingBlock([])
  );
  const [impactKpis, setImpactKpis] = useState<AsyncBlockState<ImpactKpis>>(
    toLoadingBlock(DEFAULT_IMPACT_KPIS)
  );
  const [todayTimeline, setTodayTimeline] = useState<
    AsyncBlockState<DashboardTimelineItem[]>
  >(toLoadingBlock([]));

  const [isRefreshing, setIsRefreshing] = useState(true);
  const [userContext, setUserContext] =
    useState<DashboardUserContext>(DEFAULT_USER_CONTEXT);
  const [taskOptions, setTaskOptions] = useState<DashboardTaskOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<DashboardLocationOption[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);



  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsRefreshing(true);
      setMetricsLoading(true);
      setRecentHours((current) => toLoadingBlock(current.data));
      setRecentActivities((current) => toLoadingBlock(current.data));
      setRecentRequests((current) => toLoadingBlock(current.data));
      setWeeklyImpact((current) => toLoadingBlock(current.data));
      setMonthlyHours((current) => toLoadingBlock(current.data));
      setImpactKpis((current) => toLoadingBlock(current.data));
      setTodayTimeline((current) => toLoadingBlock(current.data));
      setCatalogError(null);
      try {
        const [taskOptionsResult, locationOptionsResult] = await Promise.all([
          fetchActivityTaskOptions()
            .then((items) => ({
              data: items,
              error: null as string | null,
            }))
            .catch((err) => ({ data: [], error: err.message })),
          fetchActivityLocationOptions()
            .then((items) => ({
              data: items,
              error: null as string | null,
            }))
            .catch((err) => ({ data: [], error: err.message })),
        ]);

        const [metricsResult, userContextResult] = await Promise.all([
          fetchDashboardMetrics(periodFilter, projectFilter),
          fetchDashboardUserContext().catch(() => DEFAULT_USER_CONTEXT),
        ]);

        if (!isActive) {
          return;
        }

        setMetrics({
          volunteersActive: metricsResult.volunteersActive.value,
          projectsActive: metricsResult.projectsActive.value,
          activitiesActive: metricsResult.activitiesActive.value,
          hoursRegistered: metricsResult.hoursRegistered.value,
          hoursApproved: metricsResult.hoursApproved.value,
          evidencesUploaded: metricsResult.evidencesUploaded.value,
          admissionPending: metricsResult.admissionPending.value,
          approvalsPending: metricsResult.approvalsPending.value,
        });

        setMetricErrors({
          volunteersActive: metricsResult.volunteersActive.error,
          projectsActive: metricsResult.projectsActive.error,
          activitiesActive: metricsResult.activitiesActive.error,
          hoursRegistered: metricsResult.hoursRegistered.error,
          hoursApproved: metricsResult.hoursApproved.error,
          evidencesUploaded: metricsResult.evidencesUploaded.error,
          admissionPending: metricsResult.admissionPending.error,
          approvalsPending: metricsResult.approvalsPending.error,
        });

        setMetricsLoading(false);
        setUserContext(userContextResult);
        setTaskOptions(taskOptionsResult.data);
        setLocationOptions(locationOptionsResult.data);

        if (taskOptionsResult.error || locationOptionsResult.error) {
          setCatalogError(taskOptionsResult.error ?? locationOptionsResult.error);
        }

        const [
          recentHoursResult,
          recentActivitiesResult,
          recentRequestsResult,
          weeklyImpactResult,
          monthlyHoursResult,
          impactKpisResult,
          timelineResult,
        ] = await Promise.allSettled([
          fetchDashboardRecentHours(5),
          fetchDashboardRecentActivities(5),
          fetchDashboardRecentAdmissionRequests(5),
          fetchWeeklyImpact(),
          fetchMonthlyHours(),
          fetchImpactKpis(),
          fetchTodayTimeline(6),
        ]);

        if (!isActive) {
          return;
        }

        if (recentHoursResult.status === "fulfilled") {
          setRecentHours(toReadyBlock(recentHoursResult.value));
        } else {
          setRecentHours(
            toErrorBlock([], "No se pudo cargar la tabla de horas recientes.")
          );
        }

        if (recentActivitiesResult.status === "fulfilled") {
          setRecentActivities(toReadyBlock(recentActivitiesResult.value));
        } else {
          setRecentActivities(
            toErrorBlock([], "No se pudo cargar la tabla de actividades recientes.")
          );
        }

        if (recentRequestsResult.status === "fulfilled") {
          setRecentRequests(toReadyBlock(recentRequestsResult.value));
        } else {
          setRecentRequests(
            toErrorBlock([], "No se pudo cargar la tabla de solicitudes recientes.")
          );
        }

        if (weeklyImpactResult.status === "fulfilled") {
          setWeeklyImpact(toReadyBlock(weeklyImpactResult.value));
        } else {
          setWeeklyImpact(
            toErrorBlock([], "No se pudo cargar la grafica de impacto semanal.")
          );
        }

        if (monthlyHoursResult.status === "fulfilled") {
          setMonthlyHours(toReadyBlock(monthlyHoursResult.value));
        } else {
          setMonthlyHours(toErrorBlock([], "No se pudo cargar el historico mensual de horas."));
        }

        if (impactKpisResult.status === "fulfilled") {
          setImpactKpis(toReadyBlock(impactKpisResult.value));
        } else {
          setImpactKpis(toErrorBlock(DEFAULT_IMPACT_KPIS, "No se pudo cargar los KPIs de impacto."));
        }

        if (timelineResult.status === "fulfilled") {
          setTodayTimeline(toReadyBlock(timelineResult.value));
        } else {
          setTodayTimeline(toErrorBlock([], "No se pudo cargar la agenda de hoy."));
        }
      } catch {
        if (!isActive) {
          return;
        }

        setMetrics(DEFAULT_METRICS);
        setMetricErrors({
          volunteersActive: "No se pudieron cargar las metricas.",
          projectsActive: "No se pudieron cargar las metricas.",
          activitiesActive: "No se pudieron cargar las metricas.",
          hoursRegistered: "No se pudieron cargar las metricas.",
          hoursApproved: "No se pudieron cargar las metricas.",
          evidencesUploaded: "No se pudieron cargar las metricas.",
          admissionPending: "No se pudieron cargar las metricas.",
          approvalsPending: "No se pudieron cargar las metricas.",
        });
        setMetricsLoading(false);
        setUserContext(DEFAULT_USER_CONTEXT);
        setTaskOptions([]);
        setLocationOptions([]);
        setCatalogError(
          "No se pudieron cargar los catalogos operativos del dashboard."
        );
      } finally {
        if (isActive) {
          setIsRefreshing(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [reloadToken, periodFilter, projectFilter]);

  const alerts = useMemo<DashboardAlertItem[]>(
    () => buildDashboardAlerts(metrics),
    [metrics]
  );

  return {
    metrics,
    metricErrors,
    metricsLoading,
    recentHours,
    recentActivities,
    recentRequests,
    weeklyImpact,
    monthlyHours,
    impactKpis,
    todayTimeline,
    alerts,
    userContext,
    taskOptions,
    locationOptions,
    catalogError,
    isRefreshing,
    refresh,
  };
}
