import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Calendar, FolderKanban, Check, X } from "lucide-react";
import type { PeriodFilter, DashboardTaskOption } from "../../modules/home/types";

interface DashboardFiltersProps {
  periodFilter: PeriodFilter;
  setPeriodFilter: (p: PeriodFilter) => void;
  selectedProjectFilter: string;
  setSelectedProjectFilter: (p: string) => void;
  taskOptions: DashboardTaskOption[];
}

export function DashboardFilters({
  periodFilter,
  setPeriodFilter,
  selectedProjectFilter,
  setSelectedProjectFilter,
  taskOptions
}: DashboardFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = periodFilter !== "month" || selectedProjectFilter !== "all";

  const periodLabels = {
    month: "Este Mes",
    quarter: "Último Trimestre",
    year: "Este Año",
  };

  const selectedProjectLabel = selectedProjectFilter === "all" 
    ? "Todos los Proyectos" 
    : taskOptions.find(t => t.value === selectedProjectFilter)?.label || "Proyecto seleccionado";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-medium border transition-colors ${
          hasActiveFilters 
            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
            : "bg-white dark:bg-[#171512] border-neutral-200 dark:border-[#26231F] text-neutral-700 dark:text-[#F9F7F3] hover:border-neutral-300 dark:hover:border-[#356C92]"
        }`}
      >
        <Filter className="h-4 w-4" />
        Filtros
        {hasActiveFilters && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 dark:bg-[#356C92]/20 text-[10px] font-bold">
            {(periodFilter !== "month" ? 1 : 0) + (selectedProjectFilter !== "all" ? 1 : 0)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl bg-white dark:bg-[#171512] border border-neutral-200 dark:border-[#26231F] shadow-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-[#26231F] px-4 py-3 bg-neutral-50/50 dark:bg-[#1F1D1A]">
              <span className="text-sm font-semibold text-neutral-900 dark:text-[#F9F7F3]">Filtros Globales</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setPeriodFilter("month");
                    setSelectedProjectFilter("all");
                  }}
                  className="text-[11px] font-medium text-neutral-500 hover:text-neutral-700 dark:text-[#A4A29F] dark:hover:text-[#F9F7F3] transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Limpiar
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Periodo */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-600 dark:text-[#A4A29F] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Período
                </label>
                <div className="flex flex-col gap-1">
                  {(["month", "quarter", "year"] as PeriodFilter[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setPeriodFilter(period)}
                      className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        periodFilter === period
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "text-neutral-700 dark:text-[#F9F7F3] hover:bg-neutral-100 dark:hover:bg-[#1F1D1A]"
                      }`}
                    >
                      {periodLabels[period]}
                      {periodFilter === period && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proyecto */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-600 dark:text-[#A4A29F] flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Proyecto
                </label>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectFilter("all")}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedProjectFilter === "all"
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "text-neutral-700 dark:text-[#F9F7F3] hover:bg-neutral-100 dark:hover:bg-[#1F1D1A]"
                    }`}
                  >
                    Todos los Proyectos
                    {selectedProjectFilter === "all" && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {taskOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedProjectFilter(option.value)}
                      className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors truncate ${
                        selectedProjectFilter === option.value
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "text-neutral-700 dark:text-[#F9F7F3] hover:bg-neutral-100 dark:hover:bg-[#1F1D1A]"
                      }`}
                      title={option.label}
                    >
                      <span className="truncate pr-2">{option.label}</span>
                      {selectedProjectFilter === option.value && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {(periodFilter !== "month" || selectedProjectFilter !== "all") && (
               <div className="bg-indigo-500/5 px-4 py-2 text-[10px] text-indigo-600/70 dark:text-indigo-400/70 border-t border-indigo-500/10">
                 Mostrando métricas filtradas
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
