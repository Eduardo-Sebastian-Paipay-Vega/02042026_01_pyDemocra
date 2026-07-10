# Reglas de Negocio del Sistema
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09
> **ESTADO SSOT (Single Source of Truth):** *Documento Maestro*

---

El comportamiento del sistema Democra está estrictamente regulado por las siguientes 15 reglas de negocio inmutables, implementadas y validadas a nivel de base de datos o lógica backend de bajo nivel.

| ID | Nombre | Descripción y Restricción | Evidencia Técnica |
|----|--------|---------------------------|-------------------|
| **RN-001** | Aislamiento de Tenant | Todas las tablas de negocio deben incluir `tenant_id`. Las políticas RLS restringen operaciones DML/DQL cruzando este valor con `fn_current_tenant_id()`. Ningún usuario (salvo superadmin del SaaS) cruza esta frontera. | `auth_events.tenant_id`, RLS Policies. |
| **RN-002** | Validación RUC SUNAT | Durante el onboarding, la organización debe ingresar un RUC que, consultado en la API SUNAT, retorne estado "ACTIVO" y condición "HABIDO". RUCs inactivos, dados de baja o de baja de oficio son bloqueados. | `server/routes/onboarding.js` (validación API externa). |
| **RN-003** | Bootstrap Idempotente | El proceso de inicialización de un nuevo tenant (creación de roles por defecto, superadmin, sede inicial) debe ser idempotente. Si se invoca sobre un RUC ya procesado, devuelve éxito con el tenant existente sin corromper datos. | Transacción ACID en `onboarding.js`. |
| **RN-004** | Inmutabilidad de Roles del Sistema | Los roles creados en el bootstrap inicial que posean el flag `is_system_role = true` (ej. SUPER_ADMIN, VOLUNTEER_DEFAULT) no pueden ser eliminados ni renombrados, asegurando la supervivencia del tenant. | Endpoint `DELETE /api/iam/roles/:roleId`. |
| **RN-005** | PIN de Terminal No Reversible | Los códigos PIN utilizados para iniciar sesión en terminales estáticas nunca se guardan en texto plano. Obligatoriamente se hashean utilizando `bcrypt`. | `server/routes/auth.js` (generación y comparación con bcrypt). |
| **RN-006** | Bloqueo por Fallos de PIN | Tras exceder el número máximo de intentos fallidos consecutivos de PIN (MAX_PIN_ATTEMPTS), el acceso por terminal queda bloqueado por una cantidad de minutos (PIN_BLOCK_MINUTES). | `server/config.js` y `auth.js`. |
| **RN-007** | OTP Seguro y Volátil | Los códigos OTP numéricos de 6 dígitos se guardan en base de datos como un hash HMAC-SHA256 (con Pepper del lado del servidor). Tienen un tiempo de vida (TTL) corto, configurado en `MFA_CHALLENGE_EXPIRES_IN_MINUTES`. | `mfa_challenges` table, config HMAC. |
| **RN-008** | Integridad Referencial por Soft Delete | Registros organizativos críticos como las "Sedes" no pueden eliminarse físicamente (DELETE) para preservar el historial. Deben ocultarse usando `is_active = false` (Soft Delete). | Endpoint de sedes (lógica `is_active: false`). |
| **RN-009** | Jerarquía Estricta de IAM | Un usuario solo puede crear, modificar o asignar roles que posean un `hierarchy_level` estrictamente menor que el nivel jerárquico más alto que dicho usuario posea actualmente en su propio perfil. | Validación de `hierarchy_level` en IAM. |
| **RN-010** | Justificación Obligatoria de Datos Médicos | El acceso de lectura o escritura a los perfiles que contienen datos médicos o de salud sensibles (e.g. alergias, tipo de sangre, discapacidades) debe registrar obligatoriamente un *motivo* (reason) en `sensitive_access_logs`. | Triggers de tabla en esquema médico / logs forenses. |
| **RN-011** | Autolimitación de Códigos de Acceso | Los enlaces o códigos generados para el autoregistro público (AdmissionRegistrationCode) tienen un cupo máximo estricto de usos (`maxUses`) y una fecha de expiración obligatoria (`expiresAt`). | Tabla `AdmissionRegistrationCodeRow`. |
| **RN-012** | Desactivación por Consumo Total | Una vez que un código de autoregistro es utilizado satisfactoriamente, se incrementa su contador (`currentUses`). Si alcanza el `maxUses`, el código se invalida automáticamente para futuros candidatos. | Edge function / Backend logic de consumo. |
| **RN-013** | Transición Lineal de Admisión | Una solicitud de admisión sigue una máquina de estados finita (FSM). No puede pasar a "aprobada" sin pasar antes por el estado intermedio ("en_entrevista" u otro definido en la configuración). | Tipos y FSM en `admission/types.ts`. |
| **RN-014** | Workflow de Aprobación de Egresos | Toda transacción financiera catalogada como `EGRESO` nace con un estado de aprobación `pending`. No impacta el saldo consolidado oficial hasta ser pasada a estado `approved` por un usuario con permisos financieros superiores. | Transacciones y `FinancialEgresoResolutionInput`. |
| **RN-015** | Step-Up Contextual Automático | Si el Motor de Riesgo detecta un contexto de acceso anormal (riesgo `MEDIUM`), el flujo de login se detiene y se exige forzosamente resolver un desafío `REQUIRE_OTP` antes de emitir el token de sesión final (Step-Up authentication). | Motor `server/security/risk-engine.js`. |
