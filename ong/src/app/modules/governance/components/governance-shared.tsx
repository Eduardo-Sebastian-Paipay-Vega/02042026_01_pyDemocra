import { StatusDot } from '@/core/components/ui/status-dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";

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
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger 
        className="h-10 rounded-xl px-3 text-[12px] outline-none w-full border-[#26231F] bg-[#100F0D] text-[#F9F7F3]"
      >
        <SelectValue placeholder="Seleccionar opción" />
      </SelectTrigger>
      <SelectContent className="bg-[#171512] border-[#26231F] text-[#F9F7F3]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[12px] focus:bg-[#1F1D1A] focus:text-white">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
