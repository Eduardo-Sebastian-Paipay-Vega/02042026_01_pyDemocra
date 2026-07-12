# CHANGELOG — Incidente de producción: módulo de email en TypeScript rompía toda la API

**Fecha:** 2026-07-11
**Hora:** 20:15 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Corregir una caída total de la API en producción (`https://www.democra.pro/api/*` devolviendo 500 en absolutamente todos los endpoints) causada por el commit `2fe316e` (integración del módulo de email con Resend), y convertir `server/services/email/` de TypeScript a JavaScript plano para que sea ejecutable por el runtime de Vercel.

## Contexto del problema — cronología del incidente

1. Se hizo push de 3 commits a `origin/main` (hardening de dependencias, validación de Storage, e integración de Resend — este último ya estaba preparado y probado por una sesión anterior, con su propia auditoría en `changes/2026-07-11_09-06_integracion-resend-email/`).
2. Se ejecutó `vercel --prod`. El deploy terminó "Ready" y quedó aliaseado a `https://www.democra.pro`.
3. Un smoke-test post-deploy a `/api/health` devolvió **500 FUNCTION_INVOCATION_FAILED**. Se confirmó que **todos** los endpoints de la API fallaban igual (`/api/auth/risk-evaluate` también 500), no solo los relacionados a email.
4. `vercel logs` mostró la causa raíz: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/services/email/index.ts' imported from /var/task/server/services/otp-mailer.js`.
5. Se hizo **rollback inmediato** (`vercel rollback https://02042026-01-py-democra-7ciretqwf.vercel.app`) para restaurar el servicio — confirmado sano (`/api/health` → 200) en segundos.
6. Se diagnosticó y corrigió la causa raíz (este cambio), verificado exhaustivamente, y recién entonces se volvió a desplegar.

## Motivo del fallo (causa raíz)

Este proyecto **no tiene ningún paso de build/transpilación para el backend**: `vercel.json` apunta directo a `api/server.js`, que importa `server/index.js` y de ahí toda la app Express, tal cual están los archivos en el repo — Node.js nativo los ejecuta sin pasar por Babel, tsc, esbuild ni nada equivalente. `npm run build` solo compila el frontend (`vite build`).

`server/services/otp-mailer.js` (plano `.js`) hacía `import { emailService } from "./email/index.ts"` — un import con extensión `.ts` literal. Localmente esto pasaba desapercibido porque **Jest sí transpila** vía `babel-jest` + `@babel/preset-typescript` (configurado en `babel.config.cjs`), así que los 334 tests pasaban en verde sin que nadie notara que el código nunca se había ejecutado bajo Node puro. El runtime serverless de Vercel, en cambio, ejecuta el JavaScript exactamente como está en el repo — sin ningún loader capaz de resolver una extensión `.ts`, la resolución de módulos de Node falla en el arranque mismo de la función, antes de poder atender ninguna ruta. Por eso el 500 no era solo en endpoints de email: el `import` estático rompe la carga de **todo** el árbol de módulos de la función serverless.

## Solución implementada

1. **Conversión completa de `server/services/email/**/*.ts` (no-test) a `.js` plano**, eliminando toda sintaxis exclusiva de TypeScript (interfaces, `import type`, anotaciones de tipo, `as Type`) mientras se preservó la lógica exacta:
   - `config/email.config.ts` → `.js`
   - `resend.client.ts` → `.js`
   - `utils.ts` → `.js`
   - `email.service.ts` → `.js`
   - `index.ts` → `.js`
   - `templates/{layout,otp,alert,audit,invitation,notification,resetPassword,verification,welcome}.ts` → `.js` (9 archivos)
   - **`types.ts` e `interfaces.ts` se eliminaron sin reemplazo**: ambos eran 100% declaraciones de tipo (`interface`/`type`) sin ninguna exportación en tiempo de ejecución — todo lo que los importaba lo hacía vía `import type` (borrado por el compilador, cero huella en runtime), así que no hay equivalente `.js` que crear.
2. **`server/services/otp-mailer.js`**: el import pasa de `"./email/index.ts"` a `"./email/index.js"`.
3. **`server/services/otp-mailer.test.js`**: el `jest.mock("./email/index.ts", ...)` se actualizó al mismo path `.js`.
4. **Tests del propio módulo** (`email.config.test.ts`, `email.service.test.ts`, `utils.test.ts` — se mantienen como `.test.ts` porque Jest los transpila localmente y nunca se despliegan): se actualizaron los imports a `.js` y se removieron las referencias a los tipos eliminados (`EmailOptions`, `EmailSendResult`, `IEmailProvider`, `IEmailLogger`, `ILogEntry`), sin cambiar ninguna aserción ni comportamiento de los tests.
5. **`server/services/email/README.md`**: se corrigieron los ejemplos y links que apuntaban a rutas `.ts` inexistentes.
6. **Verificación exhaustiva antes de redesplegar** (para no repetir el incidente):
   - `node -e "import('./server/services/otp-mailer.js')"` bajo Node puro (sin Babel) — replica exactamente el modo de fallo de Vercel. Antes del fix: falla con `ERR_MODULE_NOT_FOUND`. Después: carga limpio.
   - `node -e "import('./server/index.js')"` bajo Node puro — toda la cadena de arranque del servidor (rutas, middlewares, seguridad) carga sin error.
   - `npm test`: 334/334 tests backend en verde.
   - `npx tsc --noEmit -p server/tsconfig.json`: sin errores.
   - `npm run build`: compila ambas apps sin errores.
   - Redeploy a producción (`vercel --prod`) + smoke test real: `/api/health` → 200, `/api/auth/risk-evaluate` → responde (ya no 500), `/` y `/ong` → 200.

## Riesgos identificados

- **Este incidente ocurrió porque nadie verificó el código bajo el runtime real de Node antes de desplegar** — los tests con Babel dan una falsa sensación de seguridad cuando el proyecto no tiene build step. Recomendación para el futuro: cualquier código nuevo en `server/` debe evitar TypeScript a menos que se agregue un paso de build real (`tsc`/`esbuild`) wireado en `vercel.json`/`package.json`, o debe verificarse explícitamente con un `node -e "import(...)"` sin Babel antes de cada deploy que toque `server/`.
- El tiempo de exposición del incidente en producción fue de aproximadamente 3-4 minutos (desde el deploy hasta el rollback confirmado sano) — corto, pero real: durante esa ventana ningún endpoint de la API respondía (login, IAM, sedes, onboarding, auditoría — todos caídos).

## Impacto esperado

Ninguno en comportamiento — mismo output exacto de `EmailService` y sus templates, ahora en JS plano. `server/services/email/` funciona de forma idéntica, pero ejecutable directamente por el runtime de Vercel.

## Módulos afectados

- `server/services/email/**` (conversión completa, ver arriba).
- `server/services/otp-mailer.js`, `server/services/otp-mailer.test.js` (fix de import).
- `server/services/email/README.md` (correcciones de referencias).

## Dependencias involucradas

Ninguna nueva.

## Posibles efectos secundarios

Ninguno esperado — el módulo se comporta igual, solo cambia la extensión de archivo y la ausencia de chequeo de tipos en tiempo de compilación para este módulo específico (los tests siguen en `.test.ts` y Jest los sigue ejecutando igual).

## Cómo revertir

`git revert` de este commit. Nota: revertir *sin* también revertir o corregir el commit `2fe316e` reintroduciría el bug de producción — si se revierte, hacerlo junto con un rollback de Vercel a un deploy anterior a `2fe316e`.
