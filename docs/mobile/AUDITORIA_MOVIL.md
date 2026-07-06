# AUDITORÍA INTEGRAL — Arquitectura Democra (para migración a React Native)

Fecha: 2026-07-04 · Tipo: solo lectura · Objetivo: viabilidad de app móvil con máxima reutilización.

---

## 1. Topología del repositorio

El repositorio es un **monorepo con tres aplicaciones + backend Supabase**:

| App | Ruta | Puerto (dev) | Rol |
|-----|------|--------------|-----|
| Sitio público + Login | `src/` (raíz) | 5173 | Landing marketing (`/`, `/nosotros`), `LoginGateway`. Autentica y hace *relay* de sesión al SPA ONG. |
| SPA Tenant (producto real) | `ONG/` | 5174 | Dashboard operativo del tenant. Espejo de `src/modules/ong/`. Sirve `/app/**`. |
| API de seguridad | `server/` | 8787 | Express 5 "AI Security Copilot": motor de riesgo, OTP/MFA step-up, login por PIN de terminal, auditoría. Proxy `/api` en Vite. |
| Backend gestionado | Supabase | — | Postgres multi-schema, Auth, Storage, Realtime, RLS, RPC, migraciones. |

**Observación clave:** `src/modules/ong/**` y `ONG/src/app/**` contienen la misma capa de aplicación del tenant (servicios, hooks, páginas). La app móvil debe consumir **esa capa** (servicios + tipos + hooks de datos), no el marketing ni la shell web.

### 1.1 Scripts relevantes (`package.json`)
- `dev:all` levanta en paralelo API (8787), web admin/landing (5173) y ONG (5174) con `concurrently`.
- `build` = `vite build`; `typecheck` = `tsc --noEmit`; `validate` = `scripts/validate-env.mjs`.
- No hay script de test unitario/e2e configurado (ver RIESGOS).

---

## 2. Estructura de carpetas (capa ONG — objetivo de reutilización)

```
src/modules/ong/
├── supabaseClient.ts            # Cliente Supabase del tenant (schema "ong")
├── lib/db/                      # Abstracción de cliente/creación multi-módulo
│   ├── core.ts                  # createSupabaseModuleManager (anon/service por prefijo de env)
│   └── ong/{client,types,app-database}.ts  # Tipos generados de la DB (AppDatabase)
├── app/
│   ├── pages/                   # ~40 páginas (Beneficiaries, Volunteers, Projects, Finance, …)
│   ├── services/                # CAPA DE NEGOCIO por dominio (agnóstica de UI)
│   │   ├── personas/  proyectos/  operacion/  recursos/  gobernanza/
│   │   ├── admision/  academico/  clinico/  configuracion/  notificaciones/  ace/
│   │   └── shared/storage.ts    # Subida a Storage (usa File — dependencia web)
│   ├── modules/                 # Feature-modules: hooks + types + forms + components
│   │   └── {home,people,projects,operation,admission,resources,governance,
│   │         notifications,settings}/hooks/*.ts
│   ├── components/ui/           # ~60 componentes shadcn/Radix (SOLO WEB)
│   ├── components/{shared,layout,figma}/  # DataTable, AppShell, Sidebar, Topbar (SOLO WEB)
│   ├── tenant/                  # bootstrap.ts, permissions.ts, navigation.tsx (registry)
│   └── lib/                     # session-state, useGlobalShortcuts, use-file-preview, utils
├── styles/                      # CSS/Tailwind (SOLO WEB)
core/tenant/                     # access.ts (RBAC), navigation.ts, moduleRegistry, registry-types
industries/ong/registry.tsx     # Definición de módulos → rutas → permisos (fuente de verdad de RF)
```

**Conclusión estructural:** hay una separación razonable entre **servicios/hooks (lógica)** y **components/pages/styles (presentación)**. Esto favorece la reutilización: la lógica vive en `services/*` y `modules/*/hooks/*`, mientras que la UI web vive en `components/ui`, `pages` y `styles`.

---

## 3. Autenticación y sesión

### 3.1 Mecanismo
- **Supabase Auth** con `signInWithPassword` (email + password). Ver `src/app/LoginGateway.tsx`.
- Cliente creado con:
  ```ts
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  ```
- **Relay cross-port (web):** tras autenticar en :5173, se pasa `access_token`/`refresh_token`/`expires_in` al SPA ONG (:5174) vía *URL hash* a `/auth/callback`; el cliente ONG detecta la sesión (`detectSessionInUrl`). **Este mecanismo NO aplica en móvil** (una sola app), lo cual simplifica el flujo.
- **JWT + refresh token** gestionados por Supabase. En web se persisten en `localStorage` (default de supabase-js).

### 3.2 Capa de seguridad avanzada (API Express `server/`)
Backend adicional que endurece el login y las acciones críticas:
- `POST /api/auth/risk-evaluate` — motor de riesgo (`security/risk-engine.js`); decide `ALLOW` / `REQUIRE_OTP` / `BLOCK` según IP, user-agent, device fingerprint, geo, sesiones concurrentes.
- `POST /api/auth/step-up/verify-otp` y `/resend-otp` — **MFA step-up por OTP** (email vía Resend; `MFA_OTP_TTL_MINUTES=10`, pepper).
- `POST /api/auth/terminal-login` — login por **PIN** en terminales físicas (bcrypt `pin_hash`, bloqueo tras `MAX_PIN_ATTEMPTS=5`).
- Auditoría de cada evento (`security/audit.js`, `insertAuthEvent`, `insertAuditLog` con `includeAiSummary`).
- Scope de tenant forzado server-side (`utils/tenant-scope.js`: `assertTenantScope`, `applyTenantScope`).

**Implicación móvil:** estos endpoints son **HTTP REST estándar** con `Authorization: Bearer <access_token>` → reutilizables tal cual desde RN. El *device fingerprint* y el *user-agent* deberán generarse con librerías nativas (`expo-device`, `expo-application`). El OTP por email funciona igual.

### 3.3 Bootstrap de contexto de tenant (`app/tenant/bootstrap.ts`)
Al iniciar sesión, `bootstrapTenantContext()`:
1. `supabase.auth.getUser()`.
2. Lee `public.profiles` (perfil + `tenant_id`).
3. Lee `public.tenants` (industria, plan, estado financiero, `max_licenses`).
4. Verifica límite de licencias.
5. En paralelo resuelve: `resolveRoleAssignments` (roles×sedes + memberships ACE), `resolvePermissionMap` (60+ permisos vía RPC `fn_has_permission`), `resolveTenantAdmin` (RPC `fn_is_tenant_admin`), y `tenant_modules`.
6. Devuelve `TenantContextValue` con `modules`, `permissions`, `permissionMap`, `roleAssignments`, `financialPolicy`.

**Reutilizable en móvil casi al 100%** — es TypeScript puro sobre el cliente Supabase; solo depende de `localStorage` para "última ruta" (fácilmente sustituible por AsyncStorage y no crítico).

---

## 4. Autorización, roles y permisos (RBAC)

- Núcleo en `core/tenant/access.ts`: `hasPermission`, `hasAnyPermission`, `canAccessModule`, `canAccessRegisteredModule`, `canAccessRegisteredRoute`, `isFinanciallyReadOnly/Suspended`.
- **Modelo:** `isTenantAdmin` ⇒ acceso total; en caso contrario se consulta `permissionMap[permission]`.
- **Catálogo de ~60 permisos** declarado en `bootstrap.ts` (`TENANT_PERMISSION_CANDIDATES`): `home.read`, `projects.*`, `operation.*` (activities/hours/attendance/evidence, con `.read/.manage/.approve`), `admission.*`, `resources.inventory.*`, `resources.finance.*`, `notifications.*`, `governance.*`, `settings.*`, `clinico.volunteer_sensitive.read`, `idcards.*`, `ace.*`, `iam.*`, `attendance.scan`, `volunteers.invite/register`, `devices.*`, `terminals.*`.
- **Doble aplicación:** el permiso se evalúa en cliente (para UI/navegación) **y** en la DB vía RLS (fuente de verdad). Esto es exactamente lo que se quiere para móvil: la seguridad no depende del cliente.

**Reutilizable en móvil al 100%** (lógica pura). La app móvil usará el mismo `permissionMap` y las mismas funciones `hasPermission`.

---

## 5. Registro de módulos, rutas y navegación

- Fuente de verdad: `industries/ong/registry.tsx` → 15 definiciones de módulo, cada una con `routes[]`, `requiredPermissions`, `moduleKeys`, `menuGroup`, `element` (componente React web).
- `core/tenant/moduleRegistry.tsx` aplana módulos→rutas; `core/tenant/navigation.ts` construye sidebar, comandos, shortcuts, ruta inicial y redirects legacy.
- **Módulos:** home, projects, operation, approvals, people, admission, resources.inventory, resources.finance, clinico, notifications, governance, settings.users, settings.roles, settings.sessions, settings.ace.

**Reutilización móvil:** la **metadata** del registry (ids, labels, permisos, agrupación) es reutilizable para construir la navegación nativa; el campo `element: <Page/>` (JSX web) **no** es reutilizable y se reemplaza por *screens* nativas. Recomendación: extraer la metadata a un módulo agnóstico y que web y móvil la consuman.

---

## 6. Consumo de datos (capa de servicios)

- Patrón: cada dominio tiene `shared.ts` (helpers de esquema, saneamiento, tenant, errores) + `*.service.ts` (operaciones CRUD/consulta).
- Acceso directo a Supabase con `.schema("<schema>").from("<tabla>")` — **client-side**, protegido por RLS.
- Esquemas usados desde el cliente: `ong`, `public`, `rrhh`, `clinico`, `comunicaciones`, `auditoria`, `finanzas`, `academico`.
- Tipado fuerte con `AppDatabase` (tipos generados de la DB) en `lib/db/ong/app-database.ts`.
- Saneamiento y validación en cliente: `sanitizeText`, `sanitizePhone`, `normalizeDateValue`, `stripAccents`, `resolveActorId`, `createTenantScopedQuery` (en cada `shared.ts`).
- Hooks de datos por feature (`modules/*/hooks/use*.ts`): orquestan servicios, estado de carga, mutaciones, detalle. **No usan React Query** — usan `useState`/`useEffect` propios (ver RIESGOS: sin caché normalizada).

**Reutilizable en móvil:** los `*.service.ts`, `*/types.ts`, `*/forms.ts`, `shared.ts` (excepto donde tocan `File`/DOM) y la mayoría de hooks. Es la porción de mayor valor a reutilizar.

---

## 7. Estado global, contextos y providers

- `TenantBootstrapProvider.tsx` — provee el `TenantContextValue` a toda la app (React Context).
- `app/lib/theme-context.tsx` — tema (claro/oscuro).
- `core/ui-state/persistence.ts` + `app/lib/session-state.ts` — persistencia de estado de UI (usa `localStorage`).
- No hay Redux/Zustand/Jotai ni React Query. El estado del servidor se maneja ad-hoc en hooks.

**Móvil:** Context API es reutilizable. La persistencia de UI (`localStorage`) debe migrar a `AsyncStorage`. **Se recomienda introducir React Query / TanStack Query en móvil** para caché, reintentos y soporte offline (ver OFFLINE_FIRST.md).

---

## 8. Almacenamiento de archivos (Storage)

- `app/services/shared/storage.ts`: `uploadFileToStorage()` sube a buckets Supabase Storage.
- Buckets: `evidence` (privado), `avatars` (público), documentos de registro/admisión, `finance-receipts`.
- Rutas **tenant-scoped**: prefijo resuelto por RPC `fn_current_tenant_id`; nombres saneados + timestamp.
- **Dependencia web:** la API recibe un objeto `File` del DOM (`request.file: File`) y usa `import.meta.env.VITE_*` para nombres de bucket.

**Móvil:** requiere adaptación media:
- Reemplazar `File` (DOM) por el resultado de `expo-image-picker`/`expo-document-picker` (uri + tipo). Supabase JS en RN acepta `FormData`, `Blob`/`ArrayBuffer` o base64.
- Sustituir `import.meta.env` por `expo-constants`/`process.env` (variables `EXPO_PUBLIC_*`).
- `getPublicUrl` y `getStoragePublicUrl` funcionan igual.

---

## 9. Realtime y notificaciones

- `useNotificationsRealtime.ts`: `supabase.channel(...).on("postgres_changes", { event: "INSERT", schema: "comunicaciones", table: "historial_notificaciones", filter: id_usuario=eq.<user> })`.
- Notificaciones **in-app** basadas en cambios de Postgres (Supabase Realtime).
- **No hay push nativo** (FCM/APNs) — oportunidad Mobile First (ver RF_NUEVOS).

**Móvil:** Supabase Realtime funciona en RN (websocket). El hook es reutilizable. Añadir **push real** con `expo-notifications` + tabla de tokens + Edge Function/trigger.

---

## 10. Integraciones externas detectadas

| Integración | Uso | Reutilizable en móvil |
|-------------|-----|------------------------|
| **Supabase** (Auth/DB/Storage/Realtime/RLS/RPC) | Núcleo de datos y sesión | ✅ Sí (SDK oficial RN) |
| **API Express `server/`** (risk/OTP/PIN/audit) | Seguridad de login y acciones críticas | ✅ Sí (REST + Bearer) |
| **Resend** | Envío de OTP por email | ✅ Sí (server-side, transparente) |
| **SUNAT / RUC** (`api.apis.net.pe`) | Validación de RUC (Perú) en onboarding | ✅ Sí (REST) |
| **OpenAI** | Campos legacy, **no** usados en decisiones | ⚪ Irrelevante |

---

## 11. Configuración y variables de entorno

- Frontend (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ONG_APP_URL`, `VITE_*_BUCKET`, `VITE_RUC_API_URL`, `VITE_ONG_DB_SUPABASE_*`.
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `API_PORT`, `MFA_OTP_*`, `SESSION_TTL_HOURS`, `MAX_PIN_ATTEMPTS`, `RESEND_API_KEY`, `RUC_API_TOKEN`.
- **Móvil:** las `VITE_*` se traducen a `EXPO_PUBLIC_*` (o `app.config.ts` + `expo-constants`). El `SERVICE_ROLE_KEY` **jamás** debe embarcarse en la app (ya está protegido server-side con `assertServerOnlyClientUsage`).

---

## 12. Manejo de errores

- `src/shared/error-explainer.js` — mapa de códigos (`IAM-00x`, `TEN-00x`) a mensajes de usuario. Compartido entre `server/` y front. **Reutilizable en móvil.**
- Servicios usan `toFriendlyError`/`try-catch` por dominio.
- No hay boundary global de errores ni telemetría (Sentry) — recomendado para móvil.

---

## 13. Base de datos (resumen; detalle en BASE_DATOS_MOVIL.md)

- Postgres con esquemas de dominio: `public` (tenants, profiles, roles, sedes, memberships, user_roles_sedes, catálogos, terminals, sessions), `ong`, `rrhh`, `clinico`, `comunicaciones`, `finanzas`, `auditoria`, `academico`, + ACE.
- **RLS endurecido**: migraciones `20260305*_rls_hardening*`, `schema_guard`, `ace_fase3_rls_policies`. ~75 sentencias de creación (tablas/policies/funciones).
- Funciones RPC de seguridad: `fn_has_permission(p_permission)`, `fn_is_tenant_admin()`, `fn_current_tenant_id()`.
- Estado financiero por tenant (`FIN-ACTIVE/GRACE/READONLY/SUSPENDED/…`) que puede forzar solo-lectura o bloqueo.

**Veredicto DB:** la base **ya soporta** una app móvil sin cambios estructurales, porque la seguridad es server-side (RLS) e independiente del cliente. Cambios recomendados (no obligatorios): tabla de `push_tokens`, columnas/índices para sincronización offline (`updated_at`, `deleted_at`), y vistas/RPC de *delta sync*. Ver BASE_DATOS_MOVIL.md.

---

## 14. Veredicto de viabilidad

**Alta viabilidad.** El sistema está diseñado con la seguridad en el backend (RLS + RPC + API de riesgo), lo que permite que un segundo cliente (móvil) consuma exactamente los mismos datos y reglas sin duplicar lógica de seguridad. La lógica de negocio (servicios, tipos, validaciones, permisos, bootstrap) es mayoritariamente agnóstica de plataforma.

El esfuerzo se concentra en: (1) **reconstruir la UI** con componentes nativos, (2) **adaptar 3 puntos de acoplamiento web** — persistencia de sesión, subida de archivos y variables de entorno, y (3) **añadir la capa offline/push** que hoy no existe. Estimación de reutilización de lógica: **70-80%**.
