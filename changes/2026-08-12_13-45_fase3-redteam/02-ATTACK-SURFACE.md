# 02 - INVENTARIO DE SUPERFICIE DE ATAQUE (ATTACK SURFACE)

## 1. Mapeo de Actores de Amenaza (Threat Model)

- **A1 (Usuario No Autenticado):** Atacante anónimo sin credenciales. Intenta acceder a APIs privadas, registrar tenants fraudulentos o saltarse la autenticación.
- **A2 (Usuario Autenticado Tenant A):** Usuario legítimo del Tenant A. Intenta leer o escribir datos pertenecientes a Tenant B (BOLA/IDOR).
- **A3 (Usuario Autenticado Tenant B):** Usuario legítimo del Tenant B. Servirá como objetivo pasivo o atacante simétrico de Tenant A.
- **A4 (Usuario con Permisos Bajos):** Usuario miembro sin roles administrativos. Intenta realizar acciones privilegiadas dentro de su propio tenant (Escalación Vertical).
- **A5 (Usuario Administrativo):** Admin de Tenant A. Intenta administrar el Tenant B o elevar privilegios a nivel de sistema.
- **A6 (Atacante con JWT de otro Tenant):** Forja o inyecta el `tenant_id` de la víctima en headers, body o query strings.
- **A7 (Atacante con IDs Válidos):** Conoce UUIDs de sedes, roles o miembros de Tenant B.
- **A8 (Atacante con Peticiones Manipuladas):** Modifica payloads con mass assignment, type confusion o fuzzing.

---

## 2. Inventario de Endpoints Express (`server/routes/`)

| Endpoint | Método | Autenticación | Autorización | Tenant Scope | Input Validation | Riesgo Pentest |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/risk-evaluate` | POST | Bearer JWT | Internal Risk Engine | `resolveTenantOrError` | Type & Regex check | Low |
| `/api/auth/step-up/verify-otp` | POST | Bearer JWT | OTP Challenge check | Session scoped | Strict 6-digit OTP | Low |
| `/api/iam/roles` | GET | Bearer JWT | `readRoles` | `applyTenantScope` | Scoped Query | Low |
| `/api/iam/roles` | POST | Bearer JWT | `manageRoles` | `applyTenantScope` | String Trim (120) | Low |
| `/api/iam/roles/:roleId` | PUT | Bearer JWT | `manageRoles` | `applyTenantScope` + `roleId` verify | Param & Body check | Low |
| `/api/iam/roles/:roleId` | DELETE | Bearer JWT | `manageRoles` | `applyTenantScope` + `roleId` verify | UUID Check | Low |
| `/api/iam/roles/:roleId/permissions` | POST | Bearer JWT | `manageRoles` | Verify `roleId` belongs to `tenant_id` | String Trim (120) | Low |
| `/api/iam/roles/:roleId/permissions/:p` | DELETE | Bearer JWT | `manageRoles` | Verify `roleId` belongs to `tenant_id` | String Trim (120) | Low |
| `/api/iam/user-roles` | GET | Bearer JWT | `readUsers` / `readRoles` | `applyTenantScope` | Query filter | Low |
| `/api/iam/user-roles` | POST | Bearer JWT | `manageUsers` / `manageRoles` | Verify `user_id`, `role_id`, `sede_id` | UUID Ownership check | Low |
| `/api/iam/user-roles/:assignmentId` | DELETE | Bearer JWT | `manageUsers` / `manageRoles` | `applyTenantScope` | Assignment ID check | Low |
| `/api/sedes` | GET | Bearer JWT | Session Auth | `applyTenantScope` | Scoped Query | Low |
| `/api/sedes` | POST | Bearer JWT | Admin / Permission | `applyTenantScope` | Name String check | Low |
| `/api/sedes/:sedeId` | PUT | Bearer JWT | Admin / Permission | `applyTenantScope` | Sede ID & Patch | Low |
| `/api/sedes/:sedeId` | DELETE | Bearer JWT | Admin / Permission | `applyTenantScope` | Soft Delete scope | Low |
| `/api/onboarding/validate-ruc/:ruc` | GET | Ninguna (Pública) | Validation Rate Limit | N/A | RUC Regex (`^\d{11}$`) | Low |
| `/api/onboarding/bootstrap-tenant` | POST | Bearer JWT | Session User | Self-Bootstrapping RPC | Strict RUC & Name | Low |
| `/api/audit/summary` | POST | Bearer JWT | Session Tenant | Verify `tenantId === profile.tenant_id` | Audit Payload | Low |
| `/api/docs` | GET | Ninguna (Pública) | Rate Limit Exempt | N/A | OpenAPI Specification | Low |
