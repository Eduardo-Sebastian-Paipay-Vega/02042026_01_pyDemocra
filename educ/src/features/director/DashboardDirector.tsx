import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, BookOpen, AlertTriangle, DollarSign, ChevronRight, Download, RefreshCw, MoreHorizontal, Fingerprint, ShoppingBag, Bot, BarChart2, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownRight, Star, Trophy, Zap, Target, Globe, Eye, Database, Lock, Heart, Leaf, Map, Calendar, Award, GraduationCap, Landmark, Monitor, Thermometer, QrCode, MessageSquare } from 'lucide-react'
import { fetchEducData } from '../../lib/api'

// Proxies for lazy async data
const kpisDirector = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.kpisDirector;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const retencionData = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.retencionData;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const financieroYTD = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.financieroYTD;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const riesgoDistribucion = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.riesgoDistribucion;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const docentes = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.docentes;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const marketplaceProducts = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.marketplaceProducts;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const pasaporteData = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.pasaporteData;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const analyticsCanales = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.analyticsCanales;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const logrosCompartidos = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.logrosCompartidos;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const agentesIA = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.agentesIA;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const usuarios = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.usuarios;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const deudores = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.deudores;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const ewsStudents = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.ewsStudents;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const badges = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.badges;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const leaderboard = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.leaderboard;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const misiones = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.misiones;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
// ── Shared Tooltip ─────────────────────────────────────────────
const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--s3)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--tx-2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span><strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Animated counter ───────────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const dur = 800
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(to * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <>{prefix}{val.toFixed(decimals)}{suffix}</>
}

// ── Shared section header ──────────────────────────────────────
function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h1 style={{ marginBottom: 3 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}

// ── Enterprise Stub View ───────────────────────────────────────
const QUICK_LINKS = ['Configuración', 'Usuarios', 'Permisos', 'Reportes']

function EnterpriseView({ icon: Icon, titulo, desc, rf, scr }: {
  icon: React.ElementType; titulo: string; desc: string; rf: string; scr: string
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ padding: 'var(--page-p)' }} className="fade-up">
      <div style={{ maxWidth: 660 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: 'var(--s3)', border: '1px solid var(--border-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={18} style={{ color: 'var(--tx-2)' }} />
          </div>
          <div>
            <h1 style={{ marginBottom: 5 }}>{titulo}</h1>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{rf}</span>
              <span className="badge badge-muted">{scr}</span>
              <span className="badge badge-purple">Enterprise Tier</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.75, margin: 0 }}>{desc}</p>
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {QUICK_LINKS.map(label => (
            <div
              key={label}
              className="card"
              style={{
                padding: '11px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
                background: hovered === label ? 'var(--s3)' : 'var(--s2)',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={() => setHovered(label)}
              onMouseLeave={() => setHovered(null)}
            >
              <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>{label}</span>
              <ChevronRight size={13} style={{ color: 'var(--tx-3)' }} />
            </div>
          ))}
        </div>

        {/* Activation banner */}
        <div className="card" style={{ padding: '14px 18px', background: 'var(--purple-dim)', border: '1px solid rgba(139,92,246,0.22)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'rgba(139,92,246,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Lock size={13} style={{ color: 'var(--purple)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 3 }}>
                Módulo Enterprise — Activación requerida
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.6 }}>
                Disponible en el plan Enterprise. Contacta a tu account manager para habilitar este módulo en tu instancia.
              </div>
              <button className="btn btn-sm" style={{ marginTop: 10, background: 'rgba(139,92,246,0.18)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.3)', height: 28 }}>
                Solicitar activación
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────
function KPI({ label, value, prefix = '', suffix = '', delta, icon: Icon, decimals = 0 }: {
  label: string; value: number; prefix?: string; suffix?: string;
  delta?: { val: number; label: string }; icon: React.ElementType; decimals?: number
}) {
  const positive = delta && delta.val >= 0
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, background: 'var(--s3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} style={{ color: 'var(--tx-2)' }} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--tx)', marginBottom: 8 }} className="count-up">
        <Counter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          {positive
            ? <ArrowUpRight size={12} style={{ color: 'var(--green)' }} />
            : <ArrowDownRight size={12} style={{ color: 'var(--red)' }} />}
          <span style={{ color: positive ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
            {delta.val > 0 ? '+' : ''}{delta.val}%
          </span>
          <span style={{ color: 'var(--tx-3)' }}>{delta.label}</span>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
import { B2BTalentMarketplace } from './B2BTalentMarketplace'
import { BehavioralAnalytics } from './BehavioralAnalytics'
import { FederatedLearningConfig } from './FederatedLearningConfig'
import { AgenticSwarmOrchestrator } from './AgenticSwarmOrchestrator'
import { EcosistemaPlugins } from './EcosistemaPlugins'
import { SensorBullying } from '../docente/SensorBullying'
import { GestorEspacios } from './GestorEspacios'
import { CentroAvisos } from '../shared/CentroAvisos'
import { BancoItemesLLM } from '../docente/BancoItemesLLM'
import { SincronizacionERP } from './SincronizacionERP'
import { ScoringBecasIA } from './ScoringBecasIA'
import { PlanInclusionPIE } from '../docente/PlanInclusionPIE'
import { NominaInteligente } from './NominaInteligente'
import { MantenimientoPredictivo } from './MantenimientoPredictivo'
import { ProtocolosCrisis } from './ProtocolosCrisis'
import { KnowledgeGraphView } from './KnowledgeGraphView'
import { HorariosGeneticos } from './HorariosGeneticos'
import { CentroPrivacidadGDPR } from './CentroPrivacidadGDPR'
import { ObservatorioClima } from './ObservatorioClima'

export default function DashboardDirector({ view }: { view: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetchEducData('analytics/director').then(d => {
      (window as any).__dashboardData = d;
      setData(d);
    }).catch(console.error);
  }, []);

  if (!data) return <div style={{padding: 40, color: 'var(--tx-2)'}}>Cargando analíticas...</div>;

  if (view === 'b2b-talento') return <B2BTalentMarketplace />
  if (view === 'behavioral')  return <BehavioralAnalytics />
  if (view === 'federated')   return <FederatedLearningConfig />
  if (view === 'agentic-swarm') return <AgenticSwarmOrchestrator />
  if (view === 'plugins')     return <EcosistemaPlugins />
  if (view === 'prevencion-bullying') return <SensorBullying />
  if (view === 'gestor-espacios') return <GestorEspacios />
  if (view === 'knowledge-graph') return <KnowledgeGraphView />
  if (view === 'matricula')   return <ViewMatricula />
  if (view === 'direccion')   return <ViewDireccion />
  if (view === 'avisos')      return <CentroAvisos />
  if (view === 'banco-itemes') return <BancoItemesLLM />
  if (view === 'erp')         return <SincronizacionERP />
  if (view === 'horarios')    return <HorariosGeneticos />
  if (view === 'gdpr')        return <CentroPrivacidadGDPR />
  if (view === 'clima')       return <ObservatorioClima />
  if (view === 'becas')       return <ScoringBecasIA />
  if (view === 'pie')         return <PlanInclusionPIE />
  if (view === 'nomina')      return <NominaInteligente />
  if (view === 'mantenimiento') return <MantenimientoPredictivo />
  if (view === 'crisis')      return <ProtocolosCrisis />
  if (view === 'finanzas')    return <ViewFinanzas />
  if (view === 'pasaporte')   return <ViewPasaporte />
  if (view === 'marketplace') return <ViewMarketplace />
  if (view === 'agentes-ia')  return <ViewAgentesIA />
  if (view === 'analytics')   return <ViewAnalytics />
  if (view === 'usuarios')    return <ViewUsuarios />
  if (view === 'reportes')    return <ViewReportes />
  if (view === 'ews')              return <ViewEWS />
  if (view === 'gamificacion')     return <ViewGamificacion />
  // ── Enterprise M11 ─────────────────────────────────────────
  if (view === 'laboratorio-3d')   return <EnterpriseView icon={Zap}          titulo="Laboratorio 3D WebGL"              desc="Canvas interactivo de simulaciones científicas en tiempo real (WebGL / Three.js). Permite al estudiante manipular variables, observar reacciones y generar reporte de laboratorio."                        rf="RF-043" scr="SCR-043" />
  if (view === 'asistencia-qr')    return <EnterpriseView icon={QrCode}       titulo="Asistencia QR Dinámico"            desc="Proyección de código QR rotativo HMAC cada 15 s para registro de asistencia. Lector de cámara con validación de geofencing en tiempo real para el estudiante."                              rf="RF-044" scr="SCR-044" />
  if (view === 'clanes')           return <EnterpriseView icon={Trophy}        titulo="Hub de Clanes P2P"                desc="Sistema de equipos estudiantiles con racha semanal, ranking inter-clanes y panel de experiencia colectiva (XP). Fomenta colaboración y competencia sana."                                      rf="RF-045" scr="SCR-045" />
  if (view === 'espacios')         return <EnterpriseView icon={Map}           titulo="Gestor de Espacios"               desc="Mapa 2D/3D interactivo de la institución con disponibilidad de aulas y laboratorios por franja horaria. Reserva con 1 clic de espacios con control de capacidad."                         rf="RF-046" scr="SCR-046" />
  if (view === 'checkout-qr')      return <EnterpriseView icon={QrCode}        titulo="Checkout Pensiones QR"            desc="Generador de código QR Yape/Plin/PIX/SPEI con temporizador de confirmación webhook. Emisión automática de comprobante PDF al confirmar el pago."                                       rf="RF-047" scr="SCR-047" />
  if (view === 'convalidacion')    return <EnterpriseView icon={BookOpen}      titulo="Convalidación Curricular NLP"     desc="Visor dual de sílabos (Origen vs Destino) con porcentaje de coincidencia por competencias calculado vía NLP. Aprobación digital con firma electrónica."                                   rf="RF-048" scr="SCR-048" />
  if (view === 'accesibilidad')    return <EnterpriseView icon={Eye}           titulo="Panel de Accesibilidad Universal" desc="Switches para modo dislexia, lector de voz (TTS), subtitulado en Lenguaje de Señas (LSA) y selector de lenguas originarias. Cumplimiento WCAG 2.1 AAA."                               rf="RF-049" scr="SCR-049" />
  if (view === 'transparencia')    return <EnterpriseView icon={Globe}         titulo="Portal de Transparencia"          desc="Dashboard público con gráficos de inserción laboral, ejecución presupuestal y verificador del sello criptográfico institucional. URL pública por tenant."                                 rf="RF-050" scr="SCR-050" />
  if (view === 'cat-irt')          return <EnterpriseView icon={BarChart2}     titulo="Engine CAT/IRT"                   desc="Evaluación adaptativa computerizada en vivo con estimación de habilidad θ (IRT). Las preguntas se calibran automáticamente según el rendimiento del estudiante."                          rf="RF-051" scr="SCR-051" />
  if (view === 'proctoring')       return <EnterpriseView icon={Monitor}       titulo="Monitor Proctoring IA"            desc="Supervisión multimodal de exámenes con detección de anomalías por visión computacional. Dashboard de flags de incidencias con evidencia fotográfica."                                     rf="RF-052" scr="SCR-052" />
  if (view === 'peer-review')      return <EnterpriseView icon={Users}         titulo="Peer-Review Ciego"               desc="Canvas de evaluación entre pares con identidades anónimas. Sistema de calibración para reducir sesgos y métricas de consistencia entre evaluadores."                                      rf="RF-053" scr="SCR-053" />
  if (view === 'banco-items')      return <EnterpriseView icon={Database}      titulo="Banco de Ítemes LLM"              desc="Repositorio de reactivos con generador automático vía LLM. Clasificación por bloom, dificultad y área. Validación estadística IRT por ítem."                                            rf="RF-054" scr="SCR-054" />
  if (view === 'psicoaptitudinal') return <EnterpriseView icon={Target}        titulo="Diagnóstico Psico-Aptitudinal"   desc="Radar de habilidades blandas: inteligencias múltiples, estilos de aprendizaje y aptitudes vocacionales. Generado con IA a partir de micro-interacciones."                               rf="RF-055" scr="SCR-055" />
  if (view === 'nomina')           return <EnterpriseView icon={DollarSign}    titulo="Nómina Docente"                   desc="Portal de Recursos Humanos con pre-nómina mensual, registro de marcaciones, contratos y liquidaciones. Integración con SAP/Oracle vía API."                                            rf="RF-056" scr="SCR-056" />
  if (view === 'horarios')         return <EnterpriseView icon={Calendar}      titulo="Optimizador de Horarios"          desc="Generación de horarios sin cruces mediante algoritmos genéticos. Respeta restricciones docentes, disponibilidad de aulas y carga horaria máxima."                                       rf="RF-057" scr="SCR-057" />
  if (view === 'gobernanza')       return <EnterpriseView icon={Landmark}      titulo="Sala de Gobernanza"               desc="Reuniones virtuales de junta directiva con actas firmadas E2E cifradas. Votaciones con trazabilidad inmutable y quórum automatizado."                                                   rf="RF-058" scr="SCR-058" />
  if (view === 'mantenimiento')    return <EnterpriseView icon={RefreshCw}     titulo="Inventario y Mantenimiento"       desc="Control de activos institucionales con lector QR/RFID. Mantenimiento predictivo basado en uso real. Órdenes de trabajo automatizadas."                                                  rf="RF-059" scr="SCR-059" />
  if (view === 'becas')            return <EnterpriseView icon={Award}         titulo="Scoring Estratégico de Becas"     desc="Evaluación socioeconómica automatizada con scoring multivariable. Asignación equitativa de becas parciales y totales con trazabilidad de criterios."                                   rf="RF-060" scr="SCR-060" />
  if (view === 'emergencias')      return <EnterpriseView icon={AlertTriangle} titulo="Protocolos de Emergencia"         desc="Botón de pánico con activación masiva de protocolos. Mapa de evacuación interactivo en tiempo real con geolocalización de alumnos."                                                    rf="RF-061" scr="SCR-061" />
  if (view === 'auditoria')        return <EnterpriseView icon={Lock}          titulo="Bitácora de Auditoría"            desc="Log viewer SHA-256 con cadena Merkle inmutable. Cada acción del sistema queda registrada con hash verificable e identidad del actor."                                                  rf="RF-062" scr="SCR-062" />
  if (view === 'salud-mental')     return <EnterpriseView icon={Heart}         titulo="Radar de Salud Mental"            desc="Triage confidencial psicopedagógico con detección temprana de señales de estrés, ansiedad y burnout académico. Derivación automática a especialistas."                                  rf="RF-063" scr="SCR-063" />
  if (view === 'red-social')       return <EnterpriseView icon={MessageSquare} titulo="Red Social Académica"             desc="Feed estudiantil con moderador anti-bullying NLP en tiempo real. Grupos por clase, proyectos colaborativos y canal de logros compartibles."                                             rf="RF-064" scr="SCR-064" />
  if (view === 'iep-pie')          return <EnterpriseView icon={Star}          titulo="Planes IEP / PIE"                 desc="Gestor de Planes de Inclusión para NEE (Necesidades Educativas Especiales). Adaptación curricular personalizada con seguimiento trimestral y firma digital."                             rf="RF-065" scr="SCR-065" />
  if (view === 'clima')            return <EnterpriseView icon={Thermometer}   titulo="Clima Institucional"              desc="Mapa de calor eNPS con encuestas de sentimiento anónimas. Análisis de tendencias por sección, grado y período. Alertas de deterioro de clima."                                        rf="RF-066" scr="SCR-066" />
  if (view === 'alumni')           return <EnterpriseView icon={GraduationCap} titulo="Hub Lifelong Alumni"              desc="Directorio verificado de egresados con carnet digital y Proof of Skill vigente. Red de mentores, bolsa laboral y estadísticas de inserción."                                           rf="RF-067" scr="SCR-067" />
  if (view === 'esg')              return <EnterpriseView icon={Leaf}          titulo="Dashboard ESG"                    desc="Métricas de impacto ambiental, social y de gobernanza (GRI). Huella de carbono del campus, proyectos sociales activos y ranking de sostenibilidad."                                    rf="RF-068" scr="SCR-068" />
  if (view === 'aprendizaje-servicio') return <EnterpriseView icon={Heart}    titulo="Aprendizaje-Servicio"             desc="Portal de voluntariado y proyectos ApS con ONG vinculadas. Registro de horas de servicio, impacto medido y créditos académicos asociados."                                             rf="RF-069" scr="SCR-069" />
  if (view === 'clubes')           return <EnterpriseView icon={Users}         titulo="Clubes y Co-curriculares"         desc="Ecosistema de vida estudiantil: gestión de clubes, torneos, eventos culturales y deportivos. Inscripción digital, asistencia y reconocimientos."                                       rf="RF-070" scr="SCR-070" />
  return <ViewDashboard />
}

// ── Dashboard principal ────────────────────────────────────────
function ViewDashboard() {
  const [tab, setTab] = useState<'academico' | 'financiero'>('academico')

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader
        title="Dashboard"
        sub="Semestre 2026-I · Vista general de la institución"
        actions={
          <>
            <button className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Actualizar</button>
            <button className="btn btn-primary btn-sm"><Download size={13} /> Exportar</button>
          </>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Estudiantes inscritos"  value={kpisDirector.inscritos}        icon={Users}         delta={{ val: 4.2,  label: 'vs sem. ant.' }} />
        <KPI label="Tasa de retención"      value={kpisDirector.tasaRetencion}    icon={TrendingUp}    suffix="%" delta={{ val: 2.1, label: 'vs sem. ant.' }} />
        <KPI label="Promedio institucional" value={kpisDirector.promedioGeneral}  icon={BookOpen}      suffix="/10" decimals={1} delta={{ val: 0.3, label: 'vs sem. ant.' }} />
        <KPI label="Estudiantes en riesgo"  value={kpisDirector.estudiantesRiesgo} icon={AlertTriangle} delta={{ val: -8, label: 'vs sem. ant.' }} />
      </div>

      {/* Recaudación bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Recaudación 2026-I</span>
          <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>{kpisDirector.pctRecaudacion}%</span>
        </div>
        <div className="progress-track" style={{ height: 5 }}>
          <div className="progress-fill" style={{ width: `${kpisDirector.pctRecaudacion}%`, background: 'var(--blue)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--tx-3)' }}>
          <span>Recaudado: <strong style={{ color: 'var(--tx-2)' }}>${kpisDirector.recaudado.toLocaleString()}</strong></span>
          <span>Meta: ${kpisDirector.ingresoProyectado.toLocaleString()}</span>
          <span>Deuda: <strong style={{ color: 'var(--red)' }}>${kpisDirector.deudaPendiente.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Tabs + charts */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['academico', 'financiero'] as const).map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontWeight: tab === t ? 600 : 400, textTransform: 'capitalize' }}
            onClick={() => setTab(t)}>
            {t === 'academico' ? 'Académico' : 'Financiero'}
          </button>
        ))}
      </div>

      {tab === 'academico' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 260px', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Tasa de retención</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={retencionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
                <YAxis domain={[88, 96]} tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Line type="monotone" dataKey="tasa" stroke="var(--blue)" strokeWidth={2} dot={{ fill: 'var(--blue)', r: 3 }} name="%" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Distribución de riesgo</div>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={riesgoDistribucion} cx="50%" cy="50%" innerRadius={36} outerRadius={52} dataKey="value" strokeWidth={0}>
                  {riesgoDistribucion.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CT />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {riesgoDistribucion.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="dot" style={{ background: d.color }} />
                    <span style={{ color: 'var(--tx-2)' }}>{d.name}</span>
                  </div>
                  <span style={{ color: 'var(--tx-2)', fontWeight: 500 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Indicadores operativos</div>
            {[
              { label: 'Cobertura docente',       value: '100%',  status: 'green' },
              { label: 'Conflictos de horario',    value: '3',     status: 'amber' },
              { label: 'Certificados pendientes',  value: '8',     status: 'blue' },
              { label: 'Tasa de reprobación',      value: '2.1%',  status: 'green' },
            ].map(i => (
              <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--tx-2)' }}>{i.label}</span>
                <span className={`badge badge-${i.status}`}>{i.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Ingresos vs Egresos YTD</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={financieroYTD} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CT />} />
                <Bar dataKey="ingresos" fill="var(--blue)" radius={[3,3,0,0]} name="Ingresos" />
                <Bar dataKey="egresos"  fill="var(--s4)"   radius={[3,3,0,0]} name="Egresos"  />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>KPIs financieros</div>
            {[
              { label: 'Ingresos proyectados', value: `$${(kpisDirector.ingresoProyectado/1000).toFixed(0)}K` },
              { label: 'Recaudado',             value: `$${(kpisDirector.recaudado/1000).toFixed(1)}K` },
              { label: '% Recaudación',         value: `${kpisDirector.pctRecaudacion}%` },
              { label: 'Deuda pendiente',       value: `$${(kpisDirector.deudaPendiente/1000).toFixed(1)}K` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--tx-2)' }}>{r.label}</span>
                <strong>{r.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Docentes table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Planta docente</span>
          <span style={{ fontSize: 12, color: 'var(--tx-3)' }}>{docentes.length} docentes activos</span>
        </div>
        <table className="table">
          <thead><tr>
            <th>Docente</th><th>Materia</th><th>Cursos</th><th>Carga</th><th>Evaluación</th>
          </tr></thead>
          <tbody>
            {docentes.map(d => (
              <tr key={d.id}>
                <td style={{ color: 'var(--tx)', fontWeight: 500 }}>{d.nombre}</td>
                <td>{d.materia}</td>
                <td><div style={{ display: 'flex', gap: 4 }}>{d.cursos.map(c => <span key={c} className="badge badge-muted">{c}</span>)}</div></td>
                <td>{d.carga} hrs/sem</td>
                <td>{d.evaluacion
                  ? <span className="badge badge-green"><CheckCircle2 size={10} /> {d.evaluacion}/10</span>
                  : <span className="badge badge-amber"><Clock size={10} /> Pendiente</span>
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Matrícula ──────────────────────────────────────────────────
function ViewMatricula() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Matrícula" sub="Resumen de inscripciones del Semestre 2026-I"
        actions={<button className="btn btn-primary btn-sm">Nueva inscripción</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Total inscritos"  value={245} icon={Users}         delta={{ val: 8.2,  label: 'vs sem. ant.' }} />
        <KPI label="Cupos disponibles" value={55}  icon={BookOpen} />
        <KPI label="Deuda total ($)"  value={42500} prefix="$" icon={DollarSign} delta={{ val: -5, label: 'vs mes ant.' }} />
      </div>
      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Inscripciones recientes</span>
          <button className="btn btn-ghost btn-sm">Ver todas <ChevronRight size={12} /></button>
        </div>
        <table className="table">
          <thead><tr><th>Estudiante</th><th>Curso</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {[
              { nombre: 'Juan Pérez',   curso: '10-A', monto: 1200, estado: 'pagado',   fecha: '15 May' },
              { nombre: 'María García', curso: '9-B',  monto: 900,  estado: 'pendiente', fecha: '14 May' },
              { nombre: 'Carlos López', curso: '11-C', monto: 1500, estado: 'deuda',    fecha: '13 May' },
              { nombre: 'Ana Martínez', curso: '10-C', monto: 1200, estado: 'pagado',   fecha: '12 May' },
              { nombre: 'Luis Herrera', curso: '9-A',  monto: 900,  estado: 'pendiente', fecha: '11 May' },
            ].map(i => (
              <tr key={i.nombre}>
                <td style={{ color: 'var(--tx)', fontWeight: 500 }}>{i.nombre}</td>
                <td><span className="badge badge-muted">{i.curso}</span></td>
                <td style={{ fontWeight: 500 }}>${i.monto.toLocaleString()}</td>
                <td>
                  {i.estado === 'pagado'
                    ? <span className="badge badge-green"><span className="dot dot-green" /> Pagado</span>
                    : i.estado === 'pendiente'
                    ? <span className="badge badge-amber"><span className="dot dot-amber" /> Pendiente</span>
                    : <span className="badge badge-red"><span className="dot dot-red" /> Deuda</span>}
                </td>
                <td style={{ color: 'var(--tx-3)', fontSize: 12 }}>{i.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Dirección ──────────────────────────────────────────────────
function ViewDireccion() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Dirección" sub="Panel de gestión institucional y gobierno escolar"
        actions={<button className="btn btn-ghost btn-sm"><Download size={13} /> Exportar informe</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Promedio institucional" value={7.8} suffix="/10" decimals={1} icon={TrendingUp} delta={{ val: 0.3, label: 'vs sem. ant.' }} />
        <KPI label="Tasa de aprobación"     value={97.9} suffix="%" decimals={1} icon={CheckCircle2} />
        <KPI label="Tasa de reprobación"    value={2.1}  suffix="%" decimals={1} icon={AlertTriangle} delta={{ val: -0.4, label: 'vs sem. ant.' }} />
        <KPI label="Docentes evaluados"     value={14}   icon={Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Gestión de docentes</div>
          <table className="table">
            <thead><tr><th>Docente</th><th>Materia</th><th>Carga</th><th>Eval.</th></tr></thead>
            <tbody>
              {docentes.map(d => (
                <tr key={d.id}>
                  <td style={{ color: 'var(--tx)', fontWeight: 500 }}>{d.nombre}</td>
                  <td>{d.materia}</td>
                  <td>{d.carga}h</td>
                  <td>{d.evaluacion
                    ? <span className="badge badge-green">{d.evaluacion}</span>
                    : <span className="badge badge-amber">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Acciones pendientes</div>
          {[
            { label: 'Evaluar a Prof. García',          estado: 'pendiente', prioridad: 'alta' },
            { label: 'Resolver 3 conflictos de horario', estado: 'pendiente', prioridad: 'alta' },
            { label: 'Revisar 8 certificados',           estado: 'pendiente', prioridad: 'media' },
            { label: 'Aprobar plan curricular 11-C',     estado: 'pendiente', prioridad: 'media' },
            { label: 'Firmar actas de consejo',          estado: 'completado', prioridad: 'baja' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.estado === 'completado'
                  ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />
                  : <Clock size={13} style={{ color: a.prioridad === 'alta' ? 'var(--red)' : 'var(--amber)' }} />}
                <span style={{ color: a.estado === 'completado' ? 'var(--tx-3)' : 'var(--tx-2)', textDecoration: a.estado === 'completado' ? 'line-through' : 'none' }}>{a.label}</span>
              </div>
              <span className={`badge badge-${a.prioridad === 'alta' ? 'red' : a.prioridad === 'media' ? 'amber' : 'muted'}`}>
                {a.prioridad}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Finanzas ───────────────────────────────────────────────────
function ViewFinanzas() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Finanzas" sub="Resumen financiero institucional en tiempo real"
        actions={<button className="btn btn-ghost btn-sm"><Download size={13} /> Exportar</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Ingresos hoy ($)"  value={45200}  prefix="$" icon={DollarSign} delta={{ val: 18.3, label: 'vs ayer' }} />
        <KPI label="Flujo neto ($)"    value={12800}  prefix="+" icon={TrendingUp} />
        <KPI label="Deuda total ($)"   value={38500}  prefix="$" icon={AlertTriangle} delta={{ val: -5, label: 'vs mes ant.' }} />
        <KPI label="Transacciones"     value={234}    icon={RefreshCw} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Flujo de caja 2026</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { mes: 'Ene', ingresos: 45000, egresos: 28000 },
              { mes: 'Feb', ingresos: 52000, egresos: 31000 },
              { mes: 'Mar', ingresos: 48000, egresos: 30000 },
              { mes: 'Abr', ingresos: 61000, egresos: 33000 },
              { mes: 'May', ingresos: 58000, egresos: 35000 },
            ]} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CT />} />
              <Bar dataKey="ingresos" fill="var(--blue)" radius={[3,3,0,0]} name="Ingresos" />
              <Bar dataKey="egresos"  fill="var(--s4)"   radius={[3,3,0,0]} name="Egresos"  />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Deudores por riesgo</div>
          {deudores.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--tx-2)' }}>{d.familia}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--tx)' }}>${d.monto.toLocaleString()}</span>
                <span className={`badge badge-${d.score === 'alto' ? 'red' : d.score === 'medio' ? 'amber' : 'green'}`}>{d.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Pasaporte Digital ──────────────────────────────────────────
function ViewPasaporte() {
  const [tab, setTab] = useState<'academica' | 'competencias' | 'historial'>('academica')
  const d = pasaporteData

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Pasaporte Digital" sub="Identidad académica portátil verificada en blockchain"
        actions={
          <>
            <button className="btn btn-ghost btn-sm"><Download size={13} /> Descargar</button>
            <button className="btn btn-primary btn-sm">Transferir institución</button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Identity card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fingerprint size={18} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'monospace' }}>{d.id}</div>
            </div>
          </div>
          {[
            { label: 'DNI',            value: d.dni,              verified: true },
            { label: 'Colegio actual', value: d.colegioActual,    verified: false },
            { label: 'Colegios previos', value: String(d.colegiosAnteriores), verified: false },
            { label: 'Registro',       value: d.creado,           verified: false },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 2 }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--tx-2)' }}>{f.value}</span>
                {f.verified && <span className="badge badge-green" style={{ fontSize: 10 }}><CheckCircle2 size={9} /> Verificado</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs content */}
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {(['academica', 'competencias', 'historial'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${tab === t ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => setTab(t)}>
                {t === 'academica' ? 'Perfil académico' : t === 'competencias' ? 'Competencias IA' : 'Historial'}
              </button>
            ))}
          </div>

          {tab === 'academica' && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Grado actual: {d.historial[d.historial.length - 1].grado}° · Promedio: {d.historial[d.historial.length - 1].promedio}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {d.historial.slice(-3).map(h => (
                  <div key={h.grado} className="card-inner" style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 4 }}>Grado {h.grado} · {h.año}</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{h.promedio}</div>
                    <div className="progress-track" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${(h.promedio / 10) * 100}%`, background: 'var(--blue)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'competencias' && (
            <div className="card" style={{ padding: 16 }}>
              {d.competencias.map(c => (
                <div key={c.area} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--tx-2)' }}>{c.area}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-blue">{c.nivel}</span>
                      <span style={{ fontWeight: 600 }}>{c.pct}%</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${c.pct}%`, background: c.pct >= 90 ? 'var(--green)' : c.pct >= 80 ? 'var(--blue)' : 'var(--amber)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'historial' && (
            <div className="card">
              <table className="table">
                <thead><tr><th>Grado</th><th>Año</th><th>Promedio</th><th>Estado</th></tr></thead>
                <tbody>
                  {d.historial.map(h => (
                    <tr key={h.grado}>
                      <td style={{ fontWeight: 500, color: 'var(--tx)' }}>Grado {h.grado}</td>
                      <td>{h.año}</td>
                      <td><strong>{h.promedio}</strong></td>
                      <td><span className="badge badge-green"><CheckCircle2 size={10} /> Completado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Marketplace ────────────────────────────────────────────────
function ViewMarketplace() {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<number[]>([])
  const filtered = marketplaceProducts.filter(p =>
    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.autor.toLowerCase().includes(search.toLowerCase())
  )
  const toggle = (id: number) => setCart(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Marketplace" sub="Contenido educativo verificado para tu institución"
        actions={
          cart.length > 0
            ? <button className="btn btn-primary btn-sm">Carrito ({cart.length}) · Pagar</button>
            : undefined
        }
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 12px' }}>
          <ShoppingBag size={13} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
          <input placeholder="Buscar contenido..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', padding: 0, flex: 1, outline: 'none', fontSize: 13, color: 'var(--tx)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => {
          const inCart = cart.includes(p.id)
          return (
            <div key={p.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 36, height: 36, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={15} style={{ color: 'var(--tx-2)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p.titulo}</span>
                  <span className="badge badge-muted">{p.tipo}</span>
                  {p.tags.map(t => <span key={t} className="badge badge-blue" style={{ fontSize: 10 }}>{t}</span>)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>
                  {p.autor} · {p.colegios}+ colegios · {p.reviews} reseñas
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Star size={12} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{p.rating}</span>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>${p.precio}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--tx-3)' }}>/mes</span></div>
              </div>
              <button className={`btn btn-sm ${inCart ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggle(p.id)}>
                {inCart ? 'En carrito' : 'Agregar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Agentes IA ─────────────────────────────────────────────────
function ViewAgentesIA() {
  const [approved, setApproved] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Agentes IA" sub="Supervisión y control de agentes autónomos"
        actions={<button className="btn btn-ghost btn-sm">Configurar agentes</button>} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {agentesIA.map(agent => (
          <div key={agent.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} style={{ color: 'var(--blue)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{agent.nombre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span className="dot dot-green" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Ejecutando</span>
                </div>
              </div>
              <span className="badge badge-muted">{agent.accionesHoy} acciones hoy</span>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agent.logs.map(log => {
                const key = `${agent.id}-${log.hora}`
                const isApproved = approved.includes(key)
                const isRejected = rejected.includes(key)
                return (
                  <div key={log.hora} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--s3)', border: '1px solid var(--border)' }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {(isApproved || log.estadoAccion === 'aprobada' || log.estadoAccion === 'ejecutada')
                        ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />
                        : isRejected
                        ? <XCircle size={13} style={{ color: 'var(--red)' }} />
                        : log.estadoAccion === 'en_progreso'
                        ? <RefreshCw size={13} style={{ color: 'var(--blue)', animation: 'spin 1.5s linear infinite' }} />
                        : <Clock size={13} style={{ color: 'var(--amber)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'monospace' }}>{log.hora}</span>
                        <span className={`badge badge-${isApproved || log.estadoAccion === 'aprobada' || log.estadoAccion === 'ejecutada' ? 'green' : isRejected ? 'red' : log.estadoAccion === 'pendiente' ? 'amber' : 'blue'}`}>
                          {isApproved ? 'Aprobada' : isRejected ? 'Rechazada' : log.estadoAccion === 'aprobada' ? 'Aprobada' : log.estadoAccion === 'ejecutada' ? 'Ejecutada' : log.estadoAccion === 'pendiente' ? 'Pendiente' : log.estadoAccion === 'enviada' ? 'Enviada' : 'En progreso'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: log.propuesta ? 4 : 0 }}>{log.mensaje}</div>
                      {log.propuesta && (
                        <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Propuesta: {log.propuesta}</div>
                      )}
                      {log.estadoAccion === 'pendiente' && !isApproved && !isRejected && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setApproved(p => [...p, key])}>Aprobar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejected(p => [...p, key])}>Rechazar</button>
                          <button className="btn btn-ghost btn-sm">Ver detalle</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}

// ── Analytics ──────────────────────────────────────────────────
function ViewAnalytics() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Analytics" sub="Análisis de viralidad, CAC y crecimiento B2B"
        actions={<button className="btn btn-ghost btn-sm"><Download size={13} /> Exportar</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KPI label="Instituciones activas" value={30}  icon={Building2} delta={{ val: 25, label: 'este mes' }} />
        <KPI label="CAC promedio ($)"      value={5000} prefix="$" icon={DollarSign} delta={{ val: -12, label: 'vs mes ant.' }} />
        <KPI label="Logros compartidos"   value={805}  icon={TrendingUp} delta={{ val: 34, label: 'este mes' }} />
        <KPI label="Leads generados"      value={8}    icon={Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Adquisición por canal — Mayo 2026</div>
          <table className="table">
            <thead><tr><th>Canal</th><th>Instituciones</th><th>CAC</th></tr></thead>
            <tbody>
              {analyticsCanales.map(c => (
                <tr key={c.canal}>
                  <td style={{ color: 'var(--tx)', fontWeight: 500 }}>{c.canal}</td>
                  <td>{c.instituciones}</td>
                  <td style={{ fontWeight: 600 }}>${c.cac.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Logros más compartidos</div>
          {logrosCompartidos.map((l, i) => (
            <div key={l.logro} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ fontSize: 11, color: 'var(--tx-3)', width: 16, textAlign: 'center' }}>{i + 1}</span>
              <span style={{ flex: 1, color: 'var(--tx-2)' }}>{l.logro}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="progress-track" style={{ width: 80 }}>
                  <div className="progress-fill" style={{ width: `${(l.shares / 320) * 100}%`, background: 'var(--blue)' }} />
                </div>
                <span style={{ fontWeight: 600, minWidth: 32, textAlign: 'right' }}>{l.shares}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Usuarios ───────────────────────────────────────────────────
function ViewUsuarios() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Usuarios" sub="Gestión de accesos y roles del sistema"
        actions={<button className="btn btn-primary btn-sm">Invitar usuario</button>} />
      <div className="card">
        <table className="table">
          <thead><tr><th>Nombre</th><th>Rol</th><th>Email</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 4, background: 'var(--s4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--tx-2)', flexShrink: 0 }}>
                      {u.nombre.charAt(0)}
                    </div>
                    <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{u.nombre}</span>
                  </div>
                </td>
                <td><span className="badge badge-muted">{u.rol}</span></td>
                <td style={{ fontSize: 12 }}>{u.email}</td>
                <td>
                  {u.estado === 'activo'
                    ? <span className="badge badge-green"><span className="dot dot-green" /> Activo</span>
                    : <span className="badge badge-muted"><span className="dot dot-muted" /> Inactivo</span>}
                </td>
                <td style={{ fontSize: 12, color: 'var(--tx-3)' }}>{u.ultimo}</td>
                <td><button className="btn btn-ghost btn-sm"><MoreHorizontal size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Reportes ───────────────────────────────────────────────────
function ViewReportes() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Reportes" sub="Exporta informes del sistema en múltiples formatos" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {[
          { titulo: 'KPI Institucionales',       desc: 'Métricas clave del semestre 2026-I', formatos: ['PDF', 'Excel'] },
          { titulo: 'Análisis de Desempeño',     desc: 'Rendimiento por grado y sección',    formatos: ['PDF', 'CSV'] },
          { titulo: 'Reporte Financiero',        desc: 'Ingresos, egresos y proyecciones',   formatos: ['PDF', 'Excel', 'JSON'] },
          { titulo: 'Evaluación Docente',        desc: 'Desempeño y carga horaria',          formatos: ['PDF'] },
          { titulo: 'Registro de Matrícula',     desc: 'Inscritos por sección y estado',     formatos: ['PDF', 'CSV'] },
          { titulo: 'Deuda y Morosidad',         desc: 'Historial de pagos y deudores',      formatos: ['PDF', 'Excel'] },
        ].map(r => (
          <div key={r.titulo} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{r.titulo}</div>
              <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{r.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {r.formatos.map(f => (
                <button key={f} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                  <Download size={11} /> {f}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── EWS ──────────────────────────────────────────────────────
function ViewEWS() {
  const [planes, setPlanes] = useState<Record<string, boolean>>({})
  const criticos = ewsStudents.filter(e => e.estado === 'critico' || e.estado === 'alto').length

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Sistema de Alerta Temprana" sub={`EWS · ${criticos} estudiantes en riesgo crítico/alto · Actualizado hace 2 horas`}
        actions={
          <>
            <button className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Actualizar</button>
            <button className="btn btn-primary btn-sm"><Download size={13} /> Exportar</button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Riesgo crítico',  value: ewsStudents.filter(e=>e.estado==='critico').length,  color: 'var(--red)',   badge: 'badge-red'   },
          { label: 'Riesgo alto',     value: ewsStudents.filter(e=>e.estado==='alto').length,      color: 'var(--amber)', badge: 'badge-amber' },
          { label: 'Riesgo medio',    value: ewsStudents.filter(e=>e.estado==='medio').length,     color: 'var(--blue)',  badge: 'badge-blue'  },
          { label: 'En seguimiento',  value: ewsStudents.filter(e=>e.estado==='leve').length,      color: 'var(--green)', badge: 'badge-green' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--tx-2)', marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <span className={`badge ${k.badge}`} style={{ fontSize: 11 }}>estudiantes</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ewsStudents.map(e => {
          const planAprobado = planes[e.nombre]
          const riesgoPct = e.riesgo
          const color = riesgoPct >= 80 ? 'var(--red)' : riesgoPct >= 60 ? 'var(--amber)' : riesgoPct >= 40 ? 'var(--blue)' : 'var(--green)'
          const badgeClass = riesgoPct >= 80 ? 'badge-red' : riesgoPct >= 60 ? 'badge-amber' : 'badge-blue'

          return (
            <div key={e.nombre} className="card" style={{ padding: 16, borderColor: riesgoPct >= 80 ? 'rgba(239,68,68,0.2)' : riesgoPct >= 60 ? 'rgba(245,158,11,0.15)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{e.nombre}</span>
                    <span className="badge badge-muted">{e.curso}</span>
                    <span className={`badge ${badgeClass}`}>Riesgo {e.riesgo}%</span>
                  </div>

                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {e.motivos.map(m => (
                      <span key={m} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--s4)', color: 'var(--tx-3)', border: '1px solid var(--border)' }}>{m}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--tx-3)', marginBottom: 10 }}>
                    <span>Promedio: <strong style={{ color: 'var(--red)' }}>{e.promedio}</strong></span>
                    <span>Asistencia: <strong style={{ color: e.asistencia < 80 ? 'var(--red)' : 'var(--tx-2)' }}>{e.asistencia}%</strong></span>
                    <span>Sin login: <strong style={{ color: 'var(--tx-2)' }}>{e.diasSinLogin} días</strong></span>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)', marginBottom: 4 }}>Score de riesgo</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${riesgoPct}%`, background: color }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color, minWidth: 36 }}>{riesgoPct}%</span>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--s3)', fontSize: 12, borderLeft: `3px solid ${color}` }}>
                    <span style={{ color: 'var(--tx-3)' }}>Plan sugerido IA: </span>
                    <span style={{ color: 'var(--tx-2)' }}>{e.plan}</span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {planAprobado ? (
                    <span className="badge badge-green"><CheckCircle2 size={10} /> Plan aprobado</span>
                  ) : (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => setPlanes(p => ({ ...p, [e.nombre]: true }))}>
                        Aprobar plan
                      </button>
                      <button className="btn btn-ghost btn-sm">Ver historial</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Gamificación ──────────────────────────────────────────────
const BADGE_ICON_MAP: Record<number, React.ElementType> = {
  1: Star, 2: Calendar, 3: Users, 4: BookOpen, 5: BarChart2, 6: CheckCircle2,
}
const MISION_ICON_MAP: Record<string, React.ElementType> = {
  academico: BookOpen, asistencia: Calendar, evaluacion: BarChart2, participacion: Users,
}
const PODIUM_COLORS = ['var(--amber)', 'var(--tx-3)', 'var(--tx-3)']
const PODIUM_BG     = ['rgba(245,158,11,0.12)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.04)']
const PODIUM_BORDER = ['rgba(245,158,11,0.28)', 'rgba(148,163,184,0.18)', 'rgba(180,120,60,0.18)']

function ViewGamificacion() {
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'misiones'>('leaderboard')

  const TABS: { id: typeof tab; label: string; icon: React.ElementType }[] = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'badges',      label: 'Badges',      icon: Star   },
    { id: 'misiones',    label: 'Misiones',     icon: Target },
  ]

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Gamificación" sub="Badges, XP, Ranking y Misiones · Semestre 2026-I" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`btn btn-sm ${tab === id ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontWeight: tab === id ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setTab(id)}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {leaderboard.slice(0, 3).map((e, i) => (
              <div key={e.nombre} className="card" style={{ padding: '20px 16px', textAlign: 'center', borderColor: PODIUM_BORDER[i], background: PODIUM_BG[i] }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: PODIUM_BG[i], border: `1.5px solid ${PODIUM_BORDER[i]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: 700, fontSize: 14, color: PODIUM_COLORS[i] }}>
                  {i + 1}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{e.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 10 }}>{e.curso}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: PODIUM_COLORS[i] }}>{e.xp.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>XP</span></div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 4 }}>{e.badges} badges · Prom. {e.promedio}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <table className="table">
              <thead><tr><th>Pos.</th><th>Estudiante</th><th>Curso</th><th>XP</th><th>Badges</th><th>Promedio</th></tr></thead>
              <tbody>
                {leaderboard.map(e => (
                  <tr key={e.nombre}>
                    <td><span style={{ fontWeight: 700, color: e.pos <= 3 ? 'var(--amber)' : 'var(--tx-3)', fontSize: 13 }}>#{e.pos}</span></td>
                    <td style={{ fontWeight: 500, color: 'var(--tx)' }}>{e.nombre}</td>
                    <td><span className="badge badge-muted">{e.curso}</span></td>
                    <td><strong style={{ color: 'var(--blue)' }}>{e.xp.toLocaleString()}</strong></td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={11} style={{ color: 'var(--amber)' }} />{e.badges}</span></td>
                    <td><strong style={{ color: e.promedio >= 8 ? 'var(--green)' : e.promedio >= 6 ? 'var(--tx-2)' : 'var(--red)' }}>{e.promedio}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Badges */}
      {tab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {badges.map(b => {
            const BadgeIcon = BADGE_ICON_MAP[b.id] || Star
            return (
              <div key={b.id} className="card" style={{ padding: 16, opacity: b.desbloqueado ? 1 : 0.5 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: b.desbloqueado ? 'var(--blue-dim)' : 'var(--s3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <BadgeIcon size={18} style={{ color: b.desbloqueado ? 'var(--blue)' : 'var(--tx-3)' }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{b.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 12, lineHeight: 1.5 }}>{b.descripcion}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-blue"><Zap size={10} /> {b.xp} XP</span>
                  {b.desbloqueado
                    ? <span className="badge badge-green"><CheckCircle2 size={10} /> {b.fecha}</span>
                    : <span className="badge badge-muted">Bloqueado</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Misiones */}
      {tab === 'misiones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {misiones.map(m => {
            const pct = Math.round((m.progreso / m.total) * 100)
            const MisionIcon = MISION_ICON_MAP[m.tipo] || Target
            return (
              <div key={m.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--s3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MisionIcon size={15} style={{ color: 'var(--tx-2)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{m.titulo}</span>
                      <span style={{ fontSize: 12, color: 'var(--tx-3)', flexShrink: 0, marginLeft: 12 }}>Expira {m.expira}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--blue)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--tx-3)' }}>
                      <span>{m.progreso}/{m.total} completado</span>
                      <span className="badge badge-blue"><Zap size={10} /> {m.xp} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Missing icon import ────────────────────────────────────────
function Building2({ size, style }: { size: number; style?: React.CSSProperties }) {
  return <BarChart2 size={size} style={style} />
}
