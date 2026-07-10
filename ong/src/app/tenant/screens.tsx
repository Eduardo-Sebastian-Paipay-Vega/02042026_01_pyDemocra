import type { ReactNode } from "react";
import { AlertTriangle, Building2, ShieldAlert } from "lucide-react";
import type { TenantBootstrapStatus, TenantContextValue } from "./bootstrap";

// REQ-003 (dds/MEJORAS/09072026/REQ003.md): reemplaza el spinner genérico
// por el isotipo oficial con una micro-animación de flotación. Scoped al
// componente (en vez de un CSS global) porque ong/src no importa
// src/styles/*, donde ya existe un patrón equivalente ("logoBreath") para
// el resto del sitio.
function TenantLoadingLogo() {
  return (
    <>
      <style>{`
        @keyframes tenantLogoFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-4px) scale(1.02); }
        }
        .tenant-loading-logo {
          animation: tenantLogoFloat 2.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tenant-loading-logo { animation: none; }
        }
      `}</style>
      <img
        src="/Imagen/Iconos/logo_cua1.png"
        alt=""
        className="tenant-loading-logo mx-auto h-10 w-10 object-contain"
      />
    </>
  );
}

export function TenantBootstrapLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div
        className="w-full max-w-[560px] rounded-3xl p-6 text-center"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <TenantLoadingLogo />
        <h1 className="mt-4 text-[18px]" style={{ color: "var(--t-text)" }}>
          Cargando contexto del tenant
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
          Estamos resolviendo tenant, modulos y permisos antes de abrir el shell.
        </p>
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
