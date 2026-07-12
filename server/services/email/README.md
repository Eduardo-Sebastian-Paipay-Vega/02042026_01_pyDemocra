# Módulo de Email (Resend)

Integración oficial de [Resend](https://resend.com) como proveedor de correo del backend. Arquitectura modular, tipada (TypeScript), con reintentos, logging estructurado y plantillas HTML separadas del código de envío.

## Índice

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Crear y verificar un dominio en Resend](#crear-y-verificar-un-dominio-en-resend)
- [Cómo enviar un correo](#cómo-enviar-un-correo)
- [Tipos de correo disponibles](#tipos-de-correo-disponibles)
- [Cómo crear un nuevo tipo de correo](#cómo-crear-un-nuevo-tipo-de-correo)
- [Cómo cambiar el remitente](#cómo-cambiar-el-remitente)
- [Manejo de errores, reintentos y logging](#manejo-de-errores-reintentos-y-logging)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Supabase Auth vs. envío directo con Resend](#supabase-auth-vs-envío-directo-con-resend)
- [Seguridad](#seguridad)

## Instalación

Ya forma parte de las dependencias de la raíz del repo (ver `SETUP.md` para el flujo completo de instalación del proyecto):

```bash
npm install
```

Si necesitas instalarlo desde cero en otro proyecto: `npm install resend`.

## Configuración

Variable obligatoria en `.env` (raíz del repo):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

Consíguela en [resend.com/api-keys](https://resend.com/api-keys). Si falta o está vacía, cualquier intento de enviar un correo lanza un error descriptivo (`[email.config] Falta la variable de entorno RESEND_API_KEY...`) — la validación es **perezosa**: el servidor arranca igual sin ella, solo falla al intentar enviar.

Variables opcionales (todas tienen default razonable):

| Variable | Default | Uso |
|---|---|---|
| `EMAIL_FROM_NAME` | `OTP_FROM_NAME` o `"Democra"` | Nombre del remitente |
| `EMAIL_FROM_ADDRESS` | `OTP_FROM_EMAIL` o `"no-reply@democra.pro"` | Correo del remitente — debe pertenecer a un dominio verificado en Resend |
| `EMAIL_REPLY_TO` | *(ninguno)* | `Reply-To` opcional |
| `APP_NAME` | `"Democra"` | Nombre usado en asuntos y pie de página |
| `APP_URL` | `"https://www.democra.pro"` | Usado para el logo y enlaces del pie |
| `APP_LOGO_URL` | `${APP_URL}/brand/d-core-monogram.png` | Logo del encabezado |
| `EMAIL_MAX_RETRIES` | `3` | Reintentos ante error transitorio (429/5xx/red) |
| `EMAIL_RETRY_BASE_DELAY_MS` | `300` | Base del backoff exponencial (300ms, 600ms, 1200ms...) |
| `MFA_OTP_TTL_MINUTES` | `10` | TTL default mostrado en el correo de OTP si no se pasa explícito |

> `EMAIL_FROM_NAME`/`EMAIL_FROM_ADDRESS` caen de vuelta a `OTP_FROM_NAME`/`OTP_FROM_EMAIL` (las variables que ya usaba `server/services/otp-mailer.js`) para que una instalación existente no necesite tocar su `.env`.

## Crear y verificar un dominio en Resend

1. En el [dashboard de Resend](https://resend.com/domains) → **Add Domain**, ingresa tu dominio (ej. `democra.pro`).
2. Resend te da registros DNS (SPF, DKIM, y opcionalmente DMARC) — agrégalos en tu proveedor de DNS.
3. Espera la verificación (minutos a horas según el proveedor de DNS). El estado pasa de `Pending` a `Verified` en el dashboard.
4. Una vez verificado, `EMAIL_FROM_ADDRESS` debe usar ese dominio (ej. `no-reply@democra.pro`). Enviar desde un dominio no verificado falla o cae en spam.
5. Para desarrollo/pruebas sin dominio propio, Resend ofrece `onboarding@resend.dev` como remitente de prueba (límites de sandbox, no usar en producción).

## Cómo enviar un correo

```js
import { emailService } from "../services/email/index.js";

const result = await emailService.sendOTP({
  to: "usuario@empresa.com",
  code: "482913",
  ttlMinutes: 10,
  name: "Ana",
});

if (!result.ok) {
  // result.error: { name, message, status?, stack?, response? }
  console.error("No se pudo enviar el OTP:", result.error.message);
}
```

Todos los métodos devuelven `EmailSendResult` (nunca lanzan por un fallo del proveedor — sí pueden lanzar si `RESEND_API_KEY` falta, ver arriba):

```ts
type EmailSendResult =
  | { ok: true; id: string; provider: "resend"; durationMs: number; attempts: number }
  | { ok: false; provider: "resend"; durationMs: number; attempts: number; error: EmailErrorInfo };
```

## Tipos de correo disponibles

| Método | Caso de uso |
|---|---|
| `sendOTP(data)` | Código de un solo uso (login, step-up MFA) |
| `sendVerification(data)` | Verificación de dirección de correo |
| `sendResetPassword(data)` | Recuperación de contraseña |
| `sendWelcome(data)` | Confirmación de registro / bienvenida |
| `sendInvitation(data)` | Invitar a un usuario a una organización |
| `sendAlert(data)` | Alertas del sistema (`severity: "info" \| "warning" \| "critical"`) |
| `sendNotification(data)` | Notificaciones automáticas / transaccionales genéricas |
| `sendAudit(data)` | Correos administrativos / de auditoría / confirmación de operaciones |
| `sendCustomEmail(options)` | Cualquier otro caso — recibe `EmailOptions` crudo (`to`, `subject`, `html`, `text?`, ...) |

Los tipos de dato de cada `data` (`OTPEmailData`, `WelcomeEmailData`, etc.) están documentados como JSDoc/comentarios en cada función `render*Email` de `templates/`.

### Ejemplos

```js
// Bienvenida
await emailService.sendWelcome({ to: "nueva@empresa.com", name: "Carlos", loginUrl: "https://www.democra.pro/login" });

// Recuperación de contraseña
await emailService.sendResetPassword({
  to: "usuario@empresa.com",
  resetUrl: "https://www.democra.pro/reset?token=...",
  expiresInMinutes: 30,
});

// Alerta crítica del sistema
await emailService.sendAlert({
  to: ["admin1@empresa.com", "admin2@empresa.com"],
  title: "Fallo de sincronización con Supabase",
  message: "El job de auditoría nocturno falló 3 veces seguidas.",
  severity: "critical",
  detailsUrl: "https://www.democra.pro/admin/logs",
});

// Correo personalizado (sendCustomEmail)
await emailService.sendCustomEmail({
  to: "finanzas@empresa.com",
  subject: "Reporte mensual generado",
  html: "<p>El reporte de julio ya está disponible.</p>",
  tags: { category: "reporte" },
});
```

## Cómo crear un nuevo tipo de correo

La arquitectura está pensada para extenderse **sin modificar `EmailService`** (Open/Closed):

1. Define el shape de datos esperado (ej. `InvoiceEmailData: { to, invoiceUrl, amount, ... }`) como convención documentada — el módulo es JS puro, sin chequeo de tipos en runtime.
2. Crea `templates/invoice.js` con una función `renderInvoiceEmail(data)` que arme `{ subject, html, text }` usando `renderLayout`/`renderButton` de [`templates/layout.js`](./templates/layout.js) para mantener el mismo look & feel.
3. (Opcional) Agrega un método de una línea en `EmailService`:
   ```js
   sendInvoice(data) {
     const { subject, html, text } = renderInvoiceEmail(data);
     return this.dispatch("invoice", { to: data.to, subject, html, text, tags: { category: "invoice" } });
   }
   ```
   Si es un caso puntual, ni siquiera hace falta el método: usa `sendCustomEmail` directamente.
4. Expórtalo desde [`index.js`](./index.js) si otros módulos van a usarlo por nombre.

## Cómo cambiar el remitente

Cambia `EMAIL_FROM_NAME`/`EMAIL_FROM_ADDRESS` en `.env` — no hay ningún remitente hardcodeado en el código. Para un remitente distinto por tipo de correo puntual (ej. `facturacion@democra.pro` solo para `sendInvoice`), pasa `from` como parte de un `EmailOptions` extendido vía `sendCustomEmail`, o añade el campo al template correspondiente.

## Manejo de errores, reintentos y logging

- **Errores de la API de Resend** (`{ error }` en la respuesta) y **errores de red** (`fetch` fallido) se capturan y normalizan a un mismo shape (`EmailErrorInfo`: `name`, `message`, `status`, `stack`, `response`) — nunca quedan silenciosos.
- **Reintentos**: solo ante errores transitorios (`429`, `500`, `502`, `503`, `504`, o fallos de red) — ver `isRetryableError` en [`utils.js`](./utils.js). Errores permanentes (API key inválida, dominio no verificado, destinatario rechazado, payload inválido) fallan de inmediato, sin reintentar. Backoff exponencial: `EMAIL_RETRY_BASE_DELAY_MS * 2^intento`.
- **Validación previa** (`validateEmailOptions`): destinatarios con formato de correo inválido, asunto vacío o HTML vacío se rechazan **antes** de tocar la red (no consumen cuota de Resend ni cuentan como intento).
- **Logging**: cada envío (exitoso o no) genera una línea JSON estructurada (`console.log`/`console.error`) con `type`, `recipient`, `ok`, `durationMs`, `attempts`, `messageId` (si tuvo éxito) o `errorMessage`. Para enviar esto a un logger real (Winston, Pino, Datadog), inyecta un `IEmailLogger` propio:
  ```js
  import { EmailService } from "../services/email/email.service.js";
  const emailService = new EmailService(undefined, miLoggerPersonalizado);
  ```

## Pruebas

```bash
npm test -- server/services/email          # Jest, solo este módulo
npm test                                    # Jest completo (backend)
```

Los tests inyectan un `IEmailProvider` fake (no llaman a la API real de Resend) — ver `email.service.test.ts`. Para probar contra la API real de Resend en desarrollo, usa el dominio de sandbox `onboarding@resend.dev` como `EMAIL_FROM_ADDRESS` y envía a tu propio correo.

## Despliegue

No requiere pasos extra: es TypeScript ejecutado nativamente por Node (sin build step — Node 20.6+ soporta *type stripping* de forma nativa; Vercel usa Node 24.x en este proyecto). Solo asegúrate de que `RESEND_API_KEY` (y opcionalmente las demás variables de esta tabla) estén configuradas en el entorno de destino (Vercel → Project Settings → Environment Variables).

## Supabase Auth vs. envío directo con Resend

El proyecto usa **Supabase Auth** para credenciales (`supabase.auth.signInWithPassword`, `signUp`) pero **no** usa el OTP/magic-link nativo de Supabase — el step-up MFA (`server/security/risk-engine.js`, tabla `mfa_challenges`) es un motor propio que genera y valida sus propios códigos. Dos opciones para el envío de correo:

### Opción A — Resend como proveedor SMTP de Supabase

Configurar Resend en Supabase Dashboard → Authentication → SMTP Settings, para que Supabase envíe sus propios correos (confirmación de signup, magic link, recuperación de password *nativa* de Supabase) a través de Resend.

**Ventajas**: cero código — Supabase arma y envía esos correos automáticamente. Cubre los flujos que ya vienen integrados con `supabase.auth` (`signUp`, `resetPasswordForEmail`).

**Desventajas**: las plantillas se editan en el dashboard de Supabase (HTML limitado, sin el sistema de templates de este módulo), no pasan por este `EmailService` (sin logging/reintentos/tags propios), y no sirven para nada que no sea el flujo nativo de Supabase Auth — el OTP de step-up de este proyecto, por ejemplo, **nunca podría usar esta vía**, porque no lo genera Supabase.

### Opción B — Enviar todo desde el backend con este módulo (recomendada, y ya el patrón vigente)

Todo correo —incluidos los que en otro proyecto usarían el flujo nativo de Supabase— se dispara explícitamente desde `server/` (o desde una Edge Function) llamando a `emailService`.

**Ventajas**: una sola plantilla visual para todos los correos (branding consistente), logging/retry/validación centralizados, control total del contenido y del momento de envío, y es el único camino posible para los correos que no dependen de Supabase Auth (OTP propio, alertas, auditoría, invitaciones). Consistente con lo que el proyecto ya hace hoy para el OTP de step-up.

**Desventajas**: hay que disparar explícitamente el envío en cada flujo (ej. después de un `supabase.auth.signUp` exitoso, llamar a `emailService.sendWelcome(...)` o `sendVerification(...)` a mano) — más código que "configurar y olvidar".

### Recomendación para producción

**Opción B para todo.** El proyecto ya migró su MFA a un motor propio que no puede usar Supabase SMTP de todas formas, así que mantener *dos* sistemas de correo (Supabase para signup, Resend directo para todo lo demás) fragmentaría el branding, el logging y el manejo de errores sin necesidad real. Si `supabase.auth.signUp` sigue enviando su correo de confirmación nativo, la opción más limpia es **desactivar la confirmación automática de Supabase** (Authentication → Providers → Email → "Confirm email" OFF, o gestionar la confirmación con el flujo propio de la app) y reemplazarla por `emailService.sendVerification(...)` explícito — así el 100% de los correos transaccionales pasan por el mismo módulo, con el mismo look & feel y el mismo logging.

## Seguridad

- `RESEND_API_KEY` se lee **únicamente** de `process.env.RESEND_API_KEY` — nunca hardcodeada, nunca impresa, nunca incluida en logs (`ILogEntry` no tiene ningún campo que la exponga).
- `.env` está en `.gitignore` — la key real nunca llega al repositorio.
- Los templates escapan HTML de todo valor dinámico (`escapeHtml` en `utils.js`) antes de interpolarlo, para evitar inyección si un nombre/mensaje viene de input de usuario.
