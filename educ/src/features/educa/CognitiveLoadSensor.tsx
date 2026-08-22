import React, { useState, useEffect } from 'react';
import { Brain, Battery, Activity, Coffee, Zap, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

// RF-024: Sensor y Balanceador de Carga Cognitiva y Fatiga Mental
// RF-032: Perfil de Estilos Cognitivos Ãšnico

export const CognitiveLoadSensor = () => {
  const [loadLevel, setLoadLevel] = useState(85);
  const [fatigue, setFatigue] = useState(42);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadLevel(prev => Math.min(100, prev + (Math.random() * 2 - 0.5)));
      setFatigue(prev => Math.min(100, prev + (Math.random() * 1.5 - 0.2)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const requiresBreak = fatigue > 70 || loadLevel > 90;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Brain className="text-purple-500 h-8 w-8" />
            Sensor Cognitivo
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitoreo biomÃ©trico simulado de carga mental, estrÃ©s visual y rendimiento.
          </p>
        </div>
        <div className="flex items-center gap-4 card px-4 py-2 rounded-xl">
          <span className="text-sm text-muted-foreground">Estilo Cognitivo:</span>
          <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">Visual-Espacial / KinestÃ©sico</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Cognitive Load */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Activity className="w-5 h-5 text-purple-500" /> Carga Cognitiva Activa
            </div>
            <span className="text-2xl font-bold text-white">{Math.round(loadLevel)}%</span>
          </div>
          
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden mb-2">
            <motion.div 
              className={`h-full ${loadLevel > 85 ? 'bg-red-500' : 'bg-purple-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${loadLevel}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            <span>Ã“ptimo: 40-70%</span>
            <span className={loadLevel > 85 ? "text-red-400" : "text-green-400"}>
              {loadLevel > 85 ? "Sobrecarga Detectada" : "En Flujo"}
            </span>
          </div>
        </div>

        {/* Visual Fatigue */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Battery className="w-5 h-5 text-orange-500" /> Nivel de Fatiga
            </div>
            <span className="text-2xl font-bold text-white">{Math.round(fatigue)}%</span>
          </div>
          
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden mb-2">
            <motion.div 
              className={`h-full ${fatigue > 70 ? 'bg-red-500' : 'bg-orange-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${fatigue}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Tasa de Error: +12%</span>
          </div>
        </div>

        {/* AI Action Hub */}
        <div className={`bg-[var(--s2)] border ${requiresBreak ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-border'} rounded-2xl p-6`}>
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-6">
            <Zap className={`w-5 h-5 ${requiresBreak ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} /> 
            IntervenciÃ³n de IA
          </div>
          
          {requiresBreak ? (
            <div className="space-y-4">
              <p className="text-sm text-red-200 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                Tu carga cognitiva estÃ¡ bloqueando la asimilaciÃ³n a largo plazo. La IA recomienda una pausa activa.
              </p>
              <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl transition font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                <Coffee className="w-5 h-5" /> Iniciar Pausa Pomodoro (5 min)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-blue-200 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                Condiciones Ã³ptimas. Tu retenciÃ³n de memoria de trabajo estÃ¡ en su pico.
              </p>
              <button className="w-full bg-white/5 text-muted-foreground cursor-not-allowed py-3 rounded-xl transition font-medium flex items-center justify-center gap-2">
                Continuar Aprendiendo
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CognitiveLoadSensor;

