import React, { useState } from 'react';
import { MessageCircle, ShieldCheck, Heart, Share2, Sparkles, AlertOctagon } from 'lucide-react';

// RF-064: Red Social Segura Institucional

export const RedSocialSegura = () => {
  const [post, setPost] = useState('');
  const [warning, setWarning] = useState(false);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPost(text);
    // Simulación de Sensor de Bullying NLP
    if (text.toLowerCase().includes('tonto') || text.toLowerCase().includes('idiota')) {
      setWarning(true);
    } else {
      setWarning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="text-sky-500 h-8 w-8" />
            Comunidad EDUCIA
          </h2>
          <p className="text-muted-foreground mt-1">
            Espacio seguro para compartir logros, proyectos y preguntas.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 text-emerald-400 text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="w-4 h-4" /> Entorno Moderado por IA
        </div>
      </div>

      {/* Post Composer */}
      <div className={`bg-[var(--s2)] border ${warning ? 'border-rose-500/50' : 'border-border'} rounded-2xl p-4 transition-colors`}>
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-full shrink-0 flex items-center justify-center text-white font-bold">
            TÚ
          </div>
          <div className="flex-1 space-y-3">
            <textarea 
              value={post}
              onChange={handleTyping}
              className="w-full bg-transparent text-white focus:outline-none resize-none placeholder:text-slate-600 min-h-[80px]"
              placeholder="Comparte un proyecto, haz una pregunta a la comunidad..."
            />
            
            {warning && (
              <div className="bg-rose-500/10 text-rose-400 p-2 rounded-lg text-xs font-bold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" /> 
                El analizador detectó lenguaje inapropiado. Por favor, mantén el respeto.
              </div>
            )}

            <div className="flex justify-between items-center border-t border-border pt-3">
              <div className="flex gap-2">
                <button className="text-slate-500 hover:text-sky-400 transition"><Sparkles className="w-5 h-5" /></button>
              </div>
              <button 
                disabled={post.length === 0 || warning}
                className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-6 py-2 rounded-xl transition"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        
        {/* Post 1 */}
        <div className="card p-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              MV
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white">María Vargas</span>
                <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">Club de Robótica</span>
                <span className="text-xs text-slate-500">hace 2h</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                ¡Terminamos el prototipo del brazo robótico impreso en 3D! 🤖 Gran trabajo equipo. Si alguien de 4to año quiere unirse al club, tenemos 2 cupos abiertos.
              </p>
              <div className="w-full h-48 bg-slate-800 rounded-xl mb-4 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=800&auto=format&fit=crop)' }}></div>
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-1.5 text-rose-400 text-sm font-bold"><Heart className="w-5 h-5 fill-rose-400" /> 24</button>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-bold"><MessageCircle className="w-5 h-5" /> 5</button>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-bold ml-auto"><Share2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Post 2 */}
        <div className="card p-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              Prof.
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-amber-400">Prof. Jiménez</span>
                <span className="text-xs text-slate-500">hace 5h</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Excelente debate hoy en clase sobre el cambio climático. Adjunto los apuntes generados por la IA en el repositorio de 5to A.
              </p>
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-bold"><Heart className="w-5 h-5" /> 12</button>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-bold"><MessageCircle className="w-5 h-5" /> 0</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RedSocialSegura;
