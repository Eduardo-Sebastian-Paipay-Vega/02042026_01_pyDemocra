import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Search, Bell, Menu, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme, type Intensity } from "@ong/app/lib/theme-context";
import { useSettings } from "@/core/context/SettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {  cn  } from "@/core/components/ui/utils";

interface TopbarProps {
  title: string;
  breadcrumb?: string;
  tenantName?: string | null;
  // REQ004.md#1: no existe hoy una columna de logo en public.tenants
  // (confirmado contra dds/MEJORAS/BD_viva_09072026.txt), así que este
  // valor siempre llega null por ahora — el slot y su fallback de iniciales
  // quedan listos para conectarse en cuanto exista la columna real.
  tenantLogoUrl?: string | null;
  userLabel?: string | null;
  userAvatarUrl?: string | null;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  notifications?: Array<{
    id: string;
    title: string;
    description: string;
    targetPath: string;
  }>;
  notificationsLoading?: boolean;
  notificationsError?: string | null;
  onNotificationClick?: (path: string) => void;
  onMarkNotificationRead?: (id: string) => void;
  onRetryNotifications?: () => void;
  notificationsViewAllPath?: string;
}

const intensityLabels: Record<Intensity, string> = {
  suave: "Suave",
  normal: "Normal",
  vibrante: "Vibrante",
};

function getInitials(label: string | null | undefined): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : trimmed.slice(0, 2);
  return initials.toUpperCase();
}

// REQ004.md#3 (Topbar) / REQ005.md#4 (popup): avatar reutilizado por el
// widget del trigger y por el encabezado del dropdown, con fallback de
// iniciales cuando profiles.avatar_url es nulo.
function UserAvatar({
  avatarUrl,
  label,
  className,
}: {
  avatarUrl: string | null;
  label: string | null;
  className: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn(className, "rounded-full object-cover")}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={cn(
        className,
        "flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--t-primary)]/60 to-[var(--t-secondary)]/60 text-[10px] font-semibold text-white"
      )}
    >
      {getInitials(label)}
    </div>
  );
}

export function Topbar({
  title,
  breadcrumb,
  tenantName = null,
  tenantLogoUrl = null,
  userLabel = null,
  userAvatarUrl = null,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  onMenuClick,
  onSearchClick,
  notifications = [],
  notificationsLoading = false,
  notificationsError = null,
  onNotificationClick,
  onMarkNotificationRead,
  onRetryNotifications,
  notificationsViewAllPath,
}: TopbarProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme, intensity, setIntensity } = useTheme();
  const { theme: globalTheme, saveSettings } = useSettings();
  const [showIntensity, setShowIntensity] = useState(false);
  const intensityRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isSearchPage = location.pathname.includes("/ong/app/search");

  // Close intensity popover on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (intensityRef.current && !intensityRef.current.contains(e.target as Node)) {
        setShowIntensity(false);
      }
    }
    if (showIntensity) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showIntensity]);

  return (
    <div
      className="sticky top-0 z-20 h-16 backdrop-blur-xl"
      style={{
        background: "var(--t-topbar)",
        borderBottom: "1px solid var(--t-border-strong)",
      }}
    >
      <div className="flex h-full items-center justify-between gap-4 px-5 sm:px-6">
        {/* Left: Menu + Title & Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            data-sidebar-toggle="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors md:hidden"
            style={{ color: "var(--t-text-secondary)" }}
            aria-label={t("Abrir menú")}
          >
            <Menu className="h-4 w-4" />
          </button>

          {tenantName && (
            <UserAvatar
              avatarUrl={tenantLogoUrl}
              label={tenantName}
              className="hidden h-7 w-7 shrink-0 sm:flex"
            />
          )}

          <div className="flex min-w-0 items-center gap-2">
            {breadcrumb && (
              <>
                <span className="hidden shrink-0 sm:inline text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                  {breadcrumb}
                </span>
                <span className="hidden shrink-0 sm:inline text-[12px]" style={{ color: "var(--t-text-dim)", opacity: 0.5 }}>/</span>
              </>
            )}
            {/* REQ004.md#2: min-w-0 + truncate evitan que el nombre largo del
                tenant y el título de la sección activa se encimen en
                pantallas angostas (los flex items por defecto no se
                encogen sin min-w-0). */}
            <div className="min-w-0 max-w-[45vw] sm:max-w-[320px]">
              {tenantName && (
                <p
                  className="hidden truncate text-[11px] font-semibold uppercase tracking-wider sm:block"
                  style={{ color: "var(--t-text-secondary)" }}
                  title={tenantName}
                >
                  {tenantName}
                </p>
              )}
              <h2 className="truncate text-base font-medium" style={{ color: "var(--t-text)" }} title={t(title)}>
                {t(title)}
              </h2>
            </div>
          </div>
        </div>

        {/* Center: Search trigger */}
        {!isSearchPage && (
          <div className="mx-4 hidden w-48 lg:w-56 md:block">
            <button
              onClick={onSearchClick}
              className="flex h-9 w-full items-center gap-2.5 rounded-2xl px-3.5 text-left transition-colors duration-200 hover:bg-[var(--t-hover)]"
              style={{
                border: "1px solid var(--t-border-strong)",
                background: "var(--t-surface)",
              }}
            >
              <Search className="h-3.5 w-3.5" style={{ color: "var(--t-text-tertiary)" }} />
              <span className="flex-1 text-[13px]" style={{ color: "var(--t-text-tertiary)" }}>
                Búsqueda global...
              </span>
            </button>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Mobile search */}
          {!isSearchPage && (
            <button
              onClick={onSearchClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--t-hover)] md:hidden"
              style={{ color: "var(--t-text-secondary)" }}
              aria-label="Búsqueda global"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Intensity control */}
          <div className="relative hidden sm:block" ref={intensityRef}>
            <button
              onClick={() => setShowIntensity(!showIntensity)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-[var(--t-hover)]"
              style={{ color: "var(--t-text-secondary)" }}
              aria-label={t("Intensidad visual")}
              title={t("Intensidad visual")}
            >
              <Sparkles className="h-4 w-4" />
            </button>
            {showIntensity && (
              <div
                className="absolute right-0 top-11 z-50 w-[190px] rounded-2xl p-2 backdrop-blur-2xl"
                style={{
                  background: "var(--t-elevated)",
                  border: "1px solid var(--t-border-strong)",
                  boxShadow: "var(--t-shadow-lg)",
                }}
              >
                <p className="px-2 py-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--t-text-dim)" }}>
                  {t("Intensidad")}
                </p>
                {(["suave", "normal", "vibrante"] as Intensity[]).map((i) => (
                  <button
                    key={i}
                    onClick={() => { setIntensity(i); setShowIntensity(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-colors duration-150",
                      intensity === i ? "bg-[var(--t-active)]" : "hover:bg-[var(--t-hover)]"
                    )}
                    style={{ color: intensity === i ? "var(--t-text)" : "var(--t-text-secondary)" }}
                  >
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      i === "suave" ? "bg-[var(--t-primary)]/30" : i === "normal" ? "bg-[var(--t-primary)]/60" : "bg-[var(--t-primary)]"
                    )} />
                    {t(intensityLabels[i])}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle — syncs with SettingsContext + DB */}
          <button
            onClick={() => {
              const next = globalTheme === 'dark' ? 'light' : 'dark';
              saveSettings({ theme: next });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-[var(--t-hover)]"
            style={{ color: "var(--t-text-secondary)" }}
            aria-label={theme === "oscuro" ? t("Cambiar a modo claro") : t("Cambiar a modo oscuro")}
            title={theme === "oscuro" ? t("Modo claro") : t("Modo oscuro")}
          >
            {theme === "oscuro" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--t-hover)]"
                style={{ color: "var(--t-text-secondary)" }}
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--t-warning)]" />
                )}
                <span className="sr-only">{t("Notificaciones")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5" style={{ background: "var(--t-elevated)", border: "1px solid var(--t-border-strong)", boxShadow: "var(--t-shadow-lg)" }}>
              <DropdownMenuLabel className="text-[12px]" style={{ color: "var(--t-text)" }}>{t("Notificaciones")}</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: "var(--t-border)" }} />
              {notificationsLoading && (
                <DropdownMenuItem disabled className="focus:bg-[var(--t-hover)]">
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px]" style={{ color: "var(--t-text)" }}>{t("Cargando")}</p>
                    <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                      {t("Consultando historial real de notificaciones del usuario actual.")}
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
              {!notificationsLoading && notificationsError && (
                <>
                  <DropdownMenuItem disabled className="focus:bg-[var(--t-hover)]">
                    <div className="flex flex-col gap-1">
                      <p className="text-[13px]" style={{ color: "var(--t-text)" }}>{t("No disponible")}</p>
                      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                        {notificationsError}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  {onRetryNotifications && (
                    <DropdownMenuItem
                      className="focus:bg-[var(--t-hover)]"
                      onSelect={(event) => {
                        event.preventDefault();
                        onRetryNotifications();
                      }}
                    >
                      <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                        {t("Reintentar")}
                      </span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                <DropdownMenuItem disabled className="focus:bg-[var(--t-hover)]">
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px]" style={{ color: "var(--t-text)" }}>{t("Sin pendientes")}</p>
                    <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                      {t("No hay notificaciones sin leer en el historial real.")}
                    </p>
                  </div>
                </DropdownMenuItem>
              )}
              {!notificationsLoading &&
                !notificationsError &&
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="focus:bg-[var(--t-hover)]"
                    onSelect={(event) => {
                      event.preventDefault();
                      onMarkNotificationRead?.(notification.id);
                      onNotificationClick?.(notification.targetPath);
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-[13px]" style={{ color: "var(--t-text)" }}>
                        {notification.title}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                        {notification.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              {notificationsViewAllPath && (
                <>
                  <DropdownMenuSeparator style={{ background: "var(--t-border)" }} />
                  <DropdownMenuItem
                    className="focus:bg-[var(--t-hover)]"
                    onSelect={(event) => {
                      event.preventDefault();
                      onNotificationClick?.(notificationsViewAllPath);
                    }}
                  >
                    <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                      {t("Ver historial real")}
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar — REQ004.md#3: nombre completo + foto real en vez
              del correo. REQ005.md#4: mismo par foto+nombre en el
              encabezado del popup en vez del correo. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-[var(--t-hover)]">
                <UserAvatar avatarUrl={userAvatarUrl} label={userLabel} className="h-6 w-6" />
                <span className="hidden max-w-[160px] truncate sm:inline text-[14px] font-semibold" style={{ color: "var(--t-text-secondary)" }}>
                  {userLabel ?? t("Cuenta")}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-1.5" style={{ background: "var(--t-elevated)", border: "1px solid var(--t-border-strong)", boxShadow: "var(--t-shadow-lg)" }}>
              <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-[12px]" style={{ color: "var(--t-text)" }}>
                <UserAvatar avatarUrl={userAvatarUrl} label={userLabel} className="h-8 w-8" />
                <span className="truncate">{userLabel ?? t("Mi cuenta")}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: "var(--t-border)" }} />
              <DropdownMenuItem
                className="text-[12px] focus:bg-[var(--t-hover)]"
                style={{ color: "var(--t-text-secondary)" }}
                onSelect={(event) => {
                  event.preventDefault();
                  onProfileClick?.();
                }}
              >
                {t("Perfil")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] focus:bg-[var(--t-hover)]"
                style={{ color: "var(--t-text-secondary)" }}
                onSelect={(event) => {
                  event.preventDefault();
                  onSettingsClick?.();
                }}
              >
                {t("Configuración")}
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: "var(--t-border)" }} />
              <DropdownMenuItem 
                className="text-[12px] focus:bg-[var(--t-hover)] text-red-400/70 focus:text-red-400"
                onSelect={(event) => {
                  event.preventDefault();
                  onLogoutClick?.();
                }}
              >
                {t("Cerrar sesión")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}




