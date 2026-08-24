import { useRouteError, isRouteErrorResponse } from "react-router";
import { RefreshCw } from "lucide-react";

export function RouterErrorBoundary() {
  const error = useRouteError();
  
  let errorMessage = "Algo salió mal al cargar esta página.";
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      errorMessage = "No pudimos encontrar la página que buscas.";
    } else if (error.status === 401) {
      errorMessage = "No tienes permiso para ver esta página.";
    } else {
      errorMessage = `Error ${error.status}: ${error.statusText}`;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070707] px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-[16px] font-medium text-[#F5F5F5]">
          {errorMessage}
        </p>
        <p className="text-[13px] text-white/50">
          Intenta recargar la página para solucionar el problema.
        </p>
        <button
          type="button"
          onClick={handleReload}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#121212]/60 px-5 py-2 text-[13px] font-medium text-[#F5F5F5] backdrop-blur-sm hover:border-white/[0.2] hover:bg-[#181818]/80"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recargar página
        </button>
      </div>
    </div>
  );
}
