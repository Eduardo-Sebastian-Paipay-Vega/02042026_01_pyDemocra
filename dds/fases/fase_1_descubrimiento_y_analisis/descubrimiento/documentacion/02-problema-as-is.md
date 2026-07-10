# Problema As-Is — Democra
> **Fase 1 | Descubrimiento** | Versión 1.0.0 | 2026-07-09

---

## 1. Situación Actual sin Sistema

Actualmente, muchas ONGs operan sin un sistema digital estructurado, dependiendo de hojas de cálculo descentralizadas, comunicación informal y procesos manuales. Esto genera silos de información, pérdida de memoria institucional y dificulta la rendición de cuentas, limitando el crecimiento y la capacidad de impacto de la organización.

---

## 2. Problemas Identificados

| # | Problema | Descripción |
|---|----------|-------------|
| 1 | Falta de centralización | Datos de voluntarios y beneficiarios dispersos en múltiples archivos y formatos. |
| 2 | Sin control de inventario | Desconocimiento del stock real de recursos materiales, lo que genera pérdidas o compras innecesarias. |
| 3 | Sin proceso de admisión | Incorporación de voluntarios ad-hoc, sin validación estructurada de antecedentes ni entrevistas documentadas. |
| 4 | Sin auditoría de cambios | Imposibilidad de saber quién, cuándo y por qué se modificó un registro crítico. |
| 5 | Sin RBAC granular | Todo el personal tiene acceso a toda la información, sin distinción de roles o sedes geográficas. |
| 6 | Sin trazabilidad de horas | Dificultad para cuantificar el esfuerzo real del voluntariado y emitir constancias precisas. |
| 7 | Datos médicos expuestos | Información de salud sensible (alergias, tipo de sangre) tratada sin las medidas de privacidad necesarias. |
| 8 | Sin credenciales digitales | Identificación física costosa o inexistente para los voluntarios en campo. |

---

## 3. Impacto por Área

- **Riesgo de pérdida de datos:** Alto. Archivos locales o en la nube sin políticas de retención.
- **Ineficiencia operativa:** Alta. Tiempo excesivo dedicado a consolidar información y generar reportes manuales.
- **Falta de transparencia:** Alta. Imposibilidad de demostrar trazabilidad financiera y operativa ante donantes y auditores.
- **Riesgo legal:** Medio/Alto. Posible incumplimiento de normativas de protección de datos personales y salud.

---

## 4. Pain Points por Tipo de Usuario

### Administrador (Owner)
- Dificultad para tener una visión global de la organización en tiempo real.
- Imposibilidad de revocar accesos rápidamente a personal que abandona la ONG.
- Preocupación constante por la seguridad y privacidad de la información.

### Coordinador / Gestor
- Cuellos de botella en la asignación de recursos y planificación de actividades.
- Tareas repetitivas para registrar la asistencia y horas de los voluntarios.
- Seguimiento manual tedioso del proceso de admisión de nuevos candidatos.

### Voluntario
- Desconocimiento de su historial de participación y horas acumuladas.
- Falta de un canal oficial estructurado para subir evidencias de su trabajo.
- Carencia de un carnet o identificación institucional formal.

### Auditor
- Falta de logs inmutables para verificar transacciones financieras y accesos a datos.
- Imposibilidad de reconstruir la historia de un registro a lo largo del tiempo.

---

## 5. Propuesta de Valor de Democra

Democra transforma la gestión de las ONGs proporcionando una plataforma SaaS multi-tenant que aborda directamente estos problemas:

- **Centralización Segura:** Única fuente de verdad para todos los datos de la organización, respaldada por políticas de seguridad a nivel de base de datos (RLS).
- **Gobernanza Integrada:** Auditoría universal, gestión granular de permisos (ACE Engine) y trazabilidad completa de cada acción.
- **Automatización de Procesos:** Flujos estructurados para la admisión de voluntarios, control de inventario y aprobaciones financieras.
- **Protección de Datos Sensibles:** Acceso auditado y justificado a información médica, garantizando el cumplimiento normativo.
- **Escalabilidad:** Arquitectura diseñada para soportar el crecimiento de la ONG sin comprometer el rendimiento ni la seguridad.
