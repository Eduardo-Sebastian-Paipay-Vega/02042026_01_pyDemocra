import { useEffect, useState, useMemo } from "react";
import { motion, type Variants } from "motion/react";
import { toast } from "sonner";
import {  Link2, Users , Activity, Plus, BarChart2, Trash2, Clock, X, Copy, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { DataTable, type Column, type RowAction } from '@/core/components/shared/DataTable';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
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
  const future = new Date();
  future.setDate(future.getDate() + 7);
  const tzOffset = future.getTimezoneOffset() * 60000;
  const localISOTime = new Date(future.getTime() - tzOffset).toISOString().slice(0, 16);

  return {
    type: "GENERIC",
    targetType: "GLOBAL",
    assignedRoleId: "",
    assignedSedeId: "",
    maxUses: 1,
    expiresAt: localISOTime,
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

  const chartData = useMemo(() => {
    if (!memberships || memberships.length === 0) return [];
    const sorted = [...memberships]
      .filter((m) => m.joined_at)
      .sort((a, b) => new Date(a.joined_at!).getTime() - new Date(b.joined_at!).getTime());
    const grouped = new Map<string, number>();
    sorted.forEach((m) => {
      const dateStr = new Date(m.joined_at!).toLocaleDateString("es-PE", { month: "short", day: "numeric" });
      grouped.set(dateStr, (grouped.get(dateStr) || 0) + 1);
    });
    let cumulative = 0;
    return Array.from(grouped.entries()).map(([date, count]) => {
      cumulative += count;
      return { date, nuevos: count, total: cumulative };
    });
  }, [memberships]);

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
        expiresAt: linkForm.expiresAt ? new Date(linkForm.expiresAt).toISOString() : null,
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `codigo-${selectedLink?.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

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
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="bg-[#100F0D] text-[#F9F7F3] min-h-screen p-6 font-sans access-control-dashboard"
    >
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Panel Principal</h1>
          <p className="text-sm text-[#A4A29F]">Control de Accesos y Membresías</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { refreshLinks(); refreshMemberships(); }} className="bg-[#171512] border border-[#26231F] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#1F1D1A] transition-colors flex items-center gap-2 text-[#F9F7F3]">
            Actualizar
          </button>
          <button onClick={openCreate} className="bg-[#356C92] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#356C92]/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Código
          </button>
        </div>
      </div>

      {(linksError || membershipsError) && (
        <div className="mb-4">
          <SettingsErrorBlock message={(linksError || membershipsError) || ""} onRetry={() => { refreshLinks(); refreshMemberships(); }} />
        </div>
      )}

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Columna Izquierda (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Fila de 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Miembros</h3>
              <p className="text-2xl font-bold text-white">{memberships.filter((m: any) => m.status === 'active').length}</p>
              <div className="absolute top-3 right-3 bg-[#161D17] text-[#08996A] border border-[#08996A]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="w-3 h-3" /> Activos
              </div>
            </div>
            
            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Códigos</h3>
              <p className="text-2xl font-bold text-white">{links.filter((l: any) => l.is_active).length}</p>
              <div className="absolute top-3 right-3 bg-[#1F181E] text-[#8B5CF6] border border-[#8B5CF6]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Activos
              </div>
            </div>
            
            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Usos</h3>
              <p className="text-2xl font-bold text-white">{links.reduce((acc: number, l: any) => acc + l.used_count, 0)}</p>
              <div className="absolute top-3 right-3 bg-[#231C11] text-[#D97706] border border-[#D97706]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Activity className="w-3 h-3" /> Total
              </div>
            </div>

            <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 relative overflow-hidden">
              <h3 className="text-xs text-[#A4A29F] mb-1">Roles Base</h3>
              <p className="text-2xl font-bold text-white">{roles.length}</p>
              <div className="absolute top-3 right-3 bg-[#161D17] text-[#08996A] border border-[#08996A]/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                Sistema
              </div>
            </div>
          </div>

          {/* Tarjeta de Gráfico / Evolución */}
          <div className="h-[280px] bg-[#171512] border border-[#26231F] rounded-[12px] p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#8B5CF6]" />
              Evolución de Registros
            </h2>
            {chartData.length > 0 ? (
              <div className="flex-1 w-full mt-2 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#08996A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#08996A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#26231F" vertical={false} />
                    <XAxis dataKey="date" stroke="#A4A29F" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A4A29F" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171512', borderColor: '#26231F', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#F9F7F3' }}
                    />
                    <Area type="monotone" dataKey="total" name="Total Acumulado" stroke="#08996A" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#23211D]/30 rounded-xl border border-dashed border-[#26231F]">
                <div className="bg-[#23211D] p-3 rounded-xl mb-3">
                  <BarChart2 className="w-6 h-6 text-[#686561]" />
                </div>
                <p className="text-sm font-medium">Sin datos suficientes</p>
                <p className="text-xs text-[#A4A29F] text-center max-w-xs mt-1">
                  Aún no hay suficientes altas de miembros para generar la gráfica de crecimiento.
                </p>
              </div>
            )}
          </div>

          {/* Tarjeta de Feed en Vivo (Membresías) */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
             <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#08996A]" />
                Membresías Recientes
              </h2>
            </div>
            
            <div className="[&_th]:!bg-[#100F0D] [&_th]:!text-[#A4A29F] [&_th]:!border-[#26231F] [&_td]:!border-[#26231F] [&_tr:hover]:!bg-[#1F1D1A]">
              <DataTable
                columns={membershipColumns}
                data={memberships.slice(0, 5)}
                loading={membershipsLoading}
                emptyMessage="No se han registrado membresías aún."
              />
            </div>
          </div>

        </div>

        {/* Columna Derecha (1/3) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Tarjeta Accesos Directos */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
            <h2 className="text-sm font-semibold mb-4 text-[#F9F7F3]">Accesos Directos</h2>
            <div className="space-y-2">
              <button 
                onClick={openCreate}
                className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-[12px] p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-[#23211D] p-1.5 rounded-md">
                    <Plus className="w-4 h-4 text-[#A4A29F]" />
                  </div>
                  <span className="text-sm font-medium text-[#F9F7F3]">Nuevo Código</span>
                </div>
                <div className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F]">
                  <Link2 className="w-3 h-3" />
                </div>
              </button>

              <button 
                onClick={() => { refreshLinks(); refreshMemberships(); }}
                className="w-full text-left hover:bg-[#1F1D1A] transition-colors rounded-[12px] p-3 flex justify-between items-center bg-[#1F1D1A]/50 border border-transparent hover:border-[#26231F]"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-[#23211D] p-1.5 rounded-md">
                    <Activity className="w-4 h-4 text-[#A4A29F]" />
                  </div>
                  <span className="text-sm font-medium text-[#F9F7F3]">Recargar Datos</span>
                </div>
                <div className="bg-[#100F0D] text-xs px-2 py-1 rounded text-[#A4A29F]">
                  <Activity className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>

          {/* Tarjeta Códigos Activos */}
          <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#356C92]" />
                Códigos de Acceso
              </h2>
            </div>
            
            {links.filter((l: any) => l.is_active).length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#23211D]/30 rounded-[12px] border border-dashed border-[#26231F] py-8">
                <div className="bg-[#23211D] p-3 rounded-[12px] mb-3">
                  <Link2 className="w-6 h-6 text-[#686561]" />
                </div>
                <p className="text-sm font-medium">Sin códigos activos</p>
                <p className="text-xs text-[#A4A29F] text-center mt-1">
                  Genera un nuevo enlace de invitación para permitir el registro.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-none">
                {links.filter((l: any) => l.is_active).map((c: any) => (
                  <div key={c.id} className="bg-[#1F1D1A]/50 hover:bg-[#1F1D1A] transition-colors p-3 rounded-[12px] border border-[#26231F]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-white cursor-pointer hover:underline" onClick={() => setSelectedLink(c)}>{c.code}</span>
                      <div className="flex gap-1">
                         <button onClick={() => handleRevoke(c)} className="text-[#A4A29F] hover:text-[#ef4444]" title="Revocar"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#A4A29F] flex items-center gap-1 mt-1">
                      <Activity className="w-3 h-3" />
                      Usos: {c.used_count} / {c.max_uses}
                    </div>
                    <div className="text-[11px] text-[#A4A29F] flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("es-PE") : "Sin vencimiento"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
<ModalShell open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="flex flex-col gap-4 p-6 relative">
          <button 
            onClick={() => setShowCreateModal(false)}
            className="absolute top-6 right-6 text-[#A4A29F] hover:text-[#F9F7F3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-[#F9F7F3] pr-8">
            Nuevo código de acceso
          </h2>

          {createdLink ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[#A4A29F]">
                Comparte este código con la persona que se registrará. Al usarlo, se le asignará
                automáticamente el rol seleccionado.
              </p>
              <button
                onClick={() => copyToClipboard(createdLink.code, "Código de acceso")}
                className="w-full relative group flex flex-col items-center justify-center font-mono text-2xl font-bold py-6 px-4 rounded-xl border border-[#26231F] bg-[#100F0D] text-[#F9F7F3] hover:border-[#356C92]/50 hover:bg-[#1F1D1A] transition-all cursor-pointer"
                title="Haz clic para copiar"
              >
                <div className="flex items-center gap-3">
                  <span>{createdLink.code}</span>
                  <Copy className="w-5 h-5 text-[#A4A29F] group-hover:text-[#F9F7F3] transition-colors" />
                </div>
                <div className="absolute bottom-2 text-[11px] font-sans font-medium text-[#A4A29F] opacity-0 group-hover:opacity-100 transition-opacity">
                  Haz clic para copiar al portapapeles
                </div>
              </button>
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="border border-[#26231F] text-[#F9F7F3] bg-[#171512] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1F1D1A] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">
                  Tipo de registro
                </label>
                <Select
                  value={linkForm.type}
                  onValueChange={(val) =>
                    setLinkForm((prev) => ({
                      ...prev,
                      type: val as AccessLinkRow["type"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-[#100F0D] border-[#26231F] text-[#A4A29F] h-[34px] rounded-md px-3 py-1">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] bg-[#171512] border-[#26231F] text-[#F9F7F3]">
                    <SelectItem value="VOLUNTEER_JOIN">Voluntario</SelectItem>
                    <SelectItem value="STAFF_JOIN">Staff / colaborador</SelectItem>
                    <SelectItem value="BENEFICIARY_JOIN">Beneficiario</SelectItem>
                    <SelectItem value="GENERIC">Genérico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">
                  Rol asignado (opcional)
                </label>
                <Select
                  value={linkForm.assignedRoleId || "NONE"}
                  onValueChange={(val) =>
                    setLinkForm((prev) => ({ ...prev, assignedRoleId: val === "NONE" ? "" : val }))
                  }
                >
                  <SelectTrigger className="w-full bg-[#100F0D] border-[#26231F] text-[#A4A29F] h-[34px] rounded-md px-3 py-1">
                    <SelectValue placeholder="Sin rol (solo membresía)" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] bg-[#171512] border-[#26231F] text-[#F9F7F3]">
                    <SelectItem value="NONE">Sin rol (solo membresía)</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">
                  Sede
                </label>
                <Select
                  value={linkForm.targetType}
                  onValueChange={(val) =>
                    setLinkForm((prev) => ({
                      ...prev,
                      targetType: val as AccessLinkRow["target_type"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-[#100F0D] border-[#26231F] text-[#A4A29F] h-[34px] rounded-md px-3 py-1">
                    <SelectValue placeholder="Selecciona una sede" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] bg-[#171512] border-[#26231F] text-[#F9F7F3]">
                    <SelectItem value="GLOBAL">Todas las sedes (Global)</SelectItem>
                    <SelectItem value="SEDE">Sede específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {linkForm.targetType === "SEDE" && (
                <div>
                  <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">
                    Sede
                  </label>
                  <Select
                    value={linkForm.assignedSedeId || "NONE"}
                    onValueChange={(val) =>
                      setLinkForm((prev) => ({ ...prev, assignedSedeId: val === "NONE" ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full bg-[#100F0D] border-[#26231F] text-[#A4A29F] h-[34px] rounded-md px-3 py-1">
                      <SelectValue placeholder="Selecciona una sede" />
                    </SelectTrigger>
                    <SelectContent className="z-[120] bg-[#171512] border-[#26231F] text-[#F9F7F3]">
                      <SelectItem value="NONE">Selecciona una sede</SelectItem>
                      {sedes.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id}>
                          {sede.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">
                    Límite de usos
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
                  <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">
                    Expiración (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    style={INPUT_STYLE}
                    value={linkForm.expiresAt}
                    onChange={(e) => setLinkForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  disabled={submitting}
                  className="border border-[#26231F] text-[#F9F7F3] bg-[#171512] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1F1D1A] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateLink} 
                  disabled={submitting}
                  className="bg-[#356C92] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#356C92]/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Creando…" : "Crear código"}
                </button>
              </div>
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell open={!!selectedLink} onClose={() => setSelectedLink(null)}>
        {selectedLink && (
          <div className="flex flex-col gap-5 p-6 relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-none">
            <button 
              onClick={() => setSelectedLink(null)}
              className="absolute top-6 right-6 text-[#A4A29F] hover:text-[#F9F7F3] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#F9F7F3] pr-8 mb-1 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#356C92]" />
              Detalle del Código
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
                  <h3 className="text-sm font-semibold text-[#F9F7F3] mb-3">Información de Acceso</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">Código</label>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm font-bold py-2 px-3 rounded-lg border border-[#26231F] bg-[#100F0D] text-[#F9F7F3] flex-1">
                          {selectedLink.code}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(selectedLink.code, "Código")}
                          className="bg-[#1F1D1A] border border-[#26231F] p-2 rounded-lg text-[#A4A29F] hover:text-[#F9F7F3] hover:bg-[#26231F] transition-colors"
                          title="Copiar código"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[#A4A29F] block mb-1.5 font-medium">Enlace de Redirección</label>
                      <div className="flex items-center gap-2">
                        <div className="text-xs py-2.5 px-3 rounded-lg border border-[#26231F] bg-[#100F0D] text-[#A4A29F] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {`https://democra.pro/ong/join?code=${selectedLink.code}`}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`https://democra.pro/ong/join?code=${selectedLink.code}`, "Enlace")}
                          className="bg-[#1F1D1A] border border-[#26231F] p-2 rounded-lg text-[#A4A29F] hover:text-[#F9F7F3] hover:bg-[#26231F] transition-colors"
                          title="Copiar enlace"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://democra.pro/ong/join?code=${selectedLink.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#356C92]/10 border border-[#356C92]/20 p-2 rounded-lg text-[#356C92] hover:bg-[#356C92]/20 transition-colors"
                          title="Abrir enlace"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
                  <h3 className="text-sm font-semibold text-[#F9F7F3] mb-3">Detalles</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SettingsDetailField 
                      label="Tipo" 
                      value={selectedLink.type === "VOLUNTEER_JOIN" ? "Registro de Voluntarios" : selectedLink.type} 
                    />
                    <SettingsDetailField 
                      label="Ámbito" 
                      value={selectedLink.target_type === "SEDE" ? "Sede Local" : selectedLink.target_type} 
                    />
                    <SettingsDetailField
                      label="Usos"
                      value={`${selectedLink.used_count} / ${selectedLink.max_uses}`}
                    />
                    <SettingsDetailField
                      label="Expiración"
                      value={selectedLink.expires_at ? new Date(selectedLink.expires_at).toLocaleDateString("es-PE") : "Sin vencimiento"}
                    />
                  </div>
                </div>

                <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-[#F9F7F3]">
                    <Users className="w-4 h-4 text-[#08996A]" />
                    Historial de Usos ({selectedLink.used_count})
                  </h3>
                  
                  <div className="max-h-[100px] overflow-y-auto scrollbar-thin">
                    <div className="flex flex-col items-center justify-center bg-[#23211D]/30 rounded-lg border border-dashed border-[#26231F] py-4">
                      <p className="text-sm font-medium text-[#F9F7F3]">Sin canjes ni escaneos registrados.</p>
                      <p className="text-xs text-[#A4A29F] text-center mt-1">
                        Los registros de este código aparecerán aquí.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 flex flex-col gap-4">
                <div className="bg-[#171512] border border-[#26231F] rounded-[12px] p-4 flex flex-col items-center justify-center text-center">
                  <h3 className="text-sm font-semibold text-[#F9F7F3] mb-4">Código QR</h3>
                  <div className="bg-white p-2 rounded-xl mb-4 border border-[#26231F]">
                    <QRCodeSVG 
                      id="qr-code-svg"
                      value={`https://democra.pro/ong/join?code=${selectedLink.code}`} 
                      size={140}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"Q"}
                      includeMargin={false}
                    />
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="w-full bg-[#1F1D1A] border border-[#26231F] text-[#F9F7F3] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#26231F] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar QR
                  </button>
                </div>

                {selectedLink.is_active && (
                  <button 
                    onClick={() => handleRevoke(selectedLink)}
                    className="w-full mt-auto border border-[#ef4444] text-[#ef4444] bg-[#171512] px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#ef4444]/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Revocar código
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalShell>
    
    </motion.div>
  );
}
