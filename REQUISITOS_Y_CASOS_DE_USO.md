# 📋 Especificación de Requisitos y Casos de Uso — Democra

Este documento establece la especificación técnica completa de la plataforma **Democra**, abarcando sus módulos de backend Express, frontend React/Vite, arquitectura Monorepo MPA, módulo especializado para ONG y subsistema de seguridad Zero-Trust con Inteligencia Artificial.

---

## 📑 Tabla de Contenidos
1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Requisitos Funcionales (RF)](#2-requisitos-funcionales-rf)
3. [Requisitos No Funcionales (RNF)](#3-requisitos-no-funcionales-rnf)
4. [Matriz de Casos de Uso Exhaustivos (CU)](#4-matriz-de-casos-de-uso-exhaustivos-cu)
5. [Detalle de Casos de Uso](#5-detalle-de-casos-de-uso)

---

## 1. Visión General del Sistema

**Democra** es una plataforma SaaS multi-tenant diseñada para la gestión integral de organizaciones no gubernamentales (ONGs) y entidades comunitarias, potenciada con un motor de seguridad defensivo Zero-Trust y copiloto de IA. La arquitectura está estructurada como un monorepo Multi-Page Application (MPA) unificado en el mismo origen (`same-origin`), desplegado mediante Vercel Serverless Functions y backend Express con Supabase como base de datos y sistema de autenticación.

---

## 2. Requisitos Funcionales (RF)

### 🔒 Autenticación y Seguridad Zero-Trust
- **RF-001 — Autenticación y Gestión de Sesión Supabase**: El sistema debe permitir el inicio de sesión seguro de usuarios utilizando `supabase-js`, compartiendo el token de sesión de forma nativa entre la raíz y subsistemas mediante el `storageKey: 'sb-democra-auth-token'`.
- **RF-002 — Evaluación Dinámica de Riesgo Zero-Trust**: Antes de otorgar acceso o ejecutar acciones críticas, la API (`/api/auth/risk-evaluate`) debe evaluar señales del contexto (IP, User-Agent, huella de dispositivo, país geográfico, horario, comportamiento previo) y responder con una decisión de riesgo (`ALLOW`, `REQUIRE_OTP`, `BLOCK`).
- **RF-003 — Desafíos MFA / OTP Step-Up por Correo Electrónico**: Cuando el motor de riesgo determine `REQUIRE_OTP`, el sistema debe generar un código OTP seguro de 6 dígitos con tiempo de expiración (5 min) y enviarlo vía correo electrónico (Resend API) o exponerlo en modo de prueba local si está configurado.
- **RF-004 — Autenticación por Código de Acceso / Terminal**: En sedes u operaciones presenciales, el sistema debe permitir la autenticación de terminales mediante códigos de canje de 8 caracteres y validación por PIN de seguridad.
- **RF-005 — Auditoría y Log de Eventos de Seguridad**: Todo intento de login, evaluación de riesgo, verificación de OTP y cambio de permisos debe quedar registrado de forma inmutable en la tabla de auditoría (`/api/audit`), incluyendo datos contextuales enmascarados (PII).

### 🏢 Onboarding y Multitenancy
- **RF-006 — Onboarding Idempotente de Organizaciones**: El sistema debe proveer el endpoint `/api/onboarding/bootstrap-tenant` que invoque la función almacenada `fn_bootstrap_tenant` para registrar una nueva organización, su usuario administrador y asignar su plan de subscripción sin duplicar registros.
- **RF-007 — Validación Fiscal de RUC (SUNAT API)**: El endpoint `/api/onboarding/validate-ruc/:ruc` debe consultar la API fiscal de SUNAT (o mock configurado) para validar la existencia del RUC (11 dígitos), devolviendo la razón social, estado contribuyente y condición domiciliaria normalizados.
- **RF-008 — Verificación de Cuenta por Correo Electrónico**: Posterior al bootstrap, el sistema debe generar un token SHA-256 de verificación con expiración de 24 horas y enviar un correo al administrador para confirmar la propiedad del correo.

### 👥 Gestión de Accesos e Identidades (IAM)
- **RF-009 — Gestión de Roles Granulares**: Los administradores deben poder listar, crear, editar y eliminar roles dentro de su tenant (`/api/iam/roles`), especificando nombre, nivel jerárquico y permisos asociados.
- **RF-010 — Permisos y Asignación de Usuarios**: El sistema debe permitir la consulta y modificación de usuarios dentro del tenant (`/api/iam/users`), controlando sus roles activos y verificando permisos granulares (`settings.users.manage`, `settings.roles.manage`).
- **RF-011 — Control de Modificación de Roles de Sistema**: Los roles nativos del sistema (`is_system_role: true`) no deben poder ser eliminados ni despojados de su nivel jerárquico base.

### 💰 Control Financiero y Estado de Tenant
- **RF-012 — Middleware de Acceso por Estado Financiero**: Todas las peticiones HTTP de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) en la API deben pasar por el middleware `requireFinancialWriteAccess()`.
- **RF-013 — Bloqueo de Escritura en Suspensión / Solo Lectura**: Si el tenant se encuentra en estado `FIN-SUSPENDED`, el sistema debe denegar cualquier escritura respondiendo HTTP 403 `FIN-001`. Si está en `FIN-READONLY`, `FIN-INCONSISTENT` o `FIN-PENDING`, responderá 403 `FIN-002` notificando el modo de solo lectura.

### 🏠 Módulo ONG — Operación, Beneficiarios y Programas
- **RF-014 — Gestión de Beneficiarios y Tarjetas de Identificación (Carnets QR)**: Permitir el alta, actualización y consulta de beneficiarios de la ONG, con generación automática de tarjetas de identificación digital con código QR / código de barras para acceso a servicios.
- **RF-015 — Registro de Voluntarios y Solicitud de Admisión**: Proveer un portal público de inscripción para voluntarios con carga de documentos personales y antecedentes.
- **RF-016 — Evaluaciones y Entrevistas de Admisión**: Permitir a los coordinadores agendar entrevistas, registrar puntajes de evaluación y cambiar el estado del postulante (Aprobado, Rechazado, Pendiente de Corrección).
- **RF-017 — Registro de Atenciones Clínicas y Fichas Médicas**: Gestión confidencial de historiales médicos, diagnósticos y atenciones brindadas a beneficiarios con control de roles clínicos.
- **RF-018 — Asistencia y Registro de Horas de Voluntariado**: Permite registrar horas laboradas por voluntarios en proyectos/actividades y su posterior flujo de aprobación por coordinadores de área.
- **RF-019 — Proyectos, Actividades y Asignaciones**: Creación y seguimiento de proyectos sociales, tareas, hitos y asignación de recursos humanos/materiales.
- **RF-020 — Cursos y Programas Académicos**: Gestión de talleres, módulos educativos, matriculación de beneficiarios y registro de calificaciones/asistencia.
- **RF-021 — Inventario, Insumos y Categorías Financieras**: Control de existencias en almacén, entradas/salidas de materiales, alertas de stock mínimo y categorización presupuestaria.
- **RF-022 — Finanzas, Ingresos y Egresos**: Módulo de contabilidad ligera para registro de donaciones, subsidios, comprobantes de pago y balances presupuestarios.
- **RF-023 — Búsqueda Global Multi-Entidad**: Motor de búsqueda transversal en el módulo ONG que busca simultáneamente en beneficiarios, voluntarios, proyectos e inventario.
- **RF-024 — Soft Delete y Recuperación de Registros**: Los registros eliminados en el módulo ONG deben marcarse lógicamente (`deleted_at`) y poder ser inspeccionados y restaurados desde la vista de papelera/recuperación.

### 🤖 Copiloto de IA y Documentación API
- **RF-025 — Copiloto de Seguridad y Explica-Errores**: Integrar el módulo `error-explainer.js` para transformar códigos de error de seguridad (ej. `SEC-429`, `IAM-004`, `TEN-003`) en explicaciones en lenguaje natural con recomendaciones accionables.
- **RF-026 — Documentación Interactiva Swagger UI**: Exponer la especificación OpenAPI v3 en `/api/docs` mediante Swagger UI sin aplicar restricciones de CSP que impidan su renderizado.

---

## 3. Requisitos No Funcionales (RNF)

- **RNF-001 — Arquitectura Monorepo MPA Same-Origin**: La aplicación debe ser unificada en un único monorepo administrado por Vite y Vercel, garantizando que el módulo raíz y el módulo `/ong` compartan el mismo origen HTTP para lectura directa de cookies/tokens de sesión.
- **RNF-002 — StorageKey Unificado Supabase**: Todos los clientes Supabase en frontend y backend deben inicializarse explícitamente con `storageKey: 'sb-democra-auth-token'`.
- **RNF-003 — Cero `package.json` Secundarios**: Ninguna subcarpeta (`/ong` u otras) puede poseer un `package.json` o `node_modules` independiente; la totalidad de dependencias debe residir en la raíz.
- **RNF-004 — Convención Estricta de Minúsculas**: Todas las rutas del navegador y carpetas físicas de módulos deben servirse o mapearse en minúsculas (ej. `/ong/`, `/api/`).
- **RNF-005 — Seguridad en Cabeceras HTTP (Helmet & CSP)**: Aplicar Helmet en Express desactivando la cabecera `X-Powered-By` y configurando Content Security Policy estricto en la API JSON (con excepción controlada en `/api/docs`).
- **RNF-006 — Protección CORS con Allowlist Estricta**: La API debe rechazar orígenes cruzados no explícitamente listados en `ALLOWED_ORIGINS` sin hacer uso de comodines `*`.
- **RNF-007 — Protección contra Fuerza Bruta (Rate Limiting)**: Aplicar limitador general (100 req / 15 min por IP) y limitador de autenticación estricto (5 intentos fallidos / 15 min por IP en `/terminal-login`, `/verify-otp`, `/resend-otp`).
- **RNF-008 — Configuración Segura de Proxy Edge (Trust Proxy)**: Express debe estar configurado con `app.set("trust proxy", 1)` para interpretar adecuadamente la IP real cliente desde el Edge Network de Vercel.
- **RNF-009 — Criptografía Segura (Salt & Pepper)**: El hashing de códigos OTP debe realizarse mediante HMAC SHA-256 combinando código, ID de usuario, ID de tenant y pimienta de servidor (`otpPepper`). La verificación de PIN debe soportar hashes Bcrypt (`$2b$`) y SHA-256 con tiempo constante (`crypto.timingSafeEqual`).
- **RNF-010 — Enmascaramiento de Datos Sensibles en Logs (PII Masking)**: Las IPs registradas en auditoría deben enmascararse (`192.168.1.0` / `2001:db8::`) y los correos deben anonimizarse (`us***@domain.com`).
- **RNF-011 — Cobertura de Pruebas Unitarias e Integración**: El código del backend debe mantener una cobertura superior al 90% en Jest (`npm test`) y el frontend debe ser validado con Vitest (`npm run test:web`).
- **RNF-012 — Adaptabilidad Serverless Vercel**: El archivo `api/server.js` debe exportar la app Express como función serverless sin levantar servidores de puerto local cuando `process.env.VERCEL` esté activo.

---

## 4. Matriz de Casos de Uso Exhaustivos (CU)

| ID | Nombre del Caso de Uso | Módulo / Área | Actor Principal | Nivel de Criticidad |
|---|---|---|---|---|
| **CU-01** | Autenticación y Evaluación Zero-Trust | Seguridad / Auth | Usuario Registrado | Alta |
| **CU-02** | Verificación de Desafío OTP Step-Up | Seguridad / Auth | Usuario Autenticado | Alta |
| **CU-03** | Onboarding de Organización (Bootstrap Tenant) | Onboarding | Administrador de Organización | Alta |
| **CU-04** | Validación Fiscal de RUC (SUNAT) | Onboarding | Sistema / Administrador | Media |
| **CU-05** | Verificación de Cuenta por Correo Electrónico | Onboarding | Usuario Registrado | Media |
| **CU-06** | Administración de Roles Granulares (IAM) | IAM | Tenant Admin | Alta |
| **CU-07** | Control de Escritura por Estado Financiero | Middleware / API | Sistema | Alta |
| **CU-08** | Registro de Beneficiario y Carnet QR | ONG / Beneficiarios | Operador ONG | Media |
| **CU-09** | Postulación Pública de Voluntario | ONG / Voluntariado | Postulante Externo | Media |
| **CU-10** | Evaluación y Entrevista de Admisión | ONG / Voluntariado | Coordinador ONG | Media |
| **CU-11** | Registro y Aprobación de Horas de Voluntariado | ONG / Operaciones | Voluntario / Coordinador | Media |
| **CU-12** | Registro de Atenciones en Ficha Médica | ONG / Clínico | Personal Médico | Alta |
| **CU-13** | Control de Almacén y Movimientos de Insumos | ONG / Inventario | Encargado de Almacén | Media |
| **CU-14** | Gestión de Presupuestos y Comprobantes | ONG / Finanzas | Contador / Administrador | Alta |
| **CU-15** | Consulta de Auditoría y Explicación de Errores | Seguridad / IA | Auditor / Admin | Media |

---

## 5. Detalle de Casos de Uso

---

### CU-01: Autenticación y Evaluación Zero-Trust
- **Actor Principal**: Usuario Registrado.
- **Precondiciones**: Usuario posee cuenta registrada y activa en el sistema.
- **Flujo Principal**:
  1. El usuario envía sus credenciales al endpoint de autenticación.
  2. El frontend invoca `/api/auth/risk-evaluate` enviando token de acceso, IP, User-Agent, huella de dispositivo y país.
  3. El motor de riesgo evalúa el nivel de amenaza considerando ubicaciones inusuales o dispositivos desconocidos.
  4. Si el nivel de riesgo es bajo (`ALLOW`), el sistema emite o valida la sesión activando el acceso a la plataforma.
  5. Se inserta un evento de log de autenticación (`LOGIN_OK`) y auditoría (`RISK_EVALUATE`).
- **Flujo Alternativo 1 (Desafío OTP Requerido)**:
  - En el paso 3, el motor detecta riesgo medio o nuevo dispositivo y responde `REQUIRE_OTP`.
  - El sistema genera un código OTP de 6 dígitos, lo envía por correo y retorna un `challenge_id`.
  - El usuario es redirigido a la pantalla de verificación OTP (ver CU-02).
- **Flujo de Error 1 (Acceso Bloqueado por Seguridad)**:
  - En el paso 3, el motor detecta IP maliciosa o múltiples anomalías y responde `BLOCK`.
  - Se registra el evento `LOGIN_BLOCKED` en auditoría.
  - El sistema responde HTTP 403 con mensaje de error y tiempo de bloqueo.
- **Flujo de Error 2 (Exceso de Intentos / Rate Limit)**:
  - Se superan los 5 intentos fallidos en 15 minutos en `/terminal-login`.
  - El middleware `authLimiter` intercepta la petición y responde HTTP 429 `SEC-429-AUTH`.

---

### CU-02: Verificación de Desafío OTP Step-Up
- **Actor Principal**: Usuario Autenticado en proceso Step-Up.
- **Precondiciones**: Se ha generado previamente un `challenge_id` válido en el flujo de riesgo.
- **Flujo Principal**:
  1. El usuario ingresa el código de 6 dígitos recibido en su correo y presiona "Verificar".
  2. El frontend envía `POST /api/auth/step-up/verify-otp` con `challenge_id`, `tenant_id` y `code`.
  3. El backend calcula `hashOtp({ code, userId, tenantId })` y lo compara de manera constante contra el hash guardado en el desafío.
  4. Si coincide y no ha expirado (5 min), el desafío se marca como verificado y se retorna la sesión activada.
  5. Se registra el evento de seguridad `MFA_STEP_UP_SUCCESS`.
- **Flujo Alternativo 1 (Reenvío de Código OTP)**:
  1. El usuario solicita reenviar el código mediante `POST /api/auth/step-up/resend-otp`.
  2. El sistema verifica que no se exceda la cuota de reenvíos, invalida el desafío anterior, genera un nuevo OTP y lo despacha.
- **Flujo de Error 1 (Código OTP Incorrecto)**:
  - En el paso 3, el hash no coincide.
  - Se incrementa el contador de intentos fallidos del desafío.
  - Se registra el evento `MFA_STEP_UP_FAIL` y se devuelve HTTP 400.
- **Flujo de Error 2 (Desafío Expirado)**:
  - Transcurrieron más de 5 minutos desde la emisión.
  - El backend invalida el desafío y responde HTTP 400 obligando a reiniciar la autenticación.

---

### CU-03: Onboarding de Organización (Bootstrap Tenant)
- **Actor Principal**: Administrador de Organización Nueva.
- **Precondiciones**: Usuario autenticado en Supabase Auth pero sin tenant asignado.
- **Flujo Principal**:
  1. El usuario completa el formulario de registro de organización con nombre, RUC (11 dígitos), tipo de industria, plan deseado y día de facturación.
  2. El frontend envía `POST /api/onboarding/bootstrap-tenant`.
  3. El backend valida el formato del RUC de 11 dígitos y campos requeridos.
  4. Se invoca la función almacenada de Supabase `fn_bootstrap_tenant` con los parámetros sanitizados.
  5. La base de datos crea la fila en `tenants`, asigna al usuario como `tenant_admin` y devuelve el `tenant_id`.
  6. El sistema dispara asincrónicamente el envío del correo de verificación de cuenta mediante `issueVerificationEmail()`.
  7. El backend responde HTTP 201 con `{ tenant_id }`.
- **Flujo Alternativo 1 (Tenant Ya Existente / Idempotencia)**:
  - Si el usuario ya posee un tenant creado previamente, la RPC `fn_bootstrap_tenant` devuelve el `tenant_id` existente sin duplicar registros.
- **Flujo de Error 1 (RUC de 11 dígitos inválido)**:
  - En el paso 3, el RUC no cumple con `/^\d{11}$/`.
  - El backend retorna HTTP 400 con código `TEN-001`.
- **Flujo de Error 2 (Fallo de Proveedor de Correo en Verificación)**:
  - Si la API de Resend experimenta una caída durante el paso 6, el error es capturado por la envoltura `try/catch` defensiva de `issueVerificationEmail`.
  - El proceso de bootstrap **no se cancela** y se devuelve el HTTP 201 exitoso, permitiendo reenviar el correo posteriormente.

---

### CU-04: Validación Fiscal de RUC (SUNAT)
- **Actor Principal**: Sistema / Administrador de Organización.
- **Precondiciones**: RUC de 11 dígitos proporcionado.
- **Flujo Principal**:
  1. El cliente invoca `GET /api/onboarding/validate-ruc/:ruc`.
  2. El backend valida el formato sintáctico del RUC.
  3. Se construye la URL de la API externa de RUC configurada en `config.rucApiUrl`.
  4. Se realiza la petición `fetch` adjuntando las cabeceras de autorización y API Key.
  5. Se analiza la respuesta JSON de la API fiscal y se normaliza el payload extraendo `tax_id`, `tenant_name` (razón social), `estado` y `condicion`.
  6. El backend responde HTTP 200 con el objeto de datos normalizados.
- **Flujo de Error 1 (Servicio Fiscal No Configurado)**:
  - `config.rucApiUrl` o `config.rucApiToken` están ausentes en `.env`.
  - El backend responde HTTP 503 `TEN-001` notificando que la validación fiscal está deshabilitada temporalmente.
- **Flujo de Error 2 (RUC No Encontrado en SUNAT)**:
  - La API externa responde HTTP 404.
  - El backend responde HTTP 404 `TEN-001` con mensaje "RUC no encontrado en padrón fiscal".

---

### CU-05: Verificación de Cuenta por Correo Electrónico
- **Actor Principal**: Usuario Registrado.
- **Precondiciones**: Se ha enviado previamente el correo con el enlace de verificación.
- **Flujo Principal**:
  1. El usuario hace clic en el enlace `https://democra.pro/api/onboarding/verify-email?uid=...&token=...` en su cliente de correo.
  2. La petición GET llega al servidor backend de Democra.
  3. El backend obtiene el perfil del usuario mediante `serviceClient.from("profiles")`.
  4. Se calcula el SHA-256 del token recibido y se compara contra `verify_token_hash`.
  5. Se comprueba que la fecha actual sea menor que `verify_token_expires_at` (24 horas de vigencia).
  6. El backend actualiza `email_verified = true` en la base de datos.
  7. El servidor realiza una redirección HTTP 302 hacia `/login?verified=1`.
- **Flujo Alternativo 1 (Cuenta Ya Verificada)**:
  - En el paso 4, el perfil ya indica `email_verified: true`.
  - Se redirige inmediatamente HTTP 302 a `/login?verified=1` sin arrojar error.
- **Flujo de Error 1 (Token Inválido o Expirado)**:
  - En los pasos 4-5, el token no coincide o expiró.
  - El servidor redirige HTTP 302 hacia `/login?verified=0` indicando fallo de verificación.

---

### CU-06: Administración de Roles Granulares (IAM)
- **Actor Principal**: Administrador de Tenant (`tenant_admin`).
- **Precondiciones**: Usuario posee rol de administrador o permiso `settings.roles.manage`.
- **Flujo Principal**:
  1. El administrador envía `POST /api/iam/roles` con el nombre y nivel jerárquico del nuevo rol.
  2. El middleware `requireFinancialWriteAccess()` verifica que el tenant no esté suspendido financieramente.
  3. El backend invoca `resolveIamContext()` validando que el usuario tenga la facultad `canManageRoles`.
  4. Se realiza la inserción en la tabla `roles` asociada al `tenant_id` mediante `serviceClient`.
  5. El backend responde HTTP 201 con la estructura del rol creado.
- **Flujo de Error 1 (Permiso Insuficiente)**:
  - El usuario intenta crear un rol sin tener `settings.roles.manage`.
  - El backend responde HTTP 403 `IAM-003`.
- **Flujo de Error 2 (Tenant Suspendido Financieramente)**:
  - El tenant posee `status_financial_id: 'FIN-SUSPENDED'`.
  - El middleware intercepta la llamada y responde HTTP 403 `FIN-001` impidiendo la creación del rol.

---

### CU-07: Control de Escritura por Estado Financiero
- **Actor Principal**: Middleware del Sistema.
- **Precondiciones**: Petición de modificación (`POST`, `PUT`, `PATCH`, `DELETE`) entrante en cualquier endpoint protegido de la API.
- **Flujo Principal**:
  1. El middleware `requireFinancialWriteAccess()` intercepta la solicitud HTTP.
  2. Si el método HTTP es `GET` u `OPTIONS`, la petición continúa inmediatamente (`next()`).
  3. Se resuelve el token de sesión y se obtiene el `tenant_id` del contexto del usuario.
  4. Se consulta el estado financiero del tenant en la tabla `tenants`.
  5. Si el estado es `FIN-ACTIVE`, se permite el paso al handler de la ruta (`next()`).
- **Flujo de Error 1 (Tenant Suspendido - Bloqueo Estricto)**:
  - El estado financiero es `FIN-SUSPENDED`.
  - Se retorna HTTP 403 con `error_code: "FIN-001"`, bloqueando cualquier mutación de datos.
- **Flujo de Error 2 (Modo Solo Lectura - Modo Temporal)**:
  - El estado financiero es `FIN-READONLY`, `FIN-INCONSISTENT` o `FIN-PENDING`.
  - Se retorna HTTP 403 con `error_code: "FIN-002"` notificando que el tenant está temporalmente congelado para escrituras.

---

### CU-08: Registro de Beneficiario y Carnet QR (Módulo ONG)
- **Actor Principal**: Operador de la ONG.
- **Precondiciones**: Usuario con rol de trabajador social o administrador en el módulo ONG.
- **Flujo Principal**:
  1. El operador completa la ficha del beneficiario (nombres, apellidos, documento de identidad, fecha de nacimiento, grupo familiar y categoría social).
  2. El sistema guarda la información en la base de datos asociada al `tenant_id` del módulo ONG.
  3. El sistema genera un código único de identificación y renderiza la tarjeta digital con un código QR firmado y código de barras.
  4. El carnet queda disponible para previsualización, impresión o descarga en PDF.
- **Flujo Alternativo 1 (Actualización de Ficha de Beneficiario)**:
  - El operador modifica la información de contacto o categoría social del beneficiario. El carnet QR mantiene su identificador único.
- **Flujo de Error 1 (Documento de Identidad Duplicado)**:
  - Se intenta registrar un número de documento que ya pertenece a otro beneficiario activo en el tenant.
  - El sistema muestra una alerta de duplicidad impidiendo el registro.

---

### CU-09: Postulación Pública de Voluntario (Módulo ONG)
- **Actor Principal**: Postulante Externo.
- **Precondiciones**: Formulario público de voluntariado accesible en la web de la ONG.
- **Flujo Principal**:
  1. El postulante ingresa sus datos personales, disponibilidad de tiempo, áreas de interés (ej. educación, salud, logística) y adjunta su CV y antecedente policial en PDF.
  2. El frontend valida que los archivos no superen el límite de tamaño (5MB) ni formatos no permitidos.
  3. Al enviar, la solicitud ingresa a la tabla `voluntarios_postulaciones` con estado `PENDIENTE_REVISION`.
  4. El postulante recibe un mensaje en pantalla confirmando la recepción de su postulación.
- **Flujo de Error 1 (Archivo Adjunto Excede Tamaño Máximo)**:
  - El postulante adjunta un documento de 10MB.
  - El validador del frontend detiene el envío y muestra un mensaje explicativo.

---

### CU-10: Evaluación y Entrevista de Admisión
- **Actor Principal**: Coordinador de Voluntariado de la ONG.
- **Precondiciones**: Existen solicitudes de voluntariado en estado `PENDIENTE_REVISION`.
- **Flujo Principal**:
  1. El coordinador revisa la lista de postulantes y abre el expediente de un candidato.
  2. Agenda fecha y hora para entrevista de admisión presencial o virtual.
  3. Concluida la entrevista, el coordinador registra la calificación de competencias y añade notas de la entrevista.
  4. Selecciona la decisión de admisión (`APROBADO`).
  5. El sistema cambia el estado del postulante a `VOLUNTARIO_ACTIVO` y le asigna sus credenciales de acceso iniciales.
- **Flujo Alternativo 1 (Rechazo de Candidato)**:
  - En el paso 4, la decisión es `RECHAZADO`. El expediente cambia de estado indicando el motivo de no admisión.
- **Flujo Alternativo 2 (Solicitud de Corrección Documentaria)**:
  - Falta un documento legible. El estado cambia a `REQUIERE_DOCUMENTACION`, enviando una notificación al postulante.

---

### CU-11: Registro y Aprobación de Horas de Voluntariado
- **Actor Principal**: Voluntario / Coordinador de Operaciones.
- **Precondiciones**: Voluntario activo asignado a un proyecto o actividad comunitaria.
- **Flujo Principal**:
  1. El voluntario ingresa al módulo `/ong`, selecciona el proyecto y registra las horas trabajadas en una fecha determinada con la descripción de la labor.
  2. La solicitud de horas queda registrada con estado `PENDIENTE_APROBACION`.
  3. El coordinador de operaciones ingresa al panel de aprobación de horas (`/ong/horas-aprobacion`).
  4. Revisa el detalle de las horas registradas por el equipo y hace clic en "Aprobar".
  5. El sistema actualiza el estado a `APROBADO` y suma las horas al saldo acumulado del voluntario para su certificado.
- **Flujo Alternativo 1 (Aprobación Masiva por Lote)**:
  - El coordinador selecciona múltiples registros de horas y aplica la aprobación en un solo clic.
- **Flujo de Error 1 (Rechazo de Registro de Horas)**:
  - El coordinador detecta inconsistencia en las horas reportadas y selecciona "Rechazar" indicando la observación para corrección.

---

### CU-12: Registro de Atenciones en Ficha Médica (Módulo ONG)
- **Actor Principal**: Personal Médico / Clínico de la ONG.
- **Precondiciones**: Usuario autenticado con rol clínico y permisos para el subsistema de salud de la ONG.
- **Flujo Principal**:
  1. El profesional de la salud selecciona un beneficiario e ingresa a su Ficha Médica (`/ong/medico`).
  2. Registra la atención médica: motivo de consulta, funciones vitales, diagnóstico (CIE-10/texto), tratamiento prescrito y observaciones.
  3. Guarda la atención. La información es almacenada con cifrado de campo sensible en la base de datos.
  4. La atención se suma al historial clínico inmutable del beneficiario.
- **Flujo de Error 1 (Intento de Acceso por Usuario No Clínico)**:
  - Un usuario con rol administrativo general intenta abrir la ficha médica detallada de un beneficiario.
  - El sistema bloquea el acceso respondiendo HTTP 403 `IAM-003` por ser información de salud confidencial.

---

### CU-13: Control de Almacén y Movimientos de Insumos
- **Actor Principal**: Encargado de Almacén de la ONG.
- **Precondiciones**: Artículos y categorías registradas previamente en el inventario.
- **Flujo Principal**:
  1. El encargado de almacén registra una salida de bienes (ej. entrega de kits alimentarios o medicinas a un proyecto social).
  2. Especifica la cantidad, proyecto destino y responsable de la recepción.
  3. El sistema deduce la cantidad del stock disponible en la tabla `inventario`.
  4. Si el nuevo stock es menor o igual al `stock_minimo`, el sistema genera automáticamente una alerta visual de reposición.
- **Flujo de Error 1 (Stock Insuficiente para Salida)**:
  - Se intenta registrar la salida de 50 kits cuando solo existen 20 en almacén.
  - El sistema rechaza la transacción mostrando el mensaje "Stock insuficiente para realizar el despacho".

---

### CU-14: Gestión de Presupuestos y Comprobantes Financieros
- **Actor Principal**: Contador / Administrador Financiero de la ONG.
- **Precondiciones**: Tenant con estado financiero activo (`FIN-ACTIVE`).
- **Flujo Principal**:
  1. El administrador ingresa a `/ong/finanzas` y selecciona "Nuevo Registro de Escribir Gasto/Ingreso".
  2. Ingresa el concepto, monto, categoría presupuestaria, tipo de comprobante (factura, boleta, recibo) y adjunta la imagen/PDF del comprobante.
  3. El sistema valida la información y registra el movimiento financiero actualizando el balance del proyecto asignado.
- **Flujo de Error 1 (Bloqueo de Registro por Suspensión Financiera)**:
  - El tenant está suspendido (`FIN-SUSPENDED`).
  - Al presionar guardar, el middleware `requireFinancialWriteAccess()` bloquea la llamada notificando el estado suspendido.

---

### CU-15: Consulta de Auditoría y Explicación de Errores con IA
- **Actor Principal**: Auditor de Seguridad / Administrador.
- **Precondiciones**: Usuario con credenciales de auditoría.
- **Flujo Principal**:
  1. El auditor ingresa a `/api/audit/logs` para examinar el historial de eventos del tenant.
  2. Filtra por criticidad (`HIGH`, `MEDIUM`), tipo de evento (`RISK_EVALUATE`, `LOGIN_BLOCKED`) o rango de fechas.
  3. Al hacer clic en un evento con código de error de seguridad (ej. `SEC-429-AUTH` o `TEN-003`), el módulo `error-explainer.js` presenta la explicación clara en lenguaje natural del motivo del error y las medidas correctivas sugeridas.
  4. Se visualiza la IP enmascarada y el agente de usuario sanitizado para trazabilidad forense.

---

## 6. Resumen de Cumplimiento Técnico

Esta especificación de requisitos y casos de uso cumple de forma estricta con las **Reglas de desarrollo — Democra**, garantizando la mantenibilidad, seguridad y trazabilidad completa del monorepo.
