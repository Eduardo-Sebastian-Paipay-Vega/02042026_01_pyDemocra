import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { cn } from "../lib/utils";
import { useGlobalSearch } from "../modules/home/useGlobalSearch";
import { useGlobalSearchDetail } from "../modules/home/useGlobalSearchDetail";
import { GlobalSearchDetailModal } from "../modules/home/components/GlobalSearchDetailModal";
import type {
  GlobalSearchEntityType,
  GlobalSearchGroupedResults,
  GlobalSearchItem,
} from "../modules/home/types";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any },
  },
};

interface ResultGroupConfig {
  key: keyof GlobalSearchGroupedResults;
  label: string;
  type: GlobalSearchEntityType;
}

const resultGroups: ResultGroupConfig[] = [
  { key: "volunteers", label: "Voluntarios", type: "volunteer" },
  { key: "activities", label: "Actividades", type: "activity" },
  { key: "projects", label: "Proyectos", type: "project" },
  { key: "admissions", label: "Solicitudes de admision", type: "admission" },
];

function iconByType(type: GlobalSearchEntityType) {
  if (type === "volunteer") {
    return Users;
  }

  if (type === "activity") {
    return Activity;
  }

  if (type === "project") {
    return FolderKanban;
  }

  return UserPlus;
}

function ResultSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-12 animate-pulse rounded-xl" style={{ background: "var(--t-input-bg)" }} />
      <div className="h-12 animate-pulse rounded-xl" style={{ background: "var(--t-input-bg)" }} />
      <div className="h-12 animate-pulse rounded-xl" style={{ background: "var(--t-input-bg)" }} />
    </div>
  );
}

function EmptyGroup({ label }: { label: string }) {
  return (
    <p className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>
      Sin resultados en {label.toLowerCase()}.
    </p>
  );
}

function SearchResultItem({
  item,
  onClick,
}: {
  item: GlobalSearchItem;
  onClick: (item: GlobalSearchItem) => void;
}) {
  const Icon = iconByType(item.type);

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150",
        "hover:bg-[var(--t-hover)]"
      )}
      onClick={() => onClick(item)}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-border)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]" style={{ color: "var(--t-text)" }}>
          {item.title}
        </p>
        <p className="truncate text-[11px]" style={{ color: "var(--t-text-dim)" }}>
          {item.subtitle}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" style={{ color: "var(--t-text-dim)" }} />
    </button>
  );
}

export function GlobalSearch() {
  const navigate = useNavigate();
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
  const {
    isOpen,
    detail,
    loading: detailLoading,
    error: detailError,
    openDetail,
    closeDetail,
    retry: retryDetail,
  } = useGlobalSearchDetail();

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Busqueda global"
          description="Busca voluntarios, actividades, proyectos y solicitudes de admision."
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl p-4 backdrop-blur-xl"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--t-text-dim)" }}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, correo, DNI, proyecto o actividad..."
              className="h-10 w-full rounded-xl pl-10 pr-4 text-[13px] outline-none transition-colors"
              style={{
                border: "1px solid var(--t-border)",
                background: "var(--t-input-bg)",
                color: "var(--t-text)",
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px]" style={{ color: "var(--t-text-dim)" }}>
            <span>
              Minimo {minLength} caracteres. Busqueda parcial sin distinguir mayusculas.
            </span>
            {hasSearched && !loading && !error && (
              <span>{totalResults} resultado(s)</span>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp}>
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              {error}
            </p>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)]"
              style={{ color: "var(--t-text-secondary)" }}
              onClick={retry}
            >
              Reintentar
            </button>
          </div>
        </motion.div>
      )}

      {!hasSearched && !loading && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--t-text-tertiary)" }}>
              Escribe al menos {minLength} caracteres para iniciar la busqueda.
            </p>
          </div>
        </motion.div>
      )}

      {hasSearched && !loading && !error && totalResults === 0 && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--t-text-tertiary)" }}>
              No se encontraron resultados para "{lastSearchedTerm}".
            </p>
          </div>
        </motion.div>
      )}

      {(loading || (hasSearched && totalResults > 0)) && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {resultGroups.map((group) => (
            <div
              key={group.key}
              className="rounded-2xl p-4 backdrop-blur-xl"
              style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px]" style={{ color: "var(--t-text)" }}>
                  {group.label}
                </h3>
                {!loading && (
                  <span className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    {results[group.key].length}
                  </span>
                )}
              </div>

              {loading ? (
                <ResultSkeleton />
              ) : results[group.key].length === 0 ? (
                <EmptyGroup label={group.label} />
              ) : (
                <div className="space-y-1">
                  {results[group.key].map((item) => (
                    <SearchResultItem
                      key={item.id}
                      item={item}
                      onClick={(selected) => {
                        void openDetail(selected);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      <GlobalSearchDetailModal
        open={isOpen}
        loading={detailLoading}
        error={detailError}
        detail={detail}
        onClose={closeDetail}
        onRetry={() => {
          void retryDetail();
        }}
        onNavigate={(targetPath) => {
          closeDetail();
          navigate(targetPath);
        }}
      />
    </motion.div>
  );
}

