import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router";
import { Bell, Clock3, Eye, FileJson, MessageSquare, TriangleAlert } from "lucide-react";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { ModalShell } from "../components/ui/modal-shell";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
import {
  NotificationsCodePreview,
  NotificationsDetailField,
  NotificationsErrorBlock,
  NotificationsSelectField,
  NotificationsStatusBadge,
  NotificationsSummaryField,
} from "../modules/notifications/components/notifications-shared";
import { useNotificationHistory } from "../modules/notifications/hooks/useNotificationHistory";
import { useNotificationHistoryDetail } from "../modules/notifications/hooks/useNotificationHistoryDetail";
import type {
  NotificationHistoryReadState,
  NotificationHistoryRow,
} from "../modules/notifications/types";

const PAGE_SIZE = 20;

const historyColumns: Column<NotificationHistoryRow>[] = [
  {
    key: "recipient",
    label: "Destinatario",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.recipientLabel}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.recipientId}
        </div>
      </div>
    ),
  },
  {
    key: "title",
    label: "Notificacion",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.title}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.messagePreview}
        </div>
      </div>
    ),
  },
  {
    key: "delivery",
    label: "Entrega",
    render: (row) => (
      <div>
        <StatusDot variant={row.deliveryStatusVariant}>{row.deliveryStatusLabel}</StatusDot>
        <div className="mt-1 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.channelLabel}
        </div>
      </div>
    ),
  },
  {
    key: "read",
    label: "Lectura",
    render: (row) => <StatusDot variant={row.statusVariant}>{row.readLabel}</StatusDot>,
  },
  {
    key: "created",
    label: "Registrado",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.createdAtLabel}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.createdByLabel}
        </div>
      </div>
    ),
  },
];

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
      { label: "Leidas", value: "read", active: readState === "read" },
      { label: "No leidas", value: "unread", active: readState === "unread" },
    ],
    [readState]
  );

  const recipientOptions = useMemo(
    () => [{ value: "all", label: "Destinatario: Todos" }].concat(data.recipientOptions),
    [data.recipientOptions]
  );

  const channelOptions = useMemo(
    () => [{ value: "all", label: "Canal: Todos" }].concat(data.channelOptions),
    [data.channelOptions]
  );

  const deliveryStateOptions = useMemo(
    () => [{ value: "all", label: "Entrega: Todas" }].concat(data.deliveryStateOptions),
    [data.deliveryStateOptions]
  );
  const hasResolvedDeliveryStates =
    data.deliveryStateOptions.length > 0 || data.summary.total === 0;
  const deliveryStateAllowedLabel =
    data.deliveryStateOptions.length > 0
      ? "Estados de entrega reales"
      : "Sin historial cargado aun";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Historial"
        description="Consulta comunicaciones.historial_notificaciones con sus metadatos reales: codigo_canal, estado_entrega, error_mensaje, id_plantilla y payload."
        action={{ label: "Actualizar", onClick: refresh }}
      />

      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <NotificationsStatusBadge
            allowed={data.access.canReadHistory}
            allowedLabel="Lectura de historial disponible"
            deniedLabel="Sin acceso de lectura"
          />
          <NotificationsStatusBadge
            allowed={data.channelOptions.length > 0}
            allowedLabel="Catalogo de canales real"
            deniedLabel="Sin catalogo de canales"
          />
          <NotificationsStatusBadge
            allowed={hasResolvedDeliveryStates}
            allowedLabel={deliveryStateAllowedLabel}
            deniedLabel="Sin estados de entrega cargados"
          />
        </div>
        {data.warnings.map((item) => (
          <p key={item} className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {item}
          </p>
        ))}
        {data.unsupportedFlows.map((item) => (
          <p key={item} className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {item}
          </p>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <NotificationsSummaryField label="Eventos reales" value={String(data.total)} />
        <NotificationsSummaryField label="No leidas" value={String(data.summary.unread)} />
        <NotificationsSummaryField
          label="Con error"
          value={String(data.summary.withErrors)}
        />
        <NotificationsSummaryField
          label="Con plantilla"
          value={String(data.summary.linkedTemplates)}
        />
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
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
          <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
            Eventos registrados
          </h2>
        </div>

        <FilterBar
          searchPlaceholder="Buscar por titulo, mensaje, canal, estado o error..."
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
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <NotificationsSelectField
            value={recipientId}
            onChange={(value) => {
              setRecipientId(value);
              setPage(1);
            }}
            options={recipientOptions}
          />
          <NotificationsSelectField
            value={channelCode}
            onChange={(value) => {
              setChannelCode(value);
              setPage(1);
            }}
            options={channelOptions}
          />
          <NotificationsSelectField
            value={deliveryState}
            onChange={(value) => {
              setDeliveryState(value);
              setPage(1);
            }}
            options={deliveryStateOptions}
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl px-3 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />
        </div>

        <div className="mt-4">
          <DataTable
            columns={historyColumns}
            data={data.access.canReadHistory ? data.rows : []}
            loading={loading}
            emptyMessage="No se encontraron eventos reales de notificacion con los filtros actuales."
            actions={[{ label: "Ver detalle", onClick: (row) => openDetailModal(row.id) }]}
          />
        </div>

        <div
          className="mt-4 flex justify-between rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {data.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(data.total, page * PAGE_SIZE)} de {data.total}
          </p>
          <div className="flex gap-2">
            <OutlineButton size="sm" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>
              Anterior
            </OutlineButton>
            <OutlineButton
              size="sm"
              onClick={() => setPage((current) => current + 1)}
              disabled={page * PAGE_SIZE >= data.total}
            >
              Siguiente
            </OutlineButton>
          </div>
        </div>
      </div>

      <ModalShell open={Boolean(detailNotificationId)} onClose={closeDetailModal} width="max-w-[980px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle del historial
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                comunicaciones.historial_notificaciones
              </p>
            </div>
          </div>

          {detail.error && (
            <NotificationsErrorBlock message={detail.error} onRetry={detail.refresh} />
          )}

          {detail.loading && (
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Cargando detalle...
            </p>
          )}

          {detail.data && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <NotificationsDetailField label="Destinatario" value={detail.data.recipientLabel} />
                <NotificationsDetailField label="Estado de lectura" value={detail.data.readLabel} />
                <NotificationsDetailField label="Canal" value={detail.data.channelLabel} />
                <NotificationsDetailField
                  label="Estado de entrega"
                  value={detail.data.deliveryStatusLabel}
                />
                <NotificationsDetailField
                  label="Plantilla"
                  value={
                    detail.data.templateId
                      ? `${detail.data.templateLabel} (${detail.data.templateId})`
                      : "Sin plantilla"
                  }
                />
                <NotificationsDetailField
                  label="Error de entrega"
                  value={detail.data.errorMessage || "-"}
                />
                <NotificationsDetailField label="Registrado" value={detail.data.createdAtLabel} />
                <NotificationsDetailField label="Registrado por" value={detail.data.createdByLabel} />
                <NotificationsDetailField label="Actualizado" value={detail.data.updatedAtLabel} />
                <NotificationsDetailField label="Actualizado por" value={detail.data.updatedByLabel} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    Titulo
                  </h4>
                </div>
                <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  {detail.data.title}
                </p>
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    Mensaje
                  </h4>
                </div>
                <NotificationsCodePreview value={detail.data.message} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <FileJson className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    Payload
                  </h4>
                </div>
                <NotificationsCodePreview value={detail.data.payloadJson} />
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    Alcance del modelo
                  </h4>
                </div>
                <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  El detalle refleja exactamente el historial persistido en la BD. No se inventan reintentos, proveedores externos ni automatizaciones no documentadas.
                </p>
              </div>
            </>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
}
