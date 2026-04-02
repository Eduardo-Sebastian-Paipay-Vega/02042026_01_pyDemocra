# Guía maestra del sistema

Base documental auditada en esta pasada:
- `AGENTS.md`
- `guidelines/ONGDiccionarioRF.md`
- `guidelines/ONGModulosDeTrabajo(ED).md`
- `guidelines/documentacion-navegacion/00-sincronizacion-post-migracion.md`
- `guidelines/documentacion-navegacion/01-home.md`
- `guidelines/documentacion-navegacion/02-operacion.md`
- `guidelines/documentacion-navegacion/03-proyectos.md`
- `guidelines/documentacion-navegacion/04-personas.md`
- `guidelines/documentacion-navegacion/05-aprobaciones.md`
- `guidelines/documentacion-navegacion/06-admision.md`
- `guidelines/documentacion-navegacion/07-recursos.md`
- `guidelines/documentacion-navegacion/08-notificaciones.md`
- `guidelines/documentacion-navegacion/08-gobernanza.md`
- `guidelines/documentacion-navegacion/10-configuracion.md`
- `guidelines/documentacion-navegacion/99-cierre-integral-repo.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`
- `src/app/routes.tsx`
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/layout/Topbar.tsx`
- `src/app/components/ui/help-assistant.tsx`
- `src/lib/db/ong/app-database.ts`
- `src/app/pages/*`
- `src/app/services/*`
- `src/app/modules/*`
- `supabase/functions/admin-provision-user/index.ts`
- `supabase/functions/admin-revoke-user-sessions/index.ts`
- `supabase/functions/consume-volunteer-registration-code/index.ts`

Esta guía consolida el estado real del repositorio al 2026-03-28 y debe leerse por encima de documentos previos cuando exista conflicto con los scripts SQL ya aplicados, el tipado actual de `src/lib/db/ong/app-database.ts` o los servicios/páginas vigentes.

## 1. Resumen ejecutivo
- Estado general del sistema: la base modular ya está ampliamente conectada a la nueva BD multi-esquema y el build actual compila, pero el cierre funcional es desigual entre módulos.
- Módulos sólidos: Personas, Admisión, ID Cards, Registro por código de voluntarios, Notificaciones, Gobernanza y buena parte de Configuración.
- Módulos parcialmente cerrados: Home, Operación, Aprobaciones y Recursos.
- Módulos con bloqueos críticos: Proyectos y toda la cadena transversal que todavía usa el contrato viejo de `ong.actividades`.
- Deuda técnica visible restante:
  - el shell administrativo sigue entrando con `isAuthenticated = true` en `src/app/routes.tsx`
  - `src/app/services/proyectos/activities.service.ts`, `src/app/services/operacion/actividades.service.ts` y `src/app/modules/home/homeDashboardService.ts` siguen operando actividades como si solo existieran `id_tarea`, `titulo` y `horas_estimadas`
  - `src/app/services/proyectos/assignments.service.ts` sigue haciendo borrado físico en `ong.asignaciones_actividad` y `ong.recursos_proyecto` aunque `Parte 4` ya documenta soft delete para ambas tablas
  - `/admin/courses` sigue siendo `PlaceholderPage`
  - la validación de evidencias sigue declarada como no documentada
  - hay mensajes de UI obsoletos y problemas de codificación visible en componentes compartidos

## 2. Mapa global de módulos
- Home
  - rutas reales: `/admin`, `/admin/search`
- Operación
  - rutas reales: `/admin/activities`, `/admin/attendance`, `/admin/hours`, `/admin/evidence`
- Proyectos
  - rutas reales: `/admin/projects`, `/admin/tasks`, `/admin/project-activities`, `/admin/project-assignments`
- Personas
  - rutas reales: `/admin/volunteers`, `/admin/beneficiaries`, `/admin/medical-records`
- Aprobaciones
  - rutas reales: `/admin/approvals`, `/admin/approvals/hours`
- Admisión
  - rutas reales: `/admin/admission/requests`, `/admin/admission/documents`, `/admin/admission/interviews`, `/admin/admission/onboarding`
- Recursos
  - rutas reales: `/admin/inventory`, `/admin/finance`, `/admin/courses`
- Notificaciones
  - rutas reales: `/admin/notifications/templates`, `/admin/notifications/history`
- Gobernanza
  - rutas reales: `/admin/catalogs`, `/admin/audit-log`, `/admin/sensitive-access`, `/admin/soft-delete`
- Configuración
  - rutas reales: `/admin/system-users`, `/admin/roles`, `/admin/security`
- ID Cards
  - ruta real: `/admin/id-cards`
- Registro por código de voluntarios
  - ruta real: `/landing/register`

## 3. Por cada módulo, documenta EXACTAMENTE este formato

### Home

#### 3.1 Propósito del módulo
- Centraliza el tablero inicial del tenant.
- Resume actividad operativa, pendientes de admisión y aprobaciones.
- Expone la búsqueda global y accesos rápidos a entidades clave.

#### 3.2 Submódulos incluidos
- Dashboard
- Búsqueda global

#### 3.3 Qué necesita antes de poder usarse
- Tenant y sesión válidos.
- Datos previos en voluntarios, proyectos, tareas, actividades y admisión para que existan métricas y resultados.
- Permisos suficientes para ver conteos y aprobaciones operativas.

#### 3.4 Tablas reales y schemas usados
- `ong.aprobaciones`
- `ong.voluntarios`
- `ong.proyectos`
- `ong.tareas`
- `ong.actividades`
- `ong.evidencias_actividad`
- `ong.horas_actividad`
- `rrhh.solicitudes_admision`
- `rrhh.admision_estado_historial`
- `public.user_roles_sedes`
- `public.roles`
- `public.profiles`
- Relaciones principales:
  - `ong.actividades.id_tarea -> ong.tareas.id`
  - `ong.tareas.id_proyecto -> ong.proyectos.id`
  - `ong.horas_actividad.id_actividad -> ong.actividades.id`
  - `ong.aprobaciones.entidad_id -> ong.horas_actividad.id` cuando `entidad_tabla = 'horas_actividad'`
- Referencias auditadas:
  - `src/app/modules/home/homeDashboardService.ts`
  - `src/app/modules/home/homeSearchService.ts`
  - `src/lib/db/ong/app-database.ts`

#### 3.5 Flujo correcto de uso
- El usuario entra al panel principal.
- Revisa métricas y pendientes reales del tenant.
- Usa búsqueda global para ubicar voluntarios, proyectos, actividades o solicitudes.
- Abre el detalle contextual y navega al módulo operativo correspondiente.

#### 3.6 Qué ya funciona hoy
- Carga métricas reales desde tablas multi-esquema.
- La búsqueda global usa deep-link concreto hacia voluntarios, proyectos, actividades y solicitudes.
- El detalle modal de búsqueda lee datos reales y no usa mocks.
- El topbar sí consume historial real de notificaciones desde la app shell.

#### 3.7 Qué está mal, incompleto o desalineado
- `src/app/modules/home/homeDashboardService.ts` todavía crea, edita y cancela actividades con el contrato viejo de `ong.actividades`, usando `id_tarea`, `titulo`, `horas_estimadas` y heredando estado desde `ong.tareas`.
- Eso contradice `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`, donde `ong.actividades` ya recibe `descripcion`, `codigo_estado`, `fecha_inicio`, `fecha_fin` e `id_ubicacion`.
- El shell administrativo sigue entrando con `isAuthenticated = true` en `src/app/routes.tsx`, por lo que la experiencia de Home no está protegida por un guard real.
- `src/app/components/ui/help-assistant.tsx` sigue mostrando tips estáticos como `Aprobaciones pendientes: 2` y enlaces `href: "#"`, por lo que la ayuda contextual no representa datos reales del tenant.

#### 3.8 Qué debe corregirse después
- Rehacer las mutaciones rápidas de actividades para usar el contrato nuevo de `ong.actividades`.
- Sustituir el acceso hardcodeado al shell por autenticación real y logout funcional.
- Reemplazar el asistente de ayuda estático por datos reales o dejarlo fuera hasta tener fuente operativa.

#### 3.9 Prioridad
- alta

### Operación

#### 3.1 Propósito del módulo
- Ejecuta la operación diaria de actividades.
- Registra asistencias, horas y evidencias.
- Sirve de puente entre planificación y ejecución real.

#### 3.2 Submódulos incluidos
- Actividades
- Asistencias
- Horas
- Evidencias

#### 3.3 Qué necesita antes de poder usarse
- Debe existir al menos un proyecto y una tarea si la actividad actual sigue vinculada por `id_tarea`.
- Deben existir voluntarios para asignación, asistencia y horas.
- Para escaneo QR debe existir credencial ID activa.
- Para aprobar horas debe existir la fila en `ong.horas_actividad` y su vínculo con `ong.aprobaciones`.

#### 3.4 Tablas reales y schemas usados
- `ong.actividades`
- `ong.asignaciones_actividad`
- `ong.asistencias`
- `ong.horas_actividad`
- `ong.evidencias_actividad`
- `ong.aprobaciones`
- `ong.id_cards`
- `ong.tareas`
- `ong.proyectos`
- `ong.voluntarios`
- `public.profiles`
- RPCs reales:
  - `ong.fn_register_attendance_scan`
- Relaciones principales:
  - `ong.asignaciones_actividad.id_actividad -> ong.actividades.id`
  - `ong.asistencias.id_actividad -> ong.actividades.id`
  - `ong.asistencias.id_card_id -> ong.id_cards.id`
  - `ong.horas_actividad.id_actividad -> ong.actividades.id`
  - `ong.horas_actividad.id_aprobacion -> ong.aprobaciones.id`
  - `ong.evidencias_actividad.id_actividad -> ong.actividades.id`
- Referencias auditadas:
  - `src/app/services/operacion/actividades.service.ts`
  - `src/app/services/operacion/asistencias.service.ts`
  - `src/app/services/operacion/horas.service.ts`
  - `src/app/services/operacion/evidencias.service.ts`
  - `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`

#### 3.5 Flujo correcto de uso
- Se crea o selecciona una actividad operativa.
- Se asignan voluntarios.
- Se registra entrada y salida manual o por QR.
- Se registran horas de actividad.
- Se suben evidencias.
- Las horas pasan a aprobación cuando corresponda.

#### 3.6 Qué ya funciona hoy
- Asistencias está alineado con `ong.asistencias`, incluyendo `check_in_at`, `check_out_at`, `qr_payload`, `id_card_id` y soft delete.
- El escaneo QR usa la RPC real `ong.fn_register_attendance_scan`.
- Horas ya opera sobre `ong.horas_actividad` y sincroniza `id_aprobacion` y `comentario_resolucion` con `ong.aprobaciones`.
- Evidencias lista, detalla, crea, edita y elimina registros reales de `ong.evidencias_actividad`.
- Las páginas contemplan estados de loading, vacío y error.

#### 3.7 Qué está mal, incompleto o desalineado
- `src/app/services/operacion/actividades.service.ts` todavía trata `descripcion`, estado y calendario como herencia de `ong.tareas`, aunque `Parte 4` ya movió esos campos a `ong.actividades`.
- La creación y edición de actividades operativas aún persiste solo `id_tarea`, `titulo` y `horas_estimadas`.
- La limpieza de asignaciones vinculadas a actividades sigue usando borrado físico en lugar de soft delete.
- `src/app/services/operacion/evidencias.service.ts` mantiene el bloqueo explícito `La validacion de evidencias no esta documentada...`, por lo que la validación/aprobación de evidencia no está cerrada.
- El módulo mezcla partes ya migradas en serio como asistencias/horas con una base vieja en actividades, lo que produce comportamiento inconsistente.

#### 3.8 Qué debe corregirse después
- Rehacer Actividades para usar `descripcion`, `codigo_estado`, `fecha_inicio`, `fecha_fin` e `id_ubicacion` de `ong.actividades`.
- Migrar bajas de `ong.asignaciones_actividad` a soft delete.
- Definir el flujo final de validación de evidencias sobre `ong.aprobaciones` o sobre el contrato SQL definitivo.

#### 3.9 Prioridad
- alta

### Proyectos

#### 3.1 Propósito del módulo
- Administra la planificación formal del trabajo.
- Organiza proyectos, tareas, actividades y asignaciones de personas y recursos.

#### 3.2 Submódulos incluidos
- Proyectos
- Tareas
- Actividades de proyecto
- Asignaciones de proyecto

#### 3.3 Qué necesita antes de poder usarse
- Primero debe existir proyecto.
- Para crear tarea debe existir proyecto.
- Para crear actividad la UI actual aún depende de `id_tarea`.
- Para asignar voluntarios o recursos deben existir voluntarios e items.

#### 3.4 Tablas reales y schemas usados
- `ong.proyectos`
- `ong.tareas`
- `ong.actividades`
- `ong.asignaciones_actividad`
- `ong.recursos_proyecto`
- `ong.items`
- `ong.voluntarios`
- `ong.estados_proyecto`
- Relaciones principales:
  - `ong.tareas.id_proyecto -> ong.proyectos.id`
  - `ong.actividades.id_tarea -> ong.tareas.id`
  - `ong.asignaciones_actividad.id_actividad -> ong.actividades.id`
  - `ong.asignaciones_actividad.id_voluntario -> ong.voluntarios.id`
  - `ong.recursos_proyecto.id_proyecto -> ong.proyectos.id`
  - `ong.recursos_proyecto.id_item -> ong.items.id`
- Referencias auditadas:
  - `src/app/modules/projects/ProjectsWorkspace.tsx`
  - `src/app/services/proyectos/projects.service.ts`
  - `src/app/services/proyectos/tasks.service.ts`
  - `src/app/services/proyectos/activities.service.ts`
  - `src/app/services/proyectos/assignments.service.ts`
  - `guidelines/documentacion-navegacion/03-proyectos.md`
  - `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`

#### 3.5 Flujo correcto de uso
- Se crea el proyecto.
- Se crean las tareas del proyecto.
- Se crean las actividades vinculadas a la tarea o al flujo operativo real definido.
- Se asignan voluntarios a actividades y recursos al proyecto.
- Se monitorea avance y se ajustan estados.

#### 3.6 Qué ya funciona hoy
- Existen pantallas reales para proyectos, tareas, actividades de proyecto y asignaciones.
- Proyectos y tareas leen y persisten tablas reales.
- El workspace concentra catálogos, filtros y paneles de edición/detalle.

#### 3.7 Qué está mal, incompleto o desalineado
- `src/app/modules/projects/ProjectsWorkspace.tsx` todavía afirma que `ong.actividades` no define estado, fecha ni ubicación propias y que el formulario solo guarda `id_tarea`, `titulo` y `horas_estimadas`.
- `src/app/services/proyectos/activities.service.ts` también sigue insertando y editando actividades con ese contrato viejo y no usa `descripcion`, `codigo_estado`, `fecha_inicio`, `fecha_fin` ni `id_ubicacion`.
- `guidelines/documentacion-navegacion/03-proyectos.md` quedó desactualizado: sigue diciendo que `ong.asignaciones_actividad` y `ong.recursos_proyecto` no tienen soft delete y que la baja es física, pero `Parte 4` añadió `is_deleted`, `deleted_at` y `deleted_by` a ambas tablas.
- `src/app/services/proyectos/assignments.service.ts` continúa usando `.delete()` real sobre `ong.asignaciones_actividad` y `ong.recursos_proyecto`, lo que contradice tanto `Parte 4` como el restore de Gobernanza.
- `src/app/components/layout/AppShell.tsx` no tiene títulos dedicados para `/admin/project-activities` ni `/admin/project-assignments`, por lo que esas pantallas caen en `Admin`.

#### 3.8 Qué debe corregirse después
- Rehacer primero este módulo contra el contrato nuevo de `ong.actividades`.
- Sustituir borrado físico por soft delete en `ong.asignaciones_actividad` y `ong.recursos_proyecto`.
- Actualizar textos, alertas y documentación específica de Proyectos.
- Completar títulos de ruta en `AppShell`.

#### 3.9 Prioridad
- alta

### Personas

#### 3.1 Propósito del módulo
- Gestiona el padrón de voluntarios y beneficiarios.
- Centraliza perfiles clínicos y acceso sensible con trazabilidad.

#### 3.2 Submódulos incluidos
- Voluntarios
- Beneficiarios
- Ficha médica sensible

#### 3.3 Qué necesita antes de poder usarse
- Catálogos de documento, género y país.
- Estados de voluntario.
- Catálogos RRHH como habilidades y roles operativos.
- Para ficha sensible, permisos explícitos y motivo de acceso.

#### 3.4 Tablas reales y schemas usados
- `ong.voluntarios`
- `ong.beneficiarios`
- `ong.estados_voluntario`
- `ong.asignaciones_proyecto`
- `ong.asignaciones_actividad`
- `rrhh.habilidades`
- `rrhh.voluntario_habilidades`
- `rrhh.roles_operativos`
- `rrhh.asignaciones_rol`
- `rrhh.documentos_voluntario`
- `rrhh.perfil_coordinador`
- `clinico.fichas_medicas`
- `clinico.ficha_sensible_voluntario`
- `clinico.perfil_nino`
- `clinico.perfil_adulto_mayor`
- `clinico.accesos_sensibles_log`
- `clinico.accesos_sensibles_voluntario_log`
- `public.cat_tipos_documento`
- `public.cat_generos`
- `public.cat_paises`
- Relaciones principales:
  - `rrhh.voluntario_habilidades.id_voluntario -> ong.voluntarios.id`
  - `rrhh.documentos_voluntario.id_voluntario -> ong.voluntarios.id`
  - `clinico.fichas_medicas.id_beneficiario -> ong.beneficiarios.id`
  - `clinico.ficha_sensible_voluntario.id_voluntario -> ong.voluntarios.id`
- Referencias auditadas:
  - `src/app/services/personas/volunteers.service.ts`
  - `src/app/services/personas/beneficiaries.service.ts`
  - `src/app/services/clinico/medicalRecords.service.ts`
  - `src/app/pages/MedicalRecords.tsx`

#### 3.5 Flujo correcto de uso
- Se registra o actualiza un voluntario.
- Se completan habilidades, roles, documentos y perfil coordinador si aplica.
- Se registra o actualiza un beneficiario con su perfil específico.
- Cuando se necesita ver información clínica sensible, se abre con motivo de acceso y trazabilidad.

#### 3.6 Qué ya funciona hoy
- Voluntarios ya integra RRHH real para habilidades, roles, documentos y asignaciones.
- Beneficiarios ya integra perfiles clínicos de niño y adulto mayor.
- La ficha médica sensible oculta contenido en listados y exige flujo de acceso controlado.
- Los accesos sensibles se registran sobre las bitácoras clínicas reales, incluyendo la variante para voluntarios.

#### 3.7 Qué está mal, incompleto o desalineado
- No se detectó una desalineación estructural comparable a Proyectos.
- La operación depende de grants y RLS correctos en `rrhh` y `clinico`; el repositorio no muestra mensajes persistidos de `permission denied`, así que la validación final queda atada al entorno desplegado.
- La seguridad global sigue condicionada por el acceso hardcodeado al shell administrativo, aunque los servicios internos sí hacen controles.

#### 3.8 Qué debe corregirse después
- Verificar grants/RLS reales de `rrhh` y `clinico` en entorno integrado.
- Cerrar autenticación real del shell para que la protección documental coincida con el acceso efectivo.

#### 3.9 Prioridad
- media

### Aprobaciones

#### 3.1 Propósito del módulo
- Consolida la revisión y resolución de aprobaciones operativas.
- Hoy funciona principalmente como bandeja de aprobación de horas.

#### 3.2 Submódulos incluidos
- Bandeja de aprobaciones
- Aprobación de horas

#### 3.3 Qué necesita antes de poder usarse
- Debe existir un registro en `ong.horas_actividad`.
- Debe existir o sincronizarse la fila correspondiente en `ong.aprobaciones`.
- El usuario debe contar con permisos de aprobación operativa.

#### 3.4 Tablas reales y schemas usados
- `ong.aprobaciones`
- `ong.horas_actividad`
- `public.profiles`
- Relaciones principales:
  - `ong.aprobaciones.entidad_id -> ong.horas_actividad.id` cuando `entidad_tabla = 'horas_actividad'`
  - `ong.horas_actividad.id_aprobacion -> ong.aprobaciones.id`
- Referencias auditadas:
  - `src/app/pages/Approvals.tsx`
  - `src/app/services/operacion/aprobaciones.service.ts`
  - `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`

#### 3.5 Flujo correcto de uso
- El aprobador entra a la bandeja.
- Filtra pendientes.
- Abre el detalle del registro de horas vinculado.
- Aprueba o rechaza.
- Si hace falta, devuelve el registro a pendiente.

#### 3.6 Qué ya funciona hoy
- La bandeja lee `ong.aprobaciones` como fuente primaria.
- El detalle se enriquece con contexto real desde `ong.horas_actividad`.
- Aprobar, rechazar y devolver a pendiente ya sincroniza ambos lados del flujo.

#### 3.7 Qué está mal, incompleto o desalineado
- La bandeja actual solo expone aprobaciones de `horas_actividad`.
- No hay cobertura genérica para evidencias, finanzas u otras entidades que la nueva tabla `ong.aprobaciones` ya podría soportar.
- La propia implementación reconoce este límite en `src/app/services/operacion/aprobaciones.service.ts`.

#### 3.8 Qué debe corregirse después
- Generalizar la bandeja por `modulo`, `entidad_schema`, `entidad_tabla` y `tipo_aprobacion`.
- Conectar futuros flujos de evidencias y otras aprobaciones al mismo inbox si el negocio lo confirma.

#### 3.9 Prioridad
- media

### Admisión

#### 3.1 Propósito del módulo
- Gestiona el ingreso formal de nuevos voluntarios.
- Controla solicitudes, documentos, entrevistas y onboarding.

#### 3.2 Submódulos incluidos
- Solicitudes
- Documentos
- Entrevistas
- Onboarding

#### 3.3 Qué necesita antes de poder usarse
- Debe existir una solicitud de admisión.
- Los documentos y entrevistas dependen de la solicitud.
- El onboarding depende de un voluntario vinculado o de su resolución durante el flujo.
- Para registro público se requiere código generado.

#### 3.4 Tablas reales y schemas usados
- `rrhh.solicitudes_admision`
- `rrhh.documentos_admision`
- `rrhh.entrevistas_admision`
- `rrhh.onboarding_pasos`
- `rrhh.onboarding_voluntario`
- `rrhh.codigos_registro_voluntario`
- `rrhh.registro_documentos_postulante`
- `ong.voluntarios`
- `public.profiles`
- RPCs y funciones reales:
  - `rrhh.fn_generate_registration_code`
  - `supabase/functions/consume-volunteer-registration-code/index.ts`
- Relaciones principales:
  - `rrhh.documentos_admision.id_solicitud -> rrhh.solicitudes_admision.id`
  - `rrhh.entrevistas_admision.id_solicitud -> rrhh.solicitudes_admision.id`
  - `rrhh.onboarding_voluntario.id_voluntario -> ong.voluntarios.id`
  - `rrhh.codigos_registro_voluntario.id_solicitud -> rrhh.solicitudes_admision.id`
- Referencias auditadas:
  - `src/app/services/admision/solicitudesAdmision.service.ts`
  - `src/app/services/admision/volunteerRegistration.service.ts`
  - `src/app/pages/AdmissionRequests.tsx`
  - `supabase/functions/consume-volunteer-registration-code/index.ts`
  - `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`

#### 3.5 Flujo correcto de uso
- Se crea la solicitud.
- Se suben y verifican documentos.
- Se programa y registra entrevista con puntaje.
- Se vincula o resuelve el voluntario objetivo.
- Se ejecuta onboarding.
- Si se usa el flujo público, se genera código y el postulante completa el registro en `/landing/register`.

#### 3.6 Qué ya funciona hoy
- Solicitudes usa `id_voluntario_vinculado`.
- Documentos ya persisten `verified_by` y `verified_at`.
- Entrevistas ya usan `puntaje`.
- Onboarding ya usa `evidencia_url` y soft delete.
- El flujo de código público ya valida, consume, sincroniza `auth.users`, `public.profiles`, `ong.voluntarios` y guarda `rrhh.registro_documentos_postulante`.

#### 3.7 Qué está mal, incompleto o desalineado
- Persisten compatibilidades para filas viejas sin `id_voluntario_vinculado`; el servicio aún tiene fallback por coincidencia de email mientras se termina de sanear data histórica.
- El flujo depende por diseño de backend seguro y Edge Function; si esa capa no está desplegada o no tiene llaves correctas, el registro por código se bloquea por completo.
- No se detectó una divergencia fuerte entre UI y SQL comparable a Proyectos.

#### 3.8 Qué debe corregirse después
- Backfill de `id_voluntario_vinculado` en solicitudes históricas.
- Verificación de despliegue y secretos de la Edge Function en todos los ambientes.
- Monitoreo funcional del uso de códigos y documentos públicos.

#### 3.9 Prioridad
- media

### Recursos

#### 3.1 Propósito del módulo
- Gestiona inventario y finanzas operativas del tenant.
- Debe cubrir también cursos y certificados cuando ese submódulo exista de forma real.

#### 3.2 Submódulos incluidos
- Inventario
- Finanzas
- Cursos y certificados

#### 3.3 Qué necesita antes de poder usarse
- Para inventario deben existir items y ubicaciones.
- Para finanzas deben existir cuentas, categorías y, si aplica, proyecto asociado.
- Para aprobación financiera debe existir la fila en `finanzas.aprobaciones_transaccion`.
- Para cursos y certificados hace falta todavía un contrato real implementado.

#### 3.4 Tablas reales y schemas usados
- `ong.items`
- `ong.ubicaciones`
- `ong.tipo_transaccion_inventario`
- `ong.transacciones_inventario`
- `finanzas.cuentas`
- `finanzas.cat_tipos_cuenta`
- `finanzas.categorias`
- `finanzas.transacciones`
- `finanzas.aprobaciones_transaccion`
- `finanzas.comprobantes_financieros`
- `ong.proyectos`
- Relaciones principales:
  - `ong.transacciones_inventario.id_item -> ong.items.id`
  - `ong.transacciones_inventario.id_ubicacion -> ong.ubicaciones.id`
  - `finanzas.transacciones.id_cuenta -> finanzas.cuentas.id`
  - `finanzas.transacciones.id_categoria -> finanzas.categorias.id`
  - `finanzas.aprobaciones_transaccion.id_transaccion -> finanzas.transacciones.id`
- Referencias auditadas:
  - `src/app/services/recursos/items.service.ts`
  - `src/app/services/recursos/inventarioMovimientos.service.ts`
  - `src/app/services/recursos/cuentasFinancieras.service.ts`
  - `src/app/services/recursos/categoriasFinancieras.service.ts`
  - `src/app/services/recursos/transaccionesFinancieras.service.ts`
  - `src/app/pages/Finance.tsx`
  - `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`

#### 3.5 Flujo correcto de uso
- Se crean items y ubicaciones.
- Se registran entradas, salidas o ajustes de inventario.
- Se crean cuentas y categorías financieras.
- Se registran transacciones y comprobantes.
- Se resuelven aprobaciones financieras si aplica.

#### 3.6 Qué ya funciona hoy
- Inventario ya opera con tablas reales de `ong`.
- Finanzas ya consume `finanzas.cuentas`, `finanzas.cat_tipos_cuenta`, `finanzas.transacciones`, `finanzas.aprobaciones_transaccion` y `finanzas.comprobantes_financieros`.
- Existen filtros, detalle y mutaciones reales.

#### 3.7 Qué está mal, incompleto o desalineado
- `/admin/courses` sigue resolviendo a `PlaceholderPage` en `src/app/routes.tsx`.
- `src/app/services/recursos/transaccionesFinancieras.service.ts` advierte que algunos egresos legacy no tienen fila en `finanzas.aprobaciones_transaccion` y se muestran como pendientes.
- El submódulo de cursos y certificados no está implementado en esta base del frontend.

#### 3.8 Qué debe corregirse después
- Implementar Cursos y Certificados solo cuando exista contrato documental y pantallas reales.
- Sanear los egresos heredados que no tienen aprobación financiera asociada si el negocio exige historial consistente.

#### 3.9 Prioridad
- media

### Notificaciones

#### 3.1 Propósito del módulo
- Administra plantillas y consulta el historial real de notificaciones emitidas.

#### 3.2 Submódulos incluidos
- Plantillas
- Historial

#### 3.3 Qué necesita antes de poder usarse
- Debe existir catálogo de canales.
- Deben existir plantillas y eventos persistidos en historial para tener contenido real.

#### 3.4 Tablas reales y schemas usados
- `comunicaciones.canales_notificacion`
- `comunicaciones.plantillas_notificacion`
- `comunicaciones.historial_notificaciones`
- `public.profiles`
- Relaciones principales:
  - `comunicaciones.historial_notificaciones.id_plantilla -> comunicaciones.plantillas_notificacion.id`
  - `comunicaciones.plantillas_notificacion.codigo_canal -> comunicaciones.canales_notificacion.codigo`
- Referencias auditadas:
  - `src/app/services/notificaciones/templates.service.ts`
  - `src/app/services/notificaciones/history.service.ts`
  - `src/app/pages/NotificationTemplates.tsx`
  - `src/app/pages/NotificationHistory.tsx`

#### 3.5 Flujo correcto de uso
- Se crean o editan plantillas.
- Se activan o desactivan según necesidad.
- Se consulta el historial real por canal, estado y destinatario.
- Desde el topbar se puede abrir el historial completo.

#### 3.6 Qué ya funciona hoy
- Plantillas persiste `codigo_evento` y `variables` reales.
- Historial muestra `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla` y `payload`.
- El topbar ya consulta notificaciones reales y navega al historial.

#### 3.7 Qué está mal, incompleto o desalineado
- No existe contrato documental para reintentos o motor de envío desde frontend, y el propio servicio lo deja explícito.
- Esto no es un bug de mapeo de schema, pero sí un límite funcional: la UI administra catálogo e historial, no automatización de entrega.

#### 3.8 Qué debe corregirse después
- Si se necesita reintento, preview o envío manual, primero debe definirse backend/RPC/documentación de negocio.

#### 3.9 Prioridad
- baja

### Gobernanza

#### 3.1 Propósito del módulo
- Centraliza catálogos, auditoría, bitácoras de acceso sensible y restore por soft delete.

#### 3.2 Submódulos incluidos
- Catálogos
- Auditoría
- Accesos sensibles
- Soft delete / Retención

#### 3.3 Qué necesita antes de poder usarse
- Permisos `governance.*` o tenant admin según acción.
- Catálogos y bitácoras expuestos por el Core y schemas de dominio.
- Para restore, la tabla debe estar en la whitelist y documentar `is_deleted`, `deleted_at` y `deleted_by`.

#### 3.4 Tablas reales y schemas usados
- `public.cat_permissions`
- `public.cat_tipos_documento`
- `public.cat_generos`
- `public.cat_paises`
- `public.cat_monedas`
- `public.cat_module_statuses`
- `ong.estados_voluntario`
- `ong.unidades_medida`
- `ong.estados_objeto`
- `ong.estados_proyecto`
- `ong.tipo_transaccion_inventario`
- `rrhh.habilidades`
- `comunicaciones.canales_notificacion`
- `public.audit_logs`
- `auditoria.audit_log`
- `clinico.accesos_sensibles_log`
- `clinico.accesos_sensibles_voluntario_log`
- `public.role_access_constraints`
- `public.tenants`
- `public.plan_policies`
- Whitelist de restore actual:
  - `ong.asistencias`
  - `ong.asignaciones_actividad`
  - `ong.recursos_proyecto`
  - `rrhh.onboarding_voluntario`
- Referencias auditadas:
  - `src/app/services/gobernanza/catalogs.service.ts`
  - `src/app/services/gobernanza/audit.service.ts`
  - `src/app/services/gobernanza/sensitiveAccess.service.ts`
  - `src/app/services/gobernanza/retention.service.ts`

#### 3.5 Flujo correcto de uso
- Se consultan catálogos reales.
- Se revisan eventos de auditoría.
- Se inspeccionan accesos a datos sensibles.
- Se consultan políticas de retención.
- Si el usuario es tenant admin, restaura registros soft deleted de la whitelist.

#### 3.6 Qué ya funciona hoy
- Catálogos reales ya se listan desde múltiples schemas.
- La auditoría ya consolida `public.audit_logs` y `auditoria.audit_log`.
- Accesos sensibles ya incluye tanto beneficiarios como voluntarios.
- El restore real ya existe y opera sobre la whitelist documentada.

#### 3.7 Qué está mal, incompleto o desalineado
- El restore de Gobernanza está mejor alineado que algunos módulos productores de datos.
- Proyectos y parte de Operación aún eliminan físicamente registros que Gobernanza supone restaurables por soft delete.
- La acción de restore queda restringida a tenant admin porque el Core todavía no expone un permiso de mutación dedicado.

#### 3.8 Qué debe corregirse después
- Alinear Proyectos y Operación con el contrato de soft delete.
- Definir permiso explícito para restore si el Core lo aprueba.
- Evaluar si a futuro se debe consolidar una sola fuente de auditoría.

#### 3.9 Prioridad
- media

### Configuración

#### 3.1 Propósito del módulo
- Administra usuarios, roles, permisos y seguridad de sesión del tenant.

#### 3.2 Submódulos incluidos
- Usuarios del sistema
- Roles y permisos
- Seguridad de sesión

#### 3.3 Qué necesita antes de poder usarse
- Roles y sedes seed disponibles.
- Edge Functions desplegadas.
- Permisos `settings.users.*`, `settings.roles.*` y `settings.sessions.*`.

#### 3.4 Tablas reales y schemas usados
- `public.profiles`
- `public.roles`
- `public.role_permissions`
- `public.user_roles_sedes`
- `public.sedes`
- `public.sessions`
- `public.devices`
- `public.terminals`
- `public.auth_events`
- `public.role_access_constraints`
- Funciones y Edge Functions reales:
  - `public.fn_remote_revoke_app_session`
  - `supabase/functions/admin-provision-user/index.ts`
  - `supabase/functions/admin-revoke-user-sessions/index.ts`
- Referencias auditadas:
  - `src/app/services/configuracion/systemUsers.service.ts`
  - `src/app/services/configuracion/roles.service.ts`
  - `src/app/services/configuracion/security.service.ts`
  - `src/app/pages/SystemUsers.tsx`
  - `src/app/pages/Roles.tsx`
  - `src/app/pages/Security.tsx`

#### 3.5 Flujo correcto de uso
- Se listan usuarios y asignaciones vigentes.
- Se provisiona el acceso institucional mediante backend seguro.
- Se asignan roles y sedes.
- Se revisan sesiones, dispositivos y eventos de auth.
- Se revocan sesiones remotas cuando corresponde.

#### 3.6 Qué ya funciona hoy
- El módulo usa Edge Functions reales para provisionar usuarios y revocar sesiones.
- Roles y permisos leen y editan tablas reales del Core.
- Seguridad de sesión usa tablas reales del Core y el patrón server-only documentado.

#### 3.7 Qué está mal, incompleto o desalineado
- Aunque este módulo está relativamente sólido, la aplicación completa todavía entra al shell por `isAuthenticated = true` en `src/app/routes.tsx`.
- `src/app/components/layout/Topbar.tsx` muestra `Perfil`, `Configuración` y `Cerrar sesión` como opciones estáticas sin lógica real.
- El cierre de sesión global y el guard de entrada siguen incompletos, así que la seguridad del módulo no está acompañada por un cierre equivalente en navegación.

#### 3.8 Qué debe corregirse después
- Implementar autenticación real, guard de rutas y logout efectivo.
- Conectar el menú de cuenta del topbar a flujos reales.
- Mantener la creación de `auth.users` fuera del frontend, como ya está diseñado.

#### 3.9 Prioridad
- alta

### ID Cards

#### 3.1 Propósito del módulo
- Gestiona plantillas de credencial y emisión/revocación de credenciales ID para voluntariado.

#### 3.2 Submódulos incluidos
- Plantillas ID
- Campos de plantilla
- Credenciales emitidas

#### 3.3 Qué necesita antes de poder usarse
- Debe existir voluntario.
- Debe existir plantilla válida.
- El usuario debe tener permisos `idcards.read` e `idcards.manage`.

#### 3.4 Tablas reales y schemas usados
- `ong.id_card_templates`
- `ong.id_card_template_fields`
- `ong.id_cards`
- `ong.voluntarios`
- `public.fn_has_permission`
- Relaciones principales:
  - `ong.id_card_template_fields.id_template -> ong.id_card_templates.id`
  - `ong.id_cards.id_template -> ong.id_card_templates.id`
  - `ong.id_cards.id_voluntario -> ong.voluntarios.id`
- Referencias auditadas:
  - `src/app/services/personas/idCards.service.ts`
  - `src/app/pages/IdCards.tsx`
  - `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`

#### 3.5 Flujo correcto de uso
- Se crea la plantilla.
- Se definen campos y coordenadas.
- Se activa la plantilla.
- Se emite la credencial al voluntario.
- Se actualiza o revoca cuando corresponde.

#### 3.6 Qué ya funciona hoy
- Plantillas, campos y credenciales ya se leen desde tablas reales de `ong`.
- La pantalla ya permite crear, editar, activar/desactivar, emitir y revocar.
- El servicio valida permisos mediante `public.fn_has_permission`.

#### 3.7 Qué está mal, incompleto o desalineado
- No se detectó una divergencia fuerte entre la pantalla y la migración SQL.
- El módulo depende de que el matrix de permisos y grants esté correctamente expuesto en el entorno.
- Su valor operativo se reduce si Operación no mantiene coherencia total entre credencial y asistencia por QR.

#### 3.8 Qué debe corregirse después
- Verificar permisos en ambiente integrado.
- Revisar la coordinación con Asistencias cuando se rebase Operación al contrato final.

#### 3.9 Prioridad
- media

### Registro por código de voluntarios

#### 3.1 Propósito del módulo
- Permite registrar o completar el alta de voluntarios mediante un código público controlado.

#### 3.2 Submódulos incluidos
- Generación de código desde Admisión
- Validación pública del código
- Consumo del código y registro documental

#### 3.3 Qué necesita antes de poder usarse
- Debe existir una solicitud de admisión.
- Debe generarse un código válido.
- La Edge Function de consumo debe estar desplegada con service role.

#### 3.4 Tablas reales y schemas usados
- `rrhh.codigos_registro_voluntario`
- `rrhh.registro_documentos_postulante`
- `rrhh.solicitudes_admision`
- `public.profiles`
- `ong.voluntarios`
- Funciones y endpoints reales:
  - `rrhh.fn_generate_registration_code`
  - `supabase/functions/consume-volunteer-registration-code/index.ts`
- Relaciones principales:
  - `rrhh.codigos_registro_voluntario.id_solicitud -> rrhh.solicitudes_admision.id`
  - `rrhh.registro_documentos_postulante.id_codigo -> rrhh.codigos_registro_voluntario.id`
- Referencias auditadas:
  - `src/app/services/admision/solicitudesAdmision.service.ts`
  - `src/app/services/admision/volunteerRegistration.service.ts`
  - `src/app/pages/landing/VolunteerRegistrationPage.tsx`
  - `supabase/functions/consume-volunteer-registration-code/index.ts`

#### 3.5 Flujo correcto de uso
- Un usuario interno genera el código desde Admisión.
- Comparte la URL pública de registro.
- El postulante valida el código.
- Completa formulario y adjunta documentos.
- La función sincroniza usuario, perfil y voluntario, registra documentos y consume el código.

#### 3.6 Qué ya funciona hoy
- Ya existe ruta pública `/landing/register`.
- Ya existe preview y consumo real del código.
- El flujo ya interactúa con `auth.users`, `public.profiles`, `ong.voluntarios` y `rrhh.registro_documentos_postulante`.

#### 3.7 Qué está mal, incompleto o desalineado
- Es un flujo fuertemente dependiente del backend seguro; si falta la función o los secretos, no hay fallback.
- No se observó una pantalla administrativa dedicada para seguimiento fino de intentos fallidos o auditoría funcional del consumo más allá del módulo de Admisión y la bitácora técnica.

#### 3.8 Qué debe corregirse después
- Añadir monitoreo funcional del ciclo de vida del código.
- Confirmar despliegue homogéneo de la Edge Function entre ambientes.

#### 3.9 Prioridad
- media

## 4. Hallazgos transversales
- Permisos y RLS:
  - La mayoría de servicios sí consulta permisos reales o usa funciones del Core como `public.fn_has_permission()` y `public.fn_is_tenant_admin()`.
  - Aun así, el shell sigue entrando con autenticación hardcodeada en `src/app/routes.tsx`, por lo que el perímetro de acceso no está realmente cerrado.
  - No se encontraron en el repo mensajes persistidos de `permission denied for schema rrhh` o `permission denied for schema clinico`; eso no confirma que los grants estén perfectos, solo que el fallo no quedó documentado en código o docs.
- Schemas no expuestos o sin grants suficientes:
  - No hay evidencia textual directa en el repositorio de grants faltantes, pero los módulos que tocan `rrhh`, `clinico`, `finanzas` y `comunicaciones` dependen totalmente de la exposición correcta de esos schemas.
- Rutas viejas vs rutas nuevas:
  - `/admin/courses` sigue siendo placeholder.
  - `/admin/project-activities` y `/admin/project-assignments` existen, pero `AppShell` no las nombra bien en el topbar.
  - No existe ruta real de login activa, aunque el redirect la menciona.
- Mensajes de UI obsoletos:
  - Proyectos y Operación siguen mostrando que `ong.actividades` hereda estado y fecha desde tarea, lo que ya no coincide con `Parte 4`.
  - Evidencias sigue declarando que la validación no está documentada.
  - `src/app/components/ui/help-assistant.tsx` muestra números y enlaces falsos.
- Tipado legacy:
  - `src/lib/db/ong/app-database.ts` ya incorpora `ong.asistencias`, `ong.aprobaciones`, `clinico.accesos_sensibles_voluntario_log`, `rrhh.codigos_registro_voluntario`, `rrhh.registro_documentos_postulante`, `ong.id_card_templates`, `ong.id_cards`, `finanzas.cat_tipos_cuenta` y `finanzas.aprobaciones_transaccion`.
  - El problema dominante ya no es el typegen, sino servicios y docs que siguen pensando con el contrato previo.
- Deuda en servicios:
  - La lógica vieja de `ong.actividades` está duplicada en Home, Operación y Proyectos.
  - El borrado físico sobre tablas ya migradas a soft delete sigue vivo en Proyectos.
- Deuda en hooks:
  - Los hooks en general respetan `page -> hook -> service -> Supabase`.
  - El mayor problema es que heredan servicios desalineados, no que rompan la arquitectura.
- Deuda en documentación:
  - `guidelines/documentacion-navegacion/03-proyectos.md` ya no refleja `Parte 4`.
  - Esta guía debe tomarse como documento maestro de bloqueos hasta que el resto de documentos específicos se actualicen.
- UX transversal:
  - Hay mojibake visible en `Topbar` y `HelpAssistant`.
  - El menú de cuenta del topbar no ejecuta acciones reales.
  - No hay scripts de lint o test en `package.json`; el único gate operativo claro hoy es `npm run build`, que en esta auditoría sí pasó.

## 5. Plan sugerido de cierre
- Qué corregir primero:
  - Rehacer Proyectos contra el contrato nuevo de `ong.actividades`.
  - En el mismo frente, alinear Operación y Home para no seguir duplicando el contrato viejo.
  - Sustituir borrados físicos por soft delete en `ong.asignaciones_actividad` y `ong.recursos_proyecto`.
- Qué corregir después:
  - Implementar autenticación real del shell, guard de rutas y logout.
  - Cerrar el flujo de validación de evidencias.
  - Generalizar Aprobaciones más allá de horas.
- Qué puede esperar:
  - Implementación de Cursos y Certificados, siempre que exista contrato real.
  - Limpieza de mensajes obsoletos, topbar, help assistant y problemas de codificación.
  - Actualización de documentos específicos una vez que los módulos críticos queden reescritos.

Orden recomendado de ataque:
1. Proyectos
2. Operación
3. Home
4. Configuración y acceso real al shell
5. Aprobaciones genéricas
6. Recursos / Cursos
