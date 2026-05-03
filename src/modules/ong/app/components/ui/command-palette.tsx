import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ModalShell } from "./modal-shell";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTenantBootstrap } from "../../../../../core/tenant";
import { buildTenantCommandRoutes } from "../../tenant/navigation";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: ElementType;
  group: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tenantBootstrap = useTenantBootstrap();

  const commands = useMemo<CommandItem[]>(() => {
    return buildTenantCommandRoutes(tenantBootstrap.context).map((route) => ({
      id: route.id,
      label: route.label,
      description: route.title,
      icon: route.icon,
      group: route.breadcrumb ?? "Navegacion",
      action: () => {
        onNavigate(route.path);
        onClose();
      },
      keywords: [route.label.toLowerCase(), route.title.toLowerCase(), route.path.toLowerCase()],
    }));
  }, [onClose, onNavigate, tenantBootstrap.context]);

  const filtered = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((keyword) => keyword.includes(q))
        );
      })
    : commands;

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter" && filtered[activeIndex]) {
        event.preventDefault();
        filtered[activeIndex].action();
      }
    },
    [activeIndex, filtered]
  );

  useEffect(() => {
    const active = listRef.current?.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  let flatIndex = -1;

  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[520px]">
      <div
        className="flex items-center gap-3 px-4"
        style={{ borderBottom: "1px solid var(--t-border)" }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: "var(--t-text-dim)" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comando o busca..."
          className="flex-1 bg-transparent py-3.5 text-[13px] outline-none"
          style={{ color: "var(--t-text)" }}
          aria-label="Buscar en paleta de comandos"
        />
        <kbd
          className="hidden items-center rounded-md px-1.5 py-0.5 text-[10px] sm:inline-flex"
          style={{
            border: "1px solid var(--t-border)",
            background: "var(--t-input-bg)",
            color: "var(--t-text-dim)",
          }}
        >
          ESC
        </kbd>
      </div>

      <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2" role="listbox">
        {filtered.length === 0 && (
          <div
            className="px-4 py-8 text-center text-[13px]"
            style={{ color: "var(--t-text-tertiary)" }}
          >
            Sin resultados para "{query}"
          </div>
        )}

        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="px-4 pb-1 pt-3">
              <span
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{ color: "var(--t-text-dim)" }}
              >
                {group}
              </span>
            </div>
            {items.map((item) => {
              flatIndex += 1;
              const isActive = flatIndex === activeIndex;
              const currentIndex = flatIndex;

              return (
                <button
                  key={item.id}
                  data-active={isActive}
                  onClick={item.action}
                  onMouseEnter={() => setActiveIndex(currentIndex)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-100",
                    isActive ? "bg-[var(--t-active)]" : "hover:bg-[var(--t-hover)]"
                  )}
                  style={{
                    color: isActive ? "var(--t-text)" : "var(--t-text-secondary)",
                  }}
                  role="option"
                  aria-selected={isActive}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">{item.label}</div>
                    {item.description && (
                      <div
                        className="truncate text-[11px]"
                        style={{ color: "var(--t-text-dim)" }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <ArrowRight
                      className="h-3 w-3 shrink-0"
                      style={{ color: "var(--t-text-dim)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-4 px-4 py-2"
        style={{ borderTop: "1px solid var(--t-border)" }}
      >
        <span
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: "var(--t-text-dim)" }}
        >
          <kbd
            className="rounded px-1 py-0.5"
            style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)" }}
          >
            ↑↓
          </kbd>
          Navegar
        </span>
        <span
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: "var(--t-text-dim)" }}
        >
          <kbd
            className="rounded px-1 py-0.5"
            style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)" }}
          >
            ↵
          </kbd>
          Seleccionar
        </span>
      </div>
    </ModalShell>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
