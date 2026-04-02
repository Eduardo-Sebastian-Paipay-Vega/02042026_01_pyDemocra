import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, Server, Database, Key, FileText } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { projectId, publicAnonKey, supabaseConfigured } from '../utils/supabase/info';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'checking';
  message: string;
  details?: any;
}

export default function ConnectionDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const diagnostics: DiagnosticResult[] = [];
    const storedToken = localStorage.getItem('access_token');

    // 1. Verificar configuración básica
    diagnostics.push({
      name: 'Configuración',
      status: 'checking',
      message: 'Verificando configuración básica...'
    });
    setResults([...diagnostics]);

    if (!supabaseConfigured) {
      diagnostics[0] = {
        name: 'Configuración',
        status: 'error',
        message: 'Supabase no está configurado en el frontend',
        details: {
          requiredEnv: [
            'VITE_SUPABASE_PROJECT_ID (o VITE_SUPABASE_URL)',
            'VITE_SUPABASE_ANON_KEY',
          ],
          current: {
            projectId: projectId || '(vacío)',
            anonKeyLength: publicAnonKey?.length || 0,
          },
        },
      };
      setResults([...diagnostics]);
      setIsRunning(false);
      return;
    }

    diagnostics[0] = {
      name: 'Configuración',
      status: 'success',
      message: `ProjectId: ${projectId}`,
      details: { projectId, anonKeyLength: publicAnonKey.length }
    };
    setResults([...diagnostics]);

    // 2. Verificar conectividad básica
    diagnostics.push({
      name: 'Conectividad',
      status: 'checking',
      message: 'Verificando conectividad a Supabase...'
    });
    setResults([...diagnostics]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        headers: {
          'apikey': publicAnonKey
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      diagnostics[1] = {
        name: 'Conectividad',
        status: 'success',
        message: 'Conectividad a Supabase OK',
        details: { status: response.status }
      };
    } catch (error: any) {
      diagnostics[1] = {
        name: 'Conectividad',
        status: 'error',
        message: `Error de conectividad: ${error.message}`
      };
    }
    setResults([...diagnostics]);

    // 3. Verificar Edge Function Health
    diagnostics.push({
      name: 'Edge Function Health',
      status: 'checking',
      message: 'Verificando estado del Edge Function...'
    });
    setResults([...diagnostics]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        diagnostics[2] = {
          name: 'Edge Function Health',
          status: 'success',
          message: 'Edge Function está funcionando',
          details: data
        };
      } else {
        const errorText = await response.text();
        diagnostics[2] = {
          name: 'Edge Function Health',
          status: 'error',
          message: `Error ${response.status}: ${errorText}`
        };
      }
    } catch (error: any) {
      diagnostics[2] = {
        name: 'Edge Function Health',
        status: 'error',
        message: error.name === 'AbortError' 
          ? 'Timeout: El servidor no respondió en 10 segundos'
          : `Error: ${error.message}`,
        details: { 
          errorType: error.name,
          suggestion: error.name === 'AbortError' 
            ? 'El Edge Function podría no estar desplegado o está caído'
            : 'Verifica que el Edge Function esté desplegado en Supabase'
        }
      };
    }
    setResults([...diagnostics]);

    // 4. Verificar acceso a tabla usuarios
    diagnostics.push({
      name: 'Tabla Usuarios',
      status: 'checking',
      message: 'Verificando acceso a tabla usuarios...'
    });
    setResults([...diagnostics]);

    try {
      if (!storedToken) {
        diagnostics[3] = {
          name: 'Tabla Usuarios',
          status: 'warning',
          message: 'Requiere sesion de admin para ejecutar esta prueba'
        };
        setResults([...diagnostics]);
      } else {
        const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/test-usuarios`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': storedToken,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        diagnostics[3] = {
          name: 'Tabla Usuarios',
          status: 'success',
          message: `Acceso OK - ${data.count || 0} usuarios encontrados`,
          details: data
        };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        diagnostics[3] = {
          name: 'Tabla Usuarios',
          status: 'error',
          message: `Error: ${errorData.error || 'Desconocido'}`,
          details: errorData
        };
      }
      }
    } catch (error: any) {
      diagnostics[3] = {
        name: 'Tabla Usuarios',
        status: 'error',
        message: `Error: ${error.message}`
      };
    }
    setResults([...diagnostics]);

    // 5. Verificar configuración JWT
    diagnostics.push({
      name: 'JWT Config',
      status: 'checking',
      message: 'Verificando configuración de JWT...'
    });
    setResults([...diagnostics]);

    try {
      if (!storedToken) {
        diagnostics[4] = {
          name: 'JWT Config',
          status: 'warning',
          message: 'Requiere sesion de admin para ejecutar esta prueba'
        };
        setResults([...diagnostics]);
      } else {
        const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/debug/jwt-config`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': storedToken,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        diagnostics[4] = {
          name: 'JWT Config',
          status: data.jwtSecretConfigured ? 'success' : 'warning',
          message: data.jwtSecretConfigured 
            ? 'JWT_SECRET configurado correctamente'
            : 'JWT_SECRET no configurado',
          details: data
        };
      } else {
        diagnostics[4] = {
          name: 'JWT Config',
          status: 'error',
          message: 'Error al verificar JWT config'
        };
      }
      }
    } catch (error: any) {
      diagnostics[4] = {
        name: 'JWT Config',
        status: 'error',
        message: `Error: ${error.message}`
      };
    }
    setResults([...diagnostics]);

    // 6. Verificar conexión con KoboToolbox
    diagnostics.push({
      name: 'KoboToolbox API',
      status: 'checking',
      message: 'Verificando conexión con KoboToolbox...'
    });
    setResults([...diagnostics]);

    try {
      if (!storedToken) {
        diagnostics[5] = {
          name: 'KoboToolbox API',
          status: 'warning',
          message: 'Requiere sesion activa para ejecutar esta prueba'
        };
        setResults([...diagnostics]);
      } else {
        const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos para API externa
      
      const response = await fetch(`${API_BASE_URL}/kobo/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': storedToken,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        const koboInfo = data.kobo;
        const warnings = data.warnings || [];
        
        diagnostics[5] = {
          name: 'KoboToolbox API',
          status: warnings.length > 0 ? 'warning' : 'success',
          message: warnings.length > 0 
            ? `Conectado con advertencias: ${warnings[0]}`
            : `Conectado - ${koboInfo.totalForms} formularios disponibles`,
          details: {
            ...data,
            asistenciaForm: koboInfo.forms.asistenciaHoras,
            ejecucionForm: koboInfo.forms.ejecucionEvidencias,
            totalSubmissions: (koboInfo.forms.asistenciaHoras.submissionCount || 0) + 
                             (koboInfo.forms.ejecucionEvidencias.submissionCount || 0)
          }
        };
      } else {
        diagnostics[5] = {
          name: 'KoboToolbox API',
          status: 'error',
          message: data.message || 'Error al conectar con KoboToolbox',
          details: {
            ...data,
            recommendations: data.recommendations
          }
        };
      }
      }
    } catch (error: any) {
      diagnostics[5] = {
        name: 'KoboToolbox API',
        status: 'error',
        message: error.name === 'AbortError' 
          ? 'Timeout: KoboToolbox no respondió en 15 segundos'
          : `Error de conexión: ${error.message}`,
        details: { 
          errorType: error.name,
          suggestion: error.name === 'AbortError' 
            ? 'La API de KoboToolbox puede estar lenta o caída'
            : 'Verifica que KOBO_API_KEY esté configurado en el Edge Function'
        }
      };
    }
    setResults([...diagnostics]);

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'checking':
        return <Activity className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Server className="w-6 h-6" />
              Diagnóstico de Conexión
            </h2>
            <p className="text-gray-600 mt-1">
              Verificando todos los componentes del sistema
            </p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Ejecutando...' : 'Volver a ejecutar'}
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Project ID:</span>
              <p className="font-mono text-xs mt-1">{projectId}</p>
            </div>
            <div>
              <span className="text-gray-600">API URL:</span>
              <p className="font-mono text-xs mt-1 break-all">{API_BASE_URL}</p>
            </div>
            <div>
              <span className="text-gray-600">Anon Key:</span>
              <p className="font-mono text-xs mt-1">
                {publicAnonKey ? `${publicAnonKey.substring(0, 30)}...` : '(vacía)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(result.status)} transition-all`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{result.name}</h3>
                <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                      Ver detalles técnicos
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Soluciones comunes:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Si el Edge Function Health falla: Despliega el Edge Function en Supabase usando <code className="bg-blue-100 px-1 rounded">supabase functions deploy server</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Si la tabla usuarios falla: Verifica que la tabla existe y tiene la estructura correcta en Supabase SQL Editor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Si JWT Config muestra warning: Configura JWT_SECRET en las variables de entorno del Edge Function</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Si hay timeout: El servidor podría estar iniciando (espera 30 segundos) o no estar desplegado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>Si KoboToolbox API falla: Configura KOBO_API_KEY en las variables de entorno del Edge Function. Obtén la API Key desde KoboToolbox → Settings → API</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">6.</span>
              <span>Si los formularios no aparecen: Verifica que los UIDs de los formularios coincidan con los configurados en tu cuenta de KoboToolbox</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
