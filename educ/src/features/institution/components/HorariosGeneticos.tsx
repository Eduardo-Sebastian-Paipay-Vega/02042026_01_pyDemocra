import React, { useState } from 'react';
import { CalendarDays, Play, Settings2, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// RF-057: Horarios GenÃ©ticos (IA)

export const HorariosGeneticos = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [fitness, setFitness] = useState(0);

  const startAlgorithm = () => {
    setRunning(true);
    setProgress(0);
    setGeneration(0);
    setFitness(40);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setRunning(false);
          return 100;
        }
        return p + 2;
      });
      setGeneration(g => g + 14);
      setFitness(f => Math.min(100, f + Math.random() * 2));
    }, 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="text-fuchsia-500 h-8 w-8" />
            Horarios GenÃ©ticos IA
          </h2>
          <p className="text-muted-foreground mt-1">
            Algoritmo evolutivo para asignaciÃ³n de cruces, espacios y horas docentes.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white/5 border border-border text-slate-300 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition">
            <Settings2 className="w-4 h-4" /> Restricciones
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6">ParÃ¡metros del Algoritmo</h3>
          
          <div className="space-y-4 mb-8">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>TamaÃ±o PoblaciÃ³n</span>
                <span>500</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 w-[50%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Tasa de MutaciÃ³n</span>
                <span>0.05</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 w-[20%]" />
              </div>
            </div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6">
            <div className="flex gap-2 items-start text-rose-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div className="text-sm font-bold">Cruces Detectados (Manual)</div>
            </div>
            <p className="text-xs text-rose-300/80 mt-1">El Prof. JimÃ©nez cruza 3h de FÃ­sica con 5to y 4to B.</p>
          </div>

          <button 
            onClick={startAlgorithm}
            disabled={running || progress === 100}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.3)] disabled:shadow-none"
          >
            {running ? (
              <><Cpu className="w-5 h-5 animate-spin" /> Evolucionando...</>
            ) : progress === 100 ? (
              'Horario Ã“ptimo Generado'
            ) : (
              <><Play className="w-5 h-5 fill-white" /> Ejecutar Algoritmo</>
            )}
          </button>
        </div>

        {/* Visualizer */}
        <div className="lg:col-span-2 card p-6 relative overflow-hidden flex flex-col justify-center">
          
          {progress > 0 ? (
            <div className="relative z-10 w-full max-w-md mx-auto">
              <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-black text-white">{Math.floor(fitness)}%</div>
                <div className="text-sm text-fuchsia-400 font-bold tracking-wider uppercase">Fitness Score</div>
              </div>
              <div className="h-4 bg-white/5 border border-border rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/5 rounded-xl py-3 border border-border">
                  <div className="text-2xl font-bold text-white">{generation}</div>
                  <div className="text-xs text-slate-400">Generaciones</div>
                </div>
                <div className="bg-white/5 rounded-xl py-3 border border-border">
                  <div className="text-2xl font-bold text-emerald-400">
                    {progress === 100 ? '0' : Math.floor((100 - progress) / 2)}
                  </div>
                  <div className="text-xs text-slate-400">Conflictos</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <Cpu className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>El algoritmo genÃ©tico estÃ¡ listo para iniciar simulaciÃ³n evolutiva.</p>
            </div>
          )}

          {/* Neural Bg */}
          {running && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex flex-wrap gap-2 justify-center content-center overflow-hidden">
              {Array.from({ length: 200 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.1, 0.5, 0.1] }}
                  transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
                  className="w-2 h-2 bg-fuchsia-500 rounded-sm"
                />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default HorariosGeneticos;

