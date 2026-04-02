# 1. Nombre del modulo
- `Notificaciones`

## 2. Objetivo del modulo
- Reemplazar los placeholders de `/admin/notifications/templates` y `/admin/notifications/history` por vistas operativas conectadas a la BD real multi-esquema.
- Administrar plantillas reales desde `comunicaciones.plantillas_notificacion` usando el catalogo real `comunicaciones.canales_notificacion`.
- Consultar historial real desde `comunicaciones.historial_notificaciones`, incluyendo los metadatos nuevos `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla` y `payload`.
- Reutilizar el mismo historial real en el topbar/Home sin inventar motores de envio ni colas operativas no documentadas.

## 3. Submodulos incluidos
- `Plantillas` (`/admin/notifications/templates`): CRUD operativo sobre el registro real de plantillas, con desactivacion por `activa`.
- `Historial` (`/admin/notifications/history`): listado y detalle del historial real de notificaciones, con filtros solo sobre columnas existentes.

## 4. RF/CU usados
- `RF-45`: gestion de plantillas de notificacion.
- `RF-46`: consulta del historial de notificaciones.
- `RF-47 / CU-31`: se toma como referencia funcional, pero no se implementa automatizacion ni disparadores porque la BD auditada no documenta un motor operativo para ello.

## 5. Rutas o paginas impactadas
- `src/app/routes.tsx`
- `src/app/pages/NotificationTemplates.tsx`
- `src/app/pages/NotificationHistory.tsx`
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/layout/Topbar.tsx`
- `src/app/modules/home/useHomeNotifications.ts`

## 6. Layouts o componentes relevantes
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/layout/Sidebar.tsx`
- `src/app/components/shared/PageHeader.tsx`
- `src/app/components/shared/FilterBar.tsx`
- `src/app/components/shared/DataTable.tsx`
- `src/app/components/ui/modal-shell.tsx`
- `src/app/components/ui/status-dot.tsx`
- `src/app/modules/notifications/components/notifications-shared.tsx`

## 7. Hooks afectados
- `src/app/modules/notifications/hooks/useNotificationTemplates.ts`
- `src/app/modules/notifications/hooks/useNotificationTemplateDetail.ts`
- `src/app/modules/notifications/hooks/useNotificationTemplateMutations.ts`
- `src/app/modules/notifications/hooks/useNotificationHistory.ts`
- `src/app/modules/notifications/hooks/useNotificationHistoryDetail.ts`

## 8. Services afectados
- `src/app/services/notificaciones/shared.ts`
- `src/app/services/notificaciones/templates.service.ts`
- `src/app/services/notificaciones/history.service.ts`

## 9. Tipos o modelos TS afectados
- `src/app/modules/notifications/types.ts`
- `src/lib/db/ong/app-database.ts`

## 10. Tablas reales y esquemas usados
- `comunicaciones.canales_notificacion`
- `comunicaciones.plantillas_notificacion`
- `comunicaciones.historial_notificaciones`
- `public.profiles`
- `public.fn_current_tenant_id()`
- `public.fn_has_permission()`
- `public.fn_is_tenant_admin()`

## 11. Columnas relevantes consumidas o escritas
- `comunicaciones.canales_notificacion`: `codigo`, `nombre`.
- `comunicaciones.plantillas_notificacion`: `id`, `tenant_id`, `codigo_canal`, `nombre_plantilla`, `asunto`, `cuerpo_html`, `cuerpo_texto`, `activa`, `variables`, `codigo_evento`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- `comunicaciones.historial_notificaciones`: `id`, `tenant_id`, `id_usuario`, `titulo`, `mensaje`, `leida`, `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla`, `payload`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- `public.profiles`: `id`, `tenant_id`, `full_name`.

## 12. Fuente de schema y restricciones verificadas
- `comunicaciones.canales_notificacion`, `comunicaciones.plantillas_notificacion` y `comunicaciones.historial_notificaciones` se validaron contra [Parte 2](D:/PROYECTO/SistemaVolV2.0/guidelines/BD/Parte%202%20-%20Script%20maestro%20documental%20de%20ONG%20m%C3%B3dulos%20complementarios.txt).
- Las columnas nuevas `variables`, `codigo_evento`, `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla` y `payload` se validaron contra [Parte 4](D:/PROYECTO/SistemaVolV2.0/guidelines/BD/Parte%204-%20Script%20maestro%20documental%20de%20ONG%20m%C3%B3dulos%20complementarios.txt).
- El tenant, RLS y los permisos `notifications.read` / `notifications.manage` se verificaron contra [Parte 1](D:/PROYECTO/SistemaVolV2.0/guidelines/BD/Parte%201-%20Script%20maestro%20documental%20del%20Core%20SUBS%20public.txt) y [Parte 4](D:/PROYECTO/SistemaVolV2.0/guidelines/BD/Parte%204-%20Script%20maestro%20documental%20de%20ONG%20m%C3%B3dulos%20complementarios.txt).

## 13. Reglas funcionales aplicadas
- `Plantillas` persiste `variables` como JSON y `codigo_evento` como metadata real de la plantilla.
- `Plantillas` no inventa render de placeholders, disparadores ni ejecuciones porque el schema no documenta ese motor.
- `Historial` expone `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla` y `payload` tal como existen en `comunicaciones.historial_notificaciones`.
- `Historial` no expone reintentos, colas ni providers externos porque el contrato documental no los define.
- La baja operativa de plantillas se resuelve con `activa = false`; no se expone DELETE porque el modulo no documenta soft delete.

## 14. Acciones implementadas
- `Plantillas`:
  - listar plantillas reales.
  - filtrar por texto, canal y estado activa/inactiva.
  - ver detalle en modal.
  - crear plantilla.
  - editar plantilla.
  - persistir `codigo_evento`.
  - persistir `variables`.
  - desactivar o reactivar plantilla.
- `Historial`:
  - listar historial real.
  - filtrar por texto, destinatario, canal, estado de entrega, lectura y fechas.
  - paginar resultados.
  - ver detalle del evento real en modal.
  - mostrar `error_mensaje`.
  - mostrar `id_plantilla` y su nombre cuando la plantilla sigue visible para el tenant.
  - mostrar `payload` JSON real.
- `Topbar/Home`:
  - listar notificaciones no leidas del usuario autenticado desde `comunicaciones.historial_notificaciones`.
  - enriquecer el dropdown con canal y estado de entrega reales.
  - deep-link al detalle real mediante `/admin/notifications/history?notificationId=...`.
  - mantener acceso directo a `Ver historial real` aun cuando no existan pendientes.

## 15. Validaciones funcionales y tecnicas
- Todas las consultas del modulo usan `schema("comunicaciones")` o `schema("public")` de forma explicita.
- Toda lectura tenant-bound filtra `tenant_id` de manera explicita, ademas de respetar RLS.
- Las capacidades del modulo validan `notifications.read` y `notifications.manage` por `public.fn_has_permission()`, con bypass por `public.fn_is_tenant_admin()`.
- Las mutaciones de plantillas validan:
  - canal obligatorio y existente.
  - nombre obligatorio.
  - `variables` como JSON valido.
  - plantilla perteneciente al tenant actual para editar o desactivar.
- Las pantallas implementan `loading`, `empty`, `error` y `retry`.
- El modulo no usa mocks, listas hardcodeadas de canales ni reconstrucciones fake del historial.

## 16. Pendientes reales y bloqueos documentados
- No existe motor documental de ejecucion de plantillas, render de placeholders ni colas de reintento expuestas al frontend.
- `id_plantilla` existe en el historial, pero Parte 4 no agrega FK formal; la UI resuelve el nombre por lookup tenant-scoped y degrada al UUID si la plantilla ya no esta visible.
- No existe fecha documental de lectura distinta de `leida`.

## 17. Riesgos
- Si un estado de entrega nuevo aparece en la BD, la UI lo mostrara como texto real y lo clasificara con variante visual generica.
- Si `public.profiles` no devuelve nombre para algun `id_usuario`, la UI degrada mostrando el UUID.
- Si `notifications.read` o `notifications.manage` cambian de nombre en Core, Notificaciones se bloqueara hasta resincronizar `shared.ts`.

## 18. Decisiones tomadas
- Se mantuvieron las rutas existentes del sidebar; solo se reemplazaron los placeholders del router.
- `Plantillas` se implemento con create/update/toggle de `activa` y no con borrado fisico porque el modelo ya ofrece un estado operativo explicito.
- `Historial` no reutiliza `public.audit_logs`, `auditoria.audit_log`, `sync_queue` ni `user_devices` como sustituto del historial de notificaciones, porque no son el mismo contrato funcional.
- `Topbar` sigue consumiendo historial real y no crea un feed paralelo del Home.

## 19. Dependencias con otros modulos
- `Home`: reutiliza el historial real para poblar el dropdown del topbar.
- `Configuracion / Core`: reutiliza `public.profiles`, `public.fn_current_tenant_id()`, `public.fn_has_permission()` y `public.fn_is_tenant_admin()`.
- `Gobernanza`: comparte el catalogo real `comunicaciones.canales_notificacion` como referencia de schema, pero sin mezclarlo con auditoria.

## 20. Validacion tecnica
- `npm run build` ejecutado el `2026-03-26` en `America/Lima`: compilacion satisfactoria.
- El build mantiene la advertencia preexistente de chunk grande en `dist/assets/index-*.js`; no bloquea esta fase.
