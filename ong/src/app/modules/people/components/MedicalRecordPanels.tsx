import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ShieldAlert } from "lucide-react";
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
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
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, isValid, errors } } = useForm<SensitiveAccessGateState>({
    mode: "onChange",
    defaultValues: {
      accessReason: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ accessReason: "" });
    }
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await onConfirm(values.accessReason);
  });

  const quickReasons = ["Emergencia", "Seguimiento clínico", "Auditoría"];

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[560px]">
      <div className="bg-[#171512] text-[#F9F7F3] font-sans w-full h-full relative">
        {/* Header Superior */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[#26231F]">
          <div>
            <h3 className="text-xl font-bold text-[#F9F7F3]">
              Motivo de acceso sensible
            </h3>
            <p className="text-sm text-[#A4A29F] mt-1">
              Debes justificar el acceso a la ficha {scope === "beneficiaries" ? "médica" : "sensible"} de <span className="font-bold text-white uppercase">{personName}</span>.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md p-1.5 text-[#A4A29F] transition-colors hover:bg-[#1F1D1A]"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form className="p-6 space-y-5" onSubmit={(event) => void submit(event)}>
          <label className="block space-y-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#F9F7F3]">
                Motivo de acceso
              </span>
              <div className="flex flex-wrap gap-2">
                {quickReasons.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    className="text-xs bg-[#1F1D1A] text-[#A4A29F] px-2.5 py-1 rounded-md border border-[#26231F] hover:border-[#356C92] hover:text-[#F9F7F3] transition-colors"
                    onClick={() => {
                      const current = watch("accessReason");
                      const newValue = current ? `${current.trim()}, ${reason}` : reason;
                      setValue("accessReason", newValue, { shouldValidate: true, shouldDirty: true });
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              rows={3}
              placeholder="Escribe o selecciona un motivo válido (mín. 10 caracteres)"
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none bg-[#1F1D1A] border transition-all resize-none ${errors.accessReason ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#374151] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] focus:ring-2 focus:ring-[#356C92]/30'}`}
              {...register("accessReason", { required: true, minLength: 10 })}
            />
            {errors.accessReason && (
              <p className="text-xs text-red-400 mt-1">El motivo debe tener al menos 10 caracteres.</p>
            )}
          </label>

          {!loggable && (
            <div className="bg-[#231C11] border border-[#FCD34D]/20 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#FCD34D] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-[#FCD34D]">Trazabilidad activa</p>
                <p className="text-xs text-[#FDE68A] mt-1 leading-relaxed">
                  El acceso a esta ficha quedará registrado permanentemente en la bitácora de accesos sensibles del sistema.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-[#356C92] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#356C92]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Abrir ficha"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#A4A29F] hover:bg-[#1F1D1A] transition-colors border border-transparent hover:border-[#26231F] disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
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
      <div className="bg-[#171512] text-[#F9F7F3] font-sans w-full h-full relative flex flex-col">
        {/* Header Superior */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[#26231F] shrink-0">
          <div>
            <h3 className="text-xl font-bold text-[#F9F7F3]">
              {detail?.hasRecord ? "Editar ficha sensible" : "Registrar ficha sensible"}
            </h3>
            <p className="text-sm text-[#A4A29F] mt-1">
              Actualiza los datos clínicos sensibles del voluntario o beneficiario.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            className="rounded-md p-1.5 text-[#A4A29F] transition-colors hover:bg-[#1F1D1A]"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form className="p-6 space-y-6 overflow-y-auto max-h-[78vh]" onSubmit={(event) => void submit(event)}>
          {submitError && (
            <div className="bg-[#231C11] border border-[#D97706]/20 rounded-xl p-4 flex items-center justify-between">
               <span className="text-sm font-medium text-[#D97706]">{submitError}</span>
            </div>
          )}
          {!detail ? (
            <div className="bg-[#1F181E] border border-[#8B5CF6]/20 rounded-xl p-4">
              <span className="text-sm font-medium text-[#8B5CF6]">No se encontro la ficha a editar.</span>
            </div>
          ) : detail.scope === "beneficiaries" ? (
            <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[#F9F7F3]">Ficha medica</h4>
                <p className="text-xs text-[#A4A29F] mt-1">Datos médicos generales del beneficiario.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#A4A29F]">Tipo de sangre</span>
                  <select 
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] focus:border-[#356C92] transition-colors" 
                    {...register("bloodType")}
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#A4A29F]">Alergias</span>
                  <input type="text" placeholder="Alergias" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors" {...register("allergies")} />
                </label>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#A4A29F]">Condiciones preexistentes</span>
                  <textarea rows={3} placeholder="Condiciones" className="w-full rounded-xl px-4 py-3 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors resize-none" {...register("preexistingConditions")} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#A4A29F]">Medicacion actual</span>
                  <textarea rows={3} placeholder="Medicacion" className="w-full rounded-xl px-4 py-3 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors resize-none" {...register("currentMedication")} />
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[#F9F7F3]">Ficha sensible de voluntario</h4>
                <p className="text-xs text-[#A4A29F] mt-1">clinico.ficha_sensible_voluntario</p>
              </div>
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#A4A29F]">Condiciones medicas</span>
                  <textarea rows={4} placeholder="Condiciones medicas" className="w-full rounded-xl px-4 py-3 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors resize-none" {...register("medicalConditions")} />
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#A4A29F]">Contacto emergencia</span>
                    <input type="text" placeholder="Contacto" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors" {...register("emergencyContact")} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#A4A29F]">Telefono emergencia</span>
                    <input type="text" placeholder="Telefono" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-[#171512] border border-[#26231F] text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors" {...register("emergencyPhone")} />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[#F9F7F3]">Trazabilidad de acceso</h4>
              <p className="text-xs text-[#A4A29F] mt-1">El motivo se usa para registrar o justificar el acceso sensible.</p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#A4A29F]">Motivo de acceso</span>
              <textarea
                rows={3}
                placeholder="Motivo obligatorio para lectura o actualizacion sensible"
                className={`w-full rounded-xl px-4 py-3 text-sm outline-none bg-[#171512] border text-[#F9F7F3] placeholder:text-[#686561] focus:border-[#356C92] transition-colors resize-none ${submitError ? 'border-[#D97706]' : 'border-[#26231F]'}`}
                {...register("accessReason", { required: true })}
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#356C92] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#356C92]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando..." : "Guardar ficha"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#A4A29F] hover:bg-[#1F1D1A] transition-colors border border-transparent hover:border-[#26231F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
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
    <ModalShell open={open} onClose={onClose} width="max-w-[800px]">
      <div className="bg-[#171512] text-[#F9F7F3] font-sans w-full h-full relative flex flex-col">
        {/* Header Superior */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[#26231F] shrink-0">
          <div>
            <h3 className="text-xl font-bold text-[#F9F7F3]">
              Detalle de ficha sensible
            </h3>
            <p className="text-sm text-[#A4A29F] mt-1">
              Información clínica confidencial de acceso controlado.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {detail && canWrite && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#356C92] hover:bg-[#356C92]/90 transition-colors shadow-sm"
              >
                {detail.hasRecord ? "Editar ficha" : "Registrar ficha"}
              </button>
            )}
            <button
              type="button"
              aria-label="Cerrar modal"
              className="rounded-md p-1.5 text-[#A4A29F] transition-colors hover:bg-[#1F1D1A]"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[78vh]">
          {loading && (
            <div className="bg-[#100F0D] border border-[#26231F] rounded-xl p-5 flex items-center justify-center">
               <span className="text-sm text-[#A4A29F]">Cargando ficha sensible...</span>
            </div>
          )}
          {!loading && error && (
            <div className="bg-[#231C11] border border-[#D97706]/20 rounded-xl p-5 flex items-center justify-between">
               <span className="text-sm text-[#D97706]">{error}</span>
               <button onClick={onRetry} className="text-xs font-medium bg-[#1F1D1A] px-3 py-1.5 rounded-lg border border-[#26231F] hover:bg-[#26231F] transition-colors text-[#F9F7F3]">Reintentar</button>
            </div>
          )}
          {!loading && !error && detail && (
            <>
              {/* Top Bar Identity */}
              <div className="bg-transparent p-2 flex flex-wrap items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1F1D1A] border border-[#26231F] flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6 text-[#356C92]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[#F9F7F3] uppercase">
                      {detail.personName}
                    </h4>
                    <p className="text-sm text-[#A4A29F] mt-0.5 font-medium">
                      {detail.documentLabel}
                    </p>
                  </div>
                </div>
                {detail.hasRecord ? (
                  <span className="text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-[#08996A]/10 text-[#08996A] border border-[#08996A]/20 font-semibold uppercase tracking-wider">
                    Con ficha médica
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-[#D97706]/10 text-[#FCD34D] border border-[#D97706]/30 font-semibold uppercase tracking-wider shadow-sm">
                    Ficha pendiente
                  </span>
                )}
              </div>

              {/* Control sensible */}
              <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[#F9F7F3]">Control de acceso</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                    <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Actualizado</p>
                    <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleDate(detail.updatedAt)}</p>
                  </div>
                  <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                    <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Creado por</p>
                    <p className="text-sm font-semibold text-[#F9F7F3] mt-1 truncate" title={formatPeopleText(detail.createdBy)}>{formatPeopleText(detail.createdBy)}</p>
                  </div>
                  <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                    <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Actualizado por</p>
                    <p className="text-sm font-semibold text-[#F9F7F3] mt-1 truncate" title={formatPeopleText(detail.updatedBy)}>{formatPeopleText(detail.updatedBy)}</p>
                  </div>
                  <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                    <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Trazabilidad</p>
                    <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{detail.accessLogged ? "Registrada" : "No persistida"}</p>
                  </div>
                </div>
                {detail.accessWarning && (
                  <div className="mt-4 bg-[#231C11] border border-[#FCD34D]/20 rounded-xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-[#FCD34D] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm text-[#FDE68A] leading-relaxed font-medium">{detail.accessWarning}</p>
                  </div>
                )}
              </div>

              {!detail.hasRecord ? (
                <div className="bg-[#100F0D] border-2 border-[#26231F] border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                   <ShieldAlert className="w-12 h-12 text-[#686561] mb-4" strokeWidth={1} />
                   <h4 className="text-lg text-[#F9F7F3] font-bold mb-2">Sin información clínica</h4>
                   <p className="text-sm text-[#A4A29F] mb-6 max-w-md leading-relaxed">
                     Esta persona no cuenta con una ficha sensible registrada en el sistema. Es crucial registrar estos datos para garantizar una atención segura ante emergencias.
                   </p>
                   {canWrite && (
                     <button
                       type="button"
                       onClick={onEdit}
                       className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-[#356C92] hover:bg-[#356C92]/90 transition-colors shadow-lg"
                     >
                       Crear Ficha Médica
                     </button>
                   )}
                </div>
              ) : detail.scope === "beneficiaries" ? (
                <>
                  <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#F9F7F3]">Ficha médica</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Tipo de sangre</p>
                        <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleText(detail.bloodType)}</p>
                      </div>
                      <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Alergias</p>
                        <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleText(detail.allergies)}</p>
                      </div>
                      <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-3 md:col-span-2">
                        <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Condiciones preexistentes</p>
                        <p className="text-sm font-semibold text-[#F9F7F3] mt-1 leading-relaxed">{formatPeopleText(detail.preexistingConditions)}</p>
                      </div>
                      <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-3 md:col-span-2">
                        <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Medicación actual</p>
                        <p className="text-sm font-semibold text-[#F9F7F3] mt-1 leading-relaxed">{formatPeopleText(detail.currentMedication)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#F9F7F3]">Perfil asociado</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Perfil</p>
                        <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{detail.profileLabel}</p>
                      </div>
                      {detail.childProfile && (
                        <>
                          <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                            <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Tutor</p>
                            <p className="text-sm font-semibold text-[#F9F7F3] mt-1 truncate" title={formatPeopleText(detail.childProfile.tutorName)}>{formatPeopleText(detail.childProfile.tutorName)}</p>
                          </div>
                          <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                            <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Teléfono tutor</p>
                            <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleText(detail.childProfile.tutorPhone)}</p>
                          </div>
                          <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                            <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Colegio</p>
                            <p className="text-sm font-semibold text-[#F9F7F3] mt-1 truncate" title={formatPeopleText(detail.childProfile.school)}>{formatPeopleText(detail.childProfile.school)}</p>
                          </div>
                        </>
                      )}
                      {detail.seniorProfile && (
                        <>
                          <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                            <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Movilidad reducida</p>
                            <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{detail.seniorProfile.limitedMobility ? "Sí" : "No"}</p>
                          </div>
                          <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                            <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Vive solo</p>
                            <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{detail.seniorProfile.livesAlone ? "Sí" : "No"}</p>
                          </div>
                          <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5 md:col-span-2">
                            <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Contacto emergencia</p>
                            <p className="text-sm font-semibold text-[#F9F7F3] mt-1 truncate" title={formatPeopleText(detail.seniorProfile.emergencyContact)}>{formatPeopleText(detail.seniorProfile.emergencyContact)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#100F0D] border border-[#26231F] rounded-2xl p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[#F9F7F3]">Ficha sensible de voluntario</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Estado voluntario</p>
                      <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleText(detail.stateLabel)}</p>
                    </div>
                    <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Contacto emergencia</p>
                      <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleText(detail.emergencyContact)}</p>
                    </div>
                    <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Teléfono emergencia</p>
                      <p className="text-sm font-semibold text-[#F9F7F3] mt-1">{formatPeopleText(detail.emergencyPhone)}</p>
                    </div>
                    <div className="bg-[#171512] border border-[#26231F] rounded-xl px-4 py-3 md:col-span-2">
                      <p className="text-[10px] font-bold text-[#A4A29F] uppercase tracking-wider">Condiciones médicas</p>
                      <p className="text-sm font-semibold text-[#F9F7F3] mt-1 leading-relaxed">{formatPeopleText(detail.medicalConditions)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
