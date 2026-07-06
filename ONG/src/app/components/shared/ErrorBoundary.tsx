import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  // Copy propio por boundary (ej. "No se pudo completar tu registro").
  // Si se omite, usa un mensaje genérico.
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Boundary de último recurso para errores de renderizado no capturados
// (ej. NotFoundError de insertBefore por DOM externo — autofill/password
// managers inyectando nodos en <input>, ver AccessCodeRedeemPage.tsx).
// Sin esto, un throw durante el render deja la pantalla en blanco: React
// desmonta todo el árbol y no hay nada que lo reemplace.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary capturó un error de renderizado:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070707] px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-[16px] font-medium text-[#F5F5F5]">
            {this.props.fallbackMessage ?? "Algo salió mal al mostrar esta página."}
          </p>
          <p className="text-[13px] text-white/50">
            Tu progreso puede no haberse perdido — intenta recargar antes de empezar de nuevo.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#121212]/60 px-5 py-2 text-[13px] font-medium text-[#F5F5F5] backdrop-blur-sm hover:border-white/[0.2] hover:bg-[#181818]/80"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}
