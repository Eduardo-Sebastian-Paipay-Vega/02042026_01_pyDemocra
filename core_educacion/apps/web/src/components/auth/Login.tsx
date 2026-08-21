import { useState, useEffect } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { usePersistedState } from '@/hooks/usePersistedState'
// No imports for missing images

interface LoginProps {
  onLogin: (email: string, pass: string, onStepChange?: (step: number) => void) => Promise<void> | void
}

export default function Login({ onLogin }: LoginProps) {
  const { theme } = useSettings()
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  const logoSrc = resolvedTheme === 'dark' ? '/img/mono-core.png' : '/img/core-vector.png';
  const [email, setEmail] = usePersistedState('login_email', '')
  const [password, setPassword] = useState('')
  
  const [error, setError] = useState('')
  const [emailFocus, setEmailFocus] = useState(false)
  const [pwdFocus, setPwdFocus] = useState(false)

  // Context Hydration States
  const [hydrationStep, setHydrationStep] = useState(0)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email)        { setError('Ingresa tu correo institucional'); return }
    if (!password)     { setError('Ingresa tu contraseña'); return }
    setError('')
    setIsAuthenticating(true)
    setHydrationStep(1) 
    try {
      await onLogin(email, password, setHydrationStep)
    } catch (e: any) {
      setError(e.message || 'Error de autenticación')
      setHydrationStep(0)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const renderHydrationScreen = () => {
    const steps = [
      { step: 1, text: 'Resolviendo entorno y Tenant ID' },
      { step: 2, text: 'Aplicando políticas de seguridad RLS' },
      { step: 3, text: 'Cargando árbol de módulos activos' }
    ]

    const progress = hydrationStep >= 4 ? 100 : (hydrationStep / 3) * 100

    return (
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 32 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: '3px solid rgba(59,130,246,0.1)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            border: '3px solid transparent',
            borderTopColor: '#3B82F6',
            borderRightColor: hydrationStep > 1 ? '#3B82F6' : 'transparent',
            borderBottomColor: hydrationStep > 2 ? '#3B82F6' : 'transparent',
            borderRadius: '50%',
            animation: hydrationStep < 4 ? 'spin 1s linear infinite' : 'none',
            transition: 'all 300ms ease'
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>D</span>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 24, letterSpacing: '-0.3px' }}>
          Hidratando Contexto
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {steps.map(s => {
            const isActive = hydrationStep === s.step
            const isDone = hydrationStep > s.step
            const isPending = hydrationStep < s.step

            return (
              <div key={s.step} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: isPending ? 0.3 : 1,
                transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                transition: 'all 300ms ease'
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: isDone ? 'rgba(34,197,94,0.15)' : isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : isActive ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isDone && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} />}
                </div>
                <span style={{
                  fontSize: 13,
                  color: isDone ? 'rgba(255,255,255,0.7)' : isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                  fontWeight: isActive ? 500 : 400
                }}>
                  {s.text}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#3B82F6',
            width: `${progress}%`,
            transition: 'width 600ms ease-out',
            boxShadow: '0 0 10px rgba(59,130,246,0.5)'
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090909',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute',
        top: '30%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.055) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }} className="fade-up">

        {/* ── Branding ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <img src={logoSrc} alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
          </div>

          <span style={{
            fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 24,
          }}>
            EduOS Platform
          </span>

          <div style={{ marginBottom: 4 }}>
            <h1 style={{
              fontSize: 26, fontWeight: 700,
              color: 'rgba(255,255,255,0.93)',
              letterSpacing: '-0.4px',
              margin: 0,
            }}>
              Iniciar sesión
            </h1>
          </div>
          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.42)',
            margin: 0,
          }}>
            Semestre 2026-I · Democra School
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────── */}
        <div style={{
          background: '#111110',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '32px 36px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}>
          {hydrationStep > 0 ? (
            renderHydrationScreen()
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* ── Email ─────────────────────────────── */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  fontSize: 13, fontWeight: 500,
                  color: 'rgba(255,255,255,0.55)',
                  display: 'block', marginBottom: 7,
                }}>
                  Correo institucional
                </label>
                <input
                  type="email"
                  placeholder="usuario@institucion.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  style={{
                    background: '#181817',
                    border: `1px solid ${emailFocus ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 14,
                    height: 46,
                    padding: '0 14px',
                    width: '100%',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* ── Password ──────────────────────────── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'rgba(255,255,255,0.55)',
                    margin: 0,
                  }}>
                    Contraseña
                  </label>
                  <button
                    type="button"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: '#3B82F6',
                      padding: 0, fontFamily: 'inherit',
                      opacity: 0.85,
                      transition: 'opacity 120ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                  >
                    Olvidé mi contraseña
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPwdFocus(true)}
                  onBlur={() => setPwdFocus(false)}
                  style={{
                    background: '#181817',
                    border: `1px solid ${pwdFocus ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 14,
                    height: 46,
                    padding: '0 14px',
                    width: '100%',
                    outline: 'none',
                    transition: 'border-color 150ms ease',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* ── Error ─────────────────────────────── */}
              {error && (
                <div style={{
                  fontSize: 12.5, color: '#EF4444',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.18)',
                  borderRadius: 8,
                  padding: '9px 13px',
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              {/* ── Submit ────────────────────────────── */}
              <button
                type="submit"
                style={{
                  width: '100%', height: 48,
                  background: '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit',
                  letterSpacing: '0.01em',
                  transition: 'background 150ms ease, opacity 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1D4ED8' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#2563EB' }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.background = '#1E40AF' }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.background = '#1D4ED8' }}
              >
                Ingresar a EDUCACION OS
              </button>
            </form>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div style={{
          textAlign: 'center', marginTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          <img
            src={logoSrc}
            alt=""
            aria-hidden
            style={{ width: 13, height: 13, objectFit: 'contain', borderRadius: 3, opacity: 0.5 }}
          />
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.22)' }}>
            EduOS v2.0 · © 2026 democra.pro
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 520px) {
          .login-card-inner { padding: 24px 20px !important; }
          .login-role-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

