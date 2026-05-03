# AUDIT-03 BD Huérfanos y Uso

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: detección de objetos BD sin uso en código de aplicación (frontend/backend) y evaluación de orfandad técnica.

## 1) Método aplicado

- Modelo BD tomado de `AUDIT-02` (fuentes: `SUBS-05`, `SUBS-06`, migraciones `HEAD`).
- Uso real en código detectado por búsqueda de `.from("tabla")` y `rpc("...")` en `src/` y `server/`.
- Se distingue:
  - `Usado directo`: hay lectura/escritura explícita en código.
  - `Uso indirecto`: objeto es utilizado por trigger/RLS/función, aunque no haya llamada directa.
  - `Potencialmente huérfano`: no hay uso directo y tampoco evidencia de flujo funcional activo en app actual.

## 2) Tablas: usadas vs potencialmente huérfanas

### 2.1 Tablas con uso directo en código

- `profiles` (`src/hooks/useAuthFlow.js:93`, `server/supabase.js:40`, `server/routes/auth.js:413,465,512`, `server/security/risk-engine.js:283`)
- `terminals` (`server/routes/auth.js:400`)
- `sessions` (`server/security/risk-engine.js:26`, `server/routes/auth.js:564`, `server/routes/audit.js:116`)
- `devices` (`server/security/risk-engine.js:66,79,88`)
- `mfa_challenges` (`server/security/risk-engine.js:120,144,183,209,232,299,329`)
- `auth_events` (`server/security/audit.js:52`, `server/routes/audit.js:106`)
- `audit_logs` (`server/security/audit.js:128`)
- `tenants` (`server/security/audit.js:7`)
- `plan_policies` (`server/security/audit.js:15`)
- `payment_transactions` (`server/routes/audit.js:111`)
- `cat_industry_types` (`src/js/useOnboardingFlow.js:629`)
- `cat_plan_types` (`src/js/useOnboardingFlow.js:633`)

### 2.2 Tablas sin uso directo en código (potenciales huérfanas de app actual)

- Catálogos no consultados:
  - `cat_tenant_statuses`, `cat_subscription_statuses`, `cat_subscription_change_statuses`, `cat_invoice_statuses`, `cat_payment_statuses`, `cat_permissions`.
- IAM avanzado no expuesto por UI/API actual:
  - `roles`, `role_permissions`, `user_roles_sedes`, `role_access_constraints`, `sedes` (excepto creación interna por bootstrap SQL).
- Billing core no implementado en flujos actuales:
  - `subscription_contracts`, `entitlements`, `subscription_changes`, `invoices`, `invoice_lines`, `payment_methods`, `payment_webhook_events`.

Conclusión: no son huérfanas de diseño, pero sí de implementación actual de producto (feature gap).

## 3) Columnas potencialmente no usadas

Observación: no hay SQL dinámico en app para estos campos y no aparecen en selects/inserts/update del código revisado.

### 3.1 En tablas sí usadas

- `profiles`: `blocked_reason` no se usa en UI/API de respuesta.
- `tenants`: `status_financial_id`, `max_licenses` no se usan en validación de login/onboarding actual.
- `sessions`: `revoke_reason` no se utiliza.
- `audit_logs`: `sede_id`, `actor_role_id`, `event_id` no se completan desde `server/security/audit.js`.
- `mfa_challenges`: `channel`/`risk_level` son estáticos en el flujo (sin variantes dinámicas de canal/riesgo).

### 3.2 En tablas no usadas por app

- La mayoría de columnas de `subscription_*`, `invoice*`, `payment_methods`, `payment_webhook_events`, `role_access_constraints` quedan sin lectura/escritura en app actual.

## 4) Catálogos y estados no explotados

- Los catálogos de estados financieros y de billing existen en BD (`SUBS-05:29-61`) pero no hay motor de transición en código.
- En código no hay rutas de webhook de pagos ni reconciliación (`server/routes` solo expone auth/audit/onboarding).

## 5) Funciones/RPC: uso directo vs indirecto

### 5.1 RPC llamada desde app

- `fn_bootstrap_tenant` (`src/hooks/useAuthFlow.js:112`).

### 5.2 Funciones sin llamada directa desde app (pero con uso estructural)

- `fn_current_tenant_id`, `fn_has_permission`, `fn_is_tenant_admin`: usadas por policies RLS (`SUBS-05:783-981`).
- `fn_trigger_audit_universal`: usada por triggers de auditoría (`SUBS-05:681-747`).
- `fn_set_updated_at`: usada por triggers `tr_*_updated` (`SUBS-05:631-671`).
- `fn_validate_permission_exists`: usada por trigger `tr_validate_role_permissions` (`SUBS-05:1050-1052`).

No son huérfanas de BD, aunque no se llamen vía `rpc()` en frontend/backend.

## 6) Riesgos por orfandad funcional

1. Diseño > implementación:
- El modelo de billing/suscripciones está diseñado, pero la app actual no ejecuta CU-PAY-01..08.

2. Permisos RBAC no consumidos por capa de aplicación:
- Existen estructuras `roles/role_permissions/user_roles_sedes`, pero no hay endpoints/UI para administrarlas ni enforcement explícito en lógica de negocio backend.

3. Mantenimiento de esquema sobredimensionado para MVP actual:
- Aumenta complejidad de RLS, auditoría y soporte sin beneficio funcional hoy.

## 7) Recomendación de clasificación (sin borrar)

- `Core activo`: `profiles`, `tenants`, `sessions`, `devices`, `mfa_challenges`, `auth_events`, `audit_logs`, `cat_industry_types`, `cat_plan_types`.
- `Core diseñado pero no activado`: tablas de billing/suscripción y RBAC avanzado.
- Acción recomendada: marcar en roadmap como “deprecación lógica temporal / no expuesto” y activar por paquetes de feature (ver `AUDIT-06`).
