import React from 'react';
import { EyeOff, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

// RF-053: Peer-Review Ciego

export const PeerReviewCiego = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <EyeOff className="text-indigo-500 h-8 w-8" />
            Evaluación por Pares (Doble Ciego)
          </h2>
          <p className="text-muted-foreground mt-1">
            Califica el trabajo de tus compañeros usando rúbricas de forma 100% anónima.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Document Viewer (Anonymous) */}
        <div className="card p-6 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> Ensayo_Final.pdf
            </h3>
            <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30 flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> Autor Oculto
            </span>
          </div>

          <div className="flex-1 bg-white/5 border border-border rounded-2xl p-8 overflow-y-auto font-serif text-slate-300 text-sm leading-relaxed">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">El Impacto de la Inteligencia Artificial en la Educación Moderna</h1>
            <p className="mb-4">
              La introducción de sistemas algorítmicos en las aulas representa uno de los cambios de paradigma más significativos del siglo XXI. Sin embargo, este progreso tecnológico no está exento de desafíos éticos...
            </p>
            <p className="mb-4">
              Por un lado, la personalización del aprendizaje promete democratizar el acceso al conocimiento, permitiendo que cada estudiante avance a su propio ritmo. Por otro lado, la dependencia de cajas negras algorítmicas suscita preocupaciones sobre el sesgo y la privacidad de los datos.
            </p>
            <p className="mb-4 text-center opacity-50">...</p>
          </div>
        </div>

        {/* Rubric Evaluator */}
        <div className="card p-6 h-[600px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Rúbrica de Evaluación</h3>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            
            {/* Criterio 1 */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-slate-300">Claridad y Argumentación</span>
                <span className="text-sm font-bold text-indigo-400">0/5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} className="bg-white/5 hover:bg-indigo-500/20 border border-border hover:border-indigo-500 text-slate-400 hover:text-indigo-400 font-bold py-2 rounded-lg transition">
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Evalúa si la tesis principal es clara y está respaldada por argumentos sólidos.</p>
            </div>

            {/* Criterio 2 */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-slate-300">Estructura y Cohesión</span>
                <span className="text-sm font-bold text-indigo-400">0/5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} className="bg-white/5 hover:bg-indigo-500/20 border border-border hover:border-indigo-500 text-slate-400 hover:text-indigo-400 font-bold py-2 rounded-lg transition">
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Los párrafos se conectan de manera lógica y fluida.</p>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-300">Retroalimentación Constructiva</span>
              <textarea 
                className="w-full bg-white/5 border border-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-24"
                placeholder="Escribe comentarios útiles para mejorar el trabajo..."
              />
            </div>
            
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <CheckCircle2 className="w-5 h-5" /> Enviar Evaluación
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PeerReviewCiego;
