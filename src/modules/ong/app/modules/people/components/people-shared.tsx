import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef } from "react";

export function formatPeopleDate(value: string | null | undefined): string {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatPeopleText(value: string | null | undefined): string {
  return value && value.trim() ? value : "Sin dato";
}

export function PeopleErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
      style={{ background: "var(--t-elevated)", border: "1px solid var(--t-border-strong)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--t-text)" }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
          style={{ color: "var(--t-text-secondary)" }}
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function PeopleDetailField({
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
      <p className="mt-1 text-[12px]" style={{ color: "var(--t-text)" }}>
        {value || "-"}
      </p>
    </div>
  );
}

export function PeopleSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <div className="mb-4">
        <p className="text-[12px] font-medium" style={{ color: "var(--t-text)" }}>
          {title}
        </p>
        {description && (
          <p className="mt-1 text-[11px]" style={{ color: "var(--t-text-tertiary)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function PeopleModalHeader({
  title,
  description,
  onClose,
  actions,
}: {
  title: string;
  description: string;
  onClose: () => void;
  actions?: ReactNode;
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-5 py-4"
      style={{
        borderBottom: "1px solid var(--t-border-strong)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div>
        <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
          {title}
        </h3>
        <p className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          aria-label="Cerrar modal"
          className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
          style={{ color: "var(--t-text-secondary)" }}
          onClick={onClose}
        >
          X
        </button>
      </div>
    </div>
  );
}

export function PeopleFieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>
      {message}
    </p>
  );
}

export function PeopleField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px]" style={{ color: "var(--t-text-secondary)" }}>
        {label}
      </span>
      {children}
      <PeopleFieldError message={error} />
    </label>
  );
}

export const PeopleTextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => {
    const mergedClassName = ["ong-field-control h-10 w-full rounded-xl px-3 text-[12px] outline-none", className]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        {...props}
        ref={ref}
        className={mergedClassName}
        style={{
          border: "1px solid var(--t-border-strong)",
          background: "var(--t-input-bg)",
          color: "var(--t-text)",
          ...style,
        }}
      />
    );
  }
);

PeopleTextInput.displayName = "PeopleTextInput";

export const PeopleSelectInput = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, style, ...props }, ref) => {
  const mergedClassName = ["ong-field-control ong-native-select h-10 w-full rounded-xl px-3 text-[12px] outline-none", className]
    .filter(Boolean)
    .join(" ");

  return (
    <select
      {...props}
      ref={ref}
      className={mergedClassName}
      style={{
        border: "1px solid var(--t-border-strong)",
        background: "var(--t-input-bg)",
        color: "var(--t-text)",
        ...style,
      }}
    />
  );
});

PeopleSelectInput.displayName = "PeopleSelectInput";

export const PeopleTextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, style, ...props }, ref) => {
  const mergedClassName = ["ong-field-control w-full rounded-xl px-3 py-2 text-[12px] outline-none", className]
    .filter(Boolean)
    .join(" ");

  return (
    <textarea
      {...props}
      ref={ref}
      className={mergedClassName}
      style={{
        border: "1px solid var(--t-border-strong)",
        background: "var(--t-input-bg)",
        color: "var(--t-text)",
        ...style,
      }}
    />
  );
});

PeopleTextArea.displayName = "PeopleTextArea";

export function PeopleBoolean({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
