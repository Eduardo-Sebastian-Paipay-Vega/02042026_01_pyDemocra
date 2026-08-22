import React from 'react';

/**
 * Shell para la vertical de EducaciÃ³n.
 * Provee el ThemeProvider especÃ­fico (colores, fuentes) para la industria educativa.
 */
export const EducacionShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="educacion-theme min-h-screen bg-slate-50">
      {/* 
        El theme inyectarÃ¡ sus colores semÃ¡nticos a travÃ©s de variables CSS 
        o clases especÃ­ficas de Tailwind aplicadas a este contenedor.
      */}
      {children}
    </div>
  );
};

