import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { KpiCard } from "../components/shared/KpiCard";
import { DataTable, type Column, type RowAction } from "../components/shared/DataTable";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";
import { GhostButton } from "../components/ui/ghost-button";
import { StatusDot } from "../components/ui/status-dot";
import { MiniLineChart } from "../components/ui/mini-line-chart";
import { Timeline } from "../components/ui/timeline";
import { ModalShell } from "../components/ui/modal-shell";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  Clock,
  FileWarning,
  FolderKanban,
  HandHeart,
  Plus,
  Target,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  fetchDashboardActivityDetail,
  fetchDashboardAdmissionDetail,
  fetchDashboardHourDetail,
  formatMetricValue,
  toFriendlyError,
} from "../modules/home/homeService";
import { useDashboardData } from "../modules/home/useDashboardData";
import { useDashboardMutations } from "../modules/home/useDashboardMutations";
import {
  parseNullablePositiveNumber,
  validateDashboardActivityForm,
  validateResolutionComment,
} from "../modules/home/validators";
import type {
  DashboardActivityDetail,
  DashboardActivityFormErrors,
  DashboardActivityFormInput,
  DashboardActivityRow,
  DashboardAdmissionDetail,
  DashboardAdmissionRow,
  DashboardHoursDetail,
  DashboardHoursRow,
  DashboardMetricValues,
} from "../modules/home/types";

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const statusLabels: Record<DashboardHoursRow["status"], string> = {
  pending: "pendiente",
  approved: "aprobado",
  rejected: "rechazado",
};

const hoursColumns: Column<DashboardHoursRow>[] = [
  {
    key: "volunteerName",
    label: "Voluntario",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.volunteerName}</span>,
  },
  {
    key: "activityName",
    label: "Actividad",
    render: (item) => (
      <span style={{ color: "var(--t-text-tertiary)" }}>{item.activityName}</span>
    ),
  },
  {
    key: "hours",
    label: "Horas",
    render: (item) => (
      <span className="tabular-nums" style={{ color: "var(--t-text-secondary)" }}>
        {item.hours.toLocaleString("es-PE", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })}
        h
      </span>
    ),
  },
  {
    key: "date",
    label: "Fecha",
    render: (item) => (
      <span className="tabular-nums" style={{ color: "var(--t-text-dim)" }}>
        {formatDate(item.date)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => {
      const variantByStatus: Record<
        DashboardHoursRow["status"],
        "warning" | "success" | "destructive"
      > = {
        pending: "warning",
        approved: "success",
        rejected: "destructive",
      };
      return (
        <StatusDot variant={variantByStatus[item.status]}>
          {statusLabels[item.status]}
        </StatusDot>
      );
    },
  },
];

const activityColumns: Column<DashboardActivityRow>[] = [
  {
    key: "name",
    label: "Actividad",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.name}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.projectName}
          {item.locationName ? ` - ${item.locationName}` : ""}
        </div>
      </div>
    ),
  },
  {
    key: "date",
    label: "Fecha",
    render: (item) => (
      <span className="tabular-nums" style={{ color: "var(--t-text-tertiary)" }}>
        {formatScheduleLabel(item.startAt, item.endAt)}
      </span>
    ),
  },
  {
    key: "assignedVolunteers",
    label: "Vol.",
    render: (item) => (
      <span className="tabular-nums" style={{ color: "var(--t-text-secondary)" }}>
        {item.assignedVolunteers}
      </span>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => {
      const variantByStatus: Record<
        DashboardActivityRow["status"],
        "secondary" | "warning" | "success" | "destructive"
      > = {
        scheduled: "secondary",
        "in-progress": "warning",
        completed: "success",
        cancelled: "destructive",
      };
      return (
        <StatusDot variant={variantByStatus[item.status]}>
          {item.statusLabel}
        </StatusDot>
      );
    },
  },
];

const requestColumns: Column<DashboardAdmissionRow>[] = [
  {
    key: "name",
    label: "Solicitante",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.name}</span>,
  },
  {
    key: "email",
    label: "Correo",
    render: (item) => <span style={{ color: "var(--t-text-tertiary)" }}>{item.email}</span>,
  },
  {
    key: "submittedAt",
    label: "Enviado",
    render: (item) => (
      <span className="tabular-nums" style={{ color: "var(--t-text-dim)" }}>
        {formatDate(item.submittedAt)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => {
      const variantByStatus: Record<
        DashboardAdmissionRow["status"],
        "warning" | "info" | "success" | "destructive"
      > = {
        pending: "warning",
        interviewing: "info",
        approved: "success",
        rejected: "destructive",
      };
      const labelByStatus: Record<DashboardAdmissionRow["status"], string> = {
        pending: "pendiente",
        interviewing: "en entrevista",
        approved: "aprobado",
        rejected: "rechazado",
      };

      return (
        <StatusDot variant={variantByStatus[item.status]}>
          {labelByStatus[item.status]}
        </StatusDot>
      );
    },
  },
];

type TabKey = "hours" | "activities" | "requests";

const tabs: { key: TabKey; label: string }[] = [
  { key: "hours", label: "Horas" },
  { key: "activities", label: "Actividades" },
  { key: "requests", label: "Solicitudes" },
];

const metricCards: Array<{
  key: keyof DashboardMetricValues;
  title: string;
  icon: typeof Users;
}> = [
  { key: "volunteersActive", title: "Voluntarios activos", icon: Users },
  { key: "projectsActive", title: "Proyectos activos", icon: FolderKanban },
  { key: "activitiesActive", title: "Actividades activas", icon: Calendar },
  { key: "hoursRegistered", title: "Horas registradas", icon: Clock },
  { key: "hoursApproved", title: "Horas aprobadas", icon: CheckSquare },
  { key: "evidencesUploaded", title: "Evidencias subidas", icon: Upload },
  { key: "admissionPending", title: "Solicitudes pendientes", icon: UserPlus },
  { key: "approvalsPending", title: "Horas pendientes de aprobacion", icon: FileWarning },
];

interface ActivityFormDraft {
  projectId: string;
  title: string;
  description: string;
  statusCode: string;
  startAt: string;
  endAt: string;
  locationId: string;
  estimatedHoursText: string;
}

interface ActivityFormState {
  open: boolean;
  mode: "create" | "edit";
  activityId: string | null;
}

type ResolutionTarget =
  | {
      kind: "hour";
      targetStatus: "approved" | "rejected";
      row: DashboardHoursRow;
    }
  | {
      kind: "admission";
      targetStatus: "approved" | "rejected";
      row: DashboardAdmissionRow;
    };

function createEmptyActivityDraft(defaultProjectId = ""): ActivityFormDraft {
  return {
    projectId: defaultProjectId,
    title: "",
    description: "",
    statusCode: "pendiente",
    startAt: "",
    endAt: "",
    locationId: "",
    estimatedHoursText: "",
  };
}

const activityStateOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "planificada", label: "Planificada" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-PE");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hoursToText(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}h`;
}

function formatScheduleLabel(startAt: string | null | undefined, endAt: string | null | undefined): string {
  if (!startAt && !endAt) {
    return "-";
  }
  if (startAt && endAt) {
    return startAt === endAt ? formatDate(startAt) : `${formatDate(startAt)} - ${formatDate(endAt)}`;
  }
  return formatDate(startAt ?? endAt);
}

function BlockError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-[12px]"
      style={{
        background: "var(--t-input-bg)",
        border: "1px solid var(--t-border)",
        color: "var(--t-text-tertiary)",
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
        style={{ color: "var(--t-text-secondary)" }}
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>
      {message}
    </p>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
        {label}
      </p>
      <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {value || "-"}
      </p>
    </div>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div
      className="flex items-start justify-between px-4 py-3"
      style={{ borderBottom: "1px solid var(--t-border)" }}
    >
      <div>
        <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
          {title}
        </h3>
        <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        aria-label="Cerrar modal"
        className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
        style={{ color: "var(--t-text-secondary)" }}
        onClick={onClose}
      >
        X
      </button>
    </div>
  );
}

function toResolutionTitle(target: ResolutionTarget | null): string {
  if (!target) {
    return "Resolver";
  }

  const actionText = target.targetStatus === "approved" ? "Aprobar" : "Rechazar";
  return target.kind === "hour" ? `${actionText} horas` : `${actionText} solicitud`;
}

function resolveAlertTargetPath(alertId: string): string | null {
  if (alertId === "alerts-hours-pending") {
    return "/app/ong/approvals/hours";
  }
  if (alertId === "alerts-admission-pending") {
    return "/app/ong/admission/requests";
  }
  if (alertId === "alerts-hours-approved") {
    return "/app/ong/operation/hours";
  }
  return null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("hours");

  const {
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
    refresh,
    isRefreshing,
  } = useDashboardData();

  const {
    isSavingActivity,
    isResolvingHours,
    isResolvingAdmission,
    isCancellingActivity,
    createActivity,
    updateActivity,
    cancelActivity,
    resolveHour,
    resolveAdmission,
  } = useDashboardMutations(refresh);

  const [activityFormState, setActivityFormState] = useState<ActivityFormState>({
    open: false,
    mode: "create",
    activityId: null,
  });
  const [activityFormDraft, setActivityFormDraft] = useState<ActivityFormDraft>(() =>
    createEmptyActivityDraft()
  );
  const [activityFormErrors, setActivityFormErrors] = useState<DashboardActivityFormErrors>({});
  const [activityFormSubmitError, setActivityFormSubmitError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<DashboardActivityRow | null>(null);

  const [activityDetailTargetId, setActivityDetailTargetId] = useState<string | null>(null);
  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);
  const [activityDetail, setActivityDetail] = useState<DashboardActivityDetail | null>(null);
  const [activityDetailLoading, setActivityDetailLoading] = useState(false);
  const [activityDetailError, setActivityDetailError] = useState<string | null>(null);

  const [hourDetailTargetId, setHourDetailTargetId] = useState<string | null>(null);
  const [isHourDetailOpen, setIsHourDetailOpen] = useState(false);
  const [hourDetail, setHourDetail] = useState<DashboardHoursDetail | null>(null);
  const [hourDetailLoading, setHourDetailLoading] = useState(false);
  const [hourDetailError, setHourDetailError] = useState<string | null>(null);

  const [admissionDetailTargetId, setAdmissionDetailTargetId] = useState<string | null>(null);
  const [isAdmissionDetailOpen, setIsAdmissionDetailOpen] = useState(false);
  const [admissionDetail, setAdmissionDetail] = useState<DashboardAdmissionDetail | null>(null);
  const [admissionDetailLoading, setAdmissionDetailLoading] = useState(false);
  const [admissionDetailError, setAdmissionDetailError] = useState<string | null>(null);

  const [resolutionTarget, setResolutionTarget] = useState<ResolutionTarget | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const canManageActivities = userContext.canManageActivities;
  const canResolveHours = userContext.canResolveHours;
  const canResolveAdmissions = userContext.canResolveAdmissions;

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const totalWeeklyHours = useMemo(
    () =>
      weeklyImpact.data.reduce((sum, point) => {
        return sum + point.value;
      }, 0),
    [weeklyImpact.data]
  );

  const selectedTaskOption = useMemo(() => {
    return taskOptions.find((task) => task.value === activityFormDraft.projectId) ?? null;
  }, [activityFormDraft.projectId, taskOptions]);

  const tabError =
    activeTab === "hours"
      ? recentHours.error
      : activeTab === "activities"
      ? recentActivities.error
      : recentRequests.error;

  const isResolutionSubmitting = isResolvingHours || isResolvingAdmission;

  const openActivityCreateModal = useCallback(() => {
    if (!canManageActivities) {
      toast.error("No tienes permisos para crear actividades.");
      return;
    }

    const defaultProjectId = taskOptions[0]?.value ?? "";
    setActivityFormState({ open: true, mode: "create", activityId: null });
    setActivityFormDraft(createEmptyActivityDraft(defaultProjectId));
    setActivityFormErrors({});
    setActivityFormSubmitError(null);
  }, [canManageActivities, taskOptions]);

  const openActivityEditModal = useCallback(
    (activity: {
      activityId: string;
      projectId: string;
      title: string;
      description: string;
      statusCode: string;
      startAt: string | null;
      endAt: string | null;
      locationId: string | null;
      estimatedHours: number | null;
    }) => {
      if (!canManageActivities) {
        toast.error("No tienes permisos para editar actividades.");
        return;
      }

      setActivityFormState({
        open: true,
        mode: "edit",
        activityId: activity.activityId,
      });
      setActivityFormDraft({
        projectId: activity.projectId,
        title: activity.title,
        description: activity.description,
        statusCode: activity.statusCode,
        startAt: activity.startAt ?? "",
        endAt: activity.endAt ?? "",
        locationId: activity.locationId ?? "",
        estimatedHoursText:
          activity.estimatedHours === null || activity.estimatedHours === undefined
            ? ""
            : String(activity.estimatedHours),
      });
      setActivityFormErrors({});
      setActivityFormSubmitError(null);
    },
    [canManageActivities]
  );

  const closeActivityFormModal = useCallback(() => {
    if (isSavingActivity) {
      return;
    }

    setActivityFormState({ open: false, mode: "create", activityId: null });
    setActivityFormDraft(createEmptyActivityDraft());
    setActivityFormErrors({});
    setActivityFormSubmitError(null);
  }, [isSavingActivity]);

  const submitActivityForm = useCallback(async () => {
    const parsedEstimated = parseNullablePositiveNumber(activityFormDraft.estimatedHoursText);

    const input: DashboardActivityFormInput = {
      projectId: activityFormDraft.projectId,
      title: activityFormDraft.title,
      description: activityFormDraft.description,
      statusCode: activityFormDraft.statusCode,
      startAt: activityFormDraft.startAt || null,
      endAt: activityFormDraft.endAt || null,
      locationId: activityFormDraft.locationId || null,
      estimatedHours: parsedEstimated,
    };

    const validationErrors = validateDashboardActivityForm(input);

    if (Number.isNaN(parsedEstimated)) {
      validationErrors.estimatedHours = "Ingresa un numero valido de horas estimadas.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setActivityFormErrors(validationErrors);
      return;
    }

    setActivityFormErrors({});
    setActivityFormSubmitError(null);

    try {
      if (activityFormState.mode === "create") {
        const created = await createActivity(input);
        if (!created) {
          return;
        }

        toast.success("Actividad creada", {
          description: `${created.title} fue registrada correctamente.`,
        });
      } else {
        const activityId = activityFormState.activityId;
        if (!activityId) {
          setActivityFormSubmitError("No se encontro la actividad para editar.");
          return;
        }

        const updated = await updateActivity(activityId, input);
        if (!updated) {
          return;
        }

        toast.success("Actividad actualizada", {
          description: `${updated.title} fue actualizada correctamente.`,
        });
      }

      closeActivityFormModal();
    } catch (error) {
      setActivityFormSubmitError(
        toFriendlyError(error, "No se pudo guardar la actividad.")
      );
    }
  }, [
    activityFormDraft,
    activityFormState.activityId,
    activityFormState.mode,
    closeActivityFormModal,
    createActivity,
    updateActivity,
  ]);

  const submitCancelActivity = useCallback(async () => {
    if (!cancelTarget) {
      return;
    }

    try {
      await cancelActivity(cancelTarget.id);
      toast.success("Actividad cancelada", {
        description: `Se actualizo el estado de "${cancelTarget.name}" a cancelada.`,
      });
      setCancelTarget(null);
      if (activityDetail?.id === cancelTarget.id) {
        setIsActivityDetailOpen(false);
      }
    } catch (error) {
      toast.error(toFriendlyError(error, "No se pudo cancelar la actividad."));
    }
  }, [activityDetail?.id, cancelActivity, cancelTarget]);

  const openActivityDetailModal = useCallback((activityId: string) => {
    setActivityDetailTargetId(activityId);
    setActivityDetail(null);
    setActivityDetailError(null);
    setIsActivityDetailOpen(true);
  }, []);

  const closeActivityDetailModal = useCallback(() => {
    setIsActivityDetailOpen(false);
    setActivityDetailTargetId(null);
    setActivityDetail(null);
    setActivityDetailError(null);
  }, []);

  const loadActivityDetail = useCallback(async () => {
    if (!activityDetailTargetId) {
      return;
    }

    setActivityDetailLoading(true);
    setActivityDetailError(null);

    try {
      const detail = await fetchDashboardActivityDetail(activityDetailTargetId);
      setActivityDetail(detail);
    } catch (error) {
      setActivityDetail(null);
      setActivityDetailError(
        toFriendlyError(error, "No se pudo cargar el detalle de la actividad.")
      );
    } finally {
      setActivityDetailLoading(false);
    }
  }, [activityDetailTargetId]);

  useEffect(() => {
    if (!isActivityDetailOpen || !activityDetailTargetId) {
      return;
    }

    void loadActivityDetail();
  }, [activityDetailTargetId, isActivityDetailOpen, loadActivityDetail]);

  const openHourDetailModal = useCallback((hourId: string) => {
    setHourDetailTargetId(hourId);
    setHourDetail(null);
    setHourDetailError(null);
    setIsHourDetailOpen(true);
  }, []);

  const closeHourDetailModal = useCallback(() => {
    setIsHourDetailOpen(false);
    setHourDetailTargetId(null);
    setHourDetail(null);
    setHourDetailError(null);
  }, []);

  const loadHourDetail = useCallback(async () => {
    if (!hourDetailTargetId) {
      return;
    }

    setHourDetailLoading(true);
    setHourDetailError(null);

    try {
      const detail = await fetchDashboardHourDetail(hourDetailTargetId);
      setHourDetail(detail);
    } catch (error) {
      setHourDetail(null);
      setHourDetailError(
        toFriendlyError(error, "No se pudo cargar el detalle de horas.")
      );
    } finally {
      setHourDetailLoading(false);
    }
  }, [hourDetailTargetId]);

  useEffect(() => {
    if (!isHourDetailOpen || !hourDetailTargetId) {
      return;
    }

    void loadHourDetail();
  }, [hourDetailTargetId, isHourDetailOpen, loadHourDetail]);

  const openAdmissionDetailModal = useCallback((requestId: string) => {
    setAdmissionDetailTargetId(requestId);
    setAdmissionDetail(null);
    setAdmissionDetailError(null);
    setIsAdmissionDetailOpen(true);
  }, []);

  const closeAdmissionDetailModal = useCallback(() => {
    setIsAdmissionDetailOpen(false);
    setAdmissionDetailTargetId(null);
    setAdmissionDetail(null);
    setAdmissionDetailError(null);
  }, []);

  const loadAdmissionDetail = useCallback(async () => {
    if (!admissionDetailTargetId) {
      return;
    }

    setAdmissionDetailLoading(true);
    setAdmissionDetailError(null);

    try {
      const detail = await fetchDashboardAdmissionDetail(admissionDetailTargetId);
      setAdmissionDetail(detail);
    } catch (error) {
      setAdmissionDetail(null);
      setAdmissionDetailError(
        toFriendlyError(error, "No se pudo cargar el detalle de admision.")
      );
    } finally {
      setAdmissionDetailLoading(false);
    }
  }, [admissionDetailTargetId]);

  useEffect(() => {
    if (!isAdmissionDetailOpen || !admissionDetailTargetId) {
      return;
    }

    void loadAdmissionDetail();
  }, [admissionDetailTargetId, isAdmissionDetailOpen, loadAdmissionDetail]);

  const openResolutionModal = useCallback((target: ResolutionTarget) => {
    setResolutionTarget(target);
    setResolutionComment("");
    setResolutionError(null);
  }, []);

  const closeResolutionModal = useCallback(() => {
    if (isResolutionSubmitting) {
      return;
    }

    setResolutionTarget(null);
    setResolutionComment("");
    setResolutionError(null);
  }, [isResolutionSubmitting]);

  const submitResolution = useCallback(async () => {
    if (!resolutionTarget) {
      return;
    }

      const isRejecting = resolutionTarget.targetStatus === "rejected";
      const requiresComment = resolutionTarget.kind === "admission" && isRejecting;
      const commentError = validateResolutionComment(resolutionComment, requiresComment);

    if (commentError) {
      setResolutionError(commentError);
      return;
    }

    setResolutionError(null);

    try {
        if (resolutionTarget.kind === "hour") {
          await resolveHour({
            hourId: resolutionTarget.row.id,
            targetStatus: resolutionTarget.targetStatus,
            reviewerId: userContext.userId,
            comment: resolutionComment,
          });

        toast.success("Horas actualizadas", {
          description:
            resolutionTarget.targetStatus === "approved"
              ? "El registro fue aprobado."
              : "El registro fue rechazado.",
        });
      } else {
        await resolveAdmission({
          requestId: resolutionTarget.row.id,
          targetStatus: resolutionTarget.targetStatus,
          reviewerId: userContext.userId,
          comment: resolutionComment,
        });

        toast.success("Solicitud actualizada", {
          description:
            resolutionTarget.targetStatus === "approved"
              ? "La solicitud fue aprobada."
              : "La solicitud fue rechazada.",
        });
      }

      closeResolutionModal();
    } catch (error) {
      setResolutionError(
        toFriendlyError(error, "No se pudo completar la resolucion.")
      );
    }
  }, [
    closeResolutionModal,
    resolutionComment,
    resolutionTarget,
    resolveAdmission,
    resolveHour,
    userContext.userId,
  ]);

  const hoursActions = useMemo<RowAction<DashboardHoursRow>[]>(() => {
    const actions: RowAction<DashboardHoursRow>[] = [
      {
        label: "Ver detalle",
        onClick: (item) => openHourDetailModal(item.id),
      },
    ];

    if (canResolveHours) {
      actions.push({
        label: "Aprobar",
        onClick: (item) =>
          openResolutionModal({ kind: "hour", targetStatus: "approved", row: item }),
      });
      actions.push({
        label: "Rechazar",
        onClick: (item) =>
          openResolutionModal({ kind: "hour", targetStatus: "rejected", row: item }),
        variant: "destructive",
      });
    }

    return actions;
  }, [canResolveHours, openHourDetailModal, openResolutionModal]);

  const activityActions = useMemo<RowAction<DashboardActivityRow>[]>(() => {
    const actions: RowAction<DashboardActivityRow>[] = [
      {
        label: "Ver detalle",
        onClick: (item) => openActivityDetailModal(item.id),
      },
    ];

    if (canManageActivities) {
      actions.push({
        label: "Editar",
        onClick: (item) =>
          openActivityEditModal({
            activityId: item.id,
            projectId: item.projectId ?? "",
            title: item.name,
            description: item.description,
            statusCode: item.statusCode,
            startAt: item.startAt,
            endAt: item.endAt,
            locationId: item.locationId,
            estimatedHours: item.estimatedHours ?? null,
          }),
      });
      actions.push({
        label: "Cancelar",
        onClick: (item) => setCancelTarget(item),
        variant: "destructive",
      });
    }

    return actions;
  }, [canManageActivities, openActivityDetailModal, openActivityEditModal]);

  const requestActions = useMemo<RowAction<DashboardAdmissionRow>[]>(() => {
    const actions: RowAction<DashboardAdmissionRow>[] = [
      {
        label: "Ver detalle",
        onClick: (item) => openAdmissionDetailModal(item.id),
      },
    ];

    if (canResolveAdmissions) {
      actions.push({
        label: "Aprobar",
        onClick: (item) =>
          openResolutionModal({
            kind: "admission",
            targetStatus: "approved",
            row: item,
          }),
      });
      actions.push({
        label: "Rechazar",
        onClick: (item) =>
          openResolutionModal({
            kind: "admission",
            targetStatus: "rejected",
            row: item,
          }),
        variant: "destructive",
      });
    }

    return actions;
  }, [canResolveAdmissions, openAdmissionDetailModal, openResolutionModal]);

  const selectedResolutionDescription = useMemo(() => {
    if (!resolutionTarget) {
      return "";
    }

    if (resolutionTarget.kind === "hour") {
      return `${resolutionTarget.row.volunteerName} - ${resolutionTarget.row.activityName}`;
    }

    return `${resolutionTarget.row.name} - ${resolutionTarget.row.email}`;
  }, [resolutionTarget]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-[22px] tracking-[-0.01em]" style={{ color: "var(--t-text)" }}>
            Panel principal
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
            {todayLabel}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
            Usuario: {userContext.userName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GradientButton
            size="sm"
            onClick={openActivityCreateModal}
            disabled={!canManageActivities || taskOptions.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva actividad
          </GradientButton>
          <OutlineButton size="sm" onClick={refresh}>
            <Clock className="h-3.5 w-3.5 opacity-40" />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </OutlineButton>
        </div>
      </motion.div>

      {catalogError && (
        <motion.div variants={fadeUp}>
          <BlockError message={catalogError} onRetry={refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <div key={card.key}>
            <KpiCard
              title={card.title}
              value={metricsLoading ? "..." : formatMetricValue(card.key, metrics[card.key])}
              icon={card.icon}
            />
            {metricErrors[card.key] && (
              <p className="mt-1 px-1 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                {metricErrors[card.key]}
              </p>
            )}
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          className="rounded-2xl p-5 backdrop-blur-xl"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#7545E2]/70" />
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ color: "var(--t-text-dim)" }}
            >
              Hoy
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                Actividades activas
              </span>
              <span className="tabular-nums text-[15px]" style={{ color: "var(--t-text)" }}>
                {metrics.activitiesActive}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                Voluntarios activos
              </span>
              <span className="tabular-nums text-[15px]" style={{ color: "var(--t-text)" }}>
                {metrics.volunteersActive}
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 backdrop-blur-xl"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400/70" />
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ color: "var(--t-text-dim)" }}
            >
              Pendiente
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                Horas pendientes
              </span>
              <span className="tabular-nums text-[15px]" style={{ color: "var(--t-text)" }}>
                {metrics.approvalsPending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                Solicitudes admision
              </span>
              <span className="tabular-nums text-[15px]" style={{ color: "var(--t-text)" }}>
                {metrics.admissionPending}
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 backdrop-blur-xl"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400/70" />
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ color: "var(--t-text-dim)" }}
            >
              Control
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                Evidencias
              </span>
              <span className="tabular-nums text-[15px]" style={{ color: "var(--t-text)" }}>
                {metrics.evidencesUploaded}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                Horas aprobadas
              </span>
              <span className="tabular-nums text-[15px]" style={{ color: "var(--t-text)" }}>
                {hoursToText(metrics.hoursApproved)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
        <GradientButton size="sm" onClick={() => navigate("/admin/hours")}>
          <Clock className="h-3.5 w-3.5" />
          Registrar horas
        </GradientButton>
        <OutlineButton
          size="sm"
          onClick={() => navigate("/admin/approvals/hours")}
          disabled={!canResolveHours}
        >
          <CheckSquare className="h-3.5 w-3.5 opacity-50" />
          Aprobar horas
        </OutlineButton>
        <GhostButton
          size="sm"
          onClick={openActivityCreateModal}
          disabled={!canManageActivities || taskOptions.length === 0}
        >
          <Plus className="h-3.5 w-3.5 opacity-40" />
          Crear actividad
        </GhostButton>
        <GhostButton size="sm" onClick={() => navigate("/admin/activities")}>
          <ClipboardCheck className="h-3.5 w-3.5 opacity-40" />
          Ver actividades
        </GhostButton>
        <GhostButton size="sm" onClick={() => navigate("/admin/admission/requests")}>
          <Upload className="h-3.5 w-3.5 opacity-40" />
          Revisar admision
        </GhostButton>
      </motion.div>

      {/* Impact KPIs */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Beneficiarios atendidos",
            value: impactKpis.loading ? "..." : String(impactKpis.data.beneficiaries),
            icon: <Users className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />,
          },
          {
            label: "Horas donadas totales",
            value: impactKpis.loading ? "..." : hoursToText(impactKpis.data.totalApprovedHours),
            icon: <HandHeart className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />,
          },
          {
            label: "Proyectos completados",
            value: impactKpis.loading ? "..." : String(impactKpis.data.completedProjects),
            icon: <Target className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="flex items-center gap-4 rounded-2xl p-4 backdrop-blur-xl"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--t-input-bg)" }}
            >
              {kpi.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--t-text-dim)" }}>
                {kpi.label}
              </p>
              <p className="tabular-nums text-[18px] font-medium" style={{ color: "var(--t-text)" }}>
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
        {impactKpis.error && (
          <div className="sm:col-span-3">
            <BlockError message={impactKpis.error} onRetry={refresh} />
          </div>
        )}
      </motion.div>

      {/* Monthly hours BarChart */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-5 backdrop-blur-xl"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <p className="mb-4 text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--t-text-dim)" }}>
            Horas aprobadas — últimos 6 meses
          </p>
          {monthlyHours.error && <BlockError message={monthlyHours.error} onRetry={refresh} />}
          {monthlyHours.loading ? (
            <div
              className="h-[160px] animate-pulse rounded-xl"
              style={{ background: "var(--t-input-bg)" }}
            />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyHours.data} barCategoryGap="30%">
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--t-text-dim)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--t-text-dim)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--t-elevated)",
                    border: "1px solid var(--t-border-strong)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--t-text)",
                  }}
                  cursor={{ fill: "var(--t-hover)" }}
                  formatter={(value: number) => [`${value} h`, "Horas"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {monthlyHours.data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index === monthlyHours.data.length - 1 ? "#7545E2" : "rgba(117,69,226,0.35)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-0">
          <div className="mb-0 flex items-center gap-0" style={{ borderBottom: "1px solid var(--t-border)" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn("relative px-4 py-2.5 text-[13px] transition-colors duration-200")}
                style={{
                  color: activeTab === tab.key ? "var(--t-text)" : "var(--t-text-dim)",
                }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[1px]"
                    style={{
                      background: "linear-gradient(90deg, transparent, #7545E2, transparent)",
                    }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="mt-0">
            {tabError && <BlockError message={tabError} onRetry={refresh} />}
            {activeTab === "hours" && (
              <DataTable
                columns={hoursColumns}
                data={recentHours.data}
                loading={recentHours.loading}
                actions={hoursActions}
                emptyMessage="Sin registros de horas recientes"
                className="rounded-t-none border-t-0"
              />
            )}
            {activeTab === "activities" && (
              <DataTable
                columns={activityColumns}
                data={recentActivities.data}
                loading={recentActivities.loading}
                actions={activityActions}
                emptyMessage="Sin actividades recientes"
                className="rounded-t-none border-t-0"
              />
            )}
            {activeTab === "requests" && (
              <DataTable
                columns={requestColumns}
                data={recentRequests.data}
                loading={recentRequests.loading}
                actions={requestActions}
                emptyMessage="Sin solicitudes recientes"
                className="rounded-t-none border-t-0"
              />
            )}
          </div>
        </div>

        <div className="space-y-3.5">
          <div
            className="rounded-2xl p-5 backdrop-blur-xl"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--t-text-dim)" }}>
                  Impacto semanal
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="tabular-nums text-xl tracking-tight" style={{ color: "var(--t-text)" }}>
                    {hoursToText(totalWeeklyHours)}
                  </span>
                </div>
              </div>
            </div>
            {weeklyImpact.error && <BlockError message={weeklyImpact.error} onRetry={refresh} />}
            {weeklyImpact.loading ? (
              <div
                className="h-[110px] animate-pulse rounded-xl"
                style={{ background: "var(--t-input-bg)" }}
              />
            ) : (
              <MiniLineChart data={weeklyImpact.data} height={110} />
            )}
          </div>

          <div
            className="rounded-2xl p-5 backdrop-blur-xl"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--t-text-dim)" }}>
              Agenda de hoy
            </p>
            {todayTimeline.error && (
              <BlockError message={todayTimeline.error} onRetry={refresh} />
            )}
            {todayTimeline.loading ? (
              <div className="space-y-2">
                <div
                  className="h-8 animate-pulse rounded-lg"
                  style={{ background: "var(--t-input-bg)" }}
                />
                <div
                  className="h-8 animate-pulse rounded-lg"
                  style={{ background: "var(--t-input-bg)" }}
                />
              </div>
            ) : todayTimeline.data.length > 0 ? (
              <Timeline items={todayTimeline.data} />
            ) : (
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                No hay actividades programadas para hoy.
              </p>
            )}
          </div>

          <div
            className="rounded-2xl p-5 backdrop-blur-xl"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--t-text-dim)" }}>
              Pendientes
            </p>
            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  className="group flex w-full items-start gap-2.5 rounded-xl text-left transition-colors hover:bg-[var(--t-hover)]"
                  onClick={() => {
                    const targetPath = resolveAlertTargetPath(alert.id);
                    if (targetPath) {
                      navigate(targetPath);
                    }
                  }}
                  disabled={!resolveAlertTargetPath(alert.id)}
                >
                  <Bell className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "var(--t-text-dim)" }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--t-text-tertiary)" }}>
                    {alert.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <ModalShell
        open={activityFormState.open}
        onClose={closeActivityFormModal}
        width="max-w-[780px]"
      >
        <ModalHeader
          title={activityFormState.mode === "create" ? "Nueva actividad" : "Editar actividad"}
          description="Completa estado, fechas, ubicacion y datos base de la actividad."
          onClose={closeActivityFormModal}
        />

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          {catalogError && <BlockError message={catalogError} onRetry={refresh} />}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Tarea
              </label>
              <select
                value={activityFormDraft.projectId}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    projectId: event.target.value,
                  }));
                  setActivityFormErrors((current) => ({ ...current, projectId: undefined }));
                }}
                disabled={isSavingActivity}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              >
                <option value="">Selecciona un proyecto</option>
                {taskOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={activityFormErrors.projectId} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Titulo de actividad
              </label>
              <input
                value={activityFormDraft.title}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }));
                  setActivityFormErrors((current) => ({ ...current, title: undefined }));
                }}
                disabled={isSavingActivity}
                placeholder="Ej. Taller comunitario"
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              />
              <FieldError message={activityFormErrors.title} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Estado
              </label>
              <select
                value={activityFormDraft.statusCode}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    statusCode: event.target.value,
                  }));
                  setActivityFormErrors((current) => ({ ...current, statusCode: undefined }));
                }}
                disabled={isSavingActivity}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              >
                {activityStateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={activityFormErrors.statusCode} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Horas estimadas (opcional)
              </label>
              <input
                value={activityFormDraft.estimatedHoursText}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    estimatedHoursText: event.target.value,
                  }));
                  setActivityFormErrors((current) => ({
                    ...current,
                    estimatedHours: undefined,
                  }));
                }}
                disabled={isSavingActivity}
                inputMode="decimal"
                placeholder="Ej. 3.5"
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              />
              <FieldError message={activityFormErrors.estimatedHours} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Fecha inicio
              </label>
              <input
                type="date"
                value={activityFormDraft.startAt}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    startAt: event.target.value,
                  }));
                  setActivityFormErrors((current) => ({ ...current, dateOrder: undefined }));
                }}
                disabled={isSavingActivity}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Fecha fin
              </label>
              <input
                type="date"
                value={activityFormDraft.endAt}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    endAt: event.target.value,
                  }));
                  setActivityFormErrors((current) => ({ ...current, dateOrder: undefined }));
                }}
                disabled={isSavingActivity}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Ubicacion
              </label>
              <select
                value={activityFormDraft.locationId}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    locationId: event.target.value,
                  }));
                }}
                disabled={isSavingActivity}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              >
                <option value="">Sin ubicacion</option>
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Descripcion
              </label>
              <textarea
                value={activityFormDraft.description}
                onChange={(event) => {
                  setActivityFormDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }));
                }}
                disabled={isSavingActivity}
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                }}
              />
            </div>
          </div>

          <FieldError message={activityFormErrors.dateOrder} />

          {selectedTaskOption && (
            <div
              className="rounded-2xl p-3"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Tarea seleccionada
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--t-text)" }}>
                {selectedTaskOption.taskTitle}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
                Proyecto: {selectedTaskOption.projectName}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
                Estado: {selectedTaskOption.taskStatus}
                {selectedTaskOption.dueDate ? ` - Vence ${formatDate(selectedTaskOption.dueDate)}` : ""}
              </p>
            </div>
          )}

          <FieldError message={activityFormSubmitError} />

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitActivityForm()}
              disabled={isSavingActivity || taskOptions.length === 0}
            >
              {isSavingActivity
                ? "Guardando..."
                : activityFormState.mode === "create"
                ? "Crear actividad"
                : "Guardar cambios"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeActivityFormModal} disabled={isSavingActivity}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isActivityDetailOpen} onClose={closeActivityDetailModal} width="max-w-[940px]">
        <ModalHeader
          title="Detalle de actividad"
          description="Consulta estado, fechas, ubicacion, asignaciones, horas y evidencias registradas."
          onClose={closeActivityDetailModal}
        />

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {activityDetailLoading && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>
            </div>
          )}

          {!activityDetailLoading && activityDetailError && (
            <BlockError message={activityDetailError} onRetry={() => void loadActivityDetail()} />
          )}

          {!activityDetailLoading && !activityDetailError && activityDetail && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Actividad" value={activityDetail.title} />
                <DetailField label="Proyecto" value={activityDetail.projectName} />
                <DetailField label="Tarea" value={activityDetail.taskTitle} />
                <DetailField label="Estado actividad" value={activityDetail.statusLabel} />
                <DetailField label="Fechas" value={formatScheduleLabel(activityDetail.startAt, activityDetail.endAt)} />
                <DetailField label="Ubicacion" value={activityDetail.locationName ?? "-"} />
                <DetailField label="Estado tarea" value={activityDetail.taskStatus} />
                <DetailField label="Vencimiento tarea" value={formatDate(activityDetail.taskDueDate)} />
                <DetailField
                  label="Horas estimadas"
                  value={hoursToText(activityDetail.estimatedHours)}
                />
                <DetailField
                  label="Horas registradas"
                  value={hoursToText(activityDetail.registeredHours)}
                />
                <DetailField
                  label="Evidencias"
                  value={String(activityDetail.evidenceCount)}
                />
                <DetailField label="Creada" value={formatDateTime(activityDetail.createdAt)} />
              </div>

              <div
                className="rounded-2xl p-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  Descripcion
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  {activityDetail.description || "Sin descripcion registrada."}
                </p>
              </div>

              <div
                className="rounded-2xl p-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  Asignaciones
                </p>
                {activityDetail.assignments.length === 0 ? (
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
                    No hay voluntarios asignados a esta actividad.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {activityDetail.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{
                          background: "var(--t-hover)",
                          border: "1px solid var(--t-border)",
                        }}
                      >
                        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {assignment.volunteerName}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {assignment.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {canManageActivities && (
                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      closeActivityDetailModal();
                      openActivityEditModal({
                        activityId: activityDetail.id,
                        projectId: activityDetail.taskId,
                        title: activityDetail.title,
                        description: activityDetail.description,
                        statusCode: activityDetail.statusCode,
                        startAt: activityDetail.startAt,
                        endAt: activityDetail.endAt,
                        locationId: activityDetail.locationId,
                        estimatedHours: activityDetail.estimatedHours,
                      });
                    }}
                  >
                    Editar
                  </OutlineButton>
                )}
                {canManageActivities && (
                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      closeActivityDetailModal();
                      setCancelTarget({
                        id: activityDetail.id,
                        name: activityDetail.title,
                        description: activityDetail.description,
                        projectName: activityDetail.projectName,
                        date: activityDetail.startAt ?? activityDetail.endAt ?? activityDetail.createdAt,
                        assignedVolunteers: activityDetail.assignments.length,
                        status: activityDetail.status,
                        statusLabel: activityDetail.statusLabel,
                        statusCode: activityDetail.statusCode,
                        startAt: activityDetail.startAt,
                        endAt: activityDetail.endAt,
                        locationId: activityDetail.locationId,
                        locationName: activityDetail.locationName,
                        taskId: activityDetail.taskId,
                        taskName: activityDetail.taskTitle,
                        taskStatus: activityDetail.taskStatus,
                        estimatedHours: activityDetail.estimatedHours,
                      });
                    }}
                    disabled={isCancellingActivity}
                  >
                    Cancelar actividad
                  </OutlineButton>
                )}
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isHourDetailOpen} onClose={closeHourDetailModal} width="max-w-[920px]">
        <ModalHeader
          title="Detalle de horas"
          description="Consulta trazabilidad, aprobador y estado del registro de horas."
          onClose={closeHourDetailModal}
        />

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {hourDetailLoading && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>
            </div>
          )}

          {!hourDetailLoading && hourDetailError && (
            <BlockError message={hourDetailError} onRetry={() => void loadHourDetail()} />
          )}

          {!hourDetailLoading && !hourDetailError && hourDetail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot
                  variant={
                    hourDetail.status === "approved"
                      ? "success"
                      : hourDetail.status === "rejected"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {hourDetail.statusLabel}
                </StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Voluntario" value={hourDetail.volunteerName} />
                <DetailField label="Actividad" value={hourDetail.activityName} />
                <DetailField label="Proyecto" value={hourDetail.projectName} />
                <DetailField label="Fecha" value={formatDate(hourDetail.date)} />
                <DetailField label="Horas" value={hoursToText(hourDetail.hoursRegistered)} />
                <DetailField label="Creado" value={formatDateTime(hourDetail.createdAt)} />
                <DetailField label="Aprobado por" value={hourDetail.approvedBy ?? "-"} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  Comentario de resolucion
                </p>
                  <pre
                    className="mt-1 whitespace-pre-wrap text-[12px]"
                    style={{ color: "var(--t-text-secondary)", fontFamily: "inherit" }}
                  >
                  {hourDetail.approvalComment || "Sin comentario de resolucion."}
                  </pre>
                </div>

              {canResolveHours && hourDetail.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm"
                    onClick={() =>
                      openResolutionModal({
                        kind: "hour",
                        targetStatus: "approved",
                        row: {
                          id: hourDetail.id,
                          volunteerName: hourDetail.volunteerName,
                          activityName: hourDetail.activityName,
                          hours: hourDetail.hoursRegistered,
                          date: hourDetail.date,
                          status: hourDetail.status,
                          statusLabel: hourDetail.statusLabel,
                          projectName: hourDetail.projectName,
                        },
                      })
                    }
                    disabled={isResolutionSubmitting}
                  >
                    Aprobar
                  </OutlineButton>
                  <OutlineButton
                    size="sm"
                    onClick={() =>
                      openResolutionModal({
                        kind: "hour",
                        targetStatus: "rejected",
                        row: {
                          id: hourDetail.id,
                          volunteerName: hourDetail.volunteerName,
                          activityName: hourDetail.activityName,
                          hours: hourDetail.hoursRegistered,
                          date: hourDetail.date,
                          status: hourDetail.status,
                          statusLabel: hourDetail.statusLabel,
                          projectName: hourDetail.projectName,
                        },
                      })
                    }
                    disabled={isResolutionSubmitting}
                  >
                    Rechazar
                  </OutlineButton>
                </div>
              )}
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={isAdmissionDetailOpen}
        onClose={closeAdmissionDetailModal}
        width="max-w-[940px]"
      >
        <ModalHeader
          title="Detalle de solicitud"
          description="Consulta estado actual e historial de cambios de admision."
          onClose={closeAdmissionDetailModal}
        />

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {admissionDetailLoading && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>
            </div>
          )}

          {!admissionDetailLoading && admissionDetailError && (
            <BlockError
              message={admissionDetailError}
              onRetry={() => void loadAdmissionDetail()}
            />
          )}

          {!admissionDetailLoading && !admissionDetailError && admissionDetail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot
                  variant={
                    admissionDetail.status === "approved"
                      ? "success"
                      : admissionDetail.status === "rejected"
                      ? "destructive"
                      : admissionDetail.status === "interviewing"
                      ? "info"
                      : "warning"
                  }
                >
                  {admissionDetail.statusRaw}
                </StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Nombres" value={admissionDetail.fullName} />
                <DetailField label="Correo" value={admissionDetail.email} />
                <DetailField
                  label="Fecha solicitud"
                  value={formatDateTime(admissionDetail.submittedAt)}
                />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  Notas
                </p>
                <pre
                  className="mt-1 whitespace-pre-wrap text-[12px]"
                  style={{ color: "var(--t-text-secondary)", fontFamily: "inherit" }}
                >
                  {admissionDetail.notes || "Sin notas."}
                </pre>
              </div>

              <div
                className="rounded-2xl p-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  Historial de estados
                </p>

                {admissionDetail.history.length === 0 ? (
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
                    Sin historial registrado.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {admissionDetail.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl px-3 py-2"
                        style={{
                          background: "var(--t-hover)",
                          border: "1px solid var(--t-border)",
                        }}
                      >
                        <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {entry.oldState || "sin estado"} {"->"} {entry.newState}
                        </p>
                        <p className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {formatDateTime(entry.changedAt)} - {entry.changedBy}
                        </p>
                        {entry.comment && (
                          <p className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-tertiary)" }}>
                            {entry.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {canResolveAdmissions &&
                (admissionDetail.status === "pending" ||
                  admissionDetail.status === "interviewing") && (
                  <div className="flex flex-wrap gap-2">
                    <OutlineButton
                      size="sm"
                      onClick={() =>
                        openResolutionModal({
                          kind: "admission",
                          targetStatus: "approved",
                          row: {
                            id: admissionDetail.id,
                            name: admissionDetail.fullName,
                            email: admissionDetail.email,
                            submittedAt: admissionDetail.submittedAt,
                            status: admissionDetail.status,
                            statusRaw: admissionDetail.statusRaw,
                            notes: admissionDetail.notes ?? undefined,
                          },
                        })
                      }
                      disabled={isResolutionSubmitting}
                    >
                      Aprobar
                    </OutlineButton>
                    <OutlineButton
                      size="sm"
                      onClick={() =>
                        openResolutionModal({
                          kind: "admission",
                          targetStatus: "rejected",
                          row: {
                            id: admissionDetail.id,
                            name: admissionDetail.fullName,
                            email: admissionDetail.email,
                            submittedAt: admissionDetail.submittedAt,
                            status: admissionDetail.status,
                            statusRaw: admissionDetail.statusRaw,
                            notes: admissionDetail.notes ?? undefined,
                          },
                        })
                      }
                      disabled={isResolutionSubmitting}
                    >
                      Rechazar
                    </OutlineButton>
                  </div>
                )}
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(cancelTarget)}
        onClose={() => {
          if (!isCancellingActivity) {
            setCancelTarget(null);
          }
        }}
        width="max-w-[560px]"
      >
        <ModalHeader
          title="Cancelar actividad"
          description="Esta accion actualiza el estado de la actividad a cancelada."
          onClose={() => {
            if (!isCancellingActivity) {
              setCancelTarget(null);
            }
          }}
        />

        <div className="space-y-3 p-4">
          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {cancelTarget
              ? `Se cancelara la actividad "${cancelTarget.name}".`
              : "Selecciona una actividad para cancelar."}
          </p>

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitCancelActivity()}
              disabled={isCancellingActivity}
            >
              {isCancellingActivity ? "Procesando..." : "Confirmar cancelacion"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setCancelTarget(null)}
              disabled={isCancellingActivity}
            >
              Volver
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(resolutionTarget)}
        onClose={closeResolutionModal}
        width="max-w-[560px]"
      >
        <ModalHeader
          title={toResolutionTitle(resolutionTarget)}
            description={
              resolutionTarget?.kind === "hour"
                ? "El comentario es opcional y se sincroniza en `ong.aprobaciones.comentario` y `ong.horas_actividad.comentario_resolucion`."
                : resolutionTarget?.targetStatus === "rejected"
                  ? "El comentario es obligatorio para rechazar."
                  : "Puedes agregar un comentario opcional."
            }
          onClose={closeResolutionModal}
        />

        <div className="space-y-3 p-4">
          {resolutionTarget && (
            <div
              className="rounded-xl px-3 py-2 text-[12px]"
              style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-secondary)" }}>{selectedResolutionDescription}</p>
            </div>
          )}

            {resolutionTarget ? (
              <textarea
                value={resolutionComment}
                onChange={(event) => {
                  setResolutionComment(event.target.value);
                  setResolutionError(null);
                }}
                rows={4}
                placeholder={
                  resolutionTarget.kind === "hour"
                    ? "Comentario opcional de resolucion"
                    : "Comentario / motivo"
                }
                className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
            ) : (
              <div
                className="rounded-xl px-3 py-2 text-[12px]"
                style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
              >
                <p style={{ color: "var(--t-text-secondary)" }}>
                  Selecciona una accion para resolver el registro.
                </p>
              </div>
            )}

          <FieldError message={resolutionError} />

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitResolution()}
              disabled={isResolutionSubmitting}
            >
              {isResolutionSubmitting ? "Guardando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={closeResolutionModal}
              disabled={isResolutionSubmitting}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
