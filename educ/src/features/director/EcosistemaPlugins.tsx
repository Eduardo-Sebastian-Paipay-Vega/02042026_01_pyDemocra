import React, { useState } from 'react';
import { Blocks, Search, Plus, CheckCircle2, Settings2, Key, Globe } from 'lucide-react';
import { motion } from 'motion/react';

// RF-034: Ecosistema de Plugins y Arquitectura API-First

const PLUGINS = [
  { id: 1, name: 'Google Workspace Sync', vendor: 'Oficial', status: 'installed', type: 'Core', desc: 'Sincronización bidireccional con Google Classroom y Drive.' },
  { id: 2, name: 'SAP ERP Connector', vendor: 'Enterprise', status: 'installed', type: 'Finanzas', desc: 'Exportación de asientos contables a SAP B1 en tiempo real.' },
  { id: 3, name: 'Zoom Live Classes', vendor: 'Oficial', status: 'available', type: 'Video', desc: 'Generación automática de links de Zoom para cada lección.' },
  { id: 4, name: 'Stripe Payments', vendor: 'Oficial', status: 'installed', type: 'Core', desc: 'Procesamiento de pagos de matrículas y pensiones.' },
  { id: 5, name: 'Turnitin Anti-Plagio', vendor: 'Terceros', status: 'update', type: 'Académico', desc: 'Análisis de similitud en entregables y ensayos.' },
];

export const EcosistemaPlugins = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Blocks className="text-purple-500 h-8 w-8" />
            Ecosistema de Integraciones
          </h2>
          <p className="text-muted-foreground mt-1">
            Arquitectura API-First: Instala módulos de terceros o gestiona Webhooks.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="card p-2 rounded-xl text-slate-300 hover:bg-white/5 transition flex items-center gap-2">
            <Key className="w-5 h-5" /> API Keys
          </button>
          <button className="card p-2 rounded-xl text-slate-300 hover:bg-white/5 transition flex items-center gap-2">
            <Globe className="w-5 h-5" /> Webhooks
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Desarrollador Externo
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar plugins (ej. Moodle, Canvas, Slack)..." 
              className="w-full bg-black/40 border border-border rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-black/40 border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition">
              <option>Categoría: Todas</option>
              <option>Académico</option>
              <option>Finanzas</option>
              <option>Comunicaciones</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLUGINS.map(plugin => (
            <motion.div 
              key={plugin.id}
              whileHover={{ y: -5 }}
              className="bg-black/40 border border-border rounded-2xl p-6 hover:border-border transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Blocks className="w-6 h-6 text-purple-400" />
                </div>
                {plugin.status === 'installed' && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Instalado
                  </span>
                )}
                {plugin.status === 'update' && (
                  <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/20">
                    Actualización disp.
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{plugin.name}</h3>
              <p className="text-sm text-slate-400 mb-4 h-10">{plugin.desc}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-slate-500">{plugin.vendor} • {plugin.type}</span>
                {plugin.status === 'installed' || plugin.status === 'update' ? (
                  <button className="text-slate-400 hover:text-white transition">
                    <Settings2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                    Instalar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcosistemaPlugins;
