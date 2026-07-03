import { motion } from "motion/react";

const metrics = [
  { value: "87%", label: "Participación media" },
  { value: "4×",  label: "Velocidad de decisión" },
  { value: "99.9%", label: "Disponibilidad" },
];

export function VisualImpact() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Separator top */}
      <div
        className="absolute top-0 left-0 right-0 h-px mx-auto max-w-5xl"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
      />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] mb-4 leading-[0.98]">
            Decisiones{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0055FF, #7000FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              4×
            </span>{" "}
            más rápidas
          </h2>
          <p className="text-base font-light" style={{ color: "var(--body-fg)" }}>
            Datos reales de organizaciones que usan democra.pro
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {metrics.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.55 }}
              className="text-center group"
            >
              <div
                className="relative rounded-2xl p-8 border border-white/[0.07] transition-all duration-300 group-hover:border-white/[0.13]"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                {/* Number glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at 50% 30%, rgba(0,85,255,0.07), transparent 65%)",
                  }}
                />
                <div
                  className="font-mono text-[3.5rem] md:text-[4.5rem] font-bold leading-none mb-3 tabular-nums relative"
                  style={{ letterSpacing: "-0.03em", color: "#ffffff" }}
                >
                  {item.value}
                </div>
                <div
                  className="text-sm font-light uppercase tracking-[0.1em]"
                  style={{ color: "var(--body-fg)" }}
                >
                  {item.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Separator bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px mx-auto max-w-5xl"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
      />
    </section>
  );
}
