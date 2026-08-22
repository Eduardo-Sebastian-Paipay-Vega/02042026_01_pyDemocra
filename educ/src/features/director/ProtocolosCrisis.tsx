import React, { useState } from 'react';
import { ShieldAlert, BellRing, Lock, Users, AlertOctagon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// RF-061: Protocolos de Crisis y Evacuación (Centro de Comando)

export const ProtocolosCrisis = () => {
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  const protocols = [
    { id: 'earthquake', title: 'Sismo / Terremoto', color: 'amber', icon: AlertOctagon },
    { id: 'lockdown', title: 'Lockdown (Intrusión)', color: 'rose', icon: Lock },
    { id: 'fire', title: 'Incendio', color: 'orange', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-500 h-8 w-8" />
            Centro de Comando & Crisis
          </h2>
          <p className="text-muted-foreground mt-1">
            Despliegue táctico de protocolos de emergencia (IoT + Push + RFID).
          </p>
        </div>
        {activeProtocol && (
          <div className="bg-rose-500 animate-pulse text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <BellRing className="w-5 h-5" /> PROTOCOLO ACTIVO
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Disparadores de Protocolo */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Activar Protocolo</h3>
            
            <div className="space-y-4">
              {protocols.map((p) => {
                const Icon = p.icon;
                const isActive = activeProtocol === p.id;
                return (
                  <button 
                    key={p.id}
                    onClick={() => setActiveProtocol(isActive ? null : p.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                      ${isActive 
                        ? `bg-${p.color}-500/20 border-${p.color}-500 shadow-[0_0_20px_rgba(var(--tw-color-${p.color}-500),0.3)]` 
                        : 'bg-white/5 border-border hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isActive ? `bg-${p.color}-500/30 text-${p.color}-400` : 'bg-white/10 text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-bold ${isActive ? `text-${p.color}-400` : 'text-slate-300'}`}>{p.title}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Acciones del Protocolo (Condicional) */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeProtocol ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--s2)] border border-rose-500/50 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.1)]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse"></div>
                
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <AlertOctagon className="text-rose-500 w-8 h-8" />
                  Ejecutando Acciones (LOCKDOWN)
                </h3>

                <div className="space-y-4">
                  
                  <div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Lock className="w-6 h-6 text-emerald-400" />
                      <div>
                        <div className="font-bold text-white">Bloqueo RFID (IoT)</div>
                        <div className="text-xs text-slate-400">Todas las puertas exteriores bloqueadas automáticamente.</div>
                      </div>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Completado</span>
                  </div>

                  <div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <BellRing className="w-6 h-6 text-sky-400" />
                      <div>
                        <div className="font-bold text-white">Notificación Push (App Padres)</div>
                        <div className="text-xs text-slate-400">Aviso enviado a 1,240 dispositivos móviles.</div>
                      </div>
                    </div>
                    <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-xs font-bold">Enviado</span>
                  </div>

                  <div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Users className="w-6 h-6 text-amber-400" />
                      <div>
                        <div className="font-bold text-white">Check-in de Asistencia (Profesores)</div>
                        <div className="text-xs text-slate-400">Esperando confirmación de zonas seguras vía Smartwatch.</div>
                      </div>
                    </div>
                    <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">34/45 Aulas OK</span>
                  </div>

                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setActiveProtocol(null)}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition"
                  >
                    Desactivar Protocolo (All Clear)
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-8 h-full flex flex-col items-center justify-center text-center opacity-50"
              >
                <ShieldCheck className="w-24 h-24 text-emerald-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Sistema en Estado Nominal</h3>
                <p className="text-slate-400 max-w-sm">No hay protocolos de emergencia activos. Selecciona un protocolo a la izquierda en caso de crisis.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default ProtocolosCrisis;
