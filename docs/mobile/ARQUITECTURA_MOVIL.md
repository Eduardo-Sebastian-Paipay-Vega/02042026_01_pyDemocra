# ARQUITECTURA PROPUESTA — React Native (Expo)

Fecha: 2026-07-04. Propuesta para la fase de implementación. La estructura inicial se crea en `/mobile` (solo scaffolding, sin lógica).

## 1. Principios

1. **Backend intacto:** reutilizar Supabase + API Express sin duplicar reglas de seguridad.
2. **Lógica compartida:** consumir la capa de servicios/tipos/RBAC del proyecto web (idealmente vía paquete compartido).
3. **UI independiente y nativa:** design system propio, navegación por stacks/tabs.
4. **Offline First** desde el diseño (no como parche).
5. **Seguridad:** tokens en almacenamiento seguro; datos sensibles nunca en caché local.

## 2. Stack

| Capa | Tecnología |
|------|------------|
| Runtime | Expo + React Native + TypeScript |
| Navegación | Expo Router (file-based) + `expo-linking` (deep links) |
| Estado servidor | TanStack Query (+ persister para offline) |
| Estado cliente | Context API (reutilizado) / Zustand puntual |
| Datos | `@supabase/supabase-js` |
| Sesión | `expo-secure-store` como storage de Supabase Auth |
| Persistencia local | SQLite (`expo-sqlite` / WatermelonDB) + MMKV/AsyncStorage para KV |
| Formularios | `react-hook-form` |
| Red/estado | `@react-native-community/netinfo` |
| Media | `expo-camera`, `expo-image-picker`, `expo-image`, `expo-location` |
| Push | `expo-notifications` |
| Seguridad extra | `expo-local-authentication` (biometría), `expo-device` (fingerprint) |
| Observabilidad | Sentry (`@sentry/react-native`) |

## 3. Estructura de carpetas `/mobile`

```
mobile/
├── app/                      # Expo Router (rutas = archivos). Grupos por auth y por tabs.
│   ├── (auth)/               # login, otp, biometría
│   ├── (tabs)/               # home, operación, personas, notificaciones, más
│   └── _layout.tsx           # providers raíz + guard de sesión
├── src/
│   ├── components/           # UI atómica nativa (Button, Card, Input, Sheet…)
│   ├── screens/              # Pantallas complejas reutilizables por rutas
│   ├── navigation/           # Config de navegación, guards, deep-link mapping
│   ├── services/             # Cliente de servicios (reexporta/adapta la capa web compartida)
│   ├── hooks/                # Hooks móviles (envuelven servicios con TanStack Query)
│   ├── contexts/             # TenantContext, ThemeContext, SyncContext
│   ├── providers/            # QueryProvider, SupabaseProvider, AuthGuardProvider
│   ├── storage/              # Wrappers: SecureStore (tokens), MMKV/AsyncStorage (KV), file cache
│   ├── offline/              # Cola de operaciones, motor de sync, resolución de conflictos
│   ├── database/             # Esquema SQLite local, migraciones, repositorios locales
│   ├── config/              # env (EXPO_PUBLIC_*), constantes de buckets/endpoints
│   ├── constants/            # Permisos, rutas, claves de query, colores base
│   ├── types/                # Tipos móviles + reexport de AppDatabase
│   ├── theme/                # tokens de diseño, tipografía, light/dark
│   └── utils/                # helpers (formato, fechas, validación)
└── assets/                   # iconos, fuentes, imágenes
```

## 4. Providers (orden en `app/_layout.tsx`)

```
<SafeAreaProvider>
  <QueryProvider>            // TanStack Query + persister (offline)
    <SupabaseProvider>       // cliente único, storage=SecureStore
      <AuthGuardProvider>    // sesión → redirect (auth) / (tabs)
        <TenantProvider>     // bootstrapTenantContext() reutilizado
          <ThemeProvider>
            <SyncProvider>   // NetInfo + cola + estado de sync
              <Slot/>
```

## 5. Navegación

- **Grupo `(auth)`:** `login`, `otp-verify`, `biometric-unlock`.
- **Grupo `(tabs)`:** tabs por rol/permiso — Inicio, Operación (asistencia/horas/evidencias), Personas, Notificaciones, Más (aprobaciones, admisión, recursos, gobernanza, ajustes).
- **Guards:** cada tab/pantalla consulta `hasPermission(context, 'x.read')` (reutilizado de `core/tenant/access.ts`). La metadata del `registry` alimenta qué tabs mostrar.
- **Deep links:** `democra://` + Universal Links → entidad concreta (proyecto, solicitud, notificación) y flujo de registro por código.

## 6. Estado global y datos

- **TenantContext** (reutiliza `bootstrapTenantContext`): usuario, tenant, `permissionMap`, `roleAssignments`, `financialPolicy`, `modules`.
- **TanStack Query** para todo el estado de servidor: claves por dominio (`['volunteers', tenantId, filters]`), `staleTime`, reintentos, y **persistencia** para lectura offline.
- **SyncContext**: estado de red, cola pendiente, progreso y errores de sincronización (para RF-NEW-11).

## 7. Capa de servicios en móvil

- Reutilizar `*.service.ts` del web. Dos vías:
  1. **Recomendada:** monorepo con `packages/core` que web y móvil importan. Requiere refactor (documentado, no en esta fase).
  2. **Puente rápido:** en `mobile/src/services/` reexportar los servicios y **inyectar** el cliente Supabase móvil + un adaptador de Storage (picker RN). Los servicios que reciben `File` se envuelven con un adaptador `PickedFile → upload`.

## 8. Autenticación en móvil

- `supabase.auth.signInWithPassword` con **storage = SecureStore** y `autoRefreshToken: true`, `persistSession: true`, **sin** `detectSessionInUrl`.
- Tras login: `bootstrapTenantContext()` (reutilizado) → cargar contexto.
- **MFA/riesgo:** llamar `/api/auth/risk-evaluate` y `/step-up/verify-otp` con Bearer; `device_fingerprint` desde `expo-device`/`expo-application`; UA sintética.
- **Biometría (RF-NEW-05):** desbloqueo local y step-up alternativo.

## 9. Gestión de archivos

- Adaptador `storage-native.ts`: `expo-image-picker`/`expo-document-picker` → `{ uri, name, type }` → subir con Supabase Storage (`FormData`/base64). Mantener el saneamiento de rutas y el `tenantScoped` (RPC `fn_current_tenant_id`) del web.
- Caché de descargas con `expo-file-system` + `expo-image`.

## 10. Configuración

- `app.config.ts` + `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_*_BUCKET`, `EXPO_PUBLIC_RUC_API_URL`.
- **Nunca** incluir `SERVICE_ROLE_KEY` (solo server).

## 11. Diagrama lógico

```
┌───────────────────────────── App RN (Expo) ─────────────────────────────┐
│  UI nativa (screens/components/theme)                                     │
│      │ usa                                                                │
│  Hooks móviles (TanStack Query)  ──►  Servicios compartidos (reutilizados)│
│      │                                     │                              │
│  SyncContext / Offline (SQLite + cola)     │ Supabase JS (SecureStore)    │
│      │                                     ▼                              │
└──────┼─────────────────────────────────────────────────────────────────┘
       │ REST Bearer                         │ RLS + RPC + Realtime + Storage
       ▼                                     ▼
   API Express (:8787)  ◄──────────────►  Supabase (Postgres/Auth/Storage)
   risk / OTP / PIN / audit                 mismos datos y políticas que web
```
