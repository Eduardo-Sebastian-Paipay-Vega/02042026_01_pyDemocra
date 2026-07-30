# FILES_CHANGED — Blueprint v2.0 Onboarding

- `supabase/migrations/20260302130000_fn_bootstrap_tenant_v2.sql` [NUEVO]
  Define la funcion almacenada PL/pgSQL `public.fn_bootstrap_tenant_v2` con idempotencia, RLS y soporte extendido de parametros.

- `server/routes/onboarding.js` [MODIFICADO]
  Actualiza el handler `/api/onboarding/bootstrap-tenant` para enviar los parametros extendidos a `fn_bootstrap_tenant_v2` con fallback a `fn_bootstrap_tenant`.

- `changes/2026-07-29_20-45_blueprint-onboarding-v2/` [NUEVO]
  Carpeta de auditoria obligatoria segun reglas de AGENTS.md.
