import React, { useState } from 'react';
import { BookOpen, TrendingUp, Download, Star, Share2, Filter, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

// RF-029: Repositorio de Recursos DidÃ¡cticos Calificados por Resultados

const RESOURCES = [
  { id: 1, title: 'Simulador DinÃ¡mico de Gravedad', type: 'WebGL', author: 'Prof. GarcÃ­a', impactScore: 9.2, downloads: 345, subjects: ['FÃ­sica'], isVerified: true },
  { id: 2, title: 'GuÃ­a Definitiva de Ecuaciones Dif.', type: 'PDF', author: 'Prof. Torres', impactScore: 8.7, downloads: 1200, subjects: ['MatemÃ¡ticas'], isVerified: true },
  { id: 3, title: 'Flashcards de Historia Universal', type: 'Anki', author: 'Prof. Mendoza', impactScore: 7.9, downloads: 210, subjects: ['Historia'], isVerified: false },
  { id: 4, title: 'Laboratorio Virtual: TitulaciÃ³n', type: 'Applet', author: 'Prof. Silva', impactScore: 9.8, downloads: 890, subjects: ['QuÃ­mica'], isVerified: true },
];

export const ResourceRepository = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-teal-500 h-8 w-8" />
            Repositorio DidÃ¡ctico
          </h2>
          <p className="text-muted-foreground mt-1">
            Materiales calificados por su impacto real en las notas de los alumnos (Algoritmo de AtribuciÃ³n).
          </p>
        </div>
        
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition font-medium shadow-lg shadow-teal-500/20">
          + Subir Recurso
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar materiales..." 
            className="w-full card rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-teal-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="card rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500 transition-colors">
          <option>Ordenar por Impacto (Alto a Bajo)</option>
          <option>Ordenar por Descargas</option>
          <option>MÃ¡s Recientes</option>
        </select>
      </div>

      {/* Resource List */}
      <div className="grid grid-cols-1 gap-4">
        {RESOURCES.map((resource, i) => (
          <motion.div 
            key={resource.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col md:flex-row md:items-center justify-between p-5 card hover:border-teal-500/50 rounded-2xl transition-all group"
          >
            <div className="flex items-start gap-4 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center text-teal-500 font-bold shrink-0">
                {resource.type}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {resource.title}
                  {resource.isVerified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {resource.author}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {resource.downloads} usos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Impact Score */}
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" /> Impacto Real
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-teal-400" style={{ width: `${(resource.impactScore / 10) * 100}%` }}></div>
                  </div>
                  <span className="font-bold text-green-400">{resource.impactScore}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition-colors border border-transparent hover:border-border">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg transition-colors border border-teal-500/20 hover:border-teal-500/40">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ResourceRepository;

