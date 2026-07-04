# FILES_CHANGED — Extracción de baseline DDL del Core Compartido e Identidad

## Creados

- `docs/consolidacion/00000000000000_core_baseline.sql` (697 líneas) — extensiones, esquemas (`public` implícito, `ong`, `rrhh`, `finanzas`, `comunicaciones`, `auditoria`), catálogos (`cat_industry_types`, `cat_plan_types`, `cat_tenant_statuses`, `cat_permissions`), tablas core (`tenants`, `profiles`, `roles`, `role_permissions`, `sedes`, `user_roles_sedes`), funciones core (`fn_current_tenant_id()`, `fn_trigger_audit_universal()`, `fn_bootstrap_tenant()`), políticas RLS y seeds de catálogos.
- `changes/2026-07-04_17-23_core-baseline-ddl-consolidacion/CHANGELOG.md`
- `changes/2026-07-04_17-23_core-baseline-ddl-consolidacion/SUMMARY.md`
- `changes/2026-07-04_17-23_core-baseline-ddl-consolidacion/FILES_CHANGED.md`

## Modificados

Ninguno.

## Eliminados

Ninguno.

## Carpetas afectadas

- `docs/consolidacion/`
- `changes/`

## Fuera de alcance de este commit

`AUDIT_REPORT.md`, `DATABASE_DICTIONARY.md`, `DATABASE_MASTER_SCRIPT.md` aparecen como eliminados en `git status`, y `AUDIT_REPORT_S1.md`, `DATABASE_DICTIONARY_S1.md`, `DATABASE_MASTER_SCRIPT_S1.md` como no rastreados (renombrados externamente entre sesiones, no por este cambio). Se dejan intactos y sin incluir en este commit por no ser parte de este trabajo.
