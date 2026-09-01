import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

interface FilterOption {
  label: string;
  value: string;
  active: boolean;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterOption[];
  onFilterClick?: (value: string) => void;
  className?: string;
  actions?: React.ReactNode;
  disabled?: boolean;
}

export function FilterBar({
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  filters = [],
  onFilterClick,
  className,
  actions,
  disabled = false,
}: FilterBarProps) {
  return (
    <div
      className={cn("rounded-2xl border px-4 py-4 backdrop-blur-xl", className)}
      style={{ background: "var(--t-surface)", borderColor: "var(--t-border)", opacity: disabled ? 0.6 : 1 }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--t-text-tertiary)" }} />
          <input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            disabled={disabled}
            className="ong-field-control h-10 w-full rounded-2xl pl-9 pr-4 text-[13px] backdrop-blur-sm outline-none transition-colors focus:ring-1 focus:ring-[var(--t-primary)]/30 disabled:cursor-not-allowed"
            style={{
              border: "1px solid var(--t-border-strong)",
              background: "var(--t-input-bg)",
              color: "var(--t-text)",
            }}
          />
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3.5 text-[12px] font-medium transition-colors",
                  filter.active
                    ? "border-[var(--t-primary)]/35 bg-[var(--t-primary)]/16 text-[#D7E2FF]"
                    : ""
                )}
                style={!filter.active ? {
                  border: "1px solid var(--t-border)",
                  background: "var(--t-input-bg)",
                  color: "var(--t-text-secondary)",
                } : undefined}
                onClick={() => onFilterClick?.(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

