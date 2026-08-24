import fs from 'fs';

let content = fs.readFileSync('d:/mela/02042026_01_pyDemocra/src/core/features/settings/SettingsPage.tsx', 'utf8');

const idx = content.indexOf('export default function SettingsPage()');

const securityTabStr = `
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

  const [mfa, setMfa] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(true)
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [qrCode, setQrCode] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [mfaSetupMode, setMfaSetupMode] = useState(false)
  
  useEffect(() => {
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      setMfaLoading(false)
      if (data && (data.currentLevel === 'aal2' || data.nextLevel === 'aal2')) {
        setMfa(true)
      } else {
        setMfa(false)
      }
    })
  }, [])

  const startMfaSetup = async () => {
    setMfaLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) {
       alert(error.message)
       setMfaLoading(false)
       return
    }
    setMfaFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setMfaSetupMode(true)
    setMfaLoading(false)
  }

  const completeMfaSetup = async () => {
    setMfaLoading(true)
    const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (challenge.error) {
      alert(challenge.error.message)
      setMfaLoading(false)
      return
    }
    const verify = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.data.id,
      code: verifyCode
    })
    if (verify.error) {
      alert(verify.error.message)
    } else {
      setMfa(true)
      setMfaSetupMode(false)
    }
    setMfaLoading(false)
  }

  const unenrollMfa = async () => {
    if (!confirm('¿Estás seguro de desactivar 2FA?')) return;
    setMfaLoading(true)
    const { data } = await supabase.auth.mfa.listFactors()
    if (data && data.totp.length > 0) {
      await supabase.auth.mfa.unenroll({ factorId: data.totp[0].id })
      setMfa(false)
    }
    setMfaLoading(false)
  }

  const [sessions, setSessions] = useState([])
  
  const loadSessions = async () => {
    const { data, error } = await supabase.rpc('get_my_sessions')
    if (data) setSessions(data)
  }
  
  useEffect(() => {
    loadSessions()
  }, [])

  const revokeSession = async (id) => {
    await supabase.rpc('delete_my_session', { p_session_id: id })
    loadSessions()
  }

  return (
    <div>
      <SectionTitle title="Seguridad de la cuenta" sub="Autenticación, contraseña y sesiones activas" />
      
      <div className="card-inner" style={{ padding: '16px 18px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <KeyRound size={14} style={{ color: mfa ? 'var(--green)' : 'var(--tx-3)' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Autenticación de dos factores (2FA)</span>
              {mfaLoading ? <span className="badge" style={{fontSize: 10}}>Cargando...</span> :
                (mfa 
                  ? <span className="badge badge-green" style={{ fontSize: 10 }}>Activo</span>
                  : <span className="badge badge-amber" style={{ fontSize: 10 }}>Inactivo</span>
                )
              }
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', paddingLeft: 22 }}>
              {mfa ? 'Tu cuenta está protegida con app autenticadora (TOTP).' : 'Activa 2FA para mayor seguridad al iniciar sesión.'}
            </div>
          </div>
          {!mfaLoading && (
            mfa ? (
              <button className="btn btn-sm btn-ghost" onClick={unenrollMfa}>Desactivar</button>
            ) : (
              <button className="btn btn-sm btn-primary" onClick={startMfaSetup} disabled={mfaSetupMode}>Configurar 2FA</button>
            )
          )}
        </div>
        
        {mfaSetupMode && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
             <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>1. Escanea el código QR con tu app de autenticación</div>
             <div dangerouslySetInnerHTML={{ __html: qrCode }} style={{ maxWidth: 200, marginBottom: 16 }} />
             <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>2. Ingresa el código de 6 dígitos</div>
             <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="000000" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6} style={{ width: 100, textAlign: 'center' }} />
                <button className="btn btn-sm btn-primary" onClick={completeMfaSetup} disabled={mfaLoading}>Verificar y Activar</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setMfaSetupMode(false)}>Cancelar</button>
             </div>
          </div>
        )}
      </div>

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
        {sessions.length === 0 && <div style={{fontSize: 12, color: 'var(--tx-3)'}}>No se encontraron sesiones extra...</div>}
      </div>
    </div>
  )
}
`;

const finalContent = content.slice(0, idx) + securityTabStr + content.slice(idx);
fs.writeFileSync('d:/mela/02042026_01_pyDemocra/src/core/features/settings/SettingsPage.tsx', finalContent);
console.log('Injected SecurityTab');
