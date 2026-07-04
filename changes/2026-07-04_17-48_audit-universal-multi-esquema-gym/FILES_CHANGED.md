# FILES_CHANGED — Reescritura de fn_trigger_audit_universal() para multi-esquema (ONG + GYMsos)

## Modificados

- **`docs/consolidacion/00000000000000_core_baseline.sql`** — sección 10 (`fn_trigger_audit_universal()`):
  - Comentario de cabecera reescrito para documentar el nuevo comportamiento multi-esquema.
  - Cuerpo de la función reemplazado: elimina `TG_ARGV[0]`/SQL dinámico; agrega captura de `TG_TABLE_SCHEMA` codificada en `resource_name`; agrega resolución de `tenant_id` en dos pasos (JSONB directo + fallback a `profiles`); mantiene `SECURITY DEFINER`, el modelo de columnas de `audit_logs` y la salvaguarda de "omitir si no hay tenant" sin cambios de comportamiento en ese punto.

## Creados

- `changes/2026-07-04_17-48_audit-universal-multi-esquema-gym/CHANGELOG.md`
- `changes/2026-07-04_17-48_audit-universal-multi-esquema-gym/SUMMARY.md`
- `changes/2026-07-04_17-48_audit-universal-multi-esquema-gym/FILES_CHANGED.md`

## Eliminados

Ninguno.

## Carpetas afectadas

- `docs/consolidacion/`
- `changes/`
