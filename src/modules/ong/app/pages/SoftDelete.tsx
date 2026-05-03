import { useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { ArchiveRestore, ArchiveX, ShieldAlert, Trash2 } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "../components/ui/modal-shell";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
import { useGovernanceRetention } from "../modules/governance/hooks/useGovernanceRetention";
import { useGovernanceRestore } from "../modules/governance/hooks/useGovernanceRestore";
import type {
  GovernanceAuditEvent,
  GovernanceRestoreCandidateRow,
} from "../modules/governance/types";
import {
  GovernanceErrorBlock,
  GovernancePermissionBadge,
} from "../modules/governance/components/governance-shared";

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

const deleteColumns: Column<GovernanceAuditEvent>[] = [
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
    key: "actor",
    label: "Actor",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.actorLabel}
      </span>
    ),
  },
  {
    key: "source",
    label: "Fuente",
    render: (row) => <StatusDot variant="warning">{row.sourceLabel}</StatusDot>,
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

const restoreColumns: Column<GovernanceRestoreCandidateRow>[] = [
  {
    key: "entity",
    label: "Entidad",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.entityLabel}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.schemaName}.{row.tableName}
        </div>
      </div>
    ),
  },
  {
    key: "scope",
    label: "Alcance",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.scopeLabel}
      </span>
    ),
  },
  {
    key: "deletedBy",
    label: "Eliminado por",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.deletedByLabel}
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.deletedAtLabel}
        </div>
      </div>
    ),
  },
];

export function SoftDelete() {
  const [restoreTarget, setRestoreTarget] = useState<GovernanceRestoreCandidateRow | null>(null);
  const { loading, error, data, refresh } = useGovernanceRetention();
  const restoreMutations = useGovernanceRestore(refresh);

  async function confirmRestore() {
    if (!restoreTarget) {
      return;
    }

    try {
      await restoreMutations.restore(restoreTarget);
      toast.success("Registro restaurado.");
      setRestoreTarget(null);
    } catch (restoreError) {
      toast.error(
        restoreError instanceof Error
          ? restoreError.message
          : "No se pudo restaurar el registro."
      );
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Retencion y borrado"
          description="Revisa la ventana real de retencion por plan, los registros soft deleted restaurables en whitelist y la trazabilidad de DELETE consolidada en bitacoras reales."
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
              allowed={data.access.canReadRetention}
              allowedLabel="Lectura de retencion"
              deniedLabel="Sin governance.retention.read"
            />
            <GovernancePermissionBadge
              allowed={data.canRestoreRecords}
              allowedLabel="Restore whitelist"
              deniedLabel="Restore solo tenant admin"
            />
          </div>
          {data.warnings.length > 0 && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {data.warnings.join(" ")}
            </p>
          )}
          <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            Ventana de retencion actual: {data.retentionPolicyLabel}. Si `public.tenants` o `public.plan_policies` no estan expuestos, la vista degrada con warning sin inventar valores.
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock message={error} onRetry={refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ArchiveX className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Estado real del soporte
            </h2>
          </div>

          <div className="space-y-3">
            {data.supportNotes.map((note) => (
              <div
                key={note}
                className="rounded-xl px-3 py-2"
                style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
              >
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                    {note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ArchiveRestore className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Registros restaurables
            </h2>
          </div>

          {!error && !loading && !data.access.canReadRetention && (
            <GovernanceErrorBlock
              message="La pagina requiere `governance.retention.read` o tenant admin para exponer restore y retencion."
              onRetry={refresh}
            />
          )}

          <DataTable
            columns={restoreColumns}
            data={data.access.canReadRetention ? data.restoreCandidates : []}
            loading={loading}
            emptyMessage="No se encontraron registros soft deleted dentro de la whitelist de restore."
            actions={
              data.canRestoreRecords
                ? [
                    {
                      label: "Restaurar",
                      onClick: (row) => setRestoreTarget(row),
                    },
                  ]
                : []
            }
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Trash2 className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <h2 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Eventos DELETE detectados
            </h2>
          </div>

          {!error && !loading && !data.access.canReadRetention && (
            <GovernanceErrorBlock
              message="La pagina requiere `governance.retention.read` o tenant admin para exponer eventos DELETE."
              onRetry={refresh}
            />
          )}

          <DataTable
            columns={deleteColumns}
            data={data.access.canReadRetention ? data.recentDeleteEvents : []}
            loading={loading}
            emptyMessage="No se encontraron eventos DELETE recientes en las bitacoras reales."
          />
        </div>
      </motion.div>

      <ModalShell
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        width="max-w-[620px]"
      >
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
              Restaurar registro
            </h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              La restauracion limpia `is_deleted`, `deleted_at` y `deleted_by` sobre la whitelist real de tablas con soft delete.
            </p>
          </div>

          <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {restoreTarget
              ? `Se restaurara ${restoreTarget.entityLabel.toLowerCase()} de ${restoreTarget.schemaName}.${restoreTarget.tableName}.`
              : "Confirma la restauracion del registro."}
          </p>

          {restoreTarget && (
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Fuente documental
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                {restoreTarget.sourceReference}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <GradientButton
              size="sm"
              onClick={() => void confirmRestore()}
              disabled={restoreMutations.isRestoring}
            >
              {restoreMutations.isRestoring ? "Restaurando..." : "Confirmar"}
            </GradientButton>
            <OutlineButton
              size="sm"
              onClick={() => setRestoreTarget(null)}
              disabled={restoreMutations.isRestoring}
            >
              Cancelar
            </OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
