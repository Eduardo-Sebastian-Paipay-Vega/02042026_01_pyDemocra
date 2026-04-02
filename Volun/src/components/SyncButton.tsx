import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Database, FileText } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';

interface SyncResult {
  success: boolean;
  processed: number;
  skipped: number;
  errors: number;
  details: {
    nuevos: number;
    actualizados: number;
    duplicados: number;
    voluntariosCreados: number;
    errores: string[];
  };
}

interface SyncButtonProps {
  actividadId?: string;
  codigoActividad?: string;
  onSyncComplete?: () => void;
  variant?: 'full' | 'compact';
  accessToken?: string;
}

export default function SyncButton({ 
  actividadId, 
  codigoActividad,
  onSyncComplete, 
  variant = 'compact',
  accessToken 
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const syncAsistencia = async () => {
    if (!accessToken) {
      alert('No hay sesión activa');
      return;
    }

    setIsSyncing(true);
    setShowResults(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/sync/asistencia-horas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setLastResult({
          type: 'asistencia',
          ...data
        });
        setShowResults(true);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        throw new Error(data.error || 'Error en sincronización');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncEvidencias = async () => {
    if (!accessToken) {
      alert('No hay sesión activa');
      return;
    }

    setIsSyncing(true);
    setShowResults(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/sync/ejecucion-evidencias`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setLastResult({
          type: 'evidencias',
          ...data
        });
        setShowResults(true);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        throw new Error(data.error || 'Error en sincronización');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAll = async () => {
    if (!accessToken) {
      alert('No hay sesión activa');
      return;
    }

    setIsSyncing(true);
    setShowResults(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/sync/all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setLastResult({
          type: 'all',
          ...data
        });
        setShowResults(true);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        throw new Error(data.error || 'Error en sincronización');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Variant compacta: solo un botón
  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={syncAll}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            isSyncing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
          title="Sincronizar datos de campo desde KoboToolbox"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>

        {/* Popup de resultados */}
        {showResults && lastResult && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900">Sincronización Completa</span>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {lastResult.type === 'all' && lastResult.resumen && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total procesados:</span>
                  <span className="font-semibold">{lastResult.resumen.totalProcesados}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Errores:</span>
                  <span className={`font-semibold ${lastResult.resumen.totalErrores > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {lastResult.resumen.totalErrores}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duplicados:</span>
                  <span className="font-semibold text-gray-500">{lastResult.resumen.totalSaltados}</span>
                </div>
              </div>
            )}

            {lastResult.result && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nuevos:</span>
                    <span className="text-green-600 font-medium">{lastResult.result.details.nuevos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actualizados:</span>
                    <span className="text-blue-600 font-medium">{lastResult.result.details.actualizados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duplicados:</span>
                    <span className="text-gray-500 font-medium">{lastResult.result.details.duplicados}</span>
                  </div>
                  {lastResult.result.details.voluntariosCreados > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">👤 Voluntarios creados:</span>
                      <span className="text-purple-600 font-medium">{lastResult.result.details.voluntariosCreados}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {lastResult.result?.details?.errores && lastResult.result.details.errores.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Errores:</p>
                <div className="max-h-24 overflow-y-auto">
                  {lastResult.result.details.errores.map((error: string, idx: number) => (
                    <p key={idx} className="text-xs text-red-600 mb-1">• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant full: panel completo con opciones
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <RefreshCw className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Sincronizar Datos de Campo</h3>
          <p className="text-sm text-gray-600">Actualiza Supabase con datos desde KoboToolbox</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={syncAsistencia}
          disabled={isSyncing}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Asistencia y Horas</span>
        </button>

        <button
          onClick={syncEvidencias}
          disabled={isSyncing}
          className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">Evidencias</span>
        </button>

        <button
          onClick={syncAll}
          disabled={isSyncing}
          className="flex flex-col items-center gap-2 p-4 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Database className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium">Sincronizar Todo</span>
        </button>
      </div>

      {isSyncing && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-700">Procesando datos desde KoboToolbox...</span>
        </div>
      )}

      {showResults && lastResult && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">✓ Sincronización Exitosa</h4>
              
              {lastResult.type === 'all' && lastResult.resumen && (
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{lastResult.resumen.totalProcesados}</p>
                    <p className="text-xs text-gray-600">Procesados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{lastResult.resumen.totalErrores}</p>
                    <p className="text-xs text-gray-600">Errores</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-500">{lastResult.resumen.totalSaltados}</p>
                    <p className="text-xs text-gray-600">Duplicados</p>
                  </div>
                </div>
              )}

              {lastResult.result && (
                <div className="bg-white rounded p-3 mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Detalles:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nuevos: </span>
                      <span className="font-semibold text-green-600">{lastResult.result.details.nuevos}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Actualizados: </span>
                      <span className="font-semibold text-blue-600">{lastResult.result.details.actualizados}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duplicados: </span>
                      <span className="font-semibold text-gray-500">{lastResult.result.details.duplicados}</span>
                    </div>
                    {lastResult.result.details.voluntariosCreados > 0 && (
                      <div>
                        <span className="text-gray-600">👤 Vol. creados: </span>
                        <span className="font-semibold text-purple-600">{lastResult.result.details.voluntariosCreados}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowResults(false)}
                className="text-sm text-green-700 hover:text-green-800 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Nota:</strong> La sincronización lee datos crudos de KoboToolbox, los valida y actualiza 
          las tablas en Supabase. Los datos duplicados se omiten automáticamente usando el ID único de cada submission.
        </p>
      </div>
    </div>
  );
}
