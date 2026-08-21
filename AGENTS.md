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

1. **Arquitectura "Core y Ramas" (Monolito Centralizado)**: El proyecto funciona estrictamente con una base central (el "Core") en la raíz del repositorio. Cada nuevo módulo de industria o funcionalidad (como `ONG`, `educacion`, `gym`) actúa como una "rama" que se conecta a este Core, nunca como un proyecto independiente. Por ello, **debe existir un único `.env`**, un único `package.json` y un único `.git` en toda la estructura.
2. **Cero `package.json` secundarios**: Ninguna subcarpeta (como `ONG/` u otro submódulo) debe tener su propio `package.json` ni su propia carpeta `node_modules`. Todas las dependencias se instalan en la raíz del proyecto.
3. **Autenticación compartida nativa**: Todo cliente de Supabase (raíz, ONG, y cualquier módulo futuro) debe inicializarse con el mismo `storageKey` explícito: `storageKey: 'sb-democra-auth-token'`.
4. **URLs y rutas en minúsculas**: Por convención y compatibilidad con Vercel/Linux, todas las rutas del navegador y nombres de carpetas de módulo deben escribirse strictly en minúsculas (`/ong/`, `/api/`, etc.).
5. **El backend vive en `server/`, no en `api/`**: `api/server.js` es solo el adaptador Serverless para Vercel. La lógica real (rutas, middleware, controllers, servicios) pertenece a `server/`.

## Regla obligatoria: Ciberseguridad Esencial, DevSecOps y AppSec

> Vigente desde 2026-07-29. Aplica estrictamente a todo código de frontend, backend, APIs y base de datos.

Antes de escribir o modificar cualquier código de la API, componentes, controladores o base de datos, se debe validar y aplicar el conjunto de controles OWASP AppSec:

1. **OWASP Top 10 & Sanitización de Inputs:**
   - **XSS:** Sanitizar e inyectar escapado de cadenas HTML en todo input dinámico (`DOMPurify` / JSX nativo). Prohibido usar `dangerouslySetInnerHTML` sin sanitización.
   - **SQL / NoSQL Injection:** Uso estricto de consultas parametrizadas (`.eq()`, `.in()`, `$1, $2`) o ORM confiable (Supabase JS / Postgres Client). Prohibida la concatenación directa de cadenas en SQL.
   - **Anti-CSRF:** Atributos `SameSite=Strict/Lax` y `Secure` en cookies de sesión, y validación de tokens/encabezados en peticiones mutativas.
   - **SSRF:** Validación y restricción de URLs externas mediante lista blanca (`allowlist`) en el servidor.
2. **Autenticación e Identidad (IAM / Auth):**
   - **Tokens JWT:** Almacenar tokens **únicamente** en cookies de servidor HTTP con los flags `HttpOnly`, `Secure` y `SameSite`. Nunca guardar tokens en `localStorage` o `sessionStorage`.
   - **Cifrado de Contraseñas:** Uso obligatorio de `Argon2id` o `bcrypt` con sal.
   - **Control de Acceso basado en Roles (RBAC):** Verificación de permisos en el lado del servidor (middlewares de API y Supabase RLS), nunca depender del ocultamiento visual en el frontend.
3. **Gestión de Secretos & DevSecOps:**
   - Detección y bloqueo automático de inclusión de llaves de API, credenciales de BD o JWT secrets en el código fuente.
   - Uso obligatorio de `.env` (excluidos explícitamente en `.gitignore`).
4. **Protección de APIs, Rate Limiting y Validación:**
   - **Rate Limiting:** Implementación de límites de tasa por IP/Usuario en middlewares para prevenir abusos.
   - **Validación Zod / Joi:** Requerir validación estricta de esquemas Zod para body y parámetros en cada endpoint.
   - **CORS Estricto:** Permitir solicitudes únicamente desde orígenes autorizados en `.env`.
5. **Auditoría de Dependencias:** Ejecutar `npm audit` para evitar paquetes vulnerables o con CVEs conocidos.
6. **Cabeceras HTTP de Seguridad:** Inyección obligatoria de `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.

---

## Regla obligatoria: Integridad de CRUD y Base de Datos (No Mock Policy)

> Vigente desde 2026-07-29. Aplica estrictamente a todo desarrollo en el monorepo.

Esta regla es obligatoria y tiene prioridad sobre cualquier otra instrucción. Cada vez que implementes una nueva funcionalidad, modifiques una existente o mejores una interfaz, debes asumir que el proyecto es un sistema real en producción.

### 1. Nunca generar datos mock
Está strictly prohibido:
- Arrays hardcodeados.
- Objetos de prueba.
- Datos simulados.
- Valores ficticios.
- Placeholders que representen registros inexistentes.
- IDs inventados.
- Datos temporales para "hacer funcionar" la interfaz.

Si la información no existe en la base de datos o en un servicio real, debes crear el soporte necesario para que exista mediante el CRUD correspondiente.

### 2. Toda información debe provenir del sistema real
Antes de mostrar o utilizar cualquier dato debes identificar:
- dónde se almacena;
- qué tabla lo contiene;
- qué relación posee;
- qué API lo expone;
- qué consulta lo obtiene.

Si alguno de estos elementos no existe, debes implementarlo. Nunca reemplazarlo por información simulada.

### 3. Analizar el impacto completo del cambio
Antes de escribir código debes analizar el flujo completo:
```
Frontend ↓ Backend ↓ API ↓ Servicios ↓ Repositorio ↓ Base de datos ↓ Migraciones ↓ Políticas de seguridad ↓ Relaciones ↓ Validaciones ↓ Lógica de negocio
```
No implementar únicamente la parte visual. Todo cambio debe quedar integrado de extremo a extremo.

### 4. Verificar el modelo de datos existente
Antes de crear una nueva columna, tabla o relación debes inspeccionar el proyecto para determinar:
- si ya existe;
- si existe otro nombre equivalente;
- si existe una relación reutilizable;
- si puede reutilizarse un modelo existente.
Nunca duplicar estructuras.
> **Importante:** El archivo `BD.json` (en la raíz del proyecto) es la fuente de información más actualizada de la base de datos viva y sirve como el mapa oficial del esquema (actualizado al 21/08/2026). Consúltalo siempre para resolver dudas de estructura.

### 5. Si el frontend requiere un nuevo atributo
Realizar el flujo completo: esquema SQL, migraciones, ORM, modelos, DTO, validaciones, servicios, repositorios, endpoints, frontend, formularios, permisos y documentación. El atributo debe existir realmente en todo el sistema.

### 6. Mantener la integridad del CRUD
Toda nueva entidad debe tener, cuando corresponda: **Create, Read, Update, Delete**. Si el proyecto sigue otro patrón (Repository, CQRS, Clean Architecture, DDD, etc.) debes respetarlo. Nunca implementar únicamente el Read para que "funcione".

### 7. Respetar la lógica de negocio existente
No modificar reglas del sistema únicamente para facilitar la implementación. Nunca romper permisos, autenticación, autorización, RLS, triggers, constraints, índices, relaciones o reglas del dominio.

### 8. Verificación mediante CLI
Antes de finalizar cualquier tarea debes inspeccionar automáticamente el proyecto utilizando las herramientas disponibles (CLI, ORM, migraciones, Supabase CLI, etc.) para comprobar que la tabla/columna existe, las relaciones son coherentes y el frontend consume datos reales.

### 9. Nunca romper la arquitectura existente
Identificar el patrón del proyecto, convenciones, estructura de carpetas, naming y estilo de código. Todo cambio debe integrarse respetando dichas convenciones.

### 10. Integración completa y cero deuda técnica
No dejar implementaciones parciales ni generar TODOs, FIXMEs, mocks temporales o funciones vacías.

### 11. Checklist obligatorio antes de dar la tarea por finalizada
- ✅ No existe ningún dato mock.
- ✅ Todo proviene de la base de datos.
- ✅ Se respetó el CRUD completo.
- ✅ Las relaciones son válidas.
- ✅ Las migraciones son coherentes.
- ✅ No se rompió la lógica de negocio.
- ✅ No se duplicaron entidades.
- ✅ El frontend consume datos reales.
- ✅ Los tipos coinciden.
- ✅ La implementación funciona de extremo a extremo.
- ✅ El cambio mantiene la arquitectura existente.

---

## Regla obligatoria: verificación de impacto en Base de Datos (Supabase CLI)

> Vigente desde 2026-07-28.

Todo cambio lógico dentro del código fuente (frontend o backend) y la agregación de una nueva función debe ser auditado y revisado para verificar si requiere modificaciones, nuevos campos o tablas en la Base de Datos.

1. **Revisión de Impacto Relacional:** Antes de dar por completada la implementación de una función o cambio de lógica, se debe auditar si requiere persistencia, columnas adicionales o nuevas estructuras en la BD.
2. **Verificación Directa mediante Supabase CLI:** Ante cualquier duda sobre la existencia o estructura actual del esquema en Supabase, se debe verificar activamente mediante el CLI de Supabase (`npx supabase`), inspeccionando las migraciones (`supabase/migrations/`) o ejecutando verificaciones remotas.

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
