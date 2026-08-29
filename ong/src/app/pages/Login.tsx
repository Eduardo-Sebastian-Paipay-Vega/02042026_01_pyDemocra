import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import { resolveTenantInitialPath } from "../tenant/navigation";
import { getDeviceFingerprint } from "../lib/deviceFingerprint";

interface PendingStepUp {
  challengeId: string;
  deliveryHint: string | null;
}

export function Login() {
  const { status, context, loading: bootstrapLoading } = useTenantBootstrap();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStepUp, setPendingStepUp] = useState<PendingStepUp | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);

  // Si ya hay sesión activa, redirige directo al home — pero no mientras haya
  // un desafío OTP pendiente de esta misma sesión de login (dispositivo nuevo).
  useEffect(() => {
    if (!bootstrapLoading && status === "ready" && context && !pendingStepUp) {
      const from = location.state?.from || resolveTenantInitialPath(context);
      navigate(from, { replace: true });
    }
  }, [bootstrapLoading, status, context, navigate, pendingStepUp, location]);

  async function evaluateLoginRisk() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch("/api/auth/risk-evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        tipo_evento: "LOGIN_WEB",
        device_fingerprint: getDeviceFingerprint(),
        user_agent: navigator.userAgent,
      }),
    });

    const result = await response.json();

    if (result.decision === "REQUIRE_OTP") {
      setPendingStepUp({
        challengeId: result.challenge_id,
        deliveryHint: result.challenge_delivery_hint || null,
      });
      return;
    }

    if (result.decision !== "ALLOW") {
      // TEMP_BLOCK / DENY: signInWithPassword ya dejó una sesión real de
      // Supabase antes de esta validación — hay que revocarla explícitamente,
      // si no el usuario bloqueado igual queda dentro al recargar.
      await supabase.auth.signOut();
      setError(result.user_message || "No fue posible validar el acceso.");
      return;
    }
    // ALLOW: no hacer nada más, el efecto de arriba redirige cuando bootstrap esté "ready".
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingStepUp || !otpCode.trim()) return;

    setOtpSubmitting(true);
    setOtpError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no disponible.");

      const response = await fetch("/api/auth/step-up/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          challenge_id: pendingStepUp.challengeId,
          code: otpCode.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.verified) {
        setOtpError(result.user_message || result.message || "Código incorrecto o expirado.");
        return;
      }

      setPendingStepUp(null);
      setOtpCode("");
      // El efecto de arriba redirige en el siguiente render (status ya "ready").
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "No se pudo verificar el código.");
    } finally {
      setOtpSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (!pendingStepUp) return;
    setResendingOtp(true);
    setOtpError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/auth/step-up/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ challenge_id: pendingStepUp.challengeId }),
      });

      const result = await response.json();
      if (!response.ok) {
        setOtpError(result.message || "No se pudo reenviar el código.");
      }
    } finally {
      setResendingOtp(false);
    }
  }

  if (bootstrapLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin" style={{ color: "var(--t-text-dim)" }} />
      </div>
    );
  }

  if (status === "ready" && context && !pendingStepUp) {
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

    try {
      await evaluateLoginRisk();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo validar el acceso.");
    } finally {
      setSubmitting(false);
    }
    // Si quedó ALLOW: onAuthStateChange → SIGNED_IN → reload() → status "ready" → useEffect redirige al home
    // Si quedó REQUIRE_OTP: pendingStepUp bloquea esa redirección hasta verificar el código.
  }

  if (pendingStepUp) {
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
              Verifica tu identidad
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "var(--t-text-dim)" }}>
              Detectamos un acceso desde un dispositivo nuevo. Ingresa el código que te enviamos
              {pendingStepUp.deliveryHint ? ` a ${pendingStepUp.deliveryHint}` : " por correo"}.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium" style={{ color: "var(--t-text-dim)" }}>
                Código OTP
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={otpSubmitting}
                placeholder="000000"
                className="h-11 w-full rounded-2xl px-3 text-center text-[16px] tracking-[0.3em] outline-none transition-colors"
                style={{
                  background: "var(--t-bg)",
                  border: "1px solid var(--t-border)",
                  color: "var(--t-text)",
                }}
                required
                autoFocus
              />
            </label>

            {otpError ? (
              <div
                className="rounded-2xl px-4 py-3 text-[12px]"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.30)",
                  color: "#fca5a5",
                }}
              >
                {otpError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={otpSubmitting || !otpCode.trim()}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: "#3b82f6", color: "#fff" }}
            >
              {otpSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Verificar código"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendingOtp}
              className="w-full text-center text-[12px] underline disabled:opacity-50"
              style={{ color: "var(--t-text-dim)" }}
            >
              {resendingOtp ? "Reenviando…" : "Reenviar código"}
            </button>
          </form>
        </div>
      </div>
    );
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
