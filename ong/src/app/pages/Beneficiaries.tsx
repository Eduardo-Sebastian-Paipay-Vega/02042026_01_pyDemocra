import { useMemo, useState, useDeferredValue } from "react";
import { motion } from "motion/react";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { useBeneficiaries } from "../modules/people/hooks/useBeneficiaries";
import { useBeneficiaryDetail } from "../modules/people/hooks/useBeneficiaryDetail";
import { useBeneficiaryMutations } from "../modules/people/hooks/useBeneficiaryMutations";
import {
  BeneficiaryDetailModal,
  BeneficiaryFormModal,
} from "../modules/people/components/BeneficiaryPanels";
import { PeopleErrorBlock } from "../modules/people/components/people-shared";
import type { BeneficiaryListRow, BeneficiaryProfileKind } from "../modules/people/types";

// Nuevos componentes de la refactorización
import { useBeneficiaryFilters } from "../modules/people/hooks/useBeneficiaryFilters";
import { useBulkSelection } from "../modules/people/hooks/useBulkSelection";
import { BeneficiariesTable } from "../modules/people/components/beneficiaries/BeneficiariesTable";
import { BulkActionsBar } from "../modules/people/components/beneficiaries/BulkActionsBar";
import { BeneficiaryDrawerPreview } from "../modules/people/components/beneficiaries/BeneficiaryDrawerPreview";
import { AdvancedFiltersModal } from "../modules/people/components/beneficiaries/AdvancedFiltersModal";

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function Beneficiaries() {
  const beneficiaries = useBeneficiaries();
  
  // Custom Hooks de Filtrado y Selección
  const { filters, updateFilter, filteredRows } = useBeneficiaryFilters(beneficiaries.rows);
  const bulkSelection = useBulkSelection<string>();

  // Estados de Modales y Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPreviewRow, setSelectedPreviewRow] = useState<BeneficiaryListRow | null>(null);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);

  const activeBeneficiaryId =
    selectedBeneficiaryId && (isDetailOpen || (isFormOpen && formMode === "edit"))
      ? selectedBeneficiaryId
      : null;
  const detail = useBeneficiaryDetail(activeBeneficiaryId);
  const mutations = useBeneficiaryMutations(() => {
    beneficiaries.refresh();
    detail.refresh();
  });

  const tableEmptyMessage = useMemo(() => {
    if (beneficiaries.rows.length === 0) {
      return "Aun no hay beneficiarios registrados en este tenant.";
    }
    return "No se encontraron beneficiarios con los filtros actuales.";
  }, [beneficiaries.rows.length]);

  const profileFilters = useMemo(
    () => [
      { label: "Todos", value: "all", active: filters.profileKind === "all" },
      { label: "General", value: "general", active: filters.profileKind === "general" },
      { label: "Niño", value: "child", active: filters.profileKind === "child" },
      { label: "Adulto mayor", value: "senior", active: filters.profileKind === "senior" },
    ],
    [filters.profileKind]
  );

  function openCreateModal() {
    setFormMode("create");
    setIsFormOpen(true);
  }

  function handleRowClick(row: BeneficiaryListRow) {
    setSelectedPreviewRow(row);
    setIsPreviewOpen(true);
  }
  
  function openFullDetail(id: string) {
    setSelectedBeneficiaryId(id);
    setIsDetailOpen(true);
  }

  function openEditModal() {
    if (!selectedBeneficiaryId) {
      return;
    }
    setFormMode("edit");
    setIsDetailOpen(false);
    setIsFormOpen(true);
  }

  async function handleSubmitForm(input: Parameters<typeof mutations.create>[0]) {
    const response =
      formMode === "edit" && selectedBeneficiaryId
        ? await mutations.update(selectedBeneficiaryId, input)
        : await mutations.create(input);

    if (!response) {
      return;
    }

    beneficiaries.upsertRow(response.beneficiary);
    detail.replace(response);
    updateFilter("search", "");
    updateFilter("profileKind", "all");
    toast.success(formMode === "edit" ? "Beneficiario actualizado." : "Beneficiario creado.");
    setSelectedBeneficiaryId(response.beneficiary.id);
    setIsFormOpen(false);
    setIsDetailOpen(true);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 relative">
      <BulkActionsBar 
        selectedCount={bulkSelection.count} 
        onExport={() => bulkSelection.clearSelection()}
        onAssignProject={() => {}}
        onStatusChange={() => {}}
      />
      
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title="Beneficiarios"
          description="Gestiona los perfiles de beneficiarios y sus datos clínicos asociados."
        />
        <div className="flex items-center gap-3">
          <button 
            onClick={beneficiaries.refresh}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="h-5 w-5" style={{ color: "var(--t-text-secondary)" }} />
          </button>
          <GradientButton size="sm" onClick={openCreateModal}>
            Nuevo beneficiario
          </GradientButton>
        </div>
      </motion.div>

      {beneficiaries.error && (
        <motion.div variants={fadeUp}>
          <PeopleErrorBlock message={beneficiaries.error} onRetry={beneficiaries.refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <FilterBar
            searchPlaceholder="Buscar por nombre, documento, perfil o género..."
            searchValue={filters.search}
            onSearchChange={(val) => updateFilter('search', val)}
            filters={profileFilters}
            onFilterClick={(value) => updateFilter('profileKind', value)}
          />
        </div>
        <AdvancedFiltersModal 
          filters={filters} 
          onUpdateFilter={updateFilter} 
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        {beneficiaries.error ? null : (
          <BeneficiariesTable
            data={filteredRows}
            loading={beneficiaries.loading}
            actions={[
              { label: "Ver detalle completo", onClick: (row: BeneficiaryListRow) => openFullDetail(row.id) }
            ]}
            onRowClick={handleRowClick}
            selectedIds={bulkSelection.selectedIds}
            onSelectionChange={bulkSelection.selectAll}
            emptyMessage={tableEmptyMessage}
          />
        )}
      </motion.div>

      {/* Sidebar Quick Preview */}
      <BeneficiaryDrawerPreview
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        beneficiary={selectedPreviewRow}
        onOpenFullDetail={openFullDetail}
      />

      {/* Full Modals */}
      <BeneficiaryDetailModal
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        detail={detail.detail}
        loading={detail.loading}
        error={detail.error}
        onRetry={detail.refresh}
        onEdit={openEditModal}
      />

      <BeneficiaryFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        detail={formMode === "edit" ? detail.detail : null}
        catalogs={beneficiaries.catalogs}
        isSaving={mutations.isSaving}
        onSubmit={handleSubmitForm}
      />
    </motion.div>
  );
}
