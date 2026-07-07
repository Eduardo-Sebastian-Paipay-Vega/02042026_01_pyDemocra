# FILES_CHANGED — Swagger UI local, endpoint de bootstrap de tenant y CRUD de sedes

## Creados

- `server/routes/sedes.js` — CRUD de `public.sedes` (GET lectura para miembros, POST/PUT/DELETE para admins del tenant; DELETE es soft-delete).

## Modificados

- `server/index.js` — monta `swagger-ui-express` en `/api/docs` (CSP relajado solo ahí); importa y monta `sedesRoutes` en `/api/sedes`.
- `server/routes/onboarding.js` — nuevo `POST /bootstrap-tenant` que envuelve `fn_bootstrap_tenant`.
- `docs/api/openapi.yaml` — agrega el tag `sedes`, el schema `Sede`, y los paths `/onboarding/bootstrap-tenant` y `/sedes` (+ `/sedes/{sedeId}`).
- `docs/api/postman_collection.json` — agrega "Bootstrap tenant" bajo `onboarding` y la carpeta `sedes` con sus 4 requests.

## Eliminados

Ninguno.

## Carpetas afectadas

- `server/`
- `server/routes/`
- `docs/api/`
- `changes/`
