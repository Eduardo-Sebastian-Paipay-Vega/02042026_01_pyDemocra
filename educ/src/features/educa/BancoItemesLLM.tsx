import React, { useState } from 'react';
import { Database, Sparkles, X, Check, Search, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// RF-054: Banco de Ãtemes Evaluativos LLM

export const BancoItemesLLM = () => {
  const [topic, setTopic] = useState('Estructura Celular');
  const [items, setItems] = useState([
    { id: 1, text: 'Â¿CuÃ¡l es la funciÃ³n principal de la mitocondria?', type: 'OpciÃ³n MÃºltiple', difficulty: 'FÃ¡cil', status: 'pending' },
    { id: 2, text: 'Explique cÃ³mo el proceso de Ã³smosis afecta a las cÃ©lulas vegetales en soluciones hipertÃ³nicas.', type: 'Desarrollo', difficulty: 'DifÃ­cil', status: 'pending' },
    { id: 3, text: 'Identifique la estructura celular responsable de empaquetar proteÃ­nas.', type: 'OpciÃ³n MÃºltiple', difficulty: 'Medio', status: 'pending' },
  ]);

  const activeItem = items.find(i => i.status === 'pending');

  const handleSwipe = (id: number, action: 'accept' | 'reject') => {
    setItems(items.map(i => i.id === id ? { ...i, status: action } : i));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Database className="text-emerald-500 h-8 w-8" />
            Generador de Ãtemes LLM
          </h2>
          <p className="text-muted-foreground mt-1">
            Prompting pedagÃ³gico. Genera, calibra y guarda preguntas con IA.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-4 h-4" /> DEMI Engine v4
          </div>
        </div>
      </div>

      {/* Prompt Area */}
      <div className="card p-2 pl-4 flex items-center gap-4 focus-within:border-indigo-500/50 transition">
        <Search className="w-5 h-5 text-slate-500" />
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 bg-transparent border-none text-white focus:outline-none"
          placeholder="Ej: RevoluciÃ³n Francesa, Ãlgebra Lineal..."
        />
        <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          Generar Lote
        </button>
      </div>

      {/* Tinder-style Swiper Area */}
      <div className="relative h-[400px] w-full max-w-lg mx-auto mt-12 perspective-1000">
        <AnimatePresence mode="popLayout">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute inset-0 card p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-border uppercase tracking-wider">
                  {activeItem.type}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase
 ${activeItem.difficulty === 'DifÃ­cil' ? 'bg-rose-500/10 text-rose-400' : 
 activeItem.difficulty === 'Medio' ? 'bg-amber-500/10 text-amber-400' : 
 'bg-emerald-500/10 text-emerald-400'}`}
                >
                  IRT: {activeItem.difficulty}
                </span>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <h3 className="text-xl font-medium text-white text-center leading-relaxed">
                  "{activeItem.text}"
                </h3>
              </div>

              <div className="flex justify-center gap-6 mt-8">
                <button 
                  onClick={() => handleSwipe(activeItem.id, 'reject')}
                  className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition group shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_25px_rgba(244,63,94,0.4)]"
                >
                  <X className="w-8 h-8 group-hover:scale-110 transition" />
                </button>
                <button 
                  onClick={() => handleSwipe(activeItem.id, 'accept')}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition group shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                >
                  <Check className="w-8 h-8 group-hover:scale-110 transition" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 card border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500"
            >
              <Database className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center font-medium">Lote revisado completamente.</p>
              <p className="text-xs mt-2 text-slate-600">Genera mÃ¡s Ã­temes o revisa el banco.</p>
              
              <button className="mt-6 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-bold transition">
                Ir al Banco Institucional <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default BancoItemesLLM;

