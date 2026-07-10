# Reporte de Auditoría de Base de Datos y Arquitectura (Red Teaming)

*Fuente de verdad: `AUDIT_REPORT_S1.md`*

## 1. Contexto de la Auditoría

El repositorio contiene un informe de auditoría técnica (`AUDIT_REPORT_S1.md`) fechado el 2026-07-03 que revela el estado profundo de la infraestructura de persistencia y seguridad de la plataforma. Como parte del ejercicio de Red Teaming y análisis de vulnerabilidades arquitectónicas, se extraen los siguientes hallazgos críticos.

## 2. Hallazgos Críticos de Seguridad e Integridad

### 2.1. Vulnerabilidades en Políticas RLS
Se han detectado políticas de seguridad a nivel de fila (RLS) en los módulos (ej. `clinico.*`) que **solo validan la pertenencia al tenant** mediante la instrucción `FOR ALL USING (tenant_id = fn_current_tenant_id())`.
*   **Vector de Riesgo:** Cualquier usuario autenticado dentro del tenant puede escribir o leer datos de otros módulos si no se exige un chequeo de permisos funcional (e.g., `fn_has_permission('clinico...')`).
*   **Impacto:** Riesgo extremo para los datos médicos (fichas sensibles) debido a la ausencia de granularidad en la autorización.

### 2.2. Riesgo de Secuestro de Contexto (Tenant Hijacking)
La función `fn_complete_access_onboarding` permite reasignar el `tenant_id` de un usuario (`profiles.tenant_id`) a través de un *upsert* cuando se consume un enlace de invitación (`access_links`).
*   **Vector de Riesgo:** Si un enlace de acceso (link ACE) se filtra o intercepta, el actor malicioso podría forzar la migración de un usuario válido hacia un tenant distinto, capturando su contexto.

### 2.3. Contradicción Forense en la Auditoría
La tabla `auditoria.audit_log`, diseñada para inmutabilidad forense, posee una política `FOR ALL` que permite operaciones INSERT, UPDATE y DELETE a nivel de fila.
*   **Impacto:** Contradice el propósito de una bitácora forense inmutable. Un atacante con acceso a la BD podría borrar sus propios rastros si los privilegios GRANT no bloquean el DELETE.

## 3. Deuda Técnica y Riesgos Operativos

### 3.1. Imposibilidad de Despliegue Limpio (Falta de Baseline)
El sistema carece de un script de migración inicial (baseline) versionado que construya las tablas base (tenants, profiles).
*   **Impacto Operativo:** Un despliegue automatizado desde cero hacia un nuevo entorno fallaría inevitablemente, ya que las migraciones existentes en `supabase/migrations/` asumen la existencia de estructuras que no crean. El guardián de esquema (`schema_guard.sql`) fallará.

### 3.2. Bifurcación de Migraciones (Doble Trail)
Existen dos rutas concurrentes de migraciones:
1.  `supabase/migrations/`
2.  `ONG/supabase/migrations/`
*   **Impacto:** Rompe la linealidad de la evolución de la base de datos y aumenta la fricción para despliegues CI/CD centralizados.

### 3.3. Conflicto de Funciones y Triggers
*   **`fn_has_permission`**: El repositorio no incluye la firma completa `(text, uuid)`, a pesar de ser requerida por el motor ACE. Si la base de datos real solo posee la versión de 1 argumento `(text)`, las políticas de evaluación de permisos fallarán.
*   **Triggers de Auditoría Duplicados**: Existen dos versiones de triggers (`trg_user_roles_sedes_audit` vs `tr_audit_urs`) que podrían colisionar en la tabla de asignaciones IAM (`user_roles_sedes`).

## 4. Conclusión de la Auditoría

El núcleo multi-tenant posee cimientos sólidos gracias al uso de PostgreSQL RLS y el motor de Riesgo Express, pero arrastra vulnerabilidades críticas en la autorización cruzada de módulos (especialmente en el esquema `clinico`) y una deuda técnica paralizante respecto a la reproducibilidad del entorno de base de datos (ausencia de baseline). Las acciones correctivas deben enfocarse inmediatamente en la generación del *baseline dump* y la corrección de las políticas RLS.
