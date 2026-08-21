# Democra

**Plataforma SaaS multi-tenant de gobernanza democrática para ONGs** — gestión integral de voluntarios, beneficiarios, proyectos, finanzas, asistencia y seguridad Zero-Trust con copiloto de Inteligencia Artificial.

[![Stack](https://img.shields.io/badge/React_18-TypeScript-blue)](#-stack-tecnológico)
[![Backend](https://img.shields.io/badge/Express_5-Node.js-green)](#-stack-tecnológico)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL_16-3ECF8E)](#-stack-tecnológico)
[![Deploy](https://img.shields.io/badge/Vercel-Serverless-black)](#despliegue)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **Demo en producción**: [democra.pro](https://democra.pro)

---

## 🚀 Sobre el proyecto

Democra nace del problema real que enfrentan las organizaciones no gubernamentales en Perú y Latinoamérica: la falta de herramientas digitales integradas para gestionar su operación diaria. Los coordinadores de ONG manejan voluntarios, beneficiarios, proyectos, inventarios, finanzas, asistencia y documentación — generalmente a través de hojas de cálculo desconectadas, sin control de acceso ni trazabilidad.

**Democra resuelve esto con una plataforma SaaS multi-tenant** donde cada organización obtiene su propio espacio aislado con:

- Gestión completa de personas (voluntarios, beneficiarios, staff)
- Proyectos, actividades y asistencia con flujos de aprobación
- Finanzas, inventario y registros clínicos
- Sistema de roles y permisos granulares
- Motor de seguridad Zero-Trust con evaluación de riesgo por IA
- Autenticación MFA/OTP con auditoría forense

---

## 🎯 Problema

Las ONGs operan con recursos limitados y herramientas fragmentadas. Un coordinador típico necesita:

1. **Registrar voluntarios** → Google Forms + Excel
2. **Controlar asistencia** → Papel o WhatsApp
3. **Gestionar proyectos** → Trello/Notion separados
4. **Llevar finanzas** → Otro Excel
5. **Controlar acceso** → Contraseñas compartidas

No existe trazabilidad, no hay control de permisos, no hay auditoría, y la información de beneficiarios vulnerables queda expuesta sin protección.

## 💡 Solución

Un sistema unificado donde cada ONG tiene:

```
Organización (Tenant)
  ├── Usuarios con roles granulares
  ├── Sedes físicas con permisos por ubicación
  ├── Módulos activables: Personas, Operación, Finanzas, Clínico...
  ├── Aislamiento total de datos (RLS por tenant_id)
  └── Auditoría de cada acción con IA forense
```

---

## ✨ Funcionalidades implementadas

### 🔐 Autenticación y Seguridad Zero-Trust
- Login con Supabase Auth + sesión compartida entre módulos (`storageKey`)
- Motor de evaluación de riesgo en tiempo real (IP, User-Agent, geolocalización, horario, historial)
- MFA/OTP por correo electrónico con Resend API (códigos de 6 dígitos, expiración configurable)
- Login por terminal/código de acceso con PIN para operaciones presenciales
- Auditoría forense con resúmenes asistidos por IA
- Rate limiting diferenciado (general: 100/15min, auth: 5/15min con `skipSuccessfulRequests`)

### 🏢 Onboarding y Multitenancy
- Bootstrap idempotente de organizaciones (`fn_bootstrap_tenant` — función almacenada PostgreSQL)
- Validación fiscal de RUC contra la API de SUNAT
- Verificación de cuenta por email con token SHA-256
- Activación modular por industria (cada ONG activa solo los módulos que necesita)

### 👥 Gestión de Identidades (IAM)
- Roles jerárquicos con permisos granulares (RBAC)
- Asignación usuario → rol → sede
- Protección de roles de sistema (`is_system_role`)
- Control de acceso financiero por estado del tenant (suspendido, solo-lectura)

### 📋 Módulo ONG — 36+ páginas implementadas

| Área | Funcionalidades |
|---|---|
| **Personas** | Beneficiarios, voluntarios, carnets QR, fichas médicas |
| **Admisión** | Solicitudes, documentos, entrevistas, scoring OCR |
| **Operación** | Proyectos, actividades, asistencia, horas, aprobaciones, evidencias |
| **Académico** | Cursos, programas, calificaciones |
| **Recursos** | Inventario, finanzas, categorías, comprobantes, reportes |
| **Gobernanza** | Auditoría, catálogos, retención, accesos sensibles |
| **Configuración** | Roles, usuarios del sistema, seguridad, mi perfil/cuenta |
| **Notificaciones** | Historial, plantillas |
| **Búsqueda** | Motor global multi-entidad |

### 🤖 Inteligencia Artificial
- **Copiloto forense de seguridad**: Analiza eventos de riesgo y genera resúmenes explicativos (`summarizeForensicEvent`)
- **Explicación de decisiones de riesgo**: El motor de IA ajusta scores de riesgo y genera mensajes contextuales (`explainRiskDecisionWithAi`)
- **Explicador de errores**: Transforma códigos de error técnicos en explicaciones accionables para el usuario

### 📧 Comunicaciones
- Envío de OTP por email (Resend API)
- Verificación de cuenta por correo
- Sistema de templates HTML para emails transaccionales

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│            Usuario (Browser)            │
└───────────────────┬─────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌──────────────┐            ┌──────────────┐
│   Frontend   │            │   API REST   │
│  React/Vite  │            │  Express 5   │
│  :5173       │            │  :8787       │
│              │            │              │
│ • Landing    │            │ • /auth      │ ← Risk Engine + MFA
│ • Login      │            │ • /iam       │ ← Roles + Permisos
│ • Dashboard  │            │ • /onboarding│ ← Bootstrap Tenant
│ • 36+ páginas│            │ • /audit     │ ← Auditoría + IA
│ • ONG Module │            │ • /sedes     │ ← Gestión sedes
│              │            │ • /docs      │ ← Swagger UI
└──────┬───────┘            └──────┬───────┘
       │                           │
       │  @supabase/supabase-js    │  service_role key
       └───────────┬───────────────┘
                   ↓
       ┌───────────────────────┐
       │       Supabase        │
       │  ┌─────────────────┐  │
       │  │  Auth (JWT)     │  │  ← Sesión compartida
       │  ├─────────────────┤  │
       │  │  PostgreSQL 16  │  │  ← 40+ tablas, 14 migraciones
       │  │  • RLS          │  │  ← fn_current_tenant_id()
       │  │  • Policies     │  │  ← fn_has_permission()
       │  │  • Triggers     │  │  ← audit, updated_at
       │  │  • Functions    │  │  ← fn_bootstrap_tenant
       │  ├─────────────────┤  │
       │  │  Storage        │  │  ← Documentos, evidencias
       │  └─────────────────┘  │
       └───────────────────────┘
                   │
       ┌───────────┴───────────┐
       │  Servicios Externos   │
       │  • OpenAI GPT-4.1-mini│  ← Copiloto forense
       │  • Resend API         │  ← OTP + emails
       │  • SUNAT API          │  ← Validación RUC
       └───────────────────────┘
```

El sistema se despliega en **Vercel** como un monorepo MPA (Multi-Page Application):
- El frontend se sirve como SPA con rewrites
- La API Express corre como Serverless Function (`api/server.js`)
- Ambos comparten el mismo origen (`democra.pro`) — sin CORS en producción

> 📖 [Documentación detallada de arquitectura](docs/portfolio/architecture.md)

---

## 🗄️ Base de datos

PostgreSQL 16 gestionado por Supabase con **14 migraciones versionadas** que construyen el esquema de forma incremental y defensiva:

### Entidades principales

```
tenants ──────┬── profiles (usuarios)
              ├── roles ──── role_permissions
              ├── sedes
              ├── user_roles_sedes (RBAC por sede)
              ├── access_links (motor de vinculación ACE)
              ├── memberships
              ├── beneficiarios
              ├── voluntarios
              ├── proyectos ── actividades ── asignaciones
              ├── asistencias ── horas_voluntariado
              ├── inventario ── movimientos
              ├── transacciones_financieras
              ├── fichas_medicas
              ├── audit_log (inmutable)
              └── volunteer_reputation (gamificación)
```

### Características de la base de datos
- **Multi-tenant**: Cada tabla tiene `tenant_id` con FK a `tenants`
- **RLS obligatorio**: Todas las tablas con `ENABLE ROW LEVEL SECURITY`
- **Función central**: `fn_current_tenant_id()` resuelve el tenant del usuario autenticado
- **Auditoría automática**: Trigger `fn_trigger_audit_universal()` en tablas críticas
- **Timestamps automáticos**: Trigger `fn_set_updated_at()` en todas las tablas
- **Constraints defensivos**: CHECK constraints, NOT NULL, FK con ON DELETE CASCADE/SET NULL
- **Índices estratégicos**: Índices compuestos por `tenant_id` + campos de filtro frecuente

> 📖 [Documentación completa de base de datos](docs/portfolio/database.md)

---

## 🔐 Autenticación y autorización

```
Usuario ingresa credenciales
        ↓
Supabase Auth verifica identidad
        ↓
API recibe Bearer token (JWT)
        ↓
resolveAuthContext() → user + profile
        ↓
Risk Engine evalúa señales:
  • IP + geolocalización
  • User-Agent + fingerprint
  • Horario (fuera de horario laboral = +riesgo)
  • Historial de intentos fallidos
  • IA analiza contexto (GPT-4.1-mini)
        ↓
Decisión: ALLOW | REQUIRE_OTP | BLOCK
        ↓
Si REQUIRE_OTP:
  • Genera código 6 dígitos (HMAC + pepper)
  • Envía por email (Resend API)
  • Verifica con timing-safe comparison
        ↓
Sesión establecida con tenant_id
        ↓
Cada query: RLS filtra por fn_current_tenant_id()
```

El motor de riesgo (`server/security/risk-engine.js`) tiene **767 líneas** de lógica defensiva que incluye:
- Evaluación de riesgo basada en señales contextuales
- Bloqueo temporal por intentos fallidos
- Verificación de permisos granulares por sede
- Integración con IA para ajuste dinámico de scores
- Enmascaramiento de PII en logs de auditoría

> 📖 [Documentación completa de autenticación](docs/portfolio/authentication.md)

---

## 🛡️ Seguridad

### Capas de protección implementadas

| Capa | Implementación | Archivo |
|---|---|---|
| **HTTP Headers** | Helmet: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy | `server/index.js` |
| **CORS** | Allowlist explícita (no wildcard), validación de Origin | `server/index.js` |
| **Rate Limiting** | General (100/15min) + Auth (5/15min, solo errores cuentan) | `server/index.js` |
| **Risk Engine** | Evaluación Zero-Trust por señales contextuales + IA | `server/security/risk-engine.js` |
| **MFA/OTP** | Códigos HMAC con pepper, timing-safe comparison, TTL configurable | `server/security/risk-engine.js` |
| **RLS** | Aislamiento por `tenant_id` en todas las tablas | `supabase/migrations/` |
| **Auditoría** | Log inmutable con contexto enmascarado (PII) | `server/security/audit.js` |
| **Error Handling** | Sin stack traces en producción, códigos tipificados | `server/index.js` |
| **Financial Guard** | Middleware bloquea escrituras en tenants suspendidos | `server/middleware/financial-state.js` |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` | `server/index.js` |

> 📖 [Documentación completa de seguridad](docs/portfolio/security.md)

---

## 🔌 APIs e integraciones

### API REST documentada con OpenAPI 3.0.3

La especificación OpenAPI (`docs/api/openapi.yaml`, 953 líneas) documenta todos los endpoints. Swagger UI interactivo disponible en `/api/docs`.

| Módulo | Endpoints | Descripción |
|---|---|---|
| `/api/auth` | `POST /risk-evaluate`, `POST /terminal-login`, `POST /step-up/verify-otp`, `POST /step-up/resend-otp` | Autenticación, riesgo, MFA |
| `/api/iam` | `GET/POST/PUT/DELETE /roles`, `GET/PUT /users` | Gestión de identidades |
| `/api/onboarding` | `POST /bootstrap-tenant`, `GET /validate-ruc/:ruc` | Alta de organizaciones |
| `/api/audit` | `GET /forensic-summary`, `GET /metrics` | Auditoría con IA |
| `/api/sedes` | CRUD completo de sedes | Gestión de sedes |

### Cadena de middleware (request flow)

```
Request → trust proxy → Helmet → Permissions-Policy → CORS
  → JSON parser (1mb limit) → Rate Limiter → Auth Limiter (rutas sensibles)
  → Financial State Guard → Route Handler → Error Handler Global
```

### Integraciones externas

| Servicio | Uso | Archivo |
|---|---|---|
| **OpenAI GPT-4.1-mini** | Copiloto forense, ajuste de riesgo | `server/security/ai-client.js` |
| **Resend API** | Envío de OTP y emails transaccionales | `server/services/email/` |
| **SUNAT API** | Validación de RUC fiscal | `server/routes/onboarding.js` |

> 📖 [Documentación completa de API](docs/portfolio/api.md)

---

## 🤖 Inteligencia Artificial

### IA como funcionalidad del producto

El sistema integra OpenAI GPT-4.1-mini como **copiloto forense de seguridad**:

**1. Resumen forense de eventos** (`summarizeForensicEvent`)
- Recibe un evento de seguridad con constraints
- El prompt del sistema: *"Eres un copiloto forense de seguridad SaaS multi-tenant. Resume hechos, no inventes datos. No reveles secretos ni PII sensible."*
- Devuelve: summary, reasoning, confidence score (0-1)
- Fallback determinístico si la IA no responde

**2. Explicación de decisiones de riesgo** (`explainRiskDecisionWithAi`)
- Recibe: evento, score base, reason codes, señales crudas
- El prompt: *"Actúa como analista de riesgo IAM"*
- Devuelve: adjustment (-10 a +10), user_message, extra_reason_codes
- El adjustment se clampea a [-10, 10] para evitar manipulación

**3. Explicador de errores** (`error-explainer.js`)
- Transforma códigos como `SEC-429`, `IAM-004`, `TEN-003` en explicaciones accionables

### IA como herramienta de desarrollo

Este proyecto fue desarrollado con asistencia de IA (Claude/Antigravity) para:
- Análisis de arquitectura y diseño de esquemas
- Generación asistida de migraciones SQL
- Debugging y resolución de errores de producción
- Documentación técnica
- Testing y cobertura

Los **53 changelogs** en `changes/` documentan cada iteración con fecha, contexto, archivos modificados y decisiones tomadas — evidencia real del proceso de desarrollo asistido por IA.

> 📖 [Documentación completa de IA](docs/portfolio/ai.md)

---

## ⚙️ Automatizaciones

| Automatización | Tipo | Descripción |
|---|---|---|
| `fn_set_updated_at()` | Trigger SQL | Actualiza `updated_at` automáticamente en cada UPDATE |
| `fn_trigger_audit_universal()` | Trigger SQL | Registra cambios en audit_log sin intervención del código |
| `fn_bootstrap_tenant()` | Función RPC | Onboarding idempotente: crea tenant + admin + plan en una transacción |
| `scripts/clean-ports.mjs` | Script Node | Limpia puertos ocupados antes de iniciar dev |
| `scripts/clean-cache.mjs` | Script Node | Limpia caché de Vite/builds |
| `scripts/validate-env.mjs` | Script Node | Valida que los 3 servicios respondan correctamente |
| `scripts/startup-banner.mjs` | Script Node | Banner informativo al iniciar el entorno de desarrollo |
| Financial State middleware | Middleware Express | Bloquea escrituras automáticamente en tenants suspendidos |

> 📖 [Documentación completa de automatizaciones](docs/portfolio/automation.md)

---

## ☁️ SaaS — Características multi-tenant

### Implementado

- **Aislamiento de datos**: Cada tabla con `tenant_id` + RLS (`fn_current_tenant_id()`)
- **Onboarding self-service**: Bootstrap idempotente con validación fiscal
- **Roles y permisos**: RBAC granular por tenant, con roles de sistema protegidos
- **Sedes**: Estructura multi-sede dentro de cada tenant
- **Módulos activables**: Cada ONG activa solo los módulos que necesita
- **Estado financiero**: Control de acceso por estado del plan (activo, suspendido, solo-lectura)
- **Auditoría por tenant**: Logs aislados con contexto forense

### SaaS Evolution — Roadmap técnico

```
Actual:                          Futuro:
┌──────────┐                    ┌──────────────┐
│ Tenant A │                    │ Tenant A     │
│  └ Users │                    │  ├ Org Unit 1│
│  └ Sedes │                    │  │  └ Team   │
│  └ Roles │                    │  ├ Org Unit 2│
└──────────┘                    │  └ Billing   │
                                └──────────────┘
```

La evolución natural incluiría: planes de suscripción con facturación (Stripe), subdominios por tenant, white-labeling, y API pública con OAuth2 para integraciones de terceros.

> 📖 [Documentación completa de SaaS](docs/portfolio/saas.md)

---

## 🧰 Stack tecnológico

| Tecnología | Versión | Por qué |
|---|---|---|
| **React** | 18 | Ecosistema maduro, hooks, componentización |
| **TypeScript** | 6 | Tipado estricto en frontend, types generados para Supabase |
| **Vite** | 6 | Build rápido, HMR instantáneo, soporte nativo ESM |
| **Tailwind CSS** | 4 | Utility-first, consistencia de diseño, zero runtime |
| **Radix UI** | 1.x | Componentes accesibles (a11y), sin opiniones de estilo |
| **Express** | 5 | Framework maduro para API REST, middleware ecosystem |
| **Supabase** | 2.98+ | Auth + PostgreSQL + RLS + Storage en un solo servicio |
| **PostgreSQL** | 16 | Potencia relacional, RLS nativo, funciones PL/pgSQL |
| **Helmet** | 8 | Headers de seguridad HTTP (OWASP) |
| **Resend** | 6 | API moderna de email transaccional |
| **OpenAI** | GPT-4.1-mini | IA para análisis forense de seguridad |
| **Recharts** | 2 | Visualización de datos en dashboard |
| **React Hook Form** | 7 | Formularios performantes sin re-renders |
| **Vercel** | Serverless | Deploy con cero configuración de infraestructura |

---

## 📂 Estructura del proyecto

```
├── src/                          Frontend principal (React + Vite + TypeScript)
│   ├── pages/                    Landing, Login, Nosotros
│   ├── modules/ong/              Módulo ONG integrado (versión vigente)
│   │   ├── app/
│   │   │   ├── pages/            36+ páginas de gestión
│   │   │   ├── services/         13 dominios de servicio (Supabase queries)
│   │   │   ├── components/       UI reutilizable (Figma, layout, shared)
│   │   │   ├── modules/          9 sub-módulos de navegación
│   │   │   └── tenant/           Bootstrap, permisos, screens
│   │   └── supabaseClient.ts     Cliente Supabase compartido
│   ├── shared/                   Código compartido (error-explainer)
│   └── core/                     Core de la aplicación
│
├── server/                       API Express (backend)
│   ├── routes/                   5 módulos de rutas + tests
│   │   ├── auth.js               Autenticación (660 líneas)
│   │   ├── iam.js                Gestión de identidades
│   │   ├── onboarding.js         Bootstrap de tenants
│   │   ├── audit.js              Auditoría forense
│   │   └── sedes.js              Gestión de sedes
│   ├── security/                 Motor de seguridad
│   │   ├── risk-engine.js        Zero-Trust Risk Engine (767 líneas)
│   │   ├── ai-client.js          Copiloto IA forense
│   │   └── audit.js              Funciones de auditoría
│   ├── services/                 Servicios de backend
│   │   ├── email/                Email service completo (Resend)
│   │   ├── ocr.js                Motor de scoring OCR
│   │   ├── notifications-dispatcher.js
│   │   └── ...                   12+ servicios adicionales
│   ├── middleware/                Financial state guard
│   └── utils/                    Helpers (tenant-scope, security, http)
│
├── supabase/                     Base de datos
│   ├── migrations/               14 migraciones versionadas
│   └── tests/                    Tests SQL (pgTAP)
│
├── ong/                          App ONG standalone (versión legacy)
├── docs/                         Documentación técnica
│   ├── api/                      OpenAPI 3.0.3 + Postman collection
│   └── portfolio/                Documentación de portafolio técnico
├── changes/                      53 changelogs de auditoría
├── tests/                        Tests E2E (Playwright)
├── scripts/                      Utilidades de desarrollo
└── vercel.json                   Configuración de deploy
```

---

## 🧪 Testing

### Tests existentes

| Tipo | Framework | Archivos | Cobertura |
|---|---|---|---|
| **Backend (unit/integration)** | Jest + Supertest | 20+ archivos `.test.js` | Rutas, security, services, middleware |
| **Frontend (unit)** | Vitest + Testing Library | `.test.ts/tsx` | Services, components |
| **E2E** | Playwright | `tests/e2e/` | Smoke tests, auth flows |
| **SQL** | pgTAP | `supabase/tests/` | Onboarding flow |

### Ejecutar tests

```bash
npm test              # Jest — backend
npm run test:web      # Vitest — frontend
npm run test:e2e      # Playwright — E2E
npm run test:coverage # Jest con cobertura
```

---

## 🚀 Instalación

### Requisitos

- Node.js 20+ (probado con Node 26)
- npm 10+
- Un proyecto de Supabase (URL + claves anon/service role)

### Setup

```bash
# 1. Clonar repositorio
git clone https://github.com/Eduardo-Sebastian-Paipay-Vega/02042026_01_pyDemocra.git
cd 02042026_01_pyDemocra

# 2. Instalar dependencias (solo en raíz — monorepo single-package.json)
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de tu proyecto Supabase

# 4. Aplicar migraciones SQL a tu proyecto Supabase
# (ejecutar las 14 migraciones de supabase/migrations/ en orden)

# 5. Levantar entorno de desarrollo (API + Frontend simultáneamente)
npm run dev
```

### Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL pública de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_URL` | URL de Supabase para el backend |
| `SUPABASE_ANON_KEY` | Clave anónima para el backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (⚠️ solo backend, nunca en frontend) |

Variables opcionales: `OPENAI_API_KEY` (copiloto IA), `RESEND_API_KEY` (emails), `RUC_API_TOKEN` (SUNAT). Ver `.env.example` para la lista completa.

---

## 📈 Roadmap

### ✅ Implementado
- Sistema completo de autenticación con MFA/OTP
- Motor de riesgo Zero-Trust con copiloto IA
- Onboarding idempotente de organizaciones
- IAM con roles y permisos granulares por sede
- 36+ páginas del módulo ONG
- 13 dominios de servicio (personas, operación, finanzas, etc.)
- API REST documentada con OpenAPI y Swagger UI
- Testing multi-capa (Jest, Vitest, Playwright, pgTAP)
- Deploy en producción (Vercel + dominio propio)

### 🔨 En progreso
- Refinamiento de UI/UX del onboarding (rediseño step 2)
- Mejora de módulo de proyectos y actividades

### 🔮 Futuro
- CI/CD con GitHub Actions
- Supabase Edge Functions para lógica serverless
- Realtime subscriptions para notificaciones en vivo
- Planes de suscripción con facturación (Stripe)
- App móvil (React Native)
- White-labeling para enterprise

---

## 🧠 Decisiones técnicas

### ¿Por qué Supabase sobre Firebase?
PostgreSQL relacional (no NoSQL) permite RLS nativo, JOINs, transacciones ACID y funciones PL/pgSQL — crítico para un sistema multi-tenant con reglas de negocio complejas. Firebase no ofrece Row Level Security a nivel de base de datos.

### ¿Por qué Express 5 sobre tRPC/Next.js API Routes?
Necesitábamos control total sobre el middleware chain (Helmet, CORS específico, rate limiting diferenciado, financial state guard). Express ofrece esa granularidad sin acoplamiento al framework de frontend.

### ¿Por qué RLS en vez de filtrado en código?
El filtrado en código es una capa de aplicación que puede bypasearse. RLS es enforced por PostgreSQL — incluso si existe un bug en el backend, la base de datos rechaza acceso a datos de otro tenant. Es la última línea de defensa.

### ¿Por qué monorepo MPA en vez de microservicios?
Para una startup/proyecto en etapa temprana, la complejidad operativa de microservicios no se justifica. El monorepo permite compartir tipos TypeScript, ejecutar tests unificados y desplegar con un solo `vercel --prod`.

### ¿Por qué IA en el motor de seguridad?
Las reglas determinísticas cubren el 95% de los casos, pero los ataques sofisticados requieren análisis contextual que las reglas no capturan. La IA actúa como segunda opinión — nunca como decisor único (siempre hay fallback determinístico).

> 📖 [Documentación completa de decisiones](docs/portfolio/decisions.md)

---

## 👨‍💻 What this project demonstrates

### FullStack
Frontend React con 36+ páginas complejas (formularios, tablas, dashboards con Recharts, drag-and-drop) + API Express con 5 módulos de rutas y 660+ líneas solo en autenticación + PostgreSQL con 14 migraciones.

### Databases
40+ tablas con relaciones FK, constraints CHECK/NOT NULL, índices compuestos, triggers automáticos, funciones RPC almacenadas. Esquema diseñado para integridad referencial y performance.

### Supabase
Auth con sesión compartida, RLS masivo con funciones auxiliares (`fn_current_tenant_id`, `fn_has_permission`, `fn_is_tenant_admin`), Storage con validación MIME, cliente configurado con `storageKey` compartido.

### APIs
REST API documentada con OpenAPI 3.0.3 (953 líneas). Swagger UI interactivo. Middleware chain profesional (Helmet, CORS, rate limiting, financial guard). Postman collection incluida.

### Automation
Triggers SQL para auditoría y timestamps. Onboarding idempotente como función almacenada. Scripts de desarrollo para limpieza y validación. Middleware automático de control financiero.

### AI
Integración real de OpenAI GPT-4.1-mini como copiloto forense — no decorativa. La IA genera resúmenes de eventos de seguridad y ajusta scores de riesgo con fallback determinístico. Desarrollo asistido por IA documentado en 53 changelogs.

### SaaS
Multi-tenant real con aislamiento por RLS (no por esquema separado). Onboarding self-service. Roles/permisos por sede. Módulos activables por industria. Control de acceso por estado financiero.

### Security
Motor Zero-Trust de 767 líneas con evaluación de riesgo, MFA/OTP, rate limiting diferenciado, headers OWASP (Helmet), CORS estricto, auditoría forense, enmascaramiento PII, protección de roles de sistema.

### Architecture
Monorepo MPA con separación clara frontend/backend/DB. Serverless deployment en Vercel. Patrón de servicios modulares (13 dominios). Tenant isolation enforzado en todas las capas.

---

## Licencia

MIT — ver [LICENSE](LICENSE).

## Autor

**EDUARDO SEBASTIAN PAIPAY VEGA** — paipayvegabastian@gmail.com de democra.pro

---

<sub>📖 Documentación técnica adicional disponible en [`docs/portfolio/`](docs/portfolio/)</sub>
 
