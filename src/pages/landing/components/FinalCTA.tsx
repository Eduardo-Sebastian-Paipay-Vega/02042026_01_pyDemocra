import { motion } from "motion/react";
import { useNavigate } from "react-router";

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-36 px-6 relative overflow-hidden">
      {/* Ambient glow behind the CTA */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,85,255,0.11), transparent 65%)",
          filter: "blur(20px)",
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {/* Brand icon — visual anchor for CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex justify-center mb-9"
          >
            <img
              src="/brand/d-core-neon.png"
              alt="democra.pro"
              className="w-20 h-20 rounded-[24px]"
              style={{
                boxShadow: "0 0 60px rgba(0,85,255,0.55), 0 0 120px rgba(0,85,255,0.22), 0 8px 32px rgba(0,0,0,0.5)",
              }}
            />
          </motion.div>

          <h2 className="font-display text-[clamp(2.8rem,8vw,5.5rem)] leading-[0.95] mb-7 text-glow">
            Empieza hoy
          </h2>

          <p
            className="text-lg font-light mb-12"
            style={{ color: "var(--body-fg)" }}
          >
            Más de 2,400 organizaciones confían en democra.pro
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {/* Solid primary */}
            <motion.button
              className="h-12 px-9 rounded-xl text-sm font-semibold text-white relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #0055FF, #3b82f6)",
                boxShadow: "0 0 36px rgba(0,85,255,0.3), 0 1px 0 rgba(255,255,255,0.12) inset",
              }}
              whileHover={{
                scale: 1.04,
                y: -2,
                boxShadow: "0 0 52px rgba(0,85,255,0.5)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={() => navigate("/login")}
            >
              <span className="relative z-10">Crear cuenta</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.button>

            {/* Ghost */}
            <motion.button
              className="h-12 px-8 rounded-xl text-sm font-light border border-white/10 hover:border-white/22 hover:bg-white/[0.04]"
              style={{ color: "var(--body-fg)", transition: "all var(--t-smooth)" }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={() => navigate("/login")}
            >
              Ya tengo cuenta
            </motion.button>
          </div>

          <p
            className="text-[11px] mt-9 font-light tracking-wider uppercase"
            style={{ color: "rgba(136,136,136,0.55)" }}
          >
            Prueba 14 días sin compromiso · Sin tarjeta de crédito
          </p>
        </motion.div>
      </div>
    </section>
  );
}
