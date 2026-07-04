import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/shared/PageHeader";
import { FilterBar } from "../components/shared/FilterBar";
import { DataTable, type Column } from "../components/shared/DataTable";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
import { useMedicalRecords } from "../modules/people/hooks/useMedicalRecords";
import { useMedicalRecordDetail } from "../modules/people/hooks/useMedicalRecordDetail";
import { useMedicalRecordMutations } from "../modules/people/hooks/useMedicalRecordMutations";
import {
  SensitiveAccessGateModal,
  SensitiveMedicalDetailModal,
  SensitiveMedicalFormModal,
} from "../modules/people/components/MedicalRecordPanels";
import { PeopleErrorBlock, formatPeopleDate } from "../modules/people/components/people-shared";
import type {
  SensitiveMedicalDetail,
  SensitiveMedicalListRow,
  SensitiveRecordScope,
} from "../modules/people/types";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const columns: Column<SensitiveMedicalListRow>[] = [
  {
    key: "person",
    label: "Persona",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--t-hover)" }}
        >
          <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
        </div>
        <div>
          <div style={{ color: "var(--t-text)" }}>{row.personName}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {row.documentLabel}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "context",
    label: "Contexto",
    render: (row) => (
      <StatusDot variant="info">
        {row.scope === "beneficiaries" ? row.profileLabel : row.stateLabel}
      </StatusDot>
    ),
  },
  {
    key: "record",
    label: "Ficha",
    render: (row) => (
      <div className="space-y-1">
        <StatusDot variant={row.hasRecord ? "warning" : "secondary"}>
          {row.hasRecord ? "Registrada" : "Pendiente"}
        </StatusDot>
        <div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.summary}
        </div>
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

function mapSensitiveDetailToListRow(detail: SensitiveMedicalDetail): SensitiveMedicalListRow {
  if (detail.scope === "beneficiaries") {
    return {
      scope: "beneficiaries",
      personId: detail.personId,
      recordId: detail.recordId,
      personName: detail.personName,
      documentLabel: detail.documentLabel,
      profileKind: detail.profileKind,
      profileLabel: detail.profileLabel,
      hasRecord: detail.hasRecord,
      summary: detail.hasRecord ? "Ficha medica registrada" : "Sin ficha medica registrada",
      updatedAt: detail.updatedAt,
      loggable: Boolean(detail.recordId),
    };
  }

  return {
    scope: "volunteers",
    personId: detail.personId,
    recordId: detail.recordId,
    personName: detail.personName,
    documentLabel: detail.documentLabel,
    stateLabel: detail.stateLabel,
    hasRecord: detail.hasRecord,
    summary: detail.hasRecord ? "Ficha sensible registrada" : "Sin ficha sensible registrada",
    updatedAt: detail.updatedAt,
    loggable: false,
  };
}

export function MedicalRecords() {
  const [scope, setScope] = useState<SensitiveRecordScope>("beneficiaries");
  const [searchValue, setSearchValue] = useState("");
  const [recordFilter, setRecordFilter] = useState<"all" | "withRecord" | "withoutRecord">("all");
  const [gateTarget, setGateTarget] = useState<SensitiveMedicalListRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<{
    scope: SensitiveRecordScope;
    personId: string;
    accessReason: string;
  } | null>(null);

  const records = useMedicalRecords(scope);
  const detail = useMedicalRecordDetail();
  const mutations = useMedicalRecordMutations(() => {
    records.refresh();
  });

  useEffect(() => {
    setGateTarget(null);
    setIsDetailOpen(false);
    setIsFormOpen(false);
    setLastRequest(null);
    detail.clear();
  }, [detail.clear, scope]);

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    return records.rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.personName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        (row.scope === "beneficiaries" ? row.profileLabel : row.stateLabel).toLowerCase().includes(term);
      const matchesRecord =
        recordFilter === "all" ||
        (recordFilter === "withRecord" && row.hasRecord) ||
        (recordFilter === "withoutRecord" && !row.hasRecord);
      return matchesSearch && matchesRecord;
    });
  }, [recordFilter, records.rows, searchValue]);

  const tableEmptyMessage = useMemo(() => {
    if (records.rows.length === 0) {
      return scope === "beneficiaries"
        ? "Aun no hay beneficiarios disponibles para ficha medica sensible."
        : "Aun no hay voluntarios disponibles para ficha sensible.";
    }

    return "No se encontraron fichas sensibles con los filtros actuales.";
  }, [records.rows.length, scope]);

  const filters = useMemo(
    () => [
      { label: "Todas", value: "all", active: recordFilter === "all" },
      { label: "Con ficha", value: "withRecord", active: recordFilter === "withRecord" },
      { label: "Sin ficha", value: "withoutRecord", active: recordFilter === "withoutRecord" },
    ],
    [recordFilter]
  );

  async function openSensitiveDetail(reason: string) {
    if (!gateTarget) {
      return;
    }

    const request = {
      scope: gateTarget.scope,
      personId: gateTarget.personId,
      accessReason: reason,
    } as const;

    setGateTarget(null);
    setLastRequest(request);
    setIsDetailOpen(true);

    try {
      await detail.open(request);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la ficha sensible.");
    }
  }

  async function retryDetail() {
    if (!lastRequest) {
      return;
    }

    try {
      await detail.open(lastRequest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reintentar la ficha sensible.");
    }
  }

  async function handleSaveSensitiveRecord(
    input: Parameters<typeof mutations.saveBeneficiary>[0]["input"] | Parameters<typeof mutations.saveVolunteer>[0]["input"]
  ) {
    if (!detail.detail) {
      return;
    }

    const response =
      detail.detail.scope === "beneficiaries"
        ? await mutations.saveBeneficiary({
            beneficiaryId: detail.detail.personId,
            input: input as Parameters<typeof mutations.saveBeneficiary>[0]["input"],
          })
        : await mutations.saveVolunteer({
            volunteerId: detail.detail.personId,
            input: input as Parameters<typeof mutations.saveVolunteer>[0]["input"],
          });

    if (!response) {
      return;
    }

    records.upsertRow(mapSensitiveDetailToListRow(response));
    detail.replace(response);
    setIsFormOpen(false);
    setIsDetailOpen(true);
    toast.success("Ficha sensible actualizada.");
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="fichas-medicas-theme space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Ficha medica sensible"
          description="Acceso controlado a fichas clinicas y sensibles con trazabilidad y ocultamiento de contenido en listados."
          action={{ label: "Actualizar", onClick: records.refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          {scope === "beneficiaries" ? (
            <GradientButton size="sm" onClick={() => setScope("beneficiaries")}>
              Beneficiarios
            </GradientButton>
          ) : (
            <OutlineButton size="sm" onClick={() => setScope("beneficiaries")}>
              Beneficiarios
            </OutlineButton>
          )}
          {scope === "volunteers" ? (
            <GradientButton size="sm" onClick={() => setScope("volunteers")}>
              Voluntarios
            </GradientButton>
          ) : (
            <OutlineButton size="sm" onClick={() => setScope("volunteers")}>
              Voluntarios
            </OutlineButton>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              Los listados solo muestran metadatos operativos. El contenido clinico se abre con motivo de acceso y se edita solo si el rol actual puede escribir datos sensibles.
            </p>
          </div>
        </div>
      </motion.div>

      {records.error && (
        <motion.div variants={fadeUp}>
          <PeopleErrorBlock message={records.error} onRetry={records.refresh} />
        </motion.div>
      )}

      {!records.error && !records.loading && !records.access.canRead && (
        <motion.div variants={fadeUp}>
          <PeopleErrorBlock
            message={
              records.access.reason ??
              "No tienes permisos para consultar fichas medicas sensibles."
            }
            onRetry={records.refresh}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <FilterBar
          searchPlaceholder="Buscar por persona, documento o contexto..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filters}
          onFilterClick={(value) => setRecordFilter(value as "all" | "withRecord" | "withoutRecord")}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        {records.error || !records.access.canRead ? null : (
          <DataTable
            columns={columns}
            data={filteredRows}
            loading={records.loading}
            actions={[{ label: "Abrir ficha", onClick: (row) => setGateTarget(row) }]}
            emptyMessage={tableEmptyMessage}
          />
        )}
      </motion.div>

      <SensitiveAccessGateModal
        open={Boolean(gateTarget)}
        onClose={() => setGateTarget(null)}
        scope={gateTarget?.scope ?? scope}
        personName={gateTarget?.personName ?? "esta persona"}
        loggable={gateTarget?.loggable ?? false}
        onConfirm={openSensitiveDetail}
      />

      <SensitiveMedicalDetailModal
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        detail={detail.detail}
        loading={detail.loading}
        error={detail.error}
        onRetry={retryDetail}
        onEdit={() => {
          setIsDetailOpen(false);
          setIsFormOpen(true);
        }}
        canWrite={records.access.canWrite}
      />

      <SensitiveMedicalFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        detail={detail.detail}
        isSaving={mutations.isSaving}
        onSubmit={handleSaveSensitiveRecord}
      />
    </motion.div>
  );
}
