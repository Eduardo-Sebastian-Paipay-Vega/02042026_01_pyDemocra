import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ShieldAlert } from "lucide-react";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { adaptSensitiveMedicalFormToInput } from "../../../services/clinico/form-adapters";
import type {
  BeneficiaryMedicalRecordInput,
  SensitiveMedicalDetail,
  SensitiveRecordScope,
  VolunteerSensitiveRecordInput,
} from "../types";
import {
  buildEmptySensitiveForm,
  mapSensitiveDetailToForm,
  validateSensitiveMedicalForm,
  type SensitiveMedicalFormValues,
} from "../forms";
import {
  PeopleDetailField,
  PeopleErrorBlock,
  PeopleField,
  PeopleModalHeader,
  PeopleSection,
  PeopleTextArea,
  PeopleTextInput,
  formatPeopleDate,
  formatPeopleText,
} from "./people-shared";

type SensitiveAccessGateState = {
  accessReason: string;
};

export function SensitiveAccessGateModal({
  open,
  onClose,
  scope,
  personName,
  loggable,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  scope: SensitiveRecordScope;
  personName: string;
  loggable: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<SensitiveAccessGateState>({
    defaultValues: {
      accessReason: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ accessReason: "" });
      setSubmitError(null);
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    const accessReason = values.accessReason.trim();
    if (!accessReason) {
      setSubmitError("Debes indicar un motivo de acceso.");
      return;
    }

    try {
      setSubmitError(null);
      await onConfirm(accessReason);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo abrir la ficha sensible."
      );
    }
  });

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[560px]">
      <PeopleModalHeader
        title="Motivo de acceso sensible"
        description={`Debes justificar el acceso a la ficha ${scope === "beneficiaries" ? "medica" : "sensible"} de ${personName}.`}
        onClose={onClose}
      />

      <form className="space-y-4 p-4" onSubmit={(event) => void submit(event)}>
        {submitError && <PeopleErrorBlock message={submitError} />}
        <PeopleField label="Motivo de acceso" error={submitError ?? undefined}>
          <PeopleTextArea
            rows={3}
            placeholder="Ej: atencion de emergencia, seguimiento clinico, actualizacion autorizada"
            {...register("accessReason")}
          />
        </PeopleField>

        {!loggable && (
          <div
            className="rounded-2xl px-4 py-3 text-[12px]"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            La bitacora automatica no puede persistirse sobre esta ficha porque el log disponible solo referencia `clinico.fichas_medicas(id)`.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" type="submit">
            Abrir ficha
          </GradientButton>
          <OutlineButton size="sm" type="button" onClick={onClose}>
            Cancelar
          </OutlineButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function SensitiveMedicalFormModal({
  open,
  onClose,
  detail,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  detail: SensitiveMedicalDetail | null;
  isSaving: boolean;
  onSubmit: (
    input: BeneficiaryMedicalRecordInput | VolunteerSensitiveRecordInput
  ) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<SensitiveMedicalFormValues>({
    defaultValues: buildEmptySensitiveForm(),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(detail ? mapSensitiveDetailToForm(detail) : buildEmptySensitiveForm());
    setSubmitError(null);
  }, [detail, open, reset]);

  const submit = handleSubmit(async (values) => {
    if (!detail) {
      return;
    }

    const validationErrors = validateSensitiveMedicalForm(values);
    if (validationErrors.accessReason) {
      setSubmitError(validationErrors.accessReason);
      return;
    }

    try {
      setSubmitError(null);
      await onSubmit(adaptSensitiveMedicalFormToInput(detail, values));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar la ficha sensible."
      );
    }
  });

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[820px]">
      <PeopleModalHeader
        title={detail?.hasRecord ? "Editar ficha sensible" : "Registrar ficha sensible"}
        description="La actualizacion se ejecuta contra las tablas clinicas reales del tenant."
        onClose={onClose}
      />

      <form className="max-h-[78vh] space-y-4 overflow-y-auto p-4" onSubmit={(event) => void submit(event)}>
        {submitError && <PeopleErrorBlock message={submitError} />}
        {!detail ? (
          <PeopleErrorBlock message="No se encontro la ficha a editar." />
        ) : detail.scope === "beneficiaries" ? (
          <>
            <PeopleSection title="Ficha medica" description="clinico.fichas_medicas">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PeopleField label="Tipo de sangre">
                  <PeopleTextInput placeholder="Ej: O+" {...register("bloodType")} />
                </PeopleField>
                <PeopleField label="Alergias">
                  <PeopleTextInput placeholder="Alergias" {...register("allergies")} />
                </PeopleField>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <PeopleField label="Condiciones preexistentes">
                  <PeopleTextArea rows={3} placeholder="Condiciones" {...register("preexistingConditions")} />
                </PeopleField>
                <PeopleField label="Medicacion actual">
                  <PeopleTextArea rows={3} placeholder="Medicacion" {...register("currentMedication")} />
                </PeopleField>
              </div>
            </PeopleSection>
          </>
        ) : (
          <PeopleSection title="Ficha sensible de voluntario" description="clinico.ficha_sensible_voluntario">
            <div className="space-y-3">
              <PeopleField label="Condiciones medicas">
                <PeopleTextArea rows={4} placeholder="Condiciones medicas" {...register("medicalConditions")} />
              </PeopleField>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PeopleField label="Contacto emergencia">
                  <PeopleTextInput placeholder="Contacto" {...register("emergencyContact")} />
                </PeopleField>
                <PeopleField label="Telefono emergencia">
                  <PeopleTextInput placeholder="Telefono" {...register("emergencyPhone")} />
                </PeopleField>
              </div>
            </div>
          </PeopleSection>
        )}

        <PeopleSection title="Trazabilidad de acceso" description="El motivo se usa para registrar o justificar el acceso sensible.">
          <PeopleField label="Motivo de acceso" error={submitError ?? undefined}>
            <PeopleTextArea
              rows={3}
              placeholder="Motivo obligatorio para lectura o actualizacion sensible"
              {...register("accessReason", { required: true })}
            />
          </PeopleField>
        </PeopleSection>

        <div className="flex flex-wrap gap-2">
          <GradientButton size="sm" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar ficha"}
          </GradientButton>
          <OutlineButton size="sm" type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </OutlineButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function SensitiveMedicalDetailModal({
  open,
  onClose,
  detail,
  loading,
  error,
  onRetry,
  onEdit,
  canWrite,
}: {
  open: boolean;
  onClose: () => void;
  detail: SensitiveMedicalDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: () => void;
  canWrite: boolean;
}) {
  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[980px]">
      <PeopleModalHeader
        title="Detalle de ficha sensible"
        description="El contenido clinico solo se expone despues de pasar por la validacion de acceso."
        onClose={onClose}
        actions={
          detail && canWrite ? (
            <OutlineButton size="sm" onClick={onEdit}>
              {detail.hasRecord ? "Editar" : "Registrar"}
            </OutlineButton>
          ) : null
        }
      />

      <div className="max-h-[78vh] space-y-4 overflow-y-auto p-4">
        {loading && <PeopleErrorBlock message="Cargando ficha sensible..." />}
        {!loading && error && <PeopleErrorBlock message={error} onRetry={onRetry} />}
        {!loading && !error && detail && (
          <>
            <div
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl px-4 py-4"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <h4 className="text-[16px]" style={{ color: "var(--t-text)" }}>
                    {detail.personName}
                  </h4>
                </div>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {detail.documentLabel}
                </p>
              </div>
              <StatusDot variant={detail.hasRecord ? "warning" : "secondary"}>
                {detail.hasRecord ? "Con ficha" : "Sin ficha"}
              </StatusDot>
            </div>

            <PeopleSection title="Control sensible" description="Estado del acceso y trazabilidad.">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <PeopleDetailField label="Actualizado" value={formatPeopleDate(detail.updatedAt)} />
                <PeopleDetailField label="Creado por" value={formatPeopleText(detail.createdBy)} />
                <PeopleDetailField label="Actualizado por" value={formatPeopleText(detail.updatedBy)} />
                <PeopleDetailField
                  label="Bitacora acceso"
                  value={detail.accessLogged ? "Registrada" : "No persistida"}
                />
              </div>
              {detail.accessWarning && (
                <div className="mt-3">
                  <PeopleErrorBlock message={detail.accessWarning} />
                </div>
              )}
            </PeopleSection>

            {detail.scope === "beneficiaries" ? (
              <>
                <PeopleSection title="Ficha medica" description="clinico.fichas_medicas">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <PeopleDetailField label="Tipo de sangre" value={formatPeopleText(detail.bloodType)} />
                    <PeopleDetailField label="Alergias" value={formatPeopleText(detail.allergies)} />
                    <PeopleDetailField
                      label="Condiciones preexistentes"
                      value={formatPeopleText(detail.preexistingConditions)}
                    />
                    <PeopleDetailField
                      label="Medicacion actual"
                      value={formatPeopleText(detail.currentMedication)}
                    />
                  </div>
                </PeopleSection>

                <PeopleSection title="Perfil asociado" description="Contexto clinico relacionado al beneficiario.">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <PeopleDetailField label="Perfil" value={detail.profileLabel} />
                    {detail.childProfile && (
                      <>
                        <PeopleDetailField label="Tutor" value={formatPeopleText(detail.childProfile.tutorName)} />
                        <PeopleDetailField
                          label="Telefono tutor"
                          value={formatPeopleText(detail.childProfile.tutorPhone)}
                        />
                        <PeopleDetailField label="Colegio" value={formatPeopleText(detail.childProfile.school)} />
                      </>
                    )}
                    {detail.seniorProfile && (
                      <>
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
                      </>
                    )}
                  </div>
                </PeopleSection>
              </>
            ) : (
              <PeopleSection title="Ficha sensible de voluntario" description="clinico.ficha_sensible_voluntario">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PeopleDetailField label="Estado voluntario" value={formatPeopleText(detail.stateLabel)} />
                  <PeopleDetailField
                    label="Contacto emergencia"
                    value={formatPeopleText(detail.emergencyContact)}
                  />
                  <PeopleDetailField
                    label="Telefono emergencia"
                    value={formatPeopleText(detail.emergencyPhone)}
                  />
                  <PeopleDetailField
                    label="Condiciones medicas"
                    value={formatPeopleText(detail.medicalConditions)}
                  />
                </div>
              </PeopleSection>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

