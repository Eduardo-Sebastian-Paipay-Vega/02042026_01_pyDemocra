# FASE 5 — Ajuste de consumidores y guardrails

> Sistema 2 (GYMsos). La BD ya está consolidada, ordenada y blindada (Fases 1–4).
> Esta fase adapta el cliente Next.js, el tipado y añade el guard de despliegue.

## 1. Cliente de Supabase (patrón definitivo)

**Problema actual:** dos `createClient` (`supabase`→gym, `supabasePublic`→public) comparten
`storageKey` pero siguen siendo dos instancias de GoTrueClient → advertencia y riesgo de
sesión inconsistente. No hay forma de consultar `ong` sin un tercer cliente.

**Solución:** una única instancia + `.schema()` (supabase-js v2). Ver `src/lib/supabase.unified.ts`.

```ts
import { db, auth, gymDb, publicDb, ongDb, dbFor } from "@/lib/supabase.unified"

await gymDb.from("usuarios").select("*")               // esquema gym
await publicDb.from("codes").select("*")               // esquema public
await ongDb.from("access_links").select("*")           // esquema ong
await db.rpc("fn_check_permission", { p_permission: "gym.pagos.ver" })  // RPC en public
const { data: { user } } = await auth.getUser()        // sesión compartida
```

**Requisito de infraestructura (ya cubierto):** `config.toml` expone
`schemas = ["public","gym","ong","graphql_public"]`; sin ello PostgREST no sirve `gym.*`.

**Migración del código existente** (búsqueda y reemplazo guiado):

| Antes | Después |
|---|---|
| `import { supabase } from "@/lib/supabase"` | `import { gymDb, auth, db } from "@/lib/supabase.unified"` |
| `supabase.from("usuarios")` | `gymDb.from("usuarios")` |
| `supabasePublic.from("codes")` | `publicDb.from("codes")` |
| `supabase.auth.getUser()` | `auth.getUser()` |
| `supabasePublic.rpc("fn_check_permission", …)` | `db.rpc("fn_check_permission", …)` |

`supabase` y `supabasePublic` se mantienen exportados como alias `@deprecated` para no romper
imports durante la transición; retirar cuando el reemplazo esté completo.

## 2. Tipado fuerte — regeneración de `database.types.ts`

Ejecutar en la raíz de `gymsos-frontend/` (requiere Docker + `supabase start` corriendo, o
`--project-id` para remoto). Incluir los esquemas `gym` y `ong` para absorber el polimorfismo
de códigos (`code_type`, `context_payload`) y la estructura unificada:

```bash
# Local (recomendado tras `supabase db reset`):
supabase gen types typescript --local --schema public --schema gym --schema ong \
  > src/lib/database.types.ts

# Alternativa contra el proyecto remoto vinculado:
supabase gen types typescript --project-id "<PROJECT_REF>" \
  --schema public --schema gym --schema ong \
  > src/lib/database.types.ts
```

Tras regenerar, `createClient<Database>` (en `supabase.unified.ts`) da autocompletado y
verificación de tipos sobre las tres capas. Corrige de paso la discrepancia TS↔schema
documentada (P11: `DbClase.id_entrenador/id_espacio` deben ser `| null`).

## 3. Schema Guard consolidado (guardrail de despliegue)

Archivo: `supabase/migrations/99999999999999_schema_guard_consolidated.sql` (corre último por
timestamp máximo). Es un "unit test" de BD: no crea nada; valida y aborta con `RAISE EXCEPTION`
si el estado no es el esperado. Comprueba:

1. Tablas core del baseline (`public.tenants/profiles/roles/role_permissions/cat_permissions`).
2. Esquema `gym` + 14 tablas de dominio + 8 de innovación.
3. `public.fn_current_tenant_id()` presente (ancla RLS).
4. RLS **habilitado** en las 22 tablas gym.
5. Nº de políticas `%_tenant_isolation` en gym ≥ nº de tablas gym.
6. Las 3 huérfanas no mapeables con RLS on y **cero** políticas (deny-all correcto).
7. `anon` **sin** `SELECT` sobre `public.codes` ni `gym.codigos_acceso` (P7 cerrado).

Si todo pasa: `RAISE NOTICE '✅ SCHEMA GUARD: despliegue válido…'`.

## 4. Cierre reproducible (checklist)

```bash
supabase init            # si aún no; ya existe config.toml
supabase start
supabase db reset        # aplica migraciones (incl. baseline #1) + seed.sql; el guard corre al final
supabase gen types …     # regenerar tipos (paso 2)
npm run build            # el frontend compila contra database.types.ts
```

Verde en `db reset` (incluido el `RAISE NOTICE` del guard) = BD 100% reproducible desde cero.
