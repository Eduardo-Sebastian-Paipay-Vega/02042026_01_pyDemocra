import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { PageHeader } from "../components/shared/PageHeader";
import { StatusDot } from "@/core/components/ui/status-dot";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { useSessionStorageState } from "../lib/session-state";
import { useAsignacionesActividad } from "../modules/operation/hooks/useAsignacionesActividad";
import { useActividadDetail } from "../modules/operation/hooks/useActividadDetail";
import { useActividadMutations } from "../modules/operation/hooks/useActividadMutations";
import { useOperationActivities } from "../modules/operation/useOperationActivities";
import type {
  ActivityAssignmentRow,
  ActivityPeriodFilter,
  OperationActivityFilters,
  OperationActivityRow,
} from "../modules/operation/types";

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

interface ActivityFormErrors {
  taskId?: string;
  name?: string;
  statusId?: string;
  dateOrder?: string;
}

function toLocalDateTimeInput(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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
    <p className="mt-1 text-[11px]" style={{ color: "#fca5a5" }}>
      {message}
    </p>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
  disabled = false,
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

const columns: Column<OperationActivityRow>[] = [
  {
    key: "name",
    label: "Actividad",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.name}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.taskName} - {item.projectName}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => <StatusDot variant={item.statusVariant}>{item.statusName}</StatusDot>,
  },
  {
    key: "schedule",
    label: "Horario",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.scheduleText}
      </span>
    ),
  },
  {
    key: "location",
    label: "Ubicacion",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.locationName}
      </span>
    ),
  },
  {
    key: "meta",
    label: "Horas estimadas",
    render: (item) => (
      <span className="line-clamp-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.meta}
      </span>
    ),
  },
  {
    key: "volunteers",
    label: "Vol.",
    render: (item) => (
      <span className="tabular-nums text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.assignedVolunteers}
      </span>
    ),
  },
];

export function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useSessionStorageState(
    "ong.view.activities.search",
    ""
  );
  const [period, setPeriod] = useSessionStorageState<ActivityPeriodFilter>(
    "ong.view.activities.period",
    "all"
  );
  const [stateId, setStateId] = useSessionStorageState<OperationActivityFilters["stateId"]>(
    "ong.view.activities.state",
    "all"
  );
  const [projectId, setProjectId] =
    useSessionStorageState<OperationActivityFilters["projectId"]>(
      "ong.view.activities.project",
      "all"
    );
  const [taskId, setTaskId] = useSessionStorageState<OperationActivityFilters["taskId"]>(
    "ong.view.activities.task",
    "all"
  );
  const [locationId, setLocationId] =
    useSessionStorageState<OperationActivityFilters["locationId"]>(
      "ong.view.activities.location",
      "all"
    );
  const [volunteerId, setVolunteerId] =
    useSessionStorageState<OperationActivityFilters["volunteerId"]>(
      "ong.view.activities.volunteer",
      "all"
    );

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useSessionStorageState<string | null>(
    "ong.view.activities.editing-activity-id",
    null
  );
  const [isActivityFormModalOpen, setIsActivityFormModalOpen] = useSessionStorageState(
    "ong.view.activities.form-open",
    false
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [statusTargetRow, setStatusTargetRow] = useState<OperationActivityRow | null>(null);
  const [statusChangeValue, setStatusChangeValue] = useState("all");
  const [deleteTargetRow, setDeleteTargetRow] = useState<OperationActivityRow | null>(null);
  const [assignmentToDeactivate, setAssignmentToDeactivate] =
    useState<ActivityAssignmentRow | null>(null);

  const [formTaskId, setFormTaskId] = useSessionStorageState(
    "ong.view.activities.form.task-id",
    "all"
  );
  const [formName, setFormName] = useSessionStorageState(
    "ong.view.activities.form.name",
    ""
  );
  const [formDescription, setFormDescription] = useSessionStorageState(
    "ong.view.activities.form.description",
    ""
  );
  const [formStateId, setFormStateId] = useSessionStorageState(
    "ong.view.activities.form.state-id",
    "all"
  );
  const [formLocationId, setFormLocationId] = useSessionStorageState(
    "ong.view.activities.form.location-id",
    "all"
  );
  const [formStartAt, setFormStartAt] = useSessionStorageState(
    "ong.view.activities.form.start-at",
    ""
  );
  const [formEndAt, setFormEndAt] = useSessionStorageState(
    "ong.view.activities.form.end-at",
    ""
  );
  const [formMeta, setFormMeta] = useSessionStorageState(
    "ong.view.activities.form.meta",
    ""
  );
  const [formErrors, setFormErrors] = useState<ActivityFormErrors>({});

  const [assignmentVolunteerId, setAssignmentVolunteerId] = useState("all");
  const [assignmentRole, setAssignmentRole] = useState("");
  const activityIdParam = searchParams.get("activityId");

  const {
    loading,
    error,
    warnings,
    rows,
    summary,
    stateOptions,
    projectOptions,
    taskOptions,
    locationOptions,
    volunteerOptions,
    refresh,
  } = useOperationActivities({
    searchTerm: searchValue,
    period,
    stateId,
    projectId,
    taskId,
    locationId,
    volunteerId,
  });

  const { detail, relations, loading: detailLoading, error: detailError, refresh: refreshDetail } =
    useActividadDetail(selectedActivityId);

  const {
    rows: assignmentRows,
    loading: assignmentLoading,
    error: assignmentError,
    refresh: refreshAssignments,
  } = useAsignacionesActividad(selectedActivityId, true);

  const mutations = useActividadMutations(() => {
    refresh();
    refreshDetail();
    refreshAssignments();
  });

  useEffect(() => {
    if (!rows.length) {
      setSelectedActivityId(null);
      return;
    }

    if (!selectedActivityId || !rows.some((item) => item.id === selectedActivityId)) {
      setSelectedActivityId(rows[0].id);
    }
  }, [rows, selectedActivityId]);

  useEffect(() => {
    if (!activityIdParam) {
      return;
    }

    setSelectedActivityId(activityIdParam);
    setIsDetailModalOpen(true);
  }, [activityIdParam]);

  const periodFilters = useMemo(
    () => [
      { label: "Todas", value: "all", active: period === "all" },
      { label: "Hoy", value: "today", active: period === "today" },
      { label: "Semana", value: "week", active: period === "week" },
    ],
    [period]
  );

  const statusSelectOptions = useMemo(
    () => [
      { value: "all", label: "Estado: Todos" },
      ...stateOptions.map((option) => ({
        value: String(option.value),
        label: `Estado: ${option.label}`,
      })),
    ],
    [stateOptions]
  );

  const statusOnlyOptions = useMemo(
    () => stateOptions.map((option) => ({ value: String(option.value), label: option.label })),
    [stateOptions]
  );

  const projectSelectOptions = useMemo(
    () => [
      { value: "all", label: "Proyecto: Todos" },
      ...projectOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [projectOptions]
  );

  const taskSelectOptions = useMemo(
    () => [
      { value: "all", label: "Tarea: Todas" },
      ...taskOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [taskOptions]
  );

  const taskSelectOptionsWithoutAll = useMemo(
    () => taskSelectOptions.filter((option) => option.value !== "all"),
    [taskSelectOptions]
  );

  const locationSelectOptions = useMemo(
    () => [
      { value: "all", label: "Ubicacion: Todas" },
      ...locationOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [locationOptions]
  );

  const volunteerSelectOptions = useMemo(
    () => [
      { value: "all", label: "Voluntario: Todos" },
      ...volunteerOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [volunteerOptions]
  );

  const activeAssignmentCount = useMemo(
    () => assignmentRows.filter((item) => item.active).length,
    [assignmentRows]
  );

  const assignmentVolunteerOptions = useMemo(() => {
    const activeVolunteerIds = new Set(
      assignmentRows.filter((item) => item.active).map((item) => item.volunteerId)
    );

    return [
      { value: "all", label: "Voluntario" },
      ...volunteerOptions.filter(
        (item) => !activeVolunteerIds.has(item.value) || item.value === assignmentVolunteerId
      ),
    ];
  }, [assignmentRows, volunteerOptions, assignmentVolunteerId]);

  function resetForm() {
    setEditingActivityId(null);
    setFormTaskId("all");
    setFormName("");
    setFormDescription("");
    setFormStateId("all");
    setFormLocationId("all");
    setFormStartAt("");
    setFormEndAt("");
    setFormMeta("");
    setFormErrors({});
  }

  function closeActivityFormModal() {
    setIsActivityFormModalOpen(false);
    resetForm();
  }

  function openCreateActivityModal() {
    resetForm();
    setIsActivityFormModalOpen(true);
  }

  function openDetailModal(activityId: string) {
    setSelectedActivityId(activityId);
    setIsDetailModalOpen(true);
  }

  function closeDetailModal() {
    setIsDetailModalOpen(false);
    setAssignmentVolunteerId("all");
    setAssignmentRole("");
    setAssignmentToDeactivate(null);

    if (!activityIdParam) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("activityId");
    setSearchParams(next, { replace: true });
  }

  function validateActivityForm(): ActivityFormErrors {
    const errors: ActivityFormErrors = {};

    if (formTaskId === "all") {
      errors.taskId = "Selecciona una tarea.";
    }
    if (!formName.trim()) {
      errors.name = "El nombre de la actividad es obligatorio.";
    }
    if (formStateId === "all") {
      errors.statusId = "Selecciona un estado.";
    }
    if (formStartAt && formEndAt && new Date(formEndAt).getTime() < new Date(formStartAt).getTime()) {
      errors.dateOrder = "La fecha fin no puede ser menor a la fecha inicio.";
    }

    return errors;
  }

  function refreshAll() {
    refresh();
    refreshDetail();
    refreshAssignments();
  }

  async function handleSubmitActivity() {
    if (mutations.isSaving) {
      return;
    }

    const errors = validateActivityForm();
    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Revisa los campos obligatorios del formulario.");
      return;
    }

    try {
      if (editingActivityId) {
        await mutations.update(editingActivityId, {
          taskId: formTaskId,
          name: formName,
          description: formDescription,
          statusId: Number(formStateId),
          locationId: formLocationId === "all" ? null : formLocationId,
          startAt: formStartAt || null,
          endAt: formEndAt || null,
          meta: formMeta || null,
        });
        toast.success("Actividad actualizada.");
      } else {
        const created = await mutations.create({
          taskId: formTaskId,
          name: formName,
          description: formDescription,
          statusId: Number(formStateId),
          locationId: formLocationId === "all" ? null : formLocationId,
          startAt: formStartAt || null,
          endAt: formEndAt || null,
          meta: formMeta || null,
        });
        if (created) {
          setSelectedActivityId(created.activity.id);
        }
        toast.success("Actividad creada.");
      }
      closeActivityFormModal();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo guardar la actividad."
      );
    }
  }

  function beginEditActivity(row: OperationActivityRow) {
    setIsActivityFormModalOpen(true);
    setEditingActivityId(row.id);
    setSelectedActivityId(row.id);
    setFormTaskId(row.taskId);
    setFormName(row.name);
    setFormDescription(row.description || "");
    setFormStateId(row.statusId !== null ? String(row.statusId) : "all");
    setFormLocationId(row.locationId ?? "all");
    setFormStartAt(row.startAt ? row.startAt.slice(0, 10) : "");
    setFormEndAt(row.endAt ? row.endAt.slice(0, 10) : "");
    setFormMeta(row.meta === "Sin meta definida" ? "" : row.meta);
    setFormErrors({});
  }

  async function quickComplete(row: OperationActivityRow) {
    const completeState = stateOptions.find((option) => {
      const normalized = option.label.toLowerCase();
      return (
        normalized.includes("complet") ||
        normalized.includes("finaliz") ||
        normalized.includes("cerrad")
      );
    });

    if (!completeState) {
      toast.error("No existe un estado de completado en el catalogo.");
      return;
    }
    if (row.statusId === completeState.value) {
      toast.info("La actividad ya esta en estado completado.");
      return;
    }

    try {
      await mutations.quickChangeState(row.id, completeState.value);
      toast.success("Estado actualizado.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo actualizar el estado."
      );
    }
  }

  function openStatusModal(row: OperationActivityRow) {
    if (!statusOnlyOptions.length) {
      toast.error("No hay estados disponibles para actualizar.");
      return;
    }

    setStatusTargetRow(row);
    setStatusChangeValue(
      row.statusId !== null ? String(row.statusId) : statusOnlyOptions[0].value
    );
    setIsStatusModalOpen(true);
  }

  function closeStatusModal() {
    setIsStatusModalOpen(false);
    setStatusTargetRow(null);
    setStatusChangeValue("all");
  }

  async function handleChangeStatus() {
    if (!statusTargetRow) {
      return;
    }
    if (statusChangeValue === "all") {
      toast.error("Selecciona un estado para continuar.");
      return;
    }

    const targetStateId = Number(statusChangeValue);
    if (Number.isNaN(targetStateId)) {
      toast.error("El estado seleccionado no es valido.");
      return;
    }
    if (statusTargetRow.statusId === targetStateId) {
      toast.info("La actividad ya tiene ese estado.");
      return;
    }

    try {
      await mutations.quickChangeState(statusTargetRow.id, targetStateId);
      toast.success("Estado actualizado.");
      closeStatusModal();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo actualizar el estado."
      );
    }
  }

  function requestDeleteActivity(row: OperationActivityRow) {
    setDeleteTargetRow(row);
  }

  function cancelDeleteActivity() {
    setDeleteTargetRow(null);
  }

  async function confirmDeleteActivity() {
    if (!deleteTargetRow) {
      return;
    }

    try {
      await mutations.remove(deleteTargetRow.id);
      if (selectedActivityId === deleteTargetRow.id) {
        setSelectedActivityId(null);
        setIsDetailModalOpen(false);
      }
      setDeleteTargetRow(null);
      toast.success("Actividad cancelada.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo eliminar la actividad."
      );
    }
  }

  async function assignVolunteer() {
    if (!selectedActivityId) {
      toast.error("Selecciona una actividad para asignar voluntarios.");
      return;
    }
    if (assignmentVolunteerId === "all") {
      toast.error("Selecciona un voluntario.");
      return;
    }
    if (assignmentRole.trim().length > 120) {
      toast.error("El rol no puede exceder 120 caracteres.");
      return;
    }

    const alreadyAssigned = assignmentRows.some(
      (item) => item.active && item.volunteerId === assignmentVolunteerId
    );
    if (alreadyAssigned) {
      toast.error("El voluntario ya tiene una asignacion activa en esta actividad.");
      return;
    }

    try {
      await mutations.assignVolunteer({
        activityId: selectedActivityId,
        volunteerId: assignmentVolunteerId,
        role: assignmentRole,
      });
      setAssignmentVolunteerId("all");
      setAssignmentRole("");
      toast.success("Voluntario asignado.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo asignar al voluntario."
      );
    }
  }

  function requestRemoveAssignment(assignment: ActivityAssignmentRow) {
    setAssignmentToDeactivate(assignment);
  }

  function cancelRemoveAssignment() {
    setAssignmentToDeactivate(null);
  }

  async function confirmRemoveAssignment() {
    if (!assignmentToDeactivate) {
      return;
    }

    try {
      await mutations.removeAssignment(assignmentToDeactivate.id);
      setAssignmentToDeactivate(null);
      toast.success("Asignacion retirada.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo desactivar la asignacion."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Actividades"
          description="Gestiona actividades y asignaciones con flujo operativo completo"
          action={{
            label: "Actualizar",
            onClick: refreshAll,
          }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" onClick={openCreateActivityModal}>
            Crear actividad
          </GradientButton>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por actividad, tarea, proyecto o voluntario..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={periodFilters}
          onFilterClick={(value) => setPeriod(value as ActivityPeriodFilter)}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <SelectFilter
            value={String(stateId)}
            onChange={(value) => setStateId(value === "all" ? "all" : Number(value))}
            options={statusSelectOptions}
          />
          <SelectFilter
            value={projectId}
            onChange={(value) => setProjectId(value === "all" ? "all" : value)}
            options={projectSelectOptions}
          />
          <SelectFilter
            value={taskId}
            onChange={(value) => setTaskId(value === "all" ? "all" : value)}
            options={taskSelectOptions}
          />
          <SelectFilter
            value={locationId}
            onChange={(value) => setLocationId(value === "all" ? "all" : value)}
            options={locationSelectOptions}
          />
          <SelectFilter
            value={volunteerId}
            onChange={(value) => setVolunteerId(value === "all" ? "all" : value)}
            options={volunteerSelectOptions}
          />
          <OutlineButton size="sm" onClick={refreshAll}>
            Refrescar
          </OutlineButton>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <ErrorBlock message={error} onRetry={refreshAll} />
        </motion.div>
      )}

      {warnings.length > 0 && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl px-4 py-3 text-[12px]"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p style={{ color: "var(--t-text-tertiary)" }}>
              Se cargaron actividades con advertencias de datos relacionados.
            </p>
          </div>
        </motion.div>
      )}

      {summary.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.slice(0, 4).map((item) => (
              <div
                key={item.key}
                className="rounded-2xl p-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                  {item.label}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
                    {item.count}
                  </p>
                  <StatusDot variant={item.variant}>{item.label}</StatusDot>
                </div>
              </div>
            ))}
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
              label: "Editar",
              onClick: (item) => beginEditActivity(item),
            },
            {
              label: "Cambiar estado",
              onClick: (item) => openStatusModal(item),
            },
            {
              label: "Marcar completada",
              onClick: (item) => void quickComplete(item),
            },
            {
              label: "Eliminar",
              onClick: (item) => requestDeleteActivity(item),
              variant: "destructive",
            },
          ]}
          emptyMessage="No se encontraron actividades para los filtros seleccionados"
        />
      </motion.div>

      <ModalShell
        open={isActivityFormModalOpen}
        onClose={closeActivityFormModal}
        width="max-w-[980px]"
      >
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {editingActivityId ? "Editar actividad" : "Crear actividad"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Completa los datos operativos para guardar la actividad.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeActivityFormModal}
          >
            X
          </button>
        </div>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <SelectFilter
                value={formTaskId}
                onChange={(value) => {
                  setFormTaskId(value);
                  setFormErrors((current) => ({ ...current, taskId: undefined }));
                }}
                options={[{ value: "all", label: "Tarea" }, ...taskSelectOptionsWithoutAll]}
                disabled={mutations.isSaving}
              />
              <FieldError message={formErrors.taskId} />
            </div>
            <div>
              <input
                value={formName}
                onChange={(event) => {
                  setFormName(event.target.value);
                  setFormErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="Nombre de actividad"
                disabled={mutations.isSaving}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.name} />
            </div>
            <div>
              <SelectFilter
                value={formStateId}
                onChange={(value) => {
                  setFormStateId(value);
                  setFormErrors((current) => ({ ...current, statusId: undefined }));
                }}
                options={[{ value: "all", label: "Estado" }, ...statusOnlyOptions]}
                disabled={mutations.isSaving}
              />
              <FieldError message={formErrors.statusId} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="date"
              value={formStartAt}
              onChange={(event) => {
                setFormStartAt(event.target.value);
                setFormErrors((current) => ({ ...current, dateOrder: undefined }));
              }}
              disabled={mutations.isSaving}
              className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <input
              type="date"
              value={formEndAt}
              onChange={(event) => {
                setFormEndAt(event.target.value);
                setFormErrors((current) => ({ ...current, dateOrder: undefined }));
              }}
              disabled={mutations.isSaving}
              className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <SelectFilter
              value={formLocationId}
              onChange={setFormLocationId}
              options={[{ value: "all", label: "Ubicacion" }, ...locationOptions]}
              disabled={mutations.isSaving}
            />
            <input
              value={formMeta}
              onChange={(event) => setFormMeta(event.target.value)}
              placeholder="Horas estimadas (opcional)"
              disabled={mutations.isSaving}
              className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <input
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              placeholder="Descripcion (opcional)"
              disabled={mutations.isSaving}
              className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2 xl:col-span-4"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
          </div>
          <FieldError message={formErrors.dateOrder} />

          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={handleSubmitActivity} disabled={mutations.isSaving}>
              {mutations.isSaving
                ? "Guardando..."
                : editingActivityId
                ? "Guardar cambios"
                : "Crear actividad"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeActivityFormModal}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isDetailModalOpen} onClose={closeDetailModal} width="max-w-[1100px]">
        <div className="flex items-start justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Detalle de actividad
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Revisa relaciones y asignaciones sin ensuciar la vista principal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {detail && (
              <OutlineButton size="sm" onClick={() => openStatusModal(detail.activity)}>
                Cambiar estado
              </OutlineButton>
            )}
            <OutlineButton size="sm" onClick={refreshAll}>
              Recargar detalle
            </OutlineButton>
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
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          {!selectedActivityId && (
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Selecciona una actividad para ver su detalle.
            </p>
          )}
          {selectedActivityId && detailLoading && (
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Cargando detalle...
            </p>
          )}
          {selectedActivityId && detailError && (
            <ErrorBlock message={detailError} onRetry={refreshAll} />
          )}
          {selectedActivityId && !detailLoading && detail && (
            <div className="space-y-4">
              {detail.warnings && detail.warnings.length > 0 && (
                <div
                  className="rounded-xl px-3 py-2 text-[12px]"
                  style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                >
                  <p style={{ color: "var(--t-text-tertiary)" }}>
                    Se detectaron advertencias al cargar el detalle. Puedes reintentar para completar la informacion.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Actividad
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {detail.activity.name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Estado
                  </p>
                  <StatusDot variant={detail.activity.statusVariant}>
                    {detail.activity.statusName}
                  </StatusDot>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Proyecto
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {detail.activity.projectName}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Tarea
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {detail.activity.taskName}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Ubicacion
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {detail.activity.locationName || "No documentada"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Fechas
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {detail.activity.scheduleText}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Horas estimadas
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {detail.activity.meta || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Asignados
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    {activeAssignmentCount}
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
              >
                <p className="mb-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  Descripcion
                </p>
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {detail.activity.description || "Sin descripcion registrada."}
                </p>
                <p className="mt-3 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {relations
                    ? `Asistencias ${relations.attendanceCount} / Horas ${relations.hoursCount} / Evidencias ${relations.evidenceCount}`
                    : "Sin resumen de relaciones por el momento."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div
                  className="rounded-xl p-3"
                  style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                >
                  <p className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                    Equipo asignado
                  </p>
                  {assignmentLoading && (
                    <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Cargando asignaciones...
                    </p>
                  )}
                  {!assignmentLoading && assignmentError && (
                    <ErrorBlock message={assignmentError} onRetry={refreshAssignments} />
                  )}
                  {!assignmentLoading && !assignmentError && (
                    <div className="space-y-2">
                      {assignmentRows.length === 0 && (
                        <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                          No hay voluntarios asignados.
                        </p>
                      )}
                      {assignmentRows.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
                              {assignment.volunteerName}
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                              {assignment.role || "Sin rol"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusDot variant={assignment.active ? "success" : "secondary"}>
                              {assignment.active ? "Activa" : "Inactiva"}
                            </StatusDot>
                            {assignment.active && (
                              <button
                                type="button"
                                className="rounded-md px-2 py-1 text-[11px] text-red-300 hover:bg-[var(--t-hover)]"
                                onClick={() => requestRemoveAssignment(assignment)}
                                disabled={mutations.isUpdatingAssignment}
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <SelectFilter
                      value={assignmentVolunteerId}
                      onChange={setAssignmentVolunteerId}
                      options={assignmentVolunteerOptions}
                      disabled={mutations.isAssigning || assignmentLoading}
                    />
                    <input
                      value={assignmentRole}
                      onChange={(event) => setAssignmentRole(event.target.value)}
                      placeholder="Rol (opcional)"
                      disabled={mutations.isAssigning || assignmentLoading}
                      className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        border: "1px solid var(--t-border)",
                        background: "var(--t-input-bg)",
                        color: "var(--t-text-secondary)",
                      }}
                    />
                    <GradientButton
                      size="sm"
                      onClick={assignVolunteer}
                      disabled={mutations.isAssigning || assignmentLoading}
                    >
                      {mutations.isAssigning ? "Asignando..." : "Asignar"}
                    </GradientButton>
                  </div>
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
                >
                  <p className="mb-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                    Horas relacionadas
                  </p>
                  <div className="space-y-2">
                    {detail.hours.slice(0, 5).map((hour) => (
                      <div key={hour.id} className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                        {hour.date} - {hour.volunteerName} - {hour.minutes} min ({hour.statusName})
                      </div>
                    ))}
                    {detail.hours.length === 0 && (
                      <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                        Sin horas registradas.
                      </p>
                    )}
                  </div>

                  <p className="mb-2 mt-4 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                    Evidencias relacionadas
                  </p>
                  <div className="space-y-2">
                    {detail.evidences.slice(0, 5).map((evidence) => (
                      <div key={evidence.id} className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                        {evidence.uploadedAt} - {evidence.typeName} - {evidence.validationStatusName}
                      </div>
                    ))}
                    {detail.evidences.length === 0 && (
                      <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                        Sin evidencias registradas.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isStatusModalOpen} onClose={closeStatusModal} width="max-w-[520px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Cambiar estado de actividad
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Selecciona el nuevo estado desde el catalogo real.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeStatusModal}
          >
            X
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {statusTargetRow?.name ?? "Actividad"}
          </p>
          <SelectFilter
            value={statusChangeValue}
            onChange={setStatusChangeValue}
            options={[{ value: "all", label: "Selecciona estado" }, ...statusOnlyOptions]}
            disabled={mutations.isSaving}
          />
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={handleChangeStatus} disabled={mutations.isSaving}>
              {mutations.isSaving ? "Guardando..." : "Actualizar estado"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeStatusModal}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(deleteTargetRow)}
        onClose={cancelDeleteActivity}
        width="max-w-[520px]"
      >
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Confirmar cancelacion operativa
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Esta accion marcara la actividad como cancelada dentro del contrato operativo vigente.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={cancelDeleteActivity}
          >
            X
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {deleteTargetRow
              ? `Se cancelara la actividad "${deleteTargetRow.name}" actualizando su propio estado.`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={confirmDeleteActivity} disabled={mutations.isDeleting}>
              {mutations.isDeleting ? "Eliminando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={cancelDeleteActivity}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(assignmentToDeactivate)}
        onClose={cancelRemoveAssignment}
        width="max-w-[520px]"
      >
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Confirmar retiro de asignacion
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              La asignacion se retirara de la actividad y dejara de aparecer en el equipo asignado.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={cancelRemoveAssignment}
          >
            X
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {assignmentToDeactivate
              ? `Se retirara la asignacion de ${assignmentToDeactivate.volunteerName}.`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={confirmRemoveAssignment}
              disabled={mutations.isUpdatingAssignment}
            >
              {mutations.isUpdatingAssignment ? "Guardando..." : "Retirar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={cancelRemoveAssignment}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}


