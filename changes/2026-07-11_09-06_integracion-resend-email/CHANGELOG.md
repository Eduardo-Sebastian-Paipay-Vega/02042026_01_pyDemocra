# Changelog — Integración oficial de Resend como módulo de email

**Fecha y hora:** 2026-07-11, 09:06

## Objetivo del cambio

Reemplazar el envío de correo ad-hoc (`server/services/otp-mailer.js`, `fetch` directo a la API REST de Resend, HTML embebido en el mismo archivo, solo soportaba OTP) por un módulo de email completo, modular y tipado en TypeScript (`server/services/email/`), usando el SDK oficial de Resend, con plantillas separadas, reintentos, logging estructurado, validación y una API extensible para nuevos tipos de correo (verificación, bienvenida, reset de contraseña, invitaciones, alertas, notificaciones, auditoría) sin tener que modificar la arquitectura existente.

## Contexto del problema

El proyecto ya usaba Resend, pero de forma mínima: `otp-mailer.js` hacía un `fetch` manual a `api.resend.com/emails`, con el HTML del correo hardcodeado en el mismo archivo, sin reintentos, sin logging estructurado, sin tipos, y sin ninguna forma reutilizable de enviar otro tipo de correo (bienvenida, reset de password, alertas, etc.) sin duplicar toda la lógica de fetch/auth/parseo de respuesta.

## Motivo de la modificación

Pedido explícito del usuario: integración "completamente profesional, modular, segura, reutilizable y preparada para producción" del SDK oficial de Resend, siguiendo SOLID, con soporte para OTP, verificación, recuperación de contraseña, invitaciones, confirmación de registro, alertas, notificaciones, correos transaccionales/administrativos/de auditoría, y capacidad de agregar nuevos tipos sin tocar la arquitectura existente.

## Solución implementada

### Módulo nuevo: `server/services/email/`

- **`config/email.config.ts`**: lee y valida `RESEND_API_KEY` de forma perezosa (el servidor arranca igual sin ella; solo lanza al intentar enviar un correo). Resto de variables (remitente, app URL/logo, reintentos) con defaults razonables, cayendo a `OTP_FROM_NAME`/`OTP_FROM_EMAIL` si existen (compatibilidad con instalaciones existentes).
- **`resend.client.ts`**: cliente `Resend` singleton, instanciado de forma perezosa una única vez.
- **`types.ts`** / **`interfaces.ts`**: tipos para cada tipo de correo (`OTPEmailData`, `WelcomeEmailData`, `ResetPasswordEmailData`, `VerificationEmailData`, `InvitationEmailData`, `AlertEmailData`, `NotificationEmailData`, `AuditEmailData`) y abstracciones `IEmailProvider`/`IEmailLogger` (Dependency Inversion — permiten inyectar un provider/logger fake en tests o cambiar de proveedor sin tocar `EmailService`).
- **`utils.ts`**: validación (`validateEmailOptions`, `isValidEmail`), distinción de errores transitorios vs. permanentes (`isRetryableError`), reintento con backoff exponencial (`withRetry`), escape de HTML, logger de consola estructurado por defecto.
- **`templates/`**: `layout.ts` (shell HTML compartido — tablas + estilos inline, responsive, compatible Gmail/Outlook, tema claro para evitar problemas de dark-mode automático) + 8 plantillas (`otp`, `welcome`, `resetPassword`, `verification`, `notification`, `alert`, `invitation`, `audit`), cada una devolviendo `{ subject, html, text }`.
- **`email.service.ts`**: clase `EmailService` con un método `dispatch()` privado común (valida → delega en el provider → loggea) del que cuelgan `sendOTP`, `sendVerification`, `sendResetPassword`, `sendWelcome`, `sendInvitation`, `sendAlert`, `sendNotification`, `sendAudit`, `sendCustomEmail`. `ResendEmailProvider` (implementa `IEmailProvider`) normaliza tanto errores de la API de Resend como errores de red a un único shape (`EmailErrorInfo`: `name`, `message`, `status`, `stack`, `response`). Constructor acepta `provider`/`logger` inyectados (DI) — el resto del backend usa la instancia exportada `emailService`.
- **`index.ts`**: barrel — único punto de import para el resto del backend.
- **`README.md`**: instalación, configuración, creación/verificación de dominio en Resend, cómo enviar, cómo agregar un tipo de correo nuevo, cómo cambiar remitente, manejo de errores/reintentos/logging, pruebas, despliegue, y el análisis Supabase Auth vs. Resend directo (Opción A vs. B) con recomendación para producción.

### Refactor de `server/services/otp-mailer.js`

Pasa a ser un adaptador delgado sobre `emailService.sendOTP()`, manteniendo exactamente el contrato histórico (`sendStepUpOtp({ toEmail, otpCode, ttlMinutes }) -> { ok, provider, reason?, status?, detail?, messageId? }`) del que depende `server/security/risk-engine.js` (que lo llama sin try/catch). Se preservó el gating por `OTP_EMAIL_PROVIDER` y se agregó manejo explícito para que un fallo de configuración (`RESEND_API_KEY` ausente) degrade a `provider_not_configured` en vez de propagar una excepción — antes, un error de red sí se propagaba sin capturar (comportamiento inconsistente); ahora todo fallo del proveedor es capturado por `EmailService` y siempre se degrada con gracia. Es una mejora de robustez, no una regresión: el único punto de llamada real (`risk-engine.js`) no tiene try/catch propio.

### Limpieza de configuración muerta

`server/config.js`: se eliminaron `otpResendApiKey` y `otpResendApiUrl` — quedaron sin ningún uso tras el refactor (verificado con grep en todo el repo antes de borrar). `.env.example`: se quitó `OTP_RESEND_API_URL` (ya no se lee en ningún lado) y se agregó la sección de variables opcionales del nuevo módulo.

### Tooling: TypeScript real en `server/`

Se verificó que Node 24.x/26.x (versión usada en Vercel y localmente) ejecuta `.ts` nativamente vía type-stripping, sin build step — por eso el módulo se escribió en TypeScript real, no JS con JSDoc. Cambios de tooling:
- `server/tsconfig.json` (nuevo) + script `typecheck:server` en `package.json`.
- `babel.config.cjs`: se agregó `@babel/preset-typescript` para que Jest (que usa babel-jest, no el loader nativo de Node) pueda transformar los `.ts` del módulo.
- `jest.config.js`: `collectCoverageFrom` ahora incluye `server/**/*.ts`.
- Nuevas devDependencies: `@babel/preset-typescript`, `@types/node`, `@types/jest`. Nueva dependency: `resend`.

## Riesgos identificados

- Depender de type-stripping nativo de Node (sin build step) es una técnica relativamente reciente (estable desde Node 23.6). Mitigado: verificado explícitamente contra la versión de Node usada en este proyecto (24.x en Vercel, 26.x local) antes de adoptarlo, y documentado en el README del módulo.
- El cambio de comportamiento en `otp-mailer.js` ante errores de red (antes: propagaba la excepción; ahora: degrada a `provider_not_configured`/`provider_error` con gracia) es una mejora deliberada de robustez, documentada explícitamente por si algún día se busca ese comportamiento anterior.

## Impacto esperado

- Cualquier flujo del backend puede enviar cualquiera de los 8 tipos de correo con una llamada de una línea (`emailService.sendX(...)`), con logging/reintentos/validación uniformes.
- El flujo de OTP existente sigue funcionando exactamente igual desde la perspectiva de `risk-engine.js`, ahora corriendo sobre el SDK oficial en vez de `fetch` manual.
- Nuevos tipos de correo se agregan sin tocar `EmailService` (Open/Closed) — ver README, sección "Cómo crear un nuevo tipo de correo".

## Módulos afectados

- `server/services/email/` (nuevo, completo).
- `server/services/otp-mailer.js` y su test.
- `server/config.js`, `.env.example`.
- Tooling: `package.json`, `babel.config.cjs`, `jest.config.js`, `server/tsconfig.json` (nuevo).

## Dependencias involucradas

- Nueva: `resend` (dependencia de producción).
- Nuevas devDependencies: `@babel/preset-typescript`, `@types/node`, `@types/jest`.

## Posibles efectos secundarios

Ninguno esperado en runtime de producción — el flujo de OTP existente mantiene su contrato exacto para su único llamador real. Verificado con Jest (backend, incluye el módulo nuevo), Vitest (frontend, sin cambios), `vite build` y `tsc --noEmit` sobre `server/`.

## Estado del cambio

**Completado.** Jest: 16/16 suites, 334/334 tests (280 previos + 54 nuevos). Vitest: 79/79 archivos, 268/268 tests (sin cambios). `vite build`: exitoso. `npm run typecheck:server`: sin errores.
