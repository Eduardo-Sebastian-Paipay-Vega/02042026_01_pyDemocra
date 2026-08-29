import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { EmptyState } from "../components/shared/EmptyState";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import {
  buildEmptyAdmissionDocumentForm,
  mapAdmissionDocumentToForm,
  validateAdmissionDocumentForm,
  type AdmissionDocumentFormErrors,
  type AdmissionDocumentFormValues,
} from "../modules/admission/forms";
import { useAdmissionReferenceCatalogs } from "../modules/admission/hooks/useAdmissionReferenceCatalogs";
import { useDocumentosAdmision } from "../modules/admission/hooks/useDocumentosAdmision";
import { useSolicitudesAdmision } from "../modules/admission/hooks/useSolicitudesAdmision";
import type { AdmissionDocumentRow, AdmissionRequestRow } from "../modules/admission/types";
import {
  adaptAdmissionDocumentFormToCreateInput,
  adaptAdmissionDocumentFormToUpdateInput,
} from "../services/admision/form-adapters";

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

const columns: Column<AdmissionDocumentRow>[] = [
  {
    key: "type",
    label: "Tipo",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.type}</span>,
  },
  {
    key: "estadoValidacion",
    label: "Estado",
    render: (item) => (
      <div className="space-y-1">
        <StatusDot variant={item.estadoValidacion === "APROBADO" ? "success" : item.estadoValidacion === "RECHAZADO" ? "destructive" : "warning"}>
          {item.estadoValidacion === "APROBADO" ? "Aprobado" : item.estadoValidacion === "RECHAZADO" ? "Rechazado" : "Pendiente"}
        </StatusDot>
        <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.verifiedByLabel ?? "Sin verificador"}
        </p>
      </div>
    ),
  },
  {
    key: "updatedAt",
    label: "Actualizado",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.updatedAt}
      </span>
    ),
  },
];

export function AdmissionDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<AdmissionDocumentRow | null>(null);
  const [detailDocument, setDetailDocument] = useState<AdmissionDocumentRow | null>(null);
  const [removeDocument, setRemoveDocument] = useState<AdmissionDocumentRow | null>(null);
  const [formState, setFormState] = useState<AdmissionDocumentFormValues>(
    buildEmptyAdmissionDocumentForm()
  );
  const [formErrors, setFormErrors] = useState<AdmissionDocumentFormErrors>({});
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const requests = useSolicitudesAdmision({
    searchTerm,
    status: "all",
    dateFrom: null,
    dateTo: null,
    page: 1,
    pageSize: 100,
  });
  const catalogs = useAdmissionReferenceCatalogs();
  const documents = useDocumentosAdmision(selectedRequestId);

  const selectedRequest = useMemo<AdmissionRequestRow | null>(
    () => requests.rows.find((row) => row.id === selectedRequestId) ?? null,
    [requests.rows, selectedRequestId]
  );
  const hasBlockingError = Boolean(requests.error || catalogs.error || documents.error);

  const tableEmptyMessage = useMemo(() => {
    return "El postulante seleccionado no tiene documentos registrados.";
  }, []);

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
    setIsFormOpen(false);
    setEditingDocument(null);
    setDetailDocument(null);
    setRemoveDocument(null);
    setFormState(buildEmptyAdmissionDocumentForm());
    setFormErrors({});
  }, [selectedRequestId]);

  function resetForm() {
    setFormState(buildEmptyAdmissionDocumentForm());
    setFormErrors({});
    setEditingDocument(null);
  }

  function openCreateModal() {
    if (!selectedRequestId) {
      toast.error("Selecciona primero una solicitud.");
      return;
    }
    resetForm();
    setIsFormOpen(true);
  }

  function openEditModal(document: AdmissionDocumentRow) {
    setEditingDocument(document);
    setFormState(mapAdmissionDocumentToForm(document, catalogs.catalogs.documentTypes));
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    resetForm();
  }

  function validateForm(values = formState) {
    const nextErrors = validateAdmissionDocumentForm(values);
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitForm(overrideState?: "PENDIENTE" | "APROBADO" | "RECHAZADO") {
    const valuesToSubmit = { ...formState };
    if (overrideState) {
      valuesToSubmit.estadoValidacion = overrideState;
      setFormState(valuesToSubmit);
    }
    
    if (!selectedRequestId || !validateForm(valuesToSubmit)) {
      return;
    }

    let result: AdmissionDocumentRow | null = null;
    try {
      setIsUploadingFile(true);
      if (editingDocument) {
        result = await documents.update(
          await adaptAdmissionDocumentFormToUpdateInput({
            documentId: editingDocument.id,
            requestId: editingDocument.requestId,
            values: valuesToSubmit,
          })
        );
      } else {
        result = await documents.create(
          await adaptAdmissionDocumentFormToCreateInput({
            requestId: selectedRequestId,
            values: valuesToSubmit,
          })
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo preparar el documento.";
      setFormErrors((current) => ({ ...current, general: message }));
      toast.error(message);
      return;
    } finally {
      setIsUploadingFile(false);
    }

    if (!result) {
      return;
    }

    if (editingDocument) {
      setDetailDocument((current) => (current?.id === result.id ? result : current));
      toast.success("Documento actualizado.");
    } else {
      toast.success("Documento registrado.");
    }

    closeFormModal();
  }

  async function confirmRemove() {
    if (!removeDocument) {
      return;
    }

    try {
      const result = await documents.remove(removeDocument.id);
      if (!result) {
        return;
      }

      setDetailDocument((current) => (current?.id === result.id ? null : current));
      toast.success(result.message);
      setRemoveDocument(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el documento."
      );
    }
  }

  const showGlobalEmptyState = !requests.loading && requests.rows.length === 0 && !searchTerm.trim();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Documentos de admisión"
        description="Gestión de verificación documental de postulantes."
      />

      {(requests.error || catalogs.error || documents.error) && (
        <ErrorBlock
          message={requests.error || catalogs.error || documents.error || "No se pudo cargar la información."}
          onRetry={() => {
            requests.refresh();
            catalogs.refresh();
            documents.refresh();
          }}
        />
      )}

      {showGlobalEmptyState ? (
        <EmptyState
          title="Aún no hay solicitudes pendientes"
          description="Actualmente no hay postulantes pendientes de revisión documental."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <FilterBar
              searchPlaceholder="Buscar por postulante o correo..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[]}
            />
            
            <div className="flex h-[600px] flex-col overflow-y-auto rounded-2xl" style={{ border: "1px solid var(--t-border)", background: "var(--t-surface)" }}>
              {requests.loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>Cargando postulantes...</p>
                </div>
              ) : requests.rows.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4">
                  <EmptyState 
                    title="Sin coincidencias" 
                    description="No se encontraron postulantes con los criterios de búsqueda." 
                  />
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[var(--t-border)]">
                  {requests.rows.map(row => (
                    <button
                      key={row.id}
                      onClick={() => setSelectedRequestId(row.id)}
                      className={`flex flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-[var(--t-hover)] ${selectedRequestId === row.id ? 'bg-[var(--t-hover)]' : ''}`}
                    >
                      <p className="text-[13px] font-medium" style={{ color: "var(--t-text)" }}>{row.fullName}</p>
                      <p className="text-[11px]" style={{ color: "var(--t-text-secondary)" }}>{row.email}</p>
                      <div className="mt-1">
                        <StatusDot variant={row.stateCode === "APROBADA" ? "success" : row.stateCode === "RECHAZADA" ? "destructive" : "warning"}>
                          {row.stateName}
                        </StatusDot>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {hasBlockingError ? null : !selectedRequest ? (
              <div className="flex h-[600px] items-center justify-center rounded-2xl" style={{ border: "1px solid var(--t-border)", background: "var(--t-surface)" }}>
                <EmptyState
                  title="Selecciona un postulante"
                  description="Haz clic en un postulante de la lista para gestionar sus documentos."
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                  <div>
                    <h3 className="text-[16px] font-medium" style={{ color: "var(--t-text)" }}>{selectedRequest.fullName}</h3>
                    <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{selectedRequest.email} • {selectedRequest.stateName}</p>
                  </div>
                  <GradientButton size="sm" onClick={openCreateModal}>
                    Solicitar documento
                  </GradientButton>
                </div>
                
                <DataTable
                  columns={columns}
                  data={documents.rows}
                  loading={requests.loading || catalogs.loading || documents.loading}
                  emptyMessage={tableEmptyMessage}
                  actions={[
                    { label: "Ver detalle", onClick: (row) => setDetailDocument(row) },
                    { label: "Editar", onClick: (row) => openEditModal(row) },
                    {
                      label: "Eliminar",
                      onClick: (row) => setRemoveDocument(row),
                      variant: "destructive",
                    },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      )}

      <ModalShell open={isFormOpen} onClose={closeFormModal} width="max-w-[760px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {editingDocument ? "Editar documento" : "Solicitar documento"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Postulante: {selectedRequest?.fullName ?? "-"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-[12px]"
            onClick={closeFormModal}
          >
            X
          </button>
        </div>

        <div className="space-y-3 p-4">
          {formErrors.general && (
            <ErrorBlock
              message={formErrors.general}
              onRetry={() => setFormErrors((current) => ({ ...current, general: undefined }))}
            />
          )}

          <div className="space-y-1">
            <SelectField
              value={formState.type}
              onChange={(value) => {
                setFormState((current) => ({ ...current, type: value }));
                setFormErrors((current) => ({
                  ...current,
                  type: undefined,
                  general: undefined,
                }));
              }}
              options={
                catalogs.catalogs.documentTypes.length > 0
                  ? catalogs.catalogs.documentTypes
                  : [{ value: "", label: "Sin catálogo disponible" }]
              }
              disabled={documents.isCreating || documents.isUpdating}
            />
            <FieldError message={formErrors.type} />
          </div>

          <div className="space-y-1">
            <input
              type="file"
              className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
              onChange={(event) =>
                {
                  setFormState((current) => ({
                    ...current,
                    file: event.target.files?.[0] ?? null,
                  }));
                  setFormErrors((current) => ({
                    ...current,
                    file: undefined,
                    general: undefined,
                  }));
                }
              }
            />
            {formState.file && (
              <p className="text-[11px]" style={{ color: "var(--t-text-secondary)" }}>
                Archivo seleccionado: {formState.file.name}
              </p>
            )}
            {!formState.file && formState.existingFileUrl && (
              <p className="break-all text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Archivo actual: {formState.existingFileUrl}
              </p>
            )}
            <FieldError message={formErrors.file} />
          </div>

          {formState.estadoValidacion === "RECHAZADO" && (
            <div className="space-y-1">
              <textarea
                placeholder="Motivo de rechazo..."
                value={formState.comentariosRechazo ?? ""}
                onChange={(event) => {
                  setFormState((current) => ({ ...current, comentariosRechazo: event.target.value }));
                  setFormErrors((current) => ({ ...current, comentariosRechazo: undefined, general: undefined }));
                }}
                className="h-20 w-full rounded-xl px-3 py-2 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.comentariosRechazo} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitForm("APROBADO")}
              disabled={documents.isCreating || documents.isUpdating || isUploadingFile}
            >
              Aprobar
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => void submitForm("RECHAZADO")}
              disabled={documents.isCreating || documents.isUpdating || isUploadingFile}
            >
              Rechazar
            </OutlineButton>
            <OutlineButton
              size="sm"
              onClick={() => void submitForm("PENDIENTE")}
              disabled={documents.isCreating || documents.isUpdating || isUploadingFile}
            >
              Solo Guardar
            </OutlineButton>
            <OutlineButton
              size="sm"
              onClick={closeFormModal}
              disabled={documents.isCreating || documents.isUpdating || isUploadingFile}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(detailDocument)}
        onClose={() => setDetailDocument(null)}
        width="max-w-[720px]"
      >
        <div className="space-y-3 p-4">
          {detailDocument && (
            <>
              <div className="flex items-center gap-2">
                <StatusDot variant={detailDocument.estadoValidacion === "APROBADO" ? "success" : detailDocument.estadoValidacion === "RECHAZADO" ? "destructive" : "warning"}>
                  {detailDocument.estadoValidacion === "APROBADO" ? "Aprobado" : detailDocument.estadoValidacion === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                </StatusDot>
              </div>
              {detailDocument.estadoValidacion === "RECHAZADO" && detailDocument.comentariosRechazo && (
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-danger-bg, #fee2e2)", border: "1px solid var(--t-danger, #ef4444)" }}>
                  <p className="text-[11px] font-medium" style={{ color: "var(--t-danger, #ef4444)" }}>
                    Motivo de rechazo:
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-danger, #ef4444)" }}>
                    {detailDocument.comentariosRechazo}
                  </p>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <DetailField label="Solicitud" value={detailDocument.requestName} />
                <DetailField label="Tipo" value={detailDocument.type} />
                <DetailField label="Archivo" value={detailDocument.fileUrl} />
                <DetailField label="Verificado por" value={detailDocument.verifiedByLabel ?? "-"} />
                <DetailField
                  label="Fecha de verificación"
                  value={detailDocument.verifiedAtLabel}
                />
                <DetailField label="Actualizado" value={detailDocument.updatedAt} />
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(removeDocument)}
        onClose={() => setRemoveDocument(null)}
        width="max-w-[520px]"
      >
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
            {removeDocument
              ? `¿Eliminar el documento ${removeDocument.type} de ${removeDocument.requestName}?`
              : "Confirma la eliminación."}
          </p>
          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRemove()}
              disabled={documents.isRemoving}
            >
              {documents.isRemoving ? "Eliminando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRemoveDocument(null)}
              disabled={documents.isRemoving}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
