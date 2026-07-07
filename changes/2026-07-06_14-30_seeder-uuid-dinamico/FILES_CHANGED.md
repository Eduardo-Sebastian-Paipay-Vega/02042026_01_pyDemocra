# FILES_CHANGED — Seeder ong-gym: UUID dinámico en vez de INSERT directo en auth.users

## Modificados

- `docs/consolidacion/seed_ong_gym_link_demo.sql` — elimina el `INSERT INTO auth.users`; envuelve el seeding en un bloque `DO $$` con la variable `v_existing_user_id` (placeholder a reemplazar) y validación explícita de que el usuario exista; usa el email real del usuario en vez de uno inventado.

## Creados

- `changes/2026-07-06_14-30_seeder-uuid-dinamico/CHANGELOG.md`
- `changes/2026-07-06_14-30_seeder-uuid-dinamico/SUMMARY.md`
- `changes/2026-07-06_14-30_seeder-uuid-dinamico/FILES_CHANGED.md`

## Eliminados

Ninguno.

## Carpetas afectadas

- `docs/consolidacion/`
- `changes/`
