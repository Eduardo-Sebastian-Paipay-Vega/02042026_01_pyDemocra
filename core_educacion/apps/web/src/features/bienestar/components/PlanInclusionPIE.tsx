import React from 'react';
import { Accessibility, BrainCircuit, CheckSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-065: Plan PIE/IEP (Programa de InclusiÃ³n Escolar)

export const PlanInclusionPIE = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Accessibility className="text-teal-500 h-8 w-8" />
            Plan de InclusiÃ³n IEP
          </h2>
          <p className="text-muted-foreground mt-1">
            Seguimiento de Programas Educativos Individualizados (PIE).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Alumnos */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" /> Estudiantes Asignados (4)
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left bg-white/10 border border-teal-500/30 p-3 rounded-xl">
                <div className="font-bold text-sm text-white">Mateo R.</div>
                <div className="text-xs text-teal-400 mt-1">Dislexia FonolÃ³gica</div>
              </button>
              <button className="w-full text-left bg-white/5 hover:bg-white/10 border border-border p-3 rounded-xl transition">
                <div className="font-bold text-sm text-slate-300">LucÃ­a M.</div>
                <div className="text-xs text-slate-500 mt-1">TDAH</div>
              </button>
            </div>
          </div>
        </div>

        {/* Detalle IEP */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Mateo RodrÃ­guez (3ero B)</h3>
                <span className="text-sm font-bold bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
                  IEP Activo - Dislexia
                </span>
              </div>
              <div className="flex gap-2">
                <button className="bg-white/5 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold">Editar Plan</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-border">
                <h4 className="text-xs text-slate-500 font-bold mb-2 uppercase">AdaptaciÃ³n EspecÃ­fica</h4>
                <p className="text-sm text-slate-300">Uso de tipografÃ­a OpenDyslexic en toda la plataforma. Tiempo extra (+30%) en evaluaciones.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-border">
                <h4 className="text-xs text-slate-500 font-bold mb-2 uppercase">Apoyo ClÃ­nico</h4>
                <p className="text-sm text-slate-300">Terapia de lenguaje (Jueves 4:00 PM). FonoaudiologÃ­a.</p>
              </div>
            </div>

            {/* Ajustes AutomÃ¡ticos (Digital Twin) */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
              <h4 className="text-indigo-400 font-bold flex items-center gap-2 mb-4">
                <BrainCircuit className="w-5 h-5" /> Adaptaciones IA Activas (Digital Twin)
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-indigo-200/80">
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> Text-to-Speech activado por defecto en lecturas de Historia.
                </li>
                <li className="flex items-center gap-3 text-sm text-indigo-200/80">
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> Contraste de colores ajustado a modo "Alto Contraste CÃ¡lido".
                </li>
                <li className="flex items-center gap-3 text-sm text-indigo-200/80">
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> Los exÃ¡menes adaptativos (CAT/IRT) bloquean Ã­tems de alta carga lÃ©xica.
                </li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PlanInclusionPIE;

