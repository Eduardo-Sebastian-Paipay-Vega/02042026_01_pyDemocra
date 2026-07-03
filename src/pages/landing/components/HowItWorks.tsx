import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Conecta",
    description: "Crea tu organización en 5 minutos. Invita miembros vía email o SSO.",
  },
  {
    number: "02",
    title: "Automatiza",
    description: "Crea votaciones y encuestas con IA. Deliberación guiada al instante.",
  },
  {
    number: "03",
    title: "Escala",
    description: "De 10 a 100,000 miembros sin cambiar de plataforma.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-[clamp(2.4rem,6vw,4rem)] mb-4 leading-[1.0]">
            Empieza en minutos
          </h2>
          <p className="text-base font-light" style={{ color: "var(--body-fg)" }}>
            Sin configuración compleja. Sin equipos de IT.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-0 max-w-4xl mx-auto relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden md:block absolute top-[22px] left-[16%] right-[16%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,85,255,0.25), rgba(112,0,255,0.25), transparent)" }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative text-center md:text-left px-6"
            >
              {/* Numbered circle */}
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full mb-5 relative"
                   style={{
                     background: "rgba(0,85,255,0.08)",
                     border: "1px solid rgba(0,85,255,0.25)",
                   }}>
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: "#0055FF" }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2.5" style={{ letterSpacing: "-0.01em" }}>
                {step.title}
              </h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: "var(--body-fg)" }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
