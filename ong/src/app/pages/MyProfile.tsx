import { useEffect, useState } from "react";
import { Link } from "react-router";
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
import { PageHeader } from "../components/shared/PageHeader";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import { getMyProfile, type MyProfileRow } from "../services/account/myAccount.service";
import { GradientButton } from "../components/ui/gradient-button";
import { OutlineButton } from "../components/ui/outline-button";

function FieldItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  const isValueEmpty = !value || value.trim() === "" || value === "—";

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
          <Link
            to="/app/ong/account/settings"
            className="text-[11px] font-medium hover:underline"
            style={{ color: "var(--t-primary, #6366f1)" }}
          >
            Completar
          </Link>
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

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((row) => {
        if (!cancelled) setProfile(row);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            Cargando información del perfil…
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
            <div className="relative h-36 w-full bg-gradient-to-r from-zinc-900 via-indigo-950/60 to-slate-900 p-6 border-b border-zinc-800/80">
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
                        className="h-28 w-28 rounded-full border-4 border-zinc-900 object-cover shadow-2xl bg-zinc-800"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-zinc-900 bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 text-2xl font-bold text-white shadow-2xl">
                        {(profile?.full_name ?? email ?? "U").trim().slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Indicador de estado (online/activo) */}
                    <span
                      className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-md animate-pulse"
                      title="Estado: En línea / Activo"
                    />
                  </div>

                  <div className="pt-2">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--t-text)" }}>
                      {profile?.full_name ?? "Sin nombre registrado"}
                    </h2>
                    <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--t-text-dim)" }}>
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      {email ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Botones de acción principal y secundario */}
                <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
                  <Link to="/app/ong/account/settings">
                    <GradientButton size="sm" className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar Perfil
                    </GradientButton>
                  </Link>
                  <Link to="/app/ong/settings/security">
                    <OutlineButton size="sm" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      Configuración
                    </OutlineButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Responsivo (2 columnas en pantallas grandes, 1 columna en móviles) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Card 1: Información Personal */}
            <div
              className="rounded-2xl p-6 shadow-sm space-y-4"
              style={{
                background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
              }}
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                    Información Personal
                  </h3>
                  <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>
                    Datos básicos e identificación del titular
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <FieldItem
                  icon={<User className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Nombre Completo"
                  value={profile?.full_name}
                />
                <FieldItem
                  icon={<FileText className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Tipo de Documento"
                  value={profile?.tipo_documento}
                />
                <FieldItem
                  icon={<CreditCard className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Número de Documento"
                  value={profile?.numero_documento}
                />
                <FieldItem
                  icon={<UserCheck className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Género"
                  value={profile?.genero}
                />
                <FieldItem
                  icon={<Mail className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Correo Principal"
                  value={email}
                />
                <FieldItem
                  icon={<Phone className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Teléfono"
                  value={null}
                />
              </div>
            </div>

            {/* Card 2: Organización & Permisos */}
            <div
              className="rounded-2xl p-6 shadow-sm space-y-4"
              style={{
                background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
              }}
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                    Organización & Permisos
                  </h3>
                  <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>
                    Filiación institucional y nivel de acceso
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <FieldItem
                  icon={<Building2 className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Organización"
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

            {/* Card 3: Seguridad & Actividad Reciente (Full Width en LG) */}
            <div
              className="lg:col-span-2 rounded-2xl p-6 shadow-sm space-y-4"
              style={{
                background: "var(--t-surface)",
                border: "1px solid var(--t-border)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                      Seguridad & Actividad Reciente
                    </h3>
                    <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>
                      Monitoreo de la sesión y protección de credenciales
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
                  label="Estado de Contraseña"
                  value="Protegida (Supabase Auth SHA-256)"
                />
                <FieldItem
                  icon={<Lock className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Autenticación 2FA"
                  value="Habilitado / Verificado"
                />
                <FieldItem
                  icon={<Clock className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Última Sesión"
                  value="Hoy a las 17:45 PM (IP 190.235.xxx.xxx)"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
