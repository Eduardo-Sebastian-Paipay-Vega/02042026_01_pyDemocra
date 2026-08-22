import React from 'react';
import { Wallet, TrendingUp, Calculator, CheckCircle2 } from 'lucide-react';

// RF-056: Nómina Docente Inteligente

export const NominaInteligente = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-emerald-500 h-8 w-8" />
            Nómina Docente Inteligente
          </h2>
          <p className="text-muted-foreground mt-1">
            Cálculo de horas lectivas, bonos gamificados e integración ERP.
          </p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Calculator className="w-5 h-5" /> Procesar Mes (Agosto)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel Resumen */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Proyección Nómina</h3>
            <div className="text-4xl font-black text-white mb-2">$ 142,500</div>
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 mb-6">
              <TrendingUp className="w-4 h-4" /> +4.2% vs Mes Anterior (Bonos)
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Salario Base</span>
                <span className="text-white font-bold">$ 120,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Horas Extra / Reemplazos</span>
                <span className="text-white font-bold">$ 8,500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400 font-bold">Bonos (Gamificación)</span>
                <span className="text-emerald-400 font-bold">$ 14,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalle por Docente */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-white mb-6">Desglose Individual</h3>
            
            <div className="space-y-4">
              
              {/* Docente 1 */}
              <div className="bg-white/5 border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold">RM</div>
                  <div>
                    <div className="font-bold text-white">Prof. Roberto Mendoza</div>
                    <div className="text-xs text-slate-400">Matemáticas - Nivel Secundario</div>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Base (140h)</div>
                    <div className="text-sm font-bold text-slate-300">$ 2,800</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">Bono Mentoría</div>
                    <div className="text-sm font-bold text-emerald-400">+$ 400</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Neto</div>
                    <div className="text-lg font-bold text-white">$ 3,200</div>
                  </div>
                </div>
              </div>

              {/* Docente 2 */}
              <div className="bg-white/5 border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold">MV</div>
                  <div>
                    <div className="font-bold text-white">Prof. María Vargas</div>
                    <div className="text-xs text-slate-400">Ciencias / Robótica</div>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Base (120h)</div>
                    <div className="text-sm font-bold text-slate-300">$ 2,400</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">Bono Proyectos</div>
                    <div className="text-sm font-bold text-emerald-400">+$ 600</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Neto</div>
                    <div className="text-lg font-bold text-white">$ 3,000</div>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end">
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Exportar a SAP ERP
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NominaInteligente;
