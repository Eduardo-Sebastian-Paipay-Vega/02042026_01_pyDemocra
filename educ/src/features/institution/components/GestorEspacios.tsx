import React from 'react';
import { Map, MapPin, Users, Cpu, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

// RF-046: Gestor de Espacios FÃ­sicos Inteligente

const ESPACIOS = [
  { id: '101', type: 'aula', name: 'Aula 101', capacity: 30, occupied: 28, temp: 22, status: 'busy' },
  { id: '102', type: 'aula', name: 'Aula 102', capacity: 30, occupied: 0, temp: 21, status: 'free' },
  { id: 'lab1', type: 'lab', name: 'Lab. FÃ­sica', capacity: 20, occupied: 22, temp: 24, status: 'overcrowded' },
  { id: 'aud', type: 'auditorio', name: 'Auditorio', capacity: 200, occupied: 150, temp: 23, status: 'busy' },
  { id: 'cancha', type: 'deporte', name: 'Cancha 1', capacity: 50, occupied: 12, temp: 26, status: 'busy' },
];

export const GestorEspacios = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Map className="text-blue-500 h-8 w-8" />
            Gestor de Espacios FÃ­sicos
          </h2>
          <p className="text-muted-foreground mt-1">
            Plano arquitectÃ³nico vivo. OptimizaciÃ³n de aforos y alertas de superposiciÃ³n.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-[var(--s2)] border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Cpu className="w-5 h-5 animate-pulse" />
            AsignaciÃ³n AlgorÃ­tmica Activa
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap / Grid */}
        <div className="lg:col-span-2 card p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" /> Nivel 1 - Ala Sur
            </h3>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Libre</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Ocupado</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Sobrecupo</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {ESPACIOS.map(espacio => (
              <motion.div 
                key={espacio.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border relative overflow-hidden cursor-pointer
 ${espacio.status === 'free' ? 'bg-emerald-950/20 border-emerald-500/20' : ''}
 ${espacio.status === 'busy' ? 'bg-amber-950/20 border-amber-500/20' : ''}
 ${espacio.status === 'overcrowded' ? 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : ''}`}
              >
                {espacio.status === 'overcrowded' && (
                  <div className="absolute top-2 right-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  </div>
                )}
                
                <h4 className={`font-bold mb-1
 ${espacio.status === 'free' ? 'text-emerald-400' : ''}
 ${espacio.status === 'busy' ? 'text-amber-400' : ''}
 ${espacio.status === 'overcrowded' ? 'text-rose-400' : ''}`}>{espacio.name}</h4>
                
                <div className="flex items-center gap-4 text-sm mt-3">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">OcupaciÃ³n</span>
                    <span className="text-slate-200 font-medium">{espacio.occupied} / {espacio.capacity}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">Clima</span>
                    <span className="text-slate-200 font-medium">{espacio.temp}Â°C</span>
                  </div>
                </div>
                
                {/* Ocupation bar */}
                <div className="w-full h-1 bg-black/40 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full ${espacio.status === 'free' ? 'bg-emerald-500' : espacio.status === 'busy' ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, (espacio.occupied / espacio.capacity) * 100)}%` }}
                  ></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Panel de Alertas & Reservas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-rose-500 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" /> Alerta de SuperposiciÃ³n
            </h3>
            <p className="text-sm text-rose-200/80 mb-3">
              El <strong>Lab. FÃ­sica</strong> supera el aforo permitido (22/20) para el periodo actual. Se detectÃ³ falta de sillas.
            </p>
            <button className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded transition">
              Reasignar a Lab. QuÃ­mica (Libre)
            </button>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-purple-400" /> PrÃ³ximas Asignaciones
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-bold text-slate-200">ReuniÃ³n Docente</div>
                  <div className="text-xs text-slate-500">14:00 - Auditorio</div>
                </div>
                <div className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                  Confirmado
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-bold text-slate-200">Torneo Ajedrez</div>
                  <div className="text-xs text-slate-500">15:30 - Aula 102</div>
                </div>
                <div className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                  Pendiente
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 rounded-xl transition border border-border">
              Ver Horario Completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GestorEspacios;

