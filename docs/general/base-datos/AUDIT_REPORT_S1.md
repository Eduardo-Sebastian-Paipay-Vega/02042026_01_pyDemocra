# AUDIT_REPORT — Auditoría técnica de base de datos · Democra ONG Platform

> **Fecha:** 2026-07-03 · **Auditor:** revisión técnica automatizada (arquitecto/DBA/auditor)
> **Alcance:** estructura completa de BD y todo lo relacionado (migraciones, funciones, RLS, storage, Edge Functions, scripts, documentación, código muerto). SIN datos de producción.
> **Documentos hermanos:** `DATABASE_MASTER_SCRIPT.md` (DDL reconstruido) · `DATABASE_DICTIONARY.md` (diccionario por objeto).
> **Regla:** nada fue eliminado; todo hallazgo se documenta con evidencia y ruta de archivo.

---

## 1. RESUMEN EJECUTIVO

El proyecto es un **SaaS multi-tenant para gestión de ONGs** sobre **Supabase/PostgreSQL 16**, sin ORM (acceso vía `@supabase/supabase-js` + tipos manuales). La base de datos abarca **11 schemas** (`public`, `ong`, `rrhh`, `finanzas`, `donaciones`, `clinico`, `academico`, `gamificacion`, `impacto`, `comunicaciones`, `auditoria`), ~**100 tablas**, **15 funciones**, **1 vista**, ~**150 políticas RLS**, **3 buckets de Storage** y **3 Edge Functions**.

Estado general: el **núcleo operativo (public core/IAM, ong, rrhh, finanzas, clinico, comunicaciones)** está activamente usado y razonablemente endurecido (RLS por tenant + hardening P0). Sin embargo:

1. **La estructura real de la BD no es reproducible desde el repositorio.** Las migraciones versionadas (10 en `supabase/migrations/` + 4 en `ONG/supabase/migrations/`) son *deltas* sobre un baseline que solo existe como "scripts maestros documentales" en Markdown (`docs/`), varios de los cuales están desactualizados o contienen sintaxis inválida. Un despliegue limpio desde el repo **fallaría** (el propio `schema_guard` exige objetos que ningún archivo crea).
2. **Existen dos trails de migraciones independientes** (raíz y `ONG/supabase/`), con convenciones de versión distintas, sin orden global definido.
3. **4 módulos completos parecen muertos** (`donaciones`, `gamificacion`, `impacto`, y gran parte de tablas sueltas) — 0 referencias en código.
4. **Conflictos de definición** en objetos críticos: `fn_current_tenant_id`, `fn_trigger_audit_universal`, `fn_bootstrap_tenant`, `fn_has_permission` (firma), `audit_logs` (dos modelos de columnas), `mfa_challenges` (columna mal documentada).
5. **Doble fuente de verdad para invitaciones**: `rrhh.codigos_registro_voluntario` (legacy, aún viva vía RPC + Edge Function) y `public.access_links` (ACE, nuevo motor).
6. Abundante **material archivado/duplicado** en el árbol del proyecto (carpetas legacy, subproyecto ONG/ duplicado, carpetas vacías).

---

## 2. ARQUITECTURA ENCONTRADA

- **Frontend admin (raíz `src/`)**: React 18 + Vite; incluye `src/modules/ong/` (versión integrada del app ONG, con tipos ACE — la más nueva).
- **Subproyecto `ONG/`**: aplicación ONG independiente (propio package.json, node_modules, `ONG/src/` — **duplicado más antiguo** de `src/modules/ong/`, sin tipos ACE). Sigue activa en `npm run dev:all` (`dev:ong`).
- **Backend `server/`**: Express 5; usa `SUPABASE_SERVICE_ROLE_KEY` para IAM (roles/asignaciones), motor de riesgo/MFA (`mfa_challenges`, `auth_events`, `devices`), estado financiero (`tenants`, `subscription_contracts`) y auditoría.
- **BD**: multi-tenant por RLS con `fn_current_tenant_id()` (SECURITY DEFINER sobre `profiles`); autorización por `cat_permissions`/`role_permissions`/`user_roles_sedes`; motor ACE (links → membresías contextuales) añadido 2026-05-10; auditoría universal por trigger con retención por plan.
- **Storage**: buckets `avatars` (público), `evidence` (privado por tenant), `id_templates` (público).
- **Edge Functions** (solo en `ONG/supabase/functions/`): aprovisionamiento admin, revocación de sesiones, consumo de códigos de registro legacy.
- **Sin**: Prisma/Drizzle/Sequelize/TypeORM/Knex, Docker, config.toml de Supabase, seeds versionados.

---

## 3. AUDITORÍA DE MIGRACIONES

### 3.1 Trail raíz `supabase/migrations/`

| # | Archivo | Objetivo | Crea/Modifica | Estado / Veredicto |
|---|---|---|---|---|
| 1 | `20260301120000_ai_security_copilot.sql` | Seguridad PIN/MFA | + cols seguridad en profiles; + mfa_challenges + 2 índices + 4 políticas | **VIGENTE**. Debe permanecer. Depende de tenants/profiles/fn_current_tenant_id (baseline no versionado) |
| 2 | `20260302125000_fix_bootstrap_audit_tenant_null.sql` | Fix onboarding/auditoría | Redefine fn_current_tenant_id, fn_trigger_audit_universal (TG_ARGV), fn_bootstrap_tenant (5 args) | **VIGENTE**. Debe permanecer |
| 3 | `20260305100000_schema_guard.sql` | Guard de despliegue | DO $$ que falla si faltan objetos críticos | **VIGENTE con defecto**: exige trigger `tr_audit_profiles` y políticas que **ninguna migración del repo crea** → en BD limpia el guard falla ANTES de que 20260305110000 cree las políticas (orden por timestamp: 100000 < 110000). **Requiere revisión manual** |
| 4 | `20260305110000_rls_hardening_p0.sql` | Hardening RLS P0 | Políticas profiles/URS + tenant_id NOT NULL/FK/índice en URS + catálogos read-only + tr_audit_urs | **VIGENTE**. Debe permanecer |
| 5 | `20260305_rls_hardening.sql` | Hardening RLS (versión extendida) | Igual que #4 **más** p_profiles_select/insert y bloque D (tablas inglesas inexistentes) | **DUPLICADA/SOSPECHOSA**: ~85% redundante con #4; nombre sin timestamp completo → **su versión ordena ANTES que #3 y #4** (lexicográficamente "20260305" < "20260305100000"), invirtiendo el orden aparente. Su bloque D es copy/paste sin efecto (users/projects/tasks... no existen). p_profiles_select/insert SOLO existen aquí. **Requiere decisión: consolidar o archivar** |
| 6 | `20260510000000_ace_fase0_base_structures.sql` | ACE F0 | 5 tablas ACE + índices + triggers + RLS on + grants + seeds | **VIGENTE**. Guard de prereqs correcto |
| 7 | `20260510100000_ace_fase1_onboarding_rpc.sql` | ACE F1 | fn_complete_access_onboarding + seed permiso | **VIGENTE**; la RPC aún no se invoca desde servicios (ver §6) |
| 8 | `20260510200000_ace_fase2_legacy_sync.sql` | ACE F2 | Snapshot URS→memberships; fn_sync_urs_to_membership + trigger; snapshot codigos→access_links | **VIGENTE**; snapshot es one-shot (códigos legacy creados DESPUÉS no se re-sincronizan) |
| 9 | `20260510210000_ace_fase3_rls_policies.sql` | ACE F3 | 20 políticas ACE + fn_validate_access_code + grants anon | **VIGENTE** |
| 10 | `20260510220000_ace_fase4_optimization.sql` | ACE F4 | 2 índices parciales + fn_has_context_access + vista v_user_session_context | **VIGENTE** |

### 3.2 Trail secundario `ONG/supabase/migrations/`

| Archivo | Objetivo | Veredicto |
|---|---|---|
| `20260331_phase1_permissions_multischema.sql` | GRANTs multi-schema + RPCs | **VIGENTE**, pero duplicada textualmente dentro de `docs/ong/scripts/Parte 4` (sección "PARCHE"). Referencia rutas `guidelines/BD/*.txt` que **ya no existen** (ONG/guidelines/BD está vacía) |
| `20260401_phase1_2_storage_evidence_bucket.sql` | Bucket evidence + 3 políticas | **VIGENTE**. Sin política DELETE (¿intencional?) |
| `20260426_add_nota_inscripciones_storage_bucket.sql` | nota 0-20 + doc de bucket avatars | **DEFECTUOSA**: `ADD CONSTRAINT IF NOT EXISTS` no es sintaxis válida de PostgreSQL → la migración tal cual **falla**. Mitad del archivo son instrucciones comentadas (no ejecutables). **Requiere revisión manual** |
| `20260501_fix_hierarchy_actividades_tareas.sql` | Invertir jerarquía Actividad/Tarea | **VIGENTE y CRÍTICA** (rompe compatibilidad con Parte 2: DROP COLUMN id_tarea/id_proyecto). Tareas antiguas quedan huérfanas (id_actividad NULL) hasta reasignación manual |
| `diagnose_hierarchy.sql` | Diagnóstico de la anterior | **NO ES MIGRACIÓN** (solo SELECTs). Está en la carpeta de migraciones → si el CLI la procesa, contaminaría el historial. **Debe archivarse fuera de migrations/** |

### 3.3 Problemas estructurales del sistema de migraciones

- **Baseline ausente**: ninguna migración crea tenants, profiles, roles, schemas de módulos, etc. El baseline vive solo en Markdown (docs) con errores de sintaxis (`ADD CONSTRAINT IF NOT EXISTS` masivo en Parte 1 §14) → **no ejecutable**.
- **Dos carpetas de migraciones** sin orden global (raíz vs ONG/). Riesgo de aplicar en orden incorrecto en un entorno nuevo.
- **Convención de nombres inconsistente**: `20260305_rls_hardening.sql` (sin hora) rompe el orden lexicográfico/versionado del CLI.
- **BOM**: commit `ece5f73` menciona "fix BOM migrations" — indicio de problemas previos de codificación en archivos de migración.

---

## 4. CONFLICTOS DE DEFINICIÓN (evidencia de deriva documental)

| Objeto | Versión A (obsoleta) | Versión B (vigente) | Riesgo |
|---|---|---|---|
| `fn_current_tenant_id` | `current_setting('app.current_tenant_id')` (Parte 1) | SELECT sobre profiles, SECURITY DEFINER (migraciones) | Si algún entorno conserva A, TODA la RLS devuelve NULL → aislamiento roto |
| `fn_trigger_audit_universal` | Sin TG_ARGV; inserta en columnas legacy | TG_ARGV('tenant_id'); columnas nuevas; tolera tenant NULL | El trigger antiguo `trg_user_roles_sedes_audit` (sin argumento) + función nueva = **excepción en cada write de URS** si ambos persisten |
| `audit_logs` (columnas) | schema_name/table_name/operation/old_data/new_data/changed_by | event_type/resource_name/payload_before/payload_after/actor_id/criticality/retention_until | Documentación y consultas históricas incompatibles |
| `fn_bootstrap_tenant` | 4 parámetros, sin validación (Parte 1) | 5 parámetros, SECURITY DEFINER, idempotente | Dos sobrecargas podrían coexistir en BD (firmas distintas) → ambigüedad |
| `fn_has_permission` | `(text)` definida (Parte 1) | `(text, uuid)` usada por RLS y GRANT — **definición ausente del repo** | Si solo existe (text), TODAS las políticas de hardening/ACE fallan al evaluarse |
| `mfa_challenges` | `otp_hash` (DB_MAESTRA) | `code_hash` + `context` (migración + server) | Error documental puro |
| `cat_module_statuses` | valores 'active/inactive/trial' (DB_MAESTRA) | seeds 'enabled/disabled/paused' (Parte 3 §H) | fn_is_module_enabled compara 'enabled' — la doc induciría a error |
| Jerarquía ong | Proyecto→Tarea→Actividad (Parte 2) | Proyecto→Actividad→Tarea (migración 20260501) | Parte 2 ya no es reconstruible tal cual |
| Política id_card_templates | permiso `manage_id_cards` | catálogo define `idcards.manage` | Escrituras de plantillas solo posibles para tenant admin (condición nunca true para otros) — posible bug funcional |
| `p_profiles_insert` | AUDIT-07 propone `tenant_id IS NULL` | Migración exige `tenant_id = fn_current_tenant_id()` | Insert directo de perfil pre-onboarding bloqueado por RLS (mitigado por SECURITY DEFINER del bootstrap) |
| DB_MAESTRA TOC | Promete §2.4–2.8 (finanzas/clinico/academico/comunicaciones/auditoria), §3 y §4 | Secciones **ausentes** del archivo | "Fuente única de verdad" incompleta |

---

## 5. CÓDIGO MUERTO Y ELEMENTOS SIN USO (BD)

**Módulos completos sin ninguna referencia en código, tipos, grants ni DB_MAESTRA:**
- `donaciones.*` (5 tablas: donantes, campanas, ingresos_donacion, donor_interactions, donor_pledges)
- `gamificacion.*` (5 tablas: insignias, puntos_ledger, volunteer_badges, gamification_rules, kudos)
- `impacto.*` (5 tablas: ods_globales [seed incompleto 4/17], kpi_indicadores, kpi_mediciones, project_ods, kpi_targets)

**Tablas sueltas sin uso detectado:**
`public.invoice_lines`, `public.payment_methods`, `public.payment_webhook_events`, `public.system_modules`, `public.dynamic_forms`, `public.role_module_access`, `public.role_field_permissions` (ACE F0 sin consumo aún), `ong.activity_requirements`, `ong.logros_beneficiario`, `ong.supervisiones`, `rrhh.admission_requirements`, `rrhh.admission_requirement_reviews`, `rrhh.volunteer_preferences`, `academico.asistencias`, `comunicaciones.user_devices`, `comunicaciones.sync_queue`, `comunicaciones.entity_versions`.

**Funciones sin llamadas:** `fn_is_module_enabled`, `fn_has_context_access` (diseñada para RLS futura), `fn_complete_access_onboarding` (grant listo; sin `.rpc()` en servicios — la integración FASE 6 del commit 315c234 usa solo `fn_validate_access_code` y la vista).

**Índices probablemente redundantes** (prefijo simple `(tenant_id)` cubierto por compuestos): `idx_ong_voluntarios_tenant`, `idx_ong_actividades_tenant`, `idx_ong_tareas_tenant`, `idx_fin_transacciones_tenant`, `idx_sessions_tenant`, `idx_audit_logs_tenant`, `idx_payment_transactions_tenant`; en `memberships`, `idx_memberships_active` solapa con `idx_memberships_active_lookup`. Confirmar con `pg_stat_user_indexes` antes de tocar.

**Políticas sin efecto:** bloque D de `20260305_rls_hardening.sql` (tablas inglesas inexistentes); políticas avatars comentadas en 20260426.

**Extensión candidata a limpieza:** `uuid-ossp` (nada usa uuid_generate_v4; todo es gen_random_uuid).

---

## 6. ARCHIVOS Y CARPETAS MUERTOS / SOSPECHOSOS EN EL PROYECTO

| Ruta | Tipo | Evidencia / Recomendación |
|---|---|---|
| `_archive_legacy_session/` (html/ + js/) | Carpeta archivo explícito | Login/onboarding/OTP legacy en HTML+JS vanilla. Sin referencias. **Documentado; candidato a archivado externo** |
| `ONG/` (subproyecto completo, con node_modules) | Duplicado antiguo | `ONG/src/lib/db/ong/app-database.ts` (1284 líneas, sin tipos ACE) vs `src/modules/ong/.../app-database.ts` (1375, con ACE). Duplicación real de todo el app. Sigue arrancando vía `npm run dev:ong`. **Riesgo de divergencia; consolidar** |
| `ONG/guidelines/BD/` | Carpeta **vacía** | Referenciada por la migración 20260331 ("guidelines/BD/Parte 2....txt") → referencia muerta |
| `Landing Page Design Request/` | Experimento de diseño con node_modules propio | Sin integración con el resto. Candidato a archivado |
| `audit/` | Carpeta **vacía** | Referenciada por migraciones ("Base: audit/AUDIT-07-rls-recomendado.sql") — el contenido se movió a `docs/general/auditorias-y-patches/`. Referencia muerta |
| `indi-info/` | Carpeta **vacía** | Sin propósito detectable |
| `.codex-dev-arch.*.log`, `.codex-dev-ong.*.log` | Logs de herramienta en raíz | Basura de sesiones; añadir a .gitignore |
| `.sixth/`, `ONG/.codex/` | Config de herramientas AI | No relacionados con BD; documentados |
| `supabase/.temp/` | Cache del CLI Supabase | Contiene project-ref/versiones; **no debería versionarse** |
| `docs/legacy/referencias-antiguas/` | Docs legacy explícitos | OK como archivo histórico |
| `supabase/tests/fase1_onboarding_test.sql` | Prueba manual | Correctamente marcada "NO es migración"; contiene placeholders TU_TENANT_ID |
| `ONG/supabase/migrations/diagnose_hierarchy.sql` | Script diagnóstico en carpeta de migraciones | **Mover fuera de migrations/** |
| `PROMPT_INTEGRA.md`, `docs/ong/indices/99-cierre-integral-repo.md` | Prompts/planes de sesiones AI | Históricos; sin efecto en BD |
| `docs/general/scripts-maestros/Parte 1` y `docs/ong/scripts/Parte 2-4` | Baseline documental | ÚNICO origen del baseline; contienen sintaxis inválida y versiones obsoletas de funciones → **no ejecutables tal cual** |

---

## 7. RIESGOS Y ADVERTENCIAS

### Seguridad
1. **`fn_has_permission(text, uuid)` indefinida en repo** — si en la BD real no existe con DEFAULT en el 2º parámetro, o existe solo la de 1 arg, las políticas de profiles/URS/ACE lanzan error en cada evaluación (los errores en políticas bloquean la operación, lo cual "falla cerrado", pero rompe la app).
2. **Políticas `FOR ALL USING (tenant_id = fn_current_tenant_id())` en módulos** no exigen permisos funcionales: cualquier usuario autenticado del tenant puede escribir en finanzas, clinico (datos médicos y de menores), rrhh, etc. La granularidad de `cat_permissions` solo se aplica en RPCs y frontend. **Datos clínicos con criticidad máxima dependen solo del aislamiento por tenant.**
3. **`auditoria.audit_log` con política FOR ALL** (insert/update/delete permitidos por RLS a nivel de fila): contradice inmutabilidad forense; mitigada solo por GRANT SELECT.
4. **Triggers duplicados de auditoría en `user_roles_sedes`** (legacy sin argumento + vigente con argumento): posible ruptura de escrituras o doble auditoría.
5. **`profiles.tenant_id` reasignable por `fn_complete_access_onboarding`** (upsert `tenant_id = excluded.tenant_id`): un usuario existente que consuma un link de otro tenant **migra de tenant** silenciosamente. Diseño intencional del ACE, pero es un vector de secuestro de contexto si un link se filtra.
6. `.env` real presente en el repo local con claves (verificar que no esté commiteado — `.gitignore` existe pero confirmar historial).

### Integridad
7. **Doble fuente de verdad de invitaciones** (codigos_registro_voluntario ↔ access_links): la sincronización FASE 2 fue snapshot único; los flujos legacy (RPC + Edge Function) siguen escribiendo solo en la tabla vieja.
8. **`finanzas.cuentas.saldo_actual` sin mecanismo de consistencia** con transacciones (ni trigger ni RPC atómica): riesgo de descuadre contable.
9. **FKs faltantes**: horas_actividad.id_voluntario, evidencias_actividad.id_voluntario, asignaciones_*.id_voluntario, fichas_medicas.id_beneficiario, transacciones.id_proyecto, historial_notificaciones.id_plantilla (Parte 3 §C pudo cubrir algunas — verificar en BD).
10. **Tareas huérfanas** tras 20260501 (id_actividad NULL) hasta reasignación manual.
11. **server/routes/iam.js elimina de user_roles_sedes por columna `id`** que no existe en el DDL reconstruido.

### Operación
12. **Despliegue limpio imposible** desde el repo (baseline ausente + schema_guard que exige objetos no creados + migración con sintaxis inválida).
13. **Orden de migraciones ambiguo** (dos trails + nombre sin timestamp).
14. **Seeds de catálogos no versionados**: un entorno nuevo no tendría géneros, países, monedas, estados, planes → FKs y bootstrap fallarían.

---

## 8. ELEMENTOS QUE REQUIEREN REVISIÓN HUMANA

1. Confirmar en la BD real (pg_proc) la firma efectiva de `fn_has_permission` y si la versión (text) coexiste con (text, uuid).
2. Confirmar existencia/definición de `tr_audit_profiles` y del trigger legacy `trg_user_roles_sedes_audit`.
3. Confirmar columnas reales de `audit_logs` (¿modelo nuevo, viejo, o mezcla?).
4. Confirmar si `20260305_rls_hardening.sql` y `20260305110000_rls_hardening_p0.sql` se aplicaron ambas y en qué orden.
5. Confirmar si el CHECK `inscripciones_nota_rango` existe (migración 20260426 con sintaxis inválida).
6. Confirmar GRANT USAGE de schemas `ong`/`academico` a authenticated.
7. Confirmar políticas RLS reales de `rrhh.codigos_registro_voluntario`, `rrhh.registro_documentos_postulante`, `finanzas.cat_tipos_cuenta`, `finanzas.aprobaciones_transaccion`, `clinico.accesos_sensibles_voluntario_log`, `public.tenants`, `public.invoice_lines`, `public.system_modules`.
8. Confirmar si `user_roles_sedes` tiene columna `id` en la BD real (bug del server si no).
9. Decidir el destino de los módulos muertos (donaciones/gamificacion/impacto) y de las tablas sueltas sin uso.
10. Confirmar origen de datos de `auditoria.audit_log` (¿triggers creados fuera del repo?).
11. Exportar seeds reales de todos los catálogos.
12. Verificar si `fn_complete_access_onboarding` se invoca desde algún flujo no detectado (FASE 6).

---

## 9. RECOMENDACIONES POR PRIORIDAD

### PRIORIDAD ALTA (integridad/seguridad/reproducibilidad)
1. **Generar un baseline real** con `supabase db dump --schema-only` (o `pg_dump -s`) del proyecto remoto y versionarlo como migración 0. Esto resuelve de golpe los puntos 1-8 de revisión humana y hace reproducible el entorno.
2. **Resolver la duplicidad `20260305_rls_hardening.sql` vs `..._rls_hardening_p0.sql`**: consolidar en una sola (manteniendo p_profiles_select/insert) y archivar la otra con nota.
3. **Eliminar/regularizar el trigger legacy `trg_user_roles_sedes_audit`** y crear formalmente `tr_audit_profiles` en una migración (hoy solo lo exige el guard).
4. **Unificar el motor de invitaciones**: hacer que `rrhh.fn_generate_registration_code` y la Edge Function escriban/lean `access_links`, o programar sincronización continua; hoy hay bifurcación de datos.
5. **Endurecer RLS de datos clínicos** (`clinico.*`): exigir `fn_has_permission('clinico...')`/`governance.sensitive.read` en las políticas, no solo tenant.
6. **Corregir el permiso `manage_id_cards` → `idcards.manage`** en la política de `ong.id_card_templates`.
7. **Versionar los seeds de catálogos** (script idempotente ON CONFLICT DO NOTHING).

### PRIORIDAD MEDIA
8. Unificar los dos trails de migraciones (mover las de `ONG/supabase/migrations/` al trail raíz con timestamps completos) y sacar `diagnose_hierarchy.sql` de la carpeta.
9. Corregir `20260426` (CHECK con DO $$ + pg_constraint) y re-aplicar.
10. Añadir FKs faltantes (id_voluntario, id_beneficiario, id_proyecto, id_plantilla) tras validar datos.
11. Consolidar `ONG/` vs `src/modules/ong/` (eliminar la copia vieja del app y su `app-database.ts` divergente; conservar Edge Functions y migraciones reubicadas).
12. Actualizar `DB_MAESTRA.md`: completar §2.4–2.8/§3/§4 prometidos, corregir `otp_hash`→`code_hash`, `cat_module_statuses`, z_index default.
13. Definir mecanismo de consistencia para `finanzas.cuentas.saldo_actual` (trigger o RPC transaccional).
14. Resolver el DELETE por `id` en `server/routes/iam.js` contra la PK compuesta real.
15. Reasignar tareas huérfanas (id_actividad NULL) y luego evaluar NOT NULL.

### PRIORIDAD BAJA
16. Marcar formalmente (COMMENT ON) o archivar los módulos muertos: `donaciones`, `gamificacion`, `impacto`, y tablas sueltas sin uso (lista en §5). No borrar sin decisión de producto.
17. Depurar índices redundantes de prefijo `(tenant_id)` tras medir con `pg_stat_user_indexes`.
18. Retirar `uuid-ossp` si nada la usa.
19. Completar seed de `impacto.ods_globales` (ODS 5-17) **si** el módulo se rescata.
20. Limpiar árbol del repo: carpetas vacías (`audit/`, `indi-info/`, `ONG/guidelines/BD/`), logs `.codex-*`, `supabase/.temp/`, y archivar `_archive_legacy_session/` y `Landing Page Design Request/` fuera del repo principal.
21. Añadir política DELETE al bucket `evidence` si se requiere borrado de evidencias, o documentar la retención.

---

## 10. MÉTRICAS DE LA AUDITORÍA

| Métrica | Valor |
|---|---|
| Archivos SQL analizados | 17 (10 migraciones raíz, 4 migraciones ONG, 1 diagnóstico, 1 test, 1 audit-patch) |
| Scripts maestros documentales analizados | 4 (Parte 1-4) + DB_MAESTRA.md + Configuracion_Supabase.md |
| Schemas reconstruidos | 11 + storage |
| Tablas documentadas | ~100 |
| Funciones documentadas | 15 (+1 firma fantasma) |
| Triggers documentados | 25+ (más los dinámicos de Parte 3 §B2) |
| Vistas | 1 |
| Políticas RLS inventariadas | ~150 |
| Buckets Storage | 3 |
| Edge Functions | 3 |
| Tablas sin uso detectado | 32 (incl. 15 en 3 módulos completos) |
| Conflictos de definición documentados | 11 |
| Elementos que requieren revisión manual | 12 |

*Toda afirmación de este reporte tiene ruta de archivo como evidencia. Nada fue eliminado ni modificado fuera de la creación de los 3 documentos de auditoría.*
