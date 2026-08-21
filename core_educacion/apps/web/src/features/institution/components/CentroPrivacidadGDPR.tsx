import React from 'react';
import { ShieldCheck, History, Eye, UserX, AlertTriangle, Lock } from 'lucide-react';

// RF-020: Cumplimiento GDPR / FERPA
// RF-062: Audit Trail Inmutable

export const CentroPrivacidadGDPR = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-500 h-8 w-8" />
            Privacidad & Audit Trail
          </h2>
          <p className="text-muted-foreground mt-1">
            GestiÃ³n de Cumplimiento GDPR/FERPA y registro de auditorÃ­a inmutable.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance (RF-020) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" /> Compliance
            </h3>

            <div className="space-y-4">
              <button className="w-full bg-white/5 hover:bg-white/10 border border-border p-4 rounded-xl transition text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <UserX className="w-5 h-5 text-rose-500" />
                  <span className="font-bold text-sm text-white group-hover:text-rose-400 transition">Derecho al Olvido</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  EliminaciÃ³n segura y purga de registros de estudiantes retirados (GDPR Art. 17).
                </p>
              </button>
              
              <button className="w-full bg-white/5 hover:bg-white/10 border border-border p-4 rounded-xl transition text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition">Consentimiento de Padres</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  GestiÃ³n de firmas digitales para FERPA y uso de datos de menores.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Audit Trail Inmutable (RF-062) */}
        <div className="lg:col-span-2">
          <div className="card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" /> Audit Trail (Inmutable)
              </h3>
              <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> SHA-256 Activo
              </div>
            </div>

            <div className="space-y-3">
              {[
                { time: '12:45 PM', user: 'Director A.', action: 'ExportÃ³ reporte consolidado contable S1', level: 'high' },
                { time: '11:20 AM', user: 'Docente M.', action: 'ModificÃ³ calificaciÃ³n de MatemÃ¡ticas', level: 'medium' },
                { time: '10:05 AM', user: 'Padre C.', action: 'AccediÃ³ a informe psicolÃ³gico', level: 'low' },
                { time: '09:00 AM', user: 'Sistema', action: 'Purga GDPR ejecutada para ID #4592', level: 'high' },
                { time: 'Ayer', user: 'Docente P.', action: 'VisualizÃ³ perfil vocacional DTL', level: 'low' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-border text-sm items-start">
                  <div className="text-slate-500 text-xs mt-0.5 w-16 shrink-0">{log.time}</div>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
 log.level === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 
 log.level === 'medium' ? 'bg-amber-500' : 'bg-slate-500'
 }`} />
                  <div>
                    <span className="font-bold text-slate-300">{log.user}</span>
                    <span className="text-slate-400 ml-2">{log.action}</span>
                    <div className="text-[10px] text-slate-600 mt-1 font-mono">hash: a8f4c2...9b</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CentroPrivacidadGDPR;

