import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#090909] text-white p-4">
          <div className="max-w-md w-full bg-[#111110] border border-white/10 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h1 className="text-xl font-semibold">Algo salió mal</h1>
            </div>
            <p className="text-sm text-white/60 mb-6">
              La aplicación encontró un error inesperado al renderizar esta pantalla. 
              Por favor, intenta recargar la página.
            </p>
            {this.state.error && (
              <div className="bg-black/50 border border-white/5 rounded p-3 mb-6 overflow-auto max-h-32">
                <code className="text-xs text-red-300 font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
