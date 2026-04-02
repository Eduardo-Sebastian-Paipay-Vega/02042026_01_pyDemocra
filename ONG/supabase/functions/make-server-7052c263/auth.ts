import { Context } from 'npm:hono';
import { User, Role } from './types.ts';
import * as kv from './kv_store.tsx';
import * as jose from 'npm:jose';

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
let jwtSecretCache: Uint8Array | null = null;

const normalizeRoleName = (value?: string | null): string => {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'jefa') return 'principal';
  if (normalized === 'responsable') return 'trabajador';
  return normalized;
};

const getUserRoleName = (user?: User | null): string => {
  return normalizeRoleName(user?.roles?.nombre || user?.role || '');
};

function getJWTSecret(): Uint8Array | null {
  if (jwtSecretCache) return jwtSecretCache;

  const secret = Deno.env.get('JWT_SECRET')?.trim();
  if (!secret || secret.length < 32) {
    console.error('JWT_SECRET no esta configurado o es demasiado corto. Minimo recomendado: 32 caracteres.');
    return null;
  }

  jwtSecretCache = new TextEncoder().encode(secret);
  return jwtSecretCache;
}

function requireJWTSecret(): Uint8Array {
  const secret = getJWTSecret();
  if (!secret) {
    throw new Error('JWT_SECRET_MISSING');
  }
  return secret;
}

// Funcion para generar JWT
export async function generateJWT(user: User): Promise<string> {
  const jwtSecret = requireJWTSecret();
  const now = Math.floor(Date.now() / 1000);
  const roleName = getUserRoleName(user);

  return await new jose.SignJWT({
    userId: user.id,
    email: user.email,
    role: roleName,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(jwtSecret);
}

// Funcion para verificar JWT
export async function verifyJWT(token: string): Promise<any> {
  try {
    if (!token || token.trim() === '') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const jwtSecret = requireJWTSecret();
    const { payload } = await jose.jwtVerify(token, jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!payload || typeof payload.userId !== 'string') {
      return null;
    }

    return payload;
  } catch (error: any) {
    if (error?.message === 'JWT_SECRET_MISSING') {
      throw error;
    }
    return null;
  }
}

// Middleware para verificar autenticacion con JWT
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  try {
    const accessToken = c.req.header('X-Access-Token')?.trim();

    if (!accessToken) {
      return c.json(
        {
          error: 'No autorizado - Falta token de autenticacion',
          errorType: 'MISSING_TOKEN',
          message: 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.',
        },
        401,
      );
    }

    if (accessToken === 'undefined' || accessToken === 'null') {
      return c.json(
        {
          error: 'Token no proporcionado correctamente',
          errorType: 'INVALID_TOKEN_VALUE',
          message: 'El token de sesion no esta disponible. Por favor, inicia sesion nuevamente.',
        },
        401,
      );
    }

    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return c.json(
        {
          error: 'Token con formato invalido',
          errorType: 'INVALID_TOKEN_FORMAT',
          message: 'El token de sesion tiene un formato invalido. Por favor, inicia sesion nuevamente.',
        },
        401,
      );
    }

    const payload = await verifyJWT(accessToken);

    if (!payload || !payload.userId) {
      return c.json(
        {
          error: 'Token invalido o expirado',
          errorType: 'TOKEN_EXPIRED_OR_INVALID',
          message: 'Tu sesion ha expirado o el token es invalido. Por favor, inicia sesion nuevamente.',
        },
        401,
      );
    }

    const userData = await kv.get<User>(`users:${payload.userId}`);

    if (!userData) {
      return c.json(
        {
          error: 'Sesion invalida - Usuario no encontrado. Por favor, vuelve a iniciar sesion.',
          errorType: 'USER_NOT_IN_KV',
          message: 'Tu sesion es invalida. Por favor, inicia sesion nuevamente.',
        },
        401,
      );
    }

    c.set('user', userData);
    c.set('userId', payload.userId);

    await next();
  } catch (error: any) {
    if (error?.message === 'JWT_SECRET_MISSING') {
      return c.json(
        {
          error: 'Configuracion de autenticacion incompleta',
          errorType: 'JWT_SECRET_MISSING',
          message: 'El servidor no tiene JWT_SECRET configurado correctamente.',
        },
        500,
      );
    }

    return c.json(
      {
        error: 'Error de autenticacion interno',
        errorType: 'INTERNAL_ERROR',
        message: 'Ocurrio un error al verificar tu sesion. Por favor, inicia sesion nuevamente.',
        details: error.message,
      },
      500,
    );
  }
}

// Middleware para verificar rol especifico
export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as User;
    const userRole = getUserRoleName(user);
    const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRoleName(role));

    if (!user || !normalizedAllowedRoles.includes(userRole)) {
      return c.json({ error: 'Acceso denegado. Permisos insuficientes.' }, 403);
    }

    await next();
  };
}

// Funcion auxiliar para registrar auditoria (sobrecarga para compatibilidad)
export async function logAudit(
  userIdOrSupabase: string | any,
  userNameOrUserId?: string,
  actionOrUserName?: string,
  entityOrAction?: string,
  entityIdOrEntity?: string,
  changesOrEntityId?: any,
  finalChanges?: any,
) {
  let userId: string;
  let userName: string;
  let action: string;
  let entity: string;
  let entityId: string;
  let changes: any;

  // Detectar si el primer parametro es Supabase client o userId
  if (typeof userIdOrSupabase === 'string') {
    // Llamada antigua: logAudit(userId, userName, action, entity, entityId, changes)
    userId = userIdOrSupabase;
    userName = userNameOrUserId!;
    action = actionOrUserName!;
    entity = entityOrAction!;
    entityId = entityIdOrEntity!;
    changes = changesOrEntityId;
  } else {
    // Llamada nueva: logAudit(supabase, userId, userName, action, entity, entityId, changes)
    userId = userNameOrUserId!;
    userName = actionOrUserName!;
    action = entityOrAction!;
    entity = entityIdOrEntity!;
    entityId = changesOrEntityId!;
    changes = finalChanges;
  }

  const auditId = `audit:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await kv.set(auditId, {
    id: auditId,
    userId,
    userName,
    action,
    entity,
    entityId,
    changes,
    timestamp: new Date().toISOString(),
  });
}
