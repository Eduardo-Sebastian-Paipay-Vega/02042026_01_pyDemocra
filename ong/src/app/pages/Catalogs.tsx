import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Database, Eye } from "lucide-react";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useGovernanceCatalogs } from "../modules/governance/hooks/useGovernanceCatalogs";
import type {
  GovernanceCatalogEntryRow,
  GovernanceCatalogKey,
} from "../modules/governance/types";
import {
  GovernanceDetailField,
  GovernanceErrorBlock,
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

const DEFAULT_CATALOG: GovernanceCatalogKey = "public.cat_permissions";

const columns: Column<GovernanceCatalogEntryRow>[] = [
  {
    key: "primary",
    label: "Registro",
    render: (row) => (
      <div>
        <div style={{ color: "var(--t-text)" }}>{row.primaryValue}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.secondaryValue}
        </div>
      </div>
    ),
  },
  {
    key: "tertiary",
    label: "Detalle",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.tertiaryValue}
      </span>
    ),
  },
  {
    key: "support",
    label: "Soporte",
    render: (row) => <StatusDot variant="secondary">{row.supportLabel}</StatusDot>,
  },
];

export function Catalogs() {
  const [selectedCatalogKey, setSelectedCatalogKey] =
    useState<GovernanceCatalogKey>(DEFAULT_CATALOG);
  const [searchValue, setSearchValue] = useState("");
  const [detailRow, setDetailRow] = useState<GovernanceCatalogEntryRow | null>(null);

  const {
    catalogs,
    rows,
    selectedCatalog,
    catalogsLoading,
    rowsLoading,
    catalogsError,
    rowsError,
    refresh,
  } = useGovernanceCatalogs(selectedCatalogKey, searchValue);

  const selectedCatalogLabel = selectedCatalog?.label ?? "Catalogo";

  const summaryButtons = useMemo(
    () =>
      catalogs.map((catalog) => {
        const active = catalog.key === selectedCatalogKey;
        const label = `${catalog.label}${catalog.rowCount === null ? "" : ` (${catalog.rowCount})`}`;

        if (active) {
          return (
            <GradientButton
              key={catalog.key}
              size="sm"
              onClick={() => setSelectedCatalogKey(catalog.key)}
            >
              {label}
            </GradientButton>
          );
        }

        return (
          <OutlineButton
            key={catalog.key}
            size="sm"
            onClick={() => setSelectedCatalogKey(catalog.key)}
          >
            {label}
          </OutlineButton>
        );
      }),
    [catalogs, selectedCatalogKey]
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Catalogos"
          description="Explora catalogos reales del Core, ONG, RRHH y Comunicaciones. La vista exige `governance.catalogs.read`; solo se habilita escritura donde la BD la documenta y, en este corte, los catalogos expuestos siguen en consulta/detalle."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div className="space-y-1">
              <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                Los catalogos visibles provienen de tablas reales como
                {" "}
                <span style={{ color: "var(--t-text)" }}>public.cat_permissions</span>,
                {" "}
                <span style={{ color: "var(--t-text)" }}>ong.estados_voluntario</span> y
                {" "}
                <span style={{ color: "var(--t-text)" }}>comunicaciones.canales_notificacion</span>.
              </p>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                El script actual solo documenta politicas de lectura para estos catalogos y la UI valida `governance.catalogs.read`; por eso la vista es operativa en consulta y detalle, no en alta/edicion/baja.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {catalogsError && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock message={catalogsError} onRetry={refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          {catalogsLoading ? (
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Cargando catalogos...
            </p>
          ) : (
            summaryButtons
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder={`Buscar en ${selectedCatalogLabel.toLowerCase()}...`}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </motion.div>

      {selectedCatalog && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  {selectedCatalog.schemaName}.{selectedCatalog.tableName}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {selectedCatalog.description}
                </p>
              </div>
              <StatusDot variant="secondary">{selectedCatalog.statusLabel}</StatusDot>
            </div>
          </div>
        </motion.div>
      )}

      {rowsError && !catalogsError && (
        <motion.div variants={fadeUp}>
          <GovernanceErrorBlock message={rowsError} onRetry={refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={rows}
          loading={rowsLoading}
          emptyMessage="No se encontraron registros para el catalogo seleccionado."
          actions={[{ label: "Ver detalle", onClick: (row) => setDetailRow(row) }]}
        />
      </motion.div>

      <ModalShell
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        width="max-w-[760px]"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
                Detalle de catalogo
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                {detailRow?.catalogKey ?? selectedCatalogKey}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(detailRow?.fields ?? []).map((field) => (
              <GovernanceDetailField
                key={`${field.label}-${field.value}`}
                label={field.label}
                value={field.value}
              />
            ))}
          </div>

          {selectedCatalog && (
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
            >
              <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                Fuente documental
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                {selectedCatalog.sourceReference}
              </p>
            </div>
          )}
        </div>
      </ModalShell>
    </motion.div>
  );
}
