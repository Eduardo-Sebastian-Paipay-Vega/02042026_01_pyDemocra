import { useState } from "react";
import { StatusDot } from "@/core/components/ui/status-dot";

export function SettingsTechnicalDetails({
  details,
  summary = "Algunos detalles tecnicos estan disponibles para soporte.",
}: {
  details: string | string[];
  summary?: string;
}) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(details) ? details.filter(Boolean) : [details].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
        style={{ color: "var(--t-text-secondary)" }}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {open ? "Ocultar detalles" : "Mostrar informacion tecnica"}
      </button>
      {open && (
        <div
          className="mt-2 rounded-xl px-3 py-2"
          style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            {summary}
          </p>
          <div className="mt-2 space-y-1">
            {items.map((item) => (
              <p
                key={item}
                className="whitespace-pre-wrap break-words text-[11px]"
                style={{ color: "var(--t-text-secondary)" }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
          No pudimos completar esta accion. Intenta nuevamente o contacta al administrador.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
          style={{ color: "var(--t-text-secondary)" }}
          onClick={onRetry}
        >
          Reintentar
        </button>
      </div>
      <SettingsTechnicalDetails details={message} />
    </div>
  );
}

export function SettingsDetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
        {label}
      </p>
      <p
        className="mt-1 whitespace-pre-wrap break-words text-[12px]"
        style={{ color: "var(--t-text-secondary)" }}
      >
        {value || "-"}
      </p>
    </div>
  );
}

export function SettingsSelectField({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        border: "1px solid var(--t-border)",
        background: "var(--t-input-bg)",
        color: "var(--t-text-secondary)",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsSummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
        {label}
      </p>
      <p className="mt-1 text-[20px]" style={{ color: "var(--t-text)" }}>
        {value}
      </p>
    </div>
  );
}

export function SettingsPermissionBadge({
  allowed,
  allowedLabel,
  deniedLabel,
}: {
  allowed: boolean;
  allowedLabel: string;
  deniedLabel: string;
}) {
  return (
    <StatusDot variant={allowed ? "success" : "secondary"}>
      {allowed ? allowedLabel : deniedLabel}
    </StatusDot>
  );
}

export function SettingsFieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>
      {message}
    </p>
  );
}

