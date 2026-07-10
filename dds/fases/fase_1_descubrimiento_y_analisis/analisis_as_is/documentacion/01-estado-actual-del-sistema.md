# Estado Actual del Sistema — Democra
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

---

## 1. Módulos Activos y Madurez

El sistema cuenta con un amplio conjunto de módulos desplegados en producción. La siguiente tabla resume su estado actual de madurez:

| Módulo | Estado de Madurez | Notas |
|--------|-------------------|-------|
| Onboarding | Maduro | Validación RUC (SUNAT) y bootstrap transaccional implementado. |
| Autenticación | Maduro | Motor de riesgo y MFA operativo. |
| IAM y Sedes | Maduro | Gestión de roles, sedes y asignaciones activa. |
| Personas (Vol./Ben.) | Maduro | Perfiles diferenciados y soporte para datos sensibles implementado. |
| Admisión | Maduro | Flujo FSM y autoregistro por código operativo. |
| Proyectos y Operación | Maduro | Estructura jerárquica y registro de asistencia/horas activo. |
| Recursos (Inventario/Fin.) | Maduro | Movimientos con kardex y workflow de aprobaciones activo. |
| ACE Engine | Maduro | Motor de acceso contextual (Fase 4 completada). |
| Votaciones/Deliberación | No Implementado | Mencionado en requerimientos iniciales (README) pero sin código. |

---

## 2. Arquitectura de Tres Capas

La arquitectura actual sigue un patrón moderno y desacoplado:

1. **Capa de Presentación (Frontend):** 
   - Desarrollada en React 18 con Vite 6 y TypeScript.
   - SPA (Single Page Application) servida estáticamente vía Vercel.
   - Consume directamente la API de Supabase para operaciones de negocio (módulos ONG).

2. **Capa de API (Backend):**
   - Node.js 20 con Express 5, desplegado como función serverless en Vercel.
   - Actúa como middleware de seguridad y operaciones críticas (auth, IAM, onboarding).
   - Utiliza `service_role` key para eludir RLS en operaciones administrativas autorizadas.

3. **Capa de Datos:**
   - Supabase (PostgreSQL 16) centralizado.
   - Políticas RLS robustas que garantizan el aislamiento a nivel de base de datos.
   - Lógica de negocio (como el bootstrap y auditoría) ejecutada vía Triggers y funciones PL/pgSQL.

---

## 3. Modelo Multi-Tenant

El sistema multi-tenant opera de forma rigurosa para garantizar el aislamiento de datos:
- **Nivel de Base de Datos:** Las políticas RLS validan el acceso contra la función `fn_current_tenant_id()`, la cual extrae de forma segura el ID del tenant desde los claims del JWT de autenticación.
- **Nivel de API:** El middleware `assertTenantScope()` asegura que las peticiones del backend operen estrictamente dentro del contexto del tenant autenticado.

---

## 4. Estado de la Seguridad

- **Motor de Riesgo:** Implementación sofisticada que evalúa múltiples variables (IP, dispositivo, velocidad de intentos, concurrencia) para determinar un nivel de riesgo (LOW, MEDIUM, HIGH) e invocar de forma dinámica MFA/OTP si es necesario.
- **Protección Backend:** Helmet para cabeceras HTTP seguras y `express-rate-limit` con configuración de doble capa (límite general y límite estricto para rutas de autenticación).
- **Almacenamiento Seguro:** Claves, PINs de terminales y códigos OTP se almacenan utilizando bcrypt o hashing HMAC con pepper; nunca en texto claro.

---

## 5. Estado de la Base de Datos

La base de datos se encuentra madura y optimizada:
- Se identificaron **11 archivos de migración** documentados secuencialmente.
- El despliegue del ACE Engine (Access & Context Engine) ha alcanzado su **Fase 4** (Optimización y creación de índices).
- Integración de auditoría universal en todas las tablas transaccionales vía Triggers.

---

## 6. Estado de Pruebas (Testing)

Actualmente, el aseguramiento de la calidad automatizado es un punto de mejora:
- **Pruebas de BD:** Existe 1 prueba pgTAP identificada.
- **Pruebas Unitarias:** El entorno `vitest` está configurado, pero no se evidencia una suite exhaustiva de pruebas de integración.
- **Pruebas End-to-End (E2E):** Inexistentes. No hay cobertura con Cypress, Playwright o similar.

---

## 7. Deuda Técnica Actual

1. **Coexistencia de dos codebases ONG:**
   Actualmente el repositorio mantiene `src/modules/ong/` (nueva versión integrada, activa) y la carpeta `ONG/` (versión legacy). No hay un plan documentado de retiro de la versión legacy.
2. **Lógica de negocio expuesta en el Frontend:**
   Los módulos de negocio de la ONG consumen directamente la base de datos vía `@supabase/supabase-js`, omitiendo una capa de API middleware dedicada, lo que centraliza la responsabilidad de validación puramente en las políticas RLS.
3. **Falta de Pruebas Automatizadas:** Ausencia de pruebas E2E e integración.
4. **Documentación de API:** Posible desfase entre `openapi.yaml` y la implementación actual, y omisión de documentación para Supabase Edge Functions.
