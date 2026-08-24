import fs from 'fs';

let content = fs.readFileSync('d:/mela/02042026_01_pyDemocra/src/core/features/settings/SettingsPage.tsx', 'utf8');

const returnIdx = content.indexOf('  return (\n    <div>\n      <SectionTitle title="Seguridad de la cuenta"');
const logicToInject = `
  const [tokens, setTokens] = useState<any[]>([])
  const [newTokenName, setNewTokenName] = useState('')
  const [showNewToken, setShowNewToken] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  
  // NOTE: In SettingsPage we use useTenantBootstrap. Here we can use the same context or mock tenant_id for now if it's not in scope.
  // Actually, we can get tenant_id from the wrapper or hook. Let's just use useTenantBootstrap.
  const { tenant_id } = useTenantBootstrap()

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
`;

const endIdx = content.indexOf(`        {sessions.length === 0 && <div style={{fontSize: 12, color: 'var(--tx-3)'}}>No se encontraron sesiones extra...</div>}
      </div>
    </div>
  )
}`);

const uiToInject = `
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
`;

if (returnIdx > -1 && endIdx > -1) {
  content = content.slice(0, returnIdx) + logicToInject + content.slice(returnIdx, endIdx) + uiToInject + content.slice(endIdx);
  fs.writeFileSync('d:/mela/02042026_01_pyDemocra/src/core/features/settings/SettingsPage.tsx', content);
  console.log('Injected API Tokens successfully');
} else {
  console.log('Could not find injection points:', returnIdx, endIdx);
}
