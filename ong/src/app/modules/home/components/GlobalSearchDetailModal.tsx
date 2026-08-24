import { GradientButton } from '@/core/components/ui/gradient-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import type { GlobalSearchDetailData } from "../types";

interface GlobalSearchDetailModalProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  detail: GlobalSearchDetailData | null;
  onClose: () => void;
  onRetry: () => void;
  onNavigate: (path: string) => void;
}

export function GlobalSearchDetailModal({
  open,
  loading,
  error,
  detail,
  onClose,
  onRetry,
  onNavigate,
}: GlobalSearchDetailModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} width="max-w-[780px]">
      <div
        className="flex items-start justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--t-border)" }}
      >
        <div>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>
            {detail?.title ?? "Detalle del resultado"}
          </h3>
          <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
            {detail?.subtitle ?? "Consulta los datos principales antes de navegar al modulo."}
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar modal"
          className="rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--t-hover)]"
          style={{ color: "var(--t-text-secondary)" }}
          onClick={onClose}
        >
          X
        </button>
      </div>

      <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">
        {loading && (
          <div
            className="rounded-2xl px-4 py-3 text-[12px]"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p style={{ color: "var(--t-text-secondary)" }}>Cargando detalle...</p>
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-2xl p-3"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
          >
            <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
              {error}
            </p>
            <div className="mt-3">
              <OutlineButton size="sm" onClick={onRetry}>
                Reintentar
              </OutlineButton>
            </div>
          </div>
        )}

        {!loading && !error && detail && (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {detail.fields.map((field) => (
                <div
                  key={`${field.label}-${field.value}`}
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: "var(--t-hover)",
                    border: "1px solid var(--t-border)",
                  }}
                >
                  <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                    {field.label}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                    {field.value || "-"}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <GradientButton size="sm" onClick={() => onNavigate(detail.targetPath)}>
                Abrir registro
              </GradientButton>
              <OutlineButton size="sm" onClick={onClose}>
                Cerrar
              </OutlineButton>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
