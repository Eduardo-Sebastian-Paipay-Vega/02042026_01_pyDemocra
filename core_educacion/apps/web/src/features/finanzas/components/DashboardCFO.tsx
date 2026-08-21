import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw, Bot, CheckCircle2, XCircle, Clock, ArrowUpRight, Download, Search, Filter } from 'lucide-react'
import { kpisCFO, canalesPago, flujoCaja, deudorScore, agentesIA, transacciones, deudores } from '@/lib/mock-data'

const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--s3)', border:'1px solid var(--border-md)', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      <div style={{ color:'var(--tx-2)', marginBottom:4 }}>{label}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color:p.color }}>{p.name}: ${(p.value/1000).toFixed(0)}K</div>)}
    </div>
  )
}

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

import { TokenEconomyDashboard } from './TokenEconomyDashboard'

export default function DashboardCFO({ view }: { view: string }) {
  if (view === 'agentes-ia')    return <AgentesIA />
  if (view === 'transacciones') return <Transacciones />
  if (view === 'deudores')      return <DeudoresCFO />
  if (view === 'tokenomics')    return <TokenEconomyDashboard />

  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Finanzas" sub="Tiempo real Â· CFO Dashboard"
        actions={<button className="btn btn-ghost btn-sm">Exportar</button>} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Ingresos hoy',    value:`$${(kpisCFO.ingresosHoy/1000).toFixed(1)}K`,  icon:DollarSign,    delta:'+18.3% vs ayer' },
          { label:'Flujo neto',      value:`+$${(kpisCFO.flujoNeto/1000).toFixed(1)}K`,   icon:TrendingUp,    delta:'Positivo' },
          { label:'Deuda total',     value:`$${(kpisCFO.deudaTotal/1000).toFixed(1)}K`,   icon:AlertTriangle, delta:'20 familias' },
          { label:'Transacciones',   value:String(kpisCFO.totalTransacciones),             icon:RefreshCw,     delta:'Hoy' },
        ].map(kpi => {
          const KpiIcon = kpi.icon
          return (
          <div key={kpi.label} className="card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:12, color:'var(--tx-2)', fontWeight:500 }}>{kpi.label}</span>
              <div style={{ width:28, height:28, background:'var(--s3)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <KpiIcon size={13} style={{ color:'var(--tx-2)' }} />
              </div>
            </div>
            <div style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>{kpi.value}</div>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--tx-3)' }}>
              <ArrowUpRight size={11} style={{ color:'var(--green)' }} />
              {kpi.delta}
            </div>
          </div>
        )})}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:12, marginBottom:12 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Flujo de caja 2026</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={flujoCaja} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize:11, fill:'#ffffff44' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#ffffff44' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CT />} />
              <Bar dataKey="ingresos" fill="var(--blue)" radius={[3,3,0,0]} name="Ingresos" />
              <Bar dataKey="egresos"  fill="var(--s4)"   radius={[3,3,0,0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Canales de pago</div>
          {canalesPago.map(c => {
            const total = canalesPago.reduce((s,x) => s+x.monto, 0)
            const pct = ((c.monto/total)*100).toFixed(0)
            return (
              <div key={c.canal} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:13 }}>
                  <span style={{ color:'var(--tx-2)' }}>{c.canal}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <span style={{ color:'var(--tx-3)', fontSize:12 }}>{c.comision}</span>
                    <strong>${(c.monto/1000).toFixed(0)}K</strong>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${pct}%`, background:c.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Deudores por riesgo</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={deudorScore} cx="50%" cy="50%" innerRadius={36} outerRadius={52} dataKey="deuda" strokeWidth={0}>
                {deudorScore.map(d => <Cell key={d.score} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {deudorScore.map(d => (
            <div key={d.score} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span className="dot" style={{ background:d.color }} />
                <span style={{ color:'var(--tx-2)' }}>{d.score} ({d.familias})</span>
              </div>
              <strong>${d.deuda.toLocaleString()}</strong>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:14, color:'var(--tx-2)' }}>Recomendaciones IA</div>
          {[
            { texto:'Ofrecer plan BNPL a Familia LÃ³pez (Score 65/100)', urgencia:'media' },
            { texto:'Ejecutar cobranza automÃ¡tica: Familia GarcÃ­a (90+ dÃ­as mora)', urgencia:'alta' },
            { texto:'Plan de pagos extendido: Familia MartÃ­nez', urgencia:'baja' },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <div style={{ width:3, height:32, borderRadius:2, background: r.urgencia==='alta'?'var(--red)':r.urgencia==='media'?'var(--amber)':'var(--blue)', flexShrink:0 }} />
              <span style={{ color:'var(--tx-2)', flex:1 }}>{r.texto}</span>
              <button className="btn btn-primary btn-sm">Ejecutar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Transacciones() {
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const filtradas = transacciones.filter(t => {
    const matchBuscar = t.familia.toLowerCase().includes(buscar.toLowerCase()) || t.concepto.toLowerCase().includes(buscar.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || t.estado === filtroEstado
    return matchBuscar && matchEstado
  })
  const totalHoy = transacciones.filter(t => t.estado === 'completado').reduce((s, t) => s + t.monto, 0)

  const estadoBadge = (e: string) =>
    e === 'completado' ? 'badge-green' : e === 'pendiente' ? 'badge-amber' : 'badge-red'
  const estadoLabel = (e: string) =>
    e === 'completado' ? 'Completado' : e === 'pendiente' ? 'Pendiente' : 'Fallido'

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Transacciones" sub="Historial de pagos recibidos Â· Mayo 2026"
        actions={<button className="btn btn-ghost btn-sm"><Download size={13} /> Exportar</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total recaudado',    value: `$${totalHoy.toLocaleString()}`, sub: `${transacciones.filter(t=>t.estado==='completado').length} transacciones` },
          { label: 'Pendientes',         value: `${transacciones.filter(t=>t.estado==='pendiente').length}`, sub: `$${transacciones.filter(t=>t.estado==='pendiente').reduce((s,t)=>s+t.monto,0)} en espera` },
          { label: 'Fallidas',           value: `${transacciones.filter(t=>t.estado==='fallido').length}`, sub: 'Requieren atenciÃ³n' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--tx-2)', marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 11px' }}>
            <Search size={12} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
            <input placeholder="Buscar familia o concepto..." value={buscar} onChange={e => setBuscar(e.target.value)}
              style={{ background: 'none', border: 'none', padding: 0, flex: 1, outline: 'none', fontSize: 13 }} />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ width: 'auto', padding: '6px 11px', fontSize: 12 }}>
            <option value="todos">Todos los estados</option>
            <option value="completado">Completado</option>
            <option value="pendiente">Pendiente</option>
            <option value="fallido">Fallido</option>
          </select>
        </div>
        <table className="table">
          <thead><tr><th>ID</th><th>Familia</th><th>Concepto</th><th>Fecha</th><th>MÃ©todo</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {filtradas.map(t => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--tx-3)' }}>{t.id}</td>
                <td style={{ fontWeight: 500, color: 'var(--tx)' }}>{t.familia}</td>
                <td style={{ color: 'var(--tx-2)' }}>{t.concepto}</td>
                <td style={{ fontSize: 12, color: 'var(--tx-3)' }}>{t.fecha}</td>
                <td><span className="badge badge-muted">{t.metodo}</span></td>
                <td style={{ fontWeight: 600 }}>${t.monto.toLocaleString()}</td>
                <td><span className={`badge ${estadoBadge(t.estado)}`}>{estadoLabel(t.estado)}</span></td>
                <td><button className="btn btn-ghost btn-sm"><Download size={11} /> PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DeudoresCFO() {
  const [accion, setAccion] = useState<Record<string, string>>({})

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Deudores" sub="GestiÃ³n de morosidad por scoring de riesgo Â· Mayo 2026"
        actions={
          <>
            <button className="btn btn-primary btn-sm">Cobranza masiva</button>
            <button className="btn btn-ghost btn-sm"><Download size={13} /> Exportar</button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Riesgo bajo',   n: deudorScore.find(d=>d.score==='Bajo')!,  badge: 'badge-green' },
          { label: 'Riesgo medio',  n: deudorScore.find(d=>d.score==='Medio')!, badge: 'badge-amber' },
          { label: 'Riesgo alto',   n: deudorScore.find(d=>d.score==='Alto')!,  badge: 'badge-red'   },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--tx-2)', fontWeight: 500 }}>{s.label}</span>
              <span className={`badge ${s.badge}`}>{s.n.familias} familias</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>${s.n.deuda.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {deudores.map(d => {
          const acc = accion[d.familia]
          return (
            <div key={d.familia} className="card" style={{ padding: 16, borderColor: d.score==='alto' ? 'rgba(239,68,68,0.2)' : d.score==='medio' ? 'rgba(245,158,11,0.2)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{d.familia}</span>
                    <span className={`badge badge-${d.score==='alto'?'red':d.score==='medio'?'amber':'green'}`}>
                      {d.score === 'alto' ? 'Riesgo alto' : d.score === 'medio' ? 'Riesgo medio' : 'Riesgo bajo'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tx-3)', display: 'flex', gap: 16 }}>
                    <span>Deuda: <strong style={{ color: 'var(--tx-2)' }}>${d.monto.toLocaleString()}</strong></span>
                    <span>Mora: <strong style={{ color: 'var(--tx-2)' }}>{d.dias} dÃ­as</strong></span>
                  </div>
                </div>
                {acc ? (
                  <span className="badge badge-green"><CheckCircle2 size={10} /> {acc}</span>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAccion(p=>({...p,[d.familia]:'Recordatorio enviado'}))}>
                      Recordatorio
                    </button>
                    {d.score !== 'bajo' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setAccion(p=>({...p,[d.familia]:'BNPL ofertado'}))}>
                        Ofrecer BNPL
                      </button>
                    )}
                    {d.score === 'alto' && (
                      <button className="btn btn-danger btn-sm" onClick={() => setAccion(p=>({...p,[d.familia]:'Cobranza iniciada'}))}>
                        Cobranza
                      </button>
                    )}
                  </div>
                )}
              </div>
              {d.score !== 'bajo' && !acc && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--s3)', fontSize: 12, color: 'var(--tx-3)', borderLeft: `3px solid ${d.score==='alto'?'var(--red)':'var(--amber)'}` }}>
                  <strong style={{ color: 'var(--tx-2)' }}>RecomendaciÃ³n IA:</strong>{' '}
                  {d.score === 'alto'
                    ? `Ejecutar cobranza automÃ¡tica + llamada de seguimiento. Ãšltima respuesta hace ${d.dias} dÃ­as.`
                    : `Ofrecer plan BNPL en 6 cuotas. Alta probabilidad de aceptaciÃ³n (score 65+).`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AgentesIA() {
  const [approved, setApproved] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])

  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Agentes IA" sub="SupervisiÃ³n de agentes autÃ³nomos en ejecuciÃ³n"
        actions={<button className="btn btn-ghost btn-sm">Configurar</button>} />

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {agentesIA.map(agent => (
          <div key={agent.id} className="card">
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:32, height:32, background:'var(--s3)', border:'1px solid var(--border)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bot size={14} style={{ color:'var(--blue)' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:13 }}>{agent.nombre}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span className="dot dot-green" />
                  <span style={{ fontSize:11, color:'var(--tx-3)' }}>Ejecutando</span>
                </div>
              </div>
              <span className="badge badge-muted">{agent.accionesHoy} acciones hoy</span>
            </div>
            <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              {agent.logs.map(log => {
                const key = `${agent.id}-${log.hora}`
                const isApproved = approved.includes(key)
                const isRejected = rejected.includes(key)
                return (
                  <div key={log.hora} style={{ padding:'10px 12px', borderRadius:'var(--radius)', background:'var(--s3)', border:'1px solid var(--border)', display:'flex', gap:10 }}>
                    <div style={{ flexShrink:0, marginTop:2 }}>
                      {(isApproved||log.estadoAccion==='aprobada'||log.estadoAccion==='ejecutada')
                        ? <CheckCircle2 size={13} style={{ color:'var(--green)' }} />
                        : isRejected ? <XCircle size={13} style={{ color:'var(--red)' }} />
                        : log.estadoAccion==='en_progreso' ? <RefreshCw size={13} style={{ color:'var(--blue)' }} />
                        : <Clock size={13} style={{ color:'var(--amber)' }} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:11, color:'var(--tx-3)', fontFamily:'monospace' }}>{log.hora}</span>
                        <span className={`badge badge-${isApproved||log.estadoAccion==='aprobada'||log.estadoAccion==='ejecutada'?'green':isRejected?'red':log.estadoAccion==='pendiente'?'amber':'blue'}`}>
                          {isApproved?'Aprobada':isRejected?'Rechazada':log.estadoAccion==='aprobada'?'Aprobada':log.estadoAccion==='ejecutada'?'Ejecutada':log.estadoAccion==='pendiente'?'Pendiente':log.estadoAccion==='enviada'?'Enviada':'En progreso'}
                        </span>
                      </div>
                      <div style={{ fontSize:13, color:'var(--tx-2)', marginBottom: log.propuesta?4:0 }}>{log.mensaje}</div>
                      {log.propuesta && <div style={{ fontSize:12, color:'var(--tx-3)' }}>Propuesta: {log.propuesta}</div>}
                      {log.estadoAccion==='pendiente' && !isApproved && !isRejected && (
                        <div style={{ display:'flex', gap:6, marginTop:8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setApproved(p=>[...p,key])}>Aprobar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejected(p=>[...p,key])}>Rechazar</button>
                          <button className="btn btn-ghost btn-sm">Ver detalle</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
