import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Eye, EyeOff, Loader2, LogIn, Lock, Mail, Settings, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey, supabaseConfigured } from '../utils/supabase/info';
import ConnectionDiagnostics from './ConnectionDiagnostics';

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (!supabaseConfigured) {
      setConnectionStatus('disconnected');
      setError('Configuracion incompleta: define variables de Supabase en el frontend.');
      return;
    }

    setConnectionStatus('checking');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch {
      setConnectionStatus('disconnected');
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabaseConfigured) {
      setError('No se puede iniciar sesion: faltan variables de Supabase en el frontend.');
      setLoading(false);
      return;
    }

    try {
      await login(usuario.trim(), password);
    } catch (err: any) {
      const errorMessage = String(err?.message || 'Error desconocido al iniciar sesion');

      if (errorMessage.includes('Credenciales inválidas') || errorMessage.includes('Credenciales inv')) {
        setError('Usuario o contrasena incorrectos');
      } else if (errorMessage.includes('inactivo')) {
        setError('Tu usuario esta inactivo. Contacta al administrador');
      } else if (errorMessage.includes('Solo admin, principal y trabajador')) {
        setError('Acceso denegado: solo admin, principal y trabajador pueden ingresar.');
      } else if (errorMessage.includes('no está hasheada') || errorMessage.includes('no esta hasheada')) {
        setError('Error de configuracion. Contacta al administrador');
      } else if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('no respondio') ||
        errorMessage.includes('no respondió')
      ) {
        setError('No se pudo conectar al servidor. Verifica tu conexion');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showDiagnostics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => setShowDiagnostics(false)}
            className="mb-4 rounded-lg bg-white px-4 py-2 shadow transition-shadow hover:shadow-md"
          >
            Volver al login
          </button>
          <ConnectionDiagnostics />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-4 flex items-center justify-center gap-3 text-sm">
            {connectionStatus === 'checking' && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando conexion...</span>
              </div>
            )}

            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="font-medium">Conectado</span>
              </div>
            )}

            {connectionStatus === 'disconnected' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>Sin conexion al servidor</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestion</h1>
              <p className="mt-2 text-gray-600">Agenda y Voluntariado</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Usuario o Correo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="usuario o correo@ejemplo.com"
                    required
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Contrasena</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || connectionStatus === 'disconnected'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Iniciando sesion...</span>
                  </>
                ) : (
                  'Iniciar sesion'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={checkConnection}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                Reintentar conexion
              </button>
              <button
                type="button"
                onClick={() => setShowDiagnostics(true)}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Settings className="h-4 w-4" />
                Diagnostico
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
