import React, { useState } from 'react';
import { Users, Star, Clock, Gem, Calendar, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

// RF-028: Mercado Inter-Institucional de TutorÃ­as P2P

const MOCK_TUTORS = [
  { id: 1, name: 'Valeria S.', subject: 'CÃ¡lculo Avanzado', rating: 4.9, reviews: 34, xpLevel: 85, cost: 50, avatar: 'V', online: true },
  { id: 2, name: 'Diego R.', subject: 'FÃ­sica CuÃ¡ntica', rating: 4.7, reviews: 12, xpLevel: 72, cost: 40, avatar: 'D', online: false },
  { id: 3, name: 'Camila T.', subject: 'ProgramaciÃ³n en Python', rating: 5.0, reviews: 89, xpLevel: 98, cost: 75, avatar: 'C', online: true },
  { id: 4, name: 'Mateo P.', subject: 'Historia Universal', rating: 4.5, reviews: 8, xpLevel: 60, cost: 30, avatar: 'M', online: true },
];

export const P2PMarketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTutors = MOCK_TUTORS.filter(t => t.subject.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Users className="text-indigo-500 h-8 w-8" />
            TutorÃ­as P2P
          </h2>
          <p className="text-muted-foreground mt-1">
            Conecta con los mejores estudiantes de la red. Paga tus mentorÃ­as 1:1 usando EduTokens.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded-xl font-bold flex items-center gap-2">
            <Gem className="w-5 h-5" />
            <span>Mis EduTokens: 1,250</span>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition font-medium">
            Quiero ser Tutor
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar materia (ej: Ãlgebra, React, Historia)..." 
            className="w-full card rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="card p-3 rounded-xl hover:bg-white/5 transition-colors text-slate-300">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Tutors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTutors.map((tutor, i) => (
          <motion.div 
            key={tutor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5 hover:border-indigo-500/50 hover:bg-indigo-900/10 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg">
                  {tutor.avatar}
                </div>
                {tutor.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-border rounded-full"></div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                  {tutor.cost} <Gem className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-muted-foreground">/ 45 min</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{tutor.name}</h3>
              <p className="text-xs text-indigo-300 bg-indigo-500/10 inline-block px-2 py-1 rounded-md mt-1 border border-indigo-500/20">
                {tutor.subject}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-slate-200">{tutor.rating}</span>
                <span className="text-muted-foreground">({tutor.reviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${tutor.xpLevel}%` }}></div>
                </div>
                <span className="text-muted-foreground">Lv.{tutor.xpLevel}</span>
              </div>
            </div>

            <button className="w-full bg-white/5 hover:bg-indigo-600 text-white font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2 border border-border hover:border-transparent">
              <Calendar className="w-4 h-4" />
              Reservar SesiÃ³n
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default P2PMarketplace;

