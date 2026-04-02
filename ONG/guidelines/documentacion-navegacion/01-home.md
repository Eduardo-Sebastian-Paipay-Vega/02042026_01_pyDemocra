# 1. Nombre del modulo
- `Home`

## 2. Objetivo del modulo
- Centralizar el dashboard operativo de `/admin` y la busqueda global de `/admin/search` usando consultas reales a `public`, `ong` y `rrhh`.
- Exponer metricas, listados recientes y acciones rapidas sin introducir mocks ni consultas implicitas al schema `public`.
- Mantener el shell del Home libre de datos simulados visibles, con deep-links reales por entidad y topbar conectado al historial real de notificaciones.

## 3. Submodulos incluidos
- `Dashboard` (`/admin`): implementado. Lista metricas, horas recientes, actividades recientes, solicitudes recientes, timeline y alertas.
- `Busqueda global` (`/admin/search`): implementado. Busca voluntarios, proyectos, actividades y solicitudes de admision.
- `Detalle contextual en modal`: implementado. Muestra detalle resumido antes de navegar al modulo de destino.

## 4. RF/CU usados
- `RF-01 / CU-01`: contexto del usuario autenticado y roles desde `public.profiles`, `public.roles` y `public.user_roles_sedes`.
- `RF-08 / CU-03 / CU-04`: metricas y busqueda de `ong.voluntarios`.
- `RF-17 / CU-09`: metricas y busqueda de `ong.proyectos`.
- `RF-20 / CU-12`: tareas usadas para contexto del dashboard y para crear/editar actividades.
- `RF-21 / CU-13`: actividades recientes, detalle, alta, edicion y cancelacion logica.
- `RF-22 / CU-14`: conteo de asignaciones por actividad.
- `RF-23 / CU-15`: conteo de evidencias y detalle por actividad.
- `RF-25 / CU-17 / CU-18`: horas recientes, detalle y resolucion.
- `RF-28 / CU-21`: solicitudes recientes y busqueda.
- `RF-29 / CU-22`: historial de estados de admision.

## 5. Rutas o paginas impactadas
- `src/app/pages/Dashboard.tsx`
- `src/app/pages/GlobalSearch.tsx`
- `src/app/pages/Volunteers.tsx`
- `src/app/pages/Activities.tsx`
- `src/app/pages/AdmissionRequests.tsx`
- `src/app/pages/NotificationHistory.tsx`
- `src/app/routes.tsx`
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/layout/Topbar.tsx`
- `src/app/components/ui/command-palette.tsx`
- `src/app/modules/projects/ProjectsWorkspace.tsx`

## 6. Layouts o componentes relevantes
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/shared/PageHeader.tsx`
- `src/app/components/shared/KpiCard.tsx`
- `src/app/components/shared/DataTable.tsx`
- `src/app/components/ui/ModalShell.tsx`
- `src/app/components/ui/StatusDot.tsx`
- `src/app/components/ui/Timeline.tsx`
- `src/app/modules/home/components/GlobalSearchDetailModal.tsx`

## 7. Hooks afectados
- `src/app/modules/home/useDashboardData.ts`
- `src/app/modules/home/useDashboardMutations.ts`
- `src/app/modules/home/useGlobalSearch.ts`
- `src/app/modules/home/useGlobalSearchDetail.ts`
- `src/app/modules/home/useHomeNotifications.ts`

## 8. Services afectados
- `src/app/modules/home/homeDashboardService.ts`
- `src/app/modules/home/homeSearchService.ts`
- `src/app/modules/home/homeService.ts`
- `src/app/modules/home/homeShared.ts`
- `src/app/services/notificaciones/history.service.ts`
- `src/lib/db/ong/client.ts`
- `src/supabaseClient.ts`

## 9. Tipos o modelos TS afectados
- `src/app/modules/home/types.ts`
- `src/app/modules/home/validators.ts`
- `src/lib/db/ong/app-database.ts` se usa como fuente tipada unica del Home en `homeShared.ts`.

## 10. Tablas reales y esquemas usados
- `public.profiles`
- `public.roles`
- `public.user_roles_sedes`
- `public.fn_current_tenant_id()`
- `public.fn_is_tenant_admin()`
- `public.fn_has_permission()`
- `ong.estados_voluntario`
- `ong.estados_proyecto`
- `ong.voluntarios`
- `ong.proyectos`
- `ong.tareas`
- `ong.actividades`
- `ong.asignaciones_actividad`
- `ong.evidencias_actividad`
- `ong.horas_actividad`
- `ong.aprobaciones`
- `rrhh.solicitudes_admision`
- `rrhh.admision_estado_historial`
- `comunicaciones.historial_notificaciones`

## 11. Columnas relevantes consumidas o escritas
- `public.profiles`: `id`, `tenant_id`, `full_name`.
- `public.roles`: `id`, `tenant_id`, `name`.
- `public.user_roles_sedes`: `tenant_id`, `user_id`, `role_id`.
- `ong.voluntarios`: `id`, `nombre`, `apellido`, `email`, `telefono`, `tipo_documento`, `numero_documento`, `codigo_estado`, `fecha_nacimiento`, `observaciones`, `created_at`.
- `ong.proyectos`: `id`, `codigo`, `nombre_proyecto`, `descripcion`, `fecha_inicio`, `fecha_fin`, `codigo_estado`, `presupuesto`, `created_at`.
- `ong.tareas`: `id`, `id_proyecto`, `titulo`, `estado`, `fecha_limite`, `created_at`.
- `ong.actividades`: lectura de `id`, `id_tarea`, `titulo`, `horas_estimadas`, `created_at`; escritura de `tenant_id`, `id_tarea`, `titulo`, `horas_estimadas`, `created_by`, `updated_by`.
- `ong.asignaciones_actividad`: `id`, `id_actividad`, `id_voluntario`, `rol_en_actividad`.
- `ong.evidencias_actividad`: `id`, `id_actividad`.
- `ong.horas_actividad`: lectura de `id`, `id_actividad`, `id_voluntario`, `horas_registradas`, `fecha`, `estado_aprobacion`, `aprobado_por`, `id_aprobacion`, `comentario_resolucion`, `created_at`; escritura de `estado_aprobacion`, `aprobado_por`, `id_aprobacion`, `comentario_resolucion`, `updated_by`.
- `ong.aprobaciones`: lectura de `id`, `tenant_id`, `entidad_schema`, `entidad_tabla`, `entidad_id`, `tipo_aprobacion`, `estado`, `comentario`; escritura de `estado`, `comentario`, `solicitado_por`, `resuelto_por`, `requested_at`, `resolved_at`, `updated_by`.
- `rrhh.solicitudes_admision`: lectura de `id`, `nombres`, `apellidos`, `email`, `estado`, `fecha_solicitud`, `notas`; escritura de `estado`, `notas`, `updated_by`.
- `rrhh.admision_estado_historial`: escritura de `tenant_id`, `id_solicitud`, `estado_anterior`, `estado_nuevo`, `comentario`, `cambiado_por`.
- `comunicaciones.historial_notificaciones`: lectura de `id`, `tenant_id`, `id_usuario`, `titulo`, `mensaje`, `leida`, `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla`, `payload`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- `public.fn_current_tenant_id()`: resolucion del tenant actual para dashboard, busqueda y notificaciones del topbar.
- `public.fn_is_tenant_admin()`: bypass administrativo tenant-scoped para acciones operativas.
- `public.fn_has_permission()`: gating explicito de `operation.activities.manage`, `operation.hours.approve` y `admission.approve`.

## 12. Reglas de tenant, RLS y RBAC aplicables
- El tenant se resuelve con `public.fn_current_tenant_id()` desde `src/app/modules/home/homeShared.ts`.
- Las consultas multi-tenant aplican `eq("tenant_id", tenantId)` en `public`, `ong` y `rrhh`.
- La capacidad de gestion en UI se deriva de permisos explicitos y de `public.fn_is_tenant_admin()`: `operation.activities.manage` para altas/ediciones de actividad, `operation.hours.approve` para resolver horas y `admission.approve` para resolver admision.
- `roleNames` se conservan solo como contexto visible del usuario; el dashboard ya no habilita acciones por inferencia de nombre de rol.

## 13. Reglas de auditoria / soft delete / sensibilidad si aplican
- No hay soft delete nativo en el dashboard; la cancelacion de actividad cambia `ong.tareas.estado` a `cancelada`.
- La resolucion de horas deja trazabilidad en `ong.horas_actividad.aprobado_por`, `ong.horas_actividad.id_aprobacion`, `ong.horas_actividad.comentario_resolucion` y `ong.aprobaciones.comentario`.
- La resolucion de admision agrega nota en `solicitudes_admision.notas` e inserta historial en `rrhh.admision_estado_historial`.
- No hay integracion directa con `public.audit_logs` ni con `auditoria.audit_log`.

## 14. Acciones implementadas
- `Dashboard`:
  - listar metricas y alertas.
  - listar horas, actividades y solicitudes recientes.
  - abrir `/admin/hours`, `/admin/approvals/hours`, `/admin/activities` y `/admin/admission/requests` desde accesos rapidos y alertas.
  - ver detalle de actividad.
  - crear actividad.
  - editar actividad.
  - cancelar actividad de forma logica via `ong.tareas.estado = 'cancelada'`.
  - ver detalle de horas.
  - aprobar o rechazar horas.
  - ver detalle de solicitud de admision.
  - aprobar o rechazar solicitud de admision.
- `Busqueda global`:
  - buscar por texto parcial.
  - listar resultados agrupados.
  - ver detalle resumido en modal.
  - navegar al registro puntual mediante query params reales por entidad.
- `Shell Home`:
  - abrir `/admin/search` desde el trigger de busqueda del topbar.
  - mostrar notificaciones reales del usuario desde `comunicaciones.historial_notificaciones`.
  - mostrar canal y estado de entrega reales en el dropdown del topbar cuando el historial los provee.
  - abrir `/admin/notifications/history?notificationId=...` desde el dropdown del topbar.
  - eliminar "recientes" fake de la paleta de comandos.

## 15. Validaciones funcionales y tecnicas
- Busqueda global con minimo `2` caracteres y debounce de `350ms`.
- Sanitizacion de texto y terminos de busqueda en `src/app/modules/home/validators.ts`.
- Formulario de actividad con validacion de tarea obligatoria, titulo obligatorio y horas estimadas `> 0` y `<= 999.99`.
- Comentario obligatorio para rechazar solicitudes de admision; en horas el comentario es opcional y se sincroniza en `ong.aprobaciones.comentario` y `ong.horas_actividad.comentario_resolucion`.
- Manejo de errores friendly para red, permisos, timeout y RLS desde `homeShared.ts`.
- `homeShared.ts` tipa el cliente con `AppDatabase` real del repositorio y no con un esquema local duplicado.
- `src/lib/db/ong/client.ts` corrige helpers legacy para usar `schema("ong")` y columnas reales (`id`, `codigo_estado`, `codigo`).

## 16. Pendientes reales
- No se encontraron archivos llamados `Informe de SchemaAuditAgent`, `HomeAgent`, `OperationAgent`, `ProjectsAgent` o `PeopleAgent`; la consolidacion se hizo contra codigo y guias presentes en el repo.
- El Home todavia no aplica un route guard explicito con `home.read`; el gating actual cubre acciones, no acceso de routing.

## 17. Riesgos
- El Home todavia no aplica un route guard explicito con `home.read`; el gating actual cubre las acciones operativas del dashboard, no el acceso de routing.
- El dashboard mezcla acciones de Operacion y Admision; si esos modulos cambian estructura o columnas, Home se rompe en cascada.

## 18. Decisiones tomadas
- Se mantiene `Dashboard.tsx` como punto de orquestacion y no se reubican acciones a otros modulos desde DocsAgent.
- Se preservan los documentos legacy `guidelines/documentacion-navegacion/home.md` y solo se agrega esta version canonica numerada.
- Archivos clave auditados y consolidados:
  - `src/app/pages/Dashboard.tsx`: composicion de UI y acciones.
  - `src/app/pages/GlobalSearch.tsx`: UX de busqueda.
  - `src/app/modules/home/homeDashboardService.ts`: consultas y mutaciones reales.
  - `src/app/modules/home/homeSearchService.ts`: busqueda real y detalle contextual.
- El trigger visible de busqueda del topbar ahora abre la pagina real de busqueda global, mientras `Cmd+K` queda como paleta de navegacion.
- La paleta de comandos mantiene atajos utiles del sistema y deja de mostrar entidades recientes simuladas.

## 19. Dependencias con otros modulos
- `Operacion`: actividades, horas y evidencias.
- `Proyectos`: proyectos y tareas.
- `Personas`: voluntarios.
- `Admision`: solicitudes e historial de estados.
- `Configuracion/Gobernanza`: perfiles, roles y funciones RPC del core.

## 20. Proximos pasos sugeridos
- Extender el route guard para consumir `home.read` cuando el shell centralice permisos por pagina.
- Mantener nuevos cambios del Home anclados a `src/lib/db/ong/app-database.ts` y evitar reintroducir contratos DB locales.

## Checklist de validacion
- `Dashboard` carga metricas y listas desde schemas reales.
- `GlobalSearch` busca en `ong` y `rrhh` con tenant resuelto por RPC.
- Crear, editar y cancelar actividad muta tablas reales.
- Resolver horas cambia estado, aprobador, `id_aprobacion` y `comentario_resolucion` en `ong.horas_actividad`, ademas de sincronizar `ong.aprobaciones`.
- Resolver admision actualiza `rrhh.solicitudes_admision` e inserta historial.
- `Topbar` usa el historial real de `comunicaciones.historial_notificaciones`, incluyendo canal y estado de entrega, y abre el detalle real de notificaciones.
- Los accesos rapidos y alertas del dashboard abren rutas reales del sistema.
