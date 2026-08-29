import {  cn  } from "@/core/components/ui/utils";
import { GradientButton } from "../ui/gradient-button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, className, children }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="max-w-3xl">
        <h1 className="text-[32px] font-semibold tracking-tight" style={{ color: "var(--t-text)" }}>{title}</h1>
        {description && (
          <p className="mt-1.5 text-[15px]" style={{ color: "var(--t-text-secondary)" }}>{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <GradientButton size="sm" onClick={action.onClick} disabled={action.disabled}>
            {action.label}
          </GradientButton>
        )}
      </div>
    </div>
  );
}
