# FILES_CHANGED — Configuración de Jest+Supertest y pruebas iniciales de cobertura

## Creados

- `babel.config.cjs` — transforma ESM a CJS para Jest.
- `jest.config.js` — configuración de Jest (roots, coverage, setup).
- `jest.setup.js` — fija `process.env.VERCEL = "1"` para evitar `app.listen()` real en los tests.
- `server/routes/auth.test.js` — 6 casos.
- `server/routes/audit.test.js` — 3 casos.
- `server/routes/iam.test.js` — 3 casos (incluye mock completo de auth+permisos+datos).
- `server/routes/onboarding.test.js` — 8 casos (RUC + bootstrap-tenant).
- `server/routes/sedes.test.js` — 6 casos.

## Modificados

Ninguno.

## Eliminados

Ninguno.

## Carpetas afectadas

- raíz del repo (`babel.config.cjs`, `jest.config.js`, `jest.setup.js`)
- `server/routes/`
- `changes/`
