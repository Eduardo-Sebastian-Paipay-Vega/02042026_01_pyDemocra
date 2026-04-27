import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
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

interface HoursFormErrors {
  activityId?: string;
  volunteerId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  minutes?: string;
  general?: string;
}

interface ResolutionTarget {
  hoursId: string;
  kind: ResolutionActionKind;
}

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
      className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
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
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {message}
      </p>
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

function FieldError({ message }: { message?: string }) {
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

function toMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatHours(minutes: number): string {
  const safeMinutes = Math.max(0, minutes);
  return `${Math.round((safeMinutes / 60) * 10) / 10}h`;
}

function statusLabel(kind: ApprovalStatusKind): string {
  if (kind === "approved") {
    return "Aprobada";
  }
  if (kind === "rejected") {
    return "Rechazada";
  }
  if (kind === "pending") {
    return "Pendiente";
  }
  return "Otro";
}

const columns: Column<OperationHoursRow>[] = [
  {
    key: "volunteer",
    label: "Voluntario",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text)" }}>
        {item.volunteerName}
      </span>
    ),
  },
  {
    key: "activity",
    label: "Actividad",
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
    key: "date",
    label: "Fecha",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.date}
      </span>
    ),
  },
  {
    key: "hours",
    label: "Horas",
    render: (item) => (
      <span className="tabular-nums text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.hours}h ({item.minutes} min)
      </span>
    ),
  },
  {
    key: "request",
    label: "Registro",
    render: (item) => (
      <div>
        <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {item.requestedBy}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.requestedAt}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => <StatusDot variant={item.statusVariant}>{item.statusName}</StatusDot>,
  },
];

export function Hours() {
  const [searchValue, setSearchValue] = useState("");
  const [scope, setScope] = useState<HoursFilters["scope"]>("all");
  const [status, setStatus] = useState<HoursFilters["status"]>("all");
  const [volunteerFilter, setVolunteerFilter] = useState<HoursFilters["volunteerId"]>("all");
  const [projectFilter, setProjectFilter] = useState<HoursFilters["projectId"]>("all");
  const [activityFilter, setActivityFilter] = useState<HoursFilters["activityId"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [formActivityId, setFormActivityId] = useState("all");
  const [formVolunteerId, setFormVolunteerId] = useState("all");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formMinutes, setFormMinutes] = useState("");
  const [formErrors, setFormErrors] = useState<HoursFormErrors>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [detailHoursId, setDetailHoursId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [resolutionTarget, setResolutionTarget] = useState<ResolutionTarget | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const [requestTarget, setRequestTarget] = useState<{ hoursId: string; volunteerId: string } | null>(
    null
  );
  const [requestComment, setRequestComment] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const ownerVolunteerId =
    scope === "mine" && volunteerFilter !== "all" ? volunteerFilter : null;

  const {
    loading,
    error,
    warnings,
    rows,
    stats,
    volunteerOptions,
    projectOptions,
    activityOptions,
    approvalStates,
    isRegistering,
    isUpdating,
    isResolving,
    isRequesting,
    createHours,
    updateHours,
    resolveHoursRecord,
    requestApproval,
    refresh,
  } = useOperationHours(
    {
      searchTerm: searchValue,
      status,
      scope,
      volunteerId: volunteerFilter,
      projectId: projectFilter,
      activityId: activityFilter,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    },
    ownerVolunteerId
  );

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useHoraDetail(isDetailModalOpen ? detailHoursId : null);

  const scopeFilters = useMemo(
    () => [
      { label: "Todas", value: "all", active: scope === "all" },
      { label: "Mis horas", value: "mine", active: scope === "mine" },
      { label: "Por revisar", value: "review", active: scope === "review" },
    ],
    [scope]
  );

  const statusOptions = useMemo(() => {
    const mapped = approvalStates.map((item) => ({
      value: item.kind,
      label: `Estado: ${item.label}`,
    }));

    const distinct = new Map<string, { value: string; label: string }>();
    for (const item of mapped) {
      if (!distinct.has(item.value)) {
        distinct.set(item.value, item);
      }
    }

    return [{ value: "all", label: "Estado: Todos" }, ...Array.from(distinct.values())];
  }, [approvalStates]);

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

  const stateByKind = useMemo(() => {
    const map = new Map<ApprovalStatusKind, number>();
    for (const option of approvalStates) {
      if (!map.has(option.kind)) {
        map.set(option.kind, option.value);
      }
    }
    return map;
  }, [approvalStates]);

  const isMutating = isRegistering || isUpdating || isResolving || isRequesting;

  function clearForm() {
    setEditingHoursId(null);
    setFormActivityId("all");
    setFormVolunteerId("all");
    setFormDate("");
    setFormStart("");
    setFormEnd("");
    setFormMinutes("");
    setFormErrors({});
  }

  function clearFormError(key: keyof HoursFormErrors) {
    setFormErrors((current) => ({ ...current, [key]: undefined, general: undefined }));
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    clearForm();
  }

  function openCreateModal() {
    clearForm();
    setFormDate(new Date().toISOString().slice(0, 10));
    setIsFormModalOpen(true);
  }

  function beginEdit(row: OperationHoursRow) {
    setEditingHoursId(row.id);
    setFormErrors({});
    setFormActivityId(row.activityId);
    setFormVolunteerId(row.volunteerId);
    setFormDate(row.date);
    setFormStart(row.startTime !== "--:--" ? row.startTime : "");
    setFormEnd(row.endTime !== "--:--" ? row.endTime : "");
    setFormMinutes("");
    setIsFormModalOpen(true);
  }

  function openDetailModal(hoursId: string) {
    setDetailHoursId(hoursId);
    setIsDetailModalOpen(true);
  }

  function closeDetailModal() {
    setIsDetailModalOpen(false);
    setDetailHoursId(null);
  }

  function validateForm(mode: FormMode): boolean {
    const nextErrors: HoursFormErrors = {};
    const hasRange = Boolean(formStart || formEnd);
    const hasMinutes = Boolean(formMinutes);

    if (formActivityId === "all") {
      nextErrors.activityId = "Selecciona una actividad.";
    }
    if (formVolunteerId === "all") {
      nextErrors.volunteerId = "Selecciona un voluntario.";
    }
    if (!formDate) {
      nextErrors.date = "La fecha es obligatoria.";
    }

    if (hasRange && (!formStart || !formEnd)) {
      nextErrors.startTime = "Completa hora de inicio y hora de fin.";
      nextErrors.endTime = "Completa hora de inicio y hora de fin.";
    }

    const startMinutes = formStart ? toMinutes(formStart) : null;
    const endMinutes = formEnd ? toMinutes(formEnd) : null;

    if (formStart && startMinutes === null) {
      nextErrors.startTime = "Hora de inicio invalida.";
    }
    if (formEnd && endMinutes === null) {
      nextErrors.endTime = "Hora de fin invalida.";
    }
    if (startMinutes !== null && endMinutes !== null && endMinutes < startMinutes) {
      nextErrors.endTime = "La hora de fin no puede ser anterior a la hora de inicio.";
    }

    const parsedMinutes = formMinutes ? Number(formMinutes) : null;
    if (formMinutes && (Number.isNaN(parsedMinutes) || parsedMinutes <= 0)) {
      nextErrors.minutes = "Los minutos deben ser un numero positivo.";
    }

    if (!hasRange && !hasMinutes) {
      nextErrors.minutes = "Debes ingresar rango horario o minutos.";
    }
    if (hasRange && hasMinutes) {
      nextErrors.minutes = "Usa rango horario o minutos, no ambos.";
    }

    if (mode === "edit" && !editingHoursId) {
      nextErrors.general = "No se encontro el registro a editar.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmitHours() {
    const mode: FormMode = editingHoursId ? "edit" : "create";
    if (!validateForm(mode)) {
      return;
    }

    const minutes = formMinutes ? Number(formMinutes) : null;

    try {
      if (editingHoursId) {
        const result = await updateHours({
          hoursId: editingHoursId,
          activityId: formActivityId,
          volunteerId: formVolunteerId,
          date: formDate,
          startTime: formStart || null,
          endTime: formEnd || null,
          minutes,
        });
        if (!result) {
          return;
        }
        if (result.warning) {
          toast.warning(result.warning);
        }
        toast.success("Horas actualizadas.");
        if (isDetailModalOpen && detailHoursId === editingHoursId) {
          refreshDetail();
        }
      } else {
        const result = await createHours({
          activityId: formActivityId,
          volunteerId: formVolunteerId,
          date: formDate,
          startTime: formStart || undefined,
          endTime: formEnd || undefined,
          minutes,
        });
        if (!result) {
          return;
        }
        if (result.warning) {
          toast.warning(result.warning);
        }
        toast.success("Horas registradas.");
      }
      closeFormModal();
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

    setResolutionTarget({
      hoursId: row.id,
      kind,
    });
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
    if (!resolutionTarget) {
      return;
    }

    const targetStateId = stateByKind.get(resolutionTarget.kind);
    if (!targetStateId) {
      setResolutionError("No existe estado configurado para esta accion.");
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
      if (!result) {
        return;
      }
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
    if (!requestTarget) {
      return;
    }

    try {
      const result = await requestApproval({
        hoursId: requestTarget.hoursId,
        requesterId: requestTarget.volunteerId,
        comment: requestComment.trim() || undefined,
      });
      if (!result) {
        return;
      }
      if (result.warning) {
        toast.warning(result.warning);
      }
      toast.success("Solicitud de aprobacion enviada.");
      closeRequestApprovalModal();
      if (isDetailModalOpen && detailHoursId === requestTarget.hoursId) {
        refreshDetail();
      }
    } catch (actionError) {
      setRequestError(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo solicitar la aprobacion."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Horas"
          description="Registro operativo sobre ong.horas_actividad con estados reales de aprobacion."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" onClick={openCreateModal}>
            Registrar horas
          </GradientButton>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Pendientes
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.pending}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Aprobadas
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.approved}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Rechazadas
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.rejected}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Total visibles
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {rows.length}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por voluntario, actividad o proyecto..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={scopeFilters}
          onFilterClick={(value) => setScope(value as HoursFilters["scope"])}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
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
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <ErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      {warnings.length > 0 && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl px-4 py-3 text-[12px]"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p style={{ color: "var(--t-text-tertiary)" }}>{warnings.join(" ")}</p>
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
              onClick: (item) => openDetailModal(item.id),
            },
            {
              label: "Solicitar aprobacion",
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
      </motion.div>

      <ModalShell open={isFormModalOpen} onClose={closeFormModal} width="max-w-[980px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {editingHoursId ? "Editar horas" : "Registrar horas"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              ong.horas_actividad persiste fecha, horas_registradas y estado_aprobacion.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeFormModal}
          >
            X
          </button>
        </div>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {formErrors.general && (
            <ErrorBlock
              message={formErrors.general}
              onRetry={() =>
                setFormErrors((current) => ({ ...current, general: undefined }))
              }
            />
          )}

          <div
            className="rounded-2xl px-4 py-3 text-[12px]"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p style={{ color: "var(--t-text-tertiary)" }}>
              Si ingresas hora inicio y hora fin, la UI solo las usa para calcular el total de horas. Ese rango no se guarda en la tabla.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <SelectField
                value={formActivityId}
                onChange={(value) => {
                  setFormActivityId(value);
                  clearFormError("activityId");
                }}
                options={[{ value: "all", label: "Actividad" }, ...activityOptions]}
              />
              <FieldError message={formErrors.activityId} />
            </div>

            <div className="space-y-1">
              <SelectField
                value={formVolunteerId}
                onChange={(value) => {
                  setFormVolunteerId(value);
                  clearFormError("volunteerId");
                }}
                options={[{ value: "all", label: "Voluntario" }, ...volunteerOptions]}
              />
              <FieldError message={formErrors.volunteerId} />
            </div>

            <div className="space-y-1">
              <input
                type="date"
                value={formDate}
                onChange={(event) => {
                  setFormDate(event.target.value);
                  clearFormError("date");
                }}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.date} />
            </div>

            <div className="space-y-1">
              <input
                value={formMinutes}
                onChange={(event) => {
                  setFormMinutes(event.target.value);
                  clearFormError("minutes");
                }}
                placeholder="Minutos"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.minutes} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input
                type="time"
                value={formStart}
                onChange={(event) => {
                  setFormStart(event.target.value);
                  clearFormError("startTime");
                }}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.startTime} />
            </div>

            <div className="space-y-1">
              <input
                type="time"
                value={formEnd}
                onChange={(event) => {
                  setFormEnd(event.target.value);
                  clearFormError("endTime");
                }}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.endTime} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={handleSubmitHours} disabled={isMutating}>
              {editingHoursId ? "Guardar cambios" : "Registrar horas"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeFormModal} disabled={isMutating}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isDetailModalOpen} onClose={closeDetailModal} width="max-w-[920px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Detalle de horas
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Registro, aprobacion y trazabilidad disponible en la tabla real.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeDetailModal}
          >
            X
          </button>
        </div>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {detailLoading && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>
            </div>
          )}

          {!detailLoading && detailError && (
            <ErrorBlock message={detailError} onRetry={refreshDetail} />
          )}

          {!detailLoading && !detailError && detail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot variant={detail.statusVariant}>{detail.statusName}</StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Voluntario" value={detail.volunteerName} />
                <DetailField label="Actividad" value={detail.activityName} />
                <DetailField label="Proyecto" value={detail.projectName} />
                <DetailField label="Fecha" value={detail.date} />
                <DetailField label="Hora inicio" value={detail.startTime} />
                <DetailField label="Hora fin" value={detail.endTime} />
                <DetailField label="Minutos" value={`${detail.minutes} min`} />
                <DetailField label="Duracion" value={formatHours(detail.minutes)} />
                <DetailField label="Estado" value={statusLabel(detail.statusKind)} />
                <DetailField
                  label="Solicitado por"
                  value={`${detail.requestedBy} (${detail.requestedAt})`}
                />
                <DetailField
                  label="Aprobado por"
                  value={`${detail.approvedBy} (${detail.approvedAt})`}
                />
                <DetailField
                  label="Comentario resolucion"
                  value={detail.observation || "-"}
                />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  Advertencia del contrato SQL
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  ong.horas_actividad no guarda rango horario, pero ya persiste `comentario_resolucion` e `id_aprobacion`. La pantalla sincroniza el comentario con `ong.aprobaciones`.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    closeDetailModal();
                    beginEdit(detail);
                  }}
                >
                  Editar
                </OutlineButton>
                <OutlineButton size="sm" onClick={() => openRequestApprovalModal(detail)}>
                  Solicitar aprobacion
                </OutlineButton>
                <OutlineButton size="sm" onClick={() => openResolutionModal(detail, "approved")}>
                  Aprobar
                </OutlineButton>
                <OutlineButton size="sm" onClick={() => openResolutionModal(detail, "rejected")}>
                  Rechazar
                </OutlineButton>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isResolutionModalOpen} onClose={closeResolutionModal} width="max-w-[560px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {resolutionTarget
                ? `${resolutionTarget.kind === "approved" ? "Aprobar" : "Rechazar"} horas`
                : "Resolver horas"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              El comentario es opcional y se sincroniza en `ong.aprobaciones.comentario` y `ong.horas_actividad.comentario_resolucion`.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeResolutionModal}
          >
            X
          </button>
        </div>

        <div className="space-y-3 p-4">
          <textarea
            value={resolutionComment}
            onChange={(event) => {
              setResolutionComment(event.target.value);
              setResolutionError(null);
            }}
            rows={4}
            placeholder="Comentario opcional"
            className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />

          {resolutionError && <FieldError message={resolutionError} />}

          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" disabled={isMutating} onClick={() => void submitResolution()}>
              Confirmar
            </GradientButton>
            <OutlineButton size="sm" onClick={closeResolutionModal} disabled={isMutating}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isRequestModalOpen} onClose={closeRequestApprovalModal} width="max-w-[560px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Solicitar aprobacion
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              El comentario es opcional y la operacion solo devuelve el registro a estado pendiente.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeRequestApprovalModal}
          >
            X
          </button>
        </div>

        <div className="space-y-3 p-4">
          <textarea
            value={requestComment}
            onChange={(event) => {
              setRequestComment(event.target.value);
              setRequestError(null);
            }}
            rows={3}
            placeholder="Comentario opcional"
            className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />

          {requestError && <FieldError message={requestError} />}

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              disabled={isMutating}
              onClick={() => void submitRequestApproval()}
            >
              Enviar solicitud
            </GradientButton>
            <OutlineButton size="sm" onClick={closeRequestApprovalModal} disabled={isMutating}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
