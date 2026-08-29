import { useState } from "react";
import { motion } from "motion/react";
import { Database, Eye, Library } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { StatusDot } from "@/core/components/ui/status-dot";
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
} as const as any;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any },
  },
} as const as any;

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

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Catalogos"
          description="Explora catalogos reales y diccionarios de datos del sistema. La vista exige \`governance.catalogs.read\`."
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
              <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                Los catalogos son diccionarios de datos gestionados por el sistema central.
              </p>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Por politicas de integridad, esta vista es de solo lectura. Su edicion esta deshabilitada para mantener la consistencia de las reglas de negocio en toda la plataforma.
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

      <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-[320px]">
          {catalogsLoading ? (
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Cargando catalogos...
            </p>
          ) : (
            <Select 
              value={selectedCatalogKey} 
              onValueChange={(val) => setSelectedCatalogKey(val as GovernanceCatalogKey)}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
                  <SelectValue placeholder="Selecciona un catalogo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {catalogs.map((catalog) => (
                  <SelectItem key={catalog.key} value={catalog.key}>
                    {catalog.label} {catalog.rowCount !== null ? `(${catalog.rowCount})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="w-full sm:max-w-[400px]">
          <FilterBar
            searchPlaceholder={`Buscar en ${selectedCatalogLabel.toLowerCase()}...`}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </div>
      </motion.div>

      {selectedCatalog && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--t-text)" }}>
                  {selectedCatalog.label}
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
        </div>
      </ModalShell>
    </motion.div>
  );
}

