import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Clock, FileText, ChevronRight, UserPlus, AlertTriangle } from "lucide-react";

import { toast } from "sonner";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import {
  buildEmptyAdmissionOnboardingForm,
  mapAdmissionOnboardingStepToForm,
  validateAdmissionOnboardingForm,
  type AdmissionOnboardingFormErrors,
  type AdmissionOnboardingFormValues,
} from "../modules/admission/forms";
import { useAdmissionReferenceCatalogs } from "../modules/admission/hooks/useAdmissionReferenceCatalogs";
import { convertSolicitudToVoluntario } from "../services/admision/solicitudesAdmision.service";
import { useOnboardingAdmision } from "../modules/admission/hooks/useOnboardingAdmision";
import { useSolicitudesAdmision } from "../modules/admission/hooks/useSolicitudesAdmision";
import type { AdmissionOnboardingStepRow, AdmissionRequestRow } from "../modules/admission/types";
import { adaptAdmissionOnboardingFormToUpdateInput } from "../services/admision/form-adapters";

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {message}
      </p>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
        style={{ color: "var(--t-text-secondary)" }}
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  );
}

function InfoBlock({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {message}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>
      {message}
    </p>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
        {label}
      </p>
      <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {value || "-"}
      </p>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const columns: Column<AdmissionOnboardingStepRow>[] = [
  {
    key: "stepName",
    label: "Paso",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.stepName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          Orden: {item.order}
        </div>
      </div>
    ),
  },
  {
    key: "mandatory",
    label: "Obligatorio",
    render: (item) => (
      <StatusDot variant={item.mandatory ? "warning" : "secondary"}>
        {item.mandatory ? "Si" : "No"}
      </StatusDot>
    ),
  },
  {
    key: "completed",
    label: "Estado",
    render: (item) => (
      <StatusDot variant={item.completed ? "success" : "warning"}>
        {item.completed ? "Completado" : "Pendiente"}
      </StatusDot>
    ),
  },
  {
    key: "evidenceUrl",
    label: "Evidencia",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.evidenceUrl ? "Registrada" : "Sin evidencia"}
      </span>
    ),
  },
  {
    key: "completedAt",
    label: "Fecha",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.completedAt ?? "-"}
      </span>
    ),
  },
];


function getDaysInProcess(dateString?: string | null) {
  if (!dateString) return 0;
  const start = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 3600 * 24));
}


type ConvertForm = {
  numeroDocumento: string;
  tipoDocumento: string;
  genero: string;
  codigoPais: string;
  telefono: string;
  fechaNacimiento: string;
  observaciones: string;
  codigoEstado: string;
};

export function AdmissionOnboarding() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailStep, setDetailStep] = useState<AdmissionOnboardingStepRow | null>(null);
  const [stepFormTarget, setStepFormTarget] = useState<AdmissionOnboardingStepRow | null>(null);
  const [stepFormState, setStepFormState] = useState<AdmissionOnboardingFormValues>(
    buildEmptyAdmissionOnboardingForm()
  );
  const [stepFormErrors, setStepFormErrors] = useState<AdmissionOnboardingFormErrors>({});
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  const requests = useSolicitudesAdmision({
    searchTerm,
    status: "approved",
    dateFrom: null,
    dateTo: null,
    page: 1,
    pageSize: 100,
  });
  const onboarding = useOnboardingAdmision(selectedRequestId);

  const catalogs = useAdmissionReferenceCatalogs();
  const documentTypes = useMemo(() => catalogs.catalogs.documentTypes.length ? catalogs.catalogs.documentTypes : [{ value: "", label: "Sin catálogo" }], [catalogs.catalogs.documentTypes]);
  const genders = useMemo(() => [{ value: "", label: "Género (opcional)" }, ...catalogs.catalogs.genders], [catalogs.catalogs.genders]);
  const countries = useMemo(() => catalogs.catalogs.countries.length ? catalogs.catalogs.countries : [{ value: "PE", label: "PE" }], [catalogs.catalogs.countries]);
  const volunteerStates = useMemo(() => catalogs.catalogs.volunteerStates.length ? catalogs.catalogs.volunteerStates : [{ value: "activo", label: "activo" }], [catalogs.catalogs.volunteerStates]);

  const [convertTarget, setConvertTarget] = useState<AdmissionRequestRow | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertForm>({
    numeroDocumento: "",
    tipoDocumento: "",
    genero: "",
    codigoPais: "PE",
    telefono: "",
    fechaNacimiento: "",
    observaciones: "",
    codigoEstado: "activo"
  });
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  function openConvertModal(row: AdmissionRequestRow) {
    setConvertTarget(row);
    setConvertForm({
      numeroDocumento: "",
      tipoDocumento: documentTypes[0]?.value ?? "",
      genero: "",
      codigoPais: countries[0]?.value ?? "PE",
      telefono: "",
      fechaNacimiento: "",
      observaciones: row.notes || "",
      codigoEstado: volunteerStates[0]?.value ?? "activo",
    });
    setConvertError(null);
  }

  function closeConvertModal() {
    setConvertTarget(null);
    setConvertError(null);
  }

  async function submitConvert() {
    if (!convertTarget) return;
    if (!convertForm.tipoDocumento || !convertForm.numeroDocumento.trim()) {
      setConvertError("El tipo y número de documento son obligatorios.");
      return;
    }
    
    setIsConverting(true);
    setConvertError(null);
    try {
      await convertSolicitudToVoluntario({
        requestId: convertTarget.id,
        numeroDocumento: convertForm.numeroDocumento.trim(),
        tipoDocumento: convertForm.tipoDocumento || null,
        genero: convertForm.genero || null,
        codigoPais: convertForm.codigoPais || null,
        telefono: convertForm.telefono.trim() || null,
        fechaNacimiento: convertForm.fechaNacimiento || null,
        observaciones: convertForm.observaciones.trim() || null,
        codigoEstado: convertForm.codigoEstado || null,
      });
      toast.success("Candidato convertido a voluntario correctamente.");
      closeConvertModal();
      requests.refresh();
      onboarding.refresh();
    } catch (error) {
      setConvertError(error instanceof Error ? error.message : "Error al convertir.");
    } finally {
      setIsConverting(false);
    }
  }


  const requestOptions = useMemo(
    () =>
      requests.rows.map((row) => ({
        value: row.id,
        label: `${row.fullName} - ${row.stateName}`,
      })),
    [requests.rows]
  );

  const selectedRequest = useMemo<AdmissionRequestRow | null>(
    () => requests.rows.find((row) => row.id === selectedRequestId) ?? null,
    [requests.rows, selectedRequestId]
  );

  const selectedVolunteerId =
    selectedRequest?.linkedVolunteerId ?? selectedRequest?.resolvedVolunteerId ?? null;
  const hasBlockingError = Boolean(requests.error || onboarding.error);
  const tableEmptyMessage = useMemo(() => {
    if (requests.rows.length === 0) {
      return searchTerm.trim()
        ? "No hay solicitudes que coincidan con la busqueda actual."
        : "Aun no hay solicitudes disponibles para onboarding.";
    }

    if (!selectedRequestId || !selectedRequest) {
      return "Selecciona una solicitud para revisar el onboarding.";
    }

    if (!selectedVolunteerId) {
      return "Esta solicitud aún no está vinculada a un voluntario.";
    }

    return "No hay pasos de onboarding configurados para la solicitud seleccionada.";
  }, [requests.rows.length, searchTerm, selectedRequest, selectedRequestId, selectedVolunteerId]);

  useEffect(() => {
    if (!selectedRequestId && requests.rows.length > 0) {
      setSelectedRequestId(requests.rows[0].id);
      return;
    }

    if (selectedRequestId && !requests.rows.some((row) => row.id === selectedRequestId)) {
      setSelectedRequestId(requests.rows[0]?.id ?? null);
    }
  }, [requests.rows, selectedRequestId]);

  useEffect(() => {
    setDetailStep(null);
    setStepFormTarget(null);
    setStepFormState(buildEmptyAdmissionOnboardingForm());
    setStepFormErrors({});
  }, [selectedRequestId, selectedVolunteerId]);

  function openStepForm(step: AdmissionOnboardingStepRow) {
    setStepFormTarget(step);
    setStepFormState(mapAdmissionOnboardingStepToForm(step));
    setStepFormErrors({});
  }

  function closeStepForm() {
    setStepFormTarget(null);
    setStepFormState(buildEmptyAdmissionOnboardingForm());
    setStepFormErrors({});
  }

  async function startOnboarding() {
    if (!selectedVolunteerId) {
      toast.error("La solicitud todavia no esta convertida a voluntario.");
      return;
    }

    try {
      const result = await onboarding.start({
        volunteerId: selectedVolunteerId,
      });
      if (!result) {
        return;
      }
      toast.success("Onboarding iniciado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar el onboarding.");
    }
  }

  async function setStepCompleted(step: AdmissionOnboardingStepRow, completed: boolean) {
    try {
      const result = await onboarding.updateStep({
        volunteerId: step.volunteerId,
        stepId: step.stepId,
        completed,
      });
      if (!result) {
        return;
      }

      setDetailStep((current) => (current?.stepId === result.stepId ? result : current));
      setStepFormTarget((current) => (current?.stepId === result.stepId ? result : current));
      toast.success(
        completed ? "Paso marcado como completado." : "Paso devuelto a pendiente."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el paso.");
    }
  }

  async function submitStepForm() {
    if (!stepFormTarget) {
      return;
    }

    const validationErrors = validateAdmissionOnboardingForm(stepFormState);
    setStepFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    let result: AdmissionOnboardingStepRow | null = null;
    try {
      setIsUploadingEvidence(true);
      result = await onboarding.updateStep(
        await adaptAdmissionOnboardingFormToUpdateInput({
          volunteerId: stepFormTarget.volunteerId,
          stepId: stepFormTarget.stepId,
          values: stepFormState,
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo preparar la evidencia del paso.";
      setStepFormErrors((current) => ({
        ...current,
        general: message,
      }));
      toast.error(message);
      return;
    } finally {
      setIsUploadingEvidence(false);
    }

    if (!result) {
      return;
    }

    setDetailStep((current) => (current?.stepId === result.stepId ? result : current));
    toast.success("Paso actualizado.");
    closeStepForm();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Onboarding de admisión"
        description="Seguimiento de inducción y documentación post-aprobación."
        action={{ 
            label: "Iniciar onboarding", 
            onClick: () => void startOnboarding(),
            disabled: !selectedVolunteerId || requests.loading || onboarding.loading
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MASTER LIST (Left Column) */}
        <div className="lg:col-span-1 space-y-4">
          <FilterBar
            searchPlaceholder="Buscar por nombre..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={[]}
          />
          
          {(requests.error) && (
            <ErrorBlock
              message={requests.error}
              onRetry={() => requests.refresh()}
            />
          )}

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {requests.loading && requests.rows.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[var(--t-text-dim)]">Cargando solicitudes...</div>
            ) : requests.rows.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[var(--t-text-dim)]">No hay solicitudes aprobadas.</div>
            ) : (
                requests.rows.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`cursor-pointer rounded-2xl p-4 transition-colors border ${
                      selectedRequestId === req.id
                        ? "bg-[var(--t-hover)] border-[var(--t-border)] shadow-sm"
                        : "bg-[var(--t-surface)] border-[var(--t-border)] hover:bg-[var(--t-hover)]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-[14px] text-[var(--t-text)]">{req.fullName}</div>
                      <ChevronRight className="w-4 h-4 text-[var(--t-text-dim)]" />
                    </div>
                    <div className="text-[12px] text-[var(--t-text-secondary)] mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {req.email}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <StatusDot variant={req.stateVariant}>{req.stateName}</StatusDot>
                        <span className="text-[10px] flex items-center gap-1 text-[var(--t-text-tertiary)] bg-[var(--t-input-bg)] px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {getDaysInProcess(req.rawSubmittedAt)} días
                        </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* DETAIL VIEW (Right Column) */}
        <div className="lg:col-span-2 space-y-4">
            {selectedRequest ? (
                <div className="rounded-3xl p-6 bg-[var(--t-surface)] border border-[var(--t-border)] h-full flex flex-col">
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold text-[var(--t-text)] mb-1">{selectedRequest.fullName}</h2>
                            <p className="text-[13px] text-[var(--t-text-secondary)]">
                                Vinculado a: {selectedRequest.linkedVolunteerName ?? selectedRequest.resolvedVolunteerName ?? "Ninguno"}
                            </p>
                        </div>
                        <StatusDot variant={selectedRequest.stateVariant}>{selectedRequest.stateName}</StatusDot>
                    </div>

                    {!selectedVolunteerId ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center my-auto">
                            <AlertTriangle className="w-10 h-10 text-yellow-500 mb-3" />
                            <h3 className="text-[14px] font-medium text-yellow-500 mb-2">Requiere Conversión a voluntario</h3>
                            <p className="text-[12px] text-yellow-500/80 mb-4 max-w-md">
                                Esta solicitud ha sido aprobada pero aún no está convertida a voluntario oficial en el sistema. 
                                Debes realizar la conversión para poder gestionar sus pasos de onboarding.
                            </p>
                            <OutlineButton 
                                onClick={() => openConvertModal(selectedRequest)}
                                className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Ir a Convertir a Voluntario
                            </OutlineButton>
                        </div>
                    ) : (
                        <>
                            {(onboarding.error) && (
                                <ErrorBlock
                                message={onboarding.error || "No se pudo cargar onboarding."}
                                onRetry={() => onboarding.refresh()}
                                />
                            )}
                            
                            <div className="flex-1">
                                <DataTable
                                    columns={columns}
                                    data={onboarding.rows}
                                    loading={onboarding.loading}
                                    emptyMessage={tableEmptyMessage}
                                    actions={[
                                        { label: "Ver detalle", onClick: (row) => setDetailStep(row) },
                                        { label: "Actualizar paso", onClick: (row) => openStepForm(row) },
                                        { label: "Marcar completado", onClick: (row) => void setStepCompleted(row, true) },
                                        { label: "Marcar pendiente", onClick: (row) => void setStepCompleted(row, false) },
                                    ]}
                                />
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="rounded-3xl p-6 bg-[var(--t-surface)] border border-[var(--t-border)] h-full flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--t-hover)] mx-auto mb-4 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-[var(--t-text-tertiary)]" />
                        </div>
                        <h3 className="text-[15px] font-medium text-[var(--t-text-secondary)]">Ninguna solicitud seleccionada</h3>
                        <p className="text-[13px] text-[var(--t-text-dim)] mt-1">Selecciona una solicitud de la lista para ver su proceso de onboarding.</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      <ModalShell open={Boolean(detailStep)} onClose={() => setDetailStep(null)} width="max-w-[720px]">
        <div className="space-y-3 p-4">
          {detailStep && (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailField label="Voluntario" value={detailStep.volunteerName} />
              <DetailField label="Paso" value={detailStep.stepName} />
              <DetailField label="Orden" value={String(detailStep.order)} />
              <DetailField label="Obligatorio" value={detailStep.mandatory ? "Si" : "No"} />
              <DetailField label="Estado" value={detailStep.completed ? "Completado" : "Pendiente"} />
              <DetailField label="Fecha de cierre" value={detailStep.completedAt ?? "-"} />
              <DetailField label="Evidencia" value={detailStep.evidenceUrl ?? "-"} />
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(stepFormTarget)} onClose={closeStepForm} width="max-w-[760px]">
        <div className="flex items-start justify-between px-4 py-3 border-b border-[var(--t-border)]">
          <div>
            <h3 className="text-[14px] text-[var(--t-text)]">Actualizar paso</h3>
            <p className="text-[12px] text-[var(--t-text-dim)]">
              {stepFormTarget ? `${stepFormTarget.volunteerName} - ${stepFormTarget.stepName}` : "-"}
            </p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px] hover:bg-[var(--t-hover)] text-[var(--t-text-secondary)] transition-colors" onClick={closeStepForm} disabled={onboarding.isUpdating || isUploadingEvidence}>
            X
          </button>
        </div>

        <div className="space-y-3 p-4">
          {stepFormErrors.general && (
            <ErrorBlock message={stepFormErrors.general} onRetry={() => setStepFormErrors((current) => ({ ...current, general: undefined }))} />
          )}

          <label className="flex items-center gap-2 text-[12px] text-[var(--t-text-secondary)]">
            <input
              type="checkbox"
              checked={stepFormState.completed}
              onChange={(event) => {
                setStepFormState((current) => ({ ...current, completed: event.target.checked }));
                setStepFormErrors((current) => ({ ...current, general: undefined }));
              }}
            />
            Paso completado
          </label>

          <div className="space-y-1">
            <input
              type="file"
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none border border-[var(--t-border)] bg-[var(--t-input-bg)] text-[var(--t-text-secondary)]"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setStepFormState((current) => ({ ...current, evidenceFile: file, removeEvidence: file ? false : current.removeEvidence }));
                setStepFormErrors((current) => ({ ...current, evidenceFile: undefined, general: undefined }));
              }}
            />
            {stepFormState.evidenceFile && (
              <p className="text-[11px] text-[var(--t-text-secondary)]">Archivo seleccionado: {stepFormState.evidenceFile.name}</p>
            )}
            {!stepFormState.evidenceFile && !stepFormState.removeEvidence && stepFormState.existingEvidenceUrl && (
                <p className="break-all text-[11px] text-[var(--t-text-dim)]">Evidencia actual: {stepFormState.existingEvidenceUrl}</p>
            )}
            {stepFormState.removeEvidence && (
              <p className="text-[11px] text-[var(--t-text-dim)]">La evidencia actual se eliminará al guardar este paso.</p>
            )}
            <FieldError message={stepFormErrors.evidenceFile} />
          </div>

          <div className="flex flex-wrap gap-2">
            <OutlineButton
              size="sm"
              type="button"
              onClick={() => {
                  setStepFormState((current) => ({ ...current, evidenceFile: null, removeEvidence: true }));
                  setStepFormErrors((current) => ({ ...current, evidenceFile: undefined, general: undefined }));
              }}
              disabled={onboarding.isUpdating || isUploadingEvidence}
            >
              Quitar evidencia
            </OutlineButton>
            {(stepFormState.evidenceFile || stepFormState.removeEvidence) && (
              <OutlineButton
                size="sm"
                type="button"
                onClick={() => {
                    setStepFormState((current) => ({ ...current, evidenceFile: null, removeEvidence: false }));
                    setStepFormErrors((current) => ({ ...current, evidenceFile: undefined, general: undefined }));
                }}
                disabled={onboarding.isUpdating || isUploadingEvidence}
              >
                Restaurar actual
              </OutlineButton>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--t-border)]">
            <GradientButton size="sm" onClick={() => void submitStepForm()} disabled={onboarding.isUpdating || isUploadingEvidence}>
              {isUploadingEvidence ? "Preparando evidencia..." : onboarding.isUpdating ? "Guardando..." : "Guardar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={closeStepForm} disabled={onboarding.isUpdating || isUploadingEvidence}>
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
