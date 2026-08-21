import React from 'react';
import { Settings, Cpu, Thermometer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-059: Mantenimiento Predictivo IoT

export const MantenimientoPredictivo = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Settings className="text-slate-400 h-8 w-8" />
            Infraestructura y Mantenimiento IoT
          </h2>
          <p className="text-muted-foreground mt-1">
            Red de sensores distribuidos. Prevención de fallos predictiva mediante IA.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck className="w-5 h-5" /> Sistema Optimizado
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Servidores */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500/20 p-3 rounded-xl"><Cpu className="text-sky-400 w-6 h-6" /></div>
              <h3 className="font-bold text-white">Data Center Local</h3>
            </div>
            <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span>Uso CPU M1 (Inferencia AI)</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-sky-500 h-2 rounded-full w-[45%]"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span>Temperatura</span>
                <span className="text-emerald-400">38°C</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full w-[38%]"></div></div>
            </div>
          </div>
        </div>

        {/* HVAC */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-3 rounded-xl"><Thermometer className="text-amber-400 w-6 h-6" /></div>
              <h3 className="font-bold text-white">Climatización (HVAC)</h3>
            </div>
            <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
          </div>
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" /> Alerta Predictiva
              </div>
              <p className="text-xs text-amber-200/70">
                Filtro HEPA Pabellón A (Piso 2) al 85% de saturación. Se requiere reemplazo en 4 días para mantener eficiencia.
              </p>
            </div>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-lg text-xs transition border border-border">
              Generar Orden de Trabajo (WO)
            </button>
          </div>
        </div>

        {/* Proyectores/Aulas */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-rose-500/20 p-3 rounded-xl"><Settings className="text-rose-400 w-6 h-6" /></div>
              <h3 className="font-bold text-white">Equipamiento Aulas</h3>
            </div>
            <span className="flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>
          </div>
          <div className="space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" /> Fallo Inminente
              </div>
              <p className="text-xs text-rose-200/70">
                Proyector Aula 3B (Lámpara al 98% de vida útil). Probabilidad de fallo en la próxima semana: 95%.
              </p>
            </div>
            <button className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs transition">
              Despachar Técnico Hoy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MantenimientoPredictivo;
