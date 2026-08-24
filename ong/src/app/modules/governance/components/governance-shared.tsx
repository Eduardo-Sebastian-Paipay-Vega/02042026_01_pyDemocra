import { StatusDot } from '@/core/components/ui/status-dot';

export function GovernanceErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: "var(--t-elevated)", border: "1px solid var(--t-border-strong)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
        {message}
      </p>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
        style={{ color: "var(--t-text-secondary)" }}
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  );
}

export function GovernanceDetailField({
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
      <p className="text-[11px]" style={{ color: "var(--t-text-tertiary)" }}>
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-[12px]" style={{ color: "var(--t-text)" }}>
        {value || "-"}
      </p>
    </div>
  );
}

export function GovernanceSelectField({
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
      className="ong-field-control ong-native-select h-10 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70"
      style={{
        border: "1px solid var(--t-border-strong)",
        background: "var(--t-input-bg)",
        color: "var(--t-text)",
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

export function GovernanceJsonPreview({ value }: { value: unknown }) {
  return (
    <pre
      className="max-h-[320px] overflow-auto rounded-xl p-3 text-[11px]"
      style={{
        background: "var(--t-board)",
        border: "1px solid var(--t-border-strong)",
        color: "var(--t-text-secondary)",
      }}
    >
      {value === null || value === undefined ? "-" : JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function GovernancePermissionBadge({
  allowed,
  allowedLabel,
  deniedLabel,
}: {
  allowed: boolean;
  allowedLabel: string;
  deniedLabel: string;
}) {
  return <StatusDot variant={allowed ? "success" : "secondary"}>{allowed ? allowedLabel : deniedLabel}</StatusDot>;
}
