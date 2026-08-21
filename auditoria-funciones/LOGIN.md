# AUDITORÍA DE FLUJO: Acceso y Login

## 0. IDENTIFICACIÓN Y ALCANCE
- **Nombre del Flujo**: Autenticación Central (Login Gateway), Enrutamiento y Bootstrap de Tenant.
- **Actor Principal**: Usuarios administradores y regulares con cuenta en Democra.
- **Punto(s) de Entrada**: 
  - `src/app/LoginGateway.tsx` (UI principal de Login)
  - Rutas de backend `server/routes/auth.js` (Terminales, Risk Engine, OTP).
- **Estado General**: [EXISTENTE / DOCUMENTADO PARCIALMENTE]

---

## 1. COMPONENTES Y RESPONSABILIDADES

### Frontend (SPA / React)
- **`src/app/LoginGateway.tsx`**: Formulario de ingreso. Captura credenciales (email/password). Orquesta la llamada a Supabase Auth, resuelve el destino del usuario y realiza la redirección.
- **`src/modules/ong/app/tenant/TenantBootstrapProvider.tsx`**: Proveedor de contexto React que maneja el ciclo de vida del estado de la sesión, cache en `sessionStorage` y re-verificación en background.
- **`src/modules/ong/app/tenant/bootstrap.ts`**: Lógica de construcción del `TenantContextValue`. Verifica perfil, tenant, licencias, estado financiero, roles (ACE y URS), permisos y módulos habilitados.

### Backend / Base de Datos (Supabase / Express)
- **`public.profiles` y `public.tenants`**: Tablas núcleo que almacenan la relación Usuario-Tenant y configuraciones clave (estado financiero, max_licenses, industry_type_id).
- **`fn_get_user_redirect_target()`**: RPC (Stored Procedure en PostgreSQL). `SECURITY DEFINER`. Devuelve el `industry_type_id` del tenant al que pertenece el usuario autenticado sin exponer la tabla `public.tenants` al RLS público (que es *deny-all*).
- **`server/routes/auth.js`**: Endpoints de seguridad avanzada: `/risk-evaluate`, `/step-up/verify-otp`, `/step-up/resend-otp` y `/terminal-login` (autenticación por PIN delegada).

---

## 2. PROTOCOLO Y FLUJO DE DATOS PASO A PASO

1. **Ingreso de Credenciales**: El usuario introduce email y contraseña en `LoginGateway.tsx`.
2. **Autenticación Primaria**: Se llama a `supabase.auth.signInWithPassword({ email, password })`. Supabase valida y devuelve una sesión JWT.
3. **Resolución de Destino (Routing)**:
   - El cliente llama a `supabase.rpc("fn_get_user_redirect_target")`.
   - En base de datos, la RPC identifica al `auth.uid()` actual, hace un JOIN entre `public.profiles` y `public.tenants`, y retorna el `industry_type_id` (ej. `'ong'`, `'gym'`, `'root'`).
   - El frontend evalúa el resultado. Si es `"ong"`, el usuario es redirigido mediante `window.location.assign("/ong/")`. Otros valores muestran mensajes de "módulo no disponible" o "sin organización".
4. **Bootstrap del Tenant (Post-Redirección a `/ong/`)**:
   - `TenantBootstrapProvider.tsx` detecta la sesión.
   - Ejecuta `bootstrapTenantContext()` en `bootstrap.ts`.
   - Se valida la existencia del perfil (`public.profiles`) y del tenant (`public.tenants`).
   - **Validación de Licencias**: Si `max_licenses > 0`, cuenta los perfiles activos del tenant. Bloquea si excede.
   - **Validación Financiera**: Parsea `status_financial_id` (ej. `FIN-SUSPENDED`, `FIN-READONLY`, `FIN-ACTIVE`).
   - **Carga de Roles y Permisos**: Obtiene roles desde `user_roles_sedes` y de membresías en ACE (`memberships` con contexto `SEDE`). Cruza permisos reales iterando `TENANT_PERMISSION_CANDIDATES` contra la RPC `fn_has_permission`.
   - **Carga de Módulos**: Consulta `public.tenant_modules` para saber qué secciones de la app cargar (Fallback a `INDUSTRY_DEFAULT_MODULES` si no existe config).
5. **Caching**: El resultado se guarda en `sessionStorage` (`democra.tenant.bootstrap.v1`) para evitar re-bootstraping en recargas de página simples.

---

## 3. CONTRATOS, VARIABLES Y ESTRUCTURAS DESCUBIERTAS

### Variables Clave de Sesión (Frontend)
- `TENANT_BOOTSTRAP_CACHE_KEY = "democra.tenant.bootstrap.v1"` (Session Storage)
- `LAST_TENANT_ROUTE_STORAGE_KEY_PREFIX = "democra.tenant.last-route"` (Local Storage)
- Identificador de Auth nativo de Supabase: Guardado usualmente en local storage (`sb-<project-ref>-auth-token`).

### Estructura del Contexto (TenantContextValue)
```typescript
{
  user: { id, email },
  profile: { id, tenantId, fullName },
  tenant: { id, name, industryTypeId, planId, statusFinancialId },
  modules: { home, ong, projects, operation, ... }, // Banderas booleanas
  modulePolicy: "fallback" | "explicit",
  permissions: string[], // Arreglo plano de permisos habilitados
  permissionMap: Record<string, boolean>,
  roleAssignments: { roleId, roleName, sedeId, sedeName }[],
  isTenantAdmin: boolean,
  financialPolicy: { statusFinancialId, isReadOnly, isSuspended, label, message }
}
```

### Respuestas de API de Seguridad (`auth.js`)
- En `/risk-evaluate`, si la decisión es `REQUIRE_OTP`, el contrato de respuesta exige:
  - `risk_level`, `decision`, `challenge_id`, `session_id`, etc.
  - Bloquea interacciones críticas o inicios de sesión sospechosos.

---

## 4. REGLAS DE NEGOCIO Y LÓGICA IMPLÍCITA

1. **Aislamiento Estricto por RLS**: La tabla `public.tenants` tiene un RLS "deny-all" para el cliente público. No se puede leer directamente, forzando el uso de `fn_get_user_redirect_target` (`SECURITY DEFINER`) para saber hacia dónde navegar sin filtrar datos sensibles.
2. **Hardcoding de Industrias**: El `LoginGateway.tsx` tiene hardcodeado que solo la respuesta `'ong'` permite el paso al módulo `/ong/`. Otras industrias (ej. `'gym'`, `'retail'`, `'health'`) están codificadas en `bootstrap.ts` (`INDUSTRY_DEFAULT_MODULES`), pero actualmente bloqueadas en el Login si se intentan usar.
3. **Múltiples Fuentes de Roles (Transición ACE)**: `bootstrap.ts` combina roles legados de `user_roles_sedes` (URS) con el nuevo motor ACE (`memberships` con contexto `SEDE`). Esto implica un sistema en transición.
4. **Estados Financieros Bloqueantes**: Si el tenant tiene estado `FIN-SUSPENDED`, el acceso de escritura se deniega en UI o se suspende totalmente (controlado en `resolveFinancialPolicy`).

---

## 5. HALLAZGOS Y EVALUACIÓN DE ARQUITECTURA

### 🟢 Aspectos Positivos y de Alta Calidad
- **Aislamiento Multi-Tenant Excelente**: El uso de una RPC (`SECURITY DEFINER`) para abstraer el enrutamiento y no romper la regla "deny-all" en la tabla `tenants` demuestra un conocimiento profundo de AppSec y RLS en Supabase.
- **Risk Engine y Audit**: El backend en Express (`routes/auth.js`) tiene un motor de riesgos (`/risk-evaluate`), evaluaciones OTP (step-up) y un registro de auditoría (`insertAuditLog`) altamente detallado para logins terminales. Muy robusto.
- **Resolución Condicional de Contexto**: El Bootstrap maneja con gracia fallos y caídas a defaults (Fallback Modules), limitando el blast radius.

### 🔴 Riesgos, Fragilidad o Deuda Técnica
- **Resolución O(N) de Permisos**: `resolvePermissionMap` en `bootstrap.ts` itera sobre un array constante de ~30 permisos (`TENANT_PERMISSION_CANDIDATES`) e invoca `fn_has_permission` iterativamente usando `Promise.all`. **Si el array de candidatos crece, esto podría generar un pico masivo de llamadas RPC simultáneas a Supabase durante el inicio de sesión**, superando límites de concurrencia y haciendo el bootstrap lento. Sería más óptimo una única RPC que retorne todos los permisos en lote.
- **Duplicidad de Modelos RBAC**: La fusión manual en frontend de `user_roles_sedes` y `memberships` (ACE) añade complejidad lógica. 
- **Hardcoding Frontend en Routing**: La lógica de `LoginGateway.tsx` requiere un update de código manual cada vez que se agregue una nueva industria (ej. si se habilita el módulo "gym"). Sería mejor un motor dinámico impulsado por metadatos del backend.

### 🟡 Aspectos Desconocidos o Pendientes
- No se evidencia en `LoginGateway.tsx` la invocación directa a `/risk-evaluate` u OTP. Es probable que la invocación a la API de Risk Engine esté acoplada en un Interceptor u otro flujo secundario (como acciones críticas), o implementada en otras pantallas no evaluadas en la puerta de enlace inicial.
