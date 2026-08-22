import * as React from "react";
import { cn } from '../../../lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  dotColor?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[5px] top-[6px] bottom-[6px] w-px" style={{ background: "var(--t-border)" }} />

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="group relative flex gap-3 pl-1">
            <div
              className={cn(
                "relative z-10 mt-[6px] h-[10px] w-[10px] shrink-0 rounded-full border-2 transition-colors duration-200",
                item.dotColor || "bg-[var(--t-text-dim)]"
              )}
              style={{ borderColor: "var(--t-bg)" }}
            />
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] truncate transition-colors duration-200" style={{ color: "var(--t-text)" }}>
                  {item.title}
                </p>
                <span className="text-[10px] shrink-0 tabular-nums" style={{ color: "var(--t-text-dim)" }}>
                  {item.time}
                </span>
              </div>
              {item.subtitle && (
                <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--t-text-dim)" }}>
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


