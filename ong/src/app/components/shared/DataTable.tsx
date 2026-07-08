import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableSkeleton } from "./TableSkeleton";

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
}

export interface RowAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  disabled?: boolean | ((item: T) => boolean);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: RowAction<T>[];
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  actions = [],
  emptyMessage = "Sin datos",
  className,
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length} className={className} />;
  }

  if (data.length === 0) {
    return (
      <div
        className={cn("rounded-xl p-12 text-center backdrop-blur-xl", className)}
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", boxShadow: "var(--t-shadow)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-hidden rounded-xl backdrop-blur-xl", className)}
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", boxShadow: "var(--t-shadow)" }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--t-border)" }}>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] first:pl-6 last:pr-6"
                style={{ color: "var(--t-text-tertiary)" }}
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && <th className="w-[44px] px-3 py-3"></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={item.id}
              className="group cursor-default transition-colors duration-150 hover:bg-[var(--t-hover)]"
              style={idx < data.length - 1 ? { borderBottom: "1px solid var(--t-border)" } : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 text-[13px] first:pl-6 last:pr-6">
                  {column.render(item)}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="px-3 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[var(--t-active)]"
                        style={{ color: "var(--t-muted)" }}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                        <span className="sr-only">Acciones</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[140px] backdrop-blur-xl"
                      style={{ background: "var(--t-elevated)", border: "1px solid var(--t-border-strong)" }}
                    >
                      {actions.map((action, index) => {
                        const isDisabled =
                          typeof action.disabled === "function"
                            ? action.disabled(item)
                            : Boolean(action.disabled);
                        return (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => { if (!isDisabled) action.onClick(item); }}
                            disabled={isDisabled}
                            className={cn(
                              "text-[13px] focus:bg-[var(--t-hover)]",
                              action.variant === "destructive"
                                ? "text-red-400/80 focus:text-red-400"
                                : "",
                              isDisabled ? "opacity-40 cursor-not-allowed" : ""
                            )}
                            style={action.variant !== "destructive" ? { color: "var(--t-text-secondary)" } : undefined}
                          >
                            {action.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
