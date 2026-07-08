import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router";
import { Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { GradientButton } from "../components/ui/gradient-button";
import { StatusDot } from "../components/ui/status-dot";
import { useVolunteers } from "../modules/people/hooks/useVolunteers";
import { useVolunteerDetail } from "../modules/people/hooks/useVolunteerDetail";
import { useVolunteerMutations } from "../modules/people/hooks/useVolunteerMutations";
import {
  VolunteerDeactivateModal,
  VolunteerDetailModal,
  VolunteerFormModal,
} from "../modules/people/components/VolunteerPanels";
import { PeopleErrorBlock, formatPeopleDate, formatPeopleText } from "../modules/people/components/people-shared";
import type { PeopleRecordStatusKind, VolunteerListRow } from "../modules/people/types";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const columns: Column<VolunteerListRow>[] = [
  {
    key: "fullName",
    label: "Voluntario",
    render: (row) => (
      <div className="flex items-center gap-3">
        {row.photoUrl ? (
          <img
            src={row.photoUrl}
            alt={row.fullName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            style={{ border: "1px solid var(--t-border)" }}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--t-hover)" }}
          >
            <UserRound className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
          </div>
        )}
        <div>
          <div style={{ color: "var(--t-text)" }}>{row.fullName}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {row.documentLabel}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "contact",
    label: "Contacto",
    render: (row) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          <span style={{ color: "var(--t-text-secondary)" }}>{formatPeopleText(row.email)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          <span style={{ color: "var(--t-text-dim)" }}>{formatPeopleText(row.phone)}</span>
        </div>
      </div>
    ),
  },
  {
    key: "state",
    label: "Estado",
    render: (row) => <StatusDot variant={row.stateVariant}>{row.stateLabel}</StatusDot>,
  },
  {
    key: "metrics",
    label: "Operacion",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.approvedHours} h aprobadas</div>
        <div>{row.projectCount} proyectos / {row.activityCount} actividades</div>
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

export function Volunteers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | PeopleRecordStatusKind>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const volunteerIdParam = searchParams.get("volunteerId");

  const volunteers = useVolunteers();
  const tenantBootstrap = useTenantBootstrap();
  const canManageVolunteers = tenantBootstrap.hasAnyPermission([
    "volunteers.register",
    "volunteers.invite",
    "admission.manage",
  ]);
  const activeVolunteerId =
    selectedVolunteerId && (isDetailOpen || (isFormOpen && formMode === "edit"))
      ? selectedVolunteerId
      : null;
  const detail = useVolunteerDetail(activeVolunteerId);
  const mutations = useVolunteerMutations(() => {
    volunteers.refresh();
    detail.refresh();
  });

  useEffect(() => {
    if (!volunteerIdParam) {
      return;
    }

    setSelectedVolunteerId(volunteerIdParam);
    setIsDetailOpen(true);
  }, [volunteerIdParam]);

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    return volunteers.rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.fullName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.phone.toLowerCase().includes(term) ||
        row.stateLabel.toLowerCase().includes(term);
      const matchesState = stateFilter === "all" || row.stateKind === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [searchValue, stateFilter, volunteers.rows]);

  const tableEmptyMessage = useMemo(() => {
    if (volunteers.rows.length === 0) {
      return "Aun no hay voluntarios registrados en este tenant.";
    }

    return "No se encontraron voluntarios con los filtros actuales.";
  }, [volunteers.rows.length]);

  const filters = useMemo(
    () => [
      { label: "Todos", value: "all", active: stateFilter === "all" },
      { label: "Activos", value: "active", active: stateFilter === "active" },
      { label: "Pendientes", value: "pending", active: stateFilter === "pending" },
      { label: "Inactivos", value: "inactive", active: stateFilter === "inactive" },
    ],
    [stateFilter]
  );

  function openCreateModal() {
    if (!canManageVolunteers) {
      toast.error("No tienes permisos para registrar o editar voluntarios.");
      return;
    }
    setFormMode("create");
    setIsFormOpen(true);
  }

  function openDetailModal(row: VolunteerListRow) {
    setSelectedVolunteerId(row.id);
    setIsDetailOpen(true);
  }

  function closeDetailModal() {
    setIsDetailOpen(false);
    if (!volunteerIdParam) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("volunteerId");
    setSearchParams(next, { replace: true });
  }

  function openEditModal() {
    if (!canManageVolunteers) {
      toast.error("No tienes permisos para editar voluntarios.");
      return;
    }
    if (!selectedVolunteerId) {
      return;
    }
    setFormMode("edit");
    setIsDetailOpen(false);
    setIsFormOpen(true);
  }

  async function handleSubmitForm(input: Parameters<typeof mutations.create>[0]) {
    const response =
      formMode === "edit" && selectedVolunteerId
        ? await mutations.update(selectedVolunteerId, input)
        : await mutations.create(input);

    if (!response) {
      return;
    }

    volunteers.upsertRow(response.volunteer);
    detail.replace(response);
    setSearchValue("");
    setStateFilter("all");
    toast.success(formMode === "edit" ? "Voluntario actualizado." : "Voluntario creado.");
    setSelectedVolunteerId(response.volunteer.id);
    setIsFormOpen(false);
    setIsDetailOpen(true);
  }

  async function handleDeactivateVolunteer() {
    if (!selectedVolunteerId) {
      return;
    }

    const response = await mutations.deactivate(selectedVolunteerId);
    if (!response) {
      return;
    }

    volunteers.upsertRow(response.volunteer);
    detail.replace(response);
    toast.success("Voluntario desactivado.");
    setIsDeactivateOpen(false);
    setIsDetailOpen(true);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Voluntarios"
          description="Administra los perfiles de voluntarios con sus habilidades, roles y documentación."
          action={{ label: "Actualizar", onClick: volunteers.refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        {canManageVolunteers && (
          <GradientButton size="sm" onClick={openCreateModal}>
            Nuevo voluntario
          </GradientButton>
        )}
      </motion.div>

      {volunteers.error && (
        <motion.div variants={fadeUp}>
          <PeopleErrorBlock message={volunteers.error} onRetry={volunteers.refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por nombre, documento, correo, telefono o estado..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filters}
          onFilterClick={(value) => setStateFilter(value as "all" | PeopleRecordStatusKind)}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        {volunteers.error ? null : (
          <DataTable
            columns={columns}
            data={filteredRows}
            loading={volunteers.loading}
            actions={[{ label: "Ver detalle", onClick: openDetailModal }]}
            emptyMessage={tableEmptyMessage}
          />
        )}
      </motion.div>

      <VolunteerDetailModal
        open={isDetailOpen}
        onClose={closeDetailModal}
        detail={detail.detail}
        loading={detail.loading}
        error={detail.error}
        onRetry={detail.refresh}
        onEdit={() => {
          if (!canManageVolunteers) {
            toast.error("No tienes permisos para editar voluntarios.");
            return;
          }
          openEditModal();
        }}
        onDeactivate={() => {
          if (!canManageVolunteers) {
            toast.error("No tienes permisos para desactivar voluntarios.");
            return;
          }
          setIsDeactivateOpen(true);
        }}
      />

      <VolunteerFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        detail={formMode === "edit" ? detail.detail : null}
        catalogs={volunteers.catalogs}
        isSaving={mutations.isSaving}
        onSubmit={handleSubmitForm}
      />

      <VolunteerDeactivateModal
        open={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        volunteerName={detail.detail?.volunteer.fullName ?? "este voluntario"}
        isDeactivating={mutations.isDeactivating}
        onConfirm={handleDeactivateVolunteer}
      />
    </motion.div>
  );
}
