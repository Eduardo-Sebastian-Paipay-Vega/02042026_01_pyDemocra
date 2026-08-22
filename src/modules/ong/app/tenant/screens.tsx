import type { ReactNode } from "react";
import { Link } from "react-router";
import { AlertTriangle, Building2, LoaderCircle, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";
import type { TenantBootstrapStatus, TenantContextValue } from "./bootstrap";

interface TenantBootstrapLoadingScreenProps {
  title?: string;
  subtitle?: string;
  branding?: ReactNode;
  icon?: ReactNode;
  showSkeletons?: boolean;
  mode?: "fullscreen" | "inline";
  className?: string;
}

export function TenantBootstrapLoadingScreen({
  title = "Cargando contexto del tenant",
  subtitle = "Estamos resolviendo tenant, modulos y permisos antes de abrir el shell.",
  branding,
  icon,
  showSkeletons = true,
  mode = "fullscreen",
  className,
}: TenantBootstrapLoadingScreenProps = {}) {
  const isFullscreen = mode === "fullscreen";
  const defaultIcon = (
    <LoaderCircle
      className="h-8 w-8 animate-spin"
      style={{ color: "var(--t-text-dim)" }}
    />
  );

  return (
    <div
      className={cn(
        isFullscreen
          ? "flex min-h-screen items-center justify-center px-6"
          : "w-full",
        className
      )}
    >
      <div
        className={cn(
          "w-full rounded-3xl p-6",
          isFullscreen ? "max-w-[560px] text-center" : "text-left"
        )}
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        {branding ? (
          <div className={cn("mb-4", isFullscreen ? "flex justify-center" : "flex justify-start")}>
            {branding}
          </div>
        ) : (
          <div
            className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px]",
              isFullscreen ? "mx-auto" : ""
            )}
            style={{ background: "var(--t-hover)", color: "var(--t-text-dim)" }}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Tenant bootstrap</span>
          </div>
        )}

        <div className={cn("flex items-center gap-3", isFullscreen ? "justify-center" : "")}>
          {icon ?? defaultIcon}
          <div>
            <h1 className="text-[18px]" style={{ color: "var(--t-text)" }}>
              {title}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
              {subtitle}
            </p>
          </div>
        </div>

        {showSkeletons ? (
          <div className={cn("mt-5 grid gap-3", isFullscreen ? "sm:grid-cols-2" : "md:grid-cols-3")}>
            <div
              className="h-16 animate-pulse rounded-2xl"
              style={{ background: "var(--t-input-bg)" }}
            />
            <div
              className="h-16 animate-pulse rounded-2xl"
              style={{ background: "var(--t-input-bg)" }}
            />
            <div
              className="h-16 animate-pulse rounded-2xl"
              style={{ background: "var(--t-input-bg)" }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function resolveStatusCopy(
  status: TenantBootstrapStatus,
  message: string | null,
  context: TenantContextValue | null
) {
  if (status === "unauthenticated") {
    return {
      title: "Sesion no disponible",
      description: "Inicia sesion nuevamente para cargar el contexto del tenant.",
      icon: ShieldAlert,
    };
  }

  if (status === "license_exceeded") {
    return {
      title: "LÃ­mite de licencias alcanzado",
      description:
        message ??
        "El tenant ha superado el nÃºmero mÃ¡ximo de licencias activas. Contacta al soporte para ampliar el plan.",
      icon: ShieldAlert,
    };
  }

  if (status === "missing_profile") {
    return {
      title: "Perfil no encontrado",
      description:
        message ??
        "El usuario autenticado no tiene registro en public.profiles. Completa onboarding o revisa la provision.",
      icon: AlertTriangle,
    };
  }

  if (status === "missing_tenant") {
    return {
      title: "Tenant sin asignar",
      description:
        message ??
        "El perfil existe, pero no tiene tenant_id. Debes resolver onboarding o asociacion institucional.",
      icon: Building2,
    };
  }

  if (status === "invalid_tenant") {
    return {
      title: "Tenant no disponible",
      description:
        message ??
        "El tenant asociado al perfil ya no existe o no es visible para la sesion actual.",
      icon: Building2,
    };
  }

  if (status === "unsupported_industry") {
    return {
      title: "Industria aun no soportada en este shell",
      description:
        message ??
        `La industria ${context?.tenant.industryTypeId ?? "desconocida"} todavia no tiene shell dedicado aqui.`,
      icon: AlertTriangle,
    };
  }

  return {
    title: "No se pudo cargar la aplicacion",
    description:
      message ??
      "Ocurrio un error inesperado mientras se resolvia el bootstrap del tenant.",
    icon: AlertTriangle,
  };
}

export function TenantStatusScreen({
  status,
  message,
  context,
  action,
}: {
  status: TenantBootstrapStatus;
  message: string | null;
  context: TenantContextValue | null;
  action?: ReactNode;
}) {
  const copy = resolveStatusCopy(status, message, context);
  const Icon = copy.icon;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div
        className="w-full max-w-[620px] rounded-3xl p-6 text-center"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--t-hover)" }}
        >
          <Icon className="h-6 w-6" style={{ color: "var(--t-text-dim)" }} />
        </div>
        <h1 className="mt-4 text-[18px]" style={{ color: "var(--t-text)" }}>
          {copy.title}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
          {copy.description}
        </p>
        {status === "unauthenticated" && !action ? (
          <div className="mt-6">
            <Link
              to="/app/login"
              className="inline-block rounded-xl px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #3D6BFF 0%, #2DBFB0 100%)" }}
            >
              Ir a iniciar sesiÃ³n
            </Link>
          </div>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

export function TenantFinancialBanner({
  context,
}: {
  context: TenantContextValue | null;
}) {
  if (!context?.financialPolicy.message) {
    return null;
  }

  return (
    <div
      className="mb-4 rounded-2xl px-4 py-3 text-[12px]"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
        <span style={{ color: "var(--t-text)" }}>
          Estado financiero: {context.financialPolicy.label}
        </span>
      </div>
      <p className="mt-2" style={{ color: "var(--t-text-dim)" }}>
        {context.financialPolicy.message}
      </p>
    </div>
  );
}

export function TenantInlineAccessDenied({
  title = "Sin acceso a esta ruta",
  description = "Tus permisos o modulos activos no habilitan esta vista para el tenant actual.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      className="rounded-3xl px-6 py-10 text-center"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <ShieldAlert
        className="mx-auto h-8 w-8"
        style={{ color: "var(--t-text-dim)" }}
      />
      <h2 className="mt-4 text-[18px]" style={{ color: "var(--t-text)" }}>
        {title}
      </h2>
      <p className="mt-2 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
        {description}
      </p>
    </div>
  );
}

