# ADR-001: Implementación de Multi-Tenancy mediante PostgreSQL RLS
> **Fase 5 | Arquitectura y Desarrollo** | Estado: Aceptado | Fecha: 2026-07-09

## Contexto
Democra es un SaaS B2B donde múltiples Organizaciones No Gubernamentales (ONGs) gestionan datos altamente sensibles (personas, finanzas, historiales médicos). Es un requerimiento absoluto garantizar que una ONG no pueda acceder, accidental o intencionadamente, a los datos de otra ONG bajo ninguna circunstancia (Fuga de datos inter-tenant). 

Se debía decidir el modelo de arquitectura de base de datos multi-tenant:
1. Base de datos separada por tenant (Isla).
2. Esquema separado por tenant dentro de la misma BD.
3. Tablas compartidas con columna `tenant_id` y validación a nivel de aplicación.
4. Tablas compartidas con columna `tenant_id` y validación a nivel de base de datos (PostgreSQL RLS).

## Decisión
Se decidió implementar el modelo **Tablas compartidas con columna `tenant_id` y validación a nivel de base de datos mediante PostgreSQL Row Level Security (RLS)**.

### Detalles de implementación:
- Toda petición autenticada porta un JWT generado por Supabase Auth. El `tenant_id` se inyecta en los claims del usuario al momento de su inicio de sesión o asignación.
- Se creó la función PL/pgSQL `fn_current_tenant_id()` que lee de forma segura el claim del JWT (`auth.jwt() ->> 'tenant_id'`).
- Todas las tablas de negocio incluyen la columna obligatoria `tenant_id UUID NOT NULL`.
- Se aplican políticas RLS en todas las tablas: `CREATE POLICY "tenant_isolation" ON table_name FOR ALL USING (tenant_id = fn_current_tenant_id());`

## Consecuencias Positivas
- **Seguridad Garantizada:** Incluso si un desarrollador olvida agregar `WHERE tenant_id = X` en una consulta de frontend, la base de datos abortará la lectura de registros de otros tenants. El aislamiento es "Fail-Safe".
- **Eficiencia en Costos:** Al compartir la misma base de datos, el costo de infraestructura es drásticamente menor que mantener instancias o esquemas separados, permitiendo ofrecer planes freemium a ONGs pequeñas.
- **Mantenibilidad:** Una sola migración de esquema aplica a todos los tenants simultáneamente.

## Consecuencias Negativas (Trade-offs)
- **Complejidad en el Backend:** Cuando el backend (Express) necesita realizar operaciones administrativas (como el onboarding de un tenant), no existe un JWT de usuario. Debe utilizar la `service_role` key que bypassa el RLS, lo que transfiere toda la responsabilidad de seguridad (filtrar por `tenant_id`) de vuelta al código de la aplicación (mitigado con el middleware `assertTenantScope()`).
- **Rendimiento:** La evaluación de políticas RLS añade un ligero overhead computacional a cada query, aunque PostgreSQL 16 lo ha optimizado significativamente. Se requiere indexar correctamente la columna `tenant_id`.
