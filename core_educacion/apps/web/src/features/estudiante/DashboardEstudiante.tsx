import React, { useState } from 'react';
import { useGamificacion } from '@/hooks/api/useGamificacion';
// No TenantContext

import { VideoPlayerHLS } from './VideoPlayerHLS';
import { PDFViewer } from './PDFViewer';
import { LeaderboardXP } from './LeaderboardXP';
import { BadgesGallery } from './BadgesGallery';
import { DynamicPathingMap } from './DynamicPathingMap';
import { DigitalTwinView } from './DigitalTwinView';
import { SovereignIdentityWallet } from './SovereignIdentityWallet';
import { P2PMarketplace } from './P2PMarketplace';
import { CognitiveLoadSensor } from './CognitiveLoadSensor';
import { Lab3DWebGL } from './Lab3DWebGL';
import { ClanesP2P } from './ClanesP2P';
import { EngineCATIRT } from './EngineCATIRT';
import { MisionesRetos } from './MisionesRetos';
import { EvaluacionPsicotecnica } from './EvaluacionPsicotecnica';
import { ChatAcademico } from '../docente/ChatAcademico';
import { CentroAvisos } from '../shared/CentroAvisos';
import { TriageSaludMental } from './TriageSaludMental';
import { RedSocialSegura } from '../shared/RedSocialSegura';
import { PeerReviewCiego } from '../shared/PeerReviewCiego';
import { AprendizajeServicio } from './AprendizajeServicio';
import { ClubesInstitucionales } from './ClubesInstitucionales';

export default function DashboardEstudiante({ view }: { view: string }) {
  const userId = '725bbea5-af39-4232-b2b2-c28120e6a6b7'; // FASE 3/5: En un futuro esto vendrá del AuthContext
  
  // FASE 5: Capa de Abstracción. El componente ya no sabe qué es Supabase, solo consume datos.
  const { data: gamificacion, isLoading } = useGamificacion(userId);

  if (view === 'multimedia') return <VideoPlayerHLS />;
  if (view === 'lectura') return <PDFViewer />;
  if (view === 'ranking') return <LeaderboardXP />;
  if (view === 'insignias') return <BadgesGallery />;
  if (view === 'ruta') return <DynamicPathingMap />;
  if (view === 'digital-twin') return <DigitalTwinView />;
  if (view === 'wallet') return <SovereignIdentityWallet />;
  if (view === 'p2p') return <P2PMarketplace />;
  if (view === 'carga-cognitiva') return <CognitiveLoadSensor />;
  if (view === 'laboratorio-3d') return <Lab3DWebGL />;
  if (view === 'clanes') return <ClanesP2P />;
  if (view === 'examen-adaptativo') return <EngineCATIRT />;
  if (view === 'misiones') return <MisionesRetos />;
  if (view === 'chat') return <ChatAcademico />;
  if (view === 'avisos') return <CentroAvisos />;
  if (view === 'psicotecnica') return <EvaluacionPsicotecnica />;
  if (view === 'salud-mental') return <TriageSaludMental />;
  if (view === 'comunidad') return <RedSocialSegura />;
  if (view === 'peer-review') return <PeerReviewCiego />;
  if (view === 'voluntariado') return <AprendizajeServicio />;
  if (view === 'clubes') return <ClubesInstitucionales />;

  return (
    <div className="p-8 space-y-8 fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Welcome Banner (Glassmorphism) ── */}
      <div className="relative overflow-hidden rounded-2xl p-8 border border-white/10"
           style={{
             background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
             backdropFilter: 'blur(10px)'
           }}>
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="dot dot-green animate-pulse"></span>
              <span className="text-sm font-medium tracking-wide uppercase text-green-400/90">
                Conectado a: Democra School of Excellence
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Portal del Estudiante</h1>
            <p className="text-lg text-white/60 font-light">Bienvenido de vuelta, Eduardo. Tienes <span className="text-white font-medium">3 misiones</span> pendientes hoy.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-primary" style={{ background: 'var(--purple)' }}>
              Continuar Ruta
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-inner p-5 flex flex-col justify-center border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs uppercase tracking-wider text-white/40 mb-1">Puntos XP</span>
              <span className="text-2xl font-bold font-mono text-white/90">
                {isLoading ? '...' : (gamificacion?.puntos_xp || 0).toLocaleString()} XP
              </span>
            </div>
            <div className="card-inner p-5 flex flex-col justify-center border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs uppercase tracking-wider text-white/40 mb-1">Nivel Actual</span>
              <span className="text-2xl font-bold font-mono text-white/90 text-purple-400">
                {isLoading ? '...' : `Lvl ${gamificacion?.nivel || 1}`}
              </span>
            </div>
            <div className="card-inner p-5 flex flex-col justify-center border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-xs uppercase tracking-wider text-white/40 mb-1">Medallas Desbloqueadas</span>
              <span className="text-2xl font-bold font-mono text-white/90">
                {isLoading ? '...' : (gamificacion?.medallas_json?.length || 0)} 🥇
              </span>
            </div>
          </div>

          <div className="card border-white/10 shadow-2xl shadow-black/50">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-semibold tracking-wide">Módulo Actual (Arquitectura Cloud)</h2>
              <span className="badge badge-purple animate-pulse">Live Data</span>
            </div>
            <div className="p-6">
              <VideoPlayerHLS />
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar widgets) */}
        <div className="space-y-8">
          <div className="card border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-md font-semibold">Leaderboard Global</h3>
            </div>
            <div className="p-0">
              <LeaderboardXP />
            </div>
          </div>

          <div className="card border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-md font-semibold">Tus Medallas</h3>
            </div>
            <div className="p-0">
              <BadgesGallery />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

