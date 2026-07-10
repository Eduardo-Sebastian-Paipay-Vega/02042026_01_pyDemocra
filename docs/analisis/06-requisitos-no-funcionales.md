# Documento 06 — Requisitos No Funcionales
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Seguridad](#1-seguridad)
2. [Rendimiento](#2-rendimiento)
3. [Escalabilidad](#3-escalabilidad)
4. [Disponibilidad y Confiabilidad](#4-disponibilidad-y-confiabilidad)
5. [Mantenibilidad](#5-mantenibilidad)
6. [Usabilidad](#6-usabilidad)
7. [Portabilidad e Interoperabilidad](#7-portabilidad-e-interoperabilidad)
8. [Cumplimiento y Privacidad](#8-cumplimiento-y-privacidad)
9. [Observabilidad y Auditabilidad](#9-observabilidad-y-auditabilidad)
10. [Restricciones de Diseño](#10-restricciones-de-diseño)

---

## 1. Seguridad

---

### RNF-001 — Aislamiento Multi-Tenant

| Campo | Valor |
|-------|-------|
| **ID** | RNF-001 |
| **Nombre** | Aislamiento completo entre tenants |
| **Descripción** | El sistema debe garantizar que ningún usuario pueda acceder a datos de otro tenant. El aislamiento se implementa a dos niveles: (1) nivel de base de datos mediante Row Level Security (RLS) y la función `fn_current_tenant_id()`, y (2) nivel de API mediante `assertTenantScope()` y `applyTenantScope()`. |
| **Categoría** | Seguridad |
| **Criterio de aceptación** | Toda query SQL con datos de negocio tiene políticas RLS activas. El backend rechaza con 403 cualquier petición con `tenant_id` inconsistente. |
| **Prioridad** | Alta — Crítica |
| **Evidencia** | `server/utils/tenant-scope.js`, migraciones `rls_hardening_p0.sql`, `rls_hardening.sql`, `ace_fase3_rls_policies.sql` |

---

### RNF-002 — Autenticación Basada en JWT

| Campo | Valor |
|-------|-------|
| **ID** | RNF-002 |
| **Nombre** | Autenticación basada en JWT de Supabase |
| **Descripción** | Todo acceso a los servicios del backend debe incluir un JWT válido emitido por Supabase Auth. El backend verifica el JWT en cada petición. Los JWTs no se almacenan en el servidor. |
| **Categoría** | Seguridad |
| **Criterio de aceptación** | Peticiones sin JWT o con JWT inválido reciben HTTP 401. Peticiones con JWT válido pero de tenant incorrecto reciben 403. |
| **Prioridad** | Alta |
| **Evidencia** | `server/routes/auth.js`, `server/supabase.js` (uso de `anon` para verificación) |

---

### RNF-003 — Cabeceras de Seguridad HTTP

| Campo | Valor |
|-------|-------|
| **ID** | RNF-003 |
| **Nombre** | Cabeceras HTTP de seguridad |
| **Descripción** | Todas las respuestas HTTP deben incluir cabeceras de seguridad: Content-Security-Policy, X-Frame-Options, X-XSS-Protection, Strict-Transport-Security, etc., configuradas mediante Helmet. |
| **Categoría** | Seguridad |
| **Criterio de aceptación** | Todas las respuestas incluyen las cabeceras de Helmet. |
| **Prioridad** | Alta |
| **Evidencia** | `server/index.js` (helmet()) |

---

### RNF-004 — Rate Limiting de Endpoints

| Campo | Valor |
|-------|-------|
| **ID** | RNF-004 |
| **Nombre** | Limitación de tasa de peticiones |
| **Descripción** | El sistema debe limitar la tasa de peticiones para prevenir ataques de fuerza bruta y denegación de servicio. Límites: (a) General: 100 peticiones/15 min por IP. (b) Autenticación: 5 peticiones/15 min por IP. |
| **Categoría** | Seguridad |
| **Criterio de aceptación** | Al superar el límite, el servidor devuelve HTTP 429 con tiempo de espera. |
| **Prioridad** | Alta |
| **Evidencia** | `server/index.js` líneas 107–149 (generalLimiter, authLimiter) |

---

### RNF-005 — Almacenamiento Seguro de Credenciales Sensibles

| Campo | Valor |
|-------|-------|
| **ID** | RNF-005 |
| **Nombre** | Almacenamiento seguro de credenciales |
| **Descripción** | Los PINs de terminal se almacenan como hashes bcrypt. Los códigos OTP se almacenan como hashes HMAC con pepper (nunca en texto claro). Las variables de entorno sensibles (claves API, secretos) nunca se incluyen en el código fuente. |
| **Categoría** | Seguridad |
| **Criterio de aceptación** | No existe texto claro de PIN u OTP en la base de datos. Los secretos se cargan de variables de entorno. |
| **Prioridad** | Alta |
| **Evidencia** | `server/security/risk-engine.js` (createOtpChallenge, bcrypt.hash), `server/config.js` (process.env.*) |

---

### RNF-006 — Motor de Riesgo y Step-Up Automático

| Campo | Valor |
|-------|-------|
| **ID** | RNF-006 |
| **Nombre** | Evaluación de riesgo y autenticación escalonada |
| **Descripción** | El sistema debe evaluar automáticamente el riesgo de cada acceso web y solicitar autenticación escalonada (OTP) cuando detecta señales de riesgo. Los umbrales son configurables mediante variables de entorno. |
| **Categoría** | Seguridad |
| **Criterio de aceptación** | Los accesos desde IP o dispositivo nuevos activan el flujo OTP. Los accesos bloqueados son registrados en auditoría. |
| **Prioridad** | Alta |
| **Evidencia** | `server/security/risk-engine.js` (evaluateRiskEngine), variables RISK_SCORE_THRESHOLD_* |

---

## 2. Rendimiento

---

### RNF-007 — Tiempo de Respuesta de la API

| Campo | Valor |
|-------|-------|
| **ID** | RNF-007 |
| **Nombre** | Tiempo de respuesta aceptable de la API |
| **Descripción** | Los endpoints de la API Express deben responder en menos de 2 segundos para el percentil 95 de peticiones bajo carga normal. Los endpoints de auditoría y reportes complejos pueden tomar hasta 5 segundos. |
| **Categoría** | Rendimiento |
| **Criterio de aceptación** | P95 < 2s para endpoints CRUD estándar. P95 < 5s para reportes y auditoría. |
| **Prioridad** | Media |
| **Evidencia** | No hay SLA explícito en el código; se infiere de las restricciones de Vercel (funciones serverless con timeout configurable) y el uso de índices en la BD. |

---

### RNF-008 — Paginación en Listados

| Campo | Valor |
|-------|-------|
| **ID** | RNF-008 |
| **Nombre** | Paginación obligatoria en listados |
| **Descripción** | Todos los endpoints de listado deben soportar paginación mediante page y pageSize para evitar la carga de conjuntos de datos muy grandes. El pageSize máximo debe ser razonable (≤ 500). |
| **Categoría** | Rendimiento |
| **Criterio de aceptación** | Todos los interfaces de listado incluyen campos page, pageSize y total en su tipo de respuesta. |
| **Prioridad** | Alta |
| **Evidencia** | `resources/types.ts` (InventoryItemsFilters, FinancialTransactionsFilters: page, pageSize), `admission/types.ts` (AdmissionFilters: page, pageSize) |

---

### RNF-009 — Índices de Base de Datos

| Campo | Valor |
|-------|-------|
| **ID** | RNF-009 |
| **Nombre** | Índices optimizados para consultas frecuentes |
| **Descripción** | Las tablas con mayor volumen de datos deben tener índices en columnas usadas frecuentemente en filtros: tenant_id, user_id, created_at, status/state. Las políticas RLS deben aprovechar los índices existentes. |
| **Categoría** | Rendimiento |
| **Criterio de aceptación** | Las consultas con filtro por tenant_id utilizan índices. Las políticas RLS no generan seq-scans en tablas grandes. |
| **Prioridad** | Alta |
| **Evidencia** | Migración `20260510220000_ace_fase4_optimization.sql` (fase de optimización ACE) |

---

## 3. Escalabilidad

---

### RNF-010 — Arquitectura Stateless del Backend

| Campo | Valor |
|-------|-------|
| **ID** | RNF-010 |
| **Nombre** | Backend stateless para escalabilidad horizontal |
| **Descripción** | El servidor Express no debe almacenar estado local entre peticiones. Todo el estado de sesión y datos transaccionales reside en Supabase. Esto permite escalar horizontalmente sin coordinación entre instancias. |
| **Categoría** | Escalabilidad |
| **Criterio de aceptación** | No existe almacenamiento en memoria de datos de sesión o tenant en el servidor. Las sesiones se verifican consultando la BD en cada petición. |
| **Prioridad** | Alta |
| **Evidencia** | `server/index.js` (sin estado en memoria), `api/server.js` (despliegue como función Vercel) |

---

### RNF-011 — Aislamiento de Tenants a Nivel de Base de Datos

| Campo | Valor |
|-------|-------|
| **ID** | RNF-011 |
| **Nombre** | Escalabilidad del modelo multi-tenant |
| **Descripción** | El modelo multi-tenant con RLS en una única base de datos PostgreSQL debe soportar la operación simultánea de múltiples organizaciones sin degradación significativa de rendimiento. |
| **Categoría** | Escalabilidad |
| **Criterio de aceptación** | El tiempo de respuesta no se degrada más de un 20% con 10 tenants activos simultáneamente comparado con 1 tenant. |
| **Prioridad** | Media |
| **Evidencia** | Arquitectura Supabase con PostgreSQL 16 y conexión pooling; políticas RLS con índices optimizados. |

---

## 4. Disponibilidad y Confiabilidad

---

### RNF-012 — Disponibilidad del Servicio

| Campo | Valor |
|-------|-------|
| **ID** | RNF-012 |
| **Nombre** | Alta disponibilidad del servicio |
| **Descripción** | El sistema debe tener una disponibilidad del 99.5% mensual. La infraestructura en Vercel y Supabase proporciona redundancia y failover automático. |
| **Categoría** | Disponibilidad |
| **Criterio de aceptación** | Máximo 3.6 horas de downtime mensual. |
| **Prioridad** | Alta |
| **Evidencia** | `vercel.json` (configuración de despliegue), dependencia de SLAs de Supabase y Vercel. |

---

### RNF-013 — Operaciones Atómicas Críticas

| Campo | Valor |
|-------|-------|
| **ID** | RNF-013 |
| **Nombre** | Atomicidad en operaciones críticas |
| **Descripción** | Las operaciones que modifican múltiples tablas (bootstrap-tenant, conversión de candidato a voluntario, creación de movimientos de inventario) deben ejecutarse en transacciones atómicas. Si algún paso falla, toda la operación debe revertirse. |
| **Categoría** | Confiabilidad |
| **Criterio de aceptación** | No existen registros parciales tras un error en operaciones compuestas. |
| **Prioridad** | Alta |
| **Evidencia** | `server/routes/onboarding.js` (fn_bootstrap_tenant como función SQL transaccional) |

---

### RNF-014 — Idempotencia en Operaciones Críticas

| Campo | Valor |
|-------|-------|
| **ID** | RNF-014 |
| **Nombre** | Idempotencia en bootstrap y operaciones de registro |
| **Descripción** | Las operaciones de bootstrap de tenant y registro de candidatos con código deben ser idempotentes: ejecutarlas múltiples veces con los mismos parámetros no debe crear duplicados ni errores. |
| **Categoría** | Confiabilidad |
| **Criterio de aceptación** | Ejecutar bootstrap-tenant dos veces con el mismo usuario devuelve el mismo tenant_id. |
| **Prioridad** | Alta |
| **Evidencia** | `server/routes/onboarding.js` (fn_bootstrap_tenant idempotente), RN-003 |

---

## 5. Mantenibilidad

---

### RNF-015 — Migraciones Versionadas de Base de Datos

| Campo | Valor |
|-------|-------|
| **ID** | RNF-015 |
| **Nombre** | Control de versiones de esquema de BD |
| **Descripción** | Todos los cambios al esquema de la base de datos deben realizarse mediante archivos de migración versionados con timestamp. No se permiten cambios directos al esquema en producción sin archivo de migración. |
| **Categoría** | Mantenibilidad |
| **Criterio de aceptación** | Todos los objetos de BD tienen su origen en un archivo de migración versionado. |
| **Prioridad** | Alta |
| **Evidencia** | `supabase/migrations/` (11 archivos con timestamp), `ONG/supabase/migrations/` |

---

### RNF-016 — Separación de Concerns y Arquitectura Modular

| Campo | Valor |
|-------|-------|
| **ID** | RNF-016 |
| **Nombre** | Arquitectura modular del frontend |
| **Descripción** | El frontend debe estar organizado en módulos independientes con sus propios tipos, servicios y hooks. Cada módulo de negocio (admission, people, projects, resources, etc.) debe ser autocontenido. |
| **Categoría** | Mantenibilidad |
| **Criterio de aceptación** | Cada módulo tiene su directorio con types.ts, serviceX.ts y hooks/. Los módulos no importan directamente de otros módulos (solo del shared/). |
| **Prioridad** | Alta |
| **Evidencia** | `src/modules/ong/app/modules/` (estructura consistente en todos los módulos) |

---

### RNF-017 — Tipado Estático Completo

| Campo | Valor |
|-------|-------|
| **ID** | RNF-017 |
| **Nombre** | Cobertura de tipado TypeScript |
| **Descripción** | Todo el código del frontend debe usar TypeScript con tipado estático. Los tipos de dominio deben estar definidos explícitamente en archivos types.ts. No se permiten tipos `any` sin justificación. |
| **Categoría** | Mantenibilidad |
| **Criterio de aceptación** | El proyecto compila sin errores de TypeScript. Los tipos de dominio están en archivos types.ts. |
| **Prioridad** | Alta |
| **Evidencia** | `tsconfig.json`, tipos en `src/modules/ong/app/modules/*/types.ts` |

---

## 6. Usabilidad

---

### RNF-018 — Mensajes de Error Interpretables

| Campo | Valor |
|-------|-------|
| **ID** | RNF-018 |
| **Nombre** | Mensajes de error claros para el usuario final |
| **Descripción** | Los errores técnicos de la base de datos y la API deben ser traducidos a mensajes interpretables por el usuario. El frontend cuenta con un traductor de errores. |
| **Categoría** | Usabilidad |
| **Criterio de aceptación** | El usuario no ve mensajes de error SQL ni stacks de excepción. Los errores tienen contexto comprensible. |
| **Prioridad** | Alta |
| **Evidencia** | `src/shared/error-explainer.js` |

---

### RNF-019 — Accesibilidad con Radix UI

| Campo | Valor |
|-------|-------|
| **ID** | RNF-019 |
| **Nombre** | Componentes de interfaz accesibles |
| **Descripción** | Los componentes de interfaz de usuario deben cumplir con estándares básicos de accesibilidad (ARIA labels, navegación por teclado, contraste de colores) mediante el uso de Radix UI. |
| **Categoría** | Usabilidad |
| **Criterio de aceptación** | Los componentes de Radix UI proveen roles ARIA correctos y soporte de teclado. |
| **Prioridad** | Media |
| **Evidencia** | `package.json` (dependencias @radix-ui/*) |

---

### RNF-020 — Interfaz Responsive

| Campo | Valor |
|-------|-------|
| **ID** | RNF-020 |
| **Nombre** | Diseño responsive para múltiples dispositivos |
| **Descripción** | La interfaz del sistema debe ser funcional y estéticamente aceptable en dispositivos de escritorio (≥1024px) y tablets (≥768px). El soporte de móviles es secundario para la app web principal. |
| **Categoría** | Usabilidad |
| **Criterio de aceptación** | La aplicación no presenta desbordamiento ni elementos superpuestos en pantallas de 768px de ancho o mayor. |
| **Prioridad** | Media |
| **Evidencia** | `docs/mobile/` (existe una carpeta de documentación móvil), Tailwind CSS con clases responsive |

---

## 7. Portabilidad e Interoperabilidad

---

### RNF-021 — API REST con OpenAPI

| Campo | Valor |
|-------|-------|
| **ID** | RNF-021 |
| **Nombre** | API documentada con OpenAPI 3.0 |
| **Descripción** | La API del backend debe estar documentada en formato OpenAPI 3.0 y ser accesible interactivamente a través de Swagger UI en `/api/docs`. |
| **Categoría** | Interoperabilidad |
| **Criterio de aceptación** | El endpoint `/api/docs` muestra la documentación Swagger. El archivo `openapi.yaml` está sincronizado con los endpoints implementados. |
| **Prioridad** | Media |
| **Evidencia** | `server/index.js` (swagger-ui-express), `docs/api/openapi.yaml` |

---

### RNF-022 — Independencia de Navegador

| Campo | Valor |
|-------|-------|
| **ID** | RNF-022 |
| **Nombre** | Compatibilidad con navegadores modernos |
| **Descripción** | La aplicación frontend debe funcionar correctamente en las últimas versiones de Chrome, Firefox, Safari y Edge. No se requiere soporte para Internet Explorer. |
| **Categoría** | Portabilidad |
| **Criterio de aceptación** | La aplicación se ejecuta sin errores en Chrome 120+, Firefox 120+, Safari 17+ y Edge 120+. |
| **Prioridad** | Media |
| **Evidencia** | Inferido del uso de Vite 6 + React 18 (tecnologías modernas sin polyfills legacy). |

---

## 8. Cumplimiento y Privacidad

---

### RNF-023 — Protección de Datos Personales y Sensibles

| Campo | Valor |
|-------|-------|
| **ID** | RNF-023 |
| **Nombre** | Trazabilidad en acceso a datos sensibles |
| **Descripción** | Todo acceso a datos de salud (datos médicos de voluntarios y beneficiarios) debe ser auditado automáticamente registrando: actor, motivo, IP, user agent y timestamp. El motivo de acceso es obligatorio. |
| **Categoría** | Cumplimiento / Privacidad |
| **Criterio de aceptación** | Existe al menos un registro en la tabla de log sensible por cada acceso a datos médicos. El campo accessReason es requerido. |
| **Prioridad** | Alta |
| **Evidencia** | `people/types.ts` (accessReason, SensitiveAccessLogRow), RN-010 |

---

### RNF-024 — Retención de Datos con Período de Recuperación

| Campo | Valor |
|-------|-------|
| **ID** | RNF-024 |
| **Nombre** | Período de retención de datos eliminados |
| **Descripción** | Los datos eliminados de forma lógica deben mantenerse en el sistema durante un período de retención configurable, durante el cual pueden ser recuperados. Después del período, pueden ser purgados definitivamente. |
| **Categoría** | Cumplimiento |
| **Criterio de aceptación** | Los registros eliminados lógicamente aparecen en la vista de retención dentro del período. Pasado el período, no son recuperables. |
| **Prioridad** | Media |
| **Evidencia** | `governance/types.ts` (GovernanceRetentionRow, GovernanceRestoreInput) |

---

### RNF-025 — Validación de Organización por RUC

| Campo | Valor |
|-------|-------|
| **ID** | RNF-025 |
| **Nombre** | Cumplimiento regulatorio peruano (SUNAT) |
| **Descripción** | El sistema debe validar el RUC de cada organización contra SUNAT antes de su registro, garantizando que solo organizaciones legalmente constituidas y activas operen en la plataforma. |
| **Categoría** | Cumplimiento Legal |
| **Criterio de aceptación** | No existe ningún tenant registrado con RUC inactivo o no habido. |
| **Prioridad** | Alta |
| **Evidencia** | `server/routes/onboarding.js` (validate-ruc), RN-002 |

---

## 9. Observabilidad y Auditabilidad

---

### RNF-026 — Auditoría Completa por Triggers de BD

| Campo | Valor |
|-------|-------|
| **ID** | RNF-026 |
| **Nombre** | Trazabilidad de todas las operaciones en BD |
| **Descripción** | Todas las operaciones de INSERT, UPDATE y DELETE en tablas de negocio deben ser registradas automáticamente en la tabla audit_logs mediante triggers de base de datos. El registro incluye: tabla, esquema, operación, actor, valores before/after y timestamp. |
| **Categoría** | Auditabilidad |
| **Criterio de aceptación** | Cada cambio en una tabla de negocio genera exactamente un registro en audit_logs. |
| **Prioridad** | Alta |
| **Evidencia** | `server/security/audit.js`, `governance/types.ts` (GovernanceAuditEvent con schemaName, tableName, operation, actorId, payloadBefore, payloadAfter) |

---

### RNF-027 — Log de Eventos de Autenticación

| Campo | Valor |
|-------|-------|
| **ID** | RNF-027 |
| **Nombre** | Registro completo de eventos de autenticación |
| **Descripción** | Todos los intentos de autenticación (éxito, fallo, OTP, terminal, bloqueo) deben registrarse en la tabla auth_events con: tipo de evento, resultado, nivel de riesgo, IP, user agent, razones del riesgo y metadata relevante. |
| **Categoría** | Auditabilidad |
| **Criterio de aceptación** | Cada intento de autenticación tiene un registro en auth_events. |
| **Prioridad** | Alta |
| **Evidencia** | `server/security/risk-engine.js` (createAuthEvent, tabla auth_events), `server/routes/auth.js` |

---

### RNF-028 — Métricas de Seguridad Calculadas

| Campo | Valor |
|-------|-------|
| **ID** | RNF-028 |
| **Nombre** | Métricas operativas de seguridad |
| **Descripción** | El sistema debe calcular y exponer métricas de los últimos 7 días: tasa de éxito en autenticación, tasa de fallos de PIN, frecuencia de step-up, sesiones concurrentes, y flags de actividad sospechosa. |
| **Categoría** | Observabilidad |
| **Criterio de aceptación** | El endpoint GET /api/audit/metrics devuelve métricas coherentes con los datos en auth_events y sessions. |
| **Prioridad** | Media |
| **Evidencia** | `server/routes/audit.js` (GET /api/audit/metrics) |

---

## 10. Restricciones de Diseño

---

### RNF-029 — Supabase como Único Backend de Base de Datos

| Campo | Valor |
|-------|-------|
| **ID** | RNF-029 |
| **Nombre** | Restricción: Supabase como motor de datos |
| **Descripción** | El sistema está diseñado exclusivamente para operar con Supabase (PostgreSQL 16) como motor de base de datos. No se soportan otros motores de base de datos. |
| **Categoría** | Restricción |
| **Prioridad** | Alta |
| **Evidencia** | `server/supabase.js` (createClient), `src/modules/ong/supabaseClient.ts`, uso de RLS, funciones PL/pgSQL, Edge Functions y Supabase Storage |

---

### RNF-030 — No ORM — Queries Directas con supabase-js

| Campo | Valor |
|-------|-------|
| **ID** | RNF-030 |
| **Nombre** | Restricción: Sin ORM |
| **Descripción** | El sistema no utiliza un ORM (como Prisma o TypeORM). Todas las consultas a la base de datos se realizan directamente a través del SDK `@supabase/supabase-js` o mediante funciones RPC de PostgreSQL. |
| **Categoría** | Restricción |
| **Prioridad** | Media |
| **Evidencia** | No existe dependencia de ORM en package.json. Las consultas usan `.from()`, `.select()`, `.rpc()` de supabase-js. |

---

### RNF-031 — Despliegue en Vercel como Plataforma de Hosting

| Campo | Valor |
|-------|-------|
| **ID** | RNF-031 |
| **Nombre** | Restricción: Vercel como plataforma de despliegue |
| **Descripción** | El sistema está diseñado para ser desplegado en Vercel. El servidor Express corre como función serverless en Vercel mediante el adaptador `api/server.js`. El frontend se sirve como sitio estático de Vite. |
| **Categoría** | Restricción |
| **Prioridad** | Alta |
| **Evidencia** | `vercel.json` (configuración de rutas y rewrites), `api/server.js` (export default app) |

---

### RNF-032 — Separación entre App Principal y ONG Legacy

| Campo | Valor |
|-------|-------|
| **ID** | RNF-032 |
| **Nombre** | Restricción: Convivencia de dos versiones ONG |
| **Descripción** | El repositorio contiene dos implementaciones del módulo ONG: (a) `src/modules/ong/` — versión integrada con soporte ACE (actual), y (b) `ONG/` — versión legacy independiente (en proceso de consolidación). No se deben mezclar sus dependencias ni bases de código. |
| **Categoría** | Restricción |
| **Prioridad** | Alta |
| **Evidencia** | `docs/ong/arquitectura-funcional/00-sincronizacion-post-migracion.md`, `ONG/AGENTS.md`, estructura del repositorio |

---

*Documento generado mediante análisis exhaustivo del repositorio Democra. Fecha: 2026-07-09.*
