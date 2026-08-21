import * as React from "react";
import { cn } from "../../lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  noPadding = false,
  hover = false,
  style,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl backdrop-blur-xl",
        hover && "transition-all duration-250 hover:-translate-y-0.5",
        !noPadding && "p-6",
        className
      )}
      style={{
        background: "var(--t-surface)",
        border: "1px solid var(--t-border)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
