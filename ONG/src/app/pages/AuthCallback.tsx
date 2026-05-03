import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import { resolveTenantInitialPath } from "../tenant/navigation";

const TIMEOUT_MS = 12_000;

export function AuthCallback() {
  const { status, context } = useTenantBootstrap();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  // Redirect to home once the bootstrap resolves the session
  useEffect(() => {
    if (status === "ready" && context) {
      navigate(resolveTenantInitialPath(context), { replace: true });
    }
  }, [status, context, navigate]);

  // Safety timeout — show a manual retry if Supabase never fires SIGNED_IN
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut && status !== "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-[14px]" style={{ color: "var(--t-text-dim)" }}>
          La autenticación tardó demasiado. El enlace puede haber expirado.
        </p>
        <a
          href="http://localhost:5173/login"
          className="rounded-2xl px-5 py-2.5 text-[13px] font-semibold"
          style={{ background: "#3b82f6", color: "#fff" }}
        >
          Volver al login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <LoaderCircle
        className="h-7 w-7 animate-spin"
        style={{ color: "var(--t-text-dim)" }}
      />
      <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>
        Completando autenticación…
      </p>
    </div>
  );
}
