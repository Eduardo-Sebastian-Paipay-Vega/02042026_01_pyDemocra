import { useState, useRef, useEffect } from 'react'
import { usePersistedState } from '@educ/hooks/usePersistedState'
import { Send, X, Expand, Shrink, FileText, CheckCircle, Brain, Sparkles, Image as ImageIcon, ChevronDown } from 'lucide-react'

interface Message {
  id: number
  from: 'demi' | 'user'
  text: string
  time: string
}

const SUGGESTIONS = [
  { label: 'Guía de Matrícula',      icon: '🎓' },
  { label: 'Análisis de KPI',        icon: '📊' },
  { label: 'Revisión de Finanzas',   icon: '💰' },
  { label: 'Ayuda de Procesos',      icon: '⚙️' },
]

const WELCOME: Message = {
  id: 0,
  from: 'demi',
  text: '¡Hola! Soy DEMI, tu asistente de democra.pro. ¿En qué proceso o información te puedo ayudar hoy?',
  time: 'Ahora',
}

const CONTEXT_NOTE = 'Estoy al tanto de todos los datos en este Dashboard'

export default function DemiChat() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = usePersistedState('demi_widget_input', '')
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [typing, setTyping]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = (text: string) => {
    if (!text.trim()) return
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = { id: Date.now(), from: 'user', text: text.trim(), time: now }
    setMessages(m => [...m, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const replies: Record<string, string> = {
        'Guía de Matrícula':    'Para iniciar una matrícula ve a Matrícula → Nueva Inscripción. Puedo guiarte paso a paso por el flujo completo.',
        'Análisis de KPI':      'Actualmente tienes 300 inscritos, retención del 94%, promedio 7.8/10 y 12 estudiantes en riesgo. ¿Quieres profundizar en algún indicador?',
        'Revisión de Finanzas': 'La recaudación del mes muestra tendencia positiva. Hay 3 familias con más de 90 días de mora. ¿Genero un reporte detallado?',
        'Ayuda de Procesos':    '¿Sobre qué proceso necesitas orientación? Puedo ayudarte con matrícula, calificaciones, asistencia, finanzas y más.',
      }
      const reply = replies[text.trim()] || 'Entendido. Estoy procesando tu consulta con los datos actuales del dashboard. ¿Puedes darme más contexto?'
      setMessages(m => [...m, { id: Date.now() + 1, from: 'demi', text: reply, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    }, 1200)
  }

  return (
    <>
      {/* ── Floating button ─────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir DEMI"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px 10px 14px',
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          border: 'none', borderRadius: 100,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(37,99,235,0.45), 0 1px 4px rgba(0,0,0,0.3)',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          color: '#fff',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 6px 28px rgba(37,99,235,0.55), 0 2px 6px rgba(0,0,0,0.3)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 4px 20px rgba(37,99,235,0.45), 0 1px 4px rgba(0,0,0,0.3)'
        }}
      >
        {/* AI avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>DEMI</div>
          {!open && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>IA · Disponible</div>}
        </div>
        {open && <ChevronDown size={14} style={{ opacity: 0.8 }} />}
      </button>

      {/* ── Chat window ─────────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 86, right: 24, zIndex: 999,
            width: 360, height: 520,
            background: 'var(--s1)',
            border: '1px solid var(--border-md)',
            borderRadius: 14,
            boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'demiSlide 200ms cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>DEMI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Tu Guía de Plataforma</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 120ms' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
            >
              <X size={15} />
            </button>
          </div>

          {/* Context pill */}
          <div style={{
            padding: '6px 12px',
            background: 'var(--s2)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 10.5, color: 'var(--blue)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, display: 'inline-block' }} />
              {CONTEXT_NOTE}
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}>
                {msg.from === 'demi' && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                    <Sparkles size={11} color="var(--blue)" />
                  </div>
                )}
                <div style={{ maxWidth: '75%' }}>
                  <div style={{
                    padding: '9px 12px',
                    borderRadius: msg.from === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                    background: msg.from === 'user' ? 'var(--blue)' : 'var(--s3)',
                    border: msg.from === 'user' ? 'none' : '1px solid var(--border)',
                    fontSize: 12.5,
                    color: msg.from === 'user' ? '#fff' : 'var(--tx)',
                    lineHeight: 1.5,
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tx-3)', marginTop: 3, textAlign: msg.from === 'user' ? 'right' : 'left', paddingLeft: msg.from === 'user' ? 0 : 2 }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={11} color="var(--blue)" />
                </div>
                <div style={{ padding: '9px 14px', background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: '4px 12px 12px 12px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 150, 300].map(d => (
                    <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--tx-3)', display: 'inline-block', animation: `demiBounce 1s ${d}ms ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '6px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => send(s.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px',
                    borderRadius: 100,
                    border: '1px solid var(--border-md)',
                    background: 'var(--s3)',
                    fontSize: 11.5, color: 'var(--tx-2)',
                    cursor: 'pointer',
                    transition: 'border-color 120ms, color 120ms, background 120ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(59,130,246,0.5)'
                    el.style.color = 'var(--tx)'
                    el.style.background = 'rgba(59,130,246,0.08)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border-md)'
                    el.style.color = 'var(--tx-2)'
                    el.style.background = 'var(--s3)'
                  }}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'var(--s2)',
            flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Escribe tu pregunta para DEMI..."
              style={{
                flex: 1, background: 'var(--s3)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--tx)', fontSize: 12.5,
                padding: '8px 12px',
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 150ms',
              }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.5)'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: input.trim() ? 'var(--blue)' : 'var(--s4)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms',
              }}
            >
              <Send size={13} color={input.trim() ? '#fff' : 'var(--tx-3)'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes demiSlide {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes demiBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
