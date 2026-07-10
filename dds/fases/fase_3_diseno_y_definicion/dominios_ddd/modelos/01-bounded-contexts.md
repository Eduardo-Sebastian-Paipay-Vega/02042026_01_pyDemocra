# Bounded Contexts (DDD)
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

Democra está diseñado en torno a distintos subdominios lógicos, cada uno encapsulando una parte específica de la lógica de negocio y compartiendo modelos bien definidos. A continuación se definen los Bounded Contexts del sistema:

## 1. Identity & Access (IAM) Context
- **Responsabilidad:** Gestionar la identidad corporativa, roles, permisos y el control de acceso geográfico o jerárquico.
- **Entidades Clave:** `Tenant`, `Profile`, `Role`, `Permission`, `UserRoleSede`, `Session`, `Device`, `Terminal`, `MfaChallenge`.
- **Valor de Negocio:** Garantiza el aislamiento estricto (multi-tenancy) y asegura que las personas correctas accedan a los datos correctos según su nivel jerárquico.
- **Lenguaje Ubicuo:** *Tenant (Organización), Hierarchy Level, Soft Delete, Bootstrap.*

## 2. Security & Risk Context
- **Responsabilidad:** Evaluar continuamente amenazas durante la autenticación y reaccionar a ellas.
- **Entidades Clave:** `RiskEngine` (Logic), `AuthEvent`, `AuditLog`.
- **Valor de Negocio:** Protege la plataforma contra ataques automatizados, fuerza bruta o accesos desde ubicaciones inusuales, invocando Step-Up MFA dinámicamente.
- **Lenguaje Ubicuo:** *Risk Score, Step-Up MFA, Terminal PIN, Rate Limiting.*

## 3. ACE (Access & Context Engine) Context
- **Responsabilidad:** Proveer un motor de control de acceso ultra-granular basado en contexto, suplementario al IAM tradicional.
- **Entidades Clave:** `AccessLink`, `Membership`, `DynamicForm`, `RoleModuleAccess`, `RoleFieldPermission`.
- **Valor de Negocio:** Permite definir reglas complejas como "El voluntario solo puede ver el campo 'teléfono' de otros miembros de su mismo proyecto".
- **Lenguaje Ubicuo:** *Contextual Access, Dynamic Form, Slugs.*

## 4. People Context
- **Responsabilidad:** Gestionar el ciclo de vida de los colaboradores y la población impactada.
- **Entidades Clave:** `VolunteerProfile`, `BeneficiaryProfile`, `MedicalProfile`, `Skill`, `Document`, `IdCardTemplate`.
- **Valor de Negocio:** Centraliza la información del talento humano de la ONG y los beneficiarios de la ayuda social, con salvaguardas para datos sensibles.
- **Lenguaje Ubicuo:** *Voluntario, Beneficiario Infantil, Beneficiario Adulto Mayor, Carnet Digital con QR.*

## 5. Admission Context
- **Responsabilidad:** Orquestar el flujo de selección e incorporación de nuevos candidatos a voluntarios.
- **Entidades Clave:** `AdmissionRequest`, `AdmissionInterview`, `OnboardingStep`, `RegistrationCode`.
- **Valor de Negocio:** Digitaliza y audita el proceso de reclutamiento, desde el autoregistro hasta la conversión final en voluntario activo.
- **Lenguaje Ubicuo:** *Autoregistro, Cupo Máximo, Código Expira, Entrevista, Conversión.*

## 6. Projects & Operations Context
- **Responsabilidad:** Planificar la ejecución y medir el esfuerzo de campo.
- **Entidades Clave:** `Project`, `Task`, `Activity`, `Assignment`, `HourRecord`, `Evidence`.
- **Valor de Negocio:** Permite cuantificar el impacto de la ONG, registrando cuántas horas de trabajo se invirtieron en qué tareas específicas y guardando evidencia visual.
- **Lenguaje Ubicuo:** *Proyecto, Tarea, Actividad, Horas Efectivas, Evidencia de Campo.*

## 7. Resources Context
- **Responsabilidad:** Controlar los bienes materiales y financieros.
- **Entidades Clave:** `InventoryItem`, `InventoryLocation`, `InventoryMovement`, `FinancialAccount`, `FinancialCategory`, `FinancialTransaction`.
- **Valor de Negocio:** Evita la pérdida o mal uso de fondos y suministros, manteniendo un kardex histórico y un flujo de aprobaciones para egresos.
- **Lenguaje Ubicuo:** *Kardex, Stock Derivado, Flujo de Aprobación, Egreso, Ingreso.*

## 8. Notifications Context
- **Responsabilidad:** Gestionar la comunicación automatizada.
- **Entidades Clave:** `NotificationTemplate`, `NotificationHistory`.
- **Valor de Negocio:** Mantiene informados a los usuarios sobre cambios de estado y requerimientos de acción.
- **Lenguaje Ubicuo:** *Plantilla, Canal (Email), Historial de Envío.*

## 9. Governance Context
- **Responsabilidad:** Vigilar el cumplimiento normativo y la integridad histórica de los datos.
- **Entidades Clave:** `AuditLog`, `Catalog`, `RoleAccessConstraint`, `SensitiveAccessLog`, `RetentionPolicy`.
- **Valor de Negocio:** Provee reportes inmutables y trazables para auditores internos y externos o donantes.
- **Lenguaje Ubicuo:** *Auditoría Forense, Triggers Universales, Registro Sensible, Retención.*
