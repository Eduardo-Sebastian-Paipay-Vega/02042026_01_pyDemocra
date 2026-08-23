import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { Paperclip } from "lucide-react";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { useAprobacionDetail } from "../modules/operation/hooks/useAprobacionDetail";
import { useAprobacionesOperacion } from "../modules/operation/hooks/useAprobacionesOperacion";
import type { ApprovalStatusKind, OperationApprovalRow } from "../modules/operation/types";
import { HOURS_APPROVAL_ENTITY } from "../services/operacion/aprobaciones.service";

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

type ResolutionActionKind = "approved" | "rejected";

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
    key: "volunteer",
    label: "Voluntario",
    render: (item) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.subjectName}`} alt={item.subjectName} />
          <AvatarFallback>{item.subjectName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span style={{ color: "var(--t-text)" }}>{item.subjectName}</span>
      </div>
    ),
  },
  {
    key: "activity",
    label: "Actividad",
    render: (item) => (
      <div>
        <div className="flex items-center gap-2" style={{ color: "var(--t-text-secondary)" }}>
          {item.entityTitle}
          {item.hasEvidence && (
            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-500" title="Contiene evidencia adjunta">
              <Paperclip size={10} />
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.entitySubtitle}
        </div>
      </div>
    ),
  },
  {
    key: "context",
    label: "Contexto",
    render: (item) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        <div>{item.contextDate}</div>
        <div>{item.contextMeta}</div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => <StatusDot variant={item.statusVariant}>{item.statusName}</StatusDot>,
  },
];

export function HoursApproval() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatusKind>("pending");
  const [volunteerFilter, setVolunteerFilter] = useState<string | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailApprovalId, setDetailApprovalId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [resolutionTarget, setResolutionTarget] = useState<{
    approvalId: string;
    action: ResolutionActionKind;
  } | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);

  const {
    loading,
    error,
    warnings,
    rows,
    approvalStates,
    volunteerOptions,
    isCreating,
    isResolving,
    create,
    resolve,
    refresh,
  } = useAprobacionesOperacion({
    searchTerm: searchValue,
    entityType: HOURS_APPROVAL_ENTITY,
    entityId: "",
    status: statusFilter,
    requestedById: volunteerFilter,
    approvedById: "all",
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    page: 1,
    pageSize: 200,
  });

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useAprobacionDetail(isDetailOpen ? detailApprovalId : null);

  const stateByKind = useMemo(() => {
    const map = new Map<ApprovalStatusKind, number>();
    for (const option of approvalStates) {
      if (!map.has(option.kind)) {
        map.set(option.kind, option.value);
      }
    }
    return map;
  }, [approvalStates]);

  const volunteerOptionsWithAll = useMemo(
    () => [{ value: "all", label: "Voluntario: Todos" }, ...volunteerOptions],
    [volunteerOptions]
  );

  const filters = [
    { label: "Pendientes", value: "pending", active: statusFilter === "pending" },
    { label: "Aprobadas", value: "approved", active: statusFilter === "approved" },
    { label: "Rechazadas", value: "rejected", active: statusFilter === "rejected" },
    { label: "Todas", value: "all", active: statusFilter === "all" },
  ];

  function openResolutionModal(approvalId: string, action: ResolutionActionKind) {
    setResolutionTarget({ approvalId, action });
    setResolutionComment("");
    setResolutionError(null);
    setIsResolutionOpen(true);
  }

  function closeResolutionModal() {
    setIsResolutionOpen(false);
    setResolutionTarget(null);
    setResolutionComment("");
    setResolutionError(null);
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
    if (resolutionTarget.action === "rejected" && !comment) {
      setResolutionError("El comentario es obligatorio para rechazar horas.");
      return;
    }
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
      if (isDetailOpen && detailApprovalId === resolutionTarget.approvalId) {
        refreshDetail();
      }
    } catch (actionError) {
      setResolutionError(
        actionError instanceof Error ? actionError.message : "No se pudo resolver la aprobación."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader
          title="Aprobación de horas"
          description="Gestión de aprobaciones para registros de horas de voluntarios. Resuelve, rechaza o devuelve a pendiente desde esta vista."
        />
        <OutlineButton size="sm" onClick={refresh} className="mt-2 flex items-center gap-2 md:mt-0" title="Sincronizar">
          <RefreshCw size={14} />
          <span>Sincronizar</span>
        </OutlineButton>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por voluntario, actividad, estado o comentario..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filters}
          onFilterClick={(value) => setStatusFilter(value as "all" | ApprovalStatusKind)}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <select
              value={volunteerFilter}
              onChange={(event) => setVolunteerFilter(event.target.value)}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            >
              {volunteerOptionsWithAll.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          </div>
          <div className="md:col-span-1">
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              {error}
            </p>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
              style={{ color: "var(--t-text-secondary)" }}
              onClick={refresh}
            >
              Reintentar
            </button>
          </div>
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
              onClick: (item) => {
                setDetailApprovalId(item.id);
                setIsDetailOpen(true);
              },
            },
            {
              label: "Solicitar revisión",
              onClick: (item) => void requestReview(item),
            },
            {
              label: "Aprobar",
              onClick: (item) => openResolutionModal(item.id, "approved"),
            },
            {
              label: "Rechazar",
              onClick: (item) => openResolutionModal(item.id, "rejected"),
              variant: "destructive",
            },
          ]}
          emptyMessage={<EmptyState title="Sin resultados" description="No hay aprobaciones de horas para el filtro seleccionado." />}
        />
      </motion.div>

      {/* Detail modal */}
      <ModalShell open={isDetailOpen} onClose={() => setIsDetailOpen(false)} width="max-w-[920px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Detalle de aprobación
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Registro de horas vinculado y estado actual de la aprobación.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            onClick={() => setIsDetailOpen(false)}
          >
            X
          </button>
        </div>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {detailLoading && (
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              Cargando detalle...
            </p>
          )}

          {!detailLoading && detailError && (
            <div
              className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                {detailError}
              </p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
                style={{ color: "var(--t-text-secondary)" }}
                onClick={refreshDetail}
              >
                Reintentar
              </button>
            </div>
          )}

          {!detailLoading && !detailError && detail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot variant={detail.approval.statusVariant}>
                  {detail.approval.statusName}
                </StatusDot>
                <StatusDot variant="secondary">{detail.approval.subjectName}</StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="ID aprobación" value={detail.approval.id} />
                <DetailField label="Voluntario" value={detail.approval.subjectName} />
                <DetailField label="Actividad" value={detail.approval.entityTitle} />
                <DetailField label="Proyecto" value={detail.approval.entitySubtitle} />
                <DetailField
                  label="Solicitado por"
                  value={`${detail.approval.requestedBy} (${detail.approval.requestedAt})`}
                />
                <DetailField
                  label="Resuelto por"
                  value={`${detail.approval.approvedBy} (${detail.approval.approvedAt})`}
                />
              </div>

              {detail.context.fields.length > 0 && (
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                >
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--t-text-tertiary)" }}>
                    {detail.context.title}
                  </p>
                  <p className="mb-3 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                    {detail.context.summary}
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {detail.context.fields.map((field) => (
                      <DetailField
                        key={`${field.label}-${field.value}`}
                        label={field.label}
                        value={field.value}
                      />
                    ))}
                  </div>
                </div>
              )}

              {detail.approval.comment && (
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                >
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    Comentario de resolución
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                    {detail.approval.comment}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    setIsDetailOpen(false);
                    void requestReview(detail.approval);
                  }}
                  disabled={isCreating}
                >
                  Solicitar revisión
                </OutlineButton>
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    setIsDetailOpen(false);
                    openResolutionModal(detail.approval.id, "approved");
                  }}
                  disabled={isResolving}
                >
                  Aprobar
                </OutlineButton>
                <OutlineButton
                  size="sm"
                  onClick={() => {
                    setIsDetailOpen(false);
                    openResolutionModal(detail.approval.id, "rejected");
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

      {/* Resolution modal */}
      <ModalShell open={isResolutionOpen} onClose={closeResolutionModal} width="max-w-[560px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {resolutionTarget?.action === "approved" ? "Aprobar horas" : "Rechazar horas"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {resolutionTarget?.action === "rejected" ? "El comentario es obligatorio para justificar el rechazo." : "El comentario es opcional y queda registrado en la aprobación y en el registro de horas."}
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
            style={INPUT_STYLE}
          />
          {resolutionError && (
            <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>
              {resolutionError}
            </p>
          )}
          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitResolution()}
              disabled={isResolving}
            >
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

