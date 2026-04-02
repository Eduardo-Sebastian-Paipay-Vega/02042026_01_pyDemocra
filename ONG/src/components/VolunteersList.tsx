import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, RefreshCw, Clock, TrendingUp, Filter, X } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import VolunteerForm from './VolunteerForm';

interface VolunteersListProps {
  accessToken: string;
}

interface Voluntario {
  id_usuario: string;
  nombre_completo: string;
  dni: string;
  correo: string;
  telefono?: string;
  estado: string;
  organizacion?: string;
  id_area?: string;
  area_nombre?: string;
  disponibilidad?: string[] | string;
  horas_totales: number;
  actividades_totales: number;
}

export default function VolunteersList({ accessToken }: VolunteersListProps) {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  useEffect(() => {
    loadVoluntarios();
  }, [accessToken]);

  const loadVoluntarios = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/voluntarios`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVoluntarios(data.voluntarios || []);
      } else {
        console.error('Error al cargar voluntarios');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const voluntariosFiltrados = voluntarios.filter((vol) => {
    const matchSearch =
      searchTerm === '' ||
      vol.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vol.dni.includes(searchTerm) ||
      (vol.correo && vol.correo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchEstado = filterEstado === 'todos' || vol.estado === filterEstado;

    return matchSearch && matchEstado;
  });

  const stats = {
    total: voluntarios.length,
    activos: voluntarios.filter((v) => v.estado === 'activo').length,
    inactivos: voluntarios.filter((v) => v.estado === 'inactivo').length,
    horasTotales: voluntarios.reduce((sum, v) => sum + (v.horas_totales || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Base de Datos de Voluntarios</h2>
          <p className="text-gray-600 mt-1">Gestion completa de voluntarios (tabla usuarios)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Voluntario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Horas Totales</p>
              <p className="text-2xl font-bold text-orange-600">{stats.horasTotales}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as 'todos' | 'activo' | 'inactivo')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          <button
            onClick={loadVoluntarios}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Mostrando <strong>{voluntariosFiltrados.length}</strong> de <strong>{stats.total}</strong> voluntarios
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : voluntariosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No hay voluntarios</h3>
            <p className="text-gray-600 mt-1">
              {searchTerm || filterEstado !== 'todos'
                ? 'No se encontraron voluntarios con los filtros aplicados'
                : 'Comienza agregando un nuevo voluntario'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Voluntario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">DNI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Organizacion</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Horas</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actividades</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {voluntariosFiltrados.map((vol) => (
                  <tr key={vol.id_usuario} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{vol.nombre_completo}</p>
                        {vol.area_nombre && <p className="text-xs text-gray-500">Area: {vol.area_nombre}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{vol.dni}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {vol.correo && <p className="text-gray-900">{vol.correo}</p>}
                        {vol.telefono && <p className="text-gray-500">{vol.telefono}</p>}
                        {!vol.correo && !vol.telefono && <p className="text-gray-400">Sin contacto</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{vol.organizacion || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {vol.horas_totales || 0}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">{vol.actividades_totales || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          vol.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {vol.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <VolunteerForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            loadVoluntarios();
            setShowForm(false);
          }}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}

