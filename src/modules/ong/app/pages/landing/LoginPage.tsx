import { Link, useNavigate } from "react-router";
import { supabase } from "../../../supabaseClient";
import { CoreLogin } from "../../../../../core/auth";

export function LoginPage() {
  const navigate = useNavigate();

  const headerNode = (
    <>
      <h1 className="text-[22px] font-semibold text-white mb-1">Iniciar sesión</h1>
      <p className="text-[13px] mb-8" style={{ color: "#A7A7A7" }}>
        Accede a tu organización en Democra
      </p>
    </>
  );

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

        <CoreLogin
          supabase={supabase}
          onLoginSuccess={() => navigate("/app")}
          className="rounded-3xl p-8 max-w-[400px]"
          style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}
          headerNode={headerNode}
          buttonClassName="w-full rounded-xl py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
          buttonStyle={{ background: "linear-gradient(135deg, #3D6BFF 0%, #2DBFB0 100%)" }}
        />

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
