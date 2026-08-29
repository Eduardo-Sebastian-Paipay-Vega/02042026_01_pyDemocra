import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusChange?: () => void;
  onAssignProject?: () => void;
  onExport?: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onAssignProject,
  onExport,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-14 left-0 right-0 z-10 flex items-center justify-between rounded-xl px-4 py-3 shadow-lg"
          style={{ background: "var(--t-elevated)", border: "1px solid var(--t-primary-soft)" }}
        >
          <span className="text-[13px] font-medium" style={{ color: "var(--t-primary)" }}>
            {selectedCount} beneficiario{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onStatusChange?.();
                toast.info("Función no implementada en backend todavía.");
              }}
              className="h-8 rounded-lg px-3 text-[12px] font-medium transition-colors hover:bg-[var(--t-hover)]"
              style={{ color: "var(--t-text)" }}
            >
              Cambiar estado
            </button>
            <button
              onClick={() => {
                onAssignProject?.();
                toast.info("Seleccione el proyecto de destino...");
              }}
              className="h-8 rounded-lg px-3 text-[12px] font-medium transition-colors hover:bg-[var(--t-hover)]"
              style={{ color: "var(--t-text)" }}
            >
              Asignar a proyecto
            </button>
            <button
              onClick={() => {
                onExport?.();
                toast.success(`Exportando ${selectedCount} registro(s) a CSV...`);
              }}
              className="h-8 rounded-lg bg-[var(--t-primary)] px-3 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Exportar CSV
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
