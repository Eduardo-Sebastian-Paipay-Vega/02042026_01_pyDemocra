import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAuth } from '../App';

interface DiagnosticResult {
  jwtConfig?: {
    jwtSecretConfigured: boolean;
    jwtSecretLength: number;
    warning?: string;
    recommendation: string;
  };
  tokenValidation?: {
    success: boolean;
    message: string;
    payload?: any;
    userInKV?: boolean;
  };
  error?: string;
}

interface SessionDiagnosticsProps {
  embedded?: boolean;
}

export default function SessionDiagnostics({ embedded = false }: SessionDiagnosticsProps = {}) {
  const { accessToken } = useAuth();
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  const adminHeaders = (withJson = false) => ({
    'Authorization': `Bearer ${publicAnonKey}`,
    'X-Access-Token': accessToken || '',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
  });

  const runDiagnostics = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (!accessToken) {
        throw new Error('No hay sesion activa. Inicia sesion como admin para usar este diagnostico.');
      }

      const configResponse = await fetch(`${API_BASE_URL}/debug/jwt-config`, {
        headers: adminHeaders(),
      });

      if (!configResponse.ok) {
        throw new Error('No se pudo verificar la configuracion JWT');
      }

      const configData = await configResponse.json();

      const storedToken = localStorage.getItem('access_token');
      let tokenValidation: any = null;

      if (storedToken) {
        const tokenResponse = await fetch(`${API_BASE_URL}/debug/verify-token`, {
          method: 'POST',
          headers: adminHeaders(true),
          body: JSON.stringify({ token: storedToken }),
        });

        tokenValidation = await tokenResponse.json();
      }

      setResult({
        jwtConfig: configData,
        tokenValidation: tokenValidation || {
          success: false,
          message: 'No hay token almacenado en localStorage',
        },
      });
    } catch (error: any) {
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem('access_token');
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Diagnostico de Sesion
        </CardTitle>
        <CardDescription>
          Verifica el estado de tu sesion y la configuracion JWT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Ejecutando...' : 'Ejecutar Diagnostico'}
          </Button>
          <Button onClick={clearSession} variant="outline">
            Limpiar Sesion
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            {result.jwtConfig && (
              <Alert variant={result.jwtConfig.jwtSecretConfigured ? 'default' : 'destructive'}>
                {result.jwtConfig.jwtSecretConfigured ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Configuracion JWT_SECRET</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <div>
                    <strong>Estado:</strong>{' '}
                    {result.jwtConfig.jwtSecretConfigured ? (
                      <span className="text-green-600">Configurado</span>
                    ) : (
                      <span className="text-red-600">No configurado</span>
                    )}
                  </div>
                  {result.jwtConfig.jwtSecretConfigured && (
                    <div>
                      <strong>Longitud:</strong> {result.jwtConfig.jwtSecretLength} caracteres
                    </div>
                  )}
                  {result.jwtConfig.warning && (
                    <div className="text-yellow-600 font-semibold">
                      {result.jwtConfig.warning}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    {result.jwtConfig.recommendation}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result.tokenValidation && (
              <Alert variant={result.tokenValidation.success ? 'default' : 'destructive'}>
                {result.tokenValidation.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>Validacion de Token</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <div>
                    <strong>Estado:</strong>{' '}
                    {result.tokenValidation.success ? (
                      <span className="text-green-600">Token valido</span>
                    ) : (
                      <span className="text-red-600">Token invalido o expirado</span>
                    )}
                  </div>
                  <div className="text-sm">{result.tokenValidation.message}</div>

                  {result.tokenValidation.payload && (
                    <div className="bg-gray-50 p-3 rounded mt-2 text-sm">
                      <div><strong>User ID:</strong> {result.tokenValidation.payload.userId}</div>
                      <div><strong>Email:</strong> {result.tokenValidation.payload.email}</div>
                      <div><strong>Role:</strong> {result.tokenValidation.payload.role}</div>
                      {result.tokenValidation.payload.exp && (
                        <div>
                          <strong>Expira:</strong>{' '}
                          {new Date(result.tokenValidation.payload.exp * 1000).toLocaleString('es-ES')}
                        </div>
                      )}
                      <div>
                        <strong>Usuario en KV:</strong>{' '}
                        {result.tokenValidation.userInKV ? (
                          <span className="text-green-600">Si</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {result.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">Soluciones Comunes:</h4>
          <ul className="space-y-1 text-blue-800">
            <li>• JWT_SECRET no configurado: configura la variable en Supabase Edge Functions.</li>
            <li>• Token expirado: los tokens duran 7 dias; cierra sesion y vuelve a entrar.</li>
            <li>• Usuario no en KV: vuelve a iniciar sesion para regenerar la sesion en KV.</li>
            <li>• Firma invalida: si cambiaste JWT_SECRET, limpia sesion y vuelve a iniciar sesion.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
