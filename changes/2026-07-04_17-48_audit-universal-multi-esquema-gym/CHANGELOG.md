# CHANGELOG — Reescritura de fn_trigger_audit_universal() para multi-esquema (ONG + GYMsos)

**Fecha:** 2026-07-04
**Hora:** 17:48 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (entregable de referencia — no ejecutado en ninguna base de datos)

## Objetivo del cambio

Reescribir `public.fn_trigger_audit_universal()` dentro del baseline `docs/consolidacion/00000000000000_core_baseline.sql` para que sirva de forma transparente como trigger de auditoría tanto al Sistema 1 (ONG, esquemas `ong`/`rrhh`/`finanzas`/`comunicaciones`) como al Sistema 2 (GYMsos, esquema `gym`), sin requerir que cada tabla nueva declare de antemano el nombre de su columna de tenant.

## Contexto del problema

La versión anterior de la función (extraída literal de `supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql`) dependía de `TG_ARGV[0]` para conocer el nombre de la columna de tenant de cada tabla, y usaba SQL dinámico (`EXECUTE format('SELECT ($1).%I::uuid', ...)`) para leerla — si la tabla no tenía esa columna, la ejecución fallaba con un error de columna inexistente. GYMsos opera en su propio esquema vertical (`gym`) y puede tener tablas sin columna `tenant_id` propia, o sin ningún sistema de auditoría unificado todavía.

## Motivo de la modificación

Antes de que GYMsos empiece a usar `fn_trigger_audit_universal()` sobre sus propias tablas, la función necesita: (a) tolerar tablas sin `tenant_id` sin fallar, (b) seguir identificando de forma inequívoca el tenant dueño de cada evento, y (c) distinguir en el log de qué esquema/sistema vino cada evento, ya que ahora hay más de un esquema vertical escribiendo en el mismo `audit_logs`.

## Solución implementada

1. **Eliminación de la dependencia de `TG_ARGV[0]`**: ya no es necesario declarar el nombre de la columna de tenant al crear el trigger. Los triggers existentes que aún pasen un argumento siguen funcionando (el argumento queda sin uso); las tablas nuevas se registran con `CREATE TRIGGER ... EXECUTE FUNCTION fn_trigger_audit_universal();` sin argumentos.
2. **Captura de `TG_TABLE_SCHEMA`**: como el modelo vigente de `audit_logs` no tiene una columna dedicada `schema_name` (eso pertenece al modelo legacy, distinto y ya descartado), el esquema de origen se codifica en `resource_name` como `'esquema.tabla'` (ej. `'gym.members'`, `'ong.activities'`), evitando un `ALTER TABLE audit_logs` fuera del alcance de este encargo.
3. **Resolución de `tenant_id` auto-detectable por fila**, en dos pasos:
   - (a) Lee `tenant_id` directamente del payload JSONB ya serializado (`to_jsonb(NEW)`/`to_jsonb(OLD)`) usando `->>`, que retorna `NULL` en vez de lanzar error si la columna no existe en esa tabla — esto es lo que permite que la misma función sirva a tablas de `gym` sin `tenant_id` propio.
   - (b) Si (a) no resuelve nada, hace fallback a `public.profiles` vía `auth.uid()`, con el mismo criterio que `fn_current_tenant_id()`, para que ningún log quede huérfano de inquilino.
4. **`SECURITY DEFINER` se mantiene** (ya estaba presente en la versión anterior) para que el trigger pueda escribir en `public.audit_logs` aunque el rol que dispara el cambio tenga permisos limitados en su esquema vertical.
5. **Salvaguarda heredada sin cambios**: si ni (a) ni (b) resuelven un tenant (p. ej. pre-onboarding sin profile asignado), la función omite el registro (`RETURN NULL`) en vez de abortar la transacción del llamador — el mismo comportamiento que corrigió el bug de la migración `20260302125000_fix_bootstrap_audit_tenant_null.sql`; no se reintrodujo ese bug.

## Riesgos identificados

- **`resource_name` cambia de formato**: pasa de `'tabla'` a `'esquema.tabla'`. Cualquier código existente que filtre o compare `audit_logs.resource_name` contra un nombre de tabla plano (sin esquema) dejará de coincidir. Se revisó `src/modules/ong/app/services/gobernanza/audit.service.ts` y `AuditLog.tsx` — quedan fuera del alcance de este cambio (no se tocaron), pero deben ajustarse para el nuevo formato antes de que esta versión de la función se aplique en el proyecto real.
- **Dependencias fuera de alcance sin resolver** (heredadas, no introducidas por este cambio): `public.audit_logs` y `public.plan_policies` siguen sin estar creadas en este baseline — la función seguirá fallando en tiempo de ejecución si se invoca antes de que ambas tablas existan en el entorno destino.
- **No se ejecutó contra un motor PostgreSQL real** (sin Docker/psql disponibles en este entorno). La verificación fue una revisión manual: balance de `$$`, orden de columnas del `INSERT`, y confirmación de que `->>` sobre `jsonb` no lanza error ante una clave ausente (comportamiento documentado de PostgreSQL, no supuesto).

## Impacto esperado

- Ningún impacto en el proyecto Democra en ejecución: el archivo sigue viviendo en `docs/consolidacion/`, fuera de `supabase/migrations/`.
- Deja la función lista, como entregable de referencia, para que el equipo de GYMsos pueda adjuntarla a triggers sobre tablas de su esquema `gym` sin más cambios.

## Módulos afectados

- `docs/consolidacion/00000000000000_core_baseline.sql` (sección 10, `fn_trigger_audit_universal()`)

## Dependencias involucradas

Ninguna nueva. Reutiliza `public.profiles`/`auth.uid()` ya presentes en el mismo baseline.

## Posibles efectos secundarios

- Ver "Riesgos": el cambio de formato de `resource_name` es observable por cualquier consumidor futuro de `audit_logs` y debe tenerse en cuenta al integrar el módulo de gobernanza/auditoría del frontend ONG con este nuevo formato.

## Verificación realizada

- Revisión manual del bloque `CREATE OR REPLACE FUNCTION`: balance de `$$`, orden columnas/valores del `INSERT`, y contraste de la lógica JSONB contra el comportamiento documentado de PostgreSQL para el operador `->>` sobre claves ausentes.
- **No se ejecutó contra un motor PostgreSQL real** — mismo motivo y misma limitación de entorno que en el cambio anterior (`changes/2026-07-04_17-23_core-baseline-ddl-consolidacion/`).

## Cómo revertir

`git revert` del commit `refactor(db): fn_trigger_audit_universal soporta multi-esquema ong/gym`, o restaurar la sección 10 anterior de `docs/consolidacion/00000000000000_core_baseline.sql` (ver commit previo `e12b1b2`).
