import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { CreditCard, Download, ImagePlus, RefreshCcw } from "lucide-react";
import { ModalShell } from "../../../components/ui/modal-shell";
import { GradientButton } from "../../../components/ui/gradient-button";
import { OutlineButton } from "../../../components/ui/outline-button";
import { StatusDot } from "../../../components/ui/status-dot";
import { useIdCardTemplateDetail } from "../hooks/useIdCardTemplateDetail";
import {
  buildIdCardQrPayload,
  buildIdCardRenderSubject,
  createDefaultIdCardFields,
} from "../idCardShared";
import type {
  IdCardTemplateDetailData,
  IdCardTemplateFieldRow,
  IdCardTemplateUpsertInput,
  IdCardVolunteerOption,
} from "../types";
import {
  PeopleBoolean,
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

type TemplateFormValues = {
  name: string;
  baseImageUrl: string;
  templateWidth: number;
  templateHeight: number;
  isActive: boolean;
  fields: IdCardTemplateFieldRow[];
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

function buildTemplateDefaults(detail: IdCardTemplateDetailData | null): TemplateFormValues {
  if (detail) {
    return {
      name: detail.template.name,
      baseImageUrl: detail.template.baseImageUrl,
      templateWidth: detail.template.templateWidth,
      templateHeight: detail.template.templateHeight,
      isActive: detail.template.isActive,
      fields: detail.fields,
    };
  }

  return {
    name: "",
    baseImageUrl: "",
    templateWidth: 720,
    templateHeight: 420,
    isActive: true,
    fields: createDefaultIdCardFields(720, 420),
  };
}

function normalizeTemplateInput(values: TemplateFormValues): IdCardTemplateUpsertInput {
  return {
    name: values.name,
    baseImageUrl: values.baseImageUrl,
    templateWidth: Number(values.templateWidth),
    templateHeight: Number(values.templateHeight),
    isActive: values.isActive,
    fields: values.fields.map((field) => ({
      ...field,
      posX: Number(field.posX),
      posY: Number(field.posY),
      width: field.width === null ? null : Number(field.width),
      height: field.height === null ? null : Number(field.height),
      fontSize: field.fontSize === null ? null : Number(field.fontSize),
      zIndex: Number(field.zIndex),
    })),
  };
}

function buildTemplatePreviewSubject(volunteer: IdCardVolunteerOption | null) {
  return buildIdCardRenderSubject({
    fullName: volunteer?.fullName,
    documentLabel: volunteer?.documentLabel,
    photoUrl: volunteer?.photoUrl,
    cardCode: "VC-0000-DEMO",
    qrPayload: buildIdCardQrPayload("VC-0000-DEMO"),
  });
}

function TemplateFieldEditor({
  field,
  index,
  register,
}: {
  field: IdCardTemplateFieldRow;
  index: number;
  register: ReturnType<typeof useForm<TemplateFormValues>>["register"];
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
            {field.label}
          </p>
          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            field_key = {field.fieldKey}
          </p>
        </div>
        <StatusDot variant={field.fieldKey === "foto" || field.fieldKey === "qr" ? "info" : "secondary"}>
          {field.fieldKey === "foto" || field.fieldKey === "qr" ? "Bloque" : "Texto"}
        </StatusDot>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <PeopleField label="Pos X">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.posX`, { valueAsNumber: true })}
          />
        </PeopleField>
        <PeopleField label="Pos Y">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.posY`, { valueAsNumber: true })}
          />
        </PeopleField>
        <PeopleField label="Ancho">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.width`, {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </PeopleField>
        <PeopleField label="Alto">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.height`, {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </PeopleField>
        <PeopleField label="Fuente">
          <PeopleTextInput
            type="number"
            step="0.1"
            {...register(`fields.${index}.fontSize`, {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </PeopleField>
        <PeopleField label="Familia">
          <PeopleTextInput {...register(`fields.${index}.fontFamily`)} />
        </PeopleField>
        <PeopleField label="Peso">
          <PeopleTextInput {...register(`fields.${index}.fontWeight`)} />
        </PeopleField>
        <PeopleField label="Color">
          <PeopleTextInput placeholder="#0F172A" {...register(`fields.${index}.colorHex`)} />
        </PeopleField>
        <PeopleField label="Z-index">
          <PeopleTextInput
            type="number"
            min={1}
            step="1"
            {...register(`fields.${index}.zIndex`, { valueAsNumber: true })}
          />
        </PeopleField>
      </div>
    </div>
  );
}

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
  const previewRef = useRef<IdCardCanvasPreviewHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewVolunteerId, setPreviewVolunteerId] = useState("");
  const detailState = useIdCardTemplateDetail(open && mode === "edit" ? templateId : null);
  const { register, watch, reset, setValue, handleSubmit } = useForm<TemplateFormValues>({
    defaultValues: buildTemplateDefaults(null),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(buildTemplateDefaults(detailState.detail));
    setSubmitError(null);
    setPreviewVolunteerId((current) => current || volunteerOptions[0]?.value || "");
  }, [detailState.detail, open, reset, volunteerOptions]);

  const values = watch();
  const previewVolunteer =
    volunteerOptions.find((option) => option.value === previewVolunteerId) ?? null;
  const previewSubject = useMemo(
    () => buildTemplatePreviewSubject(previewVolunteer),
    [previewVolunteer]
  );

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setValue("baseImageUrl", dataUrl, { shouldDirty: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo cargar la imagen.");
    } finally {
      event.target.value = "";
    }
  }

  const submit = handleSubmit(async (formValues) => {
    setSubmitError(null);

    if (mode === "edit" && detailState.loading) {
      setSubmitError("Espera a que cargue la plantilla antes de guardar.");
      return;
    }

    try {
      await onSubmit(normalizeTemplateInput(formValues));
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la plantilla de credencial."
      );
    }
  });

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1240px]">
      <PeopleModalHeader
        title={mode === "edit" ? "Editar plantilla ID" : "Nueva plantilla ID"}
        description="Gestiona ong.id_card_templates y ong.id_card_template_fields con coordenadas reales para foto, nombre, DNI, codigo y QR."
        onClose={onClose}
      />

      <form className="max-h-[80vh] overflow-y-auto p-4" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-4 xl:grid-cols-[1.3fr_420px]">
          <div className="space-y-4">
            {detailState.loading && mode === "edit" && (
              <PeopleErrorBlock message="Cargando plantilla real..." />
            )}
            {detailState.error && mode === "edit" && (
              <PeopleErrorBlock message={detailState.error} onRetry={detailState.refresh} />
            )}
            {submitError && <PeopleErrorBlock message={submitError} />}

            <PeopleSection
              title="Plantilla base"
              description="Imagen, dimensiones del canvas y estado de la plantilla."
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PeopleField label="Nombre">
                  <PeopleTextInput {...register("name")} />
                </PeopleField>
                <PeopleField label="Imagen base URL">
                  <PeopleTextInput placeholder="https://... o data:image/..." {...register("baseImageUrl")} />
                </PeopleField>
                <PeopleField label="Ancho">
                  <PeopleTextInput type="number" min={1} {...register("templateWidth", { valueAsNumber: true })} />
                </PeopleField>
                <PeopleField label="Alto">
                  <PeopleTextInput type="number" min={1} {...register("templateHeight", { valueAsNumber: true })} />
                </PeopleField>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <PeopleBoolean
                  label="Plantilla activa"
                  checked={Boolean(values.isActive)}
                  onChange={(checked) => setValue("isActive", checked, { shouldDirty: true })}
                />
                <OutlineButton size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" />
                  Cargar imagen base
                </OutlineButton>
                <OutlineButton
                  size="sm"
                  type="button"
                  onClick={() =>
                    setValue(
                      "fields",
                      createDefaultIdCardFields(
                        Number(values.templateWidth) || 720,
                        Number(values.templateHeight) || 420
                      ),
                      { shouldDirty: true }
                    )
                  }
                >
                  <RefreshCcw className="h-4 w-4" />
                  Resetear coordenadas
                </OutlineButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleImageUpload(event)}
                />
              </div>
            </PeopleSection>

            <PeopleSection
              title="Coordenadas de campos"
              description="Cada field_key respeta el CHECK real de SQL: foto, nombre, dni, codigo y qr."
            >
              <div className="space-y-3">
                {values.fields.map((field, index) => (
                  <TemplateFieldEditor
                    key={field.fieldKey}
                    field={field}
                    index={index}
                    register={register}
                  />
                ))}
              </div>
            </PeopleSection>

            <div className="flex flex-wrap gap-2">
              <GradientButton size="sm" type="submit" disabled={isSaving || detailState.loading}>
                {isSaving
                  ? "Guardando..."
                  : mode === "edit"
                    ? "Guardar plantilla"
                    : "Crear plantilla"}
              </GradientButton>
              <OutlineButton size="sm" type="button" onClick={onClose} disabled={isSaving}>
                Cancelar
              </OutlineButton>
            </div>
          </div>

          <div className="space-y-4">
            <PeopleSection
              title="Preview"
              description="Render real del canvas con datos de un voluntario para validar coordenadas."
            >
              <div className="space-y-3">
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

                <IdCardCanvasPreview
                  ref={previewRef}
                  baseImageUrl={values.baseImageUrl || null}
                  templateWidth={Number(values.templateWidth) || 720}
                  templateHeight={Number(values.templateHeight) || 420}
                  fields={values.fields}
                  subject={previewSubject}
                />

                <div className="flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm"
                    type="button"
                    onClick={() =>
                      void previewRef.current?.downloadPng(
                        `${(values.name || "plantilla-id").trim().replace(/\s+/g, "-").toLowerCase()}.png`
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Exportar PNG
                  </OutlineButton>
                </div>
              </div>
            </PeopleSection>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

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
        description="Detalle real desde ong.id_card_templates y ong.id_card_template_fields."
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
                description="Configuracion persistida en ong.id_card_template_fields."
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
