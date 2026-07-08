import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "../components/ui/gradient-button";
import { ModalShell } from "../components/ui/modal-shell";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
import { useAdmissionReferenceCatalogs } from "../modules/admission/hooks/useAdmissionReferenceCatalogs";
import { useSolicitudAdmisionDetail } from "../modules/admission/hooks/useSolicitudAdmisionDetail";
import { useSolicitudesAdmision } from "../modules/admission/hooks/useSolicitudesAdmision";
import type {
  AdmissionConvertInput,
  AdmissionCreateInput,
  AdmissionGenerateRegistrationCodeInput,
  AdmissionRegistrationCodeRow,
  AdmissionRequestRow,
  AdmissionStateCode,
  AdmissionStateKind,
  AdmissionUpdateInput,
} from "../modules/admission/types";

const PAGE_SIZE = 20;

type RequestForm = {
  nombres: string;
  apellidos: string;
  email: string;
  notes: string;
  stateCode: AdmissionStateCode;
};

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

type RegistrationCodeForm = {
  email: string;
  numeroDocumento: string;
  expiresInMinutes: string;
};

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
      <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{message}</p>
      <button type="button" className="rounded-md px-2 py-1 text-[11px] hover:bg-[var(--t-hover)]" style={{ color: "var(--t-text-secondary)" }} onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>{message}</p>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
      <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{value || "-"}</p>
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
      style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
      <p className="mt-1 text-[20px]" style={{ color: "var(--t-text)" }}>{value}</p>
    </div>
  );
}

function buildRegistrationLink(code: AdmissionRegistrationCodeRow | null): string {
  if (!code || typeof window === "undefined") {
    return "";
  }

  const url = new URL("/landing/register", window.location.origin);
  url.searchParams.set("tenant", code.tenantId);
  url.searchParams.set("code", code.code);
  return url.toString();
}

const columns: Column<AdmissionRequestRow>[] = [
  {
    key: "fullName",
    label: "Solicitante",
    render: (item) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{item.fullName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.email}</div>
      </div>
    ),
  },
  { key: "stateName", label: "Estado", render: (item) => <StatusDot variant={item.stateVariant}>{item.stateName}</StatusDot> },
  { key: "submittedAt", label: "Solicitud", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{item.submittedAt}</span> },
  { key: "notes", label: "Notas", render: (item) => <span className="line-clamp-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.notes || "-"}</span> },
  {
    key: "resolvedVolunteerName",
    label: "Voluntario",
    render: (item) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {item.linkedVolunteerName ?? item.resolvedVolunteerName ?? "Pendiente"}
      </span>
    ),
  },
];

export function AdmissionRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"all" | AdmissionStateKind>("all");
  const [page, setPage] = useState(1);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<AdmissionRequestRow | null>(null);
  const [stateTarget, setStateTarget] = useState<AdmissionRequestRow | null>(null);
  const [convertTarget, setConvertTarget] = useState<AdmissionRequestRow | null>(null);
  const [registrationTarget, setRegistrationTarget] = useState<AdmissionRequestRow | null>(null);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestForm>({ nombres: "", apellidos: "", email: "", notes: "", stateCode: "nueva" });
  const [requestError, setRequestError] = useState<string | null>(null);
  const [stateCode, setStateCode] = useState<AdmissionStateCode>("nueva");
  const [stateComment, setStateComment] = useState("");
  const [stateError, setStateError] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertForm>({ numeroDocumento: "", tipoDocumento: "", genero: "", codigoPais: "PE", telefono: "", fechaNacimiento: "", observaciones: "", codigoEstado: "" });
  const [convertError, setConvertError] = useState<string | null>(null);
  const [registrationForm, setRegistrationForm] = useState<RegistrationCodeForm>({
    email: "",
    numeroDocumento: "",
    expiresInMinutes: "1440",
  });
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [generatedRegistrationCode, setGeneratedRegistrationCode] =
    useState<AdmissionRegistrationCodeRow | null>(null);
  const requestIdParam = searchParams.get("requestId");

  const admission = useSolicitudesAdmision({ searchTerm, status, dateFrom: null, dateTo: null, page, pageSize: PAGE_SIZE });
  const detail = useSolicitudAdmisionDetail(detailRequestId);
  const catalogs = useAdmissionReferenceCatalogs();

  useEffect(() => {
    if (!requestIdParam) {
      return;
    }

    setDetailRequestId(requestIdParam);
  }, [requestIdParam]);

  function closeDetailModal() {
    setDetailRequestId(null);
    if (!requestIdParam) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("requestId");
    setSearchParams(next, { replace: true });
  }

  const filterOptions = useMemo(() => [{ label: "Todas", value: "all", active: status === "all" }, ...admission.stateOptions.map((item) => ({ label: item.label, value: item.kind, active: status === item.kind }))], [admission.stateOptions, status]);
  const stateOptions = useMemo(() => admission.stateOptions.map((item) => ({ value: item.value, label: item.label })), [admission.stateOptions]);
  const documentTypes = useMemo(() => catalogs.catalogs.documentTypes.length ? catalogs.catalogs.documentTypes : [{ value: "", label: "Sin catalogo" }], [catalogs.catalogs.documentTypes]);
  const genders = useMemo(() => [{ value: "", label: "Genero (opcional)" }, ...catalogs.catalogs.genders], [catalogs.catalogs.genders]);
  const countries = useMemo(() => catalogs.catalogs.countries.length ? catalogs.catalogs.countries : [{ value: "PE", label: "PE" }], [catalogs.catalogs.countries]);
  const volunteerStates = useMemo(() => catalogs.catalogs.volunteerStates.length ? catalogs.catalogs.volunteerStates : [{ value: "activo", label: "activo" }], [catalogs.catalogs.volunteerStates]);
  const generatedRegistrationLink = useMemo(
    () => buildRegistrationLink(generatedRegistrationCode),
    [generatedRegistrationCode]
  );

  const fromRow = admission.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toRow = Math.min(admission.total, page * PAGE_SIZE);

  function resetRequestForm() {
    setEditingRequest(null);
    setRequestForm({ nombres: "", apellidos: "", email: "", notes: "", stateCode: stateOptions[0]?.value ?? "nueva" });
    setRequestError(null);
  }

  function openCreateModal() {
    resetRequestForm();
    setIsRequestFormOpen(true);
  }

  function openEditModal(row: AdmissionRequestRow) {
    setEditingRequest(row);
    setRequestForm({ nombres: row.nombres, apellidos: row.apellidos, email: row.email, notes: row.notes, stateCode: row.stateCode });
    setRequestError(null);
    setIsRequestFormOpen(true);
  }

  function openStateModal(row: AdmissionRequestRow) {
    setStateTarget(row);
    setStateCode(row.stateCode);
    setStateComment("");
    setStateError(null);
  }

  function openConvertModal(row: AdmissionRequestRow) {
    setConvertTarget(row);
    setConvertForm({ numeroDocumento: "", tipoDocumento: documentTypes[0]?.value ?? "", genero: "", codigoPais: countries[0]?.value ?? "PE", telefono: "", fechaNacimiento: "", observaciones: row.notes || "", codigoEstado: volunteerStates[0]?.value ?? "activo" });
    setConvertError(null);
  }

  function openRegistrationCodeModal(row: AdmissionRequestRow) {
    setRegistrationTarget(row);
    setRegistrationForm({
      email: row.email,
      numeroDocumento: "",
      expiresInMinutes: "1440",
    });
    setRegistrationError(null);
    setGeneratedRegistrationCode(null);
  }

  async function submitRequest() {
    if (!requestForm.nombres.trim() || !requestForm.apellidos.trim() || !requestForm.email.trim()) {
      setRequestError("Nombres, apellidos y correo son obligatorios.");
      return;
    }
    try {
      if (editingRequest) {
        const payload: AdmissionUpdateInput = { requestId: editingRequest.id, nombres: requestForm.nombres.trim(), apellidos: requestForm.apellidos.trim(), email: requestForm.email.trim(), notes: requestForm.notes.trim() || null };
        const result = await admission.update(payload);
        if (!result) return;
        toast.success("Solicitud actualizada.");
      } else {
        const payload: AdmissionCreateInput = { nombres: requestForm.nombres.trim(), apellidos: requestForm.apellidos.trim(), email: requestForm.email.trim(), notes: requestForm.notes.trim() || null, stateCode: requestForm.stateCode };
        const result = await admission.create(payload);
        if (!result) return;
        toast.success("Solicitud registrada.");
        setPage(1);
      }
      setIsRequestFormOpen(false);
      resetRequestForm();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No se pudo guardar la solicitud.");
    }
  }

  async function submitState() {
    if (!stateTarget) return;
    if (stateTarget.stateCode === stateCode) {
      setStateError("La solicitud ya se encuentra en ese estado.");
      return;
    }
    try {
      const result = await admission.changeState({ requestId: stateTarget.id, stateCode, comment: stateComment.trim() || null });
      if (!result) return;
      toast.success("Estado actualizado.");
      setStateTarget(null);
      if (detailRequestId === stateTarget.id) detail.refresh();
    } catch (error) {
      setStateError(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    }
  }

  async function submitConvert() {
    if (!convertTarget) return;
    if (!convertForm.numeroDocumento.trim() || !convertForm.tipoDocumento.trim() || !convertForm.codigoEstado.trim()) {
      setConvertError("Documento, tipo de documento y estado inicial son obligatorios.");
      return;
    }
    try {
      const payload: AdmissionConvertInput = { requestId: convertTarget.id, numeroDocumento: convertForm.numeroDocumento.trim(), tipoDocumento: convertForm.tipoDocumento, genero: convertForm.genero || null, codigoPais: convertForm.codigoPais || null, telefono: convertForm.telefono.trim() || null, fechaNacimiento: convertForm.fechaNacimiento || null, observaciones: convertForm.observaciones.trim() || null, codigoEstado: convertForm.codigoEstado || null };
      const result = await admission.convert(payload);
      if (!result) return;
      toast.success(result.created ? "Solicitud convertida a voluntario." : "Solicitud vinculada a un voluntario existente.");
      setConvertTarget(null);
      if (detailRequestId === convertTarget.id) detail.refresh();
    } catch (error) {
      setConvertError(error instanceof Error ? error.message : "No se pudo convertir la solicitud.");
    }
  }

  async function submitRegistrationCode() {
    if (!registrationTarget) {
      return;
    }

    const expiresInMinutes = Number(registrationForm.expiresInMinutes);
    if (!registrationForm.email.trim() && !registrationForm.numeroDocumento.trim()) {
      setRegistrationError(
        "Debes registrar al menos un correo o numero de documento objetivo."
      );
      return;
    }
    if (!Number.isFinite(expiresInMinutes) || expiresInMinutes < 15) {
      setRegistrationError("La vigencia minima del codigo es de 15 minutos.");
      return;
    }

    try {
      const payload: AdmissionGenerateRegistrationCodeInput = {
        requestId: registrationTarget.id,
        email: registrationForm.email.trim() || null,
        numeroDocumento: registrationForm.numeroDocumento.trim() || null,
        expiresInMinutes,
      };
      const result = await admission.generateRegistrationCode(payload);
      if (!result) {
        return;
      }

      setGeneratedRegistrationCode(result);
      setRegistrationError(null);
      toast.success("Codigo de registro generado.");
    } catch (error) {
      setRegistrationError(
        error instanceof Error ? error.message : "No se pudo generar el codigo."
      );
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Solicitudes de admision" description="Bandeja real sobre rrhh.solicitudes_admision con edicion, cambio de estado y conversion a ong.voluntarios." action={{ label: "Nueva solicitud", onClick: openCreateModal }} />

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <SummaryField label="Total" value={String(admission.kpis.total)} />
        <SummaryField label="Pendientes" value={String(admission.kpis.pending)} />
        <SummaryField label="Revision" value={String(admission.kpis.review)} />
        <SummaryField label="Entrevista" value={String(admission.kpis.interview)} />
        <SummaryField label="Onboarding" value={String(admission.kpis.onboarding)} />
        <SummaryField label="Aprobadas" value={String(admission.kpis.approved)} />
        <SummaryField label="Rechazadas" value={String(admission.kpis.rejected)} />
        <SummaryField label="Convertidas" value={String(admission.kpis.converted)} />
      </div>

      {(admission.error || catalogs.error) && <ErrorBlock message={admission.error || catalogs.error || "No se pudo cargar admision."} onRetry={() => { admission.refresh(); catalogs.refresh(); }} />}

      {admission.warnings.length > 0 && (
        <div className="space-y-2">
          {admission.warnings.map((warning) => (
            <div key={warning} className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
              <p style={{ color: "var(--t-text-tertiary)" }}>{warning}</p>
            </div>
          ))}
        </div>
      )}

      <FilterBar
        searchPlaceholder="Buscar por nombre, correo o notas..."
        searchValue={searchTerm}
        onSearchChange={(value) => { setSearchTerm(value); setPage(1); }}
        filters={filterOptions}
        onFilterClick={(value) => { setStatus(value as "all" | AdmissionStateKind); setPage(1); }}
      />

      <DataTable
        columns={columns}
        data={admission.rows}
        loading={admission.loading}
        emptyMessage="No se encontraron solicitudes de admision."
        actions={[
          { label: "Ver detalle", onClick: (row) => setDetailRequestId(row.id) },
          { label: "Editar", onClick: (row) => openEditModal(row) },
          { label: "Cambiar estado", onClick: (row) => openStateModal(row) },
          { label: "Generar codigo", onClick: (row) => openRegistrationCodeModal(row) },
          { label: "Convertir", onClick: (row) => openConvertModal(row) },
        ]}
      />

      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
        <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{fromRow}-{toRow} de {admission.total}</p>
        <div className="flex gap-2">
          <OutlineButton size="sm" onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>Anterior</OutlineButton>
          <OutlineButton size="sm" onClick={() => setPage((current) => current + 1)} disabled={page * PAGE_SIZE >= admission.total}>Siguiente</OutlineButton>
        </div>
      </div>

      <ModalShell open={isRequestFormOpen} onClose={() => setIsRequestFormOpen(false)} width="max-w-[760px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingRequest ? "Editar solicitud" : "Nueva solicitud"}</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{editingRequest ? "Actualiza el expediente." : "Registro real en rrhh.solicitudes_admision."}</p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setIsRequestFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {requestError && <ErrorBlock message={requestError} onRetry={() => setRequestError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input value={requestForm.nombres} onChange={(event) => setRequestForm((current) => ({ ...current, nombres: event.target.value }))} placeholder="Nombres" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
              <FieldError message={!requestForm.nombres.trim() && requestError ? "Los nombres son obligatorios." : undefined} />
            </div>
            <div className="space-y-1">
              <input value={requestForm.apellidos} onChange={(event) => setRequestForm((current) => ({ ...current, apellidos: event.target.value }))} placeholder="Apellidos" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
              <FieldError message={!requestForm.apellidos.trim() && requestError ? "Los apellidos son obligatorios." : undefined} />
            </div>
          </div>
          <div className="space-y-1">
            <input value={requestForm.email} onChange={(event) => setRequestForm((current) => ({ ...current, email: event.target.value }))} placeholder="Correo" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <FieldError message={!requestForm.email.trim() && requestError ? "El correo es obligatorio." : undefined} />
          </div>
          {!editingRequest && <SelectField value={requestForm.stateCode} onChange={(value) => setRequestForm((current) => ({ ...current, stateCode: value as AdmissionStateCode }))} options={stateOptions} disabled={admission.isCreating} />}
          <textarea value={requestForm.notes} onChange={(event) => setRequestForm((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Notas" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={() => void submitRequest()} disabled={admission.isCreating || admission.isUpdating}>{admission.isCreating || admission.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setIsRequestFormOpen(false)} disabled={admission.isCreating || admission.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
      <ModalShell open={Boolean(detailRequestId)} onClose={closeDetailModal} width="max-w-[920px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Expediente de admision</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Vista consolidada del expediente real.</p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={closeDetailModal}>X</button>
        </div>
        <div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
          {detail.loading && <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>Cargando expediente...</div>}
          {!detail.loading && detail.error && <ErrorBlock message={detail.error} onRetry={detail.refresh} />}
          {!detail.loading && !detail.error && detail.detail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot variant={detail.detail.request.stateVariant}>{detail.detail.request.stateName}</StatusDot>
                {detail.detail.relatedVolunteer && (
                  <StatusDot variant="success">
                    {detail.detail.request.resolvedVolunteerSource === "direct"
                      ? `Vinculada: ${detail.detail.relatedVolunteer.fullName}`
                      : `Coincidencia por email: ${detail.detail.relatedVolunteer.fullName}`}
                  </StatusDot>
                )}
              </div>
              {detail.detail.warnings.length > 0 && (
                <div className="space-y-2 rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                  {detail.detail.warnings.map((warning) => <p key={warning} className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>{warning}</p>)}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Nombre completo" value={detail.detail.request.fullName} />
                <DetailField label="Correo" value={detail.detail.request.email} />
                <DetailField label="Estado" value={detail.detail.request.stateName} />
                <DetailField label="Solicitud" value={detail.detail.request.submittedAt} />
                <DetailField label="Actualizado" value={detail.detail.request.updatedAt} />
                <DetailField
                  label="Vinculo directo"
                  value={detail.detail.request.linkedVolunteerName ?? "-"}
                />
                <DetailField label="Notas" value={detail.detail.request.notes || "-"} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <SummaryField label="Documentos" value={String(detail.detail.documents.length)} />
                <SummaryField label="Entrevistas" value={String(detail.detail.interviews.length)} />
                <SummaryField label="Onboarding" value={String(detail.detail.onboardingSteps.length)} />
                <SummaryField label="Eventos" value={String(detail.detail.history.length)} />
              </div>
              {detail.detail.history.length > 0 && (
                <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                  <p className="text-[12px]" style={{ color: "var(--t-text)" }}>Historial</p>
                  <div className="mt-2 space-y-2">
                    {detail.detail.history.map((item) => (
                      <div key={item.id} className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                        <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.title}</p>
                        {item.subtitle && <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.subtitle}</p>}
                        <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ModalShell>
      <ModalShell open={Boolean(stateTarget)} onClose={() => setStateTarget(null)} width="max-w-[620px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Cambiar estado</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{stateTarget ? `${stateTarget.fullName} (${stateTarget.stateName})` : "Actualiza el flujo de admision."}</p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setStateTarget(null)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {stateError && <ErrorBlock message={stateError} onRetry={() => setStateError(null)} />}
          <SelectField value={stateCode} onChange={(value) => setStateCode(value as AdmissionStateCode)} options={stateOptions} disabled={admission.isChangingState} />
          <textarea value={stateComment} onChange={(event) => setStateComment(event.target.value)} rows={4} placeholder="Comentario" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={() => void submitState()} disabled={admission.isChangingState}>{admission.isChangingState ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setStateTarget(null)} disabled={admission.isChangingState}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
      <ModalShell open={Boolean(convertTarget)} onClose={() => setConvertTarget(null)} width="max-w-[840px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Convertir a voluntario</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{convertTarget ? `Creacion o vinculacion real en ong.voluntarios para ${convertTarget.fullName}.` : "Conversor de admision."}</p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setConvertTarget(null)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {convertError && <ErrorBlock message={convertError} onRetry={() => setConvertError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input value={convertForm.numeroDocumento} onChange={(event) => setConvertForm((current) => ({ ...current, numeroDocumento: event.target.value }))} placeholder="Numero de documento" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
              <FieldError message={!convertForm.numeroDocumento.trim() && convertError ? "El numero de documento es obligatorio." : undefined} />
            </div>
            <div className="space-y-1">
              <SelectField value={convertForm.tipoDocumento} onChange={(value) => setConvertForm((current) => ({ ...current, tipoDocumento: value }))} options={documentTypes} disabled={admission.isConverting || catalogs.loading} />
              <FieldError message={!convertForm.tipoDocumento.trim() && convertError ? "El tipo de documento es obligatorio." : undefined} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SelectField value={convertForm.genero} onChange={(value) => setConvertForm((current) => ({ ...current, genero: value }))} options={genders} disabled={admission.isConverting || catalogs.loading} />
            <SelectField value={convertForm.codigoPais} onChange={(value) => setConvertForm((current) => ({ ...current, codigoPais: value }))} options={countries} disabled={admission.isConverting || catalogs.loading} />
            <SelectField value={convertForm.codigoEstado} onChange={(value) => setConvertForm((current) => ({ ...current, codigoEstado: value }))} options={volunteerStates} disabled={admission.isConverting || catalogs.loading} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={convertForm.telefono} onChange={(event) => setConvertForm((current) => ({ ...current, telefono: event.target.value }))} placeholder="Telefono" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="date" value={convertForm.fechaNacimiento} onChange={(event) => setConvertForm((current) => ({ ...current, fechaNacimiento: event.target.value }))} className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <textarea value={convertForm.observaciones} onChange={(event) => setConvertForm((current) => ({ ...current, observaciones: event.target.value }))} rows={4} placeholder="Observaciones para el alta del voluntario" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={() => void submitConvert()} disabled={admission.isConverting || catalogs.loading}>{admission.isConverting ? "Convirtiendo..." : "Convertir"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setConvertTarget(null)} disabled={admission.isConverting}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
      <ModalShell
        open={Boolean(registrationTarget)}
        onClose={() => setRegistrationTarget(null)}
        width="max-w-[760px]"
      >
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Generar codigo de registro</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Genera un código de acceso único para que el postulante complete su registro en la plataforma.
            </p>
          </div>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setRegistrationTarget(null)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {registrationError && <ErrorBlock message={registrationError} onRetry={() => setRegistrationError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <input
                value={registrationForm.email}
                onChange={(event) =>
                  setRegistrationForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Correo objetivo"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }}
              />
            </div>
            <div className="space-y-1">
              <input
                value={registrationForm.numeroDocumento}
                onChange={(event) =>
                  setRegistrationForm((current) => ({
                    ...current,
                    numeroDocumento: event.target.value,
                  }))
                }
                placeholder="Numero de documento objetivo"
                className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={registrationForm.expiresInMinutes}
              onChange={(event) =>
                setRegistrationForm((current) => ({
                  ...current,
                  expiresInMinutes: event.target.value,
                }))
              }
              placeholder="Vigencia en minutos"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }}
            />
            <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)", color: "var(--t-text-secondary)" }}>
              Solicitante: {registrationTarget?.fullName ?? "-"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <GradientButton size="sm" onClick={() => void submitRegistrationCode()} disabled={admission.isGeneratingCode}>
              {admission.isGeneratingCode ? "Generando..." : "Generar"}
            </GradientButton>
            <OutlineButton size="sm" onClick={() => setRegistrationTarget(null)} disabled={admission.isGeneratingCode}>
              Cerrar
            </OutlineButton>
          </div>

          {generatedRegistrationCode && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot variant="success">Codigo activo</StatusDot>
                <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Expira {generatedRegistrationCode.expiresAt}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Codigo" value={generatedRegistrationCode.code} />
                <DetailField label="Uso" value={generatedRegistrationCode.usesLabel} />
                <DetailField label="Tenant" value={generatedRegistrationCode.tenantId} />
                <DetailField label="Email objetivo" value={generatedRegistrationCode.targetEmail ?? "-"} />
                <DetailField label="Documento objetivo" value={generatedRegistrationCode.targetDocumentNumber ?? "-"} />
                <DetailField label="Nombre objetivo" value={generatedRegistrationCode.targetFullName || "-"} />
                <DetailField label="Estado" value={generatedRegistrationCode.status} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <DetailField
                  label="Enlace publico"
                  value={generatedRegistrationLink || "No se pudo construir el enlace publico."}
                />
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Comparte este enlace con el postulante para que complete su registro, cargue sus documentos y sea incorporado como voluntario.
                </p>
              </div>
            </div>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
}
