import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Settings, ChevronRight, PinOff, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { getBreadcrumbs } from '@/lib/routes/routeMap'

interface NavbarProps {
  activeView: string
  role: string
  pinned: boolean
  onTogglePin: () => void
  onNavigate: (viewId: string) => void
}

const notificaciones = [
  { id: 1, tipo: 'critica', texto: '2 estudiantes en riesgo crítico detectados por EWS', hora: 'Hace 5 min' },
  { id: 2, tipo: 'info',    texto: 'Nuevo pago recibido: Familia García — $450', hora: 'Hace 18 min' },
  { id: 3, tipo: 'info',    texto: 'Conflicto de horario resuelto por Agente IA', hora: 'Hace 35 min' },
  { id: 4, tipo: 'alerta',  texto: 'Familia López tiene 90+ días de mora', hora: 'Hace 1 hora' },
  { id: 5, tipo: 'ok',      texto: 'Acta de 10-A generada y lista para descargar', hora: 'Hace 2 horas' },
]

export default function Navbar({ pinned, onTogglePin, onNavigate }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [leidas, setLeidas] = useState<number[]>([])

  const pathname = location.pathname
  const crumbs = getBreadcrumbs(pathname)

  const noLeidas = notificaciones.filter(n => !leidas.includes(n.id)).length

  const iconNotif = (tipo: string) => {
    if (tipo === 'critica') return <AlertTriangle size={12} style={{ color: 'var(--red)', flexShrink: 0 }} />
    if (tipo === 'alerta')  return <AlertTriangle size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />
    if (tipo === 'ok')      return <CheckCircle2  size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
    return <Info size={12} style={{ color: 'var(--blue)', flexShrink: 0 }} />
  }

  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--s1)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 20px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {!pinned && (
        <button
          onClick={onTogglePin}
          title="Fijar sidebar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', display: 'flex', padding: 4, borderRadius: 4, transition: 'color var(--transition)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--tx)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--tx-3)'}
        >
          <PinOff size={13} />
        </button>
      )}

      {/* URL-driven breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        {crumbs.map((crumb, i) => (
          <span key={`${crumb}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={12} style={{ color: 'var(--tx-3)' }} />}
            <span style={{ fontSize: 13, color: i === crumbs.length - 1 ? 'var(--tx)' : 'var(--tx-3)', fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '5px 11px', width: 220, cursor: 'text' }}>
        <Search size={13} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
        <input
          placeholder="Buscar o preguntar a DEMI..."
          style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--tx)', width: '100%', padding: 0 }}
          onKeyDown={e => { if (e.key === 'Enter') onNavigate('demi') }}
        />
        <span style={{ fontSize: 10, color: 'var(--tx-3)', flexShrink: 0, fontWeight: 500 }}>⌘K</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
        <button className="btn btn-ghost btn-sm" style={{ position: 'relative', padding: '0 8px' }} onClick={() => setNotifOpen(o => !o)}>
          <Bell size={14} />
          {noLeidas > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7, background: 'var(--red)', border: '1.5px solid var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {noLeidas}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{ position: 'absolute', top: 36, right: 0, width: 340, background: 'var(--s2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notificaciones</span>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 24 }} onClick={() => setLeidas(notificaciones.map(n => n.id))}>
                Marcar todo leído
              </button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notificaciones.map(n => (
                <div key={n.id} onClick={() => setLeidas(p => p.includes(n.id) ? p : [...p, n.id])}
                  style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: leidas.includes(n.id) ? 'transparent' : 'var(--s3)', transition: 'background var(--transition)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--s3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = leidas.includes(n.id) ? 'transparent' : 'var(--s3)'}
                >
                  <div style={{ marginTop: 2 }}>{iconNotif(n.tipo)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--tx-2)', marginBottom: 2, lineHeight: 1.4 }}>{n.texto}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>{n.hora}</div>
                  </div>
                  {!leidas.includes(n.id) && <span className="dot dot-blue" style={{ flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, width: '100%', justifyContent: 'center' }}>
                Ver todas las notificaciones
              </button>
            </div>
          </div>
        )}

        <button
          className={`btn btn-ghost btn-sm${pathname === '/settings' ? ' active' : ''}`}
          style={{ padding: '0 8px', background: pathname === '/settings' ? 'var(--s3)' : undefined }}
          onClick={() => navigate('/settings')}
          title="Ajustes"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  )
}
