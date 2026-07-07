# DATABASE_DICTIONARY.md
## Diccionario técnico completo de objetos de base de datos — Proyecto GIMNASIO / GYMsos

> Auditoría individual. Fecha: 2026-07-02. Cada objeto incluye: Nombre, Tipo, Descripción, Objetivo, Estado, Dependencias, Relaciones, Uso estimado, Criticidad, Observaciones.
>
> **Leyenda de Estado:** `VIGENTE` (parte del estado final) · `SUPERSEDED` (reemplazado) · `EXTERNO` (BD Maestra, no en repo) · `HUÉRFANO` (definido pero sin uso detectado) · `VESTIGIO` (residuo de arquitectura previa).
> **Leyenda de Uso (frontend):** conteo de referencias `.from()` / `.rpc()` detectadas en `src/`.
> **Criticidad:** ALTA / MEDIA / BAJA (impacto si falla o se elimina).

---

## A. ESQUEMAS

| Nombre | Tipo | Descripción | Estado | Criticidad |
|---|---|---|---|---|
| `auth` | schema | Identidad Supabase (`auth.users`). Intocable. | EXTERNO/VIGENTE | ALTA |
| `gym` | schema | Dominio del gimnasio. Creado en 009. Cliente `supabase` (db.schema=gym). | VIGENTE | ALTA |
| `public` | schema | Núcleo compartido BD Maestra + sistema códigos/roles GYMsos. Cliente `supabasePublic`. | VIGENTE/EXTERNO | ALTA |

---

## B. TABLAS — Esquema `gym`

### `gym.gimnasios`
- **Tipo:** Tabla. **Objetivo:** Representa el gimnasio (tenant local). Puente a BD Maestra vía `tenant_id`.
- **Estado:** VIGENTE. **Uso frontend:** 1 (`.from('gimnasios')`, onboarding/staff).
- **Dependencias:** referenciada por usuarios, planes, espacios, promociones, clases, accesos, codigos_acceso, y por `public.tenants` (FK saliente).
- **Relaciones:** 1─N con casi todo el dominio; 1─1 lógico con `public.tenants`.
- **Criticidad:** ALTA (raíz del dominio).
- **Observaciones:** Columnas `codigo_acceso`, `ruc`, `logo_url`, `tenant_id` añadidas incrementalmente (009, 015b). `codigo_acceso` es VESTIGIO (sustituido por codigos_acceso y codes).

### `gym.usuarios`
- **Tipo:** Tabla (extiende `auth.users`). **Objetivo:** Perfil de dominio del usuario del gym.
- **Estado:** VIGENTE. **Uso frontend:** 12 (la más consultada).
- **Dependencias:** FK→`auth.users`, FK→`gimnasios`. Referenciada por membresias, pagos, accesos, asistencias, inscripciones, entrenadores, y todas las tablas de innovación.
- **Criticidad:** ALTA.
- **Observaciones:** Modelo de rol DUPLICADO — columna `rol` (enum texto) vs. RBAC `public.user_roles`. Requiere consolidación. `foto_url` se sincroniza con `public.profiles.avatar_url`.

### `gym.planes`
- **Tipo:** Tabla. **Objetivo:** Catálogo de planes de membresía por gimnasio. **Estado:** VIGENTE. **Uso:** 4.
- **Dependencias:** FK→gimnasios. Referenciada por membresias. **Criticidad:** ALTA.
- **Observaciones:** `clases_incluidas = -1` significa ilimitado (convención mágica, no documentada en constraint).

### `gym.membresias`
- **Tipo:** Tabla. **Objetivo:** Membresías activas/históricas. **Estado:** VIGENTE. **Uso:** 9.
- **Dependencias:** FK→usuarios, FK→planes. Referenciada por pagos. **Criticidad:** ALTA.
- **Observaciones:** CHECK `fecha_vencimiento > fecha_inicio`. **Sin políticas RLS de escritura propias** (solo SELECT base). Riesgo.

### `gym.pagos`
- **Tipo:** Tabla. **Objetivo:** Registro de cobros/pagos. **Estado:** VIGENTE. **Uso:** 8.
- **Dependencias:** FK→usuarios, FK→membresias. **Criticidad:** ALTA (datos financieros).
- **Observaciones:** `id_transaccion_stripe` presente pero Stripe es opcional (.env). RLS solo SELECT base → riesgo de manipulación financiera.

### `gym.espacios`
- **Tipo:** Tabla. **Objetivo:** Espacios físicos del gym. **Estado:** VIGENTE. **Uso:** 0 directo (usado vía RLS de maquinas y por clases). **Criticidad:** MEDIA.
- **Observaciones:** Sin referencia `.from('espacios')` en frontend → posible funcionalidad no implementada aún.

### `gym.maquinas`
- **Tipo:** Tabla. **Objetivo:** Equipamiento/máquinas con QR. **Estado:** VIGENTE pero **HUÉRFANO en frontend** (0 refs). **Criticidad:** BAJA.
- **Dependencias:** FK→espacios. **Observaciones:** RLS completo (009) pero sin UI. Candidata a feature futura o código muerto.

### `gym.entrenadores`
- **Tipo:** Tabla. **Objetivo:** Datos extendidos de entrenadores. **Estado:** VIGENTE, HUÉRFANO en frontend (0 refs `.from`). **Criticidad:** MEDIA.
- **Dependencias:** FK→usuarios (UNIQUE). Referenciada por clases. **Observaciones:** El dashboard de entrenador usa `gym.usuarios` (rol), no esta tabla. Posible redundancia.

### `gym.clases`
- **Tipo:** Tabla. **Objetivo:** Clases programadas. **Estado:** VIGENTE. **Uso:** 5. **Criticidad:** ALTA.
- **Dependencias:** FK→gimnasios, entrenadores, espacios. Referenciada por inscripciones, asistencias.
- **Observaciones:** Contrato TS `DbClase` declara FKs NOT NULL que en BD son NULL. RLS: solo `clases_select` base.

### `gym.inscripciones`
- **Tipo:** Tabla. **Objetivo:** Inscripción de usuarios a clases. **Estado:** VIGENTE. **Uso:** 3. **Criticidad:** MEDIA.
- **Dependencias:** FK→usuarios, clases. UNIQUE(usuario,clase). **Observaciones:** RLS habilitado (base) pero sin políticas de escritura definidas en migraciones. Riesgo.

### `gym.asistencias`
- **Tipo:** Tabla. **Objetivo:** Registro de asistencia a clases. **Estado:** VIGENTE, HUÉRFANO en frontend (0 refs `.from`). **Criticidad:** MEDIA.
- **Observaciones:** Existe página `entrenador/asistencia` pero no consulta esta tabla directamente. Verificar.

### `gym.accesos`
- **Tipo:** Tabla. **Objetivo:** Control de entradas/salidas (QR/biometría). **Estado:** VIGENTE. **Uso:** 7. **Criticidad:** ALTA.
- **Dependencias:** FK→usuarios, gimnasios. **Observaciones:** RLS solo SELECT base; inserción de accesos manual sin política write clara.

### `gym.promociones`
- **Tipo:** Tabla. **Objetivo:** Cupones/descuentos locales. **Estado:** VIGENTE, HUÉRFANO en frontend (0 refs, salvo página `gerente/promociones` — verificar). **Criticidad:** BAJA.
- **Observaciones:** Solapa con `public.codes` (GYM_PROMO). Redundancia de mecanismos de código.

### Tablas de innovación en `gym` (RF-019 a RF-038)

| Tabla | Estado | Uso frontend | Criticidad | Observaciones |
|---|---|---|---|---|
| `gym.churn_predictions` | VIGENTE | 3 | MEDIA | RLS solo SELECT (gerente). Usado por dashboard IA. |
| `gym.churn_interventions` | HUÉRFANO | 0 | BAJA | Sin uso ni RLS propia. Feature no implementada. |
| `gym.gamification_xp` | VIGENTE | 2 | BAJA | Usado por `useGamificacion`. Sin RLS propia. |
| `gym.gamification_levels` | VIGENTE | 3 | BAJA | Idem. PK = id_usuario. |
| `gym.digital_twin` | HUÉRFANO | 0 | BAJA | Sin uso. JSONB avatar. Feature no implementada. |
| `gym.ai_recommendations` | VIGENTE | 4 | MEDIA | Usado por `ai.service`/dashboards. Sin RLS propia. |
| `gym.wearable_sync` | HUÉRFANO | 0 | BAJA | Sin uso. Guarda `token_autenticacion` (dato sensible sin RLS → RIESGO). |
| `gym.health_alerts` | VIGENTE | 4 | MEDIA | Usado por `alerts.service`. Sin RLS propia. |

### `gym.codigos_acceso`
- **Tipo:** Tabla (009). **Objetivo:** Códigos de invitación por gimnasio. **Estado:** VIGENTE pero parcialmente SUPERSEDED por `public.codes`. **Uso:** 3.
- **Dependencias:** FK→gimnasios, usuarios. **Criticidad:** MEDIA.
- **Observaciones:** RLS: `codigos_select_public` (activo=TRUE visible a anon → cualquiera puede leer todos los códigos activos de todos los gyms → **RIESGO de enumeración**). Coexiste con codes.

---

## C. TABLAS — Esquema `public` (definidas en este repo)

### `public.cat_code_types`
- **Tipo:** Tabla catálogo (010). **Objetivo:** Tipos de código extensibles. **Estado:** VIGENTE. **Uso:** indirecto (FK de codes). **Criticidad:** MEDIA.
- **Observaciones:** 10 tipos sembrados. `public_lookup` controla visibilidad anon. Bien diseñada.

### `public.codes`
- **Tipo:** Tabla (010). **Objetivo:** Sistema central de códigos multi-tenant/multi-módulo. **Estado:** VIGENTE. **Uso:** vía RPC (fn_validate_code, fn_create_staff_code). **Criticidad:** ALTA.
- **Dependencias:** FK→`public.tenants`(EXTERNO), cat_code_types, auth.users. Referenciada por code_usages, code_grants. **Observaciones:** Índices redundantes (idx_codes_code/status_active/lookup). RLS `codes_tenant_write` sin check de permiso.

### `public.code_usages`
- **Tipo:** Tabla auditoría (010). **Objetivo:** Traza inmutable de consumo de códigos. **Estado:** VIGENTE. **Uso:** vía RPC. **Criticidad:** MEDIA.
- **Dependencias:** FK→codes, tenants(EXTERNO), auth.users. **Observaciones:** No inmutable a nivel BD (sin trigger anti-UPDATE/DELETE pese a documentarse como "inmutable").

### `public.audit_logs`
- **Tipo:** Tabla (015b). **Objetivo:** Log universal de cambios (para trigger externo). **Estado:** VIGENTE, HUÉRFANO en frontend (0 refs). **Criticidad:** MEDIA.
- **Dependencias:** FK→tenants(EXTERNO), auth.users. **Observaciones:** Creada reactivamente porque el trigger externo `fn_trigger_audit_universal()` fallaba. Estructura inferida, no diseñada.

### `public.user_roles`
- **Tipo:** Tabla RBAC (016). **Objetivo:** Asigna roles a usuarios por tenant. **Estado:** VIGENTE. **Uso:** 1 (`.from('user_roles')`) + vía RPC. **Criticidad:** ALTA.
- **Dependencias:** FK→tenants(EXTERNO), auth.users, roles(EXTERNO). **Observaciones:** NO confundir con `user_roles_sedes` (externo). RLS write sin check de permiso → RIESGO ALTO.

### `public.code_grants`
- **Tipo:** Tabla puente (016). **Objetivo:** Vincula un código al rol que otorga. **Estado:** VIGENTE. **Uso:** vía RPC fn_create_staff_code. **Criticidad:** MEDIA.
- **Dependencias:** FK→codes, roles(EXTERNO). **Observaciones:** PK compuesta (code_id, role_id).

### `public.user_permission_overrides`
- **Tipo:** Tabla (020). **Objetivo:** Overrides grant/deny de permisos por persona (modelo "Elizabeth Capa 1"). **Estado:** VIGENTE. **Uso:** 3 (`gerente/permisos`). **Criticidad:** MEDIA.
- **Dependencias:** FK→tenants(EXTERNO), auth.users, cat_permissions(EXTERNO). **Observaciones:** Ejecutada manualmente antes de versionarse (deuda de proceso). RLS correcta (condicionada a `ace.perms.manage`).

---

## D. TABLAS EXTERNAS (BD Maestra — referenciadas, NO definidas en repo)

| Nombre | Tipo | Objetivo inferido | Estado | Criticidad | Referenciada por |
|---|---|---|---|---|---|
| `public.tenants` | Tabla | Organización/tenant maestro (gym = tenant industry='gym') | EXTERNO | ALTA | codes, code_usages, audit_logs, user_roles, code_grants, user_permission_overrides, gym.gimnasios, handle_new_user, fn_current_tenant_id |
| `public.profiles` | Tabla | Perfil universal (extiende auth.users) | EXTERNO | ALTA | fn_get_my_profile, fn_current_tenant_id, handle_new_user, fn_update_my_avatar; frontend 1 |
| `public.roles` | Tabla | Roles RBAC por tenant | EXTERNO | ALTA | user_roles, code_grants, fn_*_permission, seeds 016; frontend 1 |
| `public.role_permissions` | Tabla | Permisos por rol | EXTERNO | ALTA | fn_has_permission, fn_my_permissions, fn_check_permission; frontend 1 |
| `public.cat_permissions` | Tabla catálogo | Catálogo de permisos | EXTERNO | ALTA | seeds 016 (30 permisos gym), user_permission_overrides FK; frontend 1 |
| `public.sedes` | Tabla | Sucursales | EXTERNO | MEDIA | mencionada en supabase.ts; sin uso gym |
| `public.user_roles_sedes` | Tabla | RBAC multi-sede (ONG) | EXTERNO | MEDIA | overload fn_has_permission(text,uuid) — 019 |

> **Observación global D:** Sin estos objetos, el sistema no arranca. Su ausencia del control de versiones es el hallazgo estructural más grave. **Requiere revisión manual** de su definición real en Supabase.

---

## E. FUNCIONES (versión final vigente)

| Nombre / Firma | Lenguaje | Retorno | Objetivo | Origen final | Estado | Uso frontend | Criticidad |
|---|---|---|---|---|---|---|---|
| `public.get_user_gym()` | SQL | UUID | Gym del usuario actual (RLS helper) | 009 | VIGENTE | vía RLS | ALTA |
| `public.get_user_rol()` | SQL | TEXT | Rol (enum) del usuario actual | 009 | VIGENTE | vía RLS | ALTA |
| `gym.current_gym_id()` | SQL | UUID | Gym del usuario (canónico) | 009 | VIGENTE | vía RLS | ALTA |
| `public.fn_current_tenant_id()` | SQL | UUID | Tenant del usuario (lee profiles) | 016 | VIGENTE | vía RLS/RPC | ALTA |
| `public.generate_gym_code(text)` | plpgsql | TEXT | Genera código base+hash del gym | 009 | VIGENTE | interno | MEDIA |
| `public._gym_plan_to_bd(text)` | SQL | TEXT | Mapea plan gym→plan BD Maestra | 015b | VIGENTE | interno | MEDIA |
| `public._gym_plan_to_licenses(text)` | SQL | INT | Mapea plan→nº licencias | 015b | VIGENTE | interno | MEDIA |
| `public.fn_codes_set_updated_at()` | plpgsql | trigger | updated_at automático en codes | 010 | VIGENTE | trigger | BAJA |
| `public.fn_validate_code(text,text?,uuid?)` | plpgsql | JSONB | Valida código sin consumir | 010 | VIGENTE | 1 (signup) | ALTA |
| `public.fn_use_code(...)` | plpgsql | JSONB | Valida+consume+audita (anti-race) | 010 | VIGENTE, HUÉRFANO frontend | 0 | MEDIA |
| `public.fn_create_code(...)` | plpgsql | JSONB | Crea código | 010 | VIGENTE | vía fn_create_staff_code | MEDIA |
| `public.fn_revoke_code(uuid,text?)` | plpgsql | JSONB | Revoca código | 010 | VIGENTE, HUÉRFANO frontend | 0 | BAJA |
| `public.fn_get_my_profile()` | plpgsql | JSONB | Perfil BD Maestra del usuario | 014 (v2) | VIGENTE | 3 | ALTA |
| `public.fn_update_my_avatar(text)` | plpgsql | JSONB | Actualiza avatar en profiles+gym.usuarios | 014 | VIGENTE | 1 | MEDIA |
| `public.fn_has_permission(text)` | SQL | BOOLEAN | ¿Usuario tiene permiso? | 016 | VIGENTE | 2 | ALTA |
| `public.fn_my_permissions()` | SQL | TABLE | Permisos (rol ∪ grants − denies) | 020 (v2) | VIGENTE | 2 | ALTA |
| `public.fn_check_permission(text)` | SQL | boolean | Chequeo booleano sin ambigüedad overload | 020 | VIGENTE | 2 | ALTA |
| `public.fn_create_staff_code(uuid,uuid,...)` | plpgsql | JSONB | Crea código de staff con rol | 019c | VIGENTE | 1 | ALTA |
| `gym.bootstrap_gym_tenant(...)` | plpgsql | JSONB | Crea gym + asigna gerente (respaldo) | 009 | VIGENTE, HUÉRFANO frontend | 0 | MEDIA |
| `gym.join_gym_with_code(text,...)` | plpgsql | JSONB | Une usuario a gym por código | 009 | VIGENTE, HUÉRFANO frontend | 0 | MEDIA |
| `public.handle_new_user()` | plpgsql | trigger | Provisión de usuario/tenant/gym/rol al signup | 017 | VIGENTE | trigger | ALTA |

### Funciones EXTERNAS (BD Maestra)
| Nombre | Objetivo | Estado | Criticidad |
|---|---|---|---|
| `public.fn_has_permission(text, uuid)` | Overload multi-sede (user_roles_sedes) | EXTERNO | ALTA (~20 RLS dependen) |
| `public.fn_trigger_audit_universal()` | Trigger de auditoría sobre tenants | EXTERNO | MEDIA |
| `public.seed_gym_roles(uuid,uuid)` | Clona 7 roles+permisos desde tenant plantilla | EXTERNO (scratch, manual) | MEDIA |

---

## F. TRIGGERS

| Nombre | Tabla | Evento | Función | Estado | Criticidad | Observaciones |
|---|---|---|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT FOR EACH ROW | `handle_new_user()` | VIGENTE | ALTA | Núcleo del onboarding. Captura excepciones (nunca aborta signup). |
| `tr_codes_updated_at` | `public.codes` | BEFORE UPDATE FOR EACH ROW | `fn_codes_set_updated_at()` | VIGENTE | BAJA | Mantiene updated_at. |
| `fn_trigger_audit_universal` (trigger externo) | `public.tenants` | — | (externo) | EXTERNO | MEDIA | Forzó la creación de audit_logs (015b). |

---

## G. ÍNDICES (inventario y evaluación)

**Esquema `gym` (base + migraciones):**
`idx_usuarios_email`, `idx_usuarios_rol`, `idx_usuarios_gimnasio`, `idx_membresias_usuario`, `idx_accesos_fecha`, `idx_accesos_usuario`, `idx_clases_fecha`, `idx_clases_gimnasio`, `idx_pagos_usuario`, `idx_asistencias_usuario`, `idx_xp_usuario`, `idx_churn_usuario`, `idx_gimnasios_codigo`, `idx_gimnasios_tenant`, `idx_codigos_acceso_gimnasio`, `idx_codigos_acceso_codigo`.

**Esquema `public`:**
codes (7): `idx_codes_tenant`, `idx_codes_code`, `idx_codes_type`, `idx_codes_status_active`, `idx_codes_tenant_type`, `idx_codes_expires`, `idx_codes_lookup`.
code_usages (5): `idx_code_usages_code_id/tenant/used_by/used_at/module`.
audit_logs (5): `idx_audit_logs_tenant/actor/event/resource/created`.
user_roles (5): `idx_user_roles_tenant/user/role/active/expires`.
code_grants (2): `idx_code_grants_code/role`.
user_permission_overrides (1): `idx_upo_user_tenant`.

| Índice | Evaluación |
|---|---|
| `idx_codes_code` + `idx_codes_status_active` + `idx_codes_lookup` | **Redundancia parcial**: `idx_codes_lookup(code,status) WHERE status='active'` cubre casi los mismos casos que los otros dos. Revisar. |
| `idx_code_grants_code` | Redundante con la PK compuesta `(code_id, role_id)` cuyo prefijo ya indexa `code_id`. Innecesario. |
| `idx_user_roles_role` | Uso dudoso (no hay búsquedas por role_id solo). Revisar. |
| Resto | Justificados por patrones de consulta conocidos. |

---

## H. POLÍTICAS RLS (resumen con criticidad)

| Política | Tabla | Efecto | Estado | Criticidad | Observación |
|---|---|---|---|---|---|
| usuarios_select_own / _gym | gym.usuarios | SELECT | VIGENTE | ALTA | 013 |
| usuarios_update_own / _staff | gym.usuarios | UPDATE | VIGENTE | ALTA | 013 |
| usuarios_insert_staff | gym.usuarios | INSERT | VIGENTE | MEDIA | 013 |
| usuarios_delete_admin | gym.usuarios | DELETE | VIGENTE | MEDIA | 013 |
| planes/espacios/promociones/maquinas/entrenadores _select_gym / _write_staff | gym.* | ALL/SELECT | VIGENTE | MEDIA | 009 |
| codigos_select_public | gym.codigos_acceso | SELECT | VIGENTE | **ALTA (riesgo)** | anon lee todos los códigos activos |
| codigos_write_gerente | gym.codigos_acceso | ALL | VIGENTE | MEDIA | 009 |
| codes_public_lookup / tenant_select / tenant_write | public.codes | — | VIGENTE | ALTA | write sin check de permiso |
| code_usages_tenant | public.code_usages | ALL | VIGENTE | MEDIA | 010 |
| profiles_self_select / _update | public.profiles | — | VIGENTE | ALTA | 012 |
| user_roles_self_select / tenant_select / admin_write | public.user_roles | — | VIGENTE | **ALTA (riesgo)** | admin_write sin exigir permiso |
| code_grants_tenant_select | public.code_grants | SELECT | VIGENTE | MEDIA | 016 |
| audit_logs_tenant_select | public.audit_logs | SELECT | VIGENTE | MEDIA | 015b |
| upo_select/insert/update/delete | public.user_permission_overrides | — | VIGENTE | ALTA | 020, exige ace.perms.manage (correcto) |
| membresias_select, pagos_select, clases_select, accesos_select, churn_gerente_select | gym.* | SELECT | BASE (¿vigente?) | ALTA | Solo lectura; sin políticas de escritura |

---

## I. OBJETOS OBSOLETOS / SUPERSEDED (conservados, no eliminar)

| Objeto | Ubicación | Estado | Motivo |
|---|---|---|---|
| `supabase-schema.sql` (30 tablas en public) | raíz gymsos-frontend | SUPERSEDED | 009 movió las tablas a `gym`. Es el punto de partida histórico. |
| `archive/001`..`008`, `008b` | migrations/archive | SUPERSEDED | Arquitectura "standalone" reemplazada por módulo BD Maestra (README archive). |
| `archive/006_move_to_gym_schema` | archive | SUPERSEDED | Fusionado en 009. |
| `archive/015_gym_as_tenant` | archive | SUPERSEDED | Falló; reemplazado por 015b. |
| `archive/018` + `018b_revert` | archive | ANULADOS | 018 revertida por 018b (par cancelado). No aplicar ninguno. |
| `archive/00101_cl_sup_SCRATCH` | archive | NO-MIGRACIÓN | Notas/borrador con markdown mezclado ("sqlCREATE..."). Define seed_gym_roles, fn_create_staff_code, overrides ejecutados manualmente. |
| `000_ROLLBACK_001_to_008` | migrations | UTILIDAD | Script de reversión. No es parte del estado final. |
| Funciones `rpc_registrar_nuevo_miembro`, `rpc_verificar_y_registrar_acceso`, `log_audit_event` | archive/001,002 | MUERTAS | Definidas solo en archive; sin uso en frontend ni en migraciones activas. |
| `audi/*.md` (1..4, BACKLOG, PLAN, UX-UI-SPEC) | migrations/audi | DOCUMENTACIÓN | Auditorías/planes previos. No son SQL ejecutable. |
| `audi/trigger_debug_checklist.sql` | migrations/audi | DIAGNÓSTICO | Script de verificación (SELECTs de introspección). No modifica estructura. |

---

## J. COLUMNAS DESTACADAS CON OBSERVACIONES

| Columna | Tabla | Observación |
|---|---|---|
| `gimnasios.codigo_acceso` | gym.gimnasios | VESTIGIO — sustituido por codigos_acceso y codes. |
| `gimnasios.tenant_id` | gym.gimnasios | Puente crítico a BD Maestra. NULL rompe RBAC y códigos. |
| `usuarios.rol` | gym.usuarios | Modelo de rol legacy que coexiste con RBAC. Fuente de doble verdad. |
| `usuarios.foto_url` | gym.usuarios | Copia sincronizada de `profiles.avatar_url` (redundancia controlada por fn_update_my_avatar). |
| `planes.clases_incluidas` | gym.planes | `-1` = ilimitado (constante mágica sin constraint que lo documente). |
| `wearable_sync.token_autenticacion` | gym.wearable_sync | Token sensible en TEXT plano, tabla sin RLS propia → RIESGO. |
| `codes.metadata` / `code_usages.metadata` | public | JSONB flexible; sin esquema validado. |

---
*FIN DATABASE_DICTIONARY.md — Todo estado se sustenta en evidencia del repositorio. Los ítems EXTERNO y "Requiere revisión manual" deben validarse contra el proyecto Supabase real.*
