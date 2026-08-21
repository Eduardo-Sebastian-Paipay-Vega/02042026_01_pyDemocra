import React from 'react';
import { ThermometerSun, AlertTriangle, TrendingDown, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-066: Observatorio Clima Institucional

export const ObservatorioClima = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ThermometerSun className="text-amber-500 h-8 w-8" />
            Observatorio de Clima & Bienestar
          </h2>
          <p className="text-muted-foreground mt-1">
            Mapa de calor emocional y termÃ³metro de convivencia escolar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* TermÃ³metro Global */}
        <div className="lg:col-span-1 card p-6 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-full bg-emerald-500/10 border-[8px] border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
            <span className="text-4xl font-black text-emerald-400">82</span>
            <span className="absolute -bottom-3 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Saludable
            </span>
          </div>
          <h3 className="font-bold text-white mb-2">Ãndice Global de Bienestar</h3>
          <p className="text-xs text-slate-400">Agregado de Triage, EWS y Carga Cognitiva.</p>
        </div>

        {/* Alertas Prioritarias */}
        <div className="lg:col-span-3 card p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Focos de AtenciÃ³n (Hotspots)
          </h3>
          
          <div className="space-y-4">
            
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500/20 p-3 rounded-xl"><BrainCircuit className="text-rose-400 w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Pico de Carga Cognitiva</h4>
                  <p className="text-xs text-rose-300/80">3ero de Secundaria - SecciÃ³n B (Semana de Parciales)</p>
                </div>
              </div>
              <button className="text-xs font-bold bg-rose-500/10 text-rose-400 px-4 py-2 rounded-lg hover:bg-rose-500 hover:text-white transition">
                Sugerir Pausa Activa
              </button>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/20 p-3 rounded-xl"><Users className="text-amber-400 w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-white text-sm">Alerta de Aislamiento (EWS)</h4>
                  <p className="text-xs text-amber-300/80">4 alumnos reportan baja energÃ­a continua en Triage.</p>
                </div>
              </div>
              <button className="text-xs font-bold bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg hover:bg-amber-500 hover:text-white transition">
                Notificar PsicologÃ­a
              </button>
            </div>

          </div>
        </div>

        {/* Heatmap Simulation */}
        <div className="lg:col-span-4 card p-6">
          <h3 className="text-lg font-bold text-white mb-6">Mapa de Calor Institucional (Ãšltimos 7 dÃ­as)</h3>
          <div className="grid grid-cols-7 gap-2">
            {/* Days row */}
            <div className="col-span-7 grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase">{d}</div>
              ))}
            </div>
            {/* Heatmap Blocks */}
            {Array.from({ length: 35 }).map((_, i) => {
              const intensity = Math.random();
              let color = 'bg-emerald-500/20 border-emerald-500/30';
              if (intensity > 0.8) color = 'bg-rose-500/50 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
              else if (intensity > 0.6) color = 'bg-amber-500/30 border-amber-500/40';

              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`aspect-square rounded-lg border ${color}`}
                />
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ObservatorioClima;

