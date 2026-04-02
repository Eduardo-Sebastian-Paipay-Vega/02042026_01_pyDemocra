import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalShellProps {
  open: boolean;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  dialogRef?: React.RefObject<HTMLDivElement | null>;
  maxWidthClassName?: string;
  maxHeightClassName?: string;
  zIndexClassName?: string;
  bodyScroll?: boolean;
  centered?: boolean;
}

export function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
  dialogRef,
  maxWidthClassName = 'max-w-[760px]',
  maxHeightClassName = 'max-h-[90vh]',
  zIndexClassName = 'z-[100]',
  bodyScroll = true,
  centered = false,
}: ModalShellProps) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName} p-4 sm:p-6 ${centered ? 'flex items-center justify-center' : ''}`}>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Cerrar modal"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={`relative ${centered ? '' : 'mx-auto mt-3'} flex w-full ${maxWidthClassName} ${maxHeightClassName} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className={`min-h-0 px-5 py-4 ${bodyScroll ? 'overflow-y-auto' : ''}`}>{children}</div>

        {footer && (
          <footer className="sticky bottom-0 z-10 border-t border-slate-200 bg-white px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
