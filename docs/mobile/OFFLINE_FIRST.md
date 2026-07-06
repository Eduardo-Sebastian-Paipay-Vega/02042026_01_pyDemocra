# ESTRATEGIA OFFLINE FIRST

Fecha: 2026-07-04. Diseño para operación de campo sin conexión con sincronización confiable.

## 1. Motivación

Flujos de campo (asistencia, horas, evidencias) ocurren en zonas con conectividad intermitente. El sistema web actual es **100% online** (acceso directo a Supabase; sin caché ni cola). Móvil debe soportar captura y consulta offline.

## 2. Clasificación de datos

### 2.1 Se almacena localmente (caché de lectura)
- Catálogos maestros (tipos de documento, géneros, países, estados) — baja volatilidad.
- Listado de voluntarios/beneficiarios **del alcance del usuario** (campos no sensibles: nombre, código, estado, sede).
- Proyectos/actividades asignadas al usuario.
- Contexto de tenant: `permissionMap`, `roleAssignments`, `modules` (para gobernar UI offline).
- Cola de operaciones pendientes.

### 2.2 Se captura offline y se encola (escritura)
- Asistencias (RF-OPER-02) — incluyendo escaneo QR.
- Horas (RF-OPER-03).
- Evidencias (RF-OPER-04) — foto local + metadatos; el binario se sube al reconectar.

### 2.3 NUNCA se almacena localmente
- **Datos clínicos / ficha médica** (permiso `clinico.volunteer_sensitive.read`) — sensibles; solo online, sin caché.
- Datos financieros detallados (comprobantes/transacciones) — solo online.
- Tokens de sesión → SecureStore (cifrado), no en la caché de datos.
- Cualquier PII sensible sujeta a registro de acceso sensible (`SensitiveAccess`).

> Regla: si el acceso genera un registro de auditoría de "acceso sensible", **no** se cachea; se exige conexión.

## 3. Arquitectura offline

```
UI ──► TanStack Query (persistida)
             │ miss / mutación
             ▼
     Repositorio local (SQLite)
             │
   ┌─────────┴──────────┐
   │ Read cache          │ Outbox (cola de operaciones)
   └─────────┬──────────┘        │
             ▼                    ▼
        Sync Engine  ◄── NetInfo (online?) ──► Supabase / API
```

- **SQLite** (`expo-sqlite` u OP-SQLite; alternativa WatermelonDB para sync reactivo): tablas de caché + tabla `outbox`.
- **TanStack Query persister**: cachea respuestas para lectura instantánea offline.
- **Outbox pattern**: cada mutación offline se serializa como operación con `id (uuid v4 local)`, `tipo`, `payload`, `tenant_id`, `entity`, `base_version/updated_at`, `estado`, `intentos`, `created_at`.

## 4. Sincronización

### 4.1 Disparadores
- **Automática:** al recuperar conexión (NetInfo), al abrir la app, y en background (`expo-background-task`) con intervalo mínimo.
- **Manual:** botón "Sincronizar ahora" + pull-to-refresh.

### 4.2 Flujo de subida (outbox → servidor)
1. Ordenar cola por `created_at` (FIFO), respetando dependencias (crear antes de actualizar).
2. Por operación: ejecutar contra el servicio correspondiente (mismas reglas RLS).
3. Éxito → marcar `synced`, reconciliar id local→remoto, invalidar queries.
4. Error recuperable (red/5xx) → reintentar con **backoff exponencial** (p. ej. 2^n, tope 5–7 intentos).
5. Error no recuperable (RLS/validación/permiso) → marcar `failed`, mostrar en bandeja de conflictos para resolución manual. **No** reintentar en bucle.

### 4.3 Flujo de bajada (delta sync)
- Descargar cambios desde `last_pulled_at` usando `updated_at`/`deleted_at` por entidad (requiere columnas — ver BASE_DATOS_MOVIL.md).
- Aplicar upserts/soft-deletes en SQLite.

## 5. Detección y resolución de conflictos

- **Detección:** comparación de versión — cada registro cacheado guarda `updated_at` (o `version`) base. En la subida se compara con el servidor.
- **Estrategias por tipo:**
  - Asistencia/horas/evidencia (registros append-only, propios del usuario): **rara colisión** → *last-write-wins* del cliente es aceptable; el servidor conserva auditoría.
  - Entidades compartidas (proyecto, beneficiario, ficha): **detección obligatoria**; si `server.updated_at > base` → conflicto → **resolución manual** (mostrar ambas versiones) o *merge* por campos no solapados.
  - Borrados: *soft delete* (`deleted_at`) para evitar pérdida; conflicto edición-vs-borrado se resuelve a favor del borrado con aviso.
- **Bandeja de conflictos:** UI que lista operaciones `failed`/`conflict` con acciones: reintentar, descartar, editar y reenviar.

## 6. Estado de sincronización (RF-NEW-11)

Indicador global visible con estados: `Sin conexión`, `Pendiente (n)`, `Sincronizando…`, `Al día`, `Errores (n)`. Por registro: badge `pendiente/sincronizado/error`.

## 7. Modo avión y límites

- App plenamente usable en modo avión para lectura cacheada y captura.
- **Tiempo máximo de sincronización objetivo:** procesar cola típica (<200 ops) en < 30 s con red normal; timeouts por operación de 15 s con reintento.
- Límite de retención de caché configurable (p. ej. purgar caché > 30 días o al cerrar sesión).
- **Al cerrar sesión:** borrar toda la caché local y la outbox (evitar fuga entre usuarios/tenants).

## 8. Librerías recomendadas

| Necesidad | Opción principal | Alternativa |
|-----------|------------------|-------------|
| DB local | `expo-sqlite` | WatermelonDB, OP-SQLite |
| Caché de queries | TanStack Query + `@tanstack/query-async-storage-persister` | RTK Query |
| KV rápido | `react-native-mmkv` | AsyncStorage |
| Estado de red | `@react-native-community/netinfo` | — |
| Background sync | `expo-background-task` / `expo-task-manager` | — |
| IDs offline | `uuid` / `nanoid` | — |
| Cifrado local (si se cachea PII permitida) | `expo-secure-store` (claves), SQLCipher | — |

## 9. Seguridad offline

- Tokens siempre en SecureStore; nunca en SQLite plano.
- No cachear datos sensibles (§2.3).
- Cifrar la DB local si se decide cachear cualquier PII (SQLCipher).
- Purga total de datos locales en logout y en cambio de tenant.
- Respetar `financialPolicy.isSuspended` incluso offline (bloquear captura si el último estado conocido es suspendido).
