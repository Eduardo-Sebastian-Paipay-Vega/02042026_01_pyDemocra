# Especificación Completa de Casos de Uso
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09
> **ESTADO SSOT:** Referencia al documento maestro.

---

El detalle completo (descripción, flujo principal, alternativos, pre y post-condiciones) de los **20 Casos de Uso** del sistema se mantiene de forma centralizada en el directorio de análisis como SSOT (Single Source of Truth).

**Referencia directa (SSOT):**
👉 [`docs/analisis/05-casos-de-uso.md`](../../../../../docs/analisis/05-casos-de-uso.md)

---

### Resumen de Categorías de Casos de Uso (DDD Mapping)

| Bounded Context | Casos de Uso Abarcados |
|-----------------|------------------------|
| **IAM & Security** | CU-001 (Onboarding / Registro RUC)<br>CU-002 (Autenticación Riesgo/MFA)<br>CU-003 (Gestión de Roles) |
| **People** | CU-004 (Personas)<br>CU-006 (Datos Sensibles) |
| **Admission** | CU-005 (Proceso Admisión FSM)<br>CU-009 (Autoregistro Código) |
| **Projects & Operations** | CU-007 (Asistencia y Horas)<br>CU-014 (Proyectos/Tareas) |
| **Resources** | CU-011 (Ingreso Inventario)<br>CU-012 (Flujo Aprobación Financiera) |
| **Governance** | CU-010 (Auditoría Forense)<br>CU-013 (Config. Globales) |
| **Transversal** | Otros (Dashboard, Notificaciones, etc.) |

---

*Nota de arquitectura DDS: En lugar de duplicar los 20 casos de uso aquí y correr el riesgo de desincronización, esta especificación actúa como puente que enlaza el modelado de Dominios (Fase 3) con los requisitos funcionales descubiertos en la Fase 1.*
