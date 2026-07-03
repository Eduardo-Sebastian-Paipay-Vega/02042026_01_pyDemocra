import { motion } from "motion/react";

const logos = [
  "Accenture","Sequoia","Y Combinator","Shopify","Stripe","Atlassian",
  "Notion","Linear","Figma","Vercel","Supabase","OpenAI",
];

const stats = [
  { value: "2,400+", label: "Organizaciones activas" },
  { value: "18M",    label: "Votaciones procesadas" },
  { value: "99.9%",  label: "Uptime garantizado" },
  { value: "4.9",    label: "Satisfacción media" },
];

export function TrustSection() {
  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Marquee row */}
        <div className="relative mb-20">
          {/* Edge fades keyed to true black */}
          <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
               style={{ background: "linear-gradient(to right, #000000, transparent)" }} />
          <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
               style={{ background: "linear-gradient(to left, #000000, transparent)" }} />

          <div
            className="flex gap-16 whitespace-nowrap"
            style={{ animation: "scrollLeft 42s linear infinite" }}
          >
            {[...logos, ...logos, ...logos].map((logo, i) => (
              <span
                key={i}
                className="flex-shrink-0 text-sm font-medium tracking-wider cursor-default transition-colors duration-300"
                style={{ color: "rgba(255,255,255,0.22)" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.22)")}
              >
                {logo}
              </span>
            ))}
          </div>
        </div>

        {/* Stats grid — 4 equal cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
              className="group"
            >
              <div
                className="relative border border-white/[0.07] rounded-2xl p-7 text-center h-full flex flex-col items-center justify-center transition-all duration-300 group-hover:border-white/[0.14]"
                style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)" }}
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                     style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,85,255,0.06), transparent 70%)" }} />

                <div
                  className="font-mono text-[2.75rem] md:text-5xl font-semibold leading-none mb-2.5 tabular-nums relative"
                  style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs font-light uppercase tracking-[0.12em]"
                  style={{ color: "var(--body-fg)" }}
                >
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
