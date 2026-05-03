import { useEffect } from "react";
import { Link } from "react-router";
import "../../styles/styles.css";
import "../../styles/animations.css";
import "../../styles/theme.css";

export function NosotrosPage() {
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
            <Link className="nav-link" to="/">Inicio</Link>
            <Link className="nav-link is-active" to="/nosotros">Nosotros</Link>
            <div className="nav-login" aria-label="Login">
              <span className="nav-login__label">Login</span>
              <Link className="nav-login__link" to="/login">Ingresar</Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="hero" id="hero" aria-label="Quiénes somos">
          <div className="container hero-inner">
            <div className="hero-copy stagger">
              <h1 className="studio-hero__title">
                Quiénes somos
              </h1>
              <p className="hero-subtitle">
                Un equipo comprometido con el impacto social y la tecnología.
              </p>
            </div>
          </div>
          <div className="hero-fade" aria-hidden="true" />
        </section>

        {/* ── MISIÓN ─────────────────────────────────────────── */}
        <section className="section" id="mision" aria-label="Misión">
          <div className="container section-inner">
            <h2 className="section-title reveal">Misión</h2>
            <p className="section-text reveal reveal--soft">
              Potenciar organizaciones sin fines de lucro a través de sistemas
              digitales que simplifican la gestión, amplían el alcance y
              maximizan el impacto social.
            </p>
          </div>
        </section>

        {/* ── VALORES ────────────────────────────────────────── */}
        <section className="section" id="valores" aria-label="Valores">
          <div className="container section-inner">
            <h2 className="section-title reveal">Valores</h2>
            <div className="cards reveal reveal--soft">
              <article className="card">
                <h3 className="card-title">Transparencia</h3>
                <p className="card-text">
                  Procesos claros, información accesible y rendición de cuentas
                  en cada paso.
                </p>
              </article>
              <article className="card">
                <h3 className="card-title">Impacto</h3>
                <p className="card-text">
                  Cada funcionalidad está diseñada para amplificar el trabajo
                  de quienes cambian el mundo.
                </p>
              </article>
              <article className="card">
                <h3 className="card-title">Simplicidad</h3>
                <p className="card-text">
                  Menos fricción, más acción. Tecnología al servicio de las
                  personas, no al revés.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="section" id="cta">
          <div className="container section-inner" style={{ textAlign: "center" }}>
            <h2 className="section-title reveal">¿Listo para empezar?</h2>
            <p className="section-text reveal reveal--soft">
              Únete a las organizaciones que ya gestionan su impacto con
              Democra.
            </p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <Link className="btn btn-primary" to="/login">
                Acceder al sistema
              </Link>
              <Link className="btn btn-ghost" to="/">
                Volver al inicio
              </Link>
            </div>
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

      {/* Section indicator */}
      <nav className="section-indicator" aria-label="Section indicator">
        <span className="dot" data-target="#hero" data-label="Inicio" />
        <span className="dot" data-target="#mision" data-label="Misión" />
        <span className="dot" data-target="#valores" data-label="Valores" />
      </nav>

      <div className="progress-rail" aria-hidden="true">
        <span className="progress-fill" />
      </div>
    </>
  );
}
