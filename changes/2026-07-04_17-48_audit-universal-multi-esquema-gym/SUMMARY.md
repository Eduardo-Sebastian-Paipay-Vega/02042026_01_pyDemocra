# SUMMARY — Reescritura de fn_trigger_audit_universal() para multi-esquema (ONG + GYMsos)

## Qué se hizo

Se reescribió `public.fn_trigger_audit_universal()` en `docs/consolidacion/00000000000000_core_baseline.sql` para que un único trigger de auditoría sirva tanto a las tablas del Sistema 1 (ONG) como a las del Sistema 2 (GYMsos, esquema `gym`), sin requerir configuración previa por tabla.

## Por qué se hizo

GYMsos carece de un sistema de logs unificado y opera sobre tablas que pueden no tener columna `tenant_id`. La versión anterior de la función exigía declarar esa columna por adelantado vía `TG_ARGV[0]` y fallaba si no existía — un obstáculo directo para reusarla en el esquema `gym`.

## Qué beneficio aporta

- Un solo trigger de auditoría, reusable en cualquier esquema (`ong`, `rrhh`, `gym`, ...), sin argumentos por configurar.
- Tolera tablas sin `tenant_id` propio (fallback automático vía `profiles`/`auth.uid()`), evitando huérfanos de inquilino.
- El origen (esquema.tabla) de cada evento queda identificable en `resource_name` sin necesitar una columna nueva en `audit_logs`.

## Qué funcionalidades quedaron afectadas

Ninguna en el proyecto en ejecución (cambio en un archivo de referencia, `docs/consolidacion/`, no aplicado a ninguna base de datos). Se documentó como riesgo a resolver antes de aplicar en producción: el formato de `resource_name` cambia de `'tabla'` a `'esquema.tabla'`, lo que puede afectar a futuro código consumidor de `audit_logs` (ver `audit.service.ts`/`AuditLog.tsx` del módulo de gobernanza ONG, no modificados en este cambio).
