# RF EXISTENTES — Inventario y clasificación de reutilización móvil

Fecha: 2026-07-04. Fuente: `industries/ong/registry.tsx`, `app/services/**`, `app/modules/**`, `app/tenant/bootstrap.ts`.

## Leyenda de clasificación

- ✅ **Reutilizable sin cambios** — lógica/servicio agnóstico de plataforma; solo se reconstruye la UI.
- 🔄 **Reutilizable con adaptaciones** — requiere ajustar acoplamientos (File, localStorage, env, DOM).
- ⚠ **Requiere rediseño** — el flujo debe repensarse para móvil (UX o técnica).
- ❌ **No aplica para móvil** — específico de web/escritorio.

> **Nota:** "backend" = Supabase (esquema.tabla) salvo indicación de API Express. Prioridad = valor operativo en campo. Complejidad = esfuerzo de reconstrucción móvil.

---

## Módulo: Autenticación y Sesión (transversal)

| ID | Nombre | Descripción | Módulos | Componentes | Backend | Tablas | APIs | Prioridad | Compl. | Dep. | Clase |
|----|--------|-------------|---------|-------------|---------|--------|------|-----------|--------|------|-------|
| RF-AUTH-01 | Login email/password | Autenticación Supabase | auth | LoginGateway | Supabase Auth | `auth.users`,`public.profiles` | `auth.signInWithPassword` | Alta | Media | — | 🔄 |
| RF-AUTH-02 | Bootstrap de tenant | Carga perfil, tenant, módulos, permisos, roles | tenant | TenantBootstrapProvider | Supabase RPC | `profiles`,`tenants`,`tenant_modules`,`user_roles_sedes`,`memberships` | `fn_has_permission`,`fn_is_tenant_admin` | Alta | Baja | RF-AUTH-01 | ✅ |
| RF-AUTH-03 | MFA step-up (OTP email) | Verificación/reenvío OTP en login y acciones críticas | auth | — | API Express | `challenges`,`auth_events` | `/api/auth/step-up/*` | Alta | Media | RF-AUTH-01 | 🔄 |
| RF-AUTH-04 | Motor de riesgo | Evalúa riesgo de login/acción (IP, device, geo) | auth | — | API Express | `sessions`,`devices`,`auth_events` | `/api/auth/risk-evaluate` | Alta | Media | RF-AUTH-01 | 🔄 |
| RF-AUTH-05 | Login por PIN de terminal | Autenticación de terminal física por PIN | auth | — | API Express | `terminals`,`profiles`,`sessions` | `/api/auth/terminal-login` | Baja | Media | — | ⚠ |
| RF-AUTH-06 | Política financiera de tenant | Bloqueo/solo-lectura por estado financiero | tenant | — | Supabase | `tenants` | — | Media | Baja | RF-AUTH-02 | ✅ |
| RF-AUTH-07 | RBAC (permisos/roles/sedes) | Control de acceso por permiso y sede | tenant | access.ts | Supabase RLS | `roles`,`user_roles_sedes`,`memberships` | RPC | Alta | Baja | RF-AUTH-02 | ✅ |

## Módulo: Home / Dashboard

| ID | Nombre | Descripción | Backend | Tablas | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|--------|-----------|--------|-------|
| RF-HOME-01 | Panel principal (KPIs) | Métricas agregadas del tenant | `ong`,`rrhh`,`public` | múltiples (homeDashboardService) | Alta | Alta | 🔄 |
| RF-HOME-02 | Búsqueda global | Búsqueda transversal de entidades | `ong`,`rrhh` | múltiples (homeSearchService) | Media | Media | ✅ |

## Módulo: Proyectos

| ID | Nombre | Descripción | Tablas (`ong`) | Prioridad | Compl. | Clase |
|----|--------|-------------|----------------|-----------|--------|-------|
| RF-PROY-01 | Gestión de proyectos | CRUD de proyectos | `proyectos` | Alta | Media | ✅ |
| RF-PROY-02 | Tareas | Tareas del proyecto | `tasks` (proyectos) | Alta | Media | ✅ |
| RF-PROY-03 | Actividades del proyecto | Actividades vinculadas | `actividades` | Alta | Media | ✅ |
| RF-PROY-04 | Asignaciones | Asignación de personas a proyectos | `assignments`,`participaciones_proyecto` | Alta | Media | ✅ |

## Módulo: Operación (uso intensivo en campo)

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-OPER-01 | Actividades | Registro/consulta de actividades | `ong` | Alta | Media | ✅ |
| RF-OPER-02 | Asistencias | Registro de asistencia (`attendance.scan`) | `ong` | **Alta** | Media | 🔄 |
| RF-OPER-03 | Horas | Registro de horas de voluntariado | `ong` | Alta | Media | ✅ |
| RF-OPER-04 | Evidencias | Subida de evidencias (fotos/archivos) | `ong` + Storage `evidence` | **Alta** | Alta | 🔄 |

## Módulo: Aprobaciones

| ID | Nombre | Descripción | Prioridad | Compl. | Clase |
|----|--------|-------------|-----------|--------|-------|
| RF-APRO-01 | Bandeja de aprobaciones | Aprobar horas/evidencias/admisión/finanzas | Alta | Media | ✅ |
| RF-APRO-02 | Aprobación de horas | Flujo dedicado de horas | Alta | Baja | ✅ |

## Módulo: Personas

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-PERS-01 | Voluntarios | CRUD/consulta de voluntarios | `ong.voluntarios`,`rrhh`,`public` | Alta | Media | 🔄 |
| RF-PERS-02 | Beneficiarios | CRUD/consulta + perfiles niño/adulto mayor | `ong.beneficiarios`,`clinico` | Alta | Alta | 🔄 |
| RF-PERS-03 | Credenciales ID | Generación/preview de credenciales (canvas) | `ong` + Storage | Media | **Alta** | ⚠ |

## Módulo: Admisión

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-ADMI-01 | Solicitudes de admisión | Gestión de solicitudes | `rrhh`,`ong` | Media | Media | ✅ |
| RF-ADMI-02 | Documentos de admisión | Subida/gestión documental | Storage documentos | Media | Alta | 🔄 |
| RF-ADMI-03 | Entrevistas | Agenda/registro de entrevistas | `rrhh` | Media | Media | ✅ |
| RF-ADMI-04 | Onboarding | Flujo de incorporación + evidencia | `rrhh`,`ong` + Storage | Media | Alta | 🔄 |
| RF-ADMI-05 | Registro voluntario por código | Alta pública vía código/link | `public`,`ong` | Media | Media | 🔄 |
| RF-ADMI-06 | Validación RUC (SUNAT) | Verificación de RUC en onboarding | API SUNAT | Baja | Baja | ✅ |

## Módulo: Recursos (Inventario / Finanzas / Académico)

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-RECU-01 | Inventario | Ítems, ubicaciones, movimientos, kardex | `ong` | Media | Alta | 🔄 |
| RF-RECU-02 | Finanzas | Cuentas, transacciones, categorías, reportes | `finanzas`,`ong` | Media | Alta | 🔄 |
| RF-RECU-03 | Comprobantes financieros | Subida de comprobantes | Storage `finance-receipts` | Media | Alta | 🔄 |
| RF-RECU-04 | Cursos y certificados | Gestión académica | `academico`,`ong` | Baja | Media | ✅ |

## Módulo: Clínico (datos sensibles)

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-CLIN-01 | Ficha médica | Fichas médicas de beneficiarios | `clinico.fichas_medicas` | Media | Alta | ⚠ |

> Datos sensibles: permiso `clinico.volunteer_sensitive.read` + registro de acceso sensible. En móvil **no** debe cachearse offline (ver OFFLINE_FIRST.md).

## Módulo: Notificaciones

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-NOTI-01 | Historial de notificaciones | Bandeja + realtime | `comunicaciones.historial_notificaciones` | Alta | Media | 🔄 |
| RF-NOTI-02 | Plantillas de notificación | Gestión de plantillas | `comunicaciones` | Baja | Media | ✅ |

## Módulo: Gobernanza

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-GOBE-01 | Catálogos | Catálogos maestros | `public`,`ong` | Baja | Media | ✅ |
| RF-GOBE-02 | Auditoría | Log de auditoría | `auditoria` | Baja | Media | ✅ |
| RF-GOBE-03 | Accesos sensibles | Registro de accesos a datos sensibles | `auditoria`,`clinico` | Media | Media | ✅ |
| RF-GOBE-04 | Retención / soft delete | Retención y borrado lógico | `auditoria`,`ong` | Baja | Media | ✅ |

## Módulo: Configuración / IAM / ACE

| ID | Nombre | Descripción | Backend | Prioridad | Compl. | Clase |
|----|--------|-------------|---------|-----------|--------|-------|
| RF-CONF-01 | Usuarios del sistema | Gestión de usuarios | `public`,`ong` + API IAM | Media | Media | 🔄 |
| RF-CONF-02 | Roles y permisos | Definición de roles | `public`,`ong` | Media | Media | ✅ |
| RF-CONF-03 | Seguridad de sesión | Ver/terminar sesiones | `public.sessions` + API | Media | Media | ✅ |
| RF-CONF-04 | Control de acceso (ACE) | Access links, memberships, forms, perms | `public` (ACE) | Media | Alta | 🔄 |

---

## Resumen cuantitativo

| Clase | # RF | % |
|-------|------|---|
| ✅ Reutilizable sin cambios | 20 | ~48% |
| 🔄 Reutilizable con adaptaciones | 17 | ~40% |
| ⚠ Requiere rediseño | 4 | ~10% |
| ❌ No aplica | 0 | 0% |

**Lectura:** ~88% de los RF son aprovechables en móvil (solo/adaptación). Los "⚠ rediseño" (credenciales ID con canvas, ficha clínica sensible, login por PIN de terminal) requieren decisiones de UX/seguridad específicas, no reescritura de backend. Ninguna funcionalidad queda descartada para móvil, aunque algunas (gobernanza/IAM administrativa) son de **baja prioridad** en un primer release de campo.
