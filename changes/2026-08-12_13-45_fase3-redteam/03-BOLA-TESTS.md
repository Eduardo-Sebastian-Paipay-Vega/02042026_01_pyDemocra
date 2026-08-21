# 03 - BOLA / IDOR PRUEBAS OFENSIVAS (BOLA-TESTS)

## 1. Vector 1: Cross-Tenant Read (`GET /api/sedes`, `GET /api/iam/roles`)
- **Actor:** Atacante A2 (Tenant A).
- **Ataque:** Petición `GET /api/sedes` enviando cabecera o query string `tenant_id=TENANT_B_UUID`.
- **Resultado en Servidor:** El servidor ignora el parámetro `tenant_id` enviado y extrae el `tenant_id` autenticado del perfil del JWT (`TENANT_A_UUID`).
- **Respuesta API:** HTTP 200 OK con únicamente las sedes pertenecientes al Tenant A.
- **Resultado Pentest:** **CONFIRMED SECURE**.

---

## 2. Vector 2: Cross-Tenant Update en Sedes (`PUT /api/sedes/:sedeId`)
- **Actor:** Atacante A2 (Tenant A).
- **Ataque:** Petición `PUT /api/sedes/SEDE_TENANT_B_UUID` intentando renombrar la sede de Tenant B.
- **Mecanismo de Defensa:**
  ```javascript
  applyTenantScope(
    serviceClient.from("sedes").update(patch).eq("id", req.params.sedeId),
    ctx.tenantId
  );
  ```
- **Consulta Generada:** `UPDATE sedes SET name = ... WHERE id = 'SEDE_TENANT_B_UUID' AND tenant_id = 'TENANT_A_UUID'`.
- **Resultado en Base de Datos:** 0 filas modificadas.
- **Respuesta API:** HTTP 404 Not Found / 400 Validation.
- **Resultado Pentest:** **CONFIRMED SECURE**.

---

## 3. Vector 3: Inyección de Permiso a Rol Ajeno (`POST /api/iam/roles/:roleId/permissions`)
- **Actor:** Atacante A5 (Admin Tenant A).
- **Ataque:** Petición `POST /api/iam/roles/ROLE_TENANT_B_UUID/permissions` enviando `{"permission": "system.admin"}`.
- **Mecanismo de Defensa:** Se incorporó la validación previa:
  ```javascript
  const { data: role } = await applyTenantScope(
    serviceClient.from("roles").select("id").eq("id", roleId),
    ctx.tenantId
  ).single();
  if (!role) return sendError(res, 404, "IAM-001");
  ```
- **Resultado Pentest:** **CONFIRMED SECURE**. Petición denegada con HTTP 404 "Rol no encontrado para el tenant actual".

---

## 4. Vector 4: Asignación Cross-Tenant de Usuario y Sede (`POST /api/iam/user-roles`)
- **Actor:** Atacante A2 (Tenant A).
- **Ataque:** Enviar `{"user_id": "USER_TENANT_A", "role_id": "ROLE_TENANT_A", "sede_id": "SEDE_TENANT_B"}`.
- **Mecanismo de Defensa:** Se incorporó la validación en paralelo:
  ```javascript
  const [userRes, roleRes, sedeRes] = await Promise.all([
    applyTenantScope(serviceClient.from("profiles").select("id").eq("id", user_id), ctx.tenantId).single(),
    applyTenantScope(serviceClient.from("roles").select("id").eq("id", role_id), ctx.tenantId).single(),
    applyTenantScope(serviceClient.from("sedes").select("id").eq("id", sede_id), ctx.tenantId).single(),
  ]);
  if (!userRes.data || !roleRes.data || !sedeRes.data) return sendError(res, 404, "IAM-001");
  ```
- **Resultado Pentest:** **CONFIRMED SECURE**. Petición denegada con HTTP 404 "Usuario, rol o sede invalido para el tenant actual".
