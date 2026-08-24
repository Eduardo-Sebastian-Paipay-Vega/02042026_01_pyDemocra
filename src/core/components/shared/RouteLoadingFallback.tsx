import { LoaderCircle } from "lucide-react";

interface RouteLoadingFallbackProps {
  // false = se usa dentro del shell ya montado (solo reemplaza el <Outlet/>);
  // true = boundary de más afuera, antes de que exista cualquier layout.
  fullScreen?: boolean;
}

// Fallback de <Suspense> para páginas cargadas con React.lazy(). Reutiliza el
// mismo lenguaje visual que TenantBootstrapLoadingScreen (tenant/screens.tsx),
// pero con copy propio: aquí se está esperando un chunk JS, no el bootstrap
// del tenant. Usa colores con fallback explícito porque este componente puede
// renderizar ANTES de que ThemeProvider aplique las variables --t-* al root
// (por ejemplo, en el Suspense de más afuera en App.tsx, que también cubre
// páginas públicas como /login que no pasan por AppShell/ThemeProvider).
export function RouteLoadingFallback({ fullScreen = true }: RouteLoadingFallbackProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center px-6"
          : "flex min-h-[240px] w-full items-center justify-center px-6 py-16"
      }
    >
      <div className="flex flex-col items-center gap-3">
        <LoaderCircle
          className="h-7 w-7 animate-spin"
          style={{ color: "var(--t-text-dim, #8a8a8a)" }}
        />
        <p className="text-[13px]" style={{ color: "var(--t-text-dim, #8a8a8a)" }}>
          Cargando módulo…
        </p>
      </div>
    </div>
  );
}
