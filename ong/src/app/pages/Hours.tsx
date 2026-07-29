import { useMemo, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  FileCheck,
  FileText,
  Filter,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Timer,
  UploadCloud,
  User,
  UserCheck,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { StatusDot } from "../components/ui/status-dot";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";
import { ModalShell } from "../components/ui/modal-shell";
import { useHoraDetail } from "../modules/operation/hooks/useHoraDetail";
import { useOperationHours } from "../modules/operation/useOperationHours";
import type {
  ApprovalStatusKind,
  HoursFilters,
  OperationHoursRow,
} from "../modules/operation/types";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const satisfies Variants;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
} as const satisfies Variants;

type FormMode = "create" | "edit";
type ResolutionActionKind = "approved" | "rejected";
type InputMode = "range" | "direct";

interface HoursFormErrors {
  projectId?: string;
  activityId?: string;
  volunteerId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  minutes?: string;
  description?: string;
  general?: string;
}

interface ResolutionTarget {
  hoursId: string;
  kind: ResolutionActionKind;
}

type HoursRulesSettings = {
  requireEvidence: boolean;
  maxWeeklyHoursLimit: number;
  autoApproveCoordinators: boolean;
};

function SelectField({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-9 rounded-xl px-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-300 disabled:cursor-not-allowed disabled:opacity-70 hover:border-zinc-700"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-[12px]">
      <p>{message}</p>
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-400 mt-1">{message}</p>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2 bg-zinc-900 border border-zinc-800">
      <p className="text-[11px] text-zinc-400 font-medium">{label}</p>
      <p className="mt-1 text-[12px] text-zinc-200">{value || "-"}</p>
    </div>
  );
}

function toMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function computeHoursFromTimes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const startMins = toMinutes(start);
  const endMins = toMinutes(end);
  if (startMins === null || endMins === null || endMins <= startMins) return null;
  const diffMins = endMins - startMins;
  return Math.round((diffMins / 60) * 10) / 10;
}

function exportHoursToCSV(data: OperationHoursRow[]) {
  if (!data || data.length === 0) {
    toast.error("No hay registros de horas para exportar.");
    return;
  }
  const headers = ["Voluntario", "Proyecto", "Actividad", "Fecha", "Horas", "Minutos", "Estado", "Solicitado Por", "Solicitado El"];
  const csvRows = data.map((r) => [
    `"${r.volunteerName || ""}"`,
    `"${r.projectName || ""}"`,
    `"${r.activityName || ""}"`,
    `"${r.date || ""}"`,
    `"${r.hours || 0}"`,
    `"${r.minutes || 0}"`,
    `"${r.statusName || ""}"`,
    `"${r.requestedBy || ""}"`,
    `"${r.requestedAt || ""}"`,
  ]);
  const csvContent = [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `horas_validadas_ong_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Reporte de horas exportado exitosamente.");
}

export function Hours() {
  const [searchValue, setSearchValue] = useState("");
  const [scope, setScope] = useState<HoursFilters["scope"]>("all");
  const [status, setStatus] = useState<HoursFilters["status"]>("all");
  const [volunteerFilter, setVolunteerFilter] = useState<HoursFilters["volunteerId"]>("all");
  const [projectFilter, setProjectFilter] = useState<HoursFilters["projectId"]>("all");
  const [activityFilter, setActivityFilter] = useState<HoursFilters["activityId"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedHoursIds, setSelectedHoursIds] = useState<string[]>([]);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesState, setRulesState] = useState<HoursRulesSettings>({
    requireEvidence: true,
    maxWeeklyHoursLimit: 20,
    autoApproveCoordinators: false,
  });

  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("range");
  const [formProjectId, setFormProjectId] = useState("all");
  const [formActivityId, setFormActivityId] = useState("all");
  const [formVolunteerId, setFormVolunteerId] = useState("all");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formDirectHours, setFormDirectHours] = useState("1.0");
  const [formDescription, setFormDescription] = useState("");
  const [formEvidenceFile, setFormEvidenceFile] = useState<File | null>(null);
  const [formNotifyVolunteer, setFormNotifyVolunteer] = useState(true);
  const [formAutoApprove, setFormAutoApprove] = useState(false);
  const [formKeepModalOpen, setFormKeepModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<HoursFormErrors>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [detailHoursId, setDetailHoursId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [resolutionTarget, setResolutionTarget] = useState<ResolutionTarget | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const [requestTarget, setRequestTarget] = useState<{
    hoursId: string;
    volunteerId: string;
  } | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const {
    loading,
    error,
    rows,
    stats,
    volunteerOptions,
    projectOptions,
    activityOptions,
    stateByKind,
    refresh,
    createHours,
    updateHours,
    resolveHoursRecord,
    requestApproval,
  } = useOperationHours({
    searchTerm: searchValue,
    scope,
    status,
    volunteerId: volunteerFilter,
    projectId: projectFilter,
    activityId: activityFilter,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useHoraDetail(isDetailModalOpen ? detailHoursId : null);

  const totalApprovedMinutes = useMemo(() => {
    return rows
      .filter((r) => r.statusKind === "approved")
      .reduce((acc, r) => acc + (r.minutes || 0), 0);
  }, [rows]);

  const totalApprovedHoursLabel = useMemo(() => {
    const hrs = Math.floor(totalApprovedMinutes / 60);
    const mins = totalApprovedMinutes % 60;
    return `${hrs}h ${mins}m validadas`;
  }, [totalApprovedMinutes]);

  const volunteerProjectOptions = useMemo(() => {
    if (!formVolunteerId || formVolunteerId === "all") return projectOptions;
    const relevantProjectIds = new Set(
      rows.filter((r) => r.volunteerId === formVolunteerId).map((r) => r.projectId).filter(Boolean)
    );
    if (relevantProjectIds.size === 0) return projectOptions;
    return projectOptions.filter((p) => relevantProjectIds.has(p.value));
  }, [formVolunteerId, rows, projectOptions]);

  const filteredActivityOptions = useMemo(() => {
    if (!formProjectId || formProjectId === "all") return activityOptions;
    const projectActivityIds = new Set(
      rows.filter((r) => r.projectId === formProjectId).map((r) => r.activityId).filter(Boolean)
    );
    const filtered = activityOptions.filter((a) => projectActivityIds.has(a.value));
    return filtered.length > 0 ? filtered : activityOptions;
  }, [formProjectId, activityOptions, rows]);

  const selectedVolunteerData = useMemo(() => {
    if (!formVolunteerId || formVolunteerId === "all") return null;
    const vol = volunteerOptions.find((v) => v.value === formVolunteerId);
    if (!vol) return null;
    const volunteerRows = rows.filter((r) => r.volunteerId === formVolunteerId && r.statusKind === "approved");
    const totalMins = volunteerRows.reduce((acc, r) => acc + (r.minutes || 0), 0);
    const hrs = Math.round((totalMins / 60) * 10) / 10;
    const initials = vol.label
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const email = `${vol.label.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;

    return {
      name: vol.label,
      email,
      initials,
      role: "Voluntario General",
      monthlyHours: hrs > 0 ? `${hrs} hrs validadas este mes` : "Sin horas este mes",
    };
  }, [formVolunteerId, volunteerOptions, rows]);

  const calculatedDecimalHours = useMemo(() => {
    if (inputMode === "direct") {
      const val = parseFloat(formDirectHours);
      return isNaN(val) || val <= 0 ? 0 : Math.round(val * 10) / 10;
    }
    return computeHoursFromTimes(formStart, formEnd) ?? 0;
  }, [inputMode, formDirectHours, formStart, formEnd]);

  const scopeFilters = useMemo(
    () => [
      { label: "Todas", value: "all", active: scope === "all" },
      { label: "Mis horas", value: "my", active: scope === "my" },
      { label: "Por revisar", value: "pending", active: scope === "pending" },
    ],
    [scope]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Estado: Todos" },
      { value: "pending", label: "Pendientes" },
      { value: "approved", label: "Aprobadas" },
      { value: "rejected", label: "Rechazadas" },
    ],
    []
  );

  const volunteerOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Voluntario: Todos" }, ...volunteerOptions],
    [volunteerOptions]
  );

  const projectOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Proyecto: Todos" }, ...projectOptions],
    [projectOptions]
  );

  const activityOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Actividad: Todas" }, ...activityOptions],
    [activityOptions]
  );

  function toggleSelectHours(id: string) {
    setSelectedHoursIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAllHours() {
    if (selectedHoursIds.length === rows.length) {
      setSelectedHoursIds([]);
    } else {
      setSelectedHoursIds(rows.map((r) => r.id));
    }
  }

  async function batchApproveSelected() {
    if (selectedHoursIds.length === 0) return;
    const targetStateId = stateByKind.get("approved");
    if (!targetStateId) {
      toast.error("No hay estado de aprobación configurado.");
      return;
    }

    let count = 0;
    toast.info("Procesando aprobaciones en lote...");
    for (const id of selectedHoursIds) {
      try {
        await resolveHoursRecord({
          hoursId: id,
          targetStateId,
          comment: "Aprobación masiva en lote",
        });
        count++;
      } catch {
        // Continue
      }
    }
    toast.success(`${count} registros de horas aprobados.`);
    setSelectedHoursIds([]);
    refresh();
  }

  async function batchRejectSelected() {
    if (selectedHoursIds.length === 0) return;
    const targetStateId = stateByKind.get("rejected");
    if (!targetStateId) {
      toast.error("No hay estado de rechazo configurado.");
      return;
    }

    let count = 0;
    toast.info("Procesando rechazos en lote...");
    for (const id of selectedHoursIds) {
      try {
        await resolveHoursRecord({
          hoursId: id,
          targetStateId,
          comment: "Rechazo masivo en lote",
        });
        count++;
      } catch {
        // Continue
      }
    }
    toast.success(`${count} registros de horas rechazados.`);
    setSelectedHoursIds([]);
    refresh();
  }

  function openCreateModal() {
    setEditingHoursId(null);
    setInputMode("range");
    setFormProjectId("all");
    setFormActivityId(activityOptions[0]?.value ?? "all");
    setFormVolunteerId(volunteerOptions[0]?.value ?? "all");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormStart("08:00");
    setFormEnd("12:00");
    setFormDirectHours("4.0");
    setFormDescription("");
    setFormEvidenceFile(null);
    setFormNotifyVolunteer(true);
    setFormAutoApprove(false);
    setFormKeepModalOpen(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  }

  function beginEdit(row: OperationHoursRow) {
    setEditingHoursId(row.id);
    setInputMode(row.startTime && row.endTime ? "range" : "direct");
    setFormProjectId(row.projectId ?? "all");
    setFormActivityId(row.activityId);
    setFormVolunteerId(row.volunteerId);
    setFormDate(row.date);
    setFormStart(row.startTime ?? "08:00");
    setFormEnd(row.endTime ?? "12:00");
    setFormDirectHours(String(Math.round((row.minutes / 60) * 10) / 10));
    setFormDescription(row.observation === "Sin observacion" ? "" : row.observation || "");
    setFormEvidenceFile(null);
    setFormNotifyVolunteer(true);
    setFormAutoApprove(row.statusKind === "approved");
    setFormKeepModalOpen(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    setEditingHoursId(null);
    setFormErrors({});
  }

  function openDetailModal(hoursId: string) {
    setDetailHoursId(hoursId);
    setIsDetailModalOpen(true);
  }

  function closeDetailModal() {
    setIsDetailModalOpen(false);
    setDetailHoursId(null);
  }

  function clearFormError(field: keyof HoursFormErrors) {
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submitForm() {
    const nextErrors: HoursFormErrors = {};

    if (formProjectId === "all" || !formProjectId) {
      nextErrors.projectId = "Selecciona un proyecto.";
    }
    if (formActivityId === "all" || !formActivityId) {
      nextErrors.activityId = "Selecciona una actividad.";
    }
    if (formVolunteerId === "all" || !formVolunteerId) {
      nextErrors.volunteerId = "Selecciona un voluntario.";
    }
    if (!formDate) {
      nextErrors.date = "La fecha es obligatoria.";
    }

    let calculatedMinutes = Math.round(calculatedDecimalHours * 60);

    if (inputMode === "range") {
      if (!formStart) nextErrors.startTime = "Hora inicio requerida.";
      if (!formEnd) nextErrors.endTime = "Hora fin requerida.";
      if (formStart && formEnd && calculatedDecimalHours <= 0) {
        nextErrors.endTime = "La hora fin debe ser posterior a inicio.";
      }
    } else {
      const val = parseFloat(formDirectHours);
      if (isNaN(val) || val <= 0 || val > 24) {
        nextErrors.minutes = "Ingresa una cantidad de horas válida (1 - 24 hrs).";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      if (editingHoursId) {
        const result = await updateHours({
          hoursId: editingHoursId,
          activityId: formActivityId,
          volunteerId: formVolunteerId,
          date: formDate,
          startTime: inputMode === "range" ? formStart : null,
          endTime: inputMode === "range" ? formEnd : null,
          minutes: calculatedMinutes,
        });
        if (!result) return;

        if (formAutoApprove) {
          const approvedStateId = stateByKind.get("approved");
          if (approvedStateId) {
            await resolveHoursRecord({
              hoursId: editingHoursId,
              targetStateId: approvedStateId,
              comment: "Aprobado directamente al actualizar",
            });
          }
        }

        if (result.warning) toast.warning(result.warning);
        toast.success("Registro de horas actualizado.");
        if (isDetailModalOpen && detailHoursId === editingHoursId) refreshDetail();
      } else {
        const result = await createHours({
          activityId: formActivityId,
          volunteerId: formVolunteerId,
          date: formDate,
          startTime: inputMode === "range" ? formStart : undefined,
          endTime: inputMode === "range" ? formEnd : undefined,
          minutes: calculatedMinutes,
        });
        if (!result) return;

        if (formAutoApprove && result.hoursId) {
          const approvedStateId = stateByKind.get("approved");
          if (approvedStateId) {
            await resolveHoursRecord({
              hoursId: result.hoursId,
              targetStateId: approvedStateId,
              comment: "Aprobado directamente al registrar",
            });
          }
        }

        if (formNotifyVolunteer) {
          toast.info("Notificación enviada por correo al voluntario.");
        }

        if (result.warning) toast.warning(result.warning);
        toast.success("Horas registradas exitosamente.");
      }

      if (formKeepModalOpen && !editingHoursId) {
        setFormVolunteerId("all");
        setFormDescription("");
        setFormEvidenceFile(null);
        setFormErrors({});
      } else {
        closeFormModal();
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "No se pudieron guardar las horas.";
      setFormErrors((current) => ({ ...current, general: message }));
      toast.error(message);
    }
  }

  function openResolutionModal(row: OperationHoursRow, kind: ResolutionActionKind) {
    if (row.statusKind === "approved" || row.statusKind === "rejected") {
      toast.error("El registro ya fue resuelto y debe volver a pendiente antes de revisarse.");
      return;
    }

    setResolutionTarget({ hoursId: row.id, kind });
    setResolutionComment("");
    setResolutionError(null);
    setIsResolutionModalOpen(true);
  }

  function closeResolutionModal() {
    setIsResolutionModalOpen(false);
    setResolutionTarget(null);
    setResolutionComment("");
    setResolutionError(null);
  }

  async function submitResolution() {
    if (!resolutionTarget) return;

    const targetStateId = stateByKind.get(resolutionTarget.kind);
    if (!targetStateId) {
      setResolutionError("No existe estado configurado para esta acción.");
      return;
    }

    const comment = resolutionComment.trim();
    if (comment.length > 500) {
      setResolutionError("El comentario no puede exceder 500 caracteres.");
      return;
    }

    try {
      const result = await resolveHoursRecord({
        hoursId: resolutionTarget.hoursId,
        targetStateId,
        comment: comment || undefined,
      });
      if (!result) return;

      if (result.warning) {
        toast.warning(result.warning);
      }
      toast.success("Estado de horas actualizado.");
      closeResolutionModal();
      if (isDetailModalOpen && detailHoursId === resolutionTarget.hoursId) {
        refreshDetail();
      }
    } catch (actionError) {
      setResolutionError(
        actionError instanceof Error ? actionError.message : "No se pudo actualizar el estado."
      );
    }
  }

  function openRequestApprovalModal(row: OperationHoursRow) {
    setRequestTarget({ hoursId: row.id, volunteerId: row.volunteerId });
    setRequestComment("");
    setRequestError(null);
    setIsRequestModalOpen(true);
  }

  function closeRequestApprovalModal() {
    setIsRequestModalOpen(false);
    setRequestTarget(null);
    setRequestComment("");
    setRequestError(null);
  }

  async function submitRequestApproval() {
    if (!requestTarget) return;

    try {
      const result = await requestApproval({
        hoursId: requestTarget.hoursId,
        requesterId: requestTarget.volunteerId,
        comment: requestComment.trim() || undefined,
      });
      if (!result) return;

      if (result.warning) {
        toast.warning(result.warning);
      }
      toast.success("Solicitud de aprobación enviada.");
      closeRequestApprovalModal();
      if (isDetailModalOpen && detailHoursId === requestTarget.hoursId) {
        refreshDetail();
      }
    } catch (actionError) {
      setRequestError(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo solicitar la aprobación."
      );
    }
  }

  const columns: Column<OperationHoursRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={rows.length > 0 && selectedHoursIds.length === rows.length}
          onChange={toggleSelectAllHours}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      ),
      render: (item) => (
        <input
          type="checkbox"
          checked={selectedHoursIds.includes(item.id)}
          onChange={() => toggleSelectHours(item.id)}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      ),
    },
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
              <div className="font-semibold text-zinc-100">{item.volunteerName}</div>
              <div className="mt-0.5 text-[11px] text-zinc-400">{item.requestedBy || "Voluntario General"}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "activity",
      label: "Proyecto / Actividad",
      render: (item) => (
        <div>
          <div className="font-medium text-zinc-200">{item.activityName}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400 font-medium">{item.projectName}</div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Fecha y Horario",
      render: (item) => (
        <div className="text-[12px] text-zinc-300 font-mono space-y-0.5">
          <div className="flex items-center gap-1">📅 {item.date}</div>
          {(item.startTime || item.endTime) && (
            <div className="text-[11px] text-zinc-400 flex items-center gap-1">
              🕒 {item.startTime || "--:--"} - {item.endTime || "--:--"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "hours",
      label: "Horas",
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <Timer className="h-3.5 w-3.5 text-indigo-400" />
          {item.hours}h ({item.minutes}m)
        </span>
      ),
    },
    {
      key: "evidence",
      label: "Evidencia",
      render: (item) => {
        const hasEv = !!(item.observation && item.observation !== "Sin observacion");
        return hasEv ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
            <Paperclip className="h-3 w-3" /> Adjunto
          </span>
        ) : (
          <span className="text-[11px] text-zinc-500">-</span>
        );
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (item) => <StatusDot variant={item.statusVariant}>{item.statusName}</StatusDot>,
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* HEADER DE MÓDULO */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Control y Aprobación de Horas"
            description="Valida las horas reportadas por los voluntarios en actividades y emite aprobaciones."
            action={{ label: "Actualizar", onClick: refresh }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <OutlineButton
              size="sm"
              onClick={() => setIsRulesModalOpen(true)}
              className="flex items-center gap-1.5 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              Reglas
            </OutlineButton>

            <OutlineButton
              size="sm"
              onClick={() => exportHoursToCSV(rows)}
              className="flex items-center gap-1.5 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              Exportar Reporte
            </OutlineButton>

            <GradientButton size="sm" onClick={openCreateModal} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Registrar Horas
            </GradientButton>
          </div>
        </div>
      </motion.div>

      {/* KPIS DE RESUMEN DE 4 COLUMNAS */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Pendientes</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.pending}</p>
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                🟡 Por revisar
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Aprobadas</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.approved}</p>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                🟢 Validadas
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-red-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Rechazadas</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{stats.rejected}</p>
              <span className="text-[11px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                🔴 Desestimadas
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80 border border-zinc-800/80 hover:border-indigo-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400">Total Horas Aprobadas</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Timer className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-zinc-100 tabular-nums">{Math.round(totalApprovedMinutes / 60)}h</p>
              <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-mono">
                🔵 {totalApprovedHoursLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FILTROS Y BARRAS */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <FilterBar
            searchPlaceholder="Buscar por voluntario, actividad o proyecto..."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={scopeFilters}
            onFilterClick={(value) => setScope(value as HoursFilters["scope"])}
          />

          {selectedHoursIds.length > 0 && (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 animate-in fade-in shrink-0">
              <span className="text-xs text-indigo-300 font-medium px-2">
                {selectedHoursIds.length} seleccionados
              </span>
              <button
                type="button"
                onClick={() => void batchApproveSelected()}
                className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-medium flex items-center gap-1 border border-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5" /> Aprobar
              </button>
              <button
                type="button"
                onClick={() => void batchRejectSelected()}
                className="px-2.5 py-1 rounded-lg text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 font-medium flex items-center gap-1 border border-red-500/30"
              >
                <X className="h-3.5 w-3.5" /> Rechazar
              </button>
              <button
                type="button"
                onClick={() => setSelectedHoursIds([])}
                className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Desmarcar
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <SelectField value={status} onChange={setStatus} options={statusOptions} />
          <SelectField
            value={volunteerFilter}
            onChange={setVolunteerFilter}
            options={volunteerOptionsWithAll}
          />
          <SelectField
            value={projectFilter}
            onChange={setProjectFilter}
            options={projectOptionsWithAll}
          />
          <SelectField
            value={activityFilter}
            onChange={setActivityFilter}
            options={activityOptionsWithAll}
          />
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

          {(searchValue || scope !== "all" || status !== "all" || volunteerFilter !== "all" || projectFilter !== "all" || activityFilter !== "all" || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                setScope("all");
                setStatus("all");
                setVolunteerFilter("all");
                setProjectFilter("all");
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
          <ErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      {/* TABLA PRINCIPAL Y ESTADO VACÍO */}
      <motion.div variants={fadeUp}>
        {rows.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400 mb-4 shadow-sm border border-zinc-700/50">
              <Clock3 className="h-7 w-7 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Sin registros de horas</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              No se encontraron registros de horas reportadas con los filtros activos.
            </p>
            <div className="mt-5 flex gap-2">
              <OutlineButton
                size="sm"
                onClick={() => {
                  setSearchValue("");
                  setScope("all");
                  setStatus("all");
                  setVolunteerFilter("all");
                  setProjectFilter("all");
                  setActivityFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Limpiar Filtros
              </OutlineButton>
              <GradientButton size="sm" onClick={openCreateModal}>
                + Registrar Horas
              </GradientButton>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            actions={[
              {
                label: "Ver detalle",
                onClick: (item) => openDetailModal(item.id),
              },
              {
                label: "Solicitar aprobación",
                onClick: (item) => openRequestApprovalModal(item),
              },
              {
                label: "Editar",
                onClick: (item) => beginEdit(item),
              },
              {
                label: "Aprobar",
                onClick: (item) => openResolutionModal(item, "approved"),
              },
              {
                label: "Rechazar",
                onClick: (item) => openResolutionModal(item, "rejected"),
                variant: "destructive",
              },
            ]}
            emptyMessage="No se encontraron registros de horas para los filtros seleccionados"
          />
        )}
      </motion.div>

      {/* MODAL DE REGLAS DE APROBACIÓN */}
      <ModalShell open={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} width="max-w-[560px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-400" />
              Reglas de Aprobación de Horas
            </h3>
            <button type="button" className="text-zinc-400 hover:text-zinc-200" onClick={() => setIsRulesModalOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Exigir Evidencia Obligatoria</span>
                <span className="text-[11px] text-zinc-400">Requerir adjuntar foto o documento para enviar registro de horas.</span>
              </div>
              <input
                type="checkbox"
                checked={rulesState.requireEvidence}
                onChange={(e) => setRulesState((s) => ({ ...s, requireEvidence: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Límite Máximo Semanal de Horas (Alerta)
              </label>
              <input
                type="number"
                value={rulesState.maxWeeklyHoursLimit}
                onChange={(e) => setRulesState((s) => ({ ...s, maxWeeklyHoursLimit: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl px-3 py-2 outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Emitir alerta cuando un voluntario exceda este número de horas en la semana.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="font-medium text-zinc-200 block">Auto-Aprobar a Coordinadores</span>
                <span className="text-[11px] text-zinc-400">Aprobar automáticamente horas registradas por lideres de proyecto.</span>
              </div>
              <input
                type="checkbox"
                checked={rulesState.autoApproveCoordinators}
                onChange={(e) => setRulesState((s) => ({ ...s, autoApproveCoordinators: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={() => setIsRulesModalOpen(false)}>
              Cancelar
            </OutlineButton>
            <GradientButton
              size="sm"
              onClick={() => {
                setIsRulesModalOpen(false);
                toast.success("Reglas de aprobación de horas guardadas.");
              }}
            >
              Guardar Reglas
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* ── MODAL REFACTORIZADO DE REGISTRAR HORAS ──────────────────────────── */}
      <ModalShell open={isFormModalOpen} onClose={closeFormModal} width="max-w-[840px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Timer className="h-5 w-5 text-indigo-400" />
                {editingHoursId ? "Editar Horas Registradas" : "Registrar Horas de Voluntariado"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ingresa el tiempo dedicado por el voluntario en una actividad específica.
              </p>
            </div>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              onClick={closeFormModal}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formErrors.general && (
            <ErrorBlock
              message={formErrors.general}
              onRetry={() => setFormErrors((current) => ({ ...current, general: undefined }))}
            />
          )}

          {/* FILA 1: MODALIDAD DE TIEMPO (TABS) */}
          <div className="p-1 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setInputMode("range")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                inputMode === "range"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Clock className="h-4 w-4" />
              Por Rango Horario (Inicio - Fin)
            </button>

            <button
              type="button"
              onClick={() => setInputMode("direct")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                inputMode === "direct"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Timer className="h-4 w-4" />
              Cantidad Directa de Horas
            </button>
          </div>

          {/* FILA 2: PROYECTO Y ACTIVIDAD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Proyecto <span className="text-red-400">*</span>
              </label>
              <select
                value={formProjectId}
                onChange={(event) => {
                  setFormProjectId(event.target.value);
                  setFormActivityId("all");
                  clearFormError("projectId");
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
              <FieldError message={formErrors.projectId} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Actividad Vinculada <span className="text-red-400">*</span>
              </label>
              <select
                value={formActivityId}
                onChange={(event) => {
                  setFormActivityId(event.target.value);
                  clearFormError("activityId");
                }}
                disabled={formProjectId === "all"}
                className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="all">Selecciona una actividad</option>
                {filteredActivityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={formErrors.activityId} />
            </div>
          </div>

          {/* FILA 3: VOLUNTARIO CON TARJETA DE VISTA PREVIA */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Voluntario <span className="text-red-400">*</span>
            </label>
            <select
              value={formVolunteerId}
              onChange={(event) => {
                setFormVolunteerId(event.target.value);
                clearFormError("volunteerId");
              }}
              className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 transition-colors"
            >
              <option value="all">Selecciona un voluntario</option>
              {volunteerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  👤 {option.label}
                </option>
              ))}
            </select>
            <FieldError message={formErrors.volunteerId} />

            {selectedVolunteerData && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-indigo-500/30 text-xs animate-in fade-in">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 font-bold text-indigo-300 border border-indigo-500/30">
                  {selectedVolunteerData.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-100 truncate">{selectedVolunteerData.name}</div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>✉️ {selectedVolunteerData.email}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-medium">⏳ {selectedVolunteerData.monthlyHours}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FILA 4: FECHA Y TIEMPO (CÁLCULO AUTOMÁTICO DE HORAS) */}
          {inputMode === "range" ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Fecha <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    clearFormError("date");
                  }}
                  className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                />
                <FieldError message={formErrors.date} />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Hora Inicio <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formStart}
                  onChange={(e) => {
                    setFormStart(e.target.value);
                    clearFormError("startTime");
                  }}
                  className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                />
                <FieldError message={formErrors.startTime} />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Hora Fin <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formEnd}
                  onChange={(e) => {
                    setFormEnd(e.target.value);
                    clearFormError("endTime");
                  }}
                  className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                />
                <FieldError message={formErrors.endTime} />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tiempo Calculado
                </label>
                <div className="h-10 flex items-center justify-center px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs font-mono">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  {calculatedDecimalHours > 0 ? `${calculatedDecimalHours} Horas` : "-- Horas"}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Fecha <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    clearFormError("date");
                  }}
                  className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                />
                <FieldError message={formErrors.date} />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Cantidad Directa de Horas (ej. 3.5) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={formDirectHours}
                  onChange={(e) => {
                    setFormDirectHours(e.target.value);
                    clearFormError("minutes");
                  }}
                  placeholder="3.5"
                  className="h-10 w-full rounded-xl px-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
                />
                <FieldError message={formErrors.minutes} />
              </div>
            </div>
          )}

          {/* FILA 5: TAREAS REALIZADAS Y EVIDENCIAS */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Descripción de Actividades Realizadas (Auditoría)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Ej. Se realizó el armado de kits de apoyo y entrega en la sede central..."
                className="w-full rounded-xl p-3 text-xs outline-none border border-zinc-800 bg-zinc-900 text-zinc-200 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Adjuntar Evidencia / Comprobante (Fotos, reportes PDF, listas firmadas - Máx 5MB)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormEvidenceFile(e.target.files[0]);
                  }
                }}
              />

              {formEvidenceFile ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 truncate">
                    <Paperclip className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span className="font-medium truncate">{formEvidenceFile.name}</span>
                    <span className="text-[10px] text-zinc-400">
                      ({(formEvidenceFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormEvidenceFile(null)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950 hover:bg-zinc-900/60 cursor-pointer transition-colors text-center"
                >
                  <UploadCloud className="h-6 w-6 text-zinc-400 mb-1" />
                  <p className="text-xs text-zinc-300 font-medium">
                    Haz clic para examinar o arrastra fotos/archivos de evidencia aquí
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Soporta JPG, PNG, PDF de hasta 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* FILA 6: CONFIGURACIÓN Y ESTADO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
              <input
                type="checkbox"
                checked={formNotifyVolunteer}
                onChange={(e) => setFormNotifyVolunteer(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
              Notificar por correo al voluntario
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
              <input
                type="checkbox"
                checked={formAutoApprove}
                onChange={(e) => setFormAutoApprove(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-500"
              />
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Registrar directamente como 'Aprobado'
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
              <input
                type="checkbox"
                checked={formKeepModalOpen}
                onChange={(e) => setFormKeepModalOpen(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
              Mantener abierto al guardar (Modo Lote)
            </label>
          </div>

          {/* FOOTER DEL MODAL */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <OutlineButton size="sm" onClick={closeFormModal}>
              Cancelar
            </OutlineButton>
            <GradientButton size="sm" onClick={() => void submitForm()} className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              {editingHoursId ? "Guardar Cambios" : "Guardar Horas"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>

      {/* MODAL DETALLE */}
      <ModalShell open={isDetailModalOpen} onClose={closeDetailModal} width="max-w-[840px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-[14px] font-semibold text-zinc-100">Detalle del Registro de Horas</h3>
            <button type="button" className="text-zinc-400 hover:text-zinc-200 text-[12px]" onClick={closeDetailModal}>
              ✕
            </button>
          </div>

          {detailLoading && <p className="text-[12px] text-zinc-400">Cargando detalle...</p>}
          {!detailLoading && detailError && (
            <ErrorBlock message={detailError} onRetry={refreshDetail} />
          )}

          {!detailLoading && !detailError && detail && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusDot variant={detail.statusVariant}>{detail.statusName}</StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Voluntario" value={detail.volunteerName} />
                <DetailField label="Actividad" value={detail.activityName} />
                <DetailField label="Proyecto" value={detail.projectName} />
                <DetailField label="Fecha" value={detail.date} />
                <DetailField label="Horas Registradas" value={`${detail.hours}h (${detail.minutes} min)`} />
                <DetailField label="Solicitado Por" value={detail.requestedBy} />
                <DetailField label="Fecha Solicitud" value={detail.requestedAt} />
              </div>
            </div>
          )}
        </div>
      </ModalShell>

      {/* MODAL RESOLUCIÓN / APROBACIÓN */}
      <ModalShell open={isResolutionModalOpen} onClose={closeResolutionModal} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px] font-semibold text-zinc-100">
            {resolutionTarget?.kind === "approved" ? "Aprobar horas" : "Rechazar horas"}
          </h3>
          <p className="text-[12px] text-zinc-400">
            Indica un comentario opcional para resolver la solicitud de horas.
          </p>

          <textarea
            value={resolutionComment}
            onChange={(event) => {
              setResolutionComment(event.target.value);
              setResolutionError(null);
            }}
            rows={4}
            placeholder="Comentario de revisión (opcional)"
            className="w-full rounded-xl p-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
          />

          {resolutionError && <FieldError message={resolutionError} />}

          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitResolution()}>
              Confirmar
            </GradientButton>
            <OutlineButton size="sm" onClick={closeResolutionModal}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* MODAL SOLICITAR APROBACIÓN */}
      <ModalShell open={isRequestModalOpen} onClose={closeRequestApprovalModal} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px] font-semibold text-zinc-100">Solicitar aprobación de horas</h3>
          <p className="text-[12px] text-zinc-400">
            Envía la solicitud al coordinador responsable del proyecto.
          </p>

          <textarea
            value={requestComment}
            onChange={(event) => {
              setRequestComment(event.target.value);
              setRequestError(null);
            }}
            rows={4}
            placeholder="Comentario para el aprobador (opcional)"
            className="w-full rounded-xl p-3 text-[12px] outline-none border border-zinc-800 bg-zinc-900 text-zinc-200"
          />

          {requestError && <FieldError message={requestError} />}

          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitRequestApproval()}>
              Enviar solicitud
            </GradientButton>
            <OutlineButton size="sm" onClick={closeRequestApprovalModal}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
