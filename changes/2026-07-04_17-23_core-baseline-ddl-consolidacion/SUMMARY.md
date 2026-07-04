# SUMMARY — Extracción de baseline DDL del Core Compartido e Identidad

## Qué se hizo

Se generó `docs/consolidacion/00000000000000_core_baseline.sql`: un script SQL de referencia (697 líneas) que reconstruye, a partir de las migraciones reales del proyecto, los esquemas, tablas y funciones "core" compartidas (identidad, tenants, roles/permisos, sedes) en su versión más reciente y madura.

## Por qué se hizo

El sistema hermano "GYMsos" se construyó sobre estas tablas y funciones sin incluirlas en su propio repositorio. Se necesita un baseline DDL confiable como primer paso de un proceso de consolidación de base de datos entre ambos sistemas.

## Qué beneficio aporta

- GYMsos (y cualquier otro consumidor futuro) obtiene una definición reproducible y documentada del core compartido, sin tener que adivinar el esquema a partir del comportamiento observado.
- Cada sección dudosa o incompleta queda marcada inline (`[AUDIT-OK]` / `[AUDIT-DOUBT]` / `[AUDIT-GAP]`) en vez de presentarse como 100% verificada, evitando que se asuma como verdad absoluta algo que no lo es.
- Resuelve explícitamente, a favor de la versión vigente, los conflictos de versión que el propio `AUDIT_REPORT_S1.md` había señalado (legacy vs. actual) para las 3 funciones núcleo.

## Qué funcionalidades quedaron afectadas

Ninguna. Es un artefacto de documentación/referencia (`docs/consolidacion/`), deliberadamente fuera de `supabase/migrations/` para no ser recogido por la CLI de Supabase del proyecto real vinculado. No se ejecutó contra ninguna base de datos.
