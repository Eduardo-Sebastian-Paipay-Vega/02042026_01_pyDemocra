# 04 - RBAC / PRIVILEGE ESCALATION PRUEBAS OFENSIVAS (RBAC-TESTS)

## 1. Escalación Vertical: Usuario Miembro Crea Sede (`POST /api/sedes`)
- **Actor:** Atacante A4 (Usuario con permisos normales, sin `canManageSedes`).
- **Ataque:** Envío directo de petición `POST /api/sedes` con payload `{"name": "Sede Fracaso"}` llamando la API de Express (bypass de React Router).
- **Mecanismo de Defensa:**
  ```javascript
  const ctx = await resolveSedesContext(req, res);
  if (!ctx.canManageSedes) {
    return sendError(res, 403, "IAM-003", { error_type: "auth" });
  }
  ```
- **Resultado API:** HTTP 403 Forbidden con código de error `IAM-003`.
- **Resultado Pentest:** **CONFIRMED SECURE**.

---

## 2. Escalación Vertical: Modificación de Roles de Sistema (`PUT /api/iam/roles/:roleId`)
- **Actor:** Atacante A5 (Admin Tenant A).
- **Ataque:** Intentar modificar o eliminar el rol predeterminado de sistema "Owner" (`is_system_role = true`).
- **Mecanismo de Defensa:**
  ```javascript
  applyTenantScope(
    serviceClient.from("roles").update(patch).eq("id", roleId).eq("is_system_role", false),
    ctx.tenantId
  );
  ```
- **Resultado en Base de Datos:** Ningún registro actualizado debido al filtro `.eq("is_system_role", false)`.
- **Resultado Pentest:** **CONFIRMED SECURE**.

---

## 3. Asignación Directa de Rol Administrador por Inyección de Mass Assignment
- **Actor:** Atacante A4.
- **Ataque:** Petición `POST /api/iam/user-roles` inyectando propiedades adicionales como `{"is_admin": true, "super_user": true}`.
- **Mecanismo de Defensa:** El backend extrae únicamente los campos `user_id`, `role_id` y `sede_id` autorizados, descartando cualquier propiedad extra.
- **Resultado Pentest:** **CONFIRMED SECURE**.
