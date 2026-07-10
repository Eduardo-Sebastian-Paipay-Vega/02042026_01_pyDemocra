# Documento 03 — Requerimientos del Usuario
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requerimientos de Registro y Acceso](#2-requerimientos-de-registro-y-acceso)
3. [Requerimientos de Gestión de Personas](#3-requerimientos-de-gestión-de-personas)
4. [Requerimientos de Admisión de Voluntarios](#4-requerimientos-de-admisión-de-voluntarios)
5. [Requerimientos de Proyectos y Operaciones](#5-requerimientos-de-proyectos-y-operaciones)
6. [Requerimientos de Recursos](#6-requerimientos-de-recursos)
7. [Requerimientos de Notificaciones](#7-requerimientos-de-notificaciones)
8. [Requerimientos de Gobernanza](#8-requerimientos-de-gobernanza)
9. [Requerimientos de Configuración y Seguridad](#9-requerimientos-de-configuración-y-seguridad)
10. [Requerimientos de la Plataforma SaaS](#10-requerimientos-de-la-plataforma-saas)

---

## 1. Introducción

Este documento recoge los requerimientos expresados en lenguaje del usuario final, sin términos técnicos. Cada requerimiento describe lo que el usuario necesita poder hacer con el sistema, quién lo necesita y por qué.

---

## 2. Requerimientos de Registro y Acceso

---

### RU-001 — Registrar mi organización en la plataforma

| Campo | Valor |
|-------|-------|
| **ID** | RU-001 |
| **Nombre** | Registrar organización |
| **Descripción** | Como responsable de una ONG, quiero poder registrar mi organización en Democra para empezar a usarla. Al registrarme, quiero que el sistema verifique automáticamente que mi organización existe legalmente y esté activa. |
| **Prioridad** | Alta |
| **Actor** | Administrador de Organización (ACT-02) |
| **Justificación** | Sin registro, ninguna organización puede usar la plataforma. Es la puerta de entrada al sistema. |
| **Fuente** | `server/routes/onboarding.js` (validate-ruc, bootstrap-tenant), README.md |
| **Observaciones** | El sistema verifica el RUC con SUNAT antes de completar el registro. Solo organizaciones activas y con situación habida pueden registrarse. |

---

### RU-002 — Ingresar a mi cuenta de forma segura

| Campo | Valor |
|-------|-------|
| **ID** | RU-002 |
| **Nombre** | Inicio de sesión seguro |
| **Descripción** | Como usuario de la plataforma, quiero poder ingresar con mi correo y contraseña y que el sistema me pida un código de verificación adicional cuando detecte algo inusual en mi acceso, para proteger mi cuenta. |
| **Prioridad** | Alta |
| **Actor** | Administrador (ACT-02), Coordinador (ACT-03), Voluntario con acceso (ACT-04) |
| **Justificación** | La seguridad en el acceso protege los datos sensibles de voluntarios, beneficiarios y la organización. |
| **Fuente** | `server/routes/auth.js` (risk-evaluate, step-up/verify-otp) |
| **Observaciones** | El sistema envía el código de verificación por correo electrónico. El usuario puede solicitar que se reenvíe el código. |

---

### RU-003 — Ingresar desde una terminal física con mi número de identificación y contraseña numérica

| Campo | Valor |
|-------|-------|
| **ID** | RU-003 |
| **Nombre** | Login en terminal física |
| **Descripción** | Como operador asignado a un punto de control físico, quiero poder identificarme en la terminal usando mi número de usuario y un código numérico (PIN), sin necesidad de escribir mi correo y contraseña completos. |
| **Prioridad** | Media |
| **Actor** | Operador de Terminal (ACT-07) |
| **Justificación** | Las terminales físicas requieren un método de acceso rápido y sencillo, sin dependencia de teclado completo. |
| **Fuente** | `server/routes/auth.js` (terminal-login) |
| **Observaciones** | Si el usuario falla su PIN varias veces, la cuenta quedará bloqueada temporalmente por seguridad. |

---

### RU-004 — Que mis sesiones expiren automáticamente

| Campo | Valor |
|-------|-------|
| **ID** | RU-004 |
| **Nombre** | Expiración automática de sesiones |
| **Descripción** | Como administrador de la organización, quiero que las sesiones de los usuarios expiren automáticamente después de un período de inactividad para proteger el sistema de accesos no autorizados. |
| **Prioridad** | Alta |
| **Actor** | Administrador (ACT-02) |
| **Justificación** | Las sesiones que no expiran representan un riesgo de seguridad si un dispositivo es dejado desatendido. |
| **Fuente** | `server/security/risk-engine.js` (createSessionRecord, expiresAt), variables SESSION_TTL_HOURS |
| **Observaciones** | El tiempo de expiración se configura globalmente para toda la plataforma. |

---

## 3. Requerimientos de Gestión de Personas

---

### RU-005 — Registrar voluntarios en el sistema

| Campo | Valor |
|-------|-------|
| **ID** | RU-005 |
| **Nombre** | Registro de voluntarios |
| **Descripción** | Como coordinador de la ONG, quiero poder registrar a las personas que trabajan como voluntarias, incluyendo sus datos personales, documentos, habilidades y fotografía, para tener un directorio completo de mi equipo. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | Sin el registro de voluntarios no es posible gestionar asignaciones, horas ni ninguna operación de la ONG. |
| **Fuente** | `src/modules/ong/app/modules/people/types.ts` (VolunteerUpsertInput, VolunteerListRow) |
| **Observaciones** | Un voluntario puede tener múltiples documentos, habilidades y roles operativos. |

---

### RU-006 — Consultar el detalle de un voluntario

| Campo | Valor |
|-------|-------|
| **ID** | RU-006 |
| **Nombre** | Ver perfil de voluntario |
| **Descripción** | Como coordinador, quiero poder consultar toda la información de un voluntario en una sola vista, incluyendo sus datos de contacto, habilidades, proyectos en los que participa, horas registradas y documentos. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | El acceso rápido al perfil completo del voluntario es esencial para la coordinación diaria. |
| **Fuente** | `src/modules/ong/app/modules/people/types.ts` (VolunteerDetailData) |
| **Observaciones** | Ninguna |

---

### RU-007 — Registrar y gestionar beneficiarios

| Campo | Valor |
|-------|-------|
| **ID** | RU-007 |
| **Nombre** | Gestión de beneficiarios |
| **Descripción** | Como coordinador, quiero poder registrar a las personas que reciben los servicios de mi organización, con sus datos personales y perfil específico (si es niño, adulto mayor u otro), para llevar un registro organizado de nuestra población atendida. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | Los beneficiarios son el sujeto central de la misión de la ONG y deben estar debidamente registrados. |
| **Fuente** | `src/modules/ong/app/modules/people/types.ts` (BeneficiaryUpsertInput, BeneficiaryChildProfile, BeneficiarySeniorProfile) |
| **Observaciones** | El sistema soporta perfiles diferenciados para niños (con datos del tutor y escuela) y adultos mayores (con datos de contacto de emergencia). |

---

### RU-008 — Acceder a información médica sensible de forma controlada

| Campo | Valor |
|-------|-------|
| **ID** | RU-008 |
| **Nombre** | Acceso controlado a datos médicos |
| **Descripción** | Como coordinador autorizado, quiero poder acceder a los datos de salud de voluntarios y beneficiarios cuando sea necesario, pero que el sistema registre automáticamente quién accedió, cuándo y por qué motivo, para garantizar la privacidad y el cumplimiento. |
| **Prioridad** | Alta |
| **Actor** | Coordinador autorizado (ACT-03), Administrador (ACT-02) |
| **Justificación** | Los datos de salud son sensibles y su acceso debe estar controlado y trazado por cumplimiento legal y ético. |
| **Fuente** | `src/modules/ong/app/modules/people/types.ts` (BeneficiaryMedicalRecordInput.accessReason, VolunteerSensitiveRecordInput.accessReason, accesos_sensibles_log) |
| **Observaciones** | El motivo de acceso es obligatorio cada vez que se consultan datos médicos. |

---

### RU-009 — Emitir carnets digitales para voluntarios

| Campo | Valor |
|-------|-------|
| **ID** | RU-009 |
| **Nombre** | Carnets digitales de voluntarios |
| **Descripción** | Como administrador de la ONG, quiero poder diseñar una plantilla de carnet y emitir credenciales digitales para mis voluntarios, con código QR, foto y datos de identificación, para que puedan identificarse en campo. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02), Coordinador con permiso (ACT-03) |
| **Justificación** | Los carnets digitales facilitan la identificación de voluntarios en actividades de campo. |
| **Fuente** | `src/modules/ong/app/modules/people/types.ts` (IdCardTemplate*, IdCardUpsertInput, IdCardStatusCode) |
| **Observaciones** | Los carnets pueden ser activos, revocados o expirados. |

---

## 4. Requerimientos de Admisión de Voluntarios

---

### RU-010 — Recibir y gestionar solicitudes de incorporación de voluntarios

| Campo | Valor |
|-------|-------|
| **ID** | RU-010 |
| **Nombre** | Gestión de solicitudes de admisión |
| **Descripción** | Como coordinador, quiero poder ver todas las solicitudes de personas que quieren ser voluntarias, cambiar el estado de cada solicitud (nueva, en entrevista, aprobada, rechazada) y mantener notas sobre el proceso. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | La gestión eficiente del proceso de admisión determina la calidad del equipo de voluntarios de la ONG. |
| **Fuente** | `src/modules/ong/app/modules/admission/types.ts` (AdmissionRequestRow, AdmissionStateChangeInput) |
| **Observaciones** | El sistema muestra KPIs del proceso: total de solicitudes, pendientes, en entrevista, aprobadas, rechazadas y convertidas. |

---

### RU-011 — Programar y registrar entrevistas a candidatos

| Campo | Valor |
|-------|-------|
| **ID** | RU-011 |
| **Nombre** | Gestión de entrevistas |
| **Descripción** | Como coordinador, quiero poder programar entrevistas para los candidatos a voluntarios y registrar el resultado, comentarios y puntuación de cada entrevista. |
| **Prioridad** | Media |
| **Actor** | Coordinador (ACT-03) |
| **Justificación** | Las entrevistas son parte del proceso de selección para garantizar la idoneidad de los voluntarios. |
| **Fuente** | `src/modules/ong/app/modules/admission/types.ts` (AdmissionInterviewRow, AdmissionInterviewCreateInput) |
| **Observaciones** | Se puede registrar el puntuador/entrevistador y una puntuación numérica. |

---

### RU-012 — Guiar al nuevo voluntario por el proceso de incorporación

| Campo | Valor |
|-------|-------|
| **ID** | RU-012 |
| **Nombre** | Proceso de onboarding del voluntario |
| **Descripción** | Como coordinador, quiero poder gestionar un proceso de incorporación paso a paso para cada voluntario aprobado, marcando qué pasos han sido completados y cuáles faltan, con posibilidad de adjuntar evidencias. |
| **Prioridad** | Media |
| **Actor** | Coordinador (ACT-03), Candidato a Voluntario (ACT-05) |
| **Justificación** | Un proceso de incorporación estructurado garantiza que los nuevos voluntarios estén debidamente preparados. |
| **Fuente** | `src/modules/ong/app/modules/admission/types.ts` (AdmissionOnboardingStepRow, AdmissionOnboardingStartInput) |
| **Observaciones** | Cada paso puede ser obligatorio u opcional y puede tener evidencias adjuntas. |

---

### RU-013 — Convertir una solicitud aprobada en un registro de voluntario

| Campo | Valor |
|-------|-------|
| **ID** | RU-013 |
| **Nombre** | Conversión de candidato a voluntario |
| **Descripción** | Como coordinador, una vez que un candidato ha sido aprobado e incorporado, quiero poder convertirlo automáticamente en un voluntario registrado en el sistema, completando sus datos de perfil. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | La conversión es el paso final del proceso de admisión que incorpora al voluntario al sistema de gestión. |
| **Fuente** | `src/modules/ong/app/modules/admission/types.ts` (AdmissionConvertInput, AdmissionConvertResult) |
| **Observaciones** | Se puede indicar si el candidato fue creado o era un voluntario preexistente. |

---

### RU-014 — Permitir que candidatos se registren solos mediante un enlace

| Campo | Valor |
|-------|-------|
| **ID** | RU-014 |
| **Nombre** | Autoregistro de candidatos por enlace |
| **Descripción** | Como coordinador, quiero poder generar un enlace especial para que los candidatos interesados puedan llenar su propia solicitud de admisión sin necesidad de que yo los registre manualmente. |
| **Prioridad** | Media |
| **Actor** | Coordinador (ACT-03), Candidato a Voluntario (ACT-05) |
| **Justificación** | El autoregistro reduce la carga administrativa del coordinador y facilita el acceso de nuevos candidatos. |
| **Fuente** | `src/modules/ong/app/modules/admission/types.ts` (AdmissionRegistrationCodeRow, AdmissionPublicVolunteerRegistrationInput), ACE access_links |
| **Observaciones** | Los enlaces pueden tener fecha de vencimiento y número máximo de usos. |

---

## 5. Requerimientos de Proyectos y Operaciones

---

### RU-015 — Crear y gestionar proyectos de la organización

| Campo | Valor |
|-------|-------|
| **ID** | RU-015 |
| **Nombre** | Gestión de proyectos |
| **Descripción** | Como coordinador, quiero poder crear proyectos con nombre, descripción, fechas de inicio y fin, presupuesto y área temática, y hacer seguimiento de su estado (planificación, activo, completado, cancelado). |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | Los proyectos son la unidad principal de trabajo de la ONG. Su gestión estructurada permite planificar y reportar el impacto. |
| **Fuente** | `src/modules/ong/app/modules/projects/types.ts` (ProjectRow, ProjectFormValues) |
| **Observaciones** | Un proyecto tiene un código único, puede tener imagen y está vinculado a un área de trabajo. |

---

### RU-016 — Organizar el trabajo en tareas dentro de cada proyecto

| Campo | Valor |
|-------|-------|
| **ID** | RU-016 |
| **Nombre** | Gestión de tareas por proyecto |
| **Descripción** | Como coordinador, quiero poder desglosar cada proyecto en tareas específicas con su propio estado y fecha límite, para distribuir mejor el trabajo entre los voluntarios. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03) |
| **Justificación** | Las tareas permiten dividir el trabajo en unidades manejables y hacer seguimiento granular del avance. |
| **Fuente** | `src/modules/ong/app/modules/projects/types.ts` (TaskRow, TaskFormValues) |
| **Observaciones** | Las tareas tienen estado: pendiente, en progreso, completada, cancelada. |

---

### RU-017 — Programar y gestionar actividades específicas

| Campo | Valor |
|-------|-------|
| **ID** | RU-017 |
| **Nombre** | Gestión de actividades |
| **Descripción** | Como coordinador, quiero poder crear actividades concretas vinculadas a una tarea, con fecha, hora y lugar, para organizar el trabajo de campo de los voluntarios. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03) |
| **Justificación** | Las actividades son la unidad ejecutable de trabajo que permite registrar asistencia, horas y evidencias. |
| **Fuente** | `src/modules/ong/app/modules/projects/types.ts` (ActivityRow, ActivityFormValues) |
| **Observaciones** | Una actividad puede tener horas estimadas y una ubicación asignada. |

---

### RU-018 — Asignar voluntarios a proyectos y actividades

| Campo | Valor |
|-------|-------|
| **ID** | RU-018 |
| **Nombre** | Asignación de voluntarios |
| **Descripción** | Como coordinador, quiero poder asignar voluntarios a proyectos y a actividades específicas, indicando el rol de cada uno, para organizar quién hace qué dentro de cada iniciativa. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | Sin asignaciones claras, los voluntarios no saben en qué trabajar y no se puede hacer seguimiento de su participación. |
| **Fuente** | `src/modules/ong/app/modules/projects/types.ts` (ProjectVolunteerAssignmentRow, ActivityVolunteerAssignmentRow) |
| **Observaciones** | Un voluntario puede estar asignado a múltiples proyectos y actividades simultáneamente. |

---

### RU-019 — Registrar la asistencia y horas de voluntariado

| Campo | Valor |
|-------|-------|
| **ID** | RU-019 |
| **Nombre** | Registro de asistencia y horas |
| **Descripción** | Como coordinador, quiero poder registrar la asistencia de cada voluntario a las actividades y las horas que dedicaron, para llevar un control preciso de su participación y generar reportes de impacto. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Voluntario con acceso (ACT-04) |
| **Justificación** | El registro de horas es fundamental para reconocer el esfuerzo de los voluntarios y demostrar el impacto a los donantes. |
| **Fuente** | `src/modules/ong/app/modules/operation/types.ts` (ActivityRelatedHourRow, OperationActivityRow) |
| **Observaciones** | Las horas pueden tener un estado de aprobación. |

---

### RU-020 — Cargar evidencias de las actividades realizadas

| Campo | Valor |
|-------|-------|
| **ID** | RU-020 |
| **Nombre** | Carga de evidencias |
| **Descripción** | Como coordinador o voluntario, quiero poder adjuntar fotos u otros archivos como evidencia de que una actividad fue realizada, para documentar el trabajo de campo. |
| **Prioridad** | Media |
| **Actor** | Coordinador (ACT-03), Voluntario con acceso (ACT-04) |
| **Justificación** | Las evidencias son necesarias para rendir cuentas ante donantes, beneficiarios y entidades reguladoras. |
| **Fuente** | `src/modules/ong/app/modules/operation/types.ts` (ActivityRelatedEvidenceRow) |
| **Observaciones** | Cada evidencia tiene un tipo, nombre del voluntario que la subió y un estado de validación. |

---

## 6. Requerimientos de Recursos

---

### RU-021 — Gestionar el inventario de materiales y recursos

| Campo | Valor |
|-------|-------|
| **ID** | RU-021 |
| **Nombre** | Gestión de inventario |
| **Descripción** | Como coordinador, quiero poder registrar los artículos y materiales que tiene la organización, con sus unidades de medida y ubicaciones, y hacer seguimiento del movimiento de cada artículo (entradas, salidas, transferencias). |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | El control del inventario evita pérdidas y permite planificar el uso de recursos en los proyectos. |
| **Fuente** | `src/modules/ong/app/modules/resources/types.ts` (InventoryItemRow, InventoryMovementRow) |
| **Observaciones** | El sistema calcula el stock derivado de los movimientos y permite consultar el kardex por artículo. |

---

### RU-022 — Consultar el kardex y stock por artículo y por ubicación

| Campo | Valor |
|-------|-------|
| **ID** | RU-022 |
| **Nombre** | Consulta de stock y kardex |
| **Descripción** | Como coordinador, quiero poder ver el historial completo de movimientos de cada artículo con el saldo acumulado (kardex), y consultar el stock disponible por artículo o por almacén. |
| **Prioridad** | Media |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | El kardex permite auditar el inventario y verificar que los saldos son correctos. |
| **Fuente** | `src/modules/ong/app/modules/resources/types.ts` (InventoryKardexRow, InventoryStockByLocationRow) |
| **Observaciones** | El stock se agrupa por artículo y también por ubicación (almacén). |

---

### RU-023 — Registrar ingresos y gastos de la organización

| Campo | Valor |
|-------|-------|
| **ID** | RU-023 |
| **Nombre** | Registro de transacciones financieras |
| **Descripción** | Como coordinador o tesorero, quiero poder registrar los ingresos y gastos de la organización, indicando la cuenta, la categoría, la descripción y el proyecto relacionado cuando corresponda. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | El control financiero es indispensable para la transparencia y sostenibilidad de la ONG. |
| **Fuente** | `src/modules/ong/app/modules/resources/types.ts` (FinancialTransactionRow, FinancialTransactionCreateInput) |
| **Observaciones** | Los egresos pueden requerir proceso de aprobación. Se pueden adjuntar comprobantes a cada transacción. |

---

### RU-024 — Aprobar o rechazar solicitudes de gasto

| Campo | Valor |
|-------|-------|
| **ID** | RU-024 |
| **Nombre** | Aprobación de egresos |
| **Descripción** | Como coordinador o aprobador, quiero poder revisar las solicitudes de gasto pendientes y aprobarlas, rechazarlas u observarlas con un comentario, para mantener el control del presupuesto. |
| **Prioridad** | Alta |
| **Actor** | Coordinador autorizado (ACT-03), Administrador (ACT-02) |
| **Justificación** | El flujo de aprobación de egresos evita gastos no autorizados y mejora la gobernanza financiera. |
| **Fuente** | `src/modules/ong/app/modules/resources/types.ts` (FinancialEgresoResolutionInput, FinancialApprovalKind) |
| **Observaciones** | Módulo de Aprobaciones es el punto central para este flujo (MOD-FE-05). |

---

### RU-025 — Generar reportes financieros de la organización

| Campo | Valor |
|-------|-------|
| **ID** | RU-025 |
| **Nombre** | Reportes financieros |
| **Descripción** | Como coordinador o administrador, quiero poder generar reportes de ingresos, egresos y saldo de la organización, filtrados por período, categoría, cuenta o proyecto, para tomar decisiones informadas y rendir cuentas. |
| **Prioridad** | Alta |
| **Actor** | Coordinador (ACT-03), Administrador (ACT-02) |
| **Justificación** | Los reportes financieros son esenciales para la transparencia ante donantes y la planificación del presupuesto. |
| **Fuente** | `src/modules/ong/app/modules/resources/types.ts` (FinancialReportData, FinancialReportTotals) |
| **Observaciones** | Los reportes pueden exportarse. Se desglosan por categoría, cuenta, tipo y proyecto. |

---

## 7. Requerimientos de Notificaciones

---

### RU-026 — Configurar mensajes automáticos para los usuarios

| Campo | Valor |
|-------|-------|
| **ID** | RU-026 |
| **Nombre** | Plantillas de notificación |
| **Descripción** | Como administrador, quiero poder crear y editar plantillas de mensajes para diferentes eventos del sistema (por correo u otros canales), para automatizar las comunicaciones con los usuarios de mi organización. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02), Coordinador con permiso (ACT-03) |
| **Justificación** | Las notificaciones automáticas mejoran la comunicación con el equipo de voluntarios y reducen la carga administrativa. |
| **Fuente** | `src/modules/ong/app/modules/notifications/types.ts` (NotificationTemplateRow, NotificationTemplateMutationInput) |
| **Observaciones** | Las plantillas pueden incluir variables dinámicas para personalizar cada mensaje. |

---

### RU-027 — Consultar el historial de mensajes enviados

| Campo | Valor |
|-------|-------|
| **ID** | RU-027 |
| **Nombre** | Historial de notificaciones |
| **Descripción** | Como administrador, quiero poder ver el historial de todos los mensajes enviados por el sistema, con el estado de entrega de cada uno y si fueron leídos. |
| **Prioridad** | Baja |
| **Actor** | Administrador (ACT-02), Coordinador con permiso (ACT-03) |
| **Justificación** | El historial permite identificar problemas de entrega y verificar que los usuarios recibieron información importante. |
| **Fuente** | `src/modules/ong/app/modules/notifications/types.ts` (NotificationHistoryRow) |
| **Observaciones** | Se puede filtrar por destinatario, canal, estado de entrega y fecha. |

---

## 8. Requerimientos de Gobernanza

---

### RU-028 — Consultar el registro de cambios del sistema

| Campo | Valor |
|-------|-------|
| **ID** | RU-028 |
| **Nombre** | Auditoría y registro de cambios |
| **Descripción** | Como responsable de gobernanza, quiero poder consultar un registro detallado de todos los cambios realizados en el sistema (quién hizo qué, cuándo y con qué resultado), para poder auditar las operaciones de la organización. |
| **Prioridad** | Alta |
| **Actor** | Auditor (ACT-12), Administrador (ACT-02) |
| **Justificación** | La auditoría es esencial para la transparencia y el cumplimiento normativo de la ONG. |
| **Fuente** | `src/modules/ong/app/modules/governance/types.ts` (GovernanceAuditEvent, GovernanceAuditData) |
| **Observaciones** | El sistema consolida los eventos de dos fuentes de auditoría. Se puede filtrar por esquema, tabla, operación, actor y fecha. |

---

### RU-029 — Controlar quién puede acceder desde dónde y en qué horarios

| Campo | Valor |
|-------|-------|
| **ID** | RU-029 |
| **Nombre** | Restricciones de acceso por rol |
| **Descripción** | Como administrador, quiero poder establecer restricciones para que ciertos roles solo puedan acceder desde direcciones de red específicas, en determinados horarios o desde dispositivos de confianza, para mejorar la seguridad de la organización. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02), Auditor (ACT-12) |
| **Justificación** | Las restricciones de acceso reducen el riesgo de accesos no autorizados desde redes o horarios inusuales. |
| **Fuente** | `src/modules/ong/app/modules/governance/types.ts` (RoleAccessConstraintRow, RoleAccessConstraintFormInput) |
| **Observaciones** | Se puede restringir por IP/CIDR, rango horario y si se requiere dispositivo de confianza. |

---

### RU-030 — Gestionar y consultar los catálogos de datos del sistema

| Campo | Valor |
|-------|-------|
| **ID** | RU-030 |
| **Nombre** | Gestión de catálogos |
| **Descripción** | Como administrador, quiero poder consultar y administrar las tablas de referencia del sistema (tipos de documento, géneros, países, estados de voluntario, unidades de medida, etc.) para personalizar los datos de mi organización. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02), Auditor (ACT-12) |
| **Justificación** | Los catálogos son necesarios para que el sistema refleje la realidad operativa de cada organización. |
| **Fuente** | `src/modules/ong/app/modules/governance/types.ts` (GovernanceCatalogKey, GovernanceCatalogData) |
| **Observaciones** | Algunos catálogos son de solo lectura para los usuarios (definidos por la plataforma). |

---

## 9. Requerimientos de Configuración y Seguridad

---

### RU-031 — Crear y gestionar roles y permisos de acceso

| Campo | Valor |
|-------|-------|
| **ID** | RU-031 |
| **Nombre** | Gestión de roles y permisos |
| **Descripción** | Como administrador, quiero poder crear roles personalizados para mi organización, asignarles permisos específicos a cada módulo, y definir qué puede ver o hacer cada tipo de usuario. |
| **Prioridad** | Alta |
| **Actor** | Administrador (ACT-02) |
| **Justificación** | Los roles y permisos son esenciales para garantizar que cada usuario solo acceda a lo que le corresponde. |
| **Fuente** | `server/routes/iam.js`, `src/modules/ong/app/modules/settings/types.ts` (RoleRow, PermissionCatalogRow) |
| **Observaciones** | Los roles del sistema no pueden ser modificados. Los roles personalizados pueden ser eliminados si no tienen usuarios asignados. |

---

### RU-032 — Crear y administrar usuarios del sistema

| Campo | Valor |
|-------|-------|
| **ID** | RU-032 |
| **Nombre** | Gestión de usuarios del sistema |
| **Descripción** | Como administrador, quiero poder crear cuentas de acceso para los miembros de mi equipo, asignarles roles en las sedes correspondientes, y bloquear o activar su acceso cuando sea necesario. |
| **Prioridad** | Alta |
| **Actor** | Administrador (ACT-02) |
| **Justificación** | Sin gestión de usuarios, no es posible delegar trabajo ni controlar el acceso al sistema. |
| **Fuente** | `src/modules/ong/app/modules/settings/types.ts` (SystemUserRow, SystemUserProvisionInput) |
| **Observaciones** | Un usuario puede ser creado directamente o invitado por correo. Se puede vincular con un voluntario existente. |

---

### RU-033 — Gestionar las sedes de mi organización

| Campo | Valor |
|-------|-------|
| **ID** | RU-033 |
| **Nombre** | Gestión de sedes |
| **Descripción** | Como administrador, quiero poder registrar las diferentes oficinas o sedes de mi organización, editarlas y desactivarlas cuando ya no estén activas, para que el sistema refleje la estructura real de mi organización. |
| **Prioridad** | Alta |
| **Actor** | Administrador (ACT-02) |
| **Justificación** | Las sedes son la unidad geográfica/operativa donde se asignan roles y se realizan operaciones. |
| **Fuente** | `server/routes/sedes.js` |
| **Observaciones** | La desactivación de una sede es reversible. No se eliminan físicamente para preservar el historial. |

---

### RU-034 — Supervisar dispositivos y sesiones activas

| Campo | Valor |
|-------|-------|
| **ID** | RU-034 |
| **Nombre** | Supervisión de dispositivos y sesiones |
| **Descripción** | Como administrador, quiero poder ver todos los dispositivos registrados y sesiones activas de mi organización, poder revocar sesiones sospechosas y marcar dispositivos como de confianza o no. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02), Auditor (ACT-12) |
| **Justificación** | La supervisión de dispositivos y sesiones es clave para detectar accesos no autorizados. |
| **Fuente** | `src/modules/ong/app/modules/settings/types.ts` (SessionRow, DeviceRow, SessionTerminationInput) |
| **Observaciones** | Al revocar una sesión también se invalida el acceso activo del usuario en ese dispositivo. |

---

### RU-035 — Gestionar las terminales físicas de mi organización

| Campo | Valor |
|-------|-------|
| **ID** | RU-035 |
| **Nombre** | Gestión de terminales físicas |
| **Descripción** | Como administrador, quiero poder registrar y administrar las terminales físicas de mi organización para que los operadores puedan autenticarse en ellas. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02) |
| **Justificación** | Las terminales físicas son el punto de acceso en campo para voluntarios y operadores. |
| **Fuente** | `src/modules/ong/app/modules/settings/types.ts` (TerminalRow, TerminalMutationInput) |
| **Observaciones** | Ninguna |

---

## 10. Requerimientos de la Plataforma SaaS

---

### RU-036 — Tener un panel de inicio con indicadores clave de la organización

| Campo | Valor |
|-------|-------|
| **ID** | RU-036 |
| **Nombre** | Dashboard con KPIs |
| **Descripción** | Como coordinador o administrador, quiero ver al iniciar sesión un panel resumen con los indicadores más importantes de mi organización (voluntarios activos, proyectos en curso, actividades próximas) para tener una visión general rápida. |
| **Prioridad** | Media |
| **Actor** | Administrador (ACT-02), Coordinador (ACT-03) |
| **Justificación** | El dashboard mejora la experiencia del usuario y permite identificar rápidamente áreas que requieren atención. |
| **Fuente** | `docs/ong/modulos-de-trabajo/01-home.md` |
| **Observaciones** | Ninguna |

---

### RU-037 — Acceder a la documentación y página informativa de la plataforma

| Campo | Valor |
|-------|-------|
| **ID** | RU-037 |
| **Nombre** | Landing page y presentación |
| **Descripción** | Como potencial cliente, quiero poder acceder a una página web que me explique qué es Democra, qué ofrece y cómo puedo registrar mi organización. |
| **Prioridad** | Baja |
| **Actor** | Visitante / Público (ACT-01) |
| **Justificación** | La landing page es el primer punto de contacto entre posibles clientes y la plataforma. |
| **Fuente** | `src/pages/landing/`, `src/pages/nosotros/` |
| **Observaciones** | Ninguna |

---

*Documento generado mediante análisis exhaustivo del repositorio Democra. Fecha: 2026-07-09.*
