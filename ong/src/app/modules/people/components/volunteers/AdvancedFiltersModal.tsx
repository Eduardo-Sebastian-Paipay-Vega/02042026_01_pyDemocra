import { Filter, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Badge } from "@/core/components/ui/badge";
import { ScrollArea } from "@/core/components/ui/scroll-area";

interface AdvancedFiltersModalProps {
  filters: { skills: string[]; roles: string[] };
  onUpdateFilter: (key: any, value: any) => void;
}

const SKILL_OPTIONS = [
  "Primeros Auxilios",
  "Rescate",
  "Gestión de Crisis",
  "Logística",
  "Comunicaciones",
  "Conducción",
  "Idiomas",
  "Asistencia Médica"
];

const ROLE_OPTIONS = [
  "Paramédico",
  "Rescatista",
  "Coordinador",
  "Voluntario General",
  "Logístico",
  "Conductor",
  "Especialista",
  "Apoyo"
];

export function AdvancedFiltersModal({ filters, onUpdateFilter }: AdvancedFiltersModalProps) {
  const toggleItem = (key: 'skills' | 'roles', item: string) => {
    const current = filters[key] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    onUpdateFilter(key, updated);
  };

  const activeFiltersCount = (filters.skills?.length || 0) + (filters.roles?.length || 0);

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
      <DialogContent className="sm:max-w-[500px]" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border-strong)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--t-text)" }}>Filtros Avanzados</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "var(--t-text)" }}>Habilidades</label>
                {filters.skills?.length > 0 && (
                  <button onClick={() => onUpdateFilter('skills', [])} className="text-[11px] hover:underline" style={{ color: "var(--t-primary)" }}>
                    Limpiar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const isActive = filters.skills?.includes(skill);
                  return (
                    <Badge
                      key={skill}
                      variant="outline"
                      className={`cursor-pointer px-3 py-1.5 transition-colors ${isActive ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'hover:bg-[var(--t-hover)]'}`}
                      style={!isActive ? { borderColor: "var(--t-border)", color: "var(--t-text-secondary)" } : undefined}
                      onClick={() => toggleItem('skills', skill)}
                    >
                      {isActive && <Check className="mr-1.5 h-3 w-3" />}
                      {skill}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "var(--t-text)" }}>Roles Institucionales</label>
                {filters.roles?.length > 0 && (
                  <button onClick={() => onUpdateFilter('roles', [])} className="text-[11px] hover:underline" style={{ color: "var(--t-primary)" }}>
                    Limpiar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const isActive = filters.roles?.includes(role);
                  return (
                    <Badge
                      key={role}
                      variant="outline"
                      className={`cursor-pointer px-3 py-1.5 transition-colors ${isActive ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'hover:bg-[var(--t-hover)]'}`}
                      style={!isActive ? { borderColor: "var(--t-border)", color: "var(--t-text-secondary)" } : undefined}
                      onClick={() => toggleItem('roles', role)}
                    >
                      {isActive && <Check className="mr-1.5 h-3 w-3" />}
                      {role}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
