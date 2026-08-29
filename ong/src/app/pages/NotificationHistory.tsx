import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router";
import { Bell, Clock3, Eye, FileJson, MessageSquare, TriangleAlert, SlidersHorizontal, AlertCircle, FileText, XCircle, Mail, MousePointerClick } from "lucide-react";
import { DataTable, type Column, type RowAction } from '@/core/components/shared/DataTable';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { Popover, PopoverTrigger, PopoverContent } from '@/core/components/ui/popover';
import {
  NotificationsCodePreview,
  NotificationsDetailField,
  NotificationsErrorBlock,
  NotificationsSelectField,
} from "../modules/notifications/components/notifications-shared";
import { useNotificationHistory } from "../modules/notifications/hooks/useNotificationHistory";
import { useNotificationHistoryDetail } from "../modules/notifications/hooks/useNotificationHistoryDetail";
import type {
  NotificationHistoryReadState,
  NotificationHistoryRow,
} from "../modules/notifications/types";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/core/components/ui/tooltip';

const PAGE_SIZE = 20;

export function NotificationHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [recipientId, setRecipientId] = useState("all");
  const [channelCode, setChannelCode] = useState("all");
  const [deliveryState, setDeliveryState] = useState("all");
  const [readState, setReadState] = useState<NotificationHistoryReadState>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [detailNotificationId, setDetailNotificationId] = useState<string | null>(null);
  const [payloadModalOpen, setPayloadModalOpen] = useState<{ open: boolean; data: string | null }>({ open: false, data: null });
  const notificationIdParam = searchParams.get("notificationId");

  const { loading, error, data, refresh } = useNotificationHistory({
    searchTerm: searchValue,
    recipientId,
    channelCode,
    deliveryState,
    readState,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    page,
    pageSize: PAGE_SIZE,
  });
  const detail = useNotificationHistoryDetail(detailNotificationId);

  useEffect(() => {
    if (!notificationIdParam) {
      return;
    }

    setDetailNotificationId(notificationIdParam);
  }, [notificationIdParam]);

  function openDetailModal(notificationId: string) {
    setDetailNotificationId(notificationId);
    const next = new URLSearchParams(searchParams);
    next.set("notificationId", notificationId);
    setSearchParams(next, { replace: true });
  }

  function closeDetailModal() {
    setDetailNotificationId(null);
    if (!notificationIdParam) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("notificationId");
    setSearchParams(next, { replace: true });
  }

  const readFilters = useMemo(
    () => [
      { label: "Todas", value: "all", active: readState === "all" },
      { label: "Leídas", value: "read", active: readState === "read" },
      { label: "No leídas", value: "unread", active: readState === "unread" },
    ],
    [readState]
  );

  const recipientOptions = useMemo(
    () => [{ value: "all", label: "Todos los destinatarios" }].concat(data.recipientOptions),
    [data.recipientOptions]
  );

  const channelOptions = useMemo(
    () => [{ value: "all", label: "Todos los canales" }].concat(data.channelOptions),
    [data.channelOptions]
  );

  const deliveryStateOptions = useMemo(
    () => [{ value: "all", label: "Todos los estados" }].concat(data.deliveryStateOptions),
    [data.deliveryStateOptions]
  );

  const historyColumns: Column<NotificationHistoryRow>[] = [
    {
      key: "created",
      label: "Fecha",
      render: (row) => (
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{row.createdAtLabel}</span>
      ),
    },
    {
      key: "recipient",
      label: "Destinatario",
      render: (row) => (
        <div>
          <div className="font-medium text-[13px]" style={{ color: "var(--t-text)" }}>{row.recipientLabel}</div>
        </div>
      ),
    },
    {
      key: "title",
      label: "Título",
      render: (row) => (
        <div className="max-w-[200px] truncate" title={row.title}>
          <span className="font-medium text-[13px]" style={{ color: "var(--t-text)" }}>{row.title}</span>
        </div>
      ),
    },
    {
      key: "channel",
      label: "Canal",
      render: (row) => (
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{row.channelLabel}</span>
      ),
    },
    {
      key: "delivery",
      label: "Estado",
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusDot variant={row.deliveryStatusVariant}>{row.deliveryStatusLabel}</StatusDot>
          {row.errorMessage && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="w-4 h-4 text-red-500 hover:text-red-400 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] text-xs bg-red-950 text-red-200 border-red-900">
                  <p>{row.errorMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<NotificationHistoryRow>[] = [
    {
      label: "Ver detalle",
      onClick: (row) => openDetailModal(row.id),
    },
    {
      label: "Ver Payload",
      onClick: (row) => setPayloadModalOpen({ open: true, data: row.payloadJson }),
    },
  ];

  const activeFiltersCount = [
    recipientId !== "all",
    channelCode !== "all",
    deliveryState !== "all",
    dateFrom !== "",
    dateTo !== "",
  ].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Historial de Notificaciones"
        description="Auditoría centralizada de comunicaciones enviadas a usuarios"
        action={{ label: "Actualizar", onClick: refresh }}
      />

      {/* KPIs Vivos */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Eventos", value: data.total, icon: Mail, color: "var(--t-primary)" },
          { label: "No leídas", value: data.summary.unread, icon: Eye, color: "var(--t-warning)" },
          { label: "Con error", value: data.summary.withErrors, icon: XCircle, color: "var(--t-destructive)" },
          { label: "Con plantilla", value: data.summary.linkedTemplates, icon: FileText, color: "var(--t-info)" },
        ].map((kpi, idx) => (
          <div key={idx} className="flex flex-col p-4 rounded-2xl border" style={{ background: "var(--t-surface)", borderColor: "var(--t-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium" style={{ color: "var(--t-text-secondary)" }}>{kpi.label}</span>
              <kpi.icon className="w-4 h-4 opacity-70" style={{ color: kpi.color }} />
            </div>
            <span className="text-3xl font-semibold tracking-tight" style={{ color: "var(--t-text)" }}>{kpi.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {(error || !data.access.canReadHistory) && (
        <NotificationsErrorBlock
          message={error ?? "No hay acceso disponible para leer historial real."}
          onRetry={refresh}
        />
      )}

      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <FilterBar
          searchPlaceholder="Buscar por título, mensaje..."
          searchValue={searchValue}
          onSearchChange={(value) => {
            setSearchValue(value);
            setPage(1);
          }}
          filters={readFilters}
          onFilterClick={(value) => {
            setReadState(value as NotificationHistoryReadState);
            setPage(1);
          }}
          actions={
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 h-9 rounded-xl text-[12px] font-medium transition-colors relative"
                  style={{ background: "var(--t-hover)", color: "var(--t-text)", border: "1px solid var(--t-border)" }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filtros Avanzados
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--t-primary)] text-white text-[10px]">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border-strong)" }} align="end">
                <h4 className="text-[13px] font-semibold mb-4" style={{ color: "var(--t-text)" }}>Filtros de búsqueda</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-dim)" }}>Destinatario</label>
                    <NotificationsSelectField
                      value={recipientId}
                      onChange={(value) => { setRecipientId(value); setPage(1); }}
                      options={recipientOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-dim)" }}>Canal</label>
                    <NotificationsSelectField
                      value={channelCode}
                      onChange={(value) => { setChannelCode(value); setPage(1); }}
                      options={channelOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-dim)" }}>Estado</label>
                    <NotificationsSelectField
                      value={deliveryState}
                      onChange={(value) => { setDeliveryState(value); setPage(1); }}
                      options={deliveryStateOptions}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-dim)" }}>Desde</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="h-9 w-full rounded-xl px-2 text-[12px] outline-none"
                        style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text)" }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-dim)" }}>Hasta</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="h-9 w-full rounded-xl px-2 text-[12px] outline-none"
                        style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text)" }}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          }
        />

        <div className="mt-4">
          {!loading && data.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl" style={{ borderColor: "var(--t-border)" }}>
              <div className="bg-[var(--t-hover)] p-4 rounded-full mb-4">
                <Bell className="w-8 h-8 opacity-40" style={{ color: "var(--t-text-secondary)" }} />
              </div>
              <h3 className="text-[15px] font-medium" style={{ color: "var(--t-text)" }}>No se encontraron notificaciones</h3>
              <p className="mt-1 text-[13px] max-w-sm" style={{ color: "var(--t-text-secondary)" }}>
                Ajusta los filtros de búsqueda o limpia las condiciones para ver el historial general de comunicaciones.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setRecipientId("all"); setChannelCode("all"); setDeliveryState("all"); setDateFrom(""); setDateTo(""); setSearchValue(""); setReadState("all"); }}
                  className="mt-4 text-[13px] font-medium hover:underline" style={{ color: "var(--t-primary)" }}
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          ) : (
            <DataTable
              columns={historyColumns}
              data={data.access.canReadHistory ? data.rows : []}
              loading={loading}
              actions={rowActions}
            />
          )}
        </div>

        {/* Paginación Real */}
        {data.total > 0 && (
          <div
            className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3 border"
            style={{ background: "var(--t-surface)", borderColor: "var(--t-border)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Mostrando <strong style={{ color: "var(--t-text)" }}>{(page - 1) * PAGE_SIZE + 1}-{Math.min(data.total, page * PAGE_SIZE)}</strong> de <strong style={{ color: "var(--t-text)" }}>{data.total}</strong> registros
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none"
                style={{ border: "1px solid var(--t-border)", background: "var(--t-hover)", color: "var(--t-text)" }}
                onClick={() => setPage(1)}
                disabled={page <= 1}
              >
                Primera
              </button>
              <button
                className="h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none"
                style={{ border: "1px solid var(--t-border)", background: "var(--t-hover)", color: "var(--t-text)" }}
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="mx-2 text-[12px] font-semibold" style={{ color: "var(--t-text)" }}>
                Página {page}
              </span>
              <button
                className="h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none"
                style={{ border: "1px solid var(--t-border)", background: "var(--t-hover)", color: "var(--t-text)" }}
                onClick={() => setPage((current) => current + 1)}
                disabled={page * PAGE_SIZE >= data.total}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Ver Payload */}
      <ModalShell open={payloadModalOpen.open} onClose={() => setPayloadModalOpen({ open: false, data: null })} width="max-w-[700px]">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileJson className="h-5 w-5" style={{ color: "var(--t-primary)" }} />
            <h3 className="text-[15px] font-medium" style={{ color: "var(--t-text)" }}>Metadata / Payload (JSON)</h3>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--t-border)", background: "#1a1a1a" }}>
            <NotificationsCodePreview value={payloadModalOpen.data || "{}"} />
          </div>
          <div className="mt-4 flex justify-end">
            <OutlineButton onClick={() => setPayloadModalOpen({ open: false, data: null })}>Cerrar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      {/* Modal: Detalle Completo original */}
      <ModalShell open={Boolean(detailNotificationId)} onClose={closeDetailModal} width="max-w-[980px]">
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" style={{ color: "var(--t-text)" }} />
              <div>
                <h3 className="text-[15px] font-medium" style={{ color: "var(--t-text)" }}>
                  Detalle de Notificación
                </h3>
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Registro de log inmutable
                </p>
              </div>
            </div>
            <button onClick={closeDetailModal} className="text-2xl hover:text-white" style={{ color: "var(--t-text-dim)" }}>×</button>
          </div>

          {detail.error && (
            <NotificationsErrorBlock message={detail.error} onRetry={detail.refresh} />
          )}

          {detail.loading && (
            <p className="text-[13px] py-4 text-center" style={{ color: "var(--t-text-dim)" }}>
              Cargando detalle desde la base de datos...
            </p>
          )}

          {detail.data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                <NotificationsDetailField label="Destinatario" value={detail.data.recipientLabel} />
                <NotificationsDetailField label="Estado de lectura" value={detail.data.readLabel} />
                <NotificationsDetailField label="Canal" value={detail.data.channelLabel} />
                <NotificationsDetailField
                  label="Estado de entrega"
                  value={detail.data.deliveryStatusLabel}
                />
                <NotificationsDetailField
                  label="Plantilla Origen"
                  value={
                    detail.data.templateId
                      ? `${detail.data.templateLabel}`
                      : "Sin plantilla asociada"
                  }
                />
                <NotificationsDetailField
                  label="Fecha de registro"
                  value={detail.data.createdAtLabel}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[13px] font-medium" style={{ color: "var(--t-text)" }}>Título del Mensaje</h4>
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
                    {detail.data.title}
                  </p>
                </div>
                
                {detail.data.errorMessage && (
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-2"
                    style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                  >
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 text-red-500" />
                      <h4 className="text-[13px] font-medium text-red-400">Error Reportado</h4>
                    </div>
                    <p className="text-[13px] text-red-300 font-mono text-xs">
                      {detail.data.errorMessage}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px] font-medium" style={{ color: "var(--t-text)" }}>Cuerpo del Mensaje</h4>
                </div>
                <NotificationsCodePreview value={detail.data.message} />
              </div>
            </div>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
}
