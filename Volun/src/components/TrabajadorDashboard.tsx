import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { 
  LogOut, 
  Calendar, 
  Users,
  BarChart3,
  Plus
} from 'lucide-react';
import ActivityCalendar from './ActivityCalendar';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import VolunteerManagement from './VolunteerManagement';
import ConnectionStatus from './ConnectionStatus';
import { getUserRoleName } from '../types/user';

interface Metrics {
  totalActivities: number;
  validatedActivities: number;
  pendingActivities: number;
  rejectedActivities: number;
  volunteersManaged: number;
}

export default function TrabajadorDashboard() {
  const { user, accessToken, logout } = useAuth();
  const currentRole = getUserRoleName(user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'calendar' | 'volunteers'>('dashboard');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      loadMetrics();
    }
  }, [accessToken]);

  const loadMetrics = async () => {
    // ValidaciÃ³n estricta del token
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      console.log('âš ï¸ No hay accessToken vÃ¡lido disponible, saltando carga de mÃ©tricas');
      console.log('accessToken:', accessToken);
      setLoading(false);
      return;
    }
    
    // Validar formato JWT
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('âŒ Token con formato invÃ¡lido en TrabajadorDashboard');
      console.error('Expected 3 parts, got:', parts.length);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Cargando mÃ©tricas del trabajador...');
      console.log('AccessToken presente:', !!accessToken);
      
      const res = await fetch(`${API_BASE_URL}/reports/metrics`, {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken 
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        
        if (res.status === 401) {
          console.error('Error 401: Token invÃ¡lido o expirado');
          alert('Tu sesiÃ³n ha expirado. Por favor, vuelve a iniciar sesiÃ³n.');
          logout();
          return;
        }
        
        throw new Error(`Error al cargar mÃ©tricas: ${res.status} - ${errorData.error || 'Error desconocido'}`);
      }
      
      const data = await res.json();
      console.log('MÃ©tricas cargadas correctamente:', data);
      setMetrics(data);
    } catch (error: any) {
      console.error('Error al cargar mÃ©tricas:', error);
      const errorMsg = error.message || 'Error desconocido';
      alert(`Error al cargar mÃ©tricas del dashboard: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Trabajador</h1>
            <p className="text-sm text-gray-600">Bienvenido/a, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Mi Dashboard
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activities'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Actividades
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Calendario
            </button>
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'volunteers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Voluntarios
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && metrics && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mis MÃ©tricas</h2>
            
            {/* MÃ©tricas Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Actividades</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalActivities}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Validadas</p>
                    <p className="text-3xl font-bold text-green-600">{metrics.validatedActivities}</p>
                  </div>
                  <div className="text-green-500 text-4xl">âœ“</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{metrics.pendingActivities}</p>
                  </div>
                  <div className="text-yellow-500 text-4xl">â±</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Voluntarios</p>
                    <p className="text-3xl font-bold text-purple-600">{metrics.volunteersManaged}</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Estado</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tasa de AprobaciÃ³n</span>
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.totalActivities > 0 
                      ? `${Math.round((metrics.validatedActivities / metrics.totalActivities) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: metrics.totalActivities > 0 
                        ? `${(metrics.validatedActivities / metrics.totalActivities) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>

              {metrics.rejectedActivities > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    <strong>AtenciÃ³n:</strong> Tienes {metrics.rejectedActivities} actividad(es) rechazada(s). 
                    Revisa los comentarios de la Jefa en el calendario.
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">ðŸ’¡ Consejos</h3>
              <ul className="space-y-2 text-blue-800">
                <li>â€¢ Registra tus actividades inmediatamente despuÃ©s de realizarlas</li>
                <li>â€¢ AsegÃºrate de vincular todos los voluntarios que participaron</li>
                <li>â€¢ Las actividades solo se contabilizan una vez que la Jefa las aprueba</li>
                <li>â€¢ Puedes ver el calendario completo para coordinar con tus compaÃ±eros</li>
              </ul>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Actividades</h2>
              <button
                onClick={() => setShowActivityForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Crear actividad
              </button>
            </div>

            <ActivityList
              accessToken={accessToken || ''}
              refreshKey={activitiesRefreshKey}
              id_usuario={user?.id}
              rol={currentRole || undefined}
            />
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <ActivityCalendar />
        )}

        {/* Volunteers Tab */}
        {activeTab === 'volunteers' && (
          <VolunteerManagement readOnly={false} />
        )}
      </main>

      {showActivityForm && (
        <ActivityForm
          onClose={() => setShowActivityForm(false)}
          onSuccess={() => {
            setShowActivityForm(false);
            setActivitiesRefreshKey((prev) => prev + 1);
            loadMetrics();
          }}
          accessToken={accessToken || ''}
          id_usuario={user?.id}
          rol={currentRole || undefined}
        />
      )}
    </div>
  );
}

