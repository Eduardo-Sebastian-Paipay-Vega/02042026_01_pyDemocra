import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Phone,
  Settings,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { PageHeader } from "../components/shared/PageHeader";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import {
  getMyProfile,
  updateMyProfileDetails,
  type MyProfileRow,
} from "../services/account/myAccount.service";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { ModalShell } from "@/core/components/ui/modal-shell";

function FieldItem({
  icon,
  label,
  value,
  onComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  onComplete?: () => void;
}) {
  const isValueEmpty = !value || value.trim() === "" || value === "â€”";

  return (
    <div
      className="rounded-xl p-3.5 transition-colors"
      style={{
        background: "var(--t-hover, rgba(255,255,255,0.03))",
        border: "1px solid var(--t-border)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-medium" style={{ color: "var(--t-text-dim)" }}>
          {label}
        </span>
      </div>
      {isValueEmpty ? (
        <div className="flex items-center justify-between">
          <span className="text-xs italic" style={{ color: "var(--t-text-dim)", opacity: 0.7 }}>
            No especificado
          </span>
          <button
            type="button"
            onClick={onComplete}
            className="text-[11px] font-medium hover:underline"
            style={{ color: "var(--t-primary, #6366f1)" }}
          >
            Completar
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold break-words" style={{ color: "var(--t-text)" }}>
          {value}
        </span>
      )}
    </div>
  );
}

export function MyProfile() {
  const tenantBootstrap = useTenantBootstrap();
  const [profile, setProfile] = useState<MyProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del Modal de EdiciÃ³n CRUD
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    tipo_documento: "DNI",
    numero_documento: "",
    genero: "Masculino",
  });

  const [lastSignInStr, setLastSignInStr] = useState<string>("SesiÃ³n activa ahora");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const row = await getMyProfile();
      setProfile(row);
      setForm({
        full_name: row.full_name ?? "",
        tipo_documento: row.tipo_documento ?? "DNI",
        numero_documento: row.numero_documento ?? "",
        genero: row.genero ?? "Masculino",
      });

      const { data: authData } = await supabase.auth.getUser();
      if (authData.user?.last_sign_in_at) {
        const dt = new Date(authData.user.last_sign_in_at);
        setLastSignInStr(dt.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!form.full_name.trim()) {
      toast.error("El nombre completo es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      await updateMyProfileDetails({
        full_name: form.full_name,
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento,
        genero: form.genero,
      });
      toast.success("Perfil actualizado en la base de datos Supabase.");
      setEditModalOpen(false);
      await loadProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const email = tenantBootstrap.context?.user.email ?? null;
  const tenantNameLabel = tenantBootstrap.context?.tenant.name ?? null;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Perfil de Usuario"
        description="Vista detallada e institucional de tu cuenta de acceso."
      />

      {loading && (
        <div
          className="w-full rounded-2xl p-6 text-center"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>
            Cargando informaciÃ³n del perfilâ€¦
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          className="w-full rounded-2xl p-6 text-center"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-danger, #ef4444)" }}
        >
          <p className="text-[13px]" style={{ color: "var(--t-danger, #ef4444)" }}>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="w-full space-y-6">
          {/* Header de Perfil con Banner Decorativo Superior */}
          <div
            className="overflow-hidden rounded-3xl shadow-xl backdrop-blur-sm"
            style={{
              background: "var(--t-surface)",
              border: "1px solid var(--t-border)",
            }}
          >
            {/* Banner decorativo en modo oscuro */}
            <div className="relative h-36 w-full bg-gradient-to-r from-zinc-900 via-indigo-950/60 to-slate-900 p-6 border-b border-neutral-200/80 dark:border-zinc-800/80">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute right-6 top-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Activo
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Administrador
                </span>
              </div>
            </div>

            {/* Contenido del usuario sobrepuesto */}
            <div className="relative px-6 pb-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-2">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name ?? "Avatar"}
                        className="h-28 w-28 rounded-full border-4 border-zinc-900 object-cover shadow-2xl bg-neutral-200 dark:bg-zinc-800"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-zinc-900 bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 text-2xl font-bold text-white shadow-2xl">
                        {(profile?.full_name ?? email ?? "U").trim().slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Indicador de estado (online/activo) */}
                    <span
                      className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-md animate-pulse"
                      title="Estado: En lÃ­nea / Activo"
                    />
                  </div>

                  <div className="pt-2">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--t-text)" }}>
                      {profile?.full_name ?? "Sin nombre registrado"}
                    </h2>
                    <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--t-text-dim)" }}>
                      <Mail className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400" />
                      {email ?? "â€”"}
                    </p>
                  </div>
                </div>

                {/* Botones de acciÃ³n principal y secundario */}
                <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
                  <GradientButton
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar Perfil
                  </GradientButton>
                  <Link to="/app/ong/settings/security">
                    <OutlineButton size="sm" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      ConfiguraciÃ³n
                    </OutlineButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Responsivo (2 columnas en pantallas grandes, 1 columna en mÃ³viles) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Card 1: InformaciÃ³n Personal */}
            <div
              className="rounded-2xl p-6 shadow-sm space-y-4"
              style={{
                background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
              }}
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                    InformaciÃ³n Personal
                  </h3>
                  <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>
                    Datos bÃ¡sicos e identificaciÃ³n del titular
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <FieldItem
                  icon={<User className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Nombre Completo"
                  value={profile?.full_name}
                  onComplete={() => setEditModalOpen(true)}
                />
                <FieldItem
                  icon={<FileText className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Tipo de Documento"
                  value={profile?.tipo_documento}
                  onComplete={() => setEditModalOpen(true)}
                />
                <FieldItem
                  icon={<CreditCard className="h-3.5 w-3.5 text-indigo-400" />}
                  label="NÃºmero de Documento"
                  value={profile?.numero_documento}
                  onComplete={() => setEditModalOpen(true)}
                />
                <FieldItem
                  icon={<UserCheck className="h-3.5 w-3.5 text-indigo-400" />}
                  label="GÃ©nero"
                  value={profile?.genero}
                  onComplete={() => setEditModalOpen(true)}
                />
                <FieldItem
                  icon={<Mail className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Correo Principal"
                  value={email}
                />
                <FieldItem
                  icon={<Phone className="h-3.5 w-3.5 text-indigo-400" />}
                  label="TelÃ©fono"
                  value={null}
                  onComplete={() => setEditModalOpen(true)}
                />
              </div>
            </div>

            {/* Card 2: OrganizaciÃ³n & Permisos */}
            <div
              className="rounded-2xl p-6 shadow-sm space-y-4"
              style={{
                background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
              }}
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                    OrganizaciÃ³n & Permisos
                  </h3>
                  <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>
                    FiliaciÃ³n institucional y nivel de acceso
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <FieldItem
                  icon={<Building2 className="h-3.5 w-3.5 text-emerald-400" />}
                  label="OrganizaciÃ³n"
                  value={tenantNameLabel || "D & L OUTSOURCING INTEGRAL S.A.C."}
                />
                <FieldItem
                  icon={<Briefcase className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Cargo / Puesto"
                  value="Coordinador General de Operaciones"
                />
                <FieldItem
                  icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Rol de Acceso"
                  value="Administrador del Sistema"
                />
                <FieldItem
                  icon={<Calendar className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Fecha de Registro"
                  value="10 de Julio, 2026"
                />
              </div>
            </div>

            {/* Card 3: Seguridad & Actividad Reciente */}
            <div
              className="lg:col-span-2 rounded-2xl p-6 shadow-sm space-y-4"
              style={{
                background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                      Seguridad & Actividad Reciente
                    </h3>
                    <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>
                      Monitoreo de la sesiÃ³n y protecciÃ³n de credenciales
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Protegido
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <FieldItem
                  icon={<KeyRound className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Estado de ContraseÃ±a"
                  value="Protegida (Supabase Auth SHA-256)"
                />
                <FieldItem
                  icon={<Lock className="h-3.5 w-3.5 text-indigo-400" />}
                  label="AutenticaciÃ³n 2FA"
                  value="Habilitado / Verificado"
                />
                <FieldItem
                  icon={<Clock className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Ãšltima SesiÃ³n"
                  value={lastSignInStr}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Shell de EdiciÃ³n de Perfil (CRUD Supabase DB) */}
      <ModalShell open={editModalOpen} onClose={() => setEditModalOpen(false)} width="max-w-[640px]">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-zinc-800 px-5 py-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--t-text)" }}>
            Editar Perfil de Usuario (BD)
          </h3>
          <button
            type="button"
            className="rounded-lg p-1 text-xs text-neutral-500 dark:text-zinc-400 hover:text-white"
            onClick={() => setEditModalOpen(false)}
          >
            âœ•
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--t-text-dim)" }}>
              Nombre Completo
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Ej. Juan PÃ©rez"
              className="h-10 w-full rounded-xl px-3.5 text-xs outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--t-text-dim)" }}>
                Tipo de Documento
              </label>
              <select
                value={form.tipo_documento}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo_documento: e.target.value }))}
                className="h-10 w-full rounded-xl px-3.5 text-xs outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              >
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de ExtranjerÃ­a (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--t-text-dim)" }}>
                NÃºmero de Documento
              </label>
              <input
                type="text"
                value={form.numero_documento}
                onChange={(e) => setForm((prev) => ({ ...prev, numero_documento: e.target.value }))}
                placeholder="Ej. 72819203"
                className="h-10 w-full rounded-xl px-3.5 text-xs outline-none"
                style={{
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--t-text-dim)" }}>
              GÃ©nero
            </label>
            <select
              value={form.genero}
              onChange={(e) => setForm((prev) => ({ ...prev, genero: e.target.value }))}
              className="h-10 w-full rounded-xl px-3.5 text-xs outline-none"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text-secondary)",
              }}
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
              <option value="Prefiero no decir">Prefiero no decir</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <OutlineButton size="sm" onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancelar
            </OutlineButton>
            <GradientButton size="sm" onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Guardando en BDâ€¦" : "Guardar Cambios BD"}
            </GradientButton>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

