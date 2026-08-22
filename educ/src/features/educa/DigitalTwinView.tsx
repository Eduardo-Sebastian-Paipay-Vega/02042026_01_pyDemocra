import React from 'react';
import { Brain, Activity, Zap, Dna, Hexagon, Crosshair, Network } from 'lucide-react';
import { ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, LineChart, Line, Tooltip } from 'recharts';
import { motion } from 'motion/react';

// RF-038: Digital Twin del Estudiante (DTL)

const skillData = [
  { subject: 'LÃ³gica Computacional', A: 85, fullMark: 100 },
  { subject: 'MatemÃ¡ticas', A: 70, fullMark: 100 },
  { subject: 'ComunicaciÃ³n', A: 60, fullMark: 100 },
  { subject: 'Trabajo en Equipo', A: 90, fullMark: 100 },
  { subject: 'Pensamiento CrÃ­tico', A: 75, fullMark: 100 },
  { subject: 'Creatividad', A: 80, fullMark: 100 },
];

const cognitiveLoadData = [
  { time: '08:00', load: 20 },
  { time: '10:00', load: 45 },
  { time: '12:00', load: 85 }, // Peak cognitive load
  { time: '14:00', load: 50 },
  { time: '16:00', load: 30 },
];

export const DigitalTwinView = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Dna className="text-blue-500 h-8 w-8" />
            Digital Twin (DTL)
          </h2>
          <p className="text-muted-foreground mt-1">
            SimulaciÃ³n hologrÃ¡fica de tu estado cognitivo y desarrollo de habilidades.
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Activity className="w-5 h-5 animate-pulse" /> SincronizaciÃ³n BiomÃ©trica: Activa
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hologram / Graph Section (Centerpiece) */}
        <div className="lg:col-span-2 card-inner rounded-2xl border border-border p-6 relative overflow-hidden flex flex-col">
          <h3 className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-blue-500" />
            Matriz de Competencias Neuronales
          </h3>
          
          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none rounded-xl"></div>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Habilidades" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Sidebar - Analytics */}
        <div className="space-y-6">
          
          {/* Cognitive Load */}
          <div className="card-inner rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              Carga Cognitiva en Tiempo Real
            </h3>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cognitiveLoadData}>
                  <Line type="monotone" dataKey="load" stroke="#a855f7" strokeWidth={3} dot={false} />
                  <Tooltip contentStyle={{ background: '#121110', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-xs text-purple-300 font-medium">Sugerencia IA: Alto nivel de fatiga detectado a las 12:00. Recomendamos bloqueos de descanso de 15 min.</p>
            </div>
          </div>

          {/* Predictive Projection */}
          <div className="card-inner rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-green-500" />
              ProyecciÃ³n Vocacional Predictiva
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">IngenierÃ­a de Software</span>
                  <span className="text-green-400 font-bold">82% Match</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1 }} className="h-full bg-green-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Data Science</span>
                  <span className="text-green-400 font-bold">75% Match</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-green-500/70" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DigitalTwinView;

