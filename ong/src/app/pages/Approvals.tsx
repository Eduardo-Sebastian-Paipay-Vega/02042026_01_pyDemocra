import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Search, Inbox, FileText } from "lucide-react";

import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { StatusDot } from '@/core/components/ui/status-dot';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/core/components/ui/select";
import { useDebouncedValue } from "../lib/useDebouncedValue";
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

const timeAgo = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " años";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " días";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
};

const parseMeta = (metaStr?: string) => {
  if (!metaStr || metaStr === "-") return null;
  try { return JSON.parse(metaStr); } catch (e) { return null; }
};

const columns: Column<OperationApprovalRow>[] = [
  {
    key: "entity",
    label: "Registro",
    render: (item) => {
      const meta = parseMeta(item.contextMeta);
      const isEvidencia = item.entityTable === "evidencias_actividad";
      
      return (
        <div className="flex items-start gap-3">
          {isEvidencia && meta?.url_archivo ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--t-hover)]">
              {meta.url_archivo.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                <img src={meta.url_archivo} alt="Evidencia" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileText className="h-5 w-5 opacity-50" style={{ color: "var(--t-text-dim)" }} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--t-primary-soft)] text-[var(--t-primary)] font-medium text-[12px]">
              {item.subjectName && item.subjectName !== "-" ? item.subjectName.substring(0,2).toUpperCase() : "NA"}
            </div>
          )}
          
          <div>
            <div className="font-medium text-[13px]" style={{ color: "var(--t-text)" }}>
              {item.subjectName && item.subjectName !== "-" ? item.subjectName : item.entityTitle}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              <span className="rounded-sm px-1.5 py-0.5" style={{ background: "var(--t-hover)", color: "var(--t-text-secondary)" }}>
                {item.entityTable === "horas_actividad" ? "Horas" : item.entityTable === "evidencias_actividad" ? "Evidencia" : "Admisión"}
              </span>
              <span>•</span>
              <span className="truncate max-w-[200px]">{item.entitySubtitle || "-"}</span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    key: "status",
    label: "Estado",
    render: (item) => <StatusDot variant={item.statusVariant}>{item.statusName || "-"}</StatusDot>,
  },
  {
    key: "requested",
    label: "Solicitado",
    render: (item) => (
      <div className="flex flex-col">
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.requestedBy || "-"}</span>
        <span className="text-[11px]" style={{ color: "var(--t-text-tertiary)" }}>Hace {timeAgo(item.requestedAt)}</span>
      </div>
    ),
  },
  {
    key: "approved",
    label: "Resolución",
    render: (item) => (
      <div className="flex flex-col">
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.approvedBy || "-"}</span>
        <span className="text-[11px]" style={{ color: "var(--t-text-tertiary)" }}>
          {item.approvedAt && item.approvedAt !== "-" ? `Hace ${timeAgo(item.approvedAt)}` : "-"}
        </span>
      </div>
    ),
  },
];

export function Approvals() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 350);

  const [entityTypeFilter, setEntityTypeFilter] = useState<string | "all">("all");

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
    searchTerm: debouncedSearchValue,
    entityType: entityTypeFilter,
    entityId: "",
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
  }, [searchValue, entityTypeFilter, volunteerFilter, statusFilter, dateFrom, dateTo]);

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
          description="Bandeja de aprobaciones pendientes: horas, evidencias y solicitudes de voluntarios."
          action={{ label: loading ? "Sincronizando..." : "Sincronizar", onClick: refresh, disabled: loading }}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl border px-4 py-4 backdrop-blur-xl space-y-4" style={{ background: "var(--t-surface)", borderColor: "var(--t-border)" }}>
        {/* Top bar with Tabs and Search */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)} className="w-full xl:w-auto">
            <TabsList>
              {statusFilters.map(f => (
                <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="relative max-w-xl w-full xl:w-[400px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--t-text-tertiary)" }} />
            <input
              placeholder="Buscar por solicitante, estado o texto visible..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="ong-field-control h-9 w-full rounded-xl pl-9 pr-4 text-[13px] outline-none transition-colors"
              style={{ border: "1px solid var(--t-border-strong)", background: "var(--t-input-bg)", color: "var(--t-text)" }}
            />
          </div>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: "var(--t-border)" }}>
           <div className="w-[180px]">
             <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de solicitud" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="horas_actividad">Horas de Actividad</SelectItem>
                  <SelectItem value="evidencias_actividad">Evidencias</SelectItem>
                  <SelectItem value="solicitudes_admision">Admisión</SelectItem>
                </SelectContent>
             </Select>
           </div>
           
           <div className="w-[200px]">
             <Select value={volunteerFilter} onValueChange={setVolunteerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Voluntario" />
                </SelectTrigger>
                <SelectContent>
                  {volunteerOptionsWithAll.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
           </div>
           
           {/* DateRangePicker styled inputs */}
           <div className="flex items-center rounded-md border h-9" style={{ borderColor: "var(--t-border)", background: "var(--t-input-bg)" }}>
             <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-full w-[120px] rounded-l-md bg-transparent px-3 text-[12px] outline-none" style={{ color: "var(--t-text)", colorScheme: "dark" }} />
             <span className="px-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>-</span>
             <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-full w-[120px] rounded-r-md bg-transparent px-3 text-[12px] outline-none" style={{ color: "var(--t-text)", colorScheme: "dark" }} />
           </div>
           
           {/* Clear filters CTA */}
           {(entityTypeFilter !== 'all' || volunteerFilter !== 'all' || dateFrom || dateTo || searchValue || statusFilter !== 'all') && (
              <button 
                type="button"
                onClick={() => {
                  setEntityTypeFilter('all');
                  setVolunteerFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setSearchValue('');
                  setStatusFilter('all');
                }}
                className="text-[12px] underline transition-colors hover:text-[var(--t-text)]"
                style={{ color: "var(--t-text-tertiary)" }}
              >
                Limpiar filtros
              </button>
           )}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <ErrorBlock message={error} onRetry={refresh} />
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
          emptyMessage={
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--t-hover)" }}>
                <Inbox className="h-6 w-6" style={{ color: "var(--t-text-tertiary)" }} />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium" style={{ color: "var(--t-text)" }}>Bandeja vacía</p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>No hay aprobaciones que coincidan con los filtros actuales.</p>
              </div>
              {(entityTypeFilter !== 'all' || volunteerFilter !== 'all' || dateFrom || dateTo || searchValue || statusFilter !== 'all') && (
                <OutlineButton 
                  size="sm" 
                  onClick={() => {
                    setEntityTypeFilter('all');
                    setVolunteerFilter('all');
                    setDateFrom('');
                    setDateTo('');
                    setSearchValue('');
                    setStatusFilter('all');
                  }}
                  className="mt-2"
                >
                  Limpiar filtros
                </OutlineButton>
              )}
            </div>
          }
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
              Marca el registro de horas como pendiente para una nueva revisión.
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
              Información detallada del registro de horas seleccionado.
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
                  {detail.approval.statusName || "-"}
                </StatusDot>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Voluntario" value={detail.approval.subjectName || "-"} />
                <DetailField label="Proyecto / Subtítulo" value={detail.approval.entitySubtitle || "-"} />
                <DetailField
                  label="Solicitado por"
                  value={`${detail.approval.requestedBy || "-"} (${detail.approval.requestedAt || "-"})`}
                />
                <DetailField
                  label="Resuelto por"
                  value={`${detail.approval.approvedBy || "-"} (${detail.approval.approvedAt || "-"})`}
                />
                <DetailField label="Comentario de resolución" value={detail.approval.comment || "-"} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
                  {detail.context.title || "-"}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {detail.context.summary || "-"}
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {detail.context.fields.filter(f => !['Modulo', 'Schema', 'Tabla', 'Entidad'].includes(f.label)).map((field) => (
                    <DetailField
                      key={`${field.label}-${field.value}`}
                      label={field.label}
                      value={field.value || "-"}
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
              El comentario es opcional y quedará registrado como observación de la resolución.
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
