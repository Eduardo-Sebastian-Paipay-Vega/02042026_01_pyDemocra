import React, { useState, useEffect, useRef } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { X, Smartphone, QrCode, RotateCw, Keyboard, AlertTriangle, ShieldCheck } from "lucide-react";

interface MfaChallengeProps {
  supabase: SupabaseClient;
  onVerified: () => void;
  onCancel?: () => void;
  theme?: "light" | "dark"; // Para adaptar colores sutilmente
}

export function MfaChallenge({ supabase, onVerified, onCancel, theme = "dark" }: MfaChallengeProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  // UX States
  const [showHelp, setShowHelp] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let isActive = true;
    async function loadFactor() {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        if (isActive) setError("No se pudieron cargar los factores MFA.");
        return;
      }
      const totpFactor = data.totp[0];
      if (!totpFactor) {
        if (isActive) setError("No se encontró un factor TOTP activo.");
        return;
      }
      if (isActive) setFactorId(totpFactor.id);
    }
    loadFactor();
    return () => { isActive = false; };
  }, [supabase]);

  // Temporizador TOTP Visual
  useEffect(() => {
    const updateTimer = () => {
      const currentSeconds = Math.floor(Date.now() / 1000) % 30;
      const remaining = 30 - currentSeconds;
      setTimeLeft(remaining);
      setProgress((remaining / 30) * 100);
    };
    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    
    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Go back and clear
        inputRefs.current[index - 1]?.focus();
      }
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (!factorId || code.length !== 6) return;

    setLoading(true);
    setError(null);

    // 1. Iniciar el desafío
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if (challengeRes.error) {
      setError("No se pudo iniciar el desafío MFA.");
      setLoading(false);
      return;
    }

    // 2. Verificar el código
    const verifyRes = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeRes.data.id,
      code,
    });

    if (verifyRes.error) {
      setError("Código incorrecto o expirado.");
      setLoading(false);
      // Opcional: limpiar inputs si hay error
      // setDigits(Array(6).fill(""));
      // inputRefs.current[0]?.focus();
      return;
    }

    // Exito!
    onVerified();
  };

  // Auto-submit when all 6 are filled
  useEffect(() => {
    if (digits.join("").length === 6) {
      // Small timeout for better UX, allowing the user to see the last digit entered
      const t = setTimeout(() => {
        handleSubmit();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [digits]);

  const isDark = theme === "dark";
  const isComplete = digits.join("").length === 6;

  return (
    <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      <div
        className="w-full max-w-[420px] rounded-3xl p-8 relative z-10"
        style={{
          background: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
          backdropFilter: "blur(12px)",
          border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e5e5e5",
          boxShadow: isDark ? "0 0 40px rgba(0,0,0,0.35)" : "0 10px 40px rgba(0,0,0,0.08)",
          color: isDark ? "#fff" : "#111",
        }}
      >
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl relative"
            style={{ 
              background: "rgba(59,130,246,0.12)", 
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#3b82f6" 
            }}
          >
            <Smartphone size={24} />
            {/* Temporizador circular bordeando el icono */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24" cy="24" r="22"
                fill="none"
                stroke="rgba(59,130,246,0.2)"
                strokeWidth="2"
              />
              <circle
                cx="24" cy="24" r="22"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="138"
                strokeDashoffset={138 - (138 * progress) / 100}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          </div>
          <h2 className="text-[20px] font-semibold mb-1">
            Verificación en dos pasos
          </h2>
          <p className="text-[13px] mb-2" style={{ color: isDark ? "#a0a0a0" : "#666" }}>
            Abre tu aplicación autenticadora e ingresa el código de 6 dígitos generado para continuar.
          </p>
          <button 
            type="button"
            onClick={() => setShowHelp(true)}
            className="text-[12px] text-blue-400 hover:text-blue-300 hover:underline"
            style={{ textUnderlineOffset: 4, transition: "color 0.2s" }}
          >
            ¿Primera vez o necesitas ayuda para verificar?
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className="flex justify-center items-center gap-2" 
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <React.Fragment key={idx}>
                <input
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading || !factorId}
                  autoComplete="off"
                  className="w-10 h-12 rounded-xl text-center text-[22px] font-semibold outline-none transition-all duration-200 disabled:opacity-60 focus:scale-105 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5",
                    border: isDark 
                      ? `1px solid ${digit ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}` 
                      : `1px solid ${digit ? 'rgba(59,130,246,0.5)' : '#ddd'}`,
                    color: isDark ? "#f5f5f5" : "#111",
                    boxShadow: digit ? '0 0 12px rgba(59,130,246,0.2)' : 'none'
                  }}
                  required
                />
                {idx === 2 && <span className="text-gray-500 mx-1">—</span>}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-[12px] text-center animate-in slide-in-from-top-2"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !isComplete || !factorId}
              className={`w-full flex h-12 items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold transition-all ${
                !isComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-500'
              }`}
              style={{ 
                background: isComplete ? "#2563eb" : (isDark ? "rgba(255,255,255,0.05)" : "#e0e0e0"), 
                color: isComplete ? "#fff" : (isDark ? "#888" : "#888"),
                transform: isComplete && !loading ? "translateY(-2px)" : "none",
                boxShadow: isComplete && !loading ? "0 8px 20px rgba(59,130,246,0.3)" : "none"
              }}
            >
              {loading ? (
                <RotateCw className="animate-spin" size={18} />
              ) : (
                "Verificar código"
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowBackup(true)}
              disabled={loading}
              className="w-full h-10 text-[12px] font-medium transition-colors hover:underline"
              style={{ color: isDark ? "#888" : "#666" }}
            >
              ¿Perdiste tu dispositivo? Usar código de respaldo
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full h-10 rounded-xl text-[13px] font-medium transition-colors"
                style={{
                  background: "transparent",
                  color: isDark ? "#c0c0c0" : "#444",
                }}
              >
                Volver al inicio
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Drawer Panel: Help */}
      {showHelp && (
        <>
          {/* Click-away overlay (transparent) */}
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowHelp(false)} 
          />
          
          <div 
            className="fixed top-0 right-0 h-full w-full max-w-[440px] z-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl"
            style={{ 
              background: isDark ? "rgba(23,23,23,0.95)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              borderLeft: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            {/* Header */}
            <div className="py-4 px-6 border-b shrink-0 flex justify-between items-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <h3 className="font-semibold text-[16px]" style={{ color: isDark ? '#fff' : '#111' }}>¿Cómo usar 2FA?</h3>
              <button 
                onClick={() => setShowHelp(false)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: isDark ? '#a0a0a0' : '#666' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div className="py-4 px-6 space-y-6 flex-1">
              {/* Paso 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold">1</div>
                  <div className="w-px h-full bg-blue-500/10"></div>
                </div>
                <div>
                  <h4 className="font-medium text-[14px] mb-1" style={{ color: isDark ? '#eee' : '#222' }}>Descarga una App</h4>
                  <p className="text-[13px] mb-3" style={{ color: isDark ? '#aaa' : '#666' }}>Si no tienes una, descarga Google Authenticator, Authy o Microsoft Authenticator en tu celular (iOS/Android).</p>
                  <div className="flex gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 border dark:border-white/10 border-black/10">Google Auth</span>
                    <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 border dark:border-white/10 border-black/10">Authy</span>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold">2</div>
                  <div className="w-px h-full bg-blue-500/10"></div>
                </div>
                <div>
                  <h4 className="font-medium text-[14px] mb-1" style={{ color: isDark ? '#eee' : '#222' }}>Abre y Vincula</h4>
                  <p className="text-[13px] mb-3" style={{ color: isDark ? '#aaa' : '#666' }}>Abre la app que descargaste. Si ya configuraste Democra previamente, busca la cuenta en tu lista.</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <QrCode size={20} className="text-blue-500" />
                    <span className="text-[12px] opacity-80">El código está asociado a tu correo.</span>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold">3</div>
                  <div className="w-px h-full bg-blue-500/10"></div>
                </div>
                <div>
                  <h4 className="font-medium text-[14px] mb-1" style={{ color: isDark ? '#eee' : '#222' }}>Código Dinámico</h4>
                  <p className="text-[13px]" style={{ color: isDark ? '#aaa' : '#666' }}>Verás un número de 6 dígitos que cambia cada 30 segundos junto a un indicador de tiempo circular.</p>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold">4</div>
                </div>
                <div>
                  <h4 className="font-medium text-[14px] mb-1" style={{ color: isDark ? '#eee' : '#222' }}>Ingresa el Código</h4>
                  <p className="text-[13px] mb-3" style={{ color: isDark ? '#aaa' : '#666' }}>Escribe esos números sin espacios en las casillas cuadradas. ¡Y listo!</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Keyboard size={18} />
                    <span className="text-[12px] font-medium">Auto-verificación al completar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="py-4 px-6 border-t shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-500/90 leading-relaxed">
                  Si cambiaste de dispositivo o eliminaste la aplicación autenticadora y no tienes tus códigos de respaldo, contacta con tu administrador.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Placeholder Modal: Backup Codes */}
      {showBackup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
          style={{ background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowBackup(false)}
        >
          <div 
            className="w-full max-w-[340px] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center"
            style={{ 
              background: isDark ? "#111" : "#fff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-semibold text-[17px] mb-2" style={{ color: isDark ? '#fff' : '#111' }}>
              Códigos de Respaldo
            </h3>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: isDark ? '#a0a0a0' : '#666' }}>
              Esta funcionalidad te permitirá ingresar uno de tus códigos de recuperación de 10 caracteres en caso de emergencia. Estará disponible en la próxima actualización.
            </p>
            <button
              onClick={() => setShowBackup(false)}
              className="w-full h-11 rounded-xl font-medium text-[13px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              style={{ color: isDark ? '#fff' : '#111' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
