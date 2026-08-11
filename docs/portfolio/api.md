# 🔌 API REST — Democra

## Especificación OpenAPI

La API REST de Democra está completamente documentada utilizando la especificación OpenAPI 3.0.3. El archivo fuente es `docs/api/openapi.yaml` (953 líneas).

La documentación interactiva (Swagger UI) está expuesta en:
`GET /api/docs`

> **Nota de seguridad**: La ruta `/api/docs` tiene un bypass específico en la política de CSP para permitir la carga de scripts inline de Swagger UI.

## Cadena de Middleware (Request Flow)

Cada request que entra a la API pasa por una rigurosa cadena defensiva configurada en `server/index.js`:

```
Request Entrante
      ↓
1. trust proxy: true (necesario para Vercel)
      ↓
2. Helmet (Seguridad HTTP)
      ├── Content-Security-Policy
      ├── Strict-Transport-Security (HSTS)
      ├── X-Content-Type-Options: nosniff
      ├── X-Frame-Options: DENY
      └── Referrer-Policy: strict-origin-when-cross-origin
      ↓
3. Permissions-Policy: camera=(), microphone=(), geolocation=()
      ↓
4. CORS estricto
      ├── origin check (lista blanca)
      ├── credentials: true
      └── Preflight caching
      ↓
5. Body Parsers (JSON limit: 1mb)
      ↓
6. Global Rate Limiter
      └── 100 requests por 15 minutos por IP
      ↓
7. Enrutamiento base (/api)
      │
      ├── /auth/*  → Auth Rate Limiter (5 err/15min)
      │
      └── [Otros endpoints]
            ↓
8. Middleware de Tenant / Financial State
      └── requireFinancialWriteAccess() (para POST/PUT/DELETE)
            ↓
9. Route Handler específico
            ↓
10. Global Error Handler (nunca expone stack traces)
```

## Routers principales

### 1. Auth (`/api/auth`)
Encargado de la seguridad Zero-Trust, evaluación de riesgos y MFA.
- `POST /risk-evaluate` — Evalúa el contexto (IP, UA, horario) y devuelve ALLOW, REQUIRE_OTP o BLOCK
- `POST /terminal-login` — Login mediante código de 8 caracteres y PIN numérico (sedes)
- `POST /step-up/verify-otp` — Verifica código MFA recibido por email
- `POST /step-up/resend-otp` — Invalida código anterior y envía uno nuevo

### 2. IAM (`/api/iam`)
Identity and Access Management. Las escrituras pasan por `requireFinancialWriteAccess()`.
- `GET /roles` — Lista roles del tenant
- `POST /roles` — Crea un nuevo rol
- `PUT /roles/:id` — Actualiza nombre, jerarquía y permisos
- `DELETE /roles/:id` — Elimina un rol (protege roles del sistema)
- `GET /users` — Lista usuarios del tenant con sus asignaciones (roles y sedes)
- `PUT /users/:id` — Modifica la asignación de un usuario (role_id, sede_id)

### 3. Onboarding (`/api/onboarding`)
Alta de organizaciones.
- `POST /bootstrap-tenant` — Registra una organización de forma idempotente (crea tenant, admin, plan)
- `GET /validate-ruc/:ruc` — Consulta la API de SUNAT para obtener datos fiscales

### 4. Sedes (`/api/sedes`)
Gestión de ubicaciones físicas. Escrituras protegidas por estado financiero.
- `GET /` — Lista sedes del tenant
- `POST /` — Crea una nueva sede
- `PUT /:id` — Actualiza datos de la sede
- `DELETE /:id` — Elimina la sede

### 5. Audit (`/api/audit`)
Auditoría forense y métricas con IA.
- `GET /forensic-summary` — Usa GPT-4.1-mini para resumir eventos de seguridad
- `GET /metrics` — Devuelve métricas de seguridad del tenant (riesgo alto, MFA pendientes, bloqueos)

## Manejo de errores

El `Global Error Handler` en `server/index.js` asegura que ningún error interno exponga detalles de implementación. Devuelve respuestas estándar:

```json
{
  "error_code": "SEC-429",
  "error_type": "security",
  "message": "Demasiadas peticiones desde esta IP, intente en 15 minutos."
}
```

Códigos comunes:
- `TEN-003`: Problemas con el contexto del tenant
- `IAM-004`: Autenticación fallida o token inválido
- `FIN-001`: Escritura bloqueada, tenant suspendido
- `FIN-002`: Tenant en modo solo-lectura

## Despliegue en Vercel

En producción, la API de Express se despliega como una función serverless mediante la configuración en `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/server.js" }
  ]
}
```

El entrypoint de Vercel es `api/server.js`, el cual importa e inicializa la aplicación Express exportada desde `server/index.js`.
