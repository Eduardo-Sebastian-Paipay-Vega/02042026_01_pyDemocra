# Archivos modificados

## Creados

**`changes/2026-07-11_09-06_integracion-resend-email/`** — esta carpeta de auditoría.

**`server/services/email/`** (módulo nuevo completo):
- `README.md` — instalación, configuración, dominio en Resend, ejemplos, cómo extender, análisis Supabase A/B, seguridad.
- `config/email.config.ts` — carga/valida `RESEND_API_KEY` y variables opcionales (lazy, cacheada).
- `config/email.config.test.ts` — tests de validación y defaults de configuración.
- `resend.client.ts` — cliente `Resend` singleton.
- `types.ts` — `EmailOptions`, `EmailSendResult`, `EmailErrorInfo`, y el payload de cada tipo de correo (`OTPEmailData`, `WelcomeEmailData`, etc.).
- `interfaces.ts` — `IEmailProvider`, `IEmailLogger` (Dependency Inversion).
- `utils.ts` — validación, `isRetryableError`, `withRetry` (backoff exponencial), `escapeHtml`, logger de consola por defecto.
- `utils.test.ts` — tests de validación, retry y utilidades.
- `templates/layout.ts` — shell HTML compartido (tablas + inline styles, Gmail/Outlook, tema claro).
- `templates/otp.ts`, `welcome.ts`, `resetPassword.ts`, `verification.ts`, `notification.ts`, `alert.ts`, `invitation.ts`, `audit.ts` — una plantilla por tipo de correo.
- `email.service.ts` — clase `EmailService` (métodos `send*` + `dispatch()` común) y `ResendEmailProvider` (adaptador Resend → `IEmailProvider`). Exporta la instancia `emailService`.
- `email.service.test.ts` — tests de `EmailService` con provider/logger inyectados (fake), cubre despacho común y cada método de conveniencia.
- `index.ts` — barrel público del módulo.

**`server/tsconfig.json`** — config de TypeScript dedicada para `server/` (Node, `NodeNext`, `strict: true`, `allowImportingTsExtensions`).

## Modificados

- **`server/services/otp-mailer.js`** — reescrito como adaptador delgado sobre `emailService.sendOTP()`. Mismo contrato público (`sendStepUpOtp`), internamente delega en el nuevo módulo; captura errores de configuración y los degrada a `provider_not_configured` en vez de propagarlos.
- **`server/services/otp-mailer.test.js`** — reescrito para mockear `emailService.sendOTP` (antes mockeaba `global.fetch`, acoplado a la implementación vieja). Mismo número de escenarios cubiertos (recipient inválido, provider no configurado, envío exitoso, error del proveedor, degradación ante config faltante) más un caso nuevo (normalización de `ttlMinutes`).
- **`server/config.js`** — se eliminaron `otpResendApiKey` y `otpResendApiUrl` (sin uso tras el refactor).
- **`.env.example`** — se quitó `OTP_RESEND_API_URL`; se agregó la sección de variables opcionales del módulo de email (`EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, `APP_NAME`, `APP_URL`, `APP_LOGO_URL`, `EMAIL_MAX_RETRIES`, `EMAIL_RETRY_BASE_DELAY_MS`).
- **`package.json`** — nueva dependency `resend`; nuevas devDependencies `@babel/preset-typescript`, `@types/node`, `@types/jest`; nuevo script `typecheck:server`.
- **`package-lock.json`** — actualizado por `npm install`.
- **`babel.config.cjs`** — agregado `@babel/preset-typescript` (Jest necesita poder parsear `.ts`; Node lo hace nativo pero Jest usa babel-jest, no el loader de Node).
- **`jest.config.js`** — `collectCoverageFrom` ahora incluye `server/**/*.ts`.

## No tocados (fuera de alcance)

- `.claude/scheduled_tasks.lock`, `.env`, `.vercel/`, `node_modules/`, `dist/`.
