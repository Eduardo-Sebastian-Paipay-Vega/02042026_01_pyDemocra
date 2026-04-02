import React, { useState, useEffect } from 'react';
import { X, Key, Activity, Database, Shield, AlertCircle, CheckCircle, Settings, Server, FileText, RefreshCw, Users, Calendar, Link } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import PasswordManager from './PasswordManager';
import SessionDiagnostics from './SessionDiagnostics';
import SetupGuide from './SetupGuide';
import ConnectionDiagnostics from './ConnectionDiagnostics';
import KoboIntegration from './KoboIntegration';
import SyncButton from './SyncButton';
import SyncStats from './SyncStats';
import VolunteersList from './VolunteersList';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import ActivityVolunteersView from './ActivityVolunteersView';
import { useAuth } from '../App';
import { getUserRoleLabel, getUserRoleName } from '../types/user';
import { Dialog, DialogContent } from './ui/dialog';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { accessToken, user } = useAuth();
  const currentRole = getUserRoleName(user);
  const [activeTab, setActiveTab] = useState<'passwords' | 'diagnostics' | 'setup' | 'debug' | 'connection' | 'kobo' | 'sync' | 'voluntarios' | 'actividades' | 'relaciones'>('voluntarios');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0);
  const [kvUsers, setKvUsers] = useState<any[]>([]);
  const [jwtTest, setJwtTest] = useState<any>(null);
  const [tokenVerification, setTokenVerification] = useState<any>(null);
  const [jwtConfig, setJwtConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [jwtTestResult, setJwtTestResult] = useState<any>(null);

  const getAdminHeaders = (withJson = false) => ({
    'Authorization': `Bearer ${publicAnonKey}`,
    'X-Access-Token': accessToken || '',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
  });

  const fetchKvUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/debug/kv-users`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      setKvUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching KV users:', err);
    } finally {
      setLoading(false);
    }
  };

  const testJWT = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/debug/test-jwt`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      setJwtTest(data);
    } catch (err) {
      console.error('Error testing JWT:', err);
    } finally {
      setLoading(false);
    }
  };

  const testJWTWithToken = async () => {
    setLoading(true);
    setJwtTestResult(null);
    try {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setJwtTestResult({ success: false, error: 'No hay token en localStorage' });
        return;
      }

      console.log('=== DEBUG TOKEN ===');
      console.log('Token desde localStorage (preview):', storedToken.substring(0, 50) + '...');
      console.log('Token length:', storedToken.length);
      console.log('Token type:', typeof storedToken);
      
      // Primero hacer debug de headers
      console.log('Paso 1: Verificando headers...');
      const debugRes = await fetch(`${API_BASE_URL}/auth/debug-headers`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
      
      const debugData = await debugRes.json();
      console.log('Debug headers resultado:', debugData);
      
      // Luego hacer el test de JWT
      console.log('Paso 2: Testeando JWT...');
      const res = await fetch(`${API_BASE_URL}/auth/test-jwt`, {
        method: 'POST',
        headers: getAdminHeaders()
      });

      const data = await res.json();
      
      // Combinar resultados
      setJwtTestResult({
        ...data,
        debug_headers: debugData
      });
      
      console.log('Resultado test JWT:', data);
    } catch (err: any) {
      console.error('Error testing JWT:', err);
      setJwtTestResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const verifyStoredToken = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setTokenVerification({ error: 'No hay token almacenado' });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/debug/verify-token`, {
        method: 'POST',
        headers: getAdminHeaders(true),
        body: JSON.stringify({ token: storedToken })
      });
      const data = await res.json();
      setTokenVerification(data);
    } catch (err) {
      console.error('Error verifying token:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkJWTConfig = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/debug/jwt-config`, {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      setJwtConfig(data);
    } catch (err) {
      console.error('Error checking JWT config:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Dialog
        open
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
      >
        <DialogContent
          showClose={false}
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 bg-white rounded-xl shadow-2xl"
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Panel de Administrador</h2>
                <p className="text-purple-100 text-sm">Herramientas avanzadas y configuraciÃ³n del sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('passwords')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'passwords'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Key className="w-4 h-4" />
              GestiÃ³n de ContraseÃ±as
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'diagnostics'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              DiagnÃ³sticos
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'setup'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Database className="w-4 h-4" />
              GuÃ­a de ConfiguraciÃ³n
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'debug'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Debug & Testing
            </button>
            <button
              onClick={() => setActiveTab('connection')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'connection'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Server className="w-4 h-4" />
              ConexiÃ³n
            </button>
            <button
              onClick={() => setActiveTab('kobo')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'kobo'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              KoboToolbox
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'sync'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              SincronizaciÃ³n
            </button>
            <button
              onClick={() => setActiveTab('voluntarios')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'voluntarios'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Voluntarios
            </button>
            <button
              onClick={() => setActiveTab('actividades')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'actividades'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Actividades
            </button>
            <button
              onClick={() => setActiveTab('relaciones')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'relaciones'
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Link className="w-4 h-4" />
              Relaciones
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'passwords' && (
            <div>
              <PasswordManager onClose={() => {}} embedded />
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div>
              <SessionDiagnostics embedded />
            </div>
          )}

          {activeTab === 'setup' && (
            <div>
              <SetupGuide onClose={() => {}} embedded />
            </div>
          )}

          {activeTab === 'kobo' && (
            <div>
              <KoboIntegration />
            </div>
          )}

          {activeTab === 'sync' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">SincronizaciÃ³n Kobo â†’ Supabase</h3>
                <p className="text-gray-600">
                  Procesa los datos de campo desde KoboToolbox y actualiza las tablas en Supabase.
                  Los datos duplicados se omiten automÃ¡ticamente usando el ID Ãºnico de cada submission.
                </p>
              </div>
              
              <SyncButton variant="full" accessToken={accessToken} />

              {/* EstadÃ­sticas de SincronizaciÃ³n */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">ðŸ“Š EstadÃ­sticas y Monitoreo</h4>
                <SyncStats accessToken={accessToken} />
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">ðŸ“‹ CÃ³mo funciona:</h4>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li><strong>Asistencia y Horas</strong>: Lee formularios de campo con DNI, cÃ³digo de actividad y horas trabajadas</li>
                  <li><strong>Voluntarios automÃ¡ticos ðŸ‘¤</strong>: Si un DNI no existe, crea el usuario automÃ¡ticamente con contraseÃ±a aleatoria (voluntarios NO entran al sistema)</li>
                  <li><strong>ValidaciÃ³n</strong>: Verifica que el voluntario (DNI) y la actividad (cÃ³digo) existan en Supabase</li>
                  <li><strong>ConsolidaciÃ³n</strong>: Suma las horas en la tabla <code className="bg-blue-100 px-1 rounded">actividad_voluntarios</code></li>
                  <li><strong>Evidencias</strong>: Actualiza el estado de la actividad con observaciones de campo</li>
                  <li><strong>Evitar duplicados</strong>: Usa el campo <code className="bg-blue-100 px-1 rounded">_uuid</code> de Kobo para no procesar dos veces</li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">âš ï¸ Importante:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Los voluntarios se crean automÃ¡ticamente si no existen (basado en DNI de Kobo)</li>
                  <li>Las contraseÃ±as generadas son aleatorias y seguras (voluntarios NO usan el sistema)</li>
                  <li>Las actividades deben tener un <code className="bg-yellow-100 px-1 rounded">codigo</code> vÃ¡lido</li>
                  <li>Los errores se registran en <code className="bg-yellow-100 px-1 rounded">kobo_sync_error</code> para revisiÃ³n</li>
                  <li>Esta operaciÃ³n NO modifica los datos en KoboToolbox, solo los lee</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'voluntarios' && (
            <div>
              <VolunteersList accessToken={accessToken} />
            </div>
          )}

          {activeTab === 'actividades' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Actividades</h3>
                  <p className="text-gray-600 mt-1">Crear y administrar actividades del sistema</p>
                </div>
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  + Crear actividad
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">ðŸ“‹ CÃ³mo funciona:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>El <strong>cÃ³digo de actividad</strong> se genera automÃ¡ticamente (formato: ACT-2026-XXX)</li>
                  <li>Selecciona el <strong>tipo de actividad</strong> y <strong>Ã¡rea</strong> desde los catÃ¡logos de Supabase</li>
                  <li>Asigna un <strong>responsable</strong> (usuarios con rol trabajador/principal)</li>
                  <li>Define las <strong>fechas y horas</strong> (el sistema calcula la duraciÃ³n automÃ¡ticamente)</li>
                  <li>Este cÃ³digo es lo que los trabajadores usarÃ¡n en <strong>KoboToolbox</strong> para registrar asistencia</li>
                  <li>La actividad se crea en estado <code className="bg-blue-100 px-1 rounded">planificada</code></li>
                </ul>
              </div>

              <ActivityList
                accessToken={accessToken || ''}
                refreshKey={activitiesRefreshKey}
                id_usuario={user?.id}
                rol={currentRole || undefined}
              />
            </div>
          )}

          {activeTab === 'relaciones' && (
            <div>
              <ActivityVolunteersView accessToken={accessToken} />
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="space-y-6">
              {/* KV Users */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Usuarios en KV Store
                  </h3>
                  <button
                    onClick={fetchKvUsers}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Cargando...' : 'Recargar'}
                  </button>
                </div>
                {kvUsers.length > 0 ? (
                  <div className="space-y-2">
                    {kvUsers.map((user, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border text-sm">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-gray-600">{user.email} - {getUserRoleLabel(user)}</div>
                        <div className="text-gray-500 text-xs">ID: {user.id}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    Haz clic en "Recargar" para ver usuarios
                  </div>
                )}
              </div>

              {/* JWT Test */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Test de JWT
                  </h3>
                  <button
                    onClick={testJWT}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Probando...' : 'Probar JWT'}
                  </button>
                </div>
                {jwtTest && (
                  <div className="space-y-3">
                    {jwtTest.success ? (
                      <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-green-900">âœ… JWT funciona correctamente</div>
                          <div className="text-green-700 mt-1">Token: {jwtTest.tokenPreview}</div>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(jwtTest.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-red-900">âŒ Error en JWT</div>
                          <div className="text-red-700">{jwtTest.message}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* JWT Test con Token Real */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    Test JWT con Token Actual
                  </h3>
                  <button
                    onClick={testJWTWithToken}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Probando...' : 'Probar Token Actual'}
                  </button>
                </div>
                {jwtTestResult && (
                  <div className="space-y-3">
                    {/* Debug de Headers */}
                    {jwtTestResult.debug_headers && (
                      <div className="bg-gray-50 border border-gray-300 rounded p-3">
                        <div className="font-medium text-gray-900 mb-2">ðŸ” AnÃ¡lisis de Headers y Token</div>
                        {jwtTestResult.debug_headers.token_analysis && (
                          <div className="text-xs space-y-1">
                            <div><strong>Longitud original:</strong> {jwtTestResult.debug_headers.token_analysis.original_length}</div>
                            <div><strong>Longitud limpia:</strong> {jwtTestResult.debug_headers.token_analysis.trimmed_length}</div>
                            <div><strong>Tiene espacios:</strong> {jwtTestResult.debug_headers.token_analysis.has_whitespace ? 'âš ï¸ SÃ' : 'âœ… NO'}</div>
                            <div><strong>Partes del JWT:</strong> {jwtTestResult.debug_headers.token_analysis.parts_count} {jwtTestResult.debug_headers.token_analysis.is_valid_jwt_format ? 'âœ…' : 'âŒ (debe ser 3)'}</div>
                            <div><strong>Contiene "Bearer":</strong> {jwtTestResult.debug_headers.token_analysis.contains_bearer ? 'âš ï¸ SÃ (problema)' : 'âœ… NO'}</div>
                            <div className="mt-2 bg-white p-2 rounded border">
                              <div><strong>Primeros 10 chars:</strong> <code>{jwtTestResult.debug_headers.token_analysis.first_10_chars}</code></div>
                              <div><strong>Ãšltimos 10 chars:</strong> <code>{jwtTestResult.debug_headers.token_analysis.last_10_chars}</code></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Resultado del Test */}
                    {jwtTestResult.success ? (
                      <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm w-full">
                          <div className="font-medium text-green-900">âœ… JWT vÃ¡lido y funcionando</div>
                          <div className="mt-2 space-y-1">
                            <div><strong>JWT vÃ¡lido:</strong> {jwtTestResult.jwt_valido ? 'âœ…' : 'âŒ'}</div>
                            <div><strong>Usuario en KV:</strong> {jwtTestResult.usuario_en_kv ? 'âœ…' : 'âŒ'}</div>
                            {jwtTestResult.usuario_data && (
                              <div className="mt-2 bg-white p-2 rounded border">
                                <div><strong>ID:</strong> {jwtTestResult.usuario_data.id}</div>
                                <div><strong>Email:</strong> {jwtTestResult.usuario_data.email}</div>
                                <div><strong>Nombre:</strong> {jwtTestResult.usuario_data.name}</div>
                                <div><strong>Rol:</strong> {jwtTestResult.usuario_data.role}</div>
                              </div>
                            )}
                          </div>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto max-h-48">
                            {JSON.stringify(jwtTestResult.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm w-full">
                          <div className="font-medium text-red-900">âŒ Error con el token</div>
                          <div className="text-red-700 mt-1">{jwtTestResult.error}</div>
                          {jwtTestResult.token_preview && (
                            <div className="mt-2 text-xs bg-white p-2 rounded border">
                              <strong>Token:</strong> {jwtTestResult.token_preview}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                  <strong>ðŸ’¡ QuÃ© hace este test:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Lee el token de localStorage</li>
                    <li>Lo envÃ­a al endpoint /auth/test-jwt con header X-Access-Token</li>
                    <li>Verifica si el JWT es vÃ¡lido</li>
                    <li>Verifica si el usuario existe en KV</li>
                    <li>Muestra el payload completo</li>
                  </ul>
                </div>
              </div>

              {/* JWT Config */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    ConfiguraciÃ³n JWT
                  </h3>
                  <button
                    onClick={checkJWTConfig}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Verificando...' : 'Verificar Config'}
                  </button>
                </div>
                {jwtConfig && (
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">JWT Secret Configurado:</div>
                      <div className={jwtConfig.jwtSecretConfigured ? 'text-green-600' : 'text-red-600'}>
                        {jwtConfig.jwtSecretConfigured ? 'âœ… SÃ­' : 'âŒ No'}
                      </div>
                    </div>
                    {jwtConfig.jwtSecretConfigured && (
                      <>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="font-medium">Longitud:</div>
                          <div className="text-gray-600">{jwtConfig.jwtSecretLength} caracteres</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="font-medium">Preview:</div>
                          <div className="text-gray-600 font-mono text-xs">{jwtConfig.jwtSecretPreview}</div>
                        </div>
                      </>
                    )}
                    {jwtConfig.warning && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-yellow-800">{jwtConfig.warning}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Token Verification */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    Verificar Token Almacenado
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={verifyStoredToken}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                    >
                      {loading ? 'Verificando...' : 'Verificar'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Â¿EstÃ¡s seguro de que quieres limpiar el token?')) {
                          localStorage.removeItem('access_token');
                          alert('Token eliminado. Recarga la pÃ¡gina.');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Limpiar Token
                    </button>
                  </div>
                </div>
                {tokenVerification && (
                  <div className="space-y-3">
                    {tokenVerification.success ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-green-900">âœ… Token vÃ¡lido</div>
                            {tokenVerification.userData && (
                              <div className="mt-2 space-y-1 text-green-700">
                                <div><strong>Usuario:</strong> {tokenVerification.userData.name}</div>
                                <div><strong>Email:</strong> {tokenVerification.userData.email}</div>
                                <div><strong>Rol:</strong> {tokenVerification.userData.role}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                          {JSON.stringify(tokenVerification.payload, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-red-900">âŒ Token invÃ¡lido</div>
                          <div className="text-red-700">{tokenVerification.error || tokenVerification.message}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'connection' && (
            <div>
              <ConnectionDiagnostics />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">âš ï¸ Privado:</span> Este panel solo es visible para administradores
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar Panel
            </button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Modal de formulario de actividad */}
      {showActivityForm && (
        <ActivityForm
          onClose={() => setShowActivityForm(false)}
          onSuccess={() => {
            setShowActivityForm(false);
            setActiveTab('actividades');
            setActivitiesRefreshKey((prev) => prev + 1);
          }}
          accessToken={accessToken || ''}
          id_usuario={user?.id}
          rol={currentRole || undefined}
        />
      )}
    </>
  );
}

