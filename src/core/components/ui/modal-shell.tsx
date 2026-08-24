import * as React from "react";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/core/components/ui/utils";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  width?: string;
}

export function ModalShell({
  open,
  onClose,
  children,
  className,
  width = "max-w-[560px]",
}: ModalShellProps) {
  const handleBackdropPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      onClose();
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[rgba(2,2,6,0.76)] backdrop-blur-md"
            onPointerDown={handleBackdropPointerDown}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as any }}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative w-full",
              width,
              "max-h-[calc(100vh-2rem)] overflow-hidden rounded-[26px]",
              className
            )}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              background: "var(--t-elevated)",
              border: "1px solid var(--t-border-strong)",
              boxShadow:
                "var(--t-shadow-lg, 0 18px 50px rgba(0, 0, 0, 0.4)), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}


