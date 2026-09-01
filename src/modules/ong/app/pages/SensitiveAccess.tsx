import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import {  LockKeyhole, ShieldAlert, UserRound , Activity, Plus, BarChart2, Search, Calendar, Edit2, Trash2, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { DatePickerWithRange } from '@/core/components/ui/date-range-picker';
import { useSensitiveAccess } from "../modules/governance/hooks/useSensitiveAccess";
import { useRoleAccessConstraints } from "../modules/governance/hooks/useRoleAccessConstraints";
import type {
  RoleAccessConstraintFormInput,
  RoleAccessConstraintRow,
  SensitiveAccessLogRow,
} from "../modules/governance/types";
import {
  GovernanceDetailField,
  GovernanceErrorBlock,
  GovernancePermissionBadge,
  GovernanceSelectField,
} from "../modules/governance/components/governance-shared";
import {
  getConstraintScopeLabel,
  getConstraintSearchValue,
} from "../services/gobernanza/sensitiveAccess.service";
import { z } from "zod";

const constraintSchema = z.object({
  roleId: z.string().min(1, "El rol es obligatorio."),
  sedeId: z.string(),
  ipCidr: z.string().refine((val) => !val || /^[0-9a-fA-F.:/]+$/.test(val), {
    message: "El CIDR/IP contiene caracteres no válidos.",
  }),
  timeStart: z.string(),
  timeEnd: z.string(),
  requireTrustedDevice: z.boolean(),
}).refine((data) => {
  const { timeStart, timeEnd } = data;
  if ((timeStart && !timeEnd) || (!timeStart && timeEnd)) return false;
  return true;
}, {
  message: "Debes completar tanto la hora de inicio como la de fin.",
  path: ["timeEnd"]
}).refine((data) => {
  const { timeStart, timeEnd } = data;
  if (timeStart && timeEnd && timeEnd <= timeStart) return false;
  return true;
}, {
  message: "La hora fin debe ser mayor que la hora inicio.",
  path: ["timeEnd"]
});

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const satisfies Variants;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
} as const satisfies Variants;

const logColumns: Column<SensitiveAccessLogRow>[] = [
  {
    key: "beneficiary",
    label: "Recurso sensible",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.subjectName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.subjectDocument}
        </div>
        <div className="mt-1">
          <StatusDot variant="secondary">{row.resourceTypeLabel}</StatusDot>
        </div>
      </div>
    ),
  },
  {
    key: "actor",
    label: "Actor",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.actorLabel}
      </div>
    ),
  },
  {
    key: "reason",
    label: "Motivo",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.reason}
      </span>
    ),
  },
  {
    key: "date",
    label: "Fecha",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {row.accessedAtLabel}
        </span>
        <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.accessedAt ? `hace ${formatDistanceToNow(new Date(row.accessedAt), { locale: es })}` : ""}
        </span>
      </div>
    ),
  },
];

const constraintColumns: Column<RoleAccessConstraintRow>[] = [
  {
    key: "role",
    label: "Rol",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.roleName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.sedeName}
        </div>
      </div>
    ),
  },
  {
    key: "scope",
    label: "Restriccion",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {getConstraintScopeLabel(row)}
      </span>
    ),
  },
  {
    key: "network",
    label: "Red",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.ipCidr || "Sin filtro IP"}
      </span>
    ),
  },
  {
    key: "created",
    label: "Creado",
    render: (row) => (
      <div className="flex flex-col">
        <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          {row.createdAtLabel}
        </span>
        <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.createdAt ? `hace ${formatDistanceToNow(new Date(row.createdAt), { locale: es })}` : ""}
        </span>
      </div>
    ),
  },
];

function buildConstraintForm(
  row?: RoleAccessConstraintRow | null
): RoleAccessConstraintFormInput {
  return {
    roleId: row?.roleId ?? "",
    sedeId: row?.sedeId ?? "all",
    ipCidr: row?.ipCidr ?? "",
    timeStart: row?.timeStart ?? "",
    timeEnd: row?.timeEnd ?? "",
    requireTrustedDevice: row?.requireTrustedDevice ?? false,
  };
}

export function SensitiveAccess() {
  const [searchValue, setSearchValue] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [constraintSearch, setConstraintSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<SensitiveAccessLogRow | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<RoleAccessConstraintRow | null>(null);
  const [removeConstraint, setRemoveConstraint] = useState<RoleAccessConstraintRow | null>(null);
  const [constraintForm, setConstraintForm] = useState<RoleAccessConstraintFormInput>(
    buildConstraintForm()
  );
  const [constraintError, setConstraintError] = useState<string | null>(null);
  const [isConstraintModalOpen, setIsConstraintModalOpen] = useState(false);

  const filters = useMemo(
    () => {
      const formatDate = (d?: Date) => {
        if (!d) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        searchTerm: searchValue,
        actorId: actorFilter,
        dateFrom: dateRange?.from ? formatDate(dateRange.from) : null,
        dateTo: dateRange?.to ? formatDate(dateRange.to) : null,
        limit: 150,
      };
    },
    [actorFilter, dateRange, searchValue]
  );

  const { loading, error, data, refresh } = useSensitiveAccess(filters);
  const constraintMutations = useRoleAccessConstraints(refresh);

  const filteredConstraints = useMemo(() => {
    const normalized = constraintSearch.trim().toLowerCase();
    if (!normalized) {
      return data.constraints;
    }

    return data.constraints.filter((row) =>
      getConstraintSearchValue(row).includes(normalized)
    );
  }, [constraintSearch, data.constraints]);

  function openCreateConstraint() {
    setEditingConstraint(null);
    setConstraintForm(buildConstraintForm());
    setConstraintError(null);
    setIsConstraintModalOpen(true);
  }

  function openEditConstraint(row: RoleAccessConstraintRow) {
    setEditingConstraint(row);
    setConstraintForm(buildConstraintForm(row));
    setConstraintError(null);
    setIsConstraintModalOpen(true);
  }

  async function saveConstraint() {
    try {
      constraintSchema.parse(constraintForm);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setConstraintError(validationError.issues[0].message);
        return;
      }
    }

    try {
      if (editingConstraint) {
        await constraintMutations.update({
          constraintId: editingConstraint.id,
          ...constraintForm,
        });
        toast.success("Restriccion actualizada.");
      } else {
        await constraintMutations.create(constraintForm);
        toast.success("Restriccion registrada.");
      }

      setIsConstraintModalOpen(false);
    } catch (saveError) {
      setConstraintError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la restriccion."
      );
    }
  }

  async function confirmRemoveConstraint() {
    if (!removeConstraint) {
      return;
    }

    try {
      await constraintMutations.remove(removeConstraint.id);
      toast.success("Restriccion eliminada.");
      setRemoveConstraint(null);
    } catch (removeError) {
      toast.error(
        removeError instanceof Error
          ? removeError.message
          : "No se pudo eliminar la restriccion."
      );
    }
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="bg-[#100F0D] text-[#F9F7F3] min-h-screen p-6 font-sans sensitive-access-dashboard"
    >
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panel Principal</h1>
          <p className="text-sm text-[#A4A29F]">Gobernanza y Accesos Sensibles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="bg-[#171512] border border-[#26231F] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#1F1D1A] transition-colors flex items-center gap-2 text-[#F9F7F3]">
            Actualizar
          </button>
          {data.access.canManageConstraints && (
            <button onClick={openCreateConstraint} className="bg-[#356C92] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#356C92]/90 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Restricción
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <GovernanceErrorBlock message={error} onRetry={refresh} />
        </div>
      )}

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Columna Izquierda (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Fila de 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Total Accesos</h3>
              <p className="text-2xl font-bold text-white">{data.logRows.length}</p>
              <div className="absolute top-3 right-3 bg-[#161D17] text-[#08996A] border border-[#08996A]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Activity className="w-3 h-3" /> Vivo
              </div>
            </div>
            
            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Restricciones</h3>
              <p className="text-2xl font-bold text-white">{data.constraints.length}</p>
              <div className="absolute top-3 right-3 bg-[#1F181E] text-[#8B5CF6] border border-[#8B5CF6]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <LockKeyhole className="w-3 h-3" /> Activas
              </div>
            </div>
            
            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Alertas</h3>
              <p className="text-2xl font-bold text-white">{data.warnings.length}</p>
              <div className="absolute top-3 right-3 bg-[#231C11] text-[#D97706] border border-[#D97706]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {data.warnings.length > 0 ? "Revisar" : "Ok"}
              </div>
            </div>

            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Roles</h3>
              <p className="text-2xl font-bold text-white">{data.roleOptions.length}</p>
              <div className="absolute top-3 right-3 bg-[#161D17] text-[#08996A] border border-[#08996A]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                Seguro
              </div>
            </div>
          </div>

          {/* Tarjeta de Gráfico / Evolución */}
          <div className="h-[280px] bg-[#171512] border border-[#26231F] rounded-[12px] p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#8B5CF6]" />
              Evolución de Accesos
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center bg-[#23211D]/30 rounded-xl border border-dashed border-[#26231F]">
              <div className="bg-[#23211D] p-3 rounded-xl mb-3">
                <BarChart2 className="w-6 h-6 text-[#686561]" />
              </div>
              <p className="text-sm font-medium">Sin datos suficientes</p>
              <p className="text-xs text-[#A4A29F] text-center max-w-xs mt-1">
                No hay suficiente historial de eventos para generar la gráfica de evolución.
              </p>
            </div>
          </div>

          {/* Tarjeta de Feed en Vivo */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
             <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#08996A]" />
                Feed en Vivo
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#686561]" />
                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Buscar..."
                    className="h-8 rounded-lg pl-8 pr-3 text-xs outline-none bg-[#100F0D] border border-[#26231F] text-[#F9F7F3] placeholder-[#686561]"
                  />
                </div>
                <GovernanceSelectField
                  value={actorFilter}
                  onChange={setActorFilter}
                  options={data.actorOptions}
                />
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>
            </div>
            
            <div className="[&_th]:!bg-[#100F0D] [&_th]:!text-[#A4A29F] [&_th]:!border-[#26231F] [&_td]:!border-[#26231F] [&_tr:hover]:!bg-[#1F1D1A]">
              <DataTable
                columns={logColumns}
                data={data.logRows}
                loading={loading}
                emptyMessage="No se registraron accesos."
                onRowClick={(row) => setSelectedLog(row as any)}
              />
            </div>
          </div>

        </div>

        {/* Columna Derecha (1/3) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Tarjeta Accesos Directos */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
            <h2 className="text-sm font-semibold mb-4 text-[#F9F7F3]">Accesos Directos</h2>
            <div className="space-y-2">
              <button 
                onClick={openCreateConstraint}
                disabled={!data.access.canManageConstraints}
                className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-[#23211D] p-1.5 rounded-md">
                    <Plus className="w-4 h-4 text-[#A4A29F]" />
                  </div>
                  <span className="text-sm font-medium text-[#F9F7F3]">Nueva Restricción</span>
                </div>
                <div className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F]">
                  <LockKeyhole className="w-3 h-3" />
                </div>
              </button>

              <button 
                onClick={refresh}
                className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-lg p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-[#23211D] p-1.5 rounded-md">
                    <Activity className="w-4 h-4 text-[#A4A29F]" />
                  </div>
                  <span className="text-sm font-medium text-[#F9F7F3]">Recargar Datos</span>
                </div>
                <div className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F]">
                  <Activity className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>

          {/* Tarjeta Agenda de Hoy (Restricciones) */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#356C92]" />
                Agenda de Hoy
              </h2>
            </div>
            
            {data.constraints.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#23211D]/30 rounded-xl border border-dashed border-[#26231F] py-8">
                <div className="bg-[#23211D] p-3 rounded-xl mb-3">
                  <LockKeyhole className="w-6 h-6 text-[#686561]" />
                </div>
                <p className="text-sm font-medium">Sin restricciones</p>
                <p className="text-xs text-[#A4A29F] text-center mt-1">
                  No hay políticas activas en la agenda.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-none">
                {data.constraints.map((c) => (
                  <div key={c.id} className="bg-[#1F1D1A]/50 hover:bg-[#1F1D1A] transition-colors p-3 rounded-lg border border-[#26231F]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-white">{c.roleName}</span>
                      <div className="flex gap-1">
                        {data.access.canManageConstraints && (
                          <>
                            <button onClick={() => openEditConstraint(c)} className="text-[#A4A29F] hover:text-[#356C92]"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => setRemoveConstraint(c)} className="text-[#A4A29F] hover:text-[#ef4444]"><Trash2 className="w-3 h-3" /></button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-[#A4A29F] flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {c.timeStart && c.timeEnd ? c.timeStart + " - " + c.timeEnd : "24 horas"}
                    </div>
                    <div className="text-[11px] text-[#A4A29F] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {c.sedeName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
<ModalShell
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        width="max-w-[760px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle de acceso sensible
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                {selectedLog?.sourceTable ?? "Bitacora sensible"}
              </p>
            </div>
          </div>

          {selectedLog && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <GovernanceDetailField label="Tipo de recurso" value={selectedLog.resourceTypeLabel} />
              <GovernanceDetailField label="Registro sensible" value={selectedLog.recordId} />
              <GovernanceDetailField label="Sujeto" value={selectedLog.subjectName} />
              <GovernanceDetailField label="Documento" value={selectedLog.subjectDocument} />
              <GovernanceDetailField label="Actor" value={selectedLog.actorLabel} />
              <GovernanceDetailField label="Fecha" value={selectedLog.accessedAtLabel} />
              <GovernanceDetailField label="Motivo" value={selectedLog.reason} />
              <GovernanceDetailField label="IP" value={selectedLog.ip} />
              <GovernanceDetailField label="User agent" value={selectedLog.userAgent} />
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={isConstraintModalOpen}
        onClose={() => setIsConstraintModalOpen(false)}
        width="max-w-[760px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                {editingConstraint ? "Editar restriccion" : "Nueva restriccion"}
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Restricción de acceso por rol y sede.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px]"
              onClick={() => setIsConstraintModalOpen(false)}
            >
              X
            </button>
          </div>

          {constraintError && (
            <GovernanceErrorBlock
              message={constraintError}
              onRetry={() => setConstraintError(null)}
            />
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <GovernanceSelectField
              value={constraintForm.roleId}
              onChange={(value) => setConstraintForm((current) => ({ ...current, roleId: value }))}
              options={
                data.roleOptions.length
                  ? data.roleOptions
                  : [{ value: "", label: "Sin roles disponibles" }]
              }
            />
            <GovernanceSelectField
              value={constraintForm.sedeId}
              onChange={(value) => setConstraintForm((current) => ({ ...current, sedeId: value }))}
              options={data.sedeOptions}
            />
            <input
              value={constraintForm.ipCidr}
              onChange={(event) =>
                setConstraintForm((current) => ({ ...current, ipCidr: event.target.value }))
              }
              placeholder="CIDR o IP permitida"
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              <input
                type="checkbox"
                checked={constraintForm.requireTrustedDevice}
                onChange={(event) =>
                  setConstraintForm((current) => ({
                    ...current,
                    requireTrustedDevice: event.target.checked,
                  }))
                }
              />
              Requiere dispositivo confiable
            </label>
            <input
              type="time"
              value={constraintForm.timeStart}
              onChange={(event) =>
                setConstraintForm((current) => ({ ...current, timeStart: event.target.value }))
              }
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
            <input
              type="time"
              value={constraintForm.timeEnd}
              onChange={(event) =>
                setConstraintForm((current) => ({ ...current, timeEnd: event.target.value }))
              }
              className="h-9 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
          </div>

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={saveConstraint}
              disabled={constraintMutations.isCreating || constraintMutations.isUpdating}
            >
              {constraintMutations.isCreating || constraintMutations.isUpdating
                ? "Guardando..."
                : "Guardar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setIsConstraintModalOpen(false)}
              disabled={constraintMutations.isCreating || constraintMutations.isUpdating}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(removeConstraint)}
        onClose={() => setRemoveConstraint(null)}
        width="max-w-[520px]"
      >
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
            {removeConstraint
              ? `Eliminar la restriccion del rol ${removeConstraint.roleName}?`
              : "Confirma la eliminacion de la restriccion."}
          </p>
          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={confirmRemoveConstraint}
              disabled={constraintMutations.isRemoving}
            >
              {constraintMutations.isRemoving ? "Eliminando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRemoveConstraint(null)}
              disabled={constraintMutations.isRemoving}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    
    </motion.div>
  );
}
