# Documento 02 — Actores del Sistema
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Resumen de Actores](#1-resumen-de-actores)
2. [Actores Detallados](#2-actores-detallados)

---

## 1. Resumen de Actores

| ID | Nombre | Tipo | Descripción |
|----|--------|------|-------------|
| ACT-01 | Visitante / Público | Secundario | Persona no autenticada que accede a la landing |
| ACT-02 | Administrador de Organización (Owner) | Primario | Responsable de configurar y gestionar su tenant |
| ACT-03 | Coordinador / Gestor ONG | Primario | Operador interno con permisos de gestión operativa |
| ACT-04 | Voluntario con Acceso al Sistema | Primario | Voluntario con cuenta IAM del sistema |
| ACT-05 | Candidato a Voluntario | Primario | Persona en proceso de admisión (sin cuenta aún) |
| ACT-06 | Beneficiario | Secundario | Receptor de servicios; gestionado, no opera el sistema |
| ACT-07 | Operador de Terminal | Primario | Usuario que se autentica en terminales físicas con PIN |
| ACT-08 | Plataforma Democra (SaaS) | Sistema | El propio sistema Democra como proveedor de la plataforma |
| ACT-09 | Sistema de Evaluación de Riesgo | Sistema | Motor interno que evalúa la seguridad de cada acceso |
| ACT-10 | Sistema de Notificaciones (Resend) | Sistema | Servicio externo de envío de emails OTP y notificaciones |
| ACT-11 | SUNAT / API RUC | Sistema | Servicio externo de validación fiscal peruana |
| ACT-12 | Auditor / Responsable de Gobernanza | Primario | Revisa logs, reportes de auditoría y configuración de acceso |

---

## 2. Actores Detallados

---

### ACT-01 — Visitante / Público

| Campo | Valor |
|-------|-------|
| **ID** | ACT-01 |
| **Nombre** | Visitante / Público |
| **Tipo** | Secundario |
| **Descripción** | Persona no autenticada que navega por la landing page o la página "Nosotros" de Democra. Puede conocer la plataforma y solicitar información. No tiene acceso a funcionalidades internas del sistema. |
| **Responsabilidades** | Consultar información pública sobre la plataforma |
| **Objetivos** | Conocer las características de Democra; iniciar el proceso de registro de su organización |
| **Casos de uso relacionados** | CU-001 (Ver landing page), CU-002 (Iniciar registro de organización) |

**Evidencia:** `src/pages/landing/`, `src/pages/nosotros/`

---

### ACT-02 — Administrador de Organización (Owner)

| Campo | Valor |
|-------|-------|
| **ID** | ACT-02 |
| **Nombre** | Administrador de Organización (Owner) |
| **Tipo** | Primario |
| **Descripción** | Es el primer usuario registrado de una organización. Recibe automáticamente el rol "Owner" al hacer bootstrap del tenant. Tiene acceso total a todos los módulos de su organización. Puede gestionar todos los usuarios, roles, sedes, recursos y configuración de la plataforma. |
| **Responsabilidades** | Configurar la organización; gestionar usuarios y permisos; supervisar todas las operaciones |
| **Objetivos** | Tener visibilidad y control total sobre su organización dentro de la plataforma |
| **Casos de uso relacionados** | CU-002, CU-004, CU-005, CU-006, CU-007, CU-008, CU-010, CU-011, CU-012, CU-020, CU-021, CU-022, CU-023, CU-024, CU-030 |

**Evidencia:** `server/routes/onboarding.js` (bootstrap-tenant crea rol Owner), `server/routes/iam.js` (fn_is_tenant_admin), `src/modules/ong/app/modules/settings/types.ts` (SettingsCapabilityState.isTenantAdmin)

---

### ACT-03 — Coordinador / Gestor ONG

| Campo | Valor |
|-------|-------|
| **ID** | ACT-03 |
| **Nombre** | Coordinador / Gestor ONG |
| **Tipo** | Primario |
| **Descripción** | Usuario interno de la organización con permisos específicos asignados por el administrador. Puede gestionar proyectos, actividades, personas, recursos y otros módulos según los permisos de su rol. Puede tener distintos permisos en distintas sedes. |
| **Responsabilidades** | Gestionar proyectos y actividades; registrar voluntarios y beneficiarios; controlar inventario y finanzas; procesar admisiones |
| **Objetivos** | Ejecutar las operaciones del día a día de la ONG; mantener datos actualizados; generar reportes |
| **Casos de uso relacionados** | CU-007 a CU-029 (según permisos asignados) |

**Evidencia:** `src/modules/ong/app/modules/settings/types.ts` (SystemUserRow, SystemUserAssignmentRow), `server/routes/iam.js` (canManageUsers, canReadRoles, canManageRoles)

---

### ACT-04 — Voluntario con Acceso al Sistema

| Campo | Valor |
|-------|-------|
| **ID** | ACT-04 |
| **Nombre** | Voluntario con Acceso al Sistema |
| **Tipo** | Primario |
| **Descripción** | Voluntario que además tiene una cuenta IAM (perfil en `profiles`) vinculada a su registro de voluntario. Puede acceder al sistema con permisos limitados según el rol que le asigne el administrador. No todo voluntario tiene cuenta IAM. |
| **Responsabilidades** | Registrar sus propias horas y evidencias de actividades; consultar sus asignaciones |
| **Objetivos** | Ver sus actividades asignadas; registrar su participación; acceder a información relevante |
| **Casos de uso relacionados** | CU-003, CU-013, CU-014 |

**Evidencia:** `src/modules/ong/app/modules/settings/types.ts` (SystemUserProvisionInput.volunteerId — vinculación voluntario-usuario), `src/modules/ong/app/modules/people/types.ts` (VolunteerListRow.iamUserId)

---

### ACT-05 — Candidato a Voluntario

| Campo | Valor |
|-------|-------|
| **ID** | ACT-05 |
| **Nombre** | Candidato a Voluntario |
| **Tipo** | Primario |
| **Descripción** | Persona que desea incorporarse como voluntario. Puede presentar una solicitud de admisión, ya sea a través de un link de acceso (ACE) o mediante registro manual por un coordinador. No tiene cuenta en el sistema hasta que es convertido a voluntario con acceso. |
| **Responsabilidades** | Completar el formulario de postulación; asistir a entrevistas; completar pasos de onboarding |
| **Objetivos** | Unirse a la organización como voluntario; completar el proceso de incorporación |
| **Casos de uso relacionados** | CU-015, CU-016, CU-017, CU-018 |

**Evidencia:** `src/modules/ong/app/modules/admission/types.ts` (AdmissionRequestRow, AdmissionPublicVolunteerRegistrationInput)

---

### ACT-06 — Beneficiario

| Campo | Valor |
|-------|-------|
| **ID** | ACT-06 |
| **Nombre** | Beneficiario |
| **Tipo** | Secundario |
| **Descripción** | Persona que recibe los servicios de la ONG. Sus datos son gestionados por el coordinador en el módulo de Personas. No opera el sistema directamente. Puede ser de perfil general, infantil (con tutor) o adulto mayor. |
| **Responsabilidades** | N/A — es sujeto de atención, no operador del sistema |
| **Objetivos** | Recibir los servicios de la ONG |
| **Casos de uso relacionados** | CU-011 (gestión de beneficiarios como objeto del caso de uso) |

**Evidencia:** `src/modules/ong/app/modules/people/types.ts` (BeneficiaryListRow, BeneficiaryChildProfile, BeneficiarySeniorProfile)

---

### ACT-07 — Operador de Terminal

| Campo | Valor |
|-------|-------|
| **ID** | ACT-07 |
| **Nombre** | Operador de Terminal |
| **Tipo** | Primario |
| **Descripción** | Usuario que se autentica en una terminal física registrada en el sistema usando su user_id y un PIN numérico en lugar de credenciales web. Este mecanismo es independiente del login web y está diseñado para puntos de control físicos de la organización. |
| **Responsabilidades** | Autenticarse en terminales físicas; registrar asistencias físicas |
| **Objetivos** | Acceder al sistema desde terminales sin interfaz web completa |
| **Casos de uso relacionados** | CU-004 |

**Evidencia:** `server/routes/auth.js` (POST /terminal-login), `src/modules/ong/app/modules/settings/types.ts` (TerminalRow)

---

### ACT-08 — Plataforma Democra (SaaS)

| Campo | Valor |
|-------|-------|
| **ID** | ACT-08 |
| **Nombre** | Plataforma Democra (SaaS) |
| **Tipo** | Sistema |
| **Descripción** | La propia plataforma actúa como actor sistémico al gestionar subscripciones, planes de servicio, facturación y las restricciones financieras sobre los tenants. Controla el acceso a funcionalidades según el plan contratado. |
| **Responsabilidades** | Gestionar planes, facturación y restricciones de funcionalidad por tenant |
| **Objetivos** | Garantizar la sostenibilidad del servicio SaaS |
| **Casos de uso relacionados** | CU-030 (gestión de suscripciones/pagos) |

**Evidencia:** `server/routes/audit.js` (payment_transactions), `server/middleware/financial-state.js`, `plans`, `payment_transactions` en el esquema de BD

---

### ACT-09 — Sistema de Evaluación de Riesgo (Motor de Riesgo)

| Campo | Valor |
|-------|-------|
| **ID** | ACT-09 |
| **Nombre** | Sistema de Evaluación de Riesgo |
| **Tipo** | Sistema |
| **Descripción** | Motor interno de análisis de riesgo que evalúa cada intento de autenticación considerando: IP del cliente, dispositivo registrado, sesiones activas concurrentes, velocidad de intentos, bloqueos previos y nivel de criticidad de la acción solicitada. |
| **Responsabilidades** | Evaluar el riesgo de cada sesión o acción; emitir decisiones ALLOW/REQUIRE_OTP/BLOCK; generar desafíos OTP |
| **Objetivos** | Proteger el sistema contra accesos no autorizados |
| **Casos de uso relacionados** | CU-003, CU-004 |

**Evidencia:** `server/security/risk-engine.js` (evaluateRiskEngine, createOtpChallenge)

---

### ACT-10 — Sistema de Notificaciones (Resend)

| Campo | Valor |
|-------|-------|
| **ID** | ACT-10 |
| **Nombre** | Sistema de Notificaciones (Resend) |
| **Tipo** | Sistema |
| **Descripción** | Servicio externo de envío de emails utilizado para la entrega de códigos OTP de autenticación. Se integra a través de la API de Resend con autenticación por token. |
| **Responsabilidades** | Enviar emails OTP a los usuarios que requieren segundo factor de autenticación |
| **Objetivos** | Garantizar la entrega de códigos de seguridad |
| **Casos de uso relacionados** | CU-003 (flujo OTP) |

**Evidencia:** `server/services/otp-mailer.js`, variables de entorno `RESEND_API_KEY`, `OTP_FROM_EMAIL`

---

### ACT-11 — SUNAT / API RUC

| Campo | Valor |
|-------|-------|
| **ID** | ACT-11 |
| **Nombre** | SUNAT / API RUC |
| **Tipo** | Sistema |
| **Descripción** | Servicio externo de la administración tributaria peruana (SUNAT) o API tercera que provee información de RUC. Usado durante el proceso de registro para verificar que la organización esté activa y en condición habida antes de crear el tenant. |
| **Responsabilidades** | Validar el estado fiscal de un RUC dado |
| **Objetivos** | Garantizar que solo organizaciones legalmente activas pueden registrarse |
| **Casos de uso relacionados** | CU-002 |

**Evidencia:** `server/routes/onboarding.js` (GET /validate-ruc/:ruc), variables `VITE_RUC_API_URL`, `RUC_API_TOKEN`

---

### ACT-12 — Auditor / Responsable de Gobernanza

| Campo | Valor |
|-------|-------|
| **ID** | ACT-12 |
| **Nombre** | Auditor / Responsable de Gobernanza |
| **Tipo** | Primario |
| **Descripción** | Usuario con permisos específicos de auditoría y gobernanza. Accede a los logs forenses, revisa accesos sensibles, configura restricciones de acceso por rol (IP/horario/dispositivo), gestiona catálogos del sistema y supervisa la retención de datos. Puede ser el mismo Administrador o un rol específico. |
| **Responsabilidades** | Revisar logs de auditoría; gestionar catálogos; configurar restricciones de acceso; supervisar accesos a datos sensibles |
| **Objetivos** | Garantizar el cumplimiento normativo y la integridad de los datos de la organización |
| **Casos de uso relacionados** | CU-026, CU-027, CU-028, CU-029 |

**Evidencia:** `src/modules/ong/app/modules/governance/types.ts` (GovernanceCapabilityState: canReadAudit, canReadSensitiveAccess, canReadRetention, canManageConstraints)

---

*Documento generado mediante análisis exhaustivo del repositorio Democra. Fecha: 2026-07-09.*
