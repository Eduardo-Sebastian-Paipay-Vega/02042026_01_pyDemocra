import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Search,
  UserPlus,
  Users,
  X,
  History,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { cn } from "../lib/utils";
import { useGlobalSearch } from "../modules/home/useGlobalSearch";
import type { GlobalSearchItem } from "../modules/home/types";
import { StatusDot } from "@/core/components/ui/status-dot";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any },
  },
};

type SearchTab = "all" | "volunteers" | "activities" | "projects" | "admissions";

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

function ResultSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-zinc-800/50" />
      <div className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-zinc-800/50" />
      <div className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-zinc-800/50" />
    </div>
  );
}

function SearchResultItem({
  item,
  onClick,
  isSelected
}: {
  item: GlobalSearchItem;
  onClick: (item: GlobalSearchItem) => void;
  isSelected?: boolean;
}) {
  const isVolunteer = item.type === "volunteer";
  
  // Icon resolution
  let Icon = UserPlus;
  if (item.type === "activity") Icon = Activity;
  if (item.type === "project") Icon = FolderKanban;
  if (item.type === "volunteer") Icon = Users;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      aria-selected={isSelected}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150",
        "hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-transparent",
        isSelected && "bg-neutral-100 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700"
      )}
    >
      {isVolunteer ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold text-sm">
          {item.metadata?.ruta_foto ? (
            <img src={item.metadata.ruta_foto} alt="avatar" className="h-full w-full rounded-full object-cover" />
          ) : (
            getInitials(item.title)
          )}
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-zinc-400">
          <Icon className="h-4 w-4" />
        </div>
      )}
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-zinc-100">
            {item.title}
          </p>
          {item.metadata?.codigo_estado && (
            <StatusDot variant={
              item.metadata.codigo_estado === "ACTIVO" ? "success" : 
              item.metadata.codigo_estado === "INACTIVO" ? "destructive" : "warning"
            }>
              {item.metadata.codigo_estado}
            </StatusDot>
          )}
        </div>
        <p className="truncate text-[12px] text-neutral-500 dark:text-zinc-400 mt-0.5">
          {item.subtitle}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    loading,
    error,
    minLength,
    hasSearched,
    totalResults,
    retry,
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  } = useGlobalSearch(6);

  const handleResultClick = (item: GlobalSearchItem) => {
    addRecentSearch(debouncedQuery);
    navigate(item.targetPath);
  };

  const getFilteredItems = (): GlobalSearchItem[] => {
    if (activeTab === "all") {
      return [
        ...results.volunteers,
        ...results.projects,
        ...results.activities,
        ...results.admissions
      ];
    }
    return results[activeTab];
  };

  const visibleItems = getFilteredItems();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasSearched || visibleItems.length === 0) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < visibleItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : visibleItems.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleResultClick(visibleItems[selectedIndex]);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visibleItems, selectedIndex, hasSearched]);

  // Reset selected index when tab or query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [activeTab, debouncedQuery]);

  const tabs = [
    { id: "all", label: "Todos", count: totalResults },
    { id: "volunteers", label: "Voluntarios", count: results.volunteers.length },
    { id: "projects", label: "Proyectos", count: results.projects.length },
    { id: "activities", label: "Actividades", count: results.activities.length },
    { id: "admissions", label: "Solicitudes", count: results.admissions.length },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto w-full">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Búsqueda global"
          description="Busca voluntarios, proyectos, actividades y solicitudes de admisión."
        />
      </motion.div>

      {/* Omnisearch Input Box */}
      <motion.div variants={fadeUp}>
        <div className="relative group rounded-2xl bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/50 overflow-hidden">
          <div className="flex items-center px-4 h-14">
            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-emerald-500 transition-colors shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, DNI, proyecto o actividad..."
              className="flex-1 h-full bg-transparent outline-none px-4 text-[14px] text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400"
            />
            {query.length > 0 && (
              <button 
                onClick={() => setQuery("")}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2.5 px-2 flex items-center justify-between text-[13px] text-neutral-500 dark:text-zinc-400">
          <span>Mínimo {minLength} caracteres. Búsqueda parcial sin distinguir mayúsculas.</span>
          <span className="hidden sm:inline-block">Navega con las flechas ↓ ↑ y presiona Enter</span>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp} className="flex items-center justify-between rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-[13px]">{error}</p>
          </div>
          <button onClick={retry} className="text-[12px] font-medium hover:underline">Reintentar</button>
        </motion.div>
      )}

      {/* Empty State / Recent Searches */}
      {!hasSearched && !loading && (
        <motion.div variants={fadeUp}>
          {recentSearches.length > 0 ? (
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
                  <History className="h-4 w-4 text-neutral-500" /> Búsquedas Recientes
                </h3>
                <button onClick={clearRecentSearches} className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-zinc-200">
                  Limpiar historial
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="rounded-lg border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 px-3 py-1.5 text-[12px] text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-zinc-700 bg-transparent p-12 flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-400 mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-zinc-100 mb-1">
                Comienza a escribir para buscar
              </h3>
              <p className="text-[13px] text-neutral-500 dark:text-zinc-400 max-w-sm">
                Encuentra cualquier entidad dentro de tu organización ingresando un nombre, DNI, o título de proyecto.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                 <span className="rounded-full bg-neutral-100 dark:bg-zinc-900 px-3 py-1 text-[11px] text-neutral-500 font-medium">Voluntarios</span>
                 <span className="rounded-full bg-neutral-100 dark:bg-zinc-900 px-3 py-1 text-[11px] text-neutral-500 font-medium">Proyectos</span>
                 <span className="rounded-full bg-neutral-100 dark:bg-zinc-900 px-3 py-1 text-[11px] text-neutral-500 font-medium">Actividades</span>
                 <span className="rounded-full bg-neutral-100 dark:bg-zinc-900 px-3 py-1 text-[11px] text-neutral-500 font-medium">Solicitudes</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Loading Skeletons */}
      {loading && hasSearched && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
          <ResultSkeleton />
        </motion.div>
      )}

      {/* No Results Found */}
      {hasSearched && !loading && !error && totalResults === 0 && (
         <motion.div variants={fadeUp}>
           <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 text-center flex flex-col items-center">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-400 mb-4">
               <AlertCircle className="h-6 w-6" />
             </div>
             <p className="text-[14px] font-medium text-neutral-900 dark:text-zinc-100 mb-1">
               No se encontraron resultados para "{debouncedQuery}"
             </p>
             <p className="text-[13px] text-neutral-500 dark:text-zinc-400 mb-4">
               Revisa la ortografía o intenta buscar con otros términos.
             </p>
             <button
               onClick={() => setQuery("")}
               className="rounded-lg bg-emerald-500 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-600 transition-colors"
             >
               Limpiar Búsqueda
             </button>
           </div>
         </motion.div>
      )}

      {/* Search Results */}
      {hasSearched && !loading && !error && totalResults > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          
          {/* Categorized Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-200 dark:border-zinc-800">
            {tabs.map((tab) => {
              if (tab.id !== "all" && tab.count === 0) return null;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SearchTab)}
                  className={cn(
                    "relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors",
                    isActive 
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10" 
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900 dark:text-zinc-400"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px]",
                    isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300"
                  )}>
                    {tab.count}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="search-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-sm">
            <AnimatePresence mode="popLayout">
              {visibleItems.length > 0 ? (
                <div className="space-y-1">
                  {visibleItems.map((item, idx) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SearchResultItem 
                        item={item} 
                        onClick={handleResultClick}
                        isSelected={idx === selectedIndex}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center text-[13px] text-neutral-500 dark:text-zinc-400"
                >
                  Selecciona una categoría diferente.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
