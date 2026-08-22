import React, { useState, useEffect } from 'react';
import { Camera, Mic, Monitor, AlertOctagon, UserCheck, ShieldAlert, History } from 'lucide-react';
import { motion } from 'motion/react';

// RF-052: Proctoring Multimodal IA

const STUDENTS = [
  { id: 1, name: 'Marcos R.', status: 'clean', flag: null, thumbnail: 'M' },
  { id: 2, name: 'Lucía P.', status: 'warning', flag: 'Mirada fuera de pantalla', thumbnail: 'L' },
  { id: 3, name: 'Sofía T.', status: 'clean', flag: null, thumbnail: 'S' },
  { id: 4, name: 'Diego A.', status: 'critical', flag: 'Segunda persona detectada', thumbnail: 'D' },
];

export const ProctoringIA = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Camera className="text-rose-500 h-8 w-8" />
            Centro de Proctoring IA
          </h2>
          <p className="text-muted-foreground mt-1">
            Vigilancia automatizada anti-copia con análisis de biometría y entorno.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-[0_0_15px_rgba(244,63,94,0.1)]">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            2 Alertas Activas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Camera Grid */}
        <div className="xl:col-span-3 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Examen: Cálculo III - Final</h3>
            <span className="text-xs text-slate-400 font-mono">18 / 20 Estudiantes Conectados</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STUDENTS.map(student => (
              <div 
                key={student.id} 
                className={`relative rounded-xl overflow-hidden border-2 transition
 ${student.status === 'clean' ? 'border-border' : 
 student.status === 'warning' ? 'border-amber-500/50' : 
 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}
              >
                {/* Fake Camera Feed */}
                <div className="aspect-video bg-black flex items-center justify-center relative">
                  <span className="text-4xl font-black text-white/10">{student.thumbnail}</span>
                  
                  {/* Overlay IA Bounding Box for criticals */}
                  {student.status === 'critical' && (
                    <motion.div 
                      className="absolute w-12 h-16 border-2 border-rose-500/80 rounded right-4 top-4 bg-rose-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md p-2 flex justify-between items-center border-t border-border">
                  <span className="text-xs font-bold text-white">{student.name}</span>
                  <div className="flex gap-1">
                    <Mic className={`w-3 h-3 ${student.status === 'critical' ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <Monitor className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>

                {/* Warning Tag */}
                {student.flag && (
                  <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded 
 ${student.status === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>
                    {student.flag}
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty slots */}
            {[...Array(4)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-video rounded-xl border-2 border-dashed border-border bg-white/5 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-slate-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-rose-500 flex items-center gap-2 mb-3">
              <AlertOctagon className="w-4 h-4" /> Intervención Requerida
            </h3>
            <p className="text-sm text-rose-200/80 mb-4">
              <strong>Diego A.</strong> - Múltiples rostros detectados en cámara durante los últimos 15 segundos.
            </p>
            <div className="space-y-2">
              <button className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded transition">
                Pausar Examen
              </button>
              <button className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-3 py-2 rounded transition border border-border">
                Enviar Mensaje Directo
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-blue-400" /> Log de Incidentes
            </h3>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="bg-amber-500/20 w-4 h-4 rounded-full border-2 border-border relative z-10 shrink-0"></div>
                <div className="w-full p-3 bg-white/5 rounded-xl border border-border ml-3">
                  <div className="text-[10px] text-amber-400 font-bold mb-1">10:15 AM - Lucía P.</div>
                  <div className="text-xs text-slate-300">Mirada fuera de pantalla prolongada (&gt;5s).</div>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="bg-emerald-500/20 w-4 h-4 rounded-full border-2 border-border relative z-10 shrink-0"></div>
                <div className="w-full p-3 bg-white/5 rounded-xl border border-border ml-3">
                  <div className="text-[10px] text-slate-400 font-bold mb-1">10:05 AM - Sistema</div>
                  <div className="text-xs text-slate-300">Reconocimiento facial biométrico completado. 18/20 verificados.</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProctoringIA;
