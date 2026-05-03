# AUDIT-04 Mapa de Uso Código ↔ BD

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: mapeo de uso real de Supabase (tablas, columnas, RPC) en frontend/backend y trazabilidad preliminar a RF/CU.

## 1) Mapa de acceso Supabase por archivo

| Tabla/RPC | Operación | Columnas/params observados | Evidencia código |
|---|---|---|---|
| `profiles` | `select` | `id, tenant_id, full_name` | `src/hooks/useAuthFlow.js:93-96` |
| `profiles` | `select` | `id, tenant_id, is_blocked, blocked_reason, risk_blocked_until, pin_failed_attempts, pin_blocked_until` | `server/supabase.js:40-44` |
| `profiles` | `select` | `id, tenant_id, pin_hash, pin_failed_attempts, pin_blocked_until, risk_blocked_until, is_blocked` | `server/routes/auth.js:413-419` |
| `profiles` | `update` | `pin_failed_attempts, pin_last_failed_at, pin_blocked_until` | `server/routes/auth.js:465-472` |
| `profiles` | `update` | reset de intentos PIN | `server/routes/auth.js:512-519` |
| `profiles` | `update` | `risk_blocked_until, pin_blocked_until` | `server/security/risk-engine.js:283-289` |
| `terminals` | `select` | `id, tenant_id, is_active` | `server/routes/auth.js:400-404` |
| `sessions` | `insert` | `tenant_id, user_id, terminal_id, device_id, session_type, ip, user_agent, expires_at` | `server/security/risk-engine.js:26-38` |
| `sessions` | `update` | `terminal_id` | `server/routes/auth.js:564-569` |
| `sessions` | `select count` | sesiones activas por tenant | `server/routes/audit.js:116-120` |
| `devices` | `upsert` | `tenant_id, user_id, device_fingerprint, device_type, is_trusted, last_ip, last_user_agent, last_seen_at` | `server/security/risk-engine.js:66-69` |
| `devices` | `select` | contexto dispositivo/IP conocido | `server/security/risk-engine.js:79-93` |
| `mfa_challenges` | `insert` | `tenant_id, user_id, channel, code_hash, expires_at, risk_level, context` | `server/security/risk-engine.js:120-130` |
| `mfa_challenges` | `update` | `context` delivery, `code_hash`, `expires_at`, `verified_at` | `server/security/risk-engine.js:144-160`, `209-219`, `232-249`, `329-333` |
| `mfa_challenges` | `select` | `id, context, verified_at`, `code_hash`, `expires_at` | `server/security/risk-engine.js:183-188`, `299-304` |
| `auth_events` | `insert` | `tenant_id, user_id, session_id, terminal_id, device_id, event_type, result, ip, user_agent, error_code` | `server/security/audit.js:52-55` |
| `auth_events` | `select` | `event_type, result` para métricas | `server/routes/audit.js:106-109` |
| `audit_logs` | `insert` | payload forense + retención | `server/security/audit.js:128-131` |
| `tenants` | `select` | `plan_id` | `server/security/audit.js:7-10` |
| `plan_policies` | `select` | `retention_days` | `server/security/audit.js:15-18` |
| `payment_transactions` | `select` | `status_id` para métrica de fallos | `server/routes/audit.js:111-114` |
| `cat_industry_types` | `select` | `id, description` | `src/js/useOnboardingFlow.js:629-631` |
| `cat_plan_types` | `select` | `id, description` | `src/js/useOnboardingFlow.js:633-635` |
| `fn_bootstrap_tenant` | `rpc` | `p_tenant_name, p_tax_id, p_industry_type_id, p_plan_id, p_billing_day` | `src/hooks/useAuthFlow.js:112-118` |

## 2) Endpoints y flujo de datos (backend)

- `/api/auth/risk-evaluate`:
  - Toma `tenant_id`, `device_fingerprint`, `required_permission`, etc. (`server/routes/auth.js:50-81`).
  - Persiste eventos vía `insertAuthEvent`/`insertAuditLog`.
  - Usa motor de riesgo (`server/security/risk-engine.js`).

- `/api/auth/step-up/verify-otp` y `/api/auth/step-up/resend-otp`:
  - Operan sobre `mfa_challenges` y sesiones (`server/routes/auth.js:169-374`).

- `/api/auth/terminal-login`:
  - Valida `terminals` y `profiles`, gestiona intentos PIN, crea/actualiza sesión, audita (`server/routes/auth.js:382-614`).

- `/api/security/metrics` y `/api/audit/metrics`:
  - Lee `auth_events`, `payment_transactions`, `sessions` (`server/routes/audit.js:104-153`).

- `/api/onboarding/validate-ruc/:ruc`:
  - Integra API externa de RUC (sin escritura directa a BD) (`server/routes/onboarding.js:98-201`).

## 3) Trazabilidad RF/CU → soporte técnico actual

### 3.1 RF/CU con soporte observable directo

- `RF-TEN-001-B` / `CU-01` (validación fiscal + onboarding)
  - RUC: `server/routes/onboarding.js:98-192`.
  - Bootstrap tenant: `src/hooks/useAuthFlow.js:112-118`.
  - Catálogos de rubro/plan: `src/js/useOnboardingFlow.js:629-635`.

- `RF-IAM-002` / `CU-02` (autenticación terminal por PIN)
  - Validación PIN y bloqueo por intentos: `server/routes/auth.js:452-509`.
  - Eventos de auth/auditoría: `server/routes/auth.js:474-503`, `572-606`.

- `RF-IAM-004` (sesiones/dispositivo, parcial)
  - Registro dispositivo y sesión: `server/security/risk-engine.js:44-73`, `13-42`.

- `RF-AUD-001` (auditoría, parcial)
  - Inserción de `auth_events` y `audit_logs`: `server/security/audit.js:24-59`, `61-138`.

### 3.2 RF/CU sin soporte funcional completo en código

- `RF-IAM-003` / `CU-03` (override supervisado): no hay endpoint/flujo dedicado.
- `RF-SUB-001` / `CU-04` (concurrencia por licencias): no hay enforcement de límite en login.
- `RF-SUB-002`, `RF-SUB-003`, `RF-SUB-004` y `CU-PAY-01..08`: no existe orquestador de pagos, webhook, reconciliación ni transición financiera operativa en rutas actuales.

Evidencia por ausencia funcional:

- Rutas activas limitadas a `auth`, `audit/security`, `onboarding` (`server/routes/*`).
- No hay rutas `billing/payment/webhook` en `server/routes`.
- No hay acceso en código a `subscription_changes`, `invoices`, `payment_methods`, `payment_webhook_events`, `entitlements`.

## 4) Hallazgos de autorización/multi-tenant en flujo real

- Validación explícita de tenant en endpoints autenticados:
  - `server/routes/auth.js:28-37`, `:51-57`.
  - `server/routes/audit.js:21-26`.

- Patrón dominante: backend con `serviceClient` (service role), no `userClient`, para la mayoría de escrituras/lecturas (`server/security/audit.js`, `server/security/risk-engine.js`, `server/routes/auth.js`).
- Implicación: el aislamiento depende principalmente de filtros de aplicación (`.eq("tenant_id", ...)`) y no de RLS en esas operaciones.

## 5) Cobertura de columnas por tabla (resumen práctico)

- Tablas con uso de columnas extensivo: `profiles`, `mfa_challenges`, `sessions`, `devices`, `auth_events`, `audit_logs`.
- Tablas de diseño sin consumo actual: gran parte de `billing/subscription` y `RBAC avanzado`.

Este mapa se usa como evidencia base para la matriz de cobertura en `AUDIT-05`.
