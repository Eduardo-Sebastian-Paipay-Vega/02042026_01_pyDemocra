import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router";
import { GlassCard } from "./components/GlassCard";
import { GradientText } from "./components/GradientText";
import { PillButton } from "./components/PillButton";
import { supabase } from "../../../supabaseClient";
import { validateAccessCode, completeAccessOnboarding } from "../../services/ace/ace.service";

type Step = "code" | "checking" | "form" | "submitting" | "done" | "redirecting" | "error";

const LINK_TYPE_LABEL: Record<string, string> = {
  STAFF_JOIN: "colaborador / staff",
  BENEFICIARY_JOIN: "beneficiario",
  VOLUNTEER_JOIN: "voluntario",
  GENERIC: "invitado",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all";

const formSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
});

export function AccessCodeRedeemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [linkType, setLinkType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [showPassword, setShowPassword] = useState(false);

  async function handleValidate(candidateCode: string) {
    const trimmed = candidateCode.trim();
    if (!trimmed) {
      setErrorMessage("Ingresa un código de acceso.");
      return;
    }
    setStep("checking");
    setErrorMessage(null);
    try {
      const result = await validateAccessCode(trimmed);
      if (!result.valid) {
        setStep("error");
        
        let friendlyReason = result.reason;
        if (result.reason === "expired") friendlyReason = "Este código de acceso ha expirado.";
        else if (result.reason === "not_found" || result.reason === "invalid_code") friendlyReason = "El código ingresado no existe o es inválido.";
        else if (result.reason === "inactive" || result.reason === "revoked") friendlyReason = "Este código de acceso ha sido revocado o desactivado.";
        else if (result.reason === "max_uses_reached" || result.reason === "limit_reached") friendlyReason = "Este código ya ha alcanzado su límite de usos permitidos.";

        setErrorMessage(friendlyReason ?? "Este código no es válido o ya expiró.");
        return;
      }
      setLinkType(result.type ?? "GENERIC");
      setStep("form");
    } catch (err) {
      setStep("error");
      setErrorMessage(err instanceof Error ? err.message : "No se pudo validar el código.");
    }
  }

  useEffect(() => {
    const initialCode = searchParams.get("code");
    if (initialCode) {
      handleValidate(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== "redirecting") return;
    navigate("/login");
  }, [step, navigate]);

  async function handleSubmit() {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0].message);
      return;
    }

    setStep("submitting");
    setErrorMessage(null);
    try {
      let { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { 
          data: { 
            full_name: `${form.firstName} ${form.lastName}`.trim(), 
            first_name: form.firstName, 
            last_name: form.lastName 
          } 
        },
      });

      if (authError && (authError.message.includes("already registered") || authError.status === 422 || authError.name === "AuthApiError")) {
        // Attempt to sign in instead if the user already exists
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          throw new Error("El correo ya está registrado. Si es tu cuenta, verifica que la contraseña sea correcta.");
        }
        authError = null; // Successfully logged in
      }

      if (authError) throw new Error(authError.message);

      await completeAccessOnboarding(code.trim(), {
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
      });

      setStep("done");
    } catch (err) {
      setStep("form");
      setErrorMessage(err instanceof Error ? err.message : "Ocurrió un error inesperado al registrarte.");
    }
  }

  let content: ReactNode;

  if (step === "code" || step === "checking") {
    content = (
      <div className="flex flex-col gap-3">
        <input
          className={inputClass}
          placeholder="Código de acceso"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={step === "checking"}
          autoComplete="off"
        />
        <PillButton onClick={() => handleValidate(code)} className="w-full">
          {step === "checking" ? "Verificando..." : "Continuar"}
        </PillButton>
      </div>
    );
  } else if (step === "form" || step === "submitting") {
    content = (
      <div className="flex flex-col gap-3">
        <div className="mb-2 p-3 bg-[#08996A]/10 border border-[#08996A]/20 rounded-lg">
          <p className="text-xs text-[#08996A] flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Código validado. Completa tus datos para unirte.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Nombres"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            disabled={step === "submitting"}
            autoComplete="given-name"
          />
          <input
            className={inputClass}
            placeholder="Apellidos"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            disabled={step === "submitting"}
            autoComplete="family-name"
          />
        </div>
        <input
          className={inputClass}
          type="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          disabled={step === "submitting"}
          autoComplete="email"
        />
        <div className="relative">
          <input
            className={inputClass}
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            disabled={step === "submitting"}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PillButton onClick={handleSubmit} className="w-full">
          {step === "submitting" ? "Creando cuenta..." : "Crear cuenta y unirme"}
        </PillButton>
      </div>
    );
  } else if (step === "done") {
    content = (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-[#4D9B8F]">
          ¡Listo! Tu cuenta fue creada y tu rol se asignó automáticamente. Revisa tu correo
          para confirmar la cuenta y luego inicia sesión.
        </p>
        <PillButton variant="secondary" onClick={() => setStep("redirecting")}>
          Ir a iniciar sesión
        </PillButton>
      </div>
    );
  } else if (step === "redirecting") {
    content = (
      <p className="text-[14px] text-white/50">Redirigiendo a iniciar sesión...</p>
    );
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-[#E06A6A]/10 border border-[#E06A6A]/20 rounded-xl text-center">
          <div className="w-10 h-10 bg-[#E06A6A]/20 rounded-full flex items-center justify-center mx-auto mb-3">
             <svg className="w-5 h-5 text-[#E06A6A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">Enlace inválido o caducado</h3>
          <p className="text-xs text-white/50">{errorMessage}</p>
        </div>
        <PillButton variant="secondary" onClick={() => {
            setCode("");
            setStep("code");
        }}>
          Ingresar otro código
        </PillButton>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex items-center justify-center px-4">
      {/* @ts-ignore */}
      <GlassCard className="w-full max-w-md p-8 relative z-10" style={{ 
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}>
        <h1 className="text-[26px] font-semibold text-[#F5F5F5] mb-2">
          Únete a <GradientText>Democra</GradientText>
        </h1>
        <p className="text-[14px] text-white/50 mb-6">
          Ingresa tu código de acceso para registrarte
          {linkType ? ` como ${LINK_TYPE_LABEL[linkType] ?? "invitado"}` : ""}.
        </p>

        <div key={step}>{content}</div>

        {errorMessage && step !== "error" && step !== "done" && (
          <p className="text-[13px] text-[#E06A6A] mt-3">{errorMessage}</p>
        )}
      </GlassCard>
    </div>
  );
}
