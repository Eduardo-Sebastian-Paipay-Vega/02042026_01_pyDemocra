# Alcance y Límites — Democra
> **Fase 1 | Descubrimiento** | Versión 1.0.0 | 2026-07-09

---

## 1. Funcionalidades Dentro del Alcance (IN-SCOPE)

El sistema actual implementa y soporta los siguientes módulos y funcionalidades:

| Módulo | Funcionalidades Incluidas |
|--------|---------------------------|
| **Onboarding** | Validación RUC (SUNAT), creación de tenant y configuración base (bootstrap). |
| **Autenticación** | Motor de riesgo, MFA/OTP, login por terminal con PIN. |
| **IAM** | Gestión de roles, permisos, y asignaciones usuario-rol-sede. |
| **Sedes** | Gestión de unidades geográficas/operativas (CRUD, soft delete). |
| **Personas** | Gestión de voluntarios y beneficiarios con perfiles diferenciados. |
| **Datos Sensibles**| Acceso auditado a información médica con motivo obligatorio. |
| **Carnets** | Generación de carnets digitales con QR para voluntarios. |
| **Admisión** | Flujo completo de evaluación de candidatos (FSM) y autoregistro. |
| **Proyectos** | Gestión jerárquica de proyectos, tareas y actividades. |
| **Operación** | Registro de asistencia, horas y evidencias fotográficas. |
| **Inventario** | Control de artículos, ubicaciones, movimientos y kardex. |
| **Finanzas** | Gestión de cuentas, categorías, transacciones y workflow de aprobaciones. |
| **Notificaciones** | Plantillas multicanal e historial de envíos. |
| **Gobernanza** | Log de auditoría forense, restricciones de acceso por rol y catálogos. |
| **ACE Engine** | Enlaces de acceso dinámicos y autorización contextual avanzada. |

---

## 2. Funcionalidades Fuera del Alcance Actual (OUT-SCOPE)

Las siguientes funcionalidades no forman parte del sistema en su estado actual, aunque puedan estar planeadas para futuras iteraciones:

| Funcionalidad | Descripción de la Exclusión |
|---------------|-----------------------------|
| **Módulo de Votaciones/Deliberación** | No existe implementación en el backend ni en los tipos TypeScript del frontend (GAP-001). |
| **App Móvil Nativa** | El sistema es una aplicación web responsive, pero no incluye binarios nativos (iOS/Android). |
| **Integraciones CRM Externos** | No hay sincronización automática con Salesforce, HubSpot u otros CRMs. |
| **Generación PDF Dinámica** | La generación avanzada de reportes en PDF no está implementada nativamente (los carnets se manejan diferente). |
| **Nómina y RRHH Completo** | El sistema gestiona voluntarios y staff básico, pero no procesa planillas, impuestos laborales ni beneficios. |
| **Pasarela de Pagos Interna** | No se procesan pagos con tarjeta de crédito directamente en el sistema para donaciones. |

---

## 3. Riesgos de Alcance

> [!WARNING] GAP-001: Módulo de Votaciones
> El README principal del proyecto menciona un módulo de deliberación y votaciones democráticas como parte central de la propuesta de valor. Sin embargo, el análisis exhaustivo del código fuente no ha revelado ninguna implementación (rutas, tipos, tablas) de este módulo. Es necesario clarificar si está en desarrollo o fue descartado.

---

## 4. Fronteras del Sistema

El sistema Democra interactúa con las siguientes entidades y servicios externos, que marcan sus fronteras:

- **SUNAT / API RUC:** Sistema externo utilizado exclusivamente como fuente de lectura para validar la existencia y estado de las organizaciones durante el registro.
- **Resend:** Proveedor de servicios de correo electrónico utilizado para el envío de códigos OTP y notificaciones del sistema.
- **Supabase:** Plataforma Backend-as-a-Service que proporciona la base de datos PostgreSQL, autenticación de bajo nivel y almacenamiento de archivos.
- **Vercel:** Infraestructura de alojamiento para el frontend y las funciones serverless de la API Express.

---

## 5. Supuestos del Análisis

- Se asume que el código fuente en `d:\PROYECTO\Democra(git)` representa el estado completo y actual de la aplicación en producción.
- Se asume que las variables de entorno de producción están correctamente configuradas para soportar las integraciones externas (SUNAT, Resend).
- Se asume que la rama actual contiene las últimas migraciones SQL aplicadas a la base de datos.

---

*Referencia principal: [docs/analisis/01-analisis-del-sistema.md](../../../../docs/analisis/01-analisis-del-sistema.md)*
