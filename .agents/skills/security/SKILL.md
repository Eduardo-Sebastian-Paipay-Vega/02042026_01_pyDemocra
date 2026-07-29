---
name: security-ciberseguridad-appsec
description: Audit and enforce OWASP Top 10, DevSecOps, XSS sanitization, SQLi prevention, HttpOnly JWT cookies, RBAC, Zod schema validation, CORS, Rate Limiting, HTTP Security Headers, and Secret Leak Prevention. Trigger this skill whenever writing or modifying backend APIs, authentication flows, user input forms, database queries, server middlewares, or security configurations.
---

# Skill de Ciberseguridad Esencial, DevSecOps & AppSec — Democra

> Vigente para todo desarrollo en el monorepo. Esta skill se activa automáticamente al implementar o modificar endpoints de API, autenticación, formularios, consultas a la base de datos o middleware del servidor.

---

## 1. OWASP Top 10 & Auditoría en Tiempo de Código (AppSec)

### 1.1 Prevención de XSS (Cross-Site Scripting)
- **Sanitización de Entradas:** Todo dato recibido del usuario debe ser validado y limpiado en el servidor antes de ser procesado o almacenado.
- **Escapado de Cadenas HTML:** En el frontend React/Vite, nunca utilizar `dangerouslySetInnerHTML` sin previo procesamiento con `DOMPurify` o una librería de sanitización auditada.
- **Renderizado Seguro:** Confiar en la interpolación nativa de JSX (`{variable}`) para escapar caracteres especiales (`<`, `>`, `&`, `"`, `'`).

### 1.2 Prevención de Inyección SQL / NoSQL (SQLi)
- **Consultas Parametrizadas Estrictas:** Prohibida la concatenación directa de variables o cadenas arbitrarias en sentencias SQL (`WHERE id = '${userId}'` ❌ ESTRICTAMENTE PROHIBIDO).
- **ORM / Query Builder Confiable:** Utilizar de manera exclusiva los métodos parametrizados del cliente de Supabase (`.eq()`, `.in()`, `.filter()`) o consultas preparadas (`$1`, `$2` en Postgres).
- **Escape de Caracteres Especiales:** Garantizar la parametrización en funciones RPC y triggers almacenados.

### 1.3 Protección Anti-CSRF (Cross-Site Request Forgery)
- **Atributos de Cookie:** Toda cookie de sesión o autenticación debe incluir los atributos `SameSite=Strict` o `SameSite=Lax` y `Secure`.
- **Tokens Anti-CSRF:** En solicitudes mutativas no idempotentes (POST, PUT, DELETE, PATCH), verificar cabeceras `X-CSRF-Token` o validación del encabezado `Origin` / `Referer`.

### 1.4 Prevención de SSRF (Server-Side Request Forgery)
- **Validación de URLs Externas:** Si el servidor realiza peticiones HTTP a URLs enviadas por clientes, validar estrictamente la dirección con una lista blanca (`allowlist`) de dominios/protocolos autorizados.
- **Bloqueo de Direcciones IP Privadas:** Restringir solicitudes salientes del servidor hacia direcciones IP internas/loopback (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).

---

## 2. Gestión de Autenticación e Identidad (IAM / Auth)

### 2.1 Manejo Seguro de Tokens JWT / Sesiones
- **Cookies HTTP-Only Exclusivas:** Los tokens JWT de sesión se almacenan **únicamente** en cookies de servidor HTTP con los flags:
  - `HttpOnly`: Impide el acceso desde scripts de JavaScript en el navegador.
  - `Secure`: Exige transmisión exclusiva sobre HTTPS.
  - `SameSite=Lax` o `SameSite=Strict`: Protege contra ataques CSRF.
- **Prohibido LocalStorage:** **NUNCA** guardar tokens de acceso JWT, credenciales o tokens de refresco en `localStorage` ni en `sessionStorage`.

### 2.2 Almacenamiento y Cifrado de Contraseñas
- **Algoritmos Robustos:** Obligatorio utilizar `Argon2id` o `bcrypt` con factor de costo mínimo de 12 y sal individual aleatoria (`salt`).
- **Prohibido Hashes Débiles:** Prohibido el uso de MD5, SHA1, SHA256 simple o algoritmos reversibles para passwords.

### 2.3 Control de Acceso Basado en Roles (RBAC) en el Servidor
- **Verificación en el Servidor (Server-Side Authorization):** La validación de roles y permisos debe realizarse obligatoriamente en los middlewares del servidor (`server/middleware/auth.js`) y en las políticas RLS de Supabase (`Row Level Security`), **nunca depender de ocultar botones en el frontend**.
- **Principio de Mínimo Privilegio:** Cada consulta a la base de datos debe validar el `tenant_id` y los permisos del usuario autenticado.

---

## 3. Gestión de Secretos y DevSecOps

### 3.1 Detección Automática de Secretos
- **Cero Credenciales en Código:** Bloqueo automático de llaves de API (`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, passwords de BD, Tokens de AWS/GCP) dentro de cualquier archivo subido a GitHub.
- **Variables de Entorno:** Todas las credenciales deben leerse exclusivamente desde `process.env` o variables de entorno del servidor.
- **Exclusión en `.gitignore`:** Asegurar que los archivos `.env`, `.env.local`, y credenciales privadas estén incluidos en `.gitignore`.

---

## 4. Protección de APIs, Rate Limiting y Validación

### 4.1 Limitación de Tasa (Rate Limiting & Throttling)
- **Middleware de Protección:** Implementar rate limiting por IP/Usuario en todos los endpoints públicos o sensibles (login, registro, recuperación de contraseña, envíos de correo).
- **Límites Recomendados:**
  - Login/Auth: Máximo 5 intentos por minuto por IP.
  - API General: Máximo 100 peticiones por minuto por IP.

### 4.2 Validación Estricta de Esquemas (Zod / Joi)
- **Validación del Cuerpo (Body) y Parámetros:** Todo endpoint de API debe validar el objeto de entrada con esquemas estrictos de Zod antes de ejecutar cualquier lógica de negocio o consulta a la base de datos.
- **Rechazo de Campos Desconocidos:** Descartar o rechazar atributos no definidos en el esquema (`strip` / `strict`).

### 4.3 Configuración Estricta de CORS
- **Orígenes Autorizados:** Configurar CORS para permitir solicitudes únicamente desde dominios de confianza explícitamente listados en `.env` (`CLIENT_URL`).
- **Prohibido Wildcard en Producción:** Nunca utilizar `Access-Control-Allow-Origin: *` en entornos de producción que manejen datos de sesión o cookies.

---

## 5. Auditoría de Dependencias y Cadena de Suministro

- **Verificación de Vulnerabilidades (CVEs):** Ejecutar `npm audit` al agregar o actualizar paquetes de terceros.
- **Revisión de Seguridad:** Rechazar dependencias obsoletas, no mantenidas o con vulnerabilidades críticas (Severity: High/Critical).

---

## 6. Cabeceras HTTP de Seguridad Obligatorias

Todo middleware de servidor (Express, Vercel Serverless, Helmet) debe inyectar las siguientes cabeceras HTTP de seguridad:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self';
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 1; mode=block
```

---

## 📋 Checklist de Ciberseguridad Pre-Commit

Before outputting code or completing a task, verify:
- [ ] No API keys, passwords or JWT secrets hardcoded.
- [ ] Input data validated with Zod/sanitized on server.
- [ ] Database queries parameterized (No raw string SQL concatenation).
- [ ] JWT session cookies configured with `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- [ ] Server-side RBAC authorization enforced.
- [ ] HTTP Security Headers configured.
- [ ] No vulnerable dependencies introduced.
