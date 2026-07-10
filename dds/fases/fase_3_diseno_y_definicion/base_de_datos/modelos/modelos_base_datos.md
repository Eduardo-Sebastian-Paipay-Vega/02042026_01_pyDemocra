# Modelos de Base de Datos (Esquemas)

*Fuente de verdad: `DATABASE_MASTER_SCRIPT_S1.md`, `DATABASE_DICTIONARY_S1.md`*

La base de datos de Democra (PostgreSQL 16 en Supabase) está diseñada bajo un modelo de esquemas múltiples orientados a dominios, fuertemente acoplados por la estrategia Multi-tenant.

## 1. Patrón Multi-tenant y Aislamiento (RLS)

La columna vertebral de la base de datos es la tabla `public.tenants`. Casi todas las tablas operativas incluyen una columna `tenant_id` y delegan la seguridad de aislamiento de datos (Multi-tenancy) a políticas Row Level Security (RLS) de PostgreSQL. 

El contexto del tenant para las consultas se obtiene en tiempo de ejecución a través de la función `public.fn_current_tenant_id()`.

## 2. Esquemas Activos

### 2.1. Schema `public` (Core, IAM, Billing, ACE)
Este esquema aloja las tablas transversales a toda la plataforma:
*   **Catálogos:** `cat_permissions`, `cat_plan_types`, `cat_tenant_statuses`, etc.
*   **IAM Core:** `tenants`, `sedes`, `profiles` (conectado 1:1 con `auth.users`), `roles`, `role_permissions`, `user_roles_sedes`.
*   **IAM Operativo y Seguridad:** `terminals`, `devices`, `sessions`, `auth_events`, `mfa_challenges`.
    *   *Conflicto Identificado:* La tabla `mfa_challenges` usa la columna `code_hash` y un JSON `context`, corrigiendo documentación previa que indicaba `otp_hash`.
*   **Access & Context Engine (ACE):** `access_links` (gestión de invitaciones), `memberships` (membresías contextuales).
*   **Suscripciones y Auditoría:** `subscription_contracts`, `entitlements`, `plan_policies`, `audit_logs`.

### 2.2. Schema `ong` (Operaciones Centrales)
Alberga las entidades principales de la gestión diaria de las organizaciones:
*   **Maestros:** `voluntarios` (la tabla con mayor uso estimado, anclada a perfiles), `beneficiarios`.
*   **Estructura de Proyectos:** `proyectos` -> `actividades` -> `tareas`.
    *   *Decisión de Diseño Crítica:* La jerarquía fue invertida por la migración `20260501_fix_hierarchy_actividades_tareas.sql`, estableciendo `Proyecto -> Actividad -> Tarea`.
*   **Operatividad:** `horas_actividad`, `evidencias_actividad`, `asistencias` (integrada con QR y la tabla `id_cards`), `transacciones_inventario`.

### 2.3. Schema `rrhh` (Recursos Humanos)
Gestión del ciclo de vida del voluntario:
*   **Admisión:** `solicitudes_admision` (con máquina de estados), `entrevistas_admision`.
*   **Onboarding:** `onboarding_pasos`, `onboarding_voluntario`.
*   **Invitaciones Legacy:** `codigos_registro_voluntario`. *Deuda Técnica:* Existe doble fuente de verdad con `public.access_links`.

### 2.4. Schema `finanzas`
Control de caja y transacciones operativas de la ONG:
*   **Entidades:** `cuentas`, `categorias`, `transacciones`, `comprobantes_financieros`, `aprobaciones_transaccion`.
*   *Hallazgo:* `cuentas.saldo_actual` carece de un mecanismo automático de consistencia fuerte en base de datos.

### 2.5. Schema `clinico`
Gestión de datos de salud altamente sensibles:
*   **Fichas:** `fichas_medicas`, `perfil_nino`, `perfil_adulto_mayor`, `ficha_sensible_voluntario`.
*   **Auditoría Específica:** `accesos_sensibles_log`, `accesos_sensibles_voluntario_log`.

### 2.6. Schema `academico` y `comunicaciones`
*   **Académico:** Gestión de `cursos`, `inscripciones` y `certificados`.
*   **Comunicaciones:** Catálogo de `canales_notificacion`, `plantillas_notificacion` e `historial_notificaciones`.

## 3. Esquemas Sin Uso (Código Muerto Potencial)

El análisis de auditoría identificó esquemas completos sin referencias detectadas en el código (0 llamadas directas detectadas). Constituyen posible código muerto y deberán ser archivados o purgados bajo decisión de producto:
*   `donaciones`
*   `gamificacion`
*   `impacto`

## 4. Auditoría Universal y Triggers

La trazabilidad forense se asegura mediante `fn_trigger_audit_universal()`, un trigger parametrizado (`TG_ARGV[0]='tenant_id'`) inyectado en tablas sensibles para registrar cambios en `auditoria.audit_log`.

*Fin del documento.*
