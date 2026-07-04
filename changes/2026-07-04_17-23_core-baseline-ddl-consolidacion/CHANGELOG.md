# CHANGELOG — Extracción de baseline DDL del Core Compartido e Identidad

**Fecha:** 2026-07-04
**Hora:** 17:23 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (entregable de referencia — no ejecutado en ninguna base de datos)

## Objetivo del cambio

Extraer un script SQL de inicialización (`00000000000000_core_baseline.sql`) que defina, de forma limpia y sintácticamente válida para PostgreSQL 16/Supabase, los objetos que constituyen el "Core Compartido e Identidad" de este proyecto: esquemas base, tablas núcleo de `public` (`tenants`, `profiles`, `roles`, `role_permissions`, `cat_permissions`, `sedes`, `user_roles_sedes`) y las funciones núcleo en su versión más reciente (`fn_current_tenant_id()`, `fn_trigger_audit_universal()`, `fn_bootstrap_tenant()`).

## Contexto del problema

Se está iniciando un proceso de consolidación de base de datos con un sistema hermano ("Sistema 2 / GYMsos"), que fue construido sobre estas tablas y funciones core sin incluirlas en su propio repositorio. Antes de consolidar, se necesita un DDL baseline confiable, extraído directamente de fuentes verificadas (migraciones reales ya aplicadas y documentos de auditoría técnica previamente generados en este mismo proyecto: `AUDIT_REPORT_S1.md`, `DATABASE_MASTER_SCRIPT_S1.md`, `DATABASE_DICTIONARY_S1.md`), no reconstruido de memoria.

## Motivo de la modificación

Sin este baseline, GYMsos no puede recrear ni versionar el core compartido de forma reproducible, lo que bloquea cualquier estrategia de consolidación (migración compartida, submódulo, o esquema replicado).

## Solución implementada

1. **Fuente primaria = migraciones reales, no el markdown de auditoría.** Para cada función y tabla en conflicto de versiones se leyó el archivo de migración original (`supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql`, entre otros) en lugar de confiar en la reconstrucción de los documentos de auditoría, resolviendo así los conflictos que el propio `AUDIT_REPORT_S1.md` señalaba (legacy vs. vigente) a favor de la versión vigente pedida explícitamente:
   - `fn_current_tenant_id()`: versión `SECURITY DEFINER` sobre `profiles` (no la legacy basada en `current_setting`).
   - `fn_trigger_audit_universal()`: versión con `TG_ARGV` y modelo moderno de `audit_logs`.
   - `fn_bootstrap_tenant()`: firma completa de 5 parámetros, idempotente.
2. **Todas las tablas creadas llevan `ENABLE ROW LEVEL SECURITY`**, según regla explícita del encargo.
3. **Políticas RLS**: se incluyeron donde había evidencia literal en las fuentes auditadas; donde no la había, se documentó explícitamente en vez de inventar contenido (ver "Riesgos" y marcas `[AUDIT-*]` inline en el propio SQL).
4. **Orden de dependencias respetado**: extensiones → esquemas → catálogos → `tenants` → `profiles` → funciones → tablas dependientes de las funciones → seeds, verificado a mano porque `LANGUAGE sql` y los `DEFAULT` con llamada a función se validan contra el catálogo en tiempo de `CREATE`, a diferencia de `LANGUAGE plpgsql` (cuerpo opaco, validado solo en tiempo de ejecución).
5. **Marcado de auditoría inline** con comentarios `-- [AUDIT-OK]`, `-- [AUDIT-DOUBT]` y `-- [AUDIT-GAP]` en cada sección dudosa o con dependencias fuera de alcance (p. ej. `fn_bootstrap_tenant()` referencia `subscription_contracts`/`entitlements`/`plan_policies`, que no fueron pedidos ni incluidos).
6. **Ubicación deliberada en `docs/consolidacion/`** en vez de `supabase/migrations/`, para que la CLI de Supabase de este repo (vinculado a un proyecto real) no intente aplicar este archivo en un futuro `supabase db push`. Ver detalle en "Riesgos".

## Riesgos identificados

- **No hay política RLS confirmada para `public.tenants`** en ninguna fuente auditada. La tabla se crea con RLS habilitado pero **sin política**, lo que en Postgres equivale a denegar todo acceso salvo al rol propietario/superusuario — se documentó como `[AUDIT-GAP]` en vez de inventar una política.
- **`role_permissions`**: la política incluida es una reconstrucción basada en el join lógico esperado (`role_id` pertenece a un `roles` del tenant actual), no una copia literal de una política existente verificada — marcada `[AUDIT-DOUBT]`.
- **Funciones `fn_has_permission()` y `fn_is_tenant_admin()`** están referenciadas conceptualmente en la auditoría pero no están definidas en ninguna fuente disponible; se excluyeron deliberadamente de las políticas de `user_roles_sedes` (solo se dejó `SELECT`) para no fabricar lógica de autorización no verificada.
- **Seeds de catálogos** (`cat_industry_types`, `cat_plan_types`, `cat_tenant_statuses`, incluyendo el valor `'gym'`) se incluyeron por ser mencionados explícitamente en el encargo, pero sus valores exactos (más allá de `'gym'`) no están 100% verificados contra una fuente única — marcados `[AUDIT-DOUBT]`.
- **Este script nunca se ejecutó contra una base de datos real.** No hay Docker ni `psql`/`pg_ctl` disponibles en este entorno para levantar un Postgres desechable y validar el DDL de extremo a extremo; la verificación fue una revisión manual línea por línea (balance de delimitadores `$$`, orden de dependencias, cantidad de columnas/valores en cada `INSERT`, tipo de comando y cláusulas de cada `CREATE POLICY`). Esto se declara explícitamente para no reclamar una verificación de ejecución que no ocurrió.

## Impacto esperado

- Ningún impacto en el proyecto Democra en ejecución: el archivo vive en `docs/consolidacion/`, fuera de `supabase/migrations/`, por lo que no es recogido por la CLI de Supabase ni afecta el proyecto vinculado real.
- Sirve como entregable de referencia para el equipo de GYMsos / la siguiente fase de consolidación.

## Módulos afectados

- `docs/consolidacion/` (nuevo)

## Dependencias involucradas

Ninguna en el proyecto en ejecución. Es un artefacto de documentación/DDL de referencia, no código de aplicación.

## Posibles efectos secundarios

Ninguno sobre el sistema actual. Si en el futuro este script se ejecuta contra una base de datos real (propia o de GYMsos), deben resolverse primero los `[AUDIT-GAP]` señalados (política de `tenants`, tablas `audit_logs`/`plan_policies`/`subscription_contracts`/`entitlements` que las funciones referencian pero no crean).

## Verificación realizada

- Revisión manual completa del SQL (697 líneas): balance de bloques `$$...$$`, orden de dependencias de `CREATE TABLE`/`CREATE FUNCTION`, coincidencia de columnas/valores en cada `INSERT`, y validez de cláusulas de cada `CREATE POLICY`.
- Contraste directo contra las migraciones reales (`20260302125000_fix_bootstrap_audit_tenant_null.sql`, `20260301120000_ai_security_copilot.sql`, `20260305110000_rls_hardening_p0.sql`) para las 3 funciones núcleo, evitando confiar solo en la reconstrucción de los documentos de auditoría.
- **No se ejecutó contra un motor PostgreSQL real** (sin Docker/psql disponibles en este entorno) — ver "Riesgos" para el detalle honesto de esta limitación.

## Cómo revertir

Eliminar `docs/consolidacion/00000000000000_core_baseline.sql` (y la carpeta si queda vacía) o `git revert` del commit `docs(db): extrae baseline DDL del core compartido para consolidación con GYMsos`. No hay ningún otro archivo del proyecto afectado.
