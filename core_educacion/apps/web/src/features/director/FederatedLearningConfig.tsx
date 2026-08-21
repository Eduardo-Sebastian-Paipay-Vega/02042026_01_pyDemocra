import React from 'react';
import { Network, Database, ShieldCheck, Cpu, Globe, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-027: Federated Learning (Entrenamiento Privado Distribuido)
// RF-030: Panel Comparativo de Benchmarking Sectorial Anónimo

export const FederatedLearningConfig = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Globe className="text-blue-500 h-8 w-8" />
            Federated Learning & Benchmarking
          </h2>
          <p className="text-muted-foreground mt-1">
            Entrenamiento de IA descentralizado con otros colegios manteniendo privacidad total (Zero-Knowledge).
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          Nodo Activo
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Node Status & Config */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-6">
              <Network className="w-5 h-5 text-blue-400" />
              Estado de la Red Descentralizada
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-200">Pesos del Modelo Local</div>
                    <div className="text-xs text-muted-foreground">Última sincronización: Hace 14 min</div>
                  </div>
                </div>
                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded">Sincronizado</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-200">Privacidad Diferencial</div>
                    <div className="text-xs text-muted-foreground">Cifrado Homomórfico Activo</div>
                  </div>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded">Aes-256</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition border border-border flex items-center justify-center gap-2">
                <Cpu className="w-4 h-4" />
                Forzar Entrenamiento de Pesos
              </button>
            </div>
          </div>
        </div>

        {/* Benchmarking Anonymous */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            Benchmarking Sectorial Anónimo
          </h3>

          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Tasa de Deserción Escolar (Anual)</span>
                <span className="text-green-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Mejor que el 85%</span>
              </div>
              <div className="relative h-6 bg-black/50 rounded-full border border-border overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500/20 to-red-500/40 border-r border-red-500/50" style={{ width: '42%' }}></div>
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 border-r-2 border-white shadow-[0_0_10px_rgba(34,197,94,0.5)] z-10" style={{ width: '12%' }}></div>
                
                <div className="absolute w-full h-full flex justify-between items-center px-4 text-[10px] text-white/50">
                  <span>Tu Colegio (1.2%)</span>
                  <span>Promedio Red (4.2%)</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Promedio de Impacto en Matemáticas</span>
                <span className="text-blue-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Top 10%</span>
              </div>
              <div className="relative h-6 bg-black/50 rounded-full border border-border overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500/20 to-blue-500/40 border-r border-blue-500/50" style={{ width: '65%' }}></div>
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 border-r-2 border-white shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-200">
              Al participar en el consorcio de <span className="font-bold">Federated Learning</span>, el motor predictivo de tu colegio se enriquece de la inteligencia colectiva sin exponer datos sensibles de tus estudiantes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

// Necesito importar BarChart2 arriba, lo simulo aquí para arreglar lucide-react si falta.
import { BarChart2 } from 'lucide-react';

export default FederatedLearningConfig;
