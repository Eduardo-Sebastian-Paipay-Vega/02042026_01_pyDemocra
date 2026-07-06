# CHANGELOG — Seeder de demostración ong↔gym y estructura base de documentación de API

**Fecha:** 2026-07-04
**Hora:** 19:45 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (entregables de referencia — no ejecutados/no instalados)

## Objetivo del cambio

1. Dejar un script de referencia que inserte datos de prueba demostrando que un mismo tenant puede operar los esquemas `ong` y `gym` simultáneamente sobre el core compartido, y que una misma persona es identificable en ambos.
2. Dejar la estructura base (OpenAPI + colección Postman) para documentar la API interna de Express (`server/routes/*.js`).

## Contexto del problema

Sin GYMsos en este repositorio, no hay tablas `gym.*` reales contra las cuales probar el vínculo — solo la documentación de auditoría en `s2/DATABASE_MASTER_SCRIPT_S2.md`. Tampoco existía ninguna documentación de API (ni OpenAPI ni Postman) para los endpoints ya implementados en `server/routes/`.

## Motivo de la modificación

Dar al equipo un punto de partida verificable y ejecutable manualmente (no en este entorno, que no tiene Docker/psql) para validar la integración `ong`↔`gym`, y una base real (no inventada) para mantener sincronizada la documentación de la API a medida que evoluciona.

## Solución implementada

1. **`docs/consolidacion/seed_ong_gym_link_demo.sql`**: crea un slice mínimo de `gym.gimnasios`/`gym.usuarios` (extraído literal de `s2/DATABASE_MASTER_SCRIPT_S2.md` §3.1-3.2, reducido a las columnas necesarias), un tenant con ambos módulos activos (`public.tenant_modules`), un usuario de prueba (`auth.users`, marcado `[SOLO-TEST]` — solo para un Postgres de prueba aislado, nunca contra Auth/GoTrue real), un `ong.beneficiarios` y un `gym.usuarios` con el mismo `numero_documento`/`documento`, y consultas de verificación que hacen JOIN entre ambos esquemas para confirmar que son la misma persona en el mismo tenant. Incluye sección de limpieza comentada.
2. **`docs/api/openapi.yaml`**: especificación OpenAPI 3.0 de los 14 endpoints reales de `server/routes/{auth,audit,iam,onboarding}.js`, extraída leyendo el código (paths, métodos, bodies, autenticación Bearer), no inventada.
3. **`docs/api/postman_collection.json`**: colección Postman equivalente, agrupada por router, con variables `base_url`/`bearer_token`/`tenant_id`, lista para importar.
4. **`docs/api/README.md`**: instrucciones de uso de ambos archivos y una nota explícita de que agregar `swagger-ui-express` (para servir la documentación en vivo desde `server/index.js`) es una decisión de dependencias deliberadamente NO tomada en este cambio.

## Riesgos identificados

- El seeder usa UUIDs literales fijos (`00000000-0000-4000-8000-...`) para que sea reproducible y fácil de limpiar; no debe ejecutarse dos veces sin la sección de limpieza si se quiere repetir la demo desde cero (los `ON CONFLICT DO NOTHING` lo hacen re-ejecutable sin error, pero no "resetean" el estado).
- El seeder inserta directamente en `auth.users` — **solo válido en un Postgres de prueba aislado**, nunca contra un proyecto Supabase con Auth real en uso (rompería la integridad de GoTrue). Está marcado `[SOLO-TEST]` en el propio archivo.
- La documentación de API cubre solo `server/` (Express); las Edge Functions de Supabase y las RPCs (`fn_complete_access_onboarding`, etc.) quedan explícitamente fuera de alcance, señalado en `docs/api/README.md`.

## Impacto esperado

Ninguno sobre el sistema en ejecución — son archivos de referencia/documentación, ninguno ejecutado ni instalado (no se agregó ninguna dependencia npm nueva).

## Módulos afectados

- `docs/consolidacion/`
- `docs/api/` (nuevo)

## Dependencias involucradas

Ninguna nueva.

## Posibles efectos secundarios

Ninguno.

## Verificación realizada

- `seed_ong_gym_link_demo.sql`: revisión manual (orden de dependencias FK, columnas/valores de cada INSERT, lógica de los JOIN de verificación). No ejecutado contra ningún motor real (sin Docker/psql en este entorno).
- `postman_collection.json`: validado como JSON bien formado (`JSON.parse` exitoso).
- `openapi.yaml`: revisión manual contra el código real de `server/routes/*.js` (no se generó automáticamente).

## Cómo revertir

`git revert` del commit `docs: agrega seeder de demo ong-gym y estructura base de documentacion de API`, o eliminar `docs/consolidacion/seed_ong_gym_link_demo.sql` y la carpeta `docs/api/`.
