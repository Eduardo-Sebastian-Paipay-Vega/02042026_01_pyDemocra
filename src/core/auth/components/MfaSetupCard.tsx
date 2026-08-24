import { useState, useEffect } from 'react'
import { KeyRound } from 'lucide-react'
import { SupabaseClient } from '@supabase/supabase-js'

interface MfaSetupCardProps {
  supabase: SupabaseClient
}

export function MfaSetupCard({ supabase }: MfaSetupCardProps) {
  const [mfa, setMfa] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(true)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
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
  }, [supabase])

  const startMfaSetup = async () => {
    setMfaLoading(true)
    
    // Limpiar factores previos (ej. si se quedó a medias en un intento anterior)
    const { data: factors } = await supabase.auth.mfa.listFactors()
    if (factors && factors.totp && factors.totp.length > 0) {
      for (const factor of factors.totp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Autenticador' })
    if (error) {
       alert(error.message)
       setMfaLoading(false)
       return
    }
    setMfaFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setMfaSecret(data.totp.secret)
    setMfaSetupMode(true)
    setMfaLoading(false)
  }

  const completeMfaSetup = async () => {
    if (!mfaFactorId) return
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

  return (
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
            <div style={{ background: 'var(--blue-dim)', padding: '12px 14px', borderRadius: 8, marginBottom: 16, border: '1px solid var(--blue-transparent)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>¿Qué debo hacer?</div>
              <div style={{ fontSize: 12, color: 'var(--tx-2)', lineHeight: 1.5 }}>
                Descarga una app autenticadora en tu celular (como <b>Google Authenticator</b>, <b>Authy</b> o <b>Microsoft Authenticator</b>). Abre la app, selecciona "Agregar cuenta" o "Escanear código QR" y apunta con tu cámara al código de abajo.
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>1. Escanea el código QR con tu app de autenticación</div>
            <div 
              style={{ 
                background: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                display: 'inline-block',
                marginBottom: 16 
              }}
              dangerouslySetInnerHTML={{ __html: qrCode }} 
            />
            <div style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 16 }}>
              ¿No puedes escanear el código? Ingresa esta clave manualmente: <br/>
              <span style={{fontFamily: 'monospace', color: 'var(--tx)', userSelect: 'all', fontSize: 13}}>{mfaSecret}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>2. Ingresa el código de 6 dígitos generado</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="000000" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6} style={{ width: 100, textAlign: 'center' }} />
              <button className="btn btn-sm btn-primary" onClick={completeMfaSetup} disabled={mfaLoading}>Verificar y Activar</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setMfaSetupMode(false)}>Cancelar</button>
            </div>
        </div>
      )}
    </div>
  )
}
