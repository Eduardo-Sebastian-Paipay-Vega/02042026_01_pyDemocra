import React from 'react';
import { Medal, Shield, Zap, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-005: Otorgamiento AutomÃ¡tico de Badges e Insignias

const mockBadges = [
  { id: 1, name: 'Pionero', description: 'CompletÃ³ el MÃ³dulo 1 el primer dÃ­a', icon: <Medal className="w-8 h-8 text-yellow-400" />, color: 'from-yellow-900/50 to-yellow-600/20', border: 'border-yellow-500/30' },
  { id: 2, name: 'Imparable', description: 'Racha de 7 dÃ­as de estudio continuo', icon: <Zap className="w-8 h-8 text-blue-400" />, color: 'from-blue-900/50 to-blue-600/20', border: 'border-blue-500/30' },
  { id: 3, name: 'Erudito', description: 'Nota perfecta en 3 quizzes seguidos', icon: <BookOpen className="w-8 h-8 text-purple-400" />, color: 'from-purple-900/50 to-purple-600/20', border: 'border-purple-500/30' },
  { id: 4, name: 'GuardiÃ¡n', description: 'AyudÃ³ a 5 compaÃ±eros en el foro', icon: <Shield className="w-8 h-8 text-green-400" />, color: 'from-green-900/50 to-green-600/20', border: 'border-green-500/30' },
  { id: 5, name: 'PrecisiÃ³n', description: 'Cero errores en cÃ³digo de prueba', icon: <Target className="w-8 h-8 text-red-400" />, color: 'from-red-900/50 to-red-600/20', border: 'border-red-500/30' },
];

export const BadgesGallery = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Medallas y Logros
          </h2>
          <p className="text-muted-foreground text-sm mt-1">ColecciÃ³n de insignias obtenidas (RF-005)</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">5<span className="text-lg text-muted-foreground font-medium">/24</span></div>
          <div className="text-xs text-primary font-bold uppercase tracking-wider">Desbloqueadas</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {mockBadges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.05 }}
            className={`relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br ${badge.color} border ${badge.border} text-center group cursor-default`}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-colors"></div>
            
            <div className="mb-4 drop-shadow-lg transform transition-transform group-hover:scale-110">
              {badge.icon}
            </div>
            <h3 className="font-bold text-white text-sm mb-1">{badge.name}</h3>
            
            {/* Tooltip with description */}
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-2 w-48 p-2 bg-slate-800 text-xs text-white rounded-lg pointer-events-none shadow-xl border border-border z-10">
              {badge.description}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-border"></div>
            </div>
          </motion.div>
        ))}

        {/* Locked Badges Placeholder */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border bg-background/30 text-center opacity-50">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <span className="text-xl">ðŸ”’</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Sigue aprendiendo...</span>
        </div>
      </div>

    </div>
  );
};

export default BadgesGallery;

