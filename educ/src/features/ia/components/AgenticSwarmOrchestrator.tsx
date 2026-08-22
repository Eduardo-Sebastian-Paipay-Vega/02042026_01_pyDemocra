import React, { useState, useEffect } from 'react';
import { Network, Activity, Cpu, Bot, Zap, Shield, Database, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';

// RF-037: Agentic Swarm Orchestrator

const AGENTS = [
  { id: 'psych', name: 'Psicopedagogo IA', status: 'active', tasks: 14, icon: Bot, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { id: 'auditor', name: 'Auditor de Calidad', status: 'active', tasks: 3, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'curator', name: 'Curador de Contenido', status: 'active', tasks: 28, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'concierge', name: 'Concierge Estudiantil', status: 'idle', tasks: 0, icon: LayoutGrid, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
];

export const AgenticSwarmOrchestrator = () => {
  const [logs, setLogs] = useState<{id: number, msg: string, agent: string}[]>([]);

  useEffect(() => {
    const fakeEvents = [
      { msg: 'Detectada frustraciÃ³n en estudiante #482. Solicitando intervenciÃ³n.', agent: 'psych' },
      { msg: 'Buscando recurso kinestÃ©sico alternativo en base de datos.', agent: 'curator' },
      { msg: 'Recurso validado con 92% de efectividad histÃ³rica.', agent: 'auditor' },
      { msg: 'Notificando al docente sobre punto ciego en la lecciÃ³n actual.', agent: 'auditor' },
      { msg: 'Ajustando ruta dinÃ¡mica del alumno y agendando tutorÃ­a.', agent: 'psych' },
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < fakeEvents.length) {
        setLogs(prev => [{ id: Date.now(), ...fakeEvents[i] }, ...prev].slice(0, 8));
        i++;
      } else {
        i = 0; // loop
      }
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Network className="text-indigo-500 h-8 w-8" />
            Agentic Swarm Control
          </h2>
          <p className="text-muted-foreground mt-1">
            OrquestaciÃ³n en tiempo real del enjambre de agentes autÃ³nomos.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-[var(--s2)] border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <Activity className="w-5 h-5 animate-pulse" />
            Swarm Engine Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Agents Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {AGENTS.map((agent) => (
            <motion.div 
              key={agent.id}
              className={`bg-[var(--s2)] border ${agent.border} rounded-2xl p-6 relative overflow-hidden`}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${agent.bg} rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none`}></div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${agent.bg} ${agent.border} border`}>
                    <agent.icon className={`w-6 h-6 ${agent.color}`} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${agent.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {agent.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
                  <div className="text-sm text-slate-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> {agent.tasks} Tareas Activas
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Event Bus */}
        <div className="lg:col-span-1 card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-black/20 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Event Bus
            </h3>
            <span className="text-xs text-muted-foreground font-mono">RabbitMQ</span>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
            {logs.map((log) => {
              const a = AGENTS.find(x => x.id === log.agent);
              return (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id} 
                  className="bg-white/5 border border-border rounded-xl p-3 text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${a?.color} font-bold text-xs uppercase`}>{a?.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{(new Date(log.id)).toISOString().split('T')[1].substring(0,8)}</span>
                  </div>
                  <p className="text-slate-300 leading-tight">{log.msg}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgenticSwarmOrchestrator;

