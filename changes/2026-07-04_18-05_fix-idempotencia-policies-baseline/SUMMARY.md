# SUMMARY — Fix: políticas RLS no idempotentes en el baseline de consolidación

## Qué se hizo

Se agregó `DROP POLICY IF EXISTS` antes de cada una de las 18 `CREATE POLICY` en `docs/consolidacion/00000000000000_core_baseline.sql`, para que el script pueda re-ejecutarse sin error.

## Por qué se hizo

El usuario ejecutó el script contra una base de datos real y obtuvo `ERROR: 42710: policy "p_cat_industry_types_read" for table "cat_industry_types" already exists` — `CREATE POLICY` no es idempotente en PostgreSQL (a diferencia de `CREATE TABLE IF NOT EXISTS`), así que cualquier segunda ejecución fallaba de inmediato.

## Qué beneficio aporta

El script puede ejecutarse más de una vez de forma segura contra el mismo entorno, sin perder ni duplicar políticas.

## Qué funcionalidades quedaron afectadas

Ninguna. Es un fix de forma (idempotencia), no cambia el contenido ni el criterio de ninguna política.
