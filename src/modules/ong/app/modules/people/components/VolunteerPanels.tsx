import { useEffect, useMemo, useState } from "react";
import { type FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { Briefcase, FileText, ShieldCheck, UserRound } from "lucide-react";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { useFilePreview } from "../../../lib/use-file-preview";
import { adaptVolunteerFormToUpsertInput } from "../../../services/personas/form-adapters";
import type { VolunteerCatalogData, VolunteerDetailData, VolunteerUpsertInput } from "../types";
import {
  buildEmptyVolunteerForm,
  mapVolunteerDetailToForm,
  validateVolunteerForm,
  type VolunteerFormValues,
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

const SKILL_LEVEL_OPTIONS = [
  { value: "", label: "Sin nivel" },
  { value: "basico", label: "Basico" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
  { value: "experto", label: "Experto" },
];

function resolveVolunteerValidationMessage(
  formErrors: FieldErrors<VolunteerFormValues>
): string | null {
  return (
    formErrors.documentNumber?.message ??
    formErrors.firstName?.message ??
    formErrors.lastName?.message ??
    formErrors.stateCode?.message ??
    formErrors.coordinatorYearsExperience?.message ??
    null
  );
}

export function VolunteerFormModal({
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
  detail: VolunteerDetailData | null;
  catalogs: VolunteerCatalogData;
  isSaving: boolean;
  onSubmit: (input: VolunteerUpsertInput) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const defaultValues = useMemo(
    () => buildEmptyVolunteerForm(catalogs.stateOptions, catalogs.countryOptions),
    [catalogs.countryOptions, catalogs.stateOptions]
  );
  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VolunteerFormValues>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const skillsArray = useFieldArray({
    control,
    name: "skills",
    keyName: "fieldKey",
  });
  const rolesArray = useFieldArray({
    control,
    name: "operationalRoles",
    keyName: "fieldKey",
  });
  const documentsArray = useFieldArray({
    control,
    name: "documents",
    keyName: "fieldKey",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubmitError(null);
    reset(detail ? mapVolunteerDetailToForm(detail) : defaultValues);
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

  const hasCoordinatorProfile = watch("hasCoordinatorProfile");
  const coordinatorYearsExperience = watch("coordinatorYearsExperience");
  const watchedDocuments = watch("documents");
  const selectedPhotoFile = watch("photoFile");
  const removePhoto = watch("removePhoto");
  const existingPhotoUrl = watch("existingPhotoUrl");
  const photoPreviewUrl = useFilePreview(
    selectedPhotoFile,
    removePhoto ? null : existingPhotoUrl || null
  );

  useEffect(() => {
    if (!hasCoordinatorProfile || coordinatorYearsExperience >= 0) {
      clearErrors("coordinatorYearsExperience");
    }
  }, [clearErrors, coordinatorYearsExperience, hasCoordinatorProfile]);

  const submit = handleSubmit(async (values) => {
    const validationErrors = validateVolunteerForm(values);
    if (validationErrors.coordinatorYearsExperience) {
      setError("coordinatorYearsExperience", {
        type: "manual",
        message: validationErrors.coordinatorYearsExperience,
      });
    }

    const validationMessage =
      validationErrors.skills ??
      validationErrors.operationalRoles ??
      validationErrors.documents ??
      validationErrors.coordinatorYearsExperience ??
      null;

    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }

    setSubmitError(null);
    clearErrors("coordinatorYearsExperience");
    let input: VolunteerUpsertInput;
    try {
      setIsUploadingFiles(true);
      input = await adaptVolunteerFormToUpsertInput(values);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudieron preparar los archivos del voluntario."
      );
      return;
    } finally {
      setIsUploadingFiles(false);
    }

    try {
      await onSubmit(input);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el voluntario.");
    }
  }, (formErrors) => {
    setSubmitError(resolveVolunteerValidationMessage(formErrors));
  });

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1180px]">
      <PeopleModalHeader
        title={mode === "edit" ? "Editar voluntario" : "Nuevo voluntario"}
        description="Formulario conectado a ong.voluntarios, rrhh.voluntario_habilidades, rrhh.asignaciones_rol y rrhh.documentos_voluntario."
        onClose={onClose}
      />

      <form className="max-h-[80vh] space-y-4 overflow-y-auto p-4" onSubmit={(event) => void submit(event)}>
        {submitError && <PeopleErrorBlock message={submitError} />}

        <PeopleSection
          title="Perfil base"
          description="Atributos principales del voluntario y enlace opcional al perfil IAM."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <PeopleField label="ID perfil IAM">
              <PeopleTextInput placeholder="UUID de public.profiles" {...register("iamUserId")} />
            </PeopleField>
            <PeopleField label="Numero documento" error={errors.documentNumber?.message}>
              <PeopleTextInput
                placeholder="Documento"
                {...register("documentNumber", {
                  required: "El numero de documento es obligatorio.",
                })}
              />
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
            <PeopleField label="Estado" error={errors.stateCode?.message}>
              <PeopleSelectInput
                {...register("stateCode", { required: "Debes seleccionar un estado real." })}
              >
                <option value="">Selecciona</option>
                {catalogs.stateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </PeopleSelectInput>
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
            <PeopleField label="Nacimiento">
              <PeopleTextInput type="date" {...register("birthDate")} />
            </PeopleField>
            <PeopleField label="Correo">
              <PeopleTextInput type="email" placeholder="correo@dominio.com" {...register("email")} />
            </PeopleField>
            <PeopleField label="Telefono">
              <PeopleTextInput placeholder="Telefono" {...register("phone")} />
            </PeopleField>
            <PeopleField label="Foto del voluntario">
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
                      alt="Vista previa del voluntario"
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

          <div className="mt-3">
            <PeopleField label="Observaciones">
              <PeopleTextArea rows={3} placeholder="Observaciones del voluntario" {...register("notes")} />
            </PeopleField>
          </div>
        </PeopleSection>

        <PeopleSection
          title="Habilidades"
          description="Catalogo real de rrhh.habilidades y nivel operativo."
        >
          <div className="space-y-3">
            {skillsArray.fields.length === 0 && (
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Sin habilidades registradas.
              </p>
            )}
            {skillsArray.fields.map((field, index) => (
              <div key={field.fieldKey} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto]">
                <PeopleSelectInput {...register(`skills.${index}.code` as const)}>
                  <option value="">Selecciona habilidad</option>
                  {catalogs.skillOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </PeopleSelectInput>
                <PeopleSelectInput {...register(`skills.${index}.level` as const)}>
                  {SKILL_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </PeopleSelectInput>
                <OutlineButton size="sm" type="button" onClick={() => skillsArray.remove(index)}>
                  Quitar
                </OutlineButton>
              </div>
            ))}
            <div className="flex justify-start">
              <OutlineButton
                size="sm"
                type="button"
                onClick={() => skillsArray.append({ code: "", level: "" })}
              >
                Agregar habilidad
              </OutlineButton>
            </div>
          </div>
        </PeopleSection>

        <PeopleSection
          title="Roles operativos"
          description="Asignaciones reales de rrhh.asignaciones_rol. Los roles no presentes se desactivan logicamente."
        >
          <div className="space-y-3">
            {rolesArray.fields.length === 0 && (
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Sin roles operativos registrados.
              </p>
            )}
            {rolesArray.fields.map((field, index) => (
              <div key={field.fieldKey} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_120px_auto]">
                <PeopleSelectInput {...register(`operationalRoles.${index}.roleId` as const)}>
                  <option value="">Selecciona rol operativo</option>
                  {catalogs.operationalRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </PeopleSelectInput>
                <PeopleTextInput type="date" {...register(`operationalRoles.${index}.assignedAt` as const)} />
                <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  <input type="checkbox" {...register(`operationalRoles.${index}.active` as const)} />
                  Activo
                </label>
                <OutlineButton size="sm" type="button" onClick={() => rolesArray.remove(index)}>
                  Quitar
                </OutlineButton>
              </div>
            ))}
            <div className="flex justify-start">
              <OutlineButton
                size="sm"
                type="button"
                onClick={() => rolesArray.append({ roleId: "", assignedAt: "", active: true })}
              >
                Agregar rol
              </OutlineButton>
            </div>
          </div>
        </PeopleSection>

        <PeopleSection
          title="Documentos"
          description="Documentos vinculados en rrhh.documentos_voluntario. Si se quitan del formulario se archivan con vigente=false."
        >
          <div className="space-y-3">
            {documentsArray.fields.length === 0 && (
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Sin documentos registrados.
              </p>
            )}
            {documentsArray.fields.map((field, index) => (
              <div
                key={field.fieldKey}
                className="grid grid-cols-1 gap-3 rounded-2xl px-3 py-3 md:grid-cols-[180px_minmax(0,1fr)_180px_120px_auto]"
                style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
              >
                <input type="hidden" {...register(`documents.${index}.existingUrl` as const)} />
                <PeopleTextInput placeholder="Tipo" {...register(`documents.${index}.type` as const)} />
                <div className="space-y-2">
                  <input
                    type="file"
                    className="ong-field-control h-10 w-full rounded-xl px-3 text-[12px] outline-none"
                    style={{
                      border: "1px solid var(--t-border-strong)",
                      background: "var(--t-input-bg)",
                      color: "var(--t-text)",
                    }}
                    onChange={(event) =>
                      setValue(
                        `documents.${index}.file`,
                        event.target.files?.[0] ?? null,
                        { shouldDirty: true }
                      )
                    }
                  />
                  {watchedDocuments?.[index]?.file && (
                    <p className="text-[11px]" style={{ color: "var(--t-text-secondary)" }}>
                      Nuevo archivo: {watchedDocuments[index]?.file?.name}
                    </p>
                  )}
                  {!watchedDocuments?.[index]?.file &&
                    watchedDocuments?.[index]?.existingUrl && (
                      <p className="break-all text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                        Archivo actual: {watchedDocuments[index]?.existingUrl}
                      </p>
                    )}
                </div>
                <PeopleTextInput type="date" {...register(`documents.${index}.expirationDate` as const)} />
                <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                  <input type="checkbox" {...register(`documents.${index}.isCurrent` as const)} />
                  Vigente
                </label>
                <OutlineButton size="sm" type="button" onClick={() => documentsArray.remove(index)}>
                  Quitar
                </OutlineButton>
              </div>
            ))}
            <div className="flex justify-start">
              <OutlineButton
                size="sm"
                type="button"
                onClick={() =>
                  documentsArray.append({
                    type: "",
                    existingUrl: "",
                    file: null,
                    expirationDate: "",
                    isCurrent: true,
                  })
                }
              >
                Agregar documento
              </OutlineButton>
            </div>
          </div>
        </PeopleSection>

        <PeopleSection
          title="Perfil coordinador"
          description="Datos opcionales de rrhh.perfil_coordinador."
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              <input type="checkbox" {...register("hasCoordinatorProfile")} />
              Mantener perfil coordinador
            </label>

            {hasCoordinatorProfile && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PeopleField
                  label="Anios experiencia"
                  error={errors.coordinatorYearsExperience?.message}
                >
                  <PeopleTextInput
                    type="number"
                    min={0}
                    {...register("coordinatorYearsExperience", { valueAsNumber: true })}
                  />
                </PeopleField>
                <PeopleField label="Departamento">
                  <PeopleTextInput placeholder="Departamento asignado" {...register("coordinatorDepartment")} />
                </PeopleField>
              </div>
            )}
          </div>
        </PeopleSection>

        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" type="submit" disabled={isSaving || isUploadingFiles}>
            {isUploadingFiles
              ? "Preparando archivos..."
              : isSaving
                ? "Guardando..."
                : mode === "edit"
                  ? "Guardar cambios"
                  : "Crear voluntario"}
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

export function VolunteerDetailModal({
  open,
  onClose,
  detail,
  loading,
  error,
  onRetry,
  onEdit,
  onDeactivate,
}: {
  open: boolean;
  onClose: () => void;
  detail: VolunteerDetailData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[1180px]">
      <PeopleModalHeader
        title="Detalle de voluntario"
        description="Vista consolidada desde ong.voluntarios, rrhh.habilidades, rrhh.asignaciones_rol y rrhh.documentos_voluntario."
        onClose={onClose}
        actions={
          detail ? (
            <>
              <OutlineButton size="sm" onClick={onEdit}>
                Editar
              </OutlineButton>
              {detail.volunteer.stateKind !== "inactive" && (
                <OutlineButton size="sm" onClick={onDeactivate}>
                  Desactivar
                </OutlineButton>
              )}
            </>
          ) : null
        }
      />

      <div className="max-h-[80vh] space-y-4 overflow-y-auto p-4">
        {loading && <PeopleErrorBlock message="Cargando detalle del voluntario..." />}
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
                    {detail.volunteer.fullName}
                  </h4>
                </div>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {detail.volunteer.documentLabel}
                </p>
              </div>
              <StatusDot variant={detail.volunteer.stateVariant}>{detail.volunteer.stateLabel}</StatusDot>
            </div>

            <PeopleSection title="Perfil" description="Datos base y trazabilidad del registro.">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <PeopleDetailField label="Correo" value={formatPeopleText(detail.volunteer.email)} />
                <PeopleDetailField label="Telefono" value={formatPeopleText(detail.volunteer.phone)} />
                <PeopleDetailField label="Genero" value={formatPeopleText(detail.volunteer.genderLabel)} />
                <PeopleDetailField label="Pais" value={formatPeopleText(detail.volunteer.countryLabel)} />
                <PeopleDetailField label="Nacimiento" value={formatPeopleDate(detail.volunteer.birthDate)} />
                <PeopleDetailField label="Perfil IAM" value={formatPeopleText(detail.volunteer.iamUserId)} />
                <PeopleDetailField label="Creado por" value={formatPeopleText(detail.createdBy)} />
                <PeopleDetailField label="Actualizado por" value={formatPeopleText(detail.updatedBy)} />
                <PeopleDetailField label="Horas aprobadas" value={`${detail.volunteer.approvedHours} h`} />
                <PeopleDetailField label="Proyectos" value={String(detail.volunteer.projectCount)} />
                <PeopleDetailField label="Actividades" value={String(detail.volunteer.activityCount)} />
                <PeopleDetailField label="Documentos" value={String(detail.volunteer.documentCount)} />
              </div>
              <div className="mt-3">
                <PeopleDetailField label="Observaciones" value={formatPeopleText(detail.volunteer.notes)} />
              </div>
            </PeopleSection>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <PeopleSection title="Habilidades" description="rrhh.voluntario_habilidades">
                <div className="space-y-2">
                  {detail.skills.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Sin habilidades registradas.
                    </p>
                  ) : (
                    detail.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                      >
                        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {skill.label}
                        </span>
                        <StatusDot variant="info">{formatPeopleText(skill.level)}</StatusDot>
                      </div>
                    ))
                  )}
                </div>
              </PeopleSection>

              <PeopleSection title="Roles operativos" description="rrhh.asignaciones_rol">
                <div className="space-y-2">
                  {detail.operationalRoles.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Sin roles operativos registrados.
                    </p>
                  ) : (
                    detail.operationalRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2"
                        style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
                          <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                            {role.roleName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                            {formatPeopleDate(role.assignedAt)}
                          </span>
                          <StatusDot variant={role.active ? "success" : "secondary"}>
                            {role.active ? "Activo" : "Inactivo"}
                          </StatusDot>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PeopleSection>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <PeopleSection title="Roles institucionales" description="public.user_roles_sedes + public.roles">
                <div className="space-y-2">
                  {detail.institutionalRoles.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Sin roles institucionales enlazados.
                    </p>
                  ) : (
                    detail.institutionalRoles.map((role) => (
                      <div
                        key={`${role.roleId}-${role.sedeId}`}
                        className="rounded-xl px-3 py-2"
                        style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                      >
                        <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                          {role.roleName}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {role.sedeName}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PeopleSection>

              <PeopleSection title="Documentos" description="rrhh.documentos_voluntario">
                <div className="space-y-2">
                  {detail.documents.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                      Sin documentos cargados.
                    </p>
                  ) : (
                    detail.documents.map((document) => (
                      <div
                        key={document.id}
                        className="rounded-xl px-3 py-2"
                        style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
                            <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                              {document.type}
                            </span>
                          </div>
                          <StatusDot variant={document.isCurrent ? "success" : "secondary"}>
                            {document.isCurrent ? "Vigente" : "Archivado"}
                          </StatusDot>
                        </div>
                        <p className="mt-1 break-all text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {document.url}
                        </p>
                        <p className="mt-1 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          Vence: {formatPeopleDate(document.expirationDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PeopleSection>
            </div>

            <PeopleSection title="Perfil coordinador" description="rrhh.perfil_coordinador">
              {detail.coordinatorProfile ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PeopleDetailField
                    label="Anios experiencia"
                    value={String(detail.coordinatorProfile.yearsExperience)}
                  />
                  <PeopleDetailField
                    label="Departamento"
                    value={formatPeopleText(detail.coordinatorProfile.department)}
                  />
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  El voluntario no tiene perfil coordinador registrado.
                </p>
              )}
            </PeopleSection>
          </>
        )}
      </div>
    </ModalShell>
  );
}

export function VolunteerDeactivateModal({
  open,
  onClose,
  volunteerName,
  isDeactivating,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  volunteerName: string;
  isDeactivating: boolean;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[520px]">
      <PeopleModalHeader
        title="Desactivar voluntario"
        description="La desactivacion actualiza codigo_estado con un valor inactivo real de ong.estados_voluntario."
        onClose={onClose}
      />

      <div className="space-y-4 p-4">
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
              Se actualizara logicamente el estado de <strong>{volunteerName}</strong>. No se elimina el registro.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" onClick={() => void onConfirm()} disabled={isDeactivating}>
            {isDeactivating ? "Desactivando..." : "Confirmar"}
          </GradientButton>
          <OutlineButton size="sm" onClick={onClose} disabled={isDeactivating}>
            Cancelar
          </OutlineButton>
        </div>
      </div>
    </ModalShell>
  );
}

