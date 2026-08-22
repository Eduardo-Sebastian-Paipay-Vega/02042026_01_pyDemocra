import React from 'react';
import { MousePointer2, Eye, Hand, Activity, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';

// RF-025: Behavioral Analytics (Captura de Micro-Interacciones 500+)

export const BehavioralAnalytics = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="text-cyan-500 h-8 w-8" />
            Behavioral Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Análisis de micro-interacciones (mouse, scroll, pausas) correlacionadas con el engagement del curso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Metric Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-cyan-400" /> Clics Inactivos
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">1,245 <span className="text-xs font-normal text-red-400">+12%</span></div>
            <p className="text-xs text-muted-foreground">Señales de frustración UI</p>
          </div>

          <div className="card p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" /> Focus Score
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">84/100 <span className="text-xs font-normal text-green-400">+5%</span></div>
            <p className="text-xs text-muted-foreground">Basado en Scroll Depth / Dwell Time</p>
          </div>

          <div className="card p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <Hand className="w-4 h-4 text-yellow-400" /> Rage Clicks
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">42 <span className="text-xs font-normal text-green-400">-15%</span></div>
            <p className="text-xs text-muted-foreground">Puntos críticos en evaluaciones</p>
          </div>
        </div>

        {/* Heatmap Simulation */}
        <div className="lg:col-span-3">
          <div className="card p-6 h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-500" />
                Matriz de Correlación de Engagement
              </h3>
              <select className="bg-white/5 border border-border rounded-lg px-3 py-1.5 text-sm outline-none">
                <option>Últimos 7 días</option>
                <option>Mes Actual</option>
              </select>
            </div>

            {/* Fake Graph/Heatmap Area */}
            <div className="flex-1 border border-dashed border-border rounded-xl relative flex items-center justify-center min-h-[300px]">
              
              {/* Abstract Heatmap Dots */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full mix-blend-screen blur-xl"
                  style={{
                    width: Math.random() * 80 + 20,
                    height: Math.random() * 80 + 20,
                    left: `${Math.random() * 90}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    background: Math.random() > 0.5 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.3)'
                  }}
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: Math.random() * 4 + 2,
                    repeat: Infinity,
                  }}
                />
              ))}

              <div className="relative z-10 text-center bg-black/50 p-6 rounded-2xl border border-border backdrop-blur-sm">
                <p className="text-slate-300 font-medium mb-2">Simulación de Motor de Interacciones</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  En producción, este panel dibuja heatmaps sobre las vistas de los estudiantes y cruza los eventos del mouse con las alertas del EWS.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BehavioralAnalytics;
