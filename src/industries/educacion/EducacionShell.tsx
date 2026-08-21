import React from 'react';

/**
 * Shell para la vertical de Educación.
 * Provee el ThemeProvider específico (colores, fuentes) para la industria educativa.
 */
export const EducacionShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="educacion-theme min-h-screen bg-slate-50">
      {/* 
        El theme inyectará sus colores semánticos a través de variables CSS 
        o clases específicas de Tailwind aplicadas a este contenedor.
      */}
      {children}
    </div>
  );
};
