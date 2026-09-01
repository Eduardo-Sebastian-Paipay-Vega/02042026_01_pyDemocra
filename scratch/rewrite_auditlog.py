import json

path = 'D:/mela/02042026_01_pyDemocra/src/modules/ong/app/pages/AuditLog.tsx'

content = '''import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { FileText, History, ShieldAlert, Filter } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { StatusDot } from "@/core/components/ui/status-dot";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { useGovernanceAuditLog } from "../modules/governance/hooks/useGovernanceAuditLog";
import type { GovernanceAuditEvent } from "../modules/governance/types";
import {
  GovernanceDetailField,
  GovernanceErrorBlock,
  GovernanceJsonPreview,
  GovernancePermissionBadge,
  GovernanceSelectField,
} from "../modules/governance/components/governance-shared";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
} as const as any;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any },
  },
} as const as any;

const columns: Column<GovernanceAuditEvent>[] = [
  {
    key: "entity",
    label: "Entidad",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.schemaName}.{row.tableName}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.recordPk ? PK:  : ""}
        </div>
      </div>
    ),
  },
  {
    key: "operation",
    label: "Operacion",
    render: (row) => (
      <StatusDot
        variant={
          row.operation === "INSERT"
            ? "success"
            : row.operation === "DELETE"
              ? "destructive"
              : "warning"
        }
      >
        {row.operation}
      </StatusDot>
    ),
  },
  {
    key: "actor",
    label: "Actor",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.actorLabel}</div>
        <div style={{ color: "var(--t-text-dim)" }}>{row.sourceLabel}</div>
      </div>
    ),
  },
  {
    key: "date",
    label: "Fecha",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.occurredAtLabel}
      </span>
    ),
  },
];

export function AuditLog() {
  const [searchValue, setSearchValue] = useState("");
  const [schemaFilter, setSchemaFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [operationFilter, setOperationFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailRow, setDetailRow] = useState<GovernanceAuditEvent | null>(null);

  const filters = useMemo(
    () => ({
      searchTerm: searchValue,
      schemaName: schemaFilter,
      tableName: tableFilter,
      operation: operationFilter,
      actorId: actorFilter,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      limit: 180,
    }),
    [actorFilter, dateFrom, dateTo, operationFilter, schemaFilter, searchValue, tableFilter]
  );

  const { loading, error, data, refresh } = useGovernanceAuditLog(filters);

  const hasAccess = data.access.canReadAudit || data.access.isTenantAdmin;
  const showContent = !error && !loading && hasAccess;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Auditoria"
          description="Consulta bitacoras reales desde public.audit_logs y auditoria.audit_log, con filtros por entidad, actor, operacion y fecha."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      {!error && !loading && !hasAccess && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock
            message="Acceso Denegado. Se requiere el permiso governance.audit.read o ser tenant_admin para visualizar el historial."
            onRetry={refresh}
          />
        </motion.div>
      )}

      {showContent && (
        <>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full">
              <FilterBar
                searchPlaceholder="Buscar por entidad, PK, actor o fuente..."
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-xl border px-4 py-2 text-[12px] whitespace-nowrap h-10 transition-colors cursor-pointer hover:opacity-80"
                  style={{
                    borderColor: "var(--t-border)",
                    color: "var(--t-text)",
                    background: "var(--t-surface)",
                  }}
                >
                  <Filter className="h-4 w-4" /> Filtros Avanzados
                </button>
              </PopoverTrigger>
              <PopoverContent 
                align="end"
                className="w-80 p-4 space-y-4 rounded-2xl shadow-lg border outline-none" 
                style={{ borderColor: 'var(--t-border)', background: 'var(--t-surface)' }}
              >
                <div className="space-y-3">
                  <h4 className="font-medium text-[13px]" style={{ color: 'var(--t-text)' }}>Filtros de Auditoria</h4>
                  <GovernanceSelectField
                    value={schemaFilter}
                    onChange={setSchemaFilter}
                    options={data.schemaOptions}
                  />
                  <GovernanceSelectField
                    value={tableFilter}
                    onChange={setTableFilter}
                    options={data.tableOptions}
                  />
                  <GovernanceSelectField
                    value={operationFilter}
                    onChange={setOperationFilter}
                    options={[
                      { value: "all", label: "Operacion: Todas" },
                      { value: "INSERT", label: "INSERT" },
                      { value: "UPDATE", label: "UPDATE" },
                      { value: "DELETE", label: "DELETE" },
                    ]}
                  />
                  <GovernanceSelectField
                    value={actorFilter}
                    onChange={setActorFilter}
                    options={data.actorOptions}
                  />
                  
                  <div className="pt-2">
                    <label className="mb-1 block text-[11px] font-medium" style={{ color: "var(--t-text-dim)" }}>
                      Rango de fechas
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        className="ong-field-control flex-1 h-9 rounded-xl px-3 text-[12px] outline-none"
                        style={{
                          border: "1px solid var(--t-border-strong)",
                          background: "var(--t-input-bg)",
                          color: "var(--t-text)",
                        }}
                        title="Fecha Inicio"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                        className="ong-field-control flex-1 h-9 rounded-xl px-3 text-[12px] outline-none"
                        style={{
                          border: "1px solid var(--t-border-strong)",
                          background: "var(--t-input-bg)",
                          color: "var(--t-text)",
                        }}
                        title="Fecha Fin"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>

          <motion.div variants={fadeUp}>
            <DataTable
              columns={columns}
              data={data.rows}
              loading={loading}
              emptyMessage="No se encontraron eventos de auditoria con los filtros actuales."
              actions={[{ label: "Ver detalle", onClick: (row) => setDetailRow(row) }]}
            />
          </motion.div>
        </>
      )}

      <ModalShell
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        width="max-w-[980px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle de auditoria
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                {detailRow?.summary}
              </p>
            </div>
          </div>

          {detailRow && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <GovernanceDetailField
                  label="Entidad"
                  value={${detailRow.schemaName}.}
                />
                <GovernanceDetailField label="Operacion" value={detailRow.operation} />
                <GovernanceDetailField label="Registro" value={detailRow.recordPk ?? "-"} />
                <GovernanceDetailField label="Actor" value={detailRow.actorLabel} />
                <GovernanceDetailField label="Fecha" value={detailRow.occurredAtLabel} />
                <GovernanceDetailField label="Fuente" value={detailRow.sourceLabel} />
                <GovernanceDetailField label="IP" value={detailRow.ip ?? "-"} />
                <GovernanceDetailField label="User agent" value={detailRow.userAgent ?? "-"} />
                <GovernanceDetailField
                  label="Correlacion"
                  value={detailRow.correlationId ?? "-"}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                      Before / old_data
                    </p>
                  </div>
                  <GovernanceJsonPreview value={detailRow.oldData} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                    <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                      After / new_data
                    </p>
                  </div>
                  <GovernanceJsonPreview value={detailRow.newData} />
                </div>
              </div>
            </>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
}
'''

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

