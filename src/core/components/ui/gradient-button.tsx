import * as React from "react";
import { cn } from '../../../lib/utils';

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function GradientButton({
  children,
  className,
  size = "md",
  ...props
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5",
    lg: "px-8 py-3",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium text-white transition-all duration-200",
        "bg-gradient-to-r from-[var(--t-primary)] to-[var(--t-tertiary)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,46,254,0.30)]",
        "active:translate-y-0 active:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--t-primary)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--t-bg,#100E0C)]",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}


