import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, RefreshCw, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
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

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function mapSensitiveDetailToListRow(detail: SensitiveMedicalDetail): SensitiveMedicalListRow {
  if (detail.scope === "beneficiaries") {
    return {
      id: detail.personId,
      scope: "beneficiaries",
      personId: detail.personId,
      recordId: detail.recordId,
      personName: detail.personName,
      documentLabel: detail.documentLabel,
      profileKind: detail.profileKind,
      profileLabel: detail.profileLabel,
      hasRecord: detail.hasRecord,
      summary: detail.hasRecord ? "Ficha médica registrada" : "Pendiente de creación",
      updatedAt: detail.updatedAt,
      loggable: Boolean(detail.recordId),
    };
  }

  return {
    id: detail.personId,
    scope: "volunteers",
    personId: detail.personId,
    recordId: detail.recordId,
    personName: detail.personName,
    documentLabel: detail.documentLabel,
    stateLabel: detail.stateLabel,
    hasRecord: detail.hasRecord,
    summary: detail.hasRecord ? "Ficha médica registrada" : "Pendiente de creación",
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
        ? "Aún no hay beneficiarios disponibles para ficha médica sensible."
        : "Aún no hay voluntarios disponibles para ficha sensible.";
    }

    return "No se encontraron fichas sensibles con los filtros actuales.";
  }, [records.rows.length, scope]);

  const columns = useMemo<Column<SensitiveMedicalListRow>[]>(() => [
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
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
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
        <div className="flex items-center">
          <StatusDot variant={row.hasRecord ? "warning" : "secondary"}>
            {row.summary}
          </StatusDot>
        </div>
      ),
    },
    {
      key: "updatedAt",
      label: "Actualizado",
      render: (row) => (
        <span
          className="text-[12px]"
          style={{ color: row.updatedAt ? "var(--t-text-secondary)" : "var(--t-muted)" }}
        >
          {formatPeopleDate(row.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (row) => (
        <OutlineButton size="sm" onClick={() => setGateTarget(row)} className="h-8 gap-1.5 px-3">
          <Eye className="h-3.5 w-3.5" />
          <span>Ver Ficha</span>
        </OutlineButton>
      ),
    },
  ], []);

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
    <motion.div variants={stagger as any} initial="hidden" animate="visible" className="fichas-medicas-theme space-y-6">
      <motion.div variants={fadeUp as any}>
        <PageHeader
          title="Ficha médica sensible"
          description="Acceso controlado a fichas clínicas y sensibles con trazabilidad y ocultamiento de contenido en listados."
          action={{
            label: (
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${records.loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </div>
            ) as unknown as string,
            onClick: records.refresh,
          }}
        />
      </motion.div>

      <motion.div variants={fadeUp as any}>
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

      <motion.div variants={fadeUp as any}>
        <div className="flex items-center gap-2 py-2">
          <ShieldAlert className="h-4 w-4 shrink-0" style={{ color: "var(--t-warning)" }} />
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
            Los listados solo muestran metadatos operativos. El contenido clínico se abre con motivo de acceso y se edita solo con rol autorizado.
          </p>
        </div>
      </motion.div>

      {records.error && (
        <motion.div variants={fadeUp as any}>
          <PeopleErrorBlock message={records.error} onRetry={records.refresh} />
        </motion.div>
      )}

      {!records.error && !records.loading && !records.access.canRead && (
        <motion.div variants={fadeUp as any}>
          <PeopleErrorBlock
            message={
              records.access.reason ??
              "No tienes permisos para consultar fichas médicas sensibles."
            }
            onRetry={records.refresh}
          />
        </motion.div>
      )}

      <motion.div variants={fadeUp as any}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--t-text-tertiary)" }} />
            <input
              placeholder="Buscar por persona, documento o contexto..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="ong-field-control h-10 w-full rounded-xl pl-9 pr-4 text-[13px] backdrop-blur-sm outline-none transition-colors focus:ring-1 focus:ring-[var(--t-primary)]/30"
              style={{
                border: "1px solid var(--t-border-strong)",
                background: "var(--t-input-bg)",
                color: "var(--t-text)",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Todas", value: "all" },
              { label: "Con ficha", value: "withRecord" },
              { label: "Sin ficha", value: "withoutRecord" },
            ].map((filter) => {
              const isActive = recordFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[12px] font-medium transition-colors ${
                    isActive
                      ? "border-[var(--t-primary)]/35 bg-[var(--t-primary-soft)] text-[var(--t-primary)]"
                      : ""
                  }`}
                  style={!isActive ? {
                    border: "1px solid var(--t-border)",
                    background: "var(--t-input-bg)",
                    color: "var(--t-text-secondary)",
                  } : undefined}
                  onClick={() => setRecordFilter(filter.value as any)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp as any}>
        {records.error || !records.access.canRead ? null : (
          <DataTable
            columns={columns}
            data={filteredRows}
            loading={records.loading}
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
