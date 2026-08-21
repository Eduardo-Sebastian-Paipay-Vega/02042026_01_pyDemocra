import React from 'react';
import { HeartHandshake, MapPin, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-069: Aprendizaje-Servicio (Community Service)

export const AprendizajeServicio = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="text-emerald-500 h-8 w-8" />
            Aprendizaje y Servicio Comunitario
          </h2>
          <p className="text-muted-foreground mt-1">
            Encuentra proyectos de voluntariado y suma horas sociales.
          </p>
        </div>
        <div className="card px-6 py-2 rounded-xl flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Tus Horas (Semestre)</span>
          <span className="text-2xl font-black text-emerald-400">45 / 60h</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Proyecto 1 */}
        <div className="card overflow-hidden group hover:border-emerald-500/50 transition duration-300">
          <div className="h-40 w-full bg-slate-800 relative bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop)' }}>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-xs flex items-center gap-1 border border-border">
              <Award className="w-3 h-3 text-emerald-400" /> +15 hrs
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-2">Reforestación Valle Sur</h3>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              Únete a la brigada ecológica del colegio para plantar 500 árboles nativos en la zona deforestada del valle.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-6">
              <MapPin className="w-4 h-4" /> Valle Sur (Transporte Incluido)
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition">
              Inscribirme
            </button>
          </div>
        </div>

        {/* Proyecto 2 */}
        <div className="card overflow-hidden group hover:border-sky-500/50 transition duration-300">
          <div className="h-40 w-full bg-slate-800 relative bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop)' }}>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-xs flex items-center gap-1 border border-border">
              <Award className="w-3 h-3 text-sky-400" /> +10 hrs
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-2">Tutoría a Primaria (Matemáticas)</h3>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              Apoya a los alumnos de 4to grado con sus tareas de matemáticas en horario extracurricular.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-6">
              <MapPin className="w-4 h-4" /> Biblioteca Central (Virtual/Presencial)
            </div>
            <button className="w-full bg-white/5 border border-border text-slate-300 cursor-not-allowed font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Ya estás inscrito
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AprendizajeServicio;
