# FILES_CHANGED — Fix incidente de producción (módulo email TS→JS)

## Eliminados

- `server/services/email/types.ts` (100% tipos, sin huella en runtime)
- `server/services/email/interfaces.ts` (100% tipos, sin huella en runtime)
- `server/services/email/config/email.config.ts` (reemplazado por `.js`)
- `server/services/email/resend.client.ts` (reemplazado por `.js`)
- `server/services/email/utils.ts` (reemplazado por `.js`)
- `server/services/email/email.service.ts` (reemplazado por `.js`)
- `server/services/email/index.ts` (reemplazado por `.js`)
- `server/services/email/templates/{layout,otp,alert,audit,invitation,notification,resetPassword,verification,welcome}.ts` (9 archivos, reemplazados por `.js`)

## Creados

- Los mismos 14 archivos de arriba, como `.js` (lógica idéntica, sin sintaxis TypeScript).
- `changes/2026-07-11_20-15_fix-produccion-modulo-email-ts-en-runtime-js/CHANGELOG.md`
- `changes/2026-07-11_20-15_fix-produccion-modulo-email-ts-en-runtime-js/SUMMARY.md`
- `changes/2026-07-11_20-15_fix-produccion-modulo-email-ts-en-runtime-js/FILES_CHANGED.md`

## Modificados

- `server/services/otp-mailer.js` — import de `./email/index.ts` a `./email/index.js`.
- `server/services/otp-mailer.test.js` — `jest.mock` path actualizado a `.js`.
- `server/services/email/config/email.config.test.ts` — import actualizado a `.js`.
- `server/services/email/utils.test.ts` — import actualizado a `.js`, removida referencia a tipo eliminado.
- `server/services/email/email.service.test.ts` — imports actualizados a `.js`, removidas referencias a tipos eliminados (sin cambio de comportamiento de los tests).
- `server/services/email/README.md` — corregidas referencias a rutas `.ts` inexistentes.
