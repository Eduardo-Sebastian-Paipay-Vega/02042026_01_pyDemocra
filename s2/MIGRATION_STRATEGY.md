# MIGRATION_STRATEGY — Fase 4: Síntesis del árbol de migraciones unificado

> **Rol:** Release Manager · **Fecha:** 2026-07-04 · **Sistema 2 (GYMsos / Gimnasio).**
> **Meta:** que la BD sea 100% reproducible desde cero: `supabase init` → `supabase start` aplica
> `supabase/migrations/*` en orden lexicográfico sin fallos de dependencia.
> **Base:** `REORG_PLAN_S2.md` (capas por dependencia) + Fase 2 (armonización) + `021` (Fase 3).
> Ejecutar cambios reales bajo el flujo obligatorio de `CLAUDE.md`.

---

## 1. Principio de la secuencia

Supabase aplica las migraciones por **orden de nombre** (`<timestamp>_slug.sql`). El orden se
diseña por **capas de dependencia**, no por historia de commits, para resolver el bloqueo **P2**
(`fn_current_tenant_id` se usaba en `010` antes de crearse en `016`) y **P1** (dependencias del Core):

`Baseline Core → tablas gym → helpers RLS → tablas public → funciones → políticas → seeds+trigger → armonización → hardening`

Regla de oro: **toda función/tabla auxiliar de RLS se crea ANTES de cualquier `CREATE POLICY` que la invoque.**

---

## 2. Secuencia definitiva de `supabase/migrations/`

| # | Archivo (`supabase/migrations/`) | Fase | Origen (migraciones viejas fusionadas) | Rol |
|---|---|---|---|---|
| 1 | `20260701000000_core_baseline.sql` | 1 | `supabase db dump --schema-only` del proyecto Core | BD Maestra: `tenants, profiles, roles, role_permissions, cat_permissions, sedes, user_roles_sedes`, `fn_has_permission(text,uuid)`, `fn_trigger_audit_universal`, catálogos. **Resuelve P1.** |
| 2 | `20260701000100_core_baseline_contract.sql` | 1 | nuevo (guard) | `DO $$ ... RAISE EXCEPTION` si falta algún objeto del Core. Fallo temprano y claro. |
| 3 | `20260701010000_gym_schema_and_domain.sql` | — | `009` (DDL) + `014` (cols avatar) + `015b` (`tenant_id` en gimnasios) | Schema `gym`, 22 tablas de dominio, `codigos_acceso`, índices. Capa 1. |
| 4 | `20260701020000_rls_context_helpers.sql` | — | `fn_current_tenant_id` de **`016`** + `get_user_gym/rol`, `gym.current_gym_id` de `009` | **Adelanta helpers → resuelve P2.** Capa 2. |
| 5 | `20260701030000_public_codes_tables.sql` | — | `010` (tablas `cat_code_types`, `codes`, `code_usages` + seeds tipos) | Capa 3. |
| 6 | `20260701040000_public_rbac_audit_tables.sql` | — | `015b` (`audit_logs`) + `016` (`user_roles`, `code_grants`) + `020` (`user_permission_overrides`) | Capa 4. |
| 7 | `20260701050000_functions_codes_profile_rbac.sql` | — | `010` (fn_*_code), `012`/`014` (`fn_get_my_profile` v2), `016` (`fn_has_permission`), `019` (`fn_create_staff_code` final), `020` (`fn_my_permissions` v2, `fn_check_permission`) | Versión final única de cada función. **Resuelve P4.** Capa 5. |
| 8 | `20260701060000_rls_policies_gym_public.sql` | — | políticas de `009`+`013` (gym) y `010`+`012`+`015b`+`016`+`020` (public) | Todas las `CREATE POLICY` tras los helpers. Capa 6. |
| 9 | `20260701070000_seeds_rbac_and_handle_new_user.sql` | — | seeds de `016` + backfill `011`/`015b` + `handle_new_user` final (`017`) + trigger | Colapsa 5 redefiniciones del trigger en una. Capa 7. |
| 10 | `20260702000000_codes_polymorphic_multitenant.sql` | 2 | nuevo | `code_type` (CHECK gym+ong+ace), `context_payload` JSONB, índice `idx_codes_tenant_type_code`. |
| 11 | `20260702010000_sync_gym_rol_to_rbac.sql` | 2 | nuevo | Trigger mediador `gym.usuarios.rol → public.user_roles` (resiliente). |
| 12 | `20260704130000_security_hardening_rls.sql` | 3 | = `021` | Cierre: revoca grants masivos, RLS unificado, deny-all, cierre `anon`. **Debe ir último.** |

> **Nota sobre grants:** la "capa 8 de grants amplios" del `REORG_PLAN` queda **suprimida**: la
> postura final de privilegios la define íntegramente `021` (revoke masivo + re-grant por tabla).
> No se versiona ningún `GRANT ON ALL TABLES`.

---

## 3. Limpieza quirúrgica

### 3.1 Archivos que salen del flujo principal (mover a `supabase/migrations_archive/` o borrar)

| Ruta actual | Acción | Motivo (AUDIT_REPORT S2) |
|---|---|---|
| `gymsos-frontend/migrations/000_ROLLBACK_001_to_008.sql` | Archivar | Revierte arquitectura standalone; ya cumplió. No es estado final. |
| `gymsos-frontend/migrations/009`…`020` (12 archivos) | Archivar (fuente, no ejecutable) | Superseded por las capas §2 #3–#9. Se conservan como historia. |
| `gymsos-frontend/migrations/archive/00101_cl_sup_SCRATCH_*.sql` | **Eliminar** | "no usar como migración"; SQL corrupto con markdown embebido. |
| `gymsos-frontend/migrations/archive/001`…`008`,`008b`,`015`,`018`,`018b` | Mantener archivado | Ya en `archive/`; revertidos/superseded (`015` original falló, `018/018b` se anulan). |
| `gymsos-frontend/migrations/audi/*.md` (14 archivos) | Mover a `docs/auditoria/` | Documentación/planes, no estructura. |
| `gymsos-frontend/migrations/audi/trigger_debug_checklist.sql` | Mover a `docs/` o eliminar | Solo SELECTs de diagnóstico; contamina el historial si el CLI lo procesa. |
| `gymsos-frontend/supabase-schema.sql` | Archivar con cabecera | Superseded por `core_baseline` + capa 1. Añadir "SOLO estado inicial histórico". |
| `gymsos-frontend/migrations/2026-07-04_1300_fase3_hardening_rls.sql` | **Eliminar** | Borrador idéntico a `021` (canónico). Duplicado. |
| `gymsos-frontend/migrations/2026-07-04_1200_*.sql`, `_1230_*.sql` | Renombrar/mover | Son Fase 2; su versión canónica va como #10 y #11 (timestamps `20260702*`). |
| `REORG_PLAN_S2.md` | Mover a `docs/` | Documento de planificación; no es migración. |

### 3.2 Código muerto de base de datos (no archivos — objetos)

| Objeto | Acción | Nota |
|---|---|---|
| 9 tablas innovación en `public` (`battle_pass_progression`, `clanes`, `clan_miembros`, `torneos_semanales`, `marketplace_vendors`, `marketplace_transactions`, `corporate_clients`, `corporate_leaderboards`, `dynamic_pricing_log`) | Blindadas por `021` (6 tenant / 3 deny-all). Decisión de producto: `DROP` o mantener con `COMMENT ON`. | FK rotas, sin UI, sin refs (P15). No borrar sin decisión de producto. |
| Índices redundantes `idx_codes_code`, `idx_codes_status_active`, `idx_code_grants_code`, `idx_user_roles_role` | Evaluar `DROP` tras medir con `pg_stat_user_indexes` | Prioridad baja (AUDIT §8). |
| Extensión `uuid-ossp` | Retirar si nada usa `uuid_generate_v4` | Unificar en `gen_random_uuid`. |

### 3.3 Aclaración de alcance (importante)

Los módulos **`donaciones`, `impacto`, `gamificacion.*`** y carpetas `_archive_legacy_session/`, `ONG/`
**pertenecen al Sistema 1 (Democra ONG)**, NO al repositorio del Gimnasio (S2). En S2 el código muerto
equivalente son las 9 tablas huérfanas de `public` y las carpetas `archive/`+`audi/`. No mezclar
limpiezas entre repos: cada sistema archiva lo suyo.

---

## 4. Árbol de carpetas final (Sistema 2)

```
gymsos-frontend/
├─ supabase/
│  ├─ config.toml                                   # nuevo (supabase init)
│  ├─ migrations/
│  │  ├─ 20260701000000_core_baseline.sql           # Fase 1
│  │  ├─ 20260701000100_core_baseline_contract.sql  # Fase 1 (guard)
│  │  ├─ 20260701010000_gym_schema_and_domain.sql   # Capa 1
│  │  ├─ 20260701020000_rls_context_helpers.sql     # Capa 2  (resuelve P2)
│  │  ├─ 20260701030000_public_codes_tables.sql     # Capa 3
│  │  ├─ 20260701040000_public_rbac_audit_tables.sql# Capa 4
│  │  ├─ 20260701050000_functions_codes_profile_rbac.sql # Capa 5
│  │  ├─ 20260701060000_rls_policies_gym_public.sql # Capa 6
│  │  ├─ 20260701070000_seeds_rbac_and_handle_new_user.sql # Capa 7
│  │  ├─ 20260702000000_codes_polymorphic_multitenant.sql  # Fase 2
│  │  ├─ 20260702010000_sync_gym_rol_to_rbac.sql    # Fase 2
│  │  └─ 20260704130000_security_hardening_rls.sql  # Fase 3 (=021)  ← último
│  ├─ migrations_archive/                           # historia, NO ejecutable
│  │  ├─ 000_ROLLBACK_001_to_008.sql
│  │  ├─ 009…020_*.sql                              # fuente de las capas
│  │  ├─ 001…018b_*.sql                             # ex archive/
│  │  └─ supabase-schema.sql                        # con cabecera "histórico"
│  └─ seed.sql                                      # opcional: catálogos idempotentes
├─ docs/
│  ├─ auditoria/                                    # ex migrations/audi/*.md
│  ├─ REORG_PLAN_S2.md
│  └─ MIGRATION_STRATEGY.md                         # este archivo
└─ changes/                                         # bitácora de cambios (flujo CLAUDE.md)
   └─ 2026-07-04_13-00_fase3-hardening-rls/{CHANGELOG,SUMMARY,FILES_CHANGED}.md
```

Eliminados físicamente: `archive/00101_*SCRATCH*.sql`, `migrations/2026-07-04_1300_fase3_hardening_rls.sql` (duplicado).

---

## 5. Verificación de reproducibilidad (criterio de cierre Fase 4)

1. `supabase db reset` (aplica todo el árbol §4 en limpio) termina **sin error**.
2. `grep -rn "fn_current_tenant_id" migrations/` → un único `CREATE` (capa 2), resto invocaciones.
3. Ninguna `CREATE POLICY` precede a la capa 2 por timestamp.
4. `handle_new_user`, `fn_create_staff_code`, `fn_get_my_profile` aparecen **una sola vez** (final).
5. `021` es el último timestamp; tras aplicarlo, no hay grants masivos ni lectura `anon` de códigos.
6. `supabase migration list` coincide 1:1 con la tabla §2.

---

## 6. Orden de trabajo sugerido

1. Generar `core_baseline.sql` con `supabase db dump --schema-only` del proyecto real (revisión humana).
2. Materializar las capas #3–#9 extrayendo el SQL de `009`–`020` según el mapa de `REORG_PLAN_S2.md`.
3. Colocar Fase 2 (#10, #11) y Fase 3 (#12 = `021`).
4. Ejecutar `supabase db reset` en entorno limpio y validar §5.
5. Archivar/eliminar según §3. Commit por Conventional Commits; documentar en `changes/`.

> Cada paso que toque la BD real pasa por: documentar → analizar → aprobar → validar → ejecutar.
