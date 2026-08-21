import React, { useState } from 'react';
import { Bell, FileText, CheckCircle2, Sparkles, Filter, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// RF-012 & RF-013: Hub de Avisos y Circulares

const NOTIFICATIONS = [
  { id: 1, type: 'alert', title: 'Alerta de Lluvia', desc: 'Se suspende la clase de Ed. FÃ­sica en el patio descubierto.', read: false, time: '10:00 AM' },
  { id: 2, type: 'circular', title: 'Circular #45: MatrÃ­cula 2027', desc: 'Proceso de admisiÃ³n regular y cronograma oficial.', read: true, time: 'Ayer' },
  { id: 3, type: 'alert', title: 'ReuniÃ³n Apoderados', desc: 'Recordatorio: ReuniÃ³n hoy a las 19:00 hrs vÃ­a Meet.', read: true, time: 'Ayer' },
];

export const CentroAvisos = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeNote, setActiveNote] = useState<number | null>(null);

  const filtered = NOTIFICATIONS.filter(n => filter === 'all' || !n.read);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Inbox className="text-blue-500 h-8 w-8" />
            Comunicaciones Oficiales
          </h2>
          <p className="text-muted-foreground mt-1">
            BuzÃ³n central de avisos, alertas y circulares firmadas.
          </p>
        </div>
        <div className="flex gap-2 card p-1 rounded-xl">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Todo
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${filter === 'unread' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            No LeÃ­dos <div className="w-2 h-2 rounded-full bg-blue-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inbox List */}
        <div className="lg:col-span-1 space-y-3">
          <AnimatePresence>
            {filtered.map(note => (
              <motion.div 
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveNote(note.id)}
                className={`p-4 rounded-xl border cursor-pointer transition flex gap-4
 ${activeNote === note.id ? 'bg-white/10 border-white/20' : 'bg-[var(--s2)] border-border hover:border-border'}
 ${!note.read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className={`mt-1 ${note.type === 'circular' ? 'text-purple-400' : 'text-amber-400'}`}>
                  {note.type === 'circular' ? <FileText className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${!note.read ? 'text-white' : 'text-slate-300'}`}>{note.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">{note.desc}</p>
                  <div className="text-[10px] text-slate-600 mt-2">{note.time}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No tienes mensajes nuevos.
            </div>
          )}
        </div>

        {/* Reader Viewer */}
        <div className="lg:col-span-2">
          {activeNote ? (
            <div className="card p-8 h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">
                    {NOTIFICATIONS.find(n => n.id === activeNote)?.type === 'circular' ? 'Documento Oficial' : 'Aviso Urgente'}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {NOTIFICATIONS.find(n => n.id === activeNote)?.title}
                  </h3>
                  <div className="text-xs text-slate-500">Emitido por: DirecciÃ³n General</div>
                </div>
                <button className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Marcar LeÃ­do
                </button>
              </div>

              {NOTIFICATIONS.find(n => n.id === activeNote)?.type === 'circular' && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Sparkles className="w-16 h-16 text-indigo-400" />
                  </div>
                  <h4 className="text-indigo-400 font-bold flex items-center gap-2 mb-2 text-sm">
                    <Sparkles className="w-4 h-4" /> Resumen DEMI (IA)
                  </h4>
                  <ul className="list-disc list-inside text-indigo-200/80 text-sm space-y-1 relative z-10">
                    <li>El proceso de matrÃ­cula inicia el 15 de Octubre.</li>
                    <li>Descuento del 10% para hermanos matriculados juntos.</li>
                    <li>DocumentaciÃ³n debe subirse al portal antes del 30 de Octubre.</li>
                  </ul>
                </div>
              )}

              <div className="prose prose-invert max-w-none text-slate-300 text-sm">
                <p>{NOTIFICATIONS.find(n => n.id === activeNote)?.desc}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Atentamente,<br/><strong>La DirecciÃ³n</strong></p>
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center text-slate-500">
              <Inbox className="w-16 h-16 mb-4 opacity-20" />
              <p>Selecciona un mensaje para leerlo</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CentroAvisos;

