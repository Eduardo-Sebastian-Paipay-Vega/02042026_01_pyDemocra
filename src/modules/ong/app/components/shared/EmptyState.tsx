import { FileSearch, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({ 
  title = "Sin resultados", 
  description = "Intenta cambiar los filtros para encontrar lo que buscas.",
  icon: Icon = FileSearch
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-[var(--t-surface)] p-4">
        <Icon size={48} className="opacity-20" style={{ color: "var(--t-text)" }} />
      </div>
      <h3 className="text-[16px] font-medium" style={{ color: "var(--t-text)" }}>
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}
