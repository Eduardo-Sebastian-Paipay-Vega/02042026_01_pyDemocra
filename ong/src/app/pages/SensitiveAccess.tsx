import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { LockKeyhole, ShieldAlert, UserRound } from "lucide-react";
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
        setConstraintError(validationError.errors[0].message);
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
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Accesos sensibles"
          description="Monitorea los accesos a información clínica sensible y gestiona las restricciones de acceso por rol."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <GovernancePermissionBadge
              allowed={data.access.canReadSensitiveAccess}
              allowedLabel="Lectura de log sensible"
              deniedLabel="Sin lectura de log sensible"
            />
            <GovernancePermissionBadge
              allowed={data.access.canManageConstraints}
              allowedLabel="Gestion de restricciones"
              deniedLabel="Sin gestion de restricciones"
            />
          </div>
          {data.warnings.length > 0 && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {data.warnings.join(" ")}
            </p>
          )}
          <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            El permiso de lectura sensible habilita la bitácora consolidada. Los permisos de gestión de roles controlan las restricciones de acceso.
          </p>
          {data.unsupportedFlows.map((item) => (
            <p key={item} className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {item}
            </p>
          ))}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock 
            message="Acceso Restringido. Necesitas permisos de Auditoría Clínica para ver esto." 
            onRetry={refresh} 
          />
        </motion.div>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Logs de Auditoría</TabsTrigger>
          <TabsTrigger value="constraints">Reglas de Restricción</TabsTrigger>
        </TabsList>
        <TabsContent value="logs">
      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Eventos de acceso sensible
            </h2>
          </div>

          {!error && !loading && !data.access.canReadSensitiveAccess && (
            <GovernanceErrorBlock
              message="Para revisar esta bitacora se requiere `governance.sensitive.read` o tenant admin."
              onRetry={refresh}
            />
          )}

          <div className="space-y-4">
            <FilterBar
              searchPlaceholder="Buscar por beneficiario, voluntario, documento, actor o motivo..."
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />

            <div className="flex flex-wrap gap-2">
              <GovernanceSelectField
                value={actorFilter}
                onChange={setActorFilter}
                options={data.actorOptions}
              />
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            <DataTable
              columns={logColumns}
              data={data.access.canReadSensitiveAccess ? data.logRows : []}
              loading={loading}
              emptyMessage="No se encontraron eventos de acceso sensible."
              actions={[{ label: "Ver detalle", onClick: (row) => setSelectedLog(row) }]}
            />
          </div>
        </div>
      </motion.div>

        </TabsContent>
        <TabsContent value="constraints">
      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
              <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Restricciones por rol
              </h2>
            </div>

            {data.access.canManageConstraints && (
              <GradientButton size="sm" onClick={openCreateConstraint}>
                Nueva restriccion
              </GradientButton>
            )}
          </div>

          {!error && !loading && !data.access.canReadConstraints && (
            <GovernanceErrorBlock
              message="No tienes permisos para visualizar las restricciones de acceso. Se requiere el permiso de gestión de roles o acceso de administrador."
              onRetry={refresh}
            />
          )}

          <div className="space-y-4">
            <FilterBar
              searchPlaceholder="Buscar por rol, sede, IP o horario..."
              searchValue={constraintSearch}
              onSearchChange={setConstraintSearch}
            />

            <DataTable
              columns={constraintColumns}
              data={data.access.canReadConstraints ? filteredConstraints : []}
              loading={loading}
              emptyMessage="No se encontraron restricciones de acceso."
              actions={
                data.access.canManageConstraints
                  ? [
                      { label: "Editar", onClick: (row) => openEditConstraint(row) },
                      {
                        label: "Eliminar",
                        onClick: (row) => setRemoveConstraint(row),
                        variant: "destructive",
                      },
                    ]
                  : []
              }
            />
          </div>
        </div>
      </motion.div>

        </TabsContent>
      </Tabs>

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
