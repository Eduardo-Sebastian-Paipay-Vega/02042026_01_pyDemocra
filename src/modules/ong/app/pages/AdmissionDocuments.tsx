import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
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

const columns: Column<AdmissionDocumentRow>[] = [
  {
    key: "type",
    label: "Tipo",
    render: (item) => <span style={{ color: "var(--t-text)" }}>{item.type}</span>,
  },
  {
    key: "verified",
    label: "Verificacion",
    render: (item) => (
      <div className="space-y-1">
        <StatusDot variant={item.verified ? "success" : "warning"}>
          {item.verified ? "Verificado" : "Pendiente"}
        </StatusDot>
        <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.verifiedByLabel ?? "Sin verificador"}
        </p>
      </div>
    ),
  },
  {
    key: "request",
    label: "Solicitud",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.requestName}
      </span>
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
  const hasBlockingError = Boolean(requests.error || catalogs.error || documents.error);
  const tableEmptyMessage = useMemo(() => {
    if (requests.rows.length === 0) {
      return searchTerm.trim()
        ? "No hay solicitudes que coincidan con la busqueda actual."
        : "Aun no hay solicitudes disponibles para gestionar documentos.";
    }

    if (!selectedRequestId || !selectedRequest) {
      return "Selecciona una solicitud para revisar sus documentos.";
    }

    return "La solicitud seleccionada no tiene documentos registrados.";
  }, [requests.rows.length, searchTerm, selectedRequest, selectedRequestId]);

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

  function validateForm() {
    const nextErrors = validateAdmissionDocumentForm(formState);
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitForm() {
    if (!selectedRequestId || !validateForm()) {
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
            values: formState,
          })
        );
      } else {
        result = await documents.create(
          await adaptAdmissionDocumentFormToCreateInput({
            requestId: selectedRequestId,
            values: formState,
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Documentos de admision"
        description="Gestion real sobre `rrhh.documentos_admision` con `verified_by` y `verified_at`."
        action={{ label: "Nuevo documento", onClick: openCreateModal }}
      />

      <FilterBar
        searchPlaceholder="Buscar solicitud por nombre o correo..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[]}
      />

      {(requests.error || catalogs.error || documents.error) && (
        <ErrorBlock
          message={requests.error || catalogs.error || documents.error || "No se pudo cargar admision."}
          onRetry={() => {
            requests.refresh();
            catalogs.refresh();
            documents.refresh();
          }}
        />
      )}

      <div
        className="space-y-3 rounded-2xl px-4 py-4"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_1fr]">
          <SelectField
            value={selectedRequestId ?? ""}
            onChange={setSelectedRequestId}
            options={
              requestOptions.length > 0
                ? requestOptions
                : [{ value: "", label: "Sin solicitudes disponibles" }]
            }
            disabled={requests.loading || requestOptions.length === 0}
          />

          {selectedRequest ? (
            <div className="grid gap-3 md:grid-cols-3">
              <DetailField label="Solicitante" value={selectedRequest.fullName} />
              <DetailField label="Correo" value={selectedRequest.email} />
              <DetailField label="Estado" value={selectedRequest.stateName} />
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Selecciona una solicitud para gestionar sus documentos.
            </p>
          )}
        </div>
      </div>

      {hasBlockingError ? null : !selectedRequest ? (
        <InfoBlock message={tableEmptyMessage} />
      ) : (
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
      )}

      <ModalShell open={isFormOpen} onClose={closeFormModal} width="max-w-[760px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {editingDocument ? "Editar documento" : "Nuevo documento"}
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Solicitud: {selectedRequest?.fullName ?? "-"}
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
                  : [{ value: "", label: "Sin catalogo disponible" }]
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

          <label
            className="flex items-center gap-2 text-[12px]"
            style={{ color: "var(--t-text-secondary)" }}
          >
            <input
              type="checkbox"
              checked={formState.verified}
              onChange={(event) => {
                setFormState((current) => ({ ...current, verified: event.target.checked }));
                setFormErrors((current) => ({ ...current, general: undefined }));
              }}
            />
            Documento verificado
          </label>

          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            Al marcarlo como verificado, el sistema persiste `verified_by` y `verified_at`.
          </p>

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitForm()}
              disabled={documents.isCreating || documents.isUpdating || isUploadingFile}
            >
              {isUploadingFile
                ? "Preparando archivo..."
                : documents.isCreating || documents.isUpdating
                  ? "Guardando..."
                  : "Guardar"}
            </GradientButton>
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
                <StatusDot variant={detailDocument.verified ? "success" : "warning"}>
                  {detailDocument.verified ? "Verificado" : "Pendiente"}
                </StatusDot>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <DetailField label="Solicitud" value={detailDocument.requestName} />
                <DetailField label="Tipo" value={detailDocument.type} />
                <DetailField label="Archivo" value={detailDocument.fileUrl} />
                <DetailField label="Verificado por" value={detailDocument.verifiedByLabel ?? "-"} />
                <DetailField
                  label="Fecha de verificacion"
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
              ? `Eliminar el documento ${removeDocument.type} de ${removeDocument.requestName}?`
              : "Confirma la eliminacion."}
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
