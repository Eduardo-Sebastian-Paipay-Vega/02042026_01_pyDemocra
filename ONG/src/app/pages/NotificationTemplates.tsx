import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Bell,
  Braces,
  Eye,
  FileJson,
  FileText,
  Mail,
  MessageSquare,
  Power,
  Zap,
} from "lucide-react";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "../components/ui/gradient-button";
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
import { useNotificationTemplateDetail } from "../modules/notifications/hooks/useNotificationTemplateDetail";
import { useNotificationTemplateMutations } from "../modules/notifications/hooks/useNotificationTemplateMutations";
import { useNotificationTemplates } from "../modules/notifications/hooks/useNotificationTemplates";
import type {
  NotificationTemplateMutationInput,
  NotificationTemplateRow,
} from "../modules/notifications/types";

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

type TemplateStatusFilter = "all" | "active" | "inactive";

type TemplateFormState = NotificationTemplateMutationInput;

function buildTemplateForm(
  template?: NotificationTemplateRow | null,
  channelCode = ""
): TemplateFormState {
  return {
    templateId: template?.id,
    channelCode: template?.channelCode ?? channelCode,
    name: template?.name ?? "",
    subject: template?.subject ?? "",
    textBody: template?.textBody ?? "",
    htmlBody: template?.htmlBody ?? "",
    eventCode: template?.eventCode ?? "",
    variablesJson: template?.variablesJson ?? "[]",
    active: template?.active ?? true,
  };
}

const templateColumns: Column<NotificationTemplateRow>[] = [
  {
    key: "template",
    label: "Plantilla",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.name}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.subject || "Sin asunto"}
        </div>
      </div>
    ),
  },
  {
    key: "channel",
    label: "Canal",
    render: (row) => <StatusDot variant="info">{row.channelLabel}</StatusDot>,
  },
  {
    key: "event",
    label: "Evento / Variables",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.eventCode || "Sin codigo_evento"}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.variablesSummary}
        </div>
      </div>
    ),
  },
  {
    key: "content",
    label: "Contenido",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.contentSummary}
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.active ? "Disponible para uso" : "Desactivada"}
        </div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (row) => <StatusDot variant={row.statusVariant}>{row.activeLabel}</StatusDot>,
  },
  {
    key: "updated",
    label: "Actualizado",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.updatedAtLabel}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.updatedByLabel}
        </div>
      </div>
    ),
  },
];

export function NotificationTemplates() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateStatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateRow | null>(null);
  const [form, setForm] = useState<TemplateFormState>(buildTemplateForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { loading, error, data, refresh } = useNotificationTemplates();
  const detail = useNotificationTemplateDetail(detailTemplateId);
  const mutations = useNotificationTemplateMutations(refresh);

  const channelOptions = useMemo(
    () => [{ value: "all", label: "Canal: Todos" }].concat(data.channelOptions),
    [data.channelOptions]
  );

  const statusOptions = useMemo(
    () => [
      { label: "Todas", value: "all", active: statusFilter === "all" },
      { label: "Activas", value: "active", active: statusFilter === "active" },
      { label: "Inactivas", value: "inactive", active: statusFilter === "inactive" },
    ],
    [statusFilter]
  );

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();

    return data.rows.filter((row) => {
      if (normalized && !row.searchValue.includes(normalized)) {
        return false;
      }
      if (statusFilter === "active" && !row.active) {
        return false;
      }
      if (statusFilter === "inactive" && row.active) {
        return false;
      }
      if (channelFilter !== "all" && row.channelCode !== channelFilter) {
        return false;
      }
      return true;
    });
  }, [channelFilter, data.rows, searchValue, statusFilter]);

  function openCreateModal() {
    if (!data.access.canManageTemplates) {
      toast.error("No tienes acceso para crear plantillas.");
      return;
    }

    setEditingTemplate(null);
    setForm(buildTemplateForm(null, data.channelOptions[0]?.value ?? ""));
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditModal(template: NotificationTemplateRow) {
    if (!data.access.canManageTemplates) {
      toast.error("No tienes acceso para editar plantillas.");
      return;
    }

    setEditingTemplate(template);
    setForm(buildTemplateForm(template));
    setFormError(null);
    setIsFormOpen(true);
  }

  async function submitForm() {
    if (!form.channelCode) {
      setFormError("El canal es obligatorio.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("El nombre de la plantilla es obligatorio.");
      return;
    }

    try {
      await mutations.save({
        ...form,
        name: form.name.trim(),
        subject: form.subject.trim(),
        eventCode: form.eventCode.trim(),
      });
      toast.success(form.templateId ? "Plantilla actualizada." : "Plantilla creada.");
      setIsFormOpen(false);
      setEditingTemplate(null);
      setForm(buildTemplateForm(null, data.channelOptions[0]?.value ?? ""));
      setFormError(null);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la plantilla."
      );
    }
  }

  async function toggleTemplate(template: NotificationTemplateRow, active: boolean) {
    try {
      await mutations.toggleActive(template.id, active);
      toast.success(active ? "Plantilla reactivada." : "Plantilla desactivada.");
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "No se pudo actualizar el estado."
      );
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Plantillas"
        description="Administra las plantillas de notificación con su evento asociado y variables configurables."
        action={
          data.access.canManageTemplates
            ? { label: "Nueva plantilla", onClick: openCreateModal }
            : { label: "Actualizar", onClick: refresh }
        }
      />

      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <NotificationsStatusBadge
            allowed={data.access.canReadTemplates}
            allowedLabel="Lectura de plantillas disponible"
            deniedLabel="Sin acceso de lectura"
          />
          <NotificationsStatusBadge
            allowed={data.access.canManageTemplates}
            allowedLabel="Gestion de plantillas disponible"
            deniedLabel="Sin acceso de gestion"
          />
          <NotificationsStatusBadge
            allowed={data.channelOptions.length > 0}
            allowedLabel="Catalogo de canales real"
            deniedLabel="Sin catalogo de canales"
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
        <NotificationsSummaryField label="Plantillas reales" value={String(data.summary.total)} />
        <NotificationsSummaryField label="Activas" value={String(data.summary.active)} />
        <NotificationsSummaryField label="Inactivas" value={String(data.summary.inactive)} />
        <NotificationsSummaryField
          label="Con codigo_evento"
          value={String(data.summary.withEventCode)}
        />
      </div>

      {(error || !data.access.canReadTemplates) && (
        <NotificationsErrorBlock
          message={error ?? "No hay acceso disponible para leer plantillas reales."}
          onRetry={refresh}
        />
      )}

      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
          <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
            Plantillas documentadas
          </h2>
        </div>

        <FilterBar
          searchPlaceholder="Buscar por nombre, canal, asunto, codigo_evento o variables..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={statusOptions}
          onFilterClick={(value) => setStatusFilter(value as TemplateStatusFilter)}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <NotificationsSelectField
            value={channelFilter}
            onChange={setChannelFilter}
            options={channelOptions}
          />
        </div>

        <div className="mt-4">
          <DataTable
            columns={templateColumns}
            data={data.access.canReadTemplates ? filteredRows : []}
            loading={loading}
            emptyMessage="No se encontraron plantillas reales con los filtros actuales."
            actions={
              data.access.canManageTemplates
                ? [
                    { label: "Ver detalle", onClick: (row) => setDetailTemplateId(row.id) },
                    { label: "Editar", onClick: (row) => openEditModal(row) },
                    {
                      label: "Desactivar",
                      variant: "destructive",
                      onClick: (row) => void toggleTemplate(row, false),
                    },
                    {
                      label: "Reactivar",
                      onClick: (row) => void toggleTemplate(row, true),
                    },
                  ]
                : [{ label: "Ver detalle", onClick: (row) => setDetailTemplateId(row.id) }]
            }
          />
        </div>
      </div>

      <ModalShell
        open={Boolean(detailTemplateId)}
        onClose={() => setDetailTemplateId(null)}
        width="max-w-[980px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle de plantilla
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                comunicaciones.plantillas_notificacion
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
                <NotificationsDetailField label="Nombre" value={detail.data.name} />
                <NotificationsDetailField label="Canal" value={detail.data.channelLabel} />
                <NotificationsDetailField label="Codigo evento" value={detail.data.eventCode || "-"} />
                <NotificationsDetailField label="Estado" value={detail.data.activeLabel} />
                <NotificationsDetailField label="Asunto" value={detail.data.subject || "-"} />
                <NotificationsDetailField
                  label="Variables"
                  value={detail.data.variablesSummary}
                />
                <NotificationsDetailField label="Creado" value={detail.data.createdAtLabel} />
                <NotificationsDetailField label="Creado por" value={detail.data.createdByLabel} />
                <NotificationsDetailField label="Actualizado" value={detail.data.updatedAtLabel} />
                <NotificationsDetailField label="Actualizado por" value={detail.data.updatedByLabel} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                      Cuerpo texto
                    </h4>
                  </div>
                  <NotificationsCodePreview value={detail.data.textBody} />
                </div>

                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                      Cuerpo HTML
                    </h4>
                  </div>
                  <NotificationsCodePreview value={detail.data.htmlBody} />
                </div>
              </div>

              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Braces className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                    Variables JSON
                  </h4>
                </div>
                <NotificationsCodePreview value={detail.data.variablesJson} />
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={isFormOpen} onClose={() => setIsFormOpen(false)} width="max-w-[980px]">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {editingTemplate ? "Editar plantilla" : "Nueva plantilla"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                La BD real persiste `codigo_canal`, `nombre_plantilla`, `asunto`, `cuerpo_html`, `cuerpo_texto`, `variables`, `codigo_evento` y `activa`.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px]"
              onClick={() => setIsFormOpen(false)}
            >
              X
            </button>
          </div>

          {formError && (
            <NotificationsErrorBlock message={formError} onRetry={() => setFormError(null)} />
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <NotificationsSelectField
              value={form.channelCode}
              onChange={(value) => setForm((current) => ({ ...current, channelCode: value }))}
              options={
                data.channelOptions.length
                  ? data.channelOptions
                  : [{ value: "", label: "Sin canales disponibles" }]
              }
            />
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nombre de la plantilla"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={INPUT_STYLE}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  Codigo evento
                </h4>
              </div>
              <input
                value={form.eventCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, eventCode: event.target.value }))
                }
                placeholder="Codigo evento opcional"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Power className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  Estado
                </h4>
              </div>
              <label
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--t-text-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, active: event.target.checked }))
                  }
                />
                Plantilla activa
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  Asunto
                </h4>
              </div>
              <input
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subject: event.target.value }))
                }
                placeholder="Asunto opcional"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <FileJson className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  Variables JSON
                </h4>
              </div>
              <textarea
                value={form.variablesJson}
                onChange={(event) =>
                  setForm((current) => ({ ...current, variablesJson: event.target.value }))
                }
                rows={6}
                placeholder="[]"
                className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  Cuerpo texto
                </h4>
              </div>
              <textarea
                value={form.textBody}
                onChange={(event) =>
                  setForm((current) => ({ ...current, textBody: event.target.value }))
                }
                rows={10}
                placeholder="Contenido de texto plano"
                className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                <h4 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  Cuerpo HTML
                </h4>
              </div>
              <textarea
                value={form.htmlBody}
                onChange={(event) =>
                  setForm((current) => ({ ...current, htmlBody: event.target.value }))
                }
                rows={10}
                placeholder="Contenido HTML"
                className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={INPUT_STYLE}
              />
            </div>
          </div>

          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              La pantalla persiste `variables` y `codigo_evento` como metadata real de la tabla. No existe motor documental de disparo, render ni envio desde frontend.
            </p>
          </div>

          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => void submitForm()} disabled={mutations.isSaving}>
              {mutations.isSaving ? "Guardando..." : "Guardar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={() => setIsFormOpen(false)} disabled={mutations.isSaving}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
