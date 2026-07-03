# DATABASE_DICTIONARY — Democra ONG Platform

> **Fecha de auditoría:** 2026-07-03 · **Motor:** PostgreSQL 16 (Supabase) · **Complemento de:** `DATABASE_MASTER_SCRIPT.md` (DDL completo) y `AUDIT_REPORT.md` (hallazgos).
>
> **Leyenda de campos:**
> - **Estado:** `ACTIVO` (uso confirmado en código), `PARCIAL` (definido y accesible pero con uso mínimo), `SIN USO` (0 referencias — posible código muerto), `SUPERSEDED` (reemplazado por versión más nueva), `DUDA` (requiere revisión manual).
> - **Uso estimado:** conteo de referencias `.from()/.rpc()` en `src/`, `ONG/src/`, `server/` (evidencia objetiva, no telemetría).
> - **Criticidad:** ALTA (seguridad/tenancy/dinero/datos sensibles), MEDIA (operación), BAJA (catálogo/experimental).

---

## 1. TABLAS — SCHEMA `public`

### 1.1 Catálogos globales

| Objeto | Tipo | Descripción / Objetivo | Estado | Dependencias | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|---|
| `cat_industry_types` | Tabla catálogo | Tipos de industria del SaaS | ACTIVO | ← tenants.industry_type_id | indirecto | MEDIA | Seeds no versionados |
| `cat_plan_types` | Tabla catálogo | Planes comerciales | ACTIVO | ← tenants, plan_policies, subscription_* | indirecto | ALTA | Seeds no versionados |
| `cat_tenant_statuses` | Tabla catálogo | Estados financieros FSM del tenant | ACTIVO | ← tenants.status_financial_id | indirecto | ALTA | Usada por middleware financial-state |
| `cat_subscription_statuses` | Tabla catálogo | Estados FSM del contrato | ACTIVO | ← subscription_contracts | indirecto | ALTA | — |
| `cat_subscription_change_statuses` | Tabla catálogo | Estados FSM de cambio de plan | PARCIAL | ← subscription_changes | 0 directo | MEDIA | Billing incompleto |
| `cat_invoice_statuses` | Tabla catálogo | Estados de factura | PARCIAL | ← invoices | 0 directo | MEDIA | — |
| `cat_payment_statuses` | Tabla catálogo | Estados de transacción de pago | PARCIAL | ← payment_transactions | 0 directo | MEDIA | — |
| `cat_permissions` | Tabla catálogo | Registro maestro de permisos | ACTIVO | ← role_permissions (trigger), seeds ONG+ACE | 8 | ALTA | Fuente del sistema de autorización |
| `cat_generos` | Tabla catálogo | Géneros | ACTIVO | ← profiles, ong.voluntarios, ong.beneficiarios | 12 | BAJA | — |
| `cat_paises` | Tabla catálogo | Países ISO | ACTIVO | ← ong.voluntarios/beneficiarios/ubicaciones | 14 | BAJA | — |
| `cat_monedas` | Tabla catálogo | Monedas ISO-4217 | ACTIVO | ← finanzas.cuentas | 6 | MEDIA | — |
| `cat_tipos_documento` | Tabla catálogo | Tipos de documento identidad | ACTIVO | ← profiles, ong.voluntarios/beneficiarios | 16 | BAJA | — |
| `cat_module_statuses` | Tabla catálogo | Estados de módulo por tenant | PARCIAL | ← tenant_modules | 4 | BAJA | **CONFLICTO:** DB_MAESTRA documenta valores distintos a los seeds reales (enabled/disabled/paused) |

### 1.2 Core multi-tenant e IAM

| Objeto | Tipo | Descripción / Objetivo | Estado | Dependencias | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|---|
| `tenants` | Tabla | Organización cliente (raíz del multi-tenant) | ACTIVO | ← TODAS las tablas tenant-scoped | 6+server | ALTA | RLS de tenants no visible en scripts — revisión manual |
| `sedes` | Tabla | Sedes físicas por tenant | ACTIVO | tenants; ← user_roles_sedes, terminals, access_links | 12 | ALTA | UNIQUE(tenant_id,name) |
| `profiles` | Tabla | Perfil 1:1 con auth.users; ancla de fn_current_tenant_id | ACTIVO | auth.users, tenants; ← casi todo | 40+server | **ALTA** | Columnas PIN/riesgo de migración 20260301; tipo_documento/numero_documento/genero sin migración versionada |
| `roles` | Tabla | Roles por tenant (jerárquicos) | ACTIVO | tenants; ← role_permissions, user_roles_sedes, memberships, access_links | 28 | ALTA | hierarchy_level 0 = Owner |
| `role_permissions` | Tabla | Permisos asignados a rol | ACTIVO | roles, cat_permissions (trigger) | 12+server | ALTA | PK compuesta (role_id, permission) |
| `user_roles_sedes` | Tabla | Asignación usuario–rol–sede (IAM legacy) | ACTIVO | tenants, profiles, roles, sedes | 26+server | **ALTA** | Sincronizada a memberships por trigger ACE; server hace DELETE por columna `id` inexistente en DDL — **revisión manual** |
| `role_access_constraints` | Tabla | Restricciones de acceso (IP/CIDR, horario, dispositivo confiable) | PARCIAL | tenants, roles, sedes | 8 | MEDIA | Enforcement en server/risk-engine, no en BD |
| `terminals` | Tabla | Terminales físicos por sede | PARCIAL | tenants, sedes | 9+server | MEDIA | Funcionalidad de terminal parcialmente implementada |
| `devices` | Tabla | Dispositivos con fingerprint | ACTIVO | tenants, profiles | 7+server | ALTA | Usada por motor de riesgo |
| `sessions` | Tabla | Sesiones de aplicación (propias, no auth) | ACTIVO | tenants, profiles, terminals, devices | 10+server | ALTA | Revocación vía fn_remote_revoke_app_session |
| `auth_events` | Tabla | Bitácora de eventos de autenticación | ACTIVO | tenants, profiles, sessions, terminals, devices | 4+server | ALTA | Escrita por server (service_role) |
| `mfa_challenges` | Tabla | Desafíos OTP/MFA por riesgo | ACTIVO | tenants, profiles | 7 (server) | **ALTA** | **CONFLICTO:** columna real `code_hash` (migración+server) vs `otp_hash` (DB_MAESTRA — error documental) |

### 1.3 Suscripciones y Billing

| Objeto | Tipo | Descripción | Estado | Dependencias | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|---|
| `plan_policies` | Tabla | Políticas por plan (retención, límites) | ACTIVO | cat_plan_types; ← entitlements, fn_trigger_audit_universal | 3+server | ALTA | Determina retention_until de auditoría |
| `subscription_contracts` | Tabla | Contrato de suscripción (1 por tenant) | ACTIVO | tenants, cat_plan_types, cat_subscription_statuses | vía bootstrap | ALTA | Parte 1 usa columna `plan_id` (obsoleta) vs real `current_plan_id` |
| `entitlements` | Tabla | Capacidades efectivas del tenant | ACTIVO | tenants, cat_plan_types | vía bootstrap | ALTA | — |
| `subscription_changes` | Tabla | FSM de cambios de plan | PARCIAL | tenants, cat_plan_types, profiles | 0 directo | MEDIA | idempotency_key UNIQUE |
| `invoices` | Tabla | Facturas | PARCIAL | tenants, cat_invoice_statuses | 0 directo | MEDIA | Flujo de facturación no implementado en código |
| `invoice_lines` | Tabla | Líneas de factura | SIN USO | invoices | 0 | MEDIA | **[DEAD?]** |
| `payment_methods` | Tabla | Métodos de pago tokenizados | SIN USO | tenants | 0 | MEDIA | **[DEAD?]** |
| `payment_transactions` | Tabla | Transacciones de pago | PARCIAL | tenants, invoices, subscription_changes, payment_methods, profiles | 1 (server) | ALTA | Solo lectura en audit server |
| `payment_webhook_events` | Tabla | Webhooks idempotentes de pasarela | SIN USO | tenants | 0 | MEDIA | **[DEAD?]** — no hay endpoint de webhooks |

### 1.4 Auditoría y módulos

| Objeto | Tipo | Descripción | Estado | Dependencias | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|---|
| `audit_logs` | Tabla | Bitácora forense central (modelo vigente event_type/resource_name/payloads) | ACTIVO | tenants, plan_policies (retención); escrita por fn_trigger_audit_universal y RPCs | 3+server | **ALTA** | **CONFLICTO** con modelo legacy de Parte 1 (schema_name/table_name/operation) |
| `system_modules` | Tabla | Registro de módulos del producto | SIN USO | ← tenant_modules | 0 | BAJA | **[DEAD?]** |
| `tenant_modules` | Tabla | Módulos habilitados por tenant | PARCIAL | tenants, system_modules, cat_module_statuses | vía fn_is_module_enabled | MEDIA | fn_is_module_enabled sin llamadas detectadas |

### 1.5 ACE — Access & Context Engine

| Objeto | Tipo | Descripción | Estado | Dependencias | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|---|
| `access_links` | Tabla | Links de acceso/invitación con límite de usos y expiración | ACTIVO (reciente) | tenants, roles, sedes, auth.users | 4 | ALTA | Reemplaza funcionalmente a rrhh.codigos_registro_voluntario (que sigue viva) |
| `memberships` | Tabla | Membresías contextuales polimórficas (PROYECTO/SEDE/PROGRAMA/ACTIVIDAD) | ACTIVO (reciente) | tenants, profiles, roles | 3 | ALTA | Sincronizada desde user_roles_sedes por trigger |
| `dynamic_forms` | Tabla | Formularios dinámicos (JSON Schema) | SIN USO | tenants, auth.users | 0 (solo tipos) | BAJA | **[DEAD?]** — estructura lista, sin consumo |
| `role_module_access` | Tabla | Permisos CRUD por módulo y rol | SIN USO | tenants, roles | 0 (solo tipos) | MEDIA | **[DEAD?]** |
| `role_field_permissions` | Tabla | Permisos por campo y rol | SIN USO | tenants, roles | 0 (solo tipos) | MEDIA | **[DEAD?]** |

---

## 2. TABLAS — SCHEMA `ong`

| Objeto | Descripción | Estado | Dependencias clave | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|
| `estados_voluntario` | Catálogo estados de voluntario | ACTIVO | ← voluntarios | 18 | BAJA | Valores seeds no versionados |
| `estados_proyecto` | Catálogo estados de proyecto | ACTIVO | ← proyectos | 14 | BAJA | — |
| `estados_objeto` | Catálogo estados de ítem | ACTIVO | ← items | 6 | BAJA | — |
| `unidades_medida` | Catálogo unidades | ACTIVO | ← items | 6 | BAJA | — |
| `tipo_transaccion_inventario` | Catálogo tipos de movimiento (con signo) | ACTIVO | ← transacciones_inventario | 6 | BAJA | — |
| `voluntarios` | Maestro de voluntarios | ACTIVO | tenants, auth.users, catálogos; ← 10+ tablas | **76** | **ALTA** | Tabla más usada del sistema; iam_user_id sin UNIQUE |
| `beneficiarios` | Maestro de beneficiarios | ACTIVO | tenants, catálogos; ← participaciones, clinico.* | 17 | ALTA | Datos personales sensibles |
| `areas` | Áreas organizativas | ACTIVO | tenants; ← proyectos | 12 | MEDIA | — |
| `ubicaciones` | Ubicaciones físicas (GPS) | ACTIVO | tenants, cat_paises; ← actividades, transacciones_inventario | 38 | MEDIA | — |
| `items` | Inventario | ACTIVO | tenants, unidades_medida, estados_objeto | 24 | MEDIA | — |
| `transacciones_inventario` | Movimientos de inventario | ACTIVO | items, ubicaciones, tipo_transaccion, auth.users | 12 | MEDIA | Sin trigger que actualice stock (stock se calcula en frontend) |
| `proyectos` | Proyectos ONG | ACTIVO | tenants, areas, estados_proyecto; ← actividades, asignaciones, participaciones, recursos | 54 | **ALTA** | — |
| `actividades` | Actividades (hija de proyecto POST-20260501) | ACTIVO | proyectos, ubicaciones; ← tareas, horas, asistencias, evidencias, asignaciones | 69 | **ALTA** | **Jerarquía invertida por migración 20260501** |
| `tareas` | Tareas (hija de actividad POST-20260501) | ACTIVO | actividades | 33 | MEDIA | Tareas pre-migración quedaron con id_actividad NULL |
| `horas_actividad` | Registro de horas de voluntariado | ACTIVO | actividades, aprobaciones | 34 | ALTA | id_voluntario sin FK explícita en scripts |
| `asignaciones_actividad` | Voluntarios asignados a actividad | ACTIVO | actividades | 38 | MEDIA | Soft-delete (Parte 4) |
| `evidencias_actividad` | Evidencias subidas (Storage) | ACTIVO | actividades | 20 | MEDIA | Archivos en bucket evidence/avatars |
| `asistencias` | Asistencia por QR/manual (check-in/out) | ACTIVO | actividades, voluntarios, id_cards | 28 | ALTA | UNIQUE por día; escrita por fn_register_attendance_scan |
| `aprobaciones` | Bandeja genérica de aprobaciones (polimórfica) | ACTIVO | tenants, auth.users; referencia entidad_schema/tabla/id | 26 | ALTA | Sin FK polimórfica (por diseño) |
| `asignaciones_proyecto` | Voluntarios por proyecto | ACTIVO | proyectos | 16 | MEDIA | — |
| `participaciones_proyecto` | Beneficiarios por proyecto | ACTIVO | proyectos, beneficiarios | 4 | MEDIA | — |
| `recursos_proyecto` | Ítems requeridos por proyecto | ACTIVO | proyectos, items | 18 | MEDIA | Soft-delete |
| `activity_requirements` | Requisitos por actividad | SIN USO | actividades | 0 | BAJA | **[DEAD?]** — no está en DB_MAESTRA ni en código |
| `logros_beneficiario` | Logros de beneficiario | SIN USO | — | 0 | BAJA | **[DEAD?]** |
| `supervisiones` | Supervisores por proyecto | SIN USO | — | 0 | BAJA | **[DEAD?]** |
| `id_card_templates` | Plantillas de credencial (editor WYSIWYG) | ACTIVO | tenants; ← template_fields, id_cards | 14 | MEDIA | template_config jsonb V2 añadida por Configuracion_Supabase.md; política usa permiso inexistente `manage_id_cards` |
| `id_card_template_fields` | Campos posicionados de plantilla | ACTIVO | id_card_templates | 6 | BAJA | z_index default 1 (real) vs 0 (doc) |
| `id_cards` | Credenciales emitidas (QR de asistencia) | ACTIVO | voluntarios, templates; ← asistencias | 16 | ALTA | 1 credencial por voluntario (UNIQUE) |

---

## 3. TABLAS — SCHEMA `rrhh`

| Objeto | Descripción | Estado | Dependencias | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|---|
| `solicitudes_admision` | Solicitudes de admisión (FSM nueva→entrevista→aprobada/rechazada) | ACTIVO | tenants, ong.voluntarios | 30 | ALTA | También escrita por fn_complete_access_onboarding (STAFF_JOIN) |
| `documentos_admision` | Documentos del postulante | ACTIVO | solicitudes_admision, auth.users | 10 | MEDIA | — |
| `entrevistas_admision` | Entrevistas y resultado | ACTIVO | solicitudes_admision, auth.users | 8 | MEDIA | puntaje 0-100 |
| `admission_requirements` | Requisitos configurables de admisión | SIN USO | tenants | 0 | BAJA | **[DEAD?]** — sin GRANT ni consumo |
| `admission_requirement_reviews` | Revisión de requisitos por solicitud | SIN USO | requirements, solicitudes | 0 | BAJA | **[DEAD?]** |
| `admision_estado_historial` | Historial de cambios de estado | ACTIVO | solicitudes_admision, auth.users | 8 | MEDIA | — |
| `onboarding_pasos` | Pasos de onboarding configurables | ACTIVO | tenants | 4 (grant) | MEDIA | — |
| `onboarding_voluntario` | Progreso de onboarding por voluntario | ACTIVO | voluntarios, pasos | 18 | MEDIA | Soft-delete |
| `habilidades` | Catálogo global de habilidades | ACTIVO | ← voluntario_habilidades | 8 | BAJA | — |
| `voluntario_habilidades` | Habilidades por voluntario (nivel) | ACTIVO | voluntarios, habilidades | 12 | BAJA | — |
| `volunteer_preferences` | Preferencias/disponibilidad | SIN USO | voluntarios | 0 | BAJA | **[DEAD?]** — sin GRANT 20260331 |
| `documentos_voluntario` | Documentación vigente del voluntario | ACTIVO | voluntarios | 12 | MEDIA | — |
| `roles_operativos` | Roles operativos de campo | ACTIVO | tenants | 4 | MEDIA | Distinto de public.roles (IAM) |
| `asignaciones_rol` | Rol operativo por voluntario | ACTIVO | voluntarios, roles_operativos | 12 | MEDIA | — |
| `perfil_coordinador` | Datos extra de coordinadores | ACTIVO | voluntarios | 8 | BAJA | — |
| `codigos_registro_voluntario` | Códigos de invitación LEGACY | ACTIVO/SUPERSEDED | solicitudes, voluntarios, auth.users | 3 + Edge Fn + RPC | **ALTA** | **Doble fuente de verdad con access_links (ACE)** — sigue siendo escrita/consumida |
| `registro_documentos_postulante` | Documentos subidos con código de registro | ACTIVO | codigos_registro_voluntario | grant RO | MEDIA | RLS no visible en scripts |

---

## 4. TABLAS — SCHEMAS `finanzas`, `donaciones`, `clinico`, `academico`, `gamificacion`, `impacto`, `comunicaciones`, `auditoria`

| Objeto | Descripción | Estado | Uso est. | Criticidad | Observaciones |
|---|---|---|---|---|---|
| `finanzas.cat_tipos_cuenta` | Catálogo tipos de cuenta | ACTIVO | grant RO | BAJA | Seeds: banco/caja_chica/pasarela |
| `finanzas.cuentas` | Cuentas financieras (saldo) | ACTIVO | 14 | **ALTA** | saldo_actual sin trigger de consistencia con transacciones |
| `finanzas.categorias` | Categorías ingreso/egreso | ACTIVO | 14 | MEDIA | — |
| `finanzas.transacciones` | Transacciones financieras | ACTIVO | 16 | **ALTA** | id_proyecto sin FK explícita |
| `finanzas.comprobantes_financieros` | Comprobantes (RUC/DNI emisor) | ACTIVO | 12 | ALTA | — |
| `finanzas.aprobaciones_transaccion` | Aprobación de transacciones | ACTIVO | 10 | ALTA | Sin política RLS visible — revisión manual |
| `donaciones.donantes` | Donantes | SIN USO | 0 | BAJA | **[DEAD?] módulo completo** |
| `donaciones.campanas` | Campañas de recaudación | SIN USO | 0 | BAJA | **[DEAD?]** |
| `donaciones.ingresos_donacion` | Donaciones recibidas | SIN USO | 0 | BAJA | **[DEAD?]** |
| `donaciones.donor_interactions` | CRM de donantes | SIN USO | 0 | BAJA | **[DEAD?]** |
| `donaciones.donor_pledges` | Promesas de donación | SIN USO | 0 | BAJA | **[DEAD?]** |
| `clinico.fichas_medicas` | Ficha médica de beneficiario | ACTIVO | 12 | **ALTA** | Datos de salud — máxima sensibilidad |
| `clinico.accesos_sensibles_log` | Log de acceso a fichas | ACTIVO | 6 | ALTA | INSERT+SELECT only (grant) |
| `clinico.perfil_nino` | Perfil de menor (tutor, colegio) | ACTIVO | 18 | **ALTA** | Datos de menores |
| `clinico.perfil_adulto_mayor` | Perfil adulto mayor | ACTIVO | 18 | ALTA | — |
| `clinico.ficha_sensible_voluntario` | Ficha médica de voluntario | ACTIVO | 12 | **ALTA** | — |
| `clinico.accesos_sensibles_voluntario_log` | Log acceso ficha voluntario (ip/UA) | ACTIVO | 6 | ALTA | Sin política RLS visible — revisión manual |
| `academico.cursos` | Cursos de formación | ACTIVO | 7 | MEDIA | — |
| `academico.inscripciones` | Inscripciones (+nota 0-20) | ACTIVO | 8 | MEDIA | CHECK de nota con sintaxis inválida en migración 20260426 |
| `academico.certificados` | Certificados emitidos | ACTIVO | 6 | MEDIA | — |
| `academico.asistencias` | Asistencia a clases | SIN USO | 0 | BAJA | **[DEAD?]** (no confundir con ong.asistencias) |
| `gamificacion.insignias` | Insignias | SIN USO | 0 | BAJA | **[DEAD?] módulo completo** |
| `gamificacion.puntos_ledger` | Ledger de puntos | SIN USO | 0 | BAJA | **[DEAD?]** |
| `gamificacion.volunteer_badges` | Insignias otorgadas | SIN USO | 0 | BAJA | **[DEAD?]** |
| `gamificacion.gamification_rules` | Reglas de puntos | SIN USO | 0 | BAJA | **[DEAD?]** |
| `gamificacion.kudos` | Reconocimientos entre voluntarios | SIN USO | 0 | BAJA | **[DEAD?]** |
| `impacto.ods_globales` | Catálogo ODS (1-17; seed solo 1-4) | SIN USO | 0 | BAJA | **[DEAD?] módulo completo** |
| `impacto.kpi_indicadores` | KPIs de impacto | SIN USO | 0 | BAJA | **[DEAD?]** |
| `impacto.kpi_mediciones` | Mediciones de KPI | SIN USO | 0 | BAJA | **[DEAD?]** |
| `impacto.project_ods` | ODS por proyecto | SIN USO | 0 | BAJA | **[DEAD?]** |
| `impacto.kpi_targets` | Metas por periodo | SIN USO | 0 | BAJA | **[DEAD?]** |
| `comunicaciones.user_devices` | Tokens push por usuario | SIN USO | 0 | BAJA | **[DEAD?]** |
| `comunicaciones.historial_notificaciones` | Historial de notificaciones (+entrega) | ACTIVO | 19 | MEDIA | Ampliada por Parte 4 §11 |
| `comunicaciones.sync_queue` | Cola de sincronización offline | SIN USO | 0 | BAJA | **[DEAD?]** |
| `comunicaciones.canales_notificacion` | Catálogo canales (email/push/sms) | ACTIVO | 10 | BAJA | — |
| `comunicaciones.plantillas_notificacion` | Plantillas por canal (+variables) | ACTIVO | 12 | MEDIA | — |
| `comunicaciones.entity_versions` | Versionado de entidades (sync) | SIN USO | 0 | BAJA | **[DEAD?]** |
| `auditoria.audit_log` | Bitácora forense por schema auditoria | PARCIAL/DUDA | 4 (lectura) | ALTA | Ningún trigger del repo la escribe; política FOR ALL contradice inmutabilidad |

---

## 5. FUNCIONES

| Función | Firma / Retorno | Lenguaje | Objetivo | Tablas usadas | Estado | Criticidad | Observaciones |
|---|---|---|---|---|---|---|---|
| `public.fn_current_tenant_id` | `() → uuid` | SQL, STABLE, SECURITY DEFINER | Tenant del usuario autenticado (base de TODA la RLS) | profiles | ACTIVO | **ALTA** | Redefinida idénticamente en 3 migraciones; versión legacy con current_setting SUPERSEDED |
| `public.fn_set_updated_at` | `() → trigger` | plpgsql | updated_at automático | — | ACTIVO | MEDIA | Prereq de ACE FASE 0 |
| `public.fn_is_tenant_admin` | `() → boolean` | SQL STABLE | ¿Usuario tiene permiso iam.admin? | user_roles_sedes, role_permissions | ACTIVO | ALTA | 18 llamadas RPC + políticas |
| `public.fn_has_permission` | `(text) → boolean` documentada; `(text, uuid)` usada/grant | SQL STABLE | Autorización granular | user_roles_sedes, role_permissions | ACTIVO/**DUDA** | **ALTA** | **Firma 2-args NO definida en el repo** — revisión manual |
| `public.fn_validate_permission_exists` | `() → trigger` | plpgsql | Valida permiso contra cat_permissions | cat_permissions | ACTIVO | MEDIA | — |
| `public.fn_trigger_audit_universal` | `() → trigger` (TG_ARGV[0]=col tenant) | plpgsql SECURITY DEFINER | Auditoría universal con retención por plan | audit_logs, tenants, plan_policies | ACTIVO | **ALTA** | Versión legacy sin TG_ARGV SUPERSEDED; incompatible con trigger antiguo trg_user_roles_sedes_audit |
| `public.fn_is_module_enabled` | `(text) → boolean` | SQL STABLE | ¿Módulo habilitado para tenant? | tenant_modules | SIN USO | BAJA | **[DEAD?]** sin llamadas |
| `public.fn_bootstrap_tenant` | `(text,text,text,text DEFAULT 'basic',int DEFAULT 1) → uuid` | plpgsql SECURITY DEFINER | Alta atómica de tenant (tenant+profile+sede+Owner+contrato+entitlements) | tenants, profiles, sedes, roles, role_permissions, user_roles_sedes, subscription_contracts, entitlements, cat_permissions, plan_policies | ACTIVO | **ALTA** | Versión 4-args de Parte 1 SUPERSEDED; no se encontró llamada .rpc en repo — probable invocación desde flujo onboarding no versionado. Revisión manual |
| `public.fn_complete_access_onboarding` | `(text, jsonb) → jsonb` | plpgsql SECURITY DEFINER | Onboarding atómico ACE por link | access_links, profiles, memberships, user_roles_sedes, ong.voluntarios, rrhh.solicitudes_admision, audit_logs, auth.users | PARCIAL | **ALTA** | Sin llamada .rpc detectada en servicios — revisión manual |
| `public.fn_sync_urs_to_membership` | `() → trigger` | plpgsql SECURITY DEFINER | Sincroniza user_roles_sedes → memberships (rol heredero) | user_roles_sedes, roles, memberships | ACTIVO | ALTA | ACE FASE 2 |
| `public.fn_validate_access_code` | `(text) → jsonb` | plpgsql SECURITY DEFINER | Validación anónima de link (sin datos sensibles) | access_links | ACTIVO | ALTA | Grant a anon; usada por ace.service.ts |
| `public.fn_has_context_access` | `(uuid, uuid) → boolean` | SQL STABLE SECURITY DEFINER | Verificación de membresía activa para RLS futura | memberships | SIN USO | MEDIA | **[DEAD?]** ninguna política la usa aún |
| `rrhh.fn_generate_registration_code` | `(varchar×4, uuid, int DEFAULT 1440) → rrhh.codigos_registro_voluntario` | plpgsql SECURITY DEFINER | Genera código de invitación legacy | codigos_registro_voluntario | ACTIVO | ALTA | Escribe en tabla legacy, NO en access_links; llama fn_has_permission con 1 arg |
| `ong.fn_register_attendance_scan` | `(text, uuid, timestamptz DEFAULT now()) → ong.asistencias` | plpgsql SECURITY DEFINER | Check-in/out por QR de credencial | id_cards, asistencias | ACTIVO | ALTA | — |
| `public.fn_remote_revoke_app_session` | `(uuid, text) → public.sessions` | plpgsql SECURITY DEFINER | Revocación remota de sesión | sessions | ACTIVO | ALTA | — |

## 6. TRIGGERS

| Trigger | Tabla | Evento | Función | Estado | Observaciones |
|---|---|---|---|---|---|
| `trg_role_permissions_validate_permission` | role_permissions | BEFORE INS/UPD | fn_validate_permission_exists | ACTIVO | — |
| `trg_user_roles_sedes_audit` | user_roles_sedes | AFTER I/U/D | fn_trigger_audit_universal() sin arg | **SUPERSEDED/CONFLICTO** | Si persiste en BD, rompe escrituras en URS (función exige TG_ARGV[0]) — **revisión manual urgente** |
| `tr_audit_urs` | user_roles_sedes | AFTER I/U/D | fn_trigger_audit_universal('tenant_id') | ACTIVO | Versión vigente |
| `tr_sync_user_roles_sedes` | user_roles_sedes | AFTER I/U/D | fn_sync_urs_to_membership | ACTIVO | ACE FASE 2 |
| `tr_audit_profiles` | profiles | AFTER I/U/D | fn_trigger_audit_universal('tenant_id') (presunto) | **DUDA** | Exigido por schema_guard; CREATE ausente del repo |
| `trg_public_*_set_updated_at` (11) | tenants, sedes, profiles, roles, subscription_contracts, entitlements, subscription_changes, invoices, payment_methods, payment_transactions, tenant_modules | BEFORE UPDATE | fn_set_updated_at | ACTIVO | — |
| `tr_access_links_updated_at`, `tr_memberships_updated_at`, `tr_dynamic_forms_updated_at` | tablas ACE | BEFORE UPDATE | fn_set_updated_at | ACTIVO | — |
| `tr_audit_access_links`, `tr_audit_memberships`, `tr_audit_dynamic_forms`, `tr_audit_role_module_access`, `tr_audit_role_field_permissions` | tablas ACE | AFTER I/U/D | fn_trigger_audit_universal('tenant_id') | ACTIVO | — |
| Triggers updated_at de módulos (ong.*, rrhh.*, etc.) | dinámico (Parte 3 §B2) | BEFORE UPDATE | fn_set_updated_at | DUDA | Generados por DO dinámico; lista final requiere pg_trigger en BD real |

## 7. VISTAS

| Vista | Objetivo | Consulta base | Dependencias | Estado |
|---|---|---|---|---|
| `public.v_user_session_context` | Perfil hidratado + membresías activas del usuario actual (security_invoker=true, WHERE p.id=auth.uid()) | profiles ⟕ memberships(active) ⟕ roles, jsonb_agg | profiles, memberships, roles, auth.uid() | ACTIVO (ace.service.ts) |

## 8. ÍNDICES (resumen de redundancias — lista completa en MASTER_SCRIPT)

| Índice | Tabla | Evaluación |
|---|---|---|
| `idx_access_links_code` vs `idx_access_links_available` | access_links | Complementarios (parcial optimiza onboarding) — OK, documentado en FASE 4 |
| `idx_memberships_user` vs `idx_memberships_user_active` vs `idx_memberships_active_lookup` vs `idx_memberships_active` | memberships | 4 índices con solapamiento parcial; `idx_memberships_active (tenant_id,status)` es probablemente redundante frente a `active_lookup`. Revisión con pg_stat_user_indexes |
| `idx_urs_tenant` | user_roles_sedes | Creado 2 veces (Parte 1 y hardening) — idempotente, sin duplicado real |
| `idx_ong_voluntarios_tenant` vs `idx_ong_voluntarios_tenant_numdoc` | ong.voluntarios | El simple (tenant_id) es prefijo del compuesto → candidato a eliminación |
| `idx_ong_actividades_tenant` vs `_tenant_estado` vs `_tenant_fechas` vs `_tenant_created_at` | ong.actividades | (tenant_id) simple redundante como prefijo |
| `idx_ong_tareas_tenant` vs `idx_ong_tareas_tenant_created_at` | ong.tareas | Ídem |
| `idx_fin_transacciones_tenant` vs `idx_finanzas_transacciones_tenant_fecha` | finanzas.transacciones | Ídem |
| `idx_sessions_tenant` vs `idx_public_sessions_tenant_created_at` | sessions | Ídem |
| `idx_audit_logs_tenant` vs `idx_public_audit_logs_tenant_created_at` | audit_logs | Ídem |
| `idx_payment_transactions_tenant` vs `idx_public_payment_transactions_tenant_created_at` | payment_transactions | Ídem |

## 9. RPC / EDGE FUNCTIONS (Supabase)

| Objeto | Tipo | Objetivo | Estado | Observaciones |
|---|---|---|---|---|
| `admin-provision-user` | Edge Function (Deno) — `ONG/supabase/functions/` | Alta administrativa de usuario (service_role) | ACTIVO (invocada vía functions.invoke en configuracion/shared.ts) | Sólo existe en subproyecto ONG/, no en supabase/ raíz |
| `admin-revoke-user-sessions` | Edge Function | Revocar sesiones auth de un usuario | ACTIVO | Ídem |
| `consume-volunteer-registration-code` | Edge Function | Preview/consumo de código legacy + creación de cuenta + documentos | ACTIVO | Opera sobre rrhh.codigos_registro_voluntario (legacy, NO ACE) |
| `_shared/http.ts`, `_shared/supabase.ts` | Módulos compartidos | Helpers HTTP + cliente admin | ACTIVO | — |

## 10. SECUENCIAS, TIPOS PERSONALIZADOS, ENUMS

- **Secuencias:** ninguna secuencia explícita (`CREATE SEQUENCE`) en el proyecto; PKs por `gen_random_uuid()`. El GRANT masivo de secuencias en 20260331 es defensivo (cubriría serials futuros). ✔
- **Tipos personalizados / ENUM / dominios:** ninguno. Los "enums" se implementan como CHECK constraints o tablas catálogo. ✔
- **Extensiones:** `pgcrypto`, `uuid-ossp` (uuid-ossp probablemente innecesaria: todo usa gen_random_uuid de pgcrypto/PG13+ — candidata a limpieza).

---

*Fin de DATABASE_DICTIONARY.md*
