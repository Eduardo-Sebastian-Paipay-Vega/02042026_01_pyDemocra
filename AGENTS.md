# Reglas de desarrollo — Democra

> Vigente desde 2026-07-04. Aplica a todo trabajo de Claude Code / Antigravity en este repositorio, en toda sesión futura, sin necesidad de que se solicite de nuevo.

## Regla obligatoria: entorno de desarrollo al iniciar sesión de trabajo

> Vigente desde 2026-07-10.

Al empezar a trabajar en este repo (sesión nueva, clon nuevo, o entorno que no se tocó recientemente), verificar en este orden antes de tocar código:

1. **Dependencias instaladas**: `node_modules/` existe y `npm ls --depth=0` no tira errores de resolución. Si falta, `npm install` en la raíz — nunca instalar dentro de `ong/` ni crear un `package.json` secundario (Regla de Oro #1 de `DEVELOPMENT_GUIDE.md`).
2. **`.env` presente y completo**: si no existe, copiar `.env.example` y completar con las credenciales reales del proyecto Supabase `PT_solaris` (ref `qafvnjoqvdtnrdvlnwco`). Sin `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, `npm run dev` falla de inmediato (`server/config.js: assertServerConfig`). La `service_role` key no la expone el MCP de Supabase por diseño — pedirla al usuario o leerla del dashboard.
3. **Vercel CLI enlazado**: `vercel whoami` para confirmar sesión activa y `.vercel/` presente (creado por `vercel link --project 02042026-01-py-democra`). Necesario para poder desplegar (`vercel` / `vercel --prod`) desde este entorno sin pasos manuales adicionales.
4. **Tests ejecutables**: `npm test` (Jest, backend) y `npm run test:web` (Vitest, frontend) deben poder correr sin errores de configuración antes de dar por buena una tarea que toque código.

Detalle completo, comandos y solución de problemas comunes en **`SETUP.md`** (raíz del repo).

## Reglas de Oro de Arquitectura y Desarrollo

1. **Cero `package.json` secundarios**: Ninguna subcarpeta (como `ONG/` u otro submódulo) debe tener su propio `package.json` ni su propia carpeta `node_modules`. Todas las dependencias se instalan en la raíz del proyecto.
2. **Autenticación compartida nativa**: Todo cliente de Supabase (raíz, ONG, y cualquier módulo futuro) debe inicializarse con el mismo `storageKey` explícito: `storageKey: 'sb-democra-auth-token'`.
3. **URLs y rutas en minúsculas**: Por convención y compatibilidad con Vercel/Linux, todas las rutas del navegador y nombres de carpetas de módulo deben escribirse estrictamente en minúsculas (`/ong/`, `/api/`, etc.).
4. **El backend vive en `server/`, no en `api/`**: `api/server.js` es solo el adaptador Serverless para Vercel. La lógica real (rutas, middleware, controllers, servicios) pertenece a `server/`.

## Regla obligatoria: auditoría de cambios y versionado

Cada vez que se realice un **cambio importante** (nueva funcionalidad, refactorización, corrección de error relevante, cambio de arquitectura, modificación de base de datos, cambio de UI significativo, etc.), se debe:

### 1. Crear una carpeta de auditoría

```
changes/YYYY-MM-DD_HH-MM_nombre-del-cambio/
```

Ejemplo: `changes/2026-07-04_16-35_mejora-modulo-ong/`

Con, como mínimo, estos 3 archivos:

**`CHANGELOG.md`** — debe incluir:
- Fecha y hora
- Objetivo del cambio
- Contexto del problema
- Motivo de la modificación
- Solución implementada
- Riesgos identificados
- Impacto esperado
- Módulos afectados
- Dependencias involucradas
- Posibles efectos secundarios
- Estado del cambio (Completado / Parcial / Pendiente)

**`SUMMARY.md`** — resumen ejecutivo:
- Qué se hizo
- Por qué se hizo
- Qué beneficio aporta
- Qué funcionalidades quedaron afectadas

**`FILES_CHANGED.md`** — lista completa:
- Archivos creados / modificados / eliminados, carpetas afectadas
- Qué cambió en cada uno (breve, por archivo)

La documentación debe ser suficientemente detallada como para servir de historial técnico real — no un resumen mínimo. Cualquier desarrollador debe poder entender qué ocurrió, cuándo, por qué, quién lo hizo (Claude) y cómo revertirlo.

### 2. Commit en Conventional Commits

Cada cambio importante termina en un commit. Formato:

```
tipo(alcance): descripción exacta del cambio

feat(ong): agrega sistema de validación de beneficiarios
fix(auth): corrige expiración del JWT
refactor(database): reorganiza repositorios
style(ui): mejora consistencia visual del dashboard
```

### 3. Push a GitHub

Cuando el cambio quede terminado y estable:
1. Verificar que el proyecto compile (`npm run build` o Vite).
2. Verificar que no existan errores nuevos.
3. Ejecutar las pruebas disponibles (`npm test` / `npm run test:web`).
4. Confirmar que no se rompió funcionalidad existente.
5. Commit.
6. **Push inmediato a `origin/main`** — no acumular cambios grandes sin subirlos. Esto es autorización permanente para hacer push sin volver a preguntar, siempre que los pasos 1–4 se hayan verificado y el cambio esté genuinamente estable. Si algo queda incierto, roto, o parcialmente probado, no se hace push — se reporta el motivo en vez de forzarlo.

## Objetivo de estas reglas

Trazabilidad completa, auditorías técnicas simples, reversión sencilla ante problemas, consistencia arquitectónica en el monorepo y un remoto (`origin/main`) siempre sincronizado con el estado real del trabajo.
