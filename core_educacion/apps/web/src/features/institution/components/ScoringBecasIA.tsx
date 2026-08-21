import React from 'react';
import { GraduationCap, Award, Banknote, Scale, PieChart } from 'lucide-react';

// RF-060: Scoring de Becas IA

export const ScoringBecasIA = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Scale className="text-yellow-500 h-8 w-8" />
            AdjudicaciÃ³n de Becas IA
          </h2>
          <p className="text-muted-foreground mt-1">
            Scoring algorÃ­tmico libre de sesgos (AcadÃ©mico + SocioeconÃ³mico).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline de EvaluaciÃ³n */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Solicitudes en RevisiÃ³n</h3>
            <div className="space-y-2">
              <div className="bg-white/10 border border-yellow-500/50 p-3 rounded-xl cursor-pointer">
                <div className="font-bold text-sm text-white">Solicitud #4492</div>
                <div className="text-xs text-yellow-400 mt-1">Beca Excelencia (RenovaciÃ³n)</div>
              </div>
              <div className="bg-white/5 border border-border p-3 rounded-xl opacity-60">
                <div className="font-bold text-sm text-slate-300">Solicitud #4495</div>
                <div className="text-xs text-slate-500 mt-1">Beca SocioeconÃ³mica</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard de Scoring */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-xs font-bold text-yellow-500 mb-1 tracking-wider uppercase">AnÃ¡lisis AlgorÃ­tmico</div>
                <h3 className="text-2xl font-bold text-white">Candidato #4492 (AnÃ³nimo)</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">88/100</div>
                <div className="text-xs text-slate-400 font-bold">SCORE GLOBAL</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-2xl p-4 border border-border text-center">
                <GraduationCap className="w-6 h-6 text-sky-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">92 pts</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">MÃ©rito AcadÃ©mico</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-border text-center">
                <Banknote className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">85 pts</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Necesidad EconÃ³mica</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-border text-center">
                <Award className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">100 pts</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Comportamiento</div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-yellow-400 font-bold mb-1">Veredicto IA Sugerido</h4>
                <p className="text-sm text-yellow-200/80 max-w-sm">
                  Basado en el histÃ³rico de adjudicaciones y polÃ­ticas vigentes, el candidato cumple con el percentil superior. Se sugiere mantener el nivel de beca actual.
                </p>
              </div>
              <div className="text-center bg-yellow-500 text-foreground px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                <div className="text-sm font-black uppercase">Otorgar</div>
                <div className="text-3xl font-black">50%</div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-end">
              <button className="px-6 py-2 rounded-xl border border-border text-slate-300 font-bold hover:bg-white/5 transition">Rechazar Sugerencia</button>
              <button className="px-6 py-2 rounded-xl bg-white text-black font-bold shadow-lg hover:bg-slate-200 transition">Aprobar Beca (50%)</button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ScoringBecasIA;

