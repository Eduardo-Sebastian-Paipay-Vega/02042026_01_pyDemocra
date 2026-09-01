import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Eye, ShieldAlert, BookOpen } from "lucide-react";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { StatusDot } from '@/core/components/ui/status-dot';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
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
    return catalogs.reduce((acc, cat) => {
      if (!acc[cat.schemaName]) acc[cat.schemaName] = [];
      acc[cat.schemaName].push(cat);
      return acc;
    }, {} as Record<string, typeof catalogs>);
  }, [catalogs]);

  const columns: Column<GovernanceCatalogEntryRow>[] = useMemo(() => [
    {
      key: "primary",
      label: "Registro",
      render: (row) => (
        <div>
          <div style={{ color: "var(--t-text)" }} className="font-medium">{row.primaryValue}</div>
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
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
      key: "status",
      label: "Estado",
      render: (row) => {
        const activo = row.raw?.activo;
        if (typeof activo === "boolean") {
          return (
            <StatusDot variant={activo ? "success" : "secondary"}>
              {activo ? "Activo" : "Inactivo"}
            </StatusDot>
          );
        }
        return <span className="text-[12px] text-muted-foreground">-</span>;
      },
    }
  ], []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Diccionario de Datos"
          description="Explorador centralizado de catálogos y valores semilla del sistema."
          action={{ label: "Actualizar", onClick: refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <div className="space-y-1">
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--t-text-secondary)" }}>
                Los catálogos son diccionarios de datos gestionados por el sistema central. Por políticas de integridad corporativa, esta vista es de <strong>solo lectura</strong>. Su edición está deshabilitada para mantener la consistencia de las reglas de negocio.
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

      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-[320px] flex-shrink-0">
          <Select 
            value={selectedCatalogKey} 
            onValueChange={(val) => {
              setSelectedCatalogKey(val as GovernanceCatalogKey);
              setSearchValue("");
            }}
            disabled={catalogsLoading}
          >
            <SelectTrigger className="h-11">
              <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={catalogsLoading ? "Cargando catálogos..." : "Seleccionar catálogo"} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedCatalogs).map(([schema, cats]) => (
                <SelectGroup key={schema}>
                  <SelectLabel className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground">
                    ESQUEMA {schema}
                  </SelectLabel>
                  {cats.map((catalog) => (
                    <SelectItem key={catalog.key} value={catalog.key} className="text-[13px]">
                      {catalog.label} {catalog.rowCount !== null ? `(${catalog.rowCount})` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 w-full">
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
            className="rounded-xl px-4 py-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium" style={{ color: "var(--t-text)" }}>
                  {selectedCatalog.label}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {selectedCatalog.description}
                </p>
              </div>
              <Badge variant="secondary">Solo lectura</Badge>
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
          emptyMessage={`No se encontraron registros en ${selectedCatalogLabel.toLowerCase()}.`}
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
              <h3 className="text-[14px] font-medium" style={{ color: "var(--t-text)" }}>
                Detalle del registro
              </h3>
              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                {selectedCatalog?.label}
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
            
            {typeof detailRow?.raw?.activo === "boolean" && (
              <GovernanceDetailField
                label="Estado"
                value={detailRow.raw.activo ? "Activo" : "Inactivo"}
              />
            )}
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
