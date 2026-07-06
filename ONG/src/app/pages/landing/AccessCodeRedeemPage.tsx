import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { GlassCard } from "./components/GlassCard";
import { GradientText } from "./components/GradientText";
import { PillButton } from "./components/PillButton";
import { supabase } from "../../../supabaseClient";
import { validateAccessCode, completeAccessOnboarding } from "../../services/ace/ace.service";

type Step = "code" | "checking" | "form" | "submitting" | "done" | "error";

const LINK_TYPE_LABEL: Record<string, string> = {
  STAFF_JOIN: "colaborador / staff",
  BENEFICIARY_JOIN: "beneficiario",
  VOLUNTEER_JOIN: "voluntario",
  GENERIC: "invitado",
};

const inputClass =
  "w-full rounded-xl border border-white/[0.1] bg-[#0c0c0c]/60 px-4 py-2.5 text-[14px] text-[#F5F5F5] placeholder:text-white/30 outline-none focus:border-[#4A7BA7]/60";

export function AccessCodeRedeemPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [linkType, setLinkType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

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
        setErrorMessage(result.reason ?? "Este código no es válido o ya expiró.");
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

  async function handleSubmit() {
    if (!form.email || !form.password || !form.fullName) {
      setErrorMessage("Completa nombre, correo y contraseña.");
      return;
    }
    if (form.password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setStep("submitting");
    setErrorMessage(null);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      });
      if (signUpError) throw new Error(signUpError.message);

      await completeAccessOnboarding(code.trim(), {
        full_name: form.fullName,
        email: form.email,
      });

      setStep("done");
    } catch (err) {
      setStep("error");
      setErrorMessage(err instanceof Error ? err.message : "No se pudo completar el registro.");
    }
  }

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-4 py-16">
      <GlassCard className="w-full max-w-md p-8">
        <h1 className="text-[26px] font-semibold text-[#F5F5F5] mb-2">
          Únete a <GradientText>Democra</GradientText>
        </h1>
        <p className="text-[14px] text-white/50 mb-6">
          Ingresa tu código de acceso para registrarte
          {linkType ? ` como ${LINK_TYPE_LABEL[linkType] ?? "invitado"}` : ""}.
        </p>

        {(step === "code" || step === "checking") && (
          <div className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="Código de acceso"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={step === "checking"}
            />
            <PillButton onClick={() => handleValidate(code)} className="w-full">
              {step === "checking" ? "Verificando…" : "Continuar"}
            </PillButton>
          </div>
        )}

        {(step === "form" || step === "submitting") && (
          <div className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="Nombre completo"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              disabled={step === "submitting"}
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={step === "submitting"}
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Contraseña (mínimo 8 caracteres)"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={step === "submitting"}
            />
            <PillButton onClick={handleSubmit} className="w-full">
              {step === "submitting" ? "Creando cuenta…" : "Crear cuenta y unirme"}
            </PillButton>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-[#4D9B8F]">
              ¡Listo! Tu cuenta fue creada y tu rol se asignó automáticamente. Revisa tu correo
              para confirmar la cuenta y luego inicia sesión.
            </p>
            <PillButton variant="secondary" onClick={() => (window.location.href = "/login")}>
              Ir a iniciar sesión
            </PillButton>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-[#E06A6A]">{errorMessage}</p>
            <PillButton variant="secondary" onClick={() => setStep("code")}>
              Intentar de nuevo
            </PillButton>
          </div>
        )}

        {errorMessage && step !== "error" && step !== "done" && (
          <p className="text-[13px] text-[#E06A6A] mt-3">{errorMessage}</p>
        )}
      </GlassCard>
    </div>
  );
}
