import React from 'react';
import { Tent, Users, Calendar, MessageSquare } from 'lucide-react';

// RF-070: Clubes Co-curriculares

export const ClubesInstitucionales = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Tent className="text-indigo-500 h-8 w-8" />
            Clubes Co-curriculares
          </h2>
          <p className="text-muted-foreground mt-1">
            Explora, Ãºnete y gestiona tus actividades extracurriculares.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Mis Clubes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Mis Clubes</h3>
            
            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl cursor-pointer">
                <div className="font-bold text-indigo-400">Club de Debate</div>
                <div className="text-xs text-indigo-300/70 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> 24 Miembros
                </div>
              </div>
              <div className="bg-white/5 border border-border p-4 rounded-2xl cursor-pointer hover:bg-white/10 transition">
                <div className="font-bold text-slate-300">RobÃ³tica Avanzada</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> 12 Miembros
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white border border-border font-bold py-3 rounded-xl transition text-sm">
              + Fundar Nuevo Club
            </button>
          </div>
        </div>

        {/* Workspace del Club */}
        <div className="lg:col-span-3">
          <div className="card p-8">
            
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-border">
              <div>
                <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 mb-3 inline-block">
                  Workspace Activo
                </span>
                <h3 className="text-3xl font-bold text-white mb-2">Club de Debate (Modelo ONU)</h3>
                <p className="text-slate-400 max-w-xl">PreparaciÃ³n para el torneo regional. DiscusiÃ³n de polÃ­ticas internacionales y oratoria.</p>
              </div>
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-border flex items-center justify-center text-xs font-bold text-white">
                    U{i}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              
              {/* PrÃ³ximos Eventos */}
              <div className="bg-white/5 border border-border rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-400" /> PrÃ³ximas Reuniones
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-sky-500/20 text-sky-400 text-center rounded-xl p-2 min-w-[60px]">
                      <div className="text-xs font-bold uppercase">Vie</div>
                      <div className="text-xl font-black">24</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-300 text-sm">Simulacro de ComitÃ© OMS</div>
                      <div className="text-xs text-slate-500">15:00 - Auditorio Principal</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foro RÃ¡pido */}
              <div className="bg-white/5 border border-border rounded-2xl p-6">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" /> Foro del Club
                </h4>
                <div className="space-y-3 mb-4 h-32 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent z-10 pointer-events-none"></div>
                  <div className="text-sm">
                    <span className="font-bold text-indigo-400">Ana (Presidenta):</span> <span className="text-slate-300">Chicos, recuerden leer el dossier de resoluciones para maÃ±ana.</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-sky-400">Marcos:</span> <span className="text-slate-300">Â¿Alguien tiene el enlace al documento de economÃ­a?</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Escribe al club..." className="flex-1 bg-white/5 border border-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ClubesInstitucionales;

