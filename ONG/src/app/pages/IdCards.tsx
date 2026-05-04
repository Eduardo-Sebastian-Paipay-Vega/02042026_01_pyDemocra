import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CreditCard, QrCode, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "../components/ui/gradient-button";
import { StatusDot } from "../components/ui/status-dot";
import { useIdCards } from "../modules/people/hooks/useIdCards";
import { useIdCardMutations } from "../modules/people/hooks/useIdCardMutations";
import {
  IdCardDetailModal,
  IdCardFormModal,
  IdCardRevokeModal,
  IdCardTemplateDetailModal,
  IdCardTemplateFormModal,
} from "../modules/people/components/IdCardPanels";
import { PeopleErrorBlock } from "../modules/people/components/people-shared";
import type { IdCardListRow, IdCardTemplateSummaryRow } from "../modules/people/types";

type TemplateFilter = "all" | "active" | "inactive";
type CardFilter = "all" | "activa" | "revocada" | "expirada";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const templateColumns: Column<IdCardTemplateSummaryRow>[] = [
  {
    key: "name",
    label: "Plantilla",
    render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          <span style={{ color: "var(--t-text)" }}>{row.name}</span>
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.templateWidth} x {row.templateHeight} px
        </div>
      </div>
    ),
  },
  {
    key: "fields",
    label: "Campos",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.fieldCount} coordenadas configuradas
      </div>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (row) => (
      <StatusDot variant={row.isActive ? "success" : "secondary"}>
        {row.isActive ? "Activa" : "Inactiva"}
      </StatusDot>
    ),
  },
  {
    key: "updated",
    label: "Actualizada",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
        {row.updatedAtLabel}
      </span>
    ),
  },
];

const cardColumns: Column<IdCardListRow>[] = [
  {
    key: "volunteer",
    label: "Voluntario",
    render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          <span style={{ color: "var(--t-text)" }}>{row.volunteerName}</span>
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.documentLabel}
        </div>
      </div>
    ),
  },
  {
    key: "code",
    label: "Codigo / QR",
    render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <QrCode className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          <span style={{ color: "var(--t-text-secondary)" }}>{row.cardCode}</span>
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.qrPayload}
        </div>
      </div>
    ),
  },
  {
    key: "template",
    label: "Plantilla",
    render: (row) => (
      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        {row.templateName}
      </span>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (row) => <StatusDot variant={row.statusVariant}>{row.stateLabel}</StatusDot>,
  },
  {
    key: "issued",
    label: "Emitida",
    render: (row) => (
      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
        <div>{row.issuedAtLabel}</div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {row.expiresAtLabel}
        </div>
      </div>
    ),
  },
];

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
        {label}
      </p>
      <p className="mt-1 text-[18px]" style={{ color: "var(--t-text)" }}>
        {value}
      </p>
    </div>
  );
}

export function IdCards() {
  const [templateSearch, setTemplateSearch] = useState("");
  const [cardSearch, setCardSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [templateForm, setTemplateForm] = useState<{ open: boolean; mode: "create" | "edit"; templateId: string | null }>({
    open: false,
    mode: "create",
    templateId: null,
  });
  const [templateDetailId, setTemplateDetailId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<{ open: boolean; mode: "create" | "edit"; cardId: string | null }>({
    open: false,
    mode: "create",
    cardId: null,
  });
  const [cardDetailId, setCardDetailId] = useState<string | null>(null);
  const [revokeCardId, setRevokeCardId] = useState<string | null>(null);

  const workspace = useIdCards();
  const mutations = useIdCardMutations(() => {
    workspace.refresh();
  });

  const templateRows = useMemo(() => {
    const term = templateSearch.trim().toLowerCase();
    return workspace.data.templates.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.updatedAtLabel.toLowerCase().includes(term);
      const matchesFilter =
        templateFilter === "all" ||
        (templateFilter === "active" && row.isActive) ||
        (templateFilter === "inactive" && !row.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [templateFilter, templateSearch, workspace.data.templates]);

  const cardRows = useMemo(() => {
    const term = cardSearch.trim().toLowerCase();
    return workspace.data.cards.filter((row) => {
      const matchesSearch =
        !term ||
        row.volunteerName.toLowerCase().includes(term) ||
        row.documentLabel.toLowerCase().includes(term) ||
        row.cardCode.toLowerCase().includes(term) ||
        row.templateName.toLowerCase().includes(term);
      const matchesFilter = cardFilter === "all" || row.stateCode === cardFilter;
      return matchesSearch && matchesFilter;
    });
  }, [cardFilter, cardSearch, workspace.data.cards]);

  const activeTemplateCount = workspace.data.templates.filter((row) => row.isActive).length;
  const activeCardCount = workspace.data.cards.filter((row) => row.stateCode === "activa").length;
  const selectedRevokeCard =
    workspace.data.cards.find((row) => row.id === revokeCardId) ?? null;
  const canManage = workspace.data.access.canManage;

  const templateFilters = useMemo(
    () => [
      { label: "Todas", value: "all", active: templateFilter === "all" },
      { label: "Activas", value: "active", active: templateFilter === "active" },
      { label: "Inactivas", value: "inactive", active: templateFilter === "inactive" },
    ],
    [templateFilter]
  );

  const cardFilters = useMemo(
    () => [
      { label: "Todas", value: "all", active: cardFilter === "all" },
      { label: "Activas", value: "activa", active: cardFilter === "activa" },
      { label: "Revocadas", value: "revocada", active: cardFilter === "revocada" },
      { label: "Expiradas", value: "expirada", active: cardFilter === "expirada" },
    ],
    [cardFilter]
  );

  function reopenTemplateDetail(templateId: string) {
    setTemplateDetailId(null);
    window.setTimeout(() => setTemplateDetailId(templateId), 0);
  }

  function openTemplateCreate() {
    if (!canManage) {
      toast.error("No tienes permisos para gestionar plantillas ID.");
      return;
    }

    setTemplateForm({ open: true, mode: "create", templateId: null });
  }

  function openTemplateEdit(templateId: string) {
    if (!canManage) {
      toast.error("No tienes permisos para editar plantillas ID.");
      return;
    }

    setTemplateDetailId(null);
    setTemplateForm({ open: true, mode: "edit", templateId });
  }

  function openCardCreate() {
    if (!canManage) {
      toast.error("No tienes permisos para emitir credenciales ID.");
      return;
    }

    setCardForm({ open: true, mode: "create", cardId: null });
  }

  const templateActions = useMemo(() => {
    const base = [
      {
        label: "Ver detalle",
        onClick: (row: IdCardTemplateSummaryRow) => setTemplateDetailId(row.id),
      },
    ];

    if (!canManage) {
      return base;
    }

    return base.concat([
      {
        label: "Editar",
        onClick: (row: IdCardTemplateSummaryRow) => openTemplateEdit(row.id),
      },
      {
        label: "Activar / desactivar",
        onClick: (row: IdCardTemplateSummaryRow) => void handleTemplateToggle(row.id, !row.isActive),
      },
    ]);
  }, [canManage]);

  const cardActions = useMemo(() => {
    const base = [
      {
        label: "Ver detalle",
        onClick: (row: IdCardListRow) => setCardDetailId(row.id),
      },
    ];

    if (!canManage) {
      return base;
    }

    return base.concat([
      {
        label: "Editar",
        onClick: (row: IdCardListRow) => openCardEdit(row.id),
      },
      {
        label: "Revocar",
        onClick: (row: IdCardListRow) => setRevokeCardId(row.id),
        variant: "destructive" as const,
      },
    ]);
  }, [canManage]);

  function openCardEdit(cardId: string) {
    if (!canManage) {
      toast.error("No tienes permisos para editar credenciales ID.");
      return;
    }

    setCardDetailId(null);
    setCardForm({ open: true, mode: "edit", cardId });
  }

  async function handleTemplateSubmit(input: Parameters<typeof mutations.createTemplate>[0]) {
    const detail =
      templateForm.mode === "edit" && templateForm.templateId
        ? await mutations.updateTemplate(templateForm.templateId, input)
        : await mutations.createTemplate(input);

    if (!detail) {
      return;
    }

    toast.success(
      templateForm.mode === "edit"
        ? "Plantilla ID actualizada."
        : "Plantilla ID creada."
    );
    setTemplateForm({ open: false, mode: "create", templateId: null });
    setTemplateDetailId(detail.template.id);
  }

  async function handleTemplateToggle(templateId: string, nextActive: boolean) {
    const detail = await mutations.toggleTemplate(templateId, nextActive);
    if (!detail) {
      return;
    }

    toast.success(nextActive ? "Plantilla activada." : "Plantilla desactivada.");
    reopenTemplateDetail(detail.template.id);
  }

  async function handleCardSubmit(input: Parameters<typeof mutations.createCard>[0]) {
    const detail =
      cardForm.mode === "edit" && cardForm.cardId
        ? await mutations.updateCard(cardForm.cardId, input)
        : await mutations.createCard(input);

    if (!detail) {
      return;
    }

    toast.success(
      cardForm.mode === "edit" ? "Credencial actualizada." : "Credencial emitida."
    );
    setCardForm({ open: false, mode: "create", cardId: null });
    setCardDetailId(detail.card.id);
  }

  async function handleRevokeCard() {
    if (!revokeCardId) {
      return;
    }

    const detail = await mutations.revokeCard(revokeCardId);
    if (!detail) {
      return;
    }

    toast.success("Credencial revocada.");
    setRevokeCardId(null);
    setCardDetailId(detail.card.id);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Credenciales ID"
          description="Diseña plantillas de credencial y emite identificaciones digitales para el voluntariado."
          action={{ label: "Actualizar", onClick: workspace.refresh }}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Plantillas" value={String(workspace.data.templates.length)} />
        <SummaryCard label="Plantillas activas" value={String(activeTemplateCount)} />
        <SummaryCard label="Credenciales" value={String(workspace.data.cards.length)} />
        <SummaryCard label="Credenciales activas" value={String(activeCardCount)} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusDot variant={workspace.data.access.canRead ? "success" : "secondary"}>
              {workspace.data.access.canRead ? "idcards.read disponible" : "Sin idcards.read"}
            </StatusDot>
            <StatusDot variant={workspace.data.access.canManage ? "success" : "secondary"}>
              {workspace.data.access.canManage ? "idcards.manage disponible" : "Sin idcards.manage"}
            </StatusDot>
            <StatusDot variant={workspace.data.access.tenantId ? "info" : "secondary"}>
              {workspace.data.access.tenantId ? "tenant_id resuelto" : "tenant_id no resuelto"}
            </StatusDot>
          </div>
          {workspace.data.access.warnings.concat(workspace.data.warnings).map((item) => (
            <p key={item} className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              {item}
            </p>
          ))}
        </div>
      </motion.div>

      {workspace.error && (
        <motion.div variants={fadeUp}>
          <PeopleErrorBlock message={workspace.error} onRetry={workspace.refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px]" style={{ color: "var(--t-text)" }}>
              Plantillas
            </h2>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Configura la imagen de fondo y la posición de cada campo visible en la credencial.
            </p>
          </div>
          <GradientButton size="sm" onClick={openTemplateCreate} disabled={!canManage}>
            Nueva plantilla
          </GradientButton>
        </div>

        <FilterBar
          searchPlaceholder="Buscar plantillas por nombre o fecha..."
          searchValue={templateSearch}
          onSearchChange={setTemplateSearch}
          filters={templateFilters}
          onFilterClick={(value) => setTemplateFilter(value as TemplateFilter)}
        />

        <DataTable
          columns={templateColumns}
          data={templateRows}
          loading={workspace.loading}
          actions={templateActions}
          emptyMessage="No se encontraron plantillas de credencial."
        />
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px]" style={{ color: "var(--t-text)" }}>
              Credenciales emitidas
            </h2>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
              Credenciales emitidas con foto, nombre, documento, código y QR del voluntario.
            </p>
          </div>
          <GradientButton size="sm" onClick={openCardCreate} disabled={!canManage}>
            Emitir credencial
          </GradientButton>
        </div>

        <FilterBar
          searchPlaceholder="Buscar por voluntario, documento, codigo o plantilla..."
          searchValue={cardSearch}
          onSearchChange={setCardSearch}
          filters={cardFilters}
          onFilterClick={(value) => setCardFilter(value as CardFilter)}
        />

        <DataTable
          columns={cardColumns}
          data={cardRows}
          loading={workspace.loading}
          actions={cardActions}
          emptyMessage="No se encontraron credenciales emitidas."
        />
      </motion.div>

      <IdCardTemplateFormModal
        open={templateForm.open}
        onClose={() => setTemplateForm({ open: false, mode: "create", templateId: null })}
        mode={templateForm.mode}
        templateId={templateForm.templateId}
        volunteerOptions={workspace.data.volunteerOptions}
        isSaving={mutations.isSavingTemplate}
        onSubmit={handleTemplateSubmit}
      />

      <IdCardTemplateDetailModal
        open={Boolean(templateDetailId)}
        onClose={() => setTemplateDetailId(null)}
        templateId={templateDetailId}
        volunteerOptions={workspace.data.volunteerOptions}
        isToggling={mutations.isTogglingTemplate}
        onEdit={openTemplateEdit}
        onToggleActive={handleTemplateToggle}
      />

      <IdCardFormModal
        open={cardForm.open}
        onClose={() => setCardForm({ open: false, mode: "create", cardId: null })}
        mode={cardForm.mode}
        cardId={cardForm.cardId}
        volunteerOptions={workspace.data.volunteerOptions}
        templateOptions={workspace.data.templateOptions}
        isSaving={mutations.isSavingCard}
        onSubmit={handleCardSubmit}
      />

      <IdCardDetailModal
        open={Boolean(cardDetailId)}
        onClose={() => setCardDetailId(null)}
        cardId={cardDetailId}
        onEdit={openCardEdit}
        onRevoke={(cardId) => {
          setCardDetailId(null);
          setRevokeCardId(cardId);
        }}
      />

      <IdCardRevokeModal
        open={Boolean(revokeCardId)}
        onClose={() => setRevokeCardId(null)}
        card={selectedRevokeCard}
        isRevoking={mutations.isRevokingCard}
        onConfirm={handleRevokeCard}
      />
    </motion.div>
  );
}
