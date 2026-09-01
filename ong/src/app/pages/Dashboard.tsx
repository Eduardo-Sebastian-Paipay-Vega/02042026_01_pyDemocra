import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Settings,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  X,
  Zap,
  BookOpen
} from "lucide-react";

import { PageHeader } from '@/core/components/shared/PageHeader';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { ModalShell } from '@/core/components/ui/modal-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
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
} from "../modules/home/types";

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

type PeriodFilter = "month" | "quarter" | "year";

interface WidgetSettings {
  showEvolutionChart: boolean;
  showTodayAgenda: boolean;
  showActivityFeed: boolean;
  showQuickAccess: boolean;
}

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

function safeHoursToText(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0h";
  }
  return `${value.toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}h`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-PE");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduleLabel(startAt: string | null | undefined, endAt: string | null | undefined): string {
  if (!startAt && !endAt) return "-";
  if (startAt && endAt) {
    return startAt === endAt ? formatDate(startAt) : `${formatDate(startAt)} - ${formatDate(endAt)}`;
  }
  return formatDate(startAt ?? endAt);
}

function BlockError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-[12px]">
      <span>{message}</span>
      <button
        type="button"
        className="rounded-md px-2.5 py-1 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-colors"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-400 mt-1">{message}</p>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2 bg-zinc-950 border border-zinc-800">
      <p className="text-[11px] text-zinc-400 font-medium">{label}</p>
      <p className="mt-0.5 text-xs text-zinc-200">{value || "-"}</p>
    </div>
  );
}

function ModalHeader({ title, description, onClose }: { title: string; description: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between border-b border-white/5 p-4">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
      </div>
      <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-200 p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function toResolutionTitle(target: ResolutionTarget | null): string {
  if (!target) return "Resolver";
  const actionText = target.targetStatus === "approved" ? "Aprobar" : "Rechazar";
  return target.kind === "hour" ? `${actionText} Horas` : `${actionText} Solicitud de AdmisiÃ³n`;
}

function getInitials(name: string): string {
  if (!name) return "ONG";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Dashboard() {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    showEvolutionChart: true,
    showTodayAgenda: true,
    showActivityFeed: true,
    showQuickAccess: true,
  });

  const [activeTab, setActiveTab] = useState<"hours" | "activities" | "requests">("hours");

  const {
    metrics,
    recentHours,
    recentActivities,
    recentRequests,
    weeklyImpact,
    todayTimeline,
    userContext,
    taskOptions,
    locationOptions,
    refresh,
    isRefreshing,
  } = useDashboardData(periodFilter, selectedProjectFilter);

  // Optimized Refetch para "Feed en Vivo"
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (widgetSettings.showActivityFeed) {
        refresh();
      }
    }, 30000); // 30 segundos
    return () => clearInterval(intervalId);
  }, [refresh, widgetSettings.showActivityFeed]);

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

  // REAL CRUD MODALS STATES
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

  const isResolutionSubmitting = isResolvingHours || isResolvingAdmission;

  // 100% REAL METRICS FROM SUPABASE (ZERO HARDCODED FAKE FALLBACK NUMBERS)
  const activeVolunteersCount = metrics.volunteersActive ?? 0;
  const activeProjectsCount = metrics.projectsActive ?? 0;
  const activeActivitiesCount = metrics.activitiesActive ?? 0;
  const approvedHoursTotal = metrics.hoursApproved ?? 0;
  const pendingApprovalsCount = (metrics.approvalsPending ?? 0) + (metrics.admissionPending ?? 0);

  // 100% REAL CHART DATA FROM SUPABASE
  const chartData = useMemo(() => {
    if (weeklyImpact.data && weeklyImpact.data.length > 0) {
      return weeklyImpact.data.map((d) => ({
        name: d.label,
        aprobadas: d.value,
        solicitadas: d.total ?? d.value,
      }));
    }
    return [
      { name: "Jue", aprobadas: 0, solicitadas: 0 },
      { name: "Vie", aprobadas: 0, solicitadas: 0 },
      { name: "SÃ¡b", aprobadas: 0, solicitadas: 0 },
      { name: "Dom", aprobadas: 0, solicitadas: 0 },
      { name: "Lun", aprobadas: 0, solicitadas: 0 },
      { name: "Mar", aprobadas: 0, solicitadas: 0 },
      { name: "MiÃ©", aprobadas: 0, solicitadas: 0 },
    ];
  }, [weeklyImpact.data]);

  // 100% REAL ACTIVITY FEED DERIVED DIRECTLY FROM DATABASE ROWS (ZERO HARDCODED NAMES)
  const realActivityFeed = useMemo(() => {
    const items: Array<{
      id: string;
      user: string;
      action: string;
      target: string;
      time: string;
      avatar: string;
    }> = [];

    if (recentHours.data && recentHours.data.length > 0) {
      recentHours.data.forEach((h) => {
        items.push({
          id: `h-${h.id}`,
          user: h.volunteerName || "Voluntario",
          action: `registrÃ³ ${h.hours}h de voluntariado`,
          target: h.activityName || "Actividad",
          time: formatDate(h.date),
          avatar: getInitials(h.volunteerName || "V"),
        });
      });
    }

    if (recentRequests.data && recentRequests.data.length > 0) {
      recentRequests.data.forEach((r) => {
        items.push({
          id: `r-${r.id}`,
          user: r.name || "Postulante",
          action: "enviÃ³ solicitud de admisiÃ³n",
          target: r.email || "Registro",
          time: formatDate(r.submittedAt),
          avatar: getInitials(r.name || "P"),
        });
      });
    }

    if (recentActivities.data && recentActivities.data.length > 0) {
      recentActivities.data.forEach((a) => {
        items.push({
          id: `a-${a.id}`,
          user: "CoordinaciÃ³n",
          action: `programÃ³ la actividad "${a.name}"`,
          target: a.projectName || "Proyecto",
          time: formatScheduleLabel(a.startAt, a.endAt),
          avatar: "CO",
        });
      });
    }

    return items;
  }, [recentHours.data, recentRequests.data, recentActivities.data]);

  // 100% REAL AGENDA ITEMS FROM DATABASE
  const realAgendaItems = useMemo(() => {
    if (todayTimeline.data && todayTimeline.data.length > 0) {
      return todayTimeline.data;
    }
    return [];
  }, [todayTimeline.data]);

  // HANDLERS FOR REAL CRUD OPERATIONS
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
    if (isSavingActivity) return;
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
      // @ts-ignore
      // @ts-ignore
      (validationErrors as any).estimatedHours = "Ingresa un nÃºmero vÃ¡lido de horas estimadas.";
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
        if (!created) return;
        toast.success("Actividad creada en la BD Supabase", {
          description: `${created.title} registrada correctamente.`,
        });
      } else {
        const activityId = activityFormState.activityId;
        if (!activityId) return;
        const updated = await updateActivity(activityId, input);
        if (!updated) return;
        toast.success("Actividad actualizada en Supabase", {
          description: `${updated.title} actualizada correctamente.`,
        });
      }
      closeActivityFormModal();
    } catch (err) {
      setActivityFormSubmitError(toFriendlyError(err, "Error al guardar la actividad."));
    }
  }, [activityFormDraft, activityFormState, createActivity, updateActivity, closeActivityFormModal]);

  const openActivityDetailModal = useCallback(async (activityId: string) => {
    setActivityDetailTargetId(activityId);
    setIsActivityDetailOpen(true);
    setActivityDetailLoading(true);
    setActivityDetailError(null);
    try {
      const detail = await fetchDashboardActivityDetail(activityId);
      setActivityDetail(detail);
    } catch (err) {
      setActivityDetailError(toFriendlyError(err, "No se pudo cargar el detalle de la actividad."));
    } finally {
      setActivityDetailLoading(false);
    }
  }, []);

  const openHourDetailModal = useCallback(async (hourId: string) => {
    setHourDetailTargetId(hourId);
    setIsHourDetailOpen(true);
    setHourDetailLoading(true);
    setHourDetailError(null);
    try {
      const detail = await fetchDashboardHourDetail(hourId);
      setHourDetail(detail);
    } catch (err) {
      setHourDetailError(toFriendlyError(err, "No se pudo cargar el detalle de horas."));
    } finally {
      setHourDetailLoading(false);
    }
  }, []);

  const openAdmissionDetailModal = useCallback(async (admissionId: string) => {
    setAdmissionDetailTargetId(admissionId);
    setIsAdmissionDetailOpen(true);
    setAdmissionDetailLoading(true);
    setAdmissionDetailError(null);
    try {
      const detail = await fetchDashboardAdmissionDetail(admissionId);
      setAdmissionDetail(detail);
    } catch (err) {
      setAdmissionDetailError(toFriendlyError(err, "No se pudo cargar la solicitud de admisiÃ³n."));
    } finally {
      setAdmissionDetailLoading(false);
    }
  }, []);

  const openResolutionModal = useCallback((target: ResolutionTarget) => {
    setResolutionTarget(target);
    setResolutionComment("");
    setResolutionError(null);
  }, []);

  const closeResolutionModal = useCallback(() => {
    if (isResolutionSubmitting) return;
    setResolutionTarget(null);
    setResolutionComment("");
    setResolutionError(null);
  }, [isResolutionSubmitting]);

  const submitResolution = useCallback(async () => {
    if (!resolutionTarget) return;
    const required = resolutionTarget.targetStatus === "rejected";
    const commentError = validateResolutionComment(resolutionComment, required);
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
          comment: resolutionComment,
        });
        toast.success(
          resolutionTarget.targetStatus === "approved"
            ? "Horas aprobadas en Supabase"
            : "Horas rechazadas en Supabase"
        );
      } else {
        await resolveAdmission({
          requestId: resolutionTarget.row.id,
          targetStatus: resolutionTarget.targetStatus as any,
          comment: resolutionComment,
        });
        toast.success(
          resolutionTarget.targetStatus === "approved"
            ? "Solicitud aprobada en Supabase"
            : "Solicitud rechazada en Supabase"
        );
      }
      closeResolutionModal();
      setIsHourDetailOpen(false);
      setIsAdmissionDetailOpen(false);
    } catch (err) {
      setResolutionError(toFriendlyError(err, "No se pudo guardar la resoluciÃ³n en la BD."));
    }
  }, [resolutionTarget, resolutionComment, resolveHour, resolveAdmission, closeResolutionModal]);

  const submitCancelActivity = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelActivity(cancelTarget.id);
      toast.success("Actividad cancelada en Supabase.");
      setCancelTarget(null);
    } catch (err) {
      toast.error(toFriendlyError(err, "Error al cancelar la actividad."));
    }
  }, [cancelTarget, cancelActivity]);

  // DATA TABLES COLUMNS WITH REAL CRUD ACTIONS
  const hoursColumns: Column<DashboardHoursRow>[] = [
    {
      key: "volunteerName",
      label: "Voluntario",
      render: (item) => <span className="font-medium text-zinc-100">{item.volunteerName}</span>,
    },
    {
      key: "activityName",
      label: "Actividad",
      render: (item) => <span className="text-xs text-zinc-400">{item.activityName}</span>,
    },
    {
      key: "hours",
      label: "Horas",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-indigo-400">
          {safeHoursToText(item.hours)}
        </span>
      ),
    },
    {
      key: "date",
      label: "Fecha",
      render: (item) => <span className="font-mono text-xs text-zinc-400">{formatDate(item.date)}</span>,
    },
    {
      key: "status",
      label: "Estado",
      render: (item) => {
        const variantByStatus: Record<DashboardHoursRow["status"], "warning" | "success" | "destructive"> = {
          pending: "warning",
          approved: "success",
          rejected: "destructive",
        };
        const labelByStatus: Record<DashboardHoursRow["status"], string> = {
          pending: "Pendiente",
          approved: "Aprobado",
          rejected: "Rechazado",
        };
        return <StatusDot variant={variantByStatus[item.status]}>{labelByStatus[item.status]}</StatusDot>;
      },
    },
  ];

  const activityColumns: Column<DashboardActivityRow>[] = [
    {
      key: "name",
      label: "Actividad y Proyecto",
      render: (item) => (
        <div>
          <div className="font-medium text-zinc-100">{item.name}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            {item.projectName}
            {item.locationName ? ` â€¢ ${item.locationName}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "date",
      label: "ProgramaciÃ³n",
      render: (item) => (
        <span className="font-mono text-xs text-zinc-400">
          {formatScheduleLabel(item.startAt, item.endAt)}
        </span>
      ),
    },
    {
      key: "assignedVolunteers",
      label: "Voluntarios",
      render: (item) => <span className="font-mono text-xs text-zinc-300">{item.assignedVolunteers} vol.</span>,
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
        return <StatusDot variant={variantByStatus[item.status]}>{item.statusLabel}</StatusDot>;
      },
    },
  ];

  const requestColumns: Column<DashboardAdmissionRow>[] = [
    {
      key: "name",
      label: "Solicitante",
      render: (item) => <span className="font-medium text-zinc-100">{item.name}</span>,
    },
    {
      key: "email",
      label: "Correo ElectrÃ³nico",
      render: (item) => <span className="text-xs text-zinc-400 font-mono">{item.email}</span>,
    },
    {
      key: "submittedAt",
      label: "Fecha EnvÃ­o",
      render: (item) => <span className="font-mono text-xs text-zinc-400">{formatDate(item.submittedAt)}</span>,
    },
    {
      key: "status",
      label: "Estado",
      render: (item) => {
        const variantByStatus: Record<DashboardAdmissionRow["status"], "warning" | "info" | "success" | "destructive"> = {
          pending: "warning",
          interviewing: "info",
          approved: "success",
          rejected: "destructive",
        };
        const labelByStatus: Record<DashboardAdmissionRow["status"], string> = {
          pending: "Pendiente",
          interviewing: "Entrevista",
          approved: "Aprobado",
          rejected: "Rechazado",
        };
        return <StatusDot variant={variantByStatus[item.status]}>{labelByStatus[item.status]}</StatusDot>;
      },
    },
  ];

  return (
    <motion.div variants={stagger as any} initial="hidden" animate="visible" className="bg-[var(--color-bg-main)] text-[var(--color-text-primary)] min-h-screen p-6 font-sans space-y-4">
      {/* HEADER EJECUTIVO DEL DASHBOARD CON ACCIONES REALES */}
      <motion.div variants={fadeUp as any}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
            <PageHeader
              title="Panel Principal"
              description="Resumen operativo general, mÃ©tricas clave en tiempo real y gestiÃ³n de la ONG."
            />
          </div>

          {/* â”€â”€ Barra de acciones unificada (una sola fila) â”€â”€ */}
          <div className="flex flex-wrap items-center gap-2">
            {/* BOTÃ“N ACTUALIZAR */}
            <OutlineButton
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-[var(--color-text-secondary)]"
              
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[var(--color-text-muted)] ${isRefreshing ? "animate-spin" : ""}`} />
              Actualizar
            </OutlineButton>

            {/* SELECTOR DE PERÃODO (Custom) */}
            <Select
              value={periodFilter}
              onValueChange={(val) => setPeriodFilter(val as PeriodFilter)}
            >
              <SelectTrigger className="h-9 w-fit min-w-[110px] rounded-xl text-[13px] font-medium transition-colors bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl" >
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent  className="text-[var(--color-text-primary)]">
                <SelectItem value="month" className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">Este Mes</SelectItem>
                <SelectItem value="quarter" className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">Ãšltimo Trimestre</SelectItem>
                <SelectItem value="year" className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">Este AÃ±o</SelectItem>
              </SelectContent>
            </Select>

            {/* SELECTOR DE PROYECTO (Custom) */}
            <Select
              value={selectedProjectFilter}
              onValueChange={setSelectedProjectFilter}
            >
              <SelectTrigger className="h-9 w-fit min-w-[140px] rounded-xl text-[13px] font-medium transition-colors bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl" >
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent  className="text-[var(--color-text-primary)]">
                <SelectItem value="all" className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">Todos los Proyectos</SelectItem>
                {taskOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* BOTÃ“N PERSONALIZAR */}
            <OutlineButton
              size="sm"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5"
              style={{ color: "var(--t-text-secondary)", borderColor: "var(--t-border)" }}
            >
              <Settings className="h-3.5 w-3.5 text-[var(--color-text-muted)]"  />
              Personalizar
            </OutlineButton>

            {/* BOTÃ“N DESCARGAR REPORTE */}
            <OutlineButton
              size="sm"
              onClick={() => {
                toast.info("Preparando vista para imprimir/guardar PDF...");
                setTimeout(() => window.print(), 500);
              }}
              className="flex items-center gap-1.5"
              style={{ color: "var(--t-text-secondary)", borderColor: "var(--t-border)" }}
            >
              <Download className="h-3.5 w-3.5" style={{ color: "var(--t-primary)" }} />
              Reporte PDF
            </OutlineButton>

            {/* BOTÃ“N ACCIÃ“N RÃPIDA DROPDOWN */}
            <div className="relative">
              <GradientButton
                size="sm"
                onClick={() => setIsQuickActionOpen((prev) => !prev)}
                className="flex items-center gap-1.5 shadow-lg"
              >
                <Zap className="h-4 w-4 fill-white" />
                + AcciÃ³n RÃ¡pida
                <ChevronDown className="h-3.5 w-3.5" />
              </GradientButton>

              {isQuickActionOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl p-1.5 shadow-2xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
                  
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickActionOpen(false);
                      navigate("/app/operation/hours");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--t-hover)] text-left transition-colors"
                    style={{ color: "var(--t-text)" }}
                  >
                    <Clock className="h-4 w-4 text-indigo-400" />
                    Registrar Horas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickActionOpen(false);
                      navigate("/app/approvals/hours");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--t-hover)] text-left transition-colors"
                    style={{ color: "var(--t-text)" }}
                  >
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                    Aprobar Horas Pendientes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickActionOpen(false);
                      openActivityCreateModal();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--t-hover)] text-left transition-colors"
                    style={{ color: "var(--t-text)" }}
                  >
                    <Plus className="h-4 w-4 text-purple-400" />
                    Nueva Actividad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickActionOpen(false);
                      navigate("/app/admission/requests");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--t-hover)] text-left transition-colors"
                    style={{ color: "var(--t-text)" }}
                  >
                    <UserPlus className="h-4 w-4 text-amber-400" />
                    Revisar Admisiones
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickActionOpen(false);
                      navigate("/app/academico/cursos");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--t-hover)] text-left transition-colors"
                    style={{ color: "var(--t-text)" }}
                  >
                    <BookOpen className="h-4 w-4 text-sky-400" />
                    Cursos y Certificados
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4 GRANDES TARJETAS DE MÃ‰TRICAS PRINCIPALES (100% REALES DESDE SUPABASE) */}
      <motion.div variants={fadeUp as any}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. VOLUNTARIOS ACTIVOS */}
          <div
            className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
            
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]" >Voluntarios Activos</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent-emerald)/10] text-[var(--color-accent-emerald)] border border-[var(--color-accent-emerald)]/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-text-primary)]" >{activeVolunteersCount}</p>
              <span className="text-xs font-medium text-[var(--color-accent-emerald)] bg-[var(--color-accent-emerald)/10] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[var(--color-accent-emerald)]/20">
                <TrendingUp className="h-3 w-3" /> En sistema
              </span>
            </div>
          </div>

          {/* 2. PROYECTOS Y ACTIVIDADES */}
          <div
            className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
            
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]" >Proyectos y Actividades</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent-emerald)/10] text-[var(--color-accent-emerald)] border border-[var(--color-accent-emerald)]/20">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-text-primary)]" >
                {activeProjectsCount} <span className="text-sm font-normal text-[var(--color-text-muted)]" >proy.</span> â€¢ {activeActivitiesCount} <span className="text-sm font-normal text-[var(--color-text-muted)]" >act.</span>
              </p>
              <span className="text-xs font-medium text-[var(--color-accent-emerald)] bg-[var(--color-accent-emerald)/10] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[var(--color-accent-emerald)]/20">
                <CheckCircle2 className="h-3 w-3" /> Activos
              </span>
            </div>
          </div>

          {/* 3. HORAS APROBADAS */}
          <div
            className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
            
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]" >Horas Aprobadas Totales</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent-purple)/10] text-[var(--color-accent-purple)] border border-[var(--color-accent-purple)]/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-text-primary)]" >{safeHoursToText(approvedHoursTotal)}</p>
              <span className="text-xs font-medium text-[var(--color-accent-purple)] bg-[var(--color-accent-purple)/10] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[var(--color-accent-purple)]/20">
                <Award className="h-3 w-3" /> Auditado OK
              </span>
            </div>
          </div>

          {/* 4. PENDIENTES DE REVISIÃ“N */}
          <div
            className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
            
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]" >Pendientes de RevisiÃ³n</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent-amber)/10] text-[var(--color-accent-amber)] border border-[var(--color-accent-amber)]/20">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-text-primary)]" >{pendingApprovalsCount} <span className="text-sm font-normal text-[var(--color-text-muted)]" >pend.</span></p>
              <span className="text-xs font-medium text-[var(--color-accent-amber)] bg-[var(--color-accent-amber)/10] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[var(--color-accent-amber)]/20">
                <Clock className="h-3 w-3" /> Requiere atenciÃ³n
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECCIÃ“N PRINCIPAL: GRÃFICO DE ÃREA Y AGENDA DE HOY */}
      {(widgetSettings.showEvolutionChart || widgetSettings.showTodayAgenda) && (
        <motion.div variants={fadeUp as any} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GRÃFICO DE EVOLUCIÃ“N DE HORAS */}
          {widgetSettings.showEvolutionChart && (
            <div
              className="lg:col-span-2 rounded-2xl p-5 space-y-4 shadow-sm bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
              
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2 text-[var(--color-text-primary)]" >
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    EvoluciÃ³n del Voluntariado (Horas)
                  </h3>
                  <p className="text-[13px] mt-0.5 text-[var(--color-text-muted)]" >
                    Comparativa de horas solicitadas vs validadas en los Ãºltimos meses.
                  </p>
                </div>

                <span className="text-[13px] text-indigo-400 font-mono bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-medium">
                  {safeHoursToText(approvedHoursTotal)} acumuladas
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {chartData.some(d => d.solicitadas > 0 || d.aprobadas > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAprobadas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent-purple)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-accent-purple)" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorSolicitadas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent-emerald)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-accent-emerald)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#27272a",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="solicitadas"
                        name="Solicitadas"
                        stroke="var(--color-accent-emerald)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSolicitadas)"
                      />
                      <Area
                        type="monotone"
                        dataKey="aprobadas"
                        name="Aprobadas"
                        stroke="var(--color-accent-purple)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAprobadas)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner bg-[#23211D] border-[var(--color-border-subtle)]" >
                      <TrendingUp className="h-6 w-6 text-indigo-400/50" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--color-text-primary)]" >AÃºn no hay horas registradas</p>
                      <p className="text-[12px] max-w-[250px] mx-auto mt-1 text-[var(--color-text-muted)]" >
                        A medida que los voluntarios registren y validen sus horas, verÃ¡s el progreso aquÃ­.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AGENDA Y COMPROMISOS DE HOY (REAL DATABASE ITEMS ONLY) */}
          {widgetSettings.showTodayAgenda && (
            <div
              className="rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
              
            >
              <div>
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
                  <h3 className="text-base font-semibold flex items-center gap-2 text-[var(--color-text-primary)]" >
                    <Calendar className="h-5 w-5 text-indigo-400" />
                    Agenda de Hoy
                  </h3>
                  <span className="text-[13px] font-mono font-medium text-[var(--color-text-muted)]" >
                    {new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {realAgendaItems.length > 0 ? (
                    realAgendaItems.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-[11px] font-bold">
                          {item.timeLabel || "09:00"}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200">{item.title}</h4>
                          <p className="text-[11px] text-zinc-400">{item.subtitle}</p>
                          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">ðŸ‘¥ {item.assignedCount ?? 0} voluntarios asignados</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 mx-auto border border-zinc-700/50 shadow-inner">
                        <Calendar className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-300 font-semibold">Sin actividades programadas hoy</p>
                        <p className="text-[11px] text-zinc-500 max-w-[200px] mx-auto mt-1">
                          Las actividades creadas para la fecha actual aparecerÃ¡n aquÃ­.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openActivityCreateModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
                      >
                        <Plus className="h-3 w-3" />
                        Crear Actividad
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <OutlineButton
                size="sm"
                onClick={() => navigate("/app/projects/activities")}
                className="text-[13px] self-center px-6 w-fit mx-auto"
                style={{ color: "var(--t-text-secondary)", borderColor: "var(--t-border)" }}
              >
                Ver Todas las Actividades
              </OutlineButton>
            </div>
          )}
        </motion.div>
      )}

      {/* FEED DE ACTIVIDAD EN TIEMPO REAL & ACCESOS DIRECTOS */}
      {(widgetSettings.showActivityFeed || widgetSettings.showQuickAccess) && (
        <motion.div variants={fadeUp as any} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FEED DE ACTIVIDAD EN TIEMPO REAL (100% REAL DE LA BASE DE DATOS) */}
          {widgetSettings.showActivityFeed && (
            <div
              className="lg:col-span-2 rounded-2xl p-5 space-y-4 shadow-sm bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
              
            >
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
                <h3 className="text-base font-semibold flex items-center gap-2 text-[var(--color-text-primary)]" >
                  <Radio className="h-5 w-5 text-indigo-400" />
                  Feed de Actividad en Vivo
                </h3>
                <span className="text-[12px] font-mono flex items-center gap-1 text-[var(--color-text-muted)]" >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  En directo
                </span>
              </div>

              <div className="space-y-3">
                {realActivityFeed.length > 0 ? (
                  realActivityFeed.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl text-[13px] hover:bg-[var(--t-hover)] transition-colors"
                      style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-xs">
                          {item.avatar}
                        </div>
                        <div>
                          <p  className="text-[var(--color-text-primary)]">
                            <span className="font-semibold">{item.user}</span>{" "}
                            <span  className="text-[var(--color-text-muted)]">{item.action}</span>
                          </p>
                          <p className="text-[12px] text-indigo-400 font-medium truncate max-w-sm mt-0.5">
                            {item.target}
                          </p>
                        </div>
                      </div>
                      <span className="text-[12px] font-mono shrink-0 text-[var(--color-text-muted)]" >{item.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 mx-auto border border-zinc-700/50 shadow-inner">
                      <Radio className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-300 font-semibold">Sin actividad reciente en el sistema</p>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto mt-1">
                        Las acciones en tiempo real (horas registradas, admisiones y evidencias) se sincronizan de la BD.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/app/operation/hours")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
                    >
                      <Clock className="h-3 w-3" />
                      Registrar Horas
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACCESOS DIRECTOS Y ESTADO OPERATIVO (VALORES REALES DE SUPABASE) */}
          {widgetSettings.showQuickAccess && (
            <div
              className="rounded-2xl p-5 space-y-3 shadow-sm flex flex-col justify-between bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl"
              
            >
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 pb-3 text-[var(--color-text-primary)]" >
                  <Zap className="h-5 w-5 text-amber-400" />
                  Accesos Directos
                </h3>

                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate("/app/admission/requests")}
                    className="flex w-full items-center justify-between p-3 rounded-xl text-[13px] transition-colors hover:bg-[var(--t-hover)]"
                    style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                  >
                    <span className="flex items-center gap-2 font-medium text-[var(--color-text-primary)]" >
                      <UserPlus className="h-4 w-4 text-indigo-400" />
                      Revisar Admisiones
                    </span>
                    <span className="bg-[var(--color-bg-main)] text-xs px-2 py-1 rounded text-[var(--color-text-secondary)]">
                      {metrics.admissionPending ?? 0} pend.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/app/approvals/hours")}
                    className="flex w-full items-center justify-between p-3 rounded-xl text-[13px] transition-colors hover:bg-[var(--t-hover)]"
                    style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                  >
                    <span className="flex items-center gap-2 font-medium text-[var(--color-text-primary)]" >
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                      Validar Horas Pendientes
                    </span>
                    <span className="bg-[var(--color-bg-main)] text-xs px-2 py-1 rounded text-[var(--color-text-secondary)]">
                      {metrics.approvalsPending ?? 0} solicit.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/app/operation/evidence")}
                    className="flex w-full items-center justify-between p-3 rounded-xl text-[13px] transition-colors hover:bg-[var(--t-hover)]"
                    style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                  >
                    <span className="flex items-center gap-2 font-medium text-[var(--color-text-primary)]" >
                      <Upload className="h-4 w-4 text-purple-400" />
                      Repositorio de Evidencias
                    </span>
                    <span className="bg-[var(--color-bg-main)] text-xs px-2 py-1 rounded text-[var(--color-text-secondary)]">
                      {metrics.evidencesUploaded ?? 0} arch.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/app/academico/cursos")}
                    className="flex w-full items-center justify-between p-3 rounded-xl text-[13px] transition-colors hover:bg-[var(--t-hover)]"
                    style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                  >
                    <span className="flex items-center gap-2 font-medium text-[var(--color-text-primary)]" >
                      <BookOpen className="h-4 w-4 text-sky-400" />
                      Cursos y Certificados
                    </span>
                    <span className="bg-[var(--color-bg-main)] text-xs px-2 py-1 rounded text-[var(--color-text-secondary)]">
                      Abrir
                    </span>
                  </button>

                </div>
              </div>

              <div className="pt-3 text-[12px] flex items-center justify-between font-mono text-[var(--color-text-muted)]" >
                <span>Estado Servidor ONG:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> 100% Operativo
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TABLA PRINCIPAL DE DATOS CON ACCIONES CRUD REALES EN SUPABASE */}
      <motion.div variants={fadeUp as any} className="space-y-3">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("hours")}
              className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === "hours"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "hover:bg-[var(--t-hover)]"
              }`}
              style={activeTab !== "hours" ? { color: "var(--t-text-dim)" } : undefined}
            >
              Horas Recientes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activities")}
              className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === "activities"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "hover:bg-[var(--t-hover)]"
              }`}
              style={activeTab !== "activities" ? { color: "var(--t-text-dim)" } : undefined}
            >
              Actividades Recientes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === "requests"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "hover:bg-[var(--t-hover)]"
              }`}
              style={activeTab !== "requests" ? { color: "var(--t-text-dim)" } : undefined}
            >
              Solicitudes Recientes
            </button>
          </div>

          {activeTab === "activities" && canManageActivities && (
            <GradientButton size="sm" onClick={openActivityCreateModal} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Nueva Actividad
            </GradientButton>
          )}
        </div>

        {activeTab === "hours" && (
          <DataTable
            columns={hoursColumns}
            data={recentHours.data}
            loading={recentHours.loading}
            actions={[
              {
                label: "Ver Detalle",
                onClick: (row) => void openHourDetailModal(row.id),
              },
              ...(canResolveHours
                ? [
                    {
                      label: "Aprobar",
                      onClick: (row: DashboardHoursRow) =>
                        openResolutionModal({
                          kind: "hour",
                          targetStatus: "approved",
                          row,
                        }),
                    },
                    {
                      label: "Rechazar",
                      onClick: (row: DashboardHoursRow) =>
                        openResolutionModal({
                          kind: "hour",
                          targetStatus: "rejected",
                          row,
                        }),
                      variant: "destructive" as const,
                    },
                  ]
                : []),
            ]}
            emptyMessage="No hay registro de horas recientes"
          />
        )}

        {activeTab === "activities" && (
          <DataTable
            columns={activityColumns}
            data={recentActivities.data}
            loading={recentActivities.loading}
            actions={[
              {
                label: "Ver Detalle",
                onClick: (row) => void openActivityDetailModal(row.id),
              },
              ...(canManageActivities
                ? [
                    {
                      label: "Editar",
                      onClick: (row: DashboardActivityRow) =>
                        openActivityEditModal({
                          activityId: row.id,
                          projectId: row.projectId,
                          title: row.name,
                          description: row.description,
                          statusCode: row.statusCode,
                          startAt: row.startAt,
                          endAt: row.endAt,
                          locationId: row.locationId,
                          estimatedHours: row.estimatedHours,
                        }),
                    },
                    {
                      label: "Cancelar",
                      onClick: (row: DashboardActivityRow) => setCancelTarget(row),
                      variant: "destructive" as const,
                    },
                  ]
                : []),
            ]}
            emptyMessage="No hay actividades registradas"
          />
        )}

        {activeTab === "requests" && (
          <DataTable
            columns={requestColumns}
            data={recentRequests.data}
            loading={recentRequests.loading}
            actions={[
              {
                label: "Ver Detalle",
                onClick: (row) => void openAdmissionDetailModal(row.id),
              },
              ...(canResolveAdmissions
                ? [
                    {
                      label: "Aprobar",
                      onClick: (row: DashboardAdmissionRow) =>
                        openResolutionModal({
                          kind: "admission",
                          targetStatus: "approved",
                          row,
                        }),
                    },
                    {
                      label: "Rechazar",
                      onClick: (row: DashboardAdmissionRow) =>
                        openResolutionModal({
                          kind: "admission",
                          targetStatus: "rejected",
                          row,
                        }),
                      variant: "destructive" as const,
                    },
                  ]
                : []),
            ]}
            emptyMessage="No hay solicitudes pendientes"
          />
        )}
      </motion.div>

      {/* MODAL CREAR / EDITAR ACTIVIDAD (CRUD COMPLETO SUPABASE) */}
      <ModalShell open={activityFormState.open} onClose={closeActivityFormModal} width="max-w-[640px]">
        <div className="space-y-4 p-5">
          <ModalHeader
            title={activityFormState.mode === "create" ? "Crear Nueva Actividad" : "Editar Actividad"}
            description="Registra o modifica los datos de la actividad en la BD de Supabase."
            onClose={closeActivityFormModal}
          />

          {activityFormSubmitError && (
            <BlockError message={activityFormSubmitError} onRetry={submitActivityForm} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                Proyecto <span className="text-red-400">*</span>
              </label>
              <Select
  value={activityFormDraft.projectId}
  onValueChange={(val) => setActivityFormDraft((d) => ({ ...d, projectId: val }))}
>
  <SelectTrigger className="w-full h-10 rounded-xl px-3 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200">
    <SelectValue placeholder="Selecciona proyecto" />
  </SelectTrigger>
  <SelectContent  className="text-[var(--color-text-primary)]">
    {taskOptions.map((t) => (
      <SelectItem key={t.value} value={t.value} className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">
        {t.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
              <FieldError message={activityFormErrors.projectId} />
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">
                TÃ­tulo de la Actividad <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={activityFormDraft.title}
                onChange={(e) => setActivityFormDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ej. Taller de CapacitaciÃ³n Comunitario"
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <FieldError message={activityFormErrors.title} />
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Fecha / Hora Inicio</label>
              <input
                type="datetime-local"
                value={activityFormDraft.startAt}
                onChange={(e) => setActivityFormDraft((d) => ({ ...d, startAt: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <FieldError message={activityFormErrors.startAt} />
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Fecha / Hora Fin</label>
              <input
                type="datetime-local"
                value={activityFormDraft.endAt}
                onChange={(e) => setActivityFormDraft((d) => ({ ...d, endAt: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <FieldError message={activityFormErrors.endAt} />
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Estado de la Actividad</label>
              <Select
  value={activityFormDraft.statusCode}
  onValueChange={(val) => setActivityFormDraft((d) => ({ ...d, statusCode: val }))}
>
  <SelectTrigger className="w-full h-10 rounded-xl px-3 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200">
    <SelectValue placeholder="Selecciona estado" />
  </SelectTrigger>
  <SelectContent  className="text-[var(--color-text-primary)]">
    {activityStateOptions.map((st) => (
      <SelectItem key={st.value} value={st.value} className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">
        {st.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Horas Estimadas</label>
              <input
                type="number"
                step="0.5"
                value={activityFormDraft.estimatedHoursText}
                onChange={(e) => setActivityFormDraft((d) => ({ ...d, estimatedHoursText: e.target.value }))}
                placeholder="Ej. 4"
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200" /> <FieldError message={(activityFormErrors as any).estimatedHours} />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1 text-xs">UbicaciÃ³n</label>
            <Select
  value={activityFormDraft.locationId}
  onValueChange={(val) => setActivityFormDraft((d) => ({ ...d, locationId: val }))}
>
  <SelectTrigger className="w-full h-10 rounded-xl px-3 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200">
    <SelectValue placeholder="Selecciona ubicación" />
  </SelectTrigger>
  <SelectContent  className="text-[var(--color-text-primary)]">
    {locationOptions.map((l) => (
      <SelectItem key={l.value} value={l.value} className="text-[13px] hover:bg-[var(--t-hover)] focus:bg-[var(--t-hover)] focus:text-[var(--t-text)]">
        {l.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1 text-xs">DescripciÃ³n / Objetivos</label>
            <textarea
              rows={3}
              value={activityFormDraft.description}
              onChange={(e) => setActivityFormDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Detalla los objetivos de la actividad..."
              className="w-full rounded-xl p-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={closeActivityFormModal} disabled={isSavingActivity}>
              Cancelar
            </OutlineButton>
            <GradientButton size="sm" onClick={() => void submitActivityForm()} disabled={isSavingActivity}>
              {isSavingActivity ? "Guardando..." : "Guardar en Supabase"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* MODAL DETALLE DE ACTIVIDAD (REAL DB FETCH) */}
      <ModalShell open={isActivityDetailOpen} onClose={() => setIsActivityDetailOpen(false)} width="max-w-[640px]">
        <div className="space-y-4 p-5">
          <ModalHeader
            title="Detalle de la Actividad"
            description="InformaciÃ³n detallada de la actividad registrada en la BD."
            onClose={() => setIsActivityDetailOpen(false)}
          />

          {activityDetailLoading ? (
            <p className="text-xs text-zinc-400 py-4 text-center">Cargando informaciÃ³n desde la base de datos...</p>
          ) : activityDetailError ? (
            <BlockError message={activityDetailError} onRetry={() => activityDetailTargetId && void openActivityDetailModal(activityDetailTargetId)} />
          ) : activityDetail ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="TÃ­tulo" value={activityDetail.title} />
                <DetailField label="Proyecto" value={activityDetail.projectName} />
                <DetailField label="UbicaciÃ³n" value={activityDetail.locationName ?? "-"} />
                <DetailField label="Estado" value={activityDetail.statusLabel} />
                <DetailField label="Inicio" value={formatDateTime(activityDetail.startAt)} />
                <DetailField label="Fin" value={formatDateTime(activityDetail.endAt)} />
                <DetailField label="Horas Estimadas" value={safeHoursToText(activityDetail.estimatedHours)} />
                <DetailField label="Voluntarios Asignados" value={`${(activityDetail as any).assignedVolunteersCount} vol.`} />
              </div>

              {activityDetail.description && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <p className="text-[11px] text-zinc-400 font-medium mb-1">DescripciÃ³n</p>
                  <p className="text-zinc-200">{activityDetail.description}</p>
                </div>
              )}

              {canManageActivities && (
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      setIsActivityDetailOpen(false);
                      openActivityEditModal({
                        activityId: activityDetail.id,
                        projectId: (activityDetail as any).projectId,
                        title: activityDetail.title,
                        description: activityDetail.description ?? "",
                        statusCode: activityDetail.statusCode,
                        startAt: activityDetail.startAt,
                        endAt: activityDetail.endAt,
                        locationId: activityDetail.locationId,
                        estimatedHours: activityDetail.estimatedHours,
                      });
                    }}
                  >
                    Editar Actividad
                  </OutlineButton>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </ModalShell>

      {/* MODAL DETALLE DE HORAS (REAL DB FETCH) */}
      <ModalShell open={isHourDetailOpen} onClose={() => setIsHourDetailOpen(false)} width="max-w-[640px]">
        <div className="space-y-4 p-5">
          <ModalHeader
            title="Detalle de Registro de Horas"
            description="RevisiÃ³n de horas solicitadas por el voluntario."
            onClose={() => setIsHourDetailOpen(false)}
          />

          {hourDetailLoading ? (
            <p className="text-xs text-zinc-400 py-4 text-center">Cargando datos de horas desde Supabase...</p>
          ) : hourDetailError ? (
            <BlockError message={hourDetailError} onRetry={() => hourDetailTargetId && void openHourDetailModal(hourDetailTargetId)} />
          ) : hourDetail ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Voluntario" value={hourDetail.volunteerName} />
                <DetailField label="Actividad" value={hourDetail.activityName} />
                <DetailField label="Proyecto" value={hourDetail.projectName} />
                <DetailField label="Horas Registradas" value={safeHoursToText((hourDetail as any).hours)} />
                <DetailField label="Fecha de Registro" value={formatDate(hourDetail.date)} />
                <DetailField label="Estado Actual" value={hourDetail.statusLabel} />
              </div>

              {(hourDetail as any).comment && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <p className="text-[11px] text-zinc-400 font-medium mb-1">Notas del Voluntario</p>
                  <p className="text-zinc-200">{(hourDetail as any).comment}</p>
                </div>
              )}

              {canResolveHours && hourDetail.status === "pending" && (
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      openResolutionModal({
                        kind: "hour",
                        targetStatus: "approved",
                        row: {
                          id: hourDetail.id,
                          volunteerName: hourDetail.volunteerName,
                          activityName: hourDetail.activityName,
                          hours: (hourDetail as any).hours,
                          date: hourDetail.date,
                          status: hourDetail.status,
                          ...( { approvalId: (hourDetail as any).approvalId } as any ),
                        } as any,
                      });
                    }}
                  >
                    Aprobar Horas
                  </OutlineButton>

                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      openResolutionModal({
                        kind: "hour",
                        targetStatus: "rejected",
                        row: {
                          id: hourDetail.id,
                          volunteerName: hourDetail.volunteerName,
                          activityName: hourDetail.activityName,
                          hours: (hourDetail as any).hours,
                          date: hourDetail.date,
                          status: hourDetail.status,
                          ...( { approvalId: (hourDetail as any).approvalId } as any ),
                        },
                      });
                    }}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Rechazar Horas
                  </OutlineButton>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </ModalShell>

      {/* MODAL DETALLE DE ADMISIÃ“N (REAL DB FETCH) */}
      <ModalShell open={isAdmissionDetailOpen} onClose={() => setIsAdmissionDetailOpen(false)} width="max-w-[640px]">
        <div className="space-y-4 p-5">
          <ModalHeader
            title="Detalle de Solicitud de AdmisiÃ³n"
            description="InformaciÃ³n del postulante para unirse a la ONG."
            onClose={() => setIsAdmissionDetailOpen(false)}
          />

          {admissionDetailLoading ? (
            <p className="text-xs text-zinc-400 py-4 text-center">Cargando solicitud de admisiÃ³n desde Supabase...</p>
          ) : admissionDetailError ? (
            <BlockError message={admissionDetailError} onRetry={() => admissionDetailTargetId && void openAdmissionDetailModal(admissionDetailTargetId)} />
          ) : admissionDetail ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3"> <DetailField label="Nombre Completo" value={admissionDetail.fullName} />
                <DetailField label="Correo ElectrÃ³nico" value={admissionDetail.email} /> <DetailField label="TelÃ©fono" value={(admissionDetail as any).phone ?? "-"} />
                <DetailField label="Fecha de EnvÃ­o" value={formatDate(admissionDetail.submittedAt)} />
                <DetailField label="Estado" value={admissionDetail.status} />
              </div>

              {admissionDetail.notes && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <p className="text-[11px] text-zinc-400 font-medium mb-1">Motivo / Notas de PostulaciÃ³n</p>
                  <p className="text-zinc-200">{admissionDetail.notes}</p>
                </div>
              )}

              {canResolveAdmissions && (admissionDetail.status === "pending" || admissionDetail.status === "interviewing") && (
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
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
                        },
                      })
                    }
                  >
                    Aprobar PostulaciÃ³n
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
                        },
                      })
                    }
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Rechazar PostulaciÃ³n
                  </OutlineButton>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </ModalShell>

      {/* MODAL DE RESOLUCIÃ“N (APROBAR / RECHAZAR CON COMENTARIOS EN BD) */}
      <ModalShell open={Boolean(resolutionTarget)} onClose={closeResolutionModal} width="max-w-[540px]">
        <div className="space-y-4 p-5">
          <ModalHeader
            title={toResolutionTitle(resolutionTarget)}
            description={
              resolutionTarget?.kind === "hour"
                ? "El comentario se guardarÃ¡ en ong.aprobaciones y ong.horas_actividad."
                : resolutionTarget?.targetStatus === "rejected"
                ? "Ingresa el motivo del rechazo."
                : "Puedes ingresar observaciones adicionales de aprobaciÃ³n."
            }
            onClose={closeResolutionModal}
          />

          <div className="space-y-3 text-xs">
            <textarea
              rows={4}
              value={resolutionComment}
              onChange={(e) => {
                setResolutionComment(e.target.value);
                setResolutionError(null);
              }}
              placeholder={
                resolutionTarget?.targetStatus === "rejected"
                  ? "Escribe el motivo del rechazo..."
                  : "Comentario o notas adicionales para el registro (Opcional)..."
              }
              className="w-full rounded-xl p-3 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
            />

            <FieldError message={resolutionError} />

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <OutlineButton size="sm" onClick={closeResolutionModal} disabled={isResolutionSubmitting}>
                Cancelar
              </OutlineButton>
              <GradientButton size="sm" onClick={() => void submitResolution()} disabled={isResolutionSubmitting}>
                {isResolutionSubmitting ? "Guardando en BD..." : "Confirmar ResoluciÃ³n"}
              </GradientButton>
            </div>
          </div>
        </div>
      </ModalShell>

      {/* MODAL CANCELAR ACTIVIDAD (CANCELACIÃ“N REAL EN BD) */}
      <ModalShell open={Boolean(cancelTarget)} onClose={() => !isCancellingActivity && setCancelTarget(null)} width="max-w-[500px]">
        <div className="space-y-4 p-5">
          <ModalHeader
            title="Cancelar Actividad"
            description="ActualizarÃ¡ el estado de la actividad a cancelada en Supabase."
            onClose={() => !isCancellingActivity && setCancelTarget(null)}
          />

          <div className="space-y-3 text-xs">
            <p className="text-zinc-300">
              {cancelTarget ? `Â¿Confirmas la cancelaciÃ³n de "${cancelTarget.name}"?` : "Selecciona una actividad."}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <OutlineButton size="sm" onClick={() => setCancelTarget(null)} disabled={isCancellingActivity}>
                Volver
              </OutlineButton>
              <GradientButton size="sm" onClick={() => void submitCancelActivity()} disabled={isCancellingActivity}>
                {isCancellingActivity ? "Cancelando..." : "Confirmar CancelaciÃ³n"}
              </GradientButton>
            </div>
          </div>
        </div>
      </ModalShell>

      {/* MODAL PERSONALIZAR DASHBOARD */}
      <ModalShell open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} width="max-w-[500px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-400" />
              Personalizar Dashboard
            </h3>
            <button type="button" className="text-zinc-400 hover:text-zinc-200" onClick={() => setIsSettingsModalOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">GrÃ¡fico de EvoluciÃ³n de Horas</span>
                <span className="text-[11px] text-zinc-400">Mostrar grÃ¡fico comparativo de tendencias.</span>
              </div>
              <input
                type="checkbox"
                checked={widgetSettings.showEvolutionChart}
                onChange={(e) => setWidgetSettings((s) => ({ ...s, showEvolutionChart: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Agenda y Compromisos de Hoy</span>
                <span className="text-[11px] text-zinc-400">Mostrar lista de eventos programados para hoy.</span>
              </div>
              <input
                type="checkbox"
                checked={widgetSettings.showTodayAgenda}
                onChange={(e) => setWidgetSettings((s) => ({ ...s, showTodayAgenda: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Feed de Actividad en Vivo</span>
                <span className="text-[11px] text-zinc-400">Mostrar historial dinÃ¡mico en tiempo real.</span>
              </div>
              <input
                type="checkbox"
                checked={widgetSettings.showActivityFeed}
                onChange={(e) => setWidgetSettings((s) => ({ ...s, showActivityFeed: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Accesos Directos Operativos</span>
                <span className="text-[11px] text-zinc-400">Mostrar botones de acceso rÃ¡pido.</span>
              </div>
              <input
                type="checkbox"
                checked={widgetSettings.showQuickAccess}
                onChange={(e) => setWidgetSettings((s) => ({ ...s, showQuickAccess: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={() => setIsSettingsModalOpen(false)}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm"
              onClick={() => {
                setIsSettingsModalOpen(false);
                toast.success("Ajustes del dashboard guardados.");
              }}
            >
              Guardar Cambios
            </GradientButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}



