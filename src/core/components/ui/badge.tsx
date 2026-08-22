import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neutral-900 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50",
        destructive:
          "border-transparent bg-red-500/10 text-red-600 dark:bg-red-500/10 dark:text-red-400",
        outline: "border-neutral-200 text-neutral-900 dark:border-neutral-800 dark:text-neutral-50",
        success: "border-transparent bg-green-500/10 text-green-600 dark:bg-green-500/10 dark:text-green-400",
        warning: "border-transparent bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };


