import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import { resolveTenantInitialPath } from "../tenant/navigation";

export function Login() {
  const { status, context, loading: bootstrapLoading } = useTenantBootstrap();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión activa, redirige directo al home
  useEffect(() => {
    if (!bootstrapLoading && status === "ready" && context) {
      navigate(resolveTenantInitialPath(context), { replace: true });
    }
  }, [bootstrapLoading, status, context, navigate]);

  if (bootstrapLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin" style={{ color: "var(--t-text-dim)" }} />
      </div>
    );
  }

  if (status === "ready" && context) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return;

    setSubmitting(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }
    // Éxito: onAuthStateChange → SIGNED_IN → reload() → status "ready" → useEffect redirige al home
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: "var(--t-bg)" }}
    >
      <div
        className="w-full max-w-[420px] rounded-3xl p-8"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--t-text)" }}>
            Iniciar sesión
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
            Ingresa tus credenciales para acceder a la plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium" style={{ color: "var(--t-text-dim)" }}>
              Correo electrónico
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="usuario@organizacion.org"
              className="h-11 w-full rounded-2xl px-3 text-[13px] outline-none transition-colors placeholder:text-[#5F5F5F]"
              style={{
                background: "var(--t-bg)",
                border: "1px solid var(--t-border)",
                color: "var(--t-text)",
              }}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium" style={{ color: "var(--t-text-dim)" }}>
              Contraseña
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="••••••••"
                className="h-11 w-full rounded-2xl px-3 pr-10 text-[13px] outline-none transition-colors placeholder:text-[#5F5F5F]"
                style={{
                  background: "var(--t-bg)",
                  border: "1px solid var(--t-border)",
                  color: "var(--t-text)",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--t-text-dim)" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error ? (
            <div
              className="rounded-2xl px-4 py-3 text-[12px]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.30)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "#3b82f6", color: "#fff" }}
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
