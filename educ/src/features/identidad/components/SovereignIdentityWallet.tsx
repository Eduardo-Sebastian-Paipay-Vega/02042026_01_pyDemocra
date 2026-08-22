import React from 'react';
import { Wallet, ShieldCheck, Link as LinkIcon, Lock, CheckCircle2, Globe, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

// RF-031 / RF-039: Sovereign Learning Identity & Proof of Skill

const certificates = [
  { id: 'CERT-8X9A', name: 'Dominio en LÃ³gica Booleana', date: 'Oct 2026', type: 'Hard Skill', verified: true },
  { id: 'CERT-2M4P', name: 'Liderazgo en Proyecto STEM', date: 'Sep 2026', type: 'Soft Skill', verified: true },
];

export const SovereignIdentityWallet = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-orange-500 h-8 w-8" />
            Sovereign Wallet
          </h2>
          <p className="text-muted-foreground mt-1">
            Tu identidad educativa descentralizada. TÃº controlas quiÃ©n ve tus credenciales.
          </p>
        </div>
        <div className="px-4 py-2 card-inner border border-border rounded-xl font-mono text-sm flex items-center gap-2 text-slate-300">
          <LinkIcon className="w-4 h-4 text-orange-500" />
          did:edu:0x7a3...9b2c
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Talent Liquidity Switch */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-orange-500/20 to-[var(--bg)] rounded-2xl border border-orange-500/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Globe className="w-24 h-24 text-orange-500" />
            </div>
            
            <h3 className="font-bold text-xl text-white mb-2 relative z-10">Talent Liquidity</h3>
            <p className="text-sm text-slate-300 mb-6 relative z-10">
              Haz pÃºblico tu perfil criptogrÃ¡fico a empresas e instituciones educativas de la red global.
            </p>
            
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-border relative z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-sm">Perfil PÃºblico</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
          
          <div className="card-inner rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" /> Privacidad CriptogrÃ¡fica
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              EducaciÃ³n OS utiliza Zero-Knowledge Proofs (ZK-SNARKs). Las instituciones pueden verificar que posees una habilidad sin revelar tu identidad o historial completo hasta que tÃº lo autorices.
            </p>
          </div>
        </div>

        {/* Smart Certificates Inventory */}
        <div className="lg:col-span-2 card-inner rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Smart Certificates (Verificados)
            </h3>
            <button className="text-xs font-semibold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors">
              Explorador Blockchain
            </button>
          </div>

          <div className="space-y-4">
            {certificates.map((cert, i) => (
              <motion.div 
                key={cert.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-border rounded-xl transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm group-hover:text-orange-400 transition-colors">{cert.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-black/50 px-2 py-0.5 rounded">{cert.type}</span>
                      <span className="text-[10px] text-muted-foreground">{cert.date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-green-500 font-mono flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> Validado</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{cert.id}</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-orange-500 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SovereignIdentityWallet;

