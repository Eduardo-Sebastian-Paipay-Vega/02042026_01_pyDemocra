import { useAuth } from '../App';
import { API_BASE_URL } from './api';
import { publicAnonKey } from './supabase/info';

/**
 * Hook personalizado para hacer peticiones API con validación de token
 * 
 * Este hook garantiza que:
 * 1. El accessToken existe antes de hacer peticiones
 * 2. El token tiene un formato válido
 * 3. Se envían los headers correctos
 */
export function useApi() {
  const { accessToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    // Validar que el token existe
    if (!accessToken) {
      console.error('❌ useApi: accessToken no está disponible');
      console.error('No se puede hacer la petición sin token');
      throw new Error('No hay sesión activa. Por favor, inicia sesión.');
    }

    // Validar que el token no es "undefined" o "null" como string
    if (accessToken === 'undefined' || accessToken === 'null') {
      console.error('❌ useApi: accessToken tiene valor inválido:', accessToken);
      throw new Error('Token de sesión inválido. Por favor, inicia sesión nuevamente.');
    }

    // Validar formato básico de JWT (3 partes)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('❌ useApi: Token no tiene formato JWT válido');
      console.error('Partes encontradas:', parts.length);
      console.error('Token (preview):', accessToken.substring(0, 50) + '...');
      throw new Error('Token de sesión con formato inválido. Por favor, inicia sesión nuevamente.');
    }

    console.log('✅ useApi: Token validado, haciendo petición a:', endpoint);

    // Merge headers
    const headers = {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Hacer petición
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return response;
  };

  return {
    fetchWithAuth,
    accessToken,
    isAuthenticated: !!accessToken && accessToken !== 'undefined' && accessToken !== 'null',
  };
}
