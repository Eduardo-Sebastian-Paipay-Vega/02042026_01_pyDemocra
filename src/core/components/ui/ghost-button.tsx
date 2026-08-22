import * as React from "react";
import { cn } from '../../../lib/utils';

interface GhostButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function GhostButton({
  children,
  className,
  size = "md",
  ...props
}: GhostButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200",
        "hover:bg-[var(--t-hover)]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--t-primary)]/50",
        "active:bg-[var(--t-active)]",
        "disabled:opacity-40 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      style={{ color: "var(--t-text-secondary)" }}
      {...props}
    >
      {children}
    </button>
  );
}


