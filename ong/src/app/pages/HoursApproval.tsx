import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { useAprobacionDetail } from "../modules/operation/hooks/useAprobacionDetail";
import { useAprobacionesOperacion } from "../modules/operation/hooks/useAprobacionesOperacion";
import type { ApprovalStatusKind, OperationApprovalRow } from "../modules/operation/types";
import { HOURS_APPROVAL_ENTITY } from "../services/operacion/aprobaciones.service";

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

type ResolutionActionKind = "approved" | "rejected";

const columns: Column<OperationApprovalRow>[] = [
  {
    key: "volunteer",
    label: "Voluntario",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.subjectName || "-"}</span>,
  },
  {
    key: "activity",
    label: "Actividad",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text-secondary)" }}>{item.entityTitle || "-"}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.entitySubtitle || "-"}
        </div>
      </div>
    ),
  },
  {
    key: "context",
    label: "Contexto",
    render: (item) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
        <div>{item.contextDate || "-"}</div>
        <div>{item.contextMeta || "-"}</div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => <StatusDot variant={item.statusVariant}>{item.statusName || "-"}</StatusDot>,
  },
];

export function HoursApproval() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 350);
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
    rows,
    approvalStates,
    volunteerOptions,
    isResolving,
    resolve,
    refresh,
  } = useAprobacionesOperacion({
    searchTerm: debouncedSearchValue,
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

  async function submitResolution() {
    if (!resolutionTarget) {
      return;
    }
    const targetStateId = stateByKind.get(resolutionTarget.action);
    if (!targetStateId) {
      setResolutionError("No existe estado configurado para esta accion.");
      return;
    }
    try {
      const result = await resolve({
        approvalId: resolutionTarget.approvalId,
        targetStateId,
        comment: resolutionComment.trim() || undefined,
      });
      if (!result) {
        return;
      }
      toast.success("Aprobacion actualizada.");
      setIsResolutionOpen(false);
      setResolutionTarget(null);
      setResolutionComment("");
      setResolutionError(null);
      if (isDetailOpen && detailApprovalId === resolutionTarget.approvalId) {
        refreshDetail();
      }
    } catch (actionError) {
      setResolutionError(
        actionError instanceof Error ? actionError.message : "No se pudo resolver la aprobacion."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Aprobacion de horas"
          description="Revisión y aprobación de registros de horas reportados por los voluntarios."
          action={{ label: loading ? "Sincronizando..." : "Sincronizar", onClick: refresh, disabled: loading }}
        />
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
        <div className="flex flex-wrap gap-2">
          <select value={volunteerFilter} onChange={(event) => setVolunteerFilter(event.target.value)} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE}>
            {volunteerOptionsWithAll.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={INPUT_STYLE} />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p style={{ color: "var(--t-text-secondary)" }}>{error}</p>
          </div>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          actions={[
            { label: "Ver detalle", onClick: (item) => { setDetailApprovalId(item.id); setIsDetailOpen(true); } },
            { label: "Aprobar", onClick: (item) => { setResolutionTarget({ approvalId: item.id, action: "approved" }); setResolutionComment(""); setResolutionError(null); setIsResolutionOpen(true); } },
            { label: "Rechazar", onClick: (item) => { setResolutionTarget({ approvalId: item.id, action: "rejected" }); setResolutionComment(""); setResolutionError(null); setIsResolutionOpen(true); }, variant: "destructive" },
          ]}
          emptyMessage="No hay aprobaciones de horas para el filtro seleccionado"
        />
      </motion.div>

      <ModalShell open={isDetailOpen} onClose={() => setIsDetailOpen(false)} width="max-w-[920px]">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Detalle de aprobacion</h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Registro de aprobaciones de horas del período seleccionado.</p>
            </div>
            <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsDetailOpen(false)}>X</button>
          </div>
          {detailLoading && <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>}
          {!detailLoading && detailError && <p className="text-[12px]" style={{ color: "var(--t-danger, #ef4444)" }}>{detailError}</p>}
          {!detailLoading && !detailError && detail && (
            <>
              <div className="flex flex-wrap gap-2">
                <StatusDot variant={detail.approval.statusVariant}>{detail.approval.statusName || "-"}</StatusDot>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Voluntario</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.approval.subjectName || "-"}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Actividad</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.approval.entityTitle || "-"}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Proyecto</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{detail.approval.entitySubtitle || "-"}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Solicitado por</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{`${detail.approval.requestedBy || "-"} (${detail.approval.requestedAt || "-"})`}</p></div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}><p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Resuelto por</p><p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{`${detail.approval.approvedBy || "-"} (${detail.approval.approvedAt || "-"})`}</p></div>
              </div>
              <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                <p style={{ color: "var(--t-text-secondary)" }}>{detail.approval.comment || "Sin comentario de resolucion."}</p>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isResolutionOpen} onClose={() => setIsResolutionOpen(false)} width="max-w-[560px]">
        <div className="space-y-3 p-4">
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {resolutionTarget?.action === "approved" ? "Aprobar horas" : "Rechazar horas"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              El comentario quedará registrado como observación de la resolución.
            </p>
          </div>
          <textarea value={resolutionComment} onChange={(event) => { setResolutionComment(event.target.value); setResolutionError(null); }} rows={4} placeholder="Comentario opcional" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={INPUT_STYLE} />
          {resolutionError && <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{resolutionError}</p>}
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitResolution()} disabled={isResolving}>{isResolving ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsResolutionOpen(false)} disabled={isResolving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
