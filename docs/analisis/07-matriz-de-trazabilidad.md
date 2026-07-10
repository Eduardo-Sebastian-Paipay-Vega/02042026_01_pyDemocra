# Documento 07 — Matriz de Trazabilidad
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Trazabilidad RU → RF](#1-trazabilidad-ru--rf)
2. [Trazabilidad RF → CU](#2-trazabilidad-rf--cu)
3. [Trazabilidad CU → RNF](#3-trazabilidad-cu--rnf)
4. [Trazabilidad RF → Evidencia en Código](#4-trazabilidad-rf--evidencia-en-código)
5. [Trazabilidad Actor → CU](#5-trazabilidad-actor--cu)
6. [Cobertura y Gaps Detectados](#6-cobertura-y-gaps-detectados)

---

## 1. Trazabilidad RU → RF

*Muestra qué Requisito Funcional cubre cada Requerimiento de Usuario.*

| ID RU | Nombre del Requerimiento de Usuario | RF Cubriente |
|--------|-------------------------------------|-------------|
| RU-001 | Registrar organización | RF-001, RF-002 |
| RU-002 | Inicio de sesión seguro | RF-003, RF-004, RF-005 |
| RU-003 | Login en terminal física | RF-006 |
| RU-004 | Expiración automática de sesiones | RF-003 (sesiones con TTL), RNF-027 |
| RU-005 | Registro de voluntarios | RF-011 |
| RU-006 | Ver perfil de voluntario | RF-011 |
| RU-007 | Gestión de beneficiarios | RF-012 |
| RU-008 | Acceso controlado a datos médicos | RF-013 |
| RU-009 | Carnets digitales de voluntarios | RF-014 |
| RU-010 | Gestión de solicitudes de admisión | RF-015 |
| RU-011 | Entrevistas a candidatos | RF-015 |
| RU-012 | Proceso de onboarding del voluntario | RF-015 |
| RU-013 | Conversión de candidato a voluntario | RF-015 |
| RU-014 | Autoregistro por enlace | RF-016, RF-026 |
| RU-015 | Gestión de proyectos | RF-017 |
| RU-016 | Gestión de tareas | RF-018 |
| RU-017 | Gestión de actividades | RF-019 |
| RU-018 | Asignación de voluntarios | RF-019, RF-020 |
| RU-019 | Registro de asistencia y horas | RF-020 |
| RU-020 | Carga de evidencias | RF-020 |
| RU-021 | Gestión de inventario | RF-021 |
| RU-022 | Consulta de stock y kardex | RF-021 |
| RU-023 | Registro de transacciones financieras | RF-022 |
| RU-024 | Aprobación de egresos | RF-022 |
| RU-025 | Reportes financieros | RF-022 |
| RU-026 | Plantillas de notificación | RF-023 |
| RU-027 | Historial de notificaciones | RF-023 |
| RU-028 | Auditoría y registro de cambios | RF-024, RF-025 |
| RU-029 | Restricciones de acceso por rol | RF-024 |
| RU-030 | Gestión de catálogos | RF-024 |
| RU-031 | Gestión de roles y permisos | RF-007, RF-008 |
| RU-032 | Gestión de usuarios del sistema | RF-009 |
| RU-033 | Gestión de sedes | RF-010 |
| RU-034 | Supervisión de dispositivos y sesiones | RF-003 (sesiones en BD) |
| RU-035 | Gestión de terminales físicas | RF-006 (terminales en BD) |
| RU-036 | Dashboard con KPIs | RF-025 |
| RU-037 | Landing page y presentación | (fuera del alcance de RF de negocio) |

---

## 2. Trazabilidad RF → CU

*Muestra qué Casos de Uso implementan cada Requisito Funcional.*

| ID RF | Nombre del Requisito Funcional | CU que lo implementa |
|--------|--------------------------------|----------------------|
| RF-001 | Validar RUC | CU-002 |
| RF-002 | Bootstrap de Tenant | CU-002 |
| RF-003 | Evaluación de Riesgo | CU-003 |
| RF-004 | Verificación OTP | CU-003 |
| RF-005 | Reenvío OTP | CU-003 |
| RF-006 | Login Terminal con PIN | CU-004 |
| RF-007 | CRUD de Roles | CU-006 |
| RF-008 | Permisos de Rol | CU-006 |
| RF-009 | Asignación Usuario-Rol-Sede | CU-006, CU-007 |
| RF-010 | CRUD de Sedes | CU-005 |
| RF-011 | CRUD de Voluntarios | CU-009 |
| RF-012 | CRUD de Beneficiarios | CU-010 |
| RF-013 | Acceso Auditado Datos Médicos | CU-011 |
| RF-014 | Carnets Digitales | CU-012 |
| RF-015 | Proceso de Admisión | CU-013 |
| RF-016 | Autoregistro por Código | CU-014 |
| RF-017 | CRUD de Proyectos | CU-015 |
| RF-018 | CRUD de Tareas | CU-015 |
| RF-019 | CRUD de Actividades y Asignaciones | CU-015 |
| RF-020 | Operación: Horas, Asistencia y Evidencias | CU-016 |
| RF-021 | Gestión de Inventario | CU-017 |
| RF-022 | Gestión Financiera y Aprobaciones | CU-018 |
| RF-023 | Plantillas e Historial de Notificaciones | CU-019 |
| RF-024 | Gobernanza Institucional | CU-020 |
| RF-025 | Métricas de Seguridad y Resumen IA | CU-001 (Dashboard), CU-020 |
| RF-026 | Vínculos de Acceso ACE | CU-014 |

---

## 3. Trazabilidad CU → RNF

*Muestra qué Requisitos No Funcionales aplican a cada Caso de Uso.*

| ID CU | Nombre del Caso de Uso | RNF Aplicables |
|--------|------------------------|----------------|
| CU-001 | Dashboard Principal | RNF-001, RNF-002, RNF-007 |
| CU-002 | Registrar Organización | RNF-001, RNF-013, RNF-014, RNF-025 |
| CU-003 | Login Web con MFA | RNF-002, RNF-003, RNF-004, RNF-006, RNF-027 |
| CU-004 | Login Terminal con PIN | RNF-001, RNF-005, RNF-006, RNF-027 |
| CU-005 | Gestionar Sedes | RNF-001, RNF-002, RNF-007, RNF-026 |
| CU-006 | Gestionar Roles y Permisos | RNF-001, RNF-002, RNF-007, RNF-026 |
| CU-007 | Gestionar Usuarios | RNF-001, RNF-002, RNF-007 |
| CU-008 | Supervisar Sesiones y Dispositivos | RNF-001, RNF-002, RNF-027 |
| CU-009 | Gestionar Voluntarios | RNF-001, RNF-008, RNF-016, RNF-026 |
| CU-010 | Gestionar Beneficiarios | RNF-001, RNF-008, RNF-016, RNF-023 |
| CU-011 | Acceder a Datos Médicos | RNF-001, RNF-023, RNF-026 |
| CU-012 | Carnets Digitales | RNF-001, RNF-007 |
| CU-013 | Admisión de Voluntarios | RNF-001, RNF-008, RNF-013, RNF-026 |
| CU-014 | Autoregistro por Código | RNF-001, RNF-013, RNF-014 |
| CU-015 | Proyectos, Tareas y Actividades | RNF-001, RNF-008, RNF-016, RNF-026 |
| CU-016 | Operación de Campo | RNF-001, RNF-007, RNF-026 |
| CU-017 | Gestionar Inventario | RNF-001, RNF-008, RNF-013, RNF-026 |
| CU-018 | Gestionar Finanzas y Aprobaciones | RNF-001, RNF-008, RNF-013, RNF-026 |
| CU-019 | Gestionar Notificaciones | RNF-001, RNF-007 |
| CU-020 | Gobernanza Institucional | RNF-001, RNF-024, RNF-026, RNF-028 |

---

## 4. Trazabilidad RF → Evidencia en Código

*Muestra la ubicación exacta en el código fuente que implementa o evidencia cada RF.*

| ID RF | Nombre | Archivo / Función | Líneas |
|--------|--------|-------------------|--------|
| RF-001 | Validar RUC | `server/routes/onboarding.js` | 99–202 |
| RF-002 | Bootstrap de Tenant | `server/routes/onboarding.js`, `fn_bootstrap_tenant()` | 212–273 |
| RF-003 | Evaluación de Riesgo | `server/routes/auth.js`, `server/security/risk-engine.js` | 57–187 |
| RF-004 | Verificación OTP | `server/routes/auth.js` | 189–320 |
| RF-005 | Reenvío OTP | `server/routes/auth.js` | 322–402 |
| RF-006 | Login Terminal PIN | `server/routes/auth.js` | 404–645 |
| RF-007 | CRUD de Roles | `server/routes/iam.js` | 60–183 |
| RF-008 | Permisos de Rol | `server/routes/iam.js` | 185–275 |
| RF-009 | Asignación Usuario-Rol-Sede | `server/routes/iam.js` | 277–368 |
| RF-010 | CRUD de Sedes | `server/routes/sedes.js` | Completo |
| RF-011 | CRUD de Voluntarios | `people/types.ts` (VolunteerUpsertInput, VolunteerDetailData) | Completo |
| RF-012 | CRUD de Beneficiarios | `people/types.ts` (BeneficiaryUpsertInput) | Completo |
| RF-013 | Acceso Médico Auditado | `people/types.ts` (accessReason, SensitiveAccessLogRow) | Completo |
| RF-014 | Carnets Digitales | `people/types.ts` (IdCardTemplate*, IdCardUpsertInput) | Completo |
| RF-015 | Proceso de Admisión | `admission/types.ts` (AdmissionRequestRow, flujo de estados) | Completo |
| RF-016 | Autoregistro por Código | `admission/types.ts` (AdmissionRegistrationCodeRow) | Completo |
| RF-017 | CRUD de Proyectos | `projects/types.ts` (ProjectRow, ProjectFormValues) | Completo |
| RF-018 | CRUD de Tareas | `projects/types.ts` (TaskRow, TaskFormValues) | Completo |
| RF-019 | Actividades y Asignaciones | `projects/types.ts` (ActivityRow, AssignmentRow) | Completo |
| RF-020 | Operación de Campo | `operation/types.ts` (horas, evidencias, asistencia) | Completo |
| RF-021 | Gestión de Inventario | `resources/types.ts` (Inventory*) | Completo |
| RF-022 | Gestión Financiera | `resources/types.ts` (Financial*) | Completo |
| RF-023 | Notificaciones | `notifications/types.ts` | Completo |
| RF-024 | Gobernanza | `governance/types.ts` | Completo |
| RF-025 | Métricas de Seguridad + IA | `server/routes/audit.js`, `server/security/ai-client.js` | Completo |
| RF-026 | Vínculos de Acceso ACE | `supabase/migrations/ace_fase0_base_structures.sql` (access_links) | Líneas 47–63 |

---

## 5. Trazabilidad Actor → CU

*Muestra qué Casos de Uso puede realizar cada actor.*

| Actor | Casos de Uso |
|-------|-------------|
| **ACT-01** Visitante | (Ninguno — solo accede a landing) |
| **ACT-02** Administrador (Owner) | CU-001, CU-002, CU-005, CU-006, CU-007, CU-008, CU-009, CU-010, CU-011, CU-012, CU-013, CU-015, CU-016, CU-017, CU-018, CU-019, CU-020 |
| **ACT-03** Coordinador / Gestor ONG | CU-001, CU-006 (parcial), CU-009, CU-010, CU-011 (con permiso), CU-012 (con permiso), CU-013, CU-014, CU-015, CU-016, CU-017, CU-018, CU-019 (con permiso) |
| **ACT-04** Voluntario con Acceso | CU-003, CU-016 (propio) |
| **ACT-05** Candidato a Voluntario | CU-014 (autoregistro) |
| **ACT-06** Beneficiario | (Ninguno — es objeto de gestión) |
| **ACT-07** Operador de Terminal | CU-004 |
| **ACT-08** Plataforma Democra | (Sistémico — gestiona planes/pagos) |
| **ACT-09** Motor de Riesgo | CU-003 (actúa en), CU-004 (actúa en) |
| **ACT-10** Resend (Email) | CU-003 (actúa en) |
| **ACT-11** SUNAT | CU-002 (actúa en) |
| **ACT-12** Auditor / Gobernanza | CU-008, CU-020 |

---

## 6. Cobertura y Gaps Detectados

### 6.1 Requisitos con cobertura completa en código

Los siguientes módulos tienen evidencia completa tanto en tipos TypeScript como en rutas de API o migraciones SQL:

- ✅ Autenticación y evaluación de riesgo (RF-003 a RF-006)
- ✅ IAM completo: roles, permisos, asignaciones (RF-007 a RF-009)
- ✅ Onboarding y bootstrap de tenant (RF-001, RF-002)
- ✅ Gestión completa de sedes (RF-010)
- ✅ Personas: voluntarios y beneficiarios con perfiles diferenciados (RF-011, RF-012)
- ✅ Admisión de voluntarios con flujo de estados (RF-015, RF-016)
- ✅ Proyectos, tareas, actividades y asignaciones (RF-017 a RF-020)
- ✅ Inventario con movimientos y kardex (RF-021)
- ✅ Finanzas con workflow de aprobación de egresos (RF-022)
- ✅ Gobernanza: auditoría, catálogos, restricciones, retención (RF-024)

### 6.2 Gaps y áreas de riesgo detectados

| ID | Gap | Tipo | Impacto |
|----|-----|------|---------|
| GAP-001 | Módulo de votaciones/deliberación (mencionado en README) no tiene implementación en código revisado | Funcionalidad ausente | Alto — es parte del propósito del sistema |
| GAP-002 | El archivo `docs/api/openapi.yaml` puede no estar sincronizado con todos los endpoints actuales | Documentación | Medio — dificulta integración de terceros |
| GAP-003 | La App ONG legacy (`ONG/`) y la nueva (`src/modules/ong/`) coexisten sin un plan de migración documentado | Deuda técnica | Alto — riesgo de divergencia de comportamiento |
| GAP-004 | No existe evidencia de pruebas E2E (solo 1 prueba pgTAP y vitest configurado sin tests funcionales de integración) | Calidad | Medio — riesgo de regresiones sin detección |
| GAP-005 | El módulo de Aprobaciones (MOD-FE-05) aparece como módulo independiente pero sus RFs se solapan con RF-022 (Finanzas) | Ambigüedad | Bajo — requiere clarificación del alcance |
| GAP-006 | Los endpoints del módulo ONG (personas, proyectos, recursos) son frontend-only (supabase-js directo) sin pasar por el API Express. Esto significa que la validación de business rules reside en el cliente. | Seguridad/Arquitectura | Medio — riesgo si se accede a la BD directamente |
| GAP-007 | Las Edge Functions de Supabase (`admin-provision-user`, `admin-revoke-user-sessions`, `consume-volunteer-registration-code`) no están documentadas en el OpenAPI | Documentación | Bajo |
| GAP-008 | El motor de riesgo tiene umbrales configurables por variables de entorno pero no existe una interfaz de administración para cambiarlos en runtime | Operabilidad | Bajo |

### 6.3 RNF sin evidencia de pruebas automatizadas

Los siguientes RNF no tienen evidencia de pruebas automatizadas que validen su cumplimiento:

- RNF-007 (tiempo de respuesta) — no hay pruebas de carga
- RNF-008 (paginación) — no hay pruebas de integración de la API
- RNF-019 (accesibilidad) — no hay pruebas de accesibilidad automatizadas
- RNF-020 (responsividad) — no hay pruebas visuales automatizadas

---

*Documento generado mediante análisis exhaustivo del repositorio Democra. Fecha: 2026-07-09.*
