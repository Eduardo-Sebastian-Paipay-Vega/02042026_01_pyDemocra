import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../../supabaseClient";
import { GlassCard } from "./components/GlassCard";
import { PillButton } from "./components/PillButton";

interface CreateTenantFormData {
  email: string;
  password: string;
  tenantName: string;
  taxId: string;
}

export function CreateTenantPage() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTenantFormData>();

  const onSubmit = async (data: CreateTenantFormData) => {
    setLoading(true);
    setGlobalError(null);

    try {
      // 1. Crear usuario en Supabase (Auth)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message || "Error al crear la cuenta.");
      }

      const session = authData.session;
      if (!session) {
        throw new Error("Por favor, verifica tu correo electrónico para continuar.");
      }

      // 2. Llamar al endpoint bootstrap-tenant
      const response = await fetch("/api/onboarding/bootstrap-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenant_name: data.tenantName,
          tax_id: data.taxId,
          industry_type_id: "ONG",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || "Error al configurar la organización.");
      }

      // 3. Éxito: redirigir a la app ONG (RootEntryRedirect o AppShell lo manejarán)
      window.location.assign("/ong/");
    } catch (err: any) {
      setGlobalError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[14px] text-[#F5F5F5] placeholder:text-white/30 outline-none focus:border-white/[0.2] transition-colors";

  return (
    <div className="w-full flex-grow flex items-center justify-center px-4 relative z-10">
      <GlassCard className="w-full max-w-md p-8 relative" style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="text-center mb-8">
          <h1 className="text-[26px] font-semibold text-[#F5F5F5] mb-2">
            Crea tu Organización
          </h1>
          <p className="text-[14px] text-[#A0A0A0]">
            Únete a Democra y gestiona tu ONG de forma profesional.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#A0A0A0]">
              Nombre de la Organización
            </label>
            <input
              type="text"
              placeholder="Ej. Fundación Esperanza"
              className={inputClass}
              {...register("tenantName", { required: "El nombre es obligatorio" })}
            />
            {errors.tenantName && (
              <p className="text-[12px] text-red-400 mt-1">{errors.tenantName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#A0A0A0]">RUC (Tax ID)</label>
            <input
              type="text"
              placeholder="11 dígitos (Ej. 20123456789)"
              className={inputClass}
              {...register("taxId", {
                required: "El RUC es obligatorio",
                pattern: {
                  value: /^[0-9]{11}$/,
                  message: "El RUC debe tener exactamente 11 dígitos numéricos",
                },
              })}
            />
            {errors.taxId && (
              <p className="text-[12px] text-red-400 mt-1">{errors.taxId.message}</p>
            )}
          </div>

          <div className="space-y-1.5 pt-4 border-t border-white/[0.05]">
            <label className="text-[12px] font-medium text-[#A0A0A0]">Tu Correo Electrónico</label>
            <input
              type="email"
              placeholder="fundador@organizacion.org"
              className={inputClass}
              {...register("email", { required: "El correo es obligatorio" })}
            />
            {errors.email && (
              <p className="text-[12px] text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#A0A0A0]">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: { value: 6, message: "Debe tener al menos 6 caracteres" },
              })}
            />
            {errors.password && (
              <p className="text-[12px] text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {globalError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-[13px] text-red-400">
              {globalError}
            </div>
          )}

          <div className="pt-4">
            <PillButton type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Creando organización...
                </span>
              ) : (
                "Crear Organización"
              )}
            </PillButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
