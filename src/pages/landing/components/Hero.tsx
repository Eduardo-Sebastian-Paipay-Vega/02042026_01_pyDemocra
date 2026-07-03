import { motion } from "motion/react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onOpenContact?: () => void;
}

export function Hero({ onOpenContact }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-40 pb-32">
      <div className="max-w-5xl mx-auto w-full text-center relative z-10">

        {/* App icon — brand anchor */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.06, duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex justify-center mb-7"
        >
          <img
            src="/brand/d-core-neon.png"
            alt="democra.pro"
            className="w-[72px] h-[72px] rounded-[20px]"
            style={{
              boxShadow: "0 0 48px rgba(0,85,255,0.5), 0 0 100px rgba(0,85,255,0.18), 0 4px 24px rgba(0,0,0,0.5)",
            }}
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
          className="inline-flex items-center gap-2 border border-white/[0.08] rounded-full px-4 py-1.5 mb-12 backdrop-blur-sm bg-white/[0.02]"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--blue)", animation: "pulseDot 2.5s ease-in-out infinite" }}
          />
          <span className="text-[11px] text-white/45 font-light tracking-widest uppercase">
            Gobernanza con IA · 2026
          </span>
        </motion.div>

        {/* H1 */}
        <div className="relative mb-10">
          {/* Glow behind headline */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(0,85,255,0.13) 0%, transparent 65%)",
              filter: "blur(30px)",
            }}
          />
          <motion.h1
            className="font-display relative text-[clamp(3rem,9vw,6.5rem)] leading-[0.94] tracking-[-0.02em] text-glow"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.85, ease: [0.25, 0.4, 0.25, 1] }}
          >
            Democratiza la
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, #0044dd 0%, #0055FF 25%, #7000FF 55%, #0055FF 78%, #0044dd 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 5s linear infinite",
                display: "inline-block",
              }}
            >
              inteligencia
            </span>
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl max-w-lg mx-auto leading-relaxed font-light mb-14"
          style={{ color: "var(--body-fg)" }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
        >
          Automatización inteligente y decisiones
          <br className="hidden md:block" />
          colectivas en tiempo real.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {/* Primary — solid blue with shimmer sweep */}
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <Link to="/login">
              <Button
                size="lg"
                className="relative overflow-hidden text-white px-10 h-12 rounded-xl text-sm font-semibold group"
                style={{
                  background: "linear-gradient(135deg, #0055FF, #3b82f6)",
                  boxShadow: "0 0 36px rgba(0,85,255,0.3), 0 1px 0 rgba(255,255,255,0.12) inset",
                  transition: `all var(--t-smooth)`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 52px rgba(0,85,255,0.5), 0 1px 0 rgba(255,255,255,0.15) inset";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 36px rgba(0,85,255,0.3), 0 1px 0 rgba(255,255,255,0.12) inset";
                }}
              >
                <span className="relative z-10">Comenzar ahora</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </Link>
          </motion.div>

          {/* Ghost secondary */}
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <Button
              size="lg"
              variant="ghost"
              onClick={onOpenContact}
              className="text-white/55 hover:text-white hover:bg-white/[0.05] px-8 h-12 rounded-xl text-sm border border-white/10 hover:border-white/20"
              style={{ transition: `all var(--t-smooth)` }}
            >
              Ver demo <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Social proof */}
        <motion.p
          className="text-[11px] mt-12 font-light tracking-widest uppercase"
          style={{ color: "var(--body-fg)", opacity: 0.6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.72, duration: 0.8 }}
        >
          +2,400 organizaciones confían en democra.pro
        </motion.p>
      </div>
    </section>
  );
}
