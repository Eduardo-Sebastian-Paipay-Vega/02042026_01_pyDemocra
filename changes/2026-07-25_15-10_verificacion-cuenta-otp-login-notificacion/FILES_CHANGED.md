# Archivos modificados

## Creados

- `supabase/migrations/20260725150000_profile_email_verification.sql` — columnas nuevas en `profiles` + backfill. Aplicada al proyecto remoto `PT_solaris`.
- `ong/src/app/lib/deviceFingerprint.ts` — genera/persiste un UUID por navegador en `localStorage`, usado como `device_fingerprint` en `/api/auth/risk-evaluate`.
- `changes/2026-07-25_15-10_verificacion-cuenta-otp-login-notificacion/` — esta carpeta de auditoría.

## Modificados

- `server/supabase.js` — `resolveAuthContext` agrega `email_verified` al `select` del profile.
- `server/routes/onboarding.js` — nueva función `issueVerificationEmail` (genera token, guarda hash+expiry, envía correo); llamada al final de `POST /bootstrap-tenant`; dos rutas nuevas: `GET /verify-email` (pública) y `POST /resend-verification-email` (autenticada).
- `server/routes/auth.js` — import de `emailService`; en `POST /step-up/verify-otp`, tras crear la sesión de un login verificado por OTP, dispara `emailService.sendAlert(...)` (fire-and-forget) notificando el nuevo inicio de sesión.
- `ong/src/app/pages/Login.tsx` — nuevo flujo tras `signInWithPassword`: llama a `/api/auth/risk-evaluate`; agrega estado `pendingStepUp` y una pantalla de ingreso/reenvío de OTP; en caso de `TEMP_BLOCK`/`DENY` hace `signOut()` explícito antes de mostrar el error.
- `ong/src/app/tenant/bootstrap.ts` — nuevo valor `"email_unverified"` en `TenantBootstrapStatus`; el `select` de profile agrega `email_verified`; se retorna el nuevo estado antes de resolver el tenant si la cuenta no está verificada.
- `ong/src/app/tenant/screens.tsx` — copy para `email_unverified` en `resolveStatusCopy`; nuevo componente interno `ResendVerificationEmailAction` (botón autocontenido, sin tocar `routes.tsx`) que se muestra automáticamente en `TenantStatusScreen` para ese estado.
- `ong/src/lib/db/ong/app-database.ts` — `PublicProfileRow` agrega `email_verified`, `verify_token_hash`, `verify_token_expires_at`.

## No modificados (a propósito)

- `server/security/risk-engine.js` — el motor de riesgo/OTP ya existía y funcionaba correctamente; solo estaba desconectado del frontend. No se le agregó lógica de `email_verified` para no duplicar el mecanismo de gating que ya vive en `bootstrap.ts`.
- `ong/src/app/routes.tsx` — no requirió cambios: el fallback genérico (`!context || status !== "ready"` → `TenantStatusScreen`) ya cubre el nuevo estado `email_unverified` sin código adicional.
- `src/modules/ong/` (duplicado documentado de `ong/src/`) — fuera de alcance, no es la copia activa.
