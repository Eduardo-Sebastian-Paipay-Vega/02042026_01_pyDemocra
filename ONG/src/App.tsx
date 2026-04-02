import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from './utils/api';
import { publicAnonKey } from './utils/supabase/info';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import JefaDashboard from './components/JefaDashboard';
import TrabajadorDashboard from './components/TrabajadorDashboard';
import PortalVoluntario from './components/PortalVoluntario';
import AuthValidator from './components/AuthValidator';
import { Toaster } from './components/ui/sonner';
import type { User } from './types/user';
import { getUserRoleName } from './types/user';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesiÃ³n existente
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Intentar obtener token del localStorage
      const storedToken = localStorage.getItem('access_token');
      
      if (storedToken) {
        console.log('ðŸ” Verificando sesiÃ³n almacenada...');
        console.log('Token almacenado (preview):', storedToken.substring(0, 50) + '...');
        console.log('Token almacenado (length):', storedToken.length);
        
        // Limpiar el token
        const cleanToken = storedToken.trim();
        console.log('Token limpio (length):', cleanToken.length);
        
        // Verificar formato
        const parts = cleanToken.split('.');
        console.log('Partes del JWT:', parts.length);
        if (parts.length !== 3) {
          console.error('âš ï¸ Token en localStorage tiene formato invÃ¡lido, eliminando...');
          localStorage.removeItem('access_token');
          setLoading(false);
          return;
        }
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
          
          const response = await fetch(`${API_BASE_URL}/auth/session`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': cleanToken,
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            console.log('âœ… SesiÃ³n vÃ¡lida, usuario:', data.user.email);
            setUser(data.user);
            setAccessToken(cleanToken); // Usar token limpio
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('âŒ SesiÃ³n expirada o invÃ¡lida:', response.status);
            console.error('Error response:', errorData);
            
            if (response.status === 401) {
              const errorType = errorData.errorType || 'UNKNOWN';
              console.error(`ðŸ”´ Error de autenticaciÃ³n: ${errorType}`);
              console.error('Mensaje:', errorData.message || errorData.error);
              
              if (errorType === 'TOKEN_EXPIRED_OR_INVALID') {
                console.error('â° El token ha expirado despuÃ©s de 7 dÃ­as de inactividad');
              } else if (errorType === 'INVALID_TOKEN') {
                console.error('ðŸ”’ El token es invÃ¡lido - puede que JWT_SECRET haya cambiado');
              } else if (errorType === 'USER_NOT_IN_KV') {
                console.error('ðŸ‘¤ Usuario no encontrado en KV - datos de sesiÃ³n perdidos');
              }
            }
            
            localStorage.removeItem('access_token');
          }
        } catch (fetchError: any) {
          // Si hay error de red, simplemente limpiar la sesiÃ³n sin mostrar error
          console.log('âš ï¸ No se pudo verificar sesiÃ³n:', fetchError.message);
          console.log('Esto puede ser normal si el servidor no estÃ¡ disponible');
          localStorage.removeItem('access_token');
        }
      } else {
        console.log('No hay token almacenado en localStorage');
      }
    } catch (error) {
      console.error('Error al verificar sesiÃ³n:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (usuario: string, password: string) => {
    try {
      console.log('Intentando login con:', usuario);
      console.log('API URL:', `${API_BASE_URL}/auth/login`);
      
      let response;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
        
        response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ usuario, password }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        console.error('âŒ Error de fetch al hacer login:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('El servidor no respondiÃ³ a tiempo. Verifica que el Edge Function estÃ© desplegado.');
        } else if (fetchError.message.includes('Failed to fetch')) {
          throw new Error('No se pudo conectar al servidor. El Edge Function no estÃ¡ desplegado o no estÃ¡ disponible.');
        } else {
          throw new Error(`Error de conexiÃ³n: ${fetchError.message}`);
        }
      }

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Error del servidor (${response.status}): ${errorText}`);
        }
        
        // Crear error con la informaciÃ³n adicional
        const error: any = new Error(errorData.error || 'Error al iniciar sesiÃ³n');
        error.requiresHashing = errorData.requiresHashing || false;
        throw error;
      }

      const data = await response.json();
      const roleName = getUserRoleName(data.user);
      console.log('Login exitoso!');
      console.log('Usuario:', data.user.email, '- Rol:', roleName || 'sin rol');
      
      // Validar que el token existe en la respuesta
      if (!data.access_token) {
        console.error('âŒ CRÃTICO: El servidor no devolviÃ³ access_token');
        console.error('Respuesta completa:', JSON.stringify(data, null, 2));
        throw new Error('El servidor no devolviÃ³ un token de autenticaciÃ³n');
      }
      
      console.log('Token generado (type):', typeof data.access_token);
      console.log('Token generado (preview):', data.access_token.substring(0, 50) + '...');
      console.log('Token length:', data.access_token.length);
      
      // Limpiar el token (remover espacios, saltos de lÃ­nea)
      const cleanToken = data.access_token.trim();
      console.log('Token limpio length:', cleanToken.length);
      
      // Verificar formato JWT (3 partes)
      const parts = cleanToken.split('.');
      console.log('Partes del JWT:', parts.length);
      if (parts.length !== 3) {
        console.error('âš ï¸ ADVERTENCIA: Token recibido no tiene formato JWT vÃ¡lido');
        console.error('Token completo:', cleanToken);
        console.error('Partes:', parts);
        throw new Error('El token recibido no tiene formato JWT vÃ¡lido');
      }
      
      console.log('âœ… Token validado correctamente antes de guardar');
      console.log('Setting user state with:', data.user);
      console.log('Setting accessToken state with (preview):', cleanToken.substring(0, 30) + '...');
      
      setUser(data.user);
      setAccessToken(cleanToken);
      
      // Guardar token limpio en localStorage para persistencia
      localStorage.setItem('access_token', cleanToken);
      console.log('âœ… Token guardado en localStorage (limpio)');
      console.log('âœ… Estado actualizado - user y accessToken deberÃ­an estar disponibles ahora');
    } catch (error: any) {
      console.error('Error en login:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('access_token');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
        <Toaster position="top-right" richColors closeButton />
        <Login />
      </AuthContext.Provider>
    );
  }

  const userRole = getUserRoleName(user);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      <Toaster position="top-right" richColors closeButton />
      <AuthValidator>
        <div className="min-h-screen bg-gray-50">
          {userRole === 'admin' && <AdminDashboard />}
          {userRole === 'principal' && <JefaDashboard />}
          {userRole === 'trabajador' && <TrabajadorDashboard />}
          {userRole === 'voluntario' && <PortalVoluntario />}
        </div>
      </AuthValidator>
    </AuthContext.Provider>
  );
}

