/**
 * EDUCACION OS — Route Map
 *
 * Single source of truth for URL structure.
 *
 * URL Convention:
 *   /                    → redirect to /login
 *   /login               → Login page
 *   /dashboard           → Role-flavored landing
 *   /demi                → DEMI AI assistant
 *   /<domain>            → Domain landing
 *   /<domain>/<view>     → Specific view
 *
 * Permission gate: imported from Module Registry.
 */

/** A route entry in the app */
export interface RouteEntry {
  /** Full URL path */
  path: string
  /** Module view ID (matches MODULE_REGISTRY) */
  viewId: string
  /** Domain identifier */
  domain: string
  /** Human label for breadcrumbs */
  label: string
}

/** Complete flat list of all navigable routes */
export const ROUTE_MAP: RouteEntry[] = [

  // ── Meta ──────────────────────────────────────────────────────────────────
  { path: '/dashboard',              viewId: 'dashboard',              domain: 'meta',          label: 'Dashboard' },
  { path: '/demi',                   viewId: 'demi',                   domain: 'ia',            label: 'DEMI' },
  { path: '/profile',                viewId: 'profile',                domain: 'meta',          label: 'Mi Perfil' },
  { path: '/settings',               viewId: 'settings',               domain: 'meta',          label: 'Ajustes' },

  // ── Educa ─────────────────────────────────────────────────────────────────
  { path: '/educa',                  viewId: 'cursos',                 domain: 'educa',         label: 'Educación' },
  { path: '/educa/cursos',           viewId: 'cursos',                 domain: 'educa',         label: 'Mis Cursos' },
  { path: '/educa/calificaciones',   viewId: 'calificaciones',         domain: 'educa',         label: 'Calificaciones' },
  { path: '/educa/asistencia',       viewId: 'asistencia',             domain: 'educa',         label: 'Asistencia' },
  { path: '/educa/actas',            viewId: 'actas',                  domain: 'educa',         label: 'Actas y Reportes' },
  { path: '/educa/banco-items',      viewId: 'banco-items',            domain: 'educa',         label: 'Banco de Ítemes LLM' },
  { path: '/educa/cat-irt',          viewId: 'cat-irt',                domain: 'educa',         label: 'Engine CAT/IRT' },
  { path: '/educa/proctoring',       viewId: 'proctoring',             domain: 'educa',         label: 'Proctoring IA' },
  { path: '/educa/peer-review',      viewId: 'peer-review',            domain: 'educa',         label: 'Peer-Review Ciego' },
  { path: '/educa/psicoaptitudinal', viewId: 'psicoaptitudinal',       domain: 'educa',         label: 'Evaluación Psico-Aptitudinal' },
  { path: '/educa/asistencia-qr',   viewId: 'asistencia-qr',          domain: 'educa',         label: 'Asistencia QR' },
  { path: '/educa/recursos',         viewId: 'recursos',               domain: 'educa',         label: 'Repositorio de Recursos' },
  { path: '/educa/video-player',     viewId: 'video-player',           domain: 'educa',         label: 'Reproductor HLS' },
  { path: '/educa/lab-3d',           viewId: 'laboratorio-3d',         domain: 'educa',         label: 'Lab 3D WebGL' },

  // ── Educa / IA Educativa ──────────────────────────────────────────────────
  { path: '/educa/ia',               viewId: 'ruta-adaptativa',        domain: 'educa',         label: 'IA Educativa' },
  { path: '/educa/ia/ruta-adaptativa',viewId: 'ruta-adaptativa',       domain: 'educa',         label: 'Ruta Adaptativa' },
  { path: '/educa/ia/gemelo-digital', viewId: 'gemelo-digital',        domain: 'educa',         label: 'Gemelo Digital' },
  { path: '/educa/ia/carga-cognitiva',viewId: 'carga-cognitiva',       domain: 'educa',         label: 'Carga Cognitiva' },

  // ── Educa / Motivación ────────────────────────────────────────────────────
  { path: '/educa/gamificacion',     viewId: 'gamificacion',           domain: 'educa',         label: 'Gamificación' },
  { path: '/educa/badges',           viewId: 'badges',                 domain: 'educa',         label: 'Badges e Insignias' },
  { path: '/educa/misiones',         viewId: 'misiones',               domain: 'educa',         label: 'Misiones y Retos' },

  // ── Finanzas ──────────────────────────────────────────────────────────────
  { path: '/finanzas',               viewId: 'finanzas',               domain: 'finanzas',      label: 'Finanzas' },
  { path: '/finanzas/transacciones', viewId: 'transacciones',          domain: 'finanzas',      label: 'Transacciones' },
  { path: '/finanzas/deudores',      viewId: 'deudores',               domain: 'finanzas',      label: 'Deudores' },
  { path: '/finanzas/pagos',         viewId: 'pagos',                  domain: 'finanzas',      label: 'Realizar Pagos' },
  { path: '/finanzas/tokens',        viewId: 'tokens',                 domain: 'finanzas',      label: 'Economía de Tokens' },
  { path: '/finanzas/erp',           viewId: 'erp',                    domain: 'finanzas',      label: 'Integración ERP' },
  { path: '/finanzas/reportes',      viewId: 'reportes-finanzas',      domain: 'finanzas',      label: 'Reportes Financieros' },
  { path: '/finanzas/reporte-deuda', viewId: 'reportes-deuda',         domain: 'finanzas',      label: 'Reporte de Deuda' },

  // ── EWS ───────────────────────────────────────────────────────────────────
  { path: '/ews',                    viewId: 'ews',                    domain: 'ews',           label: 'Alertas Tempranas' },
  { path: '/ews/alertas',            viewId: 'ews',                    domain: 'ews',           label: 'Alertas EWS' },
  { path: '/ews/behavioral',         viewId: 'behavioral',             domain: 'ews',           label: 'Behavioral Analytics' },

  // ── Comunicación ──────────────────────────────────────────────────────────
  { path: '/comunicacion',           viewId: 'comunicaciones',         domain: 'comunicacion',  label: 'Comunicación' },
  { path: '/comunicacion/chat',      viewId: 'comunicaciones',         domain: 'comunicacion',  label: 'Chat Académico' },
  { path: '/comunicacion/avisos',    viewId: 'avisos',                 domain: 'comunicacion',  label: 'Centro de Avisos' },
  { path: '/comunicacion/circulares',viewId: 'circulares',             domain: 'comunicacion',  label: 'Circulares' },
  { path: '/comunicacion/red-social',viewId: 'red-social',             domain: 'comunicacion',  label: 'Red Social Segura' },
  { path: '/comunicacion/live-stream',viewId: 'live-stream',           domain: 'comunicacion',  label: 'Live Stream Progreso' },

  // ── Institución ───────────────────────────────────────────────────────────
  { path: '/institution',                   viewId: 'dashboard',               domain: 'institution',   label: 'Institución' },
  { path: '/institution/matricula',          viewId: 'matricula',               domain: 'institution',   label: 'Matrícula' },
  { path: '/institution/matricula/nueva',    viewId: 'inscripcion',             domain: 'institution',   label: 'Nueva Inscripción' },
  { path: '/institution/matricula/conflictos',viewId: 'conflictos',             domain: 'institution',   label: 'Conflictos' },
  { path: '/institution/usuarios',           viewId: 'usuarios',                domain: 'institution',   label: 'Gestión de Usuarios' },
  { path: '/institution/espacios',           viewId: 'espacios',                domain: 'institution',   label: 'Gestor de Espacios' },
  { path: '/institution/horarios',           viewId: 'horarios',                domain: 'institution',   label: 'Horarios IA' },
  { path: '/institution/nomina',             viewId: 'nomina',                  domain: 'institution',   label: 'Nómina Docente' },
  { path: '/institution/becas',              viewId: 'becas',                   domain: 'institution',   label: 'Scoring Becas' },
  { path: '/institution/emergencias',        viewId: 'emergencias',             domain: 'institution',   label: 'Protocolos de Crisis' },
  { path: '/institution/mantenimiento',      viewId: 'mantenimiento',           domain: 'institution',   label: 'Mantenimiento Predictivo' },
  { path: '/institution/gobernanza',         viewId: 'gobernanza',              domain: 'institution',   label: 'Gobernanza y Actas' },
  { path: '/institution/privacidad',         viewId: 'privacidad',              domain: 'institution',   label: 'Privacidad GDPR' },
  { path: '/institution/auditoria',          viewId: 'auditoria',               domain: 'institution',   label: 'Auditoría Inmutable' },
  { path: '/institution/transparencia',      viewId: 'transparencia',           domain: 'institution',   label: 'Transparencia' },
  { path: '/institution/clima',              viewId: 'clima',                   domain: 'institution',   label: 'Clima Institucional' },
  { path: '/institution/alumni',             viewId: 'alumni',                  domain: 'institution',   label: 'Alumni Hub' },
  { path: '/institution/esg',                viewId: 'esg',                     domain: 'institution',   label: 'Dashboard ESG' },
  { path: '/institution/benchmarking',       viewId: 'benchmarking',            domain: 'institution',   label: 'Benchmarking' },
  { path: '/institution/reportes',           viewId: 'reportes',                domain: 'institution',   label: 'Exportador de Reportes' },
  { path: '/institution/convalidacion',      viewId: 'convalidacion',           domain: 'institution',   label: 'Convalidación NLP' },
  { path: '/institution/autorizaciones',     viewId: 'autorizaciones',          domain: 'institution',   label: 'Autorizaciones' },
  { path: '/institution/desempeno',          viewId: 'desempeno',               domain: 'institution',   label: 'Panel de Desempeño' },
  { path: '/institution/direccion',          viewId: 'direccion',               domain: 'institution',   label: 'Dirección General' },
  { path: '/institution/analytics',          viewId: 'analytics',               domain: 'institution',   label: 'Analytics' },

  // ── IA Avanzada ───────────────────────────────────────────────────────────
  { path: '/ia',                     viewId: 'demi',                   domain: 'ia',            label: 'Inteligencia Artificial' },
  { path: '/ia/demi',                viewId: 'demi',                   domain: 'ia',            label: 'DEMI' },
  { path: '/ia/agentes',             viewId: 'agentes-ia',             domain: 'ia',            label: 'Enjambre de Agentes' },
  { path: '/ia/knowledge-graph',     viewId: 'knowledge-graph',        domain: 'ia',            label: 'Knowledge Graph' },
  { path: '/ia/federated',           viewId: 'federated',              domain: 'ia',            label: 'Federated Learning' },
  { path: '/ia/plugins',             viewId: 'plugins',                domain: 'ia',            label: 'Ecosistema de Plugins' },

  // ── Bienestar ─────────────────────────────────────────────────────────────
  { path: '/bienestar',              viewId: 'salud-mental',           domain: 'bienestar',     label: 'Bienestar' },
  { path: '/bienestar/salud-mental', viewId: 'salud-mental',           domain: 'bienestar',     label: 'Triage Salud Mental' },
  { path: '/bienestar/bullying',     viewId: 'bullying',               domain: 'bienestar',     label: 'Sensor Anti-Bullying' },
  { path: '/bienestar/clanes',       viewId: 'clanes',                 domain: 'bienestar',     label: 'Clanes P2P' },
  { path: '/bienestar/clubes',       viewId: 'clubes',                 domain: 'bienestar',     label: 'Clubes Co-curriculares' },
  { path: '/bienestar/iep',          viewId: 'iep-pie',                domain: 'bienestar',     label: 'Plan IEP/PIE' },
  { path: '/bienestar/aprendizaje-servicio', viewId: 'aprendizaje-servicio', domain: 'bienestar', label: 'Aprendizaje-Servicio' },
  { path: '/bienestar/p2p-tutoring', viewId: 'p2p-tutoring',           domain: 'bienestar',     label: 'Mercado P2P Tutorías' },

  // ── Identidad ─────────────────────────────────────────────────────────────
  { path: '/identidad',              viewId: 'pasaporte',              domain: 'identidad',     label: 'Identidad Digital' },
  { path: '/identidad/pasaporte',    viewId: 'pasaporte',              domain: 'identidad',     label: 'Pasaporte Digital' },
  { path: '/identidad/marketplace',  viewId: 'marketplace',            domain: 'identidad',     label: 'B2B Talento' },
]

/** Resolve a URL path to its viewId */
export function pathToViewId(pathname: string): string | null {
  // Exact match first
  const exact = ROUTE_MAP.find(r => r.path === pathname)
  if (exact) return exact.viewId

  // Longest prefix match
  const matches = ROUTE_MAP
    .filter(r => pathname.startsWith(r.path))
    .sort((a, b) => b.path.length - a.path.length)
  return matches[0]?.viewId ?? null
}

/** Resolve a viewId to its canonical URL path */
export function viewIdToPath(viewId: string): string {
  const entry = ROUTE_MAP.find(r => r.viewId === viewId)
  return entry?.path ?? `/${viewId}`
}

/** Get breadcrumb trail for a given path */
export function getBreadcrumbs(pathname: string): string[] {
  const entry = ROUTE_MAP.find(r => r.path === pathname)
  if (!entry) return ['Inicio']

  const parts = entry.path.split('/').filter(Boolean)
  const crumbs: string[] = []
  let built = ''

  for (const part of parts) {
    built += `/${part}`
    const match = ROUTE_MAP.find(r => r.path === built)
    if (match) crumbs.push(match.label)
    else crumbs.push(part.charAt(0).toUpperCase() + part.slice(1))
  }

  return crumbs.length > 0 ? crumbs : [entry.label]
}
