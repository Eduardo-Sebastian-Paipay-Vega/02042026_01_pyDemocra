import { useState } from 'react'
import {
  Camera, Mail, Phone, Building2, MapPin, Calendar,
  Shield, Clock, Activity, ChevronRight, Save, X,
  LogOut, Key, Trash2, AlertTriangle, CheckCircle2,
  Edit3, Globe,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  prime: 'Super Admin — PRIME',
  director: 'Director Institucional',
  docente: 'Docente',
  coordinador: 'Coordinador Académico',
  padres: 'Padre / Madre de Familia',
  cfo: 'Director Financiero (CFO)',
}

const ROLE_COLOR: Record<string, string> = {
  prime:       'var(--purple)',
  director:    'var(--blue)',
  docente:     'var(--green)',
  coordinador: 'var(--amber)',
  padres:      'var(--tx-2)',
  cfo:         'var(--red)',
}

interface Props {
  userName: string
  role: string
  onLogout: () => void
}

const SESSIONS = [
  { device: 'Chrome · macOS', ip: '190.236.14.12', lugar: 'Lima, PE',    hora: 'Activo ahora',    current: true },
  { device: 'Safari · iPhone', ip: '190.236.14.88', lugar: 'Lima, PE',   hora: 'Hace 2 horas',   current: false },
  { device: 'Firefox · Windows', ip: '200.48.92.5', lugar: 'Miraflores', hora: 'Hace 1 día',     current: false },
]

export default function ProfilePage({ userName, role, onLogout }: Props) {
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const roleLabel = ROLE_LABELS[role] || role
  const roleColor = ROLE_COLOR[role] || 'var(--blue)'

  const [editing, setEditing]       = useState(false)
  const [saved, setSaved]           = useState(false)
  const [form, setForm]             = useState({
    nombre:    userName,
    email:     `${userName.toLowerCase().replace(/\s/g, '.')}@eduos.edu.pe`,
    telefono:  '+51 987 654 321',
    cargo:     roleLabel,
    bio:       'Apasionado por la transformación digital educativa. Comprometido con la excelencia académica y el desarrollo integral del estudiante.',
    ciudad:    'Lima, Perú',
    sitio:     'www.eduos.edu.pe',
  })

  const field = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ padding: 'var(--page-p)' }} className="fade-up">

      {/* ── Header banner ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: 80, background: `linear-gradient(135deg, ${roleColor}22 0%, var(--s3) 100%)`, borderBottom: '1px solid var(--border)' }} />
        <div style={{ padding: '0 24px 20px', display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -32 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: roleColor,
              border: '3px solid var(--s2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {initials}
            </div>
            <button style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--s4)', border: '2px solid var(--s2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Camera size={10} style={{ color: 'var(--tx-2)' }} />
            </button>
          </div>

          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 18 }}>{form.nombre}</h1>
              {saved && (
                <span className="badge badge-green" style={{ fontSize: 10 }}>
                  <CheckCircle2 size={9} /> Guardado
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: roleColor, fontWeight: 500 }}>{roleLabel}</span>
              <span style={{ color: 'var(--tx-3)', fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--tx-3)' }}>EduOS · Lima, PE</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            {editing ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                  <X size={13} /> Cancelar
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                  <Save size={13} /> Guardar cambios
                </button>
              </>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                <Edit3 size={13} /> Editar perfil
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>

        {/* ── Left column ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Info card */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Información</div>
            {[
              { icon: Mail,      label: form.email },
              { icon: Phone,     label: form.telefono },
              { icon: Building2, label: 'EduOS S.A.C.' },
              { icon: MapPin,    label: form.ciudad },
              { icon: Globe,     label: form.sitio },
              { icon: Calendar,  label: 'Desde enero 2024' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                <Icon size={13} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--tx-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Actividad</div>
            {[
              { label: 'Último acceso',  value: 'Hoy, 09:14 AM' },
              { label: 'Sesiones abiertas', value: '3 dispositivos' },
              { label: 'Acciones hoy',   value: '48 eventos' },
              { label: 'Plan activo',    value: 'Enterprise' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--tx-3)' }}>{s.label}</span>
                <span style={{ color: 'var(--tx-2)', fontWeight: 500 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div className="card" style={{ padding: '16px 18px', border: '1px solid rgba(239,68,68,0.18)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Zona de riesgo</div>
            <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={onLogout}>
              <LogOut size={12} /> Cerrar todas las sesiones
            </button>
            <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'transparent', color: 'var(--tx-3)', border: '1px solid var(--border)' }}>
              <Trash2 size={12} /> Eliminar cuenta
            </button>
          </div>
        </div>

        {/* ── Right column ───────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Edit form / bio */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
              Información personal
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Nombre completo" value={form.nombre} editing={editing} onChange={v => field('nombre', v)} />
              <Field label="Correo electrónico" value={form.email} editing={editing} onChange={v => field('email', v)} type="email" />
              <Field label="Teléfono" value={form.telefono} editing={editing} onChange={v => field('telefono', v)} />
              <Field label="Ciudad / País" value={form.ciudad} editing={editing} onChange={v => field('ciudad', v)} />
              <Field label="Cargo" value={form.cargo} editing={editing} onChange={v => field('cargo', v)} />
              <Field label="Sitio web" value={form.sitio} editing={editing} onChange={v => field('sitio', v)} />
            </div>

            <div style={{ marginBottom: editing ? 20 : 0 }}>
              <label>Biografía</label>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={e => field('bio', e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              ) : (
                <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.65, margin: 0, padding: '8px 0' }}>{form.bio}</p>
              )}
            </div>

            {editing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={13} /> Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}><Save size={13} /> Guardar cambios</button>
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sesiones activas</div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>Revocar todas</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SESSIONS.map(s => (
                <div key={s.ip} className="card-inner" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Activity size={14} style={{ color: s.current ? 'var(--green)' : 'var(--tx-3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{s.device}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>{s.ip} · {s.lugar} · {s.hora}</div>
                  </div>
                  {s.current
                    ? <span className="badge badge-green" style={{ fontSize: 10 }}>Esta sesión</span>
                    : <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 24, color: 'var(--tx-3)' }}>Revocar</button>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Permisos del rol */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Permisos del rol
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Ver dashboard',      ok: true },
                { label: 'Editar estudiantes', ok: role !== 'padres' },
                { label: 'Gestionar pagos',    ok: ['prime','cfo','director'].includes(role) },
                { label: 'Exportar reportes',  ok: role !== 'padres' },
                { label: 'Configurar sistema', ok: ['prime','director'].includes(role) },
                { label: 'Acceso Enterprise',  ok: role === 'prime' },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--s3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  {p.ok
                    ? <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    : <X size={12} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 12, color: p.ok ? 'var(--tx-2)' : 'var(--tx-3)' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Field({ label, value, editing, onChange, type = 'text' }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label>{label}</label>
      {editing
        ? <input type={type} value={value} onChange={e => onChange(e.target.value)} />
        : <div style={{ fontSize: 13, color: 'var(--tx-2)', padding: '7px 0', minHeight: 32 }}>{value}</div>
      }
    </div>
  )
}
