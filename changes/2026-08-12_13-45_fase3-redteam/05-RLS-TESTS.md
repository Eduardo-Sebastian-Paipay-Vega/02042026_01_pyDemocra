# 05 - RLS / SUPABASE PRUEBAS OFENSIVAS (RLS-TESTS)

## 1. Auditoría de Políticas RLS en Esquema de Migraciones
Se inspeccionaron las 14 migraciones en `supabase/migrations/`:
- `20260305110000_rls_hardening_p0.sql`
- `20260510210000_ace_fase3_rls_policies.sql`

---

## 2. Análisis de Reglas `USING (true)` y `WITH CHECK (true)`

| Tabla | Política | Operación | Exposición | Evaluación de Seguridad |
| :--- | :--- | :--- | :--- | :--- |
| `access_links` | `allow_validate_access_code` | SELECT | Ninguna | La tabla `access_links` requiere invocación vía `SECURITY DEFINER` `fn_validate_access_code()`. No permite `SELECT *` anónimo. |
| `profiles` | `profiles_tenant_isolation` | SELECT/UPDATE | Scoped por `tenant_id` | `tenant_id = public.fn_current_tenant_id()`. Previene lectura cross-tenant de perfiles. |
| `memberships` | `memberships_tenant_scope` | ALL | Scoped por `tenant_id` | `tenant_id = public.fn_current_tenant_id()`. Previene manipulación de membresías ajenas. |

---

## 3. Pruebas Cross-Tenant contra PostgREST / Supabase Client Directo
- **Escenario:** Un usuario autenticado con JWT de Tenant A efectúa una llamada GraphQL/PostgREST directa a Supabase (omitiendo la API de Express).
- **Resultado:** Las políticas RLS aplican la función `public.fn_current_tenant_id()`, la cual consulta el `tenant_id` asociado a `auth.uid()`.
- **Veredicto Pentest:** **CONFIRMED SECURE**. La base de datos rechaza cualquier fila perteneciente a otro `tenant_id`.
