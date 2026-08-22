import React, { useState } from 'react';
import { Server, Download, RefreshCw, CheckCircle2, FileSpreadsheet, FileText, Database } from 'lucide-react';
import { motion } from 'motion/react';

// RF-018: Sincronización ERP Contable
// RF-019: Exportador Multiformato de Información

export const SincronizacionERP = () => {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Server className="text-blue-500 h-8 w-8" />
          Hub de Integración ERP & Exportación
        </h2>
        <p className="text-muted-foreground mt-1">
          Sincroniza transacciones con tu software contable y extrae data institucional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sincronización ERP (RF-018) */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <RefreshCw className="text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Sincronización API</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm font-bold text-white">SAP Business One</div>
                  <div className="text-xs text-emerald-400">Conectado (API V2)</div>
                </div>
              </div>
              <button 
                onClick={handleSync}
                disabled={syncing || synced}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
              >
                {syncing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando...</>
                ) : synced ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Al día</>
                ) : (
                  'Sincronizar Lote (142 transacciones)'
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border opacity-50 grayscale">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm font-bold text-white">QuickBooks Online</div>
                  <div className="text-xs text-slate-500">No Configurado</div>
                </div>
              </div>
              <button className="bg-white/10 text-slate-300 font-bold px-4 py-2 rounded-lg text-sm transition">
                Configurar
              </button>
            </div>
          </div>
        </div>

        {/* Exportador Multiformato (RF-019) */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Download className="text-emerald-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Centro de Exportación</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            <button className="p-4 bg-white/5 hover:bg-white/10 border border-border rounded-xl transition text-left group">
              <FileSpreadsheet className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition" />
              <div className="text-sm font-bold text-white">Reporte de Matrículas</div>
              <div className="text-xs text-slate-400 mt-1">Formato: XLSX, CSV</div>
            </button>

            <button className="p-4 bg-white/5 hover:bg-white/10 border border-border rounded-xl transition text-left group">
              <FileText className="w-8 h-8 text-rose-500 mb-3 group-hover:scale-110 transition" />
              <div className="text-sm font-bold text-white">Estados de Cuenta</div>
              <div className="text-xs text-slate-400 mt-1">Formato: Lote PDF</div>
            </button>

            <button className="p-4 bg-white/5 hover:bg-white/10 border border-border rounded-xl transition text-left group">
              <FileSpreadsheet className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition" />
              <div className="text-sm font-bold text-white">Malla Curricular XP</div>
              <div className="text-xs text-slate-400 mt-1">Formato: CSV</div>
            </button>

            <button className="p-4 bg-white/5 hover:bg-white/10 border border-border rounded-xl transition text-left group">
              <FileText className="w-8 h-8 text-indigo-500 mb-3 group-hover:scale-110 transition" />
              <div className="text-sm font-bold text-white">Logs de Auditoría</div>
              <div className="text-xs text-slate-400 mt-1">Formato: JSON Segregado</div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SincronizacionERP;
