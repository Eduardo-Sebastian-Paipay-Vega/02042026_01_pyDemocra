# FILES CHANGED — Remedación de AI Security Debt (Fase 2)

- `server/routes/iam.js`: Modificado. Se agregó validación previa de pertenencia al tenant autenticado para `roleId`, `user_id` y `sede_id` en endpoints de asignación y eliminación de permisos y roles.
- `server/index.js`: Modificado. Se configuró cabecera CSP explícita para `/api/docs` (Swagger UI).
- `server/routes/security.multitenant.test.js`: Creado. Pruebas unitarias de aislamiento multi-tenant y prevención de BOLA/IDOR.
