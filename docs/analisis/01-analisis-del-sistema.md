# Documento 01 — Análisis del Sistema
## Democra — Plataforma SaaS Multi-Tenant de Gobernanza para ONGs

---

## Tabla de Contenidos

1. [Propósito](#1-propósito)
2. [Alcance](#2-alcance)
3. [Objetivo del Sistema](#3-objetivo-del-sistema)
4. [Módulos Encontrados](#4-módulos-encontrados)
5. [Tecnologías](#5-tecnologías)
6. [Arquitectura](#6-arquitectura)
7. [Dependencias](#7-dependencias)
8. [Estructura del Proyecto](#8-estructura-del-proyecto)
9. [Reglas del Negocio](#9-reglas-del-negocio)
10. [Entidades Principales](#10-entidades-principales)
11. [Procesos Principales](#11-procesos-principales)
12. [Procesos Secundarios](#12-procesos-secundarios)

---

## 1. Propósito

**Democra** es una plataforma SaaS (Software as a Service) multi-tenant de gobernanza democrática con IA, diseñada para ONGs (Organizaciones No Gubernamentales) y organizaciones similares. Proporciona herramientas integradas para votaciones, deliberación, gestión de voluntariado, gestión de personas (beneficiarios y voluntarios), gestión de proyectos y actividades, control de recursos (inventario y finanzas), admisión de voluntarios, comunicaciones y toma de decisiones en tiempo real.

**Evidencia:** `README.md` línea 3.

---

## 2. Alcance

| Área | Descripción |
|------|-------------|
| **Registro y Onboarding** | Alta de organizaciones (tenants) con validación fiscal (RUC/SUNAT) |
| **Autenticación y Seguridad** | Login web con evaluación de riesgo, MFA/OTP por email, login por terminal con PIN |
| **Gestión de Personas** | Registro, seguimiento de voluntarios y beneficiarios (incluye perfiles médicos sensibles) |
| **Admisión de Voluntarios** | Flujo: solicitud → entrevista → aprobación → onboarding → conversión |
| **Proyectos y Tareas** | Gestión de proyectos, tareas, actividades y asignaciones |
| **Operación** | Registro de asistencia, horas de voluntariado y evidencias |
| **Recursos** | Inventario y gestión financiera (cuentas, transacciones, comprobantes) |
| **Notificaciones** | Plantillas configurables multicanal e historial |
| **Gobernanza** | Auditoría forense, catálogos, restricciones de acceso, retención |
| **Configuración IAM** | Roles, permisos, asignaciones usuario-rol-sede, sesiones, dispositivos, terminales |
| **ACE** | Motor de vínculos de acceso, membresías contextuales y formularios dinámicos |

**Fuera del alcance actual:** Pipeline CI/CD, pruebas E2E, módulo de votaciones/deliberación completo.

---

## 3. Objetivo del Sistema

Permitir que organizaciones sin fines de lucro gestionen de manera centralizada, segura y trazable su membresía, proyectos, recursos y procesos institucionales bajo un modelo multi-tenant donde cada organización opera completamente aislada mediante Row Level Security (RLS) de PostgreSQL.

---

## 4. Módulos Encontrados

### 4.1 Backend (API Express — `server/`)

| ID | Módulo | Ruta API | Archivo |
|----|--------|----------|---------|
| MOD-BE-01 | Autenticación y MFA | `/api/auth` | `server/routes/auth.js` |
| MOD-BE-02 | IAM (Roles y Permisos) | `/api/iam` | `server/routes/iam.js` |
| MOD-BE-03 | Onboarding / Bootstrap Tenant | `/api/onboarding` | `server/routes/onboarding.js` |
| MOD-BE-04 | Sedes | `/api/sedes` | `server/routes/sedes.js` |
| MOD-BE-05 | Auditoría y Métricas | `/api/audit`, `/api/security` | `server/routes/audit.js` |
| MOD-BE-06 | Motor de Riesgo | Interno | `server/security/risk-engine.js` |
| MOD-BE-07 | Cliente de IA Forense | Interno | `server/security/ai-client.js` |
| MOD-BE-08 | Envío de OTP | Interno | `server/services/otp-mailer.js` |

### 4.2 Frontend ONG (`src/modules/ong/`)

| ID | Módulo | Descripción |
|----|--------|-------------|
| MOD-FE-01 | Home / Dashboard | Panel principal con KPIs y resumen |
| MOD-FE-02 | Operación | Actividades, asistencias, horas de voluntariado y evidencias |
| MOD-FE-03 | Proyectos | Proyectos, tareas, actividades y asignaciones |
| MOD-FE-04 | Personas | Voluntarios, beneficiarios, perfiles médicos y carnets digitales |
| MOD-FE-05 | Aprobaciones | Workflow de aprobación de transacciones financieras |
| MOD-FE-06 | Admisión | Solicitudes, entrevistas, onboarding y conversión |
| MOD-FE-07 | Recursos | Inventario y Finanzas |
| MOD-FE-08 | Gobernanza | Auditoría, catálogos, accesos sensibles, restricciones de rol |
| MOD-FE-09 | Notificaciones | Plantillas multicanal e historial de envíos |
| MOD-FE-10 | Configuración / Seguridad | Usuarios, roles, permisos, sesiones, dispositivos, terminales |

### 4.3 Módulos Transversales

| ID | Módulo | Descripción |
|----|--------|-------------|
| MOD-TX-01 | ACE — Access & Context Engine | Motor de vínculos, membresías, formularios y permisos granulares |
| MOD-TX-02 | Multi-tenant / RLS | Aislamiento por tenant_id con RLS de PostgreSQL |
| MOD-TX-03 | Landing Page | Páginas públicas (`src/pages/landing`, `src/pages/nosotros`) |
| MOD-TX-04 | App ONG independiente | Aplicación legacy (`ONG/`) en consolidación |

---

## 5. Tecnologías

### Frontend
| Tecnología | Uso |
|-----------|-----|
| React 18 + TypeScript | Framework de UI con tipado estático |
| Vite 6 | Bundler y servidor de desarrollo |
| Tailwind CSS 4 | Estilos utilitarios |
| Radix UI | Componentes de accesibilidad |
| React Router 7 | Enrutamiento SPA |

### Backend
| Tecnología | Uso |
|-----------|-----|
| Node.js 20+ / Express 5 | API REST |
| Helmet | Cabeceras de seguridad HTTP |
| express-rate-limit | Limitación de tasa de peticiones |
| swagger-ui-express | Documentación interactiva OpenAPI |

### Base de Datos
| Tecnología | Uso |
|-----------|-----|
| Supabase (PostgreSQL 16) | BaaS con Auth, RLS, Edge Functions, Storage |
| @supabase/supabase-js | SDK cliente sin ORM |
| pgTAP | Framework de pruebas SQL |

### Seguridad
| Componente | Descripción |
|-----------|-------------|
| Supabase Auth | Autenticación base (JWT) |
| Motor de riesgo propio | Evaluación de IP, dispositivo, sesiones activas |
| MFA / OTP por email | Código HMAC 6 dígitos via Resend |
| PIN de terminal | bcrypt con bloqueo por intentos fallidos |

### Infraestructura
| Tecnología | Uso |
|-----------|-----|
| Vercel | Hosting + API serverless |
| Resend | Proveedor de email OTP |

---

## 6. Arquitectura

```
┌────────────────────────────────────────────────────┐
│                  Cliente (Navegador)                │
│  Landing Page (:5173)  |  App ONG (:5173)          │
└───────────────────────┬────────────────────────────┘
                        │ HTTPS / REST
         ┌──────────────┴───────────────┐
         │  Express API (server/)        │
         │  :8787 | /api/*              │
         │  Swagger UI: /api/docs       │
         └──────────────┬───────────────┘
                        │ supabase-js (service_role)
         ┌──────────────┴───────────────┐
         │  Supabase (PostgreSQL 16)    │
         │  Auth + RLS + Edge Functions  │
         │  + Storage                  │
         └──────────────────────────────┘
```

**Multi-tenancy:** Todo dato de negocio tiene `tenant_id`. La función `fn_current_tenant_id()` lo extrae del JWT en todas las políticas RLS. El backend refuerza con `assertTenantScope()` y `applyTenantScope()`.

**Flujo de autenticación:**
1. Usuario hace login en Supabase Auth → obtiene JWT
2. Frontend llama `POST /api/auth/risk-evaluate` con JWT + contexto de dispositivo
3. Motor de riesgo decide: ALLOW | REQUIRE_OTP | BLOCK
4. Si REQUIRE_OTP: verificación por `POST /api/auth/step-up/verify-otp`
5. Sesión activa en tabla `sessions`

---

## 7. Dependencias Externas Críticas

| Dependencia | Propósito | Criticidad |
|------------|-----------|------------|
| Supabase | BD + Auth + Storage | **CRÍTICA** |
| Resend API | Envío de emails OTP | **ALTA** |
| API RUC/SUNAT | Validación fiscal de organizaciones | **ALTA** |
| Vercel | Hosting y serverless | **ALTA** |

---

## 8. Estructura del Proyecto

```
Democra(git)/
├── src/                     # App principal React + Vite (:5173)
│   ├── pages/landing/       # Landing pública
│   ├── pages/nosotros/      # Página corporativa
│   ├── pages/login/         # Login
│   └── modules/ong/         # Módulo ONG integrado (con soporte ACE)
│       └── app/modules/
│           ├── admission/   # Admisión de voluntarios
│           ├── governance/  # Gobernanza y auditoría
│           ├── home/        # Dashboard
│           ├── notifications/ # Notificaciones
│           ├── operation/   # Operación (actividades, horas)
│           ├── people/      # Personas (voluntarios, beneficiarios)
│           ├── projects/    # Proyectos y tareas
│           ├── resources/   # Inventario y finanzas
│           └── settings/    # Configuración IAM y seguridad
├── server/                  # API Express (:8787)
│   ├── routes/              # auth, iam, onboarding, sedes, audit
│   ├── security/            # risk-engine, audit, ai-client
│   ├── middleware/          # financial-state
│   ├── services/            # otp-mailer
│   └── utils/               # security, http, tenant-scope
├── supabase/migrations/     # 11 migraciones versionadas
├── ONG/                     # App ONG independiente (legacy)
├── api/server.js            # Entry point Vercel
├── docs/                    # Documentación técnica y funcional
└── scripts/                 # Scripts de desarrollo
```

---

## 9. Reglas del Negocio

| ID | Regla | Evidencia |
|----|-------|-----------|
| RN-001 | Multi-tenancy estricto: aislamiento total por tenant_id + RLS | `server/utils/tenant-scope.js`, migraciones RLS |
| RN-002 | Para onboarding: RUC debe ser ACTIVO y HABIDO en SUNAT | `server/routes/onboarding.js` líneas 173–187 |
| RN-003 | Bootstrap de tenant es idempotente (si ya existe, devuelve el existente) | `server/routes/onboarding.js` comentario línea 209 |
| RN-004 | Roles del sistema (`is_system_role=true`) no pueden editarse ni eliminarse | `server/routes/iam.js` líneas 142, 172 |
| RN-005 | Tras MAX_PIN_ATTEMPTS fallos, bloqueo por PIN_BLOCK_MINUTES minutos | `server/routes/auth.js` líneas 480–532 |
| RN-006 | Todo login web pasa por motor de riesgo (ALLOW/REQUIRE_OTP/BLOCK) | `server/security/risk-engine.js` |
| RN-007 | Rate limit: 5 intentos fallidos en 15 min en endpoints de auth | `server/index.js` líneas 127–149 |
| RN-008 | Eliminación de sedes es lógica (soft delete, is_active=false) | `server/routes/sedes.js` líneas 151–155 |
| RN-009 | Acceso a datos médicos requiere motivo de acceso registrado | `people/types.ts`: `accessReason` obligatorio |
| RN-010 | Egresos financieros tienen workflow de aprobación | `resources/types.ts`: `FinancialApprovalKind` |
| RN-011 | Links de acceso ACE tienen cuotas (max_uses) y expiración | Migración `ace_fase0` líneas 60–63 |
| RN-012 | Flujo de admisión: nueva→en_entrevista→aprobada/rechazada | `admission/types.ts`: `AdmissionStateCode` |
| RN-013 | IAM y Sedes bloqueados si hay restricción financiera del tenant | `server/routes/iam.js` y `sedes.js` línea 9 |
| RN-014 | OTP se almacena como hash HMAC con pepper; TTL configurable | `server/security/risk-engine.js`: `createOtpChallenge()` |
| RN-015 | Rate limit general: 100 peticiones/15 min por IP en toda la API | `server/index.js` líneas 107–121 |

---

## 10. Entidades Principales

### Core Multi-Tenant (`public`)
`tenants`, `profiles`, `sedes`, `roles`, `cat_permissions`, `role_permissions`, `user_roles_sedes`, `sessions`, `devices`, `terminals`, `mfa_challenges`, `auth_events`, `audit_logs`, `industry_types`, `plans`, `payment_transactions`

### ACE Engine
`access_links`, `memberships`, `dynamic_forms`, `role_module_access`, `role_field_permissions`

### ONG (esquemas: `ong`, `rrhh`, `clinico`, `comunicaciones`, `auditoria`)
Voluntarios, Beneficiarios, Proyectos, Tareas, Actividades, Asignaciones, Solicitudes de admisión, Entrevistas, Pasos de onboarding, Artículos de inventario, Ubicaciones, Movimientos de inventario, Cuentas financieras, Categorías, Transacciones, Comprobantes, Plantillas de notificación, Historial de notificaciones, Carnets digitales, Restricciones de acceso de rol

---

## 11. Procesos Principales

| ID | Proceso | Descripción |
|----|---------|-------------|
| PP-01 | Registro de Organización | Validación RUC SUNAT → bootstrap tenant + sede + rol Owner |
| PP-02 | Autenticación Web | Login Supabase → evaluación de riesgo → ALLOW/OTP/BLOCK |
| PP-03 | Ciclo de Vida de Voluntarios | Admisión → registro → asignación → operación → credencial |
| PP-04 | Gestión de Proyectos | Proyecto → Tareas → Actividades → Asignaciones → Evidencias |
| PP-05 | Gestión de Recursos | Inventario (artículos, movimientos, stock) + Finanzas (cuentas, transacciones, reportes) |

---

## 12. Procesos Secundarios

| ID | Proceso |
|----|---------|
| PS-01 | Gestión de Sedes (CRUD + soft delete) |
| PS-02 | Gestión IAM (roles, permisos, asignaciones usuario-rol-sede) |
| PS-03 | Auditoría y Gobernanza (logs, IA forense, restricciones de acceso) |
| PS-04 | Gestión de Notificaciones (plantillas + historial) |
| PS-05 | Gestión de Dispositivos y Sesiones |
| PS-06 | Login por Terminal con PIN |
| PS-07 | Generación de Carnets Digitales |
| PS-08 | Administración de Catálogos del Sistema |
| PS-09 | Retención de Datos y Restauración de Registros |
| PS-10 | Vínculos de Acceso ACE (links parametrizados de incorporación) |

---

*Análisis basado en: código fuente, migraciones SQL, tipos TypeScript, rutas Express, archivos de configuración y documentación existente del repositorio.*
