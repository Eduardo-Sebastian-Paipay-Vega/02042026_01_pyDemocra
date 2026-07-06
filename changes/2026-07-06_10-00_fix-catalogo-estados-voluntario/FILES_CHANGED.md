# FILES_CHANGED — Fix: catálogo ong.estados_voluntario incompleto (falta 'en_proceso')

## Creados

- `docs/consolidacion/seed_ong_estados_voluntario_fix.sql` — `INSERT INTO ong.estados_voluntario` con los 4 valores esperados (`en_proceso`, `activo`, `inactivo`, `suspendido`), idempotente vía `ON CONFLICT DO NOTHING`.
- `changes/2026-07-06_10-00_fix-catalogo-estados-voluntario/CHANGELOG.md`
- `changes/2026-07-06_10-00_fix-catalogo-estados-voluntario/SUMMARY.md`
- `changes/2026-07-06_10-00_fix-catalogo-estados-voluntario/FILES_CHANGED.md`

## Modificados

Ninguno.

## Eliminados

Ninguno.

## Carpetas afectadas

- `docs/consolidacion/`
- `changes/`
