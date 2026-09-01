# 1. Nombre del modulo
- `Configuracion`

## 2. Objetivo del modulo
- Reemplazar los placeholders de `/admin/system-users`, `/admin/roles` y `/admin/security` por vistas operativas conectadas a la BD real multi-esquema.
- Administrar usuarios del sistema desde el Core real sin inventar `auth.users`: la gestion operativa se resuelve sobre `public.profiles`, `public.user_roles_sedes`, `public.roles` y `public.role_permissions`.
- Exponer seguridad de sesion real sobre `public.sessions`, `public.devices`, `public.terminals` y `public.auth_events`, respetando tenant, RLS y permisos del Core.

## 3. Submodulos incluidos
- `Usuarios del sistema` (`/admin/system-users`): listado real de perfiles del tenant, detalle y gestion de accesos institucionales por rol/sede.
- `Roles y permisos` (`/admin/roles`): CRUD de roles editables, catalogo real de permisos y sincronizacion real de `public.role_permissions`.
- `Seguridad de sesion` (`/admin/security`): monitoreo real de sesiones, dispositivos, terminales y eventos de autenticacion, con mutaciones reales donde el modelo lo soporta.

## 4. RF/CU usados
- `RF-01 / CU-01`: autenticacion, sesion, ultimo acceso y cierre remoto operativo sobre tablas core de sesion.
- `RF-02`: gestion de usuarios del sistema sobre perfiles reales y asignaciones institucionales.
- `RF-03`: RBAC real con `public.roles`, `public.role_permissions`, `public.user_roles_sedes`, `public.fn_has_permission()` y `public.fn_is_tenant_admin()`.
- `RF-09 / CU-05`: roles institucionales por sede desde `public.user_roles_sedes`.

## 5. Rutas o paginas impactadas
- `src/app/routes.tsx`
- `src/app/pages/SystemUsers.tsx`
- `src/app/pages/Roles.tsx`
- `src/app/pages/Security.tsx`

## 6. Layouts o componentes relevantes
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/layout/Sidebar.tsx`
- `src/app/components/shared/PageHeader.tsx`
- `src/app/components/shared/FilterBar.tsx`
- `src/app/components/shared/DataTable.tsx`
- `src/app/components/ui/modal-shell.tsx`
- `src/app/components/ui/status-dot.tsx`
- `src/app/modules/settings/components/settings-shared.tsx`

## 7. Hooks afectados
- `src/app/modules/settings/hooks/useSystemUsers.ts`
- `src/app/modules/settings/hooks/useSystemUserAssignments.ts`
- `src/app/modules/settings/hooks/useRoleSettings.ts`
- `src/app/modules/settings/hooks/useRoleSettingsMutations.ts`
- `src/app/modules/settings/hooks/useSecuritySettings.ts`
- `src/app/modules/settings/hooks/useSecurityMutations.ts`

## 8. Services afectados
- `src/app/services/configuracion/shared.ts`
- `src/app/services/configuracion/systemUsers.service.ts`
- `src/app/services/configuracion/roles.service.ts`
- `src/app/services/configuracion/security.service.ts`

## 9. Tipos o modelos TS afectados
- `src/app/modules/settings/types.ts`
- `src/lib/db/ong/app-database.ts`

## 10. Tablas reales y esquemas usados
- `public.profiles`
- `public.roles`
- `public.role_permissions`
- `public.user_roles_sedes`
- `public.cat_permissions`
- `public.sedes`
- `public.sessions`
- `public.devices`
- `public.terminals`
- `public.auth_events`

## 11. Columnas relevantes consumidas o escritas
- `public.profiles`: `id`, `tenant_id`, `full_name`, `pin_hash`, `is_blocked`, `blocked_reason`, `pin_failed_attempts`, `pin_blocked_until`, `risk_blocked_until`, `tipo_documento`, `numero_documento`, `genero`, `created_at`, `updated_at`.
- `public.roles`: `id`, `tenant_id`, `name`, `hierarchy_level`, `is_system_role`, `created_at`, `updated_at`.
- `public.role_permissions`: `role_id`, `permission`, `created_at`.
- `public.user_roles_sedes`: `tenant_id`, `user_id`, `role_id`, `sede_id`, `created_at`.
- `public.cat_permissions`: `id`, `description`, `module`, `created_at`.
- `public.sedes`: `id`, `tenant_id`, `name`, `is_active`.
- `public.sessions`: `id`, `tenant_id`, `user_id`, `terminal_id`, `device_id`, `session_type`, `ip`, `user_agent`, `created_at`, `expires_at`, `revoked_at`, `revoke_reason`.
- `public.devices`: `id`, `tenant_id`, `user_id`, `device_fingerprint`, `is_trusted`, `last_ip`, `last_user_agent`, `last_seen_at`, `created_at`.
- `public.terminals`: `id`, `tenant_id`, `name`, `created_at`.
- `public.auth_events`: `id`, `tenant_id`, `user_id`, `session_id`, `terminal_id`, `device_id`, `event_type`, `result`, `ip`, `user_agent`, `error_code`, `created_at`.

## 12. Fuente de schema y permisos verificados
- `public.cat_permissions`, `public.profiles`, `public.roles`, `public.role_permissions`, `public.user_roles_sedes` y `public.sedes` se validaron contra `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`.
- Segun ese script, `public.profiles` referencia `auth.users(id)` y solo documenta policies `SELECT` por tenant/self y `UPDATE` self-only; no existe policy admin para `INSERT` o `UPDATE` global sobre perfiles.
- Segun el mismo script, `public.roles`, `public.role_permissions`, `public.user_roles_sedes`, `public.devices`, `public.terminals`, `public.sessions` y `public.auth_events` tienen RLS tenant-scoped (`FOR ALL`) y deben consultarse como `supabase.schema("public").from(...)`.
- Los permisos legacy `iam.users.read`, `iam.users.manage`, `iam.roles.read`, `iam.roles.manage`, `iam.user_roles.manage`, `iam.sessions.terminate`, `devices.read`, `devices.manage`, `terminals.read` y `terminals.manage` se validaron en `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`.
- Los permisos nuevos `settings.users.read`, `settings.users.manage`, `settings.roles.read`, `settings.roles.manage`, `settings.sessions.read` y `settings.sessions.terminate` se validaron en `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.
- La indexacion adicional de `public.sessions (tenant_id, created_at)` se reconfirma en `guidelines/BD/Parte 3- Script maestro documental de ONG módulos complementarios.txt`.

## 13. Reglas de usuarios, RBAC y sesion aplicadas
- `Usuarios del sistema` ya no intenta crear credenciales desde frontend directo; el CTA `Crear o invitar usuario` ejecuta la Edge Function `admin-provision-user` con service-role, validacion de `settings.users.manage`, sincronizacion de `public.profiles` y vinculacion opcional de `ong.voluntarios.iam_user_id`.
- La accion de alta operativa se interpreta como `habilitar acceso institucional` creando filas reales en `public.user_roles_sedes` para un perfil ya existente del tenant.
- La edicion de datos de perfil no se expone para terceros porque `public.profiles` solo permite `UPDATE` self-only en RLS.
- La baja operativa de usuario se resuelve revocando todas las filas de `public.user_roles_sedes`; no se inventa soft delete porque el Core no lo documenta para estas tablas.
- `Seguridad de sesion` usa `settings.sessions.read` como permiso base de lectura y `settings.sessions.terminate` como permiso de mutacion; `devices.*`, `terminals.*` e `iam.sessions.terminate` quedan como compatibilidad legacy mientras el Core no publique permisos nuevos mas finos para esos recursos.
- **Visualización de sesiones**: El contador de 'sesiones activas' en el listado lee la tabla de auditoría `public.sessions` (evaluando que `expires_at` sea mayor a NOW y no exista `revoked_at`). No lee el estado nativo de Supabase Auth en tiempo real. Un usuario que utiliza un token refrescado automáticamente puede aparecer con "0 sesiones activas" en la bitácora hasta que realice un inicio de sesión manual que registre un nuevo evento.
- La revocacion por sesion individual usa `public.fn_remote_revoke_app_session`; la revocacion por usuario usa la Edge Function `admin-revoke-user-sessions`.

## 14. Acciones implementadas
- `Usuarios del sistema`:
  - listar perfiles reales del tenant.
  - ver detalle del perfil y sus asignaciones institucionales.
  - crear o invitar usuarios con `admin-provision-user`.
  - habilitar acceso institucional creando filas reales en `public.user_roles_sedes`.
  - editar asignaciones por rol/sede.
  - revocar acceso institucional eliminando filas reales de `public.user_roles_sedes`.
  - revocar sesiones por usuario con `admin-revoke-user-sessions`.
- `Roles y permisos`:
  - listar roles reales.
  - ver detalle del rol, sus permisos y usuarios vinculados.
  - crear rol editable (`is_system_role = false`).
  - editar rol editable y resincronizar `public.role_permissions`.
  - eliminar rol editable con borrado fisico real.
  - listar permisos reales desde `public.cat_permissions`.
- `Seguridad de sesion`:
  - listar sesiones reales de `public.sessions`.
  - ver detalle de sesion.
  - cerrar sesion ejecutando `public.fn_remote_revoke_app_session`.
  - listar dispositivos reales y cambiar `is_trusted`.
  - listar terminales reales y hacer create/update/delete.
  - listar auth events reales y ver detalle.

## 15. Validaciones funcionales y tecnicas
- Todas las consultas usan `schema("public")` explicito; no quedan accesos implicitos al Core.
- Toda lectura multi-tenant filtra `tenant_id` de forma explicita o reutiliza las policies del Core.
- Las asignaciones de usuario validan:
  - perfil real del tenant.
  - rol real del tenant.
  - sede real del tenant.
  - ausencia de duplicados `rol + sede`.
- Los roles validan:
  - nombre obligatorio.
  - `hierarchy_level` entero valido.
  - permisos existentes en `public.cat_permissions`.
  - bloqueo de edicion/eliminacion para `is_system_role = true`.
- La seguridad de sesion valida:
  - permiso `settings.sessions.read` para lectura de sesiones y resumenes.
  - permiso `settings.sessions.terminate` para cierre remoto y revocacion masiva por usuario.
  - motivo obligatorio al revocar sesion.
  - dispositivo real para cambio de trust.
  - nombre obligatorio para terminal.
- Las tres pantallas implementan `loading`, `empty`, `error` y `retry`.

## 16. Pendientes reales
- Crear `auth.users` sigue prohibido en frontend directo; solo puede ejecutarse via backend seguro/Edge Function con `SUPABASE_SERVICE_ROLE_KEY`.
- No existe support real para que un admin edite perfiles ajenos en `public.profiles`; la pantalla solo expone metadata y gestiona accesos institucionales.
- No existe permiso nuevo dedicado para `public.devices` o `public.terminals`; la vista mantiene compatibilidad con `devices.*` y `terminals.*` hasta que el Core publique reemplazo formal.
- La invalidacion global de refresh tokens de Supabase/Auth sigue limitada por la API admin disponible en `@supabase/auth-js` 2.97.0, que requiere un JWT valido del usuario objetivo para `auth.admin.signOut(jwt)`.

## 17. Riesgos
- El contrato tipado legacy no incluia tablas core de sesion; se extendio `src/lib/db/ong/app-database.ts` para compilar con el schema real. Si ese contrato deja de alinearse con SQL, la UI de Configuracion puede desfasarse.
- Revocar roles o accesos institucionales puede dejar sin privilegios a usuarios reales; por eso la UI bloquea la autogestion destructiva del usuario autenticado en `Usuarios del sistema`.
- La lectura de `auth_events` se consolida bajo `settings.sessions.read` y `governance.audit.read`, con fallback legacy mientras migra el RBAC.

## 18. Decisiones tomadas
- `Crear o invitar usuario` ya no se maquilla como accion frontend: la UI invoca `admin-provision-user` y el backend seguro resuelve `auth.users` + `public.profiles`.
- Los roles de sistema quedaron en solo lectura para no permitir que frontend altere seeds core sensibles.
- La seguridad de sesion se implemento sobre tablas core reales y no sobre `supabase.auth.admin`, porque el frontend usa anon client y debe respetar RLS.
- La revocacion global de tokens queda condicionada al JWT objetivo; mientras el Core no publique otra primitiva segura, la garantia dura del frontend es la revocacion de `public.sessions`.

## 19. Dependencias con otros modulos
- `Gobernanza`: reutiliza el mismo Core IAM (`public.fn_has_permission()`, `public.fn_is_tenant_admin()`) y la misma familia de tablas `public.roles`, `public.role_permissions`, `public.user_roles_sedes`.
- `Home`: comparte el contexto de tenant y roles institucionales del Core.
- `Personas`: ya consume `public.profiles`, `public.roles` y `public.user_roles_sedes`, por lo que Configuracion consolida la administracion sobre esas mismas tablas reales.

## 20. Validacion tecnica
- `npm run build` ejecutado el `2026-03-26` en `America/Lima`: compilacion satisfactoria.
- El build mantiene la advertencia preexistente de chunk grande en `dist/assets/index-*.js`; no bloquea esta fase.
