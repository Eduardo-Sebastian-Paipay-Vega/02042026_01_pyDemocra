# Modulo Proyectos

## Objetivo del modulo
- Gestionar `Proyectos`, `Tareas`, `Actividades` y `Asignaciones` como columna vertebral operativa del tenant actual.
- Reutilizar la UI y la arquitectura existente del repositorio, moviendo la logica real a `services` y `hooks`.
- Conectar el frontend con la nueva BD multi-schema sin asumir `public` por defecto.

## RF/CU usados
- `RF-17 / CU-09`: Proyectos.
- `RF-18`: asignaciones a proyecto.
- `RF-20 / CU-12`: Tareas.
- `RF-21 / CU-13`: Actividades.
- `RF-22`: asignaciones a actividad.

## Fuentes auditadas para el schema real
- `AGENTS.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/BD/Parte 3- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/ONGModulosDeTrabajo(ED).md`
- `Informe de SchemaAuditAgent`: no se localizo un archivo con ese nombre dentro del repositorio al momento de la auditoria.

## Paginas afectadas
- `src/app/pages/Projects.tsx`
- `src/app/pages/Tasks.tsx`
- `src/app/pages/ProjectActivities.tsx`
- `src/app/pages/ProjectAssignments.tsx`
- `src/app/routes.tsx`
- `src/app/components/layout/Sidebar.tsx`

## Hooks afectados
- `src/app/modules/projects/hooks/useProjectCatalogs.ts`
- `src/app/modules/projects/hooks/useProjectSectionData.ts`
- `src/app/modules/projects/hooks/useProjectDetails.ts`
- `src/app/modules/projects/hooks/useProjectMutations.ts`

## Services afectados
- `src/app/services/proyectos/shared.ts`
- `src/app/services/proyectos/projects.service.ts`
- `src/app/services/proyectos/tasks.service.ts`
- `src/app/services/proyectos/activities.service.ts`
- `src/app/services/proyectos/assignments.service.ts`

## Componentes y tipos reutilizados
- `src/app/modules/projects/ProjectsWorkspace.tsx`
- `src/app/modules/projects/types.ts`
- `src/app/components/shared/PageHeader.tsx`
- `src/app/components/shared/FilterBar.tsx`
- `src/app/components/shared/DataTable.tsx`
- `src/app/components/ui/modal-shell.tsx`
- `src/app/components/ui/alert.tsx`
- `src/app/components/ui/button.tsx`
- `src/app/components/ui/status-dot.tsx`

## Tablas reales y esquemas
- `public.profiles`
- `public.fn_current_tenant_id()`
- `public.fn_is_tenant_admin()`
- `ong.areas`
- `ong.estados_proyecto`
- `ong.proyectos`
- `ong.tareas`
- `ong.actividades`
- `ong.asignaciones_proyecto`
- `ong.asignaciones_actividad`
- `ong.recursos_proyecto`
- `ong.voluntarios`
- `ong.items`
- `ong.horas_actividad`
- `ong.evidencias_actividad`

## Columnas relevantes
- `ong.proyectos`: `id`, `tenant_id`, `codigo`, `nombre_proyecto`, `descripcion`, `fecha_inicio`, `fecha_fin`, `id_area`, `codigo_estado`, `presupuesto`, `imagen_url`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- `ong.tareas`: `id`, `tenant_id`, `id_proyecto`, `titulo`, `descripcion`, `estado`, `fecha_limite`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- `ong.actividades`: `id`, `tenant_id`, `id_tarea`, `titulo`, `horas_estimadas`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- `ong.asignaciones_proyecto`: `id`, `tenant_id`, `id_proyecto`, `id_voluntario`, `rol_en_proyecto`, `fecha_ingreso`, `activo`, `created_at`.
- `ong.asignaciones_actividad`: `id`, `tenant_id`, `id_actividad`, `id_voluntario`, `rol`, `created_at`.
- `ong.recursos_proyecto`: `id`, `tenant_id`, `id_proyecto`, `id_item`, `cantidad_requerida`, `cantidad_asignada`, `created_at`.
- `ong.areas`: `id`, `tenant_id`, `nombre_area`, `activo`.
- `ong.estados_proyecto`: `codigo`, `nombre_estado`, `orden_visual`, `tipo_estado`.
- `ong.horas_actividad`: `id`, `tenant_id`, `id_actividad`, `id_voluntario`, `fecha`, `horas`.
- `ong.evidencias_actividad`: `id`, `tenant_id`, `id_actividad`, `id_voluntario`, `tipo_evidencia`, `archivo_url`.

## Relaciones del modulo
- `ong.proyectos.id_area -> ong.areas.id`
- `ong.tareas.id_proyecto -> ong.proyectos.id`
- `ong.actividades.id_tarea -> ong.tareas.id`
- `ong.asignaciones_proyecto.id_proyecto -> ong.proyectos.id`
- `ong.asignaciones_proyecto.id_voluntario -> ong.voluntarios.id`
- `ong.asignaciones_actividad.id_actividad -> ong.actividades.id`
- `ong.asignaciones_actividad.id_voluntario -> ong.voluntarios.id`
- `ong.recursos_proyecto.id_proyecto -> ong.proyectos.id`
- `ong.recursos_proyecto.id_item -> ong.items.id`
- `ong.horas_actividad.id_actividad -> ong.actividades.id`
- `ong.evidencias_actividad.id_actividad -> ong.actividades.id`

## Acciones implementadas
### Proyectos
- listado con filtros por texto, area y estado.
- detalle con tareas, actividades, equipo y recursos.
- creacion.
- edicion.
- archivo logico cambiando `codigo_estado`.

### Tareas
- listado con filtro por proyecto y estado.
- detalle con actividades relacionadas.
- creacion.
- edicion.
- cancelacion logica via `estado = 'cancelada'`.

### Actividades
- listado con filtros por proyecto, tarea y estado heredado.
- detalle con asignaciones, horas y evidencias.
- creacion.
- edicion.
- eliminacion condicionada.

### Asignaciones
- listado unificado de asignaciones de proyecto, actividad y recursos.
- detalle por tipo de asignacion.
- creacion y edicion de asignaciones proyecto-voluntario.
- creacion y edicion de asignaciones actividad-voluntario.
- creacion y edicion de recursos por proyecto.
- desactivacion logica de `ong.asignaciones_proyecto`.
- eliminacion fisica restringida para `ong.asignaciones_actividad` y `ong.recursos_proyecto` porque el schema auditado no define flags de soft delete o vigencia.

## Restricciones y validaciones aplicadas
- uso explicito de `supabase.schema("ong")` y `supabase.schema("public")`.
- resolucion de `tenant_id` con `public.fn_current_tenant_id()`.
- filtros explicitos por `tenant_id` en servicios transaccionales.
- identificadores sanitizados antes de consultar o mutar.
- validacion de consistencia entre `proyecto -> tarea -> actividad`.
- validacion de existencia real para areas, proyectos, tareas, voluntarios e items antes de escribir.
- control de UI para `loading`, `empty`, `error` y `retry`.
- aviso de RBAC en frontend usando `public.fn_is_tenant_admin()`.
- no se usan arrays mock para estados de proyecto; el catalogo sale de `ong.estados_proyecto`.
- estados de tarea limitados al enum real documentado: `pendiente`, `en_progreso`, `completada`, `cancelada`.

## Restricciones funcionales del schema real
- `ong.actividades` no tiene columnas propias de estado, fecha ni ubicacion; el modulo hereda esos datos desde `ong.tareas`.
- no se encontro una tabla `ong.asistencias` en los scripts auditados; el detalle de actividades reutiliza `ong.horas_actividad` y `ong.evidencias_actividad`.
- `ong.asignaciones_actividad` y `ong.recursos_proyecto` no exponen contrato de soft delete en los scripts auditados.

## Dependencias con otros modulos
- `Operacion`: reutiliza `actividades`, `horas_actividad` y `evidencias_actividad`.
- `Personas`: provee voluntarios reales para asignaciones.
- `Recursos`: provee `ong.items` para recursos de proyecto.
- `Home`: puede reutilizar `proyectos`, `tareas` y `actividades` para metricas operativas.

## Permisos y restricciones
- El frontend solo deja una advertencia de capacidad de gestion porque no se localizaron permisos sembrados del tipo `projects.manage` en los scripts del core.
- El aislamiento principal queda respaldado por `tenant_id` y RLS del schema nuevo.
- Los cambios preservan `created_by`, `updated_by` y, cuando existe, `activo`.

## Pendientes y riesgos
- La ausencia del archivo `Informe de SchemaAuditAgent` impide contrastar este modulo contra un inventario externo adicional.
- Para `ong.asignaciones_actividad` y `ong.recursos_proyecto`, la baja sigue el contrato real del schema, pero no existe una alternativa de soft delete documentada.
- La compilacion global del repo requirio corregir un desacople previo del modulo clinico para poder validar el build.
