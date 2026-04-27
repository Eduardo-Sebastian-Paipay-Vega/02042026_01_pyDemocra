import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { PageHeader } from "../components/shared/PageHeader";
import { StatusDot } from "../components/ui/status-dot";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";
import { ModalShell } from "../components/ui/modal-shell";
import { useAprobacionDetail } from "../modules/operation/hooks/useAprobacionDetail";
import { useAprobacionesOperacion } from "../modules/operation/hooks/useAprobacionesOperacion";
import type { ApprovalStatusKind, OperationApprovalRow } from "../modules/operation/types";
import { HOURS_APPROVAL_ENTITY } from "../services/operacion/aprobaciones.service";

const PAGE_SIZE = 20;

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

type ResolutionActionKind = "approved" | "rejected";

interface CreateFormErrors {
  entityId?: string;
  comment?: string;
  general?: string;
}

interface ResolutionTarget {
  approvalId: string;
  action: ResolutionActionKind;
}

function SelectField({
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

const columns: Column<OperationApprovalRow>[] = [
  {
    key: "entity",
    label: "Registro",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.entityTitle}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.subjectName !== "-" ? `${item.subjectName} · ${item.entitySubtitle}` : item.entitySubtitle}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.entityId}
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
    key: "requested",
    label: "Solicitado",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.requestedBy} - {item.requestedAt}
      </span>
    ),
  },
  {
    key: "approved",
    label: "Resuelto",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        {item.approvedBy} - {item.approvedAt}
      </span>
    ),
  },
];

export function Approvals() {
  const [searchValue, setSearchValue] = useState("");
  const [hoursIdFilter, setHoursIdFilter] = useState("");
  const [volunteerFilter, setVolunteerFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatusKind>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [formHoursId, setFormHoursId] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formErrors, setFormErrors] = useState<CreateFormErrors>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [detailApprovalId, setDetailApprovalId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [resolutionTarget, setResolutionTarget] = useState<ResolutionTarget | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const {
    loading,
    error,
    warnings,
    rows,
    total,
    approvalStates,
    volunteerOptions,
    isCreating,
    isResolving,
    create,
    resolve,
    refresh,
  } = useAprobacionesOperacion({
    searchTerm: searchValue,
    entityType: "all",
    entityId: hoursIdFilter,
    status: statusFilter,
    requestedById: volunteerFilter,
    approvedById: "all",
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    page,
    pageSize: PAGE_SIZE,
  });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useAprobacionDetail(isDetailModalOpen ? detailApprovalId : null);

  useEffect(() => {
    setPage(1);
  }, [searchValue, hoursIdFilter, volunteerFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, total]);

  const stateByKind = useMemo(() => {
    const map = new Map<ApprovalStatusKind, number>();
    for (const option of approvalStates) {
      if (!map.has(option.kind)) {
        map.set(option.kind, option.value);
      }
    }
    return map;
  }, [approvalStates]);

  const statusFilters = useMemo(() => {
    const filters = [
      { label: "Todas", value: "all", active: statusFilter === "all" },
    ] as Array<{ label: string; value: string; active: boolean }>;

    const seen = new Set<string>();
    for (const option of approvalStates) {
      if (seen.has(option.kind)) {
        continue;
      }
      seen.add(option.kind);
      filters.push({
        label: option.label,
        value: option.kind,
        active: statusFilter === option.kind,
      });
    }

    return filters;
  }, [approvalStates, statusFilter]);

  const volunteerOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Voluntario: Todos" }, ...volunteerOptions],
    [volunteerOptions]
  );

  const canGoPrev = page > 1;
  const canGoNext = page * PAGE_SIZE < total;
  const fromRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toRow = Math.min(total, page * PAGE_SIZE);

  function resetCreateForm() {
    setFormHoursId("");
    setFormComment("");
    setFormErrors({});
  }

  function openCreateModal() {
    resetCreateForm();
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    resetCreateForm();
  }

  function openDetailModal(approvalId: string) {
    setDetailApprovalId(approvalId);
    setIsDetailModalOpen(true);
  }

  function closeDetailModal() {
    setIsDetailModalOpen(false);
    setDetailApprovalId(null);
  }

  function openResolutionModal(row: OperationApprovalRow, action: ResolutionActionKind) {
    if (row.statusKind === "approved" || row.statusKind === "rejected") {
      toast.error("El registro ya fue resuelto. Usa 'Solicitar revision' para devolverlo a pendiente.");
      return;
    }

    setResolutionTarget({
      approvalId: row.id,
      action,
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

  function validateCreateForm(): boolean {
    const nextErrors: CreateFormErrors = {};
    const entityId = formHoursId.trim();
    const comment = formComment.trim();

    if (!entityId) {
      nextErrors.entityId = "El id del registro de horas es obligatorio.";
    }
    if (entityId.length > 120) {
      nextErrors.entityId = "El id no puede exceder 120 caracteres.";
    }
    if (comment.length > 500) {
      nextErrors.comment = "El comentario no puede exceder 500 caracteres.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitCreateRequest() {
    if (!validateCreateForm()) {
      return;
    }

    try {
      const created = await create({
        entityType: HOURS_APPROVAL_ENTITY,
        entityId: formHoursId.trim(),
        comment: formComment.trim() || undefined,
      });

      if (!created) {
        return;
      }

      setPage(1);
      closeCreateModal();
      toast.success("La solicitud de revisión quedó en estado pendiente.");
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : "No se pudo solicitar la revisión.";
      setFormErrors((current) => ({ ...current, general: message }));
      toast.error(message);
    }
  }

  async function submitResolution() {
    if (!resolutionTarget) {
      return;
    }

    const targetStateId = stateByKind.get(resolutionTarget.action);
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
      const result = await resolve({
        approvalId: resolutionTarget.approvalId,
        targetStateId,
        comment: comment || undefined,
      });

      if (!result) {
        return;
      }

      toast.success("Aprobación actualizada.");
      closeResolutionModal();
      if (isDetailModalOpen && detailApprovalId === resolutionTarget.approvalId) {
        refreshDetail();
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : "No se pudo resolver la aprobación.";
      setResolutionError(message);
      toast.error(message);
    }
  }

  async function requestReview(row: OperationApprovalRow) {
    try {
      const result = await create({
        entityType: HOURS_APPROVAL_ENTITY,
        entityId: row.entityId,
      });
      if (!result) {
        return;
      }
      toast.success("El registro volvió a estado pendiente.");
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : "No se pudo devolver el registro a pendiente."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Bandeja de aprobaciones"
          description="Bandeja real sobre `ong.aprobaciones` para horas. El contexto operativo se obtiene desde `ong.horas_actividad`."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" onClick={openCreateModal}>
            Solicitar revisión
          </GradientButton>
          <OutlineButton size="sm" onClick={refresh}>
            Refrescar
          </OutlineButton>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por solicitante, estado o texto visible..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={statusFilters}
          onFilterClick={(value) => setStatusFilter(value as "all" | ApprovalStatusKind)}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          <input
            value={hoursIdFilter}
            onChange={(event) => setHoursIdFilter(event.target.value)}
            placeholder="ID de horas"
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />
          <SelectField
            value={volunteerFilter}
            onChange={(value) => setVolunteerFilter(value as string | "all")}
            options={volunteerOptionsWithAll}
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
            {warnings.map((warning) => (
              <p key={warning} style={{ color: "var(--t-text-tertiary)" }}>
                {warning}
              </p>
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
              label: "Solicitar revision",
              onClick: (item) => void requestReview(item),
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
          emptyMessage="No hay aprobaciones documentadas para el filtro seleccionado"
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
            Mostrando {fromRow}-{toRow} de {total} registros
          </p>
          <div className="flex gap-2">
            <OutlineButton
              size="sm"
              onClick={() => setPage((current) => current - 1)}
              disabled={!canGoPrev || loading}
            >
              Anterior
            </OutlineButton>
            <OutlineButton
              size="sm"
              onClick={() => setPage((current) => current + 1)}
              disabled={!canGoNext || loading}
            >
              Siguiente
            </OutlineButton>
          </div>
        </div>
      </motion.div>

      <ModalShell open={isCreateModalOpen} onClose={closeCreateModal} width="max-w-[720px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Solicitar revisión
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Devuelve un registro real de `ong.horas_actividad` al estado pendiente.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={closeCreateModal}
          >
            X
          </button>
        </div>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {formErrors.general && (
            <ErrorBlock
              message={formErrors.general}
              onRetry={() => setFormErrors((current) => ({ ...current, general: undefined }))}
            />
          )}

          <div className="space-y-1">
            <input
              value={formHoursId}
              onChange={(event) => {
                setFormHoursId(event.target.value);
                setFormErrors((current) => ({ ...current, entityId: undefined }));
              }}
              placeholder="ID del registro de horas"
              disabled={isCreating}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <FieldError message={formErrors.entityId} />
          </div>

          <div className="space-y-1">
            <textarea
              value={formComment}
              onChange={(event) => {
                setFormComment(event.target.value);
                setFormErrors((current) => ({ ...current, comment: undefined }));
              }}
              placeholder="Comentario opcional"
              rows={3}
              disabled={isCreating}
              className="w-full rounded-xl px-3 py-2 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <FieldError message={formErrors.comment} />
          </div>

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitCreateRequest()}
              disabled={isCreating}
            >
              {isCreating ? "Guardando..." : "Marcar pendiente"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeCreateModal} disabled={isCreating}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={isDetailModalOpen} onClose={closeDetailModal} width="max-w-[960px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Detalle de aprobación
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Contexto real del registro en `ong.horas_actividad`.
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

          {!detailLoading && detailError && <ErrorBlock message={detailError} onRetry={refreshDetail} />}

          {!detailLoading && !detailError && detail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot variant={detail.approval.statusVariant}>
                  {detail.approval.statusName}
                </StatusDot>
                <StatusDot variant="secondary">{detail.context.kind}</StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="ID aprobación" value={detail.approval.id} />
                <DetailField label="Entidad tipo" value={detail.approval.entityTable} />
                <DetailField label="Entidad id" value={detail.approval.entityId} />
                <DetailField label="Voluntario" value={detail.approval.subjectName} />
                <DetailField
                  label="Solicitado por"
                  value={`${detail.approval.requestedBy} (${detail.approval.requestedAt})`}
                />
                <DetailField
                  label="Resuelto por"
                  value={`${detail.approval.approvedBy} (${detail.approval.approvedAt})`}
                />
                <DetailField label="Comentario" value={detail.approval.comment || "-"} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
                  {detail.context.title}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {detail.context.summary}
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {detail.context.fields.map((field) => (
                    <DetailField
                      key={`${field.label}-${field.value}`}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    closeDetailModal();
                    void requestReview(detail.approval);
                  }}
                  disabled={isCreating}
                >
                  Solicitar revisión
                </OutlineButton>
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    closeDetailModal();
                    openResolutionModal(detail.approval, "approved");
                  }}
                  disabled={isResolving}
                >
                  Aprobar
                </OutlineButton>
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    closeDetailModal();
                    openResolutionModal(detail.approval, "rejected");
                  }}
                  disabled={isResolving}
                >
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
                ? resolutionTarget.action === "approved"
                  ? "Aprobar horas"
                  : "Rechazar horas"
                : "Resolver aprobación"}
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

          <FieldError message={resolutionError} />

          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={() => void submitResolution()} disabled={isResolving}>
              {isResolving ? "Guardando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeResolutionModal} disabled={isResolving}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
