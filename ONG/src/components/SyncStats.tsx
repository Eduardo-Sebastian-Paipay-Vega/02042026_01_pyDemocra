import React, { useState, useEffect } from 'react';
import { RefreshCw, Users, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';

interface SyncStatsProps {
  accessToken?: string;
}

interface SyncLog {
  formulario: string;
  fecha_sync: string;
  registros_procesados: number;
  registros_error: number;
  voluntarios_creados?: number;
  estado: string;
}

interface SyncError {
  kobo_submission_id: string;
  formulario_codigo: string;
  tipo_error: string;
  descripcion: string;
  fecha_error: string;
}

export default function SyncStats({ accessToken }: SyncStatsProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showErrors, setShowErrors] = useState(false);

  const loadStats = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sync/stats`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [accessToken]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sincronizaciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Syncs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.logs?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Voluntarios Automáticos */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Vol. Automáticos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.voluntariosAutomaticos || 0}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Creados desde Kobo</p>
        </div>

        {/* Errores Pendientes */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Errores Pendientes</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalErrores || 0}</p>
            </div>
          </div>
          {stats.totalErrores > 0 && (
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="text-xs text-red-600 hover:underline"
            >
              {showErrors ? 'Ocultar' : 'Ver detalles'}
            </button>
          )}
        </div>

        {/* Última Sincronización */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Última Sync</p>
              {stats.logs?.[0] && (
                <p className="text-sm font-medium text-gray-900">
                  {new Date(stats.logs[0].fecha_sync).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Errores Detallados */}
      {showErrors && stats.erroresPendientes && stats.erroresPendientes.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Errores Pendientes de Revisión
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.erroresPendientes.map((error: SyncError, idx: number) => (
              <div key={idx} className="bg-white rounded p-3 text-sm">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-red-800">{error.tipo_error}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(error.fecha_error).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 text-xs mb-1">{error.descripcion}</p>
                <p className="text-gray-500 text-xs">
                  Submission: <code className="bg-gray-100 px-1 rounded">{error.kobo_submission_id.substring(0, 16)}...</code>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Sincronizaciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Historial de Sincronizaciones
          </h4>
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {stats.logs && stats.logs.length > 0 ? (
          <div className="space-y-2">
            {stats.logs.map((log: SyncLog, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{log.formulario}</span>
                    {log.estado === 'exitoso' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                    <span>📊 {log.registros_procesados} procesados</span>
                    {log.registros_error > 0 && (
                      <span className="text-red-600">❌ {log.registros_error} errores</span>
                    )}
                    {log.voluntarios_creados && log.voluntarios_creados > 0 && (
                      <span className="text-purple-600">👤 {log.voluntarios_creados} vol. creados</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {new Date(log.fecha_sync).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay sincronizaciones registradas todavía
          </p>
        )}
      </div>
    </div>
  );
}
