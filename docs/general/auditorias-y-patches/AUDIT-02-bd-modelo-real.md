# AUDIT-02 Modelo BD Real (Supabase)

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: reconstrucción del modelo BD real a partir de artefactos SQL disponibles en repo + historial `HEAD`.

## 1) Fuentes y criterio de consolidación

Fuentes consideradas (en orden de confiabilidad para este modelo):

1. `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md` (esquema base completo, tablas/funciones/triggers/policies).
2. `git:HEAD:supabase/migrations/20260301120000_ai_security_copilot.sql` (delta AI security, `mfa_challenges`, columnas PIN/risk).
3. `git:HEAD:supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql` (fix `fn_current_tenant_id`, trigger auditoría robusto y `fn_bootstrap_tenant` idempotente).
4. `indi-info/todocorridoensupabase.md` como evidencia de ejecuciones repetidas y redefiniciones intermedias.

Nota: en el árbol actual no hay `.sql` ejecutables en `supabase/migrations` (vacío), por lo que esta reconstrucción es documental/histórica y puede diferir del estado real de una instancia concreta.

## 2) Extensiones, tipos y objetos globales

- Extensiones detectadas:
  - `uuid-ossp` (`SUBS-05:9`)
  - `pgcrypto` (`SUBS-05:10`, `SUBS-06:4`)
- `ENUM` SQL nativos: no detectados (`create type ... as enum` no aparece); se usan catálogos + `check` constraints.
- Vistas: no detectadas.

## 3) Tablas (modelo consolidado)

### 3.1 Catálogos

1. `public.cat_industry_types` (`SUBS-05:16-20`)
- Columnas: `id text PK`, `description text not null`, `created_at timestamptz default now()`.

2. `public.cat_plan_types` (`SUBS-05:22-26`)
- Columnas: `id text PK`, `description`, `created_at`.

3. `public.cat_tenant_statuses` (`SUBS-05:29-33`)
- Columnas: `id text PK`, `description`, `created_at`.

4. `public.cat_subscription_statuses` (`SUBS-05:36-40`)
- Columnas: `id text PK`, `description`, `created_at`.

5. `public.cat_subscription_change_statuses` (`SUBS-05:43-47`)
- Columnas: `id text PK`, `description`, `created_at`.

6. `public.cat_invoice_statuses` (`SUBS-05:50-54`)
- Columnas: `id text PK`, `description`, `created_at`.

7. `public.cat_payment_statuses` (`SUBS-05:57-61`)
- Columnas: `id text PK`, `description`, `created_at`.

8. `public.cat_permissions` (`SUBS-05:992-997`)
- Columnas: `id text PK`, `description text not null`, `module text default 'core'`, `created_at`.

### 3.2 Núcleo multi-tenant / IAM

9. `public.tenants` (`SUBS-05:131-144`)
- PK: `id uuid`.
- Columnas clave: `name`, `tax_id unique`, `industry_type_id FK`, `plan_id FK`, `status_financial_id FK`, `billing_day check 1..28`, `max_licenses check >=1`, `created_at`, `updated_at`.
- Índice: `idx_tenants_status` (`SUBS-05:146`).

10. `public.sedes` (`SUBS-05:148-156`)
- PK: `id uuid`.
- FKs: `tenant_id -> tenants(id)`.
- Restricción: `unique (tenant_id, name)`.
- Índice: `idx_sedes_tenant` (`SUBS-05:158`).

11. `public.profiles` (`SUBS-05:165-174` + `HEAD migration 20260301120000:6-10`)
- PK/FK: `id uuid -> auth.users(id)`.
- Columnas base: `tenant_id`, `full_name`, `pin_hash`, `is_blocked`, `blocked_reason`, `created_at`, `updated_at`.
- Delta AI security: `pin_failed_attempts int default 0`, `pin_last_failed_at`, `pin_blocked_until`, `risk_blocked_until`.
- Índice: `idx_profiles_tenant` (`SUBS-05:176`).

12. `public.roles` (`SUBS-05:179-188`)
- PK: `id uuid`.
- FKs: `tenant_id -> tenants`.
- Restricción: `unique (tenant_id, name)`.
- Columnas: `hierarchy_level`, `is_system_role`, timestamps.
- Índice: `idx_roles_tenant` (`SUBS-05:190`).

13. `public.role_permissions` (`SUBS-05:193-198`)
- PK compuesta: `(role_id, permission)`.
- FK: `role_id -> roles(id)`.
- Trigger de validación contra `cat_permissions` (`SUBS-05:1039-1052`).

14. `public.user_roles_sedes` (`SUBS-05:201-208`)
- PK compuesta: `(user_id, role_id, sede_id)`.
- FKs: `tenant_id`, `user_id`, `role_id`, `sede_id`.
- Índices: `idx_urs_tenant`, `idx_urs_user`, `idx_urs_sede` (`SUBS-05:210-212`).

15. `public.role_access_constraints` (`SUBS-05:215-225`)
- PK: `id uuid`.
- FKs: `tenant_id`, `role_id`, `sede_id`.
- Columnas de restricción: `ip_cidr`, `time_start`, `time_end`, `require_trusted_device`.
- Índice: `idx_rac_role` (`SUBS-05:227`).

16. `public.terminals` (`SUBS-05:234-244`)
- PK: `id uuid`.
- FKs: `tenant_id`, `sede_id`.
- Restricción: `unique (tenant_id, sede_id, name)`.
- Índice: `idx_terminals_tenant` (`SUBS-05:246`).

17. `public.devices` (`SUBS-05:249-261`)
- PK: `id uuid`.
- FKs: `tenant_id`, `user_id`.
- Restricción: `unique (tenant_id, device_fingerprint)`.
- Columnas: `device_type`, `is_trusted`, `last_ip`, `last_user_agent`, `last_seen_at`.
- Índice: `idx_devices_user` (`SUBS-05:263`).

18. `public.sessions` (`SUBS-05:266-280`)
- PK: `id uuid`.
- FKs: `tenant_id`, `user_id`, `terminal_id`, `device_id`.
- Check: `session_type in ('web','terminal','api')`.
- Columnas: `ip`, `user_agent`, `expires_at`, `revoked_at`, `revoke_reason`.
- Índices: `idx_sessions_user`, `idx_sessions_tenant` (`SUBS-05:282-283`).

19. `public.auth_events` (`SUBS-05:286-299`)
- PK: `id uuid`.
- FKs: `tenant_id`, `user_id`, `session_id`, `terminal_id`, `device_id`.
- Check `result in ('success','error')`.
- Índice: `idx_auth_events_tenant_time` (`SUBS-05:301`).

20. `public.mfa_challenges` (`SUBS-06:12-23` / migration `20260301120000:12-23`)
- PK: `id uuid`.
- FKs: `tenant_id -> tenants`, `user_id -> profiles`.
- Checks: `channel in ('email_otp','app_otp','sms_otp')`, `risk_level in ('LOW','MEDIUM','HIGH')`.
- Índices: `idx_mfa_challenges_tenant_user`, `idx_mfa_challenges_active` (`SUBS-06:25-30`).

### 3.3 Suscripción / Facturación / Pagos

21. `public.plan_policies` (`SUBS-05:308-315`)
- PK/FK: `plan_id -> cat_plan_types`.
- Columnas: `retention_days`, `max_sedes`, `max_licenses`, `can_use_terminals`, `created_at`.

22. `public.subscription_contracts` (`SUBS-05:325-343`)
- PK: `id uuid`; `unique (tenant_id)`.
- FKs: `tenant_id`, `current_plan_id`, `status_id`.
- Columnas: ciclo, `billing_day`, `grace_days`, `read_only_at`, `suspended_at`, timestamps.
- Índice: `idx_sub_contract_status` (`SUBS-05:345`).

23. `public.entitlements` (`SUBS-05:348-356`)
- PK/FK: `tenant_id -> tenants`.
- Columnas: `plan_id`, `max_sedes`, `max_licenses`, `can_use_terminals`, `effective_from`, `updated_at`.

24. `public.subscription_changes` (`SUBS-05:359-374`)
- PK: `id uuid`.
- FKs: `tenant_id`, `from_plan_id`, `to_plan_id`, `status_id`, `requested_by`.
- Restricción: `idempotency_key unique`.
- Índice: `idx_sub_changes_tenant` (`SUBS-05:376`).

25. `public.invoices` (`SUBS-05:379-398`)
- PK: `id uuid`.
- FKs: `tenant_id`, `status_id`.
- Columnas: `invoice_number`, montos, período, fechas emisión/vencimiento, timestamps.
- Índice: `idx_invoices_tenant_status` (`SUBS-05:400`).

26. `public.invoice_lines` (`SUBS-05:402-410`)
- PK: `id uuid`.
- FK: `invoice_id -> invoices`.
- Columnas: `description`, `qty`, `unit_price`, `line_total`, `created_at`.
- Índice: `idx_invoice_lines_invoice` (`SUBS-05:412`).

27. `public.payment_methods` (`SUBS-05:419-431`)
- PK: `id uuid`.
- FK: `tenant_id -> tenants`.
- Check: `method_type in ('card_token','bank_transfer','cash','other')`.
- Columnas: `provider`, `token_ref`, `last4`, `holder_name`, `is_default`, `created_at`.
- Índice: `idx_payment_methods_tenant` (`SUBS-05:433`).

28. `public.payment_transactions` (`SUBS-05:436-462`)
- PK: `id uuid`.
- FKs: `tenant_id`, `invoice_id`, `subscription_change_id`, `status_id`, `payment_method_id`, `created_by`.
- Restricción: `idempotency_key unique`; `amount check >=0`.
- Columnas: proveedor, referencias externas, `raw_payload`, timestamps.
- Índice: `idx_pay_tx_tenant_status` (`SUBS-05:464`).

29. `public.payment_webhook_events` (`SUBS-05:467-480`)
- PK: `id uuid`.
- FK opcional: `tenant_id -> tenants`.
- Restricción: `unique (provider, event_id)` (idempotencia).
- Columnas: firma, `received_at`, `processed_at`, `payload`.

### 3.4 Auditoría

30. `public.audit_logs` (`SUBS-05:486-515`)
- PK: `id uuid`.
- Columnas: `tenant_id not null`, `sede_id`, `actor_id`, `actor_role_id`, `session_id`, `terminal_id`, `device_id`, `event_id`, `event_type`, `resource_name`, `result`, `error_code`, `ip`, `user_agent`, `criticality`, `payload_before`, `payload_after`, `retention_until`, `created_at`.
- Índices: `idx_audit_tenant_time`, `idx_audit_resource` (`SUBS-05:517-518`).

## 4) Funciones, triggers y seguridad

### 4.1 Funciones

- `fn_set_updated_at` (`SUBS-05:525`).
- `fn_current_tenant_id`:
  - versión base simple (`SUBS-05:534-540`),
  - versión robusta `security definer` y `search_path` en fix (`HEAD migration 20260302125000:11-24`).
- `fn_has_permission` (`SUBS-05:543-558`).
- `fn_is_tenant_admin` (`SUBS-05:561-567`).
- `fn_trigger_audit_universal`:
  - base con `security definer` (`SUBS-05:570-626`),
  - versión fix omite insert si `tenant_id is null` (`HEAD migration 20260302125000:30-93`).
- `fn_validate_permission_exists` (`SUBS-05:1039-1047`).
- `fn_bootstrap_tenant`:
  - base (`SUBS-05:1070-1153`),
  - versión idempotente/reordenada en fix (`HEAD migration 20260302125000:97-202`).

### 4.2 Triggers

- Triggers `updated_at`: `tr_tenants_updated`, `tr_sedes_updated`, `tr_profiles_updated`, `tr_roles_updated`, `tr_terminals_updated`, `tr_sub_contract_updated`, `tr_entitlements_updated`, `tr_invoices_updated`, `tr_pay_tx_updated` (`SUBS-05:631-671`).
- Triggers de auditoría universal: `tr_audit_*` en 14 tablas (`SUBS-05:681-747`).
- Trigger validación permisos: `tr_validate_role_permissions` (`SUBS-05:1050-1052`).

## 5) RLS consolidado (estado documental)

### 5.1 Tablas con RLS habilitado

- Habilitadas en base (`SUBS-05:755-779`): `tenants`, `sedes`, `profiles`, `roles`, `role_permissions`, `user_roles_sedes`, `role_access_constraints`, `terminals`, `devices`, `sessions`, `auth_events`, `subscription_contracts`, `entitlements`, `subscription_changes`, `invoices`, `invoice_lines`, `payment_methods`, `payment_transactions`, `payment_webhook_events`, `audit_logs`.
- Habilitadas por delta: `mfa_challenges` (`SUBS-06:32`), `cat_permissions` (`SUBS-05:1057`).

### 5.2 Tablas sin RLS explícito en artefacto base

- Catálogos globales: `cat_industry_types`, `cat_plan_types`, `cat_tenant_statuses`, `cat_subscription_statuses`, `cat_subscription_change_statuses`, `cat_invoice_statuses`, `cat_payment_statuses`.
- `plan_policies` (global de planes).

## 6) Divergencias relevantes entre scripts

1. `user_roles_sedes` y auditoría:
- En bloques intermedios de `todocorrido...` aparece trigger `tr_audit_urs` usando `'user_id'` (`:3287`), luego se corrige con `tenant_id` (`:3572-3574`).

2. Policies permisivas en histórico:
- `p_urs_write ... with check (true)` en bloque intermedio (`todocorrido...:3446-3449`), luego reemplazada por `tenant_id` estricto (`:3583-3586`).

3. `p_profiles_update` con `with check (true)` persiste en esquema base y bloques históricos (`SUBS-05:815-821`, `todocorrido...:3777-3783`).

4. `fn_current_tenant_id` y `fn_bootstrap_tenant` tienen múltiples redefiniciones; la versión más robusta es la del fix `20260302125000`.

## 7) Conclusión técnica del modelo

- El modelo de datos es amplio y cubre IAM + suscripciones + billing + auditoría en diseño.
- El estado “real ejecutable” no está versionado en el working tree (migraciones borradas), lo que genera riesgo de drift y obliga a tratar el estado actual como **modelo reconstruido por evidencia**, no como baseline desplegable garantizado.
