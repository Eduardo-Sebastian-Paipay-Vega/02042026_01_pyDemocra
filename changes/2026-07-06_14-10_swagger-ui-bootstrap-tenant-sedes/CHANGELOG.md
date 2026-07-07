# CHANGELOG — Swagger UI local, endpoint de bootstrap de tenant y CRUD de sedes

**Fecha:** 2026-07-06
**Hora:** 14:10 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

1. Exponer `docs/api/openapi.yaml` como documentación interactiva en `http://localhost:8787/api/docs`.
2. Cerrar dos brechas funcionales críticas encontradas en el análisis de cobertura de esta sesión: no existía ningún camino (Express ni Supabase directo) para (a) que una organización nueva se diera de alta como tenant, ni (b) para crear/editar/desactivar sedes de un tenant ya existente.

## Contexto del problema

Se hizo un análisis de cobertura funcional cruzando los 14 endpoints existentes contra el esquema de base de datos (core, S1-ONG, S2-Gym) y contra todas las llamadas directas a Supabase desde el frontend. Hallazgos completos en el reporte entregado en el chat de esta sesión; resumen de los dos accionados aquí:

- **`fn_bootstrap_tenant` no tiene ningún llamador en el código vivo** (ni Express, ni `supabase.rpc()` desde el frontend). No hay forma de que una organización nueva se dé de alta hoy.
- **`public.sedes` solo tiene lecturas** en todo el frontend (`ace.service.ts`, `roles.service.ts`, `systemUsers.service.ts`, etc.) — la única sede que se crea alguna vez es la "Principal" dentro de `fn_bootstrap_tenant` (que, como se dijo, nadie llama). Crecimiento multi-sede de un tenant existente no está soportado.

Un tercer hallazgo (enrolar un beneficiario ONG en el Gym) **no se implementó**: el esquema `gym.*` no existe en ninguna migración de este repositorio (solo está documentado en `s2/DATABASE_MASTER_SCRIPT_S2.md`, para un sistema cuyo código vive fuera de este repo) — construir un endpoint contra tablas que no existen en la base de datos real habría sido código muerto. Queda señalado como bloqueado a nivel de datos, no de código, para cuando se decida crear el esquema `gym` real en este proyecto.

## Motivo de la modificación

Sin `bootstrap-tenant`, el flujo de alta de una ONG nueva depende de ejecutar SQL manualmente. Sin CRUD de sedes, un tenant no puede crecer a más de una sede sin intervención manual en la base de datos.

## Solución implementada

1. **Swagger UI** (ver detalle de implementación en el cambio `instala-dependencias-swagger-jest` de esta misma sesión, que instaló las dependencias): `server/index.js` monta `swagger-ui-express` en `/api/docs`, con el CSP de Helmet relajado solo para esa ruta.
2. **`POST /api/onboarding/bootstrap-tenant`**: envuelve `fn_bootstrap_tenant` vía el cliente Supabase con el JWT del usuario (`userClient.rpc`, no `serviceClient`, porque la función usa `auth.uid()` internamente). Valida `tenant_name`/`tax_id` (RUC de 11 dígitos)/`industry_type_id` antes de llamar a la RPC; propaga el mensaje de validación de la función si la RPC falla, en vez de un 500 genérico.
3. **`server/routes/sedes.js` (nuevo router)**: `GET /api/sedes` (lectura, cualquier miembro autenticado del tenant), `POST /api/sedes` (crear, requiere `fn_is_tenant_admin()`), `PUT /api/sedes/:sedeId` (editar nombre/estado, admin), `DELETE /api/sedes/:sedeId` (**soft-delete**: pone `is_active = false`, NO hace `DELETE` físico — varias tablas referencian `sedes` con `ON DELETE CASCADE`, y un hard-delete expuesto por API borraría en cascada asignaciones de IAM sin ninguna confirmación intermedia; consistente con el patrón `is_active` ya usado en el resto del esquema).
4. **`docs/api/openapi.yaml` y `docs/api/postman_collection.json` actualizados** con los 2 endpoints nuevos (4 operaciones: bootstrap-tenant, sedes GET/POST/PUT/DELETE).

## Riesgos identificados

- **Gap de gym no resuelto por diseño** (ver "Contexto"): no se inventó un endpoint contra tablas inexistentes. Queda como trabajo futuro condicionado a que el esquema `gym` se cree realmente en este proyecto.
- **Permiso de sedes**: se gateó la escritura detrás de `fn_is_tenant_admin()` (ya existente, sin necesitar un nuevo permiso sembrado) en vez de crear un permiso granular nuevo (`settings.sedes.manage` o similar) — una decisión de alcance para no tener que agregar otra fila de referencia a `cat_permissions` fuera de este cambio. Si se quiere un control más fino más adelante, es un cambio aislado en `sedes.js`.
- Bug propio de `import.meta.url` detectado y corregido durante la implementación de Swagger UI — ver detalle en el CHANGELOG de `instala-dependencias-swagger-jest`.

## Impacto esperado

Dos flujos de negocio antes imposibles (alta de tenant, gestión de sedes) quedan disponibles vía API. Ningún endpoint existente cambia de comportamiento.

## Módulos afectados

- `server/index.js`
- `server/routes/onboarding.js`
- `server/routes/sedes.js` (nuevo)
- `docs/api/openapi.yaml`
- `docs/api/postman_collection.json`

## Dependencias involucradas

Ninguna nueva en este cambio (ya instaladas en el cambio anterior de esta sesión).

## Posibles efectos secundarios

Ninguno sobre endpoints existentes — se agregaron rutas nuevas, no se modificó lógica de las 14 rutas ya existentes salvo el import/montaje del nuevo router.

## Verificación realizada

- Ver "Verificación realizada" del cambio `jest-supertest-tests-iniciales` (mismo commit de tests cubre `bootstrap-tenant` y `sedes.js` con 9 casos: 401/403/400/201/204).
- `curl`/Playwright manual contra `npm run dev:api`: `/api/docs/` renderiza ambos endpoints nuevos correctamente, sin errores de consola.
- Validación de `openapi.yaml` (`js-yaml` parseable, 16 paths) y `postman_collection.json` (`JSON.parse` exitoso) tras los cambios.

## Cómo revertir

`git revert` del commit `feat(api): agrega Swagger UI local, bootstrap-tenant y CRUD de sedes`.
