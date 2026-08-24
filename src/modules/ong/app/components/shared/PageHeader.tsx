// @ts-nocheck
import { cn } from "../../lib/utils";
import { GradientButton } from "@/core/components/ui/gradient-button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="max-w-3xl">
        <h1 className="text-[20px] tracking-tight" style={{ color: "var(--t-text)" }}>{title}</h1>
        {description && (
          <p className="mt-1 text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{description}</p>
        )}
      </div>
      {action && (
        <GradientButton size="sm" onClick={action.onClick}>
          {action.label}
        </GradientButton>
      )}
    </div>
  );
}

