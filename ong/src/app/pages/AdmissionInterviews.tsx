import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { Users, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

import { useEntrevistasAdmision } from "../modules/admission/hooks/useEntrevistasAdmision";
import { useSolicitudesAdmision } from "../modules/admission/hooks/useSolicitudesAdmision";
import type { AdmissionInterviewRow, AdmissionRequestRow } from "../modules/admission/types";
import { useSystemUsers } from "../modules/settings/hooks/useSystemUsers";

interface InterviewFormState {
  scheduledAt: string;
  interviewerId: string;
  result: string;
  modality: string;
  linkLocation: string;
  comment: string;
  score: string;
}

interface InterviewFormErrors {
  scheduledAt?: string;
  result?: string;
  score?: string;
  modality?: string;
  linkLocation?: string;
  general?: string;
}

const EMPTY_FORM: InterviewFormState = {
  scheduledAt: "",
  interviewerId: "",
  result: "pendiente",
  modality: "Virtual",
  linkLocation: "",
  comment: "",
  score: "",
};

function toDateTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatScore(score: number | null) {
  if (score === null || Number.isNaN(score)) {
    return "-";
  }

  return score % 1 === 0 ? String(score) : score.toFixed(2);
}

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
      className="h-9 w-full rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
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

const columns: Column<AdmissionInterviewRow>[] = [
  {
    key: "scheduledAt",
    label: "Fecha",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text)" }}>
        {item.scheduledAt}
      </span>
    ),
  },
  {
    key: "interviewer",
    label: "Entrevistador",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {item.interviewerLabel}
      </span>
    ),
  },
  {
    key: "result",
    label: "Resultado",
    render: (item) => (
      <StatusDot
        variant={
          item.result === "apto"
            ? "success"
            : item.result === "no_apto"
              ? "destructive"
              : "warning"
        }
      >
        {item.result === "apto" ? "Apto" : item.result === "no_apto" ? "No apto" : "Pendiente"}
      </StatusDot>
    ),
  },
  {
    key: "score",
    label: "Puntaje",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {formatScore(item.score)}
      </span>
    ),
  },
  {
    key: "comment",
    label: "Comentario",
    render: (item) => {
      // Parse structured comment for preview
      const parts = item.comment?.split("|") || [];
      const cleanComment = parts.find(p => p.trim().startsWith("COMENTARIOS:"))?.replace("COMENTARIOS:", "").trim() || item.comment;
      
      return (
        <span className="line-clamp-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
          {cleanComment || "-"}
        </span>
      )
    },
  },
];

export function AdmissionInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "por_agendar" | "agendadas" | "completadas">("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<AdmissionInterviewRow | null>(null);
  const [detailInterview, setDetailInterview] = useState<AdmissionInterviewRow | null>(null);
  const [removeInterview, setRemoveInterview] = useState<AdmissionInterviewRow | null>(null);
  const [formState, setFormState] = useState<InterviewFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<InterviewFormErrors>({});

  const requests = useSolicitudesAdmision({
    searchTerm,
    status: "all",
    dateFrom: null,
    dateTo: null,
    page: 1,
    pageSize: 100,
  });
  
  const interviews = useEntrevistasAdmision(selectedRequestId);
  const systemUsers = useSystemUsers();

  const selectedRequest = useMemo<AdmissionRequestRow | null>(
    () => requests.rows.find((row) => row.id === selectedRequestId) ?? null,
    [requests.rows, selectedRequestId]
  );

  // Derive filtered requests based on frontend filter "statusFilter"
  // Since we don't fetch all interviews globally, we approximate:
  // "por_agendar" = stateCode is "nueva"
  // "agendadas" = stateCode is "en_entrevista"
  // "completadas" = stateCode is "aprobada" or "rechazada"
  const filteredRequests = useMemo(() => {
    let filtered = requests.rows;
    if (statusFilter === "por_agendar") {
      filtered = filtered.filter(r => r.stateCode === "nueva");
    } else if (statusFilter === "agendadas") {
      filtered = filtered.filter(r => r.stateCode === "en_entrevista");
    } else if (statusFilter === "completadas") {
      filtered = filtered.filter(r => r.stateCode === "aprobada" || r.stateCode === "rechazada");
    }
    return filtered;
  }, [requests.rows, statusFilter]);

  useEffect(() => {
    if (!selectedRequestId && filteredRequests.length > 0) {
      setSelectedRequestId(filteredRequests[0].id);
      return;
    }

    if (selectedRequestId && !filteredRequests.some((row) => row.id === selectedRequestId)) {
      setSelectedRequestId(filteredRequests[0]?.id ?? null);
    }
  }, [filteredRequests, selectedRequestId]);

  function resetForm() {
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setEditingInterview(null);
  }

  function openCreateModal() {
    if (!selectedRequestId) {
      toast.error("Selecciona primero una solicitud.");
      return;
    }
    resetForm();
    setIsFormOpen(true);
  }

  function parseStructuredComment(rawComment: string | null) {
    const defaultData = { modality: "Virtual", linkLocation: "", comment: "" };
    if (!rawComment) return defaultData;
    
    try {
      const parts = rawComment.split("|");
      let modality = "Virtual";
      let linkLocation = "";
      let comment = rawComment;

      for (const part of parts) {
        const t = part.trim();
        if (t.startsWith("MODALIDAD:")) modality = t.replace("MODALIDAD:", "").trim();
        else if (t.startsWith("ENLACE_LUGAR:")) linkLocation = t.replace("ENLACE_LUGAR:", "").trim();
        else if (t.startsWith("COMENTARIOS:")) comment = t.replace("COMENTARIOS:", "").trim();
      }
      return { modality, linkLocation, comment };
    } catch {
      return { ...defaultData, comment: rawComment };
    }
  }

  function buildStructuredComment(modality: string, linkLocation: string, comment: string) {
    return `MODALIDAD: ${modality} | ENLACE_LUGAR: ${linkLocation} | COMENTARIOS: ${comment}`;
  }

  function openEditModal(interview: AdmissionInterviewRow) {
    setEditingInterview(interview);
    const parsed = parseStructuredComment(interview.comment);
    
    setFormState({
      scheduledAt: toDateTimeInputValue(interview.scheduledAtRaw),
      interviewerId: interview.interviewerId,
      result: interview.result || "pendiente",
      modality: parsed.modality || "Virtual",
      linkLocation: parsed.linkLocation || "",
      comment: parsed.comment || "",
      score: interview.score === null ? "" : String(interview.score),
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    resetForm();
  }

  function validateForm() {
    const nextErrors: InterviewFormErrors = {};

    if (!formState.scheduledAt.trim()) {
      nextErrors.scheduledAt = "La fecha y hora son obligatorias.";
    }
    if (!formState.result.trim()) {
      nextErrors.result = "El resultado es obligatorio.";
    }
    if (formState.score.trim()) {
      const score = Number(formState.score);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        nextErrors.score = "El puntaje debe estar entre 0 y 100.";
      }
    }
    if (!formState.modality.trim()) {
      nextErrors.modality = "Selecciona una modalidad.";
    }
    if (!formState.linkLocation.trim()) {
      nextErrors.linkLocation = "El enlace o lugar es obligatorio.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitForm() {
    if (!selectedRequestId || !validateForm()) {
      return;
    }

    const parsedScore = formState.score.trim() ? Number(formState.score) : null;
    const structuredComment = buildStructuredComment(formState.modality, formState.linkLocation, formState.comment);

    try {
      if (editingInterview) {
        const result = await interviews.update({
          interviewId: editingInterview.id,
          scheduledAt: formState.scheduledAt,
          interviewerId: formState.interviewerId || undefined,
          result: formState.result,
          comment: structuredComment,
          score: parsedScore,
        });
        if (!result) {
          return;
        }
        toast.success("Entrevista actualizada.");
      } else {
        const result = await interviews.create({
          requestId: selectedRequestId,
          scheduledAt: formState.scheduledAt,
          interviewerId: formState.interviewerId || undefined,
          result: formState.result,
          comment: structuredComment,
          score: parsedScore,
        });
        if (!result) {
          return;
        }
        toast.success("Entrevista registrada.");
      }

      closeFormModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la entrevista.";
      setFormErrors((current) => ({ ...current, general: message }));
      toast.error(message);
    }
  }

  async function confirmRemove() {
    if (!removeInterview) {
      return;
    }

    try {
      const result = await interviews.remove(removeInterview.id);
      if (!result) {
        return;
      }

      toast.success(result.message);
      setRemoveInterview(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar la entrevista."
      );
    }
  }

  const showGlobalEmptyState = !requests.loading && requests.rows.length === 0 && !searchTerm.trim();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Entrevistas de admisión"
        description="Programación y seguimiento de entrevistas del proceso de admisión."
      />

      {(requests.error || interviews.error || systemUsers.error) && (
        <ErrorBlock
          message={requests.error || interviews.error || systemUsers.error || "No se pudo cargar la información."}
          onRetry={() => {
            requests.refresh();
            interviews.refresh();
            systemUsers.refresh();
          }}
        />
      )}

      {showGlobalEmptyState ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{
            background: "var(--t-surface)",
            border: "1px solid var(--t-border)",
          }}
        >
          <div
            className="p-3 rounded-xl mb-3"
            style={{ background: "var(--t-hover, #1F1D1A)" }}
          >
            <Users size={24} strokeWidth={1.5} style={{ color: "var(--t-text-dim)" }} />
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: "var(--t-text)" }}>
            No hay postulantes en fase de entrevistas
          </h3>
          <p
            className="text-xs text-center max-w-xs"
            style={{ color: "var(--t-text-secondary)" }}
          >
            Actualmente no hay candidatos que requieran ser entrevistados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          {/* LEFT PANE - MASTER LIST */}
          <div className="space-y-4">
            <FilterBar
              searchPlaceholder="Buscar por postulante o correo..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filters={[]}
            />
            
            {/* Filter Pills */}
            <div className="flex gap-2 mb-2 pb-2 overflow-x-auto">
               {[
                 { id: "all", label: "Todos" },
                 { id: "por_agendar", label: "Por agendar" },
                 { id: "agendadas", label: "Agendadas (Próximas)" },
                 { id: "completadas", label: "Completadas" },
               ].map((pill) => (
                 <button
                   key={pill.id}
                   type="button"
                   onClick={() => setStatusFilter(pill.id as any)}
                   className="px-3 py-1 text-[11px] rounded-full whitespace-nowrap transition-colors"
                   style={{
                     background: statusFilter === pill.id ? "var(--t-primary)" : "var(--t-surface)",
                     color: statusFilter === pill.id ? "#ffffff" : "var(--t-text-secondary)",
                     border: `1px solid ${statusFilter === pill.id ? "transparent" : "var(--t-border)"}`,
                   }}
                 >
                   {pill.label}
                 </button>
               ))}
            </div>
            
            <div
              className="flex h-[600px] flex-col overflow-y-auto rounded-xl"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-surface)",
              }}
            >
              {requests.loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>
                    Cargando postulantes...
                  </p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-4">
                  <div
                    className="p-3 rounded-xl mb-3"
                    style={{ background: "var(--t-hover, #1F1D1A)" }}
                  >
                    <FileText size={24} strokeWidth={1.5} style={{ color: "var(--t-text-dim)" }} />
                  </div>
                  <h3 className="text-sm font-medium mb-1" style={{ color: "var(--t-text)" }}>
                    Sin coincidencias
                  </h3>
                  <p
                    className="text-xs text-center max-w-xs"
                    style={{ color: "var(--t-text-secondary)" }}
                  >
                    No se encontraron postulantes con los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y" style={{ borderColor: "var(--t-border)" }}>
                  {filteredRequests.map(row => (
                    <button
                      key={row.id}
                      onClick={() => setSelectedRequestId(row.id)}
                      className="flex flex-col items-start gap-1 p-4 text-left transition-colors"
                      style={{
                         background: selectedRequestId === row.id
                           ? "var(--t-hover)"
                           : "transparent",
                      }}
                      onMouseEnter={(e) => {
                         if (selectedRequestId !== row.id)
                           e.currentTarget.style.background = "var(--t-hover)";
                      }}
                      onMouseLeave={(e) => {
                         if (selectedRequestId !== row.id)
                           e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <p className="text-[13px] font-medium" style={{ color: "var(--t-text)" }}>
                        {row.fullName}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--t-text-secondary)" }}>
                        {row.email}
                      </p>
                      <div className="mt-1">
                        <StatusDot
                          variant={
                            row.stateCode === "aprobada"
                              ? "success"
                              : row.stateCode === "rechazada"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {row.stateName}
                        </StatusDot>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE - DETAIL & INTERVIEWS */}
          <div className="flex flex-col gap-4">
            {!selectedRequest ? (
              <div
                className="flex h-[600px] flex-col items-center justify-center rounded-xl"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-surface)",
                }}
              >
                <div
                  className="p-3 rounded-xl mb-3"
                  style={{ background: "var(--t-hover, #1F1D1A)" }}
                >
                  <Users size={24} strokeWidth={1.5} style={{ color: "var(--t-text-dim)" }} />
                </div>
                <h3 className="text-sm font-medium mb-1" style={{ color: "var(--t-text)" }}>
                  Selecciona un postulante
                </h3>
                <p
                  className="text-xs text-center max-w-xs"
                  style={{ color: "var(--t-text-secondary)" }}
                >
                  Elige una solicitud para ver o agendar entrevistas.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="rounded-xl p-4"
                  style={{
                    border: "1px solid var(--t-border)",
                    background: "var(--t-surface)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-medium" style={{ color: "var(--t-text)" }}>
                      Detalle del postulante
                    </h3>
                    <GradientButton size="sm" onClick={openCreateModal}>
                      Agendar ahora
                    </GradientButton>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <DetailField label="Postulante" value={selectedRequest.fullName} />
                    <DetailField label="Correo" value={selectedRequest.email} />
                    <DetailField label="Estado Actual" value={selectedRequest.stateName} />
                  </div>
                </div>

                <div
                  className="flex-1 rounded-xl p-4 flex flex-col"
                  style={{
                    border: "1px solid var(--t-border)",
                    background: "var(--t-surface)",
                  }}
                >
                  <h3 className="text-[14px] font-medium mb-4" style={{ color: "var(--t-text)" }}>
                    Historial de entrevistas
                  </h3>
                  {interviews.rows.length === 0 && !interviews.loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-10">
                       <Clock size={24} strokeWidth={1.5} className="mb-3" style={{ color: "var(--t-text-dim)" }} />
                       <h3 className="text-sm font-medium mb-1" style={{ color: "var(--t-text)" }}>
                          Sin entrevistas
                       </h3>
                       <p className="text-xs text-center text-balance max-w-xs mb-4" style={{ color: "var(--t-text-secondary)" }}>
                          Aún no se ha programado una entrevista para este postulante.
                       </p>
                    </div>
                  ) : (
                    <DataTable
                      columns={columns}
                      data={interviews.rows}
                      loading={interviews.loading}
                      emptyMessage="Aún no se ha programado una entrevista"
                      actions={[
                        { label: "Ver detalle", onClick: (row) => setDetailInterview(row) },
                        { label: "Editar", onClick: (row) => openEditModal(row) },
                        {
                          label: "Eliminar",
                          onClick: (row) => setRemoveInterview(row),
                          variant: "destructive",
                        },
                      ]}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      <ModalShell open={isFormOpen} onClose={closeFormModal} width="max-w-[760px]">
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--t-border)" }}
        >
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              {editingInterview ? "Editar entrevista" : "Nueva entrevista"}
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input
                type="datetime-local"
                value={formState.scheduledAt}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, scheduledAt: event.target.value }))
                }
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.scheduledAt} />
            </div>

            <div className="space-y-1">
              <SelectField
                value={formState.interviewerId}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, interviewerId: value }))
                }
                options={[
                  { value: "", label: "Seleccionar entrevistador..." },
                  ...systemUsers.data.rows.map(user => ({ value: user.id, label: user.fullName }))
                ]}
              />
            </div>
            
            <div className="space-y-1">
              <SelectField
                value={formState.modality}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, modality: value }))
                }
                options={[
                  { value: "Virtual", label: "Virtual" },
                  { value: "Presencial", label: "Presencial" }
                ]}
              />
              <FieldError message={formErrors.modality} />
            </div>

            <div className="space-y-1">
              <input
                type="text"
                value={formState.linkLocation}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, linkLocation: event.target.value }))
                }
                placeholder={formState.modality === "Virtual" ? "Enlace (Ej. Google Meet)" : "Lugar (Ej. Oficina principal)"}
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.linkLocation} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <SelectField
                value={formState.result}
                onChange={(value) => setFormState((current) => ({ ...current, result: value }))}
                options={[
                  { value: "pendiente", label: "Pendiente" },
                  { value: "apto", label: "Apto" },
                  { value: "no_apto", label: "No apto" },
                ]}
              />
              <FieldError message={formErrors.result} />
            </div>

            <div className="space-y-1">
              <input
                value={formState.score}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, score: event.target.value }))
                }
                placeholder="Puntaje 0 - 100"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
              <FieldError message={formErrors.score} />
            </div>
          </div>

          <textarea
            value={formState.comment}
            onChange={(event) =>
              setFormState((current) => ({ ...current, comment: event.target.value }))
            }
            rows={3}
            placeholder="Comentarios adicionales"
            className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />

          <div className="flex flex-wrap gap-2">
            <GradientButton
              size="sm"
              onClick={() => void submitForm()}
              disabled={interviews.isCreating || interviews.isUpdating}
            >
              {interviews.isCreating || interviews.isUpdating ? "Guardando..." : "Guardar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={closeFormModal}
              disabled={interviews.isCreating || interviews.isUpdating}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(detailInterview)}
        onClose={() => setDetailInterview(null)}
        width="max-w-[720px]"
      >
        <div className="space-y-3 p-4">
          {detailInterview && (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailField label="Postulante" value={detailInterview.requestName} />
              <DetailField label="Fecha y Hora" value={detailInterview.scheduledAt} />
              <DetailField label="Entrevistador" value={detailInterview.interviewerLabel} />
              <DetailField label="Modalidad" value={parseStructuredComment(detailInterview.comment).modality} />
              <DetailField label="Lugar / Enlace" value={parseStructuredComment(detailInterview.comment).linkLocation} />
              <DetailField label="Resultado" value={detailInterview.result === 'apto' ? 'Apto' : detailInterview.result === 'no_apto' ? 'No apto' : 'Pendiente'} />
              <DetailField label="Puntaje" value={formatScore(detailInterview.score)} />
              <div className="md:col-span-2">
                 <DetailField label="Comentario" value={parseStructuredComment(detailInterview.comment).comment || "-"} />
              </div>
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(removeInterview)}
        onClose={() => setRemoveInterview(null)}
        width="max-w-[520px]"
      >
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
            {removeInterview
              ? `¿Eliminar la entrevista de ${removeInterview.requestName} programada para ${removeInterview.scheduledAt}?`
              : "Confirma la eliminación."}
          </p>
          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRemove()}
              disabled={interviews.isRemoving}
            >
              {interviews.isRemoving ? "Eliminando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRemoveInterview(null)}
              disabled={interviews.isRemoving}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
