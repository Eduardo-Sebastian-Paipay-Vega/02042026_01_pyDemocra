import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { StatusDot } from "@/core/components/ui/status-dot";
import { useBeneficiaries } from "../modules/people/hooks/useBeneficiaries";
import { useBeneficiaryDetail } from "../modules/people/hooks/useBeneficiaryDetail";
import { useBeneficiaryMutations } from "../modules/people/hooks/useBeneficiaryMutations";
import {
  BeneficiaryDetailModal,
  BeneficiaryFormModal,
} from "../modules/people/components/BeneficiaryPanels";
import { PeopleErrorBlock, formatPeopleDate } from "../modules/people/components/people-shared";
import type { BeneficiaryListRow, BeneficiaryProfileKind } from "../modules/people/types";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const columns: Column<BeneficiaryListRow>[] = [
  {
    key: "fullName",
    label: "Beneficiario",
    render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          <span style={{ color: "var(--t-text)" }}>{row.fullName}</span>
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.documentLabel}
        </div>
      </div>
    ),
  },
  {
    key: "profile",
    label: "Perfil",
    render: (row) => <StatusDot variant="info">{row.profileLabel}</StatusDot>,
  },
  {
    key: "tracking",
    label: "Relacion",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.projectCount} proyectos</div>
        <div>{row.hasMedicalRecord ? `${row.medicalRecordCount} fichas` : "Sin ficha medica"}</div>
      </div>
    ),
  },
  {
    key: "updatedAt",
    label: "Actualizado",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {formatPeopleDate(row.updatedAt)}
      </span>
    ),
  },
];

export function Beneficiaries() {
  const [searchValue, setSearchValue] = useState("");
  const [profileFilter, setProfileFilter] = useState<"all" | BeneficiaryProfileKind>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);

  const beneficiaries = useBeneficiaries();
  const activeBeneficiaryId =
    selectedBeneficiaryId && (isDetailOpen || (isFormOpen && formMode === "edit"))
      ? selectedBeneficiaryId
      : null;
  const detail = useBeneficiaryDetail(activeBeneficiaryId);
  const mutations = useBeneficiaryMutations();

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    return beneficiaries.rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.fullName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        row.profileLabel.toLowerCase().includes(term) ||
        row.genderLabel.toLowerCase().includes(term);
      const matchesProfile = profileFilter === "all" || row.profileKind === profileFilter;
      return matchesSearch && matchesProfile;
    });
  }, [beneficiaries.rows, profileFilter, searchValue]);

  const tableEmptyMessage = useMemo(() => {
    if (beneficiaries.rows.length === 0) {
      return "Aun no hay beneficiarios registrados en este tenant.";
    }

    return "No se encontraron beneficiarios con los filtros actuales.";
  }, [beneficiaries.rows.length]);

  const filters = useMemo(
    () => [
      { label: "Todos", value: "all", active: profileFilter === "all" },
      { label: "General", value: "general", active: profileFilter === "general" },
      { label: "Nino", value: "child", active: profileFilter === "child" },
      { label: "Adulto mayor", value: "senior", active: profileFilter === "senior" },
    ],
    [profileFilter]
  );

  function openCreateModal() {
    setFormMode("create");
    setIsFormOpen(true);
  }

  function openDetailModal(row: BeneficiaryListRow) {
    setSelectedBeneficiaryId(row.id);
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
    setSearchValue("");
    setProfileFilter("all");
    toast.success(formMode === "edit" ? "Beneficiario actualizado." : "Beneficiario creado.");
    setSelectedBeneficiaryId(response.beneficiary.id);
    setIsFormOpen(false);
    setIsDetailOpen(true);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Beneficiarios"
          description="Gestion real de perfiles y relaciones asociadas de beneficiarios en la nueva BD multi-esquema."
          action={{ label: "Actualizar", onClick: beneficiaries.refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <GradientButton size="sm" onClick={openCreateModal}>
          Nuevo beneficiario
        </GradientButton>
      </motion.div>

      {beneficiaries.error && (
        <motion.div variants={fadeUp}>
          <PeopleErrorBlock message={beneficiaries.error} onRetry={beneficiaries.refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por nombre, documento, perfil o genero..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filters}
          onFilterClick={(value) => setProfileFilter(value as "all" | BeneficiaryProfileKind)}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        {beneficiaries.error ? null : (
          <DataTable
            columns={columns}
            data={filteredRows}
            loading={beneficiaries.loading}
            actions={[{ label: "Ver detalle", onClick: openDetailModal }]}
            emptyMessage={tableEmptyMessage}
          />
        )}
      </motion.div>

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
