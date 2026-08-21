import React from 'react';
import { Briefcase, Target, Building2, Users, Search, ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// RF-035: Marketplace de Talento Predictivo (Reclutamiento B2B2C)

const CORPORATE_PARTNERS = [
  { name: 'Globant', lookingFor: 'Pensamiento AlgorÃ­tmico', icon: 'G', color: 'bg-green-600', candidates: 12 },
  { name: 'Deloitte', lookingFor: 'Liderazgo & Oratoria', icon: 'D', color: 'bg-black border border-white/20', candidates: 5 },
  { name: 'KPMG', lookingFor: 'AnÃ¡lisis Financiero', icon: 'K', color: 'bg-blue-800', candidates: 8 },
];

const CANDIDATES = [
  { id: 1, name: 'Estudiante #8842', match: 98, skills: ['Python', 'LÃ³gica', 'Trabajo en Equipo'], year: '3ro Medio' },
  { id: 2, name: 'Estudiante #1092', match: 92, skills: ['React', 'DiseÃ±o UI', 'EmpatÃ­a'], year: '4to Medio' },
  { id: 3, name: 'Estudiante #7731', match: 89, skills: ['Oratoria', 'Liderazgo', 'Debate'], year: '2do Medio' },
];

export const B2BTalentMarketplace = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-indigo-500 h-8 w-8" />
            Marketplace de Talento B2B
          </h2>
          <p className="text-muted-foreground mt-1">
            Conecta corporaciones con el talento temprano de tu instituciÃ³n basado en Digital Twins. Identidad anonimizada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Corporate Pipelines */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Partners Corporativos
          </h3>
          {CORPORATE_PARTNERS.map((partner, i) => (
            <div key={i} className="card p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${partner.color} rounded-lg flex items-center justify-center font-bold text-white`}>
                  {partner.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white">{partner.name}</h4>
                  <p className="text-xs text-muted-foreground">Buscando: {partner.lookingFor}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mt-4 pt-3 border-t border-border">
                <span className="text-indigo-400 font-medium">{partner.candidates} candidatos anonimizados (Matches)</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
          <button className="w-full py-3 border border-dashed border-white/20 rounded-2xl text-sm text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
            + AÃ±adir Partner B2B
          </button>
        </div>

        {/* Candidate Matching Pool */}
        <div className="lg:col-span-2">
          <div className="card p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Pipeline de Candidatos: <span className="text-indigo-400">Globant</span>
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Filtrar por skill..." className="bg-white/5 border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {CANDIDATES.map((candidate, i) => (
                <motion.div 
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 border border-border rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-200">{candidate.name}</span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">{candidate.year}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {candidate.skills.map((skill, j) => (
                        <span key={j} className="text-[10px] px-2 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block mb-0.5">Match Score</span>
                      <span className="text-lg font-bold text-green-400 flex items-center justify-end gap-1">
                        {candidate.match}% <Star className="w-4 h-4 fill-green-400" />
                      </span>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors border border-border">
                      Revelar Perfil
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Los nombres reales permanecen encriptados (Zero-Knowledge) hasta que el estudiante aprueba la solicitud corporativa en su Sovereign Wallet.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default B2BTalentMarketplace;

