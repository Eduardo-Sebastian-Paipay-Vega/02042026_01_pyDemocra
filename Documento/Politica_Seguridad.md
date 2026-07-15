# Política de Gobernanza y Seguridad de la Información (SGSI)

## Análisis de Brechas y Diagnóstico Inicial

Tras una revisión exhaustiva de la arquitectura del repositorio de código y el esquema de base de datos (`Supabase Snippet Untitled query`), se ha llevado a cabo un análisis de brechas (Gap Analysis) frente a marcos normativos internacionales como ISO/IEC 27001, NIST SP 800-53 y OWASP Top 10. 

**Fortalezas Identificadas:**
1. **Aislamiento de Inquilinos (Multi-Tenant Isolation):** La arquitectura utiliza de forma robusta políticas RLS (Row-Level Security) apoyadas en el identificador único del inquilino (`fn_current_tenant_id()`), previniendo la contaminación cruzada de datos.
2. **Motor de Riesgos Adaptativo (Risk Engine):** Existe un flujo avanzado que evalúa anomalías transaccionales (por IP o huella de dispositivo) imponiendo desafíos OTP o bloqueos temporales (`TEMP_BLOCK`), alineado al principio de Confianza Cero (Zero Trust).
3. **Auditoría Nativa Continua:** El uso del disparador `fn_trigger_audit_universal` a nivel transaccional para operaciones DML garantiza la integridad forense sin depender exclusivamente de la capa de aplicación.

**Oportunidades de Consolidación Normativa (Desfases a Corregir):**
- Ausencia de un marco documental formal que dicte las políticas, responsabilidades y el ciclo de vida de cada control tecnológico.
- Necesidad de formalizar la Matriz de Control de Acceso Basado en Roles (RBAC) bajo el principio de "Denegación por Defecto".
- Carencia de directrices procedimentales documentadas para el tratamiento de datos altamente sensibles (PII) durante auditorías o incidentes de ciberseguridad.

Para solventar estos desfases, el presente documento establece el marco normativo obligatorio que rige el Sistema de Gestión de Seguridad de la Información (SGSI) para la plataforma.

---

## Capítulo 1: Marco de Gobernanza y Seguridad del Sistema

### 1.1 Objetivo y Alcance
**Objetivo:** Establecer los controles organizacionales y técnicos para salvaguardar la confidencialidad, integridad y disponibilidad de la información gestionada a través de la plataforma, garantizando que el diseño arquitectónico de bases de datos y la capa de servicios cumplan con regulaciones globales de protección de datos personales.
**Alcance:** Esta política aplica a todos los servicios en la nube, infraestructura de base de datos (PostgreSQL/Supabase), motores de riesgo, microservicios de aplicación, y a todo el personal (desarrolladores, administradores y operadores) que interactúe directa o indirectamente con entornos productivos.

### 1.2 Responsabilidades de Gobernanza
- **Oficial de Seguridad de la Información (CISO) / Líder de Arquitectura:** Responsable de validar, aprobar y auditar semestralmente el cumplimiento estricto de los modelos RLS, RBAC y el umbral del Risk Engine.
- **Ingenieros de Bases de Datos y Backend (DevSecOps):** Responsables de implementar, mantener y parchear los perfiles de Supabase y las políticas transaccionales sin degradar la postura de "Denegación por Defecto".

### 1.3 Clasificación y Tratamiento de la Información
La información contenida en los múltiples esquemas de la base de datos (ej. `academico`, `auditoria`, `auth`, `finanzas`, `rrhh`) se clasifica en tres niveles:
1. **Confidencial (Nivel 3):** Datos PII (ej. Documentos de identidad, datos en `clinico`, `rrhh`), credenciales, hashes de OTP, logs de auditoría forense y secretos criptográficos almacenados en el esquema `vault`.
2. **Uso Interno (Nivel 2):** Configuraciones operativas, políticas de catálogos (`cat_permissions`, `cat_industry_types`) y trazabilidad de sesiones genéricas (`sessions`).
3. **Pública (Nivel 1):** Datos que, por diseño de la aplicación, están destinados a la visibilidad pública o no contienen información sensible (ej. catálogos de estado civil estándar).

---

## Capítulo 2: Política de Seguridad y Control de Acceso en la Base de Datos (Supabase)

### 2.1 Aislamiento de Datos Multi-Inquilino (RLS y Multi-Schema)
**Objetivo:** Evitar, por diseño criptográfico y lógico, la exposición de datos inter-inquilino (Cross-Tenant Data Leakage), garantizando que ningún inquilino (Tenant) pueda consultar o alterar registros que no le pertenezcan.
**Directrices Normativas:**
1. **Aplicación Universal de Row-Level Security (RLS):** Absolutamente todas las tablas de datos transaccionales, sin excepción, deben habilitar RLS (`ALTER TABLE [nombre] ENABLE ROW LEVEL SECURITY`).
2. **Función Inyectora de Identidad (Identity Assertion):** Todas las políticas deben utilizar obligatoriamente la función `fn_current_tenant_id()` para resolver el `tenant_id` del usuario autenticado actual, cruzándolo contra la tabla transaccional subyacente (`tenant_id = public.fn_current_tenant_id()`).
3. **Prohibición de Omisiones (Bypassing):** Queda estrictamente prohibido el uso de la directiva `WITH CHECK (true)` u omisiones lógicas en tablas de información de perfiles o autorizaciones. Las reglas de validación en operaciones de Inserción o Modificación (UPDATE/INSERT) deben forzar una aserción estricta de propiedad de inquilino.

### 2.2 Control de Acceso Basado en Roles (RBAC) y Principio de Mínimo Privilegio
**Objetivo:** Garantizar que los usuarios autenticados únicamente dispongan de los privilegios estrictamente necesarios para el desempeño de sus labores (PoLP - Principle of Least Privilege).
**Directrices Normativas:**
1. **Denegación por Defecto:** Las tablas estructurales del modelo RBAC (ej. `user_roles_sedes`) deben revocar todo acceso por defecto y autorizar lectura o escritura únicamente mediante funciones deterministas como `fn_has_permission(...)` o `fn_is_tenant_admin()`.
2. **Restricción de Catálogos del Sistema:** Los catálogos estáticos (ej. `cat_permissions`, `cat_industry_types`) deberán mantenerse en estado de Solo Lectura para los usuarios autenticados, denegando sistemáticamente cualquier petición de inserción, borrado o modificación mediante reglas RLS explícitas (ej. `USING (false) WITH CHECK (false)`).

---

## Capítulo 3: Gestión de Identidades, Autenticación y Motor de Riesgo Continuo

### 3.1 Política de Autenticación Fuerte y Factores Múltiples (MFA)
**Objetivo:** Proteger el acceso a la plataforma contra ataques de suplantación, fuerza bruta y robo de credenciales, exigiendo factores adicionales ante comportamientos anómalos o de alto riesgo transaccional.
**Directrices Normativas:**
1. **Umbrales del Risk Engine:** Todo acceso al sistema será supervisado por un motor de riesgos continuo (`evaluateRiskEngine`) que evaluará señales como la huella del dispositivo, la dirección IP (`device_fingerprint`, `ip`) y anomalías geográficas.
2. **Desafíos Step-Up (REQUIRE_OTP):** Si el motor de riesgo detecta una huella de dispositivo desconocida o una IP inusual (`NEW_DEVICE`, `NEW_IP`), el sistema declinará la autorización (`decision: "REQUIRE_OTP"`) forzando la creación y verificación de un desafío OTP de un solo uso con ciclo de vida corto y validación de hash criptográfico (`hashOtp`).
3. **Bloqueos Temporales por Abuso:** En caso de superar el umbral máximo de intentos de PIN/OTP predefinido en la configuración del sistema, se ejecutará un bloqueo de seguridad restrictivo (`TEMP_BLOCK` o `PIN_ATTEMPTS_EXCEEDED`) modificando temporalmente los umbrales de acceso en la base de datos subyacente.

---

## Capítulo 4: Auditoría, Monitoreo y Trazabilidad Continua

### 4.1 Política de Trazabilidad y Logs Forenses Inmutables
**Objetivo:** Proveer una pista de auditoría forense y no repudiable que cumpla con los estándares legales aplicables.
**Directrices Normativas:**
1. **Auditoría Transaccional Profunda:** Toda tabla catalogada con datos Sensibles o Financieros deberá tener asociado el disparador universal de auditoría (`tr_audit_...` llamando a `fn_trigger_audit_universal`).
2. **Integridad del Evento:** Cada registro insertado, modificado o eliminado almacenará, como mínimo, el identificador del usuario responsable, el inquilino afectado, la marca de tiempo (timestamp) en formato UTC, y la carga útil estructurada (JSONB) del cambio (old_state / new_state).
3. **Restricciones DML contra el Log:** Queda absolutamente prohibido que roles transaccionales regulares modifiquen o alteren las tablas del esquema `auditoria`. Únicamente roles de nivel `service_role` o perfiles forenses autorizados tendrán permisos restringidos sobre estas métricas.

---

## Referencias Bibliográficas
1. **ISO/IEC 27001:2022:** Sistemas de Gestión de la Seguridad de la Información - Controles de Acceso y Gestión de Riesgos.
2. **NIST SP 800-53 (Rev. 5):** Security and Privacy Controls for Information Systems and Organizations.
3. **OWASP Top 10 (2021):** A01:2021-Broken Access Control & A07:2021-Identification and Authentication Failures.
4. **Cloud Security Alliance (CSA):** Enterprise Architecture and Cloud Security Guidance v4.0.
5. **Arquitectura y Migraciones (Interno):** Repositorio del proyecto, `Supabase Snippet Untitled query.csv` y rutinas documentadas bajo el motor `risk-engine.js`.
