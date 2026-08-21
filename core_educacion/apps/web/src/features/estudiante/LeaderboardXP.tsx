import React from 'react';
import { Trophy, ArrowUp, ArrowDown, Minus, Crown, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-006: Leaderboard y Rankings de XP en Tiempo Real

const mockLeaderboard = [
  { rank: 1, name: 'Elena R.', xp: 12450, change: 'up', avatar: 'ER' },
  { rank: 2, name: 'Tú', xp: 11200, change: 'same', avatar: 'TU', isCurrent: true },
  { rank: 3, name: 'Mateo C.', xp: 10800, change: 'down', avatar: 'MC' },
  { rank: 4, name: 'Sofía V.', xp: 9400, change: 'up', avatar: 'SV' },
  { rank: 5, name: 'Diego M.', xp: 8100, change: 'down', avatar: 'DM' },
];

export const LeaderboardXP = () => {
  return (
    <div className="bg-card/20 backdrop-blur-md rounded-2xl border border-border p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Ranking Global</h3>
            <p className="text-xs text-muted-foreground">Ciclo 2026-I (Top 5)</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(var(--primary),0.3)]">
          <Star className="w-3 h-3" /> Liga Diamante
        </div>
      </div>

      <div className="space-y-3">
        {mockLeaderboard.map((student, index) => (
          <motion.div 
            key={student.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
 student.isCurrent 
 ? 'bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]' 
 : 'bg-background/50 border border-border hover:bg-white/5'
 }`}
          >
            <div className="flex items-center gap-4">
              <div className={`font-bold w-6 text-center ${student.rank === 1 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                {student.rank === 1 ? <Crown className="w-5 h-5 mx-auto" /> : `#${student.rank}`}
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-border flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {student.avatar}
              </div>
              <span className={`font-semibold ${student.isCurrent ? 'text-primary' : 'text-foreground'}`}>
                {student.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="font-bold text-white font-mono tracking-tight">{student.xp.toLocaleString()} XP</span>
              <div className="w-6 flex justify-center">
                {student.change === 'up' && <ArrowUp className="w-4 h-4 text-green-500" />}
                {student.change === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                {student.change === 'same' && <Minus className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
        Ver Ranking Completo
      </button>

    </div>
  );
};

export default LeaderboardXP;
