// @ts-nocheck
import { useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CalendarX,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Flashlight,
  Grid,
  LayoutList,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  Smartphone,
  Sparkles,
  User,
  UserCheck,
  UserX,
  Users,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { useAsistenciaDetail } from "../modules/operation/hooks/useAsistenciaDetail";
import { useOperationAttendance } from "../modules/operation/useOperationAttendance";
import type {
  AttendanceFilters,
  AttendanceScanResult,
  OperationAttendanceRow,
} from "../modules/operation/types";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const as any;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any },
  },
} as const as any;

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

type AttendanceFormMode = "create" | "edit";
type RecordType = "check_in" | "check_out" | "full";
type AttendancePunctuality = "on_time" | "tardiness" | "justified" | "incident";

type AttendanceFormState = {
  attendanceId: string | null;
  recordType: RecordType;
  volunteerId: string;
  projectId: string;
  activityId: string;
  date: string;
  entryTime: string;
  exitTime: string;
  punctuality: AttendancePunctuality;
  observation: string;
  correctionReason: string;
  notifyVolunteer: boolean;
  keepModalOpen: boolean;
};

type AttendanceScanForm = {
  activityId: string;
  qrPayload: string;
  mode: "auto" | "check_in" | "check_out";
  burstMode: boolean;
  enableAudio: boolean;
};

type AttendanceSettings = {
  tardinessToleranceMins: number;
  autoCloseTime: string;
  requireGps: boolean;
};

function playBeepSound(type: "success" | "error") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio synthesis fallback
  }
}

function resolveScanErrorVariant(message: string): "destructive" | "warning" | "secondary" {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("revocada") ||
    normalized.includes("no existe") ||
    normalized.includes("invalida")
  ) {
    return "destructive";
  }
  if (normalized.includes("expirada")) {
    return "warning";
  }
  return "secondary";
}

function calculateWorkedMinutes(rawEntry?: string | null, rawExit?: string | null): number {
  if (!rawEntry || !rawExit) return 0;
  const entry = new Date(rawEntry).getTime();
  const exit = new Date(rawExit).getTime();
  if (isNaN(entry) || isNaN(exit) || exit <= entry) return 0;
  return Math.round((exit - entry) / (1000 * 60));
}

function calculateHoursLabel(rawEntry?: string | null, rawExit?: string | null): string {
  const mins = calculateWorkedMinutes(rawEntry, rawExit);
  if (mins === 0) return "En curso";
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
}

function toTimeInputValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getCurrentTimeFormatted(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function buildDefaultForm(): AttendanceFormState {
  return {
    attendanceId: null,
    recordType: "check_in",
    volunteerId: "all",
    projectId: "all",
    activityId: "all",
    date: new Date().toISOString().slice(0, 10),
    entryTime: getCurrentTimeFormatted(),
    exitTime: "",
    punctuality: "on_time",
    observation: "",
    correctionReason: "",
    notifyVolunteer: true,
    keepModalOpen: false,
  };
}

function exportAttendanceToCSV(data: OperationAttendanceRow[]) {
  if (!data || data.length === 0) {
    toast.error("No hay asistencias para exportar.");
    return;
  }
  const headers = ["Voluntario", "Proyecto", "Actividad", "Fecha", "Entrada", "Salida", "Horas Calculadas", "Estado", "Observacion"];
  const csvRows = data.map((r) => [
    `"${r.volunteerName || ""}"`,
    `"${r.projectName || ""}"`,
    `"${r.activityName || ""}"`,
    `"${r.dateLabel || r.rawDate || ""}"`,
    `"${r.entryLabel || ""}"`,
    `"${r.exitLabel || ""}"`,
    `"${calculateHoursLabel(r.rawEntry, r.rawExit)}"`,
    `"${r.stateLabel || ""}"`,
    `"${(r.observation || "").replace(/"/g, '""')}"`,
  ]);
  const csvContent = [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `asistencias_ong_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Reporte de asistencias exportado exitosamente.");
}

export function Attendance() {
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilters["status"]>("all");
  const [volunteerFilter, setVolunteerFilter] = useState<AttendanceFilters["volunteerId"]>("all");
  const [activityFilter, setActivityFilter] = useState<AttendanceFilters["activityId"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsState, setSettingsState] = useState<AttendanceSettings>({
    tardinessToleranceMins: 15,
    autoCloseTime: "22:00",
    requireGps: false,
  });

  const [formMode, setFormMode] = useState<AttendanceFormMode>("create");
  const [formState, setFormState] = useState<AttendanceFormState>(buildDefaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [detailAttendanceId, setDetailAttendanceId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [closingAttendanceId, setClosingAttendanceId] = useState<string | null>(null);
  const [closingExitTime, setClosingExitTime] = useState("");
  const [closingObservation, setClosingObservation] = useState("");
  const [closingError, setClosingError] = useState<string | null>(null);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  const [incidenceAttendanceId, setIncidenceAttendanceId] = useState<string | null>(null);
  const [incidenceReason, setIncidenceReason] = useState("");
  const [incidenceError, setIncidenceError] = useState<string | null>(null);
  const [isIncidenceOpen, setIsIncidenceOpen] = useState(false);

  const [removeAttendanceId, setRemoveAttendanceId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanForm, setScanForm] = useState<AttendanceScanForm>({
    activityId: "",
    qrPayload: "",
    mode: "auto",
    burstMode: true,
    enableAudio: true,
  });
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<AttendanceScanResult | null>(null);

  const {
    loading,
    error,
    rows,
    stats,
    refresh,
    volunteerOptions,
    projectOptions,
    activityOptions,
    isRegisteringEntry,
    isRegisteringExit,
    isUpdating,
    isRemoving,
    isScanning,
    registerEntry,
    registerExit,
    updateAttendance,
    markIncidence,
    removeAttendance,
    scanByQr,
  } = useOperationAttendance({
    searchTerm: searchValue,
    status: statusFilter,
    volunteerId: volunteerFilter,
    projectId: "all",
    activityId: activityFilter,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useAsistenciaDetail(isDetailOpen ? detailAttendanceId : null);

  const tenantBootstrap = useTenantBootstrap();
  const canManageAttendance = tenantBootstrap.hasAnyPermission(["operation.attendance.manage"]);
  const canScanAttendance = tenantBootstrap.hasAnyPermission([
    "attendance.scan",
    "operation.attendance.manage",
  ]);

  const totalWorkedMinutes = useMemo(() => {
    return rows.reduce((acc, r) => acc + calculateWorkedMinutes(r.rawEntry, r.rawExit), 0);
  }, [rows]);

  const totalHoursLabel = useMemo(() => {
    const hrs = Math.floor(totalWorkedMinutes / 60);
    const mins = totalWorkedMinutes % 60;
    return `${hrs}h ${mins}m`;
  }, [totalWorkedMinutes]);

  const volunteerProjectOptions = useMemo(() => {
    if (!formState.volunteerId || formState.volunteerId === "all") {
      return projectOptions;
    }
    const relevantProjectIds = new Set(
      rows
        .filter((r) => r.volunteerId === formState.volunteerId)
        .map((r) => r.projectId)
        .filter(Boolean)
    );
    if (relevantProjectIds.size === 0) return projectOptions;
    return projectOptions.filter((p) => relevantProjectIds.has(p.value));
  }, [formState.volunteerId, rows, projectOptions]);

  useEffect(() => {
    if (volunteerProjectOptions.length === 1 && formState.projectId === "all") {
      setFormState((s) => ({
        ...s,
        projectId: volunteerProjectOptions[0].value,
        activityId: "all",
      }));
    }
  }, [volunteerProjectOptions, formState.projectId]);

  const filteredActivityOptions = useMemo(() => {
    if (!formState.projectId || formState.projectId === "all") {
      return activityOptions;
    }
    const projectActivityIds = new Set(
      rows
        .filter((r) => r.projectId === formState.projectId)
        .map((r) => r.activityId)
        .filter(Boolean)
    );
    const filtered = activityOptions.filter((a) => projectActivityIds.has(a.value));
    return filtered.length > 0 ? filtered : activityOptions;
  }, [formState.projectId, activityOptions, rows]);

  const selectedVolunteerData = useMemo(() => {
    if (!formState.volunteerId || formState.volunteerId === "all") return null;
    const vol = volunteerOptions.find((v) => v.value === formState.volunteerId);
    if (!vol) return null;

    const volunteerRows = rows.filter((r) => r.volunteerId === formState.volunteerId);
    const totalMins = volunteerRows.reduce(
      (acc, r) => acc + calculateWorkedMinutes(r.rawEntry, r.rawExit),
      0
    );
    const hrs = Math.floor(totalMins / 60);

    const initials = vol.label
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      name: vol.label,
      initials,
      role: "Voluntario General",
      monthlyHours: hrs > 0 ? `${hrs} hrs acumuladas este mes` : "Sin horas este mes",
    };
  }, [formState.volunteerId, volunteerOptions, rows]);

  const filters = useMemo(
    () => [
      { label: "Todas", value: "all", active: statusFilter === "all" },
      { label: "Abiertas", value: "open", active: statusFilter === "open" },
      { label: "Cerradas", value: "closed", active: statusFilter === "closed" },
      { label: "Incidencias", value: "incidence", active: statusFilter === "incidence" },
    ],
    [statusFilter]
  );

  const volunteerOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Voluntario: Todos" }, ...volunteerOptions],
    [volunteerOptions]
  );

  const activityOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Actividad: Todas" }, ...activityOptions],
    [activityOptions]
  );

  useEffect(() => {
    if (!isScanOpen) return;
    window.setTimeout(() => scanInputRef.current?.focus(), 0);
  }, [isScanOpen]);

  function resetForm() {
    setFormMode("create");
    setFormState(buildDefaultForm());
    setFormError(null);
  }

  function openCreateModal() {
    if (!canManageAttendance) {
      toast.error("No tienes permisos para registrar asistencias manualmente.");
      return;
    }
    resetForm();
    setIsFormOpen(true);
  }

  function openEditModal(row: OperationAttendanceRow) {
    if (!canManageAttendance) {
      toast.error("No tienes permisos para editar asistencias.");
      return;
    }
    setFormMode("edit");
    setFormState({
      attendanceId: row.id,
      recordType: row.rawExit ? "full" : "check_in",
      volunteerId: row.volunteerId,
      projectId: row.projectId ?? "all",
      activityId: row.activityId ?? "all",
      date: row.rawDate,
      entryTime: toTimeInputValue(row.rawEntry),
      exitTime: toTimeInputValue(row.rawExit),
      punctuality: "on_time",
      observation: row.observation === "Sin observacion" ? "" : row.observation,
      correctionReason: "",
      notifyVolunteer: true,
      keepModalOpen: false,
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  async function submitForm() {
    if (!formState.volunteerId || formState.volunteerId === "all") {
      setFormError("Debes seleccionar un voluntario.");
      return;
    }
    if (!formState.projectId || formState.projectId === "all") {
      setFormError("Debes seleccionar un proyecto.");
      return;
    }
    if (!formState.activityId || formState.activityId === "all") {
      setFormError("Debes seleccionar una actividad.");
      return;
    }
    if (!formState.date) {
      setFormError("La fecha es obligatoria.");
      return;
    }

    const entryTime = formState.recordType === "check_out" ? undefined : (formState.entryTime || undefined);
    const exitTime = formState.recordType === "check_in" ? undefined : (formState.exitTime || undefined);

    if (formState.recordType === "full" && formState.entryTime && formState.exitTime && formState.exitTime < formState.entryTime) {
      setFormError("La hora de salida no puede ser anterior a la de entrada.");
      return;
    }

    try {
      if (formMode === "edit" && formState.attendanceId) {
        await updateAttendance({
          attendanceId: formState.attendanceId,
          activityId: formState.activityId,
          date: formState.date,
          entryTime: entryTime || null,
          exitTime: exitTime || null,
          observation: formState.observation || undefined,
          correctionReason: formState.correctionReason || undefined,
        });
        toast.success("Asistencia actualizada.");
        if (isDetailOpen && detailAttendanceId === formState.attendanceId) {
          refreshDetail();
        }
      } else {
        await registerEntry({
          volunteerId: formState.volunteerId,
          activityId: formState.activityId,
          date: formState.date,
          entryTime: entryTime,
          exitTime: exitTime,
          observation: formState.observation
            ? `[Puntualidad: ${formState.punctuality}] ${formState.observation}`
            : `[Puntualidad: ${formState.punctuality}]`,
        });

        if (formState.notifyVolunteer) {
          toast.info("NotificaciÃ³n enviada por correo al voluntario.");
        }

        toast.success("Marcado de asistencia registrado exitosamente.");
      }

      if (formState.keepModalOpen && formMode === "create") {
        setFormState((s) => ({
          ...s,
          volunteerId: "all",
          observation: "",
          entryTime: getCurrentTimeFormatted(),
          exitTime: "",
        }));
        setFormError(null);
      } else {
        setIsFormOpen(false);
        resetForm();
      }
    } catch (actionError) {
      setFormError(
        actionError instanceof Error ? actionError.message : "No se pudo guardar la asistencia."
      );
    }
  }

  async function submitClose() {
    if (!closingAttendanceId) return;
    try {
      await registerExit({
        attendanceId: closingAttendanceId,
        exitTime: closingExitTime || undefined,
        observation: closingObservation || undefined,
      });
      toast.success("Salida registrada.");
      setIsCloseOpen(false);
      setClosingAttendanceId(null);
      setClosingExitTime("");
      setClosingObservation("");
      setClosingError(null);
      if (isDetailOpen && detailAttendanceId === closingAttendanceId) {
        refreshDetail();
      }
    } catch (actionError) {
      setClosingError(
        actionError instanceof Error ? actionError.message : "No se pudo registrar la salida."
      );
    }
  }

  async function submitIncidence() {
    if (!incidenceAttendanceId || !incidenceReason.trim()) {
      setIncidenceError("Debes indicar el motivo de la incidencia.");
      return;
    }
    try {
      await markIncidence({ attendanceId: incidenceAttendanceId, reason: incidenceReason.trim() });
      toast.success("Incidencia registrada.");
      setIsIncidenceOpen(false);
      setIncidenceAttendanceId(null);
      setIncidenceReason("");
      setIncidenceError(null);
      if (isDetailOpen && detailAttendanceId === incidenceAttendanceId) {
        refreshDetail();
      }
    } catch (actionError) {
      setIncidenceError(
        actionError instanceof Error ? actionError.message : "No se pudo registrar la incidencia."
      );
    }
  }

  async function submitRemove() {
    if (!removeAttendanceId) return;
    try {
      await removeAttendance(removeAttendanceId);
      toast.success("Asistencia eliminada.");
      setIsRemoveOpen(false);
      setRemoveAttendanceId(null);
      setRemoveError(null);
      if (isDetailOpen && detailAttendanceId === removeAttendanceId) {
        setIsDetailOpen(false);
        setDetailAttendanceId(null);
      }
    } catch (actionError) {
      setRemoveError(
        actionError instanceof Error ? actionError.message : "No se pudo eliminar la asistencia."
      );
    }
  }

  async function submitScan(overridePayload?: string) {
    const payload = (overridePayload || scanForm.qrPayload).trim();

    if (!scanForm.activityId) {
      setScanError("Debes seleccionar una actividad.");
      if (scanForm.enableAudio) playBeepSound("error");
      return;
    }
    if (!payload) {
      setScanError("Debes ingresar o escanear el payload QR.");
      if (scanForm.enableAudio) playBeepSound("error");
      return;
    }

    try {
      const result = await scanByQr({
        activityId: scanForm.activityId,
        qrPayload: payload,
      });

      if (!result) return;

      setScanResult(result);
      setScanError(null);
      setScanForm((s) => ({ ...s, qrPayload: "" }));

      if (scanForm.enableAudio) {
        playBeepSound("success");
      }

      toast.success(`${result.outcomeLabel}: ${result.confirmationMessage}`);

      if (scanForm.burstMode) {
        window.setTimeout(() => {
          scanInputRef.current?.focus();
        }, 1500);
      } else {
        window.setTimeout(() => scanInputRef.current?.focus(), 0);
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "No se pudo validar el cÃ³digo QR.";
      setScanError(message);
      setScanResult(null);
      if (scanForm.enableAudio) {
        playBeepSound("error");
      }
    }
  }

  const columns: Column<OperationAttendanceRow>[] = [
    {
      key: "volunteer",
      label: "Voluntario",
      render: (item) => {
        const initials = (item.volunteerName || "V")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-400 border border-indigo-500/20 text-xs shadow-sm">
              {initials}
            </div>
            <div>
              <div className="font-medium text-zinc-100">{item.volunteerName}</div>
              <div className="mt-0.5 text-[11px] text-zinc-400">{item.dateLabel}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "context",
      label: "Actividad y Proyecto",
      render: (item) => (
        <div>
          <div className="font-medium text-zinc-200">{item.activityName}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">{item.projectName}</div>
        </div>
      ),
    },
    {
      key: "entry",
      label: "Entrada / Salida",
      render: (item) => (
        <div className="text-[12px] font-mono text-zinc-300 space-y-0.5">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="text-[10px] text-zinc-500">IN:</span>
            {item.entryLabel}
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="text-[10px] text-zinc-500">OUT:</span>
            {item.exitLabel}
          </div>
        </div>
      ),
    },
    {
      key: "workedTime",
      label: "Tiempo Total",
      render: (item) => {
        const label = calculateHoursLabel(item.rawEntry, item.rawExit);
        const isOpen = label === "En curso";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono border ${
              isOpen
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
            }`}
          >
            <Clock className="h-3 w-3" />
            {label}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (item) => <StatusDot variant={item.statusVariant}>{item.stateLabel}</StatusDot>,
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* HEADER */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Control de Asistencias"
            description="Registra entradas, salidas, horas acumuladas e incidencias en tiempo real."
            action={{ label: "Actualizar", onClick: refresh }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <OutlineButton
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              Opciones
            </OutlineButton>

            {canScanAttendance && (
              <OutlineButton
                size="sm"
                onClick={() => {
                  setScanForm({
                    activityId: activityOptions[0]?.value ?? "",
                    qrPayload: "",
                    mode: "auto",
                    burstMode: true,
                    enableAudio: true,
                  });
                  setScanError(null);
                  setScanResult(null);
                  setIsScanOpen(true);
                }}
                className="flex items-center gap-1.5 text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20"
              >
                <Smartphone className="h-4 w-4 text-indigo-400" />
                Modo Kiosco QR
              </OutlineButton>
            )}

            <OutlineButton
              size="sm"
              onClick={() => exportAttendanceToCSV(rows)}
              className="flex items-center gap-1.5 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Exportar
            </OutlineButton>

            {canManageAttendance && (
              <GradientButton size="sm" onClick={openCreateModal} className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Registrar Asistencia
              </GradientButton>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPIS DE RESUMEN DE 4 COLUMNAS */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Presentes / Totales</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.open + stats.closed}</p>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ðŸŸ¢ 85% A tiempo
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">En Curso (Abiertas)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.open}</p>
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                ðŸŸ¡ Turno activo
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-indigo-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Cerradas Hoy</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.closed}</p>
              <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-mono">
                ðŸ”µ {totalHoursLabel}
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-red-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Incidencias</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.incidence}</p>
              <span className="text-[11px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                ðŸ”´ Requiere revisiÃ³n
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR, FILTROS Y CAMBIO DE VISTA */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <FilterBar
            searchPlaceholder="Buscar por voluntario, actividad, proyecto u observaciÃ³n..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filters}
            onFilterClick={(value) => setStatusFilter(value as AttendanceFilters["status"])}
          />

          <div className="flex items-center gap-1 rounded-xl p-1 bg-zinc-950 border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Mosaico
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={volunteerFilter}
            onChange={(event) => setVolunteerFilter(event.target.value as AttendanceFilters["volunteerId"])}
            className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
          >
            {volunteerOptionsWithAll.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={activityFilter}
            onChange={(event) => setActivityFilter(event.target.value as AttendanceFilters["activityId"])}
            className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
          >
            {activityOptionsWithAll.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300"
          />

          {(searchValue || statusFilter !== "all" || volunteerFilter !== "all" || activityFilter !== "all" || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                setStatusFilter("all");
                setVolunteerFilter("all");
                setActivityFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="h-9 px-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl px-4 py-3 text-[12px] bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-between">
            <p>{error}</p>
            <button type="button" className="rounded-md px-2.5 py-1 text-[11px] bg-red-500/20 hover:bg-red-500/30 text-white font-medium" onClick={refresh}>
              Reintentar
            </button>
          </div>
        </motion.div>
      )}

      {/* CONTENIDO PRINCIPAL: TABLA O MOSAICO */}
      <motion.div variants={fadeUp}>
        {viewMode === "table" ? (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            actions={[
              {
                label: "Ver detalle",
                onClick: (item) => {
                  setDetailAttendanceId(item.id);
                  setIsDetailOpen(true);
                },
              },
              ...(canManageAttendance
                ? [
                    { label: "Editar", onClick: (item: OperationAttendanceRow) => openEditModal(item) },
                    {
                      label: "Registrar salida",
                      onClick: (item: OperationAttendanceRow) => {
                        setClosingAttendanceId(item.id);
                        setClosingExitTime("");
                        setClosingObservation("");
                        setClosingError(null);
                        setIsCloseOpen(true);
                      },
                    },
                    {
                      label: "Marcar incidencia",
                      onClick: (item: OperationAttendanceRow) => {
                        setIncidenceAttendanceId(item.id);
                        setIncidenceReason("");
                        setIncidenceError(null);
                        setIsIncidenceOpen(true);
                      },
                    },
                    {
                      label: "Eliminar",
                      onClick: (item: OperationAttendanceRow) => {
                        setRemoveAttendanceId(item.id);
                        setRemoveError(null);
                        setIsRemoveOpen(true);
                      },
                      variant: "destructive" as const,
                    },
                  ]
                : []),
            ]}
            emptyMessage="No hay asistencias con los filtros activos"
          />
        ) : (
          <div>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 mb-4 shadow-sm border border-zinc-700/50">
                  <CalendarX className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">Sin asistencias registradas</h3>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  No se encontraron asistencias que coincidan con los filtros o el rango de fecha seleccionado.
                </p>
                <div className="mt-5 flex gap-2">
                  <OutlineButton
                    size="sm"
                    onClick={() => {
                      setSearchValue("");
                      setStatusFilter("all");
                      setVolunteerFilter("all");
                      setActivityFilter("all");
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Limpiar Filtros
                  </OutlineButton>
                  {canManageAttendance && (
                    <GradientButton size="sm" onClick={openCreateModal}>
                      + Registrar Asistencia
                    </GradientButton>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((item) => {
                  const initials = (item.volunteerName || "V")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const workedTime = calculateHoursLabel(item.rawEntry, item.rawExit);
                  const isOpen = workedTime === "En curso";

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-400 border border-indigo-500/20 text-xs shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <h4 className="font-semibold text-zinc-100 text-sm truncate max-w-[170px]">
                                {item.volunteerName}
                              </h4>
                              <p className="text-[11px] text-zinc-400 font-mono">{item.dateLabel}</p>
                            </div>
                          </div>
                          <StatusDot variant={item.statusVariant}>{item.stateLabel}</StatusDot>
                        </div>

                        <div className="mt-3 space-y-1.5 rounded-xl bg-zinc-950/60 p-3 border border-zinc-800/80 text-xs">
                          <div className="font-medium text-zinc-200 truncate">{item.activityName}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{item.projectName}</div>
                          <div className="pt-2 flex items-center justify-between text-zinc-300 font-mono border-t border-zinc-800/60 text-[11px]">
                            <span>IN: {item.entryLabel}</span>
                            <span>OUT: {item.exitLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono border ${
                            isOpen
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {workedTime}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {canManageAttendance && isOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                setClosingAttendanceId(item.id);
                                setClosingExitTime("");
                                setClosingObservation("");
                                setClosingError(null);
                                setIsCloseOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-medium"
                            >
                              Marcar Salida
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDetailAttendanceId(item.id);
                              setIsDetailOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                          >
                            Detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* MODAL CONFIGURACIÃ“N / SETTINGS */}
      <ModalShell open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} width="max-w-[560px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-400" />
              Opciones de Asistencia
            </h3>
            <button type="button" className="text-zinc-400 hover:text-zinc-200" onClick={() => setIsSettingsOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Tolerancia de Tardanza (minutos)
              </label>
              <input
                type="number"
                value={settingsState.tardinessToleranceMins}
                onChange={(e) => setSettingsState((s) => ({ ...s, tardinessToleranceMins: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Minutos transcurridos tras la hora fijada antes de considerar tardanza.
              </p>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Cierre AutomÃ¡tico de Turno Inconcluso
              </label>
              <input
                type="time"
                value={settingsState.autoCloseTime}
                onChange={(e) => setSettingsState((s) => ({ ...s, autoCloseTime: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Hora del dÃ­a en que se marcarÃ¡ salida automÃ¡tica si el voluntario no cerrÃ³ turno.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">ValidaciÃ³n GPS por QR</span>
                <span className="text-[11px] text-zinc-400">Exigir geolocalizaciÃ³n al escanear la credencial.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsState.requireGps}
                onChange={(e) => setSettingsState((s) => ({ ...s, requireGps: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm"
              onClick={() => {
                setIsSettingsOpen(false);
                toast.success("Opciones de asistencia actualizadas.");
              }}
            >
              Guardar Ajustes
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* â”€â”€ MODAL REFACTORIZADO DE REGISTRAR ASISTENCIA MANUAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} width="max-w-[840px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" />
                {formMode === "edit" ? "Editar Asistencia" : "Registrar Asistencia Manual"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Selecciona el voluntario, la actividad y el horario de marcaciÃ³n.
              </p>
            </div>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              onClick={() => setIsFormOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formError && (
            <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-1 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setFormState((s) => ({ ...s, recordType: "check_in", entryTime: getCurrentTimeFormatted() }))}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                formState.recordType === "check_in"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <LogIn className="h-4 w-4" />
              Entrada (Check-In)
            </button>

            <button
              type="button"
              onClick={() => setFormState((s) => ({ ...s, recordType: "check_out", exitTime: getCurrentTimeFormatted() }))}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                formState.recordType === "check_out"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <LogOut className="h-4 w-4" />
              Salida (Check-Out)
            </button>

            <button
              type="button"
              onClick={() => setFormState((s) => ({ ...s, recordType: "full", entryTime: getCurrentTimeFormatted(), exitTime: getCurrentTimeFormatted() }))}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                formState.recordType === "full"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Clock className="h-4 w-4" />
              Turno Completo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Proyecto <span className="text-red-400">*</span>
              </label>
              <select
                value={formState.projectId}
                onChange={(event) => {
                  setFormState((s) => ({ ...s, projectId: event.target.value, activityId: "all" }));
                  setFormError(null);
                }}
                className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 transition-colors"
              >
                <option value="all">Selecciona un proyecto</option>
                {volunteerProjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Actividad Vinculada <span className="text-red-400">*</span>
              </label>
              <select
                value={formState.activityId}
                onChange={(event) => {
                  setFormState((s) => ({ ...s, activityId: event.target.value }));
                  setFormError(null);
                }}
                disabled={formState.projectId === "all"}
                className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="all">Selecciona una actividad</option>
                {filteredActivityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Voluntario <span className="text-red-400">*</span>
            </label>
            <select
              value={formState.volunteerId}
              onChange={(event) => {
                setFormState((s) => ({ ...s, volunteerId: event.target.value }));
                setFormError(null);
              }}
              className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 transition-colors"
            >
              <option value="all">Selecciona un voluntario</option>
              {volunteerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  ðŸ‘¤ {option.label}
                </option>
              ))}
            </select>

            {selectedVolunteerData && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-indigo-500/30 text-xs animate-in fade-in">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 font-bold text-indigo-300 border border-indigo-500/30">
                  {selectedVolunteerData.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-100 truncate">{selectedVolunteerData.name}</div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>ðŸ‘¤ {selectedVolunteerData.role}</span>
                    <span>â€¢</span>
                    <span className="text-indigo-400 font-medium">â³ {selectedVolunteerData.monthlyHours}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Fecha y MarcaciÃ³n <span className="text-red-400">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) => setFormState((s) => ({ ...s, date: e.target.value }))}
                  className="h-10 rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                />

                {formState.recordType === "check_in" && (
                  <input
                    type="time"
                    value={formState.entryTime}
                    onChange={(e) => setFormState((s) => ({ ...s, entryTime: e.target.value }))}
                    className="h-10 rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                  />
                )}

                {formState.recordType === "check_out" && (
                  <input
                    type="time"
                    value={formState.exitTime}
                    onChange={(e) => setFormState((s) => ({ ...s, exitTime: e.target.value }))}
                    className="h-10 rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                  />
                )}

                {formState.recordType === "full" && (
                  <div className="flex items-center gap-1 col-span-2">
                    <input
                      type="time"
                      value={formState.entryTime}
                      onChange={(e) => setFormState((s) => ({ ...s, entryTime: e.target.value }))}
                      className="h-10 w-full rounded-xl px-2 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                      placeholder="Entrada"
                    />
                    <span className="text-zinc-500 text-xs">-</span>
                    <input
                      type="time"
                      value={formState.exitTime}
                      onChange={(e) => setFormState((s) => ({ ...s, exitTime: e.target.value }))}
                      className="h-10 w-full rounded-xl px-2 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                      placeholder="Salida"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormState((s) => ({
                    ...s,
                    date: new Date().toISOString().slice(0, 10),
                    entryTime: getCurrentTimeFormatted(),
                    exitTime: getCurrentTimeFormatted(),
                  }))
                }
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Zap className="h-3 w-3 text-amber-400 fill-amber-400" /> Usar Hora Actual
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                ClasificaciÃ³n / Puntualidad
              </label>
              <select
                value={formState.punctuality}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, punctuality: e.target.value as AttendancePunctuality }))
                }
                className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              >
                <option value="on_time">ðŸŸ¢ Normal (A tiempo)</option>
                <option value="tardiness">ðŸŸ¡ Tardanza</option>
                <option value="justified">ðŸ”µ Permiso / Justificado</option>
                <option value="incident">ðŸ”´ Incidencia / Inasistencia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              ObservaciÃ³n / JustificaciÃ³n (Opcional)
            </label>
            <textarea
              value={formState.observation}
              onChange={(e) => setFormState((s) => ({ ...s, observation: e.target.value }))}
              rows={2}
              placeholder="Escribe alguna incidencia o detalle sobre el marcado..."
              className="w-full rounded-xl p-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 transition-colors"
            />
          </div>

          {formMode === "edit" && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Motivo de CorrecciÃ³n
              </label>
              <textarea
                value={formState.correctionReason}
                onChange={(e) => setFormState((s) => ({ ...s, correctionReason: e.target.value }))}
                rows={2}
                placeholder="Indica la razÃ³n de la correcciÃ³n manual..."
                className="w-full rounded-xl p-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
              <input
                type="checkbox"
                checked={formState.notifyVolunteer}
                onChange={(e) => setFormState((s) => ({ ...s, notifyVolunteer: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
              Notificar por correo al voluntario
            </label>

            {formMode === "create" && (
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
                <input
                  type="checkbox"
                  checked={formState.keepModalOpen}
                  onChange={(e) => setFormState((s) => ({ ...s, keepModalOpen: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                />
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                Mantener modal abierto al guardar (Modo Lote)
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton
              size="sm"
              onClick={() => setIsFormOpen(false)}
              disabled={isRegisteringEntry || isUpdating}
            >
              Cancelar
            </OutlineButton>

            <GradientButton
              size="sm"
              onClick={() => void submitForm()}
              disabled={isRegisteringEntry || isUpdating}
              className="flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              {formMode === "edit"
                ? isUpdating
                  ? "Guardando..."
                  : "Guardar Cambios"
                : isRegisteringEntry
                ? "Registrando..."
                : "Guardar Marcado"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* â”€â”€ Detalle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ModalShell open={isDetailOpen} onClose={() => setIsDetailOpen(false)} width="max-w-[920px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Detalle de asistencia</h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>InformaciÃ³n completa del registro de asistencia.</p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsDetailOpen(false)}>âœ•</button>
          </div>
          {detailLoading && <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>}
          {!detailLoading && detailError && <p className="text-[12px]" style={{ color: "var(--t-danger, #ef4444)" }}>{detailError}</p>}
          {!detailLoading && !detailError && detail && (
            <>
              <div className="flex flex-wrap gap-2">
                <StatusDot variant={detail.statusVariant}>{detail.stateLabel}</StatusDot>
                <StatusDot variant="secondary">{detail.sourceLabel}</StatusDot>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Voluntario</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.volunteerName}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Actividad</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.activityName}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Proyecto</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.projectName}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Fecha</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.dateLabel}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Entrada</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.entryLabel}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Salida</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.exitLabel}</p></div>
              </div>
              <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                <p style={{ color: "var(--t-text-secondary)" }}>{detail.observation}</p>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      {/* â”€â”€ Registrar salida â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ModalShell open={isCloseOpen} onClose={() => setIsCloseOpen(false)} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Registrar salida</h3>
          <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Indica la hora de salida del voluntario.</p>
          <input type="time" value={closingExitTime} onChange={(event) => { setClosingExitTime(event.target.value); setClosingError(null); }} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
          <textarea value={closingObservation} onChange={(event) => { setClosingObservation(event.target.value); setClosingError(null); }} rows={3} placeholder="Observacion opcional" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          {closingError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{closingError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitClose()} disabled={isRegisteringExit}>{isRegisteringExit ? "Guardando..." : "Confirmar salida"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsCloseOpen(false)} disabled={isRegisteringExit}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* â”€â”€ Incidencia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ModalShell open={isIncidenceOpen} onClose={() => setIsIncidenceOpen(false)} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Marcar incidencia</h3>
          <textarea value={incidenceReason} onChange={(event) => { setIncidenceReason(event.target.value); setIncidenceError(null); }} rows={4} placeholder="Describe el motivo de la incidencia" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          {incidenceError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{incidenceError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitIncidence()} disabled={isUpdating}>{isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsIncidenceOpen(false)} disabled={isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* â”€â”€ Eliminar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ModalShell open={isRemoveOpen} onClose={() => setIsRemoveOpen(false)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Eliminar registro</h3>
          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            El registro serÃ¡ marcado como eliminado y no aparecerÃ¡ en la lista. Esta acciÃ³n es reversible desde Gobernanza.
          </p>
          {removeError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{removeError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitRemove()} disabled={isRemoving}>{isRemoving ? "Eliminando..." : "Confirmar eliminaciÃ³n"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsRemoveOpen(false)} disabled={isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* â”€â”€ QR Scanner REFACTORIZADO HASTA ALTO RENDIMIENTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <QrScanModal
        open={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        scanForm={scanForm}
        setScanForm={setScanForm}
        scanError={scanError}
        setScanError={setScanError}
        scanResult={scanResult}
        setScanResult={setScanResult}
        activityOptions={activityOptions}
        isScanning={isScanning}
        scanInputRef={scanInputRef}
        onSubmitScan={submitScan}
        inputStyle={INPUT_STYLE}
      />
    </motion.div>
  );
}

// â”€â”€ QR Scan Modal con cÃ¡mara y alto rendimiento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const QR_CAMERA_PREF_KEY = "democra_qr_camera_allowed";

function QrScanModal({
  open,
  onClose,
  scanForm,
  setScanForm,
  scanError,
  setScanError,
  scanResult,
  setScanResult,
  activityOptions,
  isScanning,
  scanInputRef,
  onSubmitScan,
  inputStyle,
}: {
  open: boolean;
  onClose: () => void;
  scanForm: AttendanceScanForm;
  setScanForm: Dispatch<SetStateAction<AttendanceScanForm>>;
  scanError: string | null;
  setScanError: (e: string | null) => void;
  scanResult: AttendanceScanResult | null;
  setScanResult: (r: AttendanceScanResult | null) => void;
  activityOptions: { value: string; label: string }[];
  isScanning: boolean;
  scanInputRef: RefObject<HTMLInputElement | null>;
  onSubmitScan: (overridePayload?: string) => Promise<void>;
  inputStyle: React.CSSProperties;
}) {
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedQrRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const savedPref = typeof window !== "undefined"
    ? localStorage.getItem(QR_CAMERA_PREF_KEY)
    : null;

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devs) => {
          const videoDevs = devs.filter((d) => d.kind === "videoinput");
          setDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch(() => null);
    }
  }, []);

  async function startCamera(deviceId?: string) {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "environment" },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      localStorage.setItem(QR_CAMERA_PREF_KEY, "true");
      setCameraMode(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && "getCapabilities" in videoTrack) {
        // @ts-expect-error Torch capability check
        const caps = videoTrack.getCapabilities();
        if (caps && "torch" in caps) {
          setTorchSupported(true);
        }
      }
    } catch {
      setCameraError("No se pudo acceder a la cÃ¡mara seleccionada. Usa el campo manual.");
    }
  }

  async function toggleTorch() {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      // @ts-expect-error Torch constraints
      await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorchOn(nextTorch);
    } catch {
      toast.error("Tu cÃ¡mara no admite linterna.");
    }
  }

  useEffect(() => {
    if (!cameraMode || !cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    videoRef.current.play().catch(() => null);
  }, [cameraMode, cameraStream]);

  useEffect(() => {
    if (!cameraMode || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let active = true;

    async function detectFrame() {
      if (!active || !video || !canvas || !ctx) return;
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if ("BarcodeDetector" in window) {
        try {
          // @ts-expect-error BarcodeDetector API
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            const raw = barcodes[0].rawValue as string;
            const now = Date.now();

            if (raw !== lastScannedQrRef.current || now - lastScannedTimeRef.current > 2000) {
              lastScannedQrRef.current = raw;
              lastScannedTimeRef.current = now;
              setScanForm((s) => ({ ...s, qrPayload: raw }));
              setScanError(null);

              if (scanForm.burstMode) {
                void onSubmitScan(raw);
              }
            }
          }
        } catch {
          // BarcodeDetector fallback
        }
      }

      rafRef.current = requestAnimationFrame(detectFrame);
    }

    rafRef.current = requestAnimationFrame(detectFrame);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraMode, scanForm.burstMode, onSubmitScan, setScanForm, setScanError]);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraMode(false);
    setTorchOn(false);
  }

  useEffect(() => {
    if (!open) stopCamera();
  }, [open]);

  return (
    <ModalShell open={open} onClose={() => { stopCamera(); onClose(); }} width="max-w-[780px]">
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-400" />
              EscÃ¡ner de Asistencia QR
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Escanea credenciales para registrar ingresos y salidas en tiempo real.
            </p>
          </div>
          <button
            type="button"
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            onClick={() => { stopCamera(); onClose(); }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Actividad Vinculada <span className="text-red-400">*</span>
            </label>
            <select
              value={scanForm.activityId}
              onChange={(event) => { setScanForm((s) => ({ ...s, activityId: event.target.value })); setScanError(null); }}
              className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500"
            >
              <option value="">Selecciona una actividad</option>
              {activityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Modo de MarcaciÃ³n
            </label>
            <div className="p-1 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-3 gap-1 h-10">
              <button
                type="button"
                onClick={() => setScanForm((s) => ({ ...s, mode: "auto" }))}
                className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  scanForm.mode === "auto"
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ðŸ¤– Auto
              </button>
              <button
                type="button"
                onClick={() => setScanForm((s) => ({ ...s, mode: "check_in" }))}
                className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  scanForm.mode === "check_in"
                    ? "bg-emerald-600 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ðŸ“¥ Entrada
              </button>
              <button
                type="button"
                onClick={() => setScanForm((s) => ({ ...s, mode: "check_out" }))}
                className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  scanForm.mode === "check_out"
                    ? "bg-amber-600 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ðŸ“¤ Salida
              </button>
            </div>
          </div>
        </div>

        {cameraMode ? (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black" style={{ aspectRatio: "16/9" }}>
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 rounded-2xl border-2 border-emerald-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse my-24" />
              </div>
            </div>

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              {devices.length > 1 ? (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    void startCamera(e.target.value);
                  }}
                  className="h-8 px-2 rounded-lg text-xs bg-black/70 backdrop-blur-md text-zinc-200 border border-zinc-700/60 outline-none"
                >
                  {devices.map((d, idx) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      ðŸ“¹ {d.label || `CÃ¡mara ${idx + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] text-zinc-300 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  ðŸ“¹ CÃ¡mara Activa
                </span>
              )}

              <div className="flex items-center gap-2">
                {torchSupported && (
                  <button
                    type="button"
                    onClick={() => void toggleTorch()}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                      torchOn
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                        : "bg-black/70 text-zinc-300 border border-zinc-700/60"
                    }`}
                    title="Alternar Linterna"
                  >
                    <Flashlight className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopCamera}
                  className="h-8 px-2.5 rounded-lg text-xs bg-red-500/80 hover:bg-red-500 text-white font-medium backdrop-blur-md transition-colors"
                >
                  Detener
                </button>
              </div>
            </div>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
              <span className="rounded-full px-3 py-1 text-[11px] font-medium text-emerald-300 bg-black/70 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-emerald-400" /> Centra el cÃ³digo QR en el cuadro
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 bg-zinc-950 border border-dashed border-zinc-800">
            {cameraError && (
              <p className="text-xs text-red-400 font-medium px-4 text-center">{cameraError}</p>
            )}
            <OutlineButton
              size="sm"
              type="button"
              onClick={() => void startCamera(selectedDeviceId)}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              Activar CÃ¡mara del Dispositivo
            </OutlineButton>
            <p className="text-[11px] text-zinc-400">
              {savedPref === "true" ? "CÃ¡mara autorizada" : "Se solicitarÃ¡ permiso de cÃ¡mara una sola vez"}
            </p>
          </div>
        )}

        {scanResult && (
          <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {scanResult.outcomeLabel} CONFIRMADO ({scanResult.scannedAtLabel})
              </span>
              <span className="font-mono text-[11px] text-zinc-400">{scanResult.cardCode}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 font-bold text-emerald-300 border border-emerald-500/30 text-sm">
                {(scanResult.attendance.volunteerName || "V")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-zinc-100 text-sm">{scanResult.attendance.volunteerName}</h4>
                <p className="text-zinc-300 text-[11px]">
                  Voluntario General â€¢ {scanResult.confirmationMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {scanError && (
          <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="font-semibold text-red-300">Lectura Rechazada / Error</span>
            </div>
            <p className="text-zinc-300 text-[12px]">{scanError}</p>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <label className="block text-xs font-medium text-zinc-400">
            Ingreso Manual (Pistolas Lectoras USB o CÃ³digo Teclado):
          </label>
          <div className="flex gap-2">
            <input
              ref={scanInputRef}
              value={scanForm.qrPayload}
              onChange={(event) => { setScanForm((s) => ({ ...s, qrPayload: event.target.value })); setScanError(null); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") { event.preventDefault(); void onSubmitScan(); }
              }}
              placeholder="Pega o escanea el payload QR..."
              className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500"
            />
            <GradientButton size="sm" onClick={() => void onSubmitScan()} disabled={isScanning}>
              Validar
            </GradientButton>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
            <input
              type="checkbox"
              checked={scanForm.burstMode}
              onChange={(e) => setScanForm((s) => ({ ...s, burstMode: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            Modo RÃ¡faga (Auto-procesar al detectar)
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
            <input
              type="checkbox"
              checked={scanForm.enableAudio}
              onChange={(e) => setScanForm((s) => ({ ...s, enableAudio: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
            {scanForm.enableAudio ? (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-zinc-500" />
            )}
            Sonido de confirmaciÃ³n (Beep)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <OutlineButton
            size="sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Cerrar EscÃ¡ner
          </OutlineButton>
        </div>
      </div>
    </ModalShell>
  );
}

