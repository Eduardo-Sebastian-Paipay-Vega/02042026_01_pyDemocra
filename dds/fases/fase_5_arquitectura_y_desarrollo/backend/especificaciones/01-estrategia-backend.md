# Estrategia Backend
> **Fase 5 | Arquitectura y Desarrollo** | Fecha de análisis: 2026-07-09

---

## 1. Visión General de la API

La API de Democra (`server/`) está construida con **Express 5** sobre **Node.js 20** y está diseñada para operar como una colección de funciones serverless en la infraestructura de Vercel (definido en `vercel.json`). 

Su propósito no es servir como un CRUD genérico para los módulos de la aplicación (responsabilidad delegada a Supabase directamente), sino actuar como un **Security & Identity Firewall**.

## 2. Componentes Core

### 2.1. Router de Seguridad (`server/routes/auth.js`)
- Gestiona el motor de riesgo dinámico (`risk-engine.js`).
- Coordina el flujo Step-Up MFA (Generación de código HMAC, envío vía Resend API).
- Autenticación por terminal (Hash comparativo de PIN con bcrypt).

### 2.2. Router de IAM (`server/routes/iam.js`)
- Ejerce control jerárquico estricto.
- Ningún rol puede ser asignado si el que asigna tiene una jerarquía menor.
- Inyección de roles y sedes en el `app_metadata` del JWT del usuario.

### 2.3. Router de Onboarding (`server/routes/onboarding.js`)
- Actúa como orquestador ACID del bootstrap de nuevos tenants.
- Integración externa con API SUNAT (validación `ACTIVO` y `HABIDO`).

## 3. Middleware Crítico

El diseño del backend exige que todas las rutas protegidas implementen una cadena de middleware específica para evitar fugas de datos (Data Leakage) entre tenants al operar con la `service_role` key de Supabase.

### Cadena de Seguridad
1. **Rate Limiter:** `express-rate-limit` previene abuso de fuerza bruta.
2. **Verify JWT:** Valida criptográficamente la firma del token enviado por el frontend.
3. **Extract Claims:** Extrae `user_id`, `tenant_id` y `roles` del JWT verificado.
4. **`assertTenantScope`:** (CRÍTICO) Verifica que la petición explícitamente indique a qué tenant intenta acceder, y que coincida exactamente con el `tenant_id` del token. Inyecta `req.tenantId`.
5. **Controlador Final:** Las consultas a Supabase usando el Admin Client DEBEN obligatoriamente encadenar `.eq('tenant_id', req.tenantId)` en cada query DML.

## 4. Gestión de Secretos

El backend maneja las claves maestras. Bajo ningún concepto estas variables de entorno se exponen al cliente (ausencia de prefijo `VITE_`):
- `SUPABASE_SERVICE_ROLE_KEY`: Acceso total a BD.
- `RESEND_API_KEY`: Acceso a envíos de correo.
- `SUNAT_API_TOKEN`: Acceso a base gubernamental.
- `MFA_OTP_PEPPER`: Cadena criptográfica estática para "salar" fuertemente los OTPs antes del hash.

## 5. Auditoría Forense (`audit.js`)
El backend centraliza la visualización de los `audit_logs` generados por los triggers de BD, e integra un cliente de Inteligencia Artificial (`server/security/ai-client.js`) para procesar el log en crudo y retornar resúmenes humanos interpretables sobre posibles ataques, anomalías de acceso a datos sensibles o manipulación de permisos IAM.
