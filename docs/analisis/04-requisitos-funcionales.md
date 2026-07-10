# Documento 04 — Requisitos Funcionales
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Módulo de Onboarding / Registro](#módulo-de-onboarding--registro)
2. [Módulo de Autenticación y Seguridad](#módulo-de-autenticación-y-seguridad)
3. [Módulo de IAM — Roles y Permisos](#módulo-de-iam--roles-y-permisos)
4. [Módulo de Sedes](#módulo-de-sedes)
5. [Módulo de Personas](#módulo-de-personas)
6. [Módulo de Admisión](#módulo-de-admisión)
7. [Módulo de Proyectos](#módulo-de-proyectos)
8. [Módulo de Operación](#módulo-de-operación)
9. [Módulo de Recursos — Inventario](#módulo-de-recursos--inventario)
10. [Módulo de Recursos — Finanzas](#módulo-de-recursos--finanzas)
11. [Módulo de Notificaciones](#módulo-de-notificaciones)
12. [Módulo de Gobernanza](#módulo-de-gobernanza)
13. [Módulo de Auditoría API](#módulo-de-auditoría-api)
14. [Módulo ACE](#módulo-ace)

---

## Módulo de Onboarding / Registro

### RF-001 — Validar RUC de la Organización

| Campo | Valor |
|-------|-------|
| **ID** | RF-001 |
| **Nombre** | Validar RUC de organización |
| **Descripción** | El sistema debe validar un RUC de 11 dígitos contra SUNAT. La empresa debe estar ACTIVA y HABIDA. |
| **Objetivo** | Solo organizaciones legalmente activas pueden registrarse |
| **Actor** | ACT-02, ACT-11 |
| **Entradas** | RUC (11 dígitos) |
| **Salidas** | tenant_name, tax_id validado |
| **Precondiciones** | RUC de 11 dígitos. API SUNAT configurada. |
| **Postcondiciones** | Nombre de organización disponible para siguiente paso. |
| **Flujo principal** | 1. Ingresa RUC. 2. Valida formato. 3. Consulta SUNAT. 4. Verifica ACTIVO y HABIDO. 5. Devuelve nombre. |
| **Flujos alternativos** | FA-001a: Formato inválido → 400. FA-001b: No encontrado → 404. FA-001c: Inactiva → 403. FA-001d: No habida → 403. FA-001e: Error SUNAT → 502. |
| **Reglas de negocio** | RN-002 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-001 |
| **Evidencia** | `server/routes/onboarding.js` líneas 99–202 |

---

### RF-002 — Bootstrap de Tenant

| Campo | Valor |
|-------|-------|
| **ID** | RF-002 |
| **Nombre** | Registrar organización (bootstrap-tenant) |
| **Descripción** | El sistema crea atómicamente e idempotentemente: tenant, perfil de administrador, sede Principal, rol Owner y asignación Owner al administrador. Si el usuario ya tiene tenant, devuelve el existente. |
| **Objetivo** | Inicializar la organización con toda la configuración base |
| **Actor** | ACT-02 |
| **Entradas** | tenant_name, tax_id, industry_type_id, plan_id (opcional), billing_day (opcional) |
| **Salidas** | tenant_id |
| **Precondiciones** | JWT válido. RUC validado (RF-001). |
| **Postcondiciones** | Tenant creado. Usuario con rol Owner en sede Principal. |
| **Flujo principal** | 1. Envía datos. 2. Valida campos. 3. Ejecuta fn_bootstrap_tenant(). 4. Devuelve tenant_id. |
| **Flujos alternativos** | FA-002a: tenant_name vacío → 400. FA-002b: tax_id inválido → 400. FA-002c: Usuario ya tiene tenant → idempotente. |
| **Reglas de negocio** | RN-001, RN-003 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-001 |
| **Evidencia** | `server/routes/onboarding.js` líneas 212–273 |

---

## Módulo de Autenticación y Seguridad

### RF-003 — Evaluación de Riesgo en Login Web

| Campo | Valor |
|-------|-------|
| **ID** | RF-003 |
| **Nombre** | Evaluar riesgo de acceso web |
| **Descripción** | Evalúa IP, dispositivo, sesiones activas, velocidad de intentos y criticidad de la acción. Devuelve ALLOW, REQUIRE_OTP o BLOCK. Crea sesión si ALLOW, desafío MFA si REQUIRE_OTP. |
| **Objetivo** | Proteger el sistema con análisis de riesgo contextual |
| **Actor** | ACT-02, ACT-03, ACT-04, ACT-09 |
| **Entradas** | Bearer JWT, tipo_evento, user_agent, device_fingerprint, tenant_id, action_name, action_criticality |
| **Salidas** | risk_level, decision, reason_codes, challenge_id, session_id |
| **Precondiciones** | JWT válido. |
| **Postcondiciones** | Evento auth y auditoría creados. Sesión o desafío creados según decisión. |
| **Reglas de negocio** | RN-006, RN-007, RN-015 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-002 |
| **Evidencia** | `server/routes/auth.js` líneas 57–187, `server/security/risk-engine.js` |

---

### RF-004 — Verificación de OTP (Step-Up MFA)

| Campo | Valor |
|-------|-------|
| **ID** | RF-004 |
| **Nombre** | Verificar código OTP |
| **Descripción** | Verifica el OTP ingresado contra el desafío activo. Si correcto, marca el desafío y crea sesión. El código tiene TTL configurable. |
| **Actor** | ACT-02, ACT-03, ACT-04 |
| **Entradas** | Bearer JWT, challenge_id, code (6 dígitos), tenant_id |
| **Salidas** | verified: true, next_url, session_id |
| **Reglas de negocio** | RN-015, RN-007 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-002 |
| **Evidencia** | `server/routes/auth.js` líneas 189–320 |

---

### RF-005 — Reenvío de OTP

| Campo | Valor |
|-------|-------|
| **ID** | RF-005 |
| **Nombre** | Reenviar código OTP |
| **Descripción** | Permite solicitar un nuevo OTP cuando el anterior no llegó o expiró. Genera nuevo código, actualiza el desafío existente y reenvía por email. |
| **Actor** | ACT-02, ACT-03, ACT-04 |
| **Entradas** | Bearer JWT, challenge_id, tenant_id |
| **Salidas** | resent: true, challenge_id, challenge_expires_at, delivery_hint |
| **Reglas de negocio** | RN-007, RN-015 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-002 |
| **Evidencia** | `server/routes/auth.js` líneas 322–402 |

---

### RF-006 — Login por Terminal con PIN

| Campo | Valor |
|-------|-------|
| **ID** | RF-006 |
| **Nombre** | Autenticación por terminal y PIN |
| **Descripción** | Autentica al operador en terminal física verificando terminal activa, usuario del tenant, usuario no bloqueado y PIN correcto. Ejecuta evaluación de riesgo y crea sesión de tipo terminal. Bloqueo temporal tras MAX_PIN_ATTEMPTS. |
| **Actor** | ACT-07, ACT-09 |
| **Entradas** | tenant_id, user_id, pin, terminal_id, device_fingerprint |
| **Salidas** | login: ok, session_id, risk_level, decision |
| **Reglas de negocio** | RN-005, RN-006 |
| **Prioridad** | Media |
| **RU relacionados** | RU-003 |
| **Evidencia** | `server/routes/auth.js` líneas 404–645 |

---

## Módulo de IAM — Roles y Permisos

### RF-007 — Gestión de Roles del Tenant

| Campo | Valor |
|-------|-------|
| **ID** | RF-007 |
| **Nombre** | CRUD de roles del tenant |
| **Descripción** | Permite crear, editar y eliminar roles personalizados. Los roles de sistema (is_system_role=true) no pueden modificarse ni eliminarse. |
| **Actor** | ACT-02, ACT-03 (permiso settings.roles.manage) |
| **Entradas** | name, hierarchy_level |
| **Salidas** | Rol creado/actualizado/eliminado |
| **Reglas de negocio** | RN-004, RN-009 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-031 |
| **Evidencia** | `server/routes/iam.js` líneas 60–183 |

---

### RF-008 — Permisos de Rol

| Campo | Valor |
|-------|-------|
| **ID** | RF-008 |
| **Nombre** | Asignar y revocar permisos a roles |
| **Descripción** | Lista, asigna y revoca permisos específicos (strings) a roles del tenant. |
| **Actor** | ACT-02, ACT-03 (permiso settings.roles.manage) |
| **Entradas** | roleId, permission |
| **Salidas** | Lista de permisos, permiso asignado/revocado |
| **Reglas de negocio** | RN-004 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-031 |
| **Evidencia** | `server/routes/iam.js` líneas 185–275 |

---

### RF-009 — Asignación Usuario-Rol-Sede

| Campo | Valor |
|-------|-------|
| **ID** | RF-009 |
| **Nombre** | Asignar usuario a rol en sede |
| **Descripción** | Lista, crea y elimina asignaciones que vinculan usuario con rol en sede específica. |
| **Actor** | ACT-02, ACT-03 (permisos manage) |
| **Entradas** | user_id, role_id, sede_id |
| **Salidas** | Lista de asignaciones, asignación creada/eliminada |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-032 |
| **Evidencia** | `server/routes/iam.js` líneas 277–368 |

---

## Módulo de Sedes

### RF-010 — Gestión de Sedes

| Campo | Valor |
|-------|-------|
| **ID** | RF-010 |
| **Nombre** | CRUD de sedes |
| **Descripción** | Lista, crea, edita y desactiva sedes. Eliminación es lógica (soft delete: is_active=false). Los históricos de roles vinculados se preservan. |
| **Actor** | ACT-02 (TenantAdmin) |
| **Entradas** | name; para editar: sedeId, name (opcional), is_active (opcional) |
| **Salidas** | Lista de sedes, sede creada/actualizada/desactivada |
| **Reglas de negocio** | RN-008 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-033 |
| **Evidencia** | `server/routes/sedes.js` |

---

## Módulo de Personas

### RF-011 — CRUD de Voluntarios

| Campo | Valor |
|-------|-------|
| **ID** | RF-011 |
| **Nombre** | Registrar y gestionar voluntarios |
| **Descripción** | CRUD completo de voluntarios incluyendo datos personales (nombre, documento, género, país, fecha de nacimiento, foto), contacto, estado, habilidades, roles operativos e institucionales y documentos. |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | VolunteerUpsertInput (documentNumber, documentType, firstName, lastName, stateCode, skills[], documents[]) |
| **Salidas** | VolunteerListRow, VolunteerDetailData |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-005, RU-006 |
| **Evidencia** | `src/modules/ong/app/modules/people/types.ts` |

---

### RF-012 — CRUD de Beneficiarios

| Campo | Valor |
|-------|-------|
| **ID** | RF-012 |
| **Nombre** | Registrar y gestionar beneficiarios |
| **Descripción** | CRUD de beneficiarios con perfiles diferenciados: general, infantil (datos de tutor y escuela) o adulto mayor (contacto de emergencia y movilidad). |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | BeneficiaryUpsertInput (documentNumber, firstName, lastName, profileKind) |
| **Salidas** | BeneficiaryListRow, BeneficiaryDetailData |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-007 |
| **Evidencia** | `src/modules/ong/app/modules/people/types.ts` |

---

### RF-013 — Acceso Auditado a Datos Médicos Sensibles

| Campo | Valor |
|-------|-------|
| **ID** | RF-013 |
| **Nombre** | Acceso controlado a datos médicos |
| **Descripción** | Solo usuarios con permiso específico pueden acceder y actualizar datos médicos. Cada acceso registra automáticamente actor, motivo (obligatorio), IP, user agent y timestamp en log especializado. |
| **Actor** | ACT-03 (autorizado), ACT-02 |
| **Entradas** | personId, accessReason (obligatorio), datos médicos |
| **Salidas** | Datos médicos, confirmación de log |
| **Reglas de negocio** | RN-010 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-008 |
| **Evidencia** | `people/types.ts`: accessReason, SensitiveAccessLogRow |

---

### RF-014 — Gestión de Carnets Digitales

| Campo | Valor |
|-------|-------|
| **ID** | RF-014 |
| **Nombre** | Emitir y gestionar carnets digitales |
| **Descripción** | Permite crear plantillas de carnet configurables (campos: foto, nombre, DNI, código, QR, posición, fuente, color) y emitir carnets individuales con código único y estado (activo, revocado, expirado). |
| **Actor** | ACT-02, ACT-03 (con permiso) |
| **Entradas** | Para plantilla: name, baseImageUrl, fields[]. Para carnet: volunteerId, templateId, cardCode, expiresAt. |
| **Salidas** | IdCardTemplateSummaryRow, IdCardListRow |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Media |
| **RU relacionados** | RU-009 |
| **Evidencia** | `people/types.ts` (IdCardTemplate*, IdCardUpsertInput) |

---

## Módulo de Admisión

### RF-015 — Gestión del Proceso de Admisión

| Campo | Valor |
|-------|-------|
| **ID** | RF-015 |
| **Nombre** | Gestionar solicitudes de admisión |
| **Descripción** | Crea, lista, consulta y cambia el estado de solicitudes. Flujo: nueva → en_entrevista → aprobada/rechazada. Registra historial de cambios y KPIs (total, pendientes, en entrevista, aprobadas, rechazadas, convertidas). |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | Para crear: nombres, apellidos, email, notes. Para cambio estado: requestId, stateCode, comment. |
| **Salidas** | AdmissionRequestRow, AdmissionKpis |
| **Reglas de negocio** | RN-013 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-010, RU-011, RU-012, RU-013 |
| **Evidencia** | `admission/types.ts` |

---

### RF-016 — Autoregistro de Candidatos por Código

| Campo | Valor |
|-------|-------|
| **ID** | RF-016 |
| **Nombre** | Registro público mediante código de acceso |
| **Descripción** | Coordinador genera código con expiración y max_uses. Candidatos lo usan para crear su cuenta y vincularse a solicitud de admisión. El sistema valida cupo, expiración y maneja emails ya registrados. |
| **Actor** | ACT-05, ACT-03 |
| **Entradas** | Para generación: requestId, email, expiresInMinutes. Para uso: code, email, password, firstName, lastName, documentNumber. |
| **Salidas** | AdmissionRegistrationCodeRow, AdmissionPublicVolunteerRegistrationResult |
| **Reglas de negocio** | RN-011, RN-012 |
| **Prioridad** | Media |
| **RU relacionados** | RU-014 |
| **Evidencia** | `admission/types.ts` (AdmissionRegistrationCodeRow) |

---

## Módulo de Proyectos

### RF-017 — CRUD de Proyectos

| Campo | Valor |
|-------|-------|
| **ID** | RF-017 |
| **Nombre** | Gestionar proyectos |
| **Descripción** | Lista, crea, edita y consulta proyectos con: código único, nombre, área temática, estado (planning/active/completed/cancelled), fechas y presupuesto. Vista de detalle incluye tareas, actividades, voluntarios y recursos. |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | ProjectFormValues (code, name, areaId, stateCode, startDate, endDate, budget) |
| **Salidas** | ProjectRow, ProjectDetailData |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-015 |
| **Evidencia** | `projects/types.ts` (ProjectRow, ProjectFormValues) |

---

### RF-018 — CRUD de Tareas

| Campo | Valor |
|-------|-------|
| **ID** | RF-018 |
| **Nombre** | Gestionar tareas por proyecto |
| **Descripción** | Lista, crea y edita tareas vinculadas a proyectos con título, descripción, estado (pendiente/en_progreso/completada/cancelada) y fecha límite. |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | TaskFormValues (projectId, title, statusCode, deadline) |
| **Salidas** | TaskRow, TaskDetailData |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-016 |
| **Evidencia** | `projects/types.ts` (TaskRow) |

---

### RF-019 — CRUD de Actividades y Asignaciones

| Campo | Valor |
|-------|-------|
| **ID** | RF-019 |
| **Nombre** | Gestionar actividades y asignaciones |
| **Descripción** | Lista, crea y edita actividades vinculadas a tareas con horario, ubicación y horas estimadas. Permite asignar voluntarios a proyectos (con rol y fecha) y actividades, y asignar recursos materiales a proyectos. |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | ActivityFormValues, ProjectVolunteerAssignmentFormValues, ActivityVolunteerAssignmentFormValues, ProjectResourceAssignmentFormValues |
| **Salidas** | ActivityRow, AssignmentRow, ActivityDetailData |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-017, RU-018 |
| **Evidencia** | `projects/types.ts` (ActivityFormValues, AssignmentRow) |

---

## Módulo de Operación

### RF-020 — Registro de Asistencia, Horas y Evidencias

| Campo | Valor |
|-------|-------|
| **ID** | RF-020 |
| **Nombre** | Registrar asistencia, horas y evidencias |
| **Descripción** | Registra la asistencia de voluntarios a actividades, las horas trabajadas (con posible estado de aprobación) y las evidencias (archivos) de la ejecución. Vista de operación permite filtrar por período, proyecto, tarea, ubicación y voluntario. |
| **Actor** | ACT-03, ACT-04 |
| **Entradas** | Para horas: activityId, volunteerId, date, startTime, endTime, minutes. Para evidencia: activityId, volunteerId, typeName, route. |
| **Salidas** | OperationActivityRow, ActivityRelatedHourRow, ActivityRelatedEvidenceRow |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-019, RU-020 |
| **Evidencia** | `operation/types.ts` |

---

## Módulo de Recursos — Inventario

### RF-021 — Gestión de Inventario (Artículos, Ubicaciones y Movimientos)

| Campo | Valor |
|-------|-------|
| **ID** | RF-021 |
| **Nombre** | Gestionar inventario completo |
| **Descripción** | CRUD de artículos (código, nombre, unidad, estado, SKU) y ubicaciones (código, nombre, dirección, coordenadas). Registro de movimientos (entrada, salida, transferencia, ajuste) con stock derivado calculado. Kardex cronológico con saldo acumulado por artículo y ubicación. |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | InventoryItemCreateInput, InventoryLocationCreateInput, InventoryMovementCreateInput |
| **Salidas** | InventoryItemRow, InventoryLocationRow, InventoryMovementRow, InventoryKardexRow |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-021, RU-022 |
| **Evidencia** | `resources/types.ts` (Inventory*) |

---

## Módulo de Recursos — Finanzas

### RF-022 — Gestión Financiera Completa

| Campo | Valor |
|-------|-------|
| **ID** | RF-022 |
| **Nombre** | Gestionar cuentas, categorías y transacciones financieras |
| **Descripción** | CRUD de cuentas financieras (banco, número, moneda, saldo inicial) y categorías (ingreso/egreso). Registro de transacciones con comprobantes adjuntos y vinculación a proyectos. Workflow de aprobación para egresos (pendiente/aprobado/rechazado/observado). Reportes con totales (net income, por categoría, cuenta, tipo, proyecto) y exportación. |
| **Actor** | ACT-03, ACT-02 |
| **Entradas** | FinancialAccountCreateInput, FinancialCategoryCreateInput, FinancialTransactionCreateInput, FinancialEgresoResolutionInput |
| **Salidas** | FinancialTransactionRow, FinancialReportData |
| **Reglas de negocio** | RN-001, RN-011, RN-014 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-023, RU-024, RU-025 |
| **Evidencia** | `resources/types.ts` (Financial*) |

---

## Módulo de Notificaciones

### RF-023 — Gestión de Notificaciones

| Campo | Valor |
|-------|-------|
| **ID** | RF-023 |
| **Nombre** | Plantillas e historial de notificaciones |
| **Descripción** | Crea, edita y desactiva plantillas multicanal con variables dinámicas y evento asociado. Consulta historial de envíos con estado de entrega y lectura, filtrable por destinatario, canal, estado y fecha. |
| **Actor** | ACT-02, ACT-03 (con permiso) |
| **Entradas** | NotificationTemplateMutationInput, NotificationHistoryFilters |
| **Salidas** | NotificationTemplateRow, NotificationHistoryRow[] |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Media |
| **RU relacionados** | RU-026, RU-027 |
| **Evidencia** | `notifications/types.ts` |

---

## Módulo de Gobernanza

### RF-024 — Auditoría, Catálogos y Restricciones de Acceso

| Campo | Valor |
|-------|-------|
| **ID** | RF-024 |
| **Nombre** | Gobernanza institucional |
| **Descripción** | (a) Log de auditoría forense filtrable por esquema, tabla, operación, actor y fechas. (b) Gestión de catálogos de referencia del sistema. (c) Restricciones de acceso por rol: IP/CIDR, rango horario y dispositivo de confianza, opcionalmente por sede. (d) Log de accesos sensibles. (e) Retención de datos y restauración de registros eliminados. |
| **Actor** | ACT-12, ACT-02 |
| **Entradas** | GovernanceAuditFilters, GovernanceCatalogKey, RoleAccessConstraintMutationInput |
| **Salidas** | GovernanceAuditEvent[], GovernanceCatalogData, RoleAccessConstraintRow[] |
| **Reglas de negocio** | RN-001, RN-010 |
| **Prioridad** | Alta |
| **RU relacionados** | RU-028, RU-029, RU-030 |
| **Evidencia** | `governance/types.ts` |

---

## Módulo de Auditoría API

### RF-025 — Métricas de Seguridad y Resumen IA

| Campo | Valor |
|-------|-------|
| **ID** | RF-025 |
| **Nombre** | Métricas de seguridad y resumen IA forense |
| **Descripción** | (a) Métricas de los últimos 7 días: tasa de éxito de logins, fallos de PIN, overrides, sesiones concurrentes, fallos de pago y flags de actividad sospechosa. (b) Resumen inteligible de eventos de auditoría generado por IA con nivel de confianza. |
| **Actor** | ACT-02, ACT-12 |
| **Entradas** | Para métricas: Bearer JWT. Para resumen IA: event_type, resource_name, payload_before, payload_after. |
| **Salidas** | Métricas (7 campos), summary+reasoning+confidence |
| **Reglas de negocio** | RN-001 |
| **Prioridad** | Media/Baja |
| **RU relacionados** | RU-028 |
| **Evidencia** | `server/routes/audit.js`, `server/security/ai-client.js` |

---

## Módulo ACE

### RF-026 — Vínculos de Acceso y Membresías Contextuales

| Campo | Valor |
|-------|-------|
| **ID** | RF-026 |
| **Nombre** | Gestión de vínculos de acceso y membresías |
| **Descripción** | (a) Crea vínculos de registro parametrizados (VOLUNTEER_JOIN, STAFF_JOIN, BENEFICIARY_JOIN, GENERIC) con rol, sede, cupo máximo, expiración y contexto destino. (b) Gestiona membresías contextuales usuario-contexto (proyecto, sede, programa, actividad). (c) Permisos granulares por módulo (role_module_access) y por campo (role_field_permissions). |
| **Actor** | ACT-02, ACT-03 (permiso ace.access_links.manage) |
| **Entradas** | type, target_type, target_id, assigned_role_id, max_uses, expires_at |
| **Salidas** | access_links con code y slug únicos |
| **Reglas de negocio** | RN-011, RN-012 |
| **Prioridad** | Media |
| **RU relacionados** | RU-014 |
| **Evidencia** | Migración `ace_fase0_base_structures.sql` |

---

*Documento generado mediante análisis exhaustivo del repositorio Democra. Fecha: 2026-07-09.*
