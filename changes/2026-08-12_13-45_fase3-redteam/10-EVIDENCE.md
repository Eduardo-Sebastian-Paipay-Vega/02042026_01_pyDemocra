# 10 - REGISTRO DE EVIDENCIA TÉCNICA Y PRUEBAS (EVIDENCE)

## 1. Evidencia BOLA / Multi-Tenant (`server/routes/iam.js`)

```javascript
// Verificación previa de propiedad en asignación de user-roles
const [userRes, roleRes, sedeRes] = await Promise.all([
  applyTenantScope(serviceClient.from("profiles").select("id").eq("id", user_id), ctx.tenantId).single(),
  applyTenantScope(serviceClient.from("roles").select("id").eq("id", role_id), ctx.tenantId).single(),
  applyTenantScope(serviceClient.from("sedes").select("id").eq("id", sede_id), ctx.tenantId).single(),
]);

if (!userRes.data || !roleRes.data || !sedeRes.data) {
  return sendError(res, 404, "IAM-001", {
    error_type: "validation",
    message: "Usuario, rol o sede invalido para el tenant actual.",
  });
}
```

---

## 2. Evidencia CSP para Swagger UI (`server/index.js`)

```javascript
app.use(
  "/api/docs",
  (_req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument)
);
```

---

## 3. Evidencia Suite de Pruebas Multi-Tenant (`server/routes/security.multitenant.test.js`)
Pruebas ejecutadas con resultado PASS demostrando denegación ante intentos de inyección y forjado de `tenant_id`.
