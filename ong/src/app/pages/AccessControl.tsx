import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import { Link2, Users } from "lucide-react";
import { PageHeader } from '@/core/components/shared/PageHeader';
import { DataTable, type Column, type RowAction } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useAccessLinks } from "../modules/settings/hooks/useAccessLinks";
import { useMemberships } from "../modules/settings/hooks/useMemberships";
import { listAssignableRoles, listAssignableSedes } from "../services/ace/ace.service";
import type { AppDatabase } from "../../lib/db/ong/app-database";
import {
  SettingsDetailField,
  SettingsErrorBlock,
} from "../modules/settings/components/settings-shared";

type AccessLinkRow = AppDatabase["public"]["Tables"]["access_links"]["Row"];
type MembershipRow = AppDatabase["public"]["Tables"]["memberships"]["Row"];
type RoleRow = AppDatabase["public"]["Tables"]["roles"]["Row"];
type SedeRow = AppDatabase["public"]["Tables"]["sedes"]["Row"];

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

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
} as const;

type Tab = "links" | "memberships";

type LinkFormState = {
  type: AccessLinkRow["type"];
  targetType: AccessLinkRow["target_type"];
  assignedRoleId: string;
  assignedSedeId: string;
  maxUses: number;
  expiresAt: string;
  onboardingFlow: string;
};

function buildLinkForm(): LinkFormState {
  return {
    type: "GENERIC",
    targetType: "GLOBAL",
    assignedRoleId: "",
    assignedSedeId: "",
    maxUses: 1,
    expiresAt: "",
    onboardingFlow: "",
  };
}

const accessLinkColumns: Column<AccessLinkRow>[] = [
  {
    key: "code",
    label: "Código",
    render: (row) => <span style={{ fontFamily: "monospace", fontSize: 13 }}>{row.code}</span>,
  },
  {
    key: "type",
    label: "Tipo",
    render: (row) => (
      <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>{row.type}</span>
    ),
  },
  {
    key: "target_type",
    label: "Contexto",
    render: (row) => (
      <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>{row.target_type}</span>
    ),
  },
  {
    key: "used_count",
    label: "Usos",
    render: (row) => (
      <span style={{ fontSize: 12 }}>
        {row.used_count} / {row.max_uses}
      </span>
    ),
  },
  {
    key: "is_active",
    label: "Estado",
    render: (row) => (
      <StatusDot variant={row.is_active ? "success" : "secondary"}>
        {row.is_active ? "Activo" : "Revocado"}
      </StatusDot>
    ),
  },
  {
    key: "expires_at",
    label: "Vence",
    render: (row) =>
      row.expires_at ? new Date(row.expires_at).toLocaleDateString("es-PE") : "—",
  },
];

const membershipColumns: Column<MembershipRow>[] = [
  {
    key: "user_id",
    label: "Usuario",
    render: (row) => (
      <span style={{ fontFamily: "monospace", fontSize: 11 }}>{row.user_id.slice(0, 8)}…</span>
    ),
  },
  {
    key: "context_type",
    label: "Contexto",
    render: (row) => (
      <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>{row.context_type}</span>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (row) => (
      <StatusDot variant={row.status === "active" ? "success" : "secondary"}>
        {row.status}
      </StatusDot>
    ),
  },
  {
    key: "joined_at",
    label: "Vinculado",
    render: (row) => (row.joined_at ? new Date(row.joined_at).toLocaleDateString("es-PE") : "—"),
  },
];

export function AccessControl() {
  const [activeTab, setActiveTab] = useState<Tab>("links");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<AccessLinkRow | null>(null);
  const [linkForm, setLinkForm] = useState<LinkFormState>(buildLinkForm());
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [sedes, setSedes] = useState<SedeRow[]>([]);
  const [createdLink, setCreatedLink] = useState<AccessLinkRow | null>(null);

  const {
    links,
    loading: linksLoading,
    error: linksError,
    create: createLink,
    revoke: revokeLink,
    refresh: refreshLinks,
  } = useAccessLinks();

  const {
    memberships,
    loading: membershipsLoading,
    error: membershipsError,
    deactivate: deactivateMembership,
    refresh: refreshMemberships,
  } = useMemberships();

  useEffect(() => {
    let active = true;
    Promise.all([listAssignableRoles(), listAssignableSedes()])
      .then(([roleRows, sedeRows]) => {
        if (!active) return;
        setRoles(roleRows);
        setSedes(sedeRows);
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "No se pudieron cargar roles y sedes."
        );
      });
    return () => {
      active = false;
    };
  }, []);

  function openCreate() {
    setLinkForm(buildLinkForm());
    setCreatedLink(null);
    setShowCreateModal(true);
  }

  async function handleCreateLink() {
    setSubmitting(true);
    try {
      const created = await createLink({
        type: linkForm.type,
        targetType: linkForm.targetType,
        assignedRoleId: linkForm.assignedRoleId || null,
        assignedSedeId: linkForm.assignedSedeId || null,
        maxUses: Math.max(1, linkForm.maxUses),
        expiresAt: linkForm.expiresAt || null,
        onboardingFlow: linkForm.onboardingFlow || null,
      });
      toast.success("Código de acceso creado.");
      setCreatedLink(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el código.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(link: AccessLinkRow) {
    try {
      await revokeLink(link.id);
      toast.success("Código revocado.");
      setSelectedLink(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo revocar.");
    }
  }

  async function handleDeactivate(membership: MembershipRow) {
    try {
      await deactivateMembership(membership.id);
      toast.success("Membresía desactivada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar.");
    }
  }

  const linkActions: RowAction<AccessLinkRow>[] = [
    {
      label: "Ver detalle",
      onClick: (row) => setSelectedLink(row),
    },
    {
      label: (row) => (row.is_active ? "Revocar" : "Ya revocado"),
      onClick: (row) => {
        if (row.is_active) handleRevoke(row);
      },
      variant: "destructive",
    },
  ];

  const membershipActions: RowAction<MembershipRow>[] = [
    {
      label: (row) => (row.status === "active" ? "Desactivar" : "Inactiva"),
      onClick: (row) => {
        if (row.status === "active") handleDeactivate(row);
      },
      variant: "destructive",
    },
  ];

  const tabStyle = (tab: Tab) => ({
    padding: "6px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer" as const,
    border: "none",
    background: activeTab === tab ? "var(--t-accent)" : "transparent",
    color: activeTab === tab ? "#fff" : "var(--t-text-muted)",
    transition: "all .15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  });

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Control de acceso"
          description="Genera códigos de acceso dinámicos y asigna roles automáticamente al registrarse voluntarios, staff o beneficiarios."
          action={
            activeTab === "links" ? { label: "Nuevo código", onClick: openCreate } : undefined
          }
        />
      </motion.div>

      <motion.div variants={fadeUp} style={{ display: "flex", gap: 4 }}>
        <button style={tabStyle("links")} onClick={() => setActiveTab("links")}>
          <Link2 size={14} />
          Códigos de acceso
        </button>
        <button style={tabStyle("memberships")} onClick={() => setActiveTab("memberships")}>
          <Users size={14} />
          Membresías
        </button>
      </motion.div>

      {activeTab === "links" && (
        <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {linksError && <SettingsErrorBlock message={linksError} onRetry={refreshLinks} />}
          <DataTable
            columns={accessLinkColumns}
            data={links}
            actions={linkActions}
            loading={linksLoading}
            emptyMessage="No hay códigos de acceso para este tenant."
          />
        </motion.div>
      )}

      {activeTab === "memberships" && (
        <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {membershipsError && (
            <SettingsErrorBlock message={membershipsError} onRetry={refreshMemberships} />
          )}
          <DataTable
            columns={membershipColumns}
            data={memberships}
            actions={membershipActions}
            loading={membershipsLoading}
            emptyMessage="No hay membresías registradas."
          />
        </motion.div>
      )}

      {/* Modal: crear código */}
      <ModalShell open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)", marginBottom: 4 }}>
            Nuevo código de acceso
          </h2>

          {createdLink ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "var(--t-text-secondary)" }}>
                Comparte este código con la persona que se registrará. Al usarlo, se le asignará
                automáticamente el rol seleccionado.
              </p>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 18,
                  fontWeight: 600,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text)",
                  textAlign: "center",
                }}
              >
                {createdLink.code}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <OutlineButton onClick={() => setShowCreateModal(false)}>Cerrar</OutlineButton>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label
                  style={{ fontSize: 12, color: "var(--t-text-muted)", display: "block", marginBottom: 4 }}
                >
                  Tipo de registro
                </label>
                <select
                  style={INPUT_STYLE}
                  value={linkForm.type}
                  onChange={(e) =>
                    setLinkForm((prev) => ({
                      ...prev,
                      type: e.target.value as AccessLinkRow["type"],
                    }))
                  }
                >
                  <option value="VOLUNTEER_JOIN">Voluntario</option>
                  <option value="STAFF_JOIN">Staff / colaborador</option>
                  <option value="BENEFICIARY_JOIN">Beneficiario</option>
                  <option value="GENERIC">Genérico</option>
                </select>
              </div>

              <div>
                <label
                  style={{ fontSize: 12, color: "var(--t-text-muted)", display: "block", marginBottom: 4 }}
                >
                  Rol a asignar automáticamente (opcional)
                </label>
                <select
                  style={INPUT_STYLE}
                  value={linkForm.assignedRoleId}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, assignedRoleId: e.target.value }))
                  }
                >
                  <option value="">Sin rol (solo membresía)</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{ fontSize: 12, color: "var(--t-text-muted)", display: "block", marginBottom: 4 }}
                >
                  Contexto destino
                </label>
                <select
                  style={INPUT_STYLE}
                  value={linkForm.targetType}
                  onChange={(e) =>
                    setLinkForm((prev) => ({
                      ...prev,
                      targetType: e.target.value as AccessLinkRow["target_type"],
                    }))
                  }
                >
                  <option value="GLOBAL">General (sin sede específica)</option>
                  <option value="SEDE">Sede específica</option>
                </select>
              </div>

              {linkForm.targetType === "SEDE" && (
                <div>
                  <label
                    style={{ fontSize: 12, color: "var(--t-text-muted)", display: "block", marginBottom: 4 }}
                  >
                    Sede
                  </label>
                  <select
                    style={INPUT_STYLE}
                    value={linkForm.assignedSedeId}
                    onChange={(e) =>
                      setLinkForm((prev) => ({ ...prev, assignedSedeId: e.target.value }))
                    }
                  >
                    <option value="">Selecciona una sede</option>
                    {sedes.map((sede) => (
                      <option key={sede.id} value={sede.id}>
                        {sede.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  style={{ fontSize: 12, color: "var(--t-text-muted)", display: "block", marginBottom: 4 }}
                >
                  Máx. usos
                </label>
                <input
                  type="number"
                  min={1}
                  style={INPUT_STYLE}
                  value={linkForm.maxUses}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, maxUses: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label
                  style={{ fontSize: 12, color: "var(--t-text-muted)", display: "block", marginBottom: 4 }}
                >
                  Vence el (opcional)
                </label>
                <input
                  type="datetime-local"
                  style={INPUT_STYLE}
                  value={linkForm.expiresAt}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <OutlineButton onClick={() => setShowCreateModal(false)} disabled={submitting}>
                  Cancelar
                </OutlineButton>
                <GradientButton onClick={handleCreateLink} disabled={submitting}>
                  {submitting ? "Creando…" : "Crear código"}
                </GradientButton>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      {/* Modal: detalle */}
      <ModalShell open={!!selectedLink} onClose={() => setSelectedLink(null)}>
        {selectedLink && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)", marginBottom: 4 }}>
              Detalle del código
            </h2>
            <SettingsDetailField label="Código" value={selectedLink.code} />
            <SettingsDetailField label="Tipo" value={selectedLink.type} />
            <SettingsDetailField label="Contexto" value={selectedLink.target_type} />
            <SettingsDetailField
              label="Usos"
              value={`${selectedLink.used_count} / ${selectedLink.max_uses}`}
            />
            <SettingsDetailField
              label="Estado"
              value={selectedLink.is_active ? "Activo" : "Revocado"}
            />
            {selectedLink.expires_at && (
              <SettingsDetailField
                label="Vence"
                value={new Date(selectedLink.expires_at).toLocaleString("es-PE")}
              />
            )}
            {selectedLink.is_active && (
              <div style={{ marginTop: 10 }}>
                <OutlineButton onClick={() => handleRevoke(selectedLink)}>
                  Revocar código
                </OutlineButton>
              </div>
            )}
          </div>
        )}
      </ModalShell>
    </motion.div>
  );
}
