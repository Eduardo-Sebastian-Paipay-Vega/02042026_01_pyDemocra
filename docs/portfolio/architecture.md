# 🏗️ Arquitectura — Democra

## Visión general

Democra sigue una arquitectura **Monorepo MPA (Multi-Page Application)** desplegada en un solo origen (`same-origin`) mediante Vercel. Esta decisión elimina la complejidad de CORS en producción y permite compartir la sesión de autenticación de forma nativa entre el frontend y la API.

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────┐                 │
│  │  App Principal   │  │   App ONG       │                 │
│  │  (src/)          │  │   (ong/)        │                 │
│  │  • Landing       │  │   • Legacy      │                 │
│  │  • Login         │  │     standalone  │                 │
│  │  • Nosotros      │  │                 │                 │
│  │  • Módulo ONG    │  │                 │                 │
│  │    (36+ páginas) │  │                 │                 │
│  └──────────────────┘  └─────────────────┘                 │
│                                                             │
│  React 18 · TypeScript · Vite 6 · Tailwind CSS 4           │
│  Radix UI · React Router 7 · Recharts · Motion             │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ↓ @supabase/supabase-js     ↓ HTTP (same-origin /api/*)
         │                           │
┌────────┴────────┐    ┌─────────────┴───────────────────────┐
│   Supabase      │    │        CAPA DE APLICACIÓN           │
│   (directo)     │    │                                     │
│                 │    │  Express 5 (server/index.js)        │
│  • Queries      │    │  ┌────────────────────────────┐     │
│  • Inserts      │    │  │ Middleware Chain            │     │
│  • Updates      │    │  │ trust proxy → Helmet →     │     │
│  • Storage      │    │  │ Permissions → CORS →       │     │
│                 │    │  │ JSON → Rate Limit →        │     │
│                 │    │  │ Auth Limit → Financial →   │     │
│                 │    │  │ Route Handler              │     │
│                 │    │  └────────────────────────────┘     │
│                 │    │                                     │
│                 │    │  Routers:                           │
│                 │    │  ├── /api/auth (risk, MFA, login)   │
│                 │    │  ├── /api/iam (roles, permisos)     │
│                 │    │  ├── /api/onboarding (bootstrap)    │
│                 │    │  ├── /api/audit (forense + IA)      │
│                 │    │  ├── /api/sedes (CRUD sedes)        │
│                 │    │  └── /api/docs (Swagger UI)         │
│                 │    └─────────────┬───────────────────────┘
│                 │                  │
└────────┬────────┘                  │
         │                           │ service_role key
         └─────────────┬─────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                             │
│                                                              │
│  Supabase (PostgreSQL 16)                                   │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Auth                                             │       │
│  │  • Supabase Auth (JWT)                           │       │
│  │  • Sesión compartida: storageKey                 │       │
│  │    'sb-democra-auth-token'                       │       │
│  ├──────────────────────────────────────────────────┤       │
│  │  PostgreSQL 16                                    │       │
│  │  • 40+ tablas con tenant_id                      │       │
│  │  • RLS: fn_current_tenant_id()                   │       │
│  │  • Functions: fn_bootstrap_tenant,               │       │
│  │    fn_has_permission, fn_is_tenant_admin          │       │
│  │  • Triggers: audit_universal, set_updated_at     │       │
│  │  • 14 migraciones versionadas                    │       │
│  ├──────────────────────────────────────────────────┤       │
│  │  Storage                                          │       │
│  │  • Documentos, evidencias, avatares              │       │
│  │  • Validación MIME en upload                     │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────────┐
│                 SERVICIOS EXTERNOS                            │
│                                                              │
│  ┌────────────────┐ ┌──────────────┐ ┌───────────────┐      │
│  │ OpenAI         │ │ Resend API   │ │ SUNAT API     │      │
│  │ GPT-4.1-mini   │ │ Email OTP    │ │ Validación    │      │
│  │ Copiloto       │ │ Verificación │ │ fiscal RUC    │      │
│  │ forense        │ │ de cuenta    │ │               │      │
│  └────────────────┘ └──────────────┘ └───────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## Flujo de datos: Login completo

```
1. Usuario → Frontend: ingresa email + contraseña
2. Frontend → Supabase Auth: signInWithPassword()
3. Supabase Auth → Frontend: JWT access_token
4. Frontend → API /auth/risk-evaluate: Bearer token + señales
5. API → resolveAuthContext(): extrae user + profile del JWT
6. API → Risk Engine: evalúa señales contextuales
   ├── IP + geolocalización (getClientCountry)
   ├── User-Agent (sanitizeUserAgent)
   ├── Horario (fuera de laboral = +riesgo)
   ├── Historial de intentos (Supabase query)
   └── IA (explainRiskDecisionWithAi) → adjustment
7. Risk Engine → Decisión:
   ├── ALLOW → sesión establecida
   ├── REQUIRE_OTP → genera código, envía por email
   └── BLOCK → deniega acceso, registra evento
8. Si REQUIRE_OTP:
   ├── API genera código 6 dígitos (HMAC + pepper)
   ├── API → Resend API: envía email con OTP
   ├── Usuario → Frontend → API /step-up/verify-otp
   ├── API verifica con timing-safe comparison
   └── Éxito → sesión establecida
9. Auditoría: insertAuthEvent() registra todo el flujo
```

## Despliegue (Vercel)

```
vercel.json define la topología:

/api/*        → Serverless Function (server/index.js vía api/server.js)
/ong          → SPA (ong/index.html)
/ong/*        → SPA (ong/index.html)
/*            → SPA (index.html)

Todo bajo el mismo origen: democra.pro
├── democra.pro/           → Frontend React
├── democra.pro/api/       → Express Serverless
└── democra.pro/ong/       → App ONG legacy
```

## Principios arquitectónicos

1. **Same-origin deployment**: Frontend y API bajo el mismo dominio elimina CORS en producción
2. **Defense in depth**: Seguridad en cada capa (frontend → middleware → backend → RLS)
3. **Tenant isolation by default**: RLS en PostgreSQL como última línea de defensa
4. **Fail-safe defaults**: Si la IA no responde, el sistema usa fallbacks determinísticos
5. **Monorepo simplicity**: Un solo `package.json`, un solo deploy, tipos compartidos
