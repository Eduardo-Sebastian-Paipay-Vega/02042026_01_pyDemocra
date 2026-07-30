# CHANGELOG — Blueprint v2.0 Onboarding & Tenant Owner Bootstrap

- **Fecha/Hora:** 2026-07-29 20:45:00 -05:00
- **Objetivo:** Adoptar e integrar el Blueprint de Arquitectura v2.0 para el flujo de Onboarding y Creacion de Cuenta Dueno (Tenant Owner) en Supabase.
- **Contexto:** Se requiere ampliar los parametros de creacion de tenant (Razon Social, RUC, Trade Name, Direccion, Documento de Identidad del representante, Telefono, Fingerprint de seguridad) garantizando atomicidad mediante `fn_bootstrap_tenant_v2` e integrando verificacion transaccional via Resend API.
- **Motivo de la Modificacion:** Garantizar la maxima integridad en la creacion de cuentas institucionales sin datos mock, respetando las reglas de ciberseguridad, RLS y auditoria.
- **Solucion Implementada:**
  1. Creacion del script de migracion SQL `supabase/migrations/20260302130000_fn_bootstrap_tenant_v2.sql` con la funcion almacenada PL/pgSQL `public.fn_bootstrap_tenant_v2`.
  2. Actualizacion del endpoint `/api/onboarding/bootstrap-tenant` en `server/routes/onboarding.js` para procesar los parametros extendidos de v2.0 con mecanismo de fallback transparente.
  3. Pruebas y validaciones de compilacion y ejecucion sin errores.
- **Riesgos Identificados:** Ninguno. Se mantiene compatibilidad retroactiva con `fn_bootstrap_tenant`.
- **Estado:** Completado.
