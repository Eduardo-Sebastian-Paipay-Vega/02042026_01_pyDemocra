# AUDITORÍA DE BASE DE DATOS — Soporte para móvil

Fecha: 2026-07-04. **Solo documentación.** No se modifica la base de datos en esta fase.

## 1. Panorama

Supabase Postgres con arquitectura **multi-schema por dominio** y seguridad server-side:

| Esquema | Contenido (observado desde servicios y bootstrap) |
|---------|----------------------------------------------------|
| `public` | `tenants`, `profiles`, `roles`, `sedes`, `user_roles_sedes`, `memberships`, `tenant_modules`, catálogos (`cat_tipos_documento`, `cat_generos`, `cat_paises`), `terminals`, `sessions`, `devices`, `auth_events`, ACE |
| `ong` | `voluntarios`, `beneficiarios`, `estados_voluntario`, `proyectos`, `participaciones_proyecto`, actividades, tareas, asignaciones, inventario, credenciales ID |
| `rrhh` | admisión, solicitudes, entrevistas, onboarding |
| `clinico` | `fichas_medicas`, `perfil_nino`, `perfil_adulto_mayor` (**datos sensibles**) |
| `comunicaciones` | `historial_notificaciones`, plantillas |
| `finanzas` | cuentas, transacciones, categorías, comprobantes |
| `auditoria` | logs de auditoría, accesos sensibles, retención |
| `academico` | cursos, certificados |

## 2. Seguridad (RLS + RPC)

- **RLS endurecido** por migraciones: `20260305_rls_hardening`, `20260305110000_rls_hardening_p0`, `20260305100000_schema_guard`, `20260510210000_ace_fase3_rls_policies`. ~75 sentencias de creación de tablas/políticas/funciones en total.
- **Funciones RPC** de seguridad usadas por el cliente:
  - `fn_current_tenant_id()` — tenant del usuario autenticado (usado también por Storage tenant-scoped).
  - `fn_is_tenant_admin()` — flag de admin.
  - `fn_has_permission(p_permission text)` — evaluación de permiso.
- **Aislamiento multi-tenant** garantizado por RLS (no por el cliente).

**Consecuencia para móvil:** un cliente móvil con la `anon key` y un JWT válido obtiene exactamente los mismos datos y restricciones que el web. **No se requiere ningún cambio de seguridad** para habilitar móvil.

## 3. Storage

- Buckets: `evidence` (privado), `avatars` (público), documentos de registro/admisión, `finance-receipts` (privado).
- Rutas tenant-scoped: `<tenant_id>/<segmentos>/<timestamp>-<archivo>`.
- Políticas de bucket asumidas alineadas con RLS por tenant.

**Móvil:** compatible sin cambios. Verificar que las políticas de Storage permitan `upload`/`download` con el rol autenticado (ya operativo en web).

## 4. Realtime

- Publicación de cambios en `comunicaciones.historial_notificaciones` (usado por `useNotificationsRealtime`).
- **Móvil:** Realtime funciona por websocket en RN sin cambios.

## 5. ¿Soporta la DB actual una app móvil? 

**Sí, sin cambios estructurales obligatorios.** La arquitectura de seguridad y datos es cliente-agnóstica. Un segundo cliente (móvil) es un consumidor más.

## 6. Cambios RECOMENDADOS (no obligatorios, para Push y Offline)

> Todos son **aditivos** (no rompen el web). Se documentan aquí; su implementación sería una fase posterior con su propia migración y auditoría según `CLAUDE.md`.

### 6.1 Notificaciones Push (RF-NEW-03)
- Nueva tabla `public.push_tokens` (`id`, `tenant_id`, `user_id`, `token`, `platform`, `device_id`, `created_at`, `last_seen_at`, `revoked_at`) con RLS por usuario/tenant.
- Edge Function o trigger sobre `comunicaciones.historial_notificaciones` (INSERT) → envío a Expo Push / FCM / APNs.

### 6.2 Delta sync / Offline (RF-NEW-04/11)
- Asegurar columnas `updated_at` (trigger de actualización) y `deleted_at` (soft delete) en las tablas cacheables de campo: asistencias, horas, evidencias, proyectos/actividades asignadas, catálogos, personas.
- Índices sobre `(tenant_id, updated_at)` para pulls incrementales eficientes.
- Opcional: RPC/vista `fn_pull_changes(entity, since timestamptz)` que devuelva el delta respetando RLS, para simplificar el motor de sync.

### 6.3 Idempotencia de escrituras offline
- Aceptar un `client_operation_id` (uuid) en inserts de asistencias/horas/evidencias y aplicar `unique (tenant_id, client_operation_id)` para evitar duplicados al reintentar desde la cola.

## 7. Riesgos DB específicos de móvil

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Falta de `updated_at/deleted_at` uniforme | Delta sync incompleto | Auditar por tabla; añadir donde falte (aditivo). |
| Reintentos de cola → duplicados | Datos inconsistentes | `client_operation_id` idempotente (§6.3). |
| Caché de datos sensibles | Fuga de PII clínica/financiera | Política de no-caché (OFFLINE_FIRST §2.3). |
| Políticas de Storage restrictivas | Fallos de subida en móvil | Verificar policies con rol autenticado antes del release. |
| Consultas pesadas de dashboard offline | UX pobre | Precalcular KPIs vía vista/RPC; cachear resultado. |

## 8. Conclusión

La base de datos está **lista para móvil hoy** en términos de seguridad y acceso. Los cambios propuestos son **mejoras aditivas** orientadas exclusivamente a Push y Offline First, sin impacto en el funcionamiento web actual, y se ejecutarían con su propia migración versionada y documentada en `changes/`.
