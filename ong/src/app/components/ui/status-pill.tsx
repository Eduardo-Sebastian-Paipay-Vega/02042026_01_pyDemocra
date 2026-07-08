import * as React from "react";
import { cn } from "../../lib/utils";

type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "default";

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

const dotColors: Record<StatusVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  destructive: "bg-red-400",
  info: "bg-[#9B7AEA]",
  secondary: "bg-[#A7A7A7]/60",
  default: "bg-[#F5F5F5]/60",
};

const textColors: Record<StatusVariant, string> = {
  success: "text-emerald-400/90",
  warning: "text-amber-400/90",
  destructive: "text-red-400/90",
  info: "text-[#9B7AEA]/90",
  secondary: "text-[#A7A7A7]",
  default: "text-[#F5F5F5]/80",
};

export function StatusPill({
  variant = "default",
  children,
  className,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs capitalize",
        textColors[variant],
        className
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />
      {children}
    </span>
  );
}