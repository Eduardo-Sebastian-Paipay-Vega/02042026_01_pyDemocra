# Mini manual — Entorno de desarrollo (Democra)

Guía mínima para dejar el repo corriendo desde cero: instalación, variables de entorno, tests y despliegue con Vercel. Ver `README.md` para arquitectura funcional y `DEVELOPMENT_GUIDE.md` para la arquitectura monorepo MPA.

## 1. Requisitos

- Node.js 20+ (probado con Node 26)
- npm 10+
- Vercel CLI (`npm i -g vercel`) — necesaria para desplegar desde local
- Acceso al proyecto Supabase del repo (`PT_solaris`, ref `qafvnjoqvdtnrdvlnwco`)

## 2. Instalar dependencias

Un único `package.json` en la raíz. **Nunca** crear `node_modules` ni `package.json` dentro de `ong/` u otro submódulo (Regla de Oro #1 en `DEVELOPMENT_GUIDE.md`).

```bash
npm install
```

En este entorno (disco/antivirus lento en Windows) puede tardar varios minutos sin imprimir nada — es normal, no interrumpir. Verificar que terminó con:

```bash
npm ls --depth=0
```

## 3. Variables de entorno (`.env`)

Copiar la plantilla y completar valores reales (nunca commitear `.env`, ya está en `.gitignore`):

```bash
cp .env.example .env
```

Variables clave (ver `.env.example` para la lista completa comentada):

| Variable | De dónde sale |
|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Dashboard Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | Dashboard Supabase → Project Settings → API Keys → `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Project Settings → API Keys → `service_role` — **secreto**, el MCP de Supabase no lo expone a propósito, hay que copiarlo a mano |
| `ONG_DB_SUPABASE_*` / `VITE_ONG_DB_SUPABASE_*` | Mismos valores del proyecto de arriba (módulo ONG comparte Supabase con la raíz) |
| `OTP_EMAIL_PROVIDER` | `resend` para envío real (requiere `RESEND_API_KEY` real) o `none` + `EXPOSE_DEBUG_OTP=true` para pruebas locales sin enviar correos |

Sin `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` el backend (`server/config.js: assertServerConfig`) **lanza excepción al arrancar** y `npm run dev` muere completo (usa `concurrently --kill-others-on-fail`).

## 4. Levantar el proyecto

```bash
npm run dev
```

Esto limpia puertos y caché de Vite (`predev:all`) y levanta en paralelo:

- API Express → `http://localhost:8787`
- App principal + módulo `/ong` (mismo servidor Vite) → `http://localhost:5173`

Piezas por separado si hace falta:

```bash
npm run dev:api   # solo la API
npm run dev:web   # solo Vite (raíz + /ong)
```

Verificación rápida de que los 3 endpoints responden:

```bash
npm run validate
```

## 5. Tests

Dos runners separados — no se mezclan:

```bash
npm test              # Jest (backend, server/) — --runInBand
npm run test:coverage # Jest con cobertura
npm run test:web      # Vitest (frontend, src/ y ong/) — modo run
npm run test:web:coverage
```

`npm run typecheck` corre `tsc --noEmit` — útil antes de dar por cerrado un cambio de TypeScript.

## 6. Vercel (despliegue desde local)

CLI ya autenticada como `eduardo-sebastian-paipay-vega`, y esta carpeta ya está enlazada (`.vercel/`) al proyecto `02042026-01-py-democra`. Si se clona de nuevo en otra máquina:

```bash
vercel login                                  # una vez por máquina
vercel link --project 02042026-01-py-democra  # enlaza esta carpeta al proyecto existente
vercel env pull .env.vercel                   # opcional: trae las env vars configuradas en Vercel
```

Despliegue:

```bash
vercel                 # preview deploy
vercel --prod           # producción (pisa democra.pro) — pedir confirmación antes de correrlo
```

`vercel.json` define el build: `api/server.js` como función serverless para la API, y rewrites para `/ong` y el catch-all SPA. No tocar el orden de los rewrites (las reglas específicas van antes del catch-all).

## 7. Problemas comunes

| Síntoma | Solución |
|---|---|
| Puerto 5173/8787 ocupado | `npm run clean:ports` (o `npm run clean` para puertos + caché) |
| Vite sirve HTML/JS viejo tras un cambio de config | `npm run clean:cache` o `npm run dev:force` |
| `npm run dev` muere al instante | Revisar que `.env` tenga `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` — es la causa más común |
| Ruta `/ong` da 404 o redirige a landing en producción | Ver `docs/VERCEL_TROUBLESHOOTING.md` (ERR-001-AUTH-REDIRECT-LOOP, case-sensitivity de carpetas) |
