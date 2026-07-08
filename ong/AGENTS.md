# AGENTS.md

<!--
CRITICAL FOR CODEX AGENTS:
1) Read this file completely before implementing, refactoring, or deleting any module.
2) If section 13 ("PROMPT MASTER FOR CODEX") is filled, treat it as the main implementation contract.
3) If there is a conflict between this file and ad-hoc assumptions, this file wins.
-->

## Agent Pre-Read Checklist
- Read this file from top to bottom before touching code.
- Confirm architecture, data, security, and module rules below.
- Validate whether Prompt Master (section 13) overrides defaults.
- Do not start implementation if key decisions are still marked as `TODO`.

## Metadata
- Project: `Democra` (this module was originally developed as `SistemaVolV2.0` and later integrated here)
- Repository root: `d:\PROYECTO\Democra(git)\ONG`
- Primary stack (current): `Vite + React + TypeScript + Supabase`
- Last updated by: `Codex`
- Last updated date: `2026-03-26`
- Document version: `1.0.0`

## 1. Project Overview
### 1.1 Business Context
- Product purpose: `TODO`
- Main user personas: `TODO`
- Primary business domains currently present: `Home`, `Operation`, `Admission`, `Resources`
- Expected domain language: `Spanish labels in UI + technical English in code where useful`

### 1.2 Current Technical Snapshot (Repository Analysis)
- Frontend app with routing under `/admin` and a public `/landing`.
- Domain-based modules under `src/app/modules/*`.
- Data access via Supabase services under `src/app/services/*`.
- Typed database model at `src/lib/db/ong/types.ts`.
- Supabase module manager and client safety guards at `src/lib/db/core.ts`.

### 1.3 Scope and Non-Goals
- In scope: module implementation aligned with RF/CU and DB constraints.
- Out of scope unless explicitly requested: large architectural rewrites, framework migration, and unplanned schema redesign.
- Explicit non-goals for current milestone:
  - no frontend provisioning directo de `auth.users`
  - no operaciones cross-tenant desde browser
  - no uso de `service_role` en cliente
  - no papelera/restore generico para tablas que no documenten soft delete
  - no rediseño de esquemas ni migraciones nuevas fuera de sync contractual

## 2. System Architecture
### 2.1 Layered Architecture (Expected)
- `UI Layer`: pages/components (`src/app/pages`, `src/app/components`)
- `State/Hook Layer`: module hooks (`src/app/modules/*/hooks`, `src/app/modules/*`)
- `Service Layer`: business/data orchestration (`src/app/services/*`)
- `Data Layer`: Supabase client + typed DB model (`src/supabaseClient.ts`, `src/lib/db/*`)

### 2.2 Request Flow Standard
- UI action -> module hook -> service function -> Supabase query/mutation -> mapped response -> UI feedback.

### 2.3 Architecture Rules
- Keep business logic in services, not in pages.
- Hooks orchestrate loading/error/reload state only.
- Reuse shared sanitization and helper functions from domain shared files.
- `TODO`: Define allowed cross-domain dependencies.

### 2.4 Architecture Decisions Log
- Decision template:
  - ID: `ADR-XXX`
  - Context: `TODO`
  - Decision: `TODO`
  - Consequences: `TODO`

## 3. Database Architecture
### 3.1 Data Platform
- Provider: `Supabase (PostgreSQL)`
- Typed schema source of truth in code: `src/lib/db/ong/types.ts`
- Reference documentation/scripts: `guidelines/*`

### 3.2 Current Core Table Families (Observed)
- Volunteers and identity: `voluntarios`, `estados_voluntario`
- Planning/operations: `proyectos`, `tareas`, `actividades`, `asignaciones_actividad`, `asistencias`, `horas_actividad`, `evidencias_actividad`
- Admission: `solicitudes_admision_voluntario` (+ related admission flows in guidelines)
- Resources: `items`, `ubicaciones`, `transacciones_inventario`
- Finance: `cuentas_financieras`, `categorias_financieras`, `transacciones_financieras`, `comprobantes_financieros`
- Governance/approval catalogs: `estados_*`, `tipos_*`, `aprobaciones`

### 3.3 DB Rules to Fill
- Naming convention (tables/columns): `TODO`
- Primary key strategy: `TODO`
- FK and cascade policy: `TODO`
- Mandatory indexes policy: `TODO`
- Migration workflow: `TODO`

## 4. SaaS Multi-Tenant Rules
### 4.1 Tenant Model
- Tenant strategy: `row-based tenant_id (UUID) en public y esquemas de dominio`
- Tenant identifier field: `tenant_id uuid`
- Tenant isolation enforcement: `RLS + public.fn_current_tenant_id() + filtros explicitos por tenant_id en services frontend cuando la consulta toca tablas tenant-bound`

### 4.2 Query Isolation Rules
- Every tenant-bound query must include tenant scope filter.
- No cross-tenant joins without explicit, audited admin permission.
- Super-admin behavior across tenants: `el frontend con anon client permanece tenant-scoped; cualquier lectura/escritura cross-tenant, soporte o provisioning global se resuelve solo en backend seguro/Edge Function con service-role y auditoría`

### 4.3 Tenant Provisioning
- Tenant onboarding flow: `backend seguro crea auth.users, sincroniza public.profiles, crea/activa tenant y sedes base, asigna roles iniciales en public.user_roles_sedes y habilita modulos/contrato segun el Core`
- Seed data per tenant: `sedes base, roles seed/no editables, permisos vinculados y configuracion inicial documentada por scripts Core/ONG`
- Tenant offboarding/archival: `revocar accesos, cerrar sesiones, deshabilitar modulos y conservar datos segun public.plan_policies.retention_days; no se ejecuta hard delete desde frontend`

## 5. Repository Structure
### 5.1 Current Structure (Observed)
```text
src/
  app/
    components/      # ui, shared, layout
    pages/           # route pages
    modules/         # admission, home, operation, resources
    services/        # admision, operacion, recursos
    lib/
    data/
  lib/
    db/
      core.ts
      ong/
        client.ts
        types.ts
  styles/
guidelines/
```

### 5.2 Placement Rules
- New business logic goes into `src/app/services/<dominio>/`.
- New domain state hooks go into `src/app/modules/<domain>/hooks/`.
- Reusable UI primitives go into `src/app/components/ui/`.
- Route pages stay thin and compose hooks/components.
- `TODO`: Define naming convention for new files and folders.

## 6. UI/UX Rules
### 6.1 Navigation Baseline (Current)
- Public route: `/landing`
- Admin shell: `/admin/*`
- Main nav groups currently used: `Inicio`, `Operacion`, `Proyectos`, `Personas`, `Aprobaciones`, `Admision`, `Recursos`, `Notificaciones`, `Gobernanza`, `Configuracion`

### 6.2 Visual System Baseline (Current)
- Theme tokens from `src/app/lib/theme-context.tsx` (`--t-*` variables).
- Global styling from `src/styles/*`.
- Reusable UI primitives from `src/app/components/ui/*`.

### 6.3 UI Rules to Enforce
- Respect existing design tokens; avoid hardcoded random colors.
- Keep forms with clear validation and inline error messaging.
- Ensure desktop and mobile behavior for all new screens.
- `TODO`: Define accessibility minimums (keyboard flow, aria, contrast).
- `TODO`: Define i18n/language policy.

## 7. Coding Conventions
### 7.1 Language and Style
- Primary language: `TypeScript`
- Prefer explicit types over `any`.
- Keep functions focused; extract helpers when logic grows.

### 7.2 Naming
- React components: `PascalCase`
- Hooks: `useXxx`
- Services: `xxx.service.ts`
- Shared service helpers: `shared.ts` per domain where needed.

### 7.3 Error Handling
- Services should throw domain-friendly errors.
- Hooks convert exceptions into UI-safe `error` state.
- Surface actionable user messages (avoid raw technical traces in UI).

### 7.4 Quality Gates
- Lint command: `No definido en package.json`
- Test command: `No definido en package.json`
- Build command: `npm run build`
- Minimum acceptance before merge: `schema verificado contra guidelines, sin role-gating por nombre cuando exista permiso explicito, uso correcto de schema(), y build satisfactorio`

## 8. Data Access Rules
### 8.1 Access Boundaries
- UI components/pages must not query Supabase directly.
- All CRUD operations must go through service layer functions.
- Keep select/insert/update payloads typed with `OngDatabase` where possible.

### 8.2 Query Safety
- Apply explicit filtering and limits.
- Paginate list endpoints when dataset can grow.
- Validate and sanitize IDs/text inputs before query execution.
- Prefer catalog validation before writes (state/type/foreign refs).

### 8.3 Frontend vs Server Credentials
- Frontend must use anon/RLS-safe client only.
- Service role key is server-only and must never be exposed in browser bundles.
- Do not use `VITE_*` for service-role credentials.

## 9. Module Implementation Rules
### 9.1 Standard Delivery Flow for a New Module
1. Define/extend domain types (`src/app/modules/<domain>/types.ts`).
2. Implement service operations in `src/app/services/<dominio>/`.
3. Implement hooks for loading/mutations in `src/app/modules/<domain>/hooks/`.
4. Build/extend page UI in `src/app/pages/`.
5. Register route in `src/app/routes.tsx`.
6. Add or update navigation entry in layout/sidebar when needed.
7. Validate with realistic data and edge cases.

### 9.2 Module Checklist
- List view + filters + loading + empty + error states.
- Detail flow (if required).
- Create/update/delete (soft-delete where required).
- Catalog dependency checks.
- Permissions/RBAC checks.
- Audit and traceability checks.

### 9.3 RF/CU Alignment
- Before implementing, map module to `guidelines/ONGDiccionarioRF.md`.
- Keep naming and flow consistent with business vocabulary and RF IDs.
- `TODO`: Add mandatory RF coverage table per module.

## 10. Security and RBAC
### 10.1 Security Baseline
- Principle of least privilege for all actions.
- Sensitive data access must be role-restricted and auditable.
- Never log secrets, tokens, or full sensitive PII.

### 10.2 RBAC Matrix (Fill Required)
- Roles: `roles tenant-defined en public.roles + seeds/system roles con is_system_role; el frontend no debe inferir permisos por nombre de rol`
- Permission granularity: `module.action` (view/create/update/delete/approve/export/sensitive-read)
- RBAC matrix base:
  - `home.read`
  - `projects.read`, `projects.manage`
  - `operation.activities.read`, `operation.activities.manage`
  - `operation.hours.read`, `operation.hours.manage`, `operation.hours.approve`
  - `operation.attendance.read`, `operation.attendance.manage`, `attendance.scan`
  - `operation.evidence.read`, `operation.evidence.manage`, `operation.evidence.approve`
  - `admission.read`, `admission.manage`, `admission.approve`
  - `resources.inventory.read`, `resources.inventory.manage`
  - `resources.finance.read`, `resources.finance.manage`, `resources.finance.approve`
  - `notifications.read`, `notifications.manage`
  - `governance.catalogs.read`, `governance.audit.read`, `governance.sensitive.read`, `governance.retention.read`
  - `settings.users.read`, `settings.users.manage`
  - `settings.roles.read`, `settings.roles.manage`
  - `settings.sessions.read`, `settings.sessions.terminate`
  - `clinico.volunteer_sensitive.read`, `idcards.read`, `idcards.manage`, `volunteers.invite`, `volunteers.register`
- Deny-by-default policy: `si no existe public.fn_has_permission(permission) o public.fn_is_tenant_admin() para la accion, la UI y los services deben negar la operacion`
- Escalation/approval flow: `provisioning de auth.users, acciones con service-role, soporte cross-tenant y restores regulatorios requieren backend seguro y auditoría; el frontend no eleva privilegios`

### 10.3 Session and Auth Rules
- Auth provider and strategy: `Supabase Auth + public.profiles enlazado por FK a auth.users; el browser usa solo src/supabaseClient.ts (anon/RLS-safe). Crear auth.users o perfiles iniciales requiere backend seguro/Edge Function/API con service-role y jamás frontend directo.`
- Session timeout and revocation: `public.sessions.expires_at es la referencia de expiracion y public.sessions.revoked_at/revoke_reason la referencia de cierre remoto; la UI solo puede leer/cerrar segun permisos settings.* o compatibilidad legacy documentada`
- Password/reset policies: `las credenciales y resets viven en Supabase Auth o backend seguro; frontend no persiste secretos, no expone service-role y solo consume flujos cliente soportados`

## 11. Supabase Integration Rules

CRITICAL RULE: SUPABASE SCHEMA MAPPING

The database is NOT monolithic in the public schema.

Many domain tables are located in custom schemas such as:

- ong
- finanzas
- rrhh
- clinico
- academico
- comunicaciones
- impacto

Therefore it is strictly forbidden to assume that tables exist in public.

Before implementing any Supabase query you MUST:

1. Inspect the SQL scripts in the repository.
2. Identify the exact schema.table location.
3. Map every query to the correct schema.

Example:

Correct:
supabase.schema("ong").from("items")
supabase.schema("ong").from("voluntarios")

Incorrect:
supabase.from("items")
supabase.from("voluntarios")

If the code contains queries like:

supabase.from("items")

you must assume it is a legacy query pointing to public and it must be audited.

You must replace it with the correct schema usage.

ERROR PATTERN DETECTION

If the system shows errors such as:

- 404 table not found
- Could not find table in schema cache
- Invalid schema
- 406 Not acceptable

You must assume one of these problems:

1. Wrong schema mapping
2. Schema not exposed in Supabase API
3. Wrong table name
4. Wrong column names

You must debug the root cause and fix it across services, hooks and components.

REPOSITORY FIRST RULE

Never guess table names.

Always confirm them by reading the SQL scripts inside the repository:

- ONG - script - 3 - MODULOS-FIN - nuevo
- SUBS - script - 2 - COMPLETO - nuevo

Then update the Supabase queries accordingly.

REGLA CRÍTICA DE ESQUEMAS SUPABASE

La nueva base de datos NO es monolítica en public.
El sistema usa múltiples esquemas, por ejemplo:

- public
- ong
- finanzas
- rrhh
- clinico
- academico
- comunicaciones
- impacto

Por lo tanto, está PROHIBIDO asumir que una tabla vive en public.

Toda consulta, inserción, actualización o lectura en Supabase debe validar primero el esquema real de la tabla en los scripts SQL y documentación del repositorio.

Si una tabla pertenece a un esquema distinto de public, debes usar explícitamente el acceso con schema correcto.

Ejemplo correcto:

supabase.schema("ong").from("voluntarios")
supabase.schema("ong").from("proyectos")
supabase.schema("finanzas").from("transacciones")

Ejemplo incorrecto:

supabase.from("voluntarios")
supabase.from("proyectos")
supabase.from("transacciones")

REGLAS OBLIGATORIAS DE IMPLEMENTACIÓN PARA ESQUEMAS

1. Antes de modificar cualquier módulo, debes mapear cada entidad a su esquema real.
2. Debes revisar si la tabla pertenece a public, ong, finanzas, rrhh u otro esquema.
3. Debes corregir cualquier consulta legacy que aún asuma public por defecto.
4. Debes auditar services, hooks y componentes para detectar consultas con schema incorrecto.
5. Si detectas errores tipo:
   - Invalid schema
   - 406 Not Acceptable
   - relation does not exist
   - tabla no encontrada
   debes asumir primero un problema de schema incorrecto o tabla mal mapeada.
6. No debes crear soluciones temporales con mocks para ocultar estos errores.
7. Si varias consultas usan el mismo esquema, puedes crear helpers reutilizables del proyecto para evitar repetición, siempre respetando la arquitectura existente.

PATRÓN RECOMENDADO

Si el proyecto lo permite, centraliza accesos por esquema en services o helpers, por ejemplo:

- ongTable("voluntarios")
- finanzasTable("transacciones")

pero solo si encaja con la arquitectura actual del repositorio.

VERIFICACIÓN OBLIGATORIA

En cada implementación debes comprobar:
- que el schema usado coincide con los scripts SQL nuevos
- que la tabla existe realmente
- que los nombres de columnas son reales
- que tenant_id, UUID y RLS se respetan
- que no quedaron consultas heredadas apuntando implícitamente a public

CITAS OBLIGATORIAS

Cuando corrijas una consulta por schema, debes citar el archivo del repositorio que demuestra el esquema correcto.

Ejemplo:
"Se cambió la consulta a supabase.schema('ong').from('voluntarios') porque según 'ONG - script - 3 - MODULOS-FIN - nuevo' la tabla voluntarios pertenece al esquema ong."

### 11.1 Environment Variables
- Expected module prefix in this repo: `ONG_DB`
- Required vars:
  - `ONG_DB_SUPABASE_URL`
  - `ONG_DB_SUPABASE_ANON_KEY`
  - `ONG_DB_SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `VITE_ONG_DB_SUPABASE_URL`
  - `VITE_ONG_DB_SUPABASE_ANON_KEY`

### 11.2 Client Usage Rules
- Frontend uses `supabase` from `src/supabaseClient.ts` (anon client).
- Server-only operations must use guarded service-role client patterns from `src/lib/db/core.ts`.
- Never leak service-role credentials to client-side code.

### 11.3 Schema and Type Sync
- After schema changes, regenerate/update TS types in `src/lib/db/ong/types.ts`.
- Any breaking DB change must include:
  - migration script
  - service updates
  - UI impact review
  - RBAC/RLS review

## 12. Soft Delete and Audit Rules
### 12.1 Soft Delete Contract
- For critical entities, use:
  - `is_deleted: boolean`
  - `deleted_at: timestamptz`
  - `deleted_by: string`
- Default read behavior must exclude deleted records unless explicitly requested.
- Delete actions in UI should call logical delete (update), not physical delete.

### 12.2 Audit Contract
- Track write operations with:
  - actor/user id
  - timestamp
  - action type
  - entity and record id
  - before/after values when applicable
- Sensitive reads/writes should be logged with additional context (`reason`, `ip`, `user_agent`) when available.

### 12.3 Recovery and Retention
- Define retention window: `plan-driven desde public.plan_policies.retention_days (basic=180, pro=365, enterprise=1095) salvo exigencia legal mas estricta`
- Define restore flow for soft-deleted entities: `solo aplica a tablas que realmente tengan is_deleted, deleted_at y deleted_by; el restore es UPDATE via service -> Supabase, limpiando flags/campos y preservando auditoría. Si la tabla no documenta soft delete, no se expone restore.`
- Define hard-delete archival policy: `solo para tablas cuyo contrato documental no tenga soft delete o para procesos backend post-retencion; frontend no debe inventar borrado fisico sobre datos tenant-bound`

## 13. PROMPT MASTER FOR CODEX
<!--
DEVELOPER INSTRUCTIONS:
- Paste your full Prompt Master below between START/END markers.
- This section is intended to become the highest-priority project contract for AI implementation behavior.
- Keep it updated when architecture, security, or workflow rules change.
-->

```md
[PROMPT_MASTER_START]
Actúa como un Arquitecto de Software Full-Stack Senior y Especialista en PostgreSQL/Supabase para sistemas SaaS Multi-Tenant. Eres experto en React/Vite, TypeScript, Supabase, RLS, arquitectura modular, validaciones robustas, refactorización segura y migración de código legacy a una nueva base de datos multi-esquema.

OBJETIVO PRINCIPAL
Tu tarea NO es rediseñar la aplicación. Tu tarea es AUDITAR el repositorio actual y REHACER el módulo o submódulo que te indique para que funcione EXCLUSIVAMENTE con la nueva base de datos SaaS Multi-Tenant, reemplazando cualquier lógica vieja, mock, hardcode o referencia a la BD antigua.

DEBES EJECUTAR CAMBIOS REALES EN EL CÓDIGO.
NO te quedes en recomendaciones teóricas.
NO inventes una arquitectura paralela si el proyecto ya tiene una estructura útil.
NO rompas la UI existente.
NO hagas simplificaciones peligrosas.
NO ignores atributos de tablas.
NO uses mocks.
NO uses any.
NO uses listas hardcodeadas si existe catálogo real.

CONTEXTO ARQUITECTÓNICO OBLIGATORIO
Este proyecto fue construido originalmente sobre una BD monolítica antigua de esquema único. Eso ya NO es válido como implementación.
Ahora existe una NUEVA BD SaaS Multi-Esquema con estas reglas obligatorias:

1. CORE EN public
- public.tenants
- public.sedes
- public.profiles
- public.roles
- public.role_permissions
- public.user_roles_sedes
- public.audit_logs
- funciones como public.fn_current_tenant_id(), public.fn_has_permission(), public.fn_is_tenant_admin()
- catálogos core y políticas RLS

2. DOMINIO ONG EN ESQUEMAS NUEVOS
Debes consultar el repositorio y usar las tablas REALES del script nuevo, por ejemplo:
- ong.voluntarios
- ong.beneficiarios
- ong.proyectos
- ong.areas
- ong.ubicaciones
- ong.items
- ong.asignaciones_actividad
- ong.evidencias_actividad
- ong.recursos_proyecto
- ong.transacciones_inventario
- finanzas.cuentas
- finanzas.categorias
- finanzas.transacciones
- rrhh.habilidades
- rrhh.voluntario_habilidades
- rrhh.documentos_voluntario
- y otros esquemas reales del proyecto como clinico, academico, comunicaciones, impacto, etc., si el módulo lo requiere

3. REGLAS OBLIGATORIAS DE DATOS
- Todas las tablas transaccionales nuevas usan tenant_id con UUID
- Las PK nuevas son UUID con gen_random_uuid()
- Debes respetar el esquema correcto: public, ong, finanzas, rrhh, clinico, academico, comunicaciones, impacto, etc.
- Debes respetar RLS y asumir que el usuario autenticado solo ve su tenant
- Si existe función o política basada en public.fn_current_tenant_id(), no la rompas
- Los catálogos globales NO deben hardcodearse en el front si existen en BD
- Si una entidad ahora pertenece a otro esquema o tiene otra forma, debes traducirla correctamente
- La BD antigua es solo referencia histórica para mapear equivalencias, NO para seguir usándola

NAVEGACIÓN OFICIAL DEL FRONTEND
Debes respetar y usar la agrupación funcional oficial del proyecto:
- Home
  - Dashboard
  - Búsqueda global
- Operación
  - Actividades
  - Asistencias
  - Horas
  - Evidencias
- Proyectos
  - Proyectos
  - Tareas
  - Actividades
  - Asignaciones
- Personas
  - Voluntarios
  - Beneficiarios
  - Ficha médica sensible
- Aprobaciones
  - Bandeja de aprobaciones
  - Aprobación de horas
- Admisión
  - Solicitudes
  - Documentos
  - Entrevistas
  - Onboarding
- Recursos
  - Inventario
  - Finanzas
  - Cursos y Certificados
- Notificaciones
  - Plantillas
  - Historial
- Gobernanza
  - Catálogos
  - Auditoría
  - Accesos a datos sensibles
  - Soft delete / Retención
- Configuración
  - Usuarios del sistema
  - Roles y permisos
  - Seguridad de sesión

REGLA FUNCIONAL CLAVE
En cada submódulo debes implementar como mínimo:
- Listar
- Ver detalle
- Crear
- Editar
- Eliminar lógico si aplica

Si NO aplica CRUD puro, debes implementar la acción operativa equivalente.
Ejemplos:
- aprobar/rechazar
- marcar entrada/salida
- registrar horas
- subir/validar evidencia
- asignar voluntario
- cambiar estado
- validar documento
- ejecutar onboarding
- registrar transacción
- revocar acceso
- restaurar registro soft deleted

CERO OMISIONES DE ATRIBUTOS
Debes usar TODOS los atributos importantes y reales de las tablas objetivo del módulo.
No simplifiques formularios dejando fuera columnas relevantes.
Si una tabla tiene codigo, nombre, descripcion, estado, activo, unidad, fechas, created_by, updated_by, tenant_id, etc., debes evaluarlos e implementar lo que corresponda.
Si hay campos autogenerados o de sistema, manejarlos correctamente.
No asumas que “sobran” columnas.

DESCUBRIMIENTO Y ANCLAJE OBLIGATORIO
Antes de modificar cualquier archivo, debes auditar:
1. package.json para ver librerías permitidas
2. estructura de carpetas
3. rutas actuales
4. layouts existentes
5. components/ui, shared, common o equivalentes
6. hooks existentes
7. services existentes
8. clientes Supabase ya configurados
9. tipos Database generados
10. mocks, seeds, fake arrays, fixtures, hardcoded data
11. formularios existentes para copiar patrón de validación
12. documentación interna del repositorio
13. los documentos funcionales y scripts SQL presentes en el repo

PROHIBICIONES
- No instales nuevas librerías si no están en package.json
- No cambies innecesariamente el diseño visual
- No muevas todo el proyecto de arquitectura por gusto
- No inventes endpoints si ya existe cliente Supabase directo
- No uses datos mock
- No rompas navegación, layout, dark mode, sidebar, rutas ni componentes base
- No hagas DELETE físico si el dominio usa soft delete
- No ignores auditoría/trazabilidad si el módulo la requiere
- No ignores permisos/RBAC si el módulo toca seguridad o datos sensibles
- No dejes formularios inline dentro de la página principal

REGLAS DE UI/UX OBLIGATORIAS
- Mantén la UI actual
- Cero formularios inline
- Crear / editar / ver detalle debe abrirse en Modal, Drawer o patrón ya existente del proyecto
- Si el proyecto usa Modal:
  - backdrop oscuro obligatorio
  - cierre por X o clic exterior
  - respetar tema visual actual
- Siempre implementar estados:
  - loading
  - empty
  - error
  - retry
- Usa skeletons, spinners, alerts, toasts o componentes existentes del repo
- Si ya existe un patrón de tabla/listado/filtros/modales, reutilízalo

ARQUITECTURA OBLIGATORIA DE CÓDIGO
Sigue estrictamente esta separación:
- services: acceso a Supabase/BD
- hooks: estado, fetching, mutaciones, invalidación, side effects
- schemas/validators: validación y transformación
- types: tipos e interfaces
- components: UI pura
- pages/routes: composición

REGLAS DE IMPLEMENTACIÓN CON SUPABASE
- Usa el cliente Supabase real ya existente
- Usa tipos Database del proyecto
- Evita any
- Usa selects explícitos
- Si aplica paginación o rangos, implementarlos
- Si hay joins o relaciones, respeta los nombres reales
- Si el schema no es public, consulta explícitamente el schema correcto
- Si el repo usa RPC o funciones SQL, reutilízalas
- En cada mutación contempla:
  - created_by
  - updated_by
  - deleted_at / deleted_by / is_deleted / activo
  - timestamps
  - tenant_id si corresponde
- Si la tabla tiene unique constraints, valida antes o maneja bien el error de Supabase
- Si la tabla usa catálogos, consultar catálogo real
- Si el módulo toca datos sensibles, dejar ganchos de verificación de permisos

SOFT DELETE OBLIGATORIO
Si el dominio usa soft delete:
- Listados deben ocultar eliminados por defecto
- Eliminar debe ser UPDATE, no DELETE
- Debes registrar deleted_at y deleted_by si existen
- Si existe vista de papelera, contemplarla
- Si hay retención o restauración, respetarla

AUDITORÍA Y TRAZABILIDAD
Si el esquema, tabla o flujo requiere auditoría:
- Debes preservar campos de auditoría
- No romper triggers existentes
- No saltarte updated_at / updated_by
- Si hay acciones sensibles, dejar la operación trazable
- Si el módulo usa audit_logs o accesos_sensibles, integrarlo o dejar el punto exacto preparado

RBAC Y SEGURIDAD
- No asumas acceso universal
- Revisa roles/permisos existentes del proyecto
- Si el módulo requiere restricción, deja guardas o checks reutilizando el sistema actual
- Si una vista es solo para rol autorizado, no la expongas libremente
- Si el módulo depende de tenant actual, usa el mecanismo real del proyecto y no una constante ficticia

VALIDACIONES OBLIGATORIAS
- Reutiliza la librería existente en el repo: Zod, Yup, React Hook Form u otra
- Copia el patrón de un formulario existente bien hecho
- Valida frontend de manera backend-friendly
- Maneja:
  - required
  - formatos
  - emails
  - fechas
  - rangos numéricos
  - strings vacíos
  - duplicados
  - relaciones inexistentes
  - estado inválido
  - archivos inválidos si aplica
- Muestra errores amigables al usuario
- Mapea errores de Supabase cuando sea posible

ESTÁNDARES DE IMPLEMENTACIÓN POR SUBMÓDULO
Para cada submódulo que te pida, debes:
1. mapearlo a la navegación oficial
2. identificar RF/CU relacionados en la documentación
3. identificar tablas reales nuevas
4. detectar si el código actual usa tablas antiguas o mocks
5. reemplazar completamente esa lógica
6. implementar GET/POST/PATCH o su equivalente mediante Supabase
7. conectar catálogos reales
8. respetar tenant_id, UUID, RLS, soft delete, auditoría
9. dejar el flujo funcional de extremo a extremo
10. no tocar módulos no relacionados salvo dependencias mínimas necesarias

FORMATO DE RESPUESTA OBLIGATORIO
Devuélveme SIEMPRE la respuesta en este formato exacto:

PASO 0. Auditoría del repositorio
- archivos revisados
- documentos y scripts encontrados
- rutas impactadas
- componentes reutilizables encontrados
- hooks/services reutilizables
- tipos reutilizables
- mocks/hardcodes detectados
- diferencias encontradas entre el código actual y la nueva BD

- detectar consultas Supabase con schema implícito incorrecto
- detectar uso indebido de supabase.from(...) sobre tablas que ya no están en public
- mapear cada tabla usada por el módulo a su esquema real según scripts SQL


PASO 1. Mapeo funcional y técnico
- submódulo objetivo
- ubicación en la navegación
- RF/CU relacionados
- tablas nuevas reales a usar
- tablas viejas/obsoletas detectadas
- catálogos reales requeridos
- acciones CRUD u operativas a implementar
- reglas de seguridad / RBAC / sensibilidad

PASO 2. Plan exacto de implementación
- qué archivos crearás
- qué archivos editarás
- qué archivos eliminarás o limpiarás
- qué patrones existentes reutilizarás
- qué NO tocarás para evitar romper la app

PASO 3. Implementación
- aplica los cambios directamente
- muestra el diff o el contenido final de los archivos modificados
- no uses pseudocódigo
- no dejes TODOs vacíos
- si un archivo clave cambia, entrégalo completo

PASO 4. Validaciones y anti-errores
- validaciones exactas aplicadas
- manejo de errores Supabase
- loading / empty / error / retry
- edge cases contemplados
- estrategia anti-mock
- estrategia anti-regresión

PASO 5. Criterios de aceptación
- checklist funcional verificable
- qué debe poder hacer el usuario
- qué datos deben verse
- qué acciones deben persistir realmente en Supabase

PASO 6. Riesgos detectados
- riesgos técnicos
- riesgos de datos
- riesgos de permisos
- riesgos por divergencia entre repo y scripts
- mitigación exacta

PASO 7. Resultado final
- resumen breve de qué quedó operativo
- deuda pendiente real solo si es estrictamente necesaria

MODO DE TRABAJO OBLIGATORIO
- Piensa antes de editar
- Audita primero
- Reutiliza primero
- Conecta a la BD real
- Implementa completo
- Verifica que compile
- No maquilles con datos falsos
- No respondas con teoría si puedes ejecutar cambios concretos

REGLA FINAL
Cada vez que te indique un módulo o submódulo, debes asumir que quieres dejarlo funcional con la NUEVA BD SaaS MULTI-ESQUEMA al 100%, usando operaciones reales de Supabase, estructura modular, catálogos reales, trazabilidad, seguridad y UI existente intacta.

Ahora ejecuta el trabajo sobre el submódulo que te indique a continuación.

Submódulo objetivo: [NOMBRE DEL SUBMÓDULO]

Quiero que lo rehagas completo contra la nueva BD multi-esquema.
No uses la BD antigua salvo como mapa de traducción mental.
No uses mocks.
No rompas la UI.
Debes implementar listar, ver detalle, crear, editar y eliminar lógico, o la acción operativa equivalente si no aplica CRUD puro.
Debes usar todos los atributos relevantes de las tablas reales.
Debes conectar catálogos reales.
Debes respetar tenant_id, UUID, RLS, soft delete, auditoría y RBAC.
Debes auditar primero el repo y luego aplicar cambios concretos.
Entrega la respuesta en el formato PASO 0 a PASO 7.

[PROMPT_MASTER_END]
```

---

## Final Note For AI Agents
- Before implementing any module, re-read this file and confirm compliance with sections 2 through 13.
- If this file is incomplete, pause architectural decisions and request missing constraints from the developer.


Always read repository documentation and SQL scripts before implementing changes.
Cite repository files when making technical decisions.
