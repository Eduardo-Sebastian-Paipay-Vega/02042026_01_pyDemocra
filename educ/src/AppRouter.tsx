/**
 * EDUCACION OS — React Router Configuration
 *
 * URL Structure:
 *   /                     → redirect to /login
 *   /login                → Login page
 *   /dashboard            → Role-flavored landing
 *   /demi                 → DEMI AI
 *   /educa/*              → Domain: Educación
 *   /finanzas/*           → Domain: Finanzas
 *   /ews/*                → Domain: Early Warning System
 *   /comunicacion/*       → Domain: Comunicación
 *   /institution/*        → Domain: Institución
 *   /ia/*                 → Domain: IA Avanzada
 *   /bienestar/*          → Domain: Bienestar
 *   /identidad/*          → Domain: Identidad Digital
 *   /profile              → Perfil de usuario
 *   /settings             → Ajustes
 *   *                     → 404
 *
 * All domain routes are protected (require auth + permission).
 */

import { lazy, Suspense, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@educ/context/AuthContext'
import type { RoleId } from '@educ/lib/rbac/roles'
import AppShell from '@educ/components/routing/AppShell'
import { ProtectedRoute, NotFoundScreen, RouteLoader } from '@educ/components/routing/ProtectedRoute'
import Login from '@educ/components/auth/Login'

// ─── Login wrapper (redirects if already authenticated) ──────────────────────
function LoginPage() {
  const { session, login } = useAuth()
  
  if (session) {
    return <Navigate to="/app/dashboard" replace />
  }
  const navigate = useNavigate()

  const handleLogin = useCallback(async (email: string, pass: string, onStepChange?: (step: number) => void) => {
    const res = await login(email, pass, onStepChange)
    if (res?.error) {
      throw res.error
    }
    if (res?.targetRoute) {
      navigate(res.targetRoute, { replace: true })
    }
  }, [login, navigate])

  return <Login onLogin={handleLogin} />
}

// ─── Lazy page imports ────────────────────────────────────────────────────────

// Meta
const ProfilePage       = lazy(() => import('@/core/features/profile/ProfilePage'))
const SettingsPage      = lazy(() => import('@/core/features/settings/SettingsPage'))
const DemoPage          = lazy(() => import('@educ/features/demo/DemoPage'))

// Dashboards (role-flavored landing pages)
const DashboardDirector    = lazy(() => import('@educ/features/director/DashboardDirector'))
const DashboardDocente     = lazy(() => import('@educ/features/docente/DashboardDocente'))
const DashboardCoordinador = lazy(() => import('@educ/features/coordinador/DashboardCoordinador'))
const DashboardPadres      = lazy(() => import('@educ/features/padres/DashboardPadres'))
const DashboardCFO         = lazy(() => import('@educ/features/finanzas/DashboardCFO'))
const DashboardEstudiante  = lazy(() => import('@educ/features/estudiante/DashboardEstudiante'))

// Educa domain
const CurriculumBuilder    = lazy(() => import('@educ/features/educa/CurriculumBuilder'))
const BancoItemesLLM       = lazy(() => import('@educ/features/educa/BancoItemesLLM'))
const EngineCATIRT         = lazy(() => import('@educ/features/educa/EngineCATIRT'))
const ProctoringIA         = lazy(() => import('@educ/features/educa/ProctoringIA'))
const PeerReviewCiego      = lazy(() => import('@educ/features/educa/PeerReviewCiego'))
const EvaluacionPsicotecnica = lazy(() => import('@educ/features/educa/EvaluacionPsicotecnica'))
const DynamicPathingMap    = lazy(() => import('@educ/features/educa/DynamicPathingMap'))
const DigitalTwinView      = lazy(() => import('@educ/features/educa/DigitalTwinView'))
const CognitiveLoadSensor  = lazy(() => import('@educ/features/educa/CognitiveLoadSensor'))
const LeaderboardXP        = lazy(() => import('@educ/features/educa/LeaderboardXP'))
const BadgesGallery        = lazy(() => import('@educ/features/educa/BadgesGallery'))
const MisionesRetos        = lazy(() => import('@educ/features/educa/MisionesRetos'))
const Lab3DWebGL           = lazy(() => import('@educ/features/educa/Lab3DWebGL'))
const VideoPlayerHLS       = lazy(() => import('@educ/features/educa/VideoPlayerHLS'))
const ResourceRepository   = lazy(() => import('@educ/features/educa/ResourceRepository'))
const AsistenciaQR         = lazy(() => import('@educ/features/educa/AsistenciaQR'))

// Finanzas domain
const DashboardCFOComp     = lazy(() => import('@educ/features/finanzas/components/DashboardCFO'))
const PasarelaPagos        = lazy(() => import('@educ/features/finanzas/components/PasarelaPagos'))
const TokenEconomy         = lazy(() => import('@educ/features/finanzas/components/TokenEconomyDashboard'))

// EWS domain
const EWSDetailView        = lazy(() => import('@educ/features/ews/components/EWSDetailView'))
const BehavioralAnalytics  = lazy(() => import('@educ/features/ews/components/BehavioralAnalytics'))

// Comunicacion domain
const ChatAcademico        = lazy(() => import('@educ/features/comunicacion/ChatAcademico'))
const CentroAvisos         = lazy(() => import('@educ/features/comunicacion/CentroAvisos'))
const RedSocialSegura      = lazy(() => import('@educ/features/comunicacion/RedSocialSegura'))
const ParentLiveStream     = lazy(() => import('@educ/features/comunicacion/ParentLiveStream'))

// Institution domain
const GestorEspacios       = lazy(() => import('@educ/features/institution/components/GestorEspacios'))
const HorariosGeneticos    = lazy(() => import('@educ/features/institution/components/HorariosGeneticos'))
const NominaInteligente    = lazy(() => import('@educ/features/institution/components/NominaInteligente'))
const MantenimientoPred    = lazy(() => import('@educ/features/institution/components/MantenimientoPredictivo'))
const ScoringBecasIA       = lazy(() => import('@educ/features/institution/components/ScoringBecasIA'))
const ProtocolosCrisis     = lazy(() => import('@educ/features/institution/components/ProtocolosCrisis'))
const ObservatorioClima    = lazy(() => import('@educ/features/institution/components/ObservatorioClima'))
const CentroPrivacidadGDPR = lazy(() => import('@educ/features/institution/components/CentroPrivacidadGDPR'))
const SincronizacionERP    = lazy(() => import('@educ/features/institution/components/SincronizacionERP'))

// IA domain
const AgenticSwarm         = lazy(() => import('@educ/features/ia/components/AgenticSwarmOrchestrator'))
const KnowledgeGraphView   = lazy(() => import('@educ/features/ia/components/KnowledgeGraphView'))
const FederatedLearning    = lazy(() => import('@educ/features/ia/components/FederatedLearningConfig'))
const EcosistemaPlugins    = lazy(() => import('@educ/features/ia/components/EcosistemaPlugins'))

// Bienestar domain
const TriageSaludMental    = lazy(() => import('@educ/features/bienestar/components/TriageSaludMental'))
const SensorBullying       = lazy(() => import('@educ/features/bienestar/components/SensorBullying'))
const ClanesP2P            = lazy(() => import('@educ/features/bienestar/components/ClanesP2P'))
const ClubesInstitucionales = lazy(() => import('@educ/features/bienestar/components/ClubesInstitucionales'))
const PlanInclusionPIE     = lazy(() => import('@educ/features/bienestar/components/PlanInclusionPIE'))
const AprendizajeServicio  = lazy(() => import('@educ/features/bienestar/components/AprendizajeServicio'))
const P2PMarketplace       = lazy(() => import('@educ/features/bienestar/components/P2PMarketplace'))

// Identidad domain
const SovereignIdentity    = lazy(() => import('@educ/features/identidad/components/SovereignIdentityWallet'))
const B2BTalentMarketplace = lazy(() => import('@educ/features/identidad/components/B2BTalentMarketplace'))

// ─── Dashboard redirector ─────────────────────────────────────────────────────

function DashboardPage() {
  const { session } = useAuth()
  const role = session?.primaryRole

  if (role === 'docente')     return <DashboardDocente view="dashboard" />
  if (role === 'coordinador') return <DashboardCoordinador view="dashboard" />
  if (role === 'padres')      return <DashboardPadres view="dashboard" />
  if (role === 'cfo')         return <DashboardCFOComp view="dashboard" />
  if (role === 'estudiante')  return <DashboardEstudiante view="dashboard" />
  return <DashboardDirector view="dashboard" />
}

// ─── Cursos — role-aware ──────────────────────────────────────────────────────

function CursosPage() {
  const { session } = useAuth()
  if (session?.primaryRole === 'docente') return <DashboardDocente view="cursos" />
  if (session?.primaryRole === 'estudiante') return <DashboardEstudiante view="cursos" />
  return <CurriculumBuilder />
}

// ─── Calificaciones — role-aware ──────────────────────────────────────────────

function CalificacionesPage() {
  const { session } = useAuth()
  if (session?.primaryRole === 'padres') return <DashboardPadres view="desempeno" />
  if (session?.primaryRole === 'estudiante') return <DashboardEstudiante view="calificaciones" />
  return <DashboardDocente view="calificaciones" />
}

// ─── Finanzas — role-aware ────────────────────────────────────────────────────

function FinanzasPage() {
  const { session } = useAuth()
  if (session?.primaryRole === 'padres') return <PasarelaPagos />
  return <DashboardCFOComp view="dashboard" />
}

// ─── Route tree ───────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <BrowserRouter basename="/educ">
      <Routes>

        {/* ── Public ──────────────────────────────────────────────────────── */}
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Authenticated shell ─────────────────────────────────────────── */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>

          {/* Dashboard */}
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/demi" element={<DemiPage />} />
          <Route path="/profile" element={<ProfilePage userName={''} role={''} onLogout={() => {}} />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Demo 3D route */}
          <Route path="/demo-3d" element={<DemoPage />} />

          {/* ── /educa ───────────────────────────────────────────────────── */}
          <Route path="/educa">
            <Route index element={<CursosPage />} />
            <Route path="cursos"           element={<ProtectedRoute permission="educa:cursos:view"><CursosPage /></ProtectedRoute>} />
            <Route path="calificaciones"   element={<ProtectedRoute permission="educa:calificaciones:view"><CalificacionesPage /></ProtectedRoute>} />
            <Route path="asistencia"       element={<ProtectedRoute permission="educa:asistencia:view"><DashboardDocente view="asistencia" /></ProtectedRoute>} />
            <Route path="actas"            element={<ProtectedRoute permission="educa:evaluaciones:grade"><DashboardDocente view="actas" /></ProtectedRoute>} />
            <Route path="asistencia-qr"    element={<ProtectedRoute permission="educa:asistencia:manage"><AsistenciaQR /></ProtectedRoute>} />
            <Route path="banco-items"      element={<ProtectedRoute permission="educa:items:view"><BancoItemesLLM /></ProtectedRoute>} />
            <Route path="cat-irt"          element={<ProtectedRoute permission="educa:cat_irt:view"><EngineCATIRT /></ProtectedRoute>} />
            <Route path="proctoring"       element={<ProtectedRoute permission="educa:proctoring:manage"><ProctoringIA /></ProtectedRoute>} />
            <Route path="peer-review"      element={<ProtectedRoute permission="educa:peer_review:view"><PeerReviewCiego /></ProtectedRoute>} />
            <Route path="psicoaptitudinal" element={<ProtectedRoute permission="educa:psico:view"><EvaluacionPsicotecnica /></ProtectedRoute>} />
            <Route path="recursos"         element={<ProtectedRoute permission="educa:cursos:view"><ResourceRepository /></ProtectedRoute>} />
            <Route path="video-player"     element={<ProtectedRoute permission="educa:cursos:view"><VideoPlayerHLS /></ProtectedRoute>} />
            <Route path="lab-3d"           element={<ProtectedRoute permission="educa:lab3d:view"><Lab3DWebGL /></ProtectedRoute>} />
            {/* IA Educativa sub-domain */}
            <Route path="ia">
              <Route index element={<ProtectedRoute permission="educa:adaptive:view"><DynamicPathingMap /></ProtectedRoute>} />
              <Route path="ruta-adaptativa"  element={<ProtectedRoute permission="educa:adaptive:view"><DynamicPathingMap /></ProtectedRoute>} />
              <Route path="gemelo-digital"   element={<ProtectedRoute permission="educa:digital_twin:view"><DigitalTwinView /></ProtectedRoute>} />
              <Route path="carga-cognitiva"  element={<ProtectedRoute permission="educa:cognitive_load:view"><CognitiveLoadSensor /></ProtectedRoute>} />
            </Route>
            {/* Motivación sub-domain */}
            <Route path="gamificacion"     element={<ProtectedRoute permission="educa:gamificacion:view"><LeaderboardXP /></ProtectedRoute>} />
            <Route path="badges"           element={<ProtectedRoute permission="educa:gamificacion:view"><BadgesGallery /></ProtectedRoute>} />
            <Route path="misiones"         element={<ProtectedRoute permission="educa:gamificacion:view"><MisionesRetos /></ProtectedRoute>} />
          </Route>

          {/* ── /finanzas ─────────────────────────────────────────────────── */}
          <Route path="/finanzas">
            <Route index element={<ProtectedRoute permission="finanzas:view"><FinanzasPage /></ProtectedRoute>} />
            <Route path="transacciones" element={<ProtectedRoute permission="finanzas:pagos:view"><DashboardCFOComp view="transacciones" /></ProtectedRoute>} />
            <Route path="deudores"      element={<ProtectedRoute permission="finanzas:deudores:view"><DashboardCFOComp view="deudores" /></ProtectedRoute>} />
            <Route path="pagos"         element={<ProtectedRoute permission="finanzas:pagos:view"><PasarelaPagos /></ProtectedRoute>} />
            <Route path="tokens"        element={<ProtectedRoute permission="finanzas:tokens:view"><TokenEconomy /></ProtectedRoute>} />
            <Route path="erp"           element={<ProtectedRoute permission="finanzas:erp:manage"><SincronizacionERP /></ProtectedRoute>} />
            <Route path="reportes"      element={<ProtectedRoute permission="finanzas:reportes:view"><DashboardCFOComp view="reportes" /></ProtectedRoute>} />
            <Route path="reporte-deuda" element={<ProtectedRoute permission="finanzas:deudores:view"><DashboardCoordinador view="reportes-deuda" /></ProtectedRoute>} />
          </Route>

          {/* ── /ews ──────────────────────────────────────────────────────── */}
          <Route path="/ews">
            <Route index element={<ProtectedRoute permission="ews:alerts:view"><EWSDetailView /></ProtectedRoute>} />
            <Route path="alertas"    element={<ProtectedRoute permission="ews:alerts:view"><EWSDetailView /></ProtectedRoute>} />
            <Route path="behavioral" element={<ProtectedRoute permission="ews:behavioral:view"><BehavioralAnalytics /></ProtectedRoute>} />
          </Route>

          {/* ── /comunicacion ─────────────────────────────────────────────── */}
          <Route path="/comunicacion">
            <Route index element={<ProtectedRoute permission="comunicacion:view"><ChatAcademico /></ProtectedRoute>} />
            <Route path="chat"        element={<ProtectedRoute permission="comunicacion:chat:view"><ChatAcademico /></ProtectedRoute>} />
            <Route path="avisos"      element={<ProtectedRoute permission="comunicacion:avisos:view"><CentroAvisos /></ProtectedRoute>} />
            <Route path="circulares"  element={<ProtectedRoute permission="comunicacion:circulares:view"><DashboardDirector view="direccion" /></ProtectedRoute>} />
            <Route path="red-social"  element={<ProtectedRoute permission="comunicacion:red_social:view"><RedSocialSegura /></ProtectedRoute>} />
            <Route path="live-stream" element={<ProtectedRoute permission="comunicacion:avisos:view"><ParentLiveStream /></ProtectedRoute>} />
          </Route>

          {/* ── /institution ──────────────────────────────────────────────── */}
          <Route path="/institution">
            <Route index element={<ProtectedRoute permission="institution:view"><DashboardDirector view="dashboard" /></ProtectedRoute>} />
            <Route path="matricula">
              <Route index element={<ProtectedRoute permission="institution:matricula:view"><DashboardDirector view="matricula" /></ProtectedRoute>} />
              <Route path="nueva"       element={<ProtectedRoute permission="institution:matricula:manage"><DashboardCoordinador view="inscripcion" /></ProtectedRoute>} />
              <Route path="conflictos"  element={<ProtectedRoute permission="institution:matricula:manage"><DashboardCoordinador view="conflictos" /></ProtectedRoute>} />
            </Route>
            <Route path="usuarios"      element={<ProtectedRoute permission="institution:usuarios:view"><DashboardDirector view="usuarios" /></ProtectedRoute>} />
            <Route path="espacios"      element={<ProtectedRoute permission="institution:espacios:view"><GestorEspacios /></ProtectedRoute>} />
            <Route path="horarios"      element={<ProtectedRoute permission="institution:horarios:view"><HorariosGeneticos /></ProtectedRoute>} />
            <Route path="nomina"        element={<ProtectedRoute permission="institution:nomina:view"><NominaInteligente /></ProtectedRoute>} />
            <Route path="becas"         element={<ProtectedRoute permission="institution:becas:view"><ScoringBecasIA /></ProtectedRoute>} />
            <Route path="emergencias"   element={<ProtectedRoute permission="institution:emergencias:view"><ProtocolosCrisis /></ProtectedRoute>} />
            <Route path="mantenimiento" element={<ProtectedRoute permission="institution:mantenimiento:view"><MantenimientoPred /></ProtectedRoute>} />
            <Route path="gobernanza"    element={<ProtectedRoute permission="institution:gobernanza:view"><DashboardDirector view="gobernanza" /></ProtectedRoute>} />
            <Route path="privacidad"    element={<ProtectedRoute permission="institution:privacidad:view"><CentroPrivacidadGDPR /></ProtectedRoute>} />
            <Route path="auditoria"     element={<ProtectedRoute permission="institution:auditoria:view"><DashboardDirector view="auditoria" /></ProtectedRoute>} />
            <Route path="transparencia" element={<ProtectedRoute permission="institution:transparencia:view"><DashboardDirector view="transparencia" /></ProtectedRoute>} />
            <Route path="clima"         element={<ProtectedRoute permission="institution:clima:view"><ObservatorioClima /></ProtectedRoute>} />
            <Route path="alumni"        element={<ProtectedRoute permission="institution:alumni:view"><DashboardDirector view="alumni" /></ProtectedRoute>} />
            <Route path="esg"           element={<ProtectedRoute permission="institution:esg:view"><DashboardDirector view="esg" /></ProtectedRoute>} />
            <Route path="benchmarking"  element={<ProtectedRoute permission="institution:benchmarking:view"><DashboardDirector view="analytics" /></ProtectedRoute>} />
            <Route path="reportes"      element={<ProtectedRoute permission="finanzas:reportes:export"><DashboardDirector view="reportes" /></ProtectedRoute>} />
            <Route path="convalidacion" element={<ProtectedRoute permission="institution:matricula:manage"><DashboardCoordinador view="convalidacion" /></ProtectedRoute>} />
            <Route path="autorizaciones" element={<ProtectedRoute permission="institution:matricula:manage"><DashboardPadres view="autorizaciones" /></ProtectedRoute>} />
            <Route path="desempeno"     element={<ProtectedRoute permission="educa:calificaciones:view"><DashboardPadres view="desempeno" /></ProtectedRoute>} />
            <Route path="direccion"     element={<ProtectedRoute permission="institution:director:full"><DashboardDirector view="direccion" /></ProtectedRoute>} />
            <Route path="analytics"     element={<ProtectedRoute permission="institution:benchmarking:view"><DashboardDirector view="analytics" /></ProtectedRoute>} />
          </Route>

          {/* ── /ia ───────────────────────────────────────────────────────── */}
          <Route path="/ia">
            <Route index element={<ProtectedRoute permission="ia:view"><DemiPage /></ProtectedRoute>} />
            <Route path="demi"           element={<DemiPage />} />
            <Route path="agentes"        element={<ProtectedRoute permission="ia:agentes:view"><AgenticSwarm /></ProtectedRoute>} />
            <Route path="knowledge-graph" element={<ProtectedRoute permission="ia:knowledge_graph:view"><KnowledgeGraphView /></ProtectedRoute>} />
            <Route path="federated"      element={<ProtectedRoute permission="ia:federated:view"><FederatedLearning /></ProtectedRoute>} />
            <Route path="plugins"        element={<ProtectedRoute permission="ia:plugins:view"><EcosistemaPlugins /></ProtectedRoute>} />
          </Route>

          {/* ── /bienestar ────────────────────────────────────────────────── */}
          <Route path="/bienestar">
            <Route index element={<ProtectedRoute permission="bienestar:view"><TriageSaludMental /></ProtectedRoute>} />
            <Route path="salud-mental"         element={<ProtectedRoute permission="bienestar:salud_mental:view"><TriageSaludMental /></ProtectedRoute>} />
            <Route path="bullying"             element={<ProtectedRoute permission="bienestar:bullying:view"><SensorBullying /></ProtectedRoute>} />
            <Route path="clanes"               element={<ProtectedRoute permission="bienestar:clanes:view"><ClanesP2P /></ProtectedRoute>} />
            <Route path="clubes"               element={<ProtectedRoute permission="bienestar:clubes:view"><ClubesInstitucionales /></ProtectedRoute>} />
            <Route path="iep"                  element={<ProtectedRoute permission="bienestar:iep:view"><PlanInclusionPIE /></ProtectedRoute>} />
            <Route path="aprendizaje-servicio" element={<ProtectedRoute permission="bienestar:aprendizaje_servicio:view"><AprendizajeServicio /></ProtectedRoute>} />
            <Route path="p2p-tutoring"         element={<ProtectedRoute permission="bienestar:p2p_marketplace:view"><P2PMarketplace /></ProtectedRoute>} />
          </Route>

          {/* ── /identidad ────────────────────────────────────────────────── */}
          <Route path="/identidad">
            <Route index element={<ProtectedRoute permission="identidad:pasaporte:view"><SovereignIdentity /></ProtectedRoute>} />
            <Route path="pasaporte"   element={<ProtectedRoute permission="identidad:pasaporte:view"><SovereignIdentity /></ProtectedRoute>} />
            <Route path="marketplace" element={<ProtectedRoute permission="identidad:marketplace_b2b:view"><B2BTalentMarketplace /></ProtectedRoute>} />
          </Route>

          {/* ── Legacy short aliases (backwards-compat) ───────────────────── */}
          <Route path="/ews-view"        element={<Navigate to="/ews" replace />} />
          <Route path="/gamificacion"    element={<Navigate to="/educa/gamificacion" replace />} />
          <Route path="/pasaporte"       element={<Navigate to="/identidad/pasaporte" replace />} />
          <Route path="/marketplace"     element={<Navigate to="/identidad/marketplace" replace />} />
          <Route path="/agentes-ia"      element={<Navigate to="/ia/agentes" replace />} />

        </Route>

        {/* ── 404 ───────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundScreen />} />

      </Routes>
    </BrowserRouter>
  )
}
