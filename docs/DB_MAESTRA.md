# 📂 DOCUMENTACIÓN MAESTRA DE BASE DE DATOS: Democra ONG Platform

> **Versión consolidada:** 2026-05-10 | **Motor:** PostgreSQL 16 (Supabase) | **Autor consolidación:** Claude Sonnet 4.6
>
> Este documento es la **fuente única de verdad** del modelo de datos. Fue generado por ingeniería inversa sobre: scripts SQL maestros, migraciones versionadas, tipos TypeScript `app-database.ts` y auditorías técnicas (AUDIT-02 a AUDIT-08).

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen del Sistema](#1-resumen-del-sistema)
2. [Diccionario de Datos](#2-diccionario-de-datos)
   - 2.1 [Schema `public` — Core Multi-Tenant / IAM / Billing / ACE](#21-schema-public)
   - 2.2 [Schema `ong` — Operaciones de la ONG](#22-schema-ong)
   - 2.3 [Schema `rrhh` — Recursos Humanos / Admisión](#23-schema-rrhh)
   - 2.4 [Schema `finanzas` — Gestión Financiera](#24-schema-finanzas)
   - 2.5 [Schema `clinico` — Fichas Médicas Sensibles](#25-schema-clinico)
   - 2.6 [Schema `academico` — Cursos y Certificados](#26-schema-academico)
   - 2.7 [Schema `comunicaciones` — Notificaciones](#27-schema-comunicaciones)
   - 2.8 [Schema `auditoria` — Bitácora Forense](#28-schema-auditoria)
3. [Lógica Programada y Seguridad](#3-lógica-programada-y-seguridad)
   - 3.1 [Funciones (Stored Procedures / RPCs)](#31-funciones)
   - 3.2 [Triggers](#32-triggers)
   - 3.3 [Row Level Security (RLS) y Políticas](#33-row-level-security-rls)
   - 3.4 [Grants y Permisos por Rol](#34-grants-y-permisos-por-rol)
4. [Script SQL de Despliegue (Single File)](#4-script-sql-de-despliegue)
5. [Registro de Mejoras y Cambios](#5-registro-de-mejoras-y-cambios)
6. [ACE — Arquitectura Técnica y Guía Operativa](#6-ace--arquitectura-técnica-y-guía-operativa)

---

## 1. RESUMEN DEL SISTEMA

**Democra ONG Platform** es un SaaS multi-tenant orientado a la gestión integral de organizaciones sin fines de lucro. Cada organización cliente (*tenant*) opera en aislamiento total gracias a Row Level Security (RLS) en cada tabla.

### Módulos funcionales

| Módulo | Schema | Descripción |
|--------|--------|-------------|
| IAM + Core | `public` | Autenticación, sesiones, roles, permisos, sedes, auditoría forense |
| Suscripciones | `public` | Contratos, facturas, pagos, entitlements por plan |
| ACE — Access & Context Engine | `public` | Links de acceso, membresías contextuales, formularios dinámicos, permisos granulares |
| Operaciones ONG | `ong` | Voluntarios, beneficiarios, proyectos, actividades, asistencias, credenciales ID |
| RRHH / Admisión | `rrhh` | Proceso de admisión lineal, habilidades, documentos, onboarding |
| Finanzas | `finanzas` | Cuentas, transacciones, comprobantes, aprobaciones |
| Clínico | `clinico` | Fichas médicas sensibles, logs de acceso auditado |
| Académico | `academico` | Cursos, inscripciones, notas, certificados |
| Comunicaciones | `comunicaciones` | Historial de notificaciones, plantillas, canales |
| Auditoría | `auditoria` | Bitácora forense inmutable, log de accesos médicos |

### Convenciones globales

- **PK:** `id uuid DEFAULT gen_random_uuid()` en todas las tablas de datos.
- **Timestamps:** `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` + `updated_at` con trigger `fn_set_updated_at()`.
- **Trazabilidad:** `created_by uuid` / `updated_by uuid` → FK a `auth.users(id)` (nullable).
- **Soft-delete:** tablas con borrado lógico usan `is_deleted boolean NOT NULL DEFAULT false`, `deleted_at`, `deleted_by`.
- **Multi-tenancy:** toda tabla de datos lleva `tenant_id uuid NOT NULL` + RLS `tenant_id = fn_current_tenant_id()`.
- **Escala de notas académicas:** vigesimal peruana (0–20).

---

## 2. DICCIONARIO DE DATOS

### 2.1 Schema `public`

#### Catálogos globales (sin tenant_id)

##### `public.cat_industry_types`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Código del tipo de industria (`retail`, `gym`, `health`, `ong`, …) |
| `description` | `text` | — | NOT NULL | Etiqueta legible |
| `created_at` | `timestamptz` | `now()` | NOT NULL | Fecha de inserción del catálogo |

##### `public.cat_plan_types`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Identificador del plan (`basic`, `pro`, `enterprise`) |
| `description` | `text` | — | NOT NULL | Nombre legible del plan |
| `created_at` | `timestamptz` | `now()` | NOT NULL | Fecha de inserción |

##### `public.cat_tenant_statuses`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Estado financiero (`FIN-PENDING`, `FIN-ACTIVE`, `FIN-GRACE`, `FIN-READONLY`, `FIN-SUSPENDED`, `FIN-INCONSISTENT`) |
| `description` | `text` | — | NOT NULL | Descripción del estado |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.cat_subscription_statuses`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Estado de contrato (`PENDING`, `ACTIVE`, `GRACE`, `READONLY`, `SUSPENDED`, `CANCELLED`) |
| `description` | `text` | — | NOT NULL | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.cat_subscription_change_statuses`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Estado FSM de cambio de plan (`CHG-SUBMITTED`, `CHG-AWAITING-CONFIRMATION`, `CHG-APPLIED`, `CHG-FAILED`, `CHG-CONFLICT`) |
| `description` | `text` | — | NOT NULL | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.cat_invoice_statuses`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Estado de factura (`DRAFT`, `ISSUED`, `PAID`, `VOID`, `OVERDUE`) |
| `description` | `text` | — | NOT NULL | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.cat_payment_statuses`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Estado de transacción de pago (`CREATED`, `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `REFUNDED`, `CHARGEBACK`) |
| `description` | `text` | — | NOT NULL | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.cat_permissions`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `text` | — | PK | Código de permiso (ej. `iam.admin`, `ong.voluntarios.write`) |
| `description` | `text` | — | NOT NULL | Descripción funcional |
| `module` | `text` | `'core'` | NOT NULL | Agrupación por módulo |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

> **Nota:** `role_permissions.permission` se valida contra esta tabla vía trigger `tr_validate_role_permissions`. RLS: sólo lectura para `authenticated`; escritura bloqueada desde cliente.

##### `public.cat_generos`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Código ISO/interno del género |
| `nombre` | `text` NOT NULL | Etiqueta legible |

##### `public.cat_paises`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Código ISO-3166 del país |
| `nombre` | `text` NOT NULL | Nombre del país |

##### `public.cat_monedas`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Código ISO-4217 (ej. `PEN`, `USD`) |
| `nombre` | `text` NOT NULL | Nombre de la moneda |
| `simbolo` | `text` NULL | Símbolo tipográfico |

##### `public.cat_tipos_documento`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Código del tipo de documento (`DNI`, `CE`, `PASAPORTE`, …) |
| `nombre` | `text` NOT NULL | Nombre completo |

##### `public.cat_module_statuses`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Estado del módulo por tenant (`active`, `inactive`, `trial`) |
| `nombre` | `text` NOT NULL | Etiqueta legible |

---

#### Core multi-tenant

##### `public.tenants`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | Identificador único del tenant |
| `name` | `text` | — | NOT NULL | Nombre de la organización |
| `tax_id` | `text` | — | NOT NULL, UNIQUE | RUC/NIF fiscal único global |
| `industry_type_id` | `text` | — | NOT NULL, FK `cat_industry_types` | Tipo de industria |
| `plan_id` | `text` | — | NOT NULL, FK `cat_plan_types` | Plan activo |
| `status_financial_id` | `text` | `'FIN-PENDING'` | NOT NULL, FK `cat_tenant_statuses` | Estado financiero/operativo actual |
| `billing_day` | `int` | `1` | NOT NULL, CHECK (1–28) | Día de corte de facturación mensual |
| `max_licenses` | `int` | `1` | NOT NULL, CHECK (≥1) | Límite de licencias concurrentes |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | Actualizado automáticamente |

> **RLS:** Solo lectura al propio tenant. INSERT y DELETE bloqueados; solo se crea vía `fn_bootstrap_tenant()`.

##### `public.sedes`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` ON DELETE CASCADE | Tenant propietario |
| `name` | `text` | — | NOT NULL, UNIQUE(tenant_id, name) | Nombre de la sede |
| `is_active` | `boolean` | `true` | NOT NULL | Estado operativo |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.profiles`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | — | PK, FK `auth.users` ON DELETE CASCADE | 1:1 con usuario de Supabase Auth |
| `tenant_id` | `uuid` | NULL | FK `tenants` ON DELETE SET NULL | Tenant asignado (NULL en onboarding inicial) |
| `full_name` | `text` | NULL | — | Nombre completo |
| `pin_hash` | `text` | NULL | — | Hash del PIN (nunca texto plano) |
| `is_blocked` | `boolean` | `false` | NOT NULL | Bloqueo manual por admin |
| `blocked_reason` | `text` | NULL | — | Motivo del bloqueo |
| `pin_failed_attempts` | `int` | `0` | NOT NULL | Contador de intentos fallidos de PIN |
| `pin_last_failed_at` | `timestamptz` | NULL | — | Último intento fallido |
| `pin_blocked_until` | `timestamptz` | NULL | — | PIN bloqueado hasta esta fecha |
| `risk_blocked_until` | `timestamptz` | NULL | — | Bloqueo por motor de riesgo |
| `tipo_documento` | `text` | NULL | — | Tipo de documento de identidad |
| `numero_documento` | `text` | NULL | — | Número de documento |
| `genero` | `text` | NULL | — | Código de género |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

> **Columnas de seguridad** (`pin_failed_attempts`, `pin_blocked_until`, `risk_blocked_until`) añadidas por migración `20260301120000_ai_security_copilot`.

##### `public.roles`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | Roles son por tenant |
| `name` | `text` | — | NOT NULL, UNIQUE(tenant_id, name) | Nombre del rol |
| `hierarchy_level` | `int` | `100` | NOT NULL | Nivel jerárquico; 0 = máximo poder (Owner) |
| `is_system_role` | `boolean` | `false` | NOT NULL | Roles del sistema no se eliminan |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.role_permissions`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `role_id` | `uuid` | — | PK(part), FK `roles` ON DELETE CASCADE | Rol al que pertenece el permiso |
| `permission` | `text` | — | PK(part) | Código de permiso; validado por trigger contra `cat_permissions` |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.user_roles_sedes`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | Aislamiento multi-tenant |
| `user_id` | `uuid` | — | PK(part), FK `profiles` ON DELETE CASCADE | Usuario asignado |
| `role_id` | `uuid` | — | PK(part), FK `roles` ON DELETE CASCADE | Rol asignado |
| `sede_id` | `uuid` | — | PK(part), FK `sedes` ON DELETE CASCADE | Sede donde aplica el rol |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

> **Hardening (GAP-002):** `tenant_id` fue NOT NULL + FK + RLS estricta (no `with check (true)`) vía migración `20260305110000_rls_hardening_p0`.

##### `public.role_access_constraints`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `role_id` | `uuid` | — | NOT NULL, FK `roles` | Rol restringido |
| `sede_id` | `uuid` | NULL | FK `sedes` | Restricción opcional por sede |
| `ip_cidr` | `cidr` | NULL | — | Rango de IPs permitidas (ej. 192.168.0.0/24) |
| `time_start` | `time` | NULL | — | Inicio de ventana horaria permitida |
| `time_end` | `time` | NULL | — | Fin de ventana horaria permitida |
| `require_trusted_device` | `boolean` | `false` | NOT NULL | Exige dispositivo confiable |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

---

#### IAM Operativo

##### `public.terminals`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `sede_id` | `uuid` | — | NOT NULL, FK `sedes` | Sede donde está el terminal |
| `name` | `text` | — | NOT NULL, UNIQUE(tenant_id, sede_id, name) | Nombre del terminal físico |
| `is_active` | `boolean` | `true` | NOT NULL | — |
| `last_seen_at` | `timestamptz` | NULL | — | Última actividad |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.devices`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `user_id` | `uuid` | NULL | FK `profiles` ON DELETE CASCADE | Usuario propietario del dispositivo |
| `device_fingerprint` | `text` | — | NOT NULL, UNIQUE(tenant_id, device_fingerprint) | Hash/fingerprint del dispositivo |
| `device_type` | `text` | NULL | — | `web`, `mobile`, `terminal` |
| `is_trusted` | `boolean` | `false` | NOT NULL | Marcado como confiable por admin |
| `last_ip` | `inet` | NULL | — | Última IP registrada |
| `last_user_agent` | `text` | NULL | — | Último user-agent |
| `last_seen_at` | `timestamptz` | NULL | — | Última conexión |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.sessions`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `user_id` | `uuid` | NULL | FK `profiles` ON DELETE CASCADE | — |
| `terminal_id` | `uuid` | NULL | FK `terminals` ON DELETE SET NULL | Para sesiones de terminal |
| `device_id` | `uuid` | NULL | FK `devices` ON DELETE SET NULL | — |
| `session_type` | `text` | — | NOT NULL, CHECK (`web`,`terminal`,`api`) | Tipo de sesión |
| `ip` | `inet` | NULL | — | IP de origen |
| `user_agent` | `text` | NULL | — | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `expires_at` | `timestamptz` | — | NOT NULL | Expiración de la sesión |
| `revoked_at` | `timestamptz` | NULL | — | Fecha de revocación (si fue revocada) |
| `revoke_reason` | `text` | NULL | — | Motivo de revocación |

##### `public.auth_events`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `user_id` | `uuid` | NULL | FK `profiles` ON DELETE SET NULL | — |
| `session_id` | `uuid` | NULL | FK `sessions` ON DELETE SET NULL | — |
| `terminal_id` | `uuid` | NULL | FK `terminals` ON DELETE SET NULL | — |
| `device_id` | `uuid` | NULL | FK `devices` ON DELETE SET NULL | — |
| `event_type` | `text` | — | NOT NULL | `PIN_OK`, `PIN_FAIL`, `LOGIN_OK`, `LOGIN_FAIL`, `SESSION_REVOKED`, etc. |
| `result` | `text` | — | NOT NULL, CHECK(`success`,`error`) | Resultado del evento |
| `ip` | `inet` | NULL | — | — |
| `user_agent` | `text` | NULL | — | — |
| `error_code` | `text` | NULL | — | Código de error estructurado |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.mfa_challenges`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `user_id` | `uuid` | — | NOT NULL, FK `profiles` | Usuario que inicia el desafío |
| `channel` | `text` | — | NOT NULL, CHECK(`email_otp`,`app_otp`,`sms_otp`) | Canal de entrega del OTP |
| `risk_level` | `text` | — | NOT NULL, CHECK(`LOW`,`MEDIUM`,`HIGH`) | Nivel de riesgo calculado |
| `otp_hash` | `text` | NULL | — | Hash del OTP (nunca texto plano) |
| `expires_at` | `timestamptz` | — | NOT NULL | Expiración del desafío |
| `verified_at` | `timestamptz` | NULL | — | Fecha de verificación exitosa |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

> Añadida por `20260301120000_ai_security_copilot`.

---

#### Suscripciones y Billing

##### `public.plan_policies`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `plan_id` | `text` | — | PK, FK `cat_plan_types` | Plan de referencia |
| `retention_days` | `int` | `180` | NOT NULL, CHECK(30–3650) | Días de retención de auditoría |
| `max_sedes` | `int` | `1` | NOT NULL, CHECK(≥1) | Máximo de sedes permitidas |
| `max_licenses` | `int` | `1` | NOT NULL, CHECK(≥1) | Máximo de licencias concurrentes |
| `can_use_terminals` | `boolean` | `false` | NOT NULL | Habilita uso de terminales físicos |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

> **Seed:** `basic`(180d,1s,3l), `pro`(365d,5s,30l,terminals), `enterprise`(730d,999s,999l,terminals).

##### `public.subscription_contracts`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants`, UNIQUE | Un contrato activo por tenant |
| `current_plan_id` | `text` | — | NOT NULL, FK `cat_plan_types` | Plan vigente |
| `status_id` | `text` | `'PENDING'` | NOT NULL, FK `cat_subscription_statuses` | Estado FSM del contrato |
| `cycle_start` | `date` | NULL | — | Inicio del ciclo actual |
| `cycle_end` | `date` | NULL | — | Fin del ciclo actual |
| `billing_day` | `int` | `1` | NOT NULL, CHECK(1–28) | Día de corte de cobro |
| `grace_days` | `int` | `7` | NOT NULL, CHECK(0–60) | Días de gracia tras vencimiento |
| `read_only_at` | `timestamptz` | NULL | — | Marca cuando pasa a solo lectura |
| `suspended_at` | `timestamptz` | NULL | — | Marca de suspensión |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.entitlements`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `tenant_id` | `uuid` | — | PK, FK `tenants` | Capacidades efectivas del tenant |
| `plan_id` | `text` | — | NOT NULL, FK `cat_plan_types` | Plan que originó estos entitlements |
| `max_sedes` | `int` | — | NOT NULL | Límite efectivo de sedes |
| `max_licenses` | `int` | — | NOT NULL | Límite efectivo de licencias |
| `can_use_terminals` | `boolean` | — | NOT NULL | — |
| `effective_from` | `timestamptz` | `now()` | NOT NULL | Fecha desde la que aplican |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.subscription_changes`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `from_plan_id` | `text` | — | NOT NULL, FK `cat_plan_types` | Plan origen |
| `to_plan_id` | `text` | — | NOT NULL, FK `cat_plan_types` | Plan destino |
| `status_id` | `text` | `'CHG-SUBMITTED'` | NOT NULL, FK `cat_subscription_change_statuses` | Estado FSM del cambio |
| `requested_by` | `uuid` | NULL | FK `profiles` ON DELETE SET NULL | Usuario solicitante |
| `requested_at` | `timestamptz` | `now()` | NOT NULL | — |
| `idempotency_key` | `text` | NULL | UNIQUE | Garantiza que el mismo cambio no se procese dos veces |
| `notes` | `text` | NULL | — | Notas opcionales |

##### `public.invoices`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `invoice_number` | `text` | NULL | — | Número de factura (asignable después) |
| `status_id` | `text` | `'DRAFT'` | NOT NULL, FK `cat_invoice_statuses` | Estado de la factura |
| `currency` | `text` | `'PEN'` | NOT NULL | Moneda ISO-4217 |
| `subtotal` | `numeric(12,2)` | `0` | NOT NULL | Monto antes de impuestos |
| `tax` | `numeric(12,2)` | `0` | NOT NULL | IGV / impuestos |
| `total` | `numeric(12,2)` | `0` | NOT NULL | Monto total |
| `period_start` | `date` | NULL | — | Inicio del período facturado |
| `period_end` | `date` | NULL | — | Fin del período facturado |
| `issued_at` | `timestamptz` | NULL | — | Fecha de emisión |
| `due_at` | `timestamptz` | NULL | — | Fecha de vencimiento |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.invoice_lines`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `invoice_id` | `uuid` | — | NOT NULL, FK `invoices` ON DELETE CASCADE | Factura padre |
| `description` | `text` | — | NOT NULL | Descripción del ítem facturado |
| `qty` | `int` | `1` | NOT NULL, CHECK(≥1) | Cantidad |
| `unit_price` | `numeric(12,2)` | `0` | NOT NULL | Precio unitario |
| `line_total` | `numeric(12,2)` | `0` | NOT NULL | Total de la línea |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.payment_methods`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `method_type` | `text` | — | NOT NULL, CHECK(`card_token`,`bank_transfer`,`cash`,`other`) | Tipo de método |
| `provider` | `text` | NULL | — | Proveedor (`visa`, `mastercard`, `yape`, `plin`, `manual`) |
| `token_ref` | `text` | NULL | — | Token de pasarela (nunca número completo) |
| `last4` | `text` | NULL | — | Últimos 4 dígitos (referencia visual) |
| `holder_name` | `text` | NULL | — | Nombre del titular |
| `is_default` | `boolean` | `false` | NOT NULL | Método de pago por defecto |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

##### `public.payment_transactions`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `invoice_id` | `uuid` | NULL | FK `invoices` ON DELETE SET NULL | Factura asociada |
| `subscription_change_id` | `uuid` | NULL | FK `subscription_changes` ON DELETE SET NULL | Cambio de plan que origina el pago |
| `status_id` | `text` | `'CREATED'` | NOT NULL, FK `cat_payment_statuses` | Estado de la transacción |
| `currency` | `text` | `'PEN'` | NOT NULL | — |
| `amount` | `numeric(12,2)` | — | NOT NULL, CHECK(≥0) | Monto |
| `payment_method_id` | `uuid` | NULL | FK `payment_methods` ON DELETE SET NULL | — |
| `provider` | `text` | NULL | — | Proveedor de pago externo |
| `external_payment_id` | `text` | NULL | — | ID en la pasarela |
| `external_reference` | `text` | NULL | — | Referencia externa adicional |
| `idempotency_key` | `text` | NULL | UNIQUE | Evita duplicados de pago |
| `created_by` | `uuid` | NULL | FK `profiles` ON DELETE SET NULL | — |
| `raw_payload` | `jsonb` | NULL | — | Payload completo del webhook/respuesta |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |

##### `public.payment_webhook_events`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | NULL | FK `tenants` ON DELETE SET NULL | Puede ser global si no se identifica tenant |
| `provider` | `text` | — | NOT NULL | Proveedor del webhook |
| `event_id` | `text` | — | NOT NULL, UNIQUE(provider, event_id) | ID único del proveedor — garantiza idempotencia |
| `signature_valid` | `boolean` | `false` | NOT NULL | Firma verificada del webhook |
| `received_at` | `timestamptz` | `now()` | NOT NULL | — |
| `processed_at` | `timestamptz` | NULL | — | Fecha de procesamiento exitoso |
| `payload` | `jsonb` | — | NOT NULL | Payload completo del evento |

---

#### Auditoría Core

##### `public.audit_logs`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL | Tenant del evento (requerido) |
| `sede_id` | `uuid` | NULL | — | Sede opcional |
| `actor_id` | `uuid` | NULL | — | Usuario que ejecutó la acción |
| `actor_role_id` | `uuid` | NULL | — | Rol activo en el momento |
| `session_id` | `uuid` | NULL | — | Sesión activa |
| `terminal_id` | `uuid` | NULL | — | Terminal (si aplica) |
| `device_id` | `uuid` | NULL | — | Dispositivo |
| `event_id` | `uuid` | `gen_random_uuid()` | — | UUID de correlación de eventos relacionados |
| `event_type` | `text` | — | NOT NULL | `INSERT`, `UPDATE`, `DELETE`, o custom |
| `resource_name` | `text` | — | NOT NULL | Tabla/recurso afectado |
| `result` | `text` | `'success'` | NOT NULL, CHECK(`success`,`error`) | Resultado |
| `error_code` | `text` | NULL | — | Código de error si aplica |
| `ip` | `inet` | NULL | — | IP del actor |
| `user_agent` | `text` | NULL | — | User-agent |
| `criticality` | `text` | `'medium'` | NOT NULL, CHECK(`low`,`medium`,`high`,`critical`) | Nivel de criticidad |
| `payload_before` | `jsonb` | NULL | — | Estado anterior (UPDATE/DELETE) |
| `payload_after` | `jsonb` | NULL | — | Estado nuevo (INSERT/UPDATE) |
| `retention_until` | `timestamptz` | NULL | — | Fecha de expiración calculada por plan |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |

> **RLS:** Solo lectura para `iam.audit.read` o tenant admin. INSERT/UPDATE/DELETE bloqueados — solo vía trigger `fn_trigger_audit_universal`.

---

#### Módulos del sistema

##### `public.system_modules`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Código único del módulo (`ong`, `rrhh`, `finanzas`, …) |
| `nombre` | `text` NOT NULL | Nombre legible |
| `schema_name` | `text` NOT NULL | Schema de PostgreSQL correspondiente |
| `current_version` | `text` NOT NULL | Versión semántica del módulo |
| `is_core` | `boolean` NOT NULL | Si es parte del núcleo obligatorio |
| `is_transversal` | `boolean` NOT NULL | Si aplica a todos los tenants |
| `created_at` | `timestamptz` NOT NULL | — |

##### `public.tenant_modules`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `tenant_id` | `uuid` PK(part), FK `tenants` | — |
| `module_code` | `text` PK(part), FK `system_modules` | Módulo habilitado |
| `status_code` | `text` FK `cat_module_statuses` | Estado del módulo para este tenant |
| `activated_at` | `timestamptz` NOT NULL | Fecha de activación |
| `created_at` / `updated_at` | `timestamptz` | — |
| `created_by` / `updated_by` | `uuid` NULL | Trazabilidad |

---

#### Access & Context Engine (ACE) — Módulo `ace`

> Implementado en migración `20260510000000_ace_fase0_base_structures.sql`. Provee vinculación inteligente por links, membresías contextuales polimórficas y permisos granulares por módulo y campo. Compatible con el modelo multi-tenant existente (RLS completo en FASE 3).

##### `public.access_links`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` ON DELETE CASCADE | Aislamiento multi-tenant |
| `code` | `text` | — | NOT NULL, UNIQUE | Código único del link (ej. `INV-2026-ABCD`) |
| `slug` | `text` | NULL | — | Slug amigable opcional |
| `type` | `text` | — | NOT NULL, CHECK(`VOLUNTEER_JOIN`,`STAFF_JOIN`,`BENEFICIARY_JOIN`,`GENERIC`) | Tipo de flujo de vinculación |
| `target_type` | `text` | — | NOT NULL, CHECK(`PROJECT`,`PROGRAM`,`ACTIVITY`,`SEDE`,`GLOBAL`) | Entidad destino del link |
| `target_id` | `uuid` | NULL | — | PK de la entidad destino (NULL si `GLOBAL`) |
| `assigned_role_id` | `uuid` | NULL | FK `roles` ON DELETE SET NULL | Rol a asignar automáticamente al unirse |
| `assigned_sede_id` | `uuid` | NULL | FK `sedes` ON DELETE SET NULL | Sede a asignar automáticamente |
| `onboarding_flow` | `text` | NULL | — | ID del flujo de onboarding a ejecutar |
| `max_uses` | `int` | `1` | NOT NULL, CHECK(≥1) | Límite de usos del link |
| `used_count` | `int` | `0` | NOT NULL, CHECK(≥0) | Usos acumulados |
| `expires_at` | `timestamptz` | NULL | — | Expiración (NULL = sin límite) |
| `is_active` | `boolean` | `true` | NOT NULL | Estado del link |
| `metadata` | `jsonb` | `{}` | NOT NULL | Datos adicionales libres |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |
| `created_by` / `updated_by` | `uuid` | NULL | FK `auth.users` ON DELETE SET NULL | Trazabilidad |

> **Índices:** `(tenant_id)`, `(code)`, `(tenant_id, is_active)` WHERE `is_active=true`, `(tenant_id, target_type, target_id)`.

##### `public.memberships`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` ON DELETE CASCADE | — |
| `user_id` | `uuid` | — | NOT NULL, FK `profiles` ON DELETE CASCADE | Usuario miembro |
| `context_type` | `text` | — | NOT NULL, CHECK(`PROYECTO`,`SEDE`,`PROGRAMA`,`ACTIVIDAD`) | Tipo de contexto polimórfico |
| `context_id` | `uuid` | — | NOT NULL | PK del contexto (proyecto, sede, etc.) |
| `role_id` | `uuid` | NULL | FK `roles` ON DELETE SET NULL | Rol efectivo dentro del contexto |
| `status` | `text` | `'active'` | NOT NULL, CHECK(`active`,`inactive`,`pending`) | Estado de la membresía |
| `joined_at` | `timestamptz` | `now()` | NOT NULL | Fecha de ingreso al contexto |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |
| `created_by` | `uuid` | NULL | FK `auth.users` ON DELETE SET NULL | — |

> **UNIQUE:** `(tenant_id, user_id, context_type, context_id)` — un usuario tiene como máximo una membresía activa por contexto.
> **Índices:** `(tenant_id)`, `(tenant_id, user_id)`, `(tenant_id, context_type, context_id)`, `(tenant_id, status)` WHERE `status='active'`.

##### `public.dynamic_forms`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` ON DELETE CASCADE | — |
| `name` | `text` | — | NOT NULL | Nombre descriptivo del formulario |
| `context_type` | `text` | NULL | — | Contexto de uso (ej. `VOLUNTEER_JOIN`, `ADMISSION`) |
| `form_schema` | `jsonb` | `{}` | NOT NULL | JSON Schema para renderizado en frontend |
| `is_active` | `boolean` | `true` | NOT NULL | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |
| `created_by` / `updated_by` | `uuid` | NULL | FK `auth.users` ON DELETE SET NULL | — |

##### `public.role_module_access`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` ON DELETE CASCADE | Aislamiento RLS |
| `role_id` | `uuid` | — | PK(part), FK `roles` ON DELETE CASCADE | Rol configurado |
| `module_code` | `text` | — | PK(part) | Código de módulo (ej. `ong`, `finanzas`, `clinico`) |
| `can_view` | `boolean` | `false` | NOT NULL | Puede ver recursos del módulo |
| `can_create` | `boolean` | `false` | NOT NULL | Puede crear recursos |
| `can_edit` | `boolean` | `false` | NOT NULL | Puede editar recursos |
| `can_delete` | `boolean` | `false` | NOT NULL | Puede eliminar recursos |

> **PK:** `(role_id, module_code)`. RLS vía `tenant_id` directo. Índices: `(tenant_id)`, `(role_id)`.

##### `public.role_field_permissions`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` ON DELETE CASCADE | Aislamiento RLS |
| `role_id` | `uuid` | — | NOT NULL, FK `roles` ON DELETE CASCADE | Rol configurado |
| `entity_name` | `text` | — | NOT NULL | Entidad en formato `schema.tabla` (ej. `ong.voluntarios`) |
| `field_name` | `text` | — | NOT NULL | Nombre del campo de la entidad |
| `can_view` | `boolean` | `true` | NOT NULL | El rol puede leer este campo |
| `can_edit` | `boolean` | `false` | NOT NULL | El rol puede modificar este campo |

> **UNIQUE:** `(role_id, entity_name, field_name)`. Índices: `(tenant_id)`, `(role_id)`, `(role_id, entity_name)`.

> **Permisos ACE en `cat_permissions`:** `ace.access_links.read`, `ace.access_links.manage`, `ace.memberships.read`, `ace.memberships.manage`, `ace.forms.read`, `ace.forms.manage`, `ace.perms.read`, `ace.perms.manage`.

---

### 2.2 Schema `ong`

> Contiene toda la lógica operativa de la ONG: personas, proyectos, operaciones, inventario y credenciales ID.

#### Catálogos ONG

##### `ong.estados_voluntario`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Ej. `activo`, `inactivo`, `suspendido`, `en_proceso` |
| `nombre_estado` | `text` NOT NULL | Etiqueta |
| `descripcion` | `text` NULL | Descripción detallada |
| `orden_visual` | `int` NOT NULL | Orden de aparición en UI |

##### `ong.estados_proyecto`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Ej. `planificacion`, `en_progreso`, `completado`, `cancelado` |
| `nombre_estado` | `text` NOT NULL | — |
| `orden_visual` | `int` NOT NULL | — |

##### `ong.estados_objeto`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Estado de ítems de inventario (`disponible`, `en_uso`, `dañado`, `baja`) |
| `nombre` | `text` NOT NULL | — |
| `descripcion` | `text` NULL | — |

##### `ong.unidades_medida`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Ej. `UND`, `KG`, `LT`, `CJA` |
| `nombre` | `text` NOT NULL | — |
| `abreviatura` | `text` NOT NULL | Símbolo corto |

##### `ong.tipo_transaccion_inventario`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Ej. `ENTRADA`, `SALIDA`, `TRASLADO`, `AJUSTE` |
| `nombre` | `text` NOT NULL | — |
| `signo` | `smallint` NOT NULL | `-1` (salida), `1` (entrada), `0` (neutro/traslado) |

---

#### Personas

##### `ong.voluntarios`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | Aislamiento multi-tenant |
| `iam_user_id` | `uuid` | NULL | FK `auth.users` | Vínculo con usuario de sistema (opcional) |
| `numero_documento` | `text` | — | NOT NULL | Número de DNI/CE/pasaporte |
| `tipo_documento` | `text` | NULL | FK `cat_tipos_documento` | Tipo de documento |
| `genero` | `text` | NULL | FK `cat_generos` | Código de género |
| `codigo_pais` | `text` | NULL | FK `cat_paises` | País de origen |
| `nombre` | `text` | — | NOT NULL | Primer nombre |
| `apellido` | `text` | — | NOT NULL | Apellidos |
| `fecha_nacimiento` | `date` | NULL | — | — |
| `email` | `text` | NULL | — | Correo electrónico |
| `telefono` | `text` | NULL | — | — |
| `ruta_foto` | `text` | NULL | — | URL de foto en Supabase Storage |
| `codigo_estado` | `text` | — | NOT NULL, FK `ong.estados_voluntario` | Estado operativo del voluntario |
| `observaciones` | `text` | NULL | — | Notas libres |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |
| `created_by` | `uuid` | NULL | FK `auth.users` | — |
| `updated_by` | `uuid` | NULL | FK `auth.users` | — |

##### `ong.beneficiarios`
| Columna | Tipo | Default | Constraints | Descripción |
|---------|------|---------|-------------|-------------|
| `id` | `uuid` | `gen_random_uuid()` | PK | — |
| `tenant_id` | `uuid` | — | NOT NULL, FK `tenants` | — |
| `numero_documento` | `text` | NULL | — | Documento (opcional para menores) |
| `tipo_documento` | `text` | NULL | FK `cat_tipos_documento` | — |
| `codigo_pais` | `text` | NULL | FK `cat_paises` | — |
| `nombre` | `text` | — | NOT NULL | — |
| `apellido` | `text` | — | NOT NULL | — |
| `fecha_nacimiento` | `date` | NULL | — | — |
| `genero` | `text` | NULL | FK `cat_generos` | — |
| `telefono` | `text` | NULL | — | — |
| `direccion` | `text` | NULL | — | Dirección domiciliaria |
| `foto_url` | `text` | NULL | — | URL en Storage |
| `observaciones` | `text` | NULL | — | — |
| `created_at` | `timestamptz` | `now()` | NOT NULL | — |
| `updated_at` | `timestamptz` | `now()` | NOT NULL, trigger | — |
| `created_by` / `updated_by` | `uuid` | NULL | — | — |

> **Perfiles especiales de beneficiarios:** almacenados en `clinico.perfil_nino` y `clinico.perfil_adulto_mayor` (ver §2.5).

---

#### Estructura operativa

##### `ong.areas`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `codigo` | `text` | NOT NULL | Código corto del área |
| `nombre_area` | `text` | NOT NULL | Nombre del área |
| `descripcion` | `text` NULL | — | — |
| `activo` | `boolean` | NOT NULL DEFAULT true | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.ubicaciones`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `codigo` | `text` | NOT NULL | Código corto de ubicación |
| `nombre_ubicacion` | `text` | NOT NULL | — |
| `direccion` | `text` | NOT NULL | Dirección física |
| `latitud` | `float8` NULL | — | Coordenada GPS |
| `longitud` | `float8` NULL | — | Coordenada GPS |
| `activa` | `boolean` | NOT NULL DEFAULT true | — |
| `imagen_url` | `text` NULL | — | Foto del lugar |
| `codigo_pais` | `text` NULL | FK `cat_paises` | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.items` (Inventario)
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `codigo` | `text` | NOT NULL | Código interno del ítem |
| `nombre_item` | `text` | NOT NULL | — |
| `descripcion` | `text` | NOT NULL | — |
| `codigo_unidad_medida` | `text` | NOT NULL, FK `ong.unidades_medida` | — |
| `codigo_estado_objeto` | `text` | NOT NULL, FK `ong.estados_objeto` | Estado físico del ítem |
| `sku` | `text` NULL | — | Código SKU externo opcional |
| `imagen_url` | `text` NULL | — | — |
| `activo` | `boolean` | NOT NULL DEFAULT true | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.transacciones_inventario`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_item` | `uuid` | NOT NULL, FK `ong.items` | Ítem afectado |
| `codigo_tipo_transaccion` | `text` | NOT NULL, FK `ong.tipo_transaccion_inventario` | Tipo de movimiento |
| `cantidad` | `numeric` | NOT NULL | Cantidad (siempre positiva; signo se aplica por tipo) |
| `id_ubicacion_origen` | `uuid` NULL | FK `ong.ubicaciones` | Origen del traslado |
| `id_ubicacion_destino` | `uuid` NULL | FK `ong.ubicaciones` | Destino del traslado |
| `fecha_transaccion` | `timestamptz` NULL | — | Fecha efectiva de la transacción |
| `registrado_por` | `uuid` | NOT NULL, FK `auth.users` | Usuario que registró |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

---

#### Jerarquía Proyecto → Actividad → Tarea

> **Orden canónico** (corregido por `20260501_fix_hierarchy_actividades_tareas.sql`):
> `ong.proyectos` → `ong.actividades` (FK `id_proyecto`) → `ong.tareas` (FK `id_actividad`)

##### `ong.proyectos`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `codigo` | `text` | NOT NULL | Código del proyecto |
| `nombre_proyecto` | `text` | NOT NULL | — |
| `descripcion` | `text` | NOT NULL | — |
| `fecha_inicio` | `date` NULL | — | — |
| `fecha_fin` | `date` NULL | — | — |
| `id_area` | `uuid` | NOT NULL, FK `ong.areas` | Área responsable |
| `codigo_estado` | `text` | NOT NULL, FK `ong.estados_proyecto` | Estado del proyecto |
| `presupuesto` | `numeric` | NOT NULL DEFAULT 0 | Presupuesto asignado |
| `imagen_url` | `text` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.actividades`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_proyecto` | `uuid` NULL | FK `ong.proyectos` ON DELETE CASCADE | Proyecto padre (índice: `idx_actividades_id_proyecto`) |
| `titulo` | `text` | NOT NULL | — |
| `descripcion` | `text` NULL | — | — |
| `codigo_estado` | `text` | NOT NULL CHECK(`pendiente`,`planificada`,`en_progreso`,`completada`,`cancelada`) | Estado FSM |
| `fecha_inicio` | `timestamptz` NULL | — | — |
| `fecha_fin` | `timestamptz` NULL | — | — |
| `id_ubicacion` | `uuid` NULL | FK `ong.ubicaciones` | Lugar de la actividad |
| `horas_estimadas` | `numeric` NULL | — | Horas planificadas |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.tareas`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_actividad` | `uuid` NULL | FK `ong.actividades` ON DELETE SET NULL | Actividad padre (índice: `idx_tareas_id_actividad`) |
| `titulo` | `text` | NOT NULL | — |
| `descripcion` | `text` NULL | — | — |
| `estado` | `text` NULL | CHECK(`pendiente`,`en_progreso`,`completada`,`cancelada`) | — |
| `fecha_limite` | `date` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

---

#### Operaciones de actividades

##### `ong.asignaciones_actividad`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_actividad` | `uuid` | NOT NULL, FK `ong.actividades` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `rol_en_actividad` | `text` NULL | — | Rol específico en esta actividad |
| `is_deleted` | `boolean` | NOT NULL DEFAULT false | Soft-delete |
| `deleted_at` | `timestamptz` NULL | — | — |
| `deleted_by` | `uuid` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.horas_actividad`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_actividad` | `uuid` | NOT NULL, FK `ong.actividades` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `horas_registradas` | `numeric` | NOT NULL | Horas reportadas por el voluntario |
| `fecha` | `date` | NOT NULL | Fecha de la jornada |
| `estado_aprobacion` | `text` NULL | CHECK(`pendiente`,`aprobada`,`rechazada`) | Estado de aprobación |
| `aprobado_por` | `uuid` NULL | FK `auth.users` | Quien aprobó/rechazó |
| `id_aprobacion` | `uuid` NULL | FK `ong.aprobaciones` | Registro en tabla genérica de aprobaciones |
| `comentario_resolucion` | `text` NULL | — | Nota del aprobador |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.evidencias_actividad`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_actividad` | `uuid` | NOT NULL, FK `ong.actividades` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | Voluntario que sube la evidencia |
| `url_archivo` | `text` | NOT NULL | URL en Supabase Storage |
| `tipo_evidencia` | `text` NULL | — | Ej. `foto`, `video`, `documento` |
| `comentario` | `text` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.asistencias`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_actividad` | `uuid` | NOT NULL, FK `ong.actividades` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `fecha_operacion` | `date` | NOT NULL | Fecha del registro de asistencia |
| `check_in_at` | `timestamptz` NULL | — | Hora de entrada |
| `check_out_at` | `timestamptz` NULL | — | Hora de salida |
| `origen_registro` | `text` | NOT NULL CHECK(`scan`,`manual`,`import`) | Cómo se registró |
| `estado` | `text` | NOT NULL CHECK(`presente`,`tardanza`,`ausente`,`justificado`,`pendiente`) | Estado de asistencia |
| `observacion` | `text` NULL | — | — |
| `qr_payload` | `text` NULL | — | Payload del QR escaneado |
| `id_card_id` | `uuid` NULL | FK `ong.id_cards` | Credencial usada en el scan |
| `is_deleted` | `boolean` | NOT NULL DEFAULT false | Soft-delete |
| `deleted_at` / `deleted_by` | `timestamptz` / `uuid` | NULL | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.aprobaciones`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `modulo` | `text` | NOT NULL | Módulo origen del flujo |
| `entidad_schema` | `text` | NOT NULL | Schema de la entidad a aprobar |
| `entidad_tabla` | `text` | NOT NULL | Tabla de la entidad a aprobar |
| `entidad_id` | `uuid` | NOT NULL | PK de la entidad a aprobar |
| `tipo_aprobacion` | `text` | NOT NULL CHECK(`hora`,`evidencia`,`admision`,`finanza`,`otro`) | Tipo de flujo de aprobación |
| `estado` | `text` | NOT NULL CHECK(`pendiente`,`aprobada`,`rechazada`,`devuelta`) | Estado FSM |
| `comentario` | `text` NULL | — | Nota del resolutor |
| `solicitado_por` | `uuid` NULL | FK `auth.users` | Quien solicita la aprobación |
| `resuelto_por` | `uuid` NULL | FK `auth.users` | Quien resuelve |
| `requested_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de solicitud |
| `resolved_at` | `timestamptz` NULL | — | Fecha de resolución |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

> **Bandeja genérica:** una sola tabla maneja aprobaciones de horas, evidencias, admisiones y finanzas. El campo `entidad_schema.entidad_tabla.entidad_id` permite navegar a la entidad origen.

---

#### Proyectos — relaciones

##### `ong.asignaciones_proyecto`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_proyecto` | `uuid` | NOT NULL, FK `ong.proyectos` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `rol_en_proyecto` | `text` NULL | — | Rol del voluntario en el proyecto |
| `fecha_ingreso` | `date` NULL | — | — |
| `activo` | `boolean` NULL | — | Si la asignación está activa |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.participaciones_proyecto`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_proyecto` | `uuid` | NOT NULL, FK `ong.proyectos` | — |
| `id_beneficiario` | `uuid` | NOT NULL, FK `ong.beneficiarios` | — |
| `observaciones` | `text` NULL | — | — |
| `fecha_vinculacion` | `date` NULL | — | Fecha en que se vinculó el beneficiario |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.recursos_proyecto`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_proyecto` | `uuid` | NOT NULL, FK `ong.proyectos` | — |
| `id_item` | `uuid` | NOT NULL, FK `ong.items` | Ítem de inventario requerido |
| `cantidad_requerida` | `numeric` | NOT NULL | — |
| `cantidad_asignada` | `numeric` NULL | — | Cuánto se asignó realmente |
| `is_deleted` | `boolean` | NOT NULL DEFAULT false | Soft-delete |
| `deleted_at` / `deleted_by` | `timestamptz` / `uuid` | NULL | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

---

#### Credenciales ID (Módulo ID Cards)

##### `ong.id_card_templates`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `nombre` | `text` | NOT NULL | Nombre de la plantilla |
| `base_image_url` | `text` | NOT NULL | URL de la imagen de fondo en Storage |
| `template_width` | `int` | NOT NULL | Ancho en píxeles |
| `template_height` | `int` | NOT NULL | Alto en píxeles |
| `template_config` | `jsonb` NULL | — | Config V2 (layers, metadata en px). Schema: `{version:2, metadata:{name,w_px,h_px}, layers:[...]}` |
| `activa` | `boolean` | NOT NULL DEFAULT true | Si la plantilla está disponible para emitir |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `ong.id_card_template_fields`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_template` | `uuid` | NOT NULL, FK `ong.id_card_templates` | Plantilla a la que pertenece el campo |
| `field_key` | `text` | NOT NULL CHECK(`foto`,`nombre`,`dni`,`codigo`,`qr`) | Tipo de campo semántico |
| `pos_x` | `numeric` | NOT NULL | Posición X en píxeles |
| `pos_y` | `numeric` | NOT NULL | Posición Y en píxeles |
| `width` | `numeric` NULL | — | Ancho del campo en píxeles |
| `height` | `numeric` NULL | — | Alto del campo en píxeles |
| `font_size` | `numeric` NULL | — | Tamaño de fuente en píxeles |
| `font_family` | `text` NULL | — | Familia tipográfica |
| `font_weight` | `text` NULL | — | Peso tipográfico (`400`, `700`, …) |
| `color_hex` | `text` NULL | — | Color en hexadecimal `#RRGGBB` |
| `z_index` | `int` | NOT NULL DEFAULT 0 | Orden de capa |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |

##### `ong.id_cards`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | Voluntario titular |
| `id_template` | `uuid` | NOT NULL, FK `ong.id_card_templates` | Plantilla usada |
| `card_code` | `text` | NOT NULL | Código único de la credencial (ej. `VC-2025-00123`) |
| `qr_payload` | `text` | NOT NULL | Payload del código QR para escaneo en asistencias |
| `issued_at` | `timestamptz` | NOT NULL DEFAULT now() | Fecha de emisión |
| `expires_at` | `timestamptz` NULL | — | Expiración (NULL = sin expiración) |
| `estado` | `text` | NOT NULL CHECK(`activa`,`revocada`,`expirada`) | Estado de la credencial |
| `image_render_url` | `text` NULL | — | URL del render PNG en Storage |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

---

### 2.3 Schema `rrhh`

> Gestiona el proceso de admisión de voluntarios (solicitud → documentos → entrevista → onboarding), habilidades, roles operativos y documentación personal.

##### `rrhh.solicitudes_admision`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `nombres` | `text` | NOT NULL | — |
| `apellidos` | `text` | NOT NULL | — |
| `email` | `text` | NOT NULL | — |
| `estado` | `text` NULL | CHECK(`nueva`,`en_entrevista`,`aprobada`,`rechazada`) | Estado FSM del proceso de admisión |
| `fecha_solicitud` | `timestamptz` NULL | — | — |
| `notas` | `text` NULL | — | Notas del evaluador |
| `id_voluntario_vinculado` | `uuid` NULL | FK `ong.voluntarios` | Voluntario creado tras aprobación |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.documentos_admision`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_solicitud` | `uuid` | NOT NULL, FK `rrhh.solicitudes_admision` | — |
| `tipo_documento` | `text` | NOT NULL | Tipo del documento subido |
| `archivo_url` | `text` | NOT NULL | URL en Storage |
| `verificado` | `boolean` NULL | — | Si fue verificado por el evaluador |
| `verified_by` | `uuid` NULL | FK `auth.users` | — |
| `verified_at` | `timestamptz` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.entrevistas_admision`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_solicitud` | `uuid` | NOT NULL, FK `rrhh.solicitudes_admision` | — |
| `entrevistador_id` | `uuid` | NOT NULL, FK `auth.users` | Entrevistador |
| `fecha_entrevista` | `timestamptz` | NOT NULL | — |
| `comentarios` | `text` NULL | — | — |
| `resultado` | `text` NULL | CHECK(`apto`,`no_apto`,`pendiente`) | — |
| `puntaje` | `numeric` NULL | — | Puntaje opcional |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.admission_requirements`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `nombre_requisito` | `text` | NOT NULL | Nombre del requisito de admisión |
| `descripcion` | `text` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.admission_requirement_reviews`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL | — |
| `id_solicitud` | `uuid` | NOT NULL, FK `rrhh.solicitudes_admision` | — |
| `id_requisito` | `uuid` | NOT NULL, FK `rrhh.admission_requirements` | — |
| `estado` | `text` NULL | — | Estado de revisión del requisito |
| `revisado_por` | `uuid` NULL | FK `auth.users` | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.admision_estado_historial`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL | — |
| `id_solicitud` | `uuid` | NOT NULL, FK `rrhh.solicitudes_admision` | — |
| `estado_anterior` | `text` NULL | — | Estado antes del cambio |
| `estado_nuevo` | `text` | NOT NULL | Estado después del cambio |
| `comentario` | `text` NULL | — | — |
| `cambiado_por` | `uuid` | NOT NULL, FK `auth.users` | — |
| `fecha_cambio` | `timestamptz` NULL | DEFAULT now() | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |

##### `rrhh.onboarding_pasos`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `nombre_paso` | `text` | NOT NULL | Nombre del paso (ej. "Entrega de uniforme") |
| `orden` | `int` | NOT NULL | Orden secuencial |
| `obligatorio` | `boolean` NULL DEFAULT true | — | Si el paso es obligatorio |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.onboarding_voluntario`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `id_paso` | `uuid` | NOT NULL, FK `rrhh.onboarding_pasos` | — |
| `completado` | `boolean` NULL DEFAULT false | — | — |
| `fecha_completado` | `timestamptz` NULL | — | — |
| `evidencia_url` | `text` NULL | — | Evidencia de completitud |
| `is_deleted` | `boolean` | NOT NULL DEFAULT false | Soft-delete |
| `deleted_at` / `deleted_by` | `timestamptz` / `uuid` | NULL | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.habilidades`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `codigo` | `text` PK | Código de habilidad (ej. `primeros_auxilios`, `liderazgo`) |
| `nombre` | `text` NOT NULL | Etiqueta |

##### `rrhh.voluntario_habilidades`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `codigo_habilidad` | `text` | NOT NULL, FK `rrhh.habilidades` | — |
| `nivel` | `text` NULL | CHECK(`basico`,`intermedio`,`avanzado`,`experto`) | Nivel de dominio |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.volunteer_preferences`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `disponibilidad_json` | `jsonb` NULL | — | Disponibilidad horaria en formato JSON |
| `distancia_max_km` | `numeric` NULL | — | Distancia máxima para actividades |
| `quiere_viajar` | `boolean` NULL | — | Disponibilidad para viajes |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.documentos_voluntario`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `tipo_documento` | `text` | NOT NULL | Tipo del documento (carnet, certificado, etc.) |
| `url_archivo` | `text` | NOT NULL | URL en Storage |
| `fecha_vencimiento` | `date` NULL | — | — |
| `vigente` | `boolean` NULL | — | Si está vigente |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.roles_operativos`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `nombre_rol` | `text` | NOT NULL | Rol operativo (ej. "Coordinador de zona") |
| `descripcion` | `text` NULL | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.asignaciones_rol`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `id_rol_operativo` | `uuid` | NOT NULL, FK `rrhh.roles_operativos` | — |
| `fecha_asignacion` | `date` NULL | — | — |
| `activo` | `boolean` NULL DEFAULT true | — | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.perfil_coordinador`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_voluntario` | `uuid` | NOT NULL, FK `ong.voluntarios` | — |
| `anios_experiencia` | `int` NULL | — | Años de experiencia como coordinador |
| `departamento_asignado` | `text` NULL | — | Departamento geográfico |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.codigos_registro_voluntario`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `codigo` | `text` | NOT NULL | Código único de invitación |
| `email_objetivo` | `text` NULL | — | Email pre-asignado al código |
| `numero_documento_objetivo` | `text` NULL | — | Documento pre-asignado |
| `nombres_objetivo` | `text` NULL | — | Nombre esperado del postulante |
| `apellidos_objetivo` | `text` NULL | — | — |
| `id_solicitud` | `uuid` NULL | FK `rrhh.solicitudes_admision` | Solicitud vinculada |
| `id_voluntario` | `uuid` NULL | FK `ong.voluntarios` | Voluntario resultante |
| `expires_at` | `timestamptz` | NOT NULL | Expiración del código |
| `max_uses` | `int` | NOT NULL DEFAULT 1 | Usos máximos permitidos |
| `use_count` | `int` | NOT NULL DEFAULT 0 | Usos actuales |
| `estado` | `text` | NOT NULL CHECK(`activo`,`consumido`,`expirado`,`revocado`) | Estado del código |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

##### `rrhh.registro_documentos_postulante`
| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | `uuid` | PK | — |
| `tenant_id` | `uuid` | NOT NULL, FK `tenants` | — |
| `id_codigo_registro` | `uuid` | NOT NULL, FK `rrhh.codigos_registro_voluntario` | Código de registro vinculado |
| `tipo_documento` | `text` | NOT NULL | — |
| `archivo_url` | `text` | NOT NULL | URL en Storage |
| `verificado` | `boolean` | NOT NULL DEFAULT false | — |
| `verified_by` / `verified_at` | `uuid` / `timestamptz` | NULL | — |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL | — |
| `created_by` / `updated_by` | `uuid` | NULL | — |

---

## 5. REGISTRO DE MEJORAS Y CAMBIOS

| Fecha | Migración | Descripción | Autor |
|-------|-----------|-------------|-------|
| 2026-03-01 | `20260301120000_ai_security_copilot` | Columnas de seguridad en `profiles` (`pin_failed_attempts`, `pin_blocked_until`, `risk_blocked_until`). Tabla `mfa_challenges`. | Claude Sonnet 4.6 |
| 2026-03-02 | `20260302125000_fix_bootstrap_audit_tenant_null` | `fn_current_tenant_id` segura, `fn_trigger_audit_universal` tolerante a tenant null, `fn_bootstrap_tenant` robusto. | Claude Sonnet 4.6 |
| 2026-03-05 | `20260305100000_schema_guard` | Guard de prereqs críticos para despliegues seguros. | Claude Sonnet 4.6 |
| 2026-03-05 | `20260305110000_rls_hardening_p0` | RLS estricta en `profiles` y `user_roles_sedes`. `tenant_id` NOT NULL + FK en `user_roles_sedes`. Catálogos read-only para `authenticated`. | Claude Sonnet 4.6 |
| 2026-05-10 | `20260510000000_ace_fase0_base_structures` | **ACE FASE 0:** Tablas `access_links`, `memberships`, `dynamic_forms`, `role_module_access`, `role_field_permissions`. Triggers `updated_at` + auditoría forense. RLS habilitada (políticas en FASE 3). Seeds `cat_permissions` módulo `ace`. | Claude Sonnet 4.6 |
| 2026-05-10 | `20260510100000_ace_fase1_onboarding_rpc` | **ACE FASE 1:** Función `fn_complete_access_onboarding(text, jsonb)`. Procesa link de acceso, upsert de perfil, membresía contextual, IAM (`user_roles_sedes`), registro operativo (`ong.voluntarios` o `rrhh.solicitudes_admision`), auditoría en `public.audit_logs`. Grant a `authenticated` + `service_role`. | Claude Sonnet 4.6 |
| 2026-05-10 | `20260510200000_ace_fase2_legacy_sync` | **ACE FASE 2:** Snapshot `user_roles_sedes → memberships` (DISTINCT ON hierarchy_level). Trigger `tr_sync_user_roles_sedes` + `fn_sync_urs_to_membership` (INSERT/UPDATE/DELETE con rol heredero). Migración `rrhh.codigos_registro_voluntario → access_links` (metadata preserva campos de admisión). | Claude Sonnet 4.6 |
| 2026-05-10 | `20260510210000_ace_fase3_rls_policies` | **ACE FASE 3:** Políticas RLS por operación (SELECT/INSERT/UPDATE/DELETE) para las 5 tablas ACE usando `fn_has_permission` + `fn_is_tenant_admin`. Función `fn_validate_access_code(text)` SECURITY DEFINER para validación anónima de links. Grant `anon` en ambas RPCs ACE. Índice `idx_memberships_user_active`. | Claude Sonnet 4.6 |
| 2026-05-10 | `20260510220000_ace_fase4_optimization` | **ACE FASE 4:** Índices `idx_memberships_active_lookup(tenant_id,user_id,context_id)` e `idx_access_links_available(code) WHERE activo+disponible`. Función `fn_has_context_access(uuid,uuid)` STABLE+SECURITY DEFINER para políticas RLS de tablas operativas. Vista `v_user_session_context` con `security_invoker=true` y `WHERE p.id=auth.uid()`. | Claude Sonnet 4.6 |
| 2026-05-10 | *(documentación)* | **ACE FASE 5:** Mapa técnico completo, flujo de onboarding, estrategia de rollback y recomendaciones futuras integrados en `DB_MAESTRA.md` §6. | Claude Sonnet 4.6 |

---

## 6. ACE — Arquitectura Técnica y Guía Operativa

> **Access & Context Engine™ (ACE)** — Implementado en FASES 0–4 (2026-05-10).
> Reemplaza el modelo estático de acceso por sede con un sistema de **Identidad Adaptativa** basado en membresías contextuales dinámicas.

---

### 6.1 Capas del Sistema

| Capa | Tabla(s) | Responsabilidad |
|------|----------|-----------------|
| **Identidad** | `auth.users` | Autenticación pura de Supabase. Fuente de identidad global. |
| **Perfil** | `public.profiles` | Datos maestros del usuario. Fuente de verdad de identidad dentro del tenant. |
| **Acceso** | `public.access_links` | Motor de entrada y vinculación inteligente. Genera membresías y registros operativos. |
| **Contextual** | `public.memberships` | Define *dónde* está el usuario (Proyecto, Sede, Programa, Actividad). Reemplaza el acceso estático por sede. |
| **Operativa** | `ong.voluntarios`, `rrhh.solicitudes_admision` | Datos específicos de la labor que realiza el usuario en el sistema. |
| **Visibilidad** | `public.role_module_access`, `public.role_field_permissions` | Define *qué ve* exactamente el usuario dentro de cada contexto (módulos y campos). |

---

### 6.2 Mapa Relacional del Motor ACE

```
public.tenants
  ├── posee ──────────→ public.access_links
  │                         │
  │                         └─ genera ──→ public.memberships
  │                         └─ genera ──→ public.profiles (upsert)
  │                         └─ genera ──→ ong.voluntarios / rrhh.solicitudes_admision
  │
  ├── posee ──────────→ public.memberships
  │                         │
  │                         ├─ vincula ─→ public.profiles  (user_id)
  │                         ├─ vincula ─→ public.roles     (role_id)
  │                         └─ apunta ──→ ong.proyectos / public.sedes / ...  (context_id polimórfico)
  │
  └── posee ──────────→ public.roles
                            │
                            ├─ gobierna → public.role_module_access   (permisos de módulo)
                            ├─ gobierna → public.role_field_permissions (permisos de campo)
                            └─ gobierna → public.role_permissions      (permisos cat_permissions)
```

**Compatibilidad legacy (FASE 2):**
```
public.user_roles_sedes  ──(trigger tr_sync_urs_to_membership)──→  public.memberships
rrhh.codigos_registro_voluntario  ──(migración snapshot)──→  public.access_links
```

---

### 6.3 Flujo de Onboarding Completo

```
[Admin]  →  INSERT access_links (type=VOLUNTEER_JOIN, target_id=ID_PROYECTO)
               │
               ▼
[Usuario no autenticado]
  →  SELECT fn_validate_access_code('VOL-2026-XXXX')
       Devuelve: {valid: true, type: VOLUNTEER_JOIN, expires_at: ...}
               │
               ▼
[Usuario se registra en Supabase Auth]  →  auth.uid() disponible
               │
               ▼
[Usuario autenticado]
  →  RPC fn_complete_access_onboarding('VOL-2026-XXXX', {full_name, numero_documento, ...})
       Paso 1: Bloquea el link (SELECT FOR UPDATE) — previene condición de carrera
       Paso 2: Valida: is_active, expires_at, used_count < max_uses
       Paso 3: UPSERT public.profiles (tenant_id, full_name, tipo_documento)
       Paso 4: UPSERT public.memberships (context_type=PROYECTO, context_id=ID_PROYECTO)
       Paso 5: INSERT public.user_roles_sedes (si link trae assigned_role + assigned_sede)
       Paso 6: INSERT ong.voluntarios (nombre, apellido, codigo_estado='en_proceso')
       Paso 7: UPDATE access_links (used_count++, is_active según límite)
       Paso 8: INSERT public.audit_logs (evento ONBOARDING_COMPLETED)
       Devuelve: {success: true, membership_id, entity_id, tenant_id}
               │
               ▼
[Dashboard]
  →  SELECT public.v_user_session_context
       Devuelve: perfil + active_memberships [{PROYECTO, ID_PROYECTO, role_name}]
  →  RLS en ong.proyectos usa fn_has_context_access(auth.uid(), id)
       Solo muestra el Proyecto Ayacucho al que el usuario tiene membresía activa.
```

---

### 6.4 RPCs Disponibles (ACE)

| Función | Roles | Propósito |
|---------|-------|-----------|
| `fn_validate_access_code(code text)` | `anon`, `authenticated` | Validar link antes de registrarse. No devuelve datos sensibles. |
| `fn_complete_access_onboarding(code, metadata)` | `anon`, `authenticated` | Onboarding atómico completo. Requiere `auth.uid()` válido. |
| `fn_has_context_access(user_id, context_id)` | `authenticated`, `service_role` | Verificar membresía activa. Usada en futuros predicados RLS de tablas operativas. |

---

### 6.5 Estrategia de Rollback y Seguridad

| Escenario | Acción | Impacto |
|-----------|--------|---------|
| Link comprometido | `UPDATE access_links SET is_active = false WHERE id = '...'` | Inmediato; sin afectar membresías existentes |
| Membresía incorrecta | `UPDATE memberships SET status = 'inactive'` | El usuario pierde acceso; perfil y voluntario intactos |
| Rollback total ACE | DROP triggers + DROP tablas ACE | Las tablas `user_roles_sedes`, `ong.voluntarios` y `rrhh.codigos_registro_voluntario` permanecen intactas |
| Auditoría | `SELECT * FROM public.audit_logs WHERE event_type = 'ONBOARDING_COMPLETED'` | Trazabilidad completa de quién usó cada link |

> **Nota:** La auditoría se registra en `public.audit_logs` (tabla real del sistema). No existe `auditoria.logs_accesos`.

---

### 6.6 Recomendaciones Futuras

| Prioridad | Mejora | Descripción |
|-----------|--------|-------------|
| Alta | Membresías temporales | Agregar `valid_from timestamptz` y `valid_to timestamptz` a `public.memberships` para accesos que expiren automáticamente |
| Alta | RLS en tablas operativas | Implementar `USING (fn_has_context_access(auth.uid(), id_proyecto))` en `ong.proyectos`, `ong.actividades`, etc. |
| Media | Integración comunicaciones | Envío automático del link vía schema `comunicaciones` (WhatsApp/Email) al crear `access_links` |
| Media | Motor de riesgo en formularios | Función que analice `dynamic_forms` completados y alerte si el perfil no cumple requisitos mínimos |
| Baja | Particionado de audit_logs | Particionar `public.audit_logs` por `created_at` (mensual) para tenants con alto volumen |

---

### 6.7 Estado del Proyecto ACE

| Fase | Estado | Migración | Descripción |
|------|--------|-----------|-------------|
| 0 | ✅ Completa | `20260510000000` | Estructura de base de datos: 5 tablas, triggers, RLS habilitada, seeds |
| 1 | ✅ Completa | `20260510100000` | RPC `fn_complete_access_onboarding` — onboarding atómico ACID |
| 2 | ✅ Completa | `20260510200000` | Sincronización legacy: user_roles_sedes ↔ memberships, RRHH → access_links |
| 3 | ✅ Completa | `20260510210000` | Seguridad RLS: 20 políticas, `fn_validate_access_code`, grants anon |
| 4 | ✅ Completa | `20260510220000` | Optimización: índices parciales, `fn_has_context_access`, vista de sesión |
| 5 | ✅ Completa | *(docs)* | Documentación técnica, mapa relacional y guía operativa |
