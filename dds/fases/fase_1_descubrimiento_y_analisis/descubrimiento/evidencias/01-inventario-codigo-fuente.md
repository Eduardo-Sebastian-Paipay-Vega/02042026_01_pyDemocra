# Inventario del Código Fuente — Democra
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

---

## 1. Rutas de la API Backend (Express)

El backend de la aplicación se encuentra en el directorio `server/routes/`. Los archivos identificados gestionan la lógica core y la seguridad del sistema:

| Archivo | Descripción | Endpoints Clave |
|---------|-------------|-----------------|
| `auth.js` | Autenticación, MFA y evaluación de riesgo. | `/api/auth/risk-evaluate`, `/api/auth/step-up/verify-otp`, `/api/auth/terminal-login` |
| `iam.js` | Gestión de Identity & Access Management. | `/api/iam/roles`, `/api/iam/roles/:roleId/permissions`, `/api/iam/user-roles` |
| `onboarding.js` | Registro de organizaciones y validación. | `/api/onboarding/validate-ruc/:ruc`, `/api/onboarding/bootstrap-tenant` |
| `sedes.js` | Gestión de sedes de los tenants. | `/api/sedes`, `/api/sedes/:sedeId` |
| `audit.js` | Logs forenses, métricas y resumen IA. | `/api/audit/metrics`, `/api/audit/summary` |

---

## 2. Tipos de Dominio del Frontend (TypeScript)

El frontend contiene la lógica de negocio modularizada en `src/modules/ong/app/modules/`. Los archivos `types.ts` definen las estructuras de datos y el contrato del dominio:

| Módulo | Ruta (`src/modules/ong/app/modules/.../types.ts`) | Entidades Principales |
|--------|----------------------------------------------------|-----------------------|
| **Admission** | `admission/types.ts` | AdmissionRequestRow, AdmissionRegistrationCodeRow |
| **Governance** | `governance/types.ts` | GovernanceAuditEvent, RoleAccessConstraintRow |
| **Notifications**| `notifications/types.ts` | NotificationTemplateRow, NotificationHistoryRow |
| **Operation** | `operation/types.ts` | ActivityRelatedHourRow, ActivityRelatedEvidenceRow |
| **People** | `people/types.ts` | VolunteerUpsertInput, BeneficiaryUpsertInput, IdCardTemplateSummaryRow |
| **Projects** | `projects/types.ts` | ProjectRow, TaskRow, ActivityRow, AssignmentRow |
| **Resources** | `resources/types.ts` | InventoryItemRow, InventoryMovementRow, FinancialTransactionRow |
| **Settings** | `settings/types.ts` | SystemUserProvisionInput, SessionRow |

---

## 3. Migraciones de Base de Datos (SQL)

Las migraciones de Supabase se encuentran en `supabase/migrations/` y definen el esquema de datos y la lógica en BD (RLS, Triggers, Funciones):

| Migración | Propósito / Descripción |
|-----------|-------------------------|
| `20260301120000_ai_security_copilot.sql` | Estructuras para análisis de seguridad impulsado por IA. |
| `20260305110000_rls_hardening_p0.sql` | Políticas iniciales de seguridad a nivel de fila (RLS). |
| `20260305_rls_hardening.sql` | Reforzamiento y ajuste de políticas RLS. |
| `20260312000000_fix_mfa_challenges_constraint.sql` | Corrección de restricciones en la tabla de desafíos MFA. |
| `20260302125000_fix_bootstrap_audit_tenant_null.sql`| Corrección del tenant_id en auditoría durante el bootstrap. |
| `20260510000000_ace_fase0_base_structures.sql` | Fase 0: Tablas base del Access & Context Engine (ACE). |
| `20260510100000_ace_fase1_onboarding_rpc.sql` | Fase 1: Funciones RPC de onboarding integradas con ACE. |
| `20260510200000_ace_fase2_legacy_sync.sql` | Fase 2: Sincronización de compatibilidad con módulos legacy. |
| `20260510210000_ace_fase3_rls_policies.sql` | Fase 3: Políticas RLS granulares para el motor ACE. |
| `20260510220000_ace_fase4_optimization.sql` | Fase 4: Optimización de índices y rendimiento de ACE. |
| `20260706120000_fn_get_user_redirect_target.sql` | Función para determinar la redirección inicial del usuario. |

---

## 4. Archivos de Configuración

Archivos que controlan el comportamiento global, dependencias y despliegue del proyecto:

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `package.json` | Raíz | Dependencias del frontend y backend, scripts de NPM. |
| `vercel.json` | Raíz | Configuración de enrutamiento y despliegue serverless en Vercel. |
| `server/config.js` | `server/` | Variables de entorno, constantes globales y umbrales del motor de riesgo. |
| `tsconfig.json` | Raíz | Configuración del compilador TypeScript y alias de rutas. |

---

## 5. Documentación Existente (Docs Vivos)

Documentación funcional del negocio encontrada en `docs/ong/modulos-de-trabajo/`:

| Archivo | Tema Principal |
|---------|----------------|
| `01-home.md` a `10-configuracion.md` | Guías funcionales detalladas de los 10 módulos principales de la ONG. |
| `docs/ong/diccionarios-rf/ONGDiccionarioRF.md` | Diccionario original de requisitos funcionales. |
| `docs/MAPA_DOCUMENTAL.md` | Índice maestro y jerarquía de la documentación. |
| `docs/api/openapi.yaml` | Especificación de la API Backend. |

---

## 6. Supabase Edge Functions

Funciones ejecutadas en el entorno Deno de Supabase, identificadas durante el análisis:

| Función | Descripción de uso inferido |
|---------|-----------------------------|
| `admin-provision-user` | Creación segura de usuarios sin exponer la API key maestra en el cliente. |
| `admin-revoke-user-sessions`| Invalidación forzada de sesiones de un usuario comprometido. |
| `consume-volunteer-registration-code` | Procesamiento seguro del registro público mediante código de acceso. |
