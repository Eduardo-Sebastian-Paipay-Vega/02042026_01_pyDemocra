import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Activity, Database, FileText } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useAuth } from '../App';

interface ConnectionState {
  supabase: 'checking' | 'connected' | 'error';
  kobo: 'checking' | 'connected' | 'error' | 'warning';
  lastCheck: Date | null;
  koboDetails?: {
    totalForms?: number;
    asistenciaFound?: boolean;
    ejecucionFound?: boolean;
    totalSubmissions?: number;
  };
}

export default function ConnectionStatus() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<ConnectionState>({
    supabase: 'checking',
    kobo: 'checking',
    lastCheck: null
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const checkConnections = async () => {
    if (!accessToken) {
      setState(prev => ({ ...prev, supabase: 'error', kobo: 'error', lastCheck: new Date() }));
      return;
    }

    setState(prev => ({ ...prev, supabase: 'checking', kobo: 'checking' }));

    // Check Supabase
    try {
      const supabaseRes = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
        }
      });
      
      setState(prev => ({
        ...prev,
        supabase: supabaseRes.ok ? 'connected' : 'error'
      }));
    } catch {
      setState(prev => ({ ...prev, supabase: 'error' }));
    }

    // Check KoboToolbox
    try {
      const koboRes = await fetch(`${API_BASE_URL}/kobo/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
        }
      });
      
      const koboData = await koboRes.json();
      
      if (koboRes.ok && koboData.status === 'ok') {
        const hasWarnings = koboData.warnings && koboData.warnings.length > 0;
        setState(prev => ({
          ...prev,
          kobo: hasWarnings ? 'warning' : 'connected',
          koboDetails: {
            totalForms: koboData.kobo?.totalForms || 0,
            asistenciaFound: koboData.kobo?.forms?.asistenciaHoras?.found || false,
            ejecucionFound: koboData.kobo?.forms?.ejecucionEvidencias?.found || false,
            totalSubmissions: 
              (koboData.kobo?.forms?.asistenciaHoras?.submissionCount || 0) +
              (koboData.kobo?.forms?.ejecucionEvidencias?.submissionCount || 0)
          }
        }));
      } else {
        setState(prev => ({ ...prev, kobo: 'error' }));
      }
    } catch {
      setState(prev => ({ ...prev, kobo: 'error' }));
    }

    setState(prev => ({ ...prev, lastCheck: new Date() }));
  };

  useEffect(() => {
    checkConnections();
    
    // Recheck every 5 minutes
    const interval = setInterval(checkConnections, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [accessToken]);

  const getStatusIcon = (status: 'checking' | 'connected' | 'error' | 'warning') => {
    switch (status) {
      case 'checking':
        return <Activity className="w-4 h-4 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'checking' | 'connected' | 'error' | 'warning') => {
    switch (status) {
      case 'checking':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'connected':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const getStatusText = (status: 'checking' | 'connected' | 'error' | 'warning') => {
    switch (status) {
      case 'checking':
        return 'Verificando...';
      case 'connected':
        return 'Conectado';
      case 'warning':
        return 'Advertencia';
      case 'error':
        return 'Error';
    }
  };

  if (!isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {getStatusIcon(state.supabase)}
                {getStatusIcon(state.kobo)}
              </div>
              <span className="text-xs text-gray-600">Estado</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click para ver detalles de conexión</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 min-w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Estado del Sistema</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {/* Supabase Status */}
        <div className="flex items-center justify-between p-2 rounded border bg-gray-50">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Supabase</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(state.supabase)}
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(state.supabase)}`}
            >
              {getStatusText(state.supabase)}
            </Badge>
          </div>
        </div>

        {/* KoboToolbox Status */}
        <div className="flex items-center justify-between p-2 rounded border bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">KoboToolbox</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(state.kobo)}
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(state.kobo)}`}
            >
              {getStatusText(state.kobo)}
            </Badge>
          </div>
        </div>

        {/* Kobo Details */}
        {state.kobo === 'connected' && state.koboDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Detalles KoboToolbox:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Formularios:</span>
                <span className="font-medium">{state.koboDetails.totalForms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Asistencia:</span>
                <span className={state.koboDetails.asistenciaFound ? 'text-green-600' : 'text-red-600'}>
                  {state.koboDetails.asistenciaFound ? '✓ Configurado' : '✗ No encontrado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ejecución:</span>
                <span className={state.koboDetails.ejecucionFound ? 'text-green-600' : 'text-red-600'}>
                  {state.koboDetails.ejecucionFound ? '✓ Configurado' : '✗ No encontrado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registros totales:</span>
                <span className="font-medium">{state.koboDetails.totalSubmissions}</span>
              </div>
            </div>
          </div>
        )}

        {/* Last Check */}
        {state.lastCheck && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Última verificación: {state.lastCheck.toLocaleTimeString('es-ES')}
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={checkConnections}
          disabled={state.supabase === 'checking' || state.kobo === 'checking'}
          className="w-full mt-2 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state.supabase === 'checking' || state.kobo === 'checking' 
            ? 'Verificando...' 
            : 'Actualizar Estado'}
        </button>
      </div>
    </div>
  );
}
