import React, { useState } from 'react';
import { FileText, ZoomIn, ZoomOut, ChevronDown, ChevronUp, Download, Bookmark, Search } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-003: Lector Interactivo PDF

export const PDFViewer = () => {
  return (
    <div className="h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 border border-border rounded-2xl overflow-hidden bg-card/20 backdrop-blur-xl">
      
      {/* PDF Toolbar */}
      <div className="bg-background/80 p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Lectura_de_Silabo_2026.pdf</h3>
            <span className="text-xs text-muted-foreground">PÃ¡gina 1 de 12</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-border">
          <button className="p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium px-2 text-white">1</span>
          <button className="p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-white px-1">100%</span>
          <button className="p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          <button className="p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors">
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-md transition-colors ml-2 flex items-center gap-2">
            <Download className="w-4 h-4" /> <span className="text-xs font-bold hidden sm:inline">Descargar</span>
          </button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto bg-black/20 p-8 flex justify-center relative">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-3xl bg-white min-h-[1056px] shadow-2xl p-12 text-slate-900"
        >
          {/* Mock Document Content */}
          <div className="border-b-2 border-slate-200 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">SÃ­labo Oficial</h1>
            <p className="text-slate-500 font-medium mt-2">Semestre AcadÃ©mico 2026-I</p>
          </div>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-primary pl-3">1. Datos Generales</h2>
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                <p><strong>Asignatura:</strong> Arquitectura de Sistemas Educativos</p>
                <p><strong>CÃ³digo:</strong> EDU-401</p>
                <p><strong>CrÃ©ditos:</strong> 4</p>
                <p><strong>Horas Semanales:</strong> 6 horas</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-primary pl-3">2. Sumilla</h2>
              <p className="text-sm leading-relaxed text-slate-700 text-justify">
                La asignatura tiene naturaleza teÃ³rico-prÃ¡ctica. Su propÃ³sito es brindar al estudiante las capacidades para diseÃ±ar, evaluar e implementar infraestructuras tecnolÃ³gicas operacionales en instituciones de gran escala. Abarca temas como: Modelos HLS, motores adaptativos por IA, grafos de conocimiento y arquitecturas Zero Trust aplicadas a entornos de aprendizaje.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3 border-l-4 border-primary pl-3">3. Competencias</h2>
              <ul className="list-disc pl-5 text-sm space-y-2 text-slate-700">
                <li>DiseÃ±a arquitecturas monolÃ­ticas y distribuidas para entornos escolares.</li>
                <li>Implementa sistemas de Alerta Temprana (EWS) para predecir deserciÃ³n.</li>
                <li>Comprende los fundamentos legales de la Privacidad de Datos Estudiantiles (FERPA).</li>
              </ul>
            </section>
          </div>
          
          {/* Simulated Annotation/Highlight marker */}
          <div className="absolute top-[450px] right-20 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-sm border border-yellow-200 font-medium">
            Â¡Importante para el examen!
          </div>
          
        </motion.div>
      </div>

    </div>
  );
};

export default PDFViewer;

