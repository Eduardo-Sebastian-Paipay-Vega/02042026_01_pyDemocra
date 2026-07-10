import { useState } from "react";
import { createSupabaseClient } from "../services/supabase";
import { GradientBackground } from "../pages/landing/components/GradientBackground";

export function LoginGateway() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return;

    setLoading(true);
    setError(null);

    const supabase = createSupabaseClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message ?? "No se pudo iniciar sesión. Verifica tus credenciales.");
      setLoading(false);
      return;
    }

    // public.tenants tiene RLS sin políticas (deny-all), así que industry_type_id
    // no es legible directamente. fn_get_user_redirect_target() (migración
    // 20260706120000) resuelve esto del lado del servidor con SECURITY DEFINER
    // y devuelve solo el destino ('ong' | 'gym' | 'root'), sin exponer la tabla.
    const { data: redirectTarget, error: redirectError } = await supabase.rpc(
      "fn_get_user_redirect_target"
    );

    if (redirectError) {
      setError("Sesión iniciada, pero no se pudo determinar tu destino. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // Uso estricto del resultado: solo 'ong' tiene un módulo real montado en
    // este MPA. Cualquier otro valor ('root', 'gym', o uno futuro) se trata
    // como "sin acceso todavía" — nunca se asume una ruta que no existe.
    if (redirectTarget === "ong") {
      // Same-origin MPA: la sesión ya quedó en localStorage bajo AUTH_STORAGE_KEY
      // (compartido con el cliente Supabase de ONG). Una navegación normal basta
      // para que /ong la recoja al montar — sin tokens en la URL.
      window.location.assign("/ong/");
      return;
    }

    setError(
      redirectTarget === "root"
        ? "Tu cuenta aún no está asociada a ninguna organización."
        : `Tu cuenta pertenece a un módulo ("${redirectTarget}") que todavía no está disponible en esta plataforma.`
    );
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-white antialiased">
      <GradientBackground />
      <div
        className="relative z-10 w-full max-w-[420px] rounded-3xl p-8"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 40px rgba(0,0,0,0.35)",
        }}
      >
        {/* Branding */}
        <div className="mb-8 text-center">
          <img
            src="/Imagen/Iconos/logo_cua1.png"
            alt="Democra"
            className="mx-auto mb-4 h-12 w-12 rounded-2xl object-contain"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
          />
          <h1 className="text-[22px] font-semibold" style={{ color: "#f5f5f5" }}>
            Democra
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "#a0a0a0" }}>
            Ingresa tus credenciales para acceder al sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium" style={{ color: "#a0a0a0" }}>
              Correo electrónico
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="usuario@organizacion.org"
              autoComplete="email"
              className="h-11 w-full rounded-2xl px-3 text-[13px] outline-none transition-colors placeholder:text-[#404040] disabled:opacity-60"
              style={{
                background: "#050505",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f5f5f5",
              }}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium" style={{ color: "#a0a0a0" }}>
              Contraseña
            </span>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 w-full rounded-2xl px-3 pr-10 text-[13px] outline-none transition-colors placeholder:text-[#404040] disabled:opacity-60"
                style={{
                  background: "#050505",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f5f5f5",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#505050" }}
              >
                {showPwd ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error ? (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "#3b82f6", color: "#fff" }}
          >
            {loading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              "Ingresar"
            )}
          </button>

          {/* REQ-002 (dds/MEJORAS/09072026/REQ002.md): botón auxiliar de
              asistencia solicitado por el usuario. type="button" explícito
              para no interferir con el submit del formulario; reutiliza el
              canal de WhatsApp ya usado en el sitio (ver
              src/pages/landing/ContactModal.tsx) vía window.open en vez de
              anidarlo en un <a>, que sería HTML inválido dentro de un botón. */}
          <button
            type="button"
            onClick={() =>
              window.open(
                "https://wa.me/51953714752?text=Hola,%20necesito%20ayuda%20para%20ingresar%20a%20mi%20cuenta%20de%20Democra.",
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#c0c0c0",
            }}
          >
            ¿Necesitas ayuda para ingresar?
          </button>
        </form>

        <p className="mt-6 text-center text-[11px]" style={{ color: "#707070" }}>
          ¿Nuevo en la plataforma?{" "}
          <a href="/" style={{ color: "#3b82f6" }}>
            Ir a la página principal
          </a>
        </p>
      </div>
    </div>
  );
}
