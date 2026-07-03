import { motion } from "motion/react";
import { useState, useRef } from "react";
import type { ReactNode, MouseEvent } from "react";

interface Feature {
  title: string;
  description: string;
  desktopSpan: string;
  visual?: string;
  icon?: ReactNode;
}

function FeatureCard({
  feature,
  index,
  isHovered,
  onEnter,
  onLeave,
}: {
  feature: Feature;
  index: number;
  isHovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (r) setSpot({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <motion.div
      ref={cardRef}
      /* Responsive span — always col-span-1 on mobile, desktop span via className */
      className={`col-span-1 ${feature.desktopSpan} group cursor-default`}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.08, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseEnter={onEnter}
      onMouseLeave={() => { setSpot(null); onLeave(); }}
      onMouseMove={onMove}
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-[1px] rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(0,85,255,0.18), transparent 60%)",
          filter: "blur(8px)",
        }}
      />

      {/* Card */}
      <div
        className="relative h-full rounded-[26px] p-7 overflow-hidden flex flex-col transition-all duration-400"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          transition: "border-color 0.35s ease, background 0.35s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        }}
      >
        {/* Top sheen */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
        />

        {/* Cursor spotlight */}
        {spot && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[26px]"
            style={{
              background: `radial-gradient(260px circle at ${spot.x}px ${spot.y}px, rgba(0,85,255,0.08), transparent 68%)`,
            }}
          />
        )}

        {/* Abstract icon — AI */}
        {feature.icon && (
          <div className="absolute top-5 right-5 w-20 h-20 group-hover:scale-110 transition-transform duration-700">
            {feature.icon}
          </div>
        )}

        {/* Brand watermark — large AI card only */}
        {feature.visual === "ai" && (
          <div className="absolute bottom-5 right-5 w-28 h-28 pointer-events-none opacity-[0.055] group-hover:opacity-[0.10] transition-opacity duration-700">
            <img
              src="/brand/core-vector.png"
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: "invert(1) brightness(2)" }}
            />
          </div>
        )}

        {/* Chart visual */}
        {feature.visual === "chart" && (
          <div className="absolute bottom-0 right-0 w-36 h-36 opacity-[0.12] group-hover:opacity-[0.28] transition-opacity duration-500">
            <div className="flex items-end justify-center gap-1.5 h-full p-5">
              {[35, 65, 45, 85, 55, 70].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{ background: "linear-gradient(to top, #0055FF, #7000FF)" }}
                  initial={{ height: "0%" }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                  animate={isHovered
                    ? { height: [`${h}%`, `${h + 9}%`, `${h}%`] }
                    : { height: `${h}%` }
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Realtime network lines */}
        {feature.visual === "realtime" && (
          <div className="absolute inset-0 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity duration-500 overflow-hidden rounded-[26px]">
            <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
              <circle cx="40"  cy="100" r="3" fill="white" />
              <circle cx="100" cy="55"  r="3" fill="white" />
              <circle cx="160" cy="100" r="3" fill="white" />
              <circle cx="100" cy="145" r="3" fill="white" />
              <line x1="40"  y1="100" x2="100" y2="55"  stroke="white" strokeWidth="0.6" />
              <line x1="100" y1="55"  x2="160" y2="100" stroke="white" strokeWidth="0.6" />
              <line x1="160" y1="100" x2="100" y2="145" stroke="white" strokeWidth="0.6" />
              <line x1="100" y1="145" x2="40"  y2="100" stroke="white" strokeWidth="0.6" />
              <line x1="40"  y1="100" x2="160" y2="100" stroke="white" strokeWidth="0.3" strokeDasharray="4 4" />
            </svg>
          </div>
        )}

        <div className="relative z-10 mt-auto">
          <h3
            className="text-lg font-semibold mb-2 transition-colors duration-300"
            style={{ letterSpacing: "-0.01em" }}
          >
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed font-light" style={{ color: "var(--body-fg)" }}>
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features: Feature[] = [
    {
      title: "Automatización IA",
      description:
        "Modelos de lenguaje para resumir debates, detectar consenso y generar propuestas automáticas.",
      desktopSpan: "md:col-span-2 md:row-span-2",
      visual: "ai",
      icon: (
        <svg className="w-full h-full opacity-[0.07]" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gAI" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#0055FF" />
              <stop offset="100%" stopColor="#7000FF" />
            </linearGradient>
          </defs>
          <path d="M20,50 Q40,22 50,50 T80,50" fill="none" stroke="url(#gAI)" strokeWidth="0.7" />
          <path d="M25,62 Q45,34 55,62 T85,62" fill="none" stroke="url(#gAI)" strokeWidth="0.7" />
          <path d="M15,38 Q35,10 45,38 T75,38" fill="none" stroke="url(#gAI)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="3.5" fill="#0055FF" opacity="0.7" />
          <circle cx="80" cy="50" r="2.5" fill="#7000FF" opacity="0.6" />
          <circle cx="20" cy="50" r="2.5" fill="#7000FF" opacity="0.6" />
        </svg>
      ),
    },
    {
      title: "SaaS accesible",
      description: "Dashboard intuitivo. Desde startups hasta corporaciones.",
      desktopSpan: "",
      visual: "simple",
    },
    {
      title: "Seguridad",
      description: "Cifrado E2E, auditoría inmutable, SSO/SAML.",
      desktopSpan: "",
      visual: "security",
      icon: (
        <svg className="w-full h-full opacity-[0.07]" viewBox="0 0 100 100">
          <polygon points="50,18 82,32 82,68 50,82 18,68 18,32"
            fill="none" stroke="#0055FF" strokeWidth="0.7" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="#7000FF" strokeWidth="0.7" />
          <circle cx="50" cy="50" r="4"  fill="#0055FF" opacity="0.55" />
        </svg>
      ),
    },
    {
      title: "Analítica profunda",
      description: "Métricas de participación y tendencias históricas en tiempo real.",
      desktopSpan: "md:row-span-2",
      visual: "chart",
    },
    {
      title: "Tiempo real",
      description: "Resultados instantáneos con WebSockets.",
      desktopSpan: "",
      visual: "realtime",
    },
    {
      title: "Gestión de roles",
      description: "Sistema granular de permisos configurables.",
      desktopSpan: "",
      visual: "roles",
    },
  ];

  return (
    <section id="producto" className="py-36 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] mb-6 leading-[1.0]">
            Gobernanza para el
            <br />
            futuro del trabajo
          </h2>
          <p className="text-lg font-light max-w-xl mx-auto" style={{ color: "var(--body-fg)" }}>
            De 5 a 50,000 personas. Tecnología de punta, interfaz humana.
          </p>
        </motion.div>

        {/* Bento — 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-6xl mx-auto auto-rows-fr">
          {features.map((f, i) => (
            <FeatureCard
              key={f.title}
              feature={f}
              index={i}
              isHovered={hoveredIndex === i}
              onEnter={() => setHoveredIndex(i)}
              onLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
