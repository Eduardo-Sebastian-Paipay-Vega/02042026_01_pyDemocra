import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router";
import { Mail, Phone, UserRound, RefreshCw, TriangleAlert, Download } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from '@/core/components/shared/PageHeader';
import { FilterBar } from '@/core/components/shared/FilterBar';
import type { Column } from '@/core/components/shared/DataTable';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/core/components/ui/tooltip";
import { Badge } from "@/core/components/ui/badge";

import { useVolunteers } from "../modules/people/hooks/useVolunteers";
import { useVolunteerDetail } from "../modules/people/hooks/useVolunteerDetail";
import { useVolunteerMutations } from "../modules/people/hooks/useVolunteerMutations";

import { VolunteerDeactivateModal, VolunteerFormModal, VolunteerDetailModal } from "../modules/people/components/VolunteerPanels";
import { PeopleErrorBlock, formatPeopleDate, formatPeopleText } from "../modules/people/components/people-shared";
import type { PeopleRecordStatusKind, VolunteerListRow } from "../modules/people/types";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";

// Sub-artifacts (Modular Architecture)
import { useClipboard } from "../modules/people/hooks/useClipboard";
import { useBulkSelection } from "../modules/people/hooks/useBulkSelection";
import { useVolunteerFilters } from "../modules/people/hooks/useVolunteerFilters";
import { BulkActionsBar } from "../modules/people/components/volunteers/BulkActionsBar";
import { VolunteerDrawerPreview } from "../modules/people/components/volunteers/VolunteerDrawerPreview";
import { AdvancedFiltersModal } from "../modules/people/components/volunteers/AdvancedFiltersModal";
import { VolunteersTable } from "../modules/people/components/volunteers/VolunteersTable";

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.04 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

export function Volunteers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const volunteerIdParam = searchParams.get("volunteerId");

  const volunteers = useVolunteers();
  const tenantBootstrap = useTenantBootstrap();
  const canManageVolunteers = tenantBootstrap.hasAnyPermission([
    "volunteers.register",
    "volunteers.invite",
    "admission.manage",
  ]);

  // Ecosystem Hooks
  const { copy } = useClipboard();
  const { filters, updateFilter, filteredRows } = useVolunteerFilters(volunteers.rows);
  const { selectedIds, selectAll, toggleSelection, clearSelection, count: selectedCount } = useBulkSelection<string>();

  // UI State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [previewVolunteer, setPreviewVolunteer] = useState<VolunteerListRow | null>(null);

  // Deep detail hook (only triggered for full edit/deactivate/detail modal)
  const activeVolunteerId = selectedVolunteerId && (isFormOpen || isDeactivateOpen || isDetailOpen) ? selectedVolunteerId : null;
  const detail = useVolunteerDetail(activeVolunteerId);
  const mutations = useVolunteerMutations(() => {
    volunteers.refresh();
    detail.refresh();
  });

  useEffect(() => {
    if (!volunteerIdParam) return;
    const row = volunteers.rows.find(r => r.id === volunteerIdParam);
    if (row) {
      setPreviewVolunteer(row);
      setIsPreviewOpen(true);
    }
  }, [volunteerIdParam, volunteers.rows]);

  const columns = useMemo<Column<VolunteerListRow>[]>(() => [
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
              <span className="text-[13px] font-medium" style={{ color: "var(--t-text-secondary)" }}>
                {row.fullName.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium flex items-center gap-1.5" style={{ color: "var(--t-text)" }}>
              {row.fullName}
              {row.documentCount === 0 && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 cursor-help px-1.5 py-0">
                        <TriangleAlert className="h-3 w-3 mr-1" />
                        Doc
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Documentación incompleta</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              {row.documentLabel.replace('Documento Nacional de Identidad', 'DNI')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contacto",
      render: (row) => (
        <div className="space-y-1.5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="flex items-center gap-2 cursor-pointer group w-fit"
                  onClick={(e) => { e.stopPropagation(); copy(row.email, "Correo copiado al portapapeles"); }}
                >
                  <Mail className="h-4 w-4 transition-colors group-hover:text-white" style={{ color: "var(--t-text-dim)" }} />
                  <span className="text-[13px] transition-colors group-hover:text-white" style={{ color: "var(--t-text-secondary)" }}>
                    {formatPeopleText(row.email)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Copiar correo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="flex items-center gap-2 cursor-pointer group w-fit"
                  onClick={(e) => { e.stopPropagation(); copy(row.phone, "Teléfono copiado al portapapeles"); }}
                >
                  <Phone className="h-4 w-4 transition-colors group-hover:text-white" style={{ color: "var(--t-text-dim)" }} />
                  <span className="text-[13px] transition-colors group-hover:text-white" style={{ color: "var(--t-text-secondary)" }}>
                    {formatPeopleText(row.phone)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Copiar teléfono</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      label: "Operación",
      render: (row) => (
        <div className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
          <div className="font-medium" style={{ color: "var(--t-text)" }}>{row.approvedHours} h aprobadas</div>
          <div className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {row.projectCount} proyectos / {row.activityCount} {row.activityCount === 1 ? 'actividad' : 'actividades'}
          </div>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      render: (row) => (
        <span className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>
          {formatPeopleDate(row.updatedAt)}
        </span>
      ),
    },
  ], [copy]);

  const tableEmptyMessage = useMemo(() => {
    if (volunteers.rows.length === 0) return "Aun no hay voluntarios registrados en este tenant.";
    return "No se encontraron voluntarios con los filtros actuales.";
  }, [volunteers.rows.length]);

  const filterTabs = useMemo(() => [
    { label: "Todos", value: "all", active: filters.stateKind === "all" },
    { label: "Activos", value: "active", active: filters.stateKind === "active" },
    { label: "Pendientes", value: "pending", active: filters.stateKind === "pending" },
    { label: "Inactivos", value: "inactive", active: filters.stateKind === "inactive" },
  ], [filters.stateKind]);

  function handleExportCSV() {
    if (filteredRows.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const headers = "Nombre,DNI,Correo,Teléfono,Estado,Horas Aprobadas\n";
    const csv = filteredRows.map(r => `"${r.fullName}","${r.documentNumber}","${r.email}","${r.phone}","${r.stateLabel}",${r.approvedHours}`).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'voluntarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Directorio exportado a CSV exitosamente");
  }

  function handleRowClick(row: VolunteerListRow) {
    setPreviewVolunteer(row);
    setIsPreviewOpen(true);
  }

  async function handleSubmitForm(input: Parameters<typeof mutations.create>[0]) {
    const response = formMode === "edit" && selectedVolunteerId
      ? await mutations.update(selectedVolunteerId, input)
      : await mutations.create(input);
    if (!response) return;
    
    volunteers.upsertRow(response.volunteer);
    if (formMode === "edit") detail.replace(response);
    toast.success(formMode === "edit" ? "Voluntario actualizado." : "Voluntario creado.");
    setIsFormOpen(false);
  }

  async function handleDeactivateVolunteer() {
    if (!selectedVolunteerId) return;
    const response = await mutations.deactivate(selectedVolunteerId);
    if (!response) return;

    volunteers.upsertRow(response.volunteer);
    detail.replace(response);
    toast.success("Voluntario desactivado.");
    setIsDeactivateOpen(false);
  }

  function closeDetailModal() {
    setIsDetailOpen(false);
    if (volunteerIdParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("volunteerId");
      setSearchParams(next, { replace: true });
    }
  }

  const rowActions = useMemo(() => [
    { 
      label: "Editar perfil", 
      onClick: (row: VolunteerListRow) => { 
        if (!canManageVolunteers) return toast.error("Sin permisos.");
        setSelectedVolunteerId(row.id); setFormMode("edit"); setIsFormOpen(true); 
      } 
    },
    { 
      label: "Ver detalle completo", 
      onClick: (row: VolunteerListRow) => { setSelectedVolunteerId(row.id); setIsDetailOpen(true); } 
    },
    { 
      label: "Documentación", 
      onClick: (row: VolunteerListRow) => { setSelectedVolunteerId(row.id); setIsDetailOpen(true); } 
    },
    { 
      label: "Desactivar", 
      variant: "destructive" as const,
      onClick: (row: VolunteerListRow) => { 
        if (!canManageVolunteers) return toast.error("Sin permisos.");
        setSelectedVolunteerId(row.id); setIsDeactivateOpen(true); 
      } 
    }
  ], [canManageVolunteers]);

  return (
    <motion.div variants={stagger as any} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp as any}>
        <PageHeader
          title="Voluntarios"
          description="Administra los perfiles de voluntarios con sus habilidades, roles y documentación."
        />
      </motion.div>

      {volunteers.error && (
        <motion.div variants={fadeUp as any}>
          <PeopleErrorBlock message={volunteers.error} onRetry={volunteers.refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp as any} className="relative">
        <BulkActionsBar 
          selectedCount={selectedCount}
          onStatusChange={() => toast.info("Funcionalidad en desarrollo: Cambiar estado masivo")}
          onAssignProject={() => toast.info("Funcionalidad en desarrollo: Asignación masiva")}
          onMassEmail={() => toast.info("Funcionalidad en desarrollo: Envío de correo")}
        />

        <FilterBar
          searchPlaceholder="Buscar por nombre, DNI o correo..."
          searchValue={filters.search}
          onSearchChange={(val) => updateFilter('search', val)}
          filters={filterTabs}
          onFilterClick={(value) => updateFilter('stateKind', value)}
          actions={
            <>
              <AdvancedFiltersModal filters={{skills: filters.skills, roles: filters.roles}} onUpdateFilter={updateFilter} />
              <button
                onClick={handleExportCSV}
                className="inline-flex h-9 items-center justify-center rounded-full border px-3 text-[13px] font-medium transition-colors hover:bg-[var(--t-hover)]"
                style={{ border: "1px solid var(--t-border)", color: "var(--t-text-secondary)", background: "var(--t-surface)" }}
                title="Exportar a CSV"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Exportar
              </button>
              <button
                onClick={volunteers.refresh}
                className="inline-flex h-9 items-center justify-center rounded-full border px-3 text-[13px] font-medium transition-colors hover:bg-[var(--t-hover)]"
                style={{ border: "1px solid var(--t-border)", color: "var(--t-text-secondary)", background: "var(--t-surface)" }}
                title="Actualizar"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Actualizar
              </button>
              {canManageVolunteers && (
                <GradientButton size="sm" onClick={() => { setFormMode("create"); setIsFormOpen(true); }}>
                  Nuevo voluntario
                </GradientButton>
              )}
            </>
          }
        />
      </motion.div>

      <motion.div variants={fadeUp as any}>
        {!volunteers.error && (
          <VolunteersTable
            columns={columns}
            data={filteredRows}
            loading={volunteers.loading}
            actions={rowActions}
            onRowClick={handleRowClick}
            selectedIds={selectedIds}
            onSelectionChange={selectAll}
            emptyMessage={tableEmptyMessage}
          />
        )}
      </motion.div>

      {/* Domain Modals & Drawers */}
      <VolunteerDrawerPreview 
        open={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        volunteer={previewVolunteer} 
        onOpenFullDetail={(id) => {
          setSelectedVolunteerId(id);
          setIsDetailOpen(true);
        }}
      />

      <VolunteerDetailModal
        open={isDetailOpen}
        onClose={closeDetailModal}
        detail={detail.detail}
        loading={detail.loading}
        error={detail.error}
        onRetry={detail.refresh}
        onEdit={() => {
          if (!canManageVolunteers) return toast.error("Sin permisos.");
          setFormMode("edit");
          setIsDetailOpen(false);
          setIsFormOpen(true);
        }}
        onDeactivate={() => {
          if (!canManageVolunteers) return toast.error("Sin permisos.");
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
        volunteerName={previewVolunteer?.fullName ?? "este voluntario"}
        isDeactivating={mutations.isDeactivating}
        onConfirm={handleDeactivateVolunteer}
      />
    </motion.div>
  );
}
