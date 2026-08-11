# 🔒 Supabase — Democra

Documentación técnica del uso de Supabase como pieza central de la plataforma.

## 1. Arquitectura Supabase

Democra utiliza Supabase como Backend-as-a-Service unificado:

```
Supabase Project (PT_solaris / qafvnjoqvdtnrdvlnwco)
├── Auth         → Autenticación JWT, sesiones
├── PostgreSQL   → Base de datos relacional (40+ tablas)
├── RLS          → Aislamiento multi-tenant
├── Functions    → Lógica de negocio en PL/pgSQL
├── Triggers     → Automatización (audit, timestamps)
└── Storage      → Archivos (documentos, evidencias, avatares)
```

## 2. Authentication

### Configuración del cliente

```typescript
// src/modules/ong/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'sb-democra-auth-token',  // ← clave compartida
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)
```

### Sesión compartida

El `storageKey: 'sb-democra-auth-token'` es idéntico en todas las instancias del cliente Supabase (app principal, módulo ONG, app ONG legacy). Esto permite que un login en cualquier punto del sistema comparta la sesión automáticamente — sin necesidad de redireccionamientos OAuth ni cookies custom.

### Backend: resolveAuthContext

```javascript
// server/supabase.js
export const resolveAuthContext = async (accessToken) => {
  // Crea un cliente Supabase con el token del usuario
  // Extrae user + profile + tenant_id
  // Retorna contexto de autenticación completo
}
```

El backend **nunca** usa la clave anónima para operaciones sensibles. Usa `SUPABASE_SERVICE_ROLE_KEY` para bypasear RLS cuando necesita acceso administrativo (auditoría, bootstrap de tenant).

## 3. PostgreSQL

- **Versión**: PostgreSQL 16
- **Acceso**: Directo con `@supabase/supabase-js` (sin ORM)
- **Esquema**: `public` (esquema único con aislamiento por RLS)
- **Migraciones**: 14 archivos SQL en `supabase/migrations/`

### Por qué sin ORM

El acceso directo con `supabase-js` ofrece:
- Queries tipados con generics de TypeScript
- Soporte nativo de RLS (el ORM no siempre respeta RLS correctamente)
- Performance predecible (no hay N+1 queries ocultos)
- Menor superficie de ataque (no hay layer de abstracción que pueda bypasear seguridad)

## 4. Schema

El esquema vive en `public` y se organiza por dominio funcional. Todas las tablas comparten el patrón:

```sql
CREATE TABLE IF NOT EXISTS public.tabla (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    -- ... columnas de negocio ...
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.tabla ENABLE ROW LEVEL SECURITY;
```

## 5. Relationships

Las relaciones se definen explícitamente con FK:

```
tenants
  ├── 1:N → profiles (usuarios)
  ├── 1:N → roles (definición de roles)
  ├── 1:N → sedes (ubicaciones)
  ├── 1:N → access_links (motor ACE)
  └── 1:N → [todas las tablas de negocio]

profiles
  └── N:M → roles (vía user_roles_sedes, con sede como dimensión)

roles
  └── 1:N → role_permissions
```

## 6. Row Level Security (RLS)

### Función central

```sql
-- supabase/migrations/20260305110000_rls_hardening_p0.sql
CREATE OR REPLACE FUNCTION public.fn_current_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;
```

Esta función es `SECURITY DEFINER` para que pueda leer `profiles` incluso cuando el usuario aún no tiene policies de SELECT en esa tabla.

### Patrón de policy típico

```sql
-- Lectura: solo datos del propio tenant
CREATE POLICY "tenant_read" ON public.tabla
FOR SELECT TO authenticated
USING (tenant_id = public.fn_current_tenant_id());

-- Escritura: tenant + permiso específico
CREATE POLICY "tenant_write" ON public.tabla
FOR INSERT TO authenticated
WITH CHECK (
    tenant_id = public.fn_current_tenant_id()
    AND public.fn_has_permission('modulo.accion', null)
);
```

## 7. Policies

Las policies siguen un patrón defensivo con tres capas:

1. **Tenant isolation**: `tenant_id = fn_current_tenant_id()` — obligatorio en todas
2. **Permission check**: `fn_has_permission()` — para escrituras y acciones sensibles
3. **Self-access**: `id = auth.uid()` — para datos personales (perfil, cuenta)

Ejemplo real de policy de `profiles`:

```sql
-- supabase/migrations/20260305110000_rls_hardening_p0.sql
CREATE POLICY p_profiles_update ON public.profiles
FOR UPDATE TO authenticated
USING (
    tenant_id = public.fn_current_tenant_id()
    AND (
        id = auth.uid()
        OR public.fn_has_permission('iam.users.manage', null)
        OR public.fn_is_tenant_admin()
    )
)
WITH CHECK (
    tenant_id = public.fn_current_tenant_id()
);
```

## 8. Database Functions

### fn_bootstrap_tenant

```sql
-- supabase/migrations/20260302130000_fn_bootstrap_tenant_v2.sql
-- Función RPC que crea un tenant completo en una transacción atómica:
-- 1. Crea el registro en tenants
-- 2. Crea el profile del administrador
-- 3. Asigna el plan de suscripción
-- 4. Crea roles por defecto
-- 5. Crea la sede principal
-- 6. Asigna el admin al rol de sistema
-- Todo idempotente: si ya existe, no duplica
```

### fn_has_permission

```sql
-- Verifica si el usuario autenticado tiene un permiso específico
-- Consulta: user_roles_sedes → roles → role_permissions
-- Opcionalmente filtrado por sede_id
```

### fn_get_user_redirect_target

```sql
-- supabase/migrations/20260706120000_fn_get_user_redirect_target.sql
-- Determina la ruta de redirección post-login basándose en:
-- 1. Módulos activos del tenant
-- 2. Rol del usuario
-- 3. Industria de la organización
```

## 9. Triggers

### fn_set_updated_at

Trigger que se aplica a todas las tablas con columna `updated_at`:

```sql
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### fn_trigger_audit_universal

Trigger de auditoría que registra automáticamente:
- Operación (INSERT, UPDATE, DELETE)
- Tabla afectada
- Datos anteriores y nuevos (old_data, new_data como JSONB)
- Usuario que realizó la acción
- Timestamp

## 10. Storage

Implementación en `src/modules/ong/app/services/shared/storage.ts`:

- **Upload**: Con validación de tipo MIME antes de subir
- **Buckets**: Organizados por tipo de contenido (documentos, evidencias, avatares)
- **Acceso**: Controlado por policies de Storage (alineadas con RLS de la tabla asociada)

## 11. Edge Functions

Actualmente **no implementadas**. La lógica serverless se maneja via Express en Vercel Serverless Functions (`api/server.js`).

## 12. Client Integration

### Frontend (anon key)

```typescript
// Queries con RLS automático
const { data } = await supabase
    .from('voluntarios')
    .select('*')
    .eq('status', 'active')
// RLS filtra automáticamente por tenant_id del usuario logueado
```

### Backend (service_role key)

```javascript
// server/supabase.js — bypasea RLS para operaciones administrativas
import { createClient } from '@supabase/supabase-js'
export const serviceClient = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey
)
```

El `serviceClient` solo se usa en el backend para:
- Auditoría (escribir logs que el usuario no debe poder borrar)
- Bootstrap de tenant (crear datos antes de que existan policies)
- Verificación de permisos cross-tenant

### Tenant scoping en backend

```javascript
// server/utils/tenant-scope.js
export const applyTenantScope = (query, tenantId, column, context) => {
    // Aplica .eq(column, tenantId) a la query
    // Lanza error si tenantId es null/undefined
}

export const assertTenantScope = (tenantId, context) => {
    // Valida que tenantId existe y es un UUID válido
    // Previene queries sin scope de tenant
}
```

## 13. Security Model

```
Capa 1: Supabase Auth (JWT)
  → Solo usuarios autenticados acceden

Capa 2: RLS (PostgreSQL)
  → Solo datos del propio tenant

Capa 3: fn_has_permission()
  → Solo si tiene el permiso específico

Capa 4: Backend validation
  → assertTenantScope() previene bypass

Capa 5: service_role isolation
  → Solo el backend tiene acceso admin
  → La clave nunca llega al frontend
```

## 14. Data Flow

```
Frontend: supabase.from('tabla').select()
    ↓
Supabase: recibe JWT del usuario
    ↓
PostgreSQL: ejecuta query
    ↓
RLS: fn_current_tenant_id() filtra por tenant
    ↓
Results: solo datos del tenant del usuario
    ↓
Frontend: renderiza datos filtrados
```

## 15. Decisiones técnicas

### ¿Por qué Supabase y no Firebase?
- PostgreSQL relacional vs Firestore NoSQL
- RLS nativo a nivel de base de datos (Firebase no tiene equivalente)
- SQL estándar para queries complejas (JOINs, aggregations)
- Funciones PL/pgSQL para lógica de negocio en la base de datos
- Migraciones SQL versionadas (Firebase requiere herramientas externas)

### ¿Por qué un solo esquema `public`?
- Supabase RLS funciona mejor con esquema único
- Multi-tenant por `tenant_id` + RLS es más flexible que schema-per-tenant
- Simplifica migraciones (un solo esquema que migrar)
- Performance: PostgreSQL optimiza mejor un esquema con índices que múltiples esquemas

### ¿Por qué `@supabase/supabase-js` sin ORM?
- Control total sobre las queries
- RLS se aplica correctamente (algunos ORMs lo bypasean)
- Tipado directo con generics de TypeScript
- Menor superficie de ataque
