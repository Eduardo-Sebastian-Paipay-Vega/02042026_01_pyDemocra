# FILES_CHANGED — Fix: políticas RLS no idempotentes en el baseline de consolidación

## Modificados

- **`docs/consolidacion/00000000000000_core_baseline.sql`** — se agregó `DROP POLICY IF EXISTS <nombre> ON <tabla>;` antes de cada una de las 18 `CREATE POLICY` (catálogos ×12, sedes, roles, role_permissions ×2, user_roles_sedes), más una nota inline explicando por qué es necesario.

## Creados

- `changes/2026-07-04_18-05_fix-idempotencia-policies-baseline/CHANGELOG.md`
- `changes/2026-07-04_18-05_fix-idempotencia-policies-baseline/SUMMARY.md`
- `changes/2026-07-04_18-05_fix-idempotencia-policies-baseline/FILES_CHANGED.md`

## Eliminados

Ninguno.

## Carpetas afectadas

- `docs/consolidacion/`
- `changes/`
