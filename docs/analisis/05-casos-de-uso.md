# Documento 05 — Casos de Uso
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Área: Registro y Acceso](#área-registro-y-acceso)
2. [Área: Configuración y Seguridad](#área-configuración-y-seguridad)
3. [Área: Personas](#área-personas)
4. [Área: Admisión](#área-admisión)
5. [Área: Proyectos y Operación](#área-proyectos-y-operación)
6. [Área: Recursos](#área-recursos)
7. [Área: Gobernanza y Notificaciones](#área-gobernanza-y-notificaciones)

---

## Área: Registro y Acceso

---

### CU-001 — Ver Dashboard Principal

| Campo | Valor |
|-------|-------|
| **ID** | CU-001 |
| **Nombre** | Ver Dashboard Principal |
| **Descripción** | El usuario autenticado accede al panel de inicio y visualiza los indicadores clave de la organización: voluntarios activos, proyectos en curso, actividades próximas y métricas de seguridad. |
| **Actor Principal** | ACT-02, ACT-03 |
| **Actores Secundarios** | ACT-09 (motor de riesgo provee métricas) |
| **Precondiciones** | El usuario está autenticado y tiene una sesión activa válida. |
| **Postcondiciones** | El dashboard muestra los KPIs actualizados. |
| **Flujo Principal** | 1. El usuario accede a la URL del dashboard. 2. El sistema verifica la sesión activa. 3. El sistema obtiene los KPIs del tenant. 4. Se muestran indicadores de voluntarios, proyectos, actividades y seguridad. |
| **Flujos Alternativos** | FA: Sesión expirada → Redirección al login. |
| **Excepciones** | Error de BD → Mensaje de error; indicadores muestran "No disponible". |
| **Prioridad** | Media |
| **RF relacionados** | RF-025 (métricas de seguridad) |
| **RU relacionados** | RU-036 |
| **Evidencia** | `docs/ong/modulos-de-trabajo/01-home.md` |

---

### CU-002 — Registrar Organización en la Plataforma

| Campo | Valor |
|-------|-------|
| **ID** | CU-002 |
| **Nombre** | Registrar Organización |
| **Descripción** | El administrador registra su organización en Democra validando el RUC con SUNAT y completando el bootstrap del tenant. |
| **Actor Principal** | ACT-02 |
| **Actores Secundarios** | ACT-11 (SUNAT/API RUC) |
| **Precondiciones** | El usuario tiene una cuenta de Supabase Auth. El RUC es de una organización activa y habida. |
| **Postcondiciones** | El tenant está creado con sede Principal y rol Owner asignado al administrador. |
| **Flujo Principal** | 1. Administrador navega a la página de registro. 2. Ingresa el RUC. 3. Sistema valida RUC contra SUNAT. 4. Sistema muestra nombre de la organización. 5. Administrador confirma y completa datos del sector. 6. Sistema ejecuta bootstrap-tenant. 7. Administrador es redirigido al dashboard de su organización. |
| **Flujos Alternativos** | FA-1: RUC inválido → error de formato. FA-2: Organización inactiva → error 403. FA-3: Error de SUNAT → error 502. FA-4: Administrador ya tiene tenant → devuelve el existente (idempotente). |
| **Excepciones** | Error de BD durante bootstrap → Transacción rollback; se muestra error. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-001, RF-002 |
| **RU relacionados** | RU-001 |
| **Evidencia** | `server/routes/onboarding.js` |

---

### CU-003 — Iniciar Sesión con Evaluación de Riesgo y MFA

| Campo | Valor |
|-------|-------|
| **ID** | CU-003 |
| **Nombre** | Iniciar Sesión Web con Evaluación de Riesgo |
| **Descripción** | El usuario inicia sesión en la plataforma. El sistema evalúa el riesgo del acceso y puede solicitar un código OTP adicional antes de otorgar acceso. |
| **Actor Principal** | ACT-02, ACT-03, ACT-04 |
| **Actores Secundarios** | ACT-09 (Motor de Riesgo), ACT-10 (Resend — email OTP) |
| **Precondiciones** | El usuario tiene cuenta en Supabase Auth. La organización tiene al menos una sede activa. |
| **Postcondiciones** | El usuario tiene una sesión activa registrada en la tabla sessions. |
| **Flujo Principal** | 1. El usuario ingresa email y contraseña en la pantalla de login. 2. Supabase Auth valida las credenciales y devuelve un JWT. 3. El frontend llama POST /api/auth/risk-evaluate con el JWT y contexto del dispositivo. 4. El motor de riesgo evalúa IP, dispositivo, sesiones activas y velocidad de intentos. 5. Si ALLOW: se crea la sesión y el usuario accede al dashboard. |
| **Flujos Alternativos** | FA-1: Decisión REQUIRE_OTP → Se envía OTP por email (CU-003b). FA-2: Decisión BLOCK → Se muestra mensaje de bloqueo con tiempo de espera. FA-3: Credenciales inválidas → Supabase devuelve error de auth. |
| **Sub-flujo OTP (CU-003b)** | 1. Usuario recibe email con código de 6 dígitos. 2. Usuario ingresa el código. 3. Sistema verifica el código contra el desafío. 4. Si correcto: sesión creada, acceso al dashboard. 5. Si incorrecto: error. 6. Si no recibió el código: puede solicitar reenvío. |
| **Excepciones** | Servicio de email no disponible → Error 503 durante el envío del OTP. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-003, RF-004, RF-005 |
| **RU relacionados** | RU-002 |
| **Evidencia** | `server/routes/auth.js`, `server/security/risk-engine.js` |

---

### CU-004 — Iniciar Sesión en Terminal Física con PIN

| Campo | Valor |
|-------|-------|
| **ID** | CU-004 |
| **Nombre** | Login en Terminal con PIN |
| **Descripción** | El operador se autentica en una terminal física registrada usando su ID de usuario y un PIN numérico. |
| **Actor Principal** | ACT-07 |
| **Actores Secundarios** | ACT-09 (Motor de Riesgo) |
| **Precondiciones** | La terminal existe y está activa en la BD. El usuario tiene PIN configurado. El usuario no está bloqueado. |
| **Postcondiciones** | El operador tiene una sesión de tipo "terminal" creada. |
| **Flujo Principal** | 1. Operador ingresa user_id + PIN en la terminal. 2. Sistema verifica que la terminal está activa. 3. Sistema verifica que el usuario pertenece al tenant de la terminal. 4. Sistema verifica que el usuario no está bloqueado. 5. Sistema verifica el PIN contra el hash bcrypt. 6. Si correcto: motor de riesgo evalúa y crea sesión terminal. 7. Operador tiene acceso. |
| **Flujos Alternativos** | FA-1: PIN incorrecto → Incremento de contador de intentos. FA-2: MAX_PIN_ATTEMPTS alcanzado → Bloqueo temporal por PIN_BLOCK_MINUTES. FA-3: Terminal inactiva → Error 403. FA-4: Motor de riesgo BLOCK → Error 403. |
| **Excepciones** | Error de BD → Error 500. |
| **Prioridad** | Media |
| **RF relacionados** | RF-006 |
| **RU relacionados** | RU-003 |
| **Evidencia** | `server/routes/auth.js` (terminal-login) |

---

## Área: Configuración y Seguridad

---

### CU-005 — Gestionar Sedes de la Organización

| Campo | Valor |
|-------|-------|
| **ID** | CU-005 |
| **Nombre** | Gestionar Sedes |
| **Descripción** | El administrador crea, edita y desactiva sedes de la organización para estructurar el ámbito geográfico o funcional de los roles. |
| **Actor Principal** | ACT-02 |
| **Precondiciones** | El usuario es TenantAdmin. |
| **Postcondiciones** | Las sedes del tenant están actualizadas. |
| **Flujo Principal** | 1. Administrador accede al módulo de Configuración > Sedes. 2. Visualiza la lista de sedes. 3. Crea, edita nombre o desactiva (soft delete) una sede. 4. Cambios reflejados en el sistema. |
| **Flujos Alternativos** | FA: Nombre vacío → Error de validación. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-010 |
| **RU relacionados** | RU-033 |
| **Evidencia** | `server/routes/sedes.js` |

---

### CU-006 — Gestionar Roles, Permisos y Asignaciones de Usuario

| Campo | Valor |
|-------|-------|
| **ID** | CU-006 |
| **Nombre** | Gestionar Roles, Permisos y Asignaciones |
| **Descripción** | El administrador gestiona el sistema IAM: crea roles personalizados, asigna/revoca permisos a roles y vincula usuarios con roles en sedes específicas. |
| **Actor Principal** | ACT-02, ACT-03 (con permiso settings.roles.manage) |
| **Precondiciones** | El usuario es TenantAdmin o tiene permiso settings.roles.manage. |
| **Postcondiciones** | El catálogo de roles, permisos y asignaciones está actualizado. |
| **Flujo Principal** | 1. Accede a Configuración > Roles. 2. Crea/edita rol. 3. Asigna permisos al rol. 4. Navega a Configuración > Usuarios. 5. Asigna usuario a rol en una sede. |
| **Flujos Alternativos** | FA: Intentar modificar rol de sistema → Error 403/404. FA: Sin permiso → 403. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-007, RF-008, RF-009 |
| **RU relacionados** | RU-031, RU-032 |
| **Evidencia** | `server/routes/iam.js` |

---

### CU-007 — Gestionar Usuarios del Sistema

| Campo | Valor |
|-------|-------|
| **ID** | CU-007 |
| **Nombre** | Provisionar y gestionar usuarios del sistema |
| **Descripción** | El administrador crea cuentas de acceso para el personal, las vincula con voluntarios existentes (opcional), y activa/desactiva accesos. |
| **Actor Principal** | ACT-02 |
| **Precondiciones** | TenantAdmin. Las sedes y roles existen. |
| **Postcondiciones** | El usuario tiene cuenta activa y rol asignado. |
| **Flujo Principal** | 1. Administrador crea usuario (email, contraseña, nombre). 2. Opcionalmente vincula con voluntario existente. 3. Asigna rol en sede. 4. Usuario puede iniciar sesión. |
| **Flujos Alternativos** | FA: Email duplicado → Error. FA: Invitar por email en lugar de crear directamente. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-009 |
| **RU relacionados** | RU-032 |
| **Evidencia** | `settings/types.ts` (SystemUserProvisionInput) |

---

### CU-008 — Supervisar Sesiones y Dispositivos

| Campo | Valor |
|-------|-------|
| **ID** | CU-008 |
| **Nombre** | Supervisar y revocar sesiones y dispositivos |
| **Descripción** | El administrador visualiza todas las sesiones activas y dispositivos registrados del tenant, puede revocar sesiones sospechosas y gestionar dispositivos de confianza. |
| **Actor Principal** | ACT-02, ACT-12 |
| **Precondiciones** | TenantAdmin o auditor con permiso. |
| **Postcondiciones** | Sesiones revocadas o dispositivos actualizados. |
| **Flujo Principal** | 1. Accede a Configuración > Seguridad > Sesiones. 2. Visualiza sesiones activas con IP, dispositivo y tiempo. 3. Revoca sesiones individuales o masivamente. 4. Gestiona dispositivos (marcar de confianza). |
| **Flujos Alternativos** | FA: Revocar propia sesión → Redirección al login. |
| **Prioridad** | Media |
| **RF relacionados** | RF-003 |
| **RU relacionados** | RU-034 |
| **Evidencia** | `settings/types.ts` (SessionRow, DeviceRow, SessionTerminationInput) |

---

## Área: Personas

---

### CU-009 — Registrar y Gestionar Voluntarios

| Campo | Valor |
|-------|-------|
| **ID** | CU-009 |
| **Nombre** | Gestionar Voluntarios |
| **Descripción** | El coordinador mantiene el directorio de voluntarios: crea perfiles, edita datos, gestiona habilidades, documentos y roles. |
| **Actor Principal** | ACT-03, ACT-02 |
| **Precondiciones** | Usuario con permisos del módulo Personas. |
| **Postcondiciones** | El voluntario está registrado/actualizado con perfil completo. |
| **Flujo Principal** | 1. Coordinador accede a Módulo Personas > Voluntarios. 2. Busca o filtra. 3. Crea nuevo o edita existente. 4. Completa datos personales, habilidades, roles y documentos. 5. Guarda cambios. |
| **Flujos Alternativos** | FA: Documento duplicado → Error. FA: Sin permiso → 403. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-011 |
| **RU relacionados** | RU-005, RU-006 |
| **Evidencia** | `people/types.ts` (VolunteerUpsertInput) |

---

### CU-010 — Registrar y Gestionar Beneficiarios

| Campo | Valor |
|-------|-------|
| **ID** | CU-010 |
| **Nombre** | Gestionar Beneficiarios |
| **Descripción** | El coordinador mantiene el registro de beneficiarios con perfiles diferenciados (general, infantil, adulto mayor). |
| **Actor Principal** | ACT-03, ACT-02 |
| **Precondiciones** | Usuario con permisos del módulo Personas. |
| **Postcondiciones** | El beneficiario está registrado con perfil diferenciado. |
| **Flujo Principal** | 1. Coordinador accede a Módulo Personas > Beneficiarios. 2. Crea nuevo beneficiario. 3. Selecciona perfil (general/infantil/adulto mayor). 4. Completa campos según perfil. 5. Guarda. |
| **Flujos Alternativos** | FA: profileKind inválido → Error. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-012 |
| **RU relacionados** | RU-007 |
| **Evidencia** | `people/types.ts` (BeneficiaryUpsertInput) |

---

### CU-011 — Acceder a Datos Médicos Sensibles

| Campo | Valor |
|-------|-------|
| **ID** | CU-011 |
| **Nombre** | Acceder Auditadamente a Datos Médicos |
| **Descripción** | El coordinador autorizado accede a datos de salud de voluntarios o beneficiarios, indicando obligatoriamente el motivo de acceso. El sistema registra el acceso automáticamente. |
| **Actor Principal** | ACT-03 (autorizado), ACT-02 |
| **Precondiciones** | Usuario con permiso de acceso sensible. |
| **Postcondiciones** | Datos médicos visualizados/actualizados. Acceso registrado en log especializado. |
| **Flujo Principal** | 1. Coordinador navega al perfil de salud del voluntario/beneficiario. 2. El sistema solicita el motivo de acceso. 3. Coordinador ingresa motivo. 4. Sistema registra el acceso. 5. Se muestran/editan los datos médicos. |
| **Flujos Alternativos** | FA: Motivo vacío → Error de validación. FA: Sin permiso → 403. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-013 |
| **RU relacionados** | RU-008 |
| **Evidencia** | `people/types.ts` (accessReason, SensitiveAccessLogRow) |

---

### CU-012 — Gestionar Carnets Digitales de Voluntarios

| Campo | Valor |
|-------|-------|
| **ID** | CU-012 |
| **Nombre** | Emitir Carnets Digitales |
| **Descripción** | El administrador diseña plantillas de carnet y emite carnets individuales para voluntarios con QR y código único. |
| **Actor Principal** | ACT-02, ACT-03 (con permiso) |
| **Precondiciones** | Al menos un voluntario activo. |
| **Postcondiciones** | Carnet emitido con estado activo y código único. |
| **Flujo Principal** | 1. Accede a Personas > Carnets. 2. Crea/edita plantilla de carnet. 3. Selecciona voluntario y plantilla. 4. Emite carnet. 5. Descarga/comparte el carnet. |
| **Flujos Alternativos** | FA: Sin plantillas activas → Advertencia. |
| **Prioridad** | Media |
| **RF relacionados** | RF-014 |
| **RU relacionados** | RU-009 |
| **Evidencia** | `people/types.ts` (IdCardUpsertInput) |

---

## Área: Admisión

---

### CU-013 — Gestionar Solicitudes de Admisión de Voluntarios

| Campo | Valor |
|-------|-------|
| **ID** | CU-013 |
| **Nombre** | Procesar Admisión de Voluntarios |
| **Descripción** | El coordinador gestiona el ciclo completo de admisión: recibe solicitudes, cambia estados, programa entrevistas y convierte candidatos aprobados en voluntarios. |
| **Actor Principal** | ACT-03, ACT-02 |
| **Actores Secundarios** | ACT-05 (Candidato) |
| **Precondiciones** | Usuario con permisos de admisión. |
| **Postcondiciones** | Candidato aprobado convertido a voluntario, o solicitud rechazada con historial registrado. |
| **Flujo Principal** | 1. Coordinador accede a Módulo Admisión. 2. Visualiza solicitudes (con KPIs). 3. Filtra y selecciona solicitud. 4. Cambia estado de nueva → en_entrevista. 5. Programa entrevista con resultado y puntuación. 6. Cambia estado a aprobada. 7. Inicia onboarding. 8. Completa pasos de onboarding. 9. Convierte candidato a voluntario. |
| **Flujos Alternativos** | FA-1: Candidato rechazado → estado rechazada. FA-2: Solicitud en espera por documentos pendientes. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-015 |
| **RU relacionados** | RU-010, RU-011, RU-012, RU-013 |
| **Evidencia** | `admission/types.ts` |

---

### CU-014 — Autoregistro de Candidato por Enlace de Acceso

| Campo | Valor |
|-------|-------|
| **ID** | CU-014 |
| **Nombre** | Autoregistro por Código de Acceso |
| **Descripción** | El coordinador genera un código de registro y lo comparte con el candidato. El candidato lo usa para registrarse de forma autónoma. |
| **Actor Principal** | ACT-05 (Candidato), ACT-03 (genera código) |
| **Precondiciones** | Código activo, no expirado, con cupo disponible. |
| **Postcondiciones** | Candidato con cuenta creada y vinculado a solicitud de admisión. |
| **Flujo Principal** | 1. Coordinador genera código desde Módulo Admisión. 2. Comparte el enlace con el candidato. 3. Candidato accede al enlace público. 4. Candidato ve sus datos pre-cargados (si aplica). 5. Completa datos y crea contraseña. 6. Adjunta documentos. 7. Sistema crea cuenta y solicitud de admisión. |
| **Flujos Alternativos** | FA: Código expirado → Error. FA: Email ya registrado → Vincula cuenta existente. |
| **Prioridad** | Media |
| **RF relacionados** | RF-016 |
| **RU relacionados** | RU-014 |
| **Evidencia** | `admission/types.ts` (AdmissionRegistrationCodeRow, AdmissionPublicVolunteerRegistrationInput) |

---

## Área: Proyectos y Operación

---

### CU-015 — Gestionar Proyectos, Tareas y Actividades

| Campo | Valor |
|-------|-------|
| **ID** | CU-015 |
| **Nombre** | Gestionar el ciclo completo de Proyectos |
| **Descripción** | El coordinador crea proyectos, los desglosa en tareas y actividades, y hace seguimiento del estado de cada nivel. |
| **Actor Principal** | ACT-03, ACT-02 |
| **Precondiciones** | Usuario con permisos de proyectos. |
| **Postcondiciones** | Proyecto con tareas y actividades planificadas. |
| **Flujo Principal** | 1. Crea proyecto con código, nombre, área y estado. 2. Crea tareas dentro del proyecto con fecha límite. 3. Crea actividades en las tareas con horario y ubicación. 4. Asigna voluntarios y recursos. 5. Hace seguimiento de estados. |
| **Flujos Alternativos** | FA: Código de proyecto duplicado → Error. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-017, RF-018, RF-019, RF-020 |
| **RU relacionados** | RU-015, RU-016, RU-017, RU-018 |
| **Evidencia** | `projects/types.ts` |

---

### CU-016 — Registrar Operación: Asistencia, Horas y Evidencias

| Campo | Valor |
|-------|-------|
| **ID** | CU-016 |
| **Nombre** | Registrar Operación de Campo |
| **Descripción** | El coordinador o voluntario registra la asistencia, horas de trabajo y evidencias fotográficas de cada actividad ejecutada. |
| **Actor Principal** | ACT-03, ACT-04 |
| **Precondiciones** | Actividad existe. Voluntario asignado a la actividad. |
| **Postcondiciones** | Asistencia, horas y evidencias registradas para la actividad. |
| **Flujo Principal** | 1. Accede a Módulo Operación. 2. Busca la actividad del día. 3. Registra la asistencia del voluntario. 4. Registra las horas de inicio y fin. 5. Sube evidencias (fotos). |
| **Flujos Alternativos** | FA: Voluntario no asignado → Advertencia. FA: Evidencia de tipo no soportado → Error. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-020 |
| **RU relacionados** | RU-019, RU-020 |
| **Evidencia** | `operation/types.ts` |

---

## Área: Recursos

---

### CU-017 — Gestionar Inventario

| Campo | Valor |
|-------|-------|
| **ID** | CU-017 |
| **Nombre** | Gestionar Inventario de Artículos y Movimientos |
| **Descripción** | El coordinador mantiene el inventario de artículos, registra movimientos y consulta el kardex y el stock por ubicación. |
| **Actor Principal** | ACT-03, ACT-02 |
| **Precondiciones** | Usuario con permisos del módulo de Recursos. |
| **Postcondiciones** | Inventario actualizado con movimientos reflejados en el stock. |
| **Flujo Principal** | 1. Accede a Recursos > Inventario. 2. Gestiona artículos y ubicaciones. 3. Registra movimientos (entrada/salida/transferencia/ajuste). 4. Consulta stock actual. 5. Consulta kardex cronológico. |
| **Flujos Alternativos** | FA: Stock insuficiente para salida → Advertencia. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-021 |
| **RU relacionados** | RU-021, RU-022 |
| **Evidencia** | `resources/types.ts` (Inventory*) |

---

### CU-018 — Gestionar Finanzas y Aprobaciones

| Campo | Valor |
|-------|-------|
| **ID** | CU-018 |
| **Nombre** | Gestionar Finanzas y Workflow de Aprobaciones |
| **Descripción** | El coordinador/tesorero registra ingresos y egresos. Los egresos siguen un workflow de aprobación. Se adjuntan comprobantes. Se generan reportes financieros. |
| **Actor Principal** | ACT-03 (registra), ACT-02 (aprueba) |
| **Precondiciones** | Cuentas y categorías configuradas. Usuario con permisos financieros. |
| **Postcondiciones** | Transacciones registradas. Egresos aprobados/rechazados. Reportes disponibles. |
| **Flujo Principal** | 1. Accede a Recursos > Finanzas. 2. Registra ingreso o egreso. 3. Adjunta comprobante. 4. Si egreso: solicita aprobación. 5. Aprobador revisa y aprueba/rechaza. 6. Genera reporte de período. |
| **Flujos Alternativos** | FA: Ingreso aprobado automáticamente. FA: Egreso observado → requiere corrección. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-022 |
| **RU relacionados** | RU-023, RU-024, RU-025 |
| **Evidencia** | `resources/types.ts` (Financial*) |

---

## Área: Gobernanza y Notificaciones

---

### CU-019 — Gestionar Notificaciones y Plantillas

| Campo | Valor |
|-------|-------|
| **ID** | CU-019 |
| **Nombre** | Gestionar Notificaciones |
| **Descripción** | El administrador configura plantillas de notificación multicanal y consulta el historial de envíos. |
| **Actor Principal** | ACT-02, ACT-03 (con permiso) |
| **Precondiciones** | Usuario con permisos de gestión de notificaciones. |
| **Postcondiciones** | Plantillas configuradas. Historial consultado. |
| **Flujo Principal** | 1. Accede a Módulo Notificaciones. 2. Crea/edita plantillas con canal, asunto, cuerpo y variables. 3. Activa/desactiva plantillas. 4. Consulta historial de envíos con filtros. |
| **Flujos Alternativos** | FA: Sin permiso → 403. |
| **Prioridad** | Media |
| **RF relacionados** | RF-023 |
| **RU relacionados** | RU-026, RU-027 |
| **Evidencia** | `notifications/types.ts` |

---

### CU-020 — Auditoría y Gobernanza Institucional

| Campo | Valor |
|-------|-------|
| **ID** | CU-020 |
| **Nombre** | Gobernanza Institucional |
| **Descripción** | El auditor o administrador consulta logs forenses, gestiona catálogos, configura restricciones de acceso por rol y supervisa accesos a datos sensibles. |
| **Actor Principal** | ACT-12, ACT-02 |
| **Precondiciones** | Usuario con permisos de gobernanza (canReadAudit, canManageConstraints). |
| **Postcondiciones** | Logs consultados. Catálogos actualizados. Restricciones configuradas. |
| **Flujo Principal** | 1. Accede a Módulo Gobernanza. 2. Consulta log de auditoría con filtros. 3. Consulta accesos sensibles. 4. Gestiona catálogos de referencia. 5. Configura restricciones de acceso por rol (IP/horario/dispositivo). 6. Consulta candidatos a restauración en período de retención. |
| **Flujos Alternativos** | FA: Sin permiso → 403. FA: IA forense no disponible → Resumen desactivado. |
| **Prioridad** | Alta |
| **RF relacionados** | RF-024, RF-025 |
| **RU relacionados** | RU-028, RU-029, RU-030 |
| **Evidencia** | `governance/types.ts` |

---

*Documento generado mediante análisis exhaustivo del repositorio Democra. Fecha: 2026-07-09.*
