import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, CreditCard, AlertTriangle, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { fetchEducData, postEducData, forceDashboardRefetch } from '../../lib/api'

// Proxies for lazy async data
const kpisCFO = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.kpisCFO;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const evolucionMatricula = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.evolucionMatricula;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const secciones10 = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.secciones10;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const deudores = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.deudores;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
const inscripciones = new Proxy([] as any, {
  get: (target, prop) => {
    const realData = (window as any).__dashboardData?.inscripciones;
    if (!realData) return undefined;
    const value = realData[prop];
    return typeof value === 'function' ? value.bind(realData) : value;
  }
});
function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div><h1 style={{ marginBottom: 3 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}

const PLANES = [
  { id: 'anual',     label: 'Plan Anual',     precio: '$4,800 en una cuota', desc: 'Desc. 5%',         monto: 4800 },
  { id: 'semestral', label: 'Plan Semestral', precio: '$2,600 c/ semestre',  desc: 'Recomendado',      monto: 2600 },
  { id: 'mensual',   label: 'Plan Mensual',   precio: '$450/mes · 12 cuotas',desc: 'Int. mora 2%',     monto: 450  },
]

const BECAS = [
  { id: 'hermano',   label: 'Hermano inscrito',        pct: 15 },
  { id: 'academico', label: 'Rendimiento académico',   pct: 10 },
  { id: 'economico', label: 'Situación económica',     pct: 0, desc: 'Consultar' },
]

export default function DashboardCoordinador({ view }: { view: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetchEducData('analytics/coordinador').then(d => {
      (window as any).__dashboardData = d;
      setData(d);
    }).catch(console.error);

    const listener = (e: any) => setData(e.detail);
    window.addEventListener('dashboardRefetch', listener);
    return () => window.removeEventListener('dashboardRefetch', listener);
  }, []);

  if (!data) return <div style={{padding: 40, color: 'var(--tx-2)'}}>Cargando analíticas...</div>;

  if (view === 'inscripcion')     return <WizardInscripcion />
  if (view === 'conflictos')      return <GestorConflictos />
  if (view === 'reportes-deuda')  return <ReporteDeuda />

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <PageHeader title="Dashboard" sub="Matrícula · Semestre 2026-I"
        actions={<button className="btn btn-primary btn-sm">+ Nueva inscripción</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total inscritos',  value: 245, icon: Users,         badge: '+8.2%' },
          { label: 'Cupos libres',     value: 55,  icon: Users,         badge: '55/300' },
          { label: 'Deuda total ($)',  value: 42500, icon: CreditCard,  badge: '34 familias' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--tx-2)', marginBottom: 12, fontWeight: 500 }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
              {kpi.label.includes('$') ? `$${kpi.value.toLocaleString()}` : kpi.value}
            </div>
            <span className="badge badge-muted">{kpi.badge}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: 'var(--tx-2)' }}>Evolución de matrícula</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={evolucionMatricula}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#ffffff44' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
              <Line type="monotone" dataKey="inscritos" stroke="var(--blue)" strokeWidth={2} dot={{ fill: 'var(--blue)', r: 3 }} name="Inscritos" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Inscripciones recientes</span>
            <button className="btn btn-ghost btn-sm">Ver todas <ChevronRight size={12} /></button>
          </div>
          <table className="table">
            <thead><tr><th>Estudiante</th><th>Curso</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
      // @ts-ignore
      // @ts-ignore
              {inscripciones.slice(0,5).map(i => (
                <tr key={i.id}>
                  <td style={{ color: 'var(--tx)', fontWeight: 500 }}>{i.nombre}</td>
                  <td><span className="badge badge-muted">{i.curso}</span></td>
                  <td style={{ fontWeight: 500 }}>${i.monto.toLocaleString()}</td>
                  <td>
                    {i.estado === 'pagado'
                      ? <span className="badge badge-green"><span className="dot dot-green" /> Pagado</span>
                      : i.estado === 'pendiente'
                      ? <span className="badge badge-amber"><span className="dot dot-amber" /> Pendiente</span>
                      : <span className="badge badge-red"><span className="dot dot-red" /> Deuda</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function WizardInscripcion() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({ nombre:'', cedula:'', fechaNac:'', genero:'M', emailPadre:'', telefono:'', emergencia:'', grado:'', seccion:'', plan:'semestral', becas:[] as string[] })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }))
  const toggleBeca = (id: string) => setData(p => ({ ...p, becas: p.becas.includes(id) ? p.becas.filter(b => b !== id) : [...p.becas, id] }))
  const totalDesc = data.becas.reduce((a, b) => a + (BECAS.find(x => x.id === b)?.pct || 0), 0)
  const plan = PLANES.find(p => p.id === data.plan)
  const total = plan ? plan.monto * (1 - totalDesc / 100) : 0

  if (done) return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }} className="fade-up">
      <div className="card" style={{ padding: 40, maxWidth: 400, textAlign: 'center' }}>
        <CheckCircle2 size={36} style={{ color: 'var(--green)', marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>Inscripción completada</h2>
        <p style={{ fontSize: 13, color: 'var(--tx-2)', marginBottom: 24 }}>El estudiante ha sido inscrito exitosamente en el Semestre 2026-I.</p>
        <div className="card-inner" style={{ padding: '12px 16px', textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 2 }}>Estudiante</div>
          <div style={{ fontWeight: 500, marginBottom: 10 }}>{data.nombre || 'Sin nombre'}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 2 }}>Sección</div>
          <div style={{ fontWeight: 500, marginBottom: 10 }}>{data.seccion || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 2 }}>Total a pagar</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>${total.toLocaleString()}</div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setDone(false); setStep(1); }}>
          Nueva inscripción
        </button>
      </div>
    </div>
  )

  const steps = ['Datos del estudiante', 'Contacto del padre', 'Asignación de curso', 'Plan de pago']

  return (
    <div style={{ padding: 24 }} className="fade-up">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 3 }}>Nueva inscripción</h1>
        <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>Paso {step} de 4 — {steps[step-1]}</p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
        {[1,2,3,4].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0,
              background: s < step ? 'var(--blue)' : s === step ? 'var(--blue)' : 'var(--s4)',
              border: `1px solid ${s <= step ? 'var(--blue)' : 'var(--border)'}`,
              color: s <= step ? '#fff' : 'var(--tx-3)',
            }}>
              {s < step ? <CheckCircle2 size={12} /> : s}
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1, background: s < step ? 'var(--blue)' : 'var(--border)', margin: '0 4px' }} />}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, maxWidth: 520 }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label>Nombre completo</label><input placeholder="Ana María García López" value={data.nombre} onChange={e => set('nombre', e.target.value)} /></div>
            <div><label>Cédula / RUT</label><input placeholder="12345678-9" value={data.cedula} onChange={e => set('cedula', e.target.value)} /></div>
            <div><label>Fecha de nacimiento</label><input type="date" value={data.fechaNac} onChange={e => set('fechaNac', e.target.value)} /></div>
            <div>
              <label>Género</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                {[['M','Masculino'],['F','Femenino'],['O','Otro']].map(([v,l]) => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--tx-2)', textTransform:'none', letterSpacing:'normal', marginBottom:0, fontWeight:400, cursor:'pointer' }}>
                    <input type="radio" name="genero" value={v} checked={data.genero===v} onChange={() => set('genero',v)} style={{ accentColor:'var(--blue)' }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label>Email del padre / madre</label><input type="email" placeholder="padre@email.com" value={data.emailPadre} onChange={e => set('emailPadre', e.target.value)} /></div>
            <div><label>Teléfono principal</label><input placeholder="+51 999 888 777" value={data.telefono} onChange={e => set('telefono', e.target.value)} /></div>
            <div><label>Contacto de emergencia</label><input placeholder="+51 999 000 111" value={data.emergencia} onChange={e => set('emergencia', e.target.value)} /></div>
          </div>
        )}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label>Grado</label>
              <select value={data.grado} onChange={e => set('grado', e.target.value)}>
                <option value="">Seleccionar grado</option>
                {['7°','8°','9°','10°','11°','12°'].map(g => <option key={g} value={g}>{g} Grado</option>)}
              </select>
            </div>
            <div>
              <label>Sección disponible</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                {secciones10.map(sec => (
                  <label key={sec.id} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    borderRadius:'var(--radius)',
                    border:`1px solid ${data.seccion===sec.id ? 'var(--blue)' : sec.disponible ? 'var(--border)' : 'var(--red-dim)'}`,
                    background: data.seccion===sec.id ? 'var(--blue-dim)' : 'var(--s3)',
                    cursor: sec.disponible ? 'pointer' : 'not-allowed',
                    textTransform:'none', letterSpacing:'normal', fontWeight:400,
                  }}>
                    <input type="radio" name="seccion" value={sec.id} checked={data.seccion===sec.id} disabled={!sec.disponible} onChange={() => set('seccion',sec.id)} style={{ accentColor:'var(--blue)' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{sec.id}</div>
                      <div style={{ fontSize:11, color:'var(--tx-3)' }}>{sec.cupos}/{sec.max} cupos{sec.profesor ? ` · Prof. ${sec.profesor}` : ''}</div>
                    </div>
                    {sec.recomendado && <span className="badge badge-blue">recomendado</span>}
                    {!sec.disponible && sec.alerta && <span className="badge badge-red">{sec.alerta}</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label>Plan de pago</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                {PLANES.map(p => (
                  <label key={p.id} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    borderRadius:'var(--radius)',
                    border:`1px solid ${data.plan===p.id ? 'var(--blue)' : 'var(--border)'}`,
                    background: data.plan===p.id ? 'var(--blue-dim)' : 'var(--s3)',
                    cursor:'pointer', textTransform:'none', letterSpacing:'normal', fontWeight:400,
                  }}>
                    <input type="radio" name="plan" value={p.id} checked={data.plan===p.id} onChange={() => set('plan',p.id)} style={{ accentColor:'var(--blue)' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>{p.label}</div>
                      <div style={{ fontSize:11, color:'var(--tx-3)' }}>{p.precio}</div>
                    </div>
                    <span className="badge badge-muted">{p.desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label>Descuentos aplicables</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                {BECAS.map(b => (
                  <label key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--s3)', cursor:'pointer', textTransform:'none', letterSpacing:'normal', fontWeight:400 }}>
                    <input type="checkbox" checked={data.becas.includes(b.id)} onChange={() => toggleBeca(b.id)} style={{ accentColor:'var(--blue)' }} />
                    <span style={{ fontSize:13, color:'var(--tx-2)', flex:1 }}>{b.label}</span>
                    {b.pct>0 ? <span className="badge badge-green">−{b.pct}%</span> : b.desc && <span style={{ fontSize:11, color:'var(--tx-3)' }}>{b.desc}</span>}
                  </label>
                ))}
              </div>
            </div>
            <div className="card-inner" style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--tx-2)' }}>Total a pagar</span>
              <strong style={{ fontSize:18 }}>${total.toLocaleString()}</strong>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        {step>1 && <button className="btn btn-ghost" onClick={() => setStep(s=>s-1)} disabled={loading}>Atrás</button>}
        {step<4
          ? <button className="btn btn-primary" onClick={() => setStep(s=>s+1)}>Continuar</button>
          : <button className="btn btn-primary" disabled={loading} onClick={async () => {
              setLoading(true);
              try {
                // Hacemos el POST real al endpoint de estudiantes
                await postEducData('estudiantes', data);
                // Refrescamos el dashboard general
                forceDashboardRefetch('analytics/coordinador');
                setDone(true);
              } catch (e) {
                console.error(e);
                alert("Error al guardar: " + e.message);
              } finally {
                setLoading(false);
              }
            }}>
              {loading ? 'Guardando...' : 'Completar inscripción'}
            </button>}
      </div>
    </div>
  )
}

function GestorConflictos() {
  const [resolved, setResolved] = useState<number[]>([])
  const conflictos = [
    { id:1, titulo:'Conflicto de horario — Juan Pérez', desc:'Prof. García asignado simultáneamente en 10-A (Inglés, 08:00) y 10-B (Matemática, 08:00)', opciones:['Asignar a 10-C con Prof. Martínez','Cambiar horario de 10-B','Asignar otro profesor a 10-B','Marcar como excepción'], rec:0 },
    { id:2, titulo:'Cupos insuficientes — María García', desc:'Sección 10-A al límite (35/35 cupos). No se puede inscribir.', opciones:['Mover a 10-B (30/35 cupos)','Mover a 10-C (20/35 cupos)','Agregar cupo excepcional'], rec:1 },
  ]
  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Conflictos de horario" sub={`${conflictos.length - resolved.length} conflictos pendientes · Detección automática`} />
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {conflictos.map(c => (
          <div key={c.id} className="card" style={{ borderColor: resolved.includes(c.id) ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
              {resolved.includes(c.id) ? <CheckCircle2 size={16} style={{ color:'var(--green)' }} /> : <AlertTriangle size={16} style={{ color:'var(--amber)' }} />}
              <div>
                <div style={{ fontWeight:500, fontSize:13 }}>{c.titulo}</div>
                <div style={{ fontSize:12, color:'var(--tx-3)', marginTop:2 }}>{c.desc}</div>
              </div>
              {resolved.includes(c.id) && <span className="badge badge-green" style={{ marginLeft:'auto' }}>Resuelto</span>}
            </div>
            {!resolved.includes(c.id) && (
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
                {c.opciones.map((opt,i) => (
                  <button key={i} onClick={() => setResolved(p=>[...p,c.id])}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--radius)', border:`1px solid ${i===c.rec?'var(--blue)':'var(--border)'}`, background: i===c.rec?'var(--blue-dim)':'var(--s3)', cursor:'pointer', textAlign:'left', fontSize:13, color: i===c.rec?'var(--tx)':'var(--tx-2)', transition:'all var(--transition)' }}>
                    <span style={{ width:18, height:18, borderRadius:'50%', background: i===c.rec?'var(--blue)':'var(--s4)', color:'#fff', fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                    {opt}
                    {i===c.rec && <span className="badge badge-blue" style={{ marginLeft:'auto', fontSize:10 }}>IA recomienda</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReporteDeuda() {
  return (
    <div style={{ padding:24 }} className="fade-up">
      <PageHeader title="Reporte de deuda" sub="Mayo 2026 · Morosidad del período"
        actions={
          <>
            <button className="btn btn-primary btn-sm">Generar cobranza</button>
            <button className="btn btn-ghost btn-sm">Exportar PDF</button>
          </>
        }
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Estudiantes con deuda', value:'34', sub:'13.9% del total' },
          { label:'Deuda total acumulada', value:'$42,500', sub:'Morosidad: 8.4%' },
          { label:'Ingresos potenciales', value:'$312,400', sub:'Proyección 12 meses' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'16px 20px' }}>
            <div style={{ fontSize:12, color:'var(--tx-2)', marginBottom:10, fontWeight:500 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'var(--tx-3)' }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:500 }}>Top deudores</div>
        <table className="table">
          <thead><tr><th>#</th><th>Familia</th><th>Deuda</th><th>Días de mora</th><th>Riesgo</th><th>Acción</th></tr></thead>
          <tbody>
            {deudores.map((d,i) => (
              <tr key={d.familia}>
                <td style={{ color:'var(--tx-3)', fontSize:12 }}>{i+1}</td>
                <td style={{ fontWeight:500, color:'var(--tx)' }}>{d.familia}</td>
                <td style={{ fontWeight:600 }}>${d.monto.toLocaleString()}</td>
                <td style={{ color:'var(--tx-2)' }}>{d.dias} días</td>
                <td>
                  <span className={`badge badge-${d.score==='alto'?'red':d.score==='medio'?'amber':'green'}`}>
                    <span className={`dot dot-${d.score==='alto'?'red':d.score==='medio'?'amber':'green'}`} /> {d.score}
                  </span>
                </td>
                <td><button className="btn btn-ghost btn-sm">Contactar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
