import { motion } from "motion/react";
import { Link, useNavigate } from "react-router";

const values = [
  {
    title: "Transparencia",
    description:
      "Procesos claros, información accesible y rendición de cuentas en cada paso.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
        <rect x="8" y="8" width="24" height="24" rx="4" stroke="#0055FF" strokeWidth="1.5" />
        <path d="M14 20h12M14 15h8M14 25h6" stroke="#0055FF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Impacto",
    description:
      "Cada funcionalidad amplifica el trabajo de quienes cambian el mundo.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
        <circle cx="20" cy="20" r="12" stroke="#7000FF" strokeWidth="1.5" />
        <path d="M20 14v6l4 3" stroke="#7000FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Simplicidad",
    description:
      "Menos fricción, más acción. Tecnología al servicio de las personas.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
        <path d="M12 28L28 12M16 12h12v12" stroke="#0055FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const team = [
  { name: "Eduardo Bastian", role: "Fundador & CEO", initials: "EB" },
  { name: "Equipo de Producto", role: "Diseño & Ingeniería", initials: "EP" },
  { name: "Asesores", role: "Impacto Social", initials: "AS" },
];

export function NosotrosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#000000] text-white antialiased overflow-x-hidden">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,85,255,0.07), transparent 60%)",
        }}
      />

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          background: "rgba(0,0,0,0.6)",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="Inicio">
          <img src="/Imagen/Iconos/logo_cua1.png" alt="democra.pro" className="h-7 w-auto" />
          <span className="text-sm font-semibold tracking-tight">democra.pro</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-light" style={{ color: "var(--body-fg, #888)" }}>
          <Link to="/" className="hover:text-white transition-colors duration-200">Inicio</Link>
          <Link to="/nosotros" className="text-white">Nosotros</Link>
        </nav>

        <button
          className="h-9 px-5 rounded-xl text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #0055FF, #3b82f6)",
            boxShadow: "0 0 24px rgba(0,85,255,0.3)",
          }}
          onClick={() => navigate("/login")}
        >
          Ingresar
        </button>
      </header>

      <main className="relative z-10 pt-16">
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="py-36 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ color: "#0055FF" }}
            >
              Quiénes somos
            </p>
            <h1
              className="font-display text-[clamp(3rem,8vw,6rem)] leading-[0.94] mb-7"
              style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.04em" }}
            >
              Construimos la
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #0055FF, #7000FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                democracia digital
              </span>
            </h1>
            <p
              className="text-lg font-light max-w-xl mx-auto"
              style={{ color: "var(--body-fg, #888)" }}
            >
              Un equipo comprometido con empoderar organizaciones a través de
              tecnología que amplifica el impacto social.
            </p>
          </motion.div>
        </section>

        {/* ── MISIÓN ─────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div
            className="absolute left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
          />
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ color: "#0055FF" }}
              >
                Nuestra misión
              </p>
              <h2
                className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.0] mb-5"
                style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.04em" }}
              >
                Gobernanza para todos
              </h2>
              <p
                className="text-base font-light leading-relaxed"
                style={{ color: "var(--body-fg, #888)" }}
              >
                Potenciar organizaciones sin fines de lucro a través de sistemas
                digitales que simplifican la gestión, amplían el alcance y
                maximizan el impacto social — de 5 a 50,000 personas sin cambiar
                de plataforma.
              </p>
            </motion.div>

            {/* Abstract visual */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1], delay: 0.1 }}
              className="relative h-64 rounded-[24px] overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 30% 40%, rgba(0,85,255,0.12), transparent 55%), radial-gradient(circle at 75% 70%, rgba(112,0,255,0.1), transparent 50%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-[0.15]" fill="none">
                  <circle cx="100" cy="100" r="60" stroke="url(#gNos)" strokeWidth="0.8" />
                  <circle cx="100" cy="100" r="40" stroke="url(#gNos)" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="20" fill="url(#gNos)" opacity="0.3" />
                  <line x1="40" y1="100" x2="160" y2="100" stroke="white" strokeWidth="0.4" />
                  <line x1="100" y1="40" x2="100" y2="160" stroke="white" strokeWidth="0.4" />
                  <defs>
                    <linearGradient id="gNos" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0055FF" />
                      <stop offset="100%" stopColor="#7000FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── VALORES ────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="text-center mb-16"
            >
              <h2
                className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.0] mb-4"
                style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.04em" }}
              >
                Nuestros valores
              </h2>
              <p className="text-base font-light" style={{ color: "var(--body-fg, #888)" }}>
                Los principios que guían cada decisión que tomamos.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
                  className="group rounded-[20px] p-7 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(18px)",
                    transition: "border-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "radial-gradient(circle at 50% 0%, rgba(0,85,255,0.06), transparent 60%)",
                    }}
                  />
                  <div className="mb-5 relative">{v.icon}</div>
                  <h3 className="text-base font-semibold mb-2" style={{ letterSpacing: "-0.01em" }}>
                    {v.title}
                  </h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: "var(--body-fg, #888)" }}>
                    {v.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EQUIPO ─────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="text-center mb-16"
            >
              <h2
                className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.0] mb-4"
                style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.04em" }}
              >
                El equipo
              </h2>
              <p className="text-base font-light" style={{ color: "var(--body-fg, #888)" }}>
                Personas apasionadas por el impacto social y la tecnología.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {team.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.55 }}
                  className="rounded-[20px] p-7 text-center"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 font-mono text-sm font-semibold"
                    style={{
                      background: "rgba(0,85,255,0.1)",
                      border: "1px solid rgba(0,85,255,0.25)",
                      color: "#0055FF",
                    }}
                  >
                    {member.initials}
                  </div>
                  <div className="text-base font-semibold mb-1">{member.name}</div>
                  <div className="text-sm font-light" style={{ color: "var(--body-fg, #888)" }}>
                    {member.role}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(0,85,255,0.09), transparent 65%)",
              filter: "blur(20px)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative z-10"
          >
            <h2
              className="font-display text-[clamp(2.4rem,7vw,5rem)] leading-[0.95] mb-6"
              style={{
                fontFamily: "'Inter Tight', 'Inter', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textShadow: "0 0 60px rgba(0,85,255,0.35), 0 0 120px rgba(112,0,255,0.15)",
              }}
            >
              ¿Listo para empezar?
            </h2>
            <p
              className="text-lg font-light mb-10 max-w-md mx-auto"
              style={{ color: "var(--body-fg, #888)" }}
            >
              Únete a las organizaciones que ya gestionan su impacto con
              democra.pro
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                className="h-12 px-9 rounded-xl text-sm font-semibold text-white relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #0055FF, #3b82f6)",
                  boxShadow: "0 0 36px rgba(0,85,255,0.3)",
                }}
                onClick={() => navigate("/login")}
              >
                <span className="relative z-10">Acceder al sistema</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
              <Link
                to="/"
                className="h-12 px-8 rounded-xl text-sm font-light border border-white/10 hover:border-white/22 hover:bg-white/[0.04] flex items-center"
                style={{ color: "var(--body-fg, #888)", transition: "all 0.38s ease" }}
              >
                Volver al inicio
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer
        className="px-6 py-10 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-light" style={{ color: "rgba(136,136,136,0.5)" }}>
          © 2026 democra.pro · Perú
        </p>
      </footer>
    </div>
  );
}
