import * as React from "react";
import { cn } from '../../../lib/utils';

type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "default";

interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

const dotColors: Record<StatusVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  destructive: "bg-red-400",
  info: "bg-[#9B7AEA]",
  secondary: "bg-[#A7A7A7]/50",
  default: "bg-[#F5F5F5]/40",
};

const textColors: Record<StatusVariant, string> = {
  success: "text-emerald-400/80",
  warning: "text-amber-400/80",
  destructive: "text-red-400/80",
  info: "text-[#9B7AEA]/80",
  secondary: "text-[#A7A7A7]/70",
  default: "text-[#F5F5F5]/60",
};

export function StatusDot({
  variant = "default",
  children,
  className,
  ...props
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] capitalize",
        textColors[variant],
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "h-[5px] w-[5px] rounded-full",
          dotColors[variant]
        )}
      />
      {children}
    </span>
  );
}


