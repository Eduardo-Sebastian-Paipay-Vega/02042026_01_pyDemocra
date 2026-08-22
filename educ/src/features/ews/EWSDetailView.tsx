import React from 'react';
import { AlertOctagon, TrendingDown, Users, BrainCircuit, Activity, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { motion } from 'motion/react';

// RF-016 / RF-021: Early Warning System (EWS) Avanzado

const mockRiskData = [
  { week: 'Semana 1', risk: 10, name: 'Bajo' },
  { week: 'Semana 2', risk: 15, name: 'Bajo' },
  { week: 'Semana 3', risk: 25, name: 'Moderado' },
  { week: 'Semana 4', risk: 45, name: 'Alto' },
  { week: 'Semana 5', risk: 85, name: 'Crítico' },
];

const mockStudents = [
  { id: '1', x: 45, y: 30, z: 200, name: 'Lucas M.', risk: 'high' },
  { id: '2', x: 20, y: 80, z: 100, name: 'Sofia R.', risk: 'low' },
  { id: '3', x: 60, y: 40, z: 150, name: 'Diego A.', risk: 'medium' },
  { id: '4', x: 85, y: 20, z: 300, name: 'Valentina C.', risk: 'critical' },
];

export const EWSDetailView = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="text-red-500 h-8 w-8" />
            Early Warning System (EWS)
          </h2>
          <p className="text-muted-foreground mt-1">
            Motor predictivo de deserción escolar impulsado por IA. Detección a 30 días.
          </p>
        </div>
        <div className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-5 h-5" /> 12 Alertas Críticas Hoy
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card/30 backdrop-blur-md rounded-2xl border border-border p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <BrainCircuit className="w-32 h-32" />
          </div>
          
          <h3 className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Proyección de Riesgo (Agregado)
          </h3>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#riskGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Action Plan */}
        <div className="bg-card/30 backdrop-blur-md rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Plan de Acción Sugerido (IA)
          </h3>
          
          <div className="space-y-4">
            <motion.div whileHover={{ x: 5 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-red-400">Intervención Urgente</span>
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full">Prioridad 1</span>
              </div>
              <p className="text-sm text-foreground mb-3">Reunión 1:1 con Valentina C. Caída abrupta en login y entregas (-80% vs prom).</p>
              <button className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1 w-full justify-center">
                Agendar Reunión Automática
              </button>
            </motion.div>

            <motion.div whileHover={{ x: 5 }} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-yellow-400">Alerta Temprana</span>
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">Prioridad 2</span>
              </div>
              <p className="text-sm text-foreground mb-3">Notificar al Tutor de Lucas M. por 3 inasistencias consecutivas.</p>
              <button className="text-xs font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition-colors px-3 py-1.5 rounded-lg flex items-center gap-1 w-full justify-center">
                Enviar Reporte a Tutor
              </button>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EWSDetailView;
