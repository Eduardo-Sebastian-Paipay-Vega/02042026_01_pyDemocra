# Contexto del Proyecto — Democra
> **Fase 1 | Descubrimiento** | Versión 1.0.0 | 2026-07-09

---

## 1. Identificación del Sistema

| Campo | Valor |
|-------|-------|
| **Nombre** | Democra |
| **Tipo** | Plataforma SaaS multi-tenant de gobernanza con IA para ONGs |
| **Estado** | Producción activa |
| **Repositorio** | `d:\PROYECTO\Democra(git)` |
| **Versión analizada** | HEAD (2026-07-09) |

---

## 2. Propósito

Democra centraliza la gestión operativa, administrativa y de gobernanza de organizaciones sin fines de lucro (ONGs) en una plataforma SaaS multi-tenant segura. Permite a múltiples organizaciones operar de forma aislada e independiente sobre una infraestructura compartida.

---

## 3. Problemas que Resuelve

| # | Problema de la ONG sin sistema | Solución en Democra |
|---|-------------------------------|---------------------|
| 1 | Gestión manual de voluntarios en Excel | Módulo de Personas con CRUD completo |
| 2 | Sin proceso estructurado de admisión | Módulo de Admisión con FSM de estados |
| 3 | Sin control de inventario | Módulo de Recursos con kardex |
| 4 | Sin trazabilidad financiera | Módulo de Finanzas con aprobación de egresos |
| 5 | Sin auditoría de cambios | Triggers universales + API de auditoría |
| 6 | Sin control de acceso granular | IAM + ACE Engine |
| 7 | Datos médicos sin protección | Acceso auditado con motivo obligatorio |
| 8 | Sin credenciales digitales para voluntarios | Carnets digitales con QR |

---

## 4. Stakeholders Principales

| Actor | Rol | Interés principal |
|-------|-----|-------------------|
| Owner/Administrador | Gestión global del tenant | Control total, auditoría, configuración |
| Coordinador / Gestor ONG | Operación diaria | Gestión de personas, proyectos y recursos |
| Voluntario con acceso | Participación activa | Ver sus datos, registrar horas y evidencias |
| Candidato a Voluntario | Proceso de admisión | Autoregistro y seguimiento de su solicitud |
| Beneficiario | Población atendida | Recibir servicios de la ONG |
| Auditor | Gobernanza | Trazabilidad y cumplimiento |
| Plataforma Democra | Proveedor del servicio | Planes, facturación, soporte |

---

## 5. Contexto Tecnológico

### Frontend
- React 18 + TypeScript + Vite 6
- Radix UI (componentes accesibles)
- Tailwind CSS
- @supabase/supabase-js (acceso directo a BD en módulos ONG)

### Backend API
- Node.js 20 + Express 5
- Supabase Admin Client (service_role)
- Helmet + express-rate-limit
- swagger-ui-express (documentación OpenAPI)
- Resend (envío de emails OTP)

### Base de Datos
- Supabase (PostgreSQL 16)
- Row Level Security (RLS) en todas las tablas de negocio
- Trigger universal de auditoría
- Edge Functions (Supabase Deno)
- Supabase Storage (archivos, fotos, evidencias)

### Despliegue
- Vercel (serverless functions + CDN)
- GitHub (GitOps)

### Servicios Externos
- SUNAT / API RUC (validación fiscal peruana)
- Resend (emails transaccionales OTP y notificaciones)

---

## 6. Restricciones del Negocio

| Restricción | Detalle |
|-------------|---------|
| Validación RUC | Solo organizaciones ACTIVAS y HABIDAS en SUNAT pueden registrarse |
| Aislamiento de tenants | Ningún usuario puede acceder a datos de otro tenant |
| Acceso a datos médicos | Requiere permiso específico y registro obligatorio del motivo de acceso |
| Roles de sistema | Los roles `is_system_role=true` no pueden modificarse ni eliminarse |
| Idempotencia del bootstrap | Crear un tenant dos veces devuelve el mismo tenant_id |

---

## 7. Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| Onboarding | Registro de organización con validación SUNAT y bootstrap multi-tenant |
| Autenticación y Seguridad | Motor de riesgo propio, MFA/OTP, login por terminal con PIN |
| IAM | Roles, permisos y asignaciones usuario-rol-sede |
| Sedes | Gestión de unidades geográficas u operativas |
| Personas — Voluntarios | CRUD con perfil completo, habilidades, documentos y carnets |
| Personas — Beneficiarios | CRUD con perfiles diferenciados (general, infantil, adulto mayor) |
| Admisión | Proceso completo de incorporación de voluntarios con FSM |
| Proyectos | Proyectos, tareas y actividades con asignaciones |
| Operación | Asistencia, horas de voluntariado y evidencias de campo |
| Recursos — Inventario | Artículos, ubicaciones, movimientos y kardex |
| Recursos — Finanzas | Cuentas, categorías, transacciones y workflow de aprobación |
| Notificaciones | Plantillas multicanal e historial de envíos |
| Gobernanza | Auditoría forense, catálogos, restricciones de acceso y retención |
| ACE Engine | Motor de autorización contextual (módulo, campo, membresía) |

---

## 8. Referencias

- Análisis completo: [`docs/analisis/01-analisis-del-sistema.md`](../../../../docs/analisis/01-analisis-del-sistema.md)
- Actores: [`docs/analisis/02-actores.md`](../../../../docs/analisis/02-actores.md)
- Documentación ONG: [`docs/ong/modulos-de-trabajo/`](../../../../docs/ong/modulos-de-trabajo/)
- API OpenAPI: [`docs/api/openapi.yaml`](../../../../docs/api/openapi.yaml)
