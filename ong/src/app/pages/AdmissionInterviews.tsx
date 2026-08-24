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
import { useEntrevistasAdmision } from "../modules/admission/hooks/useEntrevistasAdmision";
import { useSolicitudesAdmision } from "../modules/admission/hooks/useSolicitudesAdmision";
import type { AdmissionInterviewRow, AdmissionRequestRow } from "../modules/admission/types";

interface InterviewFormState {
  scheduledAt: string;
  interviewerId: string;
  result: string;
  comment: string;
  score: string;
}

interface InterviewFormErrors {
  scheduledAt?: string;
  result?: string;
  score?: string;
  general?: string;
}

const EMPTY_FORM: InterviewFormState = {
  scheduledAt: "",
  interviewerId: "",
  result: "pendiente",
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
        {item.result}
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
    render: (item) => (
      <span className="line-clamp-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.comment || "-"}
      </span>
    ),
  },
];

export function AdmissionInterviews() {
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    if (!selectedRequestId && requests.rows.length > 0) {
      setSelectedRequestId(requests.rows[0].id);
      return;
    }

    if (selectedRequestId && !requests.rows.some((row) => row.id === selectedRequestId)) {
      setSelectedRequestId(requests.rows[0]?.id ?? null);
    }
  }, [requests.rows, selectedRequestId]);

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

  function openEditModal(interview: AdmissionInterviewRow) {
    setEditingInterview(interview);
    setFormState({
      scheduledAt: toDateTimeInputValue(interview.scheduledAtRaw),
      interviewerId: interview.interviewerId,
      result: interview.result || "pendiente",
      comment: interview.comment,
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

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitForm() {
    if (!selectedRequestId || !validateForm()) {
      return;
    }

    const parsedScore = formState.score.trim() ? Number(formState.score) : null;

    try {
      if (editingInterview) {
        const result = await interviews.update({
          interviewId: editingInterview.id,
          scheduledAt: formState.scheduledAt,
          interviewerId: formState.interviewerId || undefined,
          result: formState.result,
          comment: formState.comment,
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
          comment: formState.comment,
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Entrevistas de admision"
        description="Programación y seguimiento de entrevistas del proceso de admisión."
        action={{ label: "Nueva entrevista", onClick: openCreateModal }}
      />

      <FilterBar
        searchPlaceholder="Buscar solicitud por nombre o correo..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[]}
      />

      {(requests.error || interviews.error) && (
        <ErrorBlock
          message={requests.error || interviews.error || "No se pudo cargar admision."}
          onRetry={() => {
            requests.refresh();
            interviews.refresh();
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
              Selecciona una solicitud para gestionar sus entrevistas.
            </p>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={interviews.rows}
        loading={requests.loading || interviews.loading}
        emptyMessage="La solicitud seleccionada no tiene entrevistas registradas."
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

          <input
            value={formState.interviewerId}
            onChange={(event) =>
              setFormState((current) => ({ ...current, interviewerId: event.target.value }))
            }
            placeholder="ID de entrevistador (opcional)"
            className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
            style={{
              border: "1px solid var(--t-border)",
              background: "var(--t-input-bg)",
              color: "var(--t-text-secondary)",
            }}
          />

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
            rows={4}
            placeholder="Comentarios"
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
              <DetailField label="Solicitud" value={detailInterview.requestName} />
              <DetailField label="Fecha" value={detailInterview.scheduledAt} />
              <DetailField label="Entrevistador" value={detailInterview.interviewerLabel} />
              <DetailField label="Resultado" value={detailInterview.result} />
              <DetailField label="Puntaje" value={formatScore(detailInterview.score)} />
              <DetailField label="Comentario" value={detailInterview.comment || "-"} />
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
              ? `Eliminar la entrevista de ${removeInterview.requestName} programada para ${removeInterview.scheduledAt}?`
              : "Confirma la eliminacion."}
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
