import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  CreditCard,
  DollarSign,
  FileText,
  FolderKanban,
  GraduationCap,
  Heart,
  Home,
  ListTodo,
  Package,
  Search as SearchIcon,
  Settings,
  Shield,
  ShieldAlert,
  Trash2,
  Upload,
  UserCog,
  UserPlus,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import {  cn  } from "@/core/components/ui/utils";

const HOVER_INTENT_DELAY_MS = 80;
const SNAPPY_MOTION = { duration: 0.14, ease: [0.16, 1, 0.3, 1] as const };

interface NavCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  items: { label: string; path: string; icon: LucideIcon }[];
}

interface SidebarProps {
  categories: NavCategory[];
  expanded: boolean;
  desktopCollapsed: boolean;
  mobileOpen: boolean;
  resetSignal: number;
  sidebarRef: RefObject<HTMLDivElement>;
  onToggleDesktop: () => void;
  onCloseMobile: () => void;
  onHoverExpandStart: () => void;
  onHoverExpandEnd: () => void;
}

function isItemPathActive(currentPath: string, itemPath: string) {
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function Sidebar({
  categories,
  expanded,
  desktopCollapsed,
  mobileOpen,
  resetSignal,
  sidebarRef,
  onToggleDesktop,
  onCloseMobile,
  onHoverExpandStart,
  onHoverExpandEnd,
}: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const [hoveredItemPath, setHoveredItemPath] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState(categories[0]?.id ?? "");

  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const itemLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const hoverIntentTimerRef = useRef<number | null>(null);

  const showExpandedMode = expanded || mobileOpen;
  const allowAutoExpandOnHover = desktopCollapsed && !mobileOpen;

  const activeCategory = useMemo(
    () =>
      categories.find((category) =>
        category.items.some((item) => isItemPathActive(location.pathname, item.path))
      )?.id ?? categories[0]?.id ?? "",
    [categories, location.pathname]
  );

  const clearHoverIntentTimer = useCallback(() => {
    // Cancel timer to avoid accidental open/close while cursor moves quickly.
    if (hoverIntentTimerRef.current !== null) {
      window.clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  }, []);

  const scheduleSectionOpen = useCallback(
    (categoryId: string) => {
      if (!showExpandedMode) {
        return;
      }

      // Hover intent: wait a short delay before opening submenu.
      clearHoverIntentTimer();
      hoverIntentTimerRef.current = window.setTimeout(() => {
        setOpenSection(categoryId);
        hoverIntentTimerRef.current = null;
      }, HOVER_INTENT_DELAY_MS);
    },
    [clearHoverIntentTimer, showExpandedMode]
  );

  useEffect(() => {
    setOpenSection(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (!categories.length) {
      setOpenSection("");
      return;
    }

    if (!categories.some((category) => category.id === openSection)) {
      setOpenSection(categories[0].id);
    }
  }, [categories, openSection]);

  useEffect(() => {
    // Reset submenus to active route after outside click from parent layout.
    clearHoverIntentTimer();
    setHoveredItemPath(null);
    setOpenSection(activeCategory);
  }, [activeCategory, clearHoverIntentTimer, resetSignal]);

  useEffect(() => {
    return () => clearHoverIntentTimer();
  }, [clearHoverIntentTimer]);

  const focusCategoryByOffset = useCallback((currentCategoryId: string, offset: number) => {
    if (!categories.length) {
      return;
    }

    const currentIndex = categories.findIndex((category) => category.id === currentCategoryId);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = (currentIndex + offset + categories.length) % categories.length;
    categoryButtonRefs.current[categories[nextIndex].id]?.focus();
  }, [categories]);

  const handleCategoryKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, category: NavCategory, isOpen: boolean) => {
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          focusCategoryByOffset(category.id, 1);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          focusCategoryByOffset(category.id, -1);
          break;
        }
        case "ArrowRight": {
          if (!showExpandedMode) {
            break;
          }

          event.preventDefault();
          setOpenSection(category.id);
          const firstItem = category.items[0];
          if (firstItem) {
            requestAnimationFrame(() => itemLinkRefs.current[firstItem.path]?.focus());
          }
          break;
        }
        case "ArrowLeft": {
          if (!showExpandedMode) {
            break;
          }

          event.preventDefault();
          if (isOpen && activeCategory !== category.id) {
            setOpenSection(activeCategory);
          }
          break;
        }
        case "Enter":
        case " ": {
          if (!showExpandedMode) {
            break;
          }

          event.preventDefault();
          clearHoverIntentTimer();
          setOpenSection((currentSection) =>
            currentSection === category.id ? activeCategory : category.id
          );
          break;
        }
        default:
          break;
      }
    },
    [activeCategory, clearHoverIntentTimer, focusCategoryByOffset, showExpandedMode]
  );

  const handleSubItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>, category: NavCategory, itemIndex: number) => {
      const categoryItems = category.items;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const nextItem = categoryItems[itemIndex + 1];
          if (nextItem) {
            itemLinkRefs.current[nextItem.path]?.focus();
            return;
          }
          focusCategoryByOffset(category.id, 1);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          const prevItem = categoryItems[itemIndex - 1];
          if (prevItem) {
            itemLinkRefs.current[prevItem.path]?.focus();
            return;
          }
          categoryButtonRefs.current[category.id]?.focus();
          break;
        }
        case "ArrowLeft":
        case "Escape": {
          event.preventDefault();
          categoryButtonRefs.current[category.id]?.focus();
          setOpenSection(activeCategory);
          break;
        }
        default:
          break;
      }
    },
    [activeCategory, focusCategoryByOffset]
  );

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-[248px] border-r backdrop-blur-2xl transition-all duration-150 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        expanded ? "md:w-[248px]" : "md:w-[72px]"
      )}
      style={{
        background: "var(--t-sidebar)",
        borderColor: "var(--t-border)",
      }}
      onMouseEnter={() => {
        if (allowAutoExpandOnHover) {
          onHoverExpandStart();
        }
      }}
      onMouseLeave={() => {
        clearHoverIntentTimer();
        setHoveredItemPath(null);
        if (allowAutoExpandOnHover) {
          onHoverExpandEnd();
        }
      }}
    >
      <div className="flex h-14 items-center justify-between px-3">
        {showExpandedMode ? (
          // Doble logo: marca Democra (SaaS base) + marca del módulo ONG.
          // No existe todavía un archivo de logo propio de la ONG en el repo —
          // el badge con el ícono Heart es un placeholder honesto hasta que
          // haya uno; basta con reemplazar ese <div> por un <img> real.
          <div className="flex min-w-0 items-center gap-2 pl-0.5">
            <img
              src="/brand/d-core-monogram.png"
              alt="Democra"
              className="h-7 w-7 shrink-0 rounded-lg object-contain"
            />
            <span
              className="h-5 w-px shrink-0"
              style={{ background: "var(--t-border)" }}
              aria-hidden="true"
            />
            <div className="flex min-w-0 items-center gap-1.5">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ background: "var(--t-primary)" }}
              >
                <Heart className="h-3.5 w-3.5" style={{ color: "#fff" }} />
              </div>
              <span
                className="truncate text-[13px] tracking-tight"
                style={{ color: "var(--t-text)" }}
              >
                ONG
              </span>
            </div>
          </div>
        ) : (
          <span className="sr-only">{t("Administracion")}</span>
        )}

        <button
          type="button"
          data-sidebar-toggle="true"
          onClick={() => {
            if (mobileOpen) {
              onCloseMobile();
              return;
            }
            onToggleDesktop();
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ease-out hover:bg-[var(--t-hover)]",
            !showExpandedMode && "mx-auto"
          )}
          style={{ color: "var(--t-text-tertiary)" }}
          aria-label={showExpandedMode ? t("Colapsar menu") : t("Expandir menu")}
          title={showExpandedMode ? t("Colapsar menu") : t("Expandir menu")}
        >
          {showExpandedMode ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>



      <nav aria-label={t("Navegacion lateral")} className="h-[calc(100vh-104px)] overflow-y-auto py-1 scrollbar-none">
        {categories.map((category) => {
          const hasCurrent = category.items.some((item) =>
            isItemPathActive(location.pathname, item.path)
          );
          const isOpen = showExpandedMode && openSection === category.id;

          const highlightedPath =
            hoveredItemPath && category.items.some((item) => item.path === hoveredItemPath)
              ? hoveredItemPath
              : category.items.find((item) => isItemPathActive(location.pathname, item.path))?.path;

          const CategoryIcon = category.icon;

          return (
            <div
              key={category.id}
              className="mb-0.5 px-2"
              onMouseEnter={() => scheduleSectionOpen(category.id)}
              onMouseLeave={clearHoverIntentTimer}
            >
              <button
                ref={(node) => {
                  categoryButtonRefs.current[category.id] = node;
                }}
                type="button"
                onClick={() => {
                  if (!showExpandedMode) {
                    return;
                  }
                  clearHoverIntentTimer();
                  setOpenSection((currentSection) =>
                    currentSection === category.id ? activeCategory : category.id
                  );
                }}
                onKeyDown={(event) => handleCategoryKeyDown(event, category, isOpen)}
                className={cn(
                  "group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-[8px] text-left transition-all duration-150 ease-out",
                  !showExpandedMode && "justify-center"
                )}
                style={{
                  color: hasCurrent ? "var(--t-primary)" : "var(--t-text-secondary)",
                  background: hasCurrent ? "var(--t-primary-soft)" : "transparent",
                  boxShadow: hasCurrent
                    ? "inset 0 0 0 1px rgba(74,123,167,0.35)"
                    : "inset 0 0 0 1px transparent",
                }}
                title={!showExpandedMode ? t(category.label) : undefined}
                aria-expanded={showExpandedMode ? isOpen : undefined}
                aria-controls={showExpandedMode ? `${category.id}-submenu` : undefined}
              >
                {hasCurrent && !showExpandedMode && (
                  <span className="absolute left-[5px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[var(--t-primary)]" />
                )}

                <CategoryIcon className="h-[15px] w-[15px] shrink-0 transition-colors duration-150 ease-out group-hover:text-[var(--t-primary)]" />

                {showExpandedMode && (
                  <>
                    <span className="flex-1 text-[13px] group-hover:text-[var(--t-primary)]">{t(category.label)}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={SNAPPY_MOTION}
                    >
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </motion.div>
                  </>
                )}
              </button>

              {showExpandedMode && (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`${category.id}-submenu`}
                      key={`${category.id}-submenu`}
                      initial={{ height: 0, opacity: 0, y: -3 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -3 }}
                      transition={SNAPPY_MOTION}
                      className="overflow-hidden"
                    >
                      <div className="relative ml-[18px] border-l py-1 pl-3" style={{ borderColor: "var(--t-border)" }}>
                        {category.items.map((item, itemIndex) => {
                          const isActive = isItemPathActive(location.pathname, item.path);
                          const isHighlighted = highlightedPath === item.path;

                          return (
                            <div key={item.path} className="relative mb-0.5">
                              {isHighlighted && (
                                <motion.span
                                  layoutId={`submenu-highlight-${category.id}`}
                                  className="pointer-events-none absolute inset-0 rounded-md"
                                  style={{
                                    background: isActive
                                      ? "var(--t-primary-soft)"
                                      : "var(--t-hover)",
                                    boxShadow: isActive
                                      ? "inset 0 0 0 1px rgba(74,123,167,0.35)"
                                      : "inset 0 0 0 1px rgba(74,123,167,0.14)",
                                  }}
                                  transition={SNAPPY_MOTION}
                                />
                              )}

                              <Link
                                ref={(node) => {
                                  itemLinkRefs.current[item.path] = node;
                                }}
                                to={item.path}
                                className="relative z-10 flex items-center gap-2.5 rounded-md px-2 py-[6px] text-[12px] transition-colors duration-150 ease-out hover:text-[var(--t-primary)]"
                                style={{
                                  color: isActive ? "var(--t-primary)" : "var(--t-text-secondary)",
                                }}
                                aria-current={isActive ? "page" : undefined}
                                onKeyDown={(event) => handleSubItemKeyDown(event, category, itemIndex)}
                                onMouseEnter={() => setHoveredItemPath(item.path)}
                                onMouseLeave={() =>
                                  setHoveredItemPath((currentPath) =>
                                    currentPath === item.path ? null : currentPath
                                  )
                                }
                                onFocus={() => {
                                  setOpenSection(category.id);
                                  setHoveredItemPath(item.path);
                                }}
                                onBlur={() =>
                                  setHoveredItemPath((currentPath) =>
                                    currentPath === item.path ? null : currentPath
                                  )
                                }
                                onClick={onCloseMobile}
                              >
                                {isActive && (
                                  <span className="absolute -left-[11px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[var(--t-primary)]" />
                                )}
                                <item.icon className="h-[13px] w-[13px] shrink-0 opacity-70" />
                                <span>{t(item.label)}</span>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
