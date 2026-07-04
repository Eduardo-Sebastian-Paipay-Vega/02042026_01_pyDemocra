# CHANGELOG — Fix: políticas RLS no idempotentes en el baseline de consolidación

**Fecha:** 2026-07-04
**Hora:** 18:05 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Corregir `docs/consolidacion/00000000000000_core_baseline.sql` para que las 18 sentencias `CREATE POLICY` puedan re-ejecutarse sin error, agregando un `DROP POLICY IF EXISTS` inmediatamente antes de cada una.

## Contexto del problema

El usuario ejecutó el script contra una base de datos real y obtuvo:

```
ERROR: 42710: policy "p_cat_industry_types_read" for table "cat_industry_types" already exists
```

`CREATE TABLE IF NOT EXISTS` es idempotente, pero `CREATE POLICY` **no lo es** — PostgreSQL no ofrece una cláusula `IF NOT EXISTS` para políticas. Si el script ya se había ejecutado antes (completo o parcialmente) contra ese entorno, cualquier segunda ejecución fallaba en la primera política que encontrara, sin llegar siquiera a las tablas/funciones subsiguientes del mismo script.

Este es exactamente el riesgo de "políticas CREATE POLICY no idempotentes" que ya se había anotado como advertencia en la cabecera del archivo (línea 15 del script) al justificar por qué NO se colocó en `supabase/migrations/`; el error confirma esa advertencia en la práctica.

## Motivo de la modificación

Sin este fix, el script solo puede ejecutarse una única vez con éxito por entorno — cualquier reintento (por error previo a mitad de script, por reutilización del archivo en un segundo entorno de prueba, etc.) rompe en la primera política.

## Solución implementada

Se agregó `DROP POLICY IF EXISTS <nombre> ON <tabla>;` inmediatamente antes de cada una de las 18 `CREATE POLICY` del script:

- 12 políticas de catálogos (`cat_industry_types`, `cat_plan_types`, `cat_tenant_statuses`, `cat_permissions`).
- `p_sedes_tenant_all`, `p_roles_tenant_all`.
- `p_role_permissions_tenant_select`, `p_role_permissions_tenant_write`.
- `p_urs_select`.

`DROP POLICY IF EXISTS` es sintaxis estándar de PostgreSQL (a diferencia de `ADD CONSTRAINT IF NOT EXISTS`, que no existe y que el propio encargo original prohibió usar) — no viola ninguna regla de reconstrucción ya establecida.

## Riesgos identificados

- Ninguno nuevo. `DROP POLICY` + `CREATE POLICY` en la misma transacción/script es un patrón estándar y no deja ninguna ventana sin política (ambas sentencias corren secuencialmente antes de que cualquier otra sesión pueda operar sobre la tabla en el mismo script).
- No se investigó ni se modificó el estado de la base de datos real donde el usuario ejecutó el script — se corrigió únicamente el archivo de referencia. El usuario deberá re-ejecutar el script corregido en ese mismo entorno.

## Impacto esperado

El script completo ahora puede ejecutarse de forma segura más de una vez contra el mismo entorno (re-ejecución tras error a mitad de script, o reutilización intencional), sin fallar por políticas duplicadas.

## Módulos afectados

- `docs/consolidacion/00000000000000_core_baseline.sql`

## Dependencias involucradas

Ninguna.

## Posibles efectos secundarios

Ninguno. `DROP POLICY IF EXISTS` sobre una política inexistente es un no-op silencioso; sobre una existente, la elimina y la siguiente sentencia la vuelve a crear con la misma definición.

## Verificación realizada

- Conteo de sentencias: 18 `CREATE POLICY` ↔ 18 `DROP POLICY IF EXISTS` (verificado con `grep -c`), uno por cada política, en el mismo orden.
- Revisión manual de que cada `DROP POLICY IF EXISTS` referencia el nombre de política y tabla correctos (coincidentes con el `CREATE POLICY` que le sigue).
- No se ejecutó contra un motor PostgreSQL real (sin Docker/psql en este entorno) — misma limitación declarada en los cambios anteriores de este mismo baseline.

## Cómo revertir

`git revert` del commit `fix(db): políticas RLS idempotentes en el baseline de consolidación`, o eliminar manualmente las 18 líneas `DROP POLICY IF EXISTS` agregadas.
