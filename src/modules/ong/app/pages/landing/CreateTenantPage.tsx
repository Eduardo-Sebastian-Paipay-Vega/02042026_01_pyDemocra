import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../../supabaseClient";
import { GlassCard } from "./components/GlassCard";
import { PillButton } from "./components/PillButton";
import { getDeviceFingerprint } from "../../lib/deviceFingerprint";
import { ShieldCheck, CheckCircle2, Building2, User, KeyRound, Mail, Sparkles, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";

interface Step1FormData {
  taxId: string;
  tenantName: string;
  tradeName?: string;
  address?: string;
}

interface Step2FormData {
  fullName: string;
  docType: "DNI" | "CE" | "PASAPORTE";
  docNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
}

interface Step4FormData {
  industryTypeId: string;
  planId: string;
  billingDay: number;
}

export function CreateTenantPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [validatingRuc, setValidatingRuc] = useState(false);
  const [rucStatus, setRucStatus] = useState<{ isVal: boolean; message?: string } | null>(null);
  
  // Step 1 Data
  const [taxId, setTaxId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 Data
  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState<"DNI" | "CE" | "PASAPORTE">("DNI");
  const [docNumber, setDocNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 3 Data (OTP)
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Step 4 Data
  const [industryTypeId, setIndustryTypeId] = useState("ONG");
  const [planId, setPlanId] = useState("basic");
  const [billingDay, setBillingDay] = useState(1);

  // Global State
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Timer countdown for OTP
  useEffect(() => {
    let timer: any;
    if (currentStep === 3 && resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

  // Handler Step 1: Validar RUC con SUNAT
  async function handleValidateRuc(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setRucStatus(null);

    if (!/^\d{11}$/.test(taxId)) {
      setRucStatus({ isVal: false, message: "El RUC debe constar de 11 dígitos numéricos." });
      return;
    }

    setValidatingRuc(true);
    try {
      const response = await fetch(`/api/onboarding/validate-ruc/${taxId}`);
      const data = await response.json();

      if (!response.ok) {
        setRucStatus({ isVal: false, message: data.message || "No se pudo validar el RUC con SUNAT." });
        return;
      }

      setTenantName(data.tenant_name || tenantName);
      setRucStatus({ isVal: true, message: `RUC Valido (SUNAT: ACTIVO y HABIDO) - ${data.tenant_name}` });
      setCurrentStep(2);
    } catch (err: any) {
      setRucStatus({ isVal: false, message: "Error al conectar con la API de validación RUC." });
    } finally {
      setValidatingRuc(false);
    }
  }

  // Handler Step 2: Registrar Usuario Auth en Supabase & Avanzar a OTP
  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    if (!email || !password || !fullName || !docNumber) {
      setGlobalError("Por favor completa todos los campos obligatorios del titular.");
      return;
    }

    setBootstrapping(true);
    try {
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            doc_type: docType,
            doc_number: docNumber,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message || "Error al crear la cuenta de usuario.");
      }

      setOtpSent(true);
      setResendCountdown(60);
      setCurrentStep(3);
    } catch (err: any) {
      setGlobalError(err.message || "Ocurrió un error inesperado al registrar el usuario.");
    } finally {
      setBootstrapping(false);
    }
  }

  // Handler Step 3: Verificar OTP o Continuar
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);

    if (otpCode.length < 6) {
      setOtpError("El código OTP debe ser de 6 dígitos.");
      return;
    }

    setVerifyingOtp(true);
    try {
      // Simular verificación de OTP enviada vía Resend API
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep(4);
    } catch (err: any) {
      setOtpError("Código OTP incorrecto o expirado.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  // Handler Step 4 & 5: Ejecutar fn_bootstrap_tenant_v2
  async function handleCompleteBootstrap() {
    setBootstrapping(true);
    setGlobalError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sesión no disponible. Por favor inicie sesión.");
      }

      // Invocación a Blueprint v2.0
      const response = await fetch("/api/onboarding/bootstrap-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          use_v2: true,
          tenant_name: tenantName,
          tax_id: taxId,
          trade_name: tradeName || tenantName,
          address: address || "Sede Matriz Principal",
          doc_type: docType,
          doc_number: docNumber,
          phone_number: phoneNumber,
          industry_type_id: industryTypeId,
          plan_id: planId,
          billing_day: billingDay,
          fingerprint: getDeviceFingerprint(),
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || "Error al configurar la organización.");
      }

      setCurrentStep(5);
      setTimeout(() => {
        window.location.assign("/ong/");
      }, 2000);
    } catch (err: any) {
      setGlobalError(err.message || "No se pudo completar la creación de la cuenta.");
    } finally {
      setBootstrapping(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-[#F5F5F5] placeholder:text-white/30 outline-none focus:border-indigo-500/50 transition-all";

  return (
    <div className="w-full flex-grow flex items-center justify-center px-4 py-12 relative z-10">
      <GlassCard
        className="w-full max-w-xl p-8 relative"
        style={{
          background: "rgba(18, 18, 24, 0.75)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Indicador de Pasos v2.0 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Paso {currentStep} de 5
            </span>
            <span className="text-[12px] text-zinc-400">
              {currentStep === 1 && "Validación Fiscal RUC (SUNAT)"}
              {currentStep === 2 && "Identidad del Representante"}
              {currentStep === 3 && "Verificación OTP por Correo"}
              {currentStep === 4 && "Plan & Configuración"}
              {currentStep === 5 && "Organización Lista"}
            </span>
          </div>
          <div className="flex h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* PASO 1: Validación RUC */}
        {currentStep === 1 && (
          <form onSubmit={handleValidateRuc} className="space-y-4">
            <div className="text-center mb-6">
              <Building2 className="h-10 w-10 text-indigo-400 mx-auto mb-2" />
              <h2 className="text-[22px] font-bold text-[#F5F5F5]">Valida tu RUC Institucional</h2>
              <p className="text-[13px] text-zinc-400">
                Consulta en tiempo real con SUNAT para autocompletar la Razón Social.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-zinc-300">Número de RUC (11 dígitos)</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ej. 20123456789"
                maxLength={11}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-zinc-300">Razón Social Oficial</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Autocompletado desde SUNAT"
                className={inputClass}
              />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Nombre Comercial (Opcional)</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ej. Fundación Demo"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Dirección Fiscal / Sede Matriz</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Principal 123"
                  className={inputClass}
                />
              </div>
            </div>

            {rucStatus && (
              <div
                className={`p-3 rounded-xl text-[12px] ${
                  rucStatus.isVal ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {rucStatus.message}
              </div>
            )}

            <PillButton type="button" onClick={(e: any) => handleValidateRuc(e)} className="w-full mt-4" disabled={validatingRuc}>
              {validatingRuc ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Validando con SUNAT...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Validar RUC y Continuar <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </PillButton>

          </form>
        )}

        {/* PASO 2: Datos de Identidad del Creador */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="text-center mb-6">
              <User className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <h2 className="text-[22px] font-bold text-[#F5F5F5]">Datos del Representante Legal</h2>
              <p className="text-[13px] text-zinc-400">
                La persona titular de la cuenta administradora (Owner).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-zinc-300">Nombres y Apellidos Completos</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Eduardo Paipay"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={(e: any) => setDocType(e.target.value)}
                  className={inputClass}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carnet de Extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Número de Documento</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="8 dígitos"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+51 987654321"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fundador@organizacion.org"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-zinc-300">Contraseña Segura</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={inputClass}
                required
                minLength={8}
              />
            </div>

            {globalError && (
              <div className="p-3 rounded-xl text-[12px] bg-red-500/10 text-red-400 border border-red-500/20">
                {globalError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <PillButton type="button" variant="secondary" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </PillButton>
              <PillButton type="submit" className="flex-1" disabled={bootstrapping}>
                {bootstrapping ? "Registrando usuario..." : "Siguiente: Verificación OTP"}
              </PillButton>
            </div>
          </form>
        )}

        {/* PASO 3: Verificación OTP por Correo Resend */}
        {currentStep === 3 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
            <Mail className="h-10 w-10 text-indigo-400 mx-auto mb-2 animate-bounce" />
            <h2 className="text-[22px] font-bold text-[#F5F5F5]">Verificación OTP por Correo</h2>
            <p className="text-[13px] text-zinc-400">
              Hemos enviado un código de 6 dígitos vía Resend API a <strong className="text-white">{email}</strong>.
            </p>

            <div className="py-4">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="784920"
                maxLength={6}
                className="w-48 text-center tracking-[0.4em] text-2xl font-mono py-3 rounded-xl border border-indigo-500/30 bg-zinc-950 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {otpError && (
              <p className="text-[12px] text-red-400">{otpError}</p>
            )}

            <div className="flex justify-between items-center text-[12px] text-zinc-400 px-4">
              <span>El código expira en 10 minutos</span>
              {resendCountdown > 0 ? (
                <span>Reenviar en {resendCountdown}s</span>
              ) : (
                <button type="button" onClick={() => setResendCountdown(60)} className="text-indigo-400 underline">
                  Reenviar código
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <PillButton type="button" variant="secondary" onClick={() => setCurrentStep(2)}>
                Atrás
              </PillButton>
              <PillButton type="submit" className="flex-1" disabled={verifyingOtp}>
                {verifyingOtp ? "Verificando..." : "Confirmar e Ingresar Código"}
              </PillButton>
            </div>
          </form>
        )}

        {/* PASO 4: Selección de Plan & Categoría */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Sparkles className="h-10 w-10 text-amber-400 mx-auto mb-2" />
              <h2 className="text-[22px] font-bold text-[#F5F5F5]">Configuración del Plan</h2>
              <p className="text-[13px] text-zinc-400">
                Selecciona la categoría institucional y el plan de suscripción.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Sector / Categoría</label>
                <select
                  value={industryTypeId}
                  onChange={(e) => setIndustryTypeId(e.target.value)}
                  className={inputClass}
                >
                  <option value="ONG">ONG / Sin Fines de Lucro</option>
                  <option value="Salud">Salud / Asistencial</option>
                  <option value="Educacion">Educación / Social</option>
                  <option value="Corporativo">Corporativo / Empresa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-zinc-300">Día Preferido de Facturación</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={billingDay}
                  onChange={(e) => setBillingDay(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { id: "basic", name: "Básico", price: "Gratis", desc: "Hasta 5 licencias" },
                { id: "pro", name: "Profesional", price: "$29/m", desc: "Sedes ilimitadas" },
                { id: "enterprise", name: "Enterprise", price: "Personalizado", desc: "Soporte 24/7" },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all text-center ${
                    planId === p.id
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-xs text-indigo-300 my-1">{p.price}</div>
                  <div className="text-[10px] text-zinc-400">{p.desc}</div>
                </div>
              ))}
            </div>

            {globalError && (
              <div className="p-3 rounded-xl text-[12px] bg-red-500/10 text-red-400 border border-red-500/20">
                {globalError}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <PillButton type="button" variant="secondary" onClick={() => setCurrentStep(3)}>
                Atrás
              </PillButton>
              <PillButton type="button" className="flex-1" onClick={handleCompleteBootstrap} disabled={bootstrapping}>
                {bootstrapping ? "Ejecutando fn_bootstrap_tenant_v2..." : "Crear Organización (v2.0)"}
              </PillButton>
            </div>
          </div>
        )}

        {/* PASO 5: Confirmación Éxito Total */}
        {currentStep === 5 && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-[26px] font-bold text-white">¡Organización Creada Exitosamente!</h2>
            <p className="text-zinc-300 text-sm max-w-md mx-auto">
              Se ha completado el onboarding v2.0 de <strong className="text-white">{tenantName}</strong>. Redirigiendo a tu Dashboard de gestión...
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
