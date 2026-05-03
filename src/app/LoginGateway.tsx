import { useState } from "react";
import { createSupabaseClient } from "../services/supabase";

// Target ONG app — configurable via VITE_ONG_APP_URL in root .env
const ONG_APP_URL = (import.meta.env.VITE_ONG_APP_URL as string) || "http://localhost:5174";

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

    // Cross-port token relay: pass Supabase session to ONG app (port 5174) via URL hash.
    // The ONG Supabase client has detectSessionInUrl: true (default), so it picks up the
    // tokens automatically and fires SIGNED_IN without any extra code on the ONG side.
    const { access_token, refresh_token, expires_in } = data.session;
    const callbackUrl = new URL("/auth/callback", ONG_APP_URL);
    callbackUrl.hash = [
      `access_token=${encodeURIComponent(access_token)}`,
      `refresh_token=${encodeURIComponent(refresh_token)}`,
      `expires_in=${expires_in}`,
      "token_type=bearer",
      "type=magiclink",
    ].join("&");

    window.location.replace(callbackUrl.toString());
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#050505" }}>
      <div
        className="w-full max-w-[420px] rounded-3xl p-8"
        style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Branding */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-[22px] font-semibold" style={{ color: "#f5f5f5" }}>
            Democra
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "#707070" }}>
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
        </form>

        <p className="mt-6 text-center text-[11px]" style={{ color: "#404040" }}>
          ¿Nuevo en la plataforma?{" "}
          <a href="/" style={{ color: "#3b82f6" }}>
            Ir a la página principal
          </a>
        </p>
      </div>
    </div>
  );
}
