import React from 'react';
import { Share2, Map, Lock, Unlock, CheckCircle2, Navigation, Compass, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-022: Dynamic Pathing (Re-configurador de Temarios por Grafo DAG)

const pathNodes = [
  { id: 1, title: 'Conceptos BÃ¡sicos', status: 'completed', x: 20, y: 50 },
  { id: 2, title: 'LÃ³gica Fundamental', status: 'current', x: 40, y: 30 },
  { id: 3, title: 'Estructuras de Control', status: 'locked', x: 60, y: 50 },
  { id: 4, title: 'Ruta Alternativa: MatemÃ¡ticas Discretas', status: 'suggested', x: 40, y: 70, isAI: true },
  { id: 5, title: 'Proyecto Final', status: 'locked', x: 85, y: 50 },
];

export const DynamicPathingMap = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Share2 className="text-primary h-8 w-8" />
            Dynamic Pathing (Grafo Adaptativo)
          </h2>
          <p className="text-muted-foreground mt-1">
            Tu ruta de aprendizaje se reconfigura en tiempo real segÃºn tu dominio (RF-022).
          </p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
          <Compass className="w-5 h-5" /> Explorador Activo
        </div>
      </div>

      <div className="bg-card/30 backdrop-blur-md rounded-2xl border border-border relative h-[500px] overflow-hidden flex items-center justify-center">
        
        {/* Background Grid Lines */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        {/* Connection Lines (Mocked SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path d="M 20% 50% L 40% 30% L 60% 50% L 85% 50%" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" strokeDasharray="10 5" />
          <path d="M 20% 50% L 40% 70% L 60% 50%" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="3" fill="none" strokeDasharray="5 5" />
        </svg>

        {/* Nodes */}
        {pathNodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.15, type: 'spring' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* AI Suggestion Indicator */}
            {node.isAI && (
              <div className="absolute -top-6 bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30 mb-2 whitespace-nowrap flex items-center gap-1 animate-pulse">
                <Share2 className="w-3 h-3" /> Ruta IA Sugerida
              </div>
            )}

            {/* Node Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-110 cursor-pointer ${
 node.status === 'completed' ? 'bg-green-500/20 border-2 border-green-500 text-green-500' :
 node.status === 'current' ? 'bg-primary/20 border-2 border-primary text-primary shadow-[0_0_30px_rgba(var(--primary),0.5)]' :
 node.status === 'suggested' ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400 border-dashed' :
 'bg-slate-800/80 border-2 border-border text-muted-foreground'
 }`}>
              {node.status === 'completed' && <CheckCircle2 className="w-8 h-8" />}
              {node.status === 'current' && <Navigation className="w-8 h-8 animate-pulse" />}
              {node.status === 'suggested' && <Map className="w-8 h-8" />}
              {node.status === 'locked' && (node.id === 5 ? <Trophy className="w-8 h-8" /> : <Lock className="w-8 h-8" />)}
            </div>

            {/* Node Title */}
            <div className={`mt-3 text-sm font-bold text-center max-w-[120px] ${
 node.status === 'locked' ? 'text-muted-foreground' : 'text-white drop-shadow-md'
 }`}>
              {node.title}
            </div>
          </motion.div>
        ))}

      </div>
    </div>
  );
};

export default DynamicPathingMap;

