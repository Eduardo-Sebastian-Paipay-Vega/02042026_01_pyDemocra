# Democra

Plataforma SaaS multi-tenant de gobernanza democrática con IA para ONGs y organizaciones: votaciones, deliberación, gestión de voluntariado y toma de decisiones en tiempo real.

## Tecnologías

- **Frontend**: React 18 + TypeScript + Vite 6, Tailwind CSS 4, Radix UI, React Router 7
- **Backend**: Express 5 (Node.js), motor propio de riesgo/MFA
- **Base de datos**: Supabase (PostgreSQL 16) — multi-tenant vía Row Level Security, sin ORM (acceso directo con `@supabase/supabase-js`)
- **Autenticación**: Supabase Auth + capa propia de MFA/OTP y control de riesgo

## Arquitectura

El repositorio contiene tres piezas que se ejecutan juntas en desarrollo:

| Pieza | Ruta | Puerto | Descripción |
|---|---|---|---|
| App principal | `src/` | 5173 | Landing, página "Nosotros" y el módulo ONG integrado (`src/modules/ong/`, con soporte para ACE — Access & Context Engine) |
| App ONG | `ONG/` | 5174 | Aplicación independiente para gestión de ONGs (proyecto propio con su `package.json`; versión más antigua del módulo ONG, sin tipos ACE — ver `AUDIT_REPORT.md`) |
| API | `server/` | 8787 | Express: IAM, autenticación/MFA, motor de riesgo, auditoría |

La base de datos vive en Supabase y se administra mediante migraciones versionadas en `supabase/migrations/` (raíz) y `ONG/supabase/migrations/`. El sistema es multi-tenant: toda tabla con `tenant_id` se filtra en el cliente y se refuerza con RLS vía `fn_current_tenant_id()`. Ver `AUDIT_REPORT.md`, `DATABASE_MASTER_SCRIPT.md` y `DATABASE_DICTIONARY.md` para el detalle completo del esquema, y `docs/` para documentación funcional por módulo.

## Requisitos

- Node.js 20+ (probado con Node 26)
- npm 10+
- Un proyecto de Supabase (URL + claves anon/service role)

## Instalación

```bash
git clone <url-del-repositorio>
cd Democra
npm install
npm install --prefix ONG
```

## Configuración — variables de entorno

Copia las plantillas y completa tus propios valores (nunca commitees `.env`):

```bash
cp .env.example .env
cp ONG/.env.example ONG/.env
```

**Raíz (`.env`)** — usadas por la app principal y la API:

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Cliente Supabase del frontend |
| `API_PORT` | Puerto del servidor Express (por defecto `8787`) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Cliente Supabase del backend (IAM, MFA, auditoría) |
| `VITE_RUC_API_URL` / `RUC_API_TOKEN` | Validación de RUC (SUNAT) |
| `MFA_OTP_PEPPER`, `MFA_OTP_TTL_MINUTES`, `SESSION_TTL_HOURS`, `MAX_PIN_ATTEMPTS`, `PIN_BLOCK_MINUTES`, `RISK_TEMP_BLOCK_MINUTES`, `EXPOSE_DEBUG_OTP` | Ajustes del motor de seguridad/MFA |
| `OTP_EMAIL_PROVIDER`, `OTP_FROM_EMAIL`, `OTP_FROM_NAME`, `RESEND_API_KEY`, `OTP_RESEND_API_URL` | Envío de OTP por email (Resend) |

**`ONG/.env`** — usadas por la app ONG independiente:

| Variable | Uso |
|---|---|
| `ONG_DB_SUPABASE_URL` / `ONG_DB_SUPABASE_ANON_KEY` / `ONG_DB_SUPABASE_SERVICE_ROLE_KEY` | Cliente Supabase (backend) |
| `VITE_ONG_DB_SUPABASE_URL` / `VITE_ONG_DB_SUPABASE_ANON_KEY` | Cliente Supabase (frontend) |

Ver `.env.example` y `ONG/.env.example` para la lista completa con comentarios.

## Ejecución

```bash
npm run dev
```

Esto levanta simultáneamente la API (`:8787`), la app principal (`:5173`) y la app ONG (`:5174`), limpiando puertos y caché de Vite antes de arrancar. También puedes levantar cada pieza por separado:

```bash
npm run dev:api   # solo la API Express
npm run dev:web   # solo la app principal (Vite)
npm run dev:ong   # solo la app ONG
```

Otros scripts útiles:

```bash
npm run validate       # comprueba que los 3 servicios respondan correctamente
npm run typecheck      # tsc --noEmit
npm run clean          # libera puertos y limpia caché/builds
npm run build          # build de producción de la app principal
npm run build --prefix ONG   # build de producción de la app ONG
```

## Pruebas

Existe una prueba SQL (pgTAP) en `supabase/tests/fase1_onboarding_test.sql`. El proyecto no tiene aún un `config.toml` de Supabase CLI ni un pipeline de CI configurado — para ejecutar la prueba necesitas tu propio entorno de Supabase CLI enlazado al proyecto.

## Despliegue

No hay pipeline de despliegue automatizado en este repositorio todavía. En producción, cada pieza se despliega por separado:

- **Frontend (`src/` y `ONG/`)**: `npm run build` genera `dist/` (assets estáticos) para servir detrás de cualquier CDN/hosting estático.
- **API (`server/`)**: proceso Node.js (`node server/index.js`), requiere las variables de entorno del backend configuradas en el entorno de destino.
- **Base de datos**: aplica las migraciones de `supabase/migrations/` y `ONG/supabase/migrations/` contra tu proyecto de Supabase.

## Estructura de carpetas

```
├── src/                    App principal (React + Vite): landing, nosotros, módulo ONG integrado
│   ├── modules/ong/         Módulo ONG con soporte ACE (versión vigente)
│   ├── pages/               Landing, Nosotros
│   └── lib/                 Utilidades compartidas
├── ONG/                    App ONG independiente (paquete propio)
├── server/                 API Express (IAM, MFA/riesgo, auditoría)
├── supabase/               Migraciones y pruebas SQL de la base raíz
├── scripts/                Scripts de desarrollo (limpieza de puertos/caché, validación)
├── docs/                   Documentación funcional y técnica por módulo
├── public/                 Assets estáticos servidos por la app principal
├── AUDIT_REPORT.md         Auditoría técnica de base de datos
├── DATABASE_MASTER_SCRIPT.md   DDL reconstruido del esquema
└── DATABASE_DICTIONARY.md  Diccionario de objetos de base de datos
```

## Licencia

MIT — ver [LICENSE](LICENSE).

## Autores

Eduardo Sebastian Paipay Vega ([@EduardoBastian2005](https://github.com/EduardoBastian2005))
