import React, { useState } from 'react';
import { useAuth } from '../App';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getUserRoleLabel } from '../types/user';

/**
 * Componente de diagnÃ³stico para verificar el estado del token JWT
 * Ãštil para debugging de problemas de autenticaciÃ³n
 */
export default function TokenDiagnostics() {
  const { accessToken, user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const analyzeToken = () => {
    const results = {
      exists: false,
      notUndefined: false,
      notNull: false,
      validFormat: false,
      partsCount: 0,
      validJWT: false,
      tokenPreview: '',
      tokenLength: 0,
      errors: [] as string[],
    };

    // Verificar existencia
    if (accessToken) {
      results.exists = true;
    } else {
      results.errors.push('El token no existe (null o undefined)');
      return results;
    }

    // Verificar que no sea literalmente "undefined" o "null"
    if (accessToken !== 'undefined') {
      results.notUndefined = true;
    } else {
      results.errors.push('El token es la cadena literal "undefined"');
    }

    if (accessToken !== 'null') {
      results.notNull = true;
    } else {
      results.errors.push('El token es la cadena literal "null"');
    }

    // Analizar formato
    results.tokenLength = accessToken.length;
    results.tokenPreview = accessToken.substring(0, 30) + '...';

    // Verificar partes del JWT
    const parts = accessToken.split('.');
    results.partsCount = parts.length;

    if (parts.length === 3) {
      results.validFormat = true;
      
      // Intentar decodificar header y payload (sin verificar firma)
      try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        results.validJWT = true;
        
        // Verificar expiraciÃ³n
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = payload.exp - now;
          
          if (timeLeft <= 0) {
            results.errors.push(`Token expirado (expirÃ³ hace ${Math.abs(timeLeft)} segundos)`);
            results.validJWT = false;
          } else {
            const daysLeft = Math.floor(timeLeft / (24 * 60 * 60));
            const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60)) / 3600);
            results.errors.push(`Token vÃ¡lido por ${daysLeft}d ${hoursLeft}h mÃ¡s`);
          }
        }
      } catch (e) {
        results.errors.push('No se pudo decodificar el JWT (puede estar corrupto)');
        results.validJWT = false;
      }
    } else {
      results.errors.push(`Formato JWT invÃ¡lido (${parts.length} partes en lugar de 3)`);
    }

    return results;
  };

  const results = analyzeToken();
  const allGood = results.exists && results.notUndefined && results.notNull && results.validFormat && results.validJWT;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">DiagnÃ³stico de Token</span>
        </div>
        <div className="flex items-center gap-2">
          {allGood ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <RefreshCw className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {showDetails && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {/* Usuario */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Usuario:</span>
            <span className="text-sm font-medium">{user?.email || 'N/A'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rol:</span>
            <span className="text-sm font-medium">{user ? getUserRoleLabel(user) : 'N/A'}</span>
          </div>

          {/* Validaciones */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Validaciones:</p>
            
            <ValidationItem
              label="Token existe"
              valid={results.exists}
            />
            
            <ValidationItem
              label='No es "undefined"'
              valid={results.notUndefined}
            />
            
            <ValidationItem
              label='No es "null"'
              valid={results.notNull}
            />
            
            <ValidationItem
              label="Formato JWT vÃ¡lido (3 partes)"
              valid={results.validFormat}
              detail={`${results.partsCount} partes`}
            />
            
            <ValidationItem
              label="JWT decodificable"
              valid={results.validJWT}
            />
          </div>

          {/* Detalles del token */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Detalles:</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Longitud:</span>
              <span className="text-xs font-mono">{results.tokenLength} caracteres</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Preview:</span>
              <code className="text-xs bg-gray-100 p-2 rounded break-all">
                {results.tokenPreview}
              </code>
            </div>
          </div>

          {/* Errores/Warnings */}
          {results.errors.length > 0 && (
            <div className="space-y-1 border-t pt-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                {allGood ? 'Estado:' : 'Problemas detectados:'}
              </p>
              {results.errors.map((error, i) => (
                <div key={i} className="flex items-start gap-2">
                  {allGood ? (
                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${allGood ? 'text-green-700' : 'text-amber-700'}`}>
                    {error}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Estado en localStorage */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">LocalStorage:</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Token guardado:</span>
              <span className="text-xs font-mono">
                {localStorage.getItem('access_token') ? 'âœ… SÃ­' : 'âŒ No'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationItem({ 
  label, 
  valid, 
  detail 
}: { 
  label: string; 
  valid: boolean; 
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-gray-500">{detail}</span>}
        {valid ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600" />
        )}
      </div>
    </div>
  );
}

