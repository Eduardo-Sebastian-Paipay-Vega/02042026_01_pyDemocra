# CHANGELOG — Remedación de AI Security Debt (Fase 2)

- **Fecha:** 2026-08-12 13:18 UTC-5
- **Objetivo:** Ejecutar la Fase 2 de remedación de deuda de seguridad de IA en el proyecto Democra (`D:\espelo`).
- **Contexto:** Se completó el análisis forense de la Fase 1 y la verificación de remediaciones. En esta iteración se identificaron y corrigieron vectores BOLA residuales en `POST /roles/:roleId/permissions`, `DELETE /roles/:roleId/permissions/:permission` y `POST /user-roles` en `server/routes/iam.js`.
- **Solución implementada:** 
  - Verificación previa de pertenencia al tenant autenticado (`ctx.tenantId`) para los parámetros `roleId`, `user_id` y `sede_id` antes de realizar inserciones o eliminaciones en `role_permissions` y `user_roles_sedes`.
  - Creación de la suite de pruebas unitarias de seguridad multi-tenant `server/routes/security.multitenant.test.js`.
- **Estado:** Completado exitosamente. 0 regresiones.
