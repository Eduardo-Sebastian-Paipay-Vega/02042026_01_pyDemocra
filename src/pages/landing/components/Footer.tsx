import { motion } from "motion/react";

interface FooterProps {
  onOpenContact: () => void;
}

export function Footer({ onOpenContact }: FooterProps) {
  const links: Record<string, string[]> = {
    Producto: ["CaracterÃ­sticas", "Precios", "Integraciones", "API Docs", "Changelog"],
    Empresa: ["Sobre nosotros", "Blog", "Carreras", "Prensa", "Contacto"],
    Participa: ["Canjear código", "Registro voluntarios", "Portal ONG"],
    Legal: ["Privacidad", "Términos", "Seguridad", "Cookies", "GDPR"],
  };

  const sectionHrefs: Record<string, string> = {
    "CaracterÃ­sticas": "#producto",
    "Precios": "#precios",
    "Cómo funciona": "#como-funciona",
    "Canjear código": "/ong/join",
    "Registro voluntarios": "/ong/signup",
    "Portal ONG": "/ong",
  };

  return (
    <footer className="border-t border-white/5 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/brand/d-core-neon.png"
                alt="democra.pro"
                className="w-7 h-7 rounded-lg"
                style={{ boxShadow: "0 0 12px rgba(0,85,255,0.3)" }}
              />
              <div className="text-xl font-semibold">
                <span className="text-white">democra</span>
                <span className="text-white/40">.pro</span>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed font-light">
              Gobernanza democrática con IA
            </p>
          </motion.div>

          {Object.entries(links).map(([category, items], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.05 }}
            >
              <h4 className="font-medium mb-4 text-sm">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    {item === "Contacto" ? (
                      <button
                        onClick={onOpenContact}
                        className="text-white/40 hover:text-white transition-colors duration-200 text-sm font-light bg-transparent border-0 p-0 cursor-pointer"
                      >
                        {item}
                      </button>
                    ) : (
                      <a
                        href={sectionHrefs[item] ?? "#"}
                        className="text-white/40 hover:text-white transition-colors duration-200 text-sm font-light"
                      >
                        {item}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs font-light">Â© 2026 Democra.pro</p>
          <div className="flex items-center gap-8">
            <div className="flex gap-8">
              {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-white/30 hover:text-white transition-colors duration-200 text-xs font-light"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

