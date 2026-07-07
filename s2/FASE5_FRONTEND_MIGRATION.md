# FASE 5 — Migración de consumidores Next.js → `supabase.unified.ts`

> BD viva y reproducible (reset OK + guard verde). Ahora se adaptan los consumidores.
> Regla de oro (supabase-js v2): `.schema()` da builders con SOLO `.from`/`.rpc`.
> `.auth` y `.storage` van SIEMPRE por `auth` / `storage` del cliente completo.

## Mapa de reemplazo

| Uso antiguo | Nuevo |
|---|---|
| `supabase.from("<tabla gym>")` | `gymDb.from("…")` |
| `supabasePublic.from("<tabla public>")` | `publicDb.from("…")` |
| `supabase.rpc(…)` / `supabasePublic.rpc(…)` | `db.rpc(…)` (o `publicDb.rpc(…)`) |
| `supabase.auth.*` | `auth.*` |
| `supabase.storage.*` | `storage.*` |

## Orden recomendado (de mayor a menor apalancamiento)

### PASO 1 — `src/lib/services/base.ts` ⭐ (keystone: arregla ~todos los servicios de golpe)
Todos los servicios (`accesos`, `ai`, `alerts`, `clases`, `gamification`, `planes`, `usuarios`…)
importan `supabase` desde `./base` y solo hacen `.from()` sobre tablas `gym`. Redirigir aquí el
símbolo `supabase` al builder `gymDb` los arregla **sin tocar ningún archivo de servicio**.

```diff
- import { supabase } from "@/lib/supabase"
-
- export { supabase }
+ // supabase (compat) ahora apunta al esquema gym; los servicios usan solo .from(gym.*)
+ import { gymDb as supabase } from "@/lib/supabase.unified"
+
+ export { supabase }
```

> Efecto: `accesos.service.ts`, `ai.service.ts`, `alerts.service.ts`, `clases.service.ts`,
> `gamification.service.ts`, `planes.service.ts` quedan migrados sin editarse (solo usan `.from`).

### PASO 2 — `src/lib/services/usuarios.service.ts` (único servicio con `.auth`)
Tiene BOM al inicio (línea 1) y usa `supabase.auth.signUp`. `.from("usuarios")` ya va por base.

```diff
- ﻿import { supabase, handleSupabaseError, type PaginatedResult, type QueryOptions } from "./base"
+ import { supabase, handleSupabaseError, type PaginatedResult, type QueryOptions } from "./base"
+ import { auth } from "@/lib/supabase.unified"
  import type { DbUsuario } from "@/lib/supabase"
  …
-   const { data: authData, error: authError } = await supabase.auth.signUp({
+   const { data: authData, error: authError } = await auth.signUp({
```
(quitar también el carácter BOM al guardar en UTF-8 sin firma).

### PASO 3 — `src/components/providers/auth-provider.tsx` (núcleo de sesión)
```diff
- import { supabase, supabasePublic } from "@/lib/supabase"
+ import { auth, publicDb } from "@/lib/supabase.unified"
```
Reemplazos en el archivo:
- `supabase.auth.getSession()` → `auth.getSession()`
- `supabase.auth.onAuthStateChange(…)` → `auth.onAuthStateChange(…)`
- `supabase.auth.signInWithPassword(…)` → `auth.signInWithPassword(…)`
- `supabase.auth.signOut()` → `auth.signOut()` (todas las ocurrencias)
- `supabasePublic.rpc("fn_my_permissions")` → `publicDb.rpc("fn_my_permissions")`
- `supabasePublic.rpc("fn_get_my_profile")` → `publicDb.rpc("fn_get_my_profile")`

### PASO 4 — Páginas y hooks (hojas, bajo riesgo)

`src/hooks/usePermissions.ts`
```diff
- import { supabasePublic } from "@/lib/supabase"
+ import { publicDb } from "@/lib/supabase.unified"
```
(`supabasePublic.rpc(…)` → `publicDb.rpc(…)`)

`src/app/dashboard/gerente/permisos/page.tsx`
```diff
- import { supabasePublic } from "@/lib/supabase"
+ import { publicDb } from "@/lib/supabase.unified"
```
`supabasePublic.rpc("fn_check_permission", …)` → `publicDb.rpc("fn_check_permission", …)`

`src/app/dashboard/gerente/staff/page.tsx`
```diff
- import { supabase, supabasePublic } from "@/lib/supabase"
+ import { auth, publicDb } from "@/lib/supabase.unified"
```
`supabasePublic.rpc("fn_create_staff_code", …)` → `publicDb.rpc(…)`; cualquier `supabase.auth.*` → `auth.*`.

`src/app/onboarding/page.tsx`
```diff
- import { supabase, supabasePublic } from "@/lib/supabase"
+ import { auth, storage, publicDb } from "@/lib/supabase.unified"
```
- `supabase.storage.from("avatars").upload(…)` → `storage.from("avatars").upload(…)`
- `supabase.storage.from("avatars").getPublicUrl(…)` → `storage.from("avatars").getPublicUrl(…)`
- `supabase.auth.signUp(…)` → `auth.signUp(…)`
- `supabasePublic.rpc("fn_update_my_avatar", …)` → `publicDb.rpc(…)`

`src/app/signup/page.tsx`
```diff
- import { supabase, supabasePublic } from "@/lib/supabase"
+ import { auth, publicDb } from "@/lib/supabase.unified"
```
- `supabasePublic.rpc("fn_validate_code", …)` → `publicDb.rpc(…)`
- `supabase.auth.signUp(…)` → `auth.signUp(…)`

### PASO 5 — Convertir `src/lib/supabase.ts` en barrel de solo-tipos
Conservar los tipos `Db*` (los usa el código) y dejar de crear clientes ahí:
```diff
- import { createClient } from "@supabase/supabase-js"
- … (bloque de creación de supabase / supabasePublic) …
+ // Clientes movidos a supabase.unified.ts. Este módulo conserva solo los tipos de dominio.
+ export { db, auth, storage, gymDb, publicDb, ongDb, dbFor } from "./supabase.unified"
  export type { Rol as DbRol } from "./roles"
  export type DbEstado = …
  export interface DbUsuario { … }   // (sin cambios)
```
Así `import { DbUsuario } from "@/lib/supabase"` sigue resolviendo durante y después de la transición.

## Verificación (en tu terminal)
```bash
# Debe existir el archivo de tipos generado:
test -f src/lib/database.types.ts && echo OK

# Sin referencias colgantes a los clientes viejos:
grep -rnE "supabase(Public)?\.(auth|storage)" src   # debe quedar vacío tras migrar
grep -rn "from \"@/lib/supabase\"" src               # solo imports de TIPOS (Db*)

npm run build   # compila contra database.types.ts → verde = migración correcta
```

## Por dónde empezar
Empieza por **PASO 1 (`base.ts`)**: es un cambio de una línea que migra en cascada todos los
servicios de dominio. Luego PASO 3 (auth-provider, concentra la sesión) y termina con las hojas
(PASO 4). El PASO 5 se hace al final, cuando ya nadie importe `supabase`/`supabasePublic` como cliente.
