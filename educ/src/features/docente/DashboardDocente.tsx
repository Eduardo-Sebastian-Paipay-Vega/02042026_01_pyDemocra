import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  BookOpen, ClipboardList, CheckSquare, AlertTriangle, ChevronRight, Download,
  Send, ChevronDown, Plus, FileText, Layers, List, Eye,
} from 'lucide-react'
const misClasesDocente: any[] = [];
const estudiantesRiesgo: any[] = [];
const calificaciones10A: any[] = [];
const asistencia10A: any[] = [];
const comunicaciones: any[] = [];
const cursosDocente: any[] = [];
import { CurriculumBuilder } from './CurriculumBuilder'
import { EWSDetailView } from '../ews/EWSDetailView'

const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--s3)', border: '1px solid var(--border-md)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--tx-2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

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

import { ResourceRepository } from './ResourceRepository';
import { AsistenciaQR } from './AsistenciaQR';
import { Lab3DWebGL } from '../estudiante/Lab3DWebGL';
import { SensorBullying } from './SensorBullying';
import { ProctoringIA } from './ProctoringIA';
import { CentroAvisos } from '../shared/CentroAvisos';
import { BancoItemesLLM } from './BancoItemesLLM';
import { RedSocialSegura } from '../shared/RedSocialSegura';
import { PlanInclusionPIE } from './PlanInclusionPIE';
import { PeerReviewCiego } from '../shared/PeerReviewCiego';
import { ChatAcademico } from './ChatAcademico';

export default function DashboardDocente({ view }: { view: string }) {
  if (view === 'calificaciones') return <Calificaciones />
  if (view === 'asistencia')     return <Asistencia />
  if (view === 'comunicaciones') return <ChatAcademico />
  if (view === 'cursos')         return <Cursos />
  if (view === 'actas')          return <Actas />
  if (view === 'creador')        return <CurriculumBuilder />
  if (view === 'ews')            return <EWSDetailView />
  if (view === 'repositorio')    return <ResourceRepository />
  if (view === 'asistencia-qr')  return <AsistenciaQR />
  if (view === 'laboratorio-3d') return <Lab3DWebGL />
  if (view === 'prevencion-bullying') return <SensorBullying />
  if (view === 'proctoring-ia') return <ProctoringIA />
  if (view === 'avisos') return <CentroAvisos />
  if (view === 'banco-itemes') return <BancoItemesLLM />
  if (view === 'comunidad') return <RedSocialSegura />
  if (view === 'pie') return <PlanInclusionPIE />
  if (view === 'peer-review') return <PeerReviewCiego />

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader
        title="Mis clases"
        sub="Prof. García · Semestre 2026-I"
        actions={<button className="btn btn-ghost btn-sm"><Download size={13} /> Reporte</button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {misClasesDocente.map(clase => (
          <div key={clase.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'background var(--transition)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--s3)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--s2)'}
          >
            <div style={{ width: 36, height: 36, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={15} style={{ color: 'var(--tx-2)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{clase.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{clase.horario} · {clase.salon} · {clase.estudiantes} estudiantes</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx-2)' }}>
              Promedio: <strong style={{ color: clase.promedio >= 7 ? 'var(--green)' : 'var(--red)' }}>{clase.promedio}</strong>
            </div>
            {clase.evalPendientes > 0 && (
              <span className="badge badge-amber">
                <ClipboardList size={10} /> {clase.evalPendientes} pendientes
              </span>
            )}
            <ChevronRight size={13} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 16, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Tareas pendientes hoy</div>
          {[
            { tarea: 'Calificar prueba 10-A (15 pendientes)', urgente: true },
            { tarea: 'Responder consulta de alumno',           urgente: false },
            { tarea: 'Subir material de clase (11-B)',         urgente: false },
          ].map((t, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13, minWidth: 0 }}>
              <input type="checkbox" style={{ accentColor: 'var(--blue)', flexShrink: 0 }} />
              <span style={{ color: 'var(--tx-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.tarea}</span>
              {t.urgente && <span className="badge badge-red" style={{ flexShrink: 0 }}>urgente</span>}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Estudiantes en riesgo</div>
          {estudiantesRiesgo.map(e => (
            <div key={e.nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--tx)' }}>{e.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{e.curso}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-red"><AlertTriangle size={10} /> {e.promedio}</span>
                <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>Asist. {e.asistencia}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Calificaciones() {
  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Calificaciones" sub="10-A Matemática · 1° Semestre 2026"
        actions={
          <>
            <button className="btn btn-primary btn-sm">+ Agregar calificación</button>
            <button className="btn btn-ghost btn-sm"><Download size={13} /> Exportar</button>
          </>
        }
      />
      <div className="card" style={{ marginBottom: 16 }}>
        <table className="table">
          <thead><tr><th>Estudiante</th><th>Quiz 1</th><th>Examen</th><th>Promedio</th><th>Estado</th></tr></thead>
          <tbody>
            {calificaciones10A.map(e => (
              <tr key={e.nombre}>
                <td style={{ color: 'var(--tx)', fontWeight: 500 }}>{e.nombre}</td>
                <td>{e.quiz1}</td>
                <td>{e.examen}</td>
                <td><strong style={{ color: e.promedio >= 7 ? 'var(--green)' : 'var(--red)' }}>{e.promedio}</strong></td>
                <td>
                  {e.estado === 'riesgo'
                    ? <span className="badge badge-red"><span className="dot dot-red" /> Riesgo</span>
                    : <span className="badge badge-green"><span className="dot dot-green" /> Regular</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Distribución de promedios</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={calificaciones10A}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CT />} />
            <Bar dataKey="promedio" fill="var(--blue)" radius={[3,3,0,0]} name="Promedio" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Asistencia() {
  const [state, setState] = useState(
    asistencia10A.reduce((acc, e) => ({ ...acc, [e.nombre]: e.estado }), {} as Record<string, string>)
  )
  const toggle = (n: string) => setState(p => ({
    ...p, [n]: p[n] === 'presente' ? 'ausente' : p[n] === 'ausente' ? 'tarde' : 'presente',
  }))
  const presentes = Object.values(state).filter(s => s === 'presente').length
  const pct = Math.round((presentes / asistencia10A.length) * 100)

  const cfg: Record<string, { label: string; badge: string }> = {
    presente: { label: 'Presente',  badge: 'badge-green' },
    ausente:  { label: 'Ausente',   badge: 'badge-red'   },
    tarde:    { label: 'Con retraso', badge: 'badge-amber' },
  }

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Asistencia" sub="10-A Matemática · 15 de Mayo 2026 · Clic para cambiar estado"
        actions={
          <>
            <button className="btn btn-primary btn-sm">Guardar</button>
            <button className="btn btn-ghost btn-sm">Justificar ausencia</button>
          </>
        }
      />

      <div className="card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 6 }}>Asistencia de hoy — {pct}%</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--green)' : 'var(--red)' }} /></div>
        </div>
        <span style={{ fontWeight: 700, fontSize: 20, color: pct >= 80 ? 'var(--green)' : 'var(--red)' }}>{pct}%</span>
      </div>

      <div className="card">
        {asistencia10A.map((e, i) => {
          const s = state[e.nombre]
          return (
            <div key={e.nombre} onClick={() => toggle(e.nombre)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < asistencia10A.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background var(--transition)' }}
              onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = 'var(--s3)'}
              onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{ fontWeight: 500, fontSize: 13 }}>{e.nombre}</span>
              <span className={`badge ${cfg[s].badge}`}>{cfg[s].label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Comunicaciones() {
  const [sel, setSel] = useState<number | null>(1)
  const [respuesta, setRespuesta] = useState('')
  const [enviados, setEnviados] = useState<number[]>([])
  const msg = comunicaciones.find(c => c.id === sel)

  const enviar = () => {
    if (!respuesta.trim() || !sel) return
    setEnviados(p => [...p, sel])
    setRespuesta('')
  }

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Comunicaciones" sub="Chat académico supervisado · Prof. García"
        actions={<button className="btn btn-primary btn-sm"><Send size={12} /> Nuevo mensaje</button>} />
      <div style={{ display: 'flex', gap: 12, height: 500 }}>
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--tx-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px', marginBottom: 4 }}>Conversaciones</div>
          {comunicaciones.map(c => (
            <div key={c.id} className="card" style={{ padding: '12px 14px', cursor: 'pointer', borderColor: sel === c.id ? 'var(--blue)' : 'var(--border)', background: sel === c.id ? 'var(--blue-dim)' : 'var(--s2)', transition: 'all var(--transition)' }} onClick={() => setSel(c.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{c.de}</span>
                {!c.leido && !enviados.includes(c.id) && <span className="dot dot-blue" />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx-2)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.asunto}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>{c.hora}</span>
                <span className="badge badge-muted" style={{ fontSize: 10 }}>{c.tipo}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {msg ? (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <h3 style={{ marginBottom: 3 }}>{msg.asunto}</h3>
                <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>De: {msg.de} · {msg.hora} · <span className="badge badge-muted" style={{ fontSize: 10 }}>supervisado</span></div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--s4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {msg.de.charAt(0)}
                  </div>
                  <div className="card-inner" style={{ padding: '10px 14px', maxWidth: '80%' }}>
                    <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 6 }}>{msg.de} · {msg.hora}</div>
                    <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>{msg.preview}</p>
                  </div>
                </div>

                {enviados.includes(msg.id) && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 16 }}>
                    <div className="card-inner" style={{ padding: '10px 14px', maxWidth: '80%', background: 'var(--blue-dim)', borderColor: 'rgba(59,130,246,0.2)' }}>
                      <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 6 }}>Prof. García · Ahora</div>
                      <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>Gracias por su mensaje. Me pondré en contacto a la brevedad.</p>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>G</div>
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 8 }}>
                <textarea rows={2} placeholder="Escribir respuesta..." value={respuesta} onChange={e => setRespuesta(e.target.value)}
                  style={{ flex: 1, resize: 'none', marginBottom: 0 }} />
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', height: 36 }} onClick={enviar}>
                  <Send size={12} /> Enviar
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
              Selecciona una conversación
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { fetchEducData } from '../../lib/api'

function Cursos() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true })
  const [expandedTema, setExpandedTema] = useState<Record<number, boolean>>({})
  const [cursosApi, setCursosApi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const toggle = (id: number) => setExpanded(p => ({ ...p, [id]: !p[id] }))
  const toggleTema = (id: number) => setExpandedTema(p => ({ ...p, [id]: !p[id] }))

  useEffect(() => {
    fetchEducData('cursos')
      .then(data => {
        setCursosApi(data.length ? data : cursosDocente)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setCursosApi(cursosDocente)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Mis Cursos" sub="Diseño curricular modular · Prof. García"
        actions={<button className="btn btn-primary btn-sm"><Plus size={13} /> Nuevo curso</button>} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? <div>Cargando cursos desde BD...</div> : cursosApi.map(curso => (
          <div key={curso.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: expanded[curso.id] ? '1px solid var(--border)' : 'none' }}
              onClick={() => toggle(curso.id)}>
              <div style={{ width: 34, height: 34, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Layers size={14} style={{ color: 'var(--blue)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{curso.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{curso.codigo} · Grado {curso.grado} · {curso.modulos.length} módulos</div>
              </div>
              <span className={`badge ${curso.estado === 'publicado' ? 'badge-green' : 'badge-amber'}`}>{curso.estado}</span>
              <ChevronDown size={13} style={{ color: 'var(--tx-3)', transform: expanded[curso.id] ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition)', flexShrink: 0 }} />
            </div>

            {expanded[curso.id] && (
              <div style={{ padding: '12px 16px' }}>
                {curso.modulos.map((mod, mi) => (
                  <div key={mod.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius)', background: 'var(--s3)', cursor: 'pointer', marginBottom: 4 }}
                      onClick={() => toggleTema(mod.id)}>
                      <span style={{ fontSize: 11, color: 'var(--tx-3)', fontWeight: 600, width: 20 }}>M{mi + 1}</span>
                      <span style={{ fontSize: 13, color: 'var(--tx-2)', flex: 1, fontWeight: 500 }}>{mod.titulo}</span>
                      <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>{mod.temas.length} temas</span>
                      <ChevronDown size={12} style={{ color: 'var(--tx-3)', transform: expandedTema[mod.id] ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition)' }} />
                    </div>
                    {expandedTema[mod.id] && (
                      <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {mod.temas.map((tema, ti) => (
                          <div key={tema.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius)', background: 'var(--s4)', marginBottom: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--tx-3)', width: 24 }}>T{ti + 1}</span>
                              <List size={11} style={{ color: 'var(--tx-3)' }} />
                              <span style={{ fontSize: 12, color: 'var(--tx-2)', flex: 1 }}>{tema.titulo}</span>
                              <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>{tema.lecciones.length} lecciones</span>
                            </div>
                            {tema.lecciones.map((lec, li) => (
                              <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 34px', fontSize: 12, color: 'var(--tx-3)' }}>
                                <span style={{ width: 16, textAlign: 'center', fontSize: 10 }}>L{li + 1}</span>
                                <span style={{ flex: 1 }}>{lec}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', fontSize: 11, height: 26 }}>
                          <Plus size={10} /> Agregar tema
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn btn-ghost btn-sm"><Plus size={12} /> Módulo</button>
                  <button className="btn btn-ghost btn-sm"><Eye size={12} /> Vista previa</button>
                  <button className={`btn btn-sm ${curso.estado === 'publicado' ? 'btn-secondary' : 'btn-primary'}`} style={{ marginLeft: 'auto' }}>
                    {curso.estado === 'publicado' ? 'Editar' : 'Publicar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button className="btn btn-ghost" style={{ alignSelf: 'flex-start', border: '1px dashed var(--border)' }}>
          <Plus size={13} /> Nuevo curso
        </button>
      </div>
    </div>
  )
}

function Actas() {
  const [clase, setClase] = useState('10-A Matemática')
  const [periodo, setPeriodo] = useState('1° Semestre 2026')
  const [generado, setGenerado] = useState(false)

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Actas y Reportes" sub="Generación 1-clic de libretas de notas y actas oficiales" />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 16, height: 'fit-content' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Configurar reporte</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label>Clase</label>
              <select value={clase} onChange={e => { setClase(e.target.value); setGenerado(false) }}>
                {['10-A Matemática', '11-B Cálculo', '10-B Matemática'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Período</label>
              <select value={periodo} onChange={e => { setPeriodo(e.target.value); setGenerado(false) }}>
                {['1° Semestre 2026', '2° Semestre 2025', '1° Semestre 2025'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ marginBottom: 0 }}>Incluir en el acta</label>
              {[['Calificaciones por evaluación', true], ['Promedio final', true], ['Estado de asistencia', true], ['Observaciones del docente', false]].map(([l, def]) => (
                <label key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, color: 'var(--tx-2)', marginBottom: 0, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={Boolean(def)} style={{ accentColor: 'var(--blue)' }} />
                  {String(l)}
                </label>
              ))}
            </div>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setGenerado(true)}>
              <FileText size={13} /> Generar acta
            </button>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {generado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>Acta generada — {clase}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{periodo} · {new Date().toLocaleDateString('es-PE')}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary btn-sm"><Download size={12} /> PDF</button>
                  <button className="btn btn-ghost btn-sm"><Download size={12} /> Excel</button>
                </div>
              </div>
              <table className="table">
                <thead><tr><th>#</th><th>Estudiante</th><th>Quiz 1</th><th>Examen</th><th>Promedio</th><th>Asistencia</th><th>Estado</th></tr></thead>
                <tbody>
                  {calificaciones10A.map((e, i) => (
                    <tr key={e.nombre}>
                      <td style={{ color: 'var(--tx-3)', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 500, color: 'var(--tx)' }}>{e.nombre}</td>
                      <td>{e.quiz1}</td>
                      <td>{e.examen}</td>
                      <td><strong style={{ color: e.promedio >= 7 ? 'var(--green)' : 'var(--red)' }}>{e.promedio}</strong></td>
                      <td style={{ color: 'var(--tx-2)' }}>96%</td>
                      <td>
                        <span className={`badge ${e.promedio >= 7 ? 'badge-green' : 'badge-red'}`}>
                          {e.promedio >= 7 ? 'Aprobado' : 'En riesgo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--tx-3)', display: 'flex', gap: 20 }}>
                <span>Promedio grupo: <strong style={{ color: 'var(--tx-2)' }}>7.9</strong></span>
                <span>Aprobados: <strong style={{ color: 'var(--green)' }}>5/6 (83.3%)</strong></span>
                <span>En riesgo: <strong style={{ color: 'var(--red)' }}>1/6</strong></span>
              </div>
            </>
          ) : (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--tx-3)', fontSize: 13 }}>
              <FileText size={28} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div>Configura los parámetros y haz clic en "Generar acta"</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
