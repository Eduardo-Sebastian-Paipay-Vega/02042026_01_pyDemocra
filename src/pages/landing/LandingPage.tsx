import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router";
import "../../styles/styles.css";
import "../../styles/animations.css";
import "../../styles/theme.css";

export function LandingPage() {
  const [emailLabel, setEmailLabel] = useState("tu-correo@ejemplo.com");
  const [waLabel, setWaLabel] = useState("wa.me/51953714752");
  const [copyBtnLabel, setCopyBtnLabel] = useState("Copiar correo");
  const audioRef = useRef<HTMLAudioElement>(null);

  const copyText = useCallback(
    async (
      text: string,
      setter: (v: string) => void,
      originalLabel: string
    ) => {
      try {
        await navigator.clipboard.writeText(text);
        setter("¡Copiado!");
        setTimeout(() => setter(originalLabel), 2000);
      } catch {
        /* clipboard blocked — silently ignore */
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function init() {
      const [{ createStore }, { initCommonPage }] = await Promise.all([
        import("../../state/store.js") as Promise<{ createStore: () => unknown }>,
        import("../../pages/common.js") as Promise<{
          initCommonPage: (opts: { store: unknown }) => unknown;
        }>,
      ]);
      if (!active) return;

      const store = (createStore as () => unknown)();
      (initCommonPage as (opts: { store: unknown }) => void)({ store });
    }

    void init();

    return () => { active = false; };
  }, []);

  return (
    <>
      <div id="top" />

      {/* Mobile scroll progress */}
      <div className="mobile-progress" aria-hidden="true">
        <span className="mobile-progress-fill" />
      </div>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="header">
        <div className="container header-inner">
          <Link className="brand" to="/" aria-label="Solaris Home">
            <img
              src="./Imagen/Iconos/logo_cua1.png"
              alt="Logo Solaris"
              className="brand-logo-img"
            />
            <span>SOLARIS</span>
          </Link>

          <nav className="nav" aria-label="Navegación principal">
            <a className="nav-link" href="#enfoque">Enfoque</a>
            <a className="nav-link" href="/studio">Archivo</a>
            <Link className="nav-link" to="/nosotros">Nosotros</Link>
            <div className="nav-login" aria-label="Login">
              <span className="nav-login__label">Login</span>
              <Link className="nav-login__link" to="/login">Ingresar</Link>
              <a
                className="nav-login__link"
                href="http://localhost:5174/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                Acceder
              </a>
            </div>
            {/* data-open-contact is wired by the vanilla JS modal controller */}
            <button className="nav-contact" type="button" data-open-contact="">
              Contacto
            </button>
          </nav>

          <div className="mobile-simple-menu" aria-label="Menu de acceso">
            <span className="mobile-simple-menu__label">Login</span>
            <Link className="mobile-simple-menu__link" to="/login">Ingresar</Link>
            <Link className="mobile-simple-menu__link" to="/nosotros">Nosotros</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="hero" id="hero" aria-label="Solaris Hero">
          <div className="container hero-inner">
            <div
              className="logo reveal reveal--fast logo-parallax logo-micro has-glow"
              aria-hidden="true"
            >
              <img src="./Imagen/Iconos/logo_cobre.png" alt="Solaris symbol" />
            </div>
            <div className="hero-copy stagger">
              <h1 className="studio-hero__title">
                Sueña lo que piensas<br />Futuro con intención.
              </h1>
              <p className="hero-subtitle">
                Haz más con nosotros, menos por tu cuenta.
              </p>
              <div className="hero-actions">
                <a
                  className="btn btn-primary"
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Acceder al Sistema
                </a>
                <a className="btn btn-ghost" href="#enfoque">Enfoque</a>
                <a className="btn btn-ghost" href="#enfoque">Conócenos</a>
              </div>
            </div>
          </div>
          <div className="hero-fade" aria-hidden="true" />
        </section>

        {/* ── ABOUT ──────────────────────────────────────────── */}
        <section className="section" id="about" aria-label="Acerca de Solaris">
          <div className="container section-inner">
            <h2 className="section-title reveal">Solaris</h2>
            <p className="section-text reveal reveal--soft">
              Sabemos tus necesidades. Te ayudamos a lograr más con menos
              esfuerzo. Somos un estudio conceptual especializado en sistemas,
              procesos y diseño.
            </p>
            <div className="meta-grid reveal reveal--soft">
              <div className="meta-card">
                <span className="meta-kicker">Enfoque</span>
                <p className="meta-value">
                  Resolvemos problemas, pero primero tenemos que entenderte y
                  encontrar el problema real.
                </p>
                <div className="meta-icon">
                  <img src="./Imagen/use/logo_wa.png" alt="Solaris symbol" />
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-kicker">Lenguaje</span>
                <p className="meta-value">Sencillo, preciso y humano.</p>
                <div className="meta-icon">
                  <img
                    src="./Imagen/use/forma-abstracta.png"
                    alt="Solaris symbol"
                  />
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-kicker">Resultado</span>
                <p className="meta-value">
                  Sistemas claros, procesos eficientes y diseño intuitivo.
                </p>
                <div className="meta-icon">
                  <img
                    src="./Imagen/use/forma (1).png"
                    alt="Solaris symbol"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ENFOQUE ────────────────────────────────────────── */}
        <section
          className="section"
          id="enfoque"
          aria-label="Enfoque de trabajo"
        >
          <div className="container section-inner">
            <h2 className="section-title reveal">Enfoque</h2>
            <p className="section-text reveal reveal--soft">
              Tres capas. Una sola dirección.
            </p>
            <div className="cards reveal reveal--soft">
              <article className="card">
                <h3 className="card-title">Sistemas</h3>
                <p className="card-text">
                  Núcleo claro. Dependencias limpias. Decisiones justificadas.
                </p>
              </article>
              <article className="card">
                <h3 className="card-title">Procesos</h3>
                <p className="card-text">
                  Flujo real. Menos fricción. Control donde importa.
                </p>
              </article>
              <article className="card">
                <h3 className="card-title">Diseño</h3>
                <p className="card-text">
                  Jerarquía, tipografía y espacio. Lo esencial se ve.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── ARCHIVO ────────────────────────────────────────── */}
        <section id="archivo" className="section container reveal">
          <div className="section-head">
            <h2 className="section-title">Archivo</h2>
            <p className="section-subtitle">
              Piezas curadas: ideas, flujos y sistemas. Formato estudio.
            </p>
          </div>
          <div className="studio-preview-grid">
            <div className="preview-card">
              <div className="preview-kicker">Journal</div>
              <div className="preview-title">Silencio en sistemas</div>
              <div className="preview-desc">
                Reducir complejidad sin perder potencia.
              </div>
            </div>
            <div className="preview-card">
              <div className="preview-kicker">Workflows</div>
              <div className="preview-title">Flow: diagnóstico Solaris</div>
              <div className="preview-desc">
                Entrada → análisis → propuesta → decisión.
              </div>
            </div>
            <div className="preview-card">
              <div className="preview-kicker">Note</div>
              <div className="preview-title">Futuro, pero con bordes</div>
              <div className="preview-desc">Visión con límites: producto.</div>
            </div>
          </div>
          <div className="studio-preview-actions">
            <a className="btn btn--solid" href="/studio">Abrir archivo</a>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer
        className="section"
        style={{ padding: "4rem 0", borderTop: "1px solid var(--border)" }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <p className="brand" style={{ marginBottom: "1rem" }}>
            © 2026 Solaris Studio
          </p>
          <p style={{ color: "var(--muted-2)", fontSize: "0.8rem" }}>Perú</p>
        </div>
      </footer>

      {/* ── SECTION INDICATOR ──────────────────────────────── */}
      <nav className="section-indicator" aria-label="Section indicator">
        <span className="dot" data-target="#top" data-label="Inicio" />
        <span className="dot" data-target="#about" data-label="Solaris" />
        <span className="dot" data-target="#enfoque" data-label="Enfoque" />
      </nav>

      {/* ── PROGRESS RAIL ──────────────────────────────────── */}
      <div className="progress-rail" aria-hidden="true">
        <span className="progress-fill" />
      </div>

      {/* ── CONTACT MODAL ──────────────────────────────────── */}
      <div className="modal" id="contactModal" aria-hidden="true">
        <div className="modal__backdrop" data-close-contact="" />
        <div
          className="modal__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Contacto"
        >
          <div className="modal__head">
            <div className="modal__kicker">Conectemos</div>
            <button
              className="modal__close"
              type="button"
              data-close-contact=""
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <h2 className="modal__title">Impulsa tu proyecto</h2>
          <p className="modal__desc">
            Acceso directo a consultoría especializada. Sin intermediarios.
          </p>
          <div className="contact-premium">
            <div className="contact-premium__grid">
              <div className="contact-premium__block">
                <div className="contact-premium__label">E-mail Corporativo</div>
                <button
                  className="contact-premium__value"
                  type="button"
                  onClick={() =>
                    copyText(
                      "tu-correo@ejemplo.com",
                      setEmailLabel,
                      "tu-correo@ejemplo.com"
                    )
                  }
                >
                  {emailLabel}
                </button>
                <div className="contact-premium__hint">Clic para copiar correo</div>
              </div>
              <div className="contact-premium__block">
                <div className="contact-premium__label">
                  Línea de Consultoría
                </div>
                <button
                  className="contact-premium__value"
                  type="button"
                  onClick={() =>
                    copyText(
                      "https://wa.me/51953714752",
                      setWaLabel,
                      "wa.me/51953714752"
                    )
                  }
                >
                  {waLabel}
                </button>
                <a
                  href="https://wa.me/51953714752?text=Hola,%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa%20sobre%20soluciones%20tecnol%C3%B3gicas."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-premium__hint"
                  style={{ color: "#25D366", textDecoration: "underline" }}
                >
                  Click para ir directamente
                </a>
              </div>
            </div>
            <div className="contact-premium__qrRow">
              <div className="contact-premium__qr">
                <img
                  className="qr-img"
                  src="./Imagen/Line/qr_placeholder.png"
                  alt="QR de contacto"
                />
              </div>
              <div className="contact-premium__cta">
                <div className="contact-premium__title">
                  Soluciones a medida
                </div>
                <div className="contact-premium__text">
                  Escanea el código para una respuesta inmediata vía WhatsApp o
                  utiliza nuestros accesos rápidos.
                </div>
                <div className="contact-premium__actions">
                  <button
                    className="btn btn--ghost btn--small"
                    type="button"
                    onClick={() =>
                      copyText(
                        "tu-correo@ejemplo.com",
                        setCopyBtnLabel,
                        "Copiar correo"
                      )
                    }
                  >
                    {copyBtnLabel}
                  </button>
                  <a
                    className="btn btn--solid btn--small"
                    href="https://wa.me/51953714752?text=Hola,%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa%20sobre%20soluciones%20tecnol%C3%B3gicas."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Iniciar Chat
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AUDIO ──────────────────────────────────────────── */}
      <audio
        ref={audioRef}
        id="ui-sound"
        src="./assets/sound/ui-soft.mp3"
        preload="auto"
      />
    </>
  );
}
