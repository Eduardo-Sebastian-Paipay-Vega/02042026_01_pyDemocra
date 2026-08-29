import re

def merge():
        
        
    # Extract imports from both files
    old_imports_match = re.search(r'^(import .*?;\n)+', old_code, re.MULTILINE | re.DOTALL)
    new_imports_match = re.search(r'^(import .*?;\n)+', new_code, re.MULTILINE | re.DOTALL)
    
    old_imports = old_imports_match.group(0) if old_imports_match else ""
    new_imports = new_imports_match.group(0) if new_imports_match else ""
    
    # We will just write a completely new file manually because merging AST with regex is error-prone.
    # Actually, I'll generate the string directly here.

    final_code = """import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Activity,
  Calendar,
  Link as LinkIcon,
  ChevronRight,
  FileText,
  UserPlus,
  Settings,
  BarChart2
} from "lucide-react";

import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import {
  buildEmptyAdmissionOnboardingForm,
  mapAdmissionOnboardingStepToForm,
  validateAdmissionOnboardingForm,
  type AdmissionOnboardingFormErrors,
  type AdmissionOnboardingFormValues,
} from "../modules/admission/forms";
import { useOnboardingAdmision } from "../modules/admission/hooks/useOnboardingAdmision";
import { useSolicitudesAdmision } from "../modules/admission/hooks/useSolicitudesAdmision";
import type { AdmissionOnboardingStepRow, AdmissionRequestRow } from "../modules/admission/types";
import { adaptAdmissionOnboardingFormToUpdateInput } from "../services/admision/form-adapters";

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-3 py-8">
      <div className="rounded-xl bg-[#23211D] p-3 text-[#A4A29F]">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <h4 className="text-sm font-medium text-[#F9F7F3]">{title}</h4>
        <p className="mx-auto mt-1 max-w-xs text-xs text-[#A4A29F]">{subtitle}</p>
      </div>
    </div>
  );
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
        <div className="flex items-center gap-1.5" style={{ color: "var(--t-text)" }}>
          {item.isLocked && (
            <span title={item.blockReason ?? "Paso bloqueado"} style={{ color: "var(--t-text-dim)" }}>
              🔒
            </span>
          )}
          {item.stepName}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.isLocked ? item.blockReason ?? "Bloqueado" : `Orden: ${item.order}`}
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

  // Global requests for Dashboard KPIs
  const globalRequests = useSolicitudesAdmision({
    searchTerm: "",
    status: "all",
    dateFrom: null,
    dateTo: null,
    page: 1,
    pageSize: 100,
  });

  // Filtered requests for the table
  const requests = useSolicitudesAdmision({
    searchTerm,
    status: "all",
    dateFrom: null,
    dateTo: null,
    page: 1,
    pageSize: 100,
  });
  
  const onboarding = useOnboardingAdmision(selectedRequestId);

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
      return "Esta solicitud aun no esta vinculada a un voluntario.";
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

    try {
      setIsUploadingEvidence(true);
      const result = await onboarding.updateStep(
        await adaptAdmissionOnboardingFormToUpdateInput({
          volunteerId: stepFormTarget.volunteerId,
          stepId: stepFormTarget.stepId,
          values: stepFormState,
        })
      );

      if (!result) {
        return;
      }

      toast.success("Paso actualizado.");
      closeStepForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el paso.";
      setStepFormErrors((current) => ({
        ...current,
        general: message,
      }));
      toast.error(message);
    } finally {
      setIsUploadingEvidence(false);
    }
  }

  // Dashboard KPIs
  const totalRequests = globalRequests.rows.length;
  const approvedRequests = globalRequests.rows.filter((r) => r.stateName === "Aprobada").length;
  const inProcessRequests = globalRequests.rows.filter(
    (r) => r.stateName === "Pendiente" || r.stateName === "En Proceso"
  ).length;
  const rejectedRequests = globalRequests.rows.filter((r) => r.stateName === "Rechazada").length;

  // Chart Data
  const chartData = useMemo(() => {
    if (!globalRequests.rows || globalRequests.rows.length === 0) return [];
    
    // Agrupar por fecha
    const grouped = globalRequests.rows.reduce((acc, row) => {
      const dateObj = new Date(row.submittedAt);
      if (isNaN(dateObj.getTime())) return acc;
      
      const dateStr = dateObj.toLocaleDateString("es-ES", { month: 'short', day: 'numeric' });
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }, [globalRequests.rows]);

  // Feed en vivo (últimas solicitudes)
  const liveFeed = useMemo(() => {
    return [...globalRequests.rows]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [globalRequests.rows]);

  return (
    <div className="min-h-screen bg-[#100F0D] p-6 font-sans text-[#F9F7F3] space-y-8">
      
      {/* -------------------- DASHBOARD SECTION -------------------- */}
      <section>
        {/* Header Superior */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#F9F7F3]">Panel Principal</h1>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-[#26231F] bg-[#171512] px-3 py-1.5 text-sm text-[#F9F7F3] transition-colors hover:bg-[#1F1D1A]">
              Filtrar
            </button>
            <button className="rounded-lg border border-[#26231F] bg-[#171512] px-3 py-1.5 text-sm text-[#F9F7F3] transition-colors hover:bg-[#1F1D1A]">
              Exportar
            </button>
          </div>
        </header>

        {/* Grid de Contenido */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Columna Izquierda (2/3) */}
          <div className="space-y-4 lg:col-span-2">
            {/* Fila de 4 KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A4A29F]">Total Solicitudes</span>
                  <Users className="h-4 w-4 text-[#A4A29F]" strokeWidth={1.5} />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{totalRequests}</span>
                  <div className="flex items-center gap-1 rounded-full border border-[#8B5CF6]/20 bg-[#1F181E] px-2.5 py-0.5 text-xs text-[#8B5CF6]">
                    <TrendingUp className="h-3 w-3" />
                    <span>Activo</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A4A29F]">Aprobadas</span>
                  <CheckCircle className="h-4 w-4 text-[#A4A29F]" strokeWidth={1.5} />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{approvedRequests}</span>
                  <div className="flex items-center gap-1 rounded-full border border-[#08996A]/20 bg-[#161D17] px-2.5 py-0.5 text-xs text-[#08996A]">
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A4A29F]">En Proceso</span>
                  <Clock className="h-4 w-4 text-[#A4A29F]" strokeWidth={1.5} />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{inProcessRequests}</span>
                  <div className="flex items-center gap-1 rounded-full border border-[#D97706]/20 bg-[#231C11] px-2.5 py-0.5 text-xs text-[#D97706]">
                    <span>Pendientes</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A4A29F]">Rechazadas</span>
                  <XCircle className="h-4 w-4 text-[#A4A29F]" strokeWidth={1.5} />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{rejectedRequests}</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Gráfico / Evolución */}
            <div className="h-[280px] rounded-xl border border-[#26231F] bg-[#171512] p-4 flex flex-col">
              <h3 className="text-sm font-semibold text-[#F9F7F3] mb-4">Evolución de Solicitudes</h3>
              <div className="flex-1">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#356C92" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#356C92" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#A4A29F', fontSize: 11 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#A4A29F', fontSize: 11 }} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1F1D1A', borderColor: '#26231F', borderRadius: '8px' }}
                        itemStyle={{ color: '#F9F7F3' }}
                        labelStyle={{ color: '#A4A29F', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#356C92" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState 
                    icon={BarChart2} 
                    title="Sin datos de evolución" 
                    subtitle="Aún no hay suficientes solicitudes registradas para generar el gráfico." 
                  />
                )}
              </div>
            </div>

            {/* Tarjeta de Feed en Vivo */}
            <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4">
              <h3 className="mb-4 text-sm font-semibold text-[#F9F7F3] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#8B5CF6]" strokeWidth={1.5} />
                Feed en Vivo
              </h3>
              
              {liveFeed.length > 0 ? (
                <div className="space-y-3">
                  {liveFeed.map((req) => (
                    <div key={req.id} className="flex items-start gap-3 rounded-lg bg-[#1F1D1A]/30 p-3">
                      <div className="mt-0.5 rounded-full bg-[#23211D] p-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#A4A29F]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#F9F7F3]">
                          Nueva solicitud de <span className="font-medium text-white">{req.fullName}</span>
                        </p>
                        <p className="text-xs text-[#A4A29F] mt-0.5">
                          Estado actual: {req.stateName}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#686561]">
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Activity} 
                  title="Feed vacío" 
                  subtitle="No hay actividad reciente en el módulo de admisiones." 
                />
              )}
            </div>
          </div>

          {/* Columna Derecha / Barra Lateral (1/3) */}
          <div className="space-y-4 lg:col-span-1">
            {/* Tarjeta Agenda de Hoy */}
            <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4 h-[300px] flex flex-col">
              <h3 className="mb-4 text-sm font-semibold text-[#F9F7F3] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#D97706]" strokeWidth={1.5} />
                Agenda de Hoy
              </h3>
              <div className="flex-1">
                {/* Empty state ya que no cargamos entrevistas globales */}
                <EmptyState 
                  icon={Calendar} 
                  title="Sin eventos hoy" 
                  subtitle="No tienes entrevistas ni reuniones programadas para el día de hoy." 
                />
              </div>
            </div>

            {/* Tarjeta Accesos Directos */}
            <div className="rounded-xl border border-[#26231F] bg-[#171512] p-4">
              <h3 className="mb-4 text-sm font-semibold text-[#F9F7F3] flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[#356C92]" strokeWidth={1.5} />
                Accesos Directos
              </h3>
              <div className="space-y-2">
                <Link to="/ong/app/admission/requests" className="flex items-center justify-between rounded-lg bg-[#1F1D1A]/50 p-3 transition-colors hover:bg-[#1F1D1A]">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-[#A4A29F]" />
                    <span className="text-sm text-[#F9F7F3]">Solicitudes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#100F0D] px-2 py-1 text-xs text-[#A4A29F]">{totalRequests}</span>
                    <ChevronRight className="h-4 w-4 text-[#686561]" />
                  </div>
                </Link>
                
                <Link to="/ong/app/admission/interviews" className="flex items-center justify-between rounded-lg bg-[#1F1D1A]/50 p-3 transition-colors hover:bg-[#1F1D1A]">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-[#A4A29F]" />
                    <span className="text-sm text-[#F9F7F3]">Entrevistas</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#686561]" />
                </Link>

                <Link to="/ong/app/settings" className="flex items-center justify-between rounded-lg bg-[#1F1D1A]/50 p-3 transition-colors hover:bg-[#1F1D1A]">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-[#A4A29F]" />
                    <span className="text-sm text-[#F9F7F3]">Configuración</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#686561]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- ORIGINAL ONBOARDING SECTION -------------------- */}
      <section className="pt-6 border-t border-[#26231F]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <PageHeader
            title="Gestión de Onboarding"
            description="Seguimiento del proceso de onboarding: pasos completados y evidencias por voluntario."
            action={{ label: "Iniciar onboarding", onClick: () => void startOnboarding() }}
          />

          <FilterBar
            searchPlaceholder="Buscar solicitud por nombre o correo..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={[]}
          />

          {(requests.error || onboarding.error) && (
            <ErrorBlock
              message={requests.error || onboarding.error || "No se pudo cargar onboarding."}
              onRetry={() => {
                requests.refresh();
                onboarding.refresh();
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
                <div className="grid gap-3 md:grid-cols-4">
                  <DetailField label="Solicitante" value={selectedRequest.fullName} />
                  <DetailField label="Estado" value={selectedRequest.stateName} />
                  <DetailField
                    label="Voluntario vinculado"
                    value={
                      selectedRequest.linkedVolunteerName ??
                      selectedRequest.resolvedVolunteerName ??
                      "Pendiente de conversion"
                    }
                  />
                  <DetailField label="Registro" value={selectedRequest.submittedAt} />
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  Selecciona una solicitud para revisar sus pasos de onboarding.
                </p>
              )}
            </div>
          </div>

          {selectedRequest && selectedRequest.resolvedVolunteerSource === "email" && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-tertiary)" }}>
                La solicitud todavia no guarda `id_voluntario_vinculado`. El modulo usa coincidencia por correo hasta que se sincronice el vinculo directo.
              </p>
            </div>
          )}

          {!selectedVolunteerId && selectedRequest && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <p style={{ color: "var(--t-text-tertiary)" }}>
                Esta solicitud aun no esta convertida a voluntario. Primero debes completar la conversion desde Solicitudes para poder iniciar onboarding.
              </p>
            </div>
          )}

          {hasBlockingError ? null : !selectedVolunteerId ? (
            <InfoBlock message={tableEmptyMessage} />
          ) : (
            <DataTable
              columns={columns}
              data={onboarding.rows}
              loading={requests.loading || onboarding.loading}
              emptyMessage={tableEmptyMessage}
              actions={[
                { label: "Ver detalle", onClick: (row) => setDetailStep(row) },
                { label: "Actualizar paso", onClick: (row) => openStepForm(row), disabled: (row) => row.isLocked },
                {
                  label: "Marcar completado",
                  onClick: (row) => void setStepCompleted(row, true),
                  disabled: (row) => row.isLocked || row.completed,
                },
                {
                  label: "Marcar pendiente",
                  onClick: (row) => void setStepCompleted(row, false),
                  disabled: (row) => !row.completed,
                },
              ]}
            />
          )}

          <ModalShell
            open={Boolean(detailStep)}
            onClose={() => setDetailStep(null)}
            width="max-w-[720px]"
          >
            <div className="space-y-3 p-4">
              {detailStep && (
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailField label="Voluntario" value={detailStep.volunteerName} />
                  <DetailField label="Paso" value={detailStep.stepName} />
                  <DetailField label="Orden" value={String(detailStep.order)} />
                  <DetailField label="Obligatorio" value={detailStep.mandatory ? "Si" : "No"} />
                  <DetailField
                    label="Estado"
                    value={detailStep.completed ? "Completado" : "Pendiente"}
                  />
                  <DetailField label="Fecha de cierre" value={detailStep.completedAt ?? "-"} />
                  <DetailField label="Evidencia" value={detailStep.evidenceUrl ?? "-"} />
                </div>
              )}
            </div>
          </ModalShell>

          <ModalShell
            open={Boolean(stepFormTarget)}
            onClose={closeStepForm}
            width="max-w-[760px]"
          >
            <div
              className="flex items-start justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--t-border)" }}
            >
              <div>
                <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                  Actualizar paso
                </h3>
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {stepFormTarget ? `${stepFormTarget.volunteerName} - ${stepFormTarget.stepName}` : "-"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[12px]"
                onClick={closeStepForm}
                disabled={onboarding.isUpdating || isUploadingEvidence}
              >
                X
              </button>
            </div>

            <div className="space-y-3 p-4">
              {stepFormErrors.general && (
                <ErrorBlock
                  message={stepFormErrors.general}
                  onRetry={() =>
                    setStepFormErrors((current) => ({
                      ...current,
                      general: undefined,
                    }))
                  }
                />
              )}

              <label
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--t-text-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={stepFormState.completed}
                  onChange={(event) =>
                    setStepFormState((current) => ({
                      ...current,
                      completed: event.target.checked,
                    }))
                  }
                />
                Paso completado
              </label>

              <div className="space-y-1">
                <input
                  type="file"
                  className="h-9 w-full rounded-xl px-3 text-[12px] outline-none"
                  style={{
                    border: "1px solid var(--t-border)",
                    background: "var(--t-input-bg)",
                    color: "var(--t-text-secondary)",
                  }}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setStepFormState((current) => ({
                      ...current,
                      evidenceFile: file,
                      removeEvidence: file ? false : current.removeEvidence,
                    }));
                    setStepFormErrors((current) => ({
                      ...current,
                      evidenceFile: undefined,
                      general: undefined,
                    }));
                  }}
                />
                {stepFormState.evidenceFile && (
                  <p className="text-[11px]" style={{ color: "var(--t-text-secondary)" }}>
                    Archivo seleccionado: {stepFormState.evidenceFile.name}
                  </p>
                )}
                {!stepFormState.evidenceFile &&
                  !stepFormState.removeEvidence &&
                  stepFormState.existingEvidenceUrl && (
                    <p className="break-all text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                      Evidencia actual: {stepFormState.existingEvidenceUrl}
                    </p>
                  )}
                {stepFormState.removeEvidence && (
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    La evidencia actual se eliminara al guardar este paso.
                  </p>
                )}
                <FieldError message={stepFormErrors.evidenceFile} />
              </div>

              <div className="flex flex-wrap gap-2">
                <OutlineButton
                  size="sm"
                  type="button"
                  onClick={() =>
                    setStepFormState((current) => ({
                      ...current,
                      evidenceFile: null,
                      removeEvidence: true,
                    }))
                  }
                  disabled={onboarding.isUpdating || isUploadingEvidence}
                >
                  Quitar evidencia
                </OutlineButton>
                {(stepFormState.evidenceFile || stepFormState.removeEvidence) && (
                  <OutlineButton
                    size="sm"
                    type="button"
                    onClick={() =>
                      setStepFormState((current) => ({
                        ...current,
                        evidenceFile: null,
                        removeEvidence: false,
                      }))
                    }
                    disabled={onboarding.isUpdating || isUploadingEvidence}
                  >
                    Restaurar actual
                  </OutlineButton>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <GradientButton
                  size="sm"
                  onClick={() => void submitStepForm()}
                  disabled={onboarding.isUpdating || isUploadingEvidence}
                >
                  {isUploadingEvidence
                    ? "Subiendo evidencia..."
                    : onboarding.isUpdating
                      ? "Guardando..."
                      : "Guardar"}
                </GradientButton>
                <OutlineButton
                  size="sm"
                  onClick={closeStepForm}
                  disabled={onboarding.isUpdating || isUploadingEvidence}
                >
                  Cancelar
                </OutlineButton>
              </div>
            </div>
          </ModalShell>
        </motion.div>
      </section>
    </div>
  );
}
"""

        f.write(final_code)
        
    print("Files merged successfully.")

if __name__ == "__main__":
    merge()
