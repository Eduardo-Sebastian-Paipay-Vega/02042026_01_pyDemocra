# AI Security Copilot: setup

Implementacion de `AI Security + Onboarding Copilot` para stack actual Vite/vanilla + Supabase.

## 1) Que incluye

- Backend server-side con endpoints:
  - `POST /api/auth/risk-evaluate`
  - `POST /api/auth/step-up/verify-otp`
  - `POST /api/auth/terminal-login`
  - `POST /api/audit/summary`
  - `GET /api/security/metrics`
- Frontend auth/onboarding:
  - `login.html`
  - `register.html` (alias legacy: `registro.html`)
  - `onboarding.html`
  - `otp-challenge.html`
  - `terminal-login.html`
- Hooks:
  - `src/hooks/useAuthFlow.js`
  - `src/hooks/useRiskGate.js`
- UX error explainer:
  - `src/shared/error-explainer.js`
- Migracion SQL minima:
  - `supabase/migrations/20260301120000_ai_security_copilot.sql`

## 2) Variables de entorno

Copia `.env.example` a `.env` y completa:

- Frontend:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Backend:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- IA:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_BASE_URL`

## 3) Correr local

1. Instala dependencias:
   - `npm install`
2. Ejecuta frontend + API:
   - `npm run dev:full`
3. Frontend queda en Vite (por defecto `http://localhost:5173`) y API en `http://localhost:8787`.

`vite.config.js` ya proxya `/api/*` hacia el backend.

## 4) Aplicar migracion en Supabase

Ejecuta el SQL de `supabase/migrations/20260301120000_ai_security_copilot.sql` en tu proyecto.

Delta aplicado:

- `public.mfa_challenges`.
- Columnas en `public.profiles`:
  - `pin_failed_attempts`
  - `pin_last_failed_at`
  - `pin_blocked_until`
  - `risk_blocked_until`

## 5) Flujo implementado

### A) Registro

- `register.html` usa `supabase.auth.signUp`.
- Si hay sesion activa tras registro, redirige a `onboarding.html`.

### B) Onboarding

- `onboarding.html` llama `rpc('fn_bootstrap_tenant', ...)` con:
  - `tenant_name`
  - `tax_id`
  - `industry_type_id`
  - `plan_id`
  - `billing_day`

### C) Login + Risk Gate

- Login por email/password con Supabase.
- Antes de navegar al dashboard, llama `/api/auth/risk-evaluate`.
- Decisiones:
  - `ALLOW` -> entra a `studio.html`
  - `REQUIRE_OTP` -> `otp-challenge.html`
  - `TEMP_BLOCK` -> mensaje amigable + tiempo estimado

## 6) Reglas de seguridad aplicadas

- Riesgo bajo: `ALLOW`.
- Riesgo medio: `REQUIRE_OTP`.
- Riesgo alto: `TEMP_BLOCK` + bloqueo temporal.
- Acciones `HIGH/CRITICAL` (`ACTION_CRITICAL`) fuerzan step-up MFA.
- PIN con `>= 5` fallos -> bloqueo `15 min` y auditoria.
- Control de concurrencia vs `entitlements.max_licenses`:
  - si excede y no hay override -> `SUB-001`, bloqueo.
- RBAC nunca se delega a IA:
  - permisos se validan con `fn_has_permission`.

## 7) Auditoria forense y observabilidad

Se registran eventos en:

- `auth_events` (eventos auth/PIN/MFA).
- `audit_logs` (decision, codigos, payload antes/despues).

Resumen forense IA:

- Se guarda en `audit_logs.payload_after`:
  - `forensic_summary`
  - `forensic_reasoning`
  - `forensic_confidence`

Metricas disponibles por endpoint:

- `login_success_rate`
- `PIN_failure_rate`
- `override_frequency`
- `concurrent_sessions_usage`
- `payment_failure_rate`
- `suspicious_activity_flags`

## 8) Notas de seguridad

- Service role se usa solo en backend para:
  - lecturas de riesgo cruzando tablas protegidas por RLS,
  - escritura de `auth_events`/`audit_logs`,
  - creacion/verificacion de `mfa_challenges`.
- Cliente web nunca recibe secretos.
- En payloads forenses se enmascara IP (`ip_masked`) y se limita UA.
- `EXPOSE_DEBUG_OTP=false` en produccion.

## 9) QA rapido (criterios de aceptacion)

1. Login desde dispositivo nuevo:
   - Esperado: `MEDIUM` + `REQUIRE_OTP`.
2. PIN fallido 5 veces (terminal):
   - Esperado: bloqueo 15 min (`IAM-002`) + audit.
3. Acción critica (`ACTION_CRITICAL`, `HIGH`):
   - Esperado: no pasa sin step-up MFA.
4. Revisar `audit_logs`:
   - Debe incluir actor, tenant, timestamp UTC, resultado y payload.
5. Revisar RLS:
   - Sin acceso cross-tenant en consultas cliente.
6. UI errores:
   - Mensajes humanos basados en `IAM/SUB/TEN/PAY/FIN`.