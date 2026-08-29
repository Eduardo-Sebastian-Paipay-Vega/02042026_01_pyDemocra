import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {  cn  } from "@/core/components/ui/utils";
import { TableSkeleton } from "./TableSkeleton";

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface RowAction<T> {
  label: string | ((item: T) => string);
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  disabled?: boolean | ((item: T) => boolean);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: RowAction<T>[];
  emptyMessage?: string | React.ReactNode;
  className?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  actions = [],
  emptyMessage = "Sin datos",
  className,
  loading = false,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length} className={className} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={cn("rounded-xl py-8 px-6 text-center backdrop-blur-xl", className)}
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", boxShadow: "var(--t-shadow)" }}
      >
        <p className="text-[14px]" style={{ color: "var(--t-text-secondary)" }}>{emptyMessage}</p>
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
            {selectable && (
              <th className="w-[44px] px-5 py-4 pl-6 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-400 bg-transparent text-[var(--t-primary)] focus:ring-[var(--t-primary)]"
                  checked={data.length > 0 && (selectedIds || []).length === data.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectionChange?.(data.map((item) => item.id));
                    } else {
                      onSelectionChange?.([]);
                    }
                  }}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-5 py-4 text-[11px] font-bold uppercase tracking-wider first:pl-6 last:pr-6",
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                  selectable ? 'first:pl-2' : 'first:pl-6'
                )}
                style={{ color: "var(--t-text-secondary)" }}
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 ? <th className="w-[44px] px-3 py-3"></th> : null}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={item.id}
              className={cn(
                "group transition-colors duration-150 hover:bg-[var(--t-hover)]",
                onRowClick ? "cursor-pointer" : "cursor-default",
                (selectedIds || []).includes(item.id) ? "bg-[var(--t-hover)]" : ""
              )}
              style={idx < data.length - 1 ? { borderBottom: "1px solid var(--t-border)" } : undefined}
              onClick={() => onRowClick?.(item)}
            >
              {selectable && (
                <td className="px-5 py-4 pl-6 w-[44px]" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-400 bg-transparent text-[var(--t-primary)] focus:ring-[var(--t-primary)]"
                    checked={(selectedIds || []).includes(item.id)}
                    onChange={(e) => {
                      const current = selectedIds || [];
                      if (e.target.checked) {
                        onSelectionChange?.([...current, item.id]);
                      } else {
                        onSelectionChange?.(current.filter((id) => id !== item.id));
                      }
                    }}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className={cn("px-5 py-4 text-[13px] last:pr-6", selectable ? "first:pl-2" : "first:pl-6")}>
                  {column.render(item)}
                </td>
              ))}
              {actions.length > 0 ? (
                <td className="px-3 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
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
                            {typeof action.label === "function" ? action.label(item) : action.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
