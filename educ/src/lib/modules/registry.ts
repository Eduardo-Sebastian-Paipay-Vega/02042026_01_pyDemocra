/**
 * EDUCACION OS — Module Registry
 *
 * Central registry of all product modules/views.
 * This is the SINGLE place where view IDs map to:
 *   - their required permission
 *   - their domain
 *   - their display metadata
 *
 * Adding a new feature = adding one entry here.
 * No role directory needed. No role switch needed.
 */

import type { Permission } from '@educ/lib/rbac/permissions'

export interface ModuleEntry {
  /** Unique view identifier — used by App Router */
  id: string
  /** Human-readable name */
  label: string
  /** Permission required to access this view */
  permission: Permission
  /** Domain group for sidebar organization */
  domain: string
  /** Optional: group within the domain */
  group?: string
}

export const MODULE_REGISTRY: ModuleEntry[] = [
  // ── DEMI ─────────────────────────────────────────────────────────────────
  { id: 'demi',                  label: 'DEMI — Asistente IA',              permission: 'ia:demi:view',                     domain: 'ia' },

  // ── EDUCA ─────────────────────────────────────────────────────────────────
  { id: 'cursos',                label: 'Mis Cursos',                        permission: 'educa:cursos:view',                domain: 'educa', group: 'académico' },
  { id: 'calificaciones',        label: 'Calificaciones',                    permission: 'educa:calificaciones:view',        domain: 'educa', group: 'académico' },
  { id: 'asistencia',            label: 'Asistencia',                        permission: 'educa:asistencia:view',            domain: 'educa', group: 'académico' },
  { id: 'banco-items',           label: 'Banco de Ítemes LLM',               permission: 'educa:items:view',                 domain: 'educa', group: 'evaluación' },
  { id: 'cat-irt',               label: 'Engine CAT/IRT',                    permission: 'educa:cat_irt:view',               domain: 'educa', group: 'evaluación' },
  { id: 'proctoring',            label: 'Proctoring IA',                     permission: 'educa:proctoring:manage',          domain: 'educa', group: 'evaluación' },
  { id: 'peer-review',           label: 'Peer-Review Ciego',                 permission: 'educa:peer_review:view',           domain: 'educa', group: 'evaluación' },
  { id: 'psicoaptitudinal',      label: 'Evaluación Psico-Aptitudinal',      permission: 'educa:psico:view',                 domain: 'educa', group: 'evaluación' },
  { id: 'ruta-adaptativa',       label: 'Ruta de Aprendizaje Adaptativa',   permission: 'educa:adaptive:view',              domain: 'educa', group: 'IA educativa' },
  { id: 'gemelo-digital',        label: 'Gemelo Digital del Estudiante',     permission: 'educa:digital_twin:view',          domain: 'educa', group: 'IA educativa' },
  { id: 'carga-cognitiva',       label: 'Sensor de Carga Cognitiva',         permission: 'educa:cognitive_load:view',        domain: 'educa', group: 'IA educativa' },
  { id: 'gamificacion',          label: 'Gamificación',                      permission: 'educa:gamificacion:view',          domain: 'educa', group: 'motivación' },
  { id: 'badges',                label: 'Badges e Insignias',                permission: 'educa:gamificacion:view',          domain: 'educa', group: 'motivación' },
  { id: 'misiones',              label: 'Misiones y Retos',                  permission: 'educa:gamificacion:view',          domain: 'educa', group: 'motivación' },
  { id: 'laboratorio-3d',        label: 'Laboratorio 3D WebGL',              permission: 'educa:lab3d:view',                 domain: 'educa', group: 'recursos' },
  { id: 'recursos',              label: 'Repositorio de Recursos',           permission: 'educa:cursos:view',                domain: 'educa', group: 'recursos' },
  { id: 'video-player',          label: 'Reproductor HLS',                   permission: 'educa:cursos:view',                domain: 'educa', group: 'recursos' },

  // ── FINANZAS ──────────────────────────────────────────────────────────────
  { id: 'transacciones',         label: 'Transacciones',                     permission: 'finanzas:pagos:view',              domain: 'finanzas' },
  { id: 'deudores',              label: 'Deudores',                          permission: 'finanzas:deudores:view',           domain: 'finanzas' },
  { id: 'pagos',                 label: 'Realizar Pagos',                    permission: 'finanzas:pagos:create',            domain: 'finanzas' },
  { id: 'reportes-finanzas',     label: 'Reportes Financieros',              permission: 'finanzas:reportes:view',           domain: 'finanzas' },
  { id: 'tokens',                label: 'Economía de Tokens',                permission: 'finanzas:tokens:view',             domain: 'finanzas' },
  { id: 'erp',                   label: 'Integración ERP',                   permission: 'finanzas:erp:manage',              domain: 'finanzas' },

  // ── EWS ──────────────────────────────────────────────────────────────────
  { id: 'ews',                   label: 'Alertas Tempranas (EWS)',            permission: 'ews:alerts:view',                  domain: 'ews' },
  { id: 'behavioral',            label: 'Behavioral Analytics',              permission: 'ews:behavioral:view',              domain: 'ews' },

  // ── COMUNICACIÓN ─────────────────────────────────────────────────────────
  { id: 'comunicaciones',        label: 'Chat Académico',                    permission: 'comunicacion:chat:view',           domain: 'comunicacion' },
  { id: 'avisos',                label: 'Centro de Avisos',                  permission: 'comunicacion:avisos:view',         domain: 'comunicacion' },
  { id: 'circulares',            label: 'Circulares Institucionales',        permission: 'comunicacion:circulares:view',     domain: 'comunicacion' },
  { id: 'red-social',            label: 'Red Social Segura',                 permission: 'comunicacion:red_social:view',     domain: 'comunicacion' },
  { id: 'live-stream',           label: 'Live Stream de Progreso',           permission: 'comunicacion:avisos:view',         domain: 'comunicacion' },

  // ── INSTITUCIÓN ───────────────────────────────────────────────────────────
  { id: 'dashboard',             label: 'Dashboard Institucional',           permission: 'institution:view',                 domain: 'institution', group: 'dirección' },
  { id: 'matricula',             label: 'Matrícula',                         permission: 'institution:matricula:view',       domain: 'institution', group: 'dirección' },
  { id: 'inscripcion',           label: 'Nueva Inscripción',                 permission: 'institution:matricula:manage',     domain: 'institution', group: 'dirección' },
  { id: 'usuarios',              label: 'Gestión de Usuarios',               permission: 'institution:usuarios:view',        domain: 'institution', group: 'dirección' },
  { id: 'espacios',              label: 'Gestión de Espacios',               permission: 'institution:espacios:view',        domain: 'institution', group: 'operaciones' },
  { id: 'horarios',              label: 'Horarios IA',                       permission: 'institution:horarios:view',        domain: 'institution', group: 'operaciones' },
  { id: 'asistencia-qr',         label: 'Asistencia QR',                    permission: 'educa:asistencia:manage',          domain: 'institution', group: 'operaciones' },
  { id: 'nomina',                label: 'Nómina Docente',                    permission: 'institution:nomina:view',          domain: 'institution', group: 'rrhh' },
  { id: 'gobernanza',            label: 'Gobernanza y Actas',                permission: 'institution:gobernanza:view',      domain: 'institution', group: 'legal' },
  { id: 'privacidad',            label: 'Privacidad GDPR',                   permission: 'institution:privacidad:view',      domain: 'institution', group: 'legal' },
  { id: 'auditoria',             label: 'Auditoría Inmutable',               permission: 'institution:auditoria:view',       domain: 'institution', group: 'legal' },
  { id: 'transparencia',         label: 'Portal de Transparencia',           permission: 'institution:transparencia:view',   domain: 'institution', group: 'legal' },
  { id: 'mantenimiento',         label: 'Mantenimiento Predictivo',          permission: 'institution:mantenimiento:view',   domain: 'institution', group: 'infraestructura' },
  { id: 'becas',                 label: 'Scoring de Becas',                  permission: 'institution:becas:view',           domain: 'institution', group: 'social' },
  { id: 'emergencias',           label: 'Protocolos de Crisis',              permission: 'institution:emergencias:view',     domain: 'institution', group: 'seguridad' },
  { id: 'clima',                 label: 'Observatorio de Clima',             permission: 'institution:clima:view',           domain: 'institution', group: 'cultura' },
  { id: 'alumni',                label: 'Lifelong Alumni Hub',               permission: 'institution:alumni:view',          domain: 'institution', group: 'cultura' },
  { id: 'esg',                   label: 'Dashboard ESG',                     permission: 'institution:esg:view',             domain: 'institution', group: 'cultura' },
  { id: 'benchmarking',          label: 'Benchmarking Sectorial',            permission: 'institution:benchmarking:view',    domain: 'institution', group: 'analytics' },
  { id: 'reportes',              label: 'Exportador de Reportes',            permission: 'finanzas:reportes:export',         domain: 'institution', group: 'analytics' },
  { id: 'convalidacion',         label: 'Convalidación NLP',                 permission: 'institution:matricula:manage',     domain: 'institution', group: 'académico' },
  { id: 'conflictos',            label: 'Conflictos',                        permission: 'institution:matricula:manage',     domain: 'institution', group: 'académico' },
  { id: 'reportes-deuda',        label: 'Reportes de Deuda',                 permission: 'finanzas:deudores:view',           domain: 'institution', group: 'académico' },

  // ── IA AVANZADA ───────────────────────────────────────────────────────────
  { id: 'agentes-ia',            label: 'Enjambre de Agentes IA',            permission: 'ia:agentes:view',                  domain: 'ia' },
  { id: 'knowledge-graph',       label: 'Knowledge Graph',                   permission: 'ia:knowledge_graph:view',          domain: 'ia' },
  { id: 'federated',             label: 'Federated Learning',                permission: 'ia:federated:view',                domain: 'ia' },
  { id: 'plugins',               label: 'Ecosistema de Plugins',             permission: 'ia:plugins:view',                  domain: 'ia' },

  // ── BIENESTAR ─────────────────────────────────────────────────────────────
  { id: 'salud-mental',          label: 'Triage de Salud Mental',            permission: 'bienestar:salud_mental:view',      domain: 'bienestar' },
  { id: 'bullying',              label: 'Sensor Anti-Bullying',              permission: 'bienestar:bullying:view',          domain: 'bienestar' },
  { id: 'clanes',                label: 'Clanes P2P',                        permission: 'bienestar:clanes:view',            domain: 'bienestar' },
  { id: 'clubes',                label: 'Clubes Co-curriculares',            permission: 'bienestar:clubes:view',            domain: 'bienestar' },
  { id: 'iep-pie',               label: 'Plan IEP/PIE Inclusivo',            permission: 'bienestar:iep:view',               domain: 'bienestar' },
  { id: 'aprendizaje-servicio',  label: 'Aprendizaje-Servicio',              permission: 'bienestar:aprendizaje_servicio:view', domain: 'bienestar' },
  { id: 'p2p-tutoring',          label: 'Mercado P2P de Tutorías',           permission: 'bienestar:p2p_marketplace:view',   domain: 'bienestar' },

  // ── IDENTIDAD ─────────────────────────────────────────────────────────────
  { id: 'pasaporte',             label: 'Pasaporte Digital',                 permission: 'identidad:pasaporte:view',         domain: 'identidad' },
  { id: 'marketplace',           label: 'Marketplace B2B Talento',           permission: 'identidad:marketplace_b2b:view',   domain: 'identidad' },

  // ── PERFIL ────────────────────────────────────────────────────────────────
  { id: 'desempeno',             label: 'Panel de Desempeño',                permission: 'educa:calificaciones:view',         domain: 'educa' },
  { id: 'autorizaciones',        label: 'Autorizaciones',                    permission: 'institution:matricula:manage',      domain: 'institution' },
  { id: 'direccion',             label: 'Dirección',                         permission: 'institution:director:full',         domain: 'institution', group: 'dirección' },
  { id: 'finanzas',              label: 'Finanzas',                          permission: 'finanzas:view',                     domain: 'finanzas' },
  { id: 'actas',                 label: 'Actas y Reportes',                  permission: 'educa:evaluaciones:grade',          domain: 'educa' },
]

/** Find a module entry by its view ID */
export function getModule(id: string): ModuleEntry | undefined {
  return MODULE_REGISTRY.find(m => m.id === id)
}
