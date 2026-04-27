import { useState } from "react";
import { Link } from "react-router";
import { GradientText } from "./components/GradientText";
import { GlassCard } from "./components/GlassCard";
import { PillButton } from "./components/PillButton";
import { SegmentedBar } from "./components/SegmentedBar";
import { RadialGauge } from "./components/RadialGauge";
import { TestimonialCard } from "./components/TestimonialCard";

/* ─── Content tokens (swap these for your copy) ─── */
const BRAND_NAME = "Voluntario";
const PRODUCT_TAGLINE_PRE = "Automatiza tu operación ";
const PRODUCT_TAGLINE_GRADIENT = "sin perder control";
const PRODUCT_SUBTITLE =
  "La plataforma que conecta personas, proyectos y resultados en un solo lugar. Gestiona voluntarios, aprueba horas y mide impacto — todo desde un dashboard unificado.";
const CTA_PRIMARY = "Empezar ahora";
const CTA_SECONDARY = "Ver demo";

const METRICS = [
  { value: 63, desc: "Reducción en tiempo administrativo" },
  { value: 86, desc: "Satisfacción de voluntarios" },
  { value: 42, desc: "Aumento en retención anual" },
];

const GOALS = [
  "Centralizar gestión de voluntarios y beneficiarios",
  "Automatizar aprobaciones, horas y evidencia",
  "Visibilidad en tiempo real de proyectos e impacto",
];
const GOALS_NOTE =
  "Diseñado para organizaciones que quieren escalar su impacto sin aumentar complejidad operativa.";

const MOTIVATION_PERCENT = 78;
const MOTIVATION_TEXT = "Impacto social";

const TESTIMONIALS = [
  {
    quote:
      "Pasamos de hojas de cálculo a un sistema real en una semana. Ahora aprobamos horas en minutos, no en días.",
    name: "Ana Martínez",
    role: "Directora de Operaciones",
  },
  {
    quote:
      "La visibilidad que tenemos sobre los proyectos ha transformado cómo tomamos decisiones. Datos reales, en tiempo real.",
    name: "Carlos Ríos",
    role: "Coordinador de Proyectos",
  },
  {
    quote:
      "Nuestros voluntarios finalmente tienen una experiencia digital a la altura de su compromiso. La adopción fue inmediata.",
    name: "Lucía Herrera",
    role: "Líder de Comunidad",
  },
];

const NAV_ITEMS = ["Home", "About", "Features", "Pricing", "Contact"];

/* ─── Page ─── */
export function LandingPage() {
  const [activeNav, setActiveNav] = useState("Home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen overflow-x-hidden text-[#F5F5F5]"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundColor: "#070707",
      }}
    >
      {/* ── Ambient glow blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[15%] -top-[20%] h-[700px] w-[700px] rounded-full bg-[#DB7052] opacity-[0.05] blur-[180px]" />
        <div className="absolute right-[-12%] top-[25%] h-[600px] w-[600px] rounded-full bg-[#7545E2] opacity-[0.06] blur-[180px]" />
        <div className="absolute bottom-[-10%] left-[25%] h-[500px] w-[500px] rounded-full bg-[#551BB3] opacity-[0.04] blur-[180px]" />
      </div>

      {/* ══════════════════════════════════════════
          TOP NAV
      ══════════════════════════════════════════ */}
      <header className="relative z-20 border-b border-white/[0.06]">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <GradientText className="text-[20px] font-bold tracking-tight">
            {BRAND_NAME}
          </GradientText>

          {/* Desktop pill nav */}
          <nav className="hidden md:flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-[#121212]/70 px-1.5 py-1 backdrop-blur-xl">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={[
                  "rounded-full px-4 py-[6px] text-[13px] font-medium transition-all cursor-pointer",
                  activeNav === item
                    ? "bg-[#181818] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-[#A7A7A7] hover:text-white",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Right: auth + mobile hamburger */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:block text-[13px] text-[#A7A7A7] hover:text-white transition-colors cursor-pointer">
              Log in
            </button>
            <PillButton variant="primary" size="sm">
              Sign in
            </PillButton>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-[#121212]/60 md:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-4 w-4 text-[#A7A7A7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <nav className="border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 md:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setActiveNav(item);
                  setMobileMenuOpen(false);
                }}
                className={[
                  "block w-full rounded-2xl px-4 py-3 text-left text-[14px] font-medium transition-colors cursor-pointer",
                  activeNav === item
                    ? "bg-[#181818] text-white"
                    : "text-[#A7A7A7] hover:text-white",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <button className="block w-full rounded-2xl px-4 py-3 text-left text-[14px] text-[#A7A7A7] hover:text-white cursor-pointer">
                Log in
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Small badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#121212]/60 px-4 py-1.5 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7545E2] animate-pulse" />
            <span className="text-[12px] font-medium text-[#A7A7A7]">
              Now in open beta
            </span>
          </div>

          <h1
            className="mx-auto max-w-[820px] leading-[1.08] tracking-[-0.02em]"
            style={{
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.25rem, 5vw + 0.5rem, 3.75rem)",
            }}
          >
            {PRODUCT_TAGLINE_PRE}
            <GradientText>{PRODUCT_TAGLINE_GRADIENT}</GradientText>
          </h1>

          <p className="mx-auto mt-6 max-w-[600px] text-[16px] leading-[1.7] text-[#A7A7A7] md:text-[18px]">
            {PRODUCT_SUBTITLE}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/admin">
              <PillButton variant="primary" size="lg">
                {CTA_PRIMARY}
              </PillButton>
            </Link>
            <PillButton variant="secondary" size="lg">
              {CTA_SECONDARY}
            </PillButton>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          USER RESEARCH — 3 metric cards
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="mb-14 text-center">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7545E2]">
              User research
            </p>
            <h2
              className="text-[24px] md:text-[30px] tracking-[-0.01em]"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 700 }}
            >
              Resultados que hablan por sí solos
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {METRICS.map((m, i) => (
              <GlassCard key={i} hover className="px-8 py-10 text-center">
                <SegmentedBar percentage={m.value} />
                <p
                  className="mt-7 tracking-[-0.02em]"
                  style={{
                    fontFamily: "'Sora', 'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  }}
                >
                  <GradientText>{m.value}%</GradientText>
                </p>
                <p className="mt-3 text-[14px] leading-[1.6] text-[#A7A7A7]">
                  {m.desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GOALS / MOTIVATIONS — two-column
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* ── User Goals ── */}
            <GlassCard className="p-8 md:p-10">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7545E2]">
                Insights
              </p>
              <h3
                className="mb-8 text-[24px] md:text-[28px] tracking-[-0.01em]"
                style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 700 }}
              >
                User Goals
              </h3>

              <ul className="space-y-5" role="list">
                {GOALS.map((goal, i) => (
                  <li key={i} className="flex items-start gap-4">
                    {/* Gradient chip icon */}
                    <div
                      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #DB7052 0%, #7545E2 55%, #551BB3 100%)",
                      }}
                    >
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[15px] leading-[1.6] text-[#F5F5F5]">
                      {goal}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-[13px] leading-[1.7] text-[#707070]">
                {GOALS_NOTE}
              </p>
            </GlassCard>

            {/* ── Motivations ── */}
            <GlassCard className="flex flex-col items-center justify-center p-8 md:p-10">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7545E2]">
                Insights
              </p>
              <h3
                className="mb-10 text-[24px] md:text-[28px] tracking-[-0.01em]"
                style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 700 }}
              >
                Motivations
              </h3>

              <RadialGauge
                percentage={MOTIVATION_PERCENT}
                label={MOTIVATION_TEXT}
                size={240}
              />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7545E2]">
              Testimonials
            </p>
            <h2
              className="text-[24px] md:text-[30px] tracking-[-0.01em]"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 700 }}
            >
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BILLBOARD
      ══════════════════════════════════════════ */}
      <section className="relative z-10 py-14 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GlassCard className="relative overflow-hidden px-8 py-14 text-center md:px-16 md:py-20">
            {/* Inner glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[500px] opacity-[0.08] blur-[100px]"
              style={{
                background:
                  "linear-gradient(180deg, #7545E2 0%, #DB7052 100%)",
              }}
              aria-hidden="true"
            />

            <h2
              className="relative mx-auto max-w-[640px] leading-[1.15] tracking-[-0.02em]"
              style={{
                fontFamily: "'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)",
              }}
            >
              Lleva tu organización al siguiente nivel con{" "}
              <GradientText>integración total</GradientText>
            </h2>

            <p className="relative mx-auto mt-5 max-w-[520px] text-[15px] leading-[1.7] text-[#A7A7A7]">
              Conecta todos los procesos de tu operación en una plataforma
              unificada. Sin fricciones, sin complejidad.
            </p>

            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/admin">
                <PillButton variant="primary" size="lg">
                  Comenzar gratis
                </PillButton>
              </Link>
              <PillButton variant="secondary" size="lg">
                Agendar demo
              </PillButton>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <GradientText className="text-[17px] font-bold">
            {BRAND_NAME}
          </GradientText>
          <p className="text-[13px] text-[#707070]">
            © 2026 {BRAND_NAME}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((item) => (
              <button
                key={item}
                className="text-[13px] text-[#707070] transition-colors hover:text-[#A7A7A7] cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}