# Actores del Sistema
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

---

## 1. Catálogo de Actores

El siguiente catálogo define todos los actores identificados (humanos y sistémicos) que interactúan con Democra.

| ID | Nombre | Tipo | Descripción y Permisos Principales |
|----|--------|------|-------------------------------------|
| **ACT-01** | Visitante Anónimo | Externo | Usuario público sin cuenta. Solo puede interactuar con la Landing Page y llenar el formulario público de autoregistro con un código de acceso válido. |
| **ACT-02** | Administrador / Owner | Primario | Dueño del tenant. Tiene control total, `is_system_role=true`. Puede modificar roles, configuración global, facturación y revisar la auditoría forense. |
| **ACT-03** | Coordinador / Gestor ONG | Primario | Personal operativo. Gestiona voluntarios, proyectos, aprueba horas, controla el inventario y solicita egresos financieros. Su acceso suele estar restringido a ciertas sedes. |
| **ACT-04** | Voluntario con Acceso | Primario | Voluntario activo en la ONG con cuenta en el sistema. Puede visualizar su perfil, ver las actividades a las que está asignado, registrar asistencia y horas, y subir evidencias de campo. |
| **ACT-05** | Candidato a Voluntario | Primario | Postulante en proceso de admisión. Tiene un acceso muy limitado, principalmente para hacer seguimiento al estado de su solicitud o entrevista. |
| **ACT-06** | Beneficiario | Secundario | Actor pasivo. Representa a la población atendida. No accede al sistema, pero sus datos y perfiles (infantil, general, adulto mayor) son gestionados por el sistema. |
| **ACT-07** | Operador de Terminal | Primario | Actor que interactúa con el sistema a través de un terminal físico (ej. tablet en una sede). Requiere autenticación por PIN (`MAX_PIN_ATTEMPTS`). |
| **ACT-08** | Plataforma Democra | Sistémico | El proveedor SaaS que gestiona múltiples tenants, facturación, y acceso súper-administrador a la infraestructura base. |
| **ACT-09** | Motor de Riesgo | Sistémico | Actor interno autónomo. Evalúa continuamente el contexto del usuario (IP, intentos, velocidad) para elevar el nivel de seguridad requiriendo MFA (`ALLOW`, `REQUIRE_OTP`, `DENY`). |
| **ACT-10** | API Resend (Email) | Externo | Proveedor de envío de emails transaccionales, códigos OTP y notificaciones del sistema. |
| **ACT-11** | API SUNAT / RUC | Externo | Proveedor gubernamental (Perú) de datos fiscales. El sistema consulta esta API durante el onboarding para garantizar la validez legal del tenant. |
| **ACT-12** | Auditor / Gobernanza | Primario | Actor con permisos de solo lectura a nivel transversal para revisar el cumplimiento, accesos a datos médicos (registrados en `sensitive_access_logs`) y auditoría general. |

---

*Referencia de origen: Documento maestro de actores en [`docs/analisis/02-actores.md`](../../../../../docs/analisis/02-actores.md).*
