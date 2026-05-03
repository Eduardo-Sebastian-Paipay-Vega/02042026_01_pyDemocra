import { useEffect, useMemo, useRef, useState } from "react";
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
import { useTenantBootstrap } from "../../../../core/tenant";

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
  const canManageAttendance = tenantBootstrap.hasAnyPermission([
    "operation.attendance.manage",
  ]);
  const canScanAttendance = tenantBootstrap.hasAnyPermission([
    "attendance.scan",
    "operation.attendance.manage",
  ]);

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
      setFormError("La salida no puede ser anterior a la entrada.");
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
        toast.success("Asistencia manual registrada.");
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
    if (!closingAttendanceId) {
      return;
    }
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
    if (!removeAttendanceId) {
      return;
    }
    try {
      await removeAttendance(removeAttendanceId);
      toast.success("Asistencia eliminada logicamente.");
      setIsRemoveOpen(false);
      setRemoveAttendanceId(null);
      setRemoveError(null);
      if (isDetailOpen && detailAttendanceId === removeAttendanceId) {
        setIsDetailOpen(false);
        setDetailAttendanceId(null);
      }
    } catch (actionError) {
      setRemoveError(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo eliminar logicamente la asistencia."
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
      if (!result) {
        return;
      }
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
          description="Operacion real sobre `ong.asistencias`; la UI expone alta manual, detalle, cierre, incidencia, borrado logico y QR."
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
                    label: "Eliminar logico",
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
          emptyMessage="No hay asistencias para el tenant actual con los filtros activos"
        />
      </motion.div>

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} width="max-w-[860px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {formMode === "edit" ? "Editar asistencia" : "Registrar asistencia manual"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Persistencia directa sobre `ong.asistencias`.
              </p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsFormOpen(false)}>X</button>
          </div>
          {formError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{formError}</p>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select value={formState.volunteerId} onChange={(event) => { setFormState((current) => ({ ...current, volunteerId: event.target.value })); setFormError(null); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE}>
              <option value="all">Selecciona un voluntario</option>
              {volunteerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={formState.activityId} onChange={(event) => { setFormState((current) => ({ ...current, activityId: event.target.value })); setFormError(null); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE}>
              <option value="all">Selecciona una actividad</option>
              {activityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input type="date" value={formState.date} onChange={(event) => { setFormState((current) => ({ ...current, date: event.target.value })); setFormError(null); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
            <input type="time" value={formState.entryTime} onChange={(event) => { setFormState((current) => ({ ...current, entryTime: event.target.value })); setFormError(null); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
            <input type="time" value={formState.exitTime} onChange={(event) => { setFormState((current) => ({ ...current, exitTime: event.target.value })); setFormError(null); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
          </div>
          <textarea value={formState.observation} onChange={(event) => { setFormState((current) => ({ ...current, observation: event.target.value })); setFormError(null); }} rows={3} placeholder="Observacion" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          {formMode === "edit" && (
            <textarea value={formState.correctionReason} onChange={(event) => { setFormState((current) => ({ ...current, correctionReason: event.target.value })); setFormError(null); }} rows={3} placeholder="Motivo de correccion" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          )}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitForm()} disabled={isRegisteringEntry || isUpdating}>
              {formMode === "edit" ? (isUpdating ? "Guardando..." : "Guardar cambios") : (isRegisteringEntry ? "Registrando..." : "Registrar manual")}
            </GradientButton>
            <OutlineButton size="sm" onClick={() => setIsFormOpen(false)} disabled={isRegisteringEntry || isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isDetailOpen} onClose={() => setIsDetailOpen(false)} width="max-w-[920px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Detalle de asistencia</h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Lectura real de `ong.asistencias`.</p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsDetailOpen(false)}>X</button>
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

      <ModalShell open={isCloseOpen} onClose={() => setIsCloseOpen(false)} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Registrar salida</h3>
          <input type="time" value={closingExitTime} onChange={(event) => { setClosingExitTime(event.target.value); setClosingError(null); }} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
          <textarea value={closingObservation} onChange={(event) => { setClosingObservation(event.target.value); setClosingError(null); }} rows={3} placeholder="Observacion opcional" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          {closingError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{closingError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitClose()} disabled={isRegisteringExit}>{isRegisteringExit ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsCloseOpen(false)} disabled={isRegisteringExit}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isIncidenceOpen} onClose={() => setIsIncidenceOpen(false)} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Marcar incidencia</h3>
          <textarea value={incidenceReason} onChange={(event) => { setIncidenceReason(event.target.value); setIncidenceError(null); }} rows={4} placeholder="Motivo" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          {incidenceError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{incidenceError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitIncidence()} disabled={isUpdating}>{isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsIncidenceOpen(false)} disabled={isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isRemoveOpen} onClose={() => setIsRemoveOpen(false)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Eliminar logico</h3>
          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>La accion actualiza `is_deleted`, `deleted_at` y `deleted_by`.</p>
          {removeError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{removeError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitRemove()} disabled={isRemoving}>{isRemoving ? "Eliminando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsRemoveOpen(false)} disabled={isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isScanOpen} onClose={() => setIsScanOpen(false)} width="max-w-[760px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Registrar asistencia por QR</h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>La RPC `ong.fn_register_attendance_scan` decide si registra check-in o check-out sobre `ong.asistencias` usando `ong.id_cards.qr_payload`.</p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsScanOpen(false)}>X</button>
          </div>
          {scanError && (
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="flex items-center gap-2">
                <StatusDot variant={resolveScanErrorVariant(scanError)}>
                  Credencial rechazada
                </StatusDot>
              </div>
              <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                {scanError}
              </p>
            </div>
          )}
          <select value={scanForm.activityId} onChange={(event) => { setScanForm((current) => ({ ...current, activityId: event.target.value })); setScanError(null); }} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE}>
            <option value="">Selecciona una actividad</option>
            {activityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <div className="space-y-2">
            <input
              ref={scanInputRef}
              value={scanForm.qrPayload}
              onChange={(event) => { setScanForm((current) => ({ ...current, qrPayload: event.target.value })); setScanError(null); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitScan();
                }
              }}
              placeholder="Escanea o pega aqui el payload QR y presiona Enter"
              className="h-11 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Si el lector QR actua como teclado, este campo queda listo para captura continua.
            </p>
          </div>
          {scanResult && (
            <div
              className="rounded-2xl px-4 py-4"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot variant="success">{scanResult.outcomeLabel} confirmado</StatusDot>
                <StatusDot variant="secondary">{scanResult.cardCode}</StatusDot>
              </div>
              <p className="mt-3 text-[13px]" style={{ color: "var(--t-text)" }}>
                {scanResult.confirmationMessage}
              </p>
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
            <GradientButton size="sm" onClick={() => void submitScan()} disabled={isScanning}>{isScanning ? "Procesando..." : "Confirmar"}</GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => {
                setScanResult(null);
                setScanError(null);
                setScanForm((current) => ({ ...current, qrPayload: "" }));
                window.setTimeout(() => scanInputRef.current?.focus(), 0);
              }}
              disabled={isScanning}
            >
              Limpiar
            </OutlineButton>
            <OutlineButton size="sm" onClick={() => setIsScanOpen(false)} disabled={isScanning}>Cerrar</OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
