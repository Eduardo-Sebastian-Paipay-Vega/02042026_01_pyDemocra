import React from 'react';
import { AlertTriangle, Eye, ShieldAlert, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-040: Sensor Multimodal de Prevención de Bullying

export const SensorBullying = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-500 h-8 w-8" />
            Prevención Multimodal de Conflictos
          </h2>
          <p className="text-muted-foreground mt-1">
            Escáner pasivo (NLP) y análisis de grafos sociales para intervención temprana.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5" />
            2 Alertas Críticas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Triage Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-rose-500" /> Triage de Eventos
          </h3>
          
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500/20 text-rose-400 p-2 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Pico de toxicidad en Chat P2P</h4>
                  <p className="text-sm text-rose-200/60">Detectado hace 5 min • Grupo "Proyecto Historia"</p>
                </div>
              </div>
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">Riesgo 85%</span>
            </div>
            <div className="bg-black/40 border border-border p-4 rounded-xl mt-4">
              <p className="text-sm text-slate-300 italic mb-2">"...eres un inútil, sáquenlo del grupo, no aporta nada..."</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Vector: Aislamiento Social</span>
                <span>Alumnos implicados: 4</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
                Intervenir / Bloquear Chat
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-lg transition border border-border">
                Derivar a Psicología
              </button>
            </div>
          </div>

          <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 text-orange-400 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Caída abrupta de participación</h4>
                  <p className="text-sm text-orange-200/60">Análisis últimos 7 días • Estudiante #2045</p>
                </div>
              </div>
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">Riesgo 60%</span>
            </div>
            <div className="bg-black/40 border border-border p-4 rounded-xl mt-4">
              <p className="text-sm text-slate-300 mb-2">El estudiante dejó de interactuar en foros y ha bajado su tiempo de lectura en un 80%. Posible indicador temprano de exclusión o depresión leve.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="bg-white/5 hover:bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-lg transition border border-border">
                Agendar Tutoría
              </button>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Clima Institucional
          </h3>
          <div className="card p-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-400">
                94%
              </div>
              <div className="text-sm text-slate-400 mt-1">Índice de Convivencia Saludable</div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Mensajes Analizados (Hoy)</span>
                  <span className="text-white font-bold">14,520</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[100%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Falsos Positivos NLP</span>
                  <span className="text-white font-bold">1.2%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[5%]"></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-200">
                El modelo NLP está entrenado en lenguaje juvenil local para diferenciar bromas amistosas de ciberacoso real, protegiendo la privacidad de los usuarios (Zero-Knowledge).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SensorBullying;
