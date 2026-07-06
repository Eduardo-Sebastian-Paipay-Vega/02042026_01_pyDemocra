# Documentación de API — estructura base

Esta carpeta es el punto de partida para documentar la API interna de Democra (`server/`, Express) con Swagger/OpenAPI y Postman.

## Archivos

- **`openapi.yaml`** — especificación OpenAPI 3.0 de los endpoints reales de `server/routes/*.js` (auth, audit, iam, onboarding). Extraída leyendo el código, no inventada.
- **`postman_collection.json`** — colección de Postman equivalente, lista para importar (`File > Import` en Postman).

## Cómo usar `openapi.yaml`

- **Swagger UI (visor rápido, sin instalar nada):** pegar el contenido en <https://editor.swagger.io/>, o servirlo localmente con cualquier visor de OpenAPI estático.
- **Wiring en vivo (opcional, requiere agregar dependencias):** si más adelante se quiere servir esta documentación directamente desde `server/index.js` (ej. en `/api/docs`), agregar `swagger-ui-express` y `js-yaml`, y montar:
  ```js
  import swaggerUi from "swagger-ui-express";
  import { load } from "js-yaml";
  import { readFileSync } from "node:fs";
  const openapiDoc = load(readFileSync("./docs/api/openapi.yaml", "utf8"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
  ```
  Deliberadamente NO se agregó esta dependencia todavía — es una decisión de instalar paquetes nuevos que debe tomarse aparte, no incluida en este scaffold base.

## Cómo usar `postman_collection.json`

1. Importar el archivo en Postman.
2. Configurar las variables de la colección: `base_url` (por defecto `http://localhost:8787/api`), `bearer_token` (un access token válido de una sesión de Supabase Auth) y `tenant_id`.
3. Los endpoints públicos (`terminal-login`, `validate-ruc`) ya están marcados sin autenticación (`noauth`); el resto usa el `bearer_token` de la colección automáticamente.

## Mantenimiento

Cada vez que se agregue, cambie o elimine un endpoint en `server/routes/*.js`, actualizar `openapi.yaml` (y `postman_collection.json` si aplica) en el mismo cambio — igual que el resto del código, para que no queden desincronizados.

## Fuera de alcance de este scaffold

- Las Supabase Edge Functions (ej. `ONG/supabase/functions/consume-volunteer-registration-code`) no están documentadas aquí todavía — son un sistema de invocación distinto (`supabase.functions.invoke`), no parte de esta API Express.
- Las RPCs de Postgres invocadas vía `supabase.rpc(...)` (ej. `fn_complete_access_onboarding`, `fn_validate_access_code`) tampoco están en este OpenAPI — su contrato ya está documentado como comentarios `-- Args/Returns` en `ONG/src/lib/db/ong/app-database.ts` y en las migraciones de origen.
