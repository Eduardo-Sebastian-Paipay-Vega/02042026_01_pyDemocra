# Índice de Análisis de Requisitos — Democra
## Ingeniería de Requisitos IEEE 830 / ISO/IEC/IEEE 29148

---

Este directorio contiene la documentación completa de análisis funcional del sistema Democra,
generada mediante análisis exhaustivo del repositorio (código fuente, migraciones SQL,
tipos TypeScript, configuración y documentación existente).

**Fecha de generación:** 2026-07-09
**Metodología:** Reverse Requirements Engineering + IEEE 830 / ISO/IEC/IEEE 29148

---

## Documentos

| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [Análisis del Sistema](./01-analisis-del-sistema.md) | Propósito, alcance, módulos, tecnologías, arquitectura, entidades, reglas de negocio |
| 02 | [Actores del Sistema](./02-actores.md) | 12 actores identificados (primarios, secundarios y sistémicos) con descripción detallada |
| 03 | [Requerimientos del Usuario](./03-requerimientos-del-usuario.md) | 37 requerimientos en lenguaje de usuario final |
| 04 | [Requisitos Funcionales](./04-requisitos-funcionales.md) | 26 RF detallados con entradas, salidas, precondiciones, flujos y evidencias |
| 05 | [Casos de Uso](./05-casos-de-uso.md) | 20 casos de uso con flujo principal, alternativo y excepciones |
| 06 | [Requisitos No Funcionales](./06-requisitos-no-funcionales.md) | 32 RNF en categorías: seguridad, rendimiento, escalabilidad, cumplimiento |
| 07 | [Matriz de Trazabilidad](./07-matriz-de-trazabilidad.md) | Trazabilidad bidireccional RU↔RF↔CU↔RNF + evidencias en código + gaps |
| 08 | [Resumen Final](./08-resumen-final.md) | Estadísticas, hallazgos clave, riesgos, deuda técnica y recomendaciones |

---

## Estadísticas

| Artefacto | Cantidad |
|-----------|---------|
| Actores | 12 |
| Requerimientos de Usuario (RU) | 37 |
| Requisitos Funcionales (RF) | 26 |
| Casos de Uso (CU) | 20 |
| Requisitos No Funcionales (RNF) | 32 |
| Reglas de Negocio (RN) | 15 |
| Gaps detectados | 8 |

---

## Módulos Cubiertos

- 🔐 Autenticación y Evaluación de Riesgo (Motor propio + MFA/OTP)
- 👤 IAM — Roles, Permisos y Asignaciones
- 🏢 Onboarding de Tenant (validación SUNAT)
- 🏠 Sedes
- 👥 Personas — Voluntarios y Beneficiarios (con perfiles diferenciados)
- 📋 Admisión de Voluntarios (flujo completo)
- 📁 Proyectos, Tareas y Actividades
- ⚡ Operación — Asistencia, Horas y Evidencias
- 📦 Recursos — Inventario y Finanzas
- 🔔 Notificaciones
- 🏛️ Gobernanza — Auditoría y Restricciones
- 🎫 Carnets Digitales
- 🔗 ACE — Access & Context Engine

---

*Análisis basado exclusivamente en evidencia del código fuente. No se asumieron funcionalidades sin respaldo.*
