import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Database, Eye, Library } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { ModalShell } from "@/core/components/ui/modal-shell";
import { StatusDot } from "@/core/components/ui/status-dot";
import { StatusPill } from "@/core/components/ui/status-pill";
import { useGovernanceCatalogs } from "../modules/governance/hooks/useGovernanceCatalogs";
import type {
  GovernanceCatalogEntryRow,
  GovernanceCatalogKey,
  GovernanceCatalogSummaryRow,
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

  const selectedCatalogLabel = selectedCatalog?.label ?? "Catálogo";

  const groupedCatalogs = useMemo(() => {
    return catalogs.reduce((acc, catalog) => {
      const schema = catalog.schemaName || "public";
      if (!acc[schema]) acc[schema] = [];
      acc[schema].push(catalog);
      return acc;
    }, {} as Record<string, GovernanceCatalogSummaryRow[]>);
  }, [catalogs]);

  const columns: Column<GovernanceCatalogEntryRow>[] = [
    {
      key: "primary",
      label: "Registro",
      render: (row) => {
        // Evaluate if there is an active/inactive boolean field
        const hasActiveField = 'activo' in row.raw;
        const isActive = hasActiveField ? Boolean(row.raw['activo']) : null;

        return (
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--t-text)" }}>{row.primaryValue}</span>
              {hasActiveField && (
                <StatusPill status={isActive ? "active" : "inactive"}>
                  {isActive ? "Activo" : "Inactivo"}
                </StatusPill>
              )}
            </div>
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
              {row.secondaryValue}
            </div>
          </div>
        );
      },
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
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end pr-2">
          <button
            type="button"
            onClick={() => setDetailRow(row)}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 opacity-60 hover:opacity-100 hover:bg-[var(--t-active)]"
            style={{ color: "var(--t-text-dim)" }}
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Catálogos"
          description="Explora los diccionarios de datos y valores predeterminados del sistema."
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
                Los catálogos son diccionarios de datos gestionados por el sistema central.
              </p>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Por políticas de integridad, esta vista es de solo lectura. Su edición está deshabilitada para mantener la consistencia de las reglas de negocio en toda la plataforma.
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

      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
          <div className="space-y-1 px-1">
            <h3 className="text-[14px] font-medium" style={{ color: "var(--t-text)" }}>Dominios</h3>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Selecciona un dominio de datos.
            </p>
          </div>

          {catalogsLoading ? (
            <p className="text-[12px] px-1" style={{ color: "var(--t-text-dim)" }}>
              Cargando catálogos...
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCatalogs).map(([schema, schemaCatalogs]) => (
                <div key={schema} className="space-y-1">
                  <h4 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--t-text-dim)" }}>
                    {schema === "public" ? "Core" : schema}
                  </h4>
                  <div className="space-y-0.5">
                    {schemaCatalogs.map(catalog => (
                      <button
                        key={catalog.key}
                        onClick={() => {
                          setSelectedCatalogKey(catalog.key);
                          setSearchValue(""); // Reset search when switching catalogs
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[13px] transition-colors ${
                          selectedCatalogKey === catalog.key
                            ? "font-medium"
                            : "hover:bg-[var(--t-surface-hover)] text-[var(--t-text-secondary)]"
                        }`}
                        style={{
                          backgroundColor: selectedCatalogKey === catalog.key ? "var(--t-primary)" : undefined,
                          color: selectedCatalogKey === catalog.key ? "#ffffff" : undefined,
                        }}
                      >
                        <span className="truncate pr-2">{catalog.label}</span>
                        {catalog.rowCount !== null && (
                          <span 
                            className="text-[11px] px-1.5 py-0.5 rounded-md" 
                            style={{ 
                              backgroundColor: selectedCatalogKey === catalog.key ? "rgba(255,255,255,0.2)" : "var(--t-hover)",
                              color: selectedCatalogKey === catalog.key ? "#ffffff" : "var(--t-text-tertiary)"
                            }}
                          >
                            {catalog.rowCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--t-text)" }}>
                {selectedCatalog?.label ?? "Catálogo"}
              </h2>
              <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>
                {selectedCatalog?.description ?? "Cargando..."}
              </p>
            </div>
            
            <div className="w-full sm:w-[320px]">
              <FilterBar
                searchPlaceholder={`Buscar en ${selectedCatalogLabel.toLowerCase()}...`}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
            </div>
          </div>

          {rowsError && !catalogsError && (
            <GovernanceErrorBlock message={rowsError} onRetry={refresh} />
          )}

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--t-border)", background: "var(--t-surface)" }}>
            <DataTable
              columns={columns}
              data={rows}
              loading={rowsLoading}
              emptyMessage="No se encontraron registros para el catálogo seleccionado."
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
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
                Detalle de registro
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

