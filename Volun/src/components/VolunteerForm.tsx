import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { Dialog, DialogContent } from './ui/dialog';

interface VolunteerFormProps {
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
}

interface Area {
  id_area: string;
  nombre: string;
  color: string;
}

const AVAILABILITY_DAYS = [
  { key: 'L', label: 'Lunes' },
  { key: 'M', label: 'Martes' },
  { key: 'X', label: 'Miercoles' },
  { key: 'J', label: 'Jueves' },
  { key: 'V', label: 'Viernes' },
  { key: 'S', label: 'Sabado' },
  { key: 'D', label: 'Domingo' },
] as const;

const AVAILABILITY_DAY_SET = new Set(AVAILABILITY_DAYS.map((day) => day.key));

const normalizeAvailability = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .replace(/[{}"]/g, '')
          .split(/[,\s]+/)
          .filter(Boolean)
      : [];

  const requestedDays = new Set(
    rawValues
      .map((day) => String(day).trim().toUpperCase())
      .filter((day) => AVAILABILITY_DAY_SET.has(day)),
  );

  return AVAILABILITY_DAYS.map((day) => day.key).filter((key) => requestedDays.has(key));
};

export default function VolunteerForm({ onClose, onSuccess, accessToken }: VolunteerFormProps) {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    dni: '',
    correo: '',
    telefono: '',
    id_area: '',
    organizacion: '',
    disponibilidad: [] as string[],
    notas: ''
  });

  // Cargar áreas desde Supabase
  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const loadAreas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/areas`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAreas(data.areas || []);
      }
    } catch (err) {
      console.error('Error cargando áreas:', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAvailabilityDay = (day: string) => {
    setFormData((prev) => {
      const nextDays = prev.disponibilidad.includes(day)
        ? prev.disponibilidad.filter((value) => value !== day)
        : [...prev.disponibilidad, day];

      return {
        ...prev,
        disponibilidad: AVAILABILITY_DAYS.map((item) => item.key).filter((key) => nextDays.includes(key)),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.nombre_completo.trim()) {
        throw new Error('El nombre completo es obligatorio');
      }
      if (!formData.dni.trim()) {
        throw new Error('El DNI es obligatorio');
      }
      if (formData.dni.length < 7 || formData.dni.length > 12) {
        throw new Error('El DNI debe tener entre 7 y 12 caracteres');
      }

      // Crear voluntario
      const payload = {
        ...formData,
        disponibilidad: normalizeAvailability(formData.disponibilidad),
      };

      const response = await fetch(`${API_BASE_URL}/voluntarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear voluntario');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error al crear voluntario:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nuevo Voluntario</h2>
              <p className="text-sm text-gray-600">Agregar voluntario a la base de datos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensaje de éxito */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">¡Voluntario creado exitosamente!</h4>
                <p className="text-sm text-green-700 mt-1">
                  El voluntario ha sido agregado a la base de datos.
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📋 Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Juan Pérez García"
                  disabled={loading || success}
                />
              </div>

              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  maxLength={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: 73184027"
                  disabled={loading || success}
                />
                <p className="text-xs text-gray-500 mt-1">Entre 7 y 12 caracteres</p>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: +51 987654321"
                  disabled={loading || success}
                />
              </div>

              {/* Correo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: juan.perez@example.com"
                  disabled={loading || success}
                />
              </div>
            </div>
          </div>

          {/* Información Organizacional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              🏢 Información Organizacional
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <select
                  name="id_area"
                  value={formData.id_area}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading || success || loadingAreas}
                >
                  <option value="">Sin área asignada</option>
                  {areas.map(area => (
                    <option key={area.id_area} value={area.id_area}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
                {loadingAreas && (
                  <p className="text-xs text-gray-500 mt-1">Cargando áreas...</p>
                )}
              </div>

              {/* Organización */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organización / Procedencia
                </label>
                <input
                  type="text"
                  name="organizacion"
                  value={formData.organizacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Universidad, ONG, etc."
                  disabled={loading || success}
                />
              </div>

              {/* Disponibilidad */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponibilidad
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {AVAILABILITY_DAYS.map((day) => {
                    const isSelected = formData.disponibilidad.includes(day.key);
                    return (
                      <button
                        type="button"
                        key={day.key}
                        onClick={() => toggleAvailabilityDay(day.key)}
                        disabled={loading || success}
                        className={`px-2 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {day.key}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.disponibilidad.length === 0
                    ? 'Sin disponibilidad definida'
                    : `Seleccionado: ${formData.disponibilidad.join(', ')}`}
                </p>
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📝 Notas Adicionales
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Cualquier información adicional relevante..."
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Información Importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>El voluntario se guardará <strong>SOLO en la tabla usuarios</strong></li>
              <li>Se creará automáticamente con <strong>rol = voluntario</strong></li>
              <li>Se generará una contraseña aleatoria segura (voluntario no entra al sistema)</li>
              <li>El DNI debe ser único en el sistema</li>
            </ul>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={loading || success}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Voluntario
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-full max-w-2xl p-0 gap-0 border-0 bg-transparent shadow-none rounded-none"
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}
