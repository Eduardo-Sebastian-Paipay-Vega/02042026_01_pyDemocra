import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, Wand2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// RF-023: Copiloto Docente Autónomo (Demi Widget)

export const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: '¡Hola! Soy Demi, tu copiloto docente. Puedo ayudarte a redactar un examen, analizar el riesgo de tus alumnos, o generar feedback automático. ¿Qué necesitas hoy?' }
  ]);

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/40 z-50 transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Sparkles className="w-8 h-8" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-slate-900 border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Demi AI</h3>
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md ${
 msg.role === 'ai' 
 ? 'bg-slate-800 text-slate-200 border border-border' 
 : 'bg-primary text-primary-foreground'
 }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Quick Actions (Suggestions) */}
              <div className="flex flex-wrap gap-2 mt-4 pt-2">
                <button className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-border rounded-full text-slate-300 transition-colors flex items-center gap-1">
                  <Wand2 className="w-3 h-3" /> Generar Quiz
                </button>
                <button className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-border rounded-full text-slate-300 transition-colors flex items-center gap-1">
                  <RefreshCcw className="w-3 h-3" /> Analizar EWS
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-border">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Escribe tu prompt para Demi..."
                  className="w-full bg-slate-800 border border-border rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistantWidget;
