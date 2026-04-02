import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import {
  LogOut,
  Calendar,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  ListChecks,
} from 'lucide-react';
import ActivityCalendar from './ActivityCalendar';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import VolunteerManagement from './VolunteerManagement';
import ConnectionStatus from './ConnectionStatus';
import { getUserRoleName } from '../types/user';

interface Metrics {
  totalActivities: number;
  pendingActivities: number;
  validatedActivities: number;
  rejectedActivities: number;
  activeVolunteers: number;
  totalVolunteerHours: number;
  activityByWorker: Array<{
    name: string;
    total: number;
    validated: number;
    pending: number;
  }>;
}

export default function JefaDashboard() {
  const { user, accessToken, logout } = useAuth();
  const currentRole = getUserRoleName(user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'calendar' | 'volunteers'>('dashboard');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0);

  useEffect(() => {
    if (accessToken) {
      loadMetrics();
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && activeTab === 'dashboard') {
      loadMetrics();
    }
  }, [activeTab, accessToken]);

  const loadMetrics = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const metricsRes = await fetch(`${API_BASE_URL}/reports/metrics`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
        },
      });

      if (!metricsRes.ok) {
        const errorData = await metricsRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al cargar metricas: ${metricsRes.status}`);
      }

      const metricsData = await metricsRes.json();
      setMetrics(metricsData);
    } catch (error: any) {
      console.error('Error al cargar metricas de jefa:', error);
      alert(`Error al cargar metricas: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = metrics?.pendingActivities || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Jefa</h1>
            <p className="text-sm text-gray-600">Bienvenida, {user?.name}</p>
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

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activities'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListChecks className="w-5 h-5 inline mr-2" />
              Actividades ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'calendar'
                  ? 'border-pink-600 text-pink-600'
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
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Voluntarios
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {loading && (
              <div className="bg-white rounded-lg shadow p-6 text-gray-600">Cargando metricas...</div>
            )}

            {!loading && metrics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <p className="text-gray-600 text-sm">Planificadas / En ejecucion</p>
                        <p className="text-3xl font-bold text-yellow-600">{metrics.pendingActivities}</p>
                      </div>
                      <Clock className="w-12 h-12 text-yellow-500" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Cerradas</p>
                        <p className="text-3xl font-bold text-green-600">{metrics.validatedActivities}</p>
                      </div>
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Voluntarios Activos</p>
                        <p className="text-3xl font-bold text-gray-900">{metrics.activeVolunteers}</p>
                      </div>
                      <Users className="w-12 h-12 text-purple-500" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Horas</p>
                        <p className="text-3xl font-bold text-gray-900">{metrics.totalVolunteerHours}</p>
                      </div>
                      <FileText className="w-12 h-12 text-indigo-500" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Canceladas</p>
                        <p className="text-3xl font-bold text-red-600">{metrics.rejectedActivities}</p>
                      </div>
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Productividad del staff</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajador</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cerradas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendientes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasa cierre</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {metrics.activityByWorker.map((worker, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {worker.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.total}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{worker.validated}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{worker.pending}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {worker.total > 0 ? `${Math.round((worker.validated / worker.total) * 100)}%` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Actividades de todo el equipo</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Puedes revisar detalle, cambiar estado y descargar el reporte completo.
                </p>
              </div>
              <button
                onClick={() => setShowActivityForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear actividad
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

        {activeTab === 'calendar' && <ActivityCalendar />}

        {activeTab === 'volunteers' && <VolunteerManagement readOnly={false} />}
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
