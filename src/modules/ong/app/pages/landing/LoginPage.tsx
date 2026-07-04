import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../../supabaseClient";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message
      );
      setLoading(false);
      return;
    }

    navigate("/app");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#070707", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-[15%] -top-[20%] h-[700px] w-[700px] rounded-full bg-[#3D6BFF] opacity-[0.05] blur-[180px]" />
        <div className="absolute right-[-12%] top-[25%] h-[600px] w-[600px] rounded-full bg-[#2DBFB0] opacity-[0.06] blur-[180px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <span
            className="text-[22px] font-bold"
            style={{
              background: "linear-gradient(135deg, #3D6BFF 0%, #2DBFB0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Voluntario
          </span>
        </div>

        <div
          className="rounded-3xl p-8"
          style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h1 className="text-[22px] font-semibold text-white mb-1">Iniciar sesión</h1>
          <p className="text-[13px] mb-8" style={{ color: "#A7A7A7" }}>
            Accede a tu organización en Democra
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: "#A7A7A7" }}>
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-[#3D6BFF]"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
                placeholder="tu@organizacion.org"
              />
            </div>

            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: "#A7A7A7" }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-[#3D6BFF]"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                className="text-[12px] rounded-xl px-3 py-2"
                style={{
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #3D6BFF 0%, #2DBFB0 100%)" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px]" style={{ color: "#707070" }}>
          <Link
            to="/app/landing"
            className="transition-colors hover:text-white"
            style={{ color: "#A7A7A7" }}
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
