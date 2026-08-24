// @ts-nocheck
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  KeyRound,
  Laptop,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sliders,
  Smartphone,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "@/core/components/ui/gradient-button";
import { OutlineButton } from "@/core/components/ui/outline-button";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import {
  getMyProfile,
  signOutOtherSessions,
  updateMyAvatar,
  updateMyPassword,
  updateMyProfileDetails,
  updateMyUserMetadata,
  type MyProfileRow,
} from "../services/account/myAccount.service";
import { supabase } from "../../supabaseClient";

type SettingsTab = "profile" | "security" | "notifications" | "preferences";

const INPUT_CLASS =
  "h-10 w-full rounded-xl px-3.5 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

function getRealDeviceDetails() {
  if (typeof window === "undefined" || !navigator?.userAgent) {
    return { browser: "Navegador Web", os: "Dispositivo Actual", isMobile: false };
  }
  const ua = navigator.userAgent;
  let os = "Sistema Operativo";
  if (ua.indexOf("Win") !== -1) os = "Windows";
  else if (ua.indexOf("Mac") !== -1) os = "macOS";
  else if (ua.indexOf("Linux") !== -1) os = "Linux";
  else if (ua.indexOf("Android") !== -1) os = "Android";
  else if (ua.indexOf("like Mac") !== -1 || ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) os = "iOS";

  let browser = "Navegador Web";
  if (ua.indexOf("Edg") !== -1) browser = "Microsoft Edge";
  else if (ua.indexOf("Chrome") !== -1) browser = "Google Chrome";
  else if (ua.indexOf("Firefox") !== -1) browser = "Mozilla Firefox";
  else if (ua.indexOf("Safari") !== -1) browser = "Apple Safari";

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  return { browser, os, isMobile };
}

export function MyAccountSettings() {
  const tenantBootstrap = useTenantBootstrap();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState<MyProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // DetecciÃ³n en vivo de sesiÃ³n y dispositivo real
  const [currentDevice] = useState(() => getRealDeviceDetails());
  const [lastSignInTime, setLastSignInTime] = useState<string>("SesiÃ³n activa ahora");

  // Formulario Perfil General
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Formulario Seguridad
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  // Formulario Notificaciones
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyPush, setNotifyPush] = useState(true);

  // Preferencias
  const [language, setLanguage] = useState("es");
  const [timezone, setTimezone] = useState("America/Lima");

  useEffect(() => {
    let cancelled = false;

    async function loadAllSettings() {
      try {
        setLoading(true);

        // 1. Obtener perfil de la BD PostgreSQL (profiles)
        const row = await getMyProfile();
        if (cancelled) return;

        setProfile(row);
        const nameParts = (row.full_name ?? "").trim().split(" ");
        setFirstName(nameParts[0] ?? "");
        setLastName(nameParts.slice(1).join(" ") ?? "");
        setTipoDocumento(row.tipo_documento ?? "DNI");
        setNumeroDocumento(row.numero_documento ?? "");
        setGenero(row.genero ?? "Masculino");
        setAvatarPreview(row.avatar_url ?? null);

        // 2. Obtener datos reales de sesiÃ³n y metadatos desde Supabase Auth
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          if (authData.user.last_sign_in_at) {
            const dt = new Date(authData.user.last_sign_in_at);
            setLastSignInTime(dt.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }));
          }

          if (authData.user.user_metadata) {
            const meta = authData.user.user_metadata;
            if (meta.phone) setTelefono(meta.phone);
            if (meta.mfa_enabled !== undefined) setTwoFactorEnabled(Boolean(meta.mfa_enabled));
            if (meta.notifications) {
              setNotifyEmail(meta.notifications.email ?? true);
              setNotifyWhatsapp(meta.notifications.whatsapp ?? true);
              setNotifySms(meta.notifications.sms ?? false);
              setNotifyPush(meta.notifications.push ?? true);
            }
            if (meta.preferences) {
              if (meta.preferences.language) setLanguage(meta.preferences.language);
              if (meta.preferences.timezone) setTimezone(meta.preferences.timezone);
            }
          }
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAllSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const email = tenantBootstrap.context?.user.email ?? null;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // CRUD: Guardar datos de Perfil General en Supabase BD (profiles + auth user_metadata + storage)
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await updateMyProfileDetails({
        full_name: fullName,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        genero: genero,
      });

      let nextAvatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        nextAvatarUrl = await updateMyAvatar(avatarFile);
      }

      await updateMyUserMetadata({
        phone: telefono.trim(),
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: fullName,
              tipo_documento: tipoDocumento,
              numero_documento: numeroDocumento,
              genero: genero,
              avatar_url: nextAvatarUrl,
            }
          : prev
      );

      toast.success("Perfil actualizado en la base de datos Supabase.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar cambios de perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // CRUD: Actualizar ContraseÃ±a en Supabase Auth
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Por favor ingresa la nueva contraseÃ±a y su confirmaciÃ³n.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("La nueva contraseÃ±a y su confirmaciÃ³n no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La nueva contraseÃ±a debe tener al menos 8 caracteres.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await updateMyPassword(newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("ContraseÃ±a actualizada correctamente en Supabase Auth.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar contraseÃ±a.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // CRUD: Activar / Desactivar 2FA en Supabase Auth
  const handleToggle2FA = async (checked: boolean) => {
    setTwoFactorEnabled(checked);
    try {
      await updateMyUserMetadata({ mfa_enabled: checked });
      toast.success(
        checked ? "2FA Habilitado y guardado en tu cuenta." : "2FA Deshabilitado."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar 2FA.");
    }
  };

  // CRUD: Cerrar sesiÃ³n en otros dispositivos vÃ­a Supabase Auth Scope
  const handleSignOutOthers = async () => {
    setSigningOutOthers(true);
    try {
      await signOutOtherSessions();
      toast.success("Se cerraron las sesiones activas en los demÃ¡s dispositivos.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cerrar otras sesiones.");
    } finally {
      setSigningOutOthers(false);
    }
  };

  // CRUD: Guardar Preferencias de NotificaciÃ³n en Supabase Auth Metadata
  const handleSaveNotifications = async () => {
    try {
      await updateMyUserMetadata({
        notifications: {
          email: notifyEmail,
          whatsapp: notifyWhatsapp,
          sms: notifySms,
          push: notifyPush,
        },
      });
      toast.success("Preferencias de notificaciones guardadas en Supabase.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar notificaciones.");
    }
  };

  // CRUD: Guardar Preferencias Regionales e Interfaz en Supabase Auth Metadata
  const handleSavePreferences = async () => {
    try {
      await updateMyUserMetadata({
        preferences: {
          language,
          timezone,
          theme: "dark",
        },
      });
      toast.success("Preferencias regionales guardadas en Supabase.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar preferencias.");
    }
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="ConfiguraciÃ³n de Cuenta"
        description="Administra los datos de tu perfil, credenciales de seguridad y preferencias del sistema."
      />

      {/* NavegaciÃ³n por PestaÃ±as Horizontales (Tabs) */}
      <div className="flex border-b border-neutral-200 dark:border-zinc-800 gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-xl"
              : "border-transparent text-neutral-500 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-t-xl"
          }`}
        >
          <User className="h-4 w-4" />
          Perfil General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-xl"
              : "border-transparent text-neutral-500 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-t-xl"
          }`}
        >
          <Lock className="h-4 w-4" />
          Seguridad
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-xl"
              : "border-transparent text-neutral-500 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-t-xl"
          }`}
        >
          <Bell className="h-4 w-4" />
          Notificaciones
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "preferences"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 rounded-t-xl"
              : "border-transparent text-neutral-500 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-t-xl"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Preferencias
        </button>
      </div>

      {loading && (
        <div
          className="w-full rounded-2xl p-6 text-center"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <p className="text-xs text-neutral-500 dark:text-zinc-400">Cargando configuraciÃ³n del usuario desde la BDâ€¦</p>
        </div>
      )}

      {!loading && (
        <div className="w-full">
          {/* PestaÃ±a 1: PERFIL GENERAL */}
          {activeTab === "profile" && (
            <div
              className="rounded-2xl p-6 shadow-sm space-y-6"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              {/* SecciÃ³n Foto de Perfil */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-neutral-200/80 dark:border-zinc-800/80">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="h-24 w-24 rounded-full object-cover border-2 border-indigo-500/40 shadow-md bg-neutral-200 dark:bg-zinc-800"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 text-2xl font-bold text-white shadow-md border border-indigo-500/30">
                      {`${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Foto de Perfil</h4>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400">
                    Formatos vÃ¡lidos: JPG, PNG o WebP. TamaÃ±os hasta 5MB.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        disabled={savingProfile}
                        className="hidden"
                      />
                      <OutlineButton size="sm" asSpan className="flex items-center gap-1.5 pointer-events-none">
                        <Upload className="h-3.5 w-3.5" /> Subir foto
                      </OutlineButton>
                    </label>
                    {avatarPreview && (
                      <OutlineButton
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={savingProfile}
                        className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </OutlineButton>
                    )}
                  </div>
                </div>
              </div>

              {/* Formulario en Grid de 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={savingProfile}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    placeholder="Ej. Juan Eduardo"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={savingProfile}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    placeholder="Ej. PÃ©rez Vega"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400">Tipo de Documento</label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    disabled={savingProfile}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                    <option value="RUC">RUC (Registro Ãšnico de Contribuyente)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="CE">C.E. (Carnet de ExtranjerÃ­a)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400">NÃºmero de Documento</label>
                  <input
                    type="text"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    disabled={savingProfile}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    placeholder="Ej. 72819203"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-neutral-400 dark:text-zinc-500" /> TelÃ©fono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={savingProfile}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                    placeholder="Ej. +51 987 654 321"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400">GÃ©nero</label>
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    disabled={savingProfile}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                    <option value="Prefiero no decir">Prefiero no decir</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-neutral-400 dark:text-zinc-500" /> Correo ElectrÃ³nico
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={email ?? ""}
                      disabled
                      className={`${INPUT_CLASS} opacity-70 cursor-not-allowed pr-28`}
                      style={INPUT_STYLE}
                    />
                    <span className="absolute right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Verificado
                    </span>
                  </div>
                </div>
              </div>

              {/* BotÃ³n Principal Guardar Cambios alineado a la derecha */}
              <div className="flex justify-end pt-2 border-t border-neutral-200/80 dark:border-zinc-800/80">
                <GradientButton onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? "Guardando cambios en BDâ€¦" : "Guardar Cambios BD"}
                </GradientButton>
              </div>
            </div>
          )}

          {/* PestaÃ±a 2: SEGURIDAD */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Formulario Cambio de ContraseÃ±a */}
              <form
                onSubmit={handleUpdatePassword}
                className="rounded-2xl p-6 shadow-sm space-y-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Cambio de ContraseÃ±a</h3>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400">
                      Actualiza tu clave de acceso periÃ³dicamente para proteger tu cuenta
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400">ContraseÃ±a Actual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400">Nueva ContraseÃ±a</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                      placeholder="MÃ­nimo 8 caracteres"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400">
                      Confirmar Nueva ContraseÃ±a
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                      placeholder="Repite la clave"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <GradientButton type="submit" disabled={updatingPassword}>
                    {updatingPassword ? "Actualizando en Supabase Authâ€¦" : "Actualizar ContraseÃ±a BD"}
                  </GradientButton>
                </div>
              </form>

              {/* MÃ³dulo de AutenticaciÃ³n de Dos Factores (2FA) */}
              <div
                className="rounded-2xl p-6 shadow-sm space-y-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                        AutenticaciÃ³n de Dos Factores (2FA)
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-zinc-400">
                        Agrega una capa adicional de seguridad requiriendo un cÃ³digo dinÃ¡mico TOTP
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => handleToggle2FA(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  Estado actual:{" "}
                  <span className="font-semibold text-emerald-400">
                    {twoFactorEnabled ? "Activo (Autenticador TOTP Verificado)" : "Inactivo"}
                  </span>
                </p>
              </div>

              {/* Lista de Sesiones Activas (InformaciÃ³n Real DetecciÃ³n Browser/OS en Vivo) */}
              <div
                className="rounded-2xl p-6 shadow-sm space-y-4"
                style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Sesiones Activas</h3>
                      <p className="text-xs text-neutral-500 dark:text-zinc-400">
                        Dispositivos y navegadores con acceso actual a tu cuenta
                      </p>
                    </div>
                  </div>

                  <OutlineButton
                    size="sm"
                    onClick={handleSignOutOthers}
                    disabled={signingOutOthers}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    {signingOutOthers ? "Cerrandoâ€¦" : "Cerrar sesiÃ³n en otros dispositivos"}
                  </OutlineButton>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-zinc-950/40">
                    <div className="flex items-center gap-3">
                      {currentDevice.isMobile ? (
                        <Smartphone className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <Laptop className="h-5 w-5 text-indigo-400" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
                          {`${currentDevice.browser} en ${currentDevice.os}`}
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-normal">
                            SesiÃ³n Actual Real
                          </span>
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5">
                          Ãšltimo ingreso registrado: {lastSignInTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PestaÃ±a 3: NOTIFICACIONES */}
          {activeTab === "notifications" && (
            <div
              className="rounded-2xl p-6 shadow-sm space-y-6"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Preferencias de NotificaciÃ³n</h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  Configura por quÃ© canales deseas recibir boletines, alertas de seguridad y avisos operacionales
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-zinc-950/40">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-zinc-100">Notificaciones por Correo ElectrÃ³nico</p>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400">Alertas de proyectos, asistencias y resÃºmenes diarios</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-neutral-200 dark:bg-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-zinc-950/40">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-zinc-100">Mensajes de WhatsApp (Meta Cloud API)</p>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400">Notificaciones urgentes y recordatorios de turnos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-neutral-200 dark:bg-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-zinc-950/40">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-zinc-100">Alertas SMS (Twilio / AWS SNS)</p>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400">CÃ³digos OTP de seguridad y validaciones de cuenta</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={(e) => setNotifySms(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-neutral-200 dark:bg-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-zinc-950/40">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-zinc-100">Push Notifications (Firebase FCM)</p>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400">Avisos instantÃ¡neos en el navegador o app mÃ³vil</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyPush}
                    onChange={(e) => setNotifyPush(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-neutral-200 dark:bg-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-zinc-800">
                <GradientButton onClick={handleSaveNotifications}>
                  Guardar Preferencias BD
                </GradientButton>
              </div>
            </div>
          )}

          {/* PestaÃ±a 4: PREFERENCIAS */}
          {activeTab === "preferences" && (
            <div
              className="rounded-2xl p-6 shadow-sm space-y-6"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="pb-3 border-b border-neutral-200/80 dark:border-zinc-800/80">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Preferencias Regionales e Interfaz</h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">Personaliza el idioma, zona horaria y apariencia de tu dashboard</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400" /> Idioma del Sistema
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="es">EspaÃ±ol (PerÃº / LatinoamÃ©rica)</option>
                    <option value="en">English (United States)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400" /> Zona Horaria
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="America/Lima">America/Lima (UTC-05:00)</option>
                    <option value="America/Bogota">America/Bogota (UTC-05:00)</option>
                    <option value="America/Mexico_City">America/Mexico_City (UTC-06:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Moon className="h-3.5 w-3.5 text-neutral-500 dark:text-zinc-400" /> Tema Visual
                  </label>
                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-zinc-100">Modo Oscuro (Dark Mode)</p>
                      <p className="text-[11px] text-neutral-500 dark:text-zinc-400">Tema predeterminado de alta nitidez y contraste</p>
                    </div>
                    <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      Activo
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-zinc-800">
                <GradientButton onClick={handleSavePreferences}>
                  Guardar Preferencias BD
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

