import React, { useState } from 'react';
import { GripVertical, Plus, BookOpen, Clock, Settings, FileText, Video, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-001: Creador Curricular Modular (Builder de Clases)

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz';
  duration: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

const mockModules: Module[] = [
  {
    id: 'mod-1',
    title: 'MÃ³dulo 1: IntroducciÃ³n a la Materia',
    lessons: [
      { id: 'les-1', title: 'Bienvenida al curso', type: 'video', duration: '15 min' },
      { id: 'les-2', title: 'Lectura de SÃ­labo', type: 'document', duration: '10 min' },
    ]
  },
  {
    id: 'mod-2',
    title: 'MÃ³dulo 2: Conceptos Fundamentales',
    lessons: [
      { id: 'les-3', title: 'El principio de todo', type: 'video', duration: '45 min' },
    ]
  }
];

export const CurriculumBuilder = () => {
  const [modules, setModules] = useState<Module[]>(mockModules);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-primary h-8 w-8" />
            Creador Curricular
          </h2>
          <p className="text-muted-foreground mt-1">
            DiseÃ±a la estructura de tu curso arrastrando y soltando mÃ³dulos y lecciones. (RF-001)
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-secondary/50 text-secondary-foreground rounded-lg hover:bg-secondary transition-colors font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" /> ConfiguraciÃ³n
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Builder Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Canvas */}
        <div className="xl:col-span-3 space-y-6">
          {modules.map((mod, modIndex) => (
            <motion.div 
              key={mod.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: modIndex * 0.1 }}
              className="bg-card/30 backdrop-blur-md border border-border rounded-xl overflow-hidden"
            >
              {/* Module Header */}
              <div className="bg-card/50 p-4 border-b border-border flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="cursor-grab text-muted-foreground hover:text-white transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{mod.title}</h3>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Lessons List */}
              <div className="p-4 space-y-3">
                {mod.lessons.map((lesson, lesIndex) => (
                  <motion.div 
                    key={lesson.id}
                    layout
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="cursor-grab text-muted-foreground hover:text-white transition-colors">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="p-2 bg-primary/10 text-primary rounded-md">
                        {lesson.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-foreground">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration}</span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:underline">
                        Editar
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                <button className="w-full mt-2 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Agregar LecciÃ³n
                </button>
              </div>
            </motion.div>
          ))}

          <button className="w-full py-4 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all flex items-center justify-center gap-2 font-semibold">
            <Plus className="w-5 h-5" /> Agregar Nuevo MÃ³dulo
          </button>
        </div>

        {/* Sidebar Toolkit */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-card/30 backdrop-blur-md border border-border rounded-xl p-5 sticky top-6">
            <h3 className="font-semibold text-white mb-4">Caja de Herramientas</h3>
            <div className="space-y-3">
              <div className="p-3 border border-border rounded-lg bg-background/50 hover:bg-white/5 cursor-grab transition-colors flex items-center gap-3">
                <Video className="text-blue-400 w-5 h-5" />
                <span className="text-sm font-medium">Video LecciÃ³n</span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-background/50 hover:bg-white/5 cursor-grab transition-colors flex items-center gap-3">
                <FileText className="text-orange-400 w-5 h-5" />
                <span className="text-sm font-medium">Documento PDF</span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-background/50 hover:bg-white/5 cursor-grab transition-colors flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-green-400 flex items-center justify-center text-green-400 text-[10px] font-bold">?</div>
                <span className="text-sm font-medium">Quiz / Examen</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2 uppercase font-bold tracking-wider">EstadÃ­sticas</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total MÃ³dulos</span>
                  <span className="font-bold text-white">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Lecciones</span>
                  <span className="font-bold text-white">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">DuraciÃ³n Est.</span>
                  <span className="font-bold text-white">1h 10m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CurriculumBuilder;

