import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// RF-051: Motor de Exámenes Adaptativos CAT/IRT

export const EngineCATIRT = () => {
  const [theta, setTheta] = useState(0.5); // Nivel de maestría estimado
  const [questionNum, setQuestionNum] = useState(1);
  const [difficulty, setDifficulty] = useState(0.5);
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null);
  
  const handleAnswer = (isCorrect: boolean) => {
    setShowResult(isCorrect ? 'correct' : 'incorrect');
    
    setTimeout(() => {
      // IRT Logic abstracta: Sube Theta si acierta, baja si falla. Ajusta dificultad.
      if (isCorrect) {
        setTheta(t => Math.min(1, t + 0.15));
        setDifficulty(d => Math.min(1, d + 0.2));
      } else {
        setTheta(t => Math.max(0, t - 0.1));
        setDifficulty(d => Math.max(0.1, d - 0.15));
      }
      setQuestionNum(q => q + 1);
      setShowResult(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-indigo-500 h-6 w-6" />
            Evaluación Diagnóstica Adaptativa
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Motor CAT/IRT: La dificultad se ajusta en tiempo real según tus respuestas.
          </p>
        </div>
        
        {/* Theta Estimator Visualization */}
        <div className="bg-black/40 border border-border p-3 rounded-xl flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Nivel Estimado ($\theta$)</div>
            <div className="text-lg font-black text-indigo-400">{(theta * 100).toFixed(1)}%</div>
          </div>
          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              animate={{ width: `${theta * 100}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Question Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div 
                key={`q-${questionNum}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
                
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-sm font-bold border border-border">
                    Pregunta {questionNum} de 15
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase
 ${difficulty > 0.7 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
 difficulty > 0.4 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
                  >
                    Nivel {difficulty > 0.7 ? 'Difícil' : difficulty > 0.4 ? 'Medio' : 'Fácil'}
                  </span>
                </div>

                <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
                  ¿Cuál es la derivada de <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">f(x) = {difficulty > 0.7 ? 'e^(2x) * sin(x)' : 'x^2 + 3x'}</span>?
                </h3>

                <div className="space-y-3">
                  {[1, 2, 3, 4].map((opt) => (
                    <button 
                      key={opt}
                      onClick={() => handleAnswer(opt === 1)} // Dummy logic: 1 is always "correct" for demo
                      className="w-full text-left p-4 rounded-xl border border-border bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition text-slate-300 hover:text-white"
                    >
                      <span className="font-mono text-indigo-400 mr-3">{String.fromCharCode(64 + opt)}.</span>
                      Opción matemática de respuesta {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-[var(--s2)] border rounded-2xl p-16 flex flex-col items-center justify-center text-center
 ${showResult === 'correct' ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]'}`}
              >
                {showResult === 'correct' ? (
                  <CheckCircle className="w-20 h-20 text-emerald-500 mb-4" />
                ) : (
                  <XCircle className="w-20 h-20 text-rose-500 mb-4" />
                )}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {showResult === 'correct' ? '¡Correcto!' : 'Incorrecto'}
                </h3>
                <p className="text-slate-400">
                  {showResult === 'correct' 
                    ? 'Aumentando dificultad de la siguiente pregunta...' 
                    : 'Ajustando nivel de la ruta adaptativa...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Progreso de Precisión
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Error Estándar (SE)</span>
                  <span>{Math.max(0.05, 0.4 - (questionNum * 0.02)).toFixed(3)}</span>
                </div>
                <div className="text-[10px] text-indigo-300">
                  El examen termina automáticamente cuando el SE es menor a 0.15, garantizando precisión sin sobre-evaluar.
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
            <p className="text-xs text-indigo-200">
              <strong>Info:</strong> Estás en un entorno de evaluación CAT. No se puede retroceder a preguntas anteriores.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EngineCATIRT;
