import { Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Switch } from "@/core/components/ui/switch";
import type { BeneficiaryFilterState } from "../../hooks/useBeneficiaryFilters";

interface AdvancedFiltersModalProps {
  filters: BeneficiaryFilterState;
  onUpdateFilter: (key: keyof BeneficiaryFilterState, value: any) => void;
}

export function AdvancedFiltersModal({ filters, onUpdateFilter }: AdvancedFiltersModalProps) {
  const activeFiltersCount = filters.missingDocs ? 1 : 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-[var(--t-hover)]"
          style={{ border: "1px solid var(--t-border)", color: "var(--t-text-secondary)", background: "var(--t-surface)" }}
          title="Filtros Avanzados"
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border-strong)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--t-text)" }}>Filtros Avanzados</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4" style={{ borderColor: "var(--t-border)" }}>
            <div className="space-y-0.5">
              <label className="text-sm font-medium" style={{ color: "var(--t-text)" }}>
                Documentación Incompleta
              </label>
              <p className="text-xs" style={{ color: "var(--t-text-secondary)" }}>
                Mostrar sólo beneficiarios sin documento de identidad o sin teléfono registrado.
              </p>
            </div>
            <Switch
              checked={filters.missingDocs}
              onCheckedChange={(val) => onUpdateFilter('missingDocs', val)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
