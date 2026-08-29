import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Download } from "lucide-react";
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useIdCardTemplateDetail } from "../hooks/useIdCardTemplateDetail";
import { buildIdCardQrPayload, buildIdCardRenderSubject } from "../idCardShared";
import type {
  IdCardTemplateUpsertInput,
  IdCardVolunteerOption,
} from "../types";
import {
  PeopleDetailField,
  PeopleErrorBlock,
  PeopleField,
  PeopleModalHeader,
  PeopleSection,
  PeopleSelectInput,
  formatPeopleText,
} from "./people-shared";
import { IdCardCanvasPreview, type IdCardCanvasPreviewHandle } from "./IdCardCanvasPreview";
import { IdCardTemplateWizard } from "./IdCardTemplateWizard";

// ─── Shared helper ────────────────────────────────────────────────────────────

function buildTemplatePreviewSubject(volunteer: IdCardVolunteerOption | null) {
  return buildIdCardRenderSubject({
    fullName: volunteer?.fullName,
    documentLabel: volunteer?.documentLabel,
    photoUrl: volunteer?.photoUrl,
    cardCode: "VC-0000-DEMO",
    qrPayload: buildIdCardQrPayload("VC-0000-DEMO"),
  });
}

// ─── Form modal (wizard) ──────────────────────────────────────────────────────

export function IdCardTemplateFormModal({
  open,
  onClose,
  mode,
  templateId,
  volunteerOptions,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  templateId: string | null;
  volunteerOptions: IdCardVolunteerOption[];
  isSaving: boolean;
  onSubmit: (input: IdCardTemplateUpsertInput) => Promise<void>;
}) {
  const [modalWidth, setModalWidth] = useState("max-w-[1240px]");
  const detailState = useIdCardTemplateDetail(open && mode === "edit" ? templateId : null);

  useEffect(() => {
    if (!open) setModalWidth("max-w-[1240px]");
  }, [open]);

  return (
    <ModalShell open={open} onClose={onClose} width={modalWidth}>
      <PeopleModalHeader
        title={mode === "edit" ? "Editar plantilla ID" : "Nueva plantilla ID"}
        description="Personaliza la ubicación de los elementos, la tipografía y el diseño de la credencial."
        onClose={onClose}
      />
      <IdCardTemplateWizard
        mode={mode}
        initialData={detailState.detail}
        volunteerOptions={volunteerOptions}
        isSaving={isSaving}
        isLoading={detailState.loading && mode === "edit"}
        loadError={detailState.error}
        onRetryLoad={detailState.refresh}
        onSubmit={onSubmit}
        onClose={onClose}
        onExpandChange={(expanded) =>
          setModalWidth(expanded ? "max-w-[98vw]" : "max-w-[1240px]")
        }
      />
    </ModalShell>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

export function IdCardTemplateDetailModal({
  open,
  onClose,
  templateId,
  volunteerOptions,
  isToggling,
  onEdit,
  onToggleActive,
}: {
  open: boolean;
  onClose: () => void;
  templateId: string | null;
  volunteerOptions: IdCardVolunteerOption[];
  isToggling: boolean;
  onEdit: (templateId: string) => void;
  onToggleActive: (templateId: string, nextActive: boolean) => Promise<void>;
}) {
  const previewRef = useRef<IdCardCanvasPreviewHandle | null>(null);
  const [previewVolunteerId, setPreviewVolunteerId] = useState("");
  const detailState = useIdCardTemplateDetail(open ? templateId : null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPreviewVolunteerId((current) => current || volunteerOptions[0]?.value || "");
  }, [open, volunteerOptions]);

  const previewVolunteer =
    volunteerOptions.find((option) => option.value === previewVolunteerId) ?? null;
  const detail = detailState.detail;
  const previewSubject = useMemo(
    () => buildTemplatePreviewSubject(previewVolunteer),
    [previewVolunteer]
  );

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1180px]">
      <PeopleModalHeader
        title="Detalle de plantilla ID"
        description="Revisa y gestiona la configuración de diseño de esta credencial."
        onClose={onClose}
        actions={
          detail ? (
            <>
              <OutlineButton size="sm" onClick={() => onEdit(detail.template.id)}>
                Editar
              </OutlineButton>
              <OutlineButton
                size="sm"
                disabled={isToggling}
                onClick={() => void onToggleActive(detail.template.id, !detail.template.isActive)}
              >
                {detail.template.isActive ? "Desactivar" : "Activar"}
              </OutlineButton>
            </>
          ) : null
        }
      />

      <div className="max-h-[80vh] overflow-y-auto p-4">
        {detailState.loading && <PeopleErrorBlock message="Cargando plantilla..." />}
        {!detailState.loading && detailState.error && (
          <PeopleErrorBlock message={detailState.error} onRetry={detailState.refresh} />
        )}
        {!detailState.loading && !detailState.error && detail && (
          <div className="grid gap-4 xl:grid-cols-[1.25fr_420px]">
            <div className="space-y-4">
              <div
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl px-4 py-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <h4 className="text-[16px]" style={{ color: "var(--t-text)" }}>
                      {detail.template.name}
                    </h4>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                    {detail.fields.length} campos configurados
                  </p>
                </div>
                <StatusDot variant={detail.template.isActive ? "success" : "secondary"}>
                  {detail.template.isActive ? "Activa" : "Inactiva"}
                </StatusDot>
              </div>

              <PeopleSection title="Metadatos" description="Dimensiones, trazabilidad y visibilidad.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <PeopleDetailField label="Ancho" value={String(detail.template.templateWidth)} />
                  <PeopleDetailField label="Alto" value={String(detail.template.templateHeight)} />
                  <PeopleDetailField label="Creado por" value={formatPeopleText(detail.createdBy)} />
                  <PeopleDetailField label="Actualizado por" value={formatPeopleText(detail.updatedBy)} />
                </div>
              </PeopleSection>

              <PeopleSection
                title="Coordenadas"
                description="Configuración de ubicación y estilo de los elementos."
              >
                <div className="space-y-3">
                  {detail.fields.map((field) => (
                    <div
                      key={field.fieldKey}
                      className="grid grid-cols-2 gap-3 rounded-2xl p-3 md:grid-cols-5"
                      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                    >
                      <PeopleDetailField label="Campo" value={field.label} />
                      <PeopleDetailField label="Posicion" value={`${field.posX}, ${field.posY}`} />
                      <PeopleDetailField
                        label="Caja"
                        value={`${field.width ?? "-"} x ${field.height ?? "-"}`}
                      />
                      <PeopleDetailField
                        label="Fuente"
                        value={`${field.fontSize ?? "-"} / ${field.fontFamily ?? "-"}`}
                      />
                      <PeopleDetailField
                        label="Color / Z"
                        value={`${field.colorHex ?? "-"} / ${field.zIndex}`}
                      />
                    </div>
                  ))}
                </div>
              </PeopleSection>
            </div>

            <div className="space-y-4">
              <PeopleSection
                title="Preview"
                description="Canvas real con sujeto de ejemplo y exportacion PNG."
              >
                <PeopleField label="Voluntario demo">
                  <PeopleSelectInput
                    value={previewVolunteerId}
                    onChange={(event) => setPreviewVolunteerId(event.target.value)}
                  >
                    <option value="">Selecciona un voluntario</option>
                    {volunteerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </PeopleSelectInput>
                </PeopleField>

                <div className="mt-3">
                  <IdCardCanvasPreview
                    ref={previewRef}
                    baseImageUrl={detail.template.baseImageUrl}
                    templateWidth={detail.template.templateWidth}
                    templateHeight={detail.template.templateHeight}
                    fields={detail.fields}
                    subject={previewSubject}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm"
                    onClick={() =>
                      void previewRef.current?.downloadPng(
                        `${detail.template.name.trim().replace(/\s+/g, "-").toLowerCase()}.png`
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Exportar PNG
                  </OutlineButton>
                </div>
              </PeopleSection>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
