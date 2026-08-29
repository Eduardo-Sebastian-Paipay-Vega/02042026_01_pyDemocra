import { createSupabaseClient } from "../services/supabase";
import { GradientBackground } from "../pages/landing/components/GradientBackground";
import { CoreLogin } from "../core/auth";

export function LoginGateway() {
  async function handleSuccessfulLogin() {
    const supabase = createSupabaseClient();
    
    // public.tenants tiene RLS sin políticas (deny-all), así que industry_type_id
    // no es legible directamente. fn_get_user_redirect_target() (migración
    // 20260706120000) resuelve esto del lado del servidor con SECURITY DEFINER
    // y devuelve solo el destino ('ong' | 'gym' | 'root'), sin exponer la tabla.
    const { data: redirectTarget, error: redirectError } = await supabase.rpc(
      "fn_get_user_redirect_target"
    );

    if (redirectError) {
      throw new Error("Sesión iniciada, pero no se pudo determinar tu destino. Intenta de nuevo.");
    }

    // Uso estricto del resultado: solo 'ong' tiene un módulo real montado en
    // este MPA. Cualquier otro valor ('root', 'gym', o uno futuro) se trata
    // como "sin acceso todavía" — nunca se asume una ruta que no existe.
    if (redirectTarget === "ong") {
      // Same-origin MPA: la sesión ya quedó en localStorage bajo AUTH_STORAGE_KEY
      // (compartido con el cliente Supabase de ONG). Una navegación normal basta
      // para que /ong la recoja al montar — sin tokens en la URL.
      window.location.assign("/ong/app");
      return;
    }

    throw new Error(
      redirectTarget === "root"
        ? "Tu cuenta aún no está asociada a ninguna organización."
        : `Tu cuenta pertenece a un módulo ("${redirectTarget}") que todavía no está disponible en esta plataforma.`
    );
  }

  const headerNode = (
    <div className="mb-8 text-center">
      <img
        src="/brand/d-core-monogram.png"
        alt="Democra"
        className="mx-auto mb-4 h-12 w-12 rounded-2xl object-contain"
        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
      />
      <h1 className="text-[22px] font-semibold" style={{ color: "#f5f5f5" }}>
        Democra
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: "#a0a0a0" }}>
        Ingresa tus credenciales para acceder al sistema.
      </p>
    </div>
  );

  const footerNode = (
    <>
      <button
        type="button"
        onClick={() =>
          window.open(
            "https://wa.me/51953714752?text=Hola,%20necesito%20ayuda%20para%20ingresar%20a%20mi%20cuenta%20de%20Democra.",
            "_blank",
            "noopener,noreferrer"
          )
        }
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-medium transition-colors"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#c0c0c0",
        }}
      >
        ¿Necesitas ayuda para ingresar?
      </button>
      <p className="mt-6 text-center text-[11px]" style={{ color: "#707070" }}>
        ¿Nuevo en la plataforma?{" "}
        <a href="/" style={{ color: "#3b82f6" }}>
          Ir a la página principal
        </a>
      </p>
    </>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-white antialiased">
      <GradientBackground />
      <CoreLogin
        supabase={createSupabaseClient()}
        onLoginSuccess={handleSuccessfulLogin}
        headerNode={headerNode}
        footerNode={footerNode}
        buttonClassName="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold transition-opacity disabled:opacity-40"
        buttonStyle={{ background: "#3b82f6", color: "#fff" }}
      />
    </div>
  );
}
