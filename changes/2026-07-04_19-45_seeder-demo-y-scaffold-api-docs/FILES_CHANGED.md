# FILES_CHANGED — Seeder de demostración ong↔gym y estructura base de documentación de API

## Creados

- `docs/consolidacion/seed_ong_gym_link_demo.sql` — seeder de referencia (no ejecutado) que crea un slice mínimo de `gym.gimnasios`/`gym.usuarios`, un tenant con módulos `ong`+`gym` activos, y registros vinculados en `ong.beneficiarios`/`gym.usuarios`, con consultas de verificación.
- `docs/api/openapi.yaml` — especificación OpenAPI 3.0 de los endpoints de `server/routes/{auth,audit,iam,onboarding}.js`.
- `docs/api/postman_collection.json` — colección Postman equivalente.
- `docs/api/README.md` — instrucciones de uso y mantenimiento.
- `changes/2026-07-04_19-45_seeder-demo-y-scaffold-api-docs/CHANGELOG.md`
- `changes/2026-07-04_19-45_seeder-demo-y-scaffold-api-docs/SUMMARY.md`
- `changes/2026-07-04_19-45_seeder-demo-y-scaffold-api-docs/FILES_CHANGED.md`

## Modificados

Ninguno.

## Eliminados

Ninguno.

## Carpetas afectadas

- `docs/consolidacion/`
- `docs/api/`
- `changes/`
