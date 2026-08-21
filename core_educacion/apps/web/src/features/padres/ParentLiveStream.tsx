import React from 'react';
import { Activity, Bell, Heart, BookOpen, Clock, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-033: Parent-Engagement Portal (Live Stream de Progreso Diario)

const FEED_EVENTS = [
  { id: 1, type: 'achievement', title: 'Módulo Completado', desc: 'Lucas completó "Estructuras de Datos" con 95% de precisión.', time: 'Hace 10 min', icon: <Sparkles className="w-5 h-5 text-yellow-500" /> },
  { id: 2, type: 'mood', title: 'Estado de Ánimo Óptimo', desc: 'El sensor biométrico reporta un estado de "Flow" durante la clase de Matemáticas.', time: 'Hace 2 horas', icon: <Heart className="w-5 h-5 text-pink-500" /> },
  { id: 3, type: 'alert', title: 'Intervención EWS', desc: 'Demi AI detectó fatiga visual. Se sugirió y tomó una pausa activa de 15 min.', time: 'Ayer, 14:30', icon: <Activity className="w-5 h-5 text-blue-500" /> },
  { id: 4, type: 'academic', title: 'Nueva Tarea Asignada', desc: 'Proyecto Final de Historia subido al portal.', time: 'Ayer, 09:00', icon: <BookOpen className="w-5 h-5 text-purple-500" /> },
];

export const ParentLiveStream = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="text-pink-500 h-8 w-8" />
            Live Stream (Lucas)
          </h2>
          <p className="text-muted-foreground mt-1">
            Transmisión en tiempo real del progreso académico y estado cognitivo de tu hijo.
          </p>
        </div>
        <div className="px-4 py-2 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          Conectado al DTL
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-card/30 backdrop-blur-md rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-white">Feed de Actividad (Hoy)</h3>
            <button className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-border transition-colors">
              Filtrar
            </button>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {FEED_EVENTS.map((event, i) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                {/* Timeline Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-border card-inner shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                  {event.icon}
                </div>
                
                {/* Event Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border border-border bg-[var(--s2)] shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-200 text-sm">{event.title}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/>{event.time}</span>
                  </div>
                  <p className="text-sm text-slate-400">{event.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="bg-[var(--s2)] rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Estado General
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Nivel de Energía</span>
                  <span className="text-green-400 font-bold">Óptimo</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[85%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Carga Académica</span>
                  <span className="text-yellow-400 font-bold">Moderada</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[60%]"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-500/10 rounded-2xl border border-blue-500/20 p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-blue-300">Sugerencia de Demi</h4>
                <p className="text-xs text-blue-200/70 mt-1">
                  Lucas ha mostrado gran interés en Robótica hoy. Sugerimos preguntarle sobre su proyecto durante la cena para reforzar su engagement positivo.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParentLiveStream;
