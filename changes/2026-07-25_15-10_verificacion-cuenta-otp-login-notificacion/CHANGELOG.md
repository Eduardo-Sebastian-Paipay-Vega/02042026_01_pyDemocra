# Verificación de cuenta por correo + conexión real del OTP de login + notificación de nuevo inicio de sesión

**Fecha:** 2026-07-25 15:10
**Autor:** Claude Code

## Objetivo del cambio

Cerrar tres huecos funcionales detectados durante la revisión del flujo de autenticación:

1. No existía verificación de cuenta por correo tras el registro.
2. El motor de OTP de login por dispositivo/IP nuevo (`server/security/risk-engine.js`) estaba completamente implementado en el backend pero **nunca se llamaba desde el login real** (`ong/src/app/pages/Login.tsx` solo hacía `supabase.auth.signInWithPassword`, sin pasar por `/api/auth/risk-evaluate`).
3. No existía notificación de "nuevo inicio de sesión" al usuario.

## Contexto del problema

El pedido original era "probar el reenvío" y luego "agregar verificación de cuenta y notificación de login". Al investigar se encontró que la pieza más importante del pedido no era agregar algo nuevo, sino **conectar un sistema que ya existía pero estaba desconectado**: `evaluateRiskEngine` calcula correctamente cuándo un login viene de un dispositivo/IP no reconocidos y genera un desafío OTP, pero como el frontend nunca invoca ese endpoint, cualquier login con `supabase.auth.signInWithPassword` entra directo a la app sin ninguna validación de riesgo ni notificación.

## Motivo de la modificación

- Seguridad: un login desde un dispositivo nuevo debía exigir un segundo factor (OTP) y avisar al dueño de la cuenta.
- Onboarding: cuentas recién creadas deben confirmarse por correo antes de poder usar la aplicación.

## Solución implementada

### Base de datos
- Migración `supabase/migrations/20260725150000_profile_email_verification.sql`: agrega `profiles.email_verified` (default `false`), `verify_token_hash`, `verify_token_expires_at`. Incluye backfill (`email_verified = true`) para las 21 cuentas ya existentes en `PT_solaris`, de modo que ninguna cuenta previa quedó bloqueada retroactivamente. **Aplicada al proyecto remoto `PT_solaris` (qafvnjoqvdtnrdvlnwco) vía Supabase MCP.**

### Backend
- `server/supabase.js`: `resolveAuthContext` ahora también selecciona `email_verified` del profile.
- `server/routes/onboarding.js`:
  - Tras `fn_bootstrap_tenant` (creación de cuenta), genera un token de verificación (hash SHA-256 guardado en `profiles`, válido 24h) y envía el correo con `emailService.sendVerification(...)` (plantilla ya existente, nunca usada antes).
  - Nueva ruta pública `GET /api/onboarding/verify-email?uid=&token=`: valida el token, marca `email_verified = true` y redirige a `/login?verified=1` (o `?verified=0` si es inválido/expiró).
  - Nueva ruta autenticada `POST /api/onboarding/resend-verification-email`: reenvía el correo (mismo patrón que `resendOtpChallenge`).
- `server/routes/auth.js`: en `POST /step-up/verify-otp`, tras crear la sesión para un login `LOGIN_WEB`/`LOGIN_TERMINAL` verificado por OTP, dispara (sin bloquear la respuesta) `emailService.sendAlert(...)` con los datos del nuevo inicio de sesión (fecha, IP, navegador).

### Frontend
- `ong/src/app/lib/deviceFingerprint.ts` (nuevo): genera y persiste en `localStorage` un UUID por navegador, usado como `device_fingerprint`.
- `ong/src/app/pages/Login.tsx`: tras un `signInWithPassword` exitoso, llama a `POST /api/auth/risk-evaluate`. Si la decisión es `REQUIRE_OTP`, muestra una pantalla de código OTP (con reenvío) y bloquea la redirección automática hasta verificarlo (`POST /api/auth/step-up/verify-otp`). Si la decisión es `TEMP_BLOCK`/`DENY`, cierra la sesión de Supabase recién creada (`signOut()`) y muestra el mensaje de error — necesario porque `signInWithPassword` ya deja una sesión válida antes de esta validación.
- `ong/src/app/tenant/bootstrap.ts`: nuevo estado `"email_unverified"` en `TenantBootstrapStatus`; se retorna antes de resolver el tenant si `profile.email_verified === false`.
- `ong/src/app/tenant/screens.tsx`: copy y botón "Reenviar correo de verificación" para el estado `email_unverified` (reutiliza la pantalla genérica `TenantStatusScreen` ya usada por el resto de estados, sin tocar `routes.tsx`).
- `ong/src/lib/db/ong/app-database.ts`: agrega los nuevos campos al tipo manual `PublicProfileRow`.

## Riesgos identificados

- El gate de cuenta no verificada y el de OTP por dispositivo nuevo son gates **a nivel de aplicación** (mismo patrón que el resto de `TenantBootstrapStatus`), no a nivel de RLS. Un cliente que hable directo con la API de Supabase sin pasar por la SPA no está bloqueado por esto — coherente con cómo ya funciona el resto de estados del bootstrap, pero es una limitación real a tener en cuenta.
- El gate de OTP se resuelve en el momento del login; no se re-valida en cada recarga de una sesión ya abierta (ver limitación documentada en el plan).
- `.env` sigue teniendo `OTP_FROM_EMAIL=security@yourdomain.com`, un dominio no verificado en Resend. Cualquier envío de OTP/verificación en producción fallará hasta que se verifique un dominio real en resend.com/domains y se actualice esa variable — **no se tocó como parte de este cambio**, es una acción pendiente del usuario en el dashboard de Resend.

## Impacto esperado

- Cuentas nuevas requieren verificar su correo antes de poder usar la app.
- Logins desde dispositivos/IPs nuevos exigen OTP real (antes no pasaba nada).
- El dueño de la cuenta recibe una alerta por correo cuando eso ocurre.

## Módulos afectados

`server/routes/auth.js`, `server/routes/onboarding.js`, `server/supabase.js`, `ong/src/app/pages/Login.tsx`, `ong/src/app/tenant/bootstrap.ts`, `ong/src/app/tenant/screens.tsx`, `ong/src/lib/db/ong/app-database.ts`, `supabase/migrations/`.

## Dependencias involucradas

`resend` (ya integrado), `@supabase/supabase-js`, motor de riesgo existente (`server/security/risk-engine.js`, sin modificar).

## Posibles efectos secundarios

Ninguno detectado sobre funcionalidad existente: se corrió `npm test` (80 tests backend, 4 suites) y `npm run test:web` (537 tests) tras el cambio, todos en verde. `npm run typecheck` no introduce errores nuevos (los preexistentes en `src/modules/ong/app/pages/Volunteers.tsx` son ajenos a este cambio).

## Estado del cambio

**Completado** — código, migración aplicada al remoto, y tests verdes. Pendiente de prueba manual end-to-end en `npm run dev` (creación de cuenta real + clic en el botón de verificación + login desde "dispositivo nuevo") antes de dar por cerrado el ciclo completo en producción.
