// @ts-nocheck
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
  Globe,
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
import { cn } from "../../lib/utils";

const HOVER_INTENT_DELAY_MS = 80;
const SNAPPY_MOTION = { duration: 0.14, ease: [0.16, 1, 0.3, 1] as any as const };

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
  sidebarRef: RefObject<HTMLDivElement | null>;
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
          <span className="pl-1.5 text-[13px] tracking-tight" style={{ color: "var(--t-text)" }}>
            Administracion
          </span>
        ) : (
          <span className="sr-only">Administracion</span>
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
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ease-out hover:bg-[rgba(61,107,255,0.16)]",
            !showExpandedMode && "mx-auto"
          )}
          style={{ color: "var(--t-text-tertiary)" }}
          aria-label={showExpandedMode ? "Colapsar menu" : "Expandir menu"}
          title={showExpandedMode ? "Colapsar menu" : "Expandir menu"}
        >
          {showExpandedMode ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mx-2 mb-2 border-b pb-2" style={{ borderColor: "var(--t-border)" }}>
        <Link
          to="/landing"
          className={cn(
            "flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-150 ease-out",
            "text-[#a9c2ff]/80 hover:bg-[rgba(61,107,255,0.14)] hover:text-[#e2ebff]",
            !showExpandedMode && "justify-center"
          )}
          onClick={onCloseMobile}
          title={!showExpandedMode ? "Pagina publica" : undefined}
        >
          <Globe className="h-4 w-4 shrink-0" />
          {showExpandedMode && <span className="text-[12px]">Pagina publica</span>}
        </Link>
      </div>

      <nav aria-label="Navegacion lateral" className="h-[calc(100vh-104px)] overflow-y-auto py-1 scrollbar-none">
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
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ease-out",
                  !showExpandedMode && "justify-center"
                )}
                style={{
                  color: hasCurrent ? "#EAF0FF" : "var(--t-text-secondary)",
                  background: hasCurrent ? "rgba(0,46,254,0.28)" : "transparent",
                  boxShadow: hasCurrent
                    ? "inset 0 0 0 1px rgba(61,107,255,0.45)"
                    : "inset 0 0 0 1px transparent",
                }}
                title={!showExpandedMode ? category.label : undefined}
                aria-expanded={showExpandedMode ? isOpen : undefined}
                aria-controls={showExpandedMode ? `${category.id}-submenu` : undefined}
              >
                {hasCurrent && !showExpandedMode && (
                  <span className="absolute left-[5px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#3D6BFF]" />
                )}

                <CategoryIcon className="h-[18px] w-[18px] shrink-0 transition-colors duration-150 ease-out group-hover:text-[#EAF0FF]" />

                {showExpandedMode && (
                  <>
                    <span className="flex-1 text-sm group-hover:text-[#EAF0FF]">{category.label}</span>
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
                                  className="pointer-events-none absolute inset-0 rounded-lg"
                                  style={{
                                    background: isActive
                                      ? "rgba(61,107,255,0.26)"
                                      : "rgba(61,107,255,0.14)",
                                    boxShadow: isActive
                                      ? "inset 0 0 0 1px rgba(61,107,255,0.48)"
                                      : "inset 0 0 0 1px rgba(61,107,255,0.24)",
                                  }}
                                  transition={SNAPPY_MOTION}
                                />
                              )}

                              <Link
                                ref={(node) => {
                                  itemLinkRefs.current[item.path] = node;
                                }}
                                to={item.path}
                                className="relative z-10 flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 ease-out hover:text-[#EAF0FF]"
                                style={{
                                  color: isActive ? "#EAF0FF" : "var(--t-text-secondary)",
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
                                  <span className="absolute -left-[11px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#3D6BFF]" />
                                )}
                                <item.icon className="h-4 w-4 shrink-0 opacity-70" />
                                <span>{item.label}</span>
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

