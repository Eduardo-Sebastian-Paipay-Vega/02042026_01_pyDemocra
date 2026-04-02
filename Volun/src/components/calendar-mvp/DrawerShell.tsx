import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DrawerShellProps {
  open: boolean;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
  zIndexClassName?: string;
}

export function DrawerShell({
  open,
  title,
  subtitle,
  onClose,
  headerActions,
  children,
  widthClassName = 'md:w-[min(94vw,1120px)]',
  zIndexClassName = 'z-[70]',
}: DrawerShellProps) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName}`}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar panel de detalle"
      />

      <aside
        className={`absolute inset-x-0 bottom-0 h-[88vh] rounded-t-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 md:inset-y-0 md:left-auto md:right-0 md:h-full ${widthClassName} md:rounded-none md:rounded-l-2xl`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-600">{subtitle}</p>}
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
              aria-label="Cerrar drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="h-[calc(100%-58px)] min-h-0 overflow-hidden p-4 md:p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
