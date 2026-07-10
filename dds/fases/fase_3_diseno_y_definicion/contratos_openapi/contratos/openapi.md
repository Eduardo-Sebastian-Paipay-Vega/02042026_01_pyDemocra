# Especificación OpenAPI (Inferida)

*Fuente de verdad: `server/index.js`, `server/routes/*.js`*

A continuación se documenta el contrato de la API implementada en Express (Backend de Riesgo e IAM), extraído del enrutador. El archivo físico real YAML está referenciado en el código en `docs/api/openapi.yaml`, expuesto interactivamente en `/api/docs` mediante Swagger UI.

## Resumen de Endpoints Base

### 1. Autenticación y Riesgo (`/api/auth`)
*Rutas protegidas por limitadores estrictos (5 intentos / 15 min).*
*   `POST /api/auth/terminal-login`
    *   **Propósito:** Autenticación proveniente de dispositivos tipo "terminal" (e.g., tótems de asistencia).
*   `POST /api/auth/step-up/verify-otp`
    *   **Propósito:** Verificación de código OTP enviado por correo para completar un desafío MFA.
*   `POST /api/auth/step-up/resend-otp`
    *   **Propósito:** Reenvío del código OTP.

### 2. Gestión de Identidad (`/api/iam`)
*   `* /api/iam/*`
    *   **Propósito:** Gestión de perfiles, roles, y manipulación de la tabla `user_roles_sedes`. 
    *   *Nota técnica:* Requiere el header de autorización privilegiada (Service Role Key) o validación de JWT con rol de Owner/Admin. Existe un `DELETE` identificado con un bug en `id` (ver reporte de auditoría).

### 3. Auditoría y Seguridad (`/api/audit` | `/api/security`)
*   `* /api/audit/*`
    *   **Propósito:** Consumo de la bitácora de auditoría inmutable, permitiendo a los administradores ver el historial de `auditoria.audit_log`.

### 4. Onboarding (`/api/onboarding`)
*   `* /api/onboarding/*`
    *   **Propósito:** Flujos de enrolamiento de nuevos usuarios que complementan la lógica de la Edge Function (e.g., registro legacy de voluntarios).

### 5. Sedes (`/api/sedes`)
*   `* /api/sedes/*`
    *   **Propósito:** Endpoints para operaciones CRUD complejas de locaciones físicas que requieran verificaciones extra por parte del middleware.

### 6. Sistema (`/api/health`)
*   `GET /api/health`
    *   **Propósito:** Endpoint de liveness probe para Kubernetes o monitoreo. Retorna `{"status": "ok", "service": "ai-security-copilot"}`.

## Consideraciones de Integración
*   **CORS:** Estrictamente validado por `origin`. Solo permite `localhost:5173` y dominios `.democra.pro`. Un cliente Rest como Postman debe manipular cabeceras o prescindir del header Origin.
*   **Rate Limiting Global:** 100 peticiones cada 15 minutos (Error `SEC-429`).
*   **Formato Global de Error:** Los errores retornan estructura uniforme: `{ error_code, error_type, message, severity, retry_allowed }`.
