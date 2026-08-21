import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Download, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { perfilHijo, radarData, comunicaciones } from '../../lib/mock-data'

function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
      <div><h1 style={{ marginBottom:3 }}>{title}</h1>
        {sub && <p style={{ fontSize:13, color:'var(--tx-2)' }}>{sub}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:8 }}>{actions}</div>}
    </div>
  )
}

import { ParentLiveStream } from './ParentLiveStream'
import { PasarelaPagos } from './PasarelaPagos'
import { CentroAvisos } from '../shared/CentroAvisos'

export default function DashboardPadres({ view }: { view: string }) {
  if (view === 'desempeno')      return <Desempeno />
  if (view === 'live-stream')    return <ParentLiveStream />
  if (view === 'estado')         return <PasarelaPagos />
  if (view === 'comunicaciones') return <CentroAvisos />
  if (view === 'pagos')          return <Pagos />
  if (view === 'autorizaciones') return <Autorizaciones />
  if (view === 'livestream')     return <ParentLiveStream />

  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Mi hijo" sub={`${perfilHijo.nombre} · Grado ${perfilHijo.curso} · Semestre 2026-I`}
        actions={<button className="btn btn-ghost btn-sm"><Download size={13} /> Boletín</button>} />

      {/* Header summary */}
      <div className="card" style={{ padding:'16px 20px', marginBottom:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0 }}>
        {[
          { label:'Promedio general', value:`${perfilHijo.promedio}/10`, ok: true },
          { label:'Asistencia',       value:`${perfilHijo.asistencia}%`, ok: true },
          { label:'Estado de pago',   value:'Al día',                   ok: true },
        ].map((s,i) => (
          <div key={s.label} style={{ padding:'0 20px', borderLeft: i>0?'1px solid var(--border)':'none', textAlign: i===1?'center':'left' }}>
            <div style={{ fontSize:12, color:'var(--tx-3)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        {/* Materias */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Desempeño por materia</div>
          {perfilHijo.materias.map(m => (
            <div key={m.nombre} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontSize:13, color:'var(--tx-2)', width:90, flexShrink:0 }}>{m.nombre}</div>
              <div className="progress-track" style={{ flex:1 }}>
                <div className="progress-fill" style={{ width:`${(m.nota/10)*100}%`, background: m.nota>=9?'var(--green)':m.nota>=7.5?'var(--blue)':'var(--amber)' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, minWidth:48, justifyContent:'flex-end' }}>
                <strong style={{ fontSize:13 }}>{m.nota}</strong>
                {m.tendencia==='up' ? <TrendingUp size={11} style={{ color:'var(--green)' }} />
                  : m.tendencia==='down' ? <TrendingDown size={11} style={{ color:'var(--red)' }} />
                  : <Minus size={11} style={{ color:'var(--tx-3)' }} />}
              </div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Perfil de competencias</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--tx-3)', fontSize:10 }} />
              <Radar name="Competencia" dataKey="A" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.12} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Asistencia */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Asistencia este mes</div>
          {[
            { label:'Días asistidos',            value:`${perfilHijo.asistencia}%` },
            { label:'Ausencias injustificadas',  value:String(perfilHijo.ausenciasInjustificadas) },
            { label:'Retrasos',                  value:String(perfilHijo.retrasos) },
          ].map(i => (
            <div key={i.label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--tx-2)' }}>{i.label}</span>
              <strong>{i.value}</strong>
            </div>
          ))}
        </div>

        {/* Comunicaciones recientes */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--tx-2)' }}>Comunicaciones</span>
            <button className="btn btn-ghost btn-sm">Ver todas <ChevronRight size={12} /></button>
          </div>
          {comunicaciones.map(c => (
            <div key={c.id} style={{ padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontWeight:500, color:'var(--tx)' }}>{c.de}</span>
                {!c.leido && <span className="badge badge-blue" style={{ fontSize:10 }}>Nuevo</span>}
              </div>
              <div style={{ color:'var(--tx-3)', fontSize:12 }}>{c.preview.slice(0,50)}...</div>
              <div style={{ color:'var(--tx-3)', fontSize:11, marginTop:2 }}>{c.hora}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Desempeno() {
  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Desempeño académico" sub={`${perfilHijo.nombre} · ${perfilHijo.curso}`} />
      <div className="card" style={{ padding:16, marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Calificaciones por materia</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={perfilHijo.materias.map(m => ({ name:m.nombre, nota:m.nota }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:'#ffffff44' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0,10]} tick={{ fontSize:11, fill:'#ffffff44' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:'var(--s3)', border:'1px solid var(--border)', borderRadius:6, fontSize:12 }} />
            <Bar dataKey="nota" fill="var(--blue)" radius={[3,3,0,0]} name="Nota" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, color:'var(--green)', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Mejores cursos</div>
          {perfilHijo.materias.filter(m=>m.nota>=8.5).map(m => (
            <div key={m.nombre} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--tx-2)' }}>{m.nombre}</span>
              <strong style={{ color:'var(--green)' }}>{m.nota} <TrendingUp size={11} style={{ display:'inline' }} /></strong>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:12, color:'var(--amber)', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Áreas de mejora</div>
          {perfilHijo.materias.filter(m=>m.nota<8).map(m => (
            <div key={m.nombre} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--tx-2)' }}>{m.nombre}</span>
              <strong style={{ color:'var(--amber)' }}>{m.nota}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Comunicaciones() {
  const [sel, setSel] = useState<number|null>(null)
  const msg = comunicaciones.find(c=>c.id===sel)
  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Comunicaciones" actions={<button className="btn btn-primary btn-sm">Nuevo mensaje</button>} />
      <div style={{ display:'flex', gap:12 }}>
        <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
          {comunicaciones.map(c => (
            <div key={c.id} className="card" style={{ padding:'12px 14px', cursor:'pointer', borderColor: sel===c.id?'var(--blue)':'var(--border)', background: sel===c.id?'var(--blue-dim)':'var(--s2)', transition:'all var(--transition)' }} onClick={() => setSel(c.id)}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontWeight:500, fontSize:13 }}>{c.de}</span>
                {!c.leido && <span className="dot dot-blue" />}
              </div>
              <div style={{ fontSize:12, color:'var(--tx-2)', marginBottom:2 }}>{c.asunto}</div>
              <div style={{ fontSize:11, color:'var(--tx-3)' }}>{c.hora}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ flex:1, padding: msg ? 20 : 0, display:'flex', flexDirection:'column' }}>
          {msg ? (
            <>
              <div style={{ marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ marginBottom:4 }}>{msg.asunto}</h3>
                <div style={{ fontSize:12, color:'var(--tx-3)' }}>De: {msg.de} · {msg.hora}</div>
              </div>
              <p style={{ fontSize:13, color:'var(--tx-2)', flex:1, marginBottom:16 }}>{msg.preview}</p>
              <div>
                <textarea rows={3} placeholder="Escribir respuesta..." style={{ marginBottom:8 }} />
                <button className="btn btn-primary btn-sm">Enviar respuesta</button>
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tx-3)', fontSize:13 }}>
              Selecciona un mensaje para leerlo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Pagos() {
  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Historial de pagos" />
      <div className="card" style={{ padding:'14px 16px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', borderColor:'rgba(34,197,94,0.25)' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>Plan {perfilHijo.planPago} · ${perfilHijo.montoPago}/mes</div>
          <div style={{ fontSize:12, color:'var(--tx-3)' }}>Próximo pago: {perfilHijo.proximoPago}</div>
        </div>
        <span className="badge badge-green"><span className="dot dot-green" /> Al día</span>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Concepto</th><th>Fecha</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {[
              { concepto:'Cuota Mayo',                 fecha:'15 May 2026', monto:450 },
              { concepto:'Cuota Abril',                fecha:'15 Abr 2026', monto:450 },
              { concepto:'Cuota Marzo',                fecha:'15 Mar 2026', monto:450 },
              { concepto:'Cuota Febrero + Matrícula',  fecha:'15 Feb 2026', monto:750 },
            ].map((p,i) => (
              <tr key={i}>
                <td style={{ fontWeight:500, color:'var(--tx)' }}>{p.concepto}</td>
                <td style={{ fontSize:12 }}>{p.fecha}</td>
                <td style={{ fontWeight:600 }}>${p.monto}</td>
                <td><span className="badge badge-green"><span className="dot dot-green" /> Pagado</span></td>
                <td><button className="btn btn-ghost btn-sm"><Download size={11} /> PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Autorizaciones() {
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'>('pending')
  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Autorizaciones pendientes" />
      {status === 'pending' ? (
        <div className="card" style={{ padding:20, maxWidth:520, borderColor:'rgba(245,158,11,0.2)' }}>
          <div style={{ display:'flex', gap:4, marginBottom:4 }}>
            <span className="badge badge-amber">Pendiente desde 12 May</span>
          </div>
          <h3 style={{ marginBottom:4, marginTop:10 }}>Salida a Museo — 17 de Mayo 2026</h3>
          <p style={{ fontSize:13, color:'var(--tx-2)', marginBottom:16 }}>Visita al Museo Nacional de Arte · 08:00 – 14:00</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { label:'Ubicación',      value:'Museo Nacional' },
              { label:'Responsable',    value:'Prof. García' },
              { label:'Estudiantes',    value:'32 alumnos' },
              { label:'Costo',          value:'$25 (en mensualidad)' },
              { label:'Seguro',         value:'Incluido' },
            ].map(f => (
              <div key={f.label} className="card-inner" style={{ padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:'var(--tx-3)', marginBottom:2 }}>{f.label}</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'var(--tx-3)', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Autorizaciones requeridas</div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--green)', textTransform:'none', letterSpacing:'normal', fontWeight:400, marginBottom:6, cursor:'default' }}>
              <input type="checkbox" checked readOnly style={{ accentColor:'var(--blue)' }} />
              Uso de foto/video (ya autorizado)
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--tx-2)', textTransform:'none', letterSpacing:'normal', fontWeight:400, cursor:'pointer' }}>
              <input type="checkbox" style={{ accentColor:'var(--blue)' }} />
              Salida de la institución
            </label>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={() => setStatus('approved')} style={{ flex:1, justifyContent:'center' }}>
              <CheckCircle2 size={13} /> Autorizar
            </button>
            <button className="btn btn-danger" onClick={() => setStatus('rejected')} style={{ flex:1, justifyContent:'center' }}>
              <XCircle size={13} /> Rechazar
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding:40, textAlign:'center', maxWidth:400, borderColor: status==='approved'?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)' }}>
          {status==='approved' ? <CheckCircle2 size={32} style={{ color:'var(--green)', marginBottom:12 }} /> : <XCircle size={32} style={{ color:'var(--red)', marginBottom:12 }} />}
          <h3 style={{ marginBottom:8 }}>{status==='approved' ? 'Actividad autorizada' : 'Actividad rechazada'}</h3>
          <p style={{ fontSize:13, color:'var(--tx-2)' }}>Tu respuesta ha sido registrada y notificada a la institución.</p>
        </div>
      )}
    </div>
  )
}
