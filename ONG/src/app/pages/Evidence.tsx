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
import { useOperationEvidence } from "../modules/operation/useOperationEvidence";
import type { EvidenceFilters, OperationEvidenceRow } from "../modules/operation/types";

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

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-xl px-3 text-[12px] outline-none"
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

const columns: Column<OperationEvidenceRow>[] = [
  {
    key: "activity",
    label: "Actividad",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.activityName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.projectName}
        </div>
      </div>
    ),
  },
  {
    key: "type",
    label: "Tipo",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.typeName}
      </span>
    ),
  },
  {
    key: "author",
    label: "Autor",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.volunteerName}
      </span>
    ),
  },
  {
    key: "uploadedAt",
    label: "Fecha",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.uploadedAt}
      </span>
    ),
  },
  {
    key: "route",
    label: "Ruta/Archivo",
    render: (item) => (
      <span className="line-clamp-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.route}
      </span>
    ),
  },
  {
    key: "status",
    label: "Validacion",
    render: (item) => (
      <StatusDot variant={item.validationVariant}>{item.validationStatusName}</StatusDot>
    ),
  },
];

export function Evidence() {
  const [searchValue, setSearchValue] = useState("");
  const [activityFilter, setActivityFilter] = useState<EvidenceFilters["activityId"]>("all");
  const [volunteerFilter, setVolunteerFilter] =
    useState<EvidenceFilters["volunteerId"]>("all");
  const [typeFilter, setTypeFilter] = useState<EvidenceFilters["typeId"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [formActivityId, setFormActivityId] = useState("all");
  const [formTypeId, setFormTypeId] = useState("all");
  const [formVolunteerId, setFormVolunteerId] = useState("all");
  const [formRoute, setFormRoute] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const {
    loading,
    error,
    warnings,
    rows,
    volunteerOptions,
    activityOptions,
    evidenceTypeOptions,
    isRegistering,
    isUpdating,
    isRemoving,
    createEvidence,
    updateEvidence,
    removeEvidence,
    refresh,
  } = useOperationEvidence({
    searchTerm: searchValue,
    activityId: activityFilter,
    volunteerId: volunteerFilter,
    typeId: typeFilter,
    validation: "all",
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  });

  const activityOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Actividad: Todas" }, ...activityOptions],
    [activityOptions]
  );

  const volunteerOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Autor: Todos" }, ...volunteerOptions],
    [volunteerOptions]
  );

  const typeOptionsWithAll = useMemo(
    () => [
      { value: "all", label: "Tipo: Todos" },
      ...evidenceTypeOptions.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    ],
    [evidenceTypeOptions]
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      withAuthor: rows.filter((row) => row.volunteerId !== null).length,
      withComment: rows.filter((row) => row.description.trim().length > 0).length,
      withoutValidationFlow: rows.filter((row) => row.validationStatusKind === "other").length,
    }),
    [rows]
  );

  function clearForm() {
    setEditingEvidenceId(null);
    setFormActivityId("all");
    setFormTypeId("all");
    setFormVolunteerId("all");
    setFormRoute("");
    setFormDescription("");
    setSelectedFile(null);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    clearForm();
  }

  function openCreateModal() {
    clearForm();
    setIsFormModalOpen(true);
  }

  function beginEdit(row: OperationEvidenceRow) {
    setIsFormModalOpen(true);
    setEditingEvidenceId(row.id);
    setFormActivityId(row.activityId);
    setFormTypeId(row.typeId !== null ? String(row.typeId) : "all");
    setFormVolunteerId(row.volunteerId ?? "all");
    setFormRoute(row.route);
    setFormDescription(row.description);
    setSelectedFile(null);
  }

  async function handleSubmitEvidence() {
    if (formActivityId === "all") {
      toast.error("Selecciona una actividad.");
      return;
    }

    if (!editingEvidenceId && !selectedFile && !formRoute.trim()) {
      toast.error("Debes ingresar ruta/enlace o seleccionar un archivo.");
      return;
    }

    try {
      if (editingEvidenceId) {
        await updateEvidence({
          evidenceId: editingEvidenceId,
          typeId: formTypeId === "all" ? null : Number(formTypeId),
          routeInput: formRoute || undefined,
          description: formDescription,
        });
        toast.success("Evidencia actualizada.");
      } else {
        const result = await createEvidence({
          activityId: formActivityId,
          volunteerId: formVolunteerId === "all" ? null : formVolunteerId,
          typeId: formTypeId === "all" ? null : Number(formTypeId),
          routeInput: formRoute,
          description: formDescription,
          file: selectedFile,
        });
        if (!result) {
          return;
        }
        if (result.warning) {
          toast.warning(result.warning);
        }
        toast.success("Evidencia registrada.");
      }
      closeFormModal();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo guardar la evidencia."
      );
    }
  }

  async function removeRow(row: OperationEvidenceRow) {
    const confirmed = window.confirm(
      `Se eliminara la evidencia "${row.typeName}" de ${row.activityName}. Continuar?`
    );
    if (!confirmed) {
      return;
    }

    try {
      await removeEvidence(row.id);
      if (editingEvidenceId === row.id) {
        closeFormModal();
      }
      toast.success("Evidencia eliminada.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : "No se pudo eliminar la evidencia."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Evidencias"
          description="Carga y mantenimiento real de ong.evidencias_actividad. La validacion queda bloqueada hasta que exista contrato SQL documentado."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" onClick={openCreateModal}>
            Registrar evidencia
          </GradientButton>
          <OutlineButton size="sm" onClick={refresh}>
            Refrescar
          </OutlineButton>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Total visible
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.total}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Con autor
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.withAuthor}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Con comentario
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.withComment}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              Sin flujo de validacion
            </p>
            <p className="mt-1 tabular-nums text-[20px]" style={{ color: "var(--t-text)" }}>
              {stats.withoutValidationFlow}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por actividad, tipo o ruta..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <SelectField
            value={activityFilter}
            onChange={setActivityFilter}
            options={activityOptionsWithAll}
          />
          <SelectField
            value={volunteerFilter}
            onChange={setVolunteerFilter}
            options={volunteerOptionsWithAll}
          />
          <SelectField
            value={String(typeFilter)}
            onChange={(value) => setTypeFilter(value === "all" ? "all" : Number(value))}
            options={typeOptionsWithAll}
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
              label: "Editar",
              onClick: (item) => beginEdit(item),
            },
            {
              label: "Eliminar",
              onClick: (item) => void removeRow(item),
              variant: "destructive",
            },
          ]}
          emptyMessage="No se encontraron evidencias para los filtros seleccionados"
        />
      </motion.div>

      <ModalShell open={isFormModalOpen} onClose={closeFormModal} width="max-w-[980px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {editingEvidenceId ? "Editar evidencia" : "Registrar evidencia"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              La tabla real no define estados de validacion; este modal solo cubre carga y mantenimiento.
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              value={formActivityId}
              onChange={setFormActivityId}
              options={[{ value: "all", label: "Actividad" }, ...activityOptions]}
            />
            <SelectField
              value={formTypeId}
              onChange={setFormTypeId}
              options={[
                { value: "all", label: "Tipo de evidencia" },
                ...evidenceTypeOptions.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                })),
              ]}
            />
            <SelectField
              value={formVolunteerId}
              onChange={setFormVolunteerId}
              options={[{ value: "all", label: "Autor (opcional)" }, ...volunteerOptions]}
            />
            <input
              value={formRoute}
              onChange={(event) => setFormRoute(event.target.value)}
              placeholder="Ruta o enlace"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="h-9 rounded-xl px-3 text-[12px] outline-none file:mr-3 file:rounded-md file:border-0 file:px-2 file:py-1 file:text-[11px]"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
              disabled={Boolean(editingEvidenceId)}
            />
            <input
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              placeholder="Descripcion (opcional)"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={handleSubmitEvidence}
              disabled={isRegistering || isUpdating || isRemoving}
            >
              {editingEvidenceId ? "Guardar cambios" : "Registrar evidencia"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeFormModal}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
