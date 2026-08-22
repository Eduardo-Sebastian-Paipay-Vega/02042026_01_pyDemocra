import React, { useState } from 'react';
import { usePersistedState } from '@educ/hooks/usePersistedState';
import { MessageSquare, Send, Paperclip, Code, Bot, ShieldAlert } from 'lucide-react';

// RF-011: Chat Académico Supervisado

const INITIAL_MESSAGES = [
  { id: 1, sender: 'teacher', text: '¡Hola a todos! Recuerden que el trabajo de Álgebra se entrega mañana.', time: '09:00 AM' },
  { id: 2, sender: 'student', text: 'Profesor, ¿podemos usar la fórmula de Bhaskara?', time: '09:05 AM' },
  { id: 3, sender: 'teacher', text: 'Sí, es correcto. Les dejo un apunte.', time: '09:10 AM' },
  { id: 4, sender: 'ai', text: '🛡️ Mensaje automático: El chat ha sido moderado a las 10:00 AM para prevenir lenguaje inapropiado.', time: '10:00 AM', isSystem: true },
];

export const ChatAcademico = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = usePersistedState('chat_docente_input', '');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([...messages, { 
      id: Date.now(), 
      sender: 'student', 
      text: input, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-black/40 border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold">
            M4
          </div>
          <div>
            <h3 className="text-white font-bold leading-tight">Álgebra Matemática 4to B</h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 35 en línea
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
          <Bot className="w-4 h-4" /> Moderación IA Activa
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isSystem ? 'justify-center' : msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.isSystem ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-2 rounded-full flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {msg.text}
              </div>
            ) : (
              <div className={`max-w-[75%] rounded-2xl p-4 ${
 msg.sender === 'student' 
 ? 'bg-blue-600 text-white rounded-tr-sm' 
 : 'bg-white/10 text-slate-200 rounded-tl-sm'
 }`}>
                <div className="text-sm">{msg.text}</div>
                <div className={`text-[10px] mt-2 ${msg.sender === 'student' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.time}
                </div>
              </div>
            )}
            
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-black/40 border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <button type="button" className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-xl transition">
            <Paperclip className="w-5 h-5" />
          </button>
          <button type="button" className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-xl transition">
            <Code className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje al grupo..." 
            className="flex-1 bg-white/5 border border-border rounded-xl px-4 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition"
          />
          <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center justify-center">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatAcademico;
