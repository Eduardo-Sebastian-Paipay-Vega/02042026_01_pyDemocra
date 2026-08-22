/**
 * EDUCACION OS — Permission-Aware Sidebar
 *
 * BEFORE: Showed items based on `role` string → role-specific nav arrays
 * AFTER:  Shows items based on `can(permission)` → domain-grouped nav
 *
 * A new role never requires a new nav array here.
 * Items appear when the current session has the required permission.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '@/core/context/SettingsContext'
import { useAuth } from '@educ/context/AuthContext'
import { viewIdToPath } from '@educ/lib/routes/routeMap'
import type { Permission } from '@educ/lib/rbac/permissions'
import {
  LayoutDashboard, Wallet, Fingerprint, ShoppingBag, Bot,
  TrendingUp, Users, FileText, ClipboardList, BookOpen,
  CheckSquare, MessageSquare, CreditCard, LogOut, AlertOctagon,
  Trophy, Layers, Sparkles, Pin, PinOff,
  Activity, Coins, Network, Briefcase, Brain, Globe, Box,
  Blocks, ShieldAlert, Map, BrainCircuit, Camera, Target,
  QrCode, Inbox, Database, CalendarDays, Server, ShieldCheck,
  HeartPulse, Accessibility, EyeOff, HeartHandshake, Tent,
  GraduationCap, Building2, Scale,
} from 'lucide-react'

// ─── Nav Item Definition ─────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  permission: Permission
  badge?: number
  isDemi?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ─── Permission-Driven Nav Tree ───────────────────────────────────────────────
// Roles never appear here. Permissions determine visibility.

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'IA',
    items: [
      { id: 'demi',          label: 'Pregúntale a DEMI',     icon: Sparkles,    permission: 'ia:demi:view',          isDemi: true },
      { id: 'agentes-ia',    label: 'Agentes IA',            icon: Bot,         permission: 'ia:agentes:view',        badge: 2 },
      { id: 'knowledge-graph', label: 'Knowledge Graph',     icon: Network,     permission: 'ia:knowledge_graph:view' },
      { id: 'federated',     label: 'Federated Learning',    icon: Globe,       permission: 'ia:federated:view' },
      { id: 'plugins',       label: 'Ecosistema Plugins',    icon: Blocks,      permission: 'ia:plugins:view' },
    ],
  },
  {
    label: 'Dashboard',
    items: [
      { id: 'dashboard',     label: 'Dashboard',             icon: LayoutDashboard, permission: 'institution:view' },
    ],
  },
  {
    label: 'Educación',
    items: [
      { id: 'cursos',             label: 'Mis Cursos',           icon: Layers,        permission: 'educa:cursos:view' },
      { id: 'calificaciones',     label: 'Calificaciones',       icon: ClipboardList, permission: 'educa:calificaciones:view' },
      { id: 'asistencia',         label: 'Asistencia',           icon: CheckSquare,   permission: 'educa:asistencia:view' },
      { id: 'banco-items',        label: 'Banco de Ítemes LLM',  icon: Database,      permission: 'educa:items:view' },
      { id: 'cat-irt',            label: 'Engine CAT/IRT',       icon: BrainCircuit,  permission: 'educa:cat_irt:view' },
      { id: 'proctoring',         label: 'Proctoring IA',        icon: Camera,        permission: 'educa:proctoring:manage' },
      { id: 'peer-review',        label: 'Peer-Review Ciego',    icon: EyeOff,        permission: 'educa:peer_review:view' },
      { id: 'psicoaptitudinal',   label: 'Eval. Psico-Aptitudinal', icon: Brain,      permission: 'educa:psico:view' },
      { id: 'asistencia-qr',      label: 'Asistencia QR',        icon: QrCode,        permission: 'educa:asistencia:manage' },
      { id: 'laboratorio-3d',     label: 'Lab 3D WebGL',         icon: Box,           permission: 'educa:lab3d:view' },
      { id: 'recursos',           label: 'Repositorio Recursos',  icon: BookOpen,      permission: 'educa:cursos:view' },
    ],
  },
  {
    label: 'IA Educativa',
    items: [
      { id: 'ruta-adaptativa',  label: 'Ruta Adaptativa',     icon: Map,         permission: 'educa:adaptive:view' },
      { id: 'gemelo-digital',   label: 'Gemelo Digital',       icon: Users,       permission: 'educa:digital_twin:view' },
      { id: 'carga-cognitiva',  label: 'Carga Cognitiva',      icon: BrainCircuit, permission: 'educa:cognitive_load:view' },
    ],
  },
  {
    label: 'Motivación',
    items: [
      { id: 'gamificacion', label: 'Gamificación / XP',   icon: Trophy,  permission: 'educa:gamificacion:view' },
      { id: 'badges',       label: 'Badges e Insignias',  icon: Target,  permission: 'educa:gamificacion:view' },
      { id: 'misiones',     label: 'Misiones y Retos',    icon: ShieldAlert, permission: 'educa:gamificacion:view' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { id: 'finanzas',          label: 'Panel Financiero',    icon: Wallet,     permission: 'finanzas:view' },
      { id: 'pagos',             label: 'Pagos',               icon: CreditCard, permission: 'finanzas:pagos:view' },
      { id: 'transacciones',     label: 'Transacciones',       icon: CreditCard, permission: 'finanzas:pagos:view' },
      { id: 'deudores',          label: 'Deudores',            icon: Users,      permission: 'finanzas:deudores:view' },
      { id: 'tokens',            label: 'Economía de Tokens',  icon: Coins,      permission: 'finanzas:tokens:view' },
      { id: 'erp',               label: 'Integración ERP',     icon: Server,     permission: 'finanzas:erp:manage' },
      { id: 'reportes-finanzas', label: 'Reportes Financieros', icon: FileText,  permission: 'finanzas:reportes:view' },
    ],
  },
  {
    label: 'Alertas (EWS)',
    items: [
      { id: 'ews',        label: 'Alertas Tempranas',      icon: AlertOctagon, permission: 'ews:alerts:view', badge: 2 },
      { id: 'behavioral', label: 'Behavioral Analytics',  icon: Activity,     permission: 'ews:behavioral:view' },
    ],
  },
  {
    label: 'Comunicación',
    items: [
      { id: 'comunicaciones', label: 'Chat Académico',         icon: MessageSquare, permission: 'comunicacion:chat:view' },
      { id: 'avisos',         label: 'Centro de Avisos',       icon: Inbox,         permission: 'comunicacion:avisos:view' },
      { id: 'red-social',     label: 'Red Social Segura',      icon: MessageSquare, permission: 'comunicacion:red_social:view' },
      { id: 'live-stream',    label: 'Live Stream Progreso',   icon: Activity,      permission: 'comunicacion:avisos:view' },
    ],
  },
  {
    label: 'Institución',
    items: [
      { id: 'matricula',    label: 'Matrícula',          icon: GraduationCap, permission: 'institution:matricula:view', badge: 3 },
      { id: 'inscripcion',  label: 'Nueva Inscripción',  icon: GraduationCap, permission: 'institution:matricula:manage' },
      { id: 'usuarios',     label: 'Usuarios',           icon: Users,         permission: 'institution:usuarios:view' },
      { id: 'espacios',     label: 'Gestor Espacios',    icon: Map,           permission: 'institution:espacios:view' },
      { id: 'horarios',     label: 'Horarios IA',        icon: CalendarDays,  permission: 'institution:horarios:view' },
      { id: 'nomina',       label: 'Nómina Docente',     icon: Wallet,        permission: 'institution:nomina:view' },
      { id: 'becas',        label: 'Scoring Becas',      icon: Scale,         permission: 'institution:becas:view' },
      { id: 'emergencias',  label: 'Emergencias',        icon: AlertOctagon,  permission: 'institution:emergencias:view' },
      { id: 'mantenimiento', label: 'Mantenimiento',     icon: Building2,     permission: 'institution:mantenimiento:view' },
    ],
  },
  {
    label: 'Gobernanza',
    items: [
      { id: 'gobernanza',    label: 'Actas y Gobernanza',   icon: ClipboardList, permission: 'institution:gobernanza:view' },
      { id: 'privacidad',    label: 'Privacidad GDPR',      icon: ShieldCheck,   permission: 'institution:privacidad:view' },
      { id: 'auditoria',     label: 'Auditoría',            icon: FileText,      permission: 'institution:auditoria:view' },
      { id: 'transparencia', label: 'Transparencia',        icon: Scale,         permission: 'institution:transparencia:view' },
      { id: 'clima',         label: 'Clima Institucional',  icon: TrendingUp,    permission: 'institution:clima:view' },
      { id: 'esg',           label: 'ESG Dashboard',        icon: TrendingUp,    permission: 'institution:esg:view' },
      { id: 'alumni',        label: 'Alumni Hub',           icon: Users,         permission: 'institution:alumni:view' },
      { id: 'benchmarking',  label: 'Benchmarking',         icon: TrendingUp,    permission: 'institution:benchmarking:view' },
    ],
  },
  {
    label: 'Bienestar',
    items: [
      { id: 'salud-mental',          label: 'Triage Salud Mental',    icon: HeartPulse,    permission: 'bienestar:salud_mental:view' },
      { id: 'bullying',              label: 'Sensor Anti-Bullying',   icon: ShieldAlert,   permission: 'bienestar:bullying:view' },
      { id: 'clanes',                label: 'Clanes P2P',             icon: Users,         permission: 'bienestar:clanes:view' },
      { id: 'clubes',                label: 'Clubes Co-curriculares', icon: Tent,          permission: 'bienestar:clubes:view' },
      { id: 'iep-pie',               label: 'Plan IEP/PIE',           icon: Accessibility, permission: 'bienestar:iep:view' },
      { id: 'aprendizaje-servicio',  label: 'Aprendizaje-Servicio',  icon: HeartHandshake, permission: 'bienestar:aprendizaje_servicio:view' },
      { id: 'p2p-tutoring',          label: 'Mercado P2P Tutorías',   icon: Briefcase,     permission: 'bienestar:p2p_marketplace:view' },
    ],
  },
  {
    label: 'Identidad',
    items: [
      { id: 'pasaporte',  label: 'Pasaporte Digital',  icon: Fingerprint,  permission: 'identidad:pasaporte:view' },
      { id: 'marketplace', label: 'B2B Talento',       icon: ShoppingBag,  permission: 'identidad:marketplace_b2b:view' },
    ],
  },
  {
    label: 'Reportes',
    items: [
      { id: 'reportes',       label: 'Reportes',         icon: FileText,    permission: 'finanzas:reportes:export' },
      { id: 'analytics',      label: 'Analytics',        icon: TrendingUp,  permission: 'institution:benchmarking:view' },
      { id: 'reportes-deuda', label: 'Reporte de Deuda', icon: CreditCard,  permission: 'finanzas:deudores:view' },
      { id: 'conflictos',     label: 'Conflictos',       icon: ClipboardList, permission: 'institution:matricula:manage', badge: 3 },
      { id: 'autorizaciones', label: 'Autorizaciones',   icon: CheckSquare, permission: 'institution:matricula:manage', badge: 1 },
      { id: 'desempeno',      label: 'Desempeño',        icon: TrendingUp,  permission: 'educa:calificaciones:view' },
    ],
  },
]

// ─── Sidebar Props ────────────────────────────────────────────────────────────

interface SidebarProps {
  role: string
  activeView: string
  onNavigate: (view: string) => void
  onLogout: () => void
  userName: string
  pinned: boolean
  onTogglePin: () => void
}

const roleLabels: Record<string, string> = {
  prime:        'Super Admin',
  director:     'Director',
  docente:      'Docente',
  estudiante:   'Estudiante',
  coordinador:  'Coordinador',
  padres:       'Padre/Madre',
  cfo:          'CFO',
  tutor:        'Tutor',
}

// ─── Component ────────────────────────────────────────────────────────────────

import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@educ/lib/supabase'

export default function Sidebar({
  role, activeView, onNavigate, onLogout, userName, pinned, onTogglePin,
}: SidebarProps) {
  const { can, session } = useAuth()
  const queryClient = useQueryClient()
  const [hovered, setHovered] = useState(false)
  const isOpen = pinned || hovered
  const { theme } = useSettings()
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  const logoSrc = resolvedTheme === 'dark' ? '/img/mono-core.png' : '/img/core-vector.png';

  // FASE 5: Prefetching Inteligente
  const handlePrefetch = (viewId: string) => {
    if (!session) return;
    
    // Si pasamos el mouse por gamificación, traemos la data antes del click
    if (viewId === 'gamificacion') {
      queryClient.prefetchQuery({
        queryKey: ['gamificacion', session.user.id], // Idealmente el ID del alumno real
        queryFn: async () => {
          const { data } = await supabase
            .schema('educa')
            .from('gamificacion')
            .select('*')
            //.eq('estudiante_id', session.user.id) // Hardcoded userId temporalmente compatible con DashboardEstudiante
            .eq('estudiante_id', '725bbea5-af39-4232-b2b2-c28120e6a6b7')
            .single();
          return data;
        },
        staleTime: 1000 * 60 * 5, // 5 min
      });
    }
  }

  // Build visible items from permissions — NOT from role
  const visibleGroups = NAV_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(item => can(item.permission)),
    }))
    .filter(group => group.items.length > 0)

  // Flatten for collapsed view
  const allVisible = visibleGroups.flatMap(g => g.items)

  return (
    <aside
      onMouseEnter={() => !pinned && setHovered(true)}
      onMouseLeave={() => !pinned && setHovered(false)}
      style={{
        width: isOpen ? 220 : 52,
        height: '100%',
        background: 'var(--s1)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: pinned ? 'relative' : 'absolute',
        zIndex: pinned ? 'auto' : 20,
        top: 0, left: 0,
        boxShadow: !pinned && hovered ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Logo row */}
      <div style={{
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        padding: isOpen ? '0 10px 0 12px' : '0',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {isOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <img src={logoSrc} alt="Democra.pro" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.2px', display: 'block', lineHeight: 1, whiteSpace: 'nowrap' }}>
                democra<span style={{ color: 'var(--blue)' }}>.pro</span>
              </span>
              <span style={{ fontSize: 9, color: 'var(--tx-3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginTop: 2 }}>EduOS Platform</span>
            </div>
          </div>
        ) : (
          <img src={logoSrc} alt="Democra.pro" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 6 }} />
        )}

        {isOpen && (
          <button
            onClick={onTogglePin}
            title={pinned ? 'Desacoplar sidebar' : 'Fijar sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 5, borderRadius: 5, display: 'flex', flexShrink: 0,
              color: pinned ? 'var(--blue)' : 'var(--tx-3)',
              transition: 'color var(--transition), background var(--transition)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--s3)'
              el.style.color = pinned ? 'var(--blue)' : 'var(--tx)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'none'
              el.style.color = pinned ? 'var(--blue)' : 'var(--tx-3)'
            }}
          >
            {pinned ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
        )}
      </div>

      {/* Nav — permission-driven */}
      <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', overflowX: 'hidden' }}>
        {isOpen ? (
          // Expanded: grouped view
          visibleGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--tx-3)',
                padding: '6px 6px 2px',
                display: gi === 0 ? 'none' : 'block',
              }}>
                {group.label}
              </div>
              {group.items.map((item, i) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <Link
                    key={item.id}
                    to={viewIdToPath(item.id)}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    onMouseEnter={() => handlePrefetch(item.id)}
                    style={{
                      marginBottom: item.isDemi ? 8 : 1,
                      animationDelay: `${i * 20}ms`,
                      ...(item.isDemi && !isActive ? {
                        background: 'rgba(37,99,235,0.08)',
                        border: '1px solid rgba(37,99,235,0.2)',
                        color: 'var(--blue)',
                      } : {}),
                      ...(item.isDemi && isActive ? {
                        background: 'rgba(37,99,235,0.16)',
                        border: '1px solid rgba(37,99,235,0.4)',
                        color: 'var(--blue)',
                      } : {}),
                    }}
                  >
                    <Icon
                      size={item.isDemi ? 14 : 15}
                      strokeWidth={isActive ? 2 : 1.6}
                      style={{ flexShrink: 0, color: item.isDemi ? 'var(--blue)' : isActive ? 'var(--tx)' : 'var(--tx-3)' }}
                    />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{
                        background: 'var(--blue)', color: '#fff',
                        fontSize: 10, fontWeight: 600,
                        borderRadius: 10, padding: '1px 6px',
                        lineHeight: 1.6, flexShrink: 0,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))
        ) : (
          // Collapsed: flat icon-only view
          allVisible.map((item, i) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <Link
                key={item.id}
                to={viewIdToPath(item.id)}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => handlePrefetch(item.id)}
                title={item.label}
                style={{
                  justifyContent: 'center',
                  marginBottom: item.isDemi ? 8 : 1,
                  animationDelay: `${i * 20}ms`,
                  position: 'relative',
                  ...(item.isDemi && !isActive ? {
                    background: 'rgba(37,99,235,0.08)',
                    border: '1px solid rgba(37,99,235,0.2)',
                  } : {}),
                }}
              >
                <Icon
                  size={item.isDemi ? 14 : 15}
                  strokeWidth={isActive ? 2 : 1.6}
                  style={{ flexShrink: 0, color: item.isDemi ? 'var(--blue)' : isActive ? 'var(--tx)' : 'var(--tx-3)' }}
                />
                {item.badge && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--blue)', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    borderRadius: 8, padding: '0 4px', lineHeight: '14px',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '6px 6px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div
          className={`nav-item${activeView === 'profile' ? ' active' : ''}`}
          onClick={() => onNavigate('profile')}
          title={!isOpen ? userName : undefined}
          style={{ justifyContent: !isOpen ? 'center' : undefined, marginBottom: 2, gap: 8 }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 4,
            background: activeView === 'profile' ? 'var(--blue)' : 'var(--s4)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
            color: activeView === 'profile' ? '#fff' : 'var(--tx-2)',
            flexShrink: 0, transition: 'background var(--transition)',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx-3)' }}>{roleLabels[role] ?? role}</div>
            </div>
          )}
        </div>

        <div
          className="nav-item"
          onClick={onLogout}
          title={!isOpen ? 'Cerrar sesión' : undefined}
          style={{ justifyContent: !isOpen ? 'center' : undefined }}
        >
          <LogOut size={14} strokeWidth={1.6} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
          {isOpen && <span>Cerrar sesión</span>}
        </div>
      </div>
    </aside>
  )
}
