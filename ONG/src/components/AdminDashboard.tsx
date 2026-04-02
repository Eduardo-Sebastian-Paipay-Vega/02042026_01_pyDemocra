import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  MapPin, 
  Calendar,
  FileText,
  Shield,
  Wrench,
  Pencil,
  Trash2
} from 'lucide-react';
import AdminPanel from './AdminPanel';
import ConnectionStatus from './ConnectionStatus';
import TokenDiagnostics from './TokenDiagnostics';
import type { User } from '../types/user';
import { getUserRoleLabel, getUserRoleName } from '../types/user';
import { Dialog, DialogContent } from './ui/dialog';

interface Area {
  id_area: number;
  nombre: string;
  estado?: string;
}

interface ActivityType {
  id_tipo_actividad: number;
  nombre: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface UserFormData {
  id?: string;
  username: string;
  email: string;
  password: string;
  name: string;
  dni: string;
  phone: string;
  availability: string[];
  id_rol: number;
  areaId: string;
  organizationId: string;
  id_estado: string;
}

interface RoleOption {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
}

interface EstadoOption {
  id_estado: number;
  nombre: string;
  ambito: string;
  color?: string | null;
  descripcion?: string | null;
}

interface OrganizationOption {
  id_organizacion: number;
  nombre: string;
  id_estado?: number | null;
  fecha_creacion?: string | null;
}

const AVAILABILITY_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const defaultUserFormData = (): UserFormData => ({
  username: '',
  email: '',
  password: '',
  name: '',
  dni: '',
  phone: '',
  availability: [],
  id_rol: 3,
  areaId: '',
  organizationId: '',
  id_estado: '1',
});

export default function AdminDashboard() {
  const { user, accessToken, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'areas' | 'types' | 'locations' | 'logs'>('users');
  
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Forms
  const [userForm, setUserForm] = useState<UserFormData>(defaultUserFormData());
  const [newArea, setNewArea] = useState({ name: '' });
  const [newType, setNewType] = useState({ name: '' });
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [rolesOptions, setRolesOptions] = useState<RoleOption[]>([]);
  const [userEstados, setUserEstados] = useState<EstadoOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [activeTab, accessToken]);

  const loadData = async () => {
    // ValidaciÃ³n estricta del token
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      console.log('âš ï¸ No hay accessToken vÃ¡lido disponible, saltando carga de datos');
      console.log('accessToken:', accessToken);
      setLoading(false);
      return;
    }
    
    // Validar formato JWT
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('âŒ Token con formato invÃ¡lido en AdminDashboard');
      console.error('Expected 3 parts, got:', parts.length);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Cargando datos del tab: ${activeTab}`);
      if (activeTab === 'users') {
        const [usersRes, areasRes, rolesRes, estadosRes, orgsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': accessToken
            }
          }),
          fetch(`${API_BASE_URL}/areas`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': accessToken
            }
          }),
          fetch(`${API_BASE_URL}/roles`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': accessToken
            }
          }),
          fetch(`${API_BASE_URL}/estados?ambito=general`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': accessToken
            }
          }),
          fetch(`${API_BASE_URL}/organizaciones`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': accessToken
            }
          }),
        ]);

        if (usersRes.status !== 'fulfilled') {
          throw new Error('No se pudo cargar usuarios (error de red)');
        }

        if (!usersRes.value.ok) {
          const body = await usersRes.value.json().catch(() => ({}));
          throw new Error(body.error || `Error al cargar usuarios (${usersRes.value.status})`);
        }

        const usersData = await usersRes.value.json();
        const areasData = areasRes.status === 'fulfilled' && areasRes.value.ok
          ? await areasRes.value.json().catch(() => ({}))
          : {};
        const rolesData = rolesRes.status === 'fulfilled' && rolesRes.value.ok
          ? await rolesRes.value.json().catch(() => ({}))
          : {};
        const estadosData = estadosRes.status === 'fulfilled' && estadosRes.value.ok
          ? await estadosRes.value.json().catch(() => ({}))
          : {};
        const orgsData = orgsRes.status === 'fulfilled' && orgsRes.value.ok
          ? await orgsRes.value.json().catch(() => ({}))
          : {};

        setUsers(usersData.users || []);

        const mappedAreas = (areasData.areas || []).map((area: any) => ({
          id_area: Number(area.id_area ?? area.id ?? 0),
          nombre: String(area.nombre ?? area.name ?? '').trim(),
          estado: String(area.estado ?? 'activo'),
        })).filter((area: Area) => Number.isInteger(area.id_area) && area.id_area > 0 && area.nombre);
        setAreas(mappedAreas);

        setRolesOptions((rolesData.roles || []).map((role: any) => ({
          id_rol: Number(role.id_rol),
          nombre: String(role.nombre || '').trim(),
          descripcion: role.descripcion || null,
        })).filter((role: RoleOption) => Number.isInteger(role.id_rol) && role.id_rol > 0 && role.nombre));

        setUserEstados((estadosData.estados || []).map((estado: any) => ({
          id_estado: Number(estado.id_estado),
          nombre: String(estado.nombre || '').trim(),
          ambito: String(estado.ambito || '').trim(),
          color: estado.color || null,
          descripcion: estado.descripcion || null,
        })).filter((estado: EstadoOption) => Number.isInteger(estado.id_estado) && estado.id_estado > 0));

        setOrganizations((orgsData.organizaciones || []).map((org: any) => ({
          id_organizacion: Number(org.id_organizacion),
          nombre: String(org.nombre || '').trim(),
          id_estado: org.id_estado ? Number(org.id_estado) : null,
          fecha_creacion: org.fecha_creacion || null,
        })).filter((org: OrganizationOption) => Number.isInteger(org.id_organizacion) && org.id_organizacion > 0 && org.nombre));

        const catalogErrors: string[] = [];
        if (areasRes.status !== 'fulfilled' || !areasRes.value.ok) catalogErrors.push('areas');
        if (rolesRes.status !== 'fulfilled' || !rolesRes.value.ok) catalogErrors.push('roles');
        if (estadosRes.status !== 'fulfilled' || !estadosRes.value.ok) catalogErrors.push('estados');
        if (orgsRes.status !== 'fulfilled' || !orgsRes.value.ok) catalogErrors.push('organizaciones');
        if (catalogErrors.length > 0) {
          console.warn('Catálogos no cargados completamente:', catalogErrors.join(', '));
        }
      } else if (activeTab === 'areas') {
        const res = await fetch(`${API_BASE_URL}/areas`, {
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken 
          }
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const mappedAreas = (data.areas || []).map((area: any) => ({
          id_area: Number(area.id_area ?? area.id ?? 0),
          nombre: String(area.nombre ?? area.name ?? '').trim(),
          estado: String(area.estado ?? 'activo'),
        })).filter((area: Area) => Number.isInteger(area.id_area) && area.id_area > 0 && area.nombre);
        setAreas(mappedAreas);
      } else if (activeTab === 'types') {
        const res = await fetch(`${API_BASE_URL}/activity-types`, {
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken 
          }
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const mappedTypes = (data.types || []).map((type: any) => ({
          id_tipo_actividad: Number(type.id_tipo_actividad ?? type.id ?? 0),
          nombre: String(type.nombre ?? type.name ?? '').trim(),
        })).filter((type: ActivityType) => Number.isInteger(type.id_tipo_actividad) && type.id_tipo_actividad > 0 && type.nombre);
        setActivityTypes(mappedTypes);
      } else if (activeTab === 'locations') {
        const res = await fetch(`${API_BASE_URL}/locations`, {
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken 
          }
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setLocations(data.locations || []);
      } else if (activeTab === 'logs') {
        const res = await fetch(`${API_BASE_URL}/audit-logs`, {
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken 
          }
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al cargar datos del panel de administracion: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Datos inicializados correctamente');
        setInitialized(true);
        loadData();
      }
    } catch (error) {
      console.error('Error al inicializar:', error);
    }
  };

  const openCreateUserModal = () => {
    const activeEstado = userEstados.find((estado) => (estado.nombre || '').trim().toLowerCase() === 'activo');
    setUserModalMode('create');
    setEditingUserId(null);
    setUserForm({
      ...defaultUserFormData(),
      id_estado: activeEstado ? String(activeEstado.id_estado) : '1',
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (u: User) => {
    setUserModalMode('edit');
    setEditingUserId(u.id);
    setUserForm({
      id: u.id,
      username: u.username || '',
      email: u.email || '',
      password: '',
      name: u.name || '',
      dni: u.dni || '',
      phone: u.phone || '',
      availability: Array.isArray(u.availability) ? u.availability : [],
      id_rol: Number(u.id_rol || 3),
      areaId: u.areaId || '',
      organizationId: u.organizationId || '',
      id_estado: u.id_estado ? String(u.id_estado) : '1',
    });
    setShowUserModal(true);
  };

  const saveUser = async () => {
    try {
      const isEdit = userModalMode === 'edit' && Boolean(editingUserId);
      const endpoint = isEdit ? `${API_BASE_URL}/users/${editingUserId}` : `${API_BASE_URL}/users`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        name: userForm.name.trim(),
        usuario: userForm.username.trim(),
        email: userForm.email.trim(),
        dni: userForm.dni.trim() || null,
        telefono: userForm.phone.trim() || null,
        disponibilidad: userForm.availability,
        id_rol: Number(userForm.id_rol),
        areaId: userForm.areaId === '' ? null : Number(userForm.areaId),
        id_organizacion: userForm.organizationId === '' ? null : Number(userForm.organizationId),
        id_estado: userForm.id_estado === '' ? null : Number(userForm.id_estado),
      };

      if (!isEdit || userForm.password.trim()) {
        payload.password = userForm.password;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isEdit ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setShowUserModal(false);
        setEditingUserId(null);
        setUserForm(defaultUserFormData());
        loadData();
      } else {
        const error = await res.json().catch(() => ({}));
        alert(`Error: ${error.error || 'No se pudo guardar el usuario'}`);
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert('Error al guardar usuario');
    }
  };

  const deleteUser = async (u: User) => {
    const confirmed = window.confirm(`¿Eliminar el usuario "${u.name}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${u.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
        },
      });

      if (res.ok) {
        alert('Usuario eliminado');
        loadData();
      } else {
        const error = await res.json().catch(() => ({}));
        alert(`Error: ${error.error || 'No se pudo eliminar el usuario'}`);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const createArea = async () => {
    try {
      const trimmedName = newArea.name.trim();
      if (!trimmedName) {
        alert('El nombre del área es requerido');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/areas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: trimmedName })
      });

      if (res.ok) {
        alert('Ãrea creada exitosamente');
        setShowAreaModal(false);
        setNewArea({ name: '' });
        loadData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo crear el área'}`);
      }
    } catch (error) {
      console.error('Error al crear Ã¡rea:', error);
    }
  };

  const createType = async () => {
    try {
      const trimmedName = newType.name.trim();
      if (!trimmedName) {
        alert('El nombre del tipo es requerido');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/activity-types`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: trimmedName })
      });

      if (res.ok) {
        alert('Tipo creado exitosamente');
        setShowTypeModal(false);
        setNewType({ name: '' });
        loadData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo crear el tipo'}`);
      }
    } catch (error) {
      console.error('Error al crear tipo:', error);
    }
  };

  const editArea = async (area: Area) => {
    const nombre = window.prompt('Nuevo nombre del área', area.nombre);
    if (nombre === null) return;

    const trimmedName = nombre.trim();
    if (!trimmedName) {
      alert('El nombre del área es requerido');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/areas/${area.id_area}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: trimmedName }),
      });

      if (res.ok) {
        loadData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo actualizar el área'}`);
      }
    } catch (error) {
      console.error('Error al editar área:', error);
    }
  };

  const deleteArea = async (area: Area) => {
    const confirmed = window.confirm(`¿Eliminar el área "${area.nombre}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/areas/${area.id_area}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
        },
      });

      if (res.ok) {
        loadData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo eliminar el área'}`);
      }
    } catch (error) {
      console.error('Error al eliminar área:', error);
    }
  };

  const editType = async (type: ActivityType) => {
    const nombre = window.prompt('Nuevo nombre del tipo de actividad', type.nombre);
    if (nombre === null) return;

    const trimmedName = nombre.trim();
    if (!trimmedName) {
      alert('El nombre del tipo es requerido');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/activity-types/${type.id_tipo_actividad}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: trimmedName }),
      });

      if (res.ok) {
        loadData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo actualizar el tipo de actividad'}`);
      }
    } catch (error) {
      console.error('Error al editar tipo de actividad:', error);
    }
  };

  const deleteType = async (type: ActivityType) => {
    const confirmed = window.confirm(`¿Eliminar el tipo "${type.nombre}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/activity-types/${type.id_tipo_actividad}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken || '',
        },
      });

      if (res.ok) {
        loadData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo eliminar el tipo de actividad'}`);
      }
    } catch (error) {
      console.error('Error al eliminar tipo de actividad:', error);
    }
  };

  const createLocation = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLocation)
      });

      if (res.ok) {
        alert('UbicaciÃ³n creada exitosamente');
        setShowLocationModal(false);
        setNewLocation({ name: '', address: '' });
        loadData();
      }
    } catch (error) {
      console.error('Error al crear ubicaciÃ³n:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'principal': return 'bg-pink-100 text-pink-800';
      case 'trabajador': return 'bg-blue-100 text-blue-800';
      case 'voluntario': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleAvailabilityDay = (day: string) => {
    setUserForm((prev) => {
      const exists = prev.availability.includes(day);
      return {
        ...prev,
        availability: exists
          ? prev.availability.filter((item) => item !== day)
          : [...prev.availability, day],
      };
    });
  };

  const getAreaName = (areaId?: string) => {
    if (!areaId) return '-';
    const area = areas.find((a) => String(a.id_area) === String(areaId));
    return area?.nombre || `#${areaId}`;
  };

  const getOrganizationName = (organizationId?: string | null) => {
    if (!organizationId) return '-';
    const org = organizations.find((item) => String(item.id_organizacion) === String(organizationId));
    return org?.nombre || `#${organizationId}`;
  };

  const getEstadoMeta = (u: User) => {
    const estado = userEstados.find((item) => Number(item.id_estado) === Number(u.id_estado));
    return {
      nombre: estado?.nombre || (u.estado ? u.estado : 'Sin estado'),
      color: estado?.color || u.estadoColor || '#6b7280',
      descripcion: estado?.descripcion || u.estadoDescripcion || null,
    };
  };

  return (
    <>
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
              <p className="text-sm text-gray-600">Bienvenido, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
              >
                <Wrench className="w-5 h-5" />
                Herramientas Admin
              </button>
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'areas'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" />
              Ãreas
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'types'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Tipos de Actividad
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'locations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-5 h-5 inline mr-2" />
              Ubicaciones
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Logs de AuditorÃ­a
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!initialized && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Primera vez aquÃ­?</strong> Inicializa los datos base del sistema (Ã¡reas, tipos, ubicaciones).
            </p>
            <button
              onClick={initializeData}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Inicializar Datos
            </button>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">GestiÃ³n de Usuarios</h2>
              <button
                onClick={openCreateUserModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Crear Usuario
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Org</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha CreaciÃ³n</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.username || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.dni || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.organizationName || getOrganizationName(u.organizationId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getAreaName(u.areaId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(getUserRoleName(u) || '')}`}>
                          {getUserRoleLabel(u)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded-full"
                          style={{
                            color: getEstadoMeta(u).color,
                            backgroundColor: `${getEstadoMeta(u).color}22`,
                          }}
                          title={getEstadoMeta(u).descripcion || undefined}
                        >
                          {getEstadoMeta(u).nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                            title="Editar usuario"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ãreas</h2>
              <button
                onClick={() => setShowAreaModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Nueva Ãrea
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((area) => (
                <div key={area.id_area} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{area.nombre}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editArea(area)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Editar área"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteArea(area)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar área"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Types Tab */}
        {activeTab === 'types' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tipos de Actividad</h2>
              <button
                onClick={() => setShowTypeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Nuevo Tipo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activityTypes.map((type) => (
                <div key={type.id_tipo_actividad} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{type.nombre}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editType(type)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Editar tipo"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteType(type)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar tipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ubicaciones</h2>
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Nueva UbicaciÃ³n
              </button>
            </div>

            <div className="space-y-4">
              {locations.map((loc) => (
                <div key={loc.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">{loc.name}</h3>
                  <p className="text-gray-600">{loc.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Logs de AuditorÃ­a</h2>
            </div>
            
            {/* Token Diagnostics */}
            <div className="mb-6">
              <TokenDiagnostics />
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AcciÃ³n</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* User Modal */}
      {showUserModal && (
        <Dialog
          open={showUserModal}
          onOpenChange={(nextOpen) => {
            if (nextOpen) return;
            setShowUserModal(false);
            setEditingUserId(null);
            setUserForm(defaultUserFormData());
          }}
        >
          <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {userModalMode === 'edit' ? 'Editar Usuario' : 'Crear Usuario'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Username"
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                placeholder={userModalMode === 'edit' ? 'Contrasena (opcional)' : 'Contrasena'}
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="DNI"
                value={userForm.dni}
                onChange={(e) => setUserForm({...userForm, dni: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Telefono"
                value={userForm.phone}
                onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <select
                value={userForm.id_rol}
                onChange={(e) => setUserForm({ ...userForm, id_rol: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {(rolesOptions.length > 0 ? rolesOptions : [
                  { id_rol: 1, nombre: 'admin' },
                  { id_rol: 2, nombre: 'principal' },
                  { id_rol: 3, nombre: 'trabajador' },
                  { id_rol: 4, nombre: 'voluntario' },
                ]).map((role) => (
                  <option key={role.id_rol} value={role.id_rol}>
                    {role.nombre}
                  </option>
                ))}
              </select>
              <select
                value={userForm.id_estado}
                onChange={(e) => setUserForm({ ...userForm, id_estado: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {userEstados.map((estado) => (
                  <option key={estado.id_estado} value={estado.id_estado}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
              <select
                value={userForm.areaId}
                onChange={(e) => setUserForm({ ...userForm, areaId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin area</option>
                {areas.map((area) => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nombre}
                  </option>
                ))}
              </select>
              <select
                value={userForm.organizationId}
                onChange={(e) => setUserForm({ ...userForm, organizationId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin organizacion</option>
                {organizations.map((org) => (
                  <option key={org.id_organizacion} value={org.id_organizacion}>
                    {org.nombre}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2 border rounded-lg p-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Disponibilidad (L,M,X,J,V,S,D)</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_DAYS.map((day) => {
                    const selected = userForm.availability.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailabilityDay(day)}
                        className={`px-3 py-1 text-sm rounded border ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              {userEstados.length > 0 && (
                <div className="md:col-span-2 text-xs text-gray-600 space-y-1">
                  {userEstados.map((estado) => (
                    <p key={`estado-help-${estado.id_estado}`}>
                      <span className="font-semibold text-gray-800">{estado.nombre}:</span>{' '}
                      {estado.descripcion || 'Sin descripcion'}
                    </p>
                  ))}
                </div>
              )}
              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={saveUser}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {userModalMode === 'edit' ? 'Guardar cambios' : 'Crear'}
                </button>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUserId(null);
                    setUserForm(defaultUserFormData());
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <Dialog
          open={showAreaModal}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setShowAreaModal(false);
          }}
        >
          <DialogContent className="w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nueva Ãrea</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del Ãrea"
                value={newArea.name}
                onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={createArea}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowAreaModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Type Modal */}
      {showTypeModal && (
        <Dialog
          open={showTypeModal}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setShowTypeModal(false);
          }}
        >
          <DialogContent className="w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nuevo Tipo de Actividad</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del Tipo"
                value={newType.name}
                onChange={(e) => setNewType({...newType, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={createType}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowTypeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <Dialog
          open={showLocationModal}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setShowLocationModal(false);
          }}
        >
          <DialogContent className="w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nueva UbicaciÃ³n</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="DirecciÃ³n"
                value={newLocation.address}
                onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={createLocation}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </>
  );
}

