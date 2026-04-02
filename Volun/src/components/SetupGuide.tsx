import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';

interface SetupGuideProps {
  onClose: () => void;
  embedded?: boolean;
}

export default function SetupGuide({ onClose, embedded = false }: SetupGuideProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const body = (
    <div className={`bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto ${embedded ? '' : 'max-w-3xl'}`}>
      <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🔧 Configuración de la Base de Datos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Advertencia */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">
                    Configuración Simplificada
                  </h3>
                  <p className="text-sm text-green-700">
                    El sistema usa Supabase con SERVICE_ROLE_KEY que automáticamente bypasea RLS. No necesitas configuración adicional.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 1 - Solo verificar que las keys estén configuradas */}
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Verificar Variables de Entorno
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Configura estas variables de forma segura:
                  </p>
                  
                  <div className="space-y-3">
                    {/* VITE_SUPABASE_PROJECT_ID */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-semibold text-indigo-600">VITE_SUPABASE_PROJECT_ID</code>
                        <button
                          onClick={() => copyToClipboard('your-project-ref')}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="bg-white p-2 rounded border text-xs font-mono">
                        your-project-ref
                      </div>
                    </div>

                    {/* VITE_SUPABASE_ANON_KEY */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-semibold text-indigo-600">VITE_SUPABASE_ANON_KEY</code>
                        <button
                          onClick={() => copyToClipboard('your-anon-or-publishable-key')}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="bg-white p-2 rounded border text-xs font-mono break-all">
                        your-anon-or-publishable-key
                      </div>
                    </div>

                    {/* SUPABASE_SERVICE_ROLE_KEY */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-semibold text-indigo-600">SUPABASE_SERVICE_ROLE_KEY</code>
                        <button
                          onClick={() => copyToClipboard('Configurar solo en secretos del Edge Function')}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="bg-white p-2 rounded border text-xs font-mono break-all">
                        Configura esta clave solo como secreto del Edge Function (nunca en frontend)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 2 - Simplificado */}
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Probar la Conexión
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Una vez configuradas las variables, haz clic en el botón "Probar conexión" en la pantalla de login.
                  </p>
                  <p className="text-sm text-gray-600">
                    Si todo está correcto, verás la lista de usuarios disponibles en tu tabla.
                  </p>
                </div>
              </div>
            </div>

            {/* Cómo configurar variables en Figma Make */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                📝 Cómo configurar variables en Figma Make
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Las variables de entorno aparecerán como campos a completar cuando ejecutes el servidor por primera vez.
              </p>
              <p className="text-xs text-blue-600">
                El sistema te pedirá cada variable automáticamente.
              </p>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Entendido
            </button>
          </div>
      </div>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-full max-w-3xl p-0 gap-0 border-0 bg-transparent shadow-none rounded-none"
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}

