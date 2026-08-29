import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CreditCard, QrCode, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useIdCards } from "../modules/people/hooks/useIdCards";
import { useIdCardMutations } from "../modules/people/hooks/useIdCardMutations";
import { RefreshCw } from "lucide-react";
import { Button } from "@/core/components/ui/button";
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

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const templateColumns: Column<IdCardTemplateSummaryRow>[] = [
  {
    key: "name",
    label: "Plantilla",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--t-surface)]" style={{ border: "1px solid var(--t-border)" }}>
          {/* Suponemos que baseImageUrl vendrá en la fila */}
          {/* @ts-ignore */}
          {row.baseImageUrl ? (
            // @ts-ignore
            <img src={row.baseImageUrl} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <CreditCard className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          )}
        </div>
        <div>
          <div className="font-medium" style={{ color: "var(--t-text)" }}>{row.name}</div>
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {row.templateWidth} x {row.templateHeight} px
          </div>
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
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--t-surface)]" style={{ border: "1px solid var(--t-border)" }}>
          {/* @ts-ignore */}
          {row.avatarUrl ? (
            // @ts-ignore
            <img src={row.avatarUrl} alt={row.volunteerName} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-3.5 w-3.5" style={{ color: "var(--t-text-dim)" }} />
          )}
        </div>
        <div>
          <div className="font-medium" style={{ color: "var(--t-text)" }}>{row.volunteerName}</div>
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
            {row.documentLabel}
          </div>
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
        {row.expiresAtLabel && row.expiresAtLabel !== "Sin fecha" && (
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            Expira: {row.expiresAtLabel}
          </div>
        )}
      </div>
    ),
  },
];

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string, icon: any }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <div className="relative z-10">
        <p className="text-[12px] font-medium" style={{ color: "var(--t-text-secondary)" }}>
          {label}
        </p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight" style={{ color: "var(--t-text)" }}>
          {value}
        </p>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 opacity-5">
        <Icon className="h-20 w-20" />
      </div>
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
        // @ts-ignore
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
    <motion.div variants={stagger as any} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp as any}>
        <PageHeader
          title="Credenciales ID"
          description="Diseña plantillas de credencial y emite identificaciones digitales para el voluntariado."
        >
          <Button variant="ghost" size="sm" onClick={workspace.refresh} className="h-8 w-8 p-0" title="Actualizar datos">
            <RefreshCw className="h-4 w-4" style={{ color: "var(--t-text-secondary)" }} />
          </Button>
        </PageHeader>
      </motion.div>

      <motion.div variants={fadeUp as any} className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Plantillas totales" value={String(workspace.data.templates.length)} icon={CreditCard} />
        <SummaryCard label="Plantillas activas" value={String(activeTemplateCount)} icon={CreditCard} />
        <SummaryCard label="Credenciales emitidas" value={String(workspace.data.cards.length)} icon={UserRound} />
        <SummaryCard label="Credenciales activas" value={String(activeCardCount)} icon={QrCode} />
      </motion.div>



      {workspace.error && (
        <motion.div variants={fadeUp as any}>
          <PeopleErrorBlock message={workspace.error} onRetry={workspace.refresh} />
        </motion.div>
      )}

      <motion.div variants={fadeUp as any} className="space-y-4">
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

      <motion.div variants={fadeUp as any} className="space-y-4">
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
