# Auditoría de Seguridad Inicial
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09 | Metodología: Análisis estático de código

---

## 1. Fortalezas de Seguridad Identificadas

El sistema Democra exhibe un nivel de madurez en seguridad superior al estándar en su etapa inicial. Se destacan las siguientes implementaciones:

1. **Motor de Riesgo Propio:** Evalúa contexto de sesión (IP, dispositivo, velocidad, fallos recientes) de manera inteligente.
2. **Defensa en Profundidad (RLS):** Las Row Level Security policies garantizan el aislamiento multi-tenant directamente en PostgreSQL, funcionando como última barrera si falla la capa de aplicación.
3. **Almacenamiento de Secretos (HMAC/OTP):** Los códigos temporales (OTP) nunca se guardan en texto plano; usan HMAC con pepper de servidor. Los PINs de terminal usan bcrypt.
4. **Rate Limiting Doble:** Configurado a nivel de Express con dos perfiles: general para toda la API y estricto (bajo umbral) para rutas vulnerables de autenticación.
5. **Cabeceras Seguras:** Uso del middleware `Helmet` para inyectar cabeceras HSTS, XSS Protection y NoSniff.
6. **Auditoría Transaccional Inmutable:** Triggers de base de datos (`audit_logs`) que actúan por debajo de la capa de API para registrar toda mutación (INSERT, UPDATE, DELETE).
7. **Principio de Mínimo Privilegio (IAM + ACE):** Roles limitados por nivel jerárquico y restricciones de acceso (Constraint Engine).

---

## 2. Gaps de Seguridad y Riesgos (Red Teaming)

A pesar de las fortalezas, existen áreas de riesgo que requieren atención:

| ID | Vulnerabilidad / Riesgo | CVSS Est. | Mitigación Actual | Plan de Acción / Hardening |
|----|-------------------------|-----------|-------------------|----------------------------|
| **RSK-01** | Lógica de negocio de ONGs ejecutada desde Frontend | Medio (5.0) | RLS impide acciones no autorizadas. | Evaluar migrar transacciones críticas o flujos que requieran validación multicondicional (ej. finanzas) a Endpoints privados/Edge Functions. |
| **RSK-02** | Ausencia de Pen-Testing / Análisis Dinámico | Medio (4.5) | Ninguna. | Programar una auditoría DAST contra los endpoints públicos del servidor de Vercel. |
| **RSK-03** | Endpoints de Admisión (Access Links) expuestos | Medio (4.0) | Rate Limiting y cupos de uso (maxUses). | Implementar validación estricta de referer o CAPTCHA invisible para mitigar automatización de bots agotando cupones de autoregistro. |
| **RSK-04** | Umbrales del motor de riesgo no administrables en caliente | Bajo (3.0) | Parametrización en `.env` | Migrar configuración de riesgo a BD para permitir a un Super Administrador aplicar un estado "Lockdown" (sensibilidad extrema) instantáneo ante ataques. |

---

## 3. Superficie de Ataque Actual

Los vectores principales desde los cuales un atacante podría intentar comprometer el sistema:

1. **API Pública de Express (Vercel):**
   - Endpoints de Login (`/api/auth/risk-evaluate`, `/api/auth/step-up/verify-otp`) (Vulnerable a fuerza bruta y credential stuffing, mitigado por Motor de Riesgo).
   - Endpoints de Onboarding (`/api/onboarding/bootstrap-tenant`).
2. **Access & Context Engine (ACE):**
   - El sistema de generación de enlaces públicos con `slug` / `code` para formularios dinámicos y autoregistro (Posible exfiltración si los códigos son predecibles; mitigado por UUIDs/Tokens seguros).
3. **Supabase Edge Functions:**
   - Funciones serverless ejecutables vía HTTP público (ej. `consume-volunteer-registration-code`).
4. **Almacenamiento (Supabase Storage):**
   - Subida de archivos (evidencias, fotos) (Riesgo de inyección de malware si no hay validación de MIME types y escaneo antivirus).

---

## 4. Recomendaciones de Hardening

- **Implementar E2E Security Tests:** Pruebas automatizadas (Playwright) que fuercen login fallidos para asegurar que el motor de riesgo dispara MFA adecuadamente bajo carga.
- **Auditoría Automática de Dependencias:** Integrar `npm audit` o `Dependabot` en CI/CD para parchear vulnerabilidades en el middleware (Vite, React, Express, Radix UI).
- **Escaneo de Storage:** Implementar una Edge Function o hook que procese todos los archivos subidos al Supabase Storage y valide su integridad (Magic Numbers) y tipo MIME real.
