import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { CreditCard, Download, QrCode, RefreshCcw, UserRound } from "lucide-react";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { useIdCardDetail } from "../hooks/useIdCardDetail";
import { useIdCardTemplateDetail } from "../hooks/useIdCardTemplateDetail";
import {
  buildIdCardQrPayload,
  buildIdCardRenderSubject,
  generateIdCardCode,
} from "../idCardShared";
import type {
  IdCardDetailData,
  IdCardStatusCode,
  IdCardTemplateOption,
  IdCardUpsertInput,
  IdCardVolunteerOption,
} from "../types";
import {
  PeopleDetailField,
  PeopleErrorBlock,
  PeopleField,
  PeopleModalHeader,
  PeopleSection,
  PeopleSelectInput,
  PeopleTextInput,
  formatPeopleText,
} from "./people-shared";
import {
  IdCardCanvasPreview,
  type IdCardCanvasPreviewHandle,
} from "./IdCardCanvasPreview";

type CardFormValues = {
  volunteerId: string;
  templateId: string;
  cardCode: string;
  expiresAt: string;
  stateCode: IdCardStatusCode;
};

function extractDocumentNumber(documentLabel: string): string {
  return documentLabel.replace(/\D/g, "");
}

function buildCardDefaults(
  detail: IdCardDetailData | null,
  volunteerOptions: IdCardVolunteerOption[],
  templateOptions: IdCardTemplateOption[]
): CardFormValues {
  if (detail) {
    return {
      volunteerId: detail.card.volunteerId,
      templateId: detail.card.templateId,
      cardCode: detail.card.cardCode,
      expiresAt: detail.card.expiresAt ? detail.card.expiresAt.slice(0, 10) : "",
      stateCode: detail.card.stateCode,
    };
  }

  const firstVolunteer = volunteerOptions[0] ?? null;
  const firstTemplate = templateOptions.find((option) => option.isActive) ?? templateOptions[0] ?? null;

  return {
    volunteerId: firstVolunteer?.value ?? "",
    templateId: firstTemplate?.value ?? "",
    cardCode: firstVolunteer
      ? generateIdCardCode(extractDocumentNumber(firstVolunteer.documentLabel))
      : "",
    expiresAt: "",
    stateCode: "activa",
  };
}

function buildCardInput(values: CardFormValues, imageRenderUrl: string | null): IdCardUpsertInput {
  return {
    volunteerId: values.volunteerId,
    templateId: values.templateId,
    cardCode: values.cardCode || null,
    expiresAt: values.expiresAt || null,
    stateCode: values.stateCode,
    imageRenderUrl,
  };
}

function buildCardPreviewSubject(
  volunteer: IdCardVolunteerOption | null,
  cardCode: string
) {
  const safeCode = cardCode.trim() || "VC-0000-DEMO";
  return buildIdCardRenderSubject({
    fullName: volunteer?.fullName,
    documentLabel: volunteer?.documentLabel,
    photoUrl: volunteer?.photoUrl,
    cardCode: safeCode,
    qrPayload: buildIdCardQrPayload(safeCode),
  });
}

export function IdCardFormModal({
  open,
  onClose,
  mode,
  cardId,
  volunteerOptions,
  templateOptions,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  cardId: string | null;
  volunteerOptions: IdCardVolunteerOption[];
  templateOptions: IdCardTemplateOption[];
  isSaving: boolean;
  onSubmit: (input: IdCardUpsertInput) => Promise<void>;
}) {
  const previewRef = useRef<IdCardCanvasPreviewHandle | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [codeTouched, setCodeTouched] = useState(false);
  const detailState = useIdCardDetail(open && mode === "edit" ? cardId : null);
  const { register, watch, reset, setValue, handleSubmit } = useForm<CardFormValues>({
    defaultValues: buildCardDefaults(null, volunteerOptions, templateOptions),
  });

  const values = watch();
  const templateDetailState = useIdCardTemplateDetail(open ? values.templateId || null : null);
  const selectedVolunteer =
    volunteerOptions.find((option) => option.value === values.volunteerId) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(buildCardDefaults(detailState.detail, volunteerOptions, templateOptions));
    setSubmitError(null);
    setCodeTouched(mode === "edit");
  }, [detailState.detail, mode, open, reset, templateOptions, volunteerOptions]);

  useEffect(() => {
    if (!open || mode !== "create" || codeTouched) {
      return;
    }

    if (!selectedVolunteer) {
      return;
    }

    setValue(
      "cardCode",
      generateIdCardCode(extractDocumentNumber(selectedVolunteer.documentLabel)),
      { shouldDirty: true }
    );
  }, [codeTouched, mode, open, selectedVolunteer, setValue]);

  const previewSubject = useMemo(
    () => buildCardPreviewSubject(selectedVolunteer, values.cardCode),
    [selectedVolunteer, values.cardCode]
  );

  const submit = handleSubmit(async (formValues) => {
    setSubmitError(null);

    if (!formValues.volunteerId) {
      setSubmitError("Debes seleccionar un voluntario real.");
      return;
    }
    if (!formValues.templateId) {
      setSubmitError("Debes seleccionar una plantilla real.");
      return;
    }
    if (!templateDetailState.detail) {
      setSubmitError("La plantilla seleccionada aun no esta disponible para render.");
      return;
    }

    try {
      const imageRenderUrl = await previewRef.current?.exportPngDataUrl();
      await onSubmit(buildCardInput(formValues, imageRenderUrl ?? null));
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo emitir la credencial."
      );
    }
  });

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1180px]">
      <PeopleModalHeader
        title={mode === "edit" ? "Editar credencial ID" : "Emitir credencial ID"}
        description="Gestiona ong.id_cards con render real de foto, nombre, DNI, codigo y QR."
        onClose={onClose}
      />

      <form className="max-h-[80vh] overflow-y-auto p-4" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_420px]">
          <div className="space-y-4">
            {detailState.loading && mode === "edit" && (
              <PeopleErrorBlock message="Cargando credencial real..." />
            )}
            {detailState.error && mode === "edit" && (
              <PeopleErrorBlock message={detailState.error} onRetry={detailState.refresh} />
            )}
            {templateDetailState.error && (
              <PeopleErrorBlock message={templateDetailState.error} onRetry={templateDetailState.refresh} />
            )}
            {submitError && <PeopleErrorBlock message={submitError} />}

            <PeopleSection
              title="Datos de emision"
              description="La credencial se vincula 1:1 con ong.voluntarios y usa una plantilla real."
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PeopleField label="Voluntario">
                  <PeopleSelectInput {...register("volunteerId")}>
                    <option value="">Selecciona un voluntario</option>
                    {volunteerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </PeopleSelectInput>
                </PeopleField>
                <PeopleField label="Plantilla">
                  <PeopleSelectInput {...register("templateId")}>
                    <option value="">Selecciona una plantilla</option>
                    {templateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}{option.isActive ? "" : " (inactiva)"}
                      </option>
                    ))}
                  </PeopleSelectInput>
                </PeopleField>
                <PeopleField label="Codigo">
                  <PeopleTextInput
                    {...register("cardCode")}
                    onChange={(event) => {
                      setCodeTouched(true);
                      setValue("cardCode", event.target.value, { shouldDirty: true });
                    }}
                  />
                </PeopleField>
                <PeopleField label="Vence el">
                  <PeopleTextInput type="date" {...register("expiresAt")} />
                </PeopleField>
                <PeopleField label="Estado">
                  <PeopleSelectInput {...register("stateCode")}>
                    <option value="activa">Activa</option>
                    <option value="revocada">Revocada</option>
                    <option value="expirada">Expirada</option>
                  </PeopleSelectInput>
                </PeopleField>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <OutlineButton
                  size="sm"
                  type="button"
                  onClick={() => {
                    const nextCode = generateIdCardCode(
                      extractDocumentNumber(selectedVolunteer?.documentLabel ?? "")
                    );
                    setCodeTouched(true);
                    setValue("cardCode", nextCode, { shouldDirty: true });
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Regenerar codigo
                </OutlineButton>
              </div>
            </PeopleSection>

            {selectedVolunteer && (
              <PeopleSection
                title="Voluntario vinculado"
                description="Fuente real del nombre, DNI y foto usados para el render."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <PeopleDetailField label="Voluntario" value={selectedVolunteer.fullName} />
                  <PeopleDetailField label="Documento" value={selectedVolunteer.documentLabel} />
                  <PeopleDetailField label="Estado" value={selectedVolunteer.stateLabel} />
                  <PeopleDetailField
                    label="Foto"
                    value={selectedVolunteer.photoUrl ? "Disponible" : "Sin foto"}
                  />
                </div>
              </PeopleSection>
            )}

            <div className="flex flex-wrap gap-2">
              <GradientButton size="sm" type="submit" disabled={isSaving || detailState.loading}>
                {isSaving
                  ? "Guardando..."
                  : mode === "edit"
                    ? "Guardar credencial"
                    : "Emitir credencial"}
              </GradientButton>
              <OutlineButton size="sm" type="button" onClick={onClose} disabled={isSaving}>
                Cancelar
              </OutlineButton>
            </div>
          </div>

          <div className="space-y-4">
            <PeopleSection
              title="Canvas"
              description="Render real y exportacion PNG a partir de la plantilla seleccionada."
            >
              {!templateDetailState.detail && !templateDetailState.loading ? (
                <PeopleErrorBlock message="Selecciona una plantilla para previsualizar la credencial." />
              ) : null}

              {templateDetailState.detail && (
                <>
                  <IdCardCanvasPreview
                    ref={previewRef}
                    baseImageUrl={templateDetailState.detail.template.baseImageUrl}
                    templateWidth={templateDetailState.detail.template.templateWidth}
                    templateHeight={templateDetailState.detail.template.templateHeight}
                    fields={templateDetailState.detail.fields}
                    subject={previewSubject}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <OutlineButton
                      size="sm"
                      type="button"
                      onClick={() =>
                        void previewRef.current?.downloadPng(
                          `${(values.cardCode || "credencial-id").trim().replace(/\s+/g, "-").toLowerCase()}.png`
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                      Exportar PNG
                    </OutlineButton>
                  </div>
                </>
              )}
            </PeopleSection>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export function IdCardDetailModal({
  open,
  onClose,
  cardId,
  onEdit,
  onRevoke,
}: {
  open: boolean;
  onClose: () => void;
  cardId: string | null;
  onEdit: (cardId: string) => void;
  onRevoke: (cardId: string) => void;
}) {
  const previewRef = useRef<IdCardCanvasPreviewHandle | null>(null);
  const detailState = useIdCardDetail(open ? cardId : null);
  const detail = detailState.detail;
  const previewSubject = useMemo(
    () =>
      buildIdCardRenderSubject({
        fullName: detail?.card.volunteerName,
        documentLabel: detail?.card.documentLabel,
        photoUrl: detail?.card.volunteerPhotoUrl,
        cardCode: detail?.card.cardCode,
        qrPayload: detail?.card.qrPayload,
      }),
    [detail]
  );

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1180px]">
      <PeopleModalHeader
        title="Detalle de credencial ID"
        description="Detalle real desde ong.id_cards y su plantilla asociada."
        onClose={onClose}
        actions={
          detail ? (
            <>
              <OutlineButton size="sm" onClick={() => onEdit(detail.card.id)}>
                Editar
              </OutlineButton>
              {detail.card.stateCode !== "revocada" && (
                <OutlineButton size="sm" onClick={() => onRevoke(detail.card.id)}>
                  Revocar
                </OutlineButton>
              )}
            </>
          ) : null
        }
      />

      <div className="max-h-[80vh] overflow-y-auto p-4">
        {detailState.loading && <PeopleErrorBlock message="Cargando credencial..." />}
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
                      {detail.card.cardCode}
                    </h4>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                    {detail.card.templateName}
                  </p>
                </div>
                <StatusDot variant={detail.card.statusVariant}>{detail.card.stateLabel}</StatusDot>
              </div>

              <PeopleSection title="Titular" description="Voluntario enlazado a la credencial.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <PeopleDetailField label="Voluntario" value={detail.card.volunteerName} />
                  <PeopleDetailField label="Documento" value={detail.card.documentLabel} />
                  <PeopleDetailField label="Emitida" value={detail.card.issuedAtLabel} />
                  <PeopleDetailField label="Vence" value={detail.card.expiresAtLabel} />
                </div>
              </PeopleSection>

              <PeopleSection title="Trazabilidad" description="Campos persistidos y responsables.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <PeopleDetailField label="Plantilla" value={detail.template.name} />
                  <PeopleDetailField label="QR payload" value={detail.card.qrPayload} />
                  <PeopleDetailField label="Creado por" value={formatPeopleText(detail.createdBy)} />
                  <PeopleDetailField label="Actualizado por" value={formatPeopleText(detail.updatedBy)} />
                </div>
              </PeopleSection>
            </div>

            <div className="space-y-4">
              <PeopleSection
                title="Render"
                description="Canvas reconstruido desde la plantilla y los datos reales del voluntario."
              >
                <IdCardCanvasPreview
                  ref={previewRef}
                  baseImageUrl={detail.template.baseImageUrl}
                  templateWidth={detail.template.templateWidth}
                  templateHeight={detail.template.templateHeight}
                  fields={detail.fields}
                  subject={previewSubject}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm"
                    onClick={() =>
                      void previewRef.current?.downloadPng(
                        `${detail.card.cardCode.trim().replace(/\s+/g, "-").toLowerCase()}.png`
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

export function IdCardRevokeModal({
  open,
  onClose,
  card,
  isRevoking,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  card: IdCardDetailData["card"] | null;
  isRevoking: boolean;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[520px]">
      <PeopleModalHeader
        title="Revocar credencial ID"
        description="La operacion actualiza ong.id_cards.estado a 'revocada'."
        onClose={onClose}
      />

      <div className="space-y-4 p-4">
        {card ? (
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
              <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                {card.volunteerName}
              </p>
            </div>
            <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {card.documentLabel}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <QrCode className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
              <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                {card.cardCode}
              </span>
            </div>
          </div>
        ) : null}

        <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
          La credencial dejara de ser valida para flujos como el escaneo QR de asistencias, que
          segun el script SQL solo acepta tarjetas con estado `activa`.
        </p>

        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" disabled={isRevoking} onClick={() => void onConfirm()}>
            {isRevoking ? "Revocando..." : "Confirmar revocacion"}
          </GradientButton>
          <OutlineButton size="sm" onClick={onClose} disabled={isRevoking}>
            Cancelar
          </OutlineButton>
        </div>
      </div>
    </ModalShell>
  );
}

