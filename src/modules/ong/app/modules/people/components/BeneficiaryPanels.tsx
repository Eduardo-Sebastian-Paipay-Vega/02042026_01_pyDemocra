import { useEffect, useMemo, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { HeartPulse, UserRound } from "lucide-react";
import { ModalShell } from "../../../components/ui/modal-shell";
import { GradientButton } from "../../../components/ui/gradient-button";
import { OutlineButton } from "../../../components/ui/outline-button";
import { StatusDot } from "../../../components/ui/status-dot";
import { useFilePreview } from "../../../lib/use-file-preview";
import { adaptBeneficiaryFormToUpsertInput } from "../../../services/personas/form-adapters";
import type {
  BeneficiaryCatalogData,
  BeneficiaryDetailData,
  BeneficiaryUpsertInput,
} from "../types";
import {
  buildEmptyBeneficiaryForm,
  mapBeneficiaryDetailToForm,
  validateBeneficiaryForm,
  type BeneficiaryFormValues,
} from "../forms";
import {
  PeopleDetailField,
  PeopleErrorBlock,
  PeopleField,
  PeopleModalHeader,
  PeopleSection,
  PeopleSelectInput,
  PeopleTextArea,
  PeopleTextInput,
  formatPeopleDate,
  formatPeopleText,
} from "./people-shared";

function resolveBeneficiaryValidationMessage(
  formErrors: FieldErrors<BeneficiaryFormValues>
): string | null {
  return (
    formErrors.firstName?.message ??
    formErrors.lastName?.message ??
    formErrors.tutorName?.message ??
    null
  );
}

export function BeneficiaryFormModal({
  open,
  onClose,
  mode,
  detail,
  catalogs,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  detail: BeneficiaryDetailData | null;
  catalogs: BeneficiaryCatalogData;
  isSaving: boolean;
  onSubmit: (input: BeneficiaryUpsertInput) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const defaultValues = useMemo(() => buildEmptyBeneficiaryForm(catalogs), [catalogs]);
  const {
    clearErrors,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BeneficiaryFormValues>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubmitError(null);
    reset(detail ? mapBeneficiaryDetailToForm(detail) : defaultValues);
  }, [defaultValues, detail, open, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const subscription = watch(() => {
      if (submitError) {
        setSubmitError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [open, submitError, watch]);

  const profileKind = watch("profileKind");
  const tutorName = watch("tutorName");
  const selectedPhotoFile = watch("photoFile");
  const removePhoto = watch("removePhoto");
  const existingPhotoUrl = watch("existingPhotoUrl");
  const photoPreviewUrl = useFilePreview(
    selectedPhotoFile,
    removePhoto ? null : existingPhotoUrl || null
  );

  useEffect(() => {
    if (profileKind !== "child" || tutorName.trim()) {
      clearErrors("tutorName");
    }
  }, [clearErrors, profileKind, tutorName]);

  const submit = handleSubmit(async (values) => {
    const validationErrors = validateBeneficiaryForm(values);
    if (validationErrors.tutorName) {
      setError("tutorName", {
        type: "manual",
        message: validationErrors.tutorName,
      });
      setSubmitError(validationErrors.tutorName);
      return;
    }

    setSubmitError(null);
    clearErrors("tutorName");
    let input: BeneficiaryUpsertInput;
    try {
      setIsUploadingFiles(true);
      input = await adaptBeneficiaryFormToUpsertInput(values);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo preparar la foto del beneficiario."
      );
      return;
    } finally {
      setIsUploadingFiles(false);
    }

    try {
      await onSubmit(input);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar el beneficiario."
      );
    }
  }, (formErrors) => {
    setSubmitError(resolveBeneficiaryValidationMessage(formErrors));
  });

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[980px]">
      <PeopleModalHeader
        title={mode === "edit" ? "Editar beneficiario" : "Nuevo beneficiario"}
        description="Formulario conectado a ong.beneficiarios, clinico.perfil_nino y clinico.perfil_adulto_mayor."
        onClose={onClose}
      />

      <form className="max-h-[78vh] space-y-4 overflow-y-auto p-4" onSubmit={(event) => void submit(event)}>
        {submitError && <PeopleErrorBlock message={submitError} />}

        <PeopleSection title="Perfil base" description="Identidad principal y perfil asociado.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <PeopleField label="Numero documento">
              <PeopleTextInput placeholder="Documento" {...register("documentNumber")} />
            </PeopleField>
            <PeopleField label="Tipo documento">
              <PeopleSelectInput {...register("documentType")}>
                <option value="">Selecciona</option>
                {catalogs.documentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </PeopleSelectInput>
            </PeopleField>
            <PeopleField label="Pais">
              <PeopleSelectInput {...register("countryCode")}>
                <option value="">Selecciona</option>
                {catalogs.countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </PeopleSelectInput>
            </PeopleField>
            <PeopleField label="Nombre" error={errors.firstName?.message}>
              <PeopleTextInput
                placeholder="Nombre"
                {...register("firstName", { required: "El nombre es obligatorio." })}
              />
            </PeopleField>
            <PeopleField label="Apellido" error={errors.lastName?.message}>
              <PeopleTextInput
                placeholder="Apellido"
                {...register("lastName", { required: "El apellido es obligatorio." })}
              />
            </PeopleField>
            <PeopleField label="Nacimiento">
              <PeopleTextInput type="date" {...register("birthDate")} />
            </PeopleField>
            <PeopleField label="Genero">
              <PeopleSelectInput {...register("genderCode")}>
                <option value="">Selecciona</option>
                {catalogs.genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </PeopleSelectInput>
            </PeopleField>
            <PeopleField label="Telefono">
              <PeopleTextInput placeholder="Telefono" {...register("phone")} />
            </PeopleField>
            <PeopleField label="Foto del beneficiario">
              <div className="space-y-3">
                <input type="hidden" {...register("existingPhotoUrl")} />
                <input type="hidden" {...register("removePhoto")} />
                <input
                  type="file"
                  accept="image/*"
                  className="ong-field-control h-10 w-full rounded-xl px-3 text-[12px] outline-none"
                  style={{
                    border: "1px solid var(--t-border-strong)",
                    background: "var(--t-input-bg)",
                    color: "var(--t-text)",
                  }}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setValue("photoFile", file, { shouldDirty: true });
                    if (file) {
                      setValue("removePhoto", false, { shouldDirty: true });
                    }
                  }}
                />
                <div
                  className="rounded-xl px-3 py-3"
                  style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                >
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt="Vista previa del beneficiario"
                      className="h-28 w-28 rounded-xl object-cover"
                    />
                  ) : (
                    <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Sin foto registrada.
                    </p>
                  )}
                  {selectedPhotoFile && (
                    <p className="mt-2 text-[11px]" style={{ color: "var(--t-text-secondary)" }}>
                      Archivo seleccionado: {selectedPhotoFile.name}
                    </p>
                  )}
                  {!selectedPhotoFile && !removePhoto && existingPhotoUrl && (
                    <p className="mt-2 break-all text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                      Archivo actual: {existingPhotoUrl}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <OutlineButton
                    size="sm"
                    type="button"
                    onClick={() => {
                      setValue("photoFile", null, { shouldDirty: true });
                      setValue("removePhoto", true, { shouldDirty: true });
                    }}
                  >
                    Quitar foto
                  </OutlineButton>
                  {(selectedPhotoFile || removePhoto) && (
                    <OutlineButton
                      size="sm"
                      type="button"
                      onClick={() => {
                        setValue("photoFile", null, { shouldDirty: true });
                        setValue("removePhoto", false, { shouldDirty: true });
                      }}
                    >
                      Restaurar actual
                    </OutlineButton>
                  )}
                </div>
              </div>
            </PeopleField>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <PeopleField label="Direccion">
              <PeopleTextArea rows={2} placeholder="Direccion" {...register("address")} />
            </PeopleField>
            <PeopleField label="Observaciones">
              <PeopleTextArea rows={2} placeholder="Observaciones" {...register("notes")} />
            </PeopleField>
          </div>
        </PeopleSection>

        <PeopleSection title="Tipo de perfil" description="Determina el perfil clinico asociado al beneficiario.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <PeopleField label="Perfil">
              <PeopleSelectInput {...register("profileKind")}>
                <option value="general">General</option>
                <option value="child">Nino</option>
                <option value="senior">Adulto mayor</option>
              </PeopleSelectInput>
            </PeopleField>
          </div>
        </PeopleSection>

        {profileKind === "child" && (
          <PeopleSection title="Perfil nino" description="clinico.perfil_nino">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PeopleField label="Tutor" error={errors.tutorName?.message}>
                <PeopleTextInput placeholder="Nombre del tutor" {...register("tutorName")} />
              </PeopleField>
              <PeopleField label="Telefono tutor">
                <PeopleTextInput placeholder="Telefono tutor" {...register("tutorPhone")} />
              </PeopleField>
              <PeopleField label="Colegio">
                <PeopleTextInput placeholder="Colegio" {...register("school")} />
              </PeopleField>
              <PeopleField label="Grado escolar">
                <PeopleTextInput placeholder="Grado escolar" {...register("schoolGrade")} />
              </PeopleField>
            </div>
          </PeopleSection>
        )}

        {profileKind === "senior" && (
          <PeopleSection title="Perfil adulto mayor" description="clinico.perfil_adulto_mayor">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  <input type="checkbox" {...register("limitedMobility")} />
                  Movilidad reducida
                </label>
                <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  <input type="checkbox" {...register("livesAlone")} />
                  Vive solo
                </label>
              </div>
              <PeopleField label="Contacto emergencia">
                <PeopleTextInput placeholder="Contacto emergencia" {...register("emergencyContact")} />
              </PeopleField>
            </div>
          </PeopleSection>
        )}

        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" type="submit" disabled={isSaving || isUploadingFiles}>
            {isUploadingFiles
              ? "Preparando imagen..."
              : isSaving
                ? "Guardando..."
                : mode === "edit"
                  ? "Guardar cambios"
                  : "Crear beneficiario"}
          </GradientButton>
          <OutlineButton
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isSaving || isUploadingFiles}
          >
            Cancelar
          </OutlineButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function BeneficiaryDetailModal({
  open,
  onClose,
  detail,
  loading,
  error,
  onRetry,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  detail: BeneficiaryDetailData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: () => void;
}) {
  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[980px]">
      <PeopleModalHeader
        title="Detalle de beneficiario"
        description="Vista consolidada desde ong.beneficiarios y perfiles clinicos no sensibles."
        onClose={onClose}
        actions={
          detail ? (
            <OutlineButton size="sm" onClick={onEdit}>
              Editar
            </OutlineButton>
          ) : null
        }
      />

      <div className="max-h-[78vh] space-y-4 overflow-y-auto p-4">
        {loading && <PeopleErrorBlock message="Cargando detalle del beneficiario..." />}
        {!loading && error && <PeopleErrorBlock message={error} onRetry={onRetry} />}
        {!loading && !error && detail && (
          <>
            <div
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl px-4 py-4"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[16px]" style={{ color: "var(--t-text)" }}>
                    {detail.beneficiary.fullName}
                  </h4>
                </div>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {detail.beneficiary.documentLabel}
                </p>
              </div>
              <StatusDot variant="info">{detail.beneficiary.profileLabel}</StatusDot>
            </div>

            <PeopleSection title="Perfil" description="Datos base del beneficiario.">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <PeopleDetailField label="Genero" value={formatPeopleText(detail.beneficiary.genderLabel)} />
                <PeopleDetailField label="Pais" value={formatPeopleText(detail.beneficiary.countryLabel)} />
                <PeopleDetailField label="Nacimiento" value={formatPeopleDate(detail.beneficiary.birthDate)} />
                <PeopleDetailField label="Telefono" value={formatPeopleText(detail.beneficiary.phone)} />
                <PeopleDetailField label="Direccion" value={formatPeopleText(detail.beneficiary.address)} />
                <PeopleDetailField label="Creado por" value={formatPeopleText(detail.createdBy)} />
                <PeopleDetailField label="Actualizado por" value={formatPeopleText(detail.updatedBy)} />
                <PeopleDetailField
                  label="Ficha medica"
                  value={detail.beneficiary.hasMedicalRecord ? "Registrada" : "Pendiente"}
                />
              </div>
              <div className="mt-3">
                <PeopleDetailField label="Observaciones" value={formatPeopleText(detail.beneficiary.notes)} />
              </div>
            </PeopleSection>

            {(detail.childProfile || detail.seniorProfile) && (
              <PeopleSection title="Perfil asociado" description="Detalle del perfil especifico enlazado al beneficiario.">
                {detail.childProfile && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <PeopleDetailField label="Tutor" value={formatPeopleText(detail.childProfile.tutorName)} />
                    <PeopleDetailField label="Telefono tutor" value={formatPeopleText(detail.childProfile.tutorPhone)} />
                    <PeopleDetailField label="Colegio" value={formatPeopleText(detail.childProfile.school)} />
                    <PeopleDetailField label="Grado escolar" value={formatPeopleText(detail.childProfile.schoolGrade)} />
                  </div>
                )}
                {detail.seniorProfile && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <PeopleDetailField
                      label="Movilidad reducida"
                      value={detail.seniorProfile.limitedMobility ? "Si" : "No"}
                    />
                    <PeopleDetailField
                      label="Vive solo"
                      value={detail.seniorProfile.livesAlone ? "Si" : "No"}
                    />
                    <PeopleDetailField
                      label="Contacto emergencia"
                      value={formatPeopleText(detail.seniorProfile.emergencyContact)}
                    />
                  </div>
                )}
              </PeopleSection>
            )}

            <PeopleSection title="Proyectos vinculados" description="Relacion real con ong.participaciones_proyecto.">
              {detail.projectLinks.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Sin proyectos vinculados.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.projectLinks.map((projectLink) => (
                    <div
                      key={projectLink.id}
                      className="rounded-xl px-3 py-2"
                      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <HeartPulse className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
                        <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {projectLink.projectName}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                        Vinculado: {formatPeopleDate(projectLink.linkedAt)}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                        {formatPeopleText(projectLink.notes)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </PeopleSection>
          </>
        )}
      </div>
    </ModalShell>
  );
}
