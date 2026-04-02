import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { AlertCircle } from 'lucide-react';
import { getUserRoleLabel } from '../types/user';

/**
 * Componente que valida el estado de autenticaciÃ³n
 * y muestra errores si el token no es vÃ¡lido
 */
export default function AuthValidator({ children }: { children: React.ReactNode }) {
  const { accessToken, logout, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validar el token cada vez que cambie
    if (user) {
      validateToken();
    }
  }, [accessToken, user]);

  const validateToken = () => {
    // Resetear error
    setError(null);

    // Validar que el token existe
    if (!accessToken) {
      console.error('âŒ AuthValidator: accessToken es null o undefined');
      setError('No hay token de autenticaciÃ³n disponible');
      return false;
    }

    // Validar que el token no es literalmente "undefined" o "null"
    if (accessToken === 'undefined' || accessToken === 'null') {
      console.error('âŒ AuthValidator: accessToken tiene valor invÃ¡lido:', accessToken);
      setError(`Token invÃ¡lido: "${accessToken}"`);
      return false;
    }

    // Validar formato JWT (3 partes)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('âŒ AuthValidator: Token no tiene formato JWT vÃ¡lido');
      console.error('Expected 3 parts, got:', parts.length);
      console.error('Token (preview):', accessToken.substring(0, 50) + '...');
      setError(`Token con formato invÃ¡lido (${parts.length} partes en lugar de 3)`);
      return false;
    }

    // Token vÃ¡lido
    console.log('âœ… AuthValidator: Token validado correctamente');
    return true;
  };

  // Si hay un error, mostrar mensaje
  if (error && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-bold text-red-900">Error de AutenticaciÃ³n</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-red-700">
              Tu sesiÃ³n tiene un problema y no se puede continuar:
            </p>
            
            <div className="bg-red-100 border border-red-300 rounded p-3">
              <p className="font-mono text-sm text-red-800">{error}</p>
            </div>
            
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Usuario:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {getUserRoleLabel(user)}</p>
            </div>

            <button
              onClick={() => {
                console.log('Cerrando sesiÃ³n debido a error de autenticaciÃ³n');
                logout();
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              Cerrar sesiÃ³n e intentar de nuevo
            </button>

            <div className="text-xs text-gray-600 mt-4 p-3 bg-gray-100 rounded">
              <p className="font-semibold mb-2">InformaciÃ³n tÃ©cnica:</p>
              <p>Este error ocurre cuando el token de sesiÃ³n no tiene un formato vÃ¡lido.</p>
              <p className="mt-1">Cerrar sesiÃ³n y volver a iniciar sesiÃ³n deberÃ­a resolver el problema.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay error, renderizar children normalmente
  return <>{children}</>;
}

