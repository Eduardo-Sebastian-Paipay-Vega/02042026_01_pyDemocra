import React, { useState } from 'react';
import { Brain, Fingerprint, Activity, Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-055: Evaluación Psico-Aptitudinal Interactiva

export const EvaluacionPsicotecnica = () => {
  const [started, setStarted] = useState(false);
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Fingerprint className="text-fuchsia-500 h-8 w-8" />
            Perfilado Psico-Aptitudinal
          </h2>
          <p className="text-muted-foreground mt-1">
            Tests cognitivos visuales e interactivos sin presiones.
          </p>
        </div>
      </div>

      {!started ? (
        <div className="bg-[var(--s2)] border border-fuchsia-500/20 rounded-3xl p-12 text-center flex flex-col items-center shadow-[0_0_50px_rgba(217,70,239,0.05)] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full" />
          
          <Brain className="w-24 h-24 text-fuchsia-500 mb-6 relative z-10" />
          <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Descubre tu potencial (Big Five)</h3>
          <p className="text-slate-400 max-w-lg mb-8 relative z-10">
            Esta no es una evaluación calificada. Resolveremos acertijos de razonamiento espacial, secuencias lógicas y velocidad de reacción para mapear tu perfil en tu Gemelo Digital.
          </p>
          
          <button 
            onClick={() => setStarted(true)}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-8 py-4 rounded-xl transition flex items-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.4)] relative z-10"
          >
            <Play className="w-5 h-5 fill-white" /> Comenzar Sesión (15 min)
          </button>
        </div>
      ) : (
        <div className="card p-8">
          
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-border">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-fuchsia-500" /> Test 1: Razonamiento Espacial
            </div>
            <div className="flex items-center gap-2 text-fuchsia-400 bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">
              <Clock className="w-4 h-4" /> 00:45
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold text-white mb-8 text-center">¿Qué figura completa la secuencia lógica?</h3>
            
            {/* Visual Puzzle Mockup */}
            <div className="flex gap-4 mb-12">
              <div className="w-24 h-24 bg-white/5 border border-border rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 rounded-full" />
              </div>
              <div className="w-24 h-24 bg-white/5 border border-border rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-300 rounded-full" />
                </div>
              </div>
              <div className="w-24 h-24 bg-white/5 border border-border rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                </div>
              </div>
              <div className="w-24 h-24 bg-fuchsia-500/5 border-2 border-dashed border-fuchsia-500/50 rounded-xl flex items-center justify-center text-fuchsia-500 font-black text-2xl">
                ?
              </div>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-4 gap-6 w-full max-w-2xl">
              {[1, 2, 3, 4].map(opt => (
                <button 
                  key={opt}
                  className="aspect-square bg-white/5 hover:bg-white/10 border border-border hover:border-fuchsia-500/50 rounded-xl transition flex items-center justify-center"
                >
                  <div className="w-12 h-12 border-4 border-slate-400 rounded-full opacity-50" />
                </button>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default EvaluacionPsicotecnica;
