import { motion } from "motion/react";

const VOTES = [
  { label: "Ampliar presupuesto de I+D", pct: 84 },
  { label: "Mantener el presupuesto actual", pct: 61 },
  { label: "Reducir gastos operativos",   pct: 37 },
];

const AVATARS = [
  { letter: "A", hue: 220 },
  { letter: "C", hue: 250 },
  { letter: "M", hue: 200 },
  { letter: "R", hue: 280 },
  { letter: "S", hue: 170 },
];

export function VisualShowcase() {
  return (
    <section className="py-36 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2
            className="font-display text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold leading-[0.96] tracking-[-0.02em] mb-5"
          >
            Decisiones en
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #0055FF, #7000FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              tiempo real
            </span>
          </h2>
          <p className="text-base font-light" style={{ color: "var(--body-fg)" }}>
            Cada voto cuenta. Cada decisiÃ³n, documentada.
          </p>
        </motion.div>

        {/* Dashboard card */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative max-w-3xl mx-auto"
        >
          {/* Outer ambient glow */}
          <div
            className="absolute -inset-12 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,85,255,0.14), transparent 70%)",
              filter: "blur(30px)",
            }}
          />

          {/* Card */}
          <div
            className="relative rounded-[28px] overflow-hidden"
            style={{
              background: "rgba(10,10,12,0.95)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Top sheen line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
            />

            <div className="p-7">
              {/* Card header */}
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-start gap-3">
                  <img
                    src="/brand/d-core-neon.png"
                    alt=""
                    className="w-9 h-9 rounded-xl flex-shrink-0 mt-0.5"
                    style={{ boxShadow: "0 0 16px rgba(0,85,255,0.35)" }}
                  />
                  <div>
                    <p
                      className="text-[10px] font-light tracking-widest uppercase mb-1.5"
                      style={{ color: "var(--body-fg)" }}
                    >
                      VotaciÃ³n #Q2-2026 Â· Abierta
                    </p>
                    <h3 className="text-base font-semibold text-white/90 leading-snug max-w-[240px]">
                      AsignaciÃ³n de presupuesto tecnolÃ³gico
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                  {/* Live badge â€” RED pulse per spec */}
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{
                      border: "1px solid rgba(239,68,68,0.35)",
                      background: "rgba(239,68,68,0.08)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-red-500"
                      style={{ animation: "pulseDot 2s ease-in-out infinite" }}
                    />
                    <span className="text-[11px] text-red-400 font-mono tracking-wide">Live</span>
                  </div>

                  {/* Avatar stack */}
                  <div className="flex -space-x-2">
                    {AVATARS.map(({ letter, hue }) => (
                      <div
                        key={letter}
                        className="w-7 h-7 rounded-full border border-black/70 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                        style={{ background: `hsl(${hue}, 70%, 38%)` }}
                      >
                        {letter}
                      </div>
                    ))}
                    <div
                      className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-white/40 font-mono"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      +282
                    </div>
                  </div>
                </div>
              </div>

              {/* Voting bars */}
              <div className="space-y-5">
                {VOTES.map((v, i) => (
                  <motion.div
                    key={v.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.28 + i * 0.16, duration: 0.5 }}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-light" style={{ color: "var(--body-fg)" }}>
                        {v.label}
                      </span>
                      <span
                        className="text-sm font-mono tabular-nums"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {v.pct}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${v.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.45 + i * 0.16, duration: 1.1, ease: "easeOut" }}
                        style={{
                          background: "linear-gradient(90deg, #0055FF, #7000FF)",
                          boxShadow: "0 0 14px rgba(0,85,255,0.55), 0 0 5px rgba(112,0,255,0.3)",
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div
                className="mt-6 pt-5 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[11px] font-light font-mono" style={{ color: "var(--body-fg)" }}>
                  287 participantes Â· Cierra en 4h 22m
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <span className="text-[11px] font-light" style={{ color: "var(--body-fg)" }}>
                    QuÃ³rum alcanzado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

