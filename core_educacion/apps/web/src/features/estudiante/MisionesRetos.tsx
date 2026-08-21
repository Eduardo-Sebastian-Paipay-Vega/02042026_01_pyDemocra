import React from 'react';
import { Target, Star, Flame, Trophy, CheckCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-007: Misiones, Desafíos y Retos Semanales

const MISSIONS = [
  { id: 1, title: 'Lector Voraz', desc: 'Lee 30 minutos sin interrupciones.', type: 'daily', xp: 50, progress: 30, target: 30, completed: true },
  { id: 2, title: 'Maestro Derivadas', desc: 'Acierta 5 derivadas seguidas.', type: 'daily', xp: 100, progress: 3, target: 5, completed: false },
  { id: 3, title: 'Ayudante', desc: 'Responde una duda en el foro P2P.', type: 'weekly', xp: 250, progress: 0, target: 1, completed: false },
];

export const MisionesRetos = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Target className="text-amber-500 h-8 w-8" />
            Misiones y Retos
          </h2>
          <p className="text-muted-foreground mt-1">
            Completa desafíos diarios para ganar XP y EduTokens.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-orange-400">Racha: 12 Días</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Misiones */}
        <div className="lg:col-span-2 space-y-4">
          
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Retos Diarios
          </h3>
          
          {MISSIONS.filter(m => m.type === 'daily').map(m => (
            <div key={m.id} className={`bg-[var(--s2)] border rounded-2xl p-5 flex items-center justify-between transition
 ${m.completed ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-border hover:border-border'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center
 ${m.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}
                >
                  {m.completed ? <CheckCircle className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className={`font-bold ${m.completed ? 'text-emerald-400 line-through' : 'text-white'}`}>{m.title}</h4>
                  <p className="text-sm text-slate-400">{m.desc}</p>
                </div>
              </div>
              
              <div className="text-right w-32">
                <div className="text-sm font-bold text-amber-400 mb-2">+{m.xp} XP</div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${m.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.progress / m.target) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{m.progress} / {m.target}</div>
              </div>
            </div>
          ))}

          <h3 className="font-bold text-white mb-2 mt-8 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" /> Retos Semanales
          </h3>

          {MISSIONS.filter(m => m.type === 'weekly').map(m => (
            <div key={m.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{m.title}</h4>
                  <p className="text-sm text-slate-400">{m.desc}</p>
                </div>
              </div>
              
              <div className="text-right w-32">
                <div className="text-sm font-bold text-purple-400 mb-2">+{m.xp} XP</div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-0" />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">0 / {m.target}</div>
              </div>
            </div>
          ))}
          
        </div>

        {/* Battle Pass / Rewards */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-[var(--s3)] to-[var(--s2)] border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            
            <h3 className="font-bold text-white text-lg mb-6">Pase de Temporada</h3>
            
            <div className="space-y-6">
              {[1, 2, 3].map((level) => (
                <div key={level} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10
 ${level === 1 ? 'bg-amber-500 text-black' : 'card text-slate-500'}`}
                    >
                      {level}
                    </div>
                    {level !== 3 && <div className="w-0.5 h-12 bg-white/10 mt-2" />}
                  </div>
                  
                  <div className={`flex-1 p-3 rounded-xl border flex items-center justify-between
 ${level === 1 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-border'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black/50 rounded-lg flex items-center justify-center">
                        {level === 1 ? '🎁' : <Lock className="w-4 h-4 text-slate-600" />}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${level === 1 ? 'text-amber-400' : 'text-slate-500'}`}>Cofre Épico</div>
                        <div className="text-[10px] text-slate-500">1000 XP Requeridos</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default MisionesRetos;
