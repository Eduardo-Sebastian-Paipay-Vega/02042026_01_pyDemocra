# AUDIT-00 Inventario

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: inventario de artefactos de requisitos, BD Supabase y uso real en código para la auditoría RF/CU ↔ BD ↔ Código.

## 1) Resumen del repositorio

- Archivos Markdown detectados: 11 (`rg --files -g "*.md"`).
- Archivos SQL en árbol de trabajo: 0 (`rg --files -g "*.sql"`).
- Migraciones SQL presentes en `HEAD` pero eliminadas del árbol actual:
  - `supabase/migrations/20260301120000_ai_security_copilot.sql` (git:HEAD)
  - `supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql` (git:HEAD)
- Directorio `supabase/functions` (Edge Functions): no existe.

## 2) Mapa de artefactos

| Ruta | Tipo | Clasificación | Fecha/versión inferida | Observaciones |
|---|---|---|---|---|
| `indi-info/SUBS-00-Master-Doc-Tecnica.md` | Documento | Master técnico + reglas + permisos | Sin fecha explícita | Contiene bloques duplicados/concatenados (evidencia de repetición desde `:418` en adelante). |
| `indi-info/SUBS-01-REQ-Gestion-Actores.md` | Documento | Requisitos funcionales RF + CU | Sin fecha explícita | RF/CU base del dominio IAM/SUB/TEN/AUD. Duplicidad de ID `RF-TEN-001` (`:85` y `:96`). |
| `indi-info/SUBS-02-SEC-Matriz-Permisos.md` | Documento | Matriz de permisos/roles | Sin fecha explícita | Convención `perm.<dominio>.<recurso>.<acción>` (`:6`). |
| `indi-info/SUBS-03-RN-Reglas-Riesgos.md` | Documento | Reglas de negocio/riesgo (RULE-*) | Sin fecha explícita | Reglas IAM/SUB formales (`RULE-IAM-001..004`, `RULE-SUB-001..003`). |
| `indi-info/SUBS-04-CU-Pagos-Facturacion.md` | Documento | Casos de uso de pagos/facturación (`CU-PAY-01..08`) | Sin fecha explícita | Define FSM, errores PAY/FIN/SUB y QA-01..22. |
| `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md` | Documento SQL | Esquema maestro Supabase (tablas/funciones/triggers/policies/RLS) | “Arquitectura maestra V3” | Fuente estructural principal de BD. |
| `indi-info/SUBS-06-Act-BD.md` | Documento SQL | Delta BD AI security + fix onboarding/auditoría | Fecha explícita `2026-03-01` y `2026-03-02` (`:2`, `:67`) | Incluye `mfa_challenges` y redefiniciones de funciones. Tiene línea no-SQL `//parche` (`:64`). |
| `indi-info/todocorridoensupabase.md` | Documento SQL/log | Script acumulado de ejecución histórica | Fecha explícita en bloques `2026-03-02` | Múltiples redefiniciones repetidas y estados intermedios (incluye variantes inseguras y luego fixes). |
| `indi-info/README_AI_SECURITY_COPILOT.md` | Documento | Alcance backend/frontend + migración requerida | Sin fecha explícita | Referencia migración `20260301120000_ai_security_copilot.sql`. |
| `indi-info/QA_ONBOARDING_RISK_CHECKLIST.md` | Documento | QA onboarding/auth/risk gate | Fecha explícita `2026-03-02` (`:3`) | Casos QA-AUTH, QA-WIZ, QA-RISK. |
| `indi-info/README_MIGRATION.md` | Documento | Notas de migración proyecto | Sin fecha explícita | Documento con encoding inconsistente (caracteres dañados). |
| `server/` | Código | Backend Node/Express + Supabase service role | Vigente | Rutas: auth, audit/security metrics, onboarding RUC. |
| `src/` | Código | Frontend Vite/vanilla + supabase-js anon | Vigente | Auth, onboarding wizard, OTP/risk gate. |

## 3) Artefactos BD relevantes (fuente de verdad efectiva)

### 3.1 Fuentes SQL en orden de prioridad técnica para esta auditoría

1. `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md` (modelo base completo).
2. `git:HEAD:supabase/migrations/20260301120000_ai_security_copilot.sql` (delta AI security).
3. `git:HEAD:supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql` (fix crítico onboarding/auditoría).
4. `indi-info/todocorridoensupabase.md` como evidencia de ejecución histórica y variantes intermedias.

### 3.2 Objetos de BD identificados

- Tablas (30): `cat_*`, `tenants`, `sedes`, `profiles`, `roles`, `role_permissions`, `user_roles_sedes`, `role_access_constraints`, `terminals`, `devices`, `sessions`, `auth_events`, `plan_policies`, `subscription_contracts`, `entitlements`, `subscription_changes`, `invoices`, `invoice_lines`, `payment_methods`, `payment_transactions`, `payment_webhook_events`, `audit_logs`, `cat_permissions`, `mfa_challenges`.
- Funciones: `fn_set_updated_at`, `fn_current_tenant_id`, `fn_has_permission`, `fn_is_tenant_admin`, `fn_trigger_audit_universal`, `fn_validate_permission_exists`, `fn_bootstrap_tenant`.
- Triggers: de `updated_at`, auditoría universal y validación de permisos.
- Policies RLS: políticas por tabla IAM/SUB/Billing/Audit + políticas para `mfa_challenges`.

## 4) Artefactos de uso real en código

### 4.1 Rutas backend activas

- `server/routes/auth.js`: `/risk-evaluate`, `/step-up/verify-otp`, `/step-up/resend-otp`, `/terminal-login`.
- `server/routes/audit.js`: `/summary`, `/metrics` (también montado como `/api/security/*` en `server/index.js:24`).
- `server/routes/onboarding.js`: `/validate-ruc/:ruc`.

### 4.2 Acceso real a tablas desde código (`.from`)

Tablas referenciadas en ejecución:

- `profiles`, `terminals`, `sessions`, `devices`, `mfa_challenges`, `auth_events`, `audit_logs`, `tenants`, `plan_policies`, `payment_transactions`, `cat_industry_types`, `cat_plan_types`.

Evidencias representativas:

- `src/hooks/useAuthFlow.js:93`, `:112` (`rpc("fn_bootstrap_tenant")`).
- `src/js/useOnboardingFlow.js:629`, `:633`.
- `server/routes/auth.js:400`, `:413`, `:564`.
- `server/security/risk-engine.js:26`, `:66`, `:120`, `:299`.
- `server/security/audit.js:7`, `:15`, `:52`, `:128`.
- `server/routes/audit.js:106`, `:111`, `:116`.

## 5) Duplicados y contradicciones detectadas

1. Migraciones eliminadas del árbol actual:
- `supabase/migrations/*` aparece vacío en working tree, pero `git ls-tree -r --name-only HEAD` sí contiene 2 migraciones SQL.

2. Duplicidad de requisito con mismo ID:
- `RF-TEN-001` aparece como “Actualizado” (`SUBS-01:85`) y otra variante de validación fiscal (`SUBS-01:96`).

3. Convención de permisos inconsistente:
- Requisitos/matriz usan prefijo `perm.*` (`SUBS-02:6`, `:33-97`),
- Catálogo/policies SQL usan principalmente `iam.*`, `subs.*`, `billing.*` (`SUBS-05:1010-1031`, `:806`, `:833`).

4. Variantes RLS contradictorias en histórico:
- En `todocorridoensupabase.md` existe versión de `p_urs_write` con `with check (true)` (`:3449`) y luego versión más segura por `tenant_id` (`:3585-3586`).
- También persiste `p_profiles_update ... with check (true)` en distintos bloques (`SUBS-05:821`, `todocorrido...:3783`).

5. Estado documental vs ejecutable:
- `SUBS-06-Act-BD.md` mezcla SQL con línea no válida `//parche` (`:64`), lo que impide ejecución directa sin limpieza.

6. Desplazamiento de documentación raíz:
- `README_MIGRATION.md`, `README_AI_SECURITY_COPILOT.md`, `QA_ONBOARDING_RISK_CHECKLIST.md` están eliminados en raíz y reingresados en `indi-info/` (según `git status --short`).

## 6) Riesgos inmediatos de inventario

- No hay carpeta de migraciones activas con SQL versionado en working tree (`supabase/migrations` vacío): riesgo alto de drift entre entornos.
- Existen múltiples fuentes SQL no canónicas y repetidas (`SUBS-05`, `SUBS-06`, `todocorrido...`, `git:HEAD`), por lo que se requiere consolidación de baseline antes de nuevos cambios.
