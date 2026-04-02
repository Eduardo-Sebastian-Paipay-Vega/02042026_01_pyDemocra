import React from 'react';
import { Info, CheckCircle, AlertCircle, Code } from 'lucide-react';

export default function PasswordSetupHelp() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-purple-900 mb-2">
            Guía Rápida: Configuración de Contraseñas
          </h3>
          <p className="text-purple-700 text-sm mb-4">
            Tu sistema usa una tabla personalizada <code className="bg-purple-100 px-2 py-1 rounded">usuarios</code> en lugar de Supabase Auth.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Paso 1 */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2">Verifica el Estado de tus Contraseñas</h4>
              <p className="text-sm text-gray-600 mb-3">
                Haz clic en el botón <strong>"🔐 Gestor de Contraseñas"</strong> para ver:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Contraseñas hasheadas con bcrypt (seguras) ✅</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Contraseñas en texto plano (inseguras) ⚠️</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>Contraseñas vacías ❌</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Paso 2 */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2">Hashea las Contraseñas en Texto Plano</h4>
              <p className="text-sm text-gray-600 mb-3">
                Si tus contraseñas están en texto plano (ejemplo: "hash_aqui", "12345", "password"):
              </p>
              <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                <li>Selecciona el usuario desde el dropdown</li>
                <li>Ingresa la contraseña que quieres asignarle</li>
                <li>Haz clic en <strong>"Hashear"</strong></li>
                <li>La contraseña será hasheada con bcrypt y guardada automáticamente</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Paso 3 */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-2">Prueba el Login</h4>
              <p className="text-sm text-gray-600">
                Una vez hasheadas las contraseñas, regresa a la pantalla de login e inicia sesión con:
              </p>
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
                <code className="text-sm">
                  <div><strong>Usuario:</strong> tu_usuario</div>
                  <div><strong>Contraseña:</strong> la_que_acabas_de_hashear</div>
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Info Técnica */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Code className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-indigo-900 mb-2">Información Técnica</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Las contraseñas se hashean usando <strong>bcrypt</strong> con salt factor 10</li>
                <li>• Los hashes bcrypt comienzan con <code className="bg-indigo-100 px-1 rounded">$2a$</code>, <code className="bg-indigo-100 px-1 rounded">$2b$</code> o <code className="bg-indigo-100 px-1 rounded">$2y$</code></li>
                <li>• Los hashes tienen aproximadamente 60 caracteres de longitud</li>
                <li>• Una vez hasheadas, las contraseñas NO se pueden revertir (seguridad)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ejemplo */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Ejemplo de Hash Bcrypt
          </h4>
          <div className="bg-white border border-green-300 rounded p-3 overflow-x-auto">
            <p className="text-xs text-gray-600 mb-1">Contraseña original: <code className="bg-red-100 text-red-700 px-2 py-0.5 rounded">miPassword123</code></p>
            <p className="text-xs text-gray-600 mb-1">Hash bcrypt:</p>
            <code className="text-xs text-green-700 break-all">
              $2b$10$N9qo8uLOickgx2ZMRZoMye.IjefKiIyL2rCLFQExKt9.z9gDPSAWe
            </code>
          </div>
          <p className="text-xs text-green-700 mt-2">
            ✅ Este formato es válido y seguro para tu sistema
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-purple-200">
        <p className="text-sm text-purple-900 font-medium">
          💡 <strong>Tip:</strong> Si acabas de crear tu tabla usuarios en Supabase con datos de ejemplo, 
          es probable que las contraseñas estén en texto plano. Usa esta herramienta para convertirlas a bcrypt antes de tu primer login.
        </p>
      </div>
    </div>
  );
}
