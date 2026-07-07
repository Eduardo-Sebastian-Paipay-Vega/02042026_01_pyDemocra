# CHANGELOG — Seeder ong-gym: UUID dinámico en vez de INSERT directo en auth.users

**Fecha:** 2026-07-06
**Hora:** 14:30 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Adaptar `docs/consolidacion/seed_ong_gym_link_demo.sql` para que reciba el UUID de un usuario YA EXISTENTE en `auth.users`, en vez de insertar un usuario directamente en esa tabla.

## Contexto del problema

El usuario aceptó la advertencia de una respuesta anterior en esta sesión: el seeder original hacía `INSERT INTO auth.users(...)` directo, lo cual es seguro solo en un Postgres de prueba aislado, pero rompería la integridad de Auth/GoTrue en cualquier proyecto Supabase real (incluso uno de staging con Auth ya en uso). Pidió explícitamente adaptar el script para recibir un UUID dinámico que él mismo reemplazará.

## Motivo de la modificación

Permitir probar el vínculo `ong`↔`gym` contra un proyecto Supabase real (no solo un Postgres aislado), sin tocar `auth.users` directamente.

## Solución implementada

- Se eliminó por completo el `INSERT INTO auth.users(...)`.
- Todo el seeding (tenant, tenant_modules, profile, beneficiario, gimnasio, usuario del gym) se envolvió en un único bloque `DO $$ ... $$` con una variable `v_existing_user_id uuid` declarada al inicio, con un placeholder claramente marcado (`'REEMPLAZAR-CON-UUID-DE-AUTH-USERS-REAL'`) que el usuario debe reemplazar por el UUID real de un usuario de su `auth.users` antes de ejecutar.
- **Validación explícita agregada**: el bloque hace `select email into v_email from auth.users where id = v_existing_user_id` y usa `raise exception` con un mensaje claro si ese usuario no existe — en vez de fallar más adelante con un error de FK críptico si el usuario olvida reemplazar el placeholder.
- El email usado en `gym.usuarios` ahora se lee del `auth.users` real (`v_email`) en vez de un email de prueba inventado, evitando un posible choque con la restricción `UNIQUE` de esa columna.
- Cabecera del archivo actualizada con instrucciones de cómo obtener un UUID válido (Supabase Dashboard → Authentication → Users → copiar el "User UID").

## Riesgos identificados

- Ninguno nuevo. El cambio reduce el riesgo respecto de la versión anterior (ya no toca `auth.users`).
- Sigue sin poder ejecutarse desde este entorno (sin Docker/psql) — el usuario debe ejecutarlo manualmente, como el resto de los scripts de `docs/consolidacion/`.

## Impacto esperado

El script puede ejecutarse de forma segura contra un proyecto Supabase real (staging o incluso producción con precaución), usando un usuario de prueba ya existente, sin ningún riesgo para la integridad de Auth.

## Módulos afectados

- `docs/consolidacion/seed_ong_gym_link_demo.sql`

## Dependencias involucradas

Ninguna.

## Posibles efectos secundarios

Ninguno.

## Verificación realizada

- Revisión manual: balance de `$$` (1 par, correcto), orden de dependencias (el tenant y system_modules se siembran antes del bloque `DO`, ya que no dependen del UUID dinámico), y que cada referencia al usuario dentro del bloque usa la variable `v_existing_user_id`/`v_email` en vez de un literal.
- No ejecutado contra ninguna base de datos real (mismo criterio que el resto de `docs/consolidacion/`).

## Cómo revertir

`git revert` del commit `docs(db): adapta seeder ong-gym para recibir un UUID dinamico`.
