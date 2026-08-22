import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onOpenContact: () => void;
}

export function Navbar({ onOpenContact }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Producto",      href: "#producto" },
    { name: "CÃ³mo funciona", href: "#como-funciona" },
    { name: "Precios",       href: "#precios" },
    { name: "Empresa",       href: "#empresa" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="flex items-center gap-2.5 select-none"
        >
          <img
            src="/brand/d-core-neon.png"
            alt="democra.pro"
            className="h-8 w-8 rounded-lg"
            style={{ boxShadow: "0 0 14px rgba(0,85,255,0.35)" }}
          />
          <span className="text-[17px] font-semibold tracking-tight">
            <span className="text-white">democra</span>
            <span className="text-white/30">.pro</span>
          </span>
        </motion.div>

        {/* Desktop links â€” centered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-light transition-colors"
              style={{ color: "var(--body-fg)", transitionDuration: "var(--t-smooth)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ffffff")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--body-fg)")}
            >
              {link.name}
            </a>
          ))}
        </motion.div>

        {/* Right CTA group */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="hidden md:flex items-center gap-5"
        >
          {/* Participa Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="text-sm font-light transition-colors flex items-center gap-1"
              style={{ color: "var(--body-fg)", transitionDuration: "var(--t-smooth)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ffffff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--body-fg)")}
            >
              Participa
              <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full right-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-2 w-48 shadow-xl" style={{ backdropFilter: "blur(12px)" }}>
                <a
                  href="/ong/join"
                  className="block px-3 py-2 text-sm font-light text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Canjear CÃ³digo ACE
                </a>
                <a
                  href="/ong/signup"
                  className="block px-3 py-2 text-sm font-light text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Ser Voluntario
                </a>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="text-sm font-light transition-colors"
            style={{ color: "var(--body-fg)", transitionDuration: "var(--t-smooth)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ffffff")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--body-fg)")}
          >
            Iniciar sesiÃ³n
          </Link>

          {/* Contact â€” sliding underline indicator */}
          <button
            type="button"
            onClick={onOpenContact}
            className="group relative text-sm font-light transition-colors"
            style={{ color: "var(--body-fg)", transitionDuration: "var(--t-smooth)" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ffffff")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--body-fg)")}
          >
            Contacto
            <span
              className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 group-hover:scale-x-100"
              style={{
                background: "var(--blue)",
                transition: "transform 0.28s ease",
              }}
            />
          </button>

          {/* Outline CTA â€” visually lighter than Hero solid */}
          <a href="/ong/create">
            <button
              className="h-9 px-5 rounded-xl text-sm font-medium border border-white/15 bg-transparent text-white hover:border-white/35 hover:bg-white/[0.05]"
              style={{ transition: `all var(--t-smooth)` }}
            >
              Comenzar ahora
            </button>
          </a>
        </motion.div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white/60 hover:text-white p-2"
          style={{ transitionDuration: "var(--t-fast)" }}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.25, 0.4, 0.25, 1] }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] px-6"
            style={{ background: "rgba(0,0,0,0.92)" }}
          >
            <div className="py-5 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block py-2.5 text-sm font-light transition-colors"
                  style={{ color: "var(--body-fg)" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
            <div className="pb-5 space-y-2 border-t border-white/[0.06] pt-4">
              <div className="px-3 pb-1 text-xs font-medium text-white/40 uppercase tracking-wider">Participa</div>
              <a href="/ong/join" className="block w-full py-2 px-3 text-sm font-light text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Canjear CÃ³digo ACE
              </a>
              <a href="/ong/signup" className="block w-full py-2 px-3 text-sm font-light text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-4">
                Ser Voluntario
              </a>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5 rounded-xl">
                  Iniciar sesiÃ³n
                </Button>
              </Link>
              <button
                type="button"
                className="w-full py-2 text-sm font-light text-white/55 hover:text-white transition-colors"
                onClick={() => { setIsMenuOpen(false); onOpenContact(); }}
              >
                Contacto
              </button>
              <a href="/ong/create" onClick={() => setIsMenuOpen(false)}>
                <button
                  className="w-full h-11 rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #0055FF, #3b82f6)",
                    boxShadow: "0 0 24px rgba(0,85,255,0.3)",
                  }}
                >
                  Comenzar ahora
                </button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

