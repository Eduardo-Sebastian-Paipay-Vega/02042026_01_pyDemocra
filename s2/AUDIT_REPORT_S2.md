# AUDIT_REPORT.md
## Reporte de auditoría técnica de base de datos — Proyecto GIMNASIO / GYMsos

> Auditoría individual (sin comparación con otros proyectos). Fecha: 2026-07-02.
> Alcance: estructura de BD y elementos relacionados. No incluye datos, registros ni producción.
> Toda afirmación se sustenta en evidencia del repositorio (archivos SQL y `src/`).

---

## 1. RESUMEN EJECUTIVO

GYMsos es el frontend (Next.js 16 / React 18 / TypeScript) de un sistema de gestión de gimnasios cuyo backend es **Supabase (PostgreSQL)**. **No usa ORM** (Prisma/Drizzle/Sequelize/TypeORM/Knex ausentes): la estructura se gestiona con **SQL puro versionado** en `gymsos-frontend/migrations/` y el schema base `supabase-schema.sql`. El acceso desde el cliente es vía `@supabase/supabase-js` con **dos clientes** (uno por esquema: `gym` y `public`).

El hallazgo central es arquitectónico: **el proyecto no es una base de datos autónoma**, sino un **módulo montado sobre una "BD Maestra" compartida** (mismo proyecto Supabase donde ya opera un sistema "ONG"/multi-sede). Varias tablas y funciones núcleo (`tenants`, `profiles`, `roles`, `role_permissions`, `cat_permissions`, `sedes`, `user_roles_sedes`, `fn_has_permission(text,uuid)`, `fn_trigger_audit_universal`) son **referenciadas pero no están definidas en el repositorio**. En consecuencia, **el repositorio no es desplegable por sí solo**.

La evolución fue turbulenta: una arquitectura "standalone" inicial (migraciones 001-008) fue **revertida** (`000_ROLLBACK`) y **archivada**, dando paso al modelo módulo-BD-Maestra (009 en adelante). El historial muestra numerosos parches iterativos sobre `handle_new_user` (6 versiones) y sobre el sistema de permisos, con SQL ejecutado manualmente antes de versionarse.

**Estado general:** funcional en su flujo principal (signup → onboarding → RBAC), pero con **deuda técnica alta** en seguridad RLS, duplicación de mecanismos (roles y códigos) y **completitud de versionado**.

### Métricas
- Archivos SQL: 27 (12 activos, 13 archivados/superseded, 1 rollback, 1 diagnóstico). ~8.663 líneas.
- Tablas definidas en repo: 22 en `gym` + 7 en `public` = **29**.
- Tablas externas referenciadas (BD Maestra): **≥7**.
- Funciones vigentes: ~22 (+3 externas). Triggers: 2 (+1 externo). Políticas RLS: ~32 (+~20 externas). Índices: ~40.
- Vistas, procedimientos, enums, dominios, secuencias: **0**.

---

## 2. ARQUITECTURA ENCONTRADA

```
auth.users (Supabase)
   │  1─1
   ▼
public.profiles (EXTERNO/BD Maestra) ──tenant_id──► public.tenants (EXTERNO)
   │                                                     │
   │                                                     ├── public.roles (EXTERNO) ──► role_permissions ──► cat_permissions (EXTERNO)
   │                                                     │        ▲
   │                                                     │        │
   ▼                                                     │   public.user_roles (repo) ── code_grants ── codes ── code_usages (repo)
gym.usuarios ──id_gimnasio──► gym.gimnasios ──tenant_id──┘   public.user_permission_overrides (repo)
   │                              │                            public.audit_logs (repo)
   ├── membresias ── planes       ├── espacios ── maquinas
   ├── pagos                      ├── clases ── inscripciones / asistencias
   ├── accesos                    ├── promociones / codigos_acceso
   └── innovación: churn_*, gamification_*, digital_twin, ai_recommendations, wearable_sync, health_alerts
```

- **Multi-tenant** por `tenant_id` (BD Maestra) y `id_gimnasio` (dominio). El gym ES un tenant con `industry_type_id='gym'`.
- **RBAC granular**: `user_roles` → `role_permissions` → `cat_permissions`, con overrides por persona (`user_permission_overrides`), resueltos en `fn_my_permissions`/`fn_check_permission`.
- **Sistema de códigos genérico** (`codes`) multi-módulo con auditoría (`code_usages`) y RPCs.
- **Provisión automática** en el signup vía trigger `handle_new_user` (3 casos: dueño, staff/miembro con código, otro).

---

## 3. PROBLEMAS ENCONTRADOS

### 3.1 Estructurales / de versionado
- **P1 [ALTA] Dependencias externas no versionadas.** Migraciones 010, 015b, 016, 020 tienen FKs y llamadas a objetos inexistentes en el repo (`tenants`, `profiles`, `roles`, `role_permissions`, `cat_permissions`). No se pueden ejecutar en un Supabase limpio. Evidencia: `codes.tenant_id REFERENCES public.tenants(id)` (010:68); `fn_current_tenant_id` lee `public.profiles` (016:195); `user_permission_overrides.permission REFERENCES public.cat_permissions` (020:51).
- **P2 [ALTA] Orden de dependencias roto.** `fn_current_tenant_id()` se **usa en 010** (RLS `codes_tenant_*`) pero se **define en 016**. Ejecutar 010 antes de 016 en limpio falla. Indica que se ejecutó fuera de orden / manualmente.
- **P3 [MEDIA] SQL ejecutado manualmente antes de versionar.** 020 lo declara explícitamente ("ya fue ejecutado manualmente en el SQL Editor durante… E2E"). El scratch `00101` contiene objetos (seed_gym_roles, overrides) aplicados a mano. La BD real puede divergir de los archivos.
- **P4 [MEDIA] Numeración de migraciones con huecos e inconsistencias.** No hay `018` activo (revertido por 018b, ambos archivados); `015` original falló (solo existe `015b`); `019` es en realidad "019c" según su encabezado. Dificulta reproducir el estado.

### 3.2 Seguridad (RLS / permisos)
- **P5 [ALTA] Tablas con GRANT amplio y sin RLS de escritura.** `authenticated` recibe `INSERT/UPDATE/DELETE` sobre TODO `gym.*` (009), pero varias tablas carecen de políticas de escritura: `membresias`, `pagos`, `accesos`, `inscripciones`, `asistencias`, y todas las de innovación (`churn_*`, `gamification_*`, `digital_twin`, `ai_recommendations`, `wearable_sync`, `health_alerts`). Con RLS habilitado y sin política, se bloquea; **sin RLS habilitado, quedan totalmente abiertas**. `pagos` (financiero) es el caso más grave.
- **P6 [ALTA] RLS de escritura sin verificación de permiso.** `user_roles_admin_write` y `codes_tenant_write` solo comprueban `tenant_id = fn_current_tenant_id()`, sin exigir un permiso. Un usuario cualquiera del tenant podría **auto-asignarse roles** (escalada de privilegios) o crear códigos.
- **P7 [MEDIA] Enumeración de códigos.** `codigos_select_public` (gym.codigos_acceso) y `codes_public_lookup` permiten a `anon` leer códigos activos. Facilita fuerza bruta / descubrimiento de códigos de invitación.
- **P8 [MEDIA] Token sensible sin protección.** `wearable_sync.token_autenticacion` (TEXT plano) en tabla sin RLS propia.

### 3.3 Diseño / consistencia
- **P9 [MEDIA] Doble modelo de roles.** `gym.usuarios.rol` (enum texto) coexiste con RBAC `user_roles`. `handle_new_user` escribe en ambos; nada garantiza su sincronía a futuro. Fuente de doble verdad.
- **P10 [MEDIA] Tres mecanismos de códigos.** `gym.codigos_acceso` (009), `gym.promociones` (base) y `public.codes` (010) resuelven necesidades solapadas. Aumenta superficie de mantenimiento.
- **P11 [BAJA] Discrepancia tipo TS ↔ schema.** `DbClase` declara `id_entrenador`/`id_espacio` NOT NULL; la BD los permite NULL. Igual patrón en otros tipos.
- **P12 [BAJA] Conteo de permisos erróneo en comentario.** 016 dice "31 permisos" pero inserta 30.
- **P13 [BAJA] Dos generadores UUID mezclados** (`uuid_generate_v4` vs `gen_random_uuid`).
- **P14 [BAJA] "Inmutabilidad" no forzada.** `code_usages`/`audit_logs` se documentan inmutables pero no hay trigger/constraint que impida UPDATE/DELETE.

---

## 4. CÓDIGO MUERTO Y OBJETOS SIN USO

> Ninguno se elimina; se reportan para revisión.

### 4.1 Tablas huérfanas (0 referencias en frontend)
- `gym.maquinas`, `gym.entrenadores`, `gym.asistencias`, `gym.churn_interventions`, `gym.digital_twin`, `gym.wearable_sync`, `gym.espacios`, `gym.promociones` — confirmado 0 `.from()` en `src/`. Estructura/RLS presentes pero **sin UI**.
- `public.audit_logs` — sin lectura desde frontend (solo destino del trigger externo).
- **9 tablas de innovación quedaron en `public` (nunca movidas a `gym` por 009) y son CÓDIGO MUERTO con FK potencialmente ROTAS:** `battle_pass_progression`, `clanes`, `clan_miembros`, `torneos_semanales`, `marketplace_vendors`, `marketplace_transactions`, `corporate_clients`, `corporate_leaderboards`, `dynamic_pricing_log`. Sin frontend, sin RLS, sin parches; varias declaran FK hacia `usuarios`/`gimnasios` que 009 movió a `gym` → FK rotas. **P15 [MEDIA]: archivar o reconstruir.**

### 4.2 Funciones sin uso desde frontend (vigentes en BD, potencialmente llamadas por otros procesos)
- `public.fn_use_code`, `public.fn_revoke_code`, `gym.bootstrap_gym_tenant`, `gym.join_gym_with_code` — definidas y con GRANT, pero sin `.rpc()` en `src/`. `bootstrap`/`join` fueron sustituidas por el trigger `handle_new_user`.

### 4.3 Funciones muertas (solo en archive, nunca en estado final)
- `rpc_registrar_nuevo_miembro`, `rpc_verificar_y_registrar_acceso` (archive/001), `log_audit_event` (archive/002). Revertidas por `000_ROLLBACK`.

### 4.4 Archivos muertos / no ejecutables
- `migrations/archive/00101_cl_sup_SCRATCH_no_usar_como_migracion.sql` — el propio nombre indica "no usar como migración". Contiene markdown mezclado con SQL (`sqlCREATE TABLE...`, `###sql`) → **no ejecutable tal cual**.
- `migrations/archive/018_*` + `018b_revert_*` — par anulado.
- `migrations/audi/*.md` (1.md–4.md, BACKLOG-TECNICO-*, PLAN-MAESTRO-*, PLAN-STAFF-MANAGEMENT, UX-UI-SPEC-*) — documentación de auditorías/planes previos, no estructura.
- `migrations/audi/trigger_debug_checklist.sql` — solo introspección (SELECTs), no modifica BD.

---

## 5. MIGRACIONES SOSPECHOSAS / A REVISAR

| Migración | Diagnóstico | Recomendación |
|---|---|---|
| `archive/00101_SCRATCH` | Borrador con SQL corrupto (markdown embebido). Objetos aplicados a mano. | Extraer a migración formal `021_seed_gym_roles.sql` bien formada, o archivar definitivamente. Revisión manual. |
| `015` (original, ausente) | Falló por `audit_logs` inexistente. Solo sobrevive `015b`. | Documentar que 015 nunca debe ejecutarse; consolidar en 015b. |
| `018` + `018b` | Par introducir/revertir (`fn_get_my_profile` industry_type). | Confirmar que el estado neto es el de 014; ambos deben quedar archivados. |
| `019` (=019c) | Tercer intento tras 019/019b descartados por ambigüedad de overload. | OK aplicada; renombrar para reflejar que es la única válida. |
| `009` | Auto-contenida y muy grande (mueve tablas + crea todo). Idempotente pero frágil ante estados intermedios. | Mantener; añadir verificación previa de esquema. |

---

## 6. TABLAS SOSPECHOSAS

- **`public.audit_logs`** — estructura *inferida* reactivamente desde un trigger externo, no diseñada. Verificar que coincide con lo que el trigger real inserta.
- **Tablas de innovación `gym.*`** — 8 tablas creadas "a futuro" (RF-019..038); la mitad sin UI ni RLS. Riesgo de acumular superficie sin valor entregado.
- **`gym.codigos_acceso`** — duplica `public.codes`. Decidir cuál es canónica.

---

## 7. FUNCIONES SOSPECHOSAS

- **`fn_has_permission`** — colisión de overloads `(text)` [repo] vs `(text,uuid)` [externo]. Documentado que alterarla rompe ~20 RLS externas. El frontend debe usar `fn_check_permission`. **Deuda peligrosa**: dos funciones con nombre igual y semántica distinta.
- **`handle_new_user`** — 6 redefiniciones; la lógica final (017) es larga, con `EXCEPTION WHEN OTHERS` que **silencia errores** (RAISE WARNING + RETURN NEW). Un fallo de provisión (p.ej. tenant no creado) resulta en usuario sin perfil sin señal visible. Revisar manejo de errores.
- **`_gym_plan_to_bd` / `_gym_plan_to_licenses`** — mapeos hardcodeados (grande→pro). Verificar que los `plan_id` destino existen en el catálogo externo.

---

## 8. ÍNDICES SOSPECHOSOS

- **Redundantes:** `idx_codes_code`, `idx_codes_status_active`, `idx_codes_lookup` se solapan → evaluar dejar solo `idx_codes_lookup`.
- **Innecesario:** `idx_code_grants_code` duplica el prefijo de la PK `(code_id, role_id)`.
- **Uso dudoso:** `idx_user_roles_role` (sin consultas por role_id aislado).
- El resto están justificados por patrones de acceso.

---

## 9. ARCHIVOS INNECESARIOS / A ORGANIZAR

- Carpeta `migrations/archive/` (13 archivos) — bien nombrada; conservar como historial, no ejecutar.
- Carpeta `migrations/audi/` — mezcla documentación (.md) con un `.sql` de diagnóstico; mover docs a `docs/` para no confundir con migraciones.
- `supabase-schema.sql` — punto de partida histórico (30 tablas en public); su convivencia con migraciones que mueven a `gym` confunde. Añadir cabecera "SOLO estado inicial; ver 009".
- Nombre `019_fix_fn_create_staff_code_overload_call.sql` con encabezado interno "019c" — inconsistencia menor.

---

## 10. RIESGOS, ADVERTENCIAS Y CONFLICTOS

- **RIESGO CRÍTICO:** Repositorio no autodesplegable (P1). Un despliegue nuevo requiere la BD Maestra externa, no incluida ni documentada como script.
- **RIESGO ALTO:** Escalada de privilegios vía RLS write sin permiso (P6); datos financieros (`pagos`) potencialmente sin RLS de escritura (P5).
- **ADVERTENCIA:** Divergencia BD real ↔ repo por ejecución manual (P3). La reconstrucción de este informe se basa en archivos; el estado en Supabase debe verificarse con introspección (`information_schema`, `pg_policies`, `pg_proc`).
- **CONFLICTO:** Doble modelo de roles (P9) y triple mecanismo de códigos (P10).
- **CONFLICTO de nombres:** `user_roles` (repo) vs `user_roles_sedes` (externo); `fn_has_permission/1` vs `/2`.

---

## 11. RECOMENDACIONES

### Prioridad ALTA
1. **Versionar/definir la BD Maestra** o crear un script de contrato (`000_bd_maestra_prereqs.sql`) que declare/valide `tenants, profiles, roles, role_permissions, cat_permissions, sedes, user_roles_sedes` y funciones externas. (Resuelve P1, P2.)
2. **Auditar y cerrar RLS de escritura** en todas las tablas `gym.*` con GRANT a `authenticated`, especialmente `pagos`, `membresias`, `accesos` y las de innovación. (P5.)
3. **Exigir permiso en políticas write** de `user_roles` y `codes` (p.ej. `fn_check_permission('gym.codigos.crear')`). (P6.)
4. **Verificar el estado real en Supabase** con introspección y conciliar con los archivos (detectar objetos aplicados a mano). (P3.)

### Prioridad MEDIA
5. Consolidar el **modelo de roles** (elegir RBAC como única verdad; `gym.usuarios.rol` como caché derivada o eliminarla). (P9.)
6. Unificar **mecanismos de códigos** en `public.codes`; deprecar `gym.codigos_acceso` y evaluar `promociones`. (P10.)
7. Restringir `SELECT` público de códigos (validación server-side vía RPC, no lectura directa anon). (P7.)
8. Formalizar el scratch `00101` en una migración limpia y numerada, o archivarlo definitivamente. (P4.)
9. Endurecer `handle_new_user`: registrar fallos de provisión de forma observable (tabla de errores o audit_logs) en lugar de silenciarlos. (Sección 7.)
10. Proteger `wearable_sync.token_autenticacion` (RLS + cifrado/segregación). (P8.)

### Prioridad BAJA
11. Eliminar índices redundantes (`idx_codes_code`, `idx_codes_status_active`, `idx_code_grants_code`, `idx_user_roles_role`) tras confirmar planes de ejecución. (Sección 8.)
12. Alinear tipos TS con nullability real del schema. (P11.)
13. Unificar generador UUID (`gen_random_uuid`) y corregir el conteo "31→30" de permisos. (P12, P13.)
14. Mover `audi/*.md` a `docs/`; añadir cabeceras aclaratorias a `supabase-schema.sql`. (Sección 9.)
15. Añadir triggers anti-modificación a `code_usages`/`audit_logs` para hacer efectiva su inmutabilidad. (P14.)

---

## 12. ELEMENTOS QUE REQUIEREN REVISIÓN HUMANA

- **Definición real de la BD Maestra** (`tenants, profiles, roles, role_permissions, cat_permissions, sedes, user_roles_sedes`, catálogos `plan_id`/`status_financial_id`/`industry_type_id`, permisos `ace.perms.*`): no consta en el repo → **Requiere revisión manual** contra Supabase.
- **Estado real de RLS por tabla** (habilitado/deshabilitado y políticas efectivas): no determinable solo desde archivos por la ejecución manual → **Requiere introspección** (`pg_policies`, `pg_class.relrowsecurity`).
- **Overload `fn_has_permission(text,uuid)`** y las ~20 políticas RLS que dependen de él: fuera del repo → **Requiere revisión manual**.
- **Contenido/uso del trigger externo `fn_trigger_audit_universal()`**: confirmar compatibilidad con la estructura de `audit_logs` creada en 015b.
- **Confirmar qué migraciones se aplicaron realmente y en qué orden** en el entorno vigente.

---

## 13. CONCLUSIÓN

El proyecto tiene un diseño ambicioso y en gran parte coherente (multi-tenant + RBAC + códigos + auditoría), pero arrastra **deuda técnica alta** en tres frentes: **completitud del versionado** (dependencias externas y ejecución manual), **seguridad RLS** (grants amplios sin políticas de escritura / sin verificación de permisos) y **duplicación de modelos** (roles y códigos). El flujo principal funciona, pero el repositorio **no es reproducible de forma aislada** y su superficie de seguridad requiere endurecimiento antes de considerarlo apto para producción. Ninguna corrección debe aplicarse a la BD sin seguir el flujo obligatorio de migraciones definido en `CLAUDE.md` (documentar → analizar → aprobar → validar → ejecutar).

---
*FIN AUDIT_REPORT.md*
