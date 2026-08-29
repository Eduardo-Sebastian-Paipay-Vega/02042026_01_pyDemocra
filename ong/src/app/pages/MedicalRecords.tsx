import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, RefreshCw, Eye, Search, BarChart as LucideBarChart, Calendar, Users, Activity, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useMedicalRecords } from "../modules/people/hooks/useMedicalRecords";
import { useMedicalRecordDetail } from "../modules/people/hooks/useMedicalRecordDetail";
import { useMedicalRecordMutations } from "../modules/people/hooks/useMedicalRecordMutations";
import {
  SensitiveAccessGateModal,
  SensitiveMedicalDetailModal,
  SensitiveMedicalFormModal,
} from "../modules/people/components/MedicalRecordPanels";
import { PeopleErrorBlock, formatPeopleDate } from "../modules/people/components/people-shared";
import type {
  SensitiveMedicalDetail,
  SensitiveMedicalListRow,
  SensitiveRecordScope,
} from "../modules/people/types";

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function mapSensitiveDetailToListRow(detail: SensitiveMedicalDetail): SensitiveMedicalListRow {
  if (detail.scope === "beneficiaries") {
    return {
      id: detail.personId,
      scope: "beneficiaries",
      personId: detail.personId,
      recordId: detail.recordId,
      personName: detail.personName,
      documentLabel: detail.documentLabel,
      profileKind: detail.profileKind,
      profileLabel: detail.profileLabel,
      hasRecord: detail.hasRecord,
      summary: detail.hasRecord ? "Ficha médica registrada" : "Pendiente de creación",
      createdAt: null,
      updatedAt: detail.updatedAt,
      loggable: Boolean(detail.recordId),
    };
  }

  return {
    id: detail.personId,
    scope: "volunteers",
    personId: detail.personId,
    recordId: detail.recordId,
    personName: detail.personName,
    documentLabel: detail.documentLabel,
    stateLabel: detail.stateLabel,
    hasRecord: detail.hasRecord,
    summary: detail.hasRecord ? "Ficha médica registrada" : "Pendiente de creación",
    createdAt: null,
    updatedAt: detail.updatedAt,
    loggable: false,
  };
}

export function MedicalRecords() {
  const [scope, setScope] = useState<SensitiveRecordScope>("beneficiaries");
  const [searchValue, setSearchValue] = useState("");
  const [recordFilter, setRecordFilter] = useState<"all" | "withRecord" | "withoutRecord">("all");
  const [gateTarget, setGateTarget] = useState<SensitiveMedicalListRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<{
    scope: SensitiveRecordScope;
    personId: string;
    accessReason: string;
  } | null>(null);

  const records = useMedicalRecords(scope);
  const detail = useMedicalRecordDetail();
  const mutations = useMedicalRecordMutations(() => {
    records.refresh();
  });

  useEffect(() => {
    setGateTarget(null);
    setIsDetailOpen(false);
    setIsFormOpen(false);
    setLastRequest(null);
    detail.clear();
  }, [detail.clear, scope]);

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    return records.rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.personName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        (row.scope === "beneficiaries" ? row.profileLabel : row.stateLabel).toLowerCase().includes(term);
      const matchesRecord =
        recordFilter === "all" ||
        (recordFilter === "withRecord" && row.hasRecord) ||
        (recordFilter === "withoutRecord" && !row.hasRecord);
      return matchesSearch && matchesRecord;
    });
  }, [recordFilter, records.rows, searchValue]);

  const tableEmptyMessage = useMemo(() => {
    if (records.rows.length === 0) {
      return scope === "beneficiaries"
        ? "Aún no hay beneficiarios disponibles para ficha médica sensible."
        : "Aún no hay voluntarios disponibles para ficha sensible.";
    }

    return "No se encontraron fichas sensibles con los filtros actuales.";
  }, [records.rows.length, scope]);

  const columns = useMemo<Column<SensitiveMedicalListRow>[]>(() => [
    {
      key: "person",
      label: "Persona",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--t-hover)" }}
          >
            <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
          </div>
          <div>
            <div style={{ color: "var(--t-text)" }}>{row.personName}</div>
            <div className="mt-0.5 text-[12px] font-medium" style={{ color: "var(--t-text-secondary)" }}>
              {row.documentLabel}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "context",
      label: "Contexto",
      render: (row) => (
        <div className="capitalize">
          <StatusDot variant="info">
            {row.scope === "beneficiaries" ? row.profileLabel : row.stateLabel}
          </StatusDot>
        </div>
      ),
    },
    {
      key: "record",
      label: "Ficha",
      render: (row) => (
        <div className="flex items-center">
          <StatusDot variant={row.hasRecord ? "warning" : "secondary"}>
            {row.summary}
          </StatusDot>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      className: "w-[130px]",
      render: (row) => (
        <span
          className="text-[12px]"
          style={{ color: row.updatedAt ? "var(--t-text-secondary)" : "var(--t-muted)" }}
        >
          {row.updatedAt ? formatPeopleDate(row.updatedAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <OutlineButton size="sm" onClick={() => setGateTarget(row)} className="h-8 gap-1.5 px-3">
          <Eye className="h-3.5 w-3.5" />
          <span>{row.hasRecord ? "Ver Ficha" : "Crear Ficha"}</span>
        </OutlineButton>
      ),
    },
  ], []);

  async function openSensitiveDetail(reason: string) {
    if (!gateTarget) {
      return;
    }

    const request = {
      scope: gateTarget.scope,
      personId: gateTarget.personId,
      accessReason: reason,
    } as const;

    setGateTarget(null);
    setLastRequest(request);
    setIsDetailOpen(true);

    try {
      await detail.open(request);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la ficha sensible.");
    }
  }

  async function retryDetail() {
    if (!lastRequest) {
      return;
    }

    try {
      await detail.open(lastRequest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reintentar la ficha sensible.");
    }
  }

  async function handleSaveSensitiveRecord(
    input: Parameters<typeof mutations.saveBeneficiary>[0]["input"] | Parameters<typeof mutations.saveVolunteer>[0]["input"]
  ) {
    if (!detail.detail) {
      return;
    }

    const response =
      detail.detail.scope === "beneficiaries"
        ? await mutations.saveBeneficiary({
            beneficiaryId: detail.detail.personId,
            input: input as Parameters<typeof mutations.saveBeneficiary>[0]["input"],
          })
        : await mutations.saveVolunteer({
            volunteerId: detail.detail.personId,
            input: input as Parameters<typeof mutations.saveVolunteer>[0]["input"],
          });

    if (!response) {
      return;
    }

    records.upsertRow(mapSensitiveDetailToListRow(response));
    detail.replace(response);
    setIsFormOpen(false);
    setIsDetailOpen(true);
    toast.success("Ficha sensible actualizada.");
  }

  const totalPeople = records.rows.length;
  const withRecordCount = records.rows.filter(r => r.hasRecord).length;
  const withoutRecordCount = records.rows.filter(r => !r.hasRecord).length;
  const coveragePercent = totalPeople > 0 ? Math.round((withRecordCount / totalPeople) * 100) : 0;

  const evolutionData = useMemo(() => {
    if (!records.rows.length) return [];
    const counts: Record<string, number> = {};
    records.rows.forEach(row => {
      if (row.hasRecord && row.createdAt) {
        const date = new Date(row.createdAt);
        const monthYear = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' }).replace('.', '');
        counts[monthYear] = (counts[monthYear] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [records.rows]);

  const { agenda } = records;

  return (
    <motion.div 
      variants={stagger as any} 
      initial="hidden" 
      animate="visible" 
      className="bg-[#100F0D] text-[#F9F7F3] min-h-screen p-6 font-sans w-full"
      style={{
        '--t-surface': '#171512',
        '--t-border': '#26231F',
        '--t-text': '#F9F7F3',
        '--t-text-secondary': '#A4A29F',
        '--t-text-tertiary': '#686561',
        '--t-hover': '#1F1D1A',
        '--t-muted': '#686561',
        '--t-border-strong': '#26231F',
        '--t-input-bg': '#100F0D',
      } as React.CSSProperties}
    >
      {/* Header Superior */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Panel Principal</h1>
          <p className="text-sm text-[#A4A29F] mt-1">Control de acceso y registro clínico sensible</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scope === "beneficiaries" ? (
             <button className="bg-[#1F1D1A] border border-[#356C92] px-4 py-2 rounded-lg text-sm text-[#356C92] font-medium" onClick={() => setScope("beneficiaries")}>Beneficiarios</button>
          ) : (
             <button className="bg-[#171512] border border-[#26231F] px-4 py-2 rounded-lg text-sm text-[#A4A29F] hover:bg-[#1F1D1A] transition-colors" onClick={() => setScope("beneficiaries")}>Beneficiarios</button>
          )}
          {scope === "volunteers" ? (
             <button className="bg-[#1F1D1A] border border-[#356C92] px-4 py-2 rounded-lg text-sm text-[#356C92] font-medium" onClick={() => setScope("volunteers")}>Voluntarios</button>
          ) : (
             <button className="bg-[#171512] border border-[#26231F] px-4 py-2 rounded-lg text-sm text-[#A4A29F] hover:bg-[#1F1D1A] transition-colors" onClick={() => setScope("volunteers")}>Voluntarios</button>
          )}
          <button 
            className="p-2.5 rounded-lg text-[#A4A29F] hover:text-[#F9F7F3] bg-[#171512] hover:bg-[#1F1D1A] border border-[#26231F] transition-colors shadow-sm ml-2" 
            onClick={records.refresh} 
            disabled={records.loading} 
            title="Actualizar"
          >
             <RefreshCw className={`h-4 w-4 ${records.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna Izquierda */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Fila de 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
                <p className="text-xs text-[#A4A29F]">Total Personas</p>
                <p className="text-2xl font-bold text-white mt-1">{totalPeople}</p>
                <div className="absolute top-3 right-3 bg-[#1F181E] border border-[#8B5CF6]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <Users className="w-3 h-3 text-[#8B5CF6]" />
                   <span className="text-[10px] font-medium text-[#8B5CF6]">Activos</span>
                </div>
             </div>
             <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
                <p className="text-xs text-[#A4A29F]">Con Ficha</p>
                <p className="text-2xl font-bold text-white mt-1">{withRecordCount}</p>
                <div className="absolute top-3 right-3 bg-[#161D17] border border-[#08996A]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <Activity className="w-3 h-3 text-[#08996A]" />
                   <span className="text-[10px] font-medium text-[#08996A]">Completas</span>
                </div>
             </div>
             <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
                <p className="text-xs text-[#A4A29F]">Pendientes</p>
                <p className="text-2xl font-bold text-white mt-1">{withoutRecordCount}</p>
                <div className="absolute top-3 right-3 bg-[#231C11] border border-[#D97706]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <ShieldAlert className="w-3 h-3 text-[#D97706]" />
                   <span className="text-[10px] font-medium text-[#D97706]">Atención</span>
                </div>
             </div>
             <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
                <p className="text-xs text-[#A4A29F]">Cobertura</p>
                <p className="text-2xl font-bold text-white mt-1">{coveragePercent}%</p>
                <div className="absolute top-3 right-3 bg-[#1F181E] border border-[#8B5CF6]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <BarChart className="w-3 h-3 text-[#8B5CF6]" />
                   <span className="text-[10px] font-medium text-[#8B5CF6]">Global</span>
                </div>
             </div>
          </div>

          {/* Tarjeta de Gráfico / Evolución */}
          <div className={`bg-[#171512] border border-[#26231F] rounded-[12px] flex flex-col items-center p-6 ${evolutionData.length > 0 ? 'h-[280px] justify-center' : 'py-10'}`}>
             <div className="bg-[#23211D] p-3 rounded-xl mb-3">
                <LucideBarChart className="w-6 h-6 text-[#A4A29F]" />
             </div>
             <p className="text-sm font-medium text-[#F9F7F3] mb-4">Evolución de Fichas</p>
             {evolutionData.length > 0 ? (
               <div className="w-full h-full min-h-[150px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={evolutionData}>
                     <XAxis dataKey="name" stroke="#A4A29F" fontSize={10} tickLine={false} axisLine={false} />
                     <Tooltip cursor={{ fill: '#1F1D1A' }} contentStyle={{ backgroundColor: '#171512', borderColor: '#26231F', borderRadius: '8px', fontSize: '12px', color: '#F9F7F3' }} />
                     <Bar dataKey="count" fill="#356C92" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             ) : (
               <p className="text-sm text-[#A4A29F] text-center max-w-xs mt-1">No hay datos suficientes para generar el gráfico de evolución en este momento.</p>
             )}
          </div>

          {/* Tarjeta de Feed en Vivo (Tabla) */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
             <div className="mb-5">
                <h2 className="text-base font-medium text-[#F9F7F3]">Registros recientes</h2>
             </div>
             
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                   {[
                     { label: "Todas", value: "all" },
                     { label: "Con ficha", value: "withRecord" },
                     { label: "Sin ficha", value: "withoutRecord" },
                   ].map((filter) => {
                     const isActive = recordFilter === filter.value;
                     return (
                       <button
                         key={filter.value}
                         className={`inline-flex h-8 items-center rounded-lg px-3.5 text-xs font-medium transition-colors ${
                           isActive
                             ? "bg-[#1F181E] border border-[#8B5CF6]/30 text-[#8B5CF6]"
                             : "bg-[#100F0D] border border-[#26231F] text-[#A4A29F] hover:bg-[#1F1D1A]"
                         }`}
                         onClick={() => setRecordFilter(filter.value as any)}
                       >
                         {filter.label}
                       </button>
                     );
                   })}
                </div>

                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A4A29F]" />
                  <input
                    placeholder="Buscar por persona, DNI o contexto..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="h-9 w-full rounded-lg pl-9 pr-4 text-xs bg-[#100F0D] border border-[#26231F] text-[#F9F7F3] outline-none focus:border-[#356C92] transition-colors"
                  />
                </div>
             </div>

             {/* Tabla */}
             <div className="overflow-x-auto rounded-xl border border-[#26231F] bg-[#100F0D]">
               {records.error && (
                 <div className="p-4"><PeopleErrorBlock message={records.error} onRetry={records.refresh} /></div>
               )}
               {!records.error && !records.loading && !records.access.canRead && (
                 <div className="p-4"><PeopleErrorBlock message={records.access.reason ?? "No tienes permisos."} onRetry={records.refresh} /></div>
               )}
               {(!records.error && records.access.canRead) && (
                 <DataTable
                   columns={columns}
                   data={filteredRows}
                   loading={records.loading}
                   emptyMessage={tableEmptyMessage}
                   className="!bg-transparent !border-0 !shadow-none rounded-none"
                 />
               )}
             </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Tarjeta Agenda de Hoy */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-6 flex flex-col min-h-[220px]">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-[#23211D] p-2.5 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#A4A29F]" />
               </div>
               <p className="text-sm font-medium text-[#F9F7F3]">Agenda de Hoy</p>
             </div>
             
             {agenda.length > 0 ? (
               <div className="space-y-3 overflow-y-auto pr-2">
                 {agenda.map(item => (
                   <div key={item.id} className="border-l-2 border-[#356C92] pl-3 py-1">
                     <p className="text-xs text-[#F9F7F3] font-medium truncate">{item.titulo}</p>
                     <p className="text-[10px] text-[#A4A29F]">
                       {new Date(item.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.fecha_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center py-4">
                 <p className="text-sm text-[#A4A29F] text-center max-w-xs mt-2">Sin actividades ni atenciones programadas para el día de hoy.</p>
               </div>
             )}
          </div>

          {/* Tarjeta Accesos Directos */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
             <h2 className="text-sm font-medium text-[#F9F7F3] mb-3">Accesos Directos</h2>
             <div className="space-y-2">
                <button 
                   className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]"
                   onClick={() => setRecordFilter("withoutRecord")}
                >
                   <span className="text-sm text-[#F9F7F3]">Fichas Pendientes</span>
                   <span className="bg-[#100F0D] text-xs px-2.5 py-1 rounded-md text-[#F9F7F3] border border-[#26231F] font-medium min-w-[28px] text-center">{withoutRecordCount}</span>
                </button>
                <button 
                   className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]"
                   onClick={() => setRecordFilter("withRecord")}
                >
                   <span className="text-sm text-[#F9F7F3]">Fichas Registradas</span>
                   <span className="bg-[#100F0D] text-xs px-2.5 py-1 rounded-md text-[#F9F7F3] border border-[#26231F] font-medium min-w-[28px] text-center">{withRecordCount}</span>
                </button>
                <button 
                   className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]"
                >
                   <span className="text-sm text-[#F9F7F3]">Auditoría de accesos</span>
                   <ChevronRight className="w-4 h-4 text-[#A4A29F]" />
                </button>
             </div>
          </div>
          
        </div>
      </div>
      
      {/* Modals */}
      <SensitiveAccessGateModal
        open={Boolean(gateTarget)}
        onClose={() => setGateTarget(null)}
        scope={gateTarget?.scope ?? scope}
        personName={gateTarget?.personName ?? "esta persona"}
        loggable={gateTarget?.loggable ?? false}
        onConfirm={openSensitiveDetail}
      />

      <SensitiveMedicalDetailModal
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        detail={detail.detail}
        loading={detail.loading}
        error={detail.error}
        onRetry={retryDetail}
        onEdit={() => {
          setIsDetailOpen(false);
          setIsFormOpen(true);
        }}
        canWrite={records.access.canWrite}
      />

      <SensitiveMedicalFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        detail={detail.detail}
        isSaving={mutations.isSaving}
        onSubmit={handleSaveSensitiveRecord}
      />
    </motion.div>
  );
}
