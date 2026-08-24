import { useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { MfaChallenge } from "./MfaChallenge";

export interface CoreLoginProps {
  supabase: SupabaseClient;
  onLoginSuccess: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  className?: string;
  style?: React.CSSProperties;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  headerNode?: React.ReactNode;
  footerNode?: React.ReactNode;
}

export function CoreLogin({ 
  supabase, 
  onLoginSuccess,
  title = "Iniciar sesión",
  subtitle = "Accede a Democra",
  logoUrl = "/brand/d-core-monogram.png",
  className = "",
  style,
  buttonClassName = "mt-4 flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-[14px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50",
  buttonStyle,
  headerNode,
  footerNode
}: CoreLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return;

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError || !data.session) {
      setError(authError?.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : authError?.message ?? "Error de inicio de sesión");
      setLoading(false);
      return;
    }

    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!mfaError && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
      setMfaRequired(true);
      setLoading(false);
      return;
    }

    try {
      await onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Error post-login");
      setLoading(false);
    }
  }

  if (mfaRequired) {
    return (
      <MfaChallenge
        supabase={supabase}
        onVerified={onLoginSuccess}
        onCancel={() => {
          setMfaRequired(false);
          supabase.auth.signOut();
        }}
        theme="dark"
      />
    );
  }

  const defaultStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 0 40px rgba(0,0,0,0.35)",
    ...style
  };

  return (
    <div className={`relative z-10 w-full max-w-[420px] rounded-3xl p-8 ${className}`} style={defaultStyle}>
      {headerNode !== undefined ? headerNode : (
        <div className="mb-8 text-center">
          {logoUrl && <img src={logoUrl} alt="Logo" className="mx-auto mb-4 h-12 w-12 rounded-2xl object-contain" />}
          <h1 className="text-[22px] font-semibold text-white mb-1">{title}</h1>
          <p className="text-[13px]" style={{ color: "#A7A7A7" }}>{subtitle}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] mb-1.5" style={{ color: "#A7A7A7" }}>Correo electrónico</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-[#3D6BFF] disabled:opacity-60"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
            placeholder="tu@organizacion.org"
          />
        </div>
        <div>
          <label className="block text-[12px] mb-1.5" style={{ color: "#A7A7A7" }}>Contraseña</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl px-4 py-2.5 pr-10 text-[14px] text-white outline-none transition-colors focus:border-[#3D6BFF] disabled:opacity-60"
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
              placeholder="••••••••"
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
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className={buttonClassName}
          style={buttonStyle}
        >
          {loading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            "Ingresar"
          )}
        </button>

        {footerNode}
      </form>
    </div>
  );
}
