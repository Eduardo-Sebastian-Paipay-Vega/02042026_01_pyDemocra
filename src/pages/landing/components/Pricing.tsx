import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Check } from "lucide-react";

interface PricingProps {
  onOpenContact: () => void;
}

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mes",
    description: "Para equipos que empiezan con gobernanza digital.",
    features: [
      "Hasta 10 miembros",
      "5 votaciones activas",
      "Dashboard básico",
      "Soporte por email",
      "API limitada",
    ],
    cta: "Comenzar ahora",
    popular: false,
    action: "login" as const,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mes",
    description: "Para organizaciones en crecimiento que necesitan potencia real.",
    features: [
      "Hasta 500 miembros",
      "Votaciones ilimitadas",
      "IA incorporada",
      "Analítica avanzada",
      "API completa + Webhooks",
      "Slack / Teams / Jira",
      "Soporte 24/7 prioritario",
    ],
    cta: "Prueba 14 días",
    popular: true,
    action: "login" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Para corporaciones con requerimientos avanzados.",
    features: [
      "Miembros ilimitados",
      "SSO / SAML",
      "Auditoría completa",
      "SLA 99.99%",
      "Onboarding dedicado",
      "GDPR / SOC2",
      "Instancia privada",
    ],
    cta: "Contactar ventas",
    popular: false,
    action: "contact" as const,
  },
];

export function Pricing({ onOpenContact }: PricingProps) {
  const navigate = useNavigate();

  return (
    <section id="precios" className="py-28 px-6 relative overflow-hidden">
      {/* Subtle radial behind section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,85,255,0.07), transparent 65%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] mb-5 leading-[1.0]">
            Precios simples
          </h2>
          <p className="text-lg font-light" style={{ color: "var(--body-fg)" }}>
            Sin sorpresas. Escala cuando crezcas.
          </p>
        </motion.div>

        {/* Cards — stretch to equal height */}
        <div className="grid lg:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
              className="relative flex flex-col"
            >
              {/* Centered "Más popular" badge — floats above card border */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <span
                    className="text-[11px] font-semibold tracking-wide text-white px-3.5 py-1 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #0055FF, #7000FF)",
                      boxShadow: "0 0 20px rgba(0,85,255,0.4)",
                    }}
                  >
                    Más popular
                  </span>
                </div>
              )}

              {/* Pro outer glow */}
              {plan.popular && (
                <div
                  className="absolute -inset-[1px] rounded-[26px] pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,85,255,0.5), rgba(112,0,255,0.4))",
                    borderRadius: "26px",
                    opacity: 0.6,
                  }}
                />
              )}

              {/* Card body */}
              <div
                className="relative flex flex-col flex-1 rounded-[24px] p-7 overflow-hidden"
                style={{
                  background: plan.popular
                    ? "rgba(0,85,255,0.07)"
                    : "rgba(255,255,255,0.025)",
                  border: plan.popular
                    ? "1px solid rgba(0,85,255,0.55)"
                    : "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(18px)",
                }}
              >
                {/* Top sheen */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: plan.popular
                      ? "linear-gradient(90deg, transparent, rgba(0,85,255,0.5), transparent)"
                      : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  }}
                />

                {/* Plan header */}
                <div className="mb-7">
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-4"
                    style={{ color: plan.popular ? "#0055FF" : "var(--body-fg)" }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-3">
                    <span
                      className="font-mono text-5xl font-bold leading-none tabular-nums"
                      style={{ letterSpacing: "-0.03em" }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className="text-sm font-light mb-1"
                        style={{ color: "var(--body-fg)" }}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-light leading-relaxed" style={{ color: "var(--body-fg)" }}>
                    {plan.description}
                  </p>
                </div>

                {/* Features list — grows to fill */}
                <div className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      {/* Blue check — brand color */}
                      <Check
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: "#0055FF", strokeWidth: 2.5 }}
                      />
                      <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA button — always at bottom */}
                <button
                  className="w-full h-11 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: plan.popular
                      ? "linear-gradient(135deg, #0055FF, #3b82f6)"
                      : "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    boxShadow: plan.popular ? "0 0 28px rgba(0,85,255,0.35)" : "none",
                    transitionDuration: "var(--t-smooth)",
                  }}
                  onClick={plan.action === "login" ? () => window.location.assign("/ong/create") : onOpenContact}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (plan.popular) {
                      el.style.boxShadow = "0 0 40px rgba(0,85,255,0.55)";
                    } else {
                      el.style.background = "rgba(255,255,255,0.1)";
                    }
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    if (plan.popular) {
                      el.style.boxShadow = "0 0 28px rgba(0,85,255,0.35)";
                      el.style.background = "linear-gradient(135deg, #0055FF, #3b82f6)";
                    } else {
                      el.style.background = "rgba(255,255,255,0.06)";
                    }
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
