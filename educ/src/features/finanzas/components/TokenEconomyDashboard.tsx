import React from 'react';
import { Coins, TrendingUp, Gift, Zap, ArrowUpRight, ArrowDownRight, Gem } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

// RF-036: EconomÃ­a de Tokens y CrÃ©ditos Educativos Internos

const mockTokenData = [
  { month: 'Ene', minted: 4000, burned: 2400 },
  { month: 'Feb', minted: 3000, burned: 1398 },
  { month: 'Mar', minted: 2000, burned: 9800 },
  { month: 'Abr', minted: 2780, burned: 3908 },
  { month: 'May', minted: 1890, burned: 4800 },
  { month: 'Jun', minted: 2390, burned: 3800 },
];

const rewards = [
  { id: 1, title: 'DÃ­a Libre (No Tareas)', cost: 5000, icon: <Zap className="w-6 h-6 text-yellow-500" /> },
  { id: 2, title: 'Merch del Colegio', cost: 15000, icon: <Gift className="w-6 h-6 text-pink-500" /> },
  { id: 3, title: 'Descuento 5% PensiÃ³n', cost: 50000, icon: <Gem className="w-6 h-6 text-purple-500" /> },
];

export const TokenEconomyDashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Coins className="text-yellow-500 h-8 w-8" />
            Tokenomics (EduTokens)
          </h2>
          <p className="text-muted-foreground mt-1">
            GestiÃ³n de la economÃ­a interna. Los XP de los estudiantes se respaldan en tokens institucionales.
          </p>
        </div>
        <div className="px-4 py-2 card rounded-xl font-mono text-xl font-bold flex items-center gap-2 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
          <Gem className="w-5 h-5" />
          1.2M <span className="text-sm text-slate-500">Total Supply</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Token Supply Chart */}
        <div className="lg:col-span-2 bg-[var(--s2)] rounded-2xl border border-border p-6 relative overflow-hidden">
          <h3 className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            EmisiÃ³n vs Quema (Burn Rate)
          </h3>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTokenData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#181614', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="minted" stroke="#10b981" fillOpacity={1} fill="url(#colorMinted)" name="Emitidos (Recompensas)" />
                <Area type="monotone" dataKey="burned" stroke="#ef4444" fillOpacity={1} fill="url(#colorBurned)" name="Quemados (Canjes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marketplace Config */}
        <div className="bg-[var(--s2)] rounded-2xl border border-border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Marketplace de Canje
            </h3>
            <button className="text-xs bg-primary/20 text-primary hover:bg-primary/30 px-2 py-1 rounded transition-colors">
              + AÃ±adir
            </button>
          </div>
          
          <div className="space-y-3 flex-1">
            {rewards.map((reward, i) => (
              <motion.div 
                key={reward.id}
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-3 bg-white/5 border border-border rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/50 rounded-lg">{reward.icon}</div>
                  <span className="text-sm font-semibold text-slate-200">{reward.title}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-yellow-400 flex items-center justify-end gap-1">
                    {reward.cost.toLocaleString()} <Gem className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Los tokens quemados (canjeados) son deducidos del liability financiero de la instituciÃ³n automÃ¡ticamente.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TokenEconomyDashboard;
