import React, { useState, useEffect } from 'react';
import { Users, Search, Calendar, Clock, Edit2, X, Save, RefreshCw, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';

interface ActivityVolunteersViewProps {
  accessToken: string;
}

interface ActividadVoluntario {
  id_actividad: string;
  id_usuario: string;
  codigo: string;
  titulo_actividad: string;
  nombre_voluntario: string;
  dni: string;
  horas_total: number;
  fecha_ultima_actualizacion: string;
  area_nombre: string;
  tipo_actividad: string;
}

interface EditingHoras {
  id_actividad: string;
  id_usuario: string;
  nuevasHoras: number;
}

export default function ActivityVolunteersView({ accessToken }: ActivityVolunteersViewProps) {
  const [relaciones, setRelaciones] = useState<ActividadVoluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActividad, setFilterActividad] = useState<string>('todas');
  const [editing, setEditing] = useState<EditingHoras | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRelaciones();
  }, [accessToken]);

  const loadRelaciones = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/actividad-voluntarios`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRelaciones(data.relaciones || []);
      } else {
        console.error('Error al cargar relaciones');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (rel: ActividadVoluntario) => {
    setEditing({
      id_actividad: rel.id_actividad,
      id_usuario: rel.id_usuario,
      nuevasHoras: rel.horas_total
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
  };

  const handleSaveHoras = async () => {
    if (!editing) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/actividad-voluntarios/horas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        },
        body: JSON.stringify({
          id_actividad: editing.id_actividad,
          id_usuario: editing.id_usuario,
          horas_total: editing.nuevasHoras
        })
      });

      if (response.ok) {
        await loadRelaciones();
        setEditing(null);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar las horas');
    } finally {
      setSaving(false);
    }
  };

  // Obtener lista única de actividades para filtro
  const actividadesUnicas = Array.from(new Set(relaciones.map(r => r.codigo)));

  // Filtrar relaciones
  const relacionesFiltradas = relaciones.filter(rel => {
    const matchSearch = searchTerm === '' ||
      rel.nombre_voluntario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.dni.includes(searchTerm) ||
      rel.titulo_actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchActividad = filterActividad === 'todas' || rel.codigo === filterActividad;

    return matchSearch && matchActividad;
  });

  // Estadísticas
  const stats = {
    total: relaciones.length,
    horasTotales: relaciones.reduce((sum, r) => sum + (r.horas_total || 0), 0),
    voluntariosUnicos: new Set(relaciones.map(r => r.id_usuario)).size,
    actividadesUnicas: new Set(relaciones.map(r => r.id_actividad)).size
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actividades ↔ Voluntarios</h2>
          <p className="text-gray-600 mt-1">Relaciones y consolidación de horas trabajadas</p>
        </div>
        <button
          onClick={loadRelaciones}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Relaciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Voluntarios</p>
              <p className="text-2xl font-bold text-purple-600">{stats.voluntariosUnicos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Actividades</p>
              <p className="text-2xl font-bold text-green-600">{stats.actividadesUnicas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por voluntario, DNI, actividad o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Filtro por Actividad */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterActividad}
              onChange={(e) => setFilterActividad(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las actividades</option>
              {actividadesUnicas.map(codigo => (
                <option key={codigo} value={codigo}>{codigo}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-3 text-sm text-gray-600">
          Mostrando <strong>{relacionesFiltradas.length}</strong> de <strong>{stats.total}</strong> relaciones
        </div>
      </div>

      {/* Tabla de Relaciones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : relacionesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No hay relaciones</h3>
            <p className="text-gray-600 mt-1">
              {searchTerm || filterActividad !== 'todas'
                ? 'No se encontraron relaciones con los filtros aplicados'
                : 'Aún no hay voluntarios asignados a actividades'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actividad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Voluntario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Horas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Última Act.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {relacionesFiltradas.map((rel) => {
                  const isEditing = editing?.id_actividad === rel.id_actividad && editing?.id_usuario === rel.id_usuario;
                  
                  return (
                    <tr key={`${rel.id_actividad}-${rel.id_usuario}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <code className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                            {rel.codigo}
                          </code>
                          <p className="text-sm font-medium text-gray-900 mt-1">{rel.titulo_actividad}</p>
                          <p className="text-xs text-gray-500">{rel.tipo_actividad}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rel.nombre_voluntario}</p>
                          <code className="text-xs text-gray-500">DNI: {rel.dni}</code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{rel.area_nombre || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editing.nuevasHoras}
                            onChange={(e) => setEditing({ ...editing, nuevasHoras: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.5"
                            className="w-20 px-2 py-1 border border-blue-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                            disabled={saving}
                          />
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            {rel.horas_total}h
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">
                          {rel.fecha_ultima_actualizacion 
                            ? new Date(rel.fecha_ultima_actualizacion).toLocaleDateString('es-ES')
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleSaveHoras}
                              disabled={saving}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(rel)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar horas"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Esta tabla muestra la relación entre actividades y voluntarios</li>
          <li>Las horas se consolidan desde los registros de KoboToolbox</li>
          <li>Puedes editar manualmente las horas haciendo clic en el ícono ✏️</li>
          <li>Los cambios se guardan en la tabla <code className="bg-blue-100 px-1 rounded">actividad_voluntarios</code></li>
          <li>La "Última Actualización" muestra cuándo se modificaron las horas por última vez</li>
        </ul>
      </div>
    </div>
  );
}
