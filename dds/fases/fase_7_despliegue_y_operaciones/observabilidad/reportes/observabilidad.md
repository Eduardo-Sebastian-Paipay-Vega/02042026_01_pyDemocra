# Observabilidad, Telemetría y Hotfixes

*Fuente de verdad: `server/index.js`, `package.json`*

## 1. Observabilidad (Logs y Métricas)

*   **Frontend y Backend Node.js:** Se basa en las consolas integradas de Vercel. No hay librerías tipo Datadog, Sentry o New Relic integradas explícitamente en las dependencias (cero referencias a recolectores de telemetría en `package.json`).
*   **Base de Datos (Auditoría Ciega):** Democra prioriza la **auditoría transaccional de negocio** sobre la telemetría técnica. Todo cambio de datos se guarda en `auditoria.audit_log` gracias al trigger `fn_trigger_audit_universal()`. Sin embargo, esto no sirve para rastrear cuellos de botella de rendimiento de consultas (Slow Queries), lo cual se delega al dashboard propietario de Supabase (pg_stat_statements).

## 2. Estrategia de Hotfixes

Dado que no existe telemetría proactiva en el código (Sentry) ni un pipeline de CI con pruebas automáticas E2E:
1.  Los errores críticos deben ser reportados manualmente por los usuarios o detectados por fallas HTTP 500 en los logs de Vercel.
2.  La reparación de emergencias (Hotfix) requiere commitear a la rama `main` para que Vercel regenere los assets y reinicie las Serverless Functions.
