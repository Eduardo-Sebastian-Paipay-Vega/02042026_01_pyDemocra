import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  X,
  Book,
  Mail,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/core/components/ui/utils";

const resources = [
  { icon: Book, label: "Ver documentaciÃƒÂ³n", description: "GuÃƒÂ­as y referencia", href: "#" },
  { icon: Mail, label: "Contactar soporte", description: "EscrÃƒÂ­benos", href: "#" },
];

const shortcuts = [
  { keys: ["\u2318", "K"], label: "Paleta de comandos" },
  { keys: ["G", "H"], label: "Ir a Horas" },
  { keys: ["G", "A"], label: "Ir a Actividades" },
  { keys: ["G", "V"], label: "Ir a Voluntarios" },
  { keys: ["G", "D"], label: "Ir al Panel" },
  { keys: ["G", "P"], label: "Ir a Proyectos" },
  { keys: ["G", "R"], label: "Ir a Solicitudes" },
  { keys: ["\u21E7", "N"], label: "Nueva actividad" },
  { keys: ["/"], label: "Enfocar bÃƒÂºsqueda" },
];

const tips = [
  { text: "Aprobaciones pendientes: 2", type: "warning" as const },
  { text: "4 alertas requieren atenciÃƒÂ³n", type: "warning" as const },
  { text: "Usa G y luego una letra para navegar rÃƒÂ¡pido", type: "tip" as const },
];

export function HelpAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as any }}
            className="absolute bottom-14 right-0 w-[300px] overflow-hidden rounded-2xl backdrop-blur-2xl"
            style={{
              background: "var(--t-elevated)",
              border: "1px solid var(--t-border-strong)",
              boxShadow: "var(--t-shadow-lg)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
              <span className="text-[13px]" style={{ color: "var(--t-text)" }}>Ã‚Â¿Necesitas ayuda?</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--t-hover)]"
                style={{ color: "var(--t-text-tertiary)" }}
                aria-label="Cerrar ayuda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Atajos */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
              <p className="mb-2.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--t-text-dim)" }}>
                Atajos de teclado
              </p>
              <div className="space-y-2">
                {shortcuts.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
                      {s.label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={`${s.label}-${i}`}
                          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[10px]"
                          style={{ border: "1px solid var(--t-border-strong)", background: "var(--t-input-bg)", color: "var(--t-text-tertiary)" }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
              <p className="mb-2.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--t-text-dim)" }}>
                Consejos
              </p>
              <div className="space-y-2">
                {tips.map((tip) => (
                  <div key={tip.text} className="flex items-start gap-2">
                    {tip.type === "warning" ? (
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-400/60" />
                    ) : (
                      <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-[var(--t-accent-warm)]/80" />
                    )}
                    <span className="text-[12px] leading-relaxed" style={{ color: "var(--t-text-tertiary)" }}>
                      {tip.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos */}
            <div className="p-2">
              {resources.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--t-hover)]"
                  style={{ color: "var(--t-text-secondary)" }}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]">{item.label}</div>
                    <div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                      {item.description}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-30" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          open
            ? "bg-[var(--t-active)]"
            : "hover:shadow-[0_0_20px_rgba(0,46,254,0.15)]"
        )}
        style={{
          background: open ? "var(--t-active)" : "var(--t-elevated)",
          border: `1px solid ${open ? "var(--t-border-strong)" : "var(--t-border)"}`,
          color: open ? "var(--t-text)" : "var(--t-text-secondary)",
        }}
        aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"}
      >
        {open ? <X className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
      </motion.button>
    </div>
  );
}


