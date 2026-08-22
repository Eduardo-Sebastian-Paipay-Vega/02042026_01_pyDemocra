import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { FileText, History, ShieldAlert } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { StatusDot } from "@/core/components/ui/status-dot";
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
          PK: {row.recordPk ?? "Sin PK"}
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Auditoria"
          description="Consulta bitacoras reales desde public.audit_logs y auditoria.audit_log, con filtros por entidad, actor, operacion y fecha."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <History className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <GovernancePermissionBadge
              allowed={data.access.canReadAudit}
              allowedLabel="Lectura audit habilitada"
              deniedLabel="Sin governance.audit.read"
            />
            <GovernancePermissionBadge
              allowed={data.access.isTenantAdmin}
              allowedLabel="Tenant admin"
              deniedLabel="Sin tenant admin"
            />
          </div>
          {data.warnings.length > 0 && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {data.warnings.join(" ")}
            </p>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      {!error && !loading && !data.access.canReadAudit && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock
            message="La bitacora real requiere `governance.audit.read` o tenant admin."
            onRetry={refresh}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por entidad, PK, actor o fuente..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex flex-wrap gap-3">
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
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="ong-field-control h-10 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border-strong)",
                background: "var(--t-input-bg)",
                color: "var(--t-text)",
              }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="ong-field-control h-10 rounded-xl px-3 text-[12px] outline-none"
              style={{
                border: "1px solid var(--t-border-strong)",
                background: "var(--t-input-bg)",
                color: "var(--t-text)",
              }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={data.access.canReadAudit ? data.rows : []}
          loading={loading}
          emptyMessage="No se encontraron eventos de auditoria con los filtros actuales."
          actions={[{ label: "Ver detalle", onClick: (row) => setDetailRow(row) }]}
        />
      </motion.div>

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
                  value={`${detailRow.schemaName}.${detailRow.tableName}`}
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

