import React, { useState } from 'react';
import { HeartPulse, Send, AlertTriangle, ShieldCheck, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// RF-063: Triage Salud Mental (Vista Estudiante)

export const TriageSaludMental = () => {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [showPanic, setShowPanic] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="text-rose-500 h-8 w-8" />
            Check-in Emocional
          </h2>
          <p className="text-muted-foreground mt-1">
            Tu espacio confidencial. Nadie verá esto excepto tu orientador.
          </p>
        </div>
        <button 
          onClick={() => setShowPanic(true)}
          className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/50 font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)]"
        >
          <AlertTriangle className="w-5 h-5" /> Necesito Ayuda Ahora
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8"
          >
            <div className="space-y-8">
              
              <div>
                <h3 className="text-xl font-bold text-white mb-6">¿Cómo te sientes hoy?</h3>
                <div className="flex justify-between px-2 mb-2 text-3xl">
                  <span>😢</span>
                  <span>😕</span>
                  <span>😐</span>
                  <span>🙂</span>
                  <span>😄</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="5" 
                  value={mood} 
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full accent-rose-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">Nivel de Energía / Estrés</h3>
                <div className="flex justify-between px-2 mb-2 text-xs font-bold text-slate-400">
                  <span>Agotado</span>
                  <span>Equilibrado</span>
                  <span>Con mucha energía</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="5" 
                  value={energy} 
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">¿Quieres contarme algo más? (Opcional)</h3>
                <textarea 
                  rows={4}
                  className="w-full bg-white/5 border border-border rounded-xl p-4 text-white focus:outline-none focus:border-rose-500/50 resize-none"
                  placeholder="Puedes escribir aquí lo que sientas..."
                />
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2"
              >
                <Send className="w-5 h-5" /> Enviar Check-in
              </button>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-12 text-center"
          >
            <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">¡Check-in Registrado!</h3>
            <p className="text-emerald-200/70 max-w-md mx-auto">
              Gracias por compartir cómo te sientes. Recuerda que el equipo de orientación está siempre aquí para ti.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panic Modal Overlay */}
      {showPanic && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--s3)] border border-rose-500/50 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.2)]"
          >
            <AlertTriangle className="w-20 h-20 text-rose-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">No estás solo.</h3>
            <p className="text-slate-300 mb-8">
              Estamos enviando una notificación prioritaria y confidencial a tu orientador. Se pondrán en contacto contigo hoy mismo.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowPanic(false)}
                className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { setShowPanic(false); setSubmitted(true); }}
                className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-500 transition shadow-[0_0_15px_rgba(244,63,94,0.4)]"
              >
                Confirmar Ayuda
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default TriageSaludMental;
