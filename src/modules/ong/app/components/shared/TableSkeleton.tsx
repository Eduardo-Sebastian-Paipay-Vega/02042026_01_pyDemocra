import { cn } from "../../lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl backdrop-blur-xl", className)}
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-6 px-6 py-3"
        style={{ borderBottom: "1px solid var(--t-border)" }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="h-2.5 rounded-full animate-pulse"
            style={{
              background: "var(--t-active)",
              width: i === 0 ? "80px" : i === columns - 1 ? "50px" : "60px",
            }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className="flex items-center gap-6 px-6 py-4"
          style={rowIdx < rows - 1 ? { borderBottom: "1px solid var(--t-border)" } : undefined}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={`c-${rowIdx}-${colIdx}`} className="flex flex-col gap-1.5" style={{ flex: colIdx === 0 ? 1.5 : 1 }}>
              <div
                className="h-3 rounded-full animate-pulse"
                style={{
                  background: "var(--t-active)",
                  width: colIdx === 0 ? "70%" : `${45 + Math.random() * 30}%`,
                  animationDelay: `${(rowIdx * columns + colIdx) * 60}ms`,
                }}
              />
              {colIdx === 0 && (
                <div
                  className="h-2 rounded-full animate-pulse"
                  style={{
                    background: "var(--t-hover)",
                    width: "45%",
                    animationDelay: `${(rowIdx * columns + colIdx) * 60 + 100}ms`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
