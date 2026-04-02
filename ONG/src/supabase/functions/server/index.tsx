import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { authMiddleware, requireRole, logAudit } from './auth.ts';
import type { User, Volunteer, Activity, Area, ActivityType, Location, Role } from './types.ts';

const app = new Hono();

const corsAllowedOrigins = '*';

// Middleware: CORS + logging
app.use('*', cors({
  origin: corsAllowedOrigins,
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-access-token'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}));
app.use('*', logger(console.log));

// Some proxies require an explicit OPTIONS handler even when CORS middleware is present.
app.options('*', (c) => c.text('', 204));

// Supabase client con SERVICE_ROLE_KEY (bypasea RLS automÃ¡ticamente)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const ROLE_IDS = {
  admin: 1,
  principal: 2,
  trabajador: 3,
  voluntario: 4,
} as const;

const ROLE_NAME_BY_ID: Record<number, Role> = {
  1: 'admin',
  2: 'principal',
  3: 'trabajador',
  4: 'voluntario',
};
const ALLOWED_LOGIN_ROLE_IDS = [ROLE_IDS.admin, ROLE_IDS.principal, ROLE_IDS.trabajador] as const;

const normalizeRoleName = (value: unknown): Role | null => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'jefa') return 'principal';
  if (normalized === 'responsable') return 'trabajador';
  if (normalized === 'admin' || normalized === 'principal' || normalized === 'trabajador' || normalized === 'voluntario') {
    return normalized as Role;
  }
  return null;
};

const extractRoleRelation = (rolesValue: any): { id_rol?: number; nombre?: string } | null => {
  if (!rolesValue) return null;
  if (Array.isArray(rolesValue)) {
    return rolesValue[0] || null;
  }
  return rolesValue;
};

const getRoleIdFromInput = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value) && ROLE_NAME_BY_ID[value]) return value;

  if (typeof value === 'string' && value.trim() !== '') {
    const asNumber = Number(value);
    if (Number.isInteger(asNumber) && ROLE_NAME_BY_ID[asNumber]) return asNumber;

    const roleFromName = normalizeRoleName(value);
    if (roleFromName) return ROLE_IDS[roleFromName];
  }

  return null;
};

const resolveRoleNameFromRecord = (usuario: any): Role | null => {
  const relation = extractRoleRelation(usuario?.roles);
  const relationName = normalizeRoleName(relation?.nombre);
  if (relationName) return relationName;

  const byId = ROLE_NAME_BY_ID[Number(usuario?.id_rol)];
  if (byId) return byId;

  return normalizeRoleName(usuario?.role);
};

const mapDbUserToSystemUser = (usuario: any): User => {
  const roleName = resolveRoleNameFromRecord(usuario) || 'trabajador';
  const roleId = Number(usuario?.id_rol) || ROLE_IDS[roleName];
  const relation = extractRoleRelation(usuario?.roles);
  const organizationRelation = Array.isArray(usuario?.organizaciones)
    ? usuario.organizaciones[0]
    : usuario?.organizaciones;
  const idEstado = Number(usuario?.id_estado);
  const estadoRaw = usuario?.estado_nombre || usuario?.estado || '';

  return {
    id: String(usuario?.id_usuario ?? usuario?.id ?? ''),
    email: usuario?.correo || usuario?.email || '',
    name: usuario?.nombre_completo || usuario?.name || '',
    username: usuario?.usuario || '',
    dni: usuario?.dni || '',
    phone: usuario?.telefono || '',
    availability: normalizeAvailability(usuario?.disponibilidad),
    id_rol: roleId,
    id_estado: Number.isInteger(idEstado) && idEstado > 0 ? idEstado : undefined,
    estado: normalizeEstadoName(estadoRaw) || undefined,
    estadoColor: usuario?.estado_color || null,
    estadoDescripcion: usuario?.estado_descripcion || null,
    roles: {
      id_rol: Number(relation?.id_rol) || roleId,
      nombre: normalizeRoleName(relation?.nombre) || roleName,
    },
    role: roleName,
    areaId: usuario?.id_area !== null && usuario?.id_area !== undefined ? String(usuario.id_area) : undefined,
    organizationId: usuario?.id_organizacion !== null && usuario?.id_organizacion !== undefined
      ? String(usuario.id_organizacion)
      : undefined,
    organizationName: organizationRelation?.nombre || usuario?.organizacion || null,
    createdAt: usuario?.fecha_creacion || usuario?.createdAt || new Date().toISOString(),
  };
};

const getSessionRoleName = (user?: User | null): Role | '' => {
  return normalizeRoleName(user?.roles?.nombre || user?.role || '') || '';
};

const sanitizeUserForResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  username: user.username,
  dni: user.dni,
  phone: user.phone,
  availability: user.availability || [],
  id_rol: user.id_rol,
  id_estado: user.id_estado,
  estado: user.estado,
  estadoColor: user.estadoColor,
  estadoDescripcion: user.estadoDescripcion,
  roles: user.roles,
  areaId: user.areaId,
  organizationId: user.organizationId,
  organizationName: user.organizationName,
  createdAt: user.createdAt,
});

const buildOrganizationNameMap = async (usuarios: any[]): Promise<Map<number, string>> => {
  const organizationIds = Array.from(new Set(
    (usuarios || [])
      .map((usuario: any) => Number(usuario?.id_organizacion))
      .filter((id) => Number.isInteger(id) && id > 0),
  ));

  if (organizationIds.length === 0) return new Map<number, string>();

  const { data: orgRows, error: orgError } = await supabase
    .from('organizaciones')
    .select('id_organizacion, nombre')
    .in('id_organizacion', organizationIds);

  if (orgError) {
    console.warn('No se pudo resolver nombres de organizaciones para usuarios:', orgError.message);
    return new Map<number, string>();
  }

  return new Map<number, string>(
    (orgRows || [])
      .map((row: any) => [Number(row.id_organizacion), String(row.nombre || '').trim()] as const)
      .filter(([id, nombre]) => Number.isInteger(id) && id > 0 && nombre.length > 0),
  );
};

const attachOrganizationName = (usuario: any, orgMap: Map<number, string>) => {
  const organizationId = Number(usuario?.id_organizacion);
  if (!Number.isInteger(organizationId) || organizationId <= 0) return usuario;
  const organizationName = orgMap.get(organizationId);
  if (!organizationName) return usuario;
  return {
    ...usuario,
    organizacion: organizationName,
  };
};

type EstadoAmbito = 'general' | 'actividad' | 'sync';

interface EstadoOption {
  id_estado: number;
  nombre: string;
  ambito: EstadoAmbito;
  color?: string | null;
  descripcion?: string | null;
}

interface EstadoIndex {
  byId: Map<number, EstadoOption>;
  byAmbitoAndName: Map<string, EstadoOption>;
}

const DEFAULT_ESTADOS: EstadoOption[] = [
  { id_estado: 1, nombre: 'Activo', ambito: 'general', color: '#28a745', descripcion: 'Entidad habilitada en el sistema' },
  { id_estado: 2, nombre: 'Inactivo', ambito: 'general', color: '#dc3545', descripcion: 'Entidad deshabilitada o borrada lógicamente' },
  { id_estado: 3, nombre: 'Planificada', ambito: 'actividad', color: '#17a2b8', descripcion: 'Actividad creada pero no iniciada' },
  { id_estado: 4, nombre: 'En Ejecución', ambito: 'actividad', color: '#ffc107', descripcion: 'Actividad ocurriendo ahora' },
  { id_estado: 5, nombre: 'Cerrada', ambito: 'actividad', color: '#28a745', descripcion: 'Actividad finalizada correctamente' },
  { id_estado: 6, nombre: 'Cancelada', ambito: 'actividad', color: '#6c757d', descripcion: 'Actividad suspendida definitivamente' },
  { id_estado: 7, nombre: 'Exitoso', ambito: 'sync', color: '#28a745', descripcion: 'Sincronización completa' },
  { id_estado: 8, nombre: 'Parcial', ambito: 'sync', color: '#ffc107', descripcion: 'Se procesaron algunos datos' },
  { id_estado: 9, nombre: 'Fallido', ambito: 'sync', color: '#dc3545', descripcion: 'Error crítico en la sincronización' },
];

function normalizeEstadoName(value: unknown): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function buildEstadoKey(ambito: EstadoAmbito, nombre: string): string {
  return `${ambito}:${normalizeEstadoName(nombre)}`;
}

const ESTADOS_CACHE_TTL_MS = 60_000;
let estadosIndexCache: EstadoIndex = buildEstadoIndex(DEFAULT_ESTADOS);
let estadosCacheUpdatedAt = 0;

function buildEstadoIndex(estados: EstadoOption[]): EstadoIndex {
  const byId = new Map<number, EstadoOption>();
  const byAmbitoAndName = new Map<string, EstadoOption>();
  for (const estado of estados) {
    if (!estado?.id_estado || !estado?.nombre || !estado?.ambito) continue;
    byId.set(Number(estado.id_estado), estado);
    byAmbitoAndName.set(buildEstadoKey(estado.ambito, estado.nombre), estado);
  }
  return { byId, byAmbitoAndName };
}

const getFallbackEstadoById = (id: number): EstadoOption | null => {
  return DEFAULT_ESTADOS.find((estado) => estado.id_estado === id) || null;
};

const serializeEstadoForResponse = (estado: EstadoOption | null) => {
  if (!estado) return null;
  return {
    id_estado: estado.id_estado,
    nombre: estado.nombre,
    ambito: estado.ambito,
    color: estado.color || null,
    descripcion: estado.descripcion || null,
  };
};

const refreshEstadosCache = async (forceRefresh = false): Promise<EstadoIndex> => {
  const now = Date.now();
  if (!forceRefresh && now - estadosCacheUpdatedAt < ESTADOS_CACHE_TTL_MS && estadosIndexCache.byId.size > 0) {
    return estadosIndexCache;
  }

  const { data, error } = await supabase
    .from('estados')
    .select('id_estado, nombre, ambito, color, descripcion')
    .order('id_estado', { ascending: true });

  if (error) {
    console.warn('No se pudo refrescar catálogo de estados. Se usa fallback local.', error.message);
    return estadosIndexCache;
  }

  const normalized = (data || [])
    .map((estado: any) => {
      const ambito = normalizeEstadoName(estado.ambito);
      if (ambito !== 'general' && ambito !== 'actividad' && ambito !== 'sync') return null;
      return {
        id_estado: Number(estado.id_estado),
        nombre: String(estado.nombre || '').trim(),
        ambito,
        color: estado.color || null,
        descripcion: estado.descripcion || null,
      } as EstadoOption;
    })
    .filter((estado: EstadoOption | null): estado is EstadoOption => Boolean(estado?.id_estado && estado?.nombre));

  if (normalized.length > 0) {
    estadosIndexCache = buildEstadoIndex(normalized);
  }
  estadosCacheUpdatedAt = now;

  return estadosIndexCache;
};

const getEstadoById = async (id: number): Promise<EstadoOption | null> => {
  if (!Number.isInteger(id) || id <= 0) return null;
  const index = await refreshEstadosCache();
  return index.byId.get(id) || getFallbackEstadoById(id);
};

const getEstadoIdByName = async (ambito: EstadoAmbito, estadoName: string): Promise<number | null> => {
  const normalized = normalizeEstadoName(estadoName);
  if (!normalized) return null;
  const index = await refreshEstadosCache();
  const found = index.byAmbitoAndName.get(buildEstadoKey(ambito, normalized));
  if (found) return found.id_estado;
  const fallback = DEFAULT_ESTADOS.find(
    (estado) => estado.ambito === ambito && normalizeEstadoName(estado.nombre) === normalized,
  );
  return fallback?.id_estado || null;
};

const getEstadosByAmbito = async (ambito: EstadoAmbito): Promise<EstadoOption[]> => {
  const index = await refreshEstadosCache();
  const options = Array.from(index.byId.values())
    .filter((estado) => estado.ambito === ambito)
    .sort((a, b) => a.id_estado - b.id_estado);
  if (options.length > 0) return options;
  return DEFAULT_ESTADOS.filter((estado) => estado.ambito === ambito).sort((a, b) => a.id_estado - b.id_estado);
};

const resolveEstadoName = (estadoValue: unknown, idEstadoValue: unknown, ambito: EstadoAmbito, index: EstadoIndex): string => {
  const fromValue = normalizeEstadoName(estadoValue);
  if (fromValue) return fromValue;

  const idEstado = Number(idEstadoValue);
  if (Number.isInteger(idEstado) && idEstado > 0) {
    const byId = index.byId.get(idEstado) || getFallbackEstadoById(idEstado);
    if (byId && byId.ambito === ambito) {
      return normalizeEstadoName(byId.nombre);
    }
  }

  if (ambito === 'general') return 'inactivo';
  if (ambito === 'actividad') return 'planificada';
  return '';
};

// Health check endpoint - respuesta segura sin exponer secretos
app.get('/health', async (c) => {
  const hasJwtSecret = !!Deno.env.get('JWT_SECRET');

  let dbStatus = 'unknown';
  let userCount = 0;
  try {
    const { count, error } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });

    if (error) {
      dbStatus = `error: ${error.message}`;
    } else {
      dbStatus = 'ok';
      userCount = count || 0;
    }
  } catch (err: any) {
    dbStatus = `exception: ${err.message}`;
  }

  return c.json({
    ok: true,
    path: c.req.path,
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      running: true,
      version: '2.1',
      environment: 'production'
    },
    database: {
      status: dbStatus,
      userCount,
      tableExists: dbStatus === 'ok' || dbStatus.includes('ok')
    },
    auth: {
      hasJwtSecret,
    },
    warnings: [
      !hasJwtSecret && 'JWT_SECRET no esta configurado.',
      dbStatus !== 'ok' && `Problema con base de datos: ${dbStatus}`
    ].filter(Boolean),
    corsAllowedOrigins
  });
});

// Test endpoint para verificar acceso a tabla usuarios (solo admin)
app.get('/test-usuarios', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const { data: usuarios, error, count } = await supabase
      .from('usuarios')
      .select('id_usuario, usuario, correo, id_rol, id_estado, roles(id_rol, nombre)', { count: 'exact' })
      .order('id_usuario')
      .limit(10);
    
    if (error) {
      return c.json({ 
        success: false, 
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        details: error
      }, 500);
    }
    
    console.log('âœ… Query exitoso');
    console.log('Usuarios encontrados:', usuarios?.length || 0);
    console.log('Total usuarios:', count);
    console.log('Usuarios:', usuarios);
    
    return c.json({
        success: true,
        usuarios: usuarios || [],
        count: count || 0,
        method: 'Supabase service role'
      });
  } catch (err: any) {
    return c.json({ 
      success: false, 
      error: err.message || 'Error desconocido',
      errorType: err.constructor.name,
    }, 500);
  }
});

// ============================================
// RUTAS DE AUTENTICACIÃ“N
// ============================================

// Registro de usuario (solo Admin)
app.post('/auth/signup', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const actor = c.get('user') as User;
    const body = await c.req.json();
    const { email, password, name, id_rol, areaId, usuario } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'email, password y name son requeridos' }, 400);
    }

    const parsedRoleId = getRoleIdFromInput(id_rol);
    if (!parsedRoleId) {
      return c.json({ error: 'id_rol es requerido y debe ser valido' }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const parsedAreaId = areaId === null || areaId === undefined || areaId === ''
      ? null
      : Number(areaId);
    const activeGeneralId = await getEstadoIdByName('general', 'activo');

    const { data: existingEmail, error: existingEmailError } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('correo', normalizedEmail)
      .maybeSingle();

    if (existingEmailError) {
      throw new Error(`Error al validar correo existente: ${existingEmailError.message}`);
    }

    if (existingEmail) {
      return c.json({ error: 'Ya existe un usuario con ese correo' }, 409);
    }

    const rawUsername = String(usuario || normalizedEmail.split('@')[0] || `user_${Date.now()}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_');
    let finalUsername = rawUsername || `user_${Date.now()}`;

    const { data: existingUsername } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('usuario', finalUsername)
      .maybeSingle();

    if (existingUsername) {
      finalUsername = `${finalUsername}_${Date.now()}`;
    }

    const bcrypt = await import('npm:bcryptjs');
    const passwordHash = await bcrypt.hash(String(password), 10);

    const { data: insertedUser, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        nombre_completo: String(name).trim(),
        correo: normalizedEmail,
        usuario: finalUsername,
        contrasena_hash: passwordHash,
        id_rol: parsedRoleId,
        id_area: Number.isFinite(parsedAreaId) ? parsedAreaId : null,
        id_estado: activeGeneralId || 1,
      })
      .select('*, roles(id_rol, nombre)')
      .single();

    if (insertError || !insertedUser) {
      throw new Error(`Error al crear usuario: ${insertError?.message || 'No se pudo crear usuario'}`);
    }

    const estadoInfo = await getEstadoById(Number(insertedUser.id_estado || activeGeneralId || 1));
    const newUser = mapDbUserToSystemUser({
      ...insertedUser,
      estado_nombre: estadoInfo?.nombre || null,
      estado_color: estadoInfo?.color || null,
      estado_descripcion: estadoInfo?.descripcion || null,
    });
    await kv.set(`users:${newUser.id}`, newUser);

    await logAudit(
      actor.id,
      actor.name,
      'CREATE',
      'user',
      newUser.id,
      { email: normalizedEmail, name, id_rol: parsedRoleId }
    );

    return c.json({ user: sanitizeUserForResponse(newUser) }, 201);
  } catch (error: any) {
    console.error('Error en signup:', error);
    return c.json({ error: `Error interno: ${error.message}` }, 500);
  }
});

// Login usando tabla usuarios personalizada con Supabase (SERVICE_ROLE_KEY bypasea RLS)
app.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    console.log('=== INICIO LOGIN ===');
    console.log('Body recibido:', { usuario: body.usuario || body.email, hasPassword: !!body.password });
    
    const { usuario, password, email } = body;
    
    // Aceptar tanto usuario como email para el login
    const loginField = usuario || email;
    
    if (!loginField || !password) {
      console.error('Usuario/email o password no proporcionados');
      return c.json({ error: 'Usuario/email y contraseÃ±a son requeridos' }, 400);
    }
    
    console.log('Intento de login para:', loginField);
    const activeGeneralId = await getEstadoIdByName('general', 'activo');
    const estadoIndex = await refreshEstadosCache();

    // Consultar tabla usuarios + relacion de roles.
    // No filtrar por estado/rol aqui para poder devolver error correcto
    // y mantener compatibilidad con filas legacy (estado texto sin id_estado).
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*, roles(id_rol, nombre)')
      .or(`usuario.eq.${loginField},correo.eq.${loginField}`)
      .limit(1)
      .single();

    if (error || !usuarios) {
      console.error('Usuario no encontrado:', loginField, error);
      return c.json({ error: 'Credenciales invÃ¡lidas' }, 401);
    }

    console.log('Usuario encontrado en BD:', usuarios.usuario, 'id_rol:', usuarios.id_rol, 'rol:', usuarios?.roles?.nombre);

    if (!ALLOWED_LOGIN_ROLE_IDS.includes(Number(usuarios.id_rol) as typeof ALLOWED_LOGIN_ROLE_IDS[number])) {
      console.warn('Acceso denegado por rol no permitido en login:', usuarios.id_usuario, usuarios.id_rol);
      return c.json({ error: 'Acceso denegado. Solo admin, principal y trabajador pueden iniciar sesion.' }, 403);
    }

    const estadoNombre = resolveEstadoName(usuarios.estado, usuarios.id_estado, 'general', estadoIndex);
    if (estadoNombre !== 'activo') {
      console.warn('Intento de login con usuario inactivo:', usuarios.id_usuario, usuarios.usuario);
      return c.json({ error: 'Usuario inactivo. Contacta al administrador.' }, 401);
    }

    // Compatibilidad: si usuario era legacy (estado texto activo y sin id_estado),
    // se normaliza al nuevo esquema para futuros inicios de sesion.
    if ((!usuarios.id_estado || Number(usuarios.id_estado) <= 0) && Number(activeGeneralId || 1) > 0) {
      const { error: normalizeEstadoError } = await supabase
        .from('usuarios')
        .update({ id_estado: activeGeneralId || 1 })
        .eq('id_usuario', usuarios.id_usuario);
      if (normalizeEstadoError) {
        console.warn('No se pudo normalizar id_estado en login:', normalizeEstadoError.message);
      } else {
        usuarios.id_estado = activeGeneralId || 1;
      }
    }

    // Verificar contraseña unicamente con bcrypt (no se permite texto plano)
    const bcrypt = await import('npm:bcryptjs');
    const isBcryptFormat = /^\$2[aby]\$\d{2}\$/.test(usuarios.contrasena_hash || '');

    if (!isBcryptFormat) {
      return c.json({
        error: 'Credenciales inválidas. La contraseña del usuario no está hasheada con bcrypt.',
        requiresHashing: true,
      }, 401);
    }

    const passwordMatch = await bcrypt.compare(password, usuarios.contrasena_hash);
    if (!passwordMatch) {
      return c.json({ error: 'Credenciales inválidas' }, 401);
    }

    if (!resolveRoleNameFromRecord(usuarios)) {
      console.error('No se pudo resolver rol para usuario:', usuarios.id_usuario, usuarios.id_rol, usuarios.roles);
      return c.json({ error: 'El usuario no tiene un rol valido en la tabla roles' }, 400);
    }

    const estadoInfo = await getEstadoById(Number(usuarios.id_estado));
    const user = mapDbUserToSystemUser({
      ...usuarios,
      estado_nombre: estadoInfo?.nombre || null,
      estado_color: estadoInfo?.color || null,
      estado_descripcion: estadoInfo?.descripcion || null,
    });

    // Guardar en KV para mantener compatibilidad con el resto del sistema
    const kvKey = `users:${user.id}`;
    await kv.set(kvKey, user);

    // Generar JWT personalizado
    const { generateJWT } = await import('./auth.ts');
    const accessToken = await generateJWT(user);

    return c.json({
      access_token: accessToken,
      user: sanitizeUserForResponse(user),
    });
  } catch (error: any) {
    console.error('=== ERROR CRÃTICO EN LOGIN ===');
    console.error('Error completo:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({ error: `Error interno del servidor: ${error.message}` }, 500);
  }
});

// Debug headers - Ver todos los headers recibidos
app.post('/auth/debug-headers', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const allHeaders = Object.fromEntries(c.req.raw.headers.entries());
    const accessToken = c.req.header('X-Access-Token');
    
    console.log('=== DEBUG HEADERS ===');
    console.log('Todos los headers:', allHeaders);
    console.log('X-Access-Token:', accessToken);
    
    // Verificar formato del token
    let tokenAnalysis = null;
    if (accessToken) {
      const trimmed = accessToken.trim();
      const parts = trimmed.split('.');
      
      tokenAnalysis = {
        original_length: accessToken.length,
        trimmed_length: trimmed.length,
        has_whitespace: accessToken !== trimmed,
        parts_count: parts.length,
        is_valid_jwt_format: parts.length === 3,
        first_10_chars: trimmed.substring(0, 10),
        last_10_chars: trimmed.substring(trimmed.length - 10),
        contains_bearer: trimmed.toLowerCase().includes('bearer'),
        parts_lengths: parts.map(p => p.length)
      };
    }
    
    return c.json({
      success: true,
      headers: allHeaders,
      x_access_token: accessToken,
      token_analysis: tokenAnalysis
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Test de JWT (sin authMiddleware para debugging)
app.post('/auth/test-jwt', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token');
    const authHeader = c.req.header('Authorization');
    
    console.log('=== TEST JWT ===');
    console.log('X-Access-Token presente:', !!accessToken);
    console.log('X-Access-Token length:', accessToken?.length);
    console.log('X-Access-Token preview:', accessToken?.substring(0, 50) + '...');
    console.log('Authorization header:', authHeader);
    
    if (!accessToken) {
      return c.json({
        success: false,
        error: 'No se recibiÃ³ X-Access-Token',
        headers: Object.fromEntries(c.req.raw.headers.entries())
      });
    }
    
    // Verificar JWT
    const { verifyJWT } = await import('./auth.ts');
    const payload = await verifyJWT(accessToken);
    
    if (!payload) {
      return c.json({
        success: false,
        error: 'JWT invÃ¡lido o expirado',
        token_preview: accessToken.substring(0, 50) + '...'
      });
    }
    
    // Buscar usuario en KV
    const userData = await kv.get<User>(`users:${payload.userId}`);
    
    return c.json({
      success: true,
      jwt_valido: true,
      payload: payload,
      usuario_en_kv: !!userData,
      usuario_data: userData
    });
  } catch (error: any) {
    console.error('Error en test-jwt:', error);
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// Obtener sesiÃ³n actual
app.get('/auth/session', authMiddleware, async (c) => {
  try {
    const userFromToken = c.get('user') as User;
    const userId = Number(userFromToken.id);
    let sessionUser = mapDbUserToSystemUser(userFromToken);

    if (Number.isFinite(userId) && userId > 0) {
      const { data: dbUser, error: dbUserError } = await supabase
        .from('usuarios')
        .select('*, roles(id_rol, nombre)')
        .eq('id_usuario', userId)
        .maybeSingle();

      if (dbUserError) {
        throw new Error(`Error al cargar usuario desde DB: ${dbUserError.message}`);
      }

      if (dbUser) {
        sessionUser = mapDbUserToSystemUser(dbUser);
        await kv.set(`users:${sessionUser.id}`, sessionUser);
      }
    }

    console.log('Sesion obtenida exitosamente para usuario:', sessionUser.id);
    return c.json({ user: sanitizeUserForResponse(sessionUser) });
  } catch (error: any) {
    console.error('Error al obtener sesion:', error);
    return c.json({ error: 'Error al obtener sesiÃ³n', details: error.message }, 500);
  }
});

// Alias explicito para /me
app.get('/me', authMiddleware, async (c) => {
  try {
    const userFromToken = c.get('user') as User;
    const userId = Number(userFromToken.id);
    let sessionUser = mapDbUserToSystemUser(userFromToken);

    if (Number.isFinite(userId) && userId > 0) {
      const { data: dbUser, error: dbUserError } = await supabase
        .from('usuarios')
        .select('*, roles(id_rol, nombre)')
        .eq('id_usuario', userId)
        .maybeSingle();

      if (dbUserError) {
        throw new Error(`Error al cargar usuario desde DB: ${dbUserError.message}`);
      }

      if (dbUser) {
        sessionUser = mapDbUserToSystemUser(dbUser);
        await kv.set(`users:${sessionUser.id}`, sessionUser);
      }
    }

    return c.json({ user: sanitizeUserForResponse(sessionUser) });
  } catch (error: any) {
    return c.json({ error: 'Error al obtener usuario actual', details: error.message }, 500);
  }
});

// Verificar estado de contraseñas en la tabla usuarios (solo admin)
app.get('/auth/check-passwords', authMiddleware, requireRole('admin'), async (c) => {
  try {
    console.log('=== VERIFICANDO ESTADO DE CONTRASEÃ‘AS ===');
    
    // Obtener todos los usuarios de la tabla
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id_usuario, usuario, correo, contrasena_hash')
      .order('id_usuario');
    
    if (error) {
      console.error('Error al consultar usuarios:', error);
      return c.json({ error: error.message }, 500);
    }
    
    if (!usuarios || usuarios.length === 0) {
      return c.json({ 
        success: true,
        message: 'No hay usuarios en la tabla',
        usuarios: []
      });
    }
    
    // Verificar el formato de cada contraseÃ±a
    const bcrypt = await import('npm:bcryptjs');
    const usuariosConEstado = usuarios.map(u => {
      const hash = u.contrasena_hash || '';
      
      // Los hashes bcrypt comienzan con $2a$, $2b$ o $2y$ seguido del cost factor
      const esBcryptHash = /^\$2[aby]\$\d{2}\$/.test(hash);
      
      return {
        id: u.id_usuario,
        usuario: u.usuario,
        correo: u.correo,
        passwordHasheado: esBcryptHash,
        longitudHash: hash.length,
        formatoHash: esBcryptHash ? 'bcrypt' : (hash.length > 0 ? 'texto_plano' : 'vacio')
      };
    });
    
    const totalUsuarios = usuariosConEstado.length;
    const conHashBcrypt = usuariosConEstado.filter(u => u.passwordHasheado).length;
    const textoPlano = usuariosConEstado.filter(u => !u.passwordHasheado && u.longitudHash > 0).length;
    const vacios = usuariosConEstado.filter(u => u.longitudHash === 0).length;
    
    console.log(`âœ… AnÃ¡lisis completado: ${totalUsuarios} usuarios, ${conHashBcrypt} con bcrypt, ${textoPlano} en texto plano, ${vacios} vacÃ­os`);
    
    return c.json({
      success: true,
      resumen: {
        total: totalUsuarios,
        conHashBcrypt,
        textoPlano,
        vacios
      },
      usuarios: usuariosConEstado
    });
  } catch (error: any) {
    console.error('Error al verificar contraseÃ±as:', error);
    return c.json({ error: `Error interno: ${error.message}` }, 500);
  }
});

// Hashear contraseña (solo admin)
app.post('/auth/hash-password', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const { usuario, password } = await c.req.json();
    
    if (!usuario || !password) {
      return c.json({ error: 'Se requiere usuario y password' }, 400);
    }
    
    console.log(`=== HASHEANDO CONTRASEÃ‘A PARA: ${usuario} ===`);
    
    // Verificar que el usuario existe
    const { data: usuarioExistente, error: errorBusqueda } = await supabase
      .from('usuarios')
      .select('id_usuario, usuario, correo')
      .eq('usuario', usuario)
      .single();
    
    if (errorBusqueda || !usuarioExistente) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }
    
    // Hashear la contraseÃ±a
    const bcrypt = await import('npm:bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Hash generado:', hash.substring(0, 30) + '...');
    
    // Actualizar en la base de datos
    const { error: errorActualizacion } = await supabase
      .from('usuarios')
      .update({ contrasena_hash: hash })
      .eq('usuario', usuario);
    
    if (errorActualizacion) {
      console.error('Error al actualizar contraseÃ±a:', errorActualizacion);
      return c.json({ error: errorActualizacion.message }, 500);
    }
    
    console.log('âœ… ContraseÃ±a hasheada y guardada exitosamente');
    
    return c.json({
      success: true,
      message: `ContraseÃ±a hasheada exitosamente para el usuario: ${usuario}`,
      usuario: usuarioExistente.usuario,
      correo: usuarioExistente.correo
    });
  } catch (error: any) {
    console.error('Error al hashear contraseÃ±a:', error);
    return c.json({ error: `Error interno: ${error.message}` }, 500);
  }
});

// Hashear todas las contraseñas en texto plano (solo admin)
app.post('/auth/hash-all-passwords', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const { passwords } = await c.req.json(); // Array de { usuario, password }
    
    if (!passwords || !Array.isArray(passwords) || passwords.length === 0) {
      return c.json({ error: 'Se requiere un array de passwords con formato { usuario, password }' }, 400);
    }
    
    console.log(`=== HASHEANDO ${passwords.length} CONTRASEÃ‘AS ===`);
    
    const bcrypt = await import('npm:bcryptjs');
    const resultados = [];
    
    for (const item of passwords) {
      try {
        const { usuario, password } = item;
        
        if (!usuario || !password) {
          resultados.push({ usuario, success: false, error: 'Faltan datos' });
          continue;
        }
        
        // Verificar que el usuario existe
        const { data: usuarioExistente, error: errorBusqueda } = await supabase
          .from('usuarios')
          .select('id_usuario')
          .eq('usuario', usuario)
          .single();
        
        if (errorBusqueda || !usuarioExistente) {
          resultados.push({ usuario, success: false, error: 'Usuario no encontrado' });
          continue;
        }
        
        // Hashear
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        // Actualizar
        const { error: errorActualizacion } = await supabase
          .from('usuarios')
          .update({ contrasena_hash: hash })
          .eq('usuario', usuario);
        
        if (errorActualizacion) {
          resultados.push({ usuario, success: false, error: errorActualizacion.message });
        } else {
          resultados.push({ usuario, success: true });
          console.log(`âœ… ${usuario} - ContraseÃ±a hasheada`);
        }
      } catch (err: any) {
        resultados.push({ usuario: item.usuario, success: false, error: err.message });
      }
    }
    
    const exitosos = resultados.filter(r => r.success).length;
    console.log(`âœ… Completado: ${exitosos}/${passwords.length} contraseÃ±as hasheadas`);
    
    return c.json({
      success: true,
      message: `${exitosos}/${passwords.length} contraseÃ±as hasheadas exitosamente`,
      resultados
    });
  } catch (error: any) {
    console.error('Error al hashear contraseÃ±as:', error);
    return c.json({ error: `Error interno: ${error.message}` }, 500);
  }
});

// Debug endpoint para verificar usuarios en KV (solo admin)
app.get('/debug/kv-users', authMiddleware, requireRole('admin'), async (c) => {
  try {
    console.log('=== DEBUG: Listando usuarios en KV ===');
    const users = await kv.getByPrefix<User>('users:');
    console.log('Usuarios encontrados:', users.length);
    
    const userList = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
    }));
    
    return c.json({
      success: true,
      count: users.length,
      users: userList
    });
  } catch (error: any) {
    console.error('Error al listar usuarios de KV:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint para probar JWT (solo admin)
app.get('/debug/test-jwt', authMiddleware, requireRole('admin'), async (c) => {
  try {
    console.log('=== DEBUG: Probando generaciÃ³n y verificaciÃ³n de JWT ===');
    
    // Generar un JWT de prueba
    const { generateJWT, verifyJWT } = await import('./auth.ts');
    
    const testUser: User = {
      id: 'test-123',
      email: 'test@example.com',
      name: 'Test User',
      id_rol: ROLE_IDS.admin,
      roles: { id_rol: ROLE_IDS.admin, nombre: 'admin' },
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    const token = await generateJWT(testUser);
    console.log('Token generado:', token.substring(0, 50) + '...');
    
    // Verificar el token
    const payload = await verifyJWT(token);
    
    if (payload) {
      console.log('âœ… JWT verificado correctamente');
      return c.json({
        success: true,
        message: 'JWT funciona correctamente',
        tokenPreview: token.substring(0, 50) + '...',
        payload: payload
      });
    } else {
      console.error('âŒ JWT no pudo ser verificado');
      return c.json({
        success: false,
        message: 'JWT no pudo ser verificado',
        tokenPreview: token.substring(0, 50) + '...'
      }, 500);
    }
  } catch (error: any) {
    console.error('Error al probar JWT:', error);
    return c.json({ error: error.message, stack: error.stack }, 500);
  }
});

// Debug endpoint para verificar un token específico (solo admin)
app.post('/debug/verify-token', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ error: 'Token no proporcionado' }, 400);
    }
    
    console.log('=== DEBUG: Verificando token proporcionado ===');
    console.log('Token recibido (preview):', token.substring(0, 50) + '...');
    
    const { verifyJWT } = await import('./auth.ts');
    const payload = await verifyJWT(token);
    
    if (payload) {
      console.log('âœ… Token vÃ¡lido');
      
      // Buscar usuario en KV
      const userData = await kv.get<User>(`users:${payload.userId}`);
      
      return c.json({
        success: true,
        message: 'Token vÃ¡lido',
        payload: payload,
        userInKV: !!userData,
        userData: userData ? { id: userData.id, email: userData.email, name: userData.name, role: userData.role } : null
      });
    } else {
      console.error('âŒ Token invÃ¡lido');
      return c.json({
        success: false,
        message: 'Token invÃ¡lido o expirado'
      }, 401);
    }
  } catch (error: any) {
    console.error('Error al verificar token:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint para verificar configuración de JWT_SECRET (solo admin)
app.get('/debug/jwt-config', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const jwtSecret = Deno.env.get('JWT_SECRET');
    const hasSecret = !!jwtSecret;
    
    return c.json({
      success: true,
      jwtSecretConfigured: hasSecret,
      jwtSecretLength: jwtSecret?.length || 0,
      warning: hasSecret ? null : 'JWT_SECRET no esta configurado',
      recommendation: hasSecret ? 'JWT_SECRET configurado correctamente' : 'Por favor configura JWT_SECRET en las variables de entorno de Supabase Edge Function',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error al verificar configuraciÃ³n JWT:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// RUTAS DE USUARIOS (Admin)
// ============================================

app.get('/estados', authMiddleware, async (c) => {
  try {
    const ambitoQuery = normalizeEstadoName(c.req.query('ambito') || '');
    const ambito = ambitoQuery as EstadoAmbito;

    if (ambito && ambito !== 'general' && ambito !== 'actividad' && ambito !== 'sync') {
      return c.json({ error: 'Ambito invalido. Usa general, actividad o sync.' }, 400);
    }

    const estados = ambito
      ? await getEstadosByAmbito(ambito)
      : Array.from((await refreshEstadosCache()).byId.values()).sort((a, b) => a.id_estado - b.id_estado);

    return c.json({
      success: true,
      estados: estados.map((estado) => serializeEstadoForResponse(estado)),
    });
  } catch (error: any) {
    console.error('Error al obtener estados:', error);
    return c.json({ error: `Error al obtener estados: ${error.message}` }, 500);
  }
});

app.get('/roles', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id_rol, nombre, descripcion')
      .order('id_rol', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }

    return c.json({ success: true, roles: roles || [] });
  } catch (error: any) {
    console.error('Error al obtener roles:', error);
    return c.json({ error: `Error al obtener roles: ${error.message}` }, 500);
  }
});

app.get('/organizaciones', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const activeGeneralId = await getEstadoIdByName('general', 'activo');
    const { data: organizaciones, error } = await supabase
      .from('organizaciones')
      .select('id_organizacion, nombre, id_estado, fecha_creacion')
      .eq('id_estado', activeGeneralId || 1)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener organizaciones: ${error.message}`);
    }

    return c.json({ success: true, organizaciones: organizaciones || [] });
  } catch (error: any) {
    console.error('Error al obtener organizaciones:', error);
    return c.json({ error: `Error al obtener organizaciones: ${error.message}` }, 500);
  }
});

// Listar todos los usuarios
const listUsersHandler = async (c: any) => {
  try {
    const estadoIndex = await refreshEstadosCache();
    const { data: dbUsers, error } = await supabase
      .from('usuarios')
      .select('*, roles(id_rol, nombre)')
      .order('id_usuario');

    if (error) {
      throw new Error(`Error al listar usuarios: ${error.message}`);
    }

    const organizationNameMap = await buildOrganizationNameMap(dbUsers || []);

    const users = (dbUsers || []).map((dbUser: any) => {
      const estadoInfo = (() => {
        const idEstado = Number(dbUser?.id_estado);
        if (!Number.isInteger(idEstado) || idEstado <= 0) return null;
        return estadoIndex.byId.get(idEstado) || getFallbackEstadoById(idEstado);
      })();
      const mapped = mapDbUserToSystemUser({
        ...attachOrganizationName(dbUser, organizationNameMap),
        estado_nombre: estadoInfo?.nombre || null,
        estado_color: estadoInfo?.color || null,
        estado_descripcion: estadoInfo?.descripcion || null,
      });
      return {
        ...sanitizeUserForResponse(mapped),
        estadoInfo: serializeEstadoForResponse(estadoInfo),
      };
    });

    return c.json({ users });
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    return c.json({ error: `Error al listar usuarios: ${error.message}` }, 500);
  }
};

app.get('/users', authMiddleware, requireRole('admin'), listUsersHandler);
app.get('/usuarios', authMiddleware, requireRole('admin'), listUsersHandler);

// Crear usuario
app.post('/users', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const actor = c.get('user') as User;
    const body = await c.req.json();
    const {
      email,
      password,
      name,
      id_rol,
      areaId,
      id_area,
      id_organizacion,
      organizationId,
      usuario,
      username,
      dni,
      telefono,
      availability,
      disponibilidad,
      id_estado,
      estado,
    } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'email, password y name son requeridos' }, 400);
    }

    const parsedRoleId = getRoleIdFromInput(id_rol);
    if (!parsedRoleId) {
      return c.json({ error: 'id_rol es requerido y debe ser valido' }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const parsedAreaId = (id_area !== undefined ? id_area : areaId) === null
      || (id_area !== undefined ? id_area : areaId) === undefined
      || (id_area !== undefined ? id_area : areaId) === ''
      ? null
      : Number(id_area !== undefined ? id_area : areaId);
    const rawOrganizationId = id_organizacion !== undefined ? id_organizacion : organizationId;
    const parsedOrganizationId = rawOrganizationId === null || rawOrganizationId === undefined || rawOrganizationId === ''
      ? null
      : Number(rawOrganizationId);
    const activeGeneralId = await getEstadoIdByName('general', 'activo');
    const requestedEstadoId = id_estado !== undefined && id_estado !== null && id_estado !== ''
      ? Number(id_estado)
      : (estado ? await getEstadoIdByName('general', String(estado)) : null);
    const finalEstadoId = Number.isInteger(requestedEstadoId) && requestedEstadoId > 0
      ? requestedEstadoId
      : (activeGeneralId || 1);

    const { data: existingEmail, error: existingEmailError } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('correo', normalizedEmail)
      .maybeSingle();

    if (existingEmailError) {
      throw new Error(`Error al validar correo existente: ${existingEmailError.message}`);
    }

    if (existingEmail) {
      return c.json({ error: 'Ya existe un usuario con ese correo' }, 409);
    }

    const rawUsername = String(usuario || username || normalizedEmail.split('@')[0] || `user_${Date.now()}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_');
    let finalUsername = rawUsername || `user_${Date.now()}`;

    const { data: existingUsername } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('usuario', finalUsername)
      .maybeSingle();

    if (existingUsername) {
      finalUsername = `${finalUsername}_${Date.now()}`;
    }

    const normalizedDni = dni !== undefined && dni !== null ? String(dni).trim() : null;
    const normalizedPhone = telefono !== undefined && telefono !== null ? String(telefono).trim() : null;

    if (normalizedDni) {
      const { data: existingDni, error: existingDniError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('dni', normalizedDni)
        .maybeSingle();
      if (existingDniError) {
        throw new Error(`Error al validar DNI existente: ${existingDniError.message}`);
      }
      if (existingDni) {
        return c.json({ error: 'Ya existe un usuario con ese DNI' }, 409);
      }
    }

    if (normalizedPhone) {
      const { data: existingPhone, error: existingPhoneError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('telefono', normalizedPhone)
        .maybeSingle();
      if (existingPhoneError) {
        throw new Error(`Error al validar telefono existente: ${existingPhoneError.message}`);
      }
      if (existingPhone) {
        return c.json({ error: 'Ya existe un usuario con ese telefono' }, 409);
      }
    }

    const bcrypt = await import('npm:bcryptjs');
    const passwordHash = await bcrypt.hash(String(password), 10);

    const { data: insertedUser, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        nombre_completo: String(name).trim(),
        correo: normalizedEmail,
        usuario: finalUsername,
        contrasena_hash: passwordHash,
        dni: normalizedDni || null,
        telefono: normalizedPhone || null,
        disponibilidad: normalizeAvailability(disponibilidad ?? availability),
        id_rol: parsedRoleId,
        id_area: Number.isFinite(parsedAreaId) ? parsedAreaId : null,
        id_organizacion: Number.isFinite(parsedOrganizationId) ? parsedOrganizationId : null,
        id_estado: finalEstadoId,
      })
      .select('*')
      .single();

    if (insertError || !insertedUser) {
      throw new Error(`Error al crear usuario: ${insertError?.message || 'No se pudo crear usuario'}`);
    }

    const estadoInfo = await getEstadoById(finalEstadoId);
    const organizationNameMap = await buildOrganizationNameMap([insertedUser]);
    const newUser = mapDbUserToSystemUser({
      ...attachOrganizationName(insertedUser, organizationNameMap),
      estado_nombre: estadoInfo?.nombre || null,
      estado_color: estadoInfo?.color || null,
      estado_descripcion: estadoInfo?.descripcion || null,
    });
    await kv.set(`users:${newUser.id}`, newUser);

    await logAudit(
      actor.id,
      actor.name,
      'CREATE',
      'user',
      newUser.id,
      {
        email: normalizedEmail,
        name,
        usuario: finalUsername,
        id_rol: parsedRoleId,
        id_area: Number.isFinite(parsedAreaId) ? parsedAreaId : null,
        id_organizacion: Number.isFinite(parsedOrganizationId) ? parsedOrganizationId : null,
        id_estado: finalEstadoId,
      }
    );

    return c.json({
      user: {
        ...sanitizeUserForResponse(newUser),
        estadoInfo: serializeEstadoForResponse(estadoInfo),
      },
    }, 201);
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    return c.json({ error: `Error al crear usuario: ${error.message}` }, 500);
  }
});

// Actualizar usuario
app.put('/users/:id', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const userId = c.req.param('id');
    const userIdInt = Number(userId);
    const body = await c.req.json();
    const actor = c.get('user') as User;

    if (!Number.isInteger(userIdInt) || userIdInt <= 0) {
      return c.json({ error: 'ID de usuario invalido' }, 400);
    }

    if ('rol' in body || 'tipo_usuario' in body || 'cargo' in body) {
      return c.json({ error: 'Usa id_rol. rol/tipo_usuario/cargo ya no existen.' }, 400);
    }

    const updates: Record<string, any> = {};

    if (body.name !== undefined) updates.nombre_completo = String(body.name).trim();
    if (body.nombre_completo !== undefined) updates.nombre_completo = String(body.nombre_completo).trim();
    if (body.email !== undefined) updates.correo = String(body.email).trim().toLowerCase();
    if (body.correo !== undefined) updates.correo = String(body.correo).trim().toLowerCase();
    if (body.usuario !== undefined) updates.usuario = String(body.usuario).trim().toLowerCase();
    if (body.username !== undefined) updates.usuario = String(body.username).trim().toLowerCase();
    if (body.dni !== undefined) updates.dni = String(body.dni || '').trim() || null;
    if (body.telefono !== undefined) updates.telefono = String(body.telefono || '').trim() || null;
    if (body.phone !== undefined) updates.telefono = String(body.phone || '').trim() || null;
    if (body.availability !== undefined || body.disponibilidad !== undefined) {
      updates.disponibilidad = normalizeAvailability(body.availability ?? body.disponibilidad);
    }
    if (body.id_organizacion !== undefined) {
      if (body.id_organizacion === '' || body.id_organizacion === null) {
        updates.id_organizacion = null;
      } else {
        const parsed = Number(body.id_organizacion);
        if (!Number.isFinite(parsed)) return c.json({ error: 'id_organizacion invalido' }, 400);
        updates.id_organizacion = parsed;
      }
    }
    if (body.organizationId !== undefined && body.id_organizacion === undefined) {
      if (body.organizationId === '' || body.organizationId === null) {
        updates.id_organizacion = null;
      } else {
        const parsed = Number(body.organizationId);
        if (!Number.isFinite(parsed)) return c.json({ error: 'organizationId invalido' }, 400);
        updates.id_organizacion = parsed;
      }
    }
    if (body.id_estado !== undefined) {
      const idEstado = Number(body.id_estado);
      if (!Number.isInteger(idEstado) || idEstado <= 0) {
        return c.json({ error: 'id_estado invalido' }, 400);
      }
      const estadoInfo = await getEstadoById(idEstado);
      if (!estadoInfo || estadoInfo.ambito !== 'general') {
        return c.json({ error: 'id_estado debe pertenecer al ambito general' }, 400);
      }
      updates.id_estado = idEstado;
    }
    if (body.estado !== undefined && updates.id_estado === undefined) {
      const idEstadoFromName = await getEstadoIdByName('general', String(body.estado));
      if (!idEstadoFromName) {
        return c.json({ error: 'estado invalido para ambito general' }, 400);
      }
      updates.id_estado = idEstadoFromName;
    }
    if (body.areaId !== undefined) {
      if (body.areaId === '' || body.areaId === null) {
        updates.id_area = null;
      } else {
        const parsed = Number(body.areaId);
        if (!Number.isFinite(parsed)) return c.json({ error: 'areaId invalido' }, 400);
        updates.id_area = parsed;
      }
    }
    if (body.id_area !== undefined) {
      if (body.id_area === '' || body.id_area === null) {
        updates.id_area = null;
      } else {
        const parsed = Number(body.id_area);
        if (!Number.isFinite(parsed)) return c.json({ error: 'id_area invalido' }, 400);
        updates.id_area = parsed;
      }
    }

    if (body.id_rol !== undefined) {
      const parsedRoleId = getRoleIdFromInput(body.id_rol);
      if (!parsedRoleId) {
        return c.json({ error: 'id_rol invalido' }, 400);
      }
      updates.id_rol = parsedRoleId;
    }

    const passwordRaw = body.password !== undefined ? String(body.password || '').trim() : '';
    if (body.password !== undefined && passwordRaw) {
      const bcrypt = await import('npm:bcryptjs');
      updates.contrasena_hash = await bcrypt.hash(passwordRaw, 10);
    }

    if (updates.correo) {
      const { data: existingEmail, error: existingEmailError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('correo', updates.correo)
        .neq('id_usuario', userIdInt)
        .maybeSingle();
      if (existingEmailError) throw new Error(`Error al validar correo: ${existingEmailError.message}`);
      if (existingEmail) return c.json({ error: 'Ya existe otro usuario con ese correo' }, 409);
    }

    if (updates.usuario) {
      const { data: existingUsername, error: existingUsernameError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('usuario', updates.usuario)
        .neq('id_usuario', userIdInt)
        .maybeSingle();
      if (existingUsernameError) throw new Error(`Error al validar usuario: ${existingUsernameError.message}`);
      if (existingUsername) return c.json({ error: 'Ya existe otro usuario con ese username' }, 409);
    }

    if (updates.dni) {
      const { data: existingDni, error: existingDniError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('dni', updates.dni)
        .neq('id_usuario', userIdInt)
        .maybeSingle();
      if (existingDniError) throw new Error(`Error al validar DNI: ${existingDniError.message}`);
      if (existingDni) return c.json({ error: 'Ya existe otro usuario con ese DNI' }, 409);
    }

    if (updates.telefono) {
      const { data: existingPhone, error: existingPhoneError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('telefono', updates.telefono)
        .neq('id_usuario', userIdInt)
        .maybeSingle();
      if (existingPhoneError) throw new Error(`Error al validar telefono: ${existingPhoneError.message}`);
      if (existingPhone) return c.json({ error: 'Ya existe otro usuario con ese telefono' }, 409);
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'No hay campos validos para actualizar' }, 400);
    }

    const { data: updatedDbUser, error: updateError } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id_usuario', userIdInt)
      .select('*, roles(id_rol, nombre)')
      .maybeSingle();

    if (updateError) {
      throw new Error(`Error al actualizar usuario: ${updateError.message}`);
    }

    if (!updatedDbUser) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    const estadoInfo = await getEstadoById(Number(updatedDbUser.id_estado));
    const organizationNameMap = await buildOrganizationNameMap([updatedDbUser]);
    const updatedUser = mapDbUserToSystemUser({
      ...attachOrganizationName(updatedDbUser, organizationNameMap),
      estado_nombre: estadoInfo?.nombre || null,
      estado_color: estadoInfo?.color || null,
      estado_descripcion: estadoInfo?.descripcion || null,
    });
    await kv.set(`users:${updatedUser.id}`, updatedUser);

    await logAudit(actor.id, actor.name, 'UPDATE', 'user', userId, updates);

    return c.json({
      user: {
        ...sanitizeUserForResponse(updatedUser),
        estadoInfo: serializeEstadoForResponse(estadoInfo),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    return c.json({ error: `Error al actualizar usuario: ${error.message}` }, 500);
  }
});

// Eliminar usuario
app.delete('/users/:id', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const userId = c.req.param('id');
    const userIdInt = Number(userId);
    const actor = c.get('user') as User;

    if (!Number.isInteger(userIdInt) || userIdInt <= 0) {
      return c.json({ error: 'ID de usuario invalido' }, 400);
    }

    if (String(actor.id) === String(userIdInt)) {
      return c.json({ error: 'No puedes eliminar tu propio usuario' }, 400);
    }

    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id_usuario', userIdInt);

    if (deleteError) {
      throw new Error(`Error al eliminar usuario: ${deleteError.message}`);
    }

    await kv.del(`users:${userId}`);
    await logAudit(actor.id, actor.name, 'DELETE', 'user', userId, {});

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return c.json({ error: `Error al eliminar usuario: ${error.message}` }, 500);
  }
});

// ============================================
// RUTAS DE TABLAS AUXILIARES (Admin)
// ============================================

// Ãreas
app.get('/legacy/areas', authMiddleware, async (c) => {
  try {
    const areas = await kv.get<Area[]>('areas') || [];
    return c.json({ areas });
  } catch (error: any) {
    console.error('Error al obtener Ã¡reas:', error);
    return c.json({ error: `Error al obtener Ã¡reas: ${error.message}` }, 500);
  }
});

app.post('/areas', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user') as User;

    const nombre = String(body?.nombre ?? body?.name ?? '').trim();
    if (!nombre) {
      return c.json({ error: 'Nombre de area es requerido' }, 400);
    }
    const activeGeneralId = await getEstadoIdByName('general', 'activo');

    const { data: newArea, error } = await supabase
      .from('areas')
      .insert({
        nombre,
        id_estado: activeGeneralId || 1,
      })
      .select('id_area, nombre, id_estado')
      .single();

    if (error) {
      throw new Error(`Error al crear area: ${error.message}`);
    }

    await logAudit(user.id, user.name, 'CREATE', 'area', String(newArea.id_area), { nombre });

    return c.json({ success: true, area: newArea });
  } catch (error: any) {
    console.error('Error al crear Ã¡rea:', error);
    return c.json({ error: `Error al crear Ã¡rea: ${error.message}` }, 500);
  }
});

app.put('/areas/:id', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const areaId = Number(c.req.param('id'));
    if (!Number.isInteger(areaId) || areaId <= 0) {
      return c.json({ error: 'id_area invalido' }, 400);
    }

    const body = await c.req.json();
    const user = c.get('user') as User;

    const updates: Record<string, unknown> = {};
    if (body?.nombre !== undefined || body?.name !== undefined) {
      const nombre = String(body?.nombre ?? body?.name ?? '').trim();
      if (!nombre) return c.json({ error: 'Nombre de area es requerido' }, 400);
      updates.nombre = nombre;
    }
    if (body?.estado !== undefined) {
      const estadoId = await getEstadoIdByName('general', String(body.estado));
      if (!estadoId) return c.json({ error: 'estado de area invalido' }, 400);
      updates.id_estado = estadoId;
    }
    if (body?.id_estado !== undefined) {
      const estadoId = Number(body.id_estado);
      const estadoInfo = await getEstadoById(estadoId);
      if (!estadoInfo || estadoInfo.ambito !== 'general') {
        return c.json({ error: 'id_estado invalido para area' }, 400);
      }
      updates.id_estado = estadoId;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'No hay campos para actualizar' }, 400);
    }

    const { data: updatedArea, error } = await supabase
      .from('areas')
      .update(updates)
      .eq('id_area', areaId)
      .select('id_area, nombre, id_estado')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar area: ${error.message}`);
    }

    if (!updatedArea) {
      return c.json({ error: 'Area no encontrada' }, 404);
    }

    await logAudit(user.id, user.name, 'UPDATE', 'area', String(areaId), updates);

    return c.json({ success: true, area: updatedArea });
  } catch (error: any) {
    console.error('Error al actualizar area:', error);
    return c.json({ error: `Error al actualizar area: ${error.message}` }, 500);
  }
});

app.delete('/areas/:id', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const areaId = Number(c.req.param('id'));
    if (!Number.isInteger(areaId) || areaId <= 0) {
      return c.json({ error: 'id_area invalido' }, 400);
    }

    const user = c.get('user') as User;
    const inactiveGeneralId = await getEstadoIdByName('general', 'inactivo');
    const { data: deletedArea, error } = await supabase
      .from('areas')
      .update({ id_estado: inactiveGeneralId || 2 })
      .eq('id_area', areaId)
      .select('id_area, nombre, id_estado')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al eliminar area: ${error.message}`);
    }

    if (!deletedArea) {
      return c.json({ error: 'Area no encontrada' }, 404);
    }

    await logAudit(user.id, user.name, 'DELETE', 'area', String(areaId), { id_estado: inactiveGeneralId || 2 });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar area:', error);
    return c.json({ error: `Error al eliminar area: ${error.message}` }, 500);
  }
});

// Tipos de actividad
app.get('/activity-types', authMiddleware, async (c) => {
  try {
    const { data: types, error } = await supabase
      .from('tipos_actividad')
      .select('id_tipo_actividad, nombre')
      .order('nombre');

    if (error) {
      throw new Error(`Error al obtener tipos de actividad: ${error.message}`);
    }

    return c.json({ success: true, types: types || [] });
  } catch (error: any) {
    console.error('Error al obtener tipos de actividad:', error);
    return c.json({ error: `Error al obtener tipos: ${error.message}` }, 500);
  }
});

app.post('/activity-types', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user') as User;

    const nombre = String(body?.nombre ?? body?.name ?? '').trim();
    if (!nombre) {
      return c.json({ error: 'Nombre de tipo de actividad es requerido' }, 400);
    }

    const { data: newType, error } = await supabase
      .from('tipos_actividad')
      .insert({ nombre })
      .select('id_tipo_actividad, nombre')
      .single();

    if (error) {
      throw new Error(`Error al crear tipo de actividad: ${error.message}`);
    }

    await logAudit(user.id, user.name, 'CREATE', 'activity-type', String(newType.id_tipo_actividad), { nombre });

    return c.json({ success: true, type: newType });
  } catch (error: any) {
    console.error('Error al crear tipo de actividad:', error);
    return c.json({ error: `Error al crear tipo: ${error.message}` }, 500);
  }
});

app.put('/activity-types/:id', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const typeId = Number(c.req.param('id'));
    if (!Number.isInteger(typeId) || typeId <= 0) {
      return c.json({ error: 'id_tipo_actividad invalido' }, 400);
    }

    const body = await c.req.json();
    const user = c.get('user') as User;
    const nombre = String(body?.nombre ?? body?.name ?? '').trim();

    if (!nombre) {
      return c.json({ error: 'Nombre de tipo de actividad es requerido' }, 400);
    }

    const { data: updatedType, error } = await supabase
      .from('tipos_actividad')
      .update({ nombre })
      .eq('id_tipo_actividad', typeId)
      .select('id_tipo_actividad, nombre')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar tipo de actividad: ${error.message}`);
    }

    if (!updatedType) {
      return c.json({ error: 'Tipo de actividad no encontrado' }, 404);
    }

    await logAudit(user.id, user.name, 'UPDATE', 'activity-type', String(typeId), { nombre });

    return c.json({ success: true, type: updatedType });
  } catch (error: any) {
    console.error('Error al actualizar tipo de actividad:', error);
    return c.json({ error: `Error al actualizar tipo: ${error.message}` }, 500);
  }
});

app.delete('/activity-types/:id', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const typeId = Number(c.req.param('id'));
    if (!Number.isInteger(typeId) || typeId <= 0) {
      return c.json({ error: 'id_tipo_actividad invalido' }, 400);
    }

    const user = c.get('user') as User;
    const { data: deletedType, error } = await supabase
      .from('tipos_actividad')
      .delete()
      .eq('id_tipo_actividad', typeId)
      .select('id_tipo_actividad, nombre')
      .maybeSingle();

    if (error) {
      throw new Error(`Error al eliminar tipo de actividad: ${error.message}`);
    }

    if (!deletedType) {
      return c.json({ error: 'Tipo de actividad no encontrado' }, 404);
    }

    await logAudit(user.id, user.name, 'DELETE', 'activity-type', String(typeId), {});

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar tipo de actividad:', error);
    return c.json({ error: `Error al eliminar tipo: ${error.message}` }, 500);
  }
});

// Ubicaciones/Sedes
app.get('/locations', authMiddleware, async (c) => {
  try {
    const locations = await kv.get<Location[]>('locations') || [];
    return c.json({ locations });
  } catch (error: any) {
    console.error('Error al obtener ubicaciones:', error);
    return c.json({ error: `Error al obtener ubicaciones: ${error.message}` }, 500);
  }
});

app.post('/locations', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const location = await c.req.json();
    const user = c.get('user') as User;
    
    const locations = await kv.get<Location[]>('locations') || [];
    const newLocation: Location = {
      id: `location-${Date.now()}`,
      ...location,
    };
    
    locations.push(newLocation);
    await kv.set('locations', locations);
    
    await logAudit(user.id, user.name, 'CREATE', 'location', newLocation.id, location);
    
    return c.json({ location: newLocation });
  } catch (error: any) {
    console.error('Error al crear ubicaciÃ³n:', error);
    return c.json({ error: `Error al crear ubicaciÃ³n: ${error.message}` }, 500);
  }
});

// ============================================
// RUTAS DE VOLUNTARIOS
// ============================================

const mapDbVolunteerStatusToLegacy = (estadoNombre?: string | null): 'active' | 'inactive' => {
  const normalized = normalizeEstadoName(estadoNombre);
  if (normalized === 'activo' || normalized === 'active') return 'active';
  return 'inactive';
};

const mapLegacyVolunteerStatusToEstadoName = (status?: string | null): 'activo' | 'inactivo' => {
  if (!status) return 'activo';
  return status === 'active' ? 'activo' : 'inactivo';
};

const parseAreaId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOrganizationId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapDbActivityStatusToLegacy = (estado?: string | null): 'pending' | 'validated' | 'rejected' => {
  const normalized = normalizeEstadoName(estado);
  if (!normalized) return 'pending';
  if (normalized === 'cerrada') return 'validated';
  if (normalized === 'cancelada') return 'rejected';
  if (normalized === 'planificada' || normalized === 'en_ejecucion') return 'pending';
  return 'pending';
};

const resolveUserIdInt = async (user: any, supabaseClient: typeof supabase): Promise<number> => {
  const direct = Number(user?.id);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const email = user?.email;
  const username = user?.username;

  if (email) {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('id_usuario')
      .eq('correo', email)
      .maybeSingle();

    if (!error && data?.id_usuario) return Number(data.id_usuario);
  }

  if (username) {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('id_usuario')
      .eq('usuario', username)
      .maybeSingle();

    if (!error && data?.id_usuario) return Number(data.id_usuario);
  }

  throw new Error('No se pudo resolver id_usuario desde la sesión');
};


const AVAILABILITY_DAY_ORDER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const AVAILABILITY_DAY_SET = new Set<string>(AVAILABILITY_DAY_ORDER);

const normalizeAvailability = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value
          .replace(/[{}"]/g, '')
          .split(/[,\s]+/)
          .filter(Boolean)
      : [];

  const requestedDays = new Set<string>(
    source
      .map((day) => String(day).trim().toUpperCase())
      .filter((day) => AVAILABILITY_DAY_SET.has(day)),
  );

  return AVAILABILITY_DAY_ORDER.filter((day) => requestedDays.has(day));
};

const computeDurationHours = (start?: string | null, end?: string | null): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.round((diffMs / 36e5) * 100) / 100;
};

const resolveOrganizationId = async (requestedOrgId: unknown, userId?: string): Promise<number | null> => {
  const parsedRequestedOrg = parseOrganizationId(requestedOrgId);
  if (parsedRequestedOrg !== null) {
    return parsedRequestedOrg;
  }

  if (!userId) {
    return null;
  }

  const { data: creatorUser } = await supabase
    .from('usuarios')
    .select('id_organizacion')
    .eq('id_usuario', userId)
    .maybeSingle();

  return parseOrganizationId(creatorUser?.id_organizacion);
};

// Listar voluntarios
app.get('/volunteers', authMiddleware, async (c) => {
  try {
    const estadoIndex = await refreshEstadosCache();
    const { data: volunteers, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        nombre_completo,
        dni,
        correo,
        telefono,
        id_area,
        disponibilidad,
        id_estado
      `)
      .eq('id_rol', ROLE_IDS.voluntario)
      .order('id_usuario', { ascending: false });

    if (error) {
      throw new Error(`Error al listar voluntarios: ${error.message}`);
    }

    const volunteerIds = (volunteers || []).map((v: any) => v.id_usuario);
    const statsMap = new Map<string, { totalHours: number; totalActivities: Set<string> }>();

    if (volunteerIds.length > 0) {
      const { data: relaciones, error: relError } = await supabase
        .from('actividad_voluntarios')
        .select('id_usuario, id_actividad, horas_total')
        .in('id_usuario', volunteerIds);

      if (relError) {
        throw new Error(`Error al obtener horas de voluntarios: ${relError.message}`);
      }

      for (const rel of relaciones || []) {
        const key = String(rel.id_usuario);
        if (!statsMap.has(key)) {
          statsMap.set(key, { totalHours: 0, totalActivities: new Set<string>() });
        }
        const current = statsMap.get(key)!;
        current.totalHours += Number(rel.horas_total || 0);
        current.totalActivities.add(String(rel.id_actividad));
      }
    }

    const mappedVolunteers = (volunteers || []).map((v: any) => {
      const stats = statsMap.get(String(v.id_usuario));
      const estadoNombre = resolveEstadoName(null, v.id_estado, 'general', estadoIndex);
      return {
        id: String(v.id_usuario),
        dni: v.dni || '',
        name: v.nombre_completo || '',
        email: v.correo || '',
        phone: v.telefono || '',
        areaId: v.id_area ? String(v.id_area) : '',
        availability: normalizeAvailability(v.disponibilidad),
        status: mapDbVolunteerStatusToLegacy(estadoNombre),
        id_estado: Number(v.id_estado) || null,
        estado: estadoNombre || null,
        totalHours: stats?.totalHours || 0,
        totalActivities: stats?.totalActivities.size || 0,
        createdAt: new Date().toISOString(),
      };
    });

    return c.json({ volunteers: mappedVolunteers });
  } catch (error: any) {
    console.error('Error al listar voluntarios:', error);
    return c.json({ error: `Error al listar voluntarios: ${error.message}` }, 500);
  }
});

// Obtener voluntario por ID
app.get('/volunteers/:id', authMiddleware, async (c) => {
  try {
    const volunteerId = c.req.param('id');
    const estadoIndex = await refreshEstadosCache();
    const cerradaEstadoId = await getEstadoIdByName('actividad', 'cerrada');

    const { data: volunteer, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        nombre_completo,
        dni,
        correo,
        telefono,
        id_area,
        disponibilidad,
        id_estado
      `)
      .eq('id_usuario', volunteerId)
      .eq('id_rol', ROLE_IDS.voluntario)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener voluntario: ${error.message}`);
    }

    if (!volunteer) {
      return c.json({ error: 'Voluntario no encontrado' }, 404);
    }

    const { data: relaciones, error: relError } = await supabase
      .from('actividad_voluntarios')
      .select('id_actividad, horas_total')
      .eq('id_usuario', volunteerId);

    if (relError) {
      throw new Error(`Error al obtener relaciones de voluntario: ${relError.message}`);
    }

    const activityIds = [...new Set((relaciones || []).map((r: any) => r.id_actividad))];
    const stats = (relaciones || []).reduce((acc: any, rel: any) => {
      acc.hours += Number(rel.horas_total || 0);
      acc.activities.add(String(rel.id_actividad));
      return acc;
    }, { hours: 0, activities: new Set<string>() });

    let activities: any[] = [];
    if (activityIds.length > 0) {
      const { data: dbActivities, error: activitiesError } = await supabase
        .from('actividades')
        .select('id_actividad, titulo, fecha_inicio, fecha_fin, id_responsable, id_estado')
        .in('id_actividad', activityIds)
        .eq('id_estado', cerradaEstadoId || 5)
        .order('fecha_inicio', { ascending: false });

      if (activitiesError) {
        throw new Error(`Error al obtener actividades del voluntario: ${activitiesError.message}`);
      }

      const responsibleIds = [...new Set((dbActivities || []).map((a: any) => a.id_responsable).filter(Boolean))];
      const responsibleMap = new Map<string, string>();

      if (responsibleIds.length > 0) {
        const { data: responsables, error: respError } = await supabase
          .from('usuarios')
          .select('id_usuario, nombre_completo')
          .in('id_usuario', responsibleIds);

        if (respError) {
          throw new Error(`Error al obtener responsables: ${respError.message}`);
        }

        for (const resp of responsables || []) {
          responsibleMap.set(String(resp.id_usuario), resp.nombre_completo || 'Sin responsable');
        }
      }

      activities = (dbActivities || []).map((activity: any) => ({
        id: String(activity.id_actividad),
        title: activity.titulo || 'Sin titulo',
        startDate: activity.fecha_inicio,
        duration: computeDurationHours(activity.fecha_inicio, activity.fecha_fin),
        responsibleName: responsibleMap.get(String(activity.id_responsable)) || 'Sin responsable',
      }));
    }

    const mappedVolunteer = {
      id: String(volunteer.id_usuario),
      dni: volunteer.dni || '',
      name: volunteer.nombre_completo || '',
      email: volunteer.correo || '',
      phone: volunteer.telefono || '',
      areaId: volunteer.id_area ? String(volunteer.id_area) : '',
      availability: normalizeAvailability(volunteer.disponibilidad),
      status: mapDbVolunteerStatusToLegacy(resolveEstadoName(null, volunteer.id_estado, 'general', estadoIndex)),
      id_estado: Number(volunteer.id_estado) || null,
      estado: resolveEstadoName(null, volunteer.id_estado, 'general', estadoIndex),
      totalHours: stats.hours || 0,
      totalActivities: stats.activities.size || 0,
      createdAt: new Date().toISOString(),
    };

    return c.json({ 
      volunteer: mappedVolunteer,
      activities
    });
  } catch (error: any) {
    console.error('Error al obtener voluntario:', error);
    return c.json({ error: `Error al obtener voluntario: ${error.message}` }, 500);
  }
});

// Historial de horas KoBo por voluntario (actividad_voluntarios + actividades + evidencias)
app.get('/voluntarios/:id/historial-horas', authMiddleware, async (c) => {
  try {
    const volunteerId = Number(c.req.param('id'));

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return c.json({ success: false, error: 'ID de voluntario invalido' }, 400);
    }

    const { data, error } = await supabase
      .from('actividad_voluntarios')
      .select(`
        id_actividad,
        id_usuario,
        horas_total,
        kobo_submission_id,
        fecha_ultima_actualizacion,
        actividades (
          id_actividad,
          codigo,
          titulo,
          descripcion,
          fecha_inicio,
          fecha_fin,
          evidencias (
            id_evidencia,
            url_archivo,
            tipo_archivo,
            nombre_original,
            fecha_subida
          )
        )
      `)
      .eq('id_usuario', volunteerId)
      .not('kobo_submission_id', 'is', null)
      .order('fecha_ultima_actualizacion', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener historial de horas: ${error.message}`);
    }

    const items = (data || []).map((row: any) => ({
      id_actividad: row.id_actividad,
      id_usuario: row.id_usuario,
      horas_total: Number(row.horas_total || 0),
      kobo_submission_id: row.kobo_submission_id || null,
      fecha_ultima_actualizacion: row.fecha_ultima_actualizacion || null,
      actividad: row.actividades
        ? {
            id_actividad: row.actividades.id_actividad ?? null,
            codigo: row.actividades.codigo ?? null,
            titulo: row.actividades.titulo ?? null,
            descripcion: row.actividades.descripcion ?? null,
            fecha_inicio: row.actividades.fecha_inicio ?? null,
            fecha_fin: row.actividades.fecha_fin ?? null,
            evidencias: Array.isArray(row.actividades.evidencias) ? row.actividades.evidencias : [],
          }
        : null,
    }));

    const horas_total_kobo = items.reduce((sum: number, item: any) => sum + (Number(item.horas_total) || 0), 0);

    const { data: totalRows, error: totalError } = await supabase
      .from('actividad_voluntarios')
      .select('horas_total')
      .eq('id_usuario', volunteerId);

    const horas_total_bd = totalError
      ? null
      : (totalRows || []).reduce((sum: number, row: any) => sum + (Number(row?.horas_total) || 0), 0);

    return c.json({
      success: true,
      items,
      totals: {
        items_count: items.length,
        horas_total_kobo,
        horas_total_bd,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener historial de horas:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.put('/volunteers/:id', authMiddleware, async (c) => {
  try {
    const actor = c.get('user') as User;
    const actorRole = getSessionRoleName(actor);
    const volunteerId = Number(c.req.param('id'));
    const updates = await c.req.json();
    const estadoIndex = await refreshEstadosCache();

    if (!['admin', 'principal', 'trabajador'].includes(actorRole)) {
      return c.json({ error: 'Sin permisos para actualizar voluntarios' }, 403);
    }

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return c.json({ error: 'ID de voluntario invalido' }, 400);
    }

    const { data: existingVolunteer, error: existingError } = await supabase
      .from('usuarios')
      .select('id_usuario, id_rol')
      .eq('id_usuario', volunteerId)
      .eq('id_rol', ROLE_IDS.voluntario)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Error al validar voluntario: ${existingError.message}`);
    }

    if (!existingVolunteer) {
      return c.json({ error: 'Voluntario no encontrado' }, 404);
    }

    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.nombre_completo = String(updates.name).trim();
    if (updates.nombre_completo !== undefined) updateData.nombre_completo = String(updates.nombre_completo).trim();
    if (updates.dni !== undefined) updateData.dni = String(updates.dni).trim();
    if (updates.email !== undefined) updateData.correo = String(updates.email).trim().toLowerCase() || null;
    if (updates.correo !== undefined) updateData.correo = String(updates.correo).trim().toLowerCase() || null;
    if (updates.phone !== undefined) updateData.telefono = String(updates.phone || '').trim() || null;
    if (updates.telefono !== undefined) updateData.telefono = String(updates.telefono || '').trim() || null;
    if (updates.areaId !== undefined) updateData.id_area = parseAreaId(updates.areaId);
    if (updates.id_area !== undefined) updateData.id_area = parseAreaId(updates.id_area);
    if (updates.availability !== undefined || updates.disponibilidad !== undefined) {
      updateData.disponibilidad = normalizeAvailability(updates.availability ?? updates.disponibilidad);
    }

    if (updates.id_estado !== undefined) {
      const estadoId = Number(updates.id_estado);
      const estadoInfo = await getEstadoById(estadoId);
      if (!estadoInfo || estadoInfo.ambito !== 'general') {
        return c.json({ error: 'id_estado invalido para voluntario' }, 400);
      }
      updateData.id_estado = estadoId;
    } else if (updates.estado !== undefined || updates.status !== undefined) {
      const estadoNameInput = updates.estado !== undefined
        ? String(updates.estado)
        : mapLegacyVolunteerStatusToEstadoName(String(updates.status || ''));
      const estadoId = await getEstadoIdByName('general', estadoNameInput);
      if (!estadoId) {
        return c.json({ error: 'estado/status invalido para voluntario' }, 400);
      }
      updateData.id_estado = estadoId;
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: 'No hay campos validos para actualizar' }, 400);
    }

    const { data: updatedVolunteer, error: updateError } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id_usuario', volunteerId)
      .eq('id_rol', ROLE_IDS.voluntario)
      .select(`
        id_usuario,
        nombre_completo,
        dni,
        correo,
        telefono,
        id_area,
        disponibilidad,
        id_estado
      `)
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar voluntario: ${updateError.message}`);
    }

    const { data: relations } = await supabase
      .from('actividad_voluntarios')
      .select('id_actividad, horas_total')
      .eq('id_usuario', volunteerId);

    const totalHours = (relations || []).reduce((sum: number, rel: any) => sum + Number(rel.horas_total || 0), 0);
    const totalActivities = new Set((relations || []).map((rel: any) => String(rel.id_actividad))).size;

    const estadoNombre = resolveEstadoName(null, updatedVolunteer.id_estado, 'general', estadoIndex);
    const estadoInfo = await getEstadoById(Number(updatedVolunteer.id_estado));

    await logAudit(actor.id, actor.name, 'UPDATE', 'volunteer', String(volunteerId), updateData);

    return c.json({
      volunteer: {
        id: String(updatedVolunteer.id_usuario),
        dni: updatedVolunteer.dni || '',
        name: updatedVolunteer.nombre_completo || '',
        email: updatedVolunteer.correo || '',
        phone: updatedVolunteer.telefono || '',
        areaId: updatedVolunteer.id_area ? String(updatedVolunteer.id_area) : '',
        availability: normalizeAvailability(updatedVolunteer.disponibilidad),
        status: mapDbVolunteerStatusToLegacy(estadoNombre),
        id_estado: Number(updatedVolunteer.id_estado) || null,
        estado: estadoNombre || null,
        estadoInfo: serializeEstadoForResponse(estadoInfo),
        totalHours,
        totalActivities,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar voluntario:', error);
    return c.json({ error: `Error al actualizar voluntario: ${error.message}` }, 500);
  }
});

// Listar actividades (según permisos)
app.get('/activities', authMiddleware, async (c) => {
  try {
	    const user = c.get('user') as User;
	    const sessionRole = getSessionRoleName(user);
	    const userIdInt = await resolveUserIdInt(user, supabase);
	    const estadoIndex = await refreshEstadosCache();
	    const parseIdList = (raw?: string | null): number[] => {
	      if (!raw) return [];
	      return raw
	        .split(',')
	        .map((value) => Number(String(value).trim()))
	        .filter((value) => Number.isInteger(value) && value > 0);
	    };
	
	    const parseIsoDateTimeOrNull = (value?: string | null): string | null => {
	      if (!value) return null;
	      const date = new Date(value);
	      if (Number.isNaN(date.getTime())) return null;
	      return value;
	    };
	
	    const fromIso = parseIsoDateTimeOrNull(c.req.query('from'));
	    const toIso = parseIsoDateTimeOrNull(c.req.query('to'));
	    const estadoIds = parseIdList(c.req.query('estadoIds'));
	    const responsableIds = parseIdList(c.req.query('responsableIds'));
	    const searchRaw = String(c.req.query('search') || '').trim();
	    const searchText = searchRaw
	      .normalize('NFD')
	      .replace(/[\u0300-\u036f]/g, '')
	      .replace(/[^a-zA-Z0-9\\s_-]/g, ' ')
	      .replace(/\\s+/g, ' ')
	      .trim()
	      .slice(0, 120);

	    if (!['admin', 'principal', 'trabajador'].includes(sessionRole)) {
	      return c.json({ activities: [] });
	    }
	
	    let query = supabase
	      .from('actividades')
	      .select(`
	        id_actividad,
	        codigo,
	        titulo,
	        descripcion,
	        objetivo,
	        id_estado,
	        id_tipo_actividad,
	        id_responsable,
	        id_creador,
	        fecha_inicio,
	        fecha_fin,
	        ubicacion_direccion,
	        ubicacion_lat,
	        ubicacion_lng,
	        fecha_creacion
	      `)
	      .order('fecha_creacion', { ascending: false });
	
	    if (sessionRole === 'trabajador') {
	      query = query.eq('id_responsable', userIdInt);
	    }
	
	    if (fromIso) query = query.gte('fecha_inicio', fromIso);
	    if (toIso) query = query.lte('fecha_inicio', toIso);
	    if (estadoIds.length > 0) query = query.in('id_estado', estadoIds);
	    if (responsableIds.length > 0) query = query.in('id_responsable', responsableIds);
	    if (searchText) {
	      const pattern = `%${searchText}%`;
	      query = query.or(`codigo.ilike.${pattern},titulo.ilike.${pattern},descripcion.ilike.${pattern}`);
	    }
	
	    const { data: dbActivities, error } = await query;

	    if (error) {
	      throw new Error(`Error al listar actividades: ${error.message}`);
	    }

	    const filteredActivities = dbActivities || [];

    const userIds = new Set<number>();
    for (const activity of filteredActivities) {
      if (activity.id_responsable) userIds.add(Number(activity.id_responsable));
      if (activity.id_creador) userIds.add(Number(activity.id_creador));
    }

    const usersMap = new Map<string, string>();
    if (userIds.size > 0) {
      const { data: usuarios, error: usersError } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo')
        .in('id_usuario', Array.from(userIds));

      if (usersError) {
        throw new Error(`Error al obtener usuarios: ${usersError.message}`);
      }

      for (const u of usuarios || []) {
        usersMap.set(String(u.id_usuario), u.nombre_completo || 'Sin nombre');
      }
    }

    const activities = filteredActivities.map((activity: any) => {
      const latRaw = activity.ubicacion_lat;
      const lngRaw = activity.ubicacion_lng;
      const latParsed = latRaw === '' || latRaw === null || latRaw === undefined ? null : Number(latRaw);
      const lngParsed = lngRaw === '' || lngRaw === null || lngRaw === undefined ? null : Number(lngRaw);
      const latValue = Number.isFinite(latParsed) ? latParsed : null;
      const lngValue = Number.isFinite(lngParsed) ? lngParsed : null;
      const estadoNombre = resolveEstadoName(activity.estado, activity.id_estado, 'actividad', estadoIndex);
      const estadoInfo = estadoIndex.byAmbitoAndName.get(buildEstadoKey('actividad', estadoNombre))
        || getFallbackEstadoById(Number(activity.id_estado));

      return {
        id_actividad: activity.id_actividad,
        codigo: activity.codigo || '',
        titulo: activity.titulo || 'Sin titulo',
        descripcion: activity.descripcion ?? null,
        objetivo: activity.objetivo ?? null,
        estado: estadoNombre || 'planificada',
        id_estado: Number(activity.id_estado) || estadoInfo?.id_estado || null,
        estadoColor: estadoInfo?.color || null,
        estadoDescripcion: estadoInfo?.descripcion || null,
        status: mapDbActivityStatusToLegacy(estadoNombre),
        id_tipo_actividad: activity.id_tipo_actividad ?? null,
        id_responsable: activity.id_responsable ?? null,
        id_creador: activity.id_creador ?? null,
        fecha_inicio: activity.fecha_inicio || null,
        fecha_fin: activity.fecha_fin || null,
        ubicacion_direccion: activity.ubicacion_direccion || null,
        ubicacion_lat: latValue,
        ubicacion_lng: lngValue,
        fecha_creacion: activity.fecha_creacion || null,
        responsableName: usersMap.get(String(activity.id_responsable)) || 'Sin responsable',
        creadorName: usersMap.get(String(activity.id_creador)) || 'Sin creador',
      };
    });

    return c.json({ activities });
  } catch (error: any) {
    console.error('Error al listar actividades:', error);
    return c.json({ error: `Error al listar actividades: ${error.message}` }, 500);
  }
});
// Crear actividad
app.post('/activities', authMiddleware, async (c) => {
  try {
    return c.json(
      {
        error: 'Endpoint deprecated. Usa POST /actividades.',
      },
      410,
    );
  } catch (error: any) {
    console.error('Error al crear actividad:', error);
    return c.json({ error: `Error al crear actividad: ${error.message}` }, 500);
  }
});

// Actualizar actividad
app.put('/activities/:id', authMiddleware, async (c) => {
  try {
    return c.json(
      {
        error: 'Endpoint deprecated. Usa PUT /actividades.',
      },
      410,
    );
  } catch (error: any) {
    console.error('Error al actualizar actividad:', error);
    return c.json({ error: `Error al actualizar actividad: ${error.message}` }, 500);
  }
});

// Validar/Rechazar actividad (solo Principal)
app.post('/activities/:id/validate', authMiddleware, requireRole('principal'), async (c) => {
  try {
    const activityId = c.req.param('id');
    const { action } = await c.req.json();
    const user = c.get('user') as User;
    const cerradaEstadoId = await getEstadoIdByName('actividad', 'cerrada');
    const canceladaEstadoId = await getEstadoIdByName('actividad', 'cancelada');

    const { data: existingActivity, error: activityError } = await supabase
      .from('actividades')
      .select('id_actividad, id_estado')
      .eq('id_actividad', activityId)
      .maybeSingle();

    if (activityError) {
      throw new Error(`Error al validar actividad: ${activityError.message}`);
    }

    if (!existingActivity) {
      return c.json({ error: 'Actividad no encontrada' }, 404);
    }

    if (action === 'approve') {
      const { data: updatedActivity, error: updateError } = await supabase
        .from('actividades')
        .update({
          id_estado: cerradaEstadoId || 5,
        })
        .eq('id_actividad', activityId)
        .select('id_actividad, id_estado')
        .single();

      if (updateError) {
        throw new Error(`Error al cerrar actividad: ${updateError.message}`);
      }

      const estadoInfo = await getEstadoById(Number(updatedActivity.id_estado));
      const estadoNombre = normalizeEstadoName(estadoInfo?.nombre);
      await logAudit(user.id, user.name, 'CLOSE', 'activity', activityId, { id_estado: cerradaEstadoId || 5 });

      return c.json({
        activity: {
          id: String(updatedActivity.id_actividad),
          id_estado: updatedActivity.id_estado,
          estado: estadoNombre || 'cerrada',
          estadoInfo: serializeEstadoForResponse(estadoInfo),
          status: mapDbActivityStatusToLegacy(estadoNombre),
        },
      });
    }

    if (action === 'reject') {
      const { data: updatedActivity, error: updateError } = await supabase
        .from('actividades')
        .update({
          id_estado: canceladaEstadoId || 6,
        })
        .eq('id_actividad', activityId)
        .select('id_actividad, id_estado')
        .single();

      if (updateError) {
        throw new Error(`Error al actualizar estado: ${updateError.message}`);
      }

      const estadoInfo = await getEstadoById(Number(updatedActivity.id_estado));
      const estadoNombre = normalizeEstadoName(estadoInfo?.nombre);
      await logAudit(user.id, user.name, 'REJECT', 'activity', activityId, { id_estado: canceladaEstadoId || 6 });

      return c.json({
        activity: {
          id: String(updatedActivity.id_actividad),
          id_estado: updatedActivity.id_estado,
          estado: estadoNombre || 'cancelada',
          estadoInfo: serializeEstadoForResponse(estadoInfo),
          status: mapDbActivityStatusToLegacy(estadoNombre),
        },
      });
    }

    return c.json({ error: 'Acción inválida' }, 400);
  } catch (error: any) {
    console.error('Error al validar actividad:', error);
    return c.json({ error: `Error al validar actividad: ${error.message}` }, 500);
  }
});

app.put('/activities/:id/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);
    const activityId = Number(c.req.param('id'));
    const body = await c.req.json();
    const userIdInt = await resolveUserIdInt(user, supabase);

    if (!Number.isInteger(activityId) || activityId <= 0) {
      return c.json({ error: 'id de actividad invalido' }, 400);
    }

    if (!['admin', 'principal', 'trabajador'].includes(sessionRole)) {
      return c.json({ error: 'Sin permisos para actualizar estado' }, 403);
    }

    const requestedEstadoId = body?.id_estado !== undefined && body?.id_estado !== null
      ? Number(body.id_estado)
      : (body?.estado ? await getEstadoIdByName('actividad', String(body.estado)) : null);

    if (!Number.isInteger(requestedEstadoId) || requestedEstadoId <= 0) {
      return c.json({ error: 'id_estado/estado es obligatorio y debe ser valido' }, 400);
    }

    const requestedEstadoInfo = await getEstadoById(requestedEstadoId);
    if (!requestedEstadoInfo || requestedEstadoInfo.ambito !== 'actividad') {
      return c.json({ error: 'El estado no pertenece al ambito actividad' }, 400);
    }

    const { data: existingActivity, error: existingError } = await supabase
      .from('actividades')
      .select('id_actividad, id_responsable, id_estado')
      .eq('id_actividad', activityId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Error al validar actividad: ${existingError.message}`);
    }
    if (!existingActivity) {
      return c.json({ error: 'Actividad no encontrada' }, 404);
    }

    if (sessionRole === 'trabajador' && Number(existingActivity.id_responsable) !== userIdInt) {
      return c.json({ error: 'Sin permisos para actualizar esta actividad' }, 403);
    }

    const { data: updatedActivity, error: updateError } = await supabase
      .from('actividades')
      .update({ id_estado: requestedEstadoId })
      .eq('id_actividad', activityId)
      .select('id_actividad, id_estado')
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar estado de actividad: ${updateError.message}`);
    }

    const estadoInfo = await getEstadoById(Number(updatedActivity.id_estado));
    const estadoNombre = normalizeEstadoName(estadoInfo?.nombre);

    await logAudit(
      user.id,
      user.name,
      'UPDATE_STATUS',
      'activity',
      String(activityId),
      {
        from_id_estado: existingActivity.id_estado,
        to_id_estado: requestedEstadoId,
      },
    );

    return c.json({
      success: true,
      activity: {
        id_actividad: updatedActivity.id_actividad,
        id_estado: updatedActivity.id_estado,
        estado: estadoNombre || null,
        estadoInfo: serializeEstadoForResponse(estadoInfo),
        status: mapDbActivityStatusToLegacy(estadoNombre),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar estado de actividad:', error);
    return c.json({ error: `Error al actualizar estado de actividad: ${error.message}` }, 500);
  }
});

// ============================================
// RUTAS DE REPORTES
// ============================================

// Obtener datos para certificado de voluntario
app.get('/reports/certificate/:volunteerId', authMiddleware, async (c) => {
  try {
    const volunteerId = c.req.param('volunteerId');
    const cerradaEstadoId = await getEstadoIdByName('actividad', 'cerrada');

    const { data: volunteer, error: volunteerError } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre_completo, dni, correo, telefono, id_estado, id_rol, roles(id_rol, nombre)')
      .eq('id_usuario', volunteerId)
      .eq('id_rol', ROLE_IDS.voluntario)
      .maybeSingle();

    if (volunteerError) {
      throw new Error(`Error al obtener voluntario: ${volunteerError.message}`);
    }

    if (!volunteer) {
      return c.json({ error: 'Voluntario no encontrado' }, 404);
    }

    const { data: relations, error: relationsError } = await supabase
      .from('actividad_voluntarios')
      .select('id_actividad, horas_total')
      .eq('id_usuario', volunteerId);

    if (relationsError) {
      throw new Error(`Error al obtener historial del voluntario: ${relationsError.message}`);
    }

    const activityIds = [...new Set((relations || []).map((relation: any) => relation.id_actividad))];
    if (activityIds.length === 0) {
      return c.json({
        volunteer: {
          id: String(volunteer.id_usuario),
          name: volunteer.nombre_completo || '',
          dni: volunteer.dni || '',
          email: volunteer.correo || '',
          phone: volunteer.telefono || '',
          totalHours: 0,
          totalActivities: 0,
        },
        activities: [],
        totalHours: 0,
      });
    }

    const { data: dbActivities, error: activitiesError } = await supabase
      .from('actividades')
      .select('id_actividad, titulo, fecha_inicio, fecha_fin, id_responsable, id_estado')
      .in('id_actividad', activityIds)
      .eq('id_estado', cerradaEstadoId || 5)
      .order('fecha_inicio', { ascending: false });

    if (activitiesError) {
      throw new Error(`Error al obtener actividades validadas: ${activitiesError.message}`);
    }

    const validActivityIds = new Set((dbActivities || []).map((activity: any) => String(activity.id_actividad)));
    const totalHours = (relations || [])
      .filter((relation: any) => validActivityIds.has(String(relation.id_actividad)))
      .reduce((sum: number, relation: any) => sum + Number(relation.horas_total || 0), 0);

    const responsibleIds = [...new Set((dbActivities || []).map((activity: any) => activity.id_responsable).filter(Boolean))];
    const responsibleMap = new Map<string, string>();

    if (responsibleIds.length > 0) {
      const { data: responsables, error: respError } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo')
        .in('id_usuario', responsibleIds);

      if (respError) {
        throw new Error(`Error al obtener responsables: ${respError.message}`);
      }

      for (const responsible of responsables || []) {
        responsibleMap.set(String(responsible.id_usuario), responsible.nombre_completo || 'Sin responsable');
      }
    }

    const activities = (dbActivities || []).map((activity: any) => ({
      id: String(activity.id_actividad),
      title: activity.titulo || 'Sin titulo',
      startDate: activity.fecha_inicio,
      duration: computeDurationHours(activity.fecha_inicio, activity.fecha_fin),
      responsibleName: responsibleMap.get(String(activity.id_responsable)) || 'Sin responsable',
    }));

    return c.json({
      volunteer: {
        id: String(volunteer.id_usuario),
        name: volunteer.nombre_completo || '',
        dni: volunteer.dni || '',
        email: volunteer.correo || '',
        phone: volunteer.telefono || '',
        totalHours,
        totalActivities: activities.length,
      },
      activities,
      totalHours,
    });
  } catch (error: any) {
    console.error('Error al generar certificado:', error);
    return c.json({ error: `Error al generar certificado: ${error.message}` }, 500);
  }
});

// Obtener mÃ©tricas para dashboards
app.get('/reports/metrics', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);
    const userIdInt = await resolveUserIdInt(user, supabase);
    const estadoIndex = await refreshEstadosCache();
    const activeGeneralId = await getEstadoIdByName('general', 'activo');
    const { data: dbActivities, error: activitiesError } = await supabase
      .from('actividades')
      .select('id_actividad, id_estado, id_responsable');

    if (activitiesError) {
      throw new Error(`Error al obtener actividades: ${activitiesError.message}`);
    }

    const activities = dbActivities || [];
    const getActivityLegacyStatus = (activity: any) =>
      mapDbActivityStatusToLegacy(resolveEstadoName(activity.estado, activity.id_estado, 'actividad', estadoIndex));

    if (sessionRole === 'principal' || sessionRole === 'admin') {
      const totalActivities = activities.length;
      const validatedActivities = activities.filter((activity: any) =>
        getActivityLegacyStatus(activity) === 'validated'
      ).length;
      const rejectedActivities = activities.filter((activity: any) =>
        getActivityLegacyStatus(activity) === 'rejected'
      ).length;
      const pendingActivities = totalActivities - validatedActivities - rejectedActivities;

      const { count: activeVolunteersCount, error: volunteerCountError } = await supabase
        .from('usuarios')
        .select('id_usuario', { count: 'exact', head: true })
        .eq('id_rol', ROLE_IDS.voluntario)
        .eq('id_estado', activeGeneralId || 1);

      if (volunteerCountError) {
        throw new Error(`Error al contar voluntarios activos: ${volunteerCountError.message}`);
      }

      const { data: volunteerHours, error: hoursError } = await supabase
        .from('actividad_voluntarios')
        .select('horas_total');

      if (hoursError) {
        throw new Error(`Error al obtener horas de voluntariado: ${hoursError.message}`);
      }

      const totalVolunteerHours = (volunteerHours || []).reduce(
        (sum: number, relation: any) => sum + Number(relation.horas_total || 0),
        0
      );

      const { data: workers, error: workersError } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo, id_rol, roles(id_rol, nombre), id_estado')
        .in('id_rol', [ROLE_IDS.admin, ROLE_IDS.principal, ROLE_IDS.trabajador])
        .eq('id_estado', activeGeneralId || 1)
        .order('nombre_completo');

      if (workersError) {
        throw new Error(`Error al obtener trabajadores: ${workersError.message}`);
      }

      const activityByWorker = (workers || []).map((worker: any) => {
        const workerActivities = activities.filter(
          (activity: any) => String(activity.id_responsable) === String(worker.id_usuario)
        );
        const workerValidated = workerActivities.filter(
          (activity: any) => getActivityLegacyStatus(activity) === 'validated'
        ).length;
        const workerRejected = workerActivities.filter(
          (activity: any) => getActivityLegacyStatus(activity) === 'rejected'
        ).length;

        return {
          name: worker.nombre_completo || `Usuario ${worker.id_usuario}`,
          total: workerActivities.length,
          validated: workerValidated,
          pending: workerActivities.length - workerValidated - workerRejected,
        };
      });

      return c.json({
        totalActivities,
        pendingActivities,
        validatedActivities,
        rejectedActivities,
        activeVolunteers: activeVolunteersCount || 0,
        totalVolunteerHours,
        activityByWorker,
      });
    }

    if (sessionRole === 'trabajador') {
      const myActivities = activities.filter(
        (activity: any) => Number(activity.id_responsable) === userIdInt
      );
      const myValidated = myActivities.filter(
        (activity: any) => getActivityLegacyStatus(activity) === 'validated'
      ).length;
      const myRejected = myActivities.filter(
        (activity: any) => getActivityLegacyStatus(activity) === 'rejected'
      ).length;
      const myPending = myActivities.length - myValidated - myRejected;

      const myActivityIds = myActivities.map((activity: any) => activity.id_actividad);
      let volunteersManaged = 0;

      if (myActivityIds.length > 0) {
        const { data: relationData, error: relationError } = await supabase
          .from('actividad_voluntarios')
          .select('id_usuario')
          .in('id_actividad', myActivityIds);

        if (relationError) {
          throw new Error(`Error al obtener voluntarios gestionados: ${relationError.message}`);
        }

        volunteersManaged = new Set((relationData || []).map((relation: any) => String(relation.id_usuario))).size;
      }

      return c.json({
        totalActivities: myActivities.length,
        validatedActivities: myValidated,
        pendingActivities: myPending,
        rejectedActivities: myRejected,
        volunteersManaged,
      });
    }

    return c.json({ error: 'Sin permisos' }, 403);
  } catch (error: any) {
    console.error('Error al obtener mÃ©tricas:', error);
    return c.json({ error: `Error al obtener mÃ©tricas: ${error.message}` }, 500);
  }
});

// Logs de auditorÃ­a (solo Admin)
app.get('/audit-logs', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const logs = await kv.getByPrefix('audit:');
    return c.json({ logs: logs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ) });
  } catch (error: any) {
    console.error('Error al obtener logs de auditorÃ­a:', error);
    return c.json({ error: `Error al obtener logs: ${error.message}` }, 500);
  }
});

// Debug endpoint - Ver estado del sistema (solo admin)
app.get('/debug', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const users = await kv.getByPrefix<User>('users:');
    const areas = await kv.get<Area[]>('areas');
    const types = await kv.get<ActivityType[]>('activity-types');
    const locations = await kv.get<Location[]>('locations');
    
    // TambiÃ©n verificar tabla usuarios de Postgres
    let dbUsuarios = 0;
    let dbUsuariosList = [];
    try {
      const { data: usuariosData, error } = await supabase
        .from('usuarios')
        .select('id_usuario, usuario, correo, id_rol, id_estado, roles(id_rol, nombre)')
        .limit(10);
      
      if (!error && usuariosData) {
        dbUsuarios = usuariosData.length;
        dbUsuariosList = usuariosData;
      }
    } catch (err) {
      console.error('Error al consultar tabla usuarios:', err);
    }
    
    return c.json({
      users: users.length,
      usersList: users.map(u => ({ id: u.id, email: u.email, role: u.role })),
      areas: areas?.length || 0,
      types: types?.length || 0,
      locations: locations?.length || 0,
      dbUsuarios,
      dbUsuariosList,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Inicializar datos de prueba y crear admin por defecto (solo admin)
app.post('/init', authMiddleware, requireRole('admin'), async (c) => {
  try {
    console.log('=== Iniciando proceso de inicializaciÃ³n del sistema ===');
    
    // Verificar si ya existe un admin
    const existingUsers = await kv.getByPrefix<User>('users:');
    console.log(`Usuarios existentes en KV: ${existingUsers.length}`);
    
    let adminCreated = false;
    let adminEmail = '';
    let adminPassword = '';

    // Si no hay usuarios, crear el admin por defecto
    if (existingUsers.length === 0) {
      console.log('No se encontraron usuarios, creando administrador por defecto...');
      
      adminEmail = Deno.env.get('INIT_ADMIN_EMAIL') || 'admin@sistema.com';
      adminPassword = Deno.env.get('INIT_ADMIN_PASSWORD') || crypto.randomUUID();
      
      // Primero verificar si el email ya existe en Supabase Auth
      try {
        const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers.users?.find(u => u.email === adminEmail);
        
        let userId: string;
        
        if (existingAuthUser) {
          console.log('Usuario admin ya existe en Supabase Auth, usando ese ID:', existingAuthUser.id);
          userId = existingAuthUser.id;
        } else {
          console.log('Creando nuevo usuario en Supabase Auth...');
          // Crear usuario en Supabase Auth
          const { data, error } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
          });

          if (error) {
            console.error('Error al crear admin en Supabase Auth:', error);
            throw new Error(`No se pudo crear admin en Auth: ${error.message}`);
          }
          
          userId = data.user.id;
          console.log('Usuario admin creado en Supabase Auth con ID:', userId);
        }

        // Guardar datos del admin en KV
        const adminUser: User = {
          id: userId,
          email: adminEmail,
          name: 'Administrador',
          id_rol: ROLE_IDS.admin,
          roles: { id_rol: ROLE_IDS.admin, nombre: 'admin' },
          role: 'admin',
          createdAt: new Date().toISOString(),
        };

        await kv.set(`users:${userId}`, adminUser);
        console.log('Datos del admin guardados en KV con clave:', `users:${userId}`);
        
        // Verificar que se guardÃ³ correctamente
        const savedAdmin = await kv.get<User>(`users:${userId}`);
        console.log('VerificaciÃ³n de admin guardado en KV:', savedAdmin);
        
        adminCreated = true;
      } catch (authError: any) {
        console.error('Error en creaciÃ³n de admin:', authError);
        throw authError;
      }
    } else {
      console.log('Ya existen usuarios en el sistema');
    }

    // Crear Ã¡reas de ejemplo
    console.log('Creando Ã¡reas de ejemplo...');
    const areas: Area[] = [
      { id: 'area-1', name: 'EducaciÃ³n', color: '#3b82f6' },
      { id: 'area-2', name: 'Salud', color: '#10b981' },
      { id: 'area-3', name: 'Medio Ambiente', color: '#22c55e' },
      { id: 'area-4', name: 'Comunitario', color: '#f59e0b' },
    ];
    await kv.set('areas', areas);

    // Crear tipos de actividad
    console.log('Creando tipos de actividad...');
    const types: ActivityType[] = [
      { id: 'type-1', name: 'Taller' },
      { id: 'type-2', name: 'CampaÃ±a' },
      { id: 'type-3', name: 'Evento' },
      { id: 'type-4', name: 'CapacitaciÃ³n' },
    ];
    await kv.set('activity-types', types);

    // Crear ubicaciones
    console.log('Creando ubicaciones...');
    const locations: Location[] = [
      { id: 'loc-1', name: 'Sede Central', address: 'Av. Principal 123' },
      { id: 'loc-2', name: 'Sede Norte', address: 'Calle Norte 456' },
      { id: 'loc-3', name: 'Sede Sur', address: 'Calle Sur 789' },
    ];
    await kv.set('locations', locations);

    console.log('=== Proceso de inicializaciÃ³n completado ===');
    
    // VerificaciÃ³n final
    const finalUsers = await kv.getByPrefix<User>('users:');
    console.log('Total de usuarios despuÃ©s de inicializaciÃ³n:', finalUsers.length);
    console.log('Usuarios:', finalUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));

    return c.json({ 
      success: true, 
      message: 'Sistema inicializado correctamente',
      debug: {
        totalUsers: finalUsers.length,
        adminCreated
      }
    });
  } catch (error: any) {
    console.error('Error al inicializar datos:', error);
    return c.json({ error: `Error en inicializaciÃ³n: ${error.message}` }, 500);
  }
});

// ============================================
// RUTAS DE KOBOTOOLBOX INTEGRATION
// ============================================

import { getKoboClient, KOBO_FORMS } from './kobo.ts';

// Health check de KoboToolbox (requiere sesion activa)
app.get('/kobo/health', authMiddleware, async (c) => {
  try {
    console.log('=== Health Check KoboToolbox ===');
    
    const hasApiKey = !!Deno.env.get('KOBO_API_KEY');
    
    if (!hasApiKey) {
      return c.json({
        status: 'error',
        message: 'KOBO_API_KEY no estÃ¡ configurado',
        details: {
          configured: false,
          formsConfigured: Object.keys(KOBO_FORMS).length
        },
        recommendations: [
          'Configura KOBO_API_KEY en las variables de entorno del Edge Function',
          'La API Key se obtiene desde KoboToolbox â†’ Settings â†’ API',
        ]
      }, 500);
    }
    
    // Intentar conectar con Kobo API
    try {
      const kobo = getKoboClient();
      const assets = await kobo.listAssets();
      
      // Verificar que nuestros formularios especÃ­ficos estÃ©n disponibles
      const asistenciaForm = assets.results?.find((f: any) => f.uid === KOBO_FORMS.ASISTENCIA_HORAS);
      const ejecucionForm = assets.results?.find((f: any) => f.uid === KOBO_FORMS.EJECUCION_EVIDENCIAS);
      
      const warnings = [];
      if (!asistenciaForm) {
        warnings.push('Formulario "Asistencia y Horas" no encontrado');
      }
      if (!ejecucionForm) {
        warnings.push('Formulario "EjecuciÃ³n + Evidencias" no encontrado');
      }
      
      return c.json({
        status: 'ok',
        message: 'Conectado exitosamente a KoboToolbox API',
        timestamp: new Date().toISOString(),
        kobo: {
          connected: true,
          apiKeyConfigured: true,
          totalForms: assets.count || 0,
          formsConfigured: Object.keys(KOBO_FORMS).length,
          forms: {
            asistenciaHoras: {
              found: !!asistenciaForm,
              name: asistenciaForm?.name || 'No encontrado',
              deploymentStatus: asistenciaForm?.deployment__active || false,
              submissionCount: asistenciaForm?.deployment__submission_count || 0
            },
            ejecucionEvidencias: {
              found: !!ejecucionForm,
              name: ejecucionForm?.name || 'No encontrado',
              deploymentStatus: ejecucionForm?.deployment__active || false,
              submissionCount: ejecucionForm?.deployment__submission_count || 0
            }
          }
        },
        warnings: warnings.length > 0 ? warnings : null
      });
    } catch (koboError: any) {
      console.error('Error al conectar con Kobo API:', koboError);
      return c.json({
        status: 'error',
        message: `Error al conectar con KoboToolbox: ${koboError.message}`,
        details: {
          configured: true,
          errorMessage: koboError.message,
          errorType: koboError.constructor.name
        },
        recommendations: [
          'Verifica que la API Key sea correcta',
          'Verifica que tengas acceso a la cuenta de KoboToolbox',
          'Verifica que los formularios existan en tu cuenta'
        ]
      }, 500);
    }
  } catch (error: any) {
    console.error('Error crÃ­tico en health check de Kobo:', error);
    return c.json({
      status: 'error',
      message: `Error interno: ${error.message}`,
      details: {
        errorMessage: error.message,
        stack: error.stack
      }
    }, 500);
  }
});

// Listar todos los formularios de KoboToolbox
app.get('/kobo/forms', authMiddleware, async (c) => {
  try {
    console.log('=== Listando formularios de KoboToolbox ===');
    const kobo = getKoboClient();
    const assets = await kobo.listAssets();
    
    return c.json({
      success: true,
      count: assets.count || 0,
      forms: assets.results || []
    });
  } catch (error: any) {
    console.error('Error al listar formularios de Kobo:', error);
    return c.json({ 
      error: `Error al conectar con KoboToolbox: ${error.message}`,
      details: error.stack 
    }, 500);
  }
});

// Obtener informaciÃ³n de un formulario especÃ­fico
app.get('/kobo/forms/:assetUid', authMiddleware, async (c) => {
  try {
    const assetUid = c.req.param('assetUid');
    console.log(`=== Obteniendo informaciÃ³n del formulario: ${assetUid} ===`);
    
    const kobo = getKoboClient();
    const schema = await kobo.getFormSchema(assetUid);
    
    return c.json({
      success: true,
      form: schema
    });
  } catch (error: any) {
    console.error('Error al obtener formulario de Kobo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Obtener submissions (datos) de un formulario
app.get('/kobo/forms/:assetUid/submissions', authMiddleware, async (c) => {
  try {
    const assetUid = c.req.param('assetUid');
    const query = c.req.query();
    
    console.log(`=== Obteniendo submissions del formulario: ${assetUid} ===`);
    console.log('ParÃ¡metros:', query);
    
    const kobo = getKoboClient();
    const params: any = {};
    
    if (query.limit) params.limit = parseInt(query.limit);
    if (query.start) params.start = parseInt(query.start);
    if (query.query) params.query = query.query;
    if (query.sort) params.sort = query.sort;
    
    const data = await kobo.getSubmissions(assetUid, params);
    
    return c.json({
      success: true,
      count: data.count || 0,
      submissions: data.results || []
    });
  } catch (error: any) {
    console.error('Error al obtener submissions de Kobo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Crear un nuevo submission en KoboToolbox
app.post('/kobo/forms/:assetUid/submissions', authMiddleware, async (c) => {
  try {
    const assetUid = c.req.param('assetUid');
    const data = await c.req.json();
    const user = c.get('user') as User;
    
    console.log(`=== Creando submission en formulario: ${assetUid} ===`);
    console.log('Datos a enviar:', JSON.stringify(data, null, 2));
    
    const kobo = getKoboClient();
    const result = await kobo.createSubmission(assetUid, data);
    
    // Log de auditorÃ­a
    await logAudit(
      user.id,
      user.name,
      'CREATE',
      'kobo_submission',
      assetUid,
      { submissionId: result._id, data }
    );
    
    console.log('âœ… Submission creado exitosamente:', result._id);
    
    return c.json({
      success: true,
      submission: result
    });
  } catch (error: any) {
    console.error('Error al crear submission en Kobo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Actualizar un submission existente
app.patch('/kobo/forms/:assetUid/submissions/:submissionId', authMiddleware, async (c) => {
  try {
    const assetUid = c.req.param('assetUid');
    const submissionId = c.req.param('submissionId');
    const data = await c.req.json();
    const user = c.get('user') as User;
    
    console.log(`=== Actualizando submission ${submissionId} en formulario: ${assetUid} ===`);
    
    const kobo = getKoboClient();
    const result = await kobo.updateSubmission(assetUid, submissionId, data);
    
    // Log de auditorÃ­a
    await logAudit(
      user.id,
      user.name,
      'UPDATE',
      'kobo_submission',
      assetUid,
      { submissionId, data }
    );
    
    return c.json({
      success: true,
      submission: result
    });
  } catch (error: any) {
    console.error('Error al actualizar submission en Kobo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Eliminar un submission
app.delete('/kobo/forms/:assetUid/submissions/:submissionId', authMiddleware, requireRole('admin'), async (c) => {
  try {
    const assetUid = c.req.param('assetUid');
    const submissionId = c.req.param('submissionId');
    const user = c.get('user') as User;
    
    console.log(`=== Eliminando submission ${submissionId} del formulario: ${assetUid} ===`);
    
    const kobo = getKoboClient();
    await kobo.deleteSubmission(assetUid, submissionId);
    
    // Log de auditorÃ­a
    await logAudit(
      user.id,
      user.name,
      'DELETE',
      'kobo_submission',
      assetUid,
      { submissionId }
    );
    
    return c.json({
      success: true,
      message: 'Submission eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar submission en Kobo:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Endpoints especÃ­ficos para los formularios del sistema

// Obtener asistencias y horas desde KoboToolbox
app.get('/kobo/asistencia-horas', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo datos de Asistencia y Horas ===');
    const kobo = getKoboClient();
    const data = await kobo.getSubmissions(KOBO_FORMS.ASISTENCIA_HORAS);
    
    return c.json({
      success: true,
      count: data.count || 0,
      asistencias: data.results || []
    });
  } catch (error: any) {
    console.error('Error al obtener asistencias:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Registrar asistencia y horas en KoboToolbox
app.post('/kobo/asistencia-horas', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user') as User;
    
    console.log('=== Registrando Asistencia y Horas ===');
    console.log('Datos:', data);
    
    const kobo = getKoboClient();
    const result = await kobo.createSubmission(KOBO_FORMS.ASISTENCIA_HORAS, data);
    
    // Log de auditorÃ­a
    await logAudit(user.id, user.name, 'CREATE', 'asistencia_horas', result._id, data);
    
    return c.json({
      success: true,
      submission: result
    });
  } catch (error: any) {
    console.error('Error al registrar asistencia:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Obtener ejecuciones y evidencias desde KoboToolbox
app.get('/kobo/ejecucion-evidencias', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo datos de EjecuciÃ³n y Evidencias ===');
    const kobo = getKoboClient();
    const data = await kobo.getSubmissions(KOBO_FORMS.EJECUCION_EVIDENCIAS);
    
    return c.json({
      success: true,
      count: data.count || 0,
      ejecuciones: data.results || []
    });
  } catch (error: any) {
    console.error('Error al obtener ejecuciones:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Registrar ejecuciÃ³n y evidencias en KoboToolbox
app.post('/kobo/ejecucion-evidencias', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user') as User;
    
    console.log('=== Registrando EjecuciÃ³n y Evidencias ===');
    console.log('Datos:', data);
    
    const kobo = getKoboClient();
    const result = await kobo.createSubmission(KOBO_FORMS.EJECUCION_EVIDENCIAS, data);
    
    // Log de auditorÃ­a
    await logAudit(user.id, user.name, 'CREATE', 'ejecucion_evidencias', result._id, data);
    
    return c.json({
      success: true,
      submission: result
    });
  } catch (error: any) {
    console.error('Error al registrar ejecuciÃ³n:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// RUTAS DE SINCRONIZACIÃ“N KOBO â†’ SUPABASE
// ============================================

import { 
  syncAsistenciaHoras, 
  syncEjecucionEvidencias,
  generarCodigoActividad,
  obtenerEstadisticasSync 
} from './sync-service.ts';
import { syncKoboToSupabase } from './kobo-sync.ts';

/**
 * Sincronizar formularios de Asistencia y Horas
 * Lee Kobo â†’ Procesa â†’ Actualiza Supabase
 */
app.post('/kobo/sync', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    const body = await c.req.json();

    const assetUid = String(body?.assetUid || body?.asset_uid || '').trim();
    const formularioCodigo = String(body?.formularioCodigo || body?.formulario_codigo || body?.formulario || '').trim();
    const filtroDni = body?.filtroDni ?? body?.filtro_dni ?? body?.dni ?? undefined;
    const limit = body?.limit !== undefined && body?.limit !== null ? Number(body.limit) : undefined;

    if (!assetUid || !formularioCodigo) {
      return c.json({
        success: false,
        error: 'assetUid y formulario_codigo son requeridos',
      }, 400);
    }

    console.log(`=== Sync KoBo -> Supabase (formulario=${formularioCodigo}) iniciado por: ${user.name} ===`);

    const result = await syncKoboToSupabase(supabase, {
      assetUid,
      formularioCodigo,
      filtroDni: filtroDni ? String(filtroDni) : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });

    await logAudit(
      user.id,
      user.name,
      'SYNC',
      'kobo_sync',
      `${formularioCodigo}:${assetUid}`,
      {
        assetUid,
        formularioCodigo,
        filtroDni: filtroDni ? String(filtroDni) : null,
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors,
        success: result.success,
      },
    );

    return c.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    console.error('Error en sync kobo:', error);
    return c.json({
      success: false,
      error: error?.message || 'Error interno en sincronizacion KoBo',
      details: error?.stack || null,
    }, 500);
  }
});

/**
 * Sync KoBo bajo demanda por voluntario (solo envia id_usuario desde el front).
 * Config se lee desde env:
 * - KOBO_BASE_URL (default https://kf.kobotoolbox.org)
 * - KOBO_ASSET_UID
 * - KOBO_FORMULARIO_CODIGO
 * - KOBO_TOKEN (o KOBO_API_KEY legacy)
 */
app.post('/kobo/sync/voluntario', authMiddleware, async (c) => {
  try {
    const actor = c.get('user') as User;
    const body = await c.req.json().catch(() => ({}));

    const idUsuario = Number(body?.id_usuario ?? body?.idUsuario ?? body?.id_usuario_voluntario ?? body?.id);
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      return c.json({ success: false, error: 'id_usuario es requerido' }, 400);
    }

    const { data: dbUser, error: userErr } = await supabase
      .from('usuarios')
      .select('id_usuario, dni')
      .eq('id_usuario', idUsuario)
      .maybeSingle();

    if (userErr) {
      throw new Error(`Error consultando usuario: ${userErr.message}`);
    }

    const dni = String(dbUser?.dni || '').trim();
    if (!dni) {
      return c.json({ success: false, error: 'El voluntario no tiene DNI registrado' }, 400);
    }

    const assetUid = String(Deno.env.get('KOBO_ASSET_UID') || '').trim();
    const formularioCodigo = String(Deno.env.get('KOBO_FORMULARIO_CODIGO') || '').trim();
    const limitRaw = String(Deno.env.get('KOBO_SYNC_LIMIT') || '').trim();
    const limit = limitRaw ? Number(limitRaw) : 1000;

    if (!assetUid || !formularioCodigo) {
      return c.json(
        {
          success: false,
          error: 'KOBO_ASSET_UID y KOBO_FORMULARIO_CODIGO deben estar configurados en el backend',
        },
        500,
      );
    }

    const result = await syncKoboToSupabase(supabase, {
      assetUid,
      formularioCodigo,
      filtroDni: dni,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });

    const { data: totalRows, error: totalErr } = await supabase
      .from('actividad_voluntarios')
      .select('horas_total')
      .eq('id_usuario', idUsuario);

    const horas_total_bd = totalErr
      ? null
      : (totalRows || []).reduce((sum: number, row: any) => sum + (Number(row?.horas_total) || 0), 0);

    const processed = Number(result.processed ?? 0);
    const skipped = Number(result.skipped ?? 0);
    const errors = Number(result.errors ?? 0);
    const syncErrorMessageRaw = (result as any)?.errorMessage ? String((result as any).errorMessage) : '';
    const statusCodeRaw = Number((result as any)?.statusCode);
    const statusCode = Number.isFinite(statusCodeRaw) && statusCodeRaw >= 400 ? statusCodeRaw : 500;

    const payload = {
      id_usuario: idUsuario,
      dni,
      assetUid,
      formularioCodigo,
      nuevos: processed,
      total_kobo: (result as any).total_kobo ?? null,
      horas_nuevas: (result as any).horas_nuevas ?? 0,
      horas_total_bd,
      skipped,
      errors,
      success: result.success ?? false,
      errorMessage: syncErrorMessageRaw || (
        !result.success && errors > 0
          ? `Sync KoBo completada con errores (processed=${processed}, skipped=${skipped}, errors=${errors}).`
          : null
      ),
    };

    await logAudit(actor.id, actor.name, 'SYNC', 'kobo_sync_voluntario', String(idUsuario), payload);

    if (!result.success && syncErrorMessageRaw) {
      return c.json({ success: false, error: syncErrorMessageRaw, result: payload }, statusCode);
    }

    return c.json({
      // Para UI: no tratar sync "parcial" como error duro.
      success: true,
      result: payload,
    });
  } catch (error: any) {
    console.error('Error en sync kobo voluntario:', error);
    return c.json(
      {
        success: false,
        error: error?.message || 'Error interno en sincronizacion KoBo por voluntario',
      },
      500,
    );
  }
});

/**
 * Proxy seguro para adjuntos KoBo (no expone KOBO_TOKEN al front).
 * Uso recomendado en UI: <img src=\".../kobo/attachments/proxy?url=ENCODED\" />
 *
 * Nota: No usa authMiddleware porque <img> no puede enviar headers custom.
 * Se limita por host y por asset UID configurado (si existe KOBO_ASSET_UID).
 */
app.get('/kobo/attachments/proxy', async (c) => {
  try {
    const rawUrl = String(c.req.query('url') || '').trim();
    if (!rawUrl) {
      return c.json({ success: false, error: 'Param \"url\" es requerido' }, 400);
    }

    const baseRaw = String(Deno.env.get('KOBO_BASE_URL') || 'https://kf.kobotoolbox.org').trim();
    const baseWithProto = /^https?:\/\//i.test(baseRaw) ? baseRaw : `https://${baseRaw}`;

    let baseUrl: URL | null = null;
    try {
      baseUrl = new URL(baseWithProto);
    } catch {
      baseUrl = new URL('https://kf.kobotoolbox.org');
    }

    const allowedHost = baseUrl.hostname;
    const allowedOrigin = baseUrl.origin;

    const targetInput = rawUrl.startsWith('/') ? `${allowedOrigin}${rawUrl}` : rawUrl;

    let target: URL;
    try {
      target = new URL(targetInput);
    } catch {
      return c.json({ success: false, error: 'URL invalida' }, 400);
    }

    if (target.protocol !== 'https:') {
      return c.json({ success: false, error: 'Solo se permiten URLs https' }, 400);
    }

    if (target.hostname !== allowedHost) {
      return c.json({ success: false, error: 'Host no permitido' }, 400);
    }

    if (!target.pathname.startsWith('/api/v2/assets/')) {
      return c.json({ success: false, error: 'Ruta no permitida' }, 400);
    }

    const expectedAssetUid = String(Deno.env.get('KOBO_ASSET_UID') || '').trim();
    if (expectedAssetUid && !target.pathname.includes(`/assets/${expectedAssetUid}/`)) {
      return c.json({ success: false, error: 'URL no pertenece al asset configurado' }, 400);
    }

    const token = Deno.env.get('KOBO_TOKEN') || Deno.env.get('KOBO_API_KEY');
    if (!token) {
      return c.json({ success: false, error: 'KOBO_TOKEN no esta configurado en el backend' }, 500);
    }

    const res = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return c.json(
        {
          success: false,
          error: `KoBo HTTP ${res.status}`,
          details: text,
        },
        res.status,
      );
    }

    const headers = new Headers();
    const contentType = res.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const contentDisposition = res.headers.get('content-disposition');
    if (contentDisposition) headers.set('content-disposition', contentDisposition);
    headers.set('cache-control', 'private, max-age=300');

    return new Response(res.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Error proxy KoBo attachment:', error);
    return c.json({ success: false, error: error?.message || 'Error interno en proxy' }, 500);
  }
});

app.post('/sync/asistencia-horas', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    console.log(`=== Iniciando sincronizaciÃ³n de Asistencia y Horas (Usuario: ${user.name}) ===`);
    
    const result = await syncAsistenciaHoras(supabase);
    
    // Log de auditorÃ­a
    await logAudit(
      user.id,
      user.name,
      'SYNC',
      'asistencia_horas',
      'kobo_to_supabase',
      {
        procesados: result.processed,
        errores: result.errors,
        saltados: result.skipped
      }
    );
    
    return c.json({
      success: result.success,
      message: `SincronizaciÃ³n completada: ${result.processed} registros procesados`,
      result
    });
  } catch (error: any) {
    console.error('Error en sincronizaciÃ³n de asistencia:', error);
    return c.json({ 
      success: false,
      error: `Error en sincronizaciÃ³n: ${error.message}`,
      details: error.stack 
    }, 500);
  }
});

/**
 * Sincronizar formularios de EjecuciÃ³n y Evidencias
 */
app.post('/sync/ejecucion-evidencias', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    console.log(`=== Iniciando sincronizaciÃ³n de EjecuciÃ³n y Evidencias (Usuario: ${user.name}) ===`);
    
    const result = await syncEjecucionEvidencias(supabase);
    
    await logAudit(
      user.id,
      user.name,
      'SYNC',
      'ejecucion_evidencias',
      'kobo_to_supabase',
      {
        procesados: result.processed,
        errores: result.errors
      }
    );
    
    return c.json({
      success: result.success,
      message: `SincronizaciÃ³n completada: ${result.processed} registros procesados`,
      result
    });
  } catch (error: any) {
    console.error('Error en sincronizaciÃ³n de evidencias:', error);
    return c.json({ 
      success: false,
      error: `Error en sincronizaciÃ³n: ${error.message}` 
    }, 500);
  }
});

/**
 * Sincronizar todo (ambos formularios)
 */
app.post('/sync/all', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;
    console.log(`=== SincronizaciÃ³n COMPLETA iniciada por: ${user.name} ===`);
    
    const resultAsistencia = await syncAsistenciaHoras(supabase);
    const resultEvidencias = await syncEjecucionEvidencias(supabase);
    
    const totalProcesados = resultAsistencia.processed + resultEvidencias.processed;
    const totalErrores = resultAsistencia.errors + resultEvidencias.errors;
    
    await logAudit(
      user.id,
      user.name,
      'SYNC',
      'kobo_complete',
      'kobo_to_supabase',
      {
        asistencia: resultAsistencia,
        evidencias: resultEvidencias,
        totalProcesados,
        totalErrores
      }
    );
    
    return c.json({
      success: true,
      message: `SincronizaciÃ³n completa: ${totalProcesados} registros procesados`,
      asistencia: resultAsistencia,
      evidencias: resultEvidencias,
      resumen: {
        totalProcesados,
        totalErrores,
        totalSaltados: resultAsistencia.skipped + resultEvidencias.skipped
      }
    });
  } catch (error: any) {
    console.error('Error en sincronizaciÃ³n completa:', error);
    return c.json({ 
      success: false,
      error: `Error en sincronizaciÃ³n: ${error.message}` 
    }, 500);
  }
});

/**
 * Generar cÃ³digo de actividad Ãºnico
 */
app.get('/legacy/actividades/generar-codigo', authMiddleware, async (c) => {
  try {
    const codigo = generarCodigoActividad();
    
    // Verificar que no exista ya
    const { data: existente } = await supabase
      .from('actividades')
      .select('codigo')
      .eq('codigo', codigo)
      .single();
    
    if (existente) {
      // Si existe, generar otro
      return c.json({
        success: true,
        codigo: generarCodigoActividad()
      });
    }
    
    return c.json({
      success: true,
      codigo
    });
  } catch (error: any) {
    console.error('Error al generar cÃ³digo:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Obtener estadÃ­sticas de sincronizaciÃ³n
 */
app.get('/sync/stats', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo estadÃ­sticas de sincronizaciÃ³n ===');
    const stats = await obtenerEstadisticasSync(supabase);
    
    return c.json({
      success: true,
      ...stats
    });
  } catch (error: any) {
    console.error('Error al obtener estadÃ­sticas:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

/**
 * Obtener areas activas desde Supabase
 */
app.get('/areas', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo areas activas ===');
    const activeGeneralId = await getEstadoIdByName('general', 'activo');

    const { data: areas, error } = await supabase
      .from('areas')
      .select('id_area, nombre, id_estado')
      .eq('id_estado', activeGeneralId || 1)
      .order('nombre');
    
    if (error) {
      throw new Error(`Error al obtener Ã¡reas: ${error.message}`);
    }
    
    return c.json({
      success: true,
      areas: areas || []
    });
  } catch (error: any) {
    console.error('Error al obtener Ã¡reas:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

/**
 * Obtener todos los voluntarios (rol='voluntario' en tabla usuarios)
 * CON horas y actividades consolidadas
 */
app.get('/voluntarios', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo voluntarios (SOLO rol=voluntario) ===');
    const estadoIndex = await refreshEstadosCache();
    
    // Query completa con JOIN a actividad_voluntarios
    const { data: voluntarios, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        nombre_completo,
        dni,
        correo,
        telefono,
        id_estado,
        organizacion,
        id_area,
        disponibilidad
      `)
      .eq('id_rol', ROLE_IDS.voluntario)
      .order('id_usuario', { ascending: false });
    
    if (error) {
      throw new Error(`Error al obtener voluntarios: ${error.message}`);
    }
    
    // Para cada voluntario, obtener sus horas y actividades
    const voluntariosConHoras = await Promise.all(
      (voluntarios || []).map(async (vol: any) => {
        // Obtener horas totales y actividades
        const { data: stats } = await supabase
          .from('actividad_voluntarios')
          .select('horas_total, id_actividad')
          .eq('id_usuario', vol.id_usuario);
        
        const horas_totales = stats?.reduce((sum: number, s: any) => sum + (s.horas_total || 0), 0) || 0;
        const actividades_totales = stats?.length || 0;
        
        // Obtener nombre del Ã¡rea si tiene
        let area_nombre = null;
        if (vol.id_area) {
          const { data: area } = await supabase
            .from('areas')
            .select('nombre')
            .eq('id_area', vol.id_area)
            .single();
          area_nombre = area?.nombre;
        }
        
        return {
          ...vol,
          estado: resolveEstadoName(null, vol.id_estado, 'general', estadoIndex),
          horas_totales,
          actividades_totales,
          area_nombre
        };
      })
    );
    
    console.log(`âœ… ${voluntariosConHoras.length} voluntarios obtenidos`);
    
    return c.json({
      success: true,
      voluntarios: voluntariosConHoras
    });
  } catch (error: any) {
    console.error('Error al obtener voluntarios:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

/**
 * Obtener tipos de actividad
 */
app.get('/tipos-actividad', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo tipos de actividad ===');
    
    const { data: tipos, error } = await supabase
      .from('tipos_actividad')
      .select('*')
      .order('nombre');
    
    if (error) {
      throw new Error(`Error al obtener tipos: ${error.message}`);
    }
    
    return c.json({
      success: true,
      tipos: tipos || []
    });
  } catch (error: any) {
    console.error('Error al obtener tipos de actividad:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

/**
 * Obtener responsables (usuarios con rol trabajador o responsable)
 */
app.get('/responsables', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo responsables ===');
    const activeGeneralId = await getEstadoIdByName('general', 'activo');
    
    const { data: responsables, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre_completo, correo, id_rol, id_estado, roles(id_rol, nombre)')
      .in('id_rol', [ROLE_IDS.admin, ROLE_IDS.principal, ROLE_IDS.trabajador])
      .eq('id_estado', activeGeneralId || 1)
      .order('nombre_completo');
    
    if (error) {
      throw new Error(`Error al obtener responsables: ${error.message}`);
    }
    
    return c.json({
      success: true,
      responsables: responsables || []
    });
  } catch (error: any) {
    console.error('Error al obtener responsables:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

/**
 * Generar cÃ³digo de actividad auto-incremental
 */
app.get('/actividades/generar-codigo', authMiddleware, async (c) => {
  try {
    console.log('=== Generando código de actividad ===');

    const year = new Date().getFullYear();

    const { data: ultimaActividad, error } = await supabase
      .from('actividades')
      .select('id_actividad')
      .order('id_actividad', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener última actividad: ${error.message}`);
    }

    const nextId = (ultimaActividad?.id_actividad ?? 0) + 1;
    const codigo = `ACT-${year}-${String(nextId).padStart(3, '0')}`;

    console.log(`? Código generado (preview): ${codigo}`);

    return c.json({
      success: true,
      codigo,
    });
  } catch (error: any) {
    console.error('Error al generar código:', error);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return c.json({
      success: true,
      codigo: `ACT-${year}-${random}`,
    });
  }
});

/**
 * Crear nueva actividad
 */
app.post('/actividades', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);
    console.log('=== Creando nueva actividad ===');
    console.log('Datos recibidos:', body);

    const userIdInt = await resolveUserIdInt(user, supabase);

    const {
      codigo,
      titulo,
      descripcion,
      objetivo,
      id_estado,
      estado,
      id_tipo_actividad,
      id_responsable,
      fecha_inicio,
      fecha_fin,
      ubicacion_direccion,
      ubicacion_lat,
      ubicacion_lng,
    } = body;

    if (!titulo || !id_tipo_actividad) {
      return c.json({
        success: false,
        error: 'Faltan campos obligatorios',
      }, 400);
    }

    const tipoId = Number(id_tipo_actividad);
    if (!Number.isInteger(tipoId) || tipoId <= 0) {
      return c.json({
        success: false,
        error: 'id_tipo_actividad inválido',
      }, 400);
    }

    const responsableId = (sessionRole === 'admin' || sessionRole === 'principal')
      ? Number(id_responsable)
      : userIdInt;
    if (!Number.isInteger(responsableId) || responsableId <= 0) {
      return c.json({
        success: false,
        error: 'id_responsable inválido',
      }, 400);
    }

    const defaultEstadoActividadId = await getEstadoIdByName('actividad', 'planificada');
    const requestedEstadoId = id_estado !== undefined && id_estado !== null && id_estado !== ''
      ? Number(id_estado)
      : (estado ? await getEstadoIdByName('actividad', String(estado)) : null);
    const finalEstadoId = Number.isInteger(requestedEstadoId) && requestedEstadoId > 0
      ? requestedEstadoId
      : (defaultEstadoActividadId || 3);

    const estadoInfo = await getEstadoById(finalEstadoId);
    if (!estadoInfo || estadoInfo.ambito !== 'actividad') {
      return c.json({
        success: false,
        error: 'id_estado/estado invalido para ambito actividad',
      }, 400);
    }

    const startDate = fecha_inicio ? new Date(fecha_inicio) : null;
    const endDate = fecha_fin ? new Date(fecha_fin) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      return c.json({
        success: false,
        error: 'fecha_inicio inválida',
      }, 400);
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      return c.json({
        success: false,
        error: 'fecha_fin inválida',
      }, 400);
    }

    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      return c.json({
        success: false,
        error: 'fecha_fin no puede ser menor que fecha_inicio',
      }, 400);
    }

    const latValue = ubicacion_lat === '' || ubicacion_lat === undefined || ubicacion_lat === null
      ? null
      : Number(ubicacion_lat);
    const lngValue = ubicacion_lng === '' || ubicacion_lng === undefined || ubicacion_lng === null
      ? null
      : Number(ubicacion_lng);

    if (latValue !== null && !Number.isFinite(latValue)) {
      return c.json({
        success: false,
        error: 'ubicacion_lat inválida',
      }, 400);
    }

    if (lngValue !== null && !Number.isFinite(lngValue)) {
      return c.json({
        success: false,
        error: 'ubicacion_lng inválida',
      }, 400);
    }

    const codigoInput = typeof codigo === 'string' ? codigo.trim() : '';

    if (codigoInput) {
      const { data: existente } = await supabase
        .from('actividades')
        .select('codigo')
        .eq('codigo', codigoInput)
        .maybeSingle();

      if (existente) {
        return c.json({
          success: false,
          error: `Ya existe una actividad con el código ${codigoInput}`,
        }, 400);
      }
    }

    const codigoTemporal = codigoInput || `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: nuevaActividad, error: errorCreacion } = await supabase
      .from('actividades')
      .insert({
        codigo: codigoTemporal,
        titulo,
        descripcion: descripcion || null,
        objetivo: objetivo || null,
        id_estado: finalEstadoId,
        id_tipo_actividad: tipoId,
        id_responsable: responsableId,
        id_creador: userIdInt,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        ubicacion_direccion: ubicacion_direccion || null,
        ubicacion_lat: latValue,
        ubicacion_lng: lngValue,
      })
      .select()
      .single();

    if (errorCreacion) {
      throw new Error(`Error al crear actividad: ${errorCreacion.message}`);
    }

    let actividadFinal = nuevaActividad;
    let codigoFinal = codigoInput;

    if (!codigoFinal) {
      const year = new Date().getFullYear();
      codigoFinal = `ACT-${year}-${String(nuevaActividad.id_actividad).padStart(3, '0')}`;

      const { data: actualizada, error: updateError } = await supabase
        .from('actividades')
        .update({ codigo: codigoFinal })
        .eq('id_actividad', nuevaActividad.id_actividad)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error al actualizar código: ${updateError.message}`);
      }

      actividadFinal = actualizada;
    }

    await logAudit(
      supabase,
      String(userIdInt),
      user.name || 'Sistema',
      'CREATE',
      'actividad',
      String(actividadFinal.id_actividad),
      { codigo: actividadFinal.codigo, titulo: actividadFinal.titulo }
    );

    return c.json({
      success: true,
      actividad: {
        id_actividad: actividadFinal.id_actividad,
        codigo: actividadFinal.codigo,
        titulo: actividadFinal.titulo,
        id_estado: actividadFinal.id_estado,
        estado: normalizeEstadoName(estadoInfo.nombre),
        estadoInfo: serializeEstadoForResponse(estadoInfo),
      },
      message: 'Actividad creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al crear actividad:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Actualizar actividad
 */
app.put('/actividades/:id_actividad', authMiddleware, async (c) => {
  try {
    const id_actividad = c.req.param('id_actividad');
    const actividadId = Number(id_actividad);

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      return c.json({ success: false, error: 'id_actividad inválido' }, 400);
    }

    const body = await c.req.json();
    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);

    const userIdInt = await resolveUserIdInt(user, supabase);

    const {
      codigo,
      titulo,
      descripcion,
      objetivo,
      id_estado,
      estado,
      id_tipo_actividad,
      id_responsable,
      fecha_inicio,
      fecha_fin,
      ubicacion_direccion,
      ubicacion_lat,
      ubicacion_lng,
    } = body;

    if (!titulo || !id_tipo_actividad) {
      return c.json({ success: false, error: 'Faltan campos obligatorios' }, 400);
    }

    const { data: existingActivity, error: existingError } = await supabase
      .from('actividades')
      .select('id_actividad, id_responsable, id_estado')
      .eq('id_actividad', actividadId)
      .maybeSingle();

    if (existingError) {
      throw new Error('Error al obtener actividad: ' + existingError.message);
    }

    if (!existingActivity) {
      return c.json({ success: false, error: 'Actividad no encontrada' }, 404);
    }

    if (!['admin', 'principal'].includes(sessionRole) && Number(existingActivity.id_responsable) !== userIdInt) {
      return c.json({ success: false, error: 'Sin permisos para editar esta actividad' }, 403);
    }

    const tipoId = Number(id_tipo_actividad);
    if (!Number.isInteger(tipoId) || tipoId <= 0) {
      return c.json({ success: false, error: 'id_tipo_actividad inválido' }, 400);
    }

    const responsableId = (sessionRole === 'admin' || sessionRole === 'principal')
      ? Number(id_responsable)
      : userIdInt;
    if (!Number.isInteger(responsableId) || responsableId <= 0) {
      return c.json({ success: false, error: 'id_responsable inválido' }, 400);
    }

    const requestedEstadoId = id_estado !== undefined && id_estado !== null && id_estado !== ''
      ? Number(id_estado)
      : (estado ? await getEstadoIdByName('actividad', String(estado)) : null);
    const estadoFinalId = Number.isInteger(requestedEstadoId) && requestedEstadoId > 0
      ? requestedEstadoId
      : Number(existingActivity.id_estado);
    const estadoInfo = await getEstadoById(estadoFinalId);
    if (!estadoInfo || estadoInfo.ambito !== 'actividad') {
      return c.json({ success: false, error: 'id_estado/estado invalido para actividad' }, 400);
    }

    const startDate = fecha_inicio ? new Date(fecha_inicio) : null;
    const endDate = fecha_fin ? new Date(fecha_fin) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      return c.json({ success: false, error: 'fecha_inicio inválida' }, 400);
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      return c.json({ success: false, error: 'fecha_fin inválida' }, 400);
    }

    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      return c.json({ success: false, error: 'fecha_fin no puede ser menor que fecha_inicio' }, 400);
    }

    const latValue = ubicacion_lat === '' || ubicacion_lat === undefined || ubicacion_lat === null
      ? null
      : Number(ubicacion_lat);
    const lngValue = ubicacion_lng === '' || ubicacion_lng === undefined || ubicacion_lng === null
      ? null
      : Number(ubicacion_lng);

    if (latValue !== null && !Number.isFinite(latValue)) {
      return c.json({ success: false, error: 'ubicacion_lat inválida' }, 400);
    }

    if (lngValue !== null && !Number.isFinite(lngValue)) {
      return c.json({ success: false, error: 'ubicacion_lng inválida' }, 400);
    }

    const codigoInput = typeof codigo === 'string' ? codigo.trim() : '';
    const updateData: any = {
      titulo,
      descripcion: descripcion || null,
      objetivo: objetivo || null,
      id_estado: estadoFinalId,
      id_tipo_actividad: tipoId,
      id_responsable: responsableId,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      ubicacion_direccion: ubicacion_direccion || null,
      ubicacion_lat: latValue,
      ubicacion_lng: lngValue,
    };

    if (codigoInput) {
      updateData.codigo = codigoInput;
    }

    const { data: updatedActivity, error: updateError } = await supabase
      .from('actividades')
      .update(updateData)
      .eq('id_actividad', actividadId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Error al actualizar actividad: ' + updateError.message);
    }

    await logAudit(
      supabase,
      String(userIdInt),
      user.name || 'Sistema',
      'UPDATE',
      'actividad',
      String(updatedActivity.id_actividad),
      { codigo: updatedActivity.codigo, titulo: updatedActivity.titulo }
    );

    return c.json({
      success: true,
      actividad: {
        id_actividad: updatedActivity.id_actividad,
        codigo: updatedActivity.codigo,
        titulo: updatedActivity.titulo,
        id_estado: updatedActivity.id_estado,
        estado: normalizeEstadoName(estadoInfo.nombre),
        estadoInfo: serializeEstadoForResponse(estadoInfo),
      },
      message: 'Actividad actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al actualizar actividad:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Eliminar actividad
 */
app.delete('/actividades/:id_actividad', authMiddleware, async (c) => {
  try {
    const id_actividad = c.req.param('id_actividad');
    const actividadId = Number(id_actividad);

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      return c.json({ success: false, error: 'id_actividad inválido' }, 400);
    }

    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);
    const userIdInt = await resolveUserIdInt(user, supabase);

    const { data: existingActivity, error: existingError } = await supabase
      .from('actividades')
      .select('id_actividad, id_responsable, codigo, titulo')
      .eq('id_actividad', actividadId)
      .maybeSingle();

    if (existingError) {
      throw new Error('Error al obtener actividad: ' + existingError.message);
    }

    if (!existingActivity) {
      return c.json({ success: false, error: 'Actividad no encontrada' }, 404);
    }

    if (sessionRole !== 'admin' && Number(existingActivity.id_responsable) !== userIdInt) {
      return c.json({ success: false, error: 'Sin permisos para eliminar esta actividad' }, 403);
    }

    const { error: deleteError } = await supabase
      .from('actividades')
      .delete()
      .eq('id_actividad', actividadId);

    if (deleteError) {
      throw new Error('Error al eliminar actividad: ' + deleteError.message);
    }

    await logAudit(
      supabase,
      String(userIdInt),
      user.name || 'Sistema',
      'DELETE',
      'actividad',
      String(existingActivity.id_actividad),
      { codigo: existingActivity.codigo, titulo: existingActivity.titulo }
    );

    return c.json({ success: true, message: 'Actividad eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar actividad:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Obtener detalle consolidado de actividad para el modal de calendario
 */
app.get('/actividades/:id_actividad/detalle', authMiddleware, async (c) => {
  const warnings: string[] = [];
  const warn = (scope: string, err: any) => {
    const message = `${scope}: ${err?.message || String(err)}`;
    warnings.push(message);
    console.warn(`[actividad-detalle] ${message}`);
  };

  const toNumberOrNull = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  try {
    const rawId = c.req.param('id_actividad');
    const actividadId = Number(rawId);

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      return c.json({ success: false, error: 'id_actividad inválido' }, 400);
    }

    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);
    const userIdInt = await resolveUserIdInt(user, supabase);

    if (!['admin', 'principal', 'trabajador'].includes(sessionRole)) {
      return c.json({ success: false, error: 'Sin permisos para ver detalle de actividad' }, 403);
    }

    const { data: actividad, error: activityError } = await supabase
      .from('actividades')
      .select(`
        id_actividad,
        codigo,
        titulo,
        descripcion,
        objetivo,
        fecha_inicio,
        fecha_fin,
        ubicacion_direccion,
        ubicacion_lat,
        ubicacion_lng,
        id_tipo_actividad,
        id_creador,
        id_responsable,
        id_estado
      `)
      .eq('id_actividad', actividadId)
      .maybeSingle();

    if (activityError) {
      throw new Error(`Error al obtener actividad: ${activityError.message}`);
    }

    if (!actividad) {
      return c.json({ success: false, error: 'Actividad no encontrada' }, 404);
    }

    if (
      sessionRole === 'trabajador'
      && Number(actividad.id_responsable) !== userIdInt
      && Number(actividad.id_creador) !== userIdInt
    ) {
      return c.json({ success: false, error: 'Sin permisos para ver esta actividad' }, 403);
    }

    let estado: any = null;
    try {
      const { data, error } = await supabase
        .from('estados')
        .select('id_estado, nombre, color, ambito')
        .eq('id_estado', actividad.id_estado)
        .maybeSingle();
      if (error) throw error;
      estado = data || null;
    } catch (err: any) {
      warn('No se pudo obtener estado de actividad', err);
    }

    let tipoActividad: any = null;
    try {
      const { data, error } = await supabase
        .from('tipos_actividad')
        .select('id_tipo_actividad, nombre')
        .eq('id_tipo_actividad', actividad.id_tipo_actividad)
        .maybeSingle();
      if (error) throw error;
      tipoActividad = data || null;
    } catch (err: any) {
      warn('No se pudo obtener tipo de actividad', err);
    }

    let creador: any = null;
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo, correo')
        .eq('id_usuario', actividad.id_creador)
        .maybeSingle();
      if (error) throw error;
      creador = data || null;
    } catch (err: any) {
      warn('No se pudo obtener usuario creador', err);
    }

    let responsable: any = null;
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo, correo')
        .eq('id_usuario', actividad.id_responsable)
        .maybeSingle();
      if (error) throw error;
      responsable = data || null;
    } catch (err: any) {
      warn('No se pudo obtener usuario responsable', err);
    }

    let evidencias: any[] = [];
    try {
      const { data, error } = await supabase
        .from('evidencias')
        .select('id_evidencia, id_actividad, url_archivo, tipo_archivo, nombre_original, fecha_subida')
        .eq('id_actividad', actividadId)
        .order('fecha_subida', { ascending: false });
      if (error) throw error;
      evidencias = data || [];
    } catch (err: any) {
      warn('No se pudieron obtener evidencias', err);
      evidencias = [];
    }

    let voluntarios: any[] = [];
    try {
      const { data: relaciones, error: relacionesError } = await supabase
        .from('actividad_voluntarios')
        .select('id_usuario, horas_total, fecha_ultima_actualizacion')
        .eq('id_actividad', actividadId)
        .order('fecha_ultima_actualizacion', { ascending: false });

      if (relacionesError) throw relacionesError;

      const userIds = [...new Set((relaciones || []).map((rel: any) => Number(rel.id_usuario)).filter(Boolean))];
      const usersById = new Map<number, any>();

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('usuarios')
          .select('id_usuario, nombre_completo, correo')
          .in('id_usuario', userIds);

        if (usersError) throw usersError;

        for (const row of usersData || []) {
          usersById.set(Number(row.id_usuario), row);
        }
      }

      voluntarios = (relaciones || []).map((rel: any) => {
        const idUsuario = Number(rel.id_usuario);
        const usuario = usersById.get(idUsuario) || null;
        return {
          id_usuario: idUsuario,
          nombre_completo: usuario?.nombre_completo || `Usuario ${idUsuario}`,
          correo: usuario?.correo || null,
          horas_total: Number(rel.horas_total || 0),
          fecha_ultima_actualizacion: rel.fecha_ultima_actualizacion || null,
        };
      });
    } catch (err: any) {
      warn('No se pudieron obtener voluntarios asignados', err);
      voluntarios = [];
    }

    let estadosActividad: any[] = [];
    try {
      const { data, error } = await supabase
        .from('estados')
        .select('id_estado, nombre, ambito, color')
        .eq('ambito', 'actividad')
        .order('id_estado', { ascending: true });
      if (error) throw error;
      estadosActividad = data || [];
    } catch (err: any) {
      warn('No se pudo obtener catálogo de estados de actividad', err);
      estadosActividad = estado ? [estado] : [];
    }

    const horasVoluntariado = voluntarios.reduce((sum: number, row: any) => sum + Number(row.horas_total || 0), 0);

    return c.json({
      success: true,
      detalle: {
        actividad: {
          id_actividad: Number(actividad.id_actividad),
          codigo: actividad.codigo || '',
          titulo: actividad.titulo || '',
          descripcion: actividad.descripcion || '',
          objetivo: actividad.objetivo || '',
          fecha_inicio: actividad.fecha_inicio || null,
          fecha_fin: actividad.fecha_fin || null,
          ubicacion_direccion: actividad.ubicacion_direccion || null,
          ubicacion_lat: toNumberOrNull(actividad.ubicacion_lat),
          ubicacion_lng: toNumberOrNull(actividad.ubicacion_lng),
          id_tipo_actividad: Number(actividad.id_tipo_actividad || 0),
          id_creador: Number(actividad.id_creador || 0),
          id_responsable: Number(actividad.id_responsable || 0),
          id_estado: Number(actividad.id_estado || 0),
        },
        estado: estado
          ? {
              id_estado: Number(estado.id_estado || 0),
              nombre: estado.nombre || '',
              color: estado.color || null,
              ambito: estado.ambito || 'actividad',
            }
          : null,
        tipo_actividad: tipoActividad
          ? {
              id_tipo_actividad: Number(tipoActividad.id_tipo_actividad || 0),
              nombre: tipoActividad.nombre || '',
            }
          : null,
        creador: creador
          ? {
              id_usuario: Number(creador.id_usuario || 0),
              nombre_completo: creador.nombre_completo || '',
              correo: creador.correo || null,
            }
          : null,
        responsable: responsable
          ? {
              id_usuario: Number(responsable.id_usuario || 0),
              nombre_completo: responsable.nombre_completo || '',
              correo: responsable.correo || null,
            }
          : null,
        voluntarios,
        evidencias: (evidencias || []).map((ev: any) => ({
          id_evidencia: Number(ev.id_evidencia || 0),
          id_actividad: Number(ev.id_actividad || 0),
          url_archivo: ev.url_archivo || '',
          tipo_archivo: ev.tipo_archivo || '',
          nombre_original: ev.nombre_original || '',
          fecha_subida: ev.fecha_subida || null,
        })),
        horas_voluntariado: horasVoluntariado,
        estados_actividad: (estadosActividad || []).map((item: any) => ({
          id_estado: Number(item.id_estado || 0),
          nombre: item.nombre || '',
          ambito: item.ambito || 'actividad',
          color: item.color || null,
        })),
      },
      warnings,
    });
  } catch (error: any) {
    console.error('Error al obtener detalle de actividad:', error);
    return c.json({
      success: false,
      error: error?.message || 'No se pudo obtener detalle de actividad',
      warnings,
    }, 500);
  }
});

/**
 * Obtener resumen de actividad para popover del calendario (click en evento)
 */
app.get('/actividades/:id_actividad/resumen', authMiddleware, async (c) => {
  const warnings: string[] = [];
  const warn = (scope: string, err: any) => {
    const message = `${scope}: ${err?.message || String(err)}`;
    warnings.push(message);
    console.warn(`[actividad-resumen] ${message}`);
  };

  const toNumberOrNull = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  try {
    const rawId = c.req.param('id_actividad');
    const actividadId = Number(rawId);

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      return c.json({ success: false, error: 'id_actividad inválido' }, 400);
    }

    const user = c.get('user') as User;
    const sessionRole = getSessionRoleName(user);
    const userIdInt = await resolveUserIdInt(user, supabase);

    if (!['admin', 'principal', 'trabajador'].includes(sessionRole)) {
      return c.json({ success: false, error: 'Sin permisos para ver resumen de actividad' }, 403);
    }

    const { data: actividad, error: activityError } = await supabase
      .from('actividades')
      .select(`
        id_actividad,
        codigo,
        titulo,
        descripcion,
        objetivo,
        fecha_inicio,
        fecha_fin,
        ubicacion_direccion,
        ubicacion_lat,
        ubicacion_lng,
        id_tipo_actividad,
        id_creador,
        id_responsable,
        id_estado
      `)
      .eq('id_actividad', actividadId)
      .maybeSingle();

    if (activityError) {
      throw new Error(`Error al obtener actividad: ${activityError.message}`);
    }

    if (!actividad) {
      return c.json({ success: false, error: 'Actividad no encontrada' }, 404);
    }

    if (
      sessionRole === 'trabajador'
      && Number(actividad.id_responsable) !== userIdInt
      && Number(actividad.id_creador) !== userIdInt
    ) {
      return c.json({ success: false, error: 'Sin permisos para ver esta actividad' }, 403);
    }

    let estado: any = null;
    try {
      const { data, error } = await supabase
        .from('estados')
        .select('id_estado, nombre, color, ambito')
        .eq('id_estado', actividad.id_estado)
        .maybeSingle();
      if (error) throw error;
      estado = data || null;
    } catch (err: any) {
      warn('No se pudo obtener estado de actividad', err);
    }

    let tipoActividad: any = null;
    try {
      const { data, error } = await supabase
        .from('tipos_actividad')
        .select('id_tipo_actividad, nombre')
        .eq('id_tipo_actividad', actividad.id_tipo_actividad)
        .maybeSingle();
      if (error) throw error;
      tipoActividad = data || null;
    } catch (err: any) {
      warn('No se pudo obtener tipo de actividad', err);
    }

    let responsable: any = null;
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre_completo')
        .eq('id_usuario', actividad.id_responsable)
        .maybeSingle();
      if (error) throw error;
      responsable = data || null;
    } catch (err: any) {
      warn('No se pudo obtener usuario responsable', err);
    }

    return c.json({
      success: true,
      resumen: {
        actividad: {
          id_actividad: Number(actividad.id_actividad),
          codigo: actividad.codigo || '',
          titulo: actividad.titulo || '',
          descripcion: actividad.descripcion || '',
          objetivo: actividad.objetivo || '',
          fecha_inicio: actividad.fecha_inicio || null,
          fecha_fin: actividad.fecha_fin || null,
          ubicacion_direccion: actividad.ubicacion_direccion || null,
          ubicacion_lat: toNumberOrNull(actividad.ubicacion_lat),
          ubicacion_lng: toNumberOrNull(actividad.ubicacion_lng),
          id_tipo_actividad: Number(actividad.id_tipo_actividad || 0),
          id_creador: Number(actividad.id_creador || 0),
          id_responsable: Number(actividad.id_responsable || 0),
          id_estado: Number(actividad.id_estado || 0),
        },
        estado: estado
          ? {
              id_estado: Number(estado.id_estado || 0),
              nombre: estado.nombre || '',
              color: estado.color || null,
              ambito: estado.ambito || 'actividad',
            }
          : null,
        tipo_actividad: tipoActividad
          ? {
              id_tipo_actividad: Number(tipoActividad.id_tipo_actividad || 0),
              nombre: tipoActividad.nombre || '',
            }
          : null,
        responsable: responsable
          ? {
              id_usuario: Number(responsable.id_usuario || 0),
              nombre_completo: responsable.nombre_completo || '',
            }
          : null,
      },
      warnings,
    });
  } catch (error: any) {
    console.error('Error al obtener resumen de actividad:', error);
    return c.json({
      success: false,
      error: error?.message || 'No se pudo obtener resumen de actividad',
      warnings,
    }, 500);
  }
});

app.get('/actividades/:id_actividad/evidencias', authMiddleware, async (c) => {
  try {
    const id_actividad = c.req.param('id_actividad');
    const actividadId = Number(id_actividad);

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      return c.json({ success: false, error: 'id_actividad inválido' }, 400);
    }

    const { data: evidencias, error } = await supabase
      .from('evidencias')
      .select('id_evidencia, id_actividad, url_archivo, tipo_archivo, nombre_original, fecha_subida')
      .eq('id_actividad', actividadId)
      .order('id_evidencia', { ascending: false });

    if (error) {
      throw new Error(`Error al listar evidencias: ${error.message}`);
    }

    return c.json({
      success: true,
      evidencias: evidencias || [],
    });
  } catch (error: any) {
    console.error('Error al listar evidencias:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/actividades/:id_actividad/evidencias', authMiddleware, async (c) => {
  try {
    const id_actividad = c.req.param('id_actividad');
    const actividadId = Number(id_actividad);

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      return c.json({ success: false, error: 'id_actividad invalido' }, 400);
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY no esta configurado');
      return c.json({
        success: false,
        where: 'env.SUPABASE_SERVICE_ROLE_KEY',
        error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurado',
      }, 500);
    }

    const debugBuckets = c.req.query('debugBuckets') === '1' || c.req.header('x-debug-buckets') === '1';
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    const bucketNames = (buckets ?? []).map((bucket) => bucket.name);
    console.log('Buckets encontrados:', bucketNames);

    if (bucketsError) {
      console.error('Error listBuckets:', bucketsError);
      return c.json({
        success: false,
        where: 'listBuckets',
        error: bucketsError.message,
        details: bucketsError,
      }, 500);
    }

    if (debugBuckets) {
      return c.json({
        success: true,
        where: 'listBuckets',
        buckets: bucketNames,
        expectedBucket: 'evidencias',
        bucketFound: bucketNames.includes('evidencias'),
      });
    }

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch (formError: any) {
      console.error('Error leyendo multipart/form-data:', formError);
      return c.json({
        success: false,
        where: 'formData',
        error: formError?.message || 'No se pudo leer multipart/form-data',
      }, 400);
    }

    const files = formData.getAll('file');
    const archivos = files.length ? files : formData.getAll('archivos');
    const fileList = archivos.filter((f): f is File => f instanceof File);

    if (fileList.length === 0) {
      return c.json({
        success: false,
        where: 'formData.files',
        error: "No se enviaron archivos. Use key 'file' (compat: 'archivos').",
      }, 400);
    }

    console.log('Evidencias: archivos recibidos', { actividadId, count: fileList.length });

    const { data: actividad, error: actividadError } = await supabase
      .from('actividades')
      .select('id_actividad')
      .eq('id_actividad', actividadId)
      .single();

    if (actividadError) {
      console.error('Error buscando actividad:', actividadError);
      return c.json({
        success: false,
        where: 'db.actividades.select',
        error: actividadError.message,
        details: actividadError,
      }, 500);
    }

    if (!actividad) {
      return c.json({ success: false, error: 'Actividad no encontrada' }, 404);
    }

    const inserted: { id_evidencia: number; nombre_original: string; url_archivo: string; tipo_archivo: string | null; fecha_subida: string | null }[] = [];

    for (const file of fileList) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
      const path = `actividades/${actividadId}/${Date.now()}_${safeName}`;
      console.log('Subiendo evidencia:', { nombre: file.name, tipo: file.type || 'desconocido' });
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(path, arrayBuffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        return c.json({
          success: false,
          where: 'storage.upload',
          error: uploadError.message,
          file: file.name,
          path,
          details: uploadError,
        }, 500);
      }

      const { data: publicData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(path);

      const urlArchivo = publicData?.publicUrl || path;

      const { data: row, error: insertError } = await supabase
        .from('evidencias')
        .insert({
          id_actividad: actividadId,
          url_archivo: urlArchivo,
          tipo_archivo: file.type || null,
          nombre_original: file.name,
          fecha_subida: new Date().toISOString(),
        })
        .select('id_evidencia, nombre_original, url_archivo, tipo_archivo, fecha_subida')
        .single();

      if (insertError) {
        console.error('Error insertando evidencia:', insertError);
        return c.json({
          success: false,
          where: 'db.insert_evidencias',
          error: insertError.message,
          file: file.name,
          path,
          details: insertError,
        }, 500);
      }

      console.log('Evidencia registrada:', { id_evidencia: row.id_evidencia, nombre: row.nombre_original });
      inserted.push({
        id_evidencia: row.id_evidencia,
        nombre_original: row.nombre_original,
        url_archivo: row.url_archivo,
        tipo_archivo: row.tipo_archivo ?? null,
        fecha_subida: row.fecha_subida ?? null,
      });
    }

    return c.json({
      success: true,
      data: inserted[0] ?? null,
      items: inserted,
      message: `${inserted.length} archivo(s) subido(s)`,
    });
  } catch (error: any) {
    console.error('Error en upload evidencias:', error);
    return c.json({
      success: false,
      where: 'unhandled',
      error: error?.message || 'Error inesperado en upload evidencias',
    }, 500);
  }
});

/**
 * Obtener relaciones actividad-voluntarios con toda la info
 */
app.get('/actividad-voluntarios', authMiddleware, async (c) => {
  try {
    console.log('=== Obteniendo relaciones actividad-voluntarios ===');
    
    // Query con JOINs para obtener toda la informaciÃ³n
    const { data: relaciones, error } = await supabase
      .from('actividad_voluntarios')
      .select(`
        id_actividad,
        id_usuario,
        horas_total,
        kobo_submission_id,
        fecha_ultima_actualizacion,
        actividades!inner (
          codigo,
          titulo,
          id_tipo_actividad,
          tipos_actividad (nombre)
        ),
        usuarios!inner (
          nombre_completo,
          dni,
          correo
        )
      `)
      .order('fecha_ultima_actualizacion', { ascending: false });
    
    if (error) {
      throw new Error(`Error al obtener relaciones: ${error.message}`);
    }
    
    // Formatear respuesta
    const relacionesFormateadas = (relaciones || []).map((rel: any) => ({
      id_actividad: rel.id_actividad,
      id_usuario: rel.id_usuario,
      codigo: rel.actividades?.codigo,
      titulo_actividad: rel.actividades?.titulo,
      nombre_voluntario: rel.usuarios?.nombre_completo,
      dni: rel.usuarios?.dni,
      correo: rel.usuarios?.correo || null,
      horas_total: Number(rel.horas_total || 0),
      fecha_ultima_actualizacion: rel.fecha_ultima_actualizacion,
      kobo_submission_id: rel.kobo_submission_id || null,
      area_nombre: null,
      tipo_actividad: rel.actividades?.tipos_actividad?.nombre
    }));
    
    console.log(`âœ… ${relacionesFormateadas.length} relaciones obtenidas`);
    
    return c.json({
      success: true,
      relaciones: relacionesFormateadas
    });
  } catch (error: any) {
    console.error('Error al obtener relaciones:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * Actualizar horas de una relaciÃ³n actividad-voluntario
 */
app.put('/actividad-voluntarios/horas', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log('=== Actualizando horas ===');
    console.log('Datos recibidos:', body);
    
    const { id_actividad, id_usuario, horas_total } = body;
    
    if (!id_actividad || !id_usuario || horas_total === undefined) {
      return c.json({
        success: false,
        error: 'Faltan parÃ¡metros obligatorios'
      }, 400);
    }
    
    if (horas_total < 0) {
      return c.json({
        success: false,
        error: 'Las horas no pueden ser negativas'
      }, 400);
    }
    
    // Actualizar horas
    const { data, error: errorUpdate } = await supabase
      .from('actividad_voluntarios')
      .update({
        horas_total: horas_total,
        fecha_ultima_actualizacion: new Date().toISOString()
      })
      .eq('id_actividad', id_actividad)
      .eq('id_usuario', id_usuario)
      .select()
      .single();
    
    if (errorUpdate) {
      throw new Error(`Error al actualizar horas: ${errorUpdate.message}`);
    }
    
    console.log(`âœ… Horas actualizadas a ${horas_total}`);
    
    // Registrar auditorÃ­a
    await logAudit(
      supabase,
      c.get('user')?.id || 'sistema',
      c.get('user')?.name || 'Sistema',
      'UPDATE',
      'actividad_voluntarios',
      `${id_actividad}-${id_usuario}`,
      { horas_total }
    );
    
    return c.json({
      success: true,
      message: 'Horas actualizadas correctamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar horas:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * Crear nuevo voluntario en tabla usuarios (rol='voluntario')
 */
app.post('/voluntarios', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const currentUser = c.get('user') as User;
    console.log('=== Creando nuevo voluntario ===');
    console.log('Datos recibidos:', body);
    
    const {
      nombre_completo,
      dni,
      correo,
      telefono,
      id_area,
      organizacion,
      id_organizacion,
      disponibilidad,
      availability,
      id_estado,
      estado,
    } = body;
    
    // Validaciones
    if (!nombre_completo || !dni) {
      return c.json({ 
        success: false,
        error: 'Nombre completo y DNI son obligatorios' 
      }, 400);
    }
    
    // Verificar que el DNI no exista ya
    const { data: existente } = await supabase
      .from('usuarios')
      .select('dni')
      .eq('dni', dni)
      .single();
    
    if (existente) {
      return c.json({ 
        success: false,
        error: `Ya existe un voluntario con DNI ${dni}` 
      }, 400);
    }
    
    // Generar usuario Ãºnico
    const usuario = `vol_${dni}`;
    
    // Generar contraseÃ±a aleatoria
    function generarPasswordAleatoria(): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }
    
    // Hash de contraseña
    async function hashPassword(password: string): Promise<string> {
      const bcrypt = await import('npm:bcryptjs');
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    }
    
    const passwordAleatoria = generarPasswordAleatoria();
    const passwordHash = await hashPassword(passwordAleatoria);
    const resolvedOrganizationId = await resolveOrganizationId(id_organizacion, currentUser?.id);
    const activeGeneralId = await getEstadoIdByName('general', 'activo');
    let finalEstadoId = activeGeneralId || 1;

    if (id_estado !== undefined && id_estado !== null && id_estado !== '') {
      const parsedEstadoId = Number(id_estado);
      const estadoInfo = await getEstadoById(parsedEstadoId);
      if (!estadoInfo || estadoInfo.ambito !== 'general') {
        return c.json({
          success: false,
          error: 'id_estado inválido para voluntario (ámbito general)',
        }, 400);
      }
      finalEstadoId = parsedEstadoId;
    } else if (estado !== undefined && estado !== null && String(estado).trim() !== '') {
      const estadoByName = await getEstadoIdByName('general', String(estado));
      if (!estadoByName) {
        return c.json({
          success: false,
          error: 'estado inválido para voluntario (ámbito general)',
        }, 400);
      }
      finalEstadoId = estadoByName;
    }
    
    // Crear voluntario en usuarios
    const { data: nuevoVoluntario, error: errorCreacion } = await supabase
      .from('usuarios')
      .insert({
        nombre_completo,
        dni,
        correo: correo || `voluntario_${dni}@sistema.local`,
        telefono: telefono || null,
        usuario,
        contrasena_hash: passwordHash,
        id_rol: ROLE_IDS.voluntario,
        id_estado: finalEstadoId,
        organizacion: organizacion || null,
        id_area: parseAreaId(id_area),
        disponibilidad: normalizeAvailability(disponibilidad ?? availability),
        id_organizacion: resolvedOrganizationId
      })
      .select()
      .single();
    
    if (errorCreacion) {
      throw new Error(`Error al crear voluntario: ${errorCreacion.message}`);
    }
    
    console.log(`âœ… Voluntario creado: ${nombre_completo} (DNI: ${dni})`);
    
    // Registrar auditorÃ­a
    await logAudit(
      supabase,
      c.get('user')?.id || 'sistema',
      c.get('user')?.name || 'Sistema',
      'CREATE',
      'voluntario',
      nuevoVoluntario.id_usuario,
      { nombre_completo, dni, id_rol: ROLE_IDS.voluntario }
    );
    
    return c.json({
      success: true,
      voluntario: {
        id_usuario: nuevoVoluntario.id_usuario,
        nombre_completo: nuevoVoluntario.nombre_completo,
        dni: nuevoVoluntario.dni,
        id_estado: nuevoVoluntario.id_estado,
        estado: normalizeEstadoName((await getEstadoById(Number(nuevoVoluntario.id_estado)))?.nombre),
      },
      message: 'Voluntario creado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al crear voluntario:', error);
    return c.json({ 
      success: false,
      error: error.message 
    }, 500);
  }
});

const FUNCTION_NAME = 'make-server-7052c263';
const FUNCTIONS_V1_PREFIX = '/functions/v1/';

function getNormalizedPath(req: Request) {
  const url = new URL(req.url);
  const rawPath = url.pathname || '/';
  let path = rawPath;

  // Supabase Edge Functions can forward requests including the deployment prefix:
  // /functions/v1/<function_name>/...
  const markerIndex = path.indexOf(FUNCTIONS_V1_PREFIX);
  if (markerIndex !== -1) {
    const after = path.slice(markerIndex + FUNCTIONS_V1_PREFIX.length); // <function_name>/...
    const slashIndex = after.indexOf('/');
    path = slashIndex === -1 ? '/' : after.slice(slashIndex) || '/';
  }

  // Some setups may forward "/<function_name>/..." (without /functions/v1).
  if (path === `/${FUNCTION_NAME}`) {
    path = '/';
  } else if (path.startsWith(`/${FUNCTION_NAME}/`)) {
    path = path.slice(FUNCTION_NAME.length + 1) || '/';
  }

  if (!path.startsWith('/')) path = `/${path}`;

  return { url, rawPath, path };
}

Deno.serve((req) => {
  const { url, rawPath, path } = getNormalizedPath(req);

  // TEMP logs to verify routing in Supabase (remove after confirming).
  console.log('[router] raw:', rawPath);
  console.log('[router] normalized:', path);
  console.log('[router] method:', req.method);

  url.pathname = path;
  return app.fetch(new Request(url.toString(), req));
});













