# Estrategia de Operaciones y GitOps
> **Fase 7 | Despliegue y Operaciones** | Fecha de análisis: 2026-07-09

---

## 1. Filosofía Operativa

Democra utiliza un modelo operativo basado 100% en tecnologías Serverless y BaaS (Backend-as-a-Service). Al delegar la provisión de infraestructura física a Vercel (Frontend/Express API) y Supabase (PostgreSQL, Storage, Edge Functions), el equipo de DevOps/SRE debe enfocarse exclusivamente en metodologías **GitOps** para controlar la infraestructura inmutable, las migraciones de base de datos y la gestión segura de variables de entorno.

## 2. Configuración y Control de Entornos (GitOps)

Se mantendrán tres entornos claramente separados, cada uno mapeado a una rama específica del repositorio:

| Entorno | Rama Git | Infraestructura Destino | Propósito |
|---------|----------|-------------------------|-----------|
| **Development** | `develop` | Proyecto Supabase `demo-dev` + Vercel Preview | Entorno inestable para QA de features, pruebas E2E automáticas, y validación de migraciones SQL locales. |
| **Staging** | `release/*` | Proyecto Supabase `demo-stg` + Vercel Preview | Entorno tipo espejo para Pruebas de Aceptación (UAT) y validaciones finales de rendimiento antes del pase a PRD. |
| **Production** | `main` | Proyecto Supabase `demo-prd` + Vercel Production | Entorno en vivo multi-tenant. Escalabilidad automática habilitada. Acceso restringido exclusivamente a Pipelines automatizados. |

## 3. Estrategia de Migraciones de Base de Datos

Las alteraciones del esquema de base de datos (`supabase/migrations/`) son el punto más crítico del sistema. Su aplicación debe ser estrictamente secuencial e inmutable.

- Toda migración debe nombrarse con prefijo de Timestamp (`YYYYMMDDHHMMSS_name.sql`).
- **Inmutabilidad:** Si una migración ha sido fusionada en `main` y ejecutada en producción, **jamás** debe ser editada ni borrada. Cualquier corrección requiere una nueva migración.
- **Rollbacks:** Se debe proveer, cuando el motor lo soporte, scripts o planes de rollback (`.down.sql`) explícitos en caso de fallas transaccionales críticas, especialmente en políticas RLS (Row Level Security).

## 4. Gestión de Secretos

La arquitectura confía en variables de entorno críticas y muy sensibles. El flujo GitOps prohíbe terminantemente almacenar tokens en texto plano en el repositorio.

- La API Express consume: `SUPABASE_SERVICE_ROLE_KEY` (Poder absoluto sobre RLS), `MFA_OTP_PEPPER` (Semilla criptográfica de seguridad), y API Keys externas (SUNAT, Resend).
- Estos secretos residen en los Secret Managers de las plataformas anfitrionas (Dashboard de Vercel y Vault de Supabase).
- Se recomienda rotación periódica (cada 90 días) para los Peppers criptográficos (soportando múltiples peppers temporalmente para no invalidar sesiones activas de golpe) y claves API de terceros.

## 5. Estrategia de Respaldo y Recuperación (Disaster Recovery)

Al utilizar Supabase/PostgreSQL en esquema multi-tenant, la corrupción de datos es catastrófica (Afecta a múltiples ONGs simultáneamente).

1. **Backups Automatizados (PITR):** Se exige la configuración Point-in-Time Recovery a nivel de Supabase, garantizando la capacidad de restaurar la BD a un minuto exacto antes de un evento de corrupción (Ej. una migración defectuosa que altera la tabla de roles).
2. **Aislamiento Logístico:** Las tablas del núcleo de auditoría (`audit_logs` y `sensitive_access_logs`) deberían replicarse asincrónicamente o exportarse mediante cron-jobs regulares a un "Cold Storage" externo (ej. AWS S3) inmutable, garantizando trazabilidad forense incluso si la BD principal es vulnerada a nivel administrativo.
