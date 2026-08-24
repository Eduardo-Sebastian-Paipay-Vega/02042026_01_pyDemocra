import { useState, useRef, useEffect } from 'react'
import '@/core/styles/core-ui.css'
import {
  Settings, Bell, Palette, Shield, Plug2, ChevronRight,
  Globe, Clock, Mail, MessageSquare, Smartphone, Monitor,
  Sun, Moon, Eye, EyeOff,
  KeyRound, Copy, RefreshCw,
  Trash2, CheckCircle2, AlertTriangle, Lock,
  Video, Link2, Rows3, RotateCcw, Zap, Pipette,
} from 'lucide-react'
import { useSettings, type Density, type Theme, type FontSize, type AppSettings } from '@/core/context/SettingsContext'
import { type RGBColor, rgbToHex, hexToRgb, getContrastText, rgbToCss, applyColorVars } from '@educ/utils/color'
import { useTranslation } from 'react-i18next'
import { MfaSetupCard } from '@/core/auth/components/MfaSetupCard'

// ── Toggle Switch ──────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? 'var(--blue)' : 'var(--s4)',
        border: `1px solid ${checked ? 'var(--blue)' : 'var(--border-md)'}`,
        cursor: 'pointer', position: 'relative',
        transition: 'background var(--transition), border-color var(--transition)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: checked ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: checked ? '#fff' : 'var(--tx-3)',
        transition: 'left var(--transition), background var(--transition)',
      }} />
    </div>
  )
}

// ── Radio Option ───────────────────────────────────────────────
export function Radio({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius)', border: `1px solid ${selected ? 'var(--blue)' : 'var(--border)'}`, background: selected ? 'var(--blue-dim)' : 'var(--s3)', cursor: 'pointer', transition: 'all var(--transition)' }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${selected ? 'var(--blue)' : 'var(--border-md)'}`, background: selected ? 'var(--blue)' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: selected ? 500 : 400, color: selected ? 'var(--tx)' : 'var(--tx-2)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────
export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: sub ? 3 : 0 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{sub}</div>}
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0' }} />
}

// ── Row toggle ─────────────────────────────────────────────────
function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: sub ? 2 : 0 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

const TABS = [
  { id: 'general',        label: 'General',        icon: Settings  },
  { id: 'notificaciones', label: 'Notificaciones',  icon: Bell      },
  { id: 'apariencia',     label: 'Apariencia',      icon: Palette   },
  { id: 'seguridad',      label: 'Seguridad',       icon: Shield    },
  { id: 'integraciones',  label: 'Integraciones',   icon: Plug2     },
]

const SESSIONS_ACTIVAS = [
  { device: 'Chrome 124 · macOS Sonoma',   ip: '190.236.14.12', lugar: 'Lima, Perú',       time: 'Activo ahora',    current: true  },
  { device: 'Safari · iPhone 15 Pro',      ip: '190.236.14.88', lugar: 'Lima, Perú',       time: 'Hace 2 horas',   current: false },
  { device: 'Firefox 125 · Windows 11',    ip: '200.48.92.5',   lugar: 'San Isidro, Perú', time: 'Hace 1 día',     current: false },
]

const API_TOKENS = [
  { name: 'Producción — Reportes',    prefix: 'esk_prod_*****', created: '10 May 2026', last: 'Hoy' },
  { name: 'Integración Contabilidad', prefix: 'esk_int_*****',  created: '3 Ene 2026',  last: 'Hace 3 días' },
]

// ── Color institucional ────────────────────────────────────────
type ColorKey = 'sidebar-badge' | 'demi-accent' | 'status-riesgo' | 'status-ok' | 'brand-primary'

const COLOR_DEFAULTS: Record<ColorKey, RGBColor> = {
  'sidebar-badge':  { r: 59,  g: 130, b: 246, a: 1 },
  'demi-accent':    { r: 99,  g: 102, b: 241, a: 1 },
  'status-riesgo':  { r: 239, g: 68,  b: 68,  a: 1 },
  'status-ok':      { r: 34,  g: 197, b: 94,  a: 1 },
  'brand-primary':  { r: 59,  g: 130, b: 246, a: 1 },
}

const COLOR_META: { id: ColorKey; label: string; desc: string }[] = [
  { id: 'sidebar-badge', label: 'Badges del sidebar',        desc: 'Contadores numéricos en ítems del menú' },
  { id: 'demi-accent',   label: 'Acento DEMI IA',            desc: 'Fondo y glow del botón / píldora de DEMI' },
  { id: 'status-riesgo', label: 'Badge "En Riesgo"',         desc: 'Etiquetas de riesgo académico y alertas' },
  { id: 'status-ok',     label: 'Badge "Excelente / OK"',    desc: 'Etiquetas de buen desempeño y confirmaciones' },
  { id: 'brand-primary', label: 'Botón de acción principal', desc: 'Guardar, confirmar y CTAs primarios' },
]

const SWATCHES: { label: string; color: RGBColor }[] = [
  { label: 'Azul EduOS',      color: { r: 59,  g: 130, b: 246, a: 1 } },
  { label: 'Índigo',          color: { r: 99,  g: 102, b: 241, a: 1 } },
  { label: 'Púrpura',        color: { r: 139, g: 92,  b: 246, a: 1 } },
  { label: 'Verde Esmeralda', color: { r: 16,  g: 185, b: 129, a: 1 } },
  { label: 'Ámbar Alerta',    color: { r: 245, g: 158, b: 11,  a: 1 } },
  { label: 'Rojo Alerta',     color: { r: 239, g: 68,  b: 68,  a: 1 } },
  { label: 'Borgoña',        color: { r: 159, g: 18,  b: 57,  a: 1 } },
  { label: 'Teal',            color: { r: 6,   g: 182, b: 212, a: 1 } },
]

function loadColors(): Record<ColorKey, RGBColor> {
  return { ...COLOR_DEFAULTS }
}

import { supabase } from '@educ/lib/supabase'
import { useTenantBootstrap } from '@/core/tenant'

function SecurityTab() {
  const [pwd, setPwd] = useState({ actual: '', nueva: '', confirmar: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const handleUpdatePassword = async () => {
    setPwdError('')
    setPwdSuccess('')
    if (!pwd.nueva || pwd.nueva !== pwd.confirmar) {
      setPwdError('Las contraseñas no coinciden o están vacías')
      return
    }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.nueva })
    setPwdLoading(false)
    if (error) setPwdError('Error al actualizar: ' + error.message)
    else {
      setPwdSuccess('Contraseña actualizada correctamente')
      setPwd({ actual: '', nueva: '', confirmar: '' })
    }
  }

  /* MFA logic moved to MfaSetupCard */
  const [sessions, setSessions] = useState<any[]>([])
  
  const loadSessions = async () => {
    const { data, error } = await supabase.rpc('get_my_sessions')
    if (data) setSessions(data)
  }
  
  useEffect(() => {
    loadSessions()
  }, [])

  const revokeSession = async (id: string) => {
    await supabase.rpc('delete_my_session', { p_session_id: id })
    loadSessions()
  }


  const [tokens, setTokens] = useState<any[]>([])
  const [newTokenName, setNewTokenName] = useState('')
  const [showNewToken, setShowNewToken] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  
  // NOTE: In SettingsPage we use useTenantBootstrap. Here we can use the same context or mock tenant_id for now if it's not in scope.
  // Actually, we can get tenant_id from the wrapper or hook. Let's just use useTenantBootstrap.
  const tenant_id = useTenantBootstrap().context?.tenant?.id

  const loadTokens = async () => {
    const { data } = await supabase.from('api_tokens').select('*').order('created_at', { ascending: false })
    if (data) setTokens(data)
  }

  useEffect(() => {
    loadTokens()
  }, [])

  const handleCreateToken = async () => {
    if (!newTokenName) return
    const { data, error } = await supabase.rpc('create_api_token', { p_name: newTokenName, p_tenant_id: tenant_id })
    if (data) {
      setCreatedToken(data)
      setShowNewToken(false)
      setNewTokenName('')
      loadTokens()
    } else {
      alert('Error: ' + (error?.message || 'Error creating token'))
    }
  }

  const revokeToken = async (id: string) => {
    await supabase.rpc('delete_api_token', { p_token_id: id })
    loadTokens()
  }

  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const copyToken = (name: string) => {
    setCopiedToken(name)
    setTimeout(() => setCopiedToken(null), 2000)
  }
  return (
    <div>
      <SectionTitle title="Seguridad de la cuenta" sub="Autenticación, contraseña y sesiones activas" />
      
      <MfaSetupCard supabase={supabase} />

      <Divider />

      <SectionTitle title="Cambiar contraseña" />
      <div style={{ display: 'grid', gap: 14, maxWidth: 400, marginBottom: 24 }}>
        {[
          { key: 'nueva',     label: 'Nueva contraseña' },
          { key: 'confirmar', label: 'Confirmar contraseña' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label>{label}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={pwd[key]}
                onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                placeholder="••••••••"
                style={{ paddingRight: 38 }}
              />
              <button onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', display: 'flex', padding: 0 }}>
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        {pwdError && <div style={{color: 'var(--red)', fontSize: 12}}>{pwdError}</div>}
        {pwdSuccess && <div style={{color: 'var(--green)', fontSize: 12}}>{pwdSuccess}</div>}
        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={handleUpdatePassword} disabled={pwdLoading}>
          <Lock size={12} /> {pwdLoading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </div>

      <Divider />

      <SectionTitle title="Sesiones activas" sub="Dispositivos donde tu cuenta está abierta" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {sessions.map(s => (
          <div key={s.id} className="card-inner" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Monitor size={14} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{s.user_agent ? s.user_agent.substring(0,40) : 'Dispositivo Desconocido'}...</div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)' }}>IP: {s.ip || 'Local'} · {new Date(s.created_at).toLocaleString()}</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 24 }} onClick={() => revokeSession(s.id)}>Revocar</button>
          </div>
        ))}

      <Divider />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SectionTitle title="Tokens de API" sub="Acceso programático a la plataforma" />
        <button className="btn btn-secondary btn-sm" onClick={() => setShowNewToken(true)}><RefreshCw size={12} /> Nuevo token</button>
      </div>
      
      {showNewToken && (
        <div className="card-inner" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Crear nuevo Token</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="Nombre (ej. Integracion Zapier)" value={newTokenName} onChange={e => setNewTokenName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-sm btn-primary" onClick={handleCreateToken}>Generar</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowNewToken(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {createdToken && (
        <div className="card-inner" style={{ padding: '16px', marginBottom: 16, border: '1px solid var(--green)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>Token generado exitosamente</div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>Guarda este token ahora, no podrás verlo de nuevo:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={createdToken} readOnly style={{ flex: 1, fontFamily: 'monospace' }} />
            <button className="btn btn-sm btn-secondary" onClick={() => { navigator.clipboard.writeText(createdToken); alert('Copiado'); }}>Copiar</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setCreatedToken(null)}>Ocultar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tokens.map(t => (
          <div key={t.id} className="card-inner" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <KeyRound size={13} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--tx-3)', fontFamily: 'monospace' }}>{t.prefix}************************ · Creado {new Date(t.created_at).toLocaleDateString()}</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => revokeToken(t.id)}>
              <Trash2 size={11} style={{ color: 'var(--red)' }} /> Revocar
            </button>
          </div>
        ))}
        {tokens.length === 0 && <div style={{fontSize: 12, color: 'var(--tx-3)'}}>No hay tokens generados</div>}
      </div>
        {sessions.length === 0 && <div style={{fontSize: 12, color: 'var(--tx-3)'}}>No se encontraron sesiones extra...</div>}
      </div>
    </div>
  )
}
export default function SettingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('general')
  const ctx = useSettings()

  // General
  const [idioma,    setIdioma]    = useState(ctx.language)
  const [zona,      setZona]      = useState(ctx.timezone)
  const [fechaFmt,  setFechaFmt]  = useState(ctx.date_format)
  const [vistaIni,  setVistaIni]  = useState(ctx.initial_view)

  // Sincronizar estado local si el contexto se carga después
  useEffect(() => {
    setIdioma(ctx.language)
    setZona(ctx.timezone)
    setFechaFmt(ctx.date_format)
    setVistaIni(ctx.initial_view)
  }, [ctx.language, ctx.timezone, ctx.date_format, ctx.initial_view])

  // Obtener tenantId actual para ajustes por tenant
  let currentTenantId = 'default'
  try {
    const tenantCtxRaw = typeof window !== 'undefined' ? localStorage.getItem("democra.tenant.ctx.v2") : null
    if (tenantCtxRaw) currentTenantId = JSON.parse(tenantCtxRaw)?.data?.tenant?.id || 'default'
  } catch(e) {}

  // Notificaciones (Guardadas por Tenant)
  const tenantNotif = ctx.tenant_settings?.[currentTenantId]?.notificaciones || {}
  const [notif, setNotif] = useState({
    email_pagos:       tenantNotif.email_pagos ?? true,
    email_ews:         tenantNotif.email_ews ?? true,
    email_comunicados: tenantNotif.email_comunicados ?? false,
    email_reportes:    tenantNotif.email_reportes ?? true,
    push_pagos:        tenantNotif.push_pagos ?? false,
    push_ews:          tenantNotif.push_ews ?? true,
    push_comunicados:  tenantNotif.push_comunicados ?? true,
    push_reportes:     tenantNotif.push_reportes ?? false,
    sms_pagos:         tenantNotif.sms_pagos ?? false,
    sms_ews:           tenantNotif.sms_ews ?? false,
    digest_semanal:    tenantNotif.digest_semanal ?? true,
    digest_mensual:    tenantNotif.digest_mensual ?? true,
  })

  // Sincronizar notif si el contexto se carga después
  useEffect(() => {
    if (ctx.tenant_settings && ctx.tenant_settings[currentTenantId]?.notificaciones) {
      setNotif(prev => ({ ...prev, ...ctx.tenant_settings[currentTenantId].notificaciones }))
    }
  }, [ctx.tenant_settings, currentTenantId])

  const setN = (k: keyof typeof notif) => (v: boolean) => setNotif(n => ({ ...n, [k]: v }))

  // Apariencia — draft state, se aplica al guardar
  // Store the original settings when entering the page or after saving
  const [original, setOriginal] = useState<AppSettings>({
    theme:        ctx.theme,
    density:      ctx.density,
    fontSize:     ctx.fontSize,
    animaciones:  ctx.animaciones,
    sidebarPinned: ctx.sidebarPinned,
    language:     ctx.language,
    timezone:     ctx.timezone,
    date_format:  ctx.date_format,
    initial_view: ctx.initial_view,
    tenant_settings: ctx.tenant_settings,
    integrations: ctx.integrations
  })

  const [draft, setDraft] = useState<AppSettings>({ ...original })
  const [aparienciaSaved, setAparienciaSaved] = useState(false)
  
  const hasDraftChanges =
    draft.theme !== original.theme ||
    draft.density !== original.density ||
    draft.fontSize !== original.fontSize ||
    draft.animaciones !== original.animaciones ||
    draft.sidebarPinned !== original.sidebarPinned

  const setD = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    setDraft(d => ({ ...d, [k]: v }))
    ctx.previewSettings({ [k]: v })
  }

  const resetDraft = () => {
    setDraft({ ...original })
    ctx.previewSettings({ ...original })
  }

  // Seguridad
  const [mfa,         setMfa]         = useState(false)
  const [showPwd,     setShowPwd]     = useState(false)
  const [pwd,         setPwd]         = useState({ actual: '', nueva: '', confirmar: '' })
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const copyToken = (name: string) => {
    setCopiedToken(name)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Integraciones
  const [integrations, setIntegrations] = useState(ctx.integrations)
  
  useEffect(() => {
    setIntegrations(ctx.integrations)
  }, [ctx.integrations])

  const toggleInt = async (k: keyof typeof integrations) => {
    const newInts = { ...integrations, [k]: !integrations[k] }
    setIntegrations(newInts)
    await ctx.saveSettings({ integrations: newInts })
  }

  const [saved, setSaved] = useState(false)
  const save = async () => { 
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    
    // Preparar el payload de tenant_settings conservando el resto de los tenants
    const updatedTenantSettings = {
      ...ctx.tenant_settings,
      [currentTenantId]: {
        ...(ctx.tenant_settings?.[currentTenantId] || {}),
        notificaciones: notif
      }
    }

    await ctx.saveSettings({ 
      language: idioma, 
      timezone: zona, 
      date_format: fechaFmt, 
      initial_view: vistaIni,
      tenant_settings: updatedTenantSettings,
      integrations: integrations,
      theme: draft.theme,
      density: draft.density,
      fontSize: draft.fontSize,
      animaciones: draft.animaciones,
      sidebarPinned: draft.sidebarPinned
    })
    
    setOriginal({ ...draft })
    
    // Also reset draft changes state if any
    setAparienciaSaved(true)
    setTimeout(() => setAparienciaSaved(false), 2500)
  }

  const [activeColorKey, setActiveColorKey] = useState<ColorKey>('sidebar-badge')
  const [colorDraft, setColorDraft] = useState<Record<ColorKey, RGBColor>>(loadColors)
  const [colorSaved, setColorSaved] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const [hexInput, setHexInput] = useState(rgbToHex(colorDraft['sidebar-badge']))
  const nativePickerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHexInput(rgbToHex(colorDraft[activeColorKey]))
  }, [activeColorKey, colorDraft])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/core/tenant/settings`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.colors && Object.keys(data.colors).length > 0) {
            setColorDraft(prev => ({ ...prev, ...data.colors }))
          }
        })
        .catch(console.error)
      }
    })
  }, [])

  const activeColor = colorDraft[activeColorKey]

  const updateChannel = (ch: 'r' | 'g' | 'b' | 'a', val: number) => {
    setColorDraft(d => ({ ...d, [activeColorKey]: { ...d[activeColorKey], [ch]: val } }))
  }

  const applyHex = (hex: string) => {
    const rgb = hexToRgb(hex)
    if (rgb) setColorDraft(d => ({ ...d, [activeColorKey]: { ...rgb, a: d[activeColorKey].a } }))
  }

  const saveColors = async () => {
    applyColorVars(colorDraft)
    setColorSaved(true)
    setTimeout(() => setColorSaved(false), 2500)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/core/tenant/settings`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ colors: colorDraft })
        })
      }
    } catch(e) { console.error(e) }
  }

  const resetColors = () => {
    setColorDraft({ ...COLOR_DEFAULTS })
    applyColorVars(COLOR_DEFAULTS)
    localStorage.removeItem('institution-colors')
    setResetModal(false)
  }

  return (
    <div style={{ padding: 'var(--page-p)' }} className="fade-up">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{t('Ajustes')}</h1>
          <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>{t('Personaliza tu experiencia en EduOS')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span className="badge badge-green"><CheckCircle2 size={10} /> {t('Guardado')}</span>}
          <button className="btn btn-primary btn-sm" onClick={save}>{t('Guardar cambios')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>

        {/* ── Sidebar tabs ─────────────────────────────── */}
        <div className="card" style={{ padding: '8px 6px', alignSelf: 'start' }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <div
                key={t.id}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
                style={{ marginBottom: 2 }}
              >
                <Icon size={14} style={{ flexShrink: 0, color: active ? 'var(--tx)' : 'var(--tx-3)' }} />
                <span style={{ flex: 1 }}>{t.label}</span>
                {active && <ChevronRight size={12} style={{ color: 'var(--tx-3)' }} />}
              </div>
            )
          })}
        </div>

        {/* ── Content area ─────────────────────────────── */}
        <div className="card" style={{ padding: '24px 28px' }}>

          {/* ══ GENERAL ══════════════════════════════════ */}
          {tab === 'general' && (
            <div>
              <SectionTitle title={t('Configuración general')} sub="Preferencias de idioma, zona horaria y formato de datos" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div>
                  <label><Globe size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />{t('Idioma del sistema')}</label>
                  <select value={idioma} onChange={e => setIdioma(e.target.value)}>
                    <option value="es">Español (ES)</option>
                    <option value="en">English (EN)</option>
                    <option value="pt">Português (PT)</option>
                    <option value="qu">Quechua (QU)</option>
                  </select>
                </div>
                <div>
                  <label><Clock size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />{t('Zona horaria')}</label>
                  <select value={zona} onChange={e => setZona(e.target.value)}>
                    <option value="America/Lima">America/Lima (GMT-5)</option>
                    <option value="America/Bogota">America/Bogotá (GMT-5)</option>
                    <option value="America/Santiago">America/Santiago (GMT-4)</option>
                    <option value="America/Mexico_City">America/Ciudad de México (GMT-6)</option>
                    <option value="America/Buenos_Aires">America/Buenos Aires (GMT-3)</option>
                  </select>
                </div>
              </div>

              <Divider />
              <SectionTitle title={t('Formato de fecha')} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
                <Radio label="DD/MM/AAAA" sub={`Ej: ${ctx.formatDate(new Date())}`} selected={fechaFmt === 'dmy'} onClick={() => setFechaFmt('dmy')} />
                <Radio label="MM/DD/AAAA" sub={`Ej: ${ctx.formatDate(new Date())}`} selected={fechaFmt === 'mdy'} onClick={() => setFechaFmt('mdy')} />
                <Radio label="AAAA-MM-DD" sub={`Ej: ${ctx.formatDate(new Date())}`} selected={fechaFmt === 'ymd'} onClick={() => setFechaFmt('ymd')} />
              </div>

              <Divider />
              <SectionTitle title={t('Vista inicial')} sub="Pantalla que aparece al iniciar sesión" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { id: 'dashboard',  label: 'Dashboard principal' },
                  { id: 'matricula',  label: 'Matrícula' },
                  { id: 'analytics',  label: 'Analytics' },
                  { id: 'ews',        label: 'Alerta Temprana' },
                ].map(v => (
                  <Radio key={v.id} label={v.label} selected={vistaIni === v.id} onClick={() => setVistaIni(v.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ══ NOTIFICACIONES ═══════════════════════════ */}
          {tab === 'notificaciones' && (
            <div>
              <SectionTitle title="Notificaciones" sub="Controla qué eventos te notifican y por qué canal" />

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Mail size={14} style={{ color: 'var(--tx-2)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Correo electrónico</span>
                </div>
                <ToggleRow label="Pagos y transacciones"   sub="Recibos, cobros fallidos, recordatorios de deuda"   checked={notif.email_pagos}       onChange={setN('email_pagos')} />
                <ToggleRow label="Alertas EWS"             sub="Estudiantes en riesgo detectados por el sistema"     checked={notif.email_ews}         onChange={setN('email_ews')} />
                <ToggleRow label="Comunicados del sistema" sub="Actualizaciones de plataforma y mantenimientos"      checked={notif.email_comunicados}  onChange={setN('email_comunicados')} />
                <ToggleRow label="Reportes automáticos"    sub="Envío de actas, exportaciones y generación de PDFs"  checked={notif.email_reportes}     onChange={setN('email_reportes')} />
              </div>

              <Divider />

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MessageSquare size={14} style={{ color: 'var(--tx-2)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Notificaciones push</span>
                </div>
                <ToggleRow label="Pagos y transacciones"   sub="Alerta instantánea cuando se procesa un pago"          checked={notif.push_pagos}        onChange={setN('push_pagos')} />
                <ToggleRow label="Alertas EWS críticas"    sub="Notificación inmediata para riesgo nivel crítico"       checked={notif.push_ews}          onChange={setN('push_ews')} />
                <ToggleRow label="Comunicaciones docente"  sub="Mensajes y respuestas en el chat del sistema"           checked={notif.push_comunicados}   onChange={setN('push_comunicados')} />
                <ToggleRow label="Reportes listos"         sub="Aviso cuando un reporte termina de generarse"           checked={notif.push_reportes}      onChange={setN('push_reportes')} />
              </div>

              <Divider />

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Smartphone size={14} style={{ color: 'var(--tx-2)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>SMS</span>
                </div>
                <ToggleRow label="Pagos urgentes" sub="Solo para cobros fallidos con alto monto"         checked={notif.sms_pagos} onChange={setN('sms_pagos')} />
                <ToggleRow label="EWS riesgo crítico" sub="Mensaje al teléfono registrado ante emergencias" checked={notif.sms_ews} onChange={setN('sms_ews')} />
              </div>

              <Divider />

              <SectionTitle title="Resúmenes" sub="Consolidado periódico de actividad de la plataforma" />
              <ToggleRow label="Resumen semanal" sub="Cada lunes a las 8:00 AM con métricas de la semana anterior" checked={notif.digest_semanal} onChange={setN('digest_semanal')} />
              <ToggleRow label="Resumen mensual" sub="Primer día hábil del mes con KPIs institucionales" checked={notif.digest_mensual} onChange={setN('digest_mensual')} />
            </div>
          )}

          {/* ══ APARIENCIA ═══════════════════════════════ */}
          {tab === 'apariencia' && (
            <div>
              {/* Subheader con estado de cambios */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Apariencia</div>
                  <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Los cambios se aplican al presionar "Guardar"</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {aparienciaSaved && <span className="badge badge-green"><CheckCircle2 size={10} /> Guardado</span>}
                  {hasDraftChanges && !aparienciaSaved && (
                    <span className="badge badge-amber"><Zap size={10} /> Cambios sin guardar</span>
                  )}
                  {hasDraftChanges && (
                    <button className="btn btn-ghost btn-sm" onClick={resetDraft} title="Descartar cambios">
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Tema de color ─────────────────────── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Tema de color</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {([
                    { id: 'dark'   as Theme, label: 'Oscuro',  sub: 'EduOS Dark',           icon: Moon    },
                    { id: 'light'  as Theme, label: 'Claro',   sub: 'EduOS Light',           icon: Sun     },
                    { id: 'system' as Theme, label: 'Sistema', sub: 'Sigue al dispositivo',  icon: Monitor },
                  ]).map(t => {
                    const Icon = t.icon
                    const sel  = draft.theme === t.id
                    const isLight = t.id === 'light'
                    const isSys   = t.id === 'system'
                    return (
                      <div key={t.id} onClick={() => setD('theme', t.id)} style={{
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid ${sel ? 'var(--blue)' : 'var(--border)'}`,
                        background: sel ? 'var(--blue-dim)' : 'var(--s3)',
                        cursor: 'pointer', transition: 'all var(--transition)', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: 64, position: 'relative',
                          background: isLight ? 'linear-gradient(135deg,#F4F3F1,#EDECEA)'
                            : isSys ? 'linear-gradient(135deg,#EDECEA 0%,#0C0B0A 100%)'
                            : 'linear-gradient(135deg,#161513,#0C0B0A)',
                          display: 'flex', alignItems: 'flex-end', padding: '8px 10px', gap: 4,
                          borderBottom: `1px solid ${sel ? 'rgba(59,130,246,0.25)' : 'var(--border)'}`,
                        }}>
                          <div style={{ width: 16, height: 38, borderRadius: 3, flexShrink: 0, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {[70, 55, 40].map((w, i) => (
                              <div key={i} style={{ height: 4, borderRadius: 2, width: `${w}%`, background: sel && i === 2 ? 'rgba(59,130,246,0.55)' : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.09)' }} />
                            ))}
                          </div>
                          {sel && <div style={{ position: 'absolute', top: 6, right: 8, width: 16, height: 16, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={10} color="#fff" /></div>}
                        </div>
                        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon size={14} style={{ color: sel ? 'var(--blue)' : 'var(--tx-3)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? 'var(--tx)' : 'var(--tx-2)' }}>{t.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 1 }}>{t.sub}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Divider />

              {/* ── Densidad de interfaz ───────────────── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Densidad de la interfaz</div>
                  <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Controla el espacio entre elementos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 14, padding: '0 2px' }}>
                  {(['compact','normal','comfy'] as Density[]).map((d, i, arr) => (
                    <div key={d} onClick={() => setD('density', d)} style={{
                      flex: 1, height: 4, borderRadius: 100, cursor: 'pointer',
                      background: draft.density === d ? 'var(--blue)' : arr.indexOf(draft.density) > i ? 'rgba(59,130,246,0.25)' : 'var(--s4)',
                      transition: 'background 200ms ease',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {([
                    { id: 'compact' as Density, label: 'Compacta', sub: 'Máximo contenido visible',     rows: 5 },
                    { id: 'normal'  as Density, label: 'Normal',   sub: 'Balance óptimo (recomendado)', rows: 3 },
                    { id: 'comfy'   as Density, label: 'Cómoda',   sub: 'Más espacio entre elementos',  rows: 2 },
                  ]).map(d => {
                    const sel = draft.density === d.id
                    return (
                      <div key={d.id} onClick={() => setD('density', d.id)} style={{
                        borderRadius: 'var(--radius-lg)', cursor: 'pointer', overflow: 'hidden', transition: 'all var(--transition)',
                        border: `1px solid ${sel ? 'var(--blue)' : 'var(--border)'}`,
                        background: sel ? 'var(--blue-dim)' : 'var(--s3)',
                      }}>
                        <div style={{
                          padding: d.id === 'compact' ? '8px 10px' : d.id === 'normal' ? '12px 10px' : '16px 10px',
                          borderBottom: `1px solid ${sel ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`,
                          display: 'flex', flexDirection: 'column',
                          gap: d.id === 'compact' ? 4 : d.id === 'normal' ? 7 : 11, minHeight: 64,
                        }}>
                          {Array.from({ length: d.rows }).map((_, i) => (
                            <div key={i} style={{ height: 4, borderRadius: 2, width: i === 0 ? '75%' : i % 2 === 0 ? '55%' : '65%', background: sel ? (i === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.2)') : (i === 0 ? 'var(--border-md)' : 'var(--border)') }} />
                          ))}
                        </div>
                        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Rows3 size={13} style={{ color: sel ? 'var(--blue)' : 'var(--tx-3)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? 'var(--tx)' : 'var(--tx-2)' }}>{d.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 1 }}>{d.sub}</div>
                          </div>
                          {sel && <CheckCircle2 size={12} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Divider />

              {/* ── Color de etiquetas e identidad institucional ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Color de etiquetas e identidad institucional</div>
                  <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>Personaliza de forma independiente el color de los badges, etiquetas del menú y acentos para reflejar la identidad de tu institución.</div>
                </div>

                {/* Layout: selector list left + editor + preview right */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>

                  {/* Left: target list + RGB editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Target selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {COLOR_META.map(m => {
                        const c = colorDraft[m.id]
                        const sel = activeColorKey === m.id
                        return (
                          <div key={m.id} onClick={() => setActiveColorKey(m.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                            borderRadius: 'var(--radius)', cursor: 'pointer',
                            border: `1px solid ${sel ? 'var(--blue)' : 'var(--border)'}`,
                            background: sel ? 'var(--blue-dim)' : 'var(--s3)',
                            transition: 'all var(--transition)',
                          }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                              background: rgbToCss(c),
                              border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: sel ? `0 0 8px ${rgbToCss({ ...c, a: 0.5 })}` : 'none',
                              transition: 'box-shadow 250ms ease',
                            }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? 'var(--tx)' : 'var(--tx-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</div>
                              <div style={{ fontSize: 10, color: 'var(--tx-3)', marginTop: 1 }}>{m.desc}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: 'var(--tx-3)', flexShrink: 0 }}>{rgbToHex(c)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right: editor panel */}
                  <div className="card-inner" style={{ padding: '16px' }}>
                    {/* HEX + native picker row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                        background: rgbToCss(activeColor),
                        border: '1px solid var(--border-md)',
                        boxShadow: `0 0 12px ${rgbToCss({ ...activeColor, a: 0.4 })}`,
                        cursor: 'pointer', position: 'relative',
                      }} onClick={() => nativePickerRef.current?.click()}>
                        <input
                          ref={nativePickerRef}
                          type="color"
                          value={rgbToHex(activeColor)}
                          onChange={e => applyHex(e.target.value)}
                          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'var(--tx-3)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>HEX</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            value={hexInput}
                            onChange={e => { setHexInput(e.target.value); applyHex(e.target.value) }}
                            onBlur={() => setHexInput(rgbToHex(activeColor))}
                            style={{ fontFamily: 'monospace', fontSize: 13, width: '100%', padding: '5px 9px', background: 'var(--s4)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--tx)', outline: 'none' }}
                            maxLength={7}
                          />
                          <button
                            title="Abrir selector de color"
                            onClick={() => nativePickerRef.current?.click()}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0 8px', flexShrink: 0 }}
                          >
                            <Pipette size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RGB sliders */}
                    {(['r', 'g', 'b'] as const).map(ch => {
                      const colors = { r: '#ef4444', g: '#22c55e', b: '#3b82f6' }
                      const labels = { r: 'R', g: 'G', b: 'B' }
                      return (
                        <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ width: 14, fontSize: 11, fontWeight: 700, color: colors[ch], flexShrink: 0 }}>{labels[ch]}</span>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input
                              type="range" min={0} max={255} value={activeColor[ch]}
                              onChange={e => updateChannel(ch, Number(e.target.value))}
                              style={{
                                width: '100%', height: 6, borderRadius: 100, outline: 'none', border: 'none',
                                appearance: 'none', cursor: 'pointer',
                                background: `linear-gradient(to right, #000 0%, ${colors[ch]} 100%)`,
                                accentColor: colors[ch],
                              }}
                            />
                          </div>
                          <input
                            type="number" min={0} max={255} value={Math.round(activeColor[ch])}
                            onChange={e => updateChannel(ch, Math.max(0, Math.min(255, Number(e.target.value))))}
                            style={{ width: 44, textAlign: 'right', fontSize: 11, fontFamily: 'monospace', padding: '3px 5px', background: 'var(--s4)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--tx)', outline: 'none' }}
                          />
                        </div>
                      )
                    })}

                    {/* Alpha slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ width: 14, fontSize: 11, fontWeight: 700, color: 'var(--tx-3)', flexShrink: 0 }}>A</span>
                      <input
                        type="range" min={0} max={100} value={Math.round((activeColor.a ?? 1) * 100)}
                        onChange={e => updateChannel('a', Number(e.target.value) / 100)}
                        style={{ flex: 1, height: 6, borderRadius: 100, outline: 'none', border: 'none', appearance: 'none', cursor: 'pointer', background: `linear-gradient(to right, transparent 0%, ${rgbToCss({ ...activeColor, a: 1 })} 100%)`, accentColor: 'var(--blue)' }}
                      />
                      <span style={{ width: 44, textAlign: 'right', fontSize: 11, fontFamily: 'monospace', color: 'var(--tx-3)' }}>{Math.round((activeColor.a ?? 1) * 100)}%</span>
                    </div>

                    {/* Preset swatches */}
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Presets institucionales</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {SWATCHES.map(s => (
                        <div
                          key={s.label}
                          title={s.label}
                          onClick={() => setColorDraft(d => ({ ...d, [activeColorKey]: s.color }))}
                          style={{
                            width: 22, height: 22, borderRadius: 5,
                            background: rgbToCss(s.color),
                            border: rgbToHex(s.color) === rgbToHex(activeColor) ? '2px solid var(--tx)' : '1px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            transition: 'transform 120ms ease',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                        />
                      ))}
                    </div>

                    {/* Live Preview */}
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Vista previa</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px', background: 'var(--s2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      {/* Badge numérico */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: 'var(--s3)', border: '1px solid var(--border)', fontSize: 12 }}>
                        <span style={{ color: 'var(--tx-2)' }}>Matrícula</span>
                        <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: rgbToCss(activeColor), color: getContrastText(activeColor), fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>3</span>
                      </div>
                      {/* DEMI pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: rgbToCss({ ...activeColor, a: 0.15 }), border: `1px solid ${rgbToCss({ ...activeColor, a: 0.35 })}`, fontSize: 12, color: rgbToCss({ ...activeColor, a: 1 }), fontWeight: 600 }}>
                        ✦ DEMI
                      </div>
                      {/* Status badge */}
                      <div style={{ padding: '4px 10px', borderRadius: 4, background: rgbToCss({ ...activeColor, a: 0.15 }), border: `1px solid ${rgbToCss({ ...activeColor, a: 0.3 })}`, fontSize: 11, fontWeight: 600, color: rgbToCss(activeColor) }}>
                        En Riesgo
                      </div>
                      {/* Botón primario */}
                      <div style={{ padding: '6px 14px', borderRadius: 'var(--radius)', background: rgbToCss(activeColor), color: getContrastText(activeColor), fontSize: 12, fontWeight: 600, cursor: 'default' }}>
                        Guardar
                      </div>
                      {/* Contraste WCAG */}
                      <div style={{ width: '100%', marginTop: 4, fontSize: 10, color: 'var(--tx-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>Contraste WCAG:</span>
                        {(() => {
                          const lum = (0.299 * activeColor.r + 0.587 * activeColor.g + 0.114 * activeColor.b) / 255
                          const onWhite = Math.abs(lum - 1) + 0.05
                          const onBlack = lum + 0.05
                          const ratio = Math.max(onWhite, onBlack) / Math.min(onWhite, onBlack)
                          const aa = ratio >= 4.5
                          return <span style={{ color: aa ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>{ratio.toFixed(1)}:1 {aa ? '✓ AA' : '✗ AA'}</span>
                        })()}
                      </div>
                    </div>

                    {/* Save / Reset */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setResetModal(true)} style={{ flex: 1, justifyContent: 'center' }}>
                        <RotateCcw size={11} /> Restablecer
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={saveColors} style={{ flex: 2, justifyContent: 'center' }}>
                        {colorSaved ? <><CheckCircle2 size={12} /> Guardado</> : <><CheckCircle2 size={12} /> Guardar colores</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset modal */}
                {resetModal && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setResetModal(false)}>
                    <div className="card" style={{ padding: 24, maxWidth: 360, width: '90%' }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>¿Restablecer colores?</div>
                      <div style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 20 }}>Se perderán todos los colores personalizados y se volverán a los valores predeterminados de EduOS.</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setResetModal(false)}>Cancelar</button>
                        <button className="btn btn-danger btn-sm" onClick={resetColors}><Trash2 size={12} /> Restablecer</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Divider />

              {/* ── Tipografía ────────────────────────── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Tipografía</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                  {([
                    { id: '12' as FontSize, label: 'XS', px: '12px' },
                    { id: '13' as FontSize, label: 'S',  px: '13px' },
                    { id: '14' as FontSize, label: 'M',  px: '14px' },
                    { id: '15' as FontSize, label: 'L',  px: '15px' },
                  ]).map(f => {
                    const sel = draft.fontSize === f.id
                    return (
                      <div key={f.id} onClick={() => setD('fontSize', f.id)} style={{
                        borderRadius: 'var(--radius-lg)', cursor: 'pointer', overflow: 'hidden',
                        border: `1px solid ${sel ? 'var(--blue)' : 'var(--border)'}`,
                        background: sel ? 'var(--blue-dim)' : 'var(--s3)',
                        padding: '14px 12px', textAlign: 'center',
                        transition: 'all var(--transition)',
                      }}>
                        <div style={{ fontSize: f.px, fontWeight: 600, color: sel ? 'var(--tx)' : 'var(--tx-2)', marginBottom: 4, lineHeight: 1 }}>Aa</div>
                        <div style={{ fontSize: 11, color: sel ? 'var(--blue)' : 'var(--tx-3)', fontWeight: sel ? 600 : 400 }}>{f.label} · {f.px}</div>
                      </div>
                    )
                  })}
                </div>
                {/* Preview texto en tiempo real */}
                <div className="card-inner" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--tx-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Vista previa</div>
                  <div style={{ fontSize: `${draft.fontSize}px`, color: 'var(--tx)', lineHeight: 1.5 }}>
                    La interfaz de democra.pro se verá con este tamaño de fuente.
                  </div>
                  <div style={{ fontSize: `${Number(draft.fontSize) - 1}px`, color: 'var(--tx-2)', marginTop: 4 }}>
                    Texto secundario y descripciones de la plataforma.
                  </div>
                </div>
              </div>

              <Divider />

              {/* ── Comportamiento ────────────────────── */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Comportamiento</div>
                <ToggleRow
                  label="Sidebar fijo al iniciar sesión"
                  sub="La barra lateral arranca expandida y anclada. Desactivar para modo hover."
                  checked={draft.sidebarPinned}
                  onChange={v => setD('sidebarPinned', v)}
                />
                <ToggleRow
                  label="Animaciones de interfaz"
                  sub="Transiciones fade-up, slide y efectos visuales al navegar"
                  checked={draft.animaciones}
                  onChange={v => setD('animaciones', v)}
                />
              </div>

            </div>
          )}

          {/* ══ SEGURIDAD ════════════════════════════════ */}
          {tab === 'seguridad' && <SecurityTab />}

          {/* ══ INTEGRACIONES ════════════════════════════ */}
          {tab === 'integraciones' && (
            <div>
              <SectionTitle title="Integraciones" sub="Conecta EduOS con otras plataformas y servicios" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    key: 'google', name: 'Google Workspace', sub: 'SSO, Drive, Calendar y Classroom',
                    icon: Globe, color: '#EA4335', plan: 'Todos',
                  },
                  {
                    key: 'slack', name: 'Slack', sub: 'Notificaciones EWS y reportes en canales',
                    icon: Link2, color: '#4A154B', plan: 'Pro+',
                  },
                  {
                    key: 'zoom', name: 'Zoom', sub: 'Clases virtuales integradas al horario',
                    icon: Video, color: '#2D8CFF', plan: 'Pro+',
                  },
                  {
                    key: 'whatsapp', name: 'WhatsApp Business', sub: 'Mensajes automáticos a padres de familia',
                    icon: MessageSquare, color: '#25D366', plan: 'Enterprise',
                  },
                  {
                    key: 'sap', name: 'SAP / Oracle ERP', sub: 'Sincronización de nómina y contabilidad',
                    icon: Settings, color: '#0070B8', plan: 'Enterprise',
                  },
                ].map(intg => {
                  const active = integrations[intg.key as keyof typeof integrations]
                  const Icon = intg.icon
                  return (
                    <div key={intg.key} className="card-inner" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: `${intg.color}18`, border: `1px solid ${intg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} style={{ color: intg.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{intg.name}</span>
                          <span className="badge badge-muted" style={{ fontSize: 10 }}>{intg.plan}</span>
                          {active && <span className="badge badge-green" style={{ fontSize: 10 }}>Conectado</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{intg.sub}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {active && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                            <Settings size={11} /> Config.
                          </button>
                        )}
                        <button
                          className={`btn btn-sm ${active ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => toggleInt(intg.key as keyof typeof integrations)}
                        >
                          {active ? 'Desconectar' : 'Conectar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Divider />

              <div className="card-inner" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <AlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.6 }}>
                  Las integraciones marcadas como <strong style={{ color: 'var(--tx-2)' }}>Enterprise</strong> requieren activación previa del módulo. Contacta a tu account manager para habilitarlas en tu instancia.
                </div>
                <button className="btn btn-sm btn-ghost">Ver planes</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
