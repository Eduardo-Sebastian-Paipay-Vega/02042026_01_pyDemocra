import * as React from "react";
import { cn } from "../../lib/utils";

interface OutlineButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function OutlineButton({
  children,
  className,
  size = "md",
  ...props
}: OutlineButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5",
    lg: "px-8 py-3",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
        "hover:-translate-y-0.5",
        "active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--t-primary)]/50",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      style={{
        border: "1px solid var(--t-border-strong)",
        background: "var(--t-input-bg)",
        color: "var(--t-text)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
