import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative rounded-2xl backdrop-blur-xl px-5 py-4 transition-colors duration-300",
        className
      )}
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] tracking-wide uppercase" style={{ color: "var(--t-text-dim)" }}>{title}</p>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <p className="text-2xl tracking-tight tabular-nums" style={{ color: "var(--t-text)" }}>{value}</p>
            {trend && (
              <span className={cn(
                "text-[11px] tabular-nums",
                trend.positive ? "text-emerald-400/60" : "text-red-400/60"
              )}>
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div
          className="rounded-xl p-2.5 transition-colors duration-300"
          style={{ background: "var(--t-input-bg)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
        </div>
      </div>
    </motion.div>
  );
}
