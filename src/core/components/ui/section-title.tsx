import * as React from "react";
import { cn } from '../../../lib/utils';

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
}

export function SectionTitle({
  title,
  action,
  className,
  ...props
}: SectionTitleProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      <h2 className="text-[13px]" style={{ color: "var(--t-text)" }}>{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}


