import { useEffect, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "../components/ui/gradient-button";
import { ModalShell } from "../components/ui/modal-shell";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
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
} as const satisfies Variants;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
} as const satisfies Variants;

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

type AttendanceFormMode = "create" | "edit";

type AttendanceFormState = {
  attendanceId: string | null;
  volunteerId: string;
  projectId: string;
  activityId: string;
  date: string;
  entryTime: string;
  exitTime: string;
  observation: string;
  correctionReason: string;
};

type AttendanceScanForm = {
  activityId: string;
  qrPayload: string;
};

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

const columns: Column<OperationAttendanceRow>[] = [
  {
    key: "volunteer",
    label: "Voluntario",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.volunteerName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.dateLabel}
        </div>
      </div>
    ),
  },
  {
    key: "context",
    label: "Contexto",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text-secondary)" }}>{item.activityName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.projectName}
        </div>
      </div>
    ),
  },
  {
    key: "entry",
    label: "Entrada / Salida",
    render: (item) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        <div>{item.entryLabel}</div>
        <div>{item.exitLabel}</div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => <StatusDot variant={item.statusVariant}>{item.stateLabel}</StatusDot>,
  },
];

function toTimeInputValue(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function buildDefaultForm(): AttendanceFormState {
  return {
    attendanceId: null,
    volunteerId: "all",
    projectId: "all",
    activityId: "all",
    date: new Date().toISOString().slice(0, 10),
    entryTime: "",
    exitTime: "",
    observation: "",
    correctionReason: "",
  };
}

export function Attendance() {
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilters["status"]>("all");
  const [volunteerFilter, setVolunteerFilter] =
    useState<AttendanceFilters["volunteerId"]>("all");
  const [activityFilter, setActivityFilter] =
    useState<AttendanceFilters["activityId"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
  const [scanForm, setScanForm] = useState<AttendanceScanForm>({ activityId: "", qrPayload: "" });
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<AttendanceScanResult | null>(null);

  const {
    loading,
    error,
    warnings,
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

  // ── Cascading filter logic: volunteer → project → activity ──────────────────

  // Derive projects for the selected volunteer from the activity options metadata
  // `projectOptions` comes from the hook and lists all projects in the tenant
  const volunteerProjectOptions = useMemo(() => {
    if (!formState.volunteerId || formState.volunteerId === "all") {
      return projectOptions;
    }
    // Filter activities that include this volunteer, then collect their projectIds
    const relevantProjectIds = new Set(
      rows
        .filter((r) => r.volunteerId === formState.volunteerId)
        .map((r) => r.projectId)
        .filter(Boolean)
    );
    if (relevantProjectIds.size === 0) {
      return projectOptions;
    }
    return projectOptions.filter((p) => relevantProjectIds.has(p.value));
  }, [formState.volunteerId, rows, projectOptions]);

  // Auto-select project if only one available for the volunteer
  useEffect(() => {
    if (volunteerProjectOptions.length === 1 && formState.projectId === "all") {
      setFormState((s) => ({
        ...s,
        projectId: volunteerProjectOptions[0].value,
        activityId: "all",
      }));
    }
  }, [volunteerProjectOptions, formState.projectId]);

  // Filter activities based on selected project
  const filteredActivityOptions = useMemo(() => {
    if (!formState.projectId || formState.projectId === "all") {
      return activityOptions;
    }
    // Match activities whose label includes the project name or use projectId metadata
    // Since SelectOption only has {value, label}, we rely on the rows to map activityId→projectId
    const projectActivityIds = new Set(
      rows
        .filter((r) => r.projectId === formState.projectId)
        .map((r) => r.activityId)
        .filter(Boolean)
    );
    const filtered = activityOptions.filter((a) => projectActivityIds.has(a.value));
    return filtered.length > 0 ? filtered : activityOptions;
  }, [formState.projectId, activityOptions, rows]);

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
    if (!isScanOpen) {
      return;
    }
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
      volunteerId: row.volunteerId,
      projectId: row.projectId ?? "all",
      activityId: row.activityId ?? "all",
      date: row.rawDate,
      entryTime: toTimeInputValue(row.rawEntry),
      exitTime: toTimeInputValue(row.rawExit),
      observation: row.observation === "Sin observacion" ? "" : row.observation,
      correctionReason: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  async function submitForm() {
    if (!formState.volunteerId || formState.volunteerId === "all") {
      setFormError("Debes seleccionar un voluntario.");
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
    if (formState.entryTime && formState.exitTime && formState.exitTime < formState.entryTime) {
      setFormError("La hora de salida no puede ser anterior a la de entrada.");
      return;
    }

    try {
      if (formMode === "edit" && formState.attendanceId) {
        await updateAttendance({
          attendanceId: formState.attendanceId,
          activityId: formState.activityId,
          date: formState.date,
          entryTime: formState.entryTime || null,
          exitTime: formState.exitTime || null,
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
          entryTime: formState.entryTime || undefined,
          exitTime: formState.exitTime || undefined,
          observation: formState.observation || undefined,
        });
        toast.success("Asistencia registrada correctamente.");
      }
      setIsFormOpen(false);
      resetForm();
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

  async function submitScan() {
    if (!scanForm.activityId) {
      setScanError("Debes seleccionar una actividad.");
      return;
    }
    if (!scanForm.qrPayload.trim()) {
      setScanError("Debes registrar el payload QR.");
      return;
    }
    try {
      const result = await scanByQr({
        activityId: scanForm.activityId,
        qrPayload: scanForm.qrPayload.trim(),
      });
      if (!result) return;
      toast.success(result.confirmationTitle);
      setScanResult(result);
      setScanForm((current) => ({ ...current, qrPayload: "" }));
      setScanError(null);
      if (isDetailOpen && detailAttendanceId === result.attendance.id) {
        refreshDetail();
      }
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    } catch (scanMutationError) {
      setScanResult(null);
      setScanError(
        scanMutationError instanceof Error
          ? scanMutationError.message
          : "No se pudo registrar la asistencia por QR."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Asistencias"
          description="Registra y gestiona la asistencia de voluntarios a actividades: entrada, salida, incidencias y control por QR."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          {canManageAttendance && (
            <GradientButton size="sm" onClick={openCreateModal}>
              Registrar manual
            </GradientButton>
          )}
          {canScanAttendance && (
            <OutlineButton
              size="sm"
              onClick={() => {
                setScanForm({ activityId: activityOptions[0]?.value ?? "", qrPayload: "" });
                setScanError(null);
                setScanResult(null);
                setIsScanOpen(true);
              }}
            >
              Registrar QR
            </OutlineButton>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl p-4" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Abiertas</p>
            <p className="mt-2 text-[24px]" style={{ color: "var(--t-text)" }}>{stats.open}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Cerradas</p>
            <p className="mt-2 text-[24px]" style={{ color: "var(--t-text)" }}>{stats.closed}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Incidencias</p>
            <p className="mt-2 text-[24px]" style={{ color: "var(--t-text)" }}>{stats.incidence}</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por voluntario, actividad, proyecto u observacion..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filters}
          onFilterClick={(value) => setStatusFilter(value as AttendanceFilters["status"])}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <select value={volunteerFilter} onChange={(event) => setVolunteerFilter(event.target.value as AttendanceFilters["volunteerId"])} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE}>
            {volunteerOptionsWithAll.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value as AttendanceFilters["activityId"])} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE}>
            {activityOptionsWithAll.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <div className="flex items-center justify-between gap-3">
              <p style={{ color: "var(--t-text-secondary)" }}>{error}</p>
              <button type="button" className="rounded-md px-2 py-1 text-[11px]" onClick={refresh}>Reintentar</button>
            </div>
          </div>
        </motion.div>
      )}

      {warnings.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            {warnings.map((warning) => <p key={warning} style={{ color: "var(--t-text-tertiary)" }}>{warning}</p>)}
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
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
      </motion.div>

      {/* ── Registro manual ─────────────────────────────────────────────────────── */}
      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} width="max-w-[860px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {formMode === "edit" ? "Editar asistencia" : "Registrar asistencia"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Selecciona voluntario, luego proyecto y actividad. Registra hora de entrada y salida.
              </p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsFormOpen(false)}>✕</button>
          </div>

          {formError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{formError}</p>}

          {/* Step 1: Voluntario */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
          >
            <p className="mb-2 text-[11px] font-medium" style={{ color: "var(--t-text-dim)" }}>
              1. Voluntario
            </p>
            <select
              value={formState.volunteerId}
              onChange={(event) => {
                setFormState((s) => ({ ...s, volunteerId: event.target.value, projectId: "all", activityId: "all" }));
                setFormError(null);
              }}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            >
              <option value="all">Selecciona un voluntario</option>
              {volunteerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          {/* Step 2: Proyecto (visible cuando hay voluntario seleccionado) */}
          {formState.volunteerId !== "all" && (
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <p className="mb-2 text-[11px] font-medium" style={{ color: "var(--t-text-dim)" }}>
                2. Proyecto
                {volunteerProjectOptions.length === 1 && (
                  <span className="ml-2 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "rgba(99,102,241,0.15)", color: "rgba(99,102,241,1)" }}>
                    Auto-seleccionado
                  </span>
                )}
              </p>
              <select
                value={formState.projectId}
                onChange={(event) => {
                  setFormState((s) => ({ ...s, projectId: event.target.value, activityId: "all" }));
                  setFormError(null);
                }}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              >
                <option value="all">Selecciona un proyecto</option>
                {volunteerProjectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}

          {/* Step 3: Actividad (visible cuando hay proyecto) */}
          {formState.projectId !== "all" && (
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <p className="mb-2 text-[11px] font-medium" style={{ color: "var(--t-text-dim)" }}>
                3. Actividad
              </p>
              <select
                value={formState.activityId}
                onChange={(event) => { setFormState((s) => ({ ...s, activityId: event.target.value })); setFormError(null); }}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              >
                <option value="all">Selecciona una actividad</option>
                {filteredActivityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}

          {/* Step 4: Fecha y horas */}
          {formState.activityId !== "all" && (
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <p className="mb-2 text-[11px] font-medium" style={{ color: "var(--t-text-dim)" }}>
                4. Fecha y horario
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-[10px]" style={{ color: "var(--t-text-dim)" }}>Fecha</p>
                  <input type="date" value={formState.date} onChange={(event) => { setFormState((s) => ({ ...s, date: event.target.value })); setFormError(null); }} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
                </div>
                <div>
                  <p className="mb-1 text-[10px]" style={{ color: "var(--t-text-dim)" }}>Hora entrada</p>
                  <input type="time" value={formState.entryTime} onChange={(event) => { setFormState((s) => ({ ...s, entryTime: event.target.value })); setFormError(null); }} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
                </div>
                <div>
                  <p className="mb-1 text-[10px]" style={{ color: "var(--t-text-dim)" }}>Hora salida</p>
                  <input type="time" value={formState.exitTime} onChange={(event) => { setFormState((s) => ({ ...s, exitTime: event.target.value })); setFormError(null); }} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
                </div>
              </div>
            </div>
          )}

          <textarea
            value={formState.observation}
            onChange={(event) => { setFormState((s) => ({ ...s, observation: event.target.value })); setFormError(null); }}
            rows={3}
            placeholder="Observacion (opcional)"
            className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
            style={INPUT_STYLE}
          />
          {formMode === "edit" && (
            <textarea
              value={formState.correctionReason}
              onChange={(event) => { setFormState((s) => ({ ...s, correctionReason: event.target.value })); setFormError(null); }}
              rows={3}
              placeholder="Motivo de corrección"
              className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          )}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitForm()} disabled={isRegisteringEntry || isUpdating}>
              {formMode === "edit" ? (isUpdating ? "Guardando..." : "Guardar cambios") : (isRegisteringEntry ? "Registrando..." : "Registrar")}
            </GradientButton>
            <OutlineButton size="sm" onClick={() => setIsFormOpen(false)} disabled={isRegisteringEntry || isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* ── Detalle ─────────────────────────────────────────────────────────────── */}
      <ModalShell open={isDetailOpen} onClose={() => setIsDetailOpen(false)} width="max-w-[920px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Detalle de asistencia</h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Información completa del registro de asistencia.</p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsDetailOpen(false)}>✕</button>
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

      {/* ── Registrar salida ─────────────────────────────────────────────────────── */}
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

      {/* ── Incidencia ───────────────────────────────────────────────────────────── */}
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

      {/* ── Eliminar ─────────────────────────────────────────────────────────────── */}
      <ModalShell open={isRemoveOpen} onClose={() => setIsRemoveOpen(false)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Eliminar registro</h3>
          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            El registro será marcado como eliminado y no aparecerá en la lista. Esta acción es reversible desde Gobernanza.
          </p>
          {removeError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{removeError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitRemove()} disabled={isRemoving}>{isRemoving ? "Eliminando..." : "Confirmar eliminación"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsRemoveOpen(false)} disabled={isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* ── QR Scanner ───────────────────────────────────────────────────────────── */}
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

// ── QR Scan Modal con cámara ─────────────────────────────────────────────────

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
  onSubmitScan: () => Promise<void>;
  inputStyle: React.CSSProperties;
}) {
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const savedPref = typeof window !== "undefined"
    ? localStorage.getItem(QR_CAMERA_PREF_KEY)
    : null;

  // Start camera
  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      localStorage.setItem(QR_CAMERA_PREF_KEY, "true");
      setCameraMode(true);
    } catch {
      setCameraError("No se pudo acceder a la cámara. Usa el campo de texto para escanear.");
    }
  }

  // Attach stream to video element
  useEffect(() => {
    if (!cameraMode || !cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    videoRef.current.play().catch(() => null);
  }, [cameraMode, cameraStream]);

  // QR frame detection loop using BarcodeDetector if available
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

      // Use BarcodeDetector if available (Chrome/Edge)
      if ("BarcodeDetector" in window) {
        try {
          // @ts-expect-error BarcodeDetector is not in TS types
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            setScanForm((s) => ({ ...s, qrPayload: barcodes[0].rawValue as string }));
            setScanError(null);
            stopCamera();
            return;
          }
        } catch {
          // BarcodeDetector unavailable, fall through
        }
      }

      rafRef.current = requestAnimationFrame(detectFrame);
    }

    rafRef.current = requestAnimationFrame(detectFrame);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraMode, setScanForm, setScanError]);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraMode(false);
  }

  // Stop camera when modal closes
  useEffect(() => {
    if (!open) stopCamera();
  }, [open]);

  return (
    <ModalShell open={open} onClose={() => { stopCamera(); onClose(); }} width="max-w-[760px]">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Registrar asistencia por QR</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Escanea la credencial QR del voluntario para registrar entrada o salida automáticamente.
            </p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => { stopCamera(); onClose(); }}>✕</button>
        </div>

        {/* Activity selector */}
        <select
          value={scanForm.activityId}
          onChange={(event) => { setScanForm((s) => ({ ...s, activityId: event.target.value })); setScanError(null); }}
          className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
          style={inputStyle}
        >
          <option value="">Selecciona una actividad</option>
          {activityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        {/* Camera preview */}
        {cameraMode ? (
          <div className="relative overflow-hidden rounded-2xl" style={{ background: "#000", aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* QR guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                style={{
                  width: "55%",
                  aspectRatio: "1",
                  border: "2px solid rgba(99,102,241,0.9)",
                  borderRadius: 12,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                }}
              >
                {/* Corner indicators */}
                {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => (
                  <div
                    key={`${v}-${h}`}
                    style={{
                      position: "absolute",
                      [v]: -2,
                      [h]: -2,
                      width: 20,
                      height: 20,
                      borderTop: v === "top" ? "3px solid rgba(99,102,241,1)" : "none",
                      borderBottom: v === "bottom" ? "3px solid rgba(99,102,241,1)" : "none",
                      borderLeft: h === "left" ? "3px solid rgba(99,102,241,1)" : "none",
                      borderRight: h === "right" ? "3px solid rgba(99,102,241,1)" : "none",
                      borderTopLeftRadius: v === "top" && h === "left" ? 4 : 0,
                      borderTopRightRadius: v === "top" && h === "right" ? 4 : 0,
                      borderBottomLeftRadius: v === "bottom" && h === "left" ? 4 : 0,
                      borderBottomRightRadius: v === "bottom" && h === "right" ? 4 : 0,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <p className="rounded-full px-3 py-1 text-[11px] text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
                Centra el código QR en el recuadro
              </p>
            </div>
            <button
              type="button"
              onClick={stopCamera}
              className="absolute right-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-medium text-white"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              Cerrar cámara
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl py-6"
            style={{ background: "var(--t-hover)", border: "1px dashed var(--t-border)" }}
          >
            {cameraError && (
              <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{cameraError}</p>
            )}
            <OutlineButton
              size="sm"
              type="button"
              onClick={() => {
                if (savedPref === "true") {
                  void startCamera();
                } else {
                  void startCamera();
                }
              }}
            >
              📷 Activar cámara
            </OutlineButton>
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              {savedPref === "true" ? "Cámara ya autorizada" : "Se solicitará permiso de cámara una sola vez"}
            </p>
          </div>
        )}

        {scanError && (
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <div className="flex items-center gap-2">
              <StatusDot variant={resolveScanErrorVariant(scanError)}>Credencial rechazada</StatusDot>
            </div>
            <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{scanError}</p>
          </div>
        )}

        {/* Manual input fallback */}
        <div className="space-y-2">
          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>O ingresa el payload QR manualmente:</p>
          <input
            ref={scanInputRef}
            value={scanForm.qrPayload}
            onChange={(event) => { setScanForm((s) => ({ ...s, qrPayload: event.target.value })); setScanError(null); }}
            onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); void onSubmitScan(); }
            }}
            placeholder="Pega o escanea el payload QR y presiona Enter"
            className="h-11 w-full rounded-xl px-3 text-[12px] outline-none"
            style={inputStyle}
          />
        </div>

        {/* Scan result panel */}
        {scanResult && (
          <div className="rounded-2xl px-4 py-4" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusDot variant="success">{scanResult.outcomeLabel} confirmado</StatusDot>
              <StatusDot variant="secondary">{scanResult.cardCode}</StatusDot>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "var(--t-text)" }}>{scanResult.confirmationMessage}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Voluntario</p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{scanResult.attendance.volunteerName}</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Actividad</p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{scanResult.attendance.activityName}</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Hora</p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{scanResult.scannedAtLabel}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <GradientButton size="sm" onClick={() => void onSubmitScan()} disabled={isScanning}>{isScanning ? "Procesando..." : "Confirmar"}</GradientButton>
          <OutlineButton
            size="sm"
            onClick={() => {
              setScanResult(null);
              setScanError(null);
              setScanForm((s) => ({ ...s, qrPayload: "" }));
              window.setTimeout(() => scanInputRef.current?.focus(), 0);
            }}
            disabled={isScanning}
          >
            Limpiar
          </OutlineButton>
          <OutlineButton size="sm" onClick={() => { stopCamera(); onClose(); }} disabled={isScanning}>Cerrar</OutlineButton>
        </div>
      </div>
    </ModalShell>
  );
}
