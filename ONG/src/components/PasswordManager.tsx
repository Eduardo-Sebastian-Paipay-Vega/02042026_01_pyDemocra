 ﻿import React, { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle, AlertTriangle, Lock, RefreshCw, X, HelpCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import PasswordSetupHelp from './PasswordSetupHelp';
import { useAuth } from '../App';
import { Dialog, DialogContent } from './ui/dialog';

interface UsuarioEstado {
  id: number;
  usuario: string;
  correo: string;
  passwordHasheado: boolean;
  longitudHash: number;
  formatoHash: string;
}

interface Resumen {
  total: number;
  conHashBcrypt: number;
  textoPlano: number;
  vacios: number;
}

interface PasswordManagerProps {
  onClose: () => void;
  embedded?: boolean;
}

export default function PasswordManager({ onClose, embedded = false }: PasswordManagerProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioEstado[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [hashing, setHashing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(true);

  const getAdminHeaders = (withJson = false) => ({
    'Authorization': `Bearer ${publicAnonKey}`,
    'X-Access-Token': accessToken || '',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
  });

  useEffect(() => {
    cargarEstadoPasswords();
  }, []);

  const cargarEstadoPasswords = async () => {
    try {
      if (!accessToken) {
        setMessage({ type: 'error', text: 'Sesion no disponible. Inicia sesion como admin.' });
        return;
      }

      setLoading(true);
      setMessage(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/check-passwords`, {
        headers: getAdminHeaders(true)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.usuarios || []);
        setResumen(data.resumen);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error al cargar estado de passwords:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

    const hashearPassword = async () => {
    if (!accessToken) {
      setMessage({ type: 'error', text: 'Sesion no disponible. Inicia sesion como admin.' });
      return;
    }

    if (!selectedUser || !newPassword) {
      setMessage({ type: 'error', text: 'Selecciona un usuario e ingresa una contraseña' });
      return;
    }

    try {
      setHashing(true);
      setMessage(null);

      const response = await fetch(`${API_BASE_URL}/auth/hash-password`, {
        method: 'POST',
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          usuario: selectedUser,
          password: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Contraseña hasheada exitosamente para: ${data.usuario}`
        });
        setSelectedUser('');
        setNewPassword('');
        await cargarEstadoPasswords();
      } else {
        throw new Error(data.error || 'Error al hashear contraseña');
      }
    } catch (error: any) {
      console.error('Error al hashear password:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setHashing(false);
    }
  };

  const getIconoEstado = (usuario: UsuarioEstado) => {
    if (usuario.passwordHasheado) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (usuario.longitudHash === 0) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getEstadoTexto = (usuario: UsuarioEstado) => {
    if (usuario.passwordHasheado) {
      return <span className="text-green-600 font-medium">âœ“ Hasheado (bcrypt)</span>;
    } else if (usuario.longitudHash === 0) {
      return <span className="text-red-600 font-medium">âœ— VacÃ­o</span>;
    } else {
      return <span className="text-yellow-600 font-medium">âš  Texto plano</span>;
    }
  };

  const body = (
    <div
      className={`bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
        embedded ? '' : 'max-w-4xl'
      }`}
    >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Gestor de ContraseÃ±as</h2>
                <p className="text-purple-100 text-sm">Verifica y hashea contraseÃ±as con bcrypt</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* GuÃ­a de Ayuda */}
          {showHelp && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Ayuda
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Ocultar
                </button>
              </div>
              <PasswordSetupHelp />
            </div>
          )}
          
          {!showHelp && (
            <button
              onClick={() => setShowHelp(true)}
              className="mb-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Mostrar ayuda
            </button>
          )}

          {/* Resumen */}
          {resumen && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-600 text-sm font-medium mb-1">Total Usuarios</div>
                <div className="text-3xl font-bold text-blue-700">{resumen.total}</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-600 text-sm font-medium mb-1">Con bcrypt</div>
                <div className="text-3xl font-bold text-green-700">{resumen.conHashBcrypt}</div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-600 text-sm font-medium mb-1">Texto Plano</div>
                <div className="text-3xl font-bold text-yellow-700">{resumen.textoPlano}</div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 text-sm font-medium mb-1">VacÃ­os</div>
                <div className="text-3xl font-bold text-red-700">{resumen.vacios}</div>
              </div>
            </div>
          )}

          {/* Mensajes */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Formulario de hasheo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Hashear ContraseÃ±a
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Usuario
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={hashing}
                >
                  <option value="">-- Seleccionar --</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.usuario}>
                      {u.usuario} ({u.correo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva ContraseÃ±a
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa la contraseÃ±a"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={hashing}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={hashearPassword}
                  disabled={hashing || !selectedUser || !newPassword}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {hashing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Hasheando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Hashear
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <strong>ðŸ’¡ Nota:</strong> La contraseÃ±a serÃ¡ hasheada usando bcrypt con salt factor 10 y se guardarÃ¡ en la base de datos.
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Estado de Usuarios</h3>
              <button
                onClick={cargarEstadoPasswords}
                disabled={loading}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-gray-600">Cargando informaciÃ³n...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No se encontraron usuarios en la tabla.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Formato
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Longitud
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getIconoEstado(usuario)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                          {usuario.usuario}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {usuario.correo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getEstadoTexto(usuario)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
                          {usuario.longitudHash} caracteres
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>Importante:</strong> Las contraseÃ±as hasheadas con bcrypt son seguras y no se pueden revertir.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cerrar
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
        className="w-full max-w-4xl p-0 gap-0 border-0 bg-transparent shadow-none rounded-none"
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}

