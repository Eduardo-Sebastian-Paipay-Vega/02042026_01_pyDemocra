1) Diccionario de Requerimientos Funcionales Consolidado (RF)

Prioridad lógica: P0 Crítico (seguridad/gobernanza), P1 Core operativo, P2 Soporte, P3 “world-class / siguiente versión”.

Módulo A. Seguridad, usuarios, roles y políticas (Core)

RF-01 (P0) Autenticación y sesión

El sistema debe permitir iniciar/cerrar sesión con credenciales de usuario asociadas 1:1 a un voluntario/personal, usando contraseña hasheada.

Debe registrar último acceso (para auditoría operacional).

(Opcional) invalidar sesiones/tokens al cierre de sesión y permitir cierre remoto por seguridad. 

dvf

 

tercero

RF-02 (P0) Gestión de usuarios del sistema

Crear usuarios vinculados a voluntario.

Activar/desactivar usuario sin borrado físico (soft delete o flag activo).

(Opcional) forzar cambio de contraseña por política/incidente. 

dvf

RF-03 (P0) RBAC por módulo y acción + control sensible

Implementar RBAC por módulo y acción (CRUD + acciones especiales: aprobar/exportar/ver sensible).

Restringir lectura/edición de datos sensibles: fichas médicas e info sensible de voluntario solo a roles autorizados.

Enmascarar PII sensible según rol (p.ej., DNI/teléfono/email parcial). 

dvf

 

tercero

RF-04 (P0) Bitácora reforzada de acceso a datos sensibles

Registrar accesos (lectura y escritura) a recursos sensibles con usuario, fecha/hora, ip, user_agent y motivo (si aplica). 

dvf

 

tercero

Módulo A2. Auditoría integral, trazabilidad y soft delete (Gobernanza)

RF-05 (P0) AuditLog de cambios críticos

Registrar cambios críticos (INSERT/UPDATE/DELETE) con before/after (json) + usuario + timestamp + (ip/user_agent) + búsqueda por tabla/registro/usuario/fechas.

Exportación restringida a admin/auditor. 

dvf

RF-06 (P0) Soft delete y retención

Implementar soft delete en entidades críticas (is_deleted, deleted_at, deleted_by) y política de retención/respaldo. 

dvf

Módulo 2. Catálogos y estados (anti-caos)

RF-07 (P0) Catálogos normalizados

Mantener catálogos para evitar texto libre: estados (voluntario/proyecto/tarea/actividad), tipos de evidencia, cana les, tipos de transacción, tipos de documento, etc.

Formularios/validaciones deben consumir catálogos (unicidad/consistencia). 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

Módulo 3. Gestión de voluntarios (Core)

RF-08 (P1) Registro maestro de voluntarios

Registrar voluntarios con DNI único, UUID credencial, datos personales, contacto y foto.

Administrar estado vía catálogo de estados. 

dvf

 

tercero

RF-09 (P1) Roles institucionales y operativos

Asignar roles institucionales (catálogo Roles) y roles operativos (rol en proyecto/actividad). 

tercero

RF-10 (P1) Habilidades por voluntario

Asignar habilidades (M:N) con nivel (si aplica) y permitir búsqueda/filtrado. 

dvf

 

tercero

RF-11 (P1) Supervisión (quién supervisa a quién) con vigencia

Registrar supervisiones supervisor ↔ voluntario con fechas y trazabilidad. 

dvf

 

tercero

RF-12 (P2) Documentos del voluntario y verificación

Gestionar documentos del voluntario (tipo, archivo/ruta, verificación, quién/cuándo).

Alertar vencimientos/permisos y generar tareas automáticas (recomendado). 

dvf

Módulo 4. Beneficiarios y perfiles + ficha médica (Core)

RF-13 (P1) Registro de beneficiarios

Registrar beneficiarios y asociarlos a participación en proyectos. 

dvf

 

tercero

RF-14 (P1) Perfiles específicos (niño / adulto mayor / coordinador)

Mantener perfiles con campos propios según tipo. 

dvf

RF-15 (P0/P1) Fichas médicas y datos sensibles con acceso reforzado

Registrar fichas médicas (diagnóstico, alergias, medicación, observaciones) con acceso controlado + log de acceso sensible. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-16 (P2) Logros/hitos de beneficiario

Registrar logros e hitos (y si aplica, vínculo a voluntario tutor). 

dvf

Módulo 5. Proyectos (planificación y control)

RF-17 (P1) CRUD de proyectos

Crear/editar/cerrar proyectos con área, fechas, presupuesto, estado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-18 (P1) Asignación de voluntarios a proyecto

Alta/baja de voluntarios a proyecto con rol y vigencia (activo). 

tercero

RF-19 (P2) Recursos/documentos del proyecto

Adjuntar recursos (archivo/link/material) con metadatos, trazabilidad básica. 

dvf

Módulo 6. Operación real (Proyectos → Tareas → Actividades)

RF-20 (P1) Tareas por proyecto

Crear tareas por proyecto con estado, prioridad, fechas y responsable. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-21 (P1) Actividades por tarea

Crear actividades con estado, rango de tiempo, ubicación y meta. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-22 (P1) Asignaciones de voluntarios a actividad

Asignar voluntarios a actividades con rol en actividad y estado de asignación/activo. 

tercero

RF-23 (P1) Evidencias por actividad

Registrar evidencias (foto/video/pdf/link/otro), tipo, autor, fecha, ruta y hash opcional. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

Módulo 7. Horas y asistencias (con aprobaciones)

RF-24 (P1) Asistencias (entrada/salida) por voluntario

Registrar asistencias con fecha, entrada/salida, observación, y vínculo opcional a proyecto/actividad. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-25 (P1) Horas detalladas por actividad + flujo de aprobación

Registrar horas por actividad+voluntario+fecha (inicio/fin/minutos) con estado: Pendiente/Aprobado/Rechazado/Observado.

Registrar solicitante y aprobador con timestamps y observación/motivo. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-26 (P0/P1) Correcciones controladas con trazabilidad

Permitir correcciones controladas (con motivo y auditabilidad). 

dvf

Módulo 8. Aprobaciones (genérico anti-caos)

RF-27 (P1) Aprobaciones genéricas por entidad

Gestionar aprobaciones para entidades (horas, eventualmente gastos) con estado, solicitante, aprobador, timestamps y comentario.

Permitir búsqueda por tipo, estado y fechas (índices). 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

Módulo 9. Admisión acelerada (expediente + entrevista + onboarding)

RF-28 (P1) Solicitud de admisión (pre-registro)

Registrar solicitudes con datos mínimos (DNI, nombres, contacto, fuente, observación) y estado de admisión. 

dvf

 

tercero

RF-29 (P1) Documentos de admisión y verificación

Adjuntar documentos a la solicitud, marcarlos verificados/no verificados, registrar quién/cuándo. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-30 (P1) Entrevistas de admisión

Programar y registrar entrevista (fecha, evaluador, resultado, puntaje, comentario). 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-31 (P1) Onboarding por pasos

Ejecutar onboarding con pasos ordenados, completado, evidencia y cierre. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-32 (P2) Conversión de admisión aprobada a registro formal

Convertir solicitud aprobada a Voluntario + (opcional) UsuarioSistema + roles/habilidades iniciales. 

dvf

RF-33 (P2) KPIs internos de admisión

Medir tiempos por etapa, cuellos de botella y tasa de rechazo. 

dvf

Módulo 10. Inventario (kardex por transacciones)

RF-34 (P2) Ítems y ubicaciones

Gestionar ítems (unidad, activo, descripción) y ubicaciones (dirección y geodata opcional). 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-35 (P2) Transacciones de inventario

Registrar entradas/salidas/transferencias/ajustes con validaciones (cantidad>0, origen≠destino). 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-36 (P2) Reportes base inventario (kardex/stock derivado)

Consultar movimientos por fecha/ítem/ubicación. 

tercero

Módulo 11. Finanzas (transacciones + comprobantes + reportes)

RF-37 (P2) Cuentas y categorías (Ingreso/Egreso)

Mantener cuentas y categorías con tipo (Ingreso/Egreso) controlado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-38 (P2) Transacciones financieras

Registrar transacciones con monto>0, fecha, cuenta, categoría y tipo; vínculo opcional a proyecto; trazabilidad básica. 

scriptFINALSISTEMAVOLUNTARIOS

RF-39 (P2) Comprobantes financieros adjuntos

Adjuntar comprobantes (ruta, tipo archivo, fecha subida). 

scriptFINALSISTEMAVOLUNTARIOS

RF-40 (P2) Reportes financieros

Reportes por periodo/categoría/cuenta/proyecto (consulta y exportación a nivel app). 

dvf

 

tercero

RF-41 (P1/P2) Aprobación de egresos antes de reportes oficiales (recomendado)

Integrar con Aprobaciones para control anti-caos (política). 

dvf

Módulo 12. Cursos, certificación y documentos

RF-42 (P2) Cursos e inscripciones

Mantener cursos y registrar inscripciones con estado. 

dvf

 

scriptFINALSISTEMAVOLUNTARIOS

RF-43 (P2) Certificados por tipo

Emitir certificados asociados al voluntario y tipo; (documento menciona código verificable único). 

dvf

RF-44 (P2) Restricción Área ↔ Tipos de certificado

Configurar mapeo para restringir tipos por área. 

dvf

 

scriptFINALSISTEMAVOLUNTARIOS

Módulo 13. Notificaciones y automatización

RF-45 (P2) Plantillas de notificación

Gestionar plantillas por evento, canal preferido y estado activa/inactiva. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-46 (P2) Historial de notificaciones

Registrar notificaciones enviadas con canal, estado, fecha y detalle. 

scriptFINALSISTEMAVOLUNTARIOS

RF-47 (P2) Disparadores automáticos (recomendado)

Notificar asignación a actividad, recordatorios, aprobación/rechazo de horas, emisión de certificado, pendientes de admisión/onboarding. 

dvf

 

tercero

Módulos “propuestos” world-class (ya contemplados en script extra)

RF-48 (P3) Fundraising/CRM donantes

Donantes, campañas, pledges, donaciones, interacciones y conciliación opcional con finanzas. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-49 (P3) Impacto (KPIs + ODS)

Catálogo ODS, vínculo proyecto↔ODS, KPIs, metas, mediciones ligadas a proyecto/actividad con evidencia, reportes de impacto. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-50 (P3) Gamificación

Reglas de puntos por evento, ledger auditable, badges, kudos, ranking/perfil gamificado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-51 (P3) Offline / Sync

Registro de dispositivos, cola de cambios offline, procesamiento, manejo de conflictos (versionado), reintentos y auditoría de sync. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

RF-52 (P3) Preferencias + matching + requisitos de actividad (Geo opcional)

Preferencias del voluntario (áreas/habilidades/disponibilidad/distancia), requisitos mínimos por actividad, soporte geo básico. 

scriptFINALSISTEMAVOLUNTARIOS

2) Casos de Uso Detallados (CU)

Incluyo todos los flujos principales explicitados en los documentos. (Cuando el actor dice “Sistema”, es evento automático o trigger.)

CU-01 Iniciar sesión

Actor: Usuario del sistema

Precondiciones: Existe usuarios_sistema activo vinculado a un voluntarios; rol asignado en roles_sistema.

Flujo principal:

Usuario ingresa credenciales.

Sistema valida contraseña hasheada.

Sistema valida que activo=true y no eliminado lógicamente.

Sistema registra ultimo_acceso.

Sistema carga permisos por rol (RBAC).

Alternativos:

A1: Credenciales inválidas → rechaza acceso (política anti fuerza bruta a nivel app).

A2: Usuario inactivo/eliminado → rechaza acceso.

Postcondiciones: Sesión iniciada y permisos vigentes; último acceso actualizado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-02 Mantener catálogo

Actor: Admin

Precondiciones: Rol Admin; catálogo existe.

Flujo principal: crear/editar opción → validar unicidad → guardar → disponible para formularios.

Alternativos: valor duplicado → rechaza.

Postcondiciones: Catálogo actualizado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-03 Registrar voluntario

Actor: Admin/Coordinador

Precondiciones: DNI no existe; catálogo estados_voluntario listo.

Flujo principal: crea ficha → valida DNI único → asigna estado inicial → guarda.

Alternativos: DNI duplicado → rechaza.

Postcondiciones: Voluntario creado; audit trigger registra cambio. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-04 Actualizar perfil/estado de voluntario

Actor: Admin/Coordinador

Precondiciones: Voluntario existe.

Flujo principal: edita campos → cambia estado → guarda → queda auditado.

Alternativos: intenta cambiar campo sensible sin permisos → deniega y registra acceso sensible si correspondía.

Postcondiciones: Voluntario actualizado con trazabilidad. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-05 Asignar rol/habilidad

Actor: Admin/Coordinador

Precondiciones: Voluntario existe; rol/habilidad existe.

Flujo principal: seleccionar voluntario → asignar rol (asignaciones_rol) y/o habilidad (voluntario_habilidades) → guardar.

Alternativos: asignación duplicada (habilidad) → se mantiene PK compuesta y se rechaza duplicado.

Postcondiciones: Asignación vigente. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-06 Registrar beneficiario

Actor: Coordinador

Precondiciones: Beneficiario no existe (según política de DNI opcional).

Flujo principal: crea ficha → guarda → (opcional) vincula a proyecto.

Alternativos: datos incompletos según validación → rechaza.

Postcondiciones: Beneficiario creado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-07 Registrar ficha médica (sensible)

Actor: Salud

Precondiciones: Rol Salud (o autorizado); beneficiario existe.

Flujo principal: crea/actualiza ficha → sistema verifica rol → registra acceso sensible → guarda ficha.

Alternativos: rol no permitido → deniega y registra intento (según política).

Postcondiciones: Ficha médica actualizada; log sensible persistido. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-08 Vincular beneficiario a proyecto (participación)

Actor: Coordinador

Precondiciones: Beneficiario y proyecto existen.

Flujo principal: crea participaciones_proyecto con fechas/observación → guarda.

Alternativos: ya existe participación duplicada (según política) → rechaza o actualiza.

Postcondiciones: Participación registrada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-09 Crear proyecto

Actor: Coordinador

Precondiciones: Área y estado de proyecto existen.

Flujo principal: define datos → asigna área/estado → guarda → audit.

Alternativos: presupuesto inválido (<0) → rechaza.

Postcondiciones: Proyecto creado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-10 Asignar voluntario a proyecto

Actor: Coordinador

Precondiciones: Proyecto y voluntario existen.

Flujo principal: crea asignaciones_proyecto con rol_en_proyecto y activo=true → guarda.

Alternativos: duplicado según política → rechaza o reactiva.

Postcondiciones: Voluntario asignado al proyecto. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-11 Adjuntar recurso a proyecto

Actor: Coordinador

Precondiciones: Proyecto existe.

Flujo principal: sube archivo/link → registra ruta + metadatos en recursos_proyecto.

Alternativos: ruta inválida → rechaza.

Postcondiciones: Recurso disponible. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-12 Crear tarea

Actor: Coordinador

Precondiciones: Proyecto existe; estado_tarea existe.

Flujo principal: selecciona proyecto → define tarea (prioridad/fechas/responsable) → guarda.

Alternativos: prioridad fuera de rango → rechaza.

Postcondiciones: Tarea creada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-13 Crear actividad

Actor: Coordinador/Supervisor

Precondiciones: Tarea existe; estado_actividad existe.

Flujo principal: define actividad + ubicación/fechas/meta → guarda.

Alternativos: fecha_fin < fecha_inicio → rechaza por constraint.

Postcondiciones: Actividad creada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-14 Asignar voluntarios a actividad

Actor: Coordinador/Supervisor

Precondiciones: Actividad y voluntarios existen.

Flujo principal: crea asignaciones_actividad por voluntario con rol_en_actividad → guarda.

Alternativos: ya asignado (uq id_actividad+id_voluntario) → rechaza.

Postcondiciones: Equipo operativo de actividad listo. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-15 Subir evidencia

Actor: Voluntario

Precondiciones: Voluntario asignado (según política); actividad existe.

Flujo principal: selecciona actividad → sube archivo/link → etiqueta tipo → guarda evidencia.

Alternativos: evidencia sin tipo → permitir null o exigir catálogo (según UI).

Postcondiciones: Evidencia persistida; (opcional) trigger de puntos. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-16 Registrar asistencia

Actor: Voluntario/Supervisor

Precondiciones: Voluntario existe; (opcional) actividad/proyecto.

Flujo principal: marca entrada (y salida si aplica) → guarda asistencias.

Alternativos: solo entrada sin salida → permitido.

Postcondiciones: Asistencia registrada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-17 Registrar horas (pendiente)

Actor: Voluntario

Precondiciones: Actividad existe; estado_aprobacion existe.

Flujo principal: selecciona actividad → ingresa fecha + rango o minutos → estado Pendiente → guarda.

Alternativos: hora_fin < hora_inicio → rechaza por constraint.

Postcondiciones: Horas en cola de revisión. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-18 Aprobar/Rechazar horas

Actor: Coordinador/Supervisor

Precondiciones: Existe registro de horas en Pendiente; rol con permiso aprobar.

Flujo principal: revisa → valida consistencia/evidencias → aprueba o rechaza/observa → registra aprobado_por y aprobado_en.

Alternativos: evidencia insuficiente → Observado/Rechazado con motivo.

Postcondiciones: Horas quedan en estado final; (opcional) trigger de puntos al aprobar. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-19 Solicitar aprobación (genérica)

Actor: Voluntario/Finanzas

Precondiciones: Entidad objetivo existe (horas/gasto/etc.).

Flujo principal: crea aprobaciones con entidad_tipo+entidad_id → estado Pendiente.

Alternativos: duplicado para la misma entidad (según política) → rechaza o versiona.

Postcondiciones: Solicitud lista para resolución. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-20 Resolver aprobación (genérica)

Actor: Coordinador/Supervisor/Admin

Precondiciones: Solicitud pendiente.

Flujo principal: revisar → aprobar/rechazar/observar → registrar comentario y timestamps.

Alternativos: sin permisos → deniega.

Postcondiciones: Aprobación resuelta; entidad puede cambiar de estado (por regla de negocio). 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-21 Registrar solicitud de admisión

Actor: Admin/Coordinador

Precondiciones: Estados de admisión configurados.

Flujo principal: captura datos básicos → estado “Recibida” → guarda solicitud.

Alternativos: DNI inválido → rechaza.

Postcondiciones: Expediente creado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-22 Subir documentos de admisión y verificar

Actor: Admin/Coordinador

Precondiciones: Solicitud existe; tipos_documento listos.

Flujo principal: adjunta documento → marca verificado + quién/cuándo.

Alternativos: archivo faltante → rechaza.

Postcondiciones: Documentos trazables en expediente. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-23 Realizar entrevista de admisión

Actor: Evaluador/Coordinador

Precondiciones: Solicitud existe.

Flujo principal: agenda → registra resultado/puntaje → actualiza estado de admisión (a nivel app).

Alternativos: reprogramación → actualizar fecha.

Postcondiciones: Entrevista registrada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-24 Onboarding por pasos

Actor: Voluntario nuevo / Coordinador

Precondiciones: Solicitud en estado onboarding; onboarding iniciado.

Flujo principal: iniciar onboarding → completar pasos → adjuntar evidencia si aplica → cerrar onboarding.

Alternativos: paso omitido → queda incompleto.

Postcondiciones: Onboarding finalizado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-25 Registrar movimiento de inventario

Actor: Inventario

Precondiciones: Item y tipo_transaccion existen.

Flujo principal: tipo → item → cantidad → origen/destino (si aplica) → guarda transacción.

Alternativos: transferencia origen=destino → rechaza por constraint.

Postcondiciones: Movimiento registrado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-26 Consultar kardex

Actor: Inventario/Coordinador

Precondiciones: Existen transacciones.

Flujo principal: filtra por ítem/fecha/ubicación → lista movimientos.

Alternativos: sin resultados → muestra vacío.

Postcondiciones: Reporte consultado. 

tercero

CU-27 Registrar transacción financiera

Actor: Finanzas

Precondiciones: Cuenta, categoría y tipo_transaccion existen.

Flujo principal: cuenta+categoría+tipo+monto → guarda → adjunta comprobante (opcional inmediato).

Alternativos: monto <=0 → rechaza por constraint.

Postcondiciones: Transacción registrada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-28 Emitir reporte financiero

Actor: Finanzas/Admin

Precondiciones: Existen transacciones.

Flujo principal: filtra fechas → agrupa → exporta (app).

Alternativos: periodos sin data.

Postcondiciones: Reporte generado. 

tercero

CU-29 Inscribir voluntario a curso

Actor: Coordinador/Admin

Precondiciones: Curso y voluntario existen.

Flujo principal: crea inscripciones_curso con estado.

Alternativos: inscripción duplicada (según política).

Postcondiciones: Voluntario inscrito. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-30 Emitir certificado

Actor: Admin/Coordinador

Precondiciones: Cumple requisitos (a nivel app).

Flujo principal: registra certificado y adjunta archivo.

Alternativos: requisitos no cumplidos → rechaza.

Postcondiciones: Certificado emitido. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-31 Notificar asignación / decisión de horas

Actor: Sistema

Precondiciones: Plantilla existe; canal definido.

Flujo principal: evento ocurre → registra en historial con estado.

Alternativos: falla envío → estado fallida/reintento (si se implementa).

Postcondiciones: Notificación auditada en historial. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-32 Revisar bitácora de cambios

Actor: Auditor/Admin

Precondiciones: Rol Auditor/Admin.

Flujo principal: filtra por tabla/fecha/usuario/registro → visualiza before/after.

Alternativos: exportación sin permiso → deniega.

Postcondiciones: Auditoría consultada. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

CU-33 Registrar acceso a dato sensible

Actor: Salud/Auditor/Admin

Precondiciones: Recurso sensible existe.

Flujo principal: solicita ver ficha → RBAC permite → se registra evento en log sensible.

Alternativos: RBAC deniega → bloqueo + registro (según política).

Postcondiciones: Acceso sensible trazado. 

tercero

 

scriptFINALSISTEMAVOLUNTARIOS

(World-class) CU adicionales

CU-34 Gestionar donante / campaña / donación / pledge / interacción (Finanzas/Admin/Coordinador)

Flujos según RF-48, persistiendo en donors, fundraising_campaigns, donations, donor_pledges, donor_interactions. 

scriptFINALSISTEMAVOLUNTARIOS

CU-35 Impacto: vincular ODS, crear KPI, definir meta, registrar medición, consultar impacto (Coordinador/Admin/Auditor)

Persistiendo en ods_goals, project_ods, kpi_indicators, kpi_targets, kpi_measurements. 

scriptFINALSISTEMAVOLUNTARIOS

CU-36 Gamificación: configurar regla, otorgar puntos (evento), otorgar badge, enviar kudos, ver ranking

Persistiendo en gamification_rules, volunteer_points_ledger, badges, volunteer_badges, kudos. 

scriptFINALSISTEMAVOLUNTARIOS

CU-37 Offline: registrar dispositivo, enviar cambios offline, procesar sync, resolver conflicto

Persistiendo en user_devices, sync_queue, entity_versions. 

scriptFINALSISTEMAVOLUNTARIOS

3) Matriz de Trazabilidad con la BD (RF/CU ↔ Tablas y Campos)

“Tabla.campo” = campos clave (no es lista exhaustiva de todos los campos, pero sí los que cumplen el requerimiento). El script es la fuente de verdad. 

scriptFINALSISTEMAVOLUNTARIOS

ID	Requerimiento / CU	Tablas	Campos clave
RF-01 / CU-01	Login + sesión + último acceso	usuarios_sistema, roles_sistema, voluntarios	usuarios_sistema.hash_contrasena, usuarios_sistema.activo, usuarios_sistema.ultimo_acceso, usuarios_sistema.id_rol_sistema, usuarios_sistema.id_voluntario
RF-02	Gestión usuarios	usuarios_sistema	activo, is_deleted, deleted_at, deleted_by, created_at/updated_at
RF-03	RBAC + sensible	roles_sistema, (control app), fichas_medicas, ficha_sensible_voluntario	roles_sistema.nombre_rol, recursos sensibles (tablas)
RF-04 / CU-33	Log acceso sensible	accesos_sensibles_log	recurso, registro_id, motivo, user_id, event_at, ip, user_agent
RF-05 / CU-32	AuditLog cambios	audit_log (+ triggers)	table_name, record_pk, action, before_json, after_json, user_id, event_at
RF-06	Soft delete	Muchas (core + transaccionales)	is_deleted, deleted_at, deleted_by (p.ej. voluntarios, proyectos, tareas, actividades, transacciones_*, etc.)
RF-07 / CU-02	Catálogos anti-caos	estados_*, tipos_*, canales_notificacion, tipo_transaccion_*	nombre_estado, nombre_tipo, nombre_canal
RF-08 / CU-03/04	Voluntarios	voluntarios, estados_voluntario	dni, uuid_credencial, id_estado, ruta_foto, auditoría/softdelete
RF-09 / CU-05	Roles institucionales	roles, asignaciones_rol	roles.id_rol, asignaciones_rol.id_voluntario, asignaciones_rol.id_rol, activo
RF-10	Habilidades	habilidades, voluntario_habilidades	voluntario_habilidades.nivel, PK compuesta
RF-11	Supervisiones	supervisiones	id_supervisor, id_voluntario, fecha_inicio/fin, ck_supervision_noauto
RF-12	Documentos voluntario	documentos_voluntario, tipos_documento	ruta_archivo, verificado, verificado_por, verificado_en, id_tipo_documento
RF-13 / CU-06	Beneficiarios	beneficiarios	nombre, apellido, dni(opcional), auditoría/softdelete
RF-14	Perfiles	perfil_nino, perfil_adulto_mayor, perfil_coordinador	id_beneficiario/id_voluntario + campos específicos
RF-15 / CU-07	Fichas médicas	fichas_medicas, accesos_sensibles_log	diagnostico, alergias, medicacion, observaciones
RF-16	Logros	logros_beneficiario	descripcion, fecha_logro
RF-17 / CU-09	Proyectos	proyectos, areas, estados_proyecto	id_area, id_estado_proyecto, presupuesto, fecha_inicio/fin
RF-18 / CU-10	Asignación a proyecto	asignaciones_proyecto	id_proyecto, id_voluntario, rol_en_proyecto, activo
RF-19 / CU-11	Recursos proyecto	recursos_proyecto	tipo_recurso, ruta_archivo, descripcion
RF-20 / CU-12	Tareas	tareas, estados_tarea	id_proyecto, id_estado_tarea, prioridad, responsable_id_voluntario
RF-21 / CU-13	Actividades	actividades, estados_actividad, ubicaciones	id_tarea, id_estado_actividad, fecha_inicio/fin, id_ubicacion, meta
RF-22 / CU-14	Asignaciones actividad	asignaciones_actividad	id_actividad, id_voluntario, rol_en_actividad, activo, uq_asigact
RF-23 / CU-15	Evidencias actividad	evidencias_actividad, tipos_evidencia	id_actividad, id_voluntario, id_tipo_evidencia, ruta_archivo, hash_archivo
RF-24 / CU-16	Asistencias	asistencias	id_voluntario, id_proyecto, id_actividad, hora_entrada/salida, fecha
RF-25 / CU-17/18	Horas + aprobación	horas_actividad, estados_aprobacion	id_actividad, id_voluntario, fecha, hora_inicio/fin, minutos, id_estado_aprobacion, aprobado_por/en
RF-27 / CU-19/20	Aprobaciones genéricas	aprobaciones, estados_aprobacion	entidad_tipo, entidad_id, id_estado_aprobacion, comentario, índice ix_aprobaciones_busqueda
RF-28 / CU-21	Solicitud admisión	solicitudes_admision_voluntario, estados_admision	dni, nombres, apellidos, id_estado_admision, fecha_solicitud
RF-29 / CU-22	Docs admisión	documentos_admision, tipos_documento	ruta_archivo, verificado, verificado_por/en
RF-30 / CU-23	Entrevistas admisión	entrevistas_admision	fecha_entrevista, evaluador_id_voluntario, resultado, puntaje
RF-31 / CU-24	Onboarding	onboarding_voluntario, onboarding_paso	fecha_inicio/fin, estado, orden, completado, evidencia_ruta
RF-34/35/36 / CU-25/26	Inventario	items, ubicaciones, transacciones_inventario, tipo_transaccion_inventario	cantidad, id_ubicacion_origen/destino, id_tipo_transaccion, constraint ck_ti_ubicaciondiff
RF-37/38/39/40 / CU-27/28	Finanzas	cuentas_financieras, categorias_financieras, transacciones_financieras, comprobantes_financieros, tipo_transaccion_financiera	monto, fecha_transaccion, id_cuenta, id_categoria, id_tipo_transaccion, ruta_archivo
RF-42/43/44 / CU-29/30	Cursos y certificados	cursos, inscripciones_curso, tipos_certificado, certificados, area_tipos_certificado	id_curso, estado, id_tipo_certificado, ruta_archivo
RF-45/46/47 / CU-31	Notificaciones	plantillas_notificacion, historial_notificaciones, canales_notificacion	canal_preferido, cuerpo_html/texto, estado, detalle, id_canal
RF-48 / CU-34	Fundraising	donors, fundraising_campaigns, donations, donor_pledges, donor_interactions	campos de cada entidad + donations.id_transaccion_financiera
RF-49 / CU-35	Impacto	ods_goals, project_ods, kpi_indicators, kpi_targets, kpi_measurements	ods_number, target_value, value, evidence_url, id_actividad
RF-50 / CU-36	Gamificación	gamification_rules, volunteer_points_ledger, badges, volunteer_badges, kudos	triggers (horas aprobadas/evidencia) + ledger
RF-51 / CU-37	Offline/sync	user_devices, sync_queue, entity_versions	payload jsonb, status, error_detail, version
RF-52	Matching/prefs	volunteer_preferences, activity_requirements	preferred_areas/skills, availability, max_distance_km, required_skills, min_volunteers
