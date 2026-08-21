import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Sparkles, Plus, Download, ExternalLink,
  Activity, Mic, RotateCcw, BookOpen, BarChart2,
  Users, FileText, TrendingUp, Clock, Bot
} from 'lucide-react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type MessageType = 'text' | 'kpi' | 'table'
type Sender = 'demi' | 'user'

interface KpiData {
  title: string
  value: string
  trend: string
  positive: boolean
}

interface TableData {
  headers: string[]
  rows: string[][]
}

interface Message {
  id: number
  from: Sender
  type: MessageType
  text?: string
  kpiData?: KpiData
  tableData?: TableData
  time: string
  actions?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: 'Análisis de KPIs institucionales', type: 'kpi',   icon: BarChart2 },
  { label: 'Estudiantes en riesgo (EWS)',       type: 'table', icon: Users },
  { label: 'Generar reporte académico',         type: 'text',  icon: FileText },
  { label: 'Tendencias de matrícula',           type: 'text',  icon: TrendingUp },
  { label: 'Guía de procesos',                  type: 'text',  icon: BookOpen },
]

const HISTORY = [
  { id: 1, label: 'Riesgo de deserción Q2', time: 'Hace 2h' },
  { id: 2, label: 'KPIs de docentes',        time: 'Ayer' },
  { id: 3, label: 'Matrícula 2026',          time: 'Hace 3d' },
]

const now = () =>
  new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

// ─── Avatar ──────────────────────────────────────────────────────────────────
function DemiAvatar({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
  const icon = size === 'sm' ? 15 : 22
  return (
    <div
      className={cn(
        sz,
        'rounded-xl flex items-center justify-center shrink-0',
        'bg-gradient-to-br from-fuchsia-600 to-orange-500 text-white',
        'shadow-[0_4px_12px_rgba(217,70,239,0.3)]',
      )}
    >
      <Bot size={icon} />
    </div>
  )
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-3"
    >
      <DemiAvatar />
      <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-card border border-border flex gap-1.5 items-center shadow-sm">
        {[0, 0.18, 0.36].map((delay, i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-fuchsia-500 block"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 0.7, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isDemi = msg.from === 'demi'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn('flex items-end gap-3 w-full', isDemi ? 'justify-start' : 'justify-end')}
    >
      {/* DEMI avatar — only on left side */}
      {isDemi && <DemiAvatar />}

      <div className={cn('flex flex-col gap-2', isDemi ? 'items-start' : 'items-end', 'max-w-[78%] md:max-w-[70%]')}>
        {/* Sender label */}
        {isDemi && (
          <span className="text-[11px] uppercase tracking-wider font-bold text-fuchsia-400 ml-1">DEMI</span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-5 py-4 text-sm leading-relaxed',
            isDemi
              ? 'bg-[#18181A] border border-border/60 text-foreground rounded-2xl rounded-bl-sm shadow-sm'
              : 'bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-[0_4px_16px_rgba(79,70,229,0.25)]',
          )}
        >
          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

          {/* KPI Card */}
          {msg.type === 'kpi' && msg.kpiData && (
            <div className="mt-4 p-5 rounded-xl bg-black/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-semibold tracking-widest text-muted-foreground mb-1">
                  {msg.kpiData.title}
                </p>
                <p className={cn('text-4xl font-extrabold tabular-nums tracking-tight', msg.kpiData.positive ? 'text-emerald-400' : 'text-rose-400')}>
                  {msg.kpiData.value}
                </p>
              </div>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0',
                msg.kpiData.positive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}>
                <Activity size={13} />
                {msg.kpiData.trend}
              </div>
            </div>
          )}

          {/* Table */}
          {msg.type === 'table' && msg.tableData && (
            <div className="mt-4 rounded-xl border border-border overflow-hidden bg-black/20">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-black/40 border-b border-border/60">
                    {msg.tableData.headers.map(h => (
                      <th key={h} className="px-4 py-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msg.tableData.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border/40 hover:bg-white/5 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3 text-foreground/90 font-medium">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          {msg.actions && (
            <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-border/40">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500">
                <ExternalLink size={13} /> Analizar en profundidad
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/80 border border-border/50 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500">
                <Download size={13} /> Exportar informe
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] uppercase font-medium text-muted-foreground px-1">{msg.time}</span>
      </div>

      {/* User avatar placeholder for symmetry */}
      {!isDemi && (
        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center shrink-0 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
          Tú
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DemiPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = usePersistedState('demi_page_input', '')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isEmpty = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = (text: string, typeHint?: string) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    const userMsg: Message = {
      id: Date.now(), from: 'user', type: 'text', text: trimmed, time: now(),
    }
    setMessages(m => [...m, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      setTyping(false)
      const id = Date.now() + 1

      if (typeHint === 'kpi') {
        setMessages(m => [...m, {
          id, from: 'demi', type: 'kpi',
          text: 'Aquí está el resumen de KPIs institucionales cruzados con el Período Académico actual.',
          kpiData: { title: 'Riesgo Global EWS', value: '14.2%', trend: '+2.1% vs mes anterior', positive: false },
          actions: true, time: now(),
        }])
      } else if (typeHint === 'table') {
        setMessages(m => [...m, {
          id, from: 'demi', type: 'table',
          text: 'He identificado los estudiantes con mayor riesgo de deserción este período.',
          tableData: {
            headers: ['Estudiante', 'Grado', 'Nivel de Riesgo', 'Ausencias'],
            rows: [
              ['Lucas M.', '4to Sec', 'Alto', '3'],
              ['Sofía R.', '2do Sec', 'Crítico', '5'],
              ['André P.', '1ro Sec', 'Medio', '2'],
            ]
          },
          actions: true, time: now(),
        }])
      } else {
        setMessages(m => [...m, {
          id, from: 'demi', type: 'text',
          text: 'Entendido. He analizado los datos disponibles de tu institución y puedo ayudarte con esa solicitud. ¿Deseas que profundice en algún aspecto en particular?',
          time: now(),
        }])
      }

      setTimeout(() => inputRef.current?.focus(), 60)
    }, 1800)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  // ─── Input Bar ────────────────────────────────────────────────────────────
  const InputBar = (
    <div className="w-full max-w-3xl mx-auto">
      <div className={cn(
        'flex items-end gap-3 w-full',
        'bg-card border border-border rounded-2xl p-3',
        'shadow-xl shadow-black/30',
        'focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_8px_32px_rgba(0,0,0,0.3)]',
        'transition-all duration-200',
      )}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Habla con DEMI..."
          className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed min-h-[24px] max-h-[120px] py-1 px-2"
          style={{ height: 'auto' }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = t.scrollHeight + 'px'
          }}
        />

        <AnimatePresence mode="popLayout">
          {input.trim() ? (
            <motion.button
              key="send"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => send(input)}
              disabled={typing}
              aria-label="Enviar mensaje"
              className={cn(
                'p-2.5 rounded-xl shrink-0',
                'bg-primary text-primary-foreground',
                'shadow-lg shadow-primary/30',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              )}
            >
              <Send size={18} />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              aria-label="Usar micrófono"
              className="p-2.5 rounded-xl shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Mic size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-2.5">
        DEMI puede cometer errores. Verifica información importante con las fuentes originales.
      </p>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-background overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-border bg-card/50 backdrop-blur-sm">

        {/* New Chat button */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setMessages([])}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'px-4 py-2.5 rounded-xl text-sm font-medium',
              'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20',
              'transition-colors focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <Plus size={16} />
            Nueva conversación
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 px-2">
            Conversaciones recientes
          </p>
          {HISTORY.map(h => (
            <button
              key={h.id}
              className="w-full flex flex-col items-start px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-sm text-foreground/80 group-hover:text-foreground line-clamp-1 transition-colors">
                {h.label}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock size={10} /> {h.time}
              </span>
            </button>
          ))}
        </div>

        {/* DEMI ID Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <DemiAvatar size="sm" />
            <div>
              <p className="text-sm font-semibold text-foreground">DEMI</p>
              <p className="text-[11px] text-muted-foreground">Inteligencia Operacional</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header (only when chatting) */}
        {!isEmpty && (
          <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <DemiAvatar />
              <div>
                <h1 className="text-sm font-bold text-foreground">DEMI</h1>
                <p className="text-xs text-muted-foreground">Asistente de Inteligencia Operacional</p>
              </div>
            </div>
            <button
              onClick={() => setMessages([])}
              aria-label="Reiniciar conversación"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw size={13} /> Reiniciar
            </button>
          </header>
        )}

        {/* ── Empty State ──────────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 pb-8">
            
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center text-center mb-12"
            >
              {/* Glow avatar */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-2xl scale-150" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-purple-900/60 border border-violet-500/30 flex items-center justify-center shadow-xl shadow-violet-500/20">
                  <Sparkles size={28} className="text-violet-300" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-3">
                ¿Por dónde empezamos?
              </h1>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Soy DEMI, tu asistente de inteligencia operacional. Puedo analizar datos de tu institución, generar reportes y anticipar riesgos académicos.
              </p>
            </motion.div>

            {/* Suggestion Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl mb-10"
            >
              {SUGGESTIONS.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => send(s.label, s.type)}
                    className={cn(
                      'group flex items-start gap-3 p-4 rounded-xl text-left',
                      'bg-card border border-border',
                      'hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5',
                      'transition-all duration-200 cursor-pointer',
                      'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                    )}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon size={15} className="text-primary" />
                    </div>
                    <p className="text-sm text-foreground/80 group-hover:text-foreground font-medium leading-snug transition-colors">
                      {s.label}
                    </p>
                  </motion.button>
                )
              })}
            </motion.div>

            {/* Input in empty state */}
            {InputBar}
          </div>

        ) : (

          /* ── Chat State ─────────────────────────────────────────────── */
          <div className="flex-1 flex flex-col min-h-0">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  {typing && <TypingBubble key="typing" />}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Floating Input */}
            <div className="shrink-0 px-4 sm:px-6 py-4 bg-gradient-to-t from-background via-background/95 to-transparent">
              {InputBar}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
