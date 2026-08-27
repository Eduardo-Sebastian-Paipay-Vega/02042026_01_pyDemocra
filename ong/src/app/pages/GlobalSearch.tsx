import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/core/components/shared/PageHeader";
import { cn } from "../lib/utils";
import { useGlobalSearch } from "../modules/home/useGlobalSearch";
import type {
  GlobalSearchEntityType,
  GlobalSearchGroupedResults,
  GlobalSearchItem,
} from "../modules/home/types";

/* ─── animation presets ─── */
const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ─── helpers ─── */
type SearchTab = "all" | "volunteers" | "activities" | "projects" | "admissions";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function iconByType(type: GlobalSearchEntityType) {
  if (type === "volunteer") return Users;
  if (type === "activity") return Activity;
  if (type === "project") return FolderKanban;
  return UserPlus;
}

/* ─── localStorage recent searches ─── */
const RECENT_KEY = "democra-search-recent";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const current = getRecentSearches();
  const cleaned = term.trim();
  if (!cleaned || cleaned.length < 2) return;
  const filtered = current.filter((s) => s !== cleaned);
  const next = [cleaned, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function clearRecentSearchesStorage() {
  localStorage.removeItem(RECENT_KEY);
}

/* ─── sub-components ─── */
function ResultSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-14 animate-pulse rounded-xl" style={{ background: "var(--t-input-bg)" }} />
      <div className="h-14 animate-pulse rounded-xl" style={{ background: "var(--t-input-bg)" }} />
      <div className="h-14 animate-pulse rounded-xl" style={{ background: "var(--t-input-bg)" }} />
    </div>
  );
}

function SearchResultItem({
  item,
  onClick,
  isSelected,
}: {
  item: GlobalSearchItem;
  onClick: (item: GlobalSearchItem) => void;
  isSelected?: boolean;
}) {
  const isVolunteer = item.type === "volunteer";
  const Icon = iconByType(item.type);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      aria-selected={isSelected}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150",
        "hover:bg-[var(--t-hover)] border border-transparent",
        isSelected && "bg-[var(--t-hover)] border-[var(--t-border)]"
      )}
    >
      {isVolunteer ? (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm"
          style={{ background: "var(--t-primary-muted, rgba(16,185,129,0.15))", color: "var(--t-primary)" }}
        >
          {getInitials(item.title)}
        </div>
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)", color: "var(--t-text-dim)" }}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium" style={{ color: "var(--t-text)" }}>
            {item.title}
          </p>
        </div>
        <p className="truncate text-[12px] mt-0.5" style={{ color: "var(--t-text-dim)" }}>
          {item.subtitle}
        </p>
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
        style={{ color: "var(--t-text-dim)" }}
      />
    </button>
  );
}

/* ─── Main component ─── */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  const {
    query,
    setQuery,
    results,
    loading,
    error,
    minLength,
    hasSearched,
    totalResults,
    lastSearchedTerm,
    retry,
  } = useGlobalSearch(6);

  const addRecentSearch = useCallback((term: string) => {
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearchesStorage();
    setRecentSearches([]);
  }, []);

  const handleResultClick = (item: GlobalSearchItem) => {
    addRecentSearch(query);
    navigate(item.targetPath);
  };

  const getFilteredItems = (): GlobalSearchItem[] => {
    if (activeTab === "all") {
      return [
        ...results.volunteers,
        ...results.projects,
        ...results.activities,
        ...results.admissions,
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
        setSelectedIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : visibleItems.length - 1));
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
  }, [activeTab, lastSearchedTerm]);

  const tabs = [
    { id: "all" as const, label: "Todos", count: totalResults },
    { id: "volunteers" as const, label: "Voluntarios", count: results.volunteers.length },
    { id: "projects" as const, label: "Proyectos", count: results.projects.length },
    { id: "activities" as const, label: "Actividades", count: results.activities.length },
    { id: "admissions" as const, label: "Solicitudes", count: results.admissions.length },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto w-full">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Búsqueda global"
          description="Busca voluntarios, proyectos, actividades y solicitudes de admisión."
        />
      </motion.div>

      {/* ── Omnisearch Input Box ── */}
      <motion.div variants={fadeUp}>
        <div
          className="relative group rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            background: "var(--t-surface)",
            border: "1px solid var(--t-border)",
          }}
        >
          <div className="flex items-center px-4 h-14">
            <Search
              className="h-5 w-5 shrink-0 transition-colors"
              style={{ color: "var(--t-text-dim)" }}
            />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, DNI, proyecto o actividad..."
              className="flex-1 h-full bg-transparent outline-none px-4 text-[14px]"
              style={{ color: "var(--t-text)" }}
            />
            {query.length > 0 && (
              <button
                onClick={() => setQuery("")}
                className="p-1.5 rounded-full transition-colors hover:bg-[var(--t-hover)]"
                style={{ color: "var(--t-text-dim)" }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2.5 px-2 flex items-center justify-between text-[13px]" style={{ color: "var(--t-text-secondary)" }}>
          <span>Mínimo {minLength} caracteres. Búsqueda parcial sin distinguir mayúsculas.</span>
          {hasSearched && !loading && !error ? (
            <span>{totalResults} resultado(s)</span>
          ) : (
            <span className="hidden sm:inline-block">Navega con las flechas ↓ ↑ y presiona Enter</span>
          )}
        </div>
      </motion.div>

      {/* ── Error state ── */}
      {error && (
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "var(--t-text-secondary)" }} />
            <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{error}</p>
          </div>
          <button
            onClick={retry}
            className="text-[12px] font-medium transition-colors hover:bg-[var(--t-hover)] rounded-md px-2 py-1"
            style={{ color: "var(--t-primary)" }}
          >
            Reintentar
          </button>
        </motion.div>
      )}

      {/* ── Empty State / Recent Searches ── */}
      {!hasSearched && !loading && (
        <motion.div variants={fadeUp}>
          {recentSearches.length > 0 ? (
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold flex items-center gap-2" style={{ color: "var(--t-text)" }}>
                  <History className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} /> Búsquedas recientes
                </h3>
                <button
                  onClick={handleClearRecent}
                  className="text-[11px] transition-colors hover:underline"
                  style={{ color: "var(--t-text-dim)" }}
                >
                  Limpiar historial
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="rounded-lg px-3 py-1.5 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
                    style={{
                      border: "1px solid var(--t-border)",
                      background: "var(--t-input-bg)",
                      color: "var(--t-text-secondary)",
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
              style={{ border: "1px dashed var(--t-border)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
                style={{ background: "var(--t-input-bg)", color: "var(--t-text-dim)" }}
              >
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-[14px] font-medium mb-1" style={{ color: "var(--t-text)" }}>
                Comienza a escribir para buscar
              </h3>
              <p className="text-[13px] max-w-sm" style={{ color: "var(--t-text-dim)" }}>
                Encuentra cualquier entidad dentro de tu organización ingresando un nombre, DNI, o título de proyecto.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "var(--t-input-bg)", color: "var(--t-text-dim)" }}>Voluntarios</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "var(--t-input-bg)", color: "var(--t-text-dim)" }}>Proyectos</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "var(--t-input-bg)", color: "var(--t-text-dim)" }}>Actividades</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "var(--t-input-bg)", color: "var(--t-text-dim)" }}>Solicitudes</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Loading Skeletons ── */}
      {loading && hasSearched && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-4"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <ResultSkeleton />
        </motion.div>
      )}

      {/* ── No Results ── */}
      {hasSearched && !loading && !error && totalResults === 0 && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl p-10 text-center flex flex-col items-center"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
              style={{ background: "var(--t-input-bg)", color: "var(--t-text-dim)" }}
            >
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--t-text)" }}>
              No se encontraron resultados para "{lastSearchedTerm}"
            </p>
            <p className="text-[13px] mb-4" style={{ color: "var(--t-text-dim)" }}>
              Revisa la ortografía o intenta buscar con otros términos.
            </p>
            <button
              onClick={() => setQuery("")}
              className="rounded-lg px-4 py-2 text-[12px] font-medium transition-colors"
              style={{ background: "var(--t-primary)", color: "#fff" }}
            >
              Limpiar búsqueda
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Search Results with Tabs ── */}
      {hasSearched && !loading && !error && totalResults > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          {/* Categorized Tabs */}
          <div
            className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none"
            style={{ borderBottom: "1px solid var(--t-border)" }}
          >
            {tabs.map((tab) => {
              if (tab.id !== "all" && tab.count === 0) return null;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-[var(--t-active)]"
                      : "hover:bg-[var(--t-hover)]"
                  )}
                  style={{ color: isActive ? "var(--t-primary)" : "var(--t-text-secondary)" }}
                >
                  {tab.label}
                  <span
                    className="flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: isActive ? "var(--t-primary-muted, rgba(16,185,129,0.15))" : "var(--t-input-bg)",
                      color: isActive ? "var(--t-primary)" : "var(--t-text-dim)",
                    }}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="search-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: "var(--t-primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div
            className="rounded-2xl p-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
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
                  className="py-12 text-center text-[13px]"
                  style={{ color: "var(--t-text-dim)" }}
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
