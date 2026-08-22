import React from 'react';
import { Users, Swords, Trophy, Target, Star, Crown } from 'lucide-react';
import { motion } from 'motion/react';

// RF-045: Clanes P2P y Gamificación Social

const MEMBERS = [
  { name: 'Tú', role: 'Estratega', xp: 4500, avatar: 'T' },
  { name: 'Lucía P.', role: 'Analista', xp: 4200, avatar: 'L' },
  { name: 'Marcos R.', role: 'Creativo', xp: 3900, avatar: 'M' },
  { name: 'Sofía T.', role: 'Ejecutor', xp: 3850, avatar: 'S' },
];

export const ClanesP2P = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-red-900/40 via-orange-900/40 to-black border border-orange-500/20 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/20 transform rotate-3">
              <Swords className="w-12 h-12 text-white drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">División Oro</span>
                <span className="text-orange-300 text-sm flex items-center gap-1"><Star className="w-4 h-4 fill-orange-300" /> Rank #4</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">Los Pioneros</h2>
              <p className="text-orange-200/80 mt-1">Clan de balance cognitivo creado por la IA (4 miembros).</p>
            </div>
          </div>
          
          <div className="text-center bg-black/40 backdrop-blur-md border border-border p-4 rounded-2xl min-w-[200px]">
            <div className="text-sm text-slate-400 mb-1">XP del Clan</div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
              16,450
            </div>
            <div className="text-xs text-green-400 mt-1">+450 esta semana</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Members List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" /> Miembros del Clan
          </h3>
          <div className="card p-4 space-y-3">
            {MEMBERS.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-border flex items-center justify-center font-bold text-white">
                    {m.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{m.name}</div>
                    <div className="text-xs text-orange-300">{m.role}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-400">{m.xp} XP</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            *Equipo emparejado por algoritmo de complementariedad de estilos cognitivos.
          </p>
        </div>

        {/* Active Quests */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" /> Misiones Grupales Activas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <motion.div whileHover={{ scale: 1.02 }} className="card p-5 hover:border-orange-500/50 transition cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400 border border-orange-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                  +500 EduTokens
                </span>
              </div>
              <h4 className="font-bold text-white mb-2">Hackathon de Algoritmos</h4>
              <p className="text-sm text-slate-400 mb-4">Resuelvan 10 problemas de lógica algorítmica en equipo sin fallos críticos.</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Progreso: 6/10</span>
                  <span>60%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '60%' }}></div>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="card p-5 hover:border-blue-500/50 transition cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                  +1 Nivel Clan
                </span>
              </div>
              <h4 className="font-bold text-white mb-2">Dominio Histórico</h4>
              <p className="text-sm text-slate-400 mb-4">Todos los miembros deben completar el módulo de Revolución Industrial.</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Progreso: 3/4 miembros</span>
                  <span>75%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '75%' }}></div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ClanesP2P;
